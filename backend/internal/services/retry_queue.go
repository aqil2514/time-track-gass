// backend/internal/services/retry_queue.go
package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/timetrack/backend/internal/models"
)

type RetryQueueService struct {
	db             *pgxpool.Pool
	aiService      *AIService
	activitySvc    *ActivityService
	maxRetries     int
}

func NewRetryQueueService(db *pgxpool.Pool, aiService *AIService, maxRetries int) *RetryQueueService {
	return &RetryQueueService{
		db:         db,
		aiService:  aiService,
		maxRetries: maxRetries,
	}
}

// SetActivityService sets the activity service (called during initialization)
func (s *RetryQueueService) SetActivityService(as *ActivityService) {
	s.activitySvc = as
}

// EnqueueScreenshotAnalysisForActivity adds a screenshot analysis task to the queue for an existing activity
func (s *RetryQueueService) EnqueueScreenshotAnalysisForActivity(ctx context.Context, activityID uuid.UUID, imageBase64 string) (uuid.UUID, error) {
	payload := models.TaskPayload{
		ActivityID:  &activityID,
		ImageBase64: &imageBase64,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	var taskID uuid.UUID
	err = s.db.QueryRow(ctx,
		`INSERT INTO retry_queue (task_type, payload, status, attempt, max_attempts, next_retry_at)
		 VALUES ($1, $2, 'pending', 0, $3, NOW())
		 RETURNING id`,
		models.TaskTypeScreenshotAnalysis, payloadBytes, s.maxRetries,
	).Scan(&taskID)

	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to enqueue task: %w", err)
	}

	fmt.Printf("[QUEUE] Enqueued screenshot analysis task %s for activity %s\n", taskID, activityID)
	return taskID, nil
}

// EnqueueScreenshotAnalysis adds a screenshot analysis task to the queue (legacy method for compatibility)
func (s *RetryQueueService) EnqueueScreenshotAnalysis(ctx context.Context, userID uuid.UUID, capturedAt time.Time, imageBase64 string) (uuid.UUID, error) {
	// This method is deprecated - use EnqueueScreenshotAnalysisForActivity instead
	return uuid.Nil, fmt.Errorf("use EnqueueScreenshotAnalysisForActivity instead")
}

// ClaimTask claims a pending task using SELECT FOR UPDATE SKIP LOCKED to prevent race conditions
func (s *RetryQueueService) ClaimTask(ctx context.Context) (*models.RetryTask, error) {
	// Start transaction for atomic claim
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Try to claim a task with SKIP LOCKED to avoid blocking
	var task models.RetryTask
	var payloadBytes []byte
	var errorMessagePtr *string

	err = tx.QueryRow(ctx,
		`SELECT id, task_type, payload, status, attempt, max_attempts, error_message, next_retry_at, created_at, updated_at
		 FROM retry_queue
		 WHERE status = 'pending' AND next_retry_at <= NOW()
		 ORDER BY next_retry_at ASC
		 LIMIT 1
		 FOR UPDATE SKIP LOCKED`,
	).Scan(&task.ID, &task.TaskType, &payloadBytes, &task.Status, &task.Attempt,
		&task.MaxAttempts, &errorMessagePtr, &task.NextRetryAt, &task.CreatedAt, &task.UpdatedAt)

	if err != nil {
		return nil, nil // No tasks available
	}

	if errorMessagePtr != nil {
		task.ErrorMessage = errorMessagePtr
	}

	// Unmarshal payload
	if err := json.Unmarshal(payloadBytes, &task.Payload); err != nil {
		return nil, fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	// Update status to processing
	_, err = tx.Exec(ctx,
		`UPDATE retry_queue SET status = 'processing', updated_at = NOW() WHERE id = $1`,
		task.ID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update task status: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	fmt.Printf("[QUEUE] Claimed task %s (type: %s, attempt: %d)\n", task.ID, task.TaskType, task.Attempt)
	return &task, nil
}

// CompleteTask marks a task as successfully completed
func (s *RetryQueueService) CompleteTask(ctx context.Context, taskID uuid.UUID) error {
	_, err := s.db.Exec(ctx,
		`UPDATE retry_queue SET status = 'success', updated_at = NOW() WHERE id = $1`,
		taskID,
	)
	if err != nil {
		return fmt.Errorf("failed to complete task: %w", err)
	}

	fmt.Printf("[QUEUE] Task %s completed successfully\n", taskID)
	return nil
}

// FailTask marks a task as failed and schedules next retry or moves to dead letter
func (s *RetryQueueService) FailTask(ctx context.Context, taskID uuid.UUID, errorMsg string, attempt int) error {
	// Get task to check max attempts
	var maxAttempts int
	err := s.db.QueryRow(ctx, `SELECT max_attempts FROM retry_queue WHERE id = $1`, taskID).Scan(&maxAttempts)
	if err != nil {
		return fmt.Errorf("failed to get task: %w", err)
	}

	// Check if should move to dead letter
	if attempt >= maxAttempts {
		_, err = s.db.Exec(ctx,
			`UPDATE retry_queue
			 SET status = 'dead', error_message = $2, updated_at = NOW()
			 WHERE id = $1`,
			taskID, errorMsg,
		)
		if err != nil {
			return fmt.Errorf("failed to mark task as dead: %w", err)
		}

		fmt.Printf("[QUEUE] Task %s moved to dead letter after %d attempts\n", taskID, attempt)

		// Also mark the associated activity as failed (if this is a screenshot analysis task)
		// This ensures activities don't stay in 'processing' state forever
		// Query the task payload to get the activity ID
		var payloadBytes []byte
		var taskType string
		queryErr := s.db.QueryRow(ctx,
			`SELECT task_type, payload FROM retry_queue WHERE id = $1`,
			taskID,
		).Scan(&taskType, &payloadBytes)

		if queryErr == nil && taskType == string(models.TaskTypeScreenshotAnalysis) {
			var payload models.TaskPayload
			if json.Unmarshal(payloadBytes, &payload) == nil && payload.ActivityID != nil {
				if s.activitySvc != nil {
					if markErr := s.activitySvc.MarkAIFailed(ctx, *payload.ActivityID); markErr != nil {
						fmt.Printf("[QUEUE] Warning: failed to mark activity %s as failed: %v\n", *payload.ActivityID, markErr)
					} else {
						fmt.Printf("[QUEUE] Marked activity %s as failed\n", *payload.ActivityID)
					}
				}
			}
		}

		return nil
	}

	// Calculate next retry time with exponential backoff
	nextRetryAt := time.Now().UTC().Add(models.ExponentialBackoff(attempt))

	// Schedule next retry with incremented attempt
	// Note: 'attempt' parameter is already the next attempt number (task.Attempt + 1)
	_, err = s.db.Exec(ctx,
		`UPDATE retry_queue
		 SET attempt = $2, status = 'pending', error_message = $3, next_retry_at = $4, updated_at = NOW()
		 WHERE id = $1`,
		taskID, attempt, errorMsg, nextRetryAt,
	)
	if err != nil {
		return fmt.Errorf("failed to schedule retry: %w", err)
	}

	fmt.Printf("[QUEUE] Task %s failed (attempt %d), next retry at %s\n", taskID, attempt, nextRetryAt)
	return nil
}

// ProcessTask processes a single task based on its type
func (s *RetryQueueService) ProcessTask(ctx context.Context, task *models.RetryTask) error {
	switch task.TaskType {
	case models.TaskTypeScreenshotAnalysis:
		return s.processScreenshotAnalysis(ctx, task)
	case models.TaskTypeSessionSummary:
		return s.processSessionSummary(ctx, task)
	case models.TaskTypeDailySummary:
		return s.processDailySummary(ctx, task)
	default:
		return fmt.Errorf("unknown task type: %s", task.TaskType)
	}
}

// processScreenshotAnalysis processes a screenshot analysis retry task
func (s *RetryQueueService) processScreenshotAnalysis(ctx context.Context, task *models.RetryTask) error {
	if task.Payload.ImageBase64 == nil {
		return fmt.Errorf("missing image_base64 in payload")
	}

	// Try AI analysis again
	analysis, err := s.aiService.AnalyzeScreenshotWithRetry(ctx, *task.Payload.ImageBase64)
	if err != nil {
		return fmt.Errorf("AI analysis failed: %w", err)
	}

	// Update activity with successful analysis
	if s.activitySvc != nil && task.Payload.ActivityID != nil {
		if err := s.activitySvc.UpdateAIAnalysis(ctx, *task.Payload.ActivityID, analysis); err != nil {
			return fmt.Errorf("failed to update activity: %w", err)
		}
		fmt.Printf("[QUEUE] Updated activity %s with AI analysis\n", *task.Payload.ActivityID)
	}

	return nil
}

// processSessionSummary processes a session summary task
func (s *RetryQueueService) processSessionSummary(ctx context.Context, task *models.RetryTask) error {
	// TODO: Implement session summary generation
	fmt.Printf("[QUEUE] Session summary generation not yet implemented for task %s\n", task.ID)
	return nil
}

// processDailySummary processes a daily summary task
func (s *RetryQueueService) processDailySummary(ctx context.Context, task *models.RetryTask) error {
	// TODO: Implement daily summary generation
	fmt.Printf("[QUEUE] Daily summary generation not yet implemented for task %s\n", task.ID)
	return nil
}

// GetQueueStats returns statistics about the retry queue
func (s *RetryQueueService) GetQueueStats(ctx context.Context) (*QueueStats, error) {
	stats := &QueueStats{}

	// Count tasks by status
	rows, err := s.db.Query(ctx,
		`SELECT status, COUNT(*) FROM retry_queue GROUP BY status`,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get queue stats: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			rows.Close()
			return nil, fmt.Errorf("failed to scan stat row: %w", err)
		}

		switch status {
		case "pending":
			stats.PendingTasks = count
		case "processing":
			stats.ProcessingTasks = count
		case "dead":
			stats.DeadLetterCount = count
		}
	}

	// Check for errors during iteration
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating queue stats: %w", err)
	}

	// Get oldest pending task time
	var oldestPending *time.Time
	err = s.db.QueryRow(ctx,
		`SELECT MIN(created_at) FROM retry_queue WHERE status = 'pending'`,
	).Scan(&oldestPending)
	if err == nil {
		stats.OldestPending = oldestPending
	}

	return stats, nil
}

// CleanupDeadLetters removes old dead letter tasks
func (s *RetryQueueService) CleanupDeadLetters(ctx context.Context) error {
	result, err := s.db.Exec(ctx, `SELECT cleanup_dead_letters()`)
	if err != nil {
		return fmt.Errorf("failed to cleanup dead letters: %w", err)
	}

	fmt.Printf("[QUEUE] Dead letter cleanup completed\n")
	rowsAffected := result.RowsAffected()
	if rowsAffected > 0 {
		fmt.Printf("[QUEUE] Cleaned up %d dead letter tasks\n", rowsAffected)
	}

	return nil
}

// RecoverStuckTasks resets tasks that have been in 'processing' status for too long
// This prevents tasks from being stuck if a worker crashes after claiming but before completing
func (s *RetryQueueService) RecoverStuckTasks(ctx context.Context, olderThan time.Duration) error {
	result, err := s.db.Exec(ctx,
		`UPDATE retry_queue
		 SET status = 'pending', updated_at = NOW()
		 WHERE status = 'processing'
		 AND updated_at < NOW() - $1`,
		olderThan,
	)
	if err != nil {
		return fmt.Errorf("failed to recover stuck tasks: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected > 0 {
		fmt.Printf("[QUEUE] Recovered %d stuck tasks\n", rowsAffected)
	}

	return nil
}

type QueueStats struct {
	PendingTasks    int        `json:"pending_tasks"`
	ProcessingTasks int        `json:"processing_tasks"`
	DeadLetterCount int        `json:"dead_letter_count"`
	OldestPending   *time.Time `json:"oldest_pending,omitempty"`
}
