# Context: Retry AI System with Dual-Model Strategy

## Tech Stack

### Backend
- **Framework**: Gin (Go web framework)
- **Database**: PostgreSQL with TimescaleDB extension
- **ORM**: pgx/v5 (pure PostgreSQL driver)
- **Config**: Environment variables via `godotenv`

### AI Provider
- **Primary**: Zhipu AI (Z.ai)
- **Vision Models**: GLM-4.6V (full), GLM-4.6V-FlashX (fast/cheap)
- **Text Models**: GLM-4.7 (full), GLM-4.7-FlashX (fast/cheap)
- **API Endpoint**: `https://api.z.ai/api/paas/v4/chat/completions` (FIXED from `/v1`)

### Database
- **Hypertables**: TimescaleDB for time-series activities
- **Compression**: Automated for older data
- **Retention**: 1 year automatic deletion
- **Continuous Aggregates**: `daily_summary` materialized view

## Current Implementation

### AI Service (`backend/internal/services/ai_service.go`)
```go
type AIService struct {
    apiKey  string
    baseURL string
    client  *http.Client  // 30s timeout
}

// CRITICAL: AnalyzeScreenshot NEVER returns error
// - Always returns (*ScreenshotAnalysis, nil)
// - On error, returns mock data (AppName="Unknown", WindowTitle="Unknown")
// - The error check in ActivityService.Upload line 25-28 is DEAD CODE
```

### Activity Service (`backend/internal/services/activity_service.go`)
```go
func (s *ActivityService) Upload(ctx context.Context, userID uuid.UUID, input *models.UploadActivityInput) {
    // BUG: Line 25-28 checks for error, but AI never returns error!
    analysis, err := s.aiService.AnalyzeScreenshot(ctx, input.Image)
    if err != nil {  // ← This is NEVER true!
        return nil, fmt.Errorf("failed to analyze screenshot: %w", err)
    }

    // Parse timestamp
    capturedAt := parseTimestamp(input.CapturedAt)

    // Insert to DB (no ai_analysis_status column yet)
    db.QueryRow(INSERT INTO activities ...)
}
```

### Database Schema (`backend/migrations/001_init.up.sql`)
```sql
CREATE TABLE activities (
    id UUID,
    user_id UUID,
    captured_at TIMESTAMPTZ,
    app_name VARCHAR(100),
    window_title VARCHAR(500),
    category VARCHAR(50),
    summary VARCHAR(500),
    created_at TIMESTAMPTZ,
    PRIMARY KEY (id, captured_at)
);
-- NOTE: No ai_analysis_status column yet (will be added in migration 003)
```

### Config (`backend/internal/config/config.go`)
```go
type Config struct {
    Port        string
    DatabaseURL string
    JWTSecret   string
    ZAIAPIKey   string
    ZAIBaseURL  string  // BUG: Default is "/v1" should be "/api/paas/v4/"
    // NOTE: getEnvInt already exists (line 34-40), don't need to add
}
```

## Key Issues Identified (Critical for Implementation)

### Issue 1: AI Never Returns Error
```go
// EXISTING: ai_service.go
func (s *AIService) AnalyzeScreenshot(...) (*ScreenshotAnalysis, error) {
    if s.apiKey == "" {
        return &ScreenshotAnalysis{AppName: "Unknown", ...}, nil  // No error!
    }
    // All error paths return mock data, never error
}
```

**Impact**: Retry logic must detect "mock" results, not errors.

**Solution**:
```go
func isMockResult(analysis *ScreenshotAnalysis) bool {
    return analysis.AppName == "Unknown" ||
           analysis.WindowTitle == "Unknown" ||
           strings.Contains(analysis.Summary, "AI analysis")
}
```

---

### Issue 2: Wrong Base URL
```go
// EXISTING: config.go line 23
ZAIBaseURL: getEnv("ZAI_BASE_URL", "https://api.z.ai/v1"),
// Should be: "https://api.z.ai/api/paas/v4/"
```

---

### Issue 3: Dead Code in ActivityService
```go
// EXISTING: activity_service.go line 25-28
analysis, err := s.aiService.AnalyzeScreenshot(ctx, input.Image)
if err != nil {  // ← Dead code, AI never returns error
    return nil, fmt.Errorf("failed to analyze screenshot: %w", err)
}
```

---

### Issue 4: Constructor Pattern
```go
// EXISTING: Simple constructor
func NewAIService(apiKey, baseURL string) *AIService

// PLAN: Add new constructor while keeping existing for compatibility
func NewAIServiceWithConfig(apiKey, baseURL, visionPrimary, visionFallback string, maxRetries int) *AIService
```

---

## Design Goals

### Phase 1: Foundation (Safe, Non-Breaking)
1. Add config fields for model selection
2. Add retry queue table (new, doesn't affect existing)
3. Add AI status columns to activities (nullable defaults)
4. Implement inline retry with mock detection (NOT error checking)
5. Update upload flow to queue mock results

### Phase 2: Background Processing
1. Retry queue worker with exponential backoff
2. Async activity updates
3. Metrics and monitoring

### Phase 3: Enhanced Features
1. Session grouping (algorithmic, no AI)
2. Session summaries (text model)
3. Daily summaries (text model)

## Retry Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                    RETRY ARCHITECTURE                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  INLINE RETRY (Upload Flow)                                  │
│    ├─ Try GLM-4.6V-FlashX (500ms)                           │
│    ├─ Try GLM-4.6V Full (1s) with backoff                   │
│    └─ Both return mock? → Queue for background retry         │
│                                                               │
│  BACKGROUND RETRY (Worker)                                   │
│    ├─ Check queue every 10s                                 │
│    ├─ Exponential backoff: 1min, 5min, 15min, 1h, 3h       │
│    ├─ Max 5 attempts → dead letter                           │
│    └─ Update activity on success                             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Model Selection Matrix

| Use Case | Primary Model | Fallback Model | Cost |
|----------|---------------|----------------|------|
| Screenshot Analysis | GLM-4.6V-FlashX | GLM-4.6V | ~$0.10 in / $0.30 out |
| Session Summary | GLM-4.7-FlashX | GLM-4.7 | $0.07 in / $0.40 out |
| Daily Summary | GLM-4.7 | GLM-4.7-FlashX | $0.60 in / $2.20 out |

## Code Patterns from Existing Codebase

### Error Handling Pattern (NEEDS FIXING)
```go
// Current: Always returns mock on error
if err != nil {
    return &ScreenshotAnalysis{AppName: "Unknown", ...}, nil
}

// New: Distinguish mock from real results
func isMockResult(analysis *ScreenshotAnalysis) bool {
    return analysis.AppName == "Unknown" || strings.Contains(analysis.Summary, "AI analysis")
}
```

### Database Query Pattern (KEEP)
```go
// Using pgx/v5 with QueryRow/Scan
err := db.QueryRow(ctx, query, args...).Scan(&dest...)
if err != nil {
    return fmt.Errorf("failed: %w", err)
}
```

### Service Initialization Pattern (KEEP)
```go
// cmd/api/main.go pattern
aiService := services.NewAIService(cfg.ZAIAPIKey, cfg.ZAIBaseURL)
activityService := services.NewActivityService(db, aiService)

// New: Add retry queue
retryQueue := services.NewRetryQueue(db, aiService, 3)
activityService.SetRetryQueue(retryQueue)
```

## API Response Format

### Z.ai Chat Completion
```json
{
  "choices": [{
    "message": {
      "content": "JSON string or text"
    }
  }]
}
```

### Request Format (Vision)
```json
{
  "model": "glm-4.6v-flashx",
  "messages": [{
    "role": "user",
    "content": [
      {"type": "text", "text": "prompt"},
      {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
    ]
  }]
}
```

## Environment Variables

```bash
# Existing (some need updates)
PORT=8080
DATABASE_URL=postgres://...
JWT_SECRET=...
ZAI_API_KEY=...
ZAI_BASE_URL=https://api.z.ai/api/paas/v4/  # FIX: was /v1

# New (to add)
ZAI_VISION_MODEL_PRIMARY=glm-4.6v-flashx
ZAI_VISION_MODEL_FALLBACK=glm-4.6v
ZAI_TEXT_MODEL_FAST=glm-4.7-flashx
ZAI_TEXT_MODEL_SMART=glm-4.7
ZAI_MAX_INLINE_RETRIES=2
ZAI_MAX_QUEUE_RETRIES=5
RETRY_QUEUE_WORKERS=3
RETRY_QUEUE_INTERVAL=10s
```

## Dependencies

### Already in Use
- `github.com/gin-gonic/gin`
- `github.com/jackc/pgx/v5`
- `github.com/joho/godotenv`
- `github.com/google/uuid`

### May Need to Add
- `github.com/cenkalti/backoff/v4` (exponential backoff) - optional
- `github.com/robfig/cron/v3` (for scheduled daily summaries) - optional

## Acceptance Criteria

### Phase 1
- [ ] Upload still works if AI fails (returns "Analyzing...")
- [ ] Activities queued for background retry
- [ ] No breaking changes to existing API
- [ ] Zero downtime
- [ ] Mock detection works correctly

### Phase 2
- [ ] Background worker processes queue
- [ ] Activities updated when retry succeeds
- [ ] Metrics endpoint shows queue status
- [ ] Dead letter queue for max retries

### Phase 3
- [ ] Sessions API returns grouped activities
- [ ] Session summaries generated with text model
- [ ] Daily summaries generated via scheduled job
