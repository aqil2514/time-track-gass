# Task 09: Implement Retry Handlers

## Meta
- **File**: `backend/internal/services/retry_handler.go`
- **Action**: create
- **Depends**: [08]
- **Priority**: P0
- **Phase**: 2

## Objective
Implement task-specific retry handlers for screenshots, session summaries, and daily summaries.

## Requirements
- Screenshot retry handler
- Session summary retry handler
- Daily summary retry handler

## Acceptance Criteria
- [ ] `retryScreenshot` method implemented
- [ ] `retrySessionSummary` method implemented
- [ ] `retryDailySummary` method implemented
- [ ] Proper error handling and logging

## Implementation Notes

```go
// backend/internal/services/retry_handler.go

package services

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/timetrack/backend/internal/models"
)

type RetryHandler struct {
	db               *pgxpool.Pool
	aiService        *AIService
	activityService  *ActivityService
}

func NewRetryHandler(db *pgxpool.Pool, aiService *AIService, activityService *ActivityService) *RetryHandler {
	return &RetryHandler{
		db:              db,
		aiService:       aiService,
		activityService: activityService,
	}
}

// retryScreenshot retries AI analysis for a screenshot
func (h *RetryHandler) retryScreenshot(ctx context.Context, task *models.RetryTask) error {
	var payload models.ScreenshotRetryPayload
	if err := json.Unmarshal(task.Payload, &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	// Check if activity still needs processing
	var status string
	err := h.db.QueryRow(ctx,
		"SELECT ai_analysis_status FROM activities WHERE id = $1", payload.ActivityID).Scan(&status)
	if err != nil {
		return fmt.Errorf("activity not found: %w", err)
	}

	if status == "success" {
		return nil // Already processed, skip
	}

	// Retry AI analysis
	analysis, err := h.aiService.AnalyzeScreenshotWithRetry(ctx, payload.ImageBase64)
	if err != nil {
		return fmt.Errorf("AI analysis failed: %w", err)
	}

	// Update activity
	if h.activityService != nil {
		if err := h.activityService.UpdateAIAnalysis(ctx, payload.ActivityID, analysis); err != nil {
			return fmt.Errorf("failed to update activity: %w", err)
		}
	} else {
		// Fallback: direct DB update
		_, err = h.db.Exec(ctx,
			`UPDATE activities
			 SET app_name = $1, window_title = $2, category = $3, summary = $4,
			     ai_analysis_status = 'success', ai_analysis_attempts = ai_analysis_attempts + 1
			 WHERE id = $5`,
			analysis.AppName, analysis.WindowTitle, analysis.Category, analysis.Summary, payload.ActivityID)
		if err != nil {
			return fmt.Errorf("failed to update activity: %w", err)
		}
	}

	fmt.Printf("Successfully processed screenshot retry for activity %s\n", payload.ActivityID)
	return nil
}

// retrySessionSummary retries session summary generation
func (h *RetryHandler) retrySessionSummary(ctx context.Context, task *models.RetryTask) error {
	var payload models.SessionSummaryRetryPayload
	if err := json.Unmarshal(task.Payload, &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	// TODO: Implement session summary generation
	// This will be implemented in Phase 3
	return fmt.Errorf("session summary not yet implemented")
}

// retryDailySummary retries daily summary generation
func (h *RetryHandler) retryDailySummary(ctx context.Context, task *models.RetryTask) error {
	var payload models.DailySummaryRetryPayload
	if err := json.Unmarshal(task.Payload, &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	// TODO: Implement daily summary generation
	// This will be implemented in Phase 3
	return fmt.Errorf("daily summary not yet implemented")
}
```

## Integration with RetryQueue

The RetryHandler methods will be called from the RetryQueue service:

```go
// In retry_queue.go, update processTask to use handler

func (q *RetryQueue) SetHandler(handler *RetryHandler) {
	q.handler = handler
}

func (q *RetryQueue) processTask(ctx context.Context, task *models.RetryTask) error {
	var err error

	if q.handler != nil {
		switch task.Type {
		case models.RetryTaskScreenshot:
			err = q.handler.retryScreenshot(ctx, task)
		case models.RetryTaskSessionSummary:
			err = q.handler.retrySessionSummary(ctx, task)
		case models.RetryTaskDailySummary:
			err = q.handler.retryDailySummary(ctx, task)
		}
	}

	// ... rest of status update logic
}
```
