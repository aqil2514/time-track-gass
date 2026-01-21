# Task 06: Update Upload Flow with Queue Support

## Meta
- **File**: `backend/internal/services/activity_service.go`
- **Action**: modify
- **Depends**: [05, 03]
- **Priority**: P0
- **Phase**: 1

## Objective
Update activity upload to handle AI mock results by queuing for background retry instead of returning failed data to user.

## CRITICAL: Mock Detection Not Error Checking

**Existing Code Issue (line 25-28)**:
```go
analysis, err := s.aiService.AnalyzeScreenshot(ctx, input.Image)
if err != nil {  // ← This is ALWAYS nil! AI never returns error.
    return nil, fmt.Errorf("failed to analyze screenshot: %w", err)
}
```

**Solution**: Check for mock result instead of error:
```go
analysis, _ := s.aiService.AnalyzeScreenshotWithRetry(ctx, input.Image)
if isMockResult(analysis) {
    // Queue for retry
}
```

## Requirements
- Use new `AnalyzeScreenshotWithRetry` method
- Detect mock results (not errors) to trigger queuing
- On mock result, insert activity with "queued" status
- Queue retry task for background processing
- Return activity immediately to user (fast response)
- Add `retryQueue` field to ActivityService struct

## Acceptance Criteria
- [ ] Uses `AnalyzeScreenshotWithRetry` instead of `AnalyzeScreenshot`
- [ ] Detects mock results using `isMockResult` helper
- [ ] On mock result, inserts with status "queued"
- [ ] Queues retry task to retry_queue
- [ ] Returns activity immediately (non-blocking)
- [ ] Existing activities still work (status defaults to "success")

## Implementation Notes

```go
// backend/internal/services/activity_service.go

package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/timetrack/backend/internal/models"
)

type ActivityService struct {
	db         *pgxpool.Pool
	aiService  *AIService
	retryQueue *RetryQueue // NEW field
}

func NewActivityService(db *pgxpool.Pool, aiService *AIService) *ActivityService {
	return &ActivityService{db: db, aiService: aiService}
}

// NEW: Set retry queue (called during initialization)
func (s *ActivityService) SetRetryQueue(rq *RetryQueue) {
	s.retryQueue = rq
}

// isMockResult checks if AI returned mock/fallback data
// (Duplicate from ai_service.go - can also import from there)
func isMockResult(analysis *ScreenshotAnalysis) bool {
	if analysis == nil {
		return true
	}
	return analysis.AppName == "Unknown" ||
		analysis.WindowTitle == "Unknown" ||
		strings.Contains(analysis.Summary, "AI analysis") ||
		strings.Contains(analysis.Summary, "not configured")
}

func (s *ActivityService) Upload(ctx context.Context, userID uuid.UUID, input *models.UploadActivityInput) (*models.Activity, error) {
	// Parse captured_at time (keep existing logic)
	var capturedAt time.Time
	if input.CapturedAt != nil && *input.CapturedAt != "" {
		formats := []string{
			time.RFC3339,
			time.RFC3339Nano,
			"2006-01-02T15:04:05Z",
			"2006-01-02T15:04:05.999Z",
			"2006-01-02T15:04:05-07:00",
			"2006-01-02T15:04:05.999-07:00",
		}
		for _, format := range formats {
			var err error
			capturedAt, err = time.Parse(format, *input.CapturedAt)
			if err == nil {
				break
			}
		}
		if capturedAt.IsZero() {
			fmt.Printf("Failed to parse captured_at %q, using current time\n", *input.CapturedAt)
			capturedAt = time.Now()
		}
	} else {
		capturedAt = time.Now()
	}

	// CHANGED: Use AnalyzeScreenshotWithRetry
	analysis, _ := s.aiService.AnalyzeScreenshotWithRetry(ctx, input.Image)

	// CHANGED: Check for mock result instead of error
	if isMockResult(analysis) {
		// AI returned mock, queue for retry
		fmt.Printf("AI analysis returned mock result, queuing for retry\n")

		// Insert with "queued" status
		activity := &models.Activity{
			UserID:      userID,
			CapturedAt:  capturedAt,
			AppName:     "Analyzing...",
			WindowTitle: "Analyzing...",
			Category:    "other",
			Summary:     "AI analysis queued, will update shortly",
		}

		err := s.db.QueryRow(ctx,
			`INSERT INTO activities (user_id, captured_at, app_name, window_title, category, summary, ai_analysis_status)
			 VALUES ($1, $2, $3, $4, $5, $6, 'queued')
			 RETURNING id, user_id, captured_at, app_name, window_title, category, summary, created_at`,
			activity.UserID, activity.CapturedAt, activity.AppName, activity.WindowTitle,
			activity.Category, activity.Summary).
			Scan(&activity.ID, &activity.UserID, &activity.CapturedAt, &activity.AppName,
				&activity.WindowTitle, &activity.Category, &activity.Summary, &activity.CreatedAt)

		if err != nil {
			return nil, fmt.Errorf("failed to insert activity: %w", err)
		}

		// Queue for background retry
		if s.retryQueue != nil {
			payload, _ := json.Marshal(map[string]interface{}{
				"activity_id":  activity.ID.String(),
				"image_base64": input.Image,
			})

			task := &models.RetryTask{
				ID:           uuid.New(),
				Type:         models.RetryTaskScreenshot,
				Payload:      payload,
				Attempt:      0,
				MaxAttempts:  5,
				NextRetryAt:  time.Now().Add(1 * time.Minute),
				Status:       models.RetryStatusPending,
			}

			if err := s.retryQueue.Enqueue(ctx, task); err != nil {
				fmt.Printf("Failed to queue retry task: %v\n", err)
				// Don't fail the request, just log
			} else {
				fmt.Printf("Queued retry task %s for activity %s\n", task.ID, activity.ID)
			}
		} else {
			fmt.Printf("Retry queue not configured, activity will stay in 'queued' status\n")
		}

		return activity, nil // Return queued activity immediately
	}

	// AI success, insert with complete data
	activity := &models.Activity{}
	err := s.db.QueryRow(ctx,
		`INSERT INTO activities (user_id, captured_at, app_name, window_title, category, summary, ai_analysis_status)
		 VALUES ($1, $2, $3, $4, $5, $6, 'success')
		 RETURNING id, user_id, captured_at, app_name, window_title, category, summary, created_at`,
		userID, capturedAt, analysis.AppName, analysis.WindowTitle, analysis.Category, analysis.Summary).
		Scan(&activity.ID, &activity.UserID, &activity.CapturedAt, &activity.AppName,
			&activity.WindowTitle, &activity.Category, &activity.Summary, &activity.CreatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to insert activity: %w", err)
	}

	return activity, nil
}

// UpdateAIAnalysis updates an activity's AI analysis (called by retry worker)
func (s *ActivityService) UpdateAIAnalysis(ctx context.Context, activityID uuid.UUID, analysis *ScreenshotAnalysis) error {
	_, err := s.db.Exec(ctx,
		`UPDATE activities
		 SET app_name = $1, window_title = $2, category = $3, summary = $4,
		     ai_analysis_status = 'success', ai_analysis_attempts = ai_analysis_attempts + 1
		 WHERE id = $5`,
		analysis.AppName, analysis.WindowTitle, analysis.Category, analysis.Summary, activityID)

	return err
}

// MarkAIAnalysisFailed marks an activity as permanently failed
func (s *ActivityService) MarkAIAnalysisFailed(ctx context.Context, activityID uuid.UUID, errMsg string) error {
	_, err := s.db.Exec(ctx,
		`UPDATE activities
		 SET app_name = 'Unknown', window_title = 'Unknown', category = 'other',
		     summary = 'AI analysis failed after multiple retries',
		     ai_analysis_status = 'failed', ai_analysis_last_error = $1
		 WHERE id = $2`,
		errMsg, activityID)

	return err
}

// Keep existing List and GetStats methods unchanged
```

## Import Changes

Add to imports:
```go
import (
    "encoding/json"  // Add
    "strings"        // Add
    // ... existing imports
)
```

## Flow Summary

```
Upload Request
    ↓
Parse captured_at time
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Try AI with inline retry (AnalyzeScreenshotWithRetry)       │
│   ├─ Try GLM-4.6V-FlashX                                    │
│   ├─ Try GLM-4.6V (with backoff)                            │
│   └─ Both return mock? → Queue for retry                    │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Check result with isMockResult()                            │
│   ├─ NOT mock → Insert with status='success' → Return       │
│   └─ IS mock → Continue to queue logic                      │
└─────────────────────────────────────────────────────────────┘
    ↓
Insert with status='queued'
    ↓
Queue background retry task
    ↓
Return activity immediately (fast response)
    ↓
Background worker retries later
```

## Key Changes from Existing Code

| Line | Old Code | New Code |
|------|----------|----------|
| 14-17 | `struct { db, aiService }` | Added `retryQueue *RetryQueue` field |
| 25-28 | Check `if err != nil` (dead code) | Check `if isMockResult(analysis)` |
| 25 | `AnalyzeScreenshot()` | `AnalyzeScreenshotWithRetry()` |
| 60 | INSERT without status | INSERT with `ai_analysis_status` |
| NEW | - | Queue retry task on mock result |
| NEW | - | `UpdateAIAnalysis()` method |
| NEW | - | `MarkAIAnalysisFailed()` method |
| NEW | - | `SetRetryQueue()` setter |
