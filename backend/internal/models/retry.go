// backend/internal/models/retry.go
package models

import (
	"time"

	"github.com/google/uuid"
)

// TaskType defines the type of retry task
type TaskType string

const (
	TaskTypeScreenshotAnalysis TaskType = "screenshot_analysis"
	TaskTypeSessionSummary     TaskType = "session_summary"
	TaskTypeDailySummary       TaskType = "daily_summary"
)

// TaskStatus defines the status of a retry task
type TaskStatus string

const (
	TaskStatusPending    TaskStatus = "pending"
	TaskStatusProcessing TaskStatus = "processing"
	TaskStatusSuccess    TaskStatus = "success"
	TaskStatusDead       TaskStatus = "dead"
)

// AIStatus defines the AI analysis status for activities
type AIStatus string

const (
	AIStatusSuccess    AIStatus = "success"
	AIStatusQueued     AIStatus = "queued"
	AIStatusFailed     AIStatus = "failed"
	AIStatusProcessing AIStatus = "processing"
)

// RetryTask represents a task in the retry queue
type RetryTask struct {
	ID           uuid.UUID  `json:"id"`
	TaskType     TaskType   `json:"task_type"`
	Payload      TaskPayload `json:"payload"`
	Status       TaskStatus `json:"status"`
	Attempt      int        `json:"attempt"`
	MaxAttempts  int        `json:"max_attempts"`
	ErrorMessage *string    `json:"error_message,omitempty"`
	NextRetryAt  time.Time  `json:"next_retry_at"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// TaskPayload contains the data needed for each task type
type TaskPayload struct {
	// For ScreenshotAnalysis
	ActivityID  *uuid.UUID `json:"activity_id,omitempty"`
	ImageBase64 *string    `json:"image_base64,omitempty"`

	// For SessionSummary and DailySummary
	UserID        *uuid.UUID  `json:"user_id,omitempty"`
	SessionDate   *time.Time  `json:"session_date,omitempty"`
	ActivityCount *int        `json:"activity_count,omitempty"`
	Date          *time.Time  `json:"date,omitempty"`
}

// ExponentialBackoff calculates the next retry delay based on attempt number
// Uses: base_delay * (2 ^ attempt) with jitter
func ExponentialBackoff(attempt int) time.Duration {
	baseDelay := 10 * time.Second
	maxDelay := 1 * time.Hour

	// Prevent integer overflow - cap at reasonable max attempt
	// For attempt > 30, 1<<uint(attempt) would overflow
	if attempt > 30 {
		attempt = 30
	}

	// Calculate exponential backoff
	delay := baseDelay * time.Duration(1<<uint(attempt))

	// Cap at max delay
	if delay > maxDelay {
		delay = maxDelay
	}

	// Add jitter (±20%)
	jitter := time.Duration(float64(delay) * 0.2 * (2.0*float64(attempt%2) - 1.0))

	return delay + jitter
}
