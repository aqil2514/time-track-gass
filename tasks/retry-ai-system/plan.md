# Feature: Retry AI System with Dual-Model Strategy

## Overview

Implement a robust retry mechanism for AI-powered screenshot analysis with:
- **Inline retry** with model cascade (FlashX → Full model)
- **Background queue** for failed requests with exponential backoff
- **Dual-model strategy**: Vision models for screenshots, Text models for summaries
- **Session grouping** for better activity organization
- **Lazy summary generation** for sessions and daily reports

### Business Value

1. **Resilience**: AI failures don't block user uploads
2. **Cost Optimization**: Use cheaper FlashX models first, fall back to full models
3. **Better Insights**: Session and daily summaries provide meaningful progress reports
4. **Scalability**: Background processing doesn't affect upload latency

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           UPLOAD FLOW                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Desktop Client                                                          │
│      ↓                                                                   │
│  POST /api/v1/activity/upload                                           │
│      ↓                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ INLINE RETRY (Fast Path)                                        │    │
│  │   ├─ Try GLM-4.6V-FlashX (500ms timeout)                       │    │
│  │   ├─ Try GLM-4.6V Full (1s timeout)                            │    │
│  │   └─ All fail? → Queue for retry                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│      ↓                                                                   │
│  Insert activity (status='queued' or 'success')                         │
│      ↓                                                                   │
│  Return immediately (fast response)                                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKGROUND RETRY                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Worker Pool (3 workers)                                                 │
│      ↓                                                                   │
│  Fetch pending tasks (every 10s)                                        │
│      ↓                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ PROCESS TASK                                                    │    │
│  │   ├─ Screenshot: Retry AI analysis                             │    │
│  │   ├─ Session Summary: Generate with GLM-4.7-FlashX            │    │
│  │   └─ Daily Summary: Generate with GLM-4.7                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│      ↓                                                                   │
│  Update activity/session in DB                                           │
│      ↓                                                                   │
│  Mark task success OR schedule next retry (exp backoff)                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Files

| Seq | File | Action | Phase | Status | Depends | Priority |
|-----|------|--------|-------|--------|---------|----------|
| 01 | `backend/internal/config/config.go` | modify | 1 | pending | - | P0 |
| 02 | `backend/migrations/002_add_retry_queue.up.sql` | create | 1 | pending | - | P0 |
| 03 | `backend/migrations/003_add_ai_status_to_activities.up.sql` | create | 1 | pending | - | P0 |
| 04 | `backend/internal/models/retry.go` | create | 1 | pending | 02 | P0 |
| 05 | `backend/internal/services/ai_service.go` | modify | 1 | pending | 01 | P0 |
| 06 | `backend/internal/services/activity_service.go` | modify | 1 | pending | 05,03 | P0 |
| 07 | `backend/migrations/002_add_retry_queue.down.sql` | create | 1 | pending | 02 | P1 |
| 08 | `backend/internal/services/retry_queue.go` | create | 2 | pending | 04 | P0 |
| 09 | `backend/internal/services/retry_handler.go` | create | 2 | pending | 08 | P0 |
| 10 | `backend/cmd/api/main.go` | modify | 2 | pending | 08 | P0 |
| 11 | `backend/internal/handlers/health_handler.go` | create | 2 | pending | 08 | P1 |
| 12 | `backend/migrations/004_add_work_sessions.up.sql` | create | 3 | pending | - | P1 |
| 13 | `backend/internal/models/work_session.go` | create | 3 | pending | 12 | P1 |
| 14 | `backend/internal/services/work_session_service.go` | create | 3 | pending | 13 | P1 |
| 15 | `backend/internal/handlers/work_session_handler.go` | create | 3 | pending | 14 | P1 |
| 16 | `backend/internal/services/daily_summary.go` | create | 3 | pending | 05 | P2 |

---

## Parallel Groups

### Group 1 (Phase 1: Foundation) - Can run in parallel
- **Task 01**: Config updates
- **Task 02**: Retry queue migration
- **Task 03**: AI status migration

### Group 2 (After Group 1) - Sequential dependencies
- **Task 04**: Models (depends on 02)
- **Task 05**: AI service retry (depends on 01)
- **Task 06**: Activity service update (depends on 05, 03)
- **Task 07**: Rollback migration (depends on 02)

### Group 3 (Phase 2: Background Processing)
- **Task 08**: Retry queue service (depends on 04)
- **Task 09**: Retry handlers (depends on 08)
- **Task 10**: Main workers (depends on 08)
- **Task 11**: Health endpoint (depends on 08)

### Group 4 (Phase 3: Enhanced Features) - Can run in parallel
- **Task 12**: Work sessions migration (renamed to avoid conflict with auth sessions)
- **Task 13**: Work session models (depends on 12)
- **Task 14**: Work session service (depends on 13)
- **Task 15**: Work session handler (depends on 14)
- **Task 16**: Daily summary (depends on 05)

---

## Hybrid Tiered Approach: Model Selection

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MODEL SELECTION MATRIX                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  VISION MODELS (Screenshot Analysis)                                    │
│  ├─ Primary:   GLM-4.6V-FlashX   ($0.10 in / $0.30 out per 1M tokens)  │
│  └─ Fallback:  GLM-4.6V          ($0.30 in / $0.90 out per 1M tokens)  │
│                                                                          │
│  TEXT MODELS (Summaries)                                                │
│  ├─ Fast:      GLM-4.7-FlashX    ($0.07 in / $0.40 out)                │
│  └─ Smart:     GLM-4.7           ($0.60 in / $2.20 out)                │
│                                                                          │
│  USAGE STRATEGY                                                          │
│  ├─ Screenshot upload:    GLM-4.6V-FlashX → GLM-4.6V                   │
│  ├─ Session summary:      GLM-4.7-FlashX                               │
│  └─ Daily summary:        GLM-4.7 (full model for deep reasoning)      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Best Practices & Edge Case Handling

### 1. Atomic Task Claiming (Prevent Race Condition)

Multiple workers fetching tasks simultaneously can cause duplicate processing. Use PostgreSQL's `SELECT FOR UPDATE SKIP LOCKED`:

```sql
-- In retry_queue.go: ClaimTask()
SELECT id, task_type, payload, attempt, next_retry_at
FROM retry_queue
WHERE status = 'pending' AND next_retry_at <= NOW()
ORDER BY next_retry_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

**Key Points:**
- `FOR UPDATE` locks the row
- `SKIP LOCKED` allows other workers to skip locked rows (no waiting)
- Each worker gets a unique task

### 2. Timezone Handling (UTC Standardization)

All timestamps should be stored and processed in UTC to avoid session grouping issues across timezones:

```go
// activity_service.go: Always use UTC
capturedAt := time.Now().UTC()

// Session grouping: truncate to day in UTC
dayStart := capturedAt.Truncate(24 * time.Hour)

// work_session_service.go: Group by UTC day
func groupIntoSessions(activities []*models.Activity) {
    // Use captured_at which is stored as TIMESTAMPTZ (UTC in DB)
}
```

**Migration Note:** Existing `captured_at` is already `TIMESTAMPTZ` which stores in UTC.

### 3. Dead Letter Queue Cleanup

Add cleanup job to prevent unbounded growth of failed tasks:

```sql
-- In migration: 002_add_retry_queue.up.sql
-- Add cleanup policy (30 days retention for dead letters)
CREATE OR REPLACE FUNCTION cleanup_dead_letters()
RETURNS void AS $$
BEGIN
    DELETE FROM retry_queue 
    WHERE status = 'dead' 
    AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Optional: Schedule with pg_cron if available
-- SELECT cron.schedule('cleanup-dead-letters', '0 2 * * *', 'SELECT cleanup_dead_letters()');
```

**Alternative:** Run cleanup in Go worker:
```go
// Every hour, clean up old dead letters
func (w *Worker) cleanupDeadLetters(ctx context.Context) {
    w.db.Exec(ctx, `DELETE FROM retry_queue WHERE status = 'dead' AND updated_at < NOW() - INTERVAL '30 days'`)
}
```

### 4. HTTP Client Timeouts

Add explicit timeouts to prevent hanging AI requests:

```go
// ai_service.go
func NewAIService(apiKey, baseURL string) *AIService {
    return &AIService{
        apiKey:  apiKey,
        baseURL: baseURL,
        client: &http.Client{
            Timeout: 30 * time.Second, // Overall timeout
            Transport: &http.Transport{
                DialContext: (&net.Dialer{
                    Timeout:   5 * time.Second,  // Connection timeout
                    KeepAlive: 30 * time.Second,
                }).DialContext,
                ResponseHeaderTimeout: 10 * time.Second,
                IdleConnTimeout:       90 * time.Second,
            },
        },
    }
}

// Per-request timeout with context
func (s *AIService) AnalyzeScreenshot(ctx context.Context, image string) (*Analysis, error) {
    ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
    defer cancel()
    // ... use ctx in http.NewRequestWithContext
}
```

### 5. Graceful Worker Shutdown

Workers must stop cleanly on SIGTERM/SIGINT:

```go
// main.go
func main() {
    ctx, cancel := context.WithCancel(context.Background())
    
    // Start workers
    workerPool := services.NewWorkerPool(db, cfg.RetryQueueWorkers)
    workerPool.Start(ctx)
    
    // Wait for shutdown signal
    sigCh := make(chan os.Signal, 1)
    signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
    <-sigCh
    
    log.Println("Shutting down gracefully...")
    cancel() // Signal workers to stop
    
    // Wait for workers with timeout
    shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer shutdownCancel()
    workerPool.Shutdown(shutdownCtx)
    
    log.Println("Shutdown complete")
}
```

### 6. Observability & Logging

Structured logging for queue monitoring:

```go
// retry_queue.go
log.Printf("[QUEUE] task_id=%s type=%s attempt=%d status=%s duration_ms=%d", 
    task.ID, task.Type, task.Attempt, status, duration.Milliseconds())

// Health endpoint: GET /health/detailed
type QueueHealth struct {
    PendingTasks   int `json:"pending_tasks"`
    ProcessingTasks int `json:"processing_tasks"`
    DeadLetterCount int `json:"dead_letter_count"`
    WorkersActive   int `json:"workers_active"`
    OldestPending   *time.Time `json:"oldest_pending,omitempty"`
}
```

### 7. Backpressure Handling

Prevent queue overload with max queue size:

```go
// activity_service.go: Upload()
const maxQueueSize = 1000

func (s *ActivityService) Upload(ctx context.Context, ...) (*Activity, error) {
    // Check queue size before adding
    var queueSize int
    s.db.QueryRow(ctx, "SELECT COUNT(*) FROM retry_queue WHERE status = 'pending'").Scan(&queueSize)
    
    if queueSize >= maxQueueSize {
        // Option 1: Reject with 503 Service Unavailable
        return nil, ErrQueueFull
        
        // Option 2: Process synchronously (slower but guaranteed)
        // return s.processSync(ctx, input)
    }
    
    // Normal queueing...
}
```

**Recommendation:** Use Option 2 (fallback to sync) for better UX - user upload always succeeds.

---

## Testing Strategy

### Unit Tests
- Session grouping algorithm
- Exponential backoff calculation
- Retry decision logic

### Integration Tests
- Upload → Queue → Retry flow
- Session summary generation
- Daily summary generation

### Chaos Tests
- AI API timeout
- Invalid AI response
- Database connection loss

### Load Tests
- 100 concurrent uploads
- Queue backlog processing
- Memory usage under load

---

## Rollback Plan

### Phase 1 Rollback
```bash
# Disable new features
ENABLE_SESSIONS=false
ENABLE_RETRY=false

# Run down migrations
migrate down 003_add_ai_status_to_activities
migrate down 002_add_retry_queue

# Old code path still works (activities insert directly)
```

### Phase 2 Rollback
```bash
# Stop workers
RETRY_QUEUE_WORKERS=0

# Existing queued tasks remain but won't be processed
# Can re-enable later by increasing worker count
```

### Phase 3 Rollback
```bash
# Drop sessions table
migrate down 004_add_sessions

# Sessions endpoint returns 404
# Activities still work normally
```

---

## Cost Estimate (100 screenshots/day)

| Operation | Model | Daily Tokens | Daily Cost | Monthly Cost |
|-----------|-------|--------------|------------|--------------|
| Screenshot (FlashX success) | GLM-4.6V-FlashX | ~40K | ~$0.015 | ~$0.45 |
| Screenshot retries | GLM-4.6V | ~10K | ~$0.01 | ~$0.30 |
| Session summaries (10) | GLM-4.7-FlashX | ~10K | ~$0.002 | ~$0.06 |
| Daily summary (1) | GLM-4.7 | ~20K | ~$0.05 | ~$1.50 |
| **Total** | | ~80K | **~$0.08** | **~$2.31** |

**With GLM Coding Plan ($3/month):** ✅ Fully covered with headroom

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Upload latency (AI success) | <2s | Inline retry with FlashX |
| Upload latency (AI fail) | <500ms | Queued, returns immediately |
| Queue processing delay | <1min | Workers run every 10s |
| Session summary generation | <5s | On-demand, text model |
| Daily summary generation | <30s | Scheduled job, GLM-4.7 |

---

## Dependencies

### Required Go Packages (Existing)
- `github.com/gin-gonic/gin`
- `github.com/jackc/pgx/v5`
- `github.com/joho/godotenv`
- `github.com/google/uuid`

### May Need to Add
- `github.com/cenkalti/backoff/v4` (exponential backoff)
- `github.com/robfig/cron/v3` (scheduled jobs)

---

## Environment Variables

```bash
# Existing
PORT=8080
DATABASE_URL=postgres://...
JWT_SECRET=...
ZAI_API_KEY=...

# Updated/Added
ZAI_BASE_URL=https://api.z.ai/api/paas/v4/
ZAI_VISION_MODEL_PRIMARY=glm-4.6v-flashx
ZAI_VISION_MODEL_FALLBACK=glm-4.6v
ZAI_TEXT_MODEL_FAST=glm-4.7-flashx
ZAI_TEXT_MODEL_SMART=glm-4.7
ZAI_MAX_INLINE_RETRIES=2
ZAI_MAX_QUEUE_RETRIES=5
RETRY_QUEUE_WORKERS=3
RETRY_QUEUE_INTERVAL=10s
ENABLE_SESSIONS=true
ENABLE_DAILY_SUMMARY=true
```

---

## Migration Execution Order

```bash
# 1. Run migrations
migrate up

# 2. Deploy new code
git pull
go build ./cmd/api
./api

# 3. Verify health
curl http://localhost:8080/health/detailed

# 4. Monitor logs
tail -f backend_logs.txt | grep -E "(retry|queue|worker)"

# 5. Check queue status
curl http://localhost:8080/api/v1/debug/queue
```

---

## Success Metrics

### Phase 1
- ✅ Upload latency <2s for successful AI
- ✅ Upload latency <500ms for AI failures (queued)
- ✅ 0% upload failures due to AI issues

### Phase 2
- ✅ 95%+ of queued tasks succeed within 1 hour
- ✅ Queue size <100 tasks during normal operation
- ✅ Dead letter queue <5% of total tasks

### Phase 3
- ✅ Session grouping accuracy >90%
- ✅ Summary generation time <5s (sessions), <30s (daily)
- ✅ User engagement +20% (better insights)
