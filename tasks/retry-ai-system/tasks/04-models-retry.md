# Task 04: Define Retry Queue Models

## Meta
- **File**: `backend/internal/models/retry.go`
- **Action**: create
- **Depends**: [02]
- **Priority**: P0
- **Phase**: 1

## Objective
Define Go structs for retry queue operations.

## Requirements
- Define RetryTask model matching DB schema
- Define RetryStats for monitoring
- Proper JSON tags for payload handling

## Acceptance Criteria
- [ ] `RetryTask` struct defined
- [ ] `RetryTaskType` enum/constants defined
- [ ] `RetryStatus` enum/constants defined
- [ ] `RetryStats` struct defined
- [ ] All fields properly tagged

## Implementation Notes

```go
// backend/internal/models/retry.go

package models

import (
	"time"

	"github.com/google/uuid"
)

// RetryTaskType defines the type of retry task
type RetryTaskType string

const (
	RetryTaskScreenshot      RetryTaskType = "screenshot"
	RetryTaskSessionSummary  RetryTaskType = "session_summary"
	RetryTaskDailySummary    RetryTaskType = "daily_summary"
)

// RetryStatus defines the status of a retry task
type RetryStatus string

const (
	RetryStatusPending RetryStatus = "pending"
	RetryStatusSuccess RetryStatus = "success"
	RetryStatusFailed  RetryStatus = "failed"
)

// RetryTask represents a task in the retry queue
type RetryTask struct {
	ID           uuid.UUID      `json:"id" db:"id"`
	Type         RetryTaskType  `json:"type" db:"type"`
	Payload      []byte         `json:"payload" db:"payload"`
	Attempt      int            `json:"attempt" db:"attempt"`
	MaxAttempts int            `json:"max_attempts" db:"max_attempts"`
	NextRetryAt  time.Time      `json:"next_retry_at" db:"next_retry_at"`
	LastError    string         `json:"last_error" db:"last_error"`
	Status       RetryStatus    `json:"status" db:"status"`
	CreatedAt    time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at" db:"updated_at"`
}

// RetryStats represents statistics about the retry queue
type RetryStats struct {
	TotalPending  int64   `json:"total_pending"`
	TotalSuccess  int64   `json:"total_success"`
	TotalFailed   int64   `json:"total_failed"`
	CurrentQueued int64   `json:"current_queued"`
	AvgRetryCount float64 `json:"avg_retry_count"`
}

// ScreenshotRetryPayload represents the payload for screenshot retry
type ScreenshotRetryPayload struct {
	ActivityID  uuid.UUID `json:"activity_id"`
	ImageBase64 string    `json:"image_base64"`
}

// SessionSummaryRetryPayload represents the payload for session summary retry
type SessionSummaryRetryPayload struct {
	SessionID  uuid.UUID            `json:"session_id"`
	Activities []ActivityForSummary `json:"activities"`
}

// ActivityForSummary is a simplified activity for summary generation
type ActivityForSummary struct {
	AppName     string `json:"app_name"`
	WindowTitle string `json:"window_title"`
	Category    string `json:"category"`
	Summary     string `json:"summary"`
	CapturedAt  time.Time `json:"captured_at"`
}

// DailySummaryRetryPayload represents the payload for daily summary retry
type DailySummaryRetryPayload struct {
	UserID uuid.UUID `json:"user_id"`
	Date   string    `json:"date"` // YYYY-MM-DD format
}

// Exponential backoff delays (in order of attempts)
var RetryBackoffDelays = []time.Duration{
	1 * time.Minute,
	5 * time.Minute,
	15 * time.Minute,
	1 * time.Hour,
	3 * time.Hour,
}

// GetNextRetryDelay returns the delay for a given attempt
func GetNextRetryDelay(attempt int) time.Duration {
	if attempt < 0 {
		return RetryBackoffDelays[0]
	}
	if attempt >= len(RetryBackoffDelays) {
		return RetryBackoffDelays[len(RetryBackoffDelays)-1]
	}
	return RetryBackoffDelays[attempt]
}
```
