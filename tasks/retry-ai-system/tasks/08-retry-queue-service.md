# Task 08: Implement Retry Queue Service

## Meta
- **File**: `backend/internal/services/retry_queue.go`
- **Action**: create
- **Depends**: [04]
- **Priority**: P0
- **Phase**: 2

## Objective
Implement retry queue service with background worker for processing failed tasks.

## Requirements
- Enqueue tasks to retry_queue table
- Fetch pending tasks for processing
- Start background workers
- Update task status (success/failed)
- Calculate next retry with exponential backoff

## Acceptance Criteria
- [ ] `RetryQueue` struct defined
- [ ] `Enqueue` method to add tasks
- [ ] `fetchPendingTasks` method to get tasks
- [ ] `processTask` method to handle task execution
- [ ] `markSuccess` method
- [ ] `markFailed` method
- [ ] `scheduleNextRetry` method with exponential backoff
- [ ] `Start` method to spawn workers
- [ ] `GetMetrics` method for monitoring

## Implementation Notes

```go
// backend/internal/services/retry_queue.go

package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/timetrack/backend/internal/models"
)

type RetryQueue struct {
	db          *pgxpool.Pool
	aiService   *AIService
	workerCount int
	interval    time.Duration
	ctx         context.Context
	cancel      context.CancelFunc
}

func NewRetryQueue(db *pgxpool.Pool, aiService *AIService, workerCount int) *RetryQueue {
	ctx, cancel := context.WithCancel(context.Background())
	return &RetryQueue{
		db:          db,
		aiService:   aiService,
		workerCount: workerCount,
		interval:    10 * time.Second,
		ctx:         ctx,
		cancel:      cancel,
	}
}

func (q *RetryQueue) SetActivityService(as *ActivityService) {
	// Will be used to update activities on retry success
}

// Enqueue adds a task to the retry queue
func (q *RetryQueue) Enqueue(ctx context.Context, task *models.RetryTask) error {
	_, err := q.db.Exec(ctx,
		`INSERT INTO retry_queue (id, type, payload, attempt, max_attempts, next_retry_at, status, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
		task.ID, task.Type, task.Payload, task.Attempt, task.MaxAttempts,
		task.NextRetryAt, task.Status)
	return err
}

// Start spawns background workers
func (q *RetryQueue) Start() {
	for i := 0; i < q.workerCount; i++ {
		go q.worker(i)
	}
	fmt.Printf("Started %d retry queue workers\n", q.workerCount)
}

// Stop gracefully shuts down workers
func (q *RetryQueue) Stop() {
	q.cancel()
	fmt.Println("Retry queue workers stopped")
}

// worker processes tasks from the queue
func (q *RetryQueue) worker(id int) {
	ticker := time.NewTicker(q.interval)
	defer ticker.Stop()

	fmt.Printf("Retry queue worker %d started\n", id)

	for {
		select {
		case <-ticker.C:
			q.processBatch()
		case <-q.ctx.Done():
			fmt.Printf("Retry queue worker %d shutting down\n", id)
			return
		}
	}
}

// processBatch fetches and processes a batch of pending tasks
func (q *RetryQueue) processBatch() {
	ctx, cancel := context.WithTimeout(q.ctx, 30*time.Second)
	defer cancel()

	tasks, err := q.fetchPendingTasks(ctx)
	if err != nil {
		fmt.Printf("Failed to fetch pending tasks: %v\n", err)
		return
	}

	if len(tasks) == 0 {
		return
	}

	fmt.Printf("Processing %d pending retry tasks\n", len(tasks))

	for _, task := range tasks {
		if err := q.processTask(ctx, task); err != nil {
			fmt.Printf("Error processing task %s: %v\n", task.ID, err)
		}
	}
}

// fetchPendingTasks retrieves tasks due for retry
func (q *RetryQueue) fetchPendingTasks(ctx context.Context) ([]*models.RetryTask, error) {
	rows, err := q.db.Query(ctx,
		`SELECT id, type, payload, attempt, max_attempts, next_retry_at, last_error, status, created_at, updated_at
		 FROM retry_queue
		 WHERE status = 'pending' AND next_retry_at <= NOW()
		 ORDER BY next_retry_at ASC
		 LIMIT 100`)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []*models.RetryTask
	for rows.Next() {
		t := &models.RetryTask{}
		err := rows.Scan(&t.ID, &t.Type, &t.Payload, &t.Attempt, &t.MaxAttempts,
			&t.NextRetryAt, &t.LastError, &t.Status, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}

	return tasks, nil
}

// processTask handles a single retry task
func (q *RetryQueue) processTask(ctx context.Context, task *models.RetryTask) error {
	var err error

	switch task.Type {
	case models.RetryTaskScreenshot:
		err = q.retryScreenshot(ctx, task)
	case models.RetryTaskSessionSummary:
		err = q.retrySessionSummary(ctx, task)
	case models.RetryTaskDailySummary:
		err = q.retryDailySummary(ctx, task)
	default:
		err = fmt.Errorf("unknown task type: %s", task.Type)
	}

	if err == nil {
		return q.markSuccess(ctx, task.ID)
	}

	if task.Attempt >= task.MaxAttempts {
		return q.markFailed(ctx, task.ID, err)
	}

	return q.scheduleNextRetry(ctx, task, err)
}

// markSuccess marks a task as successful
func (q *RetryQueue) markSuccess(ctx context.Context, id string) error {
	_, err := q.db.Exec(ctx,
		`UPDATE retry_queue SET status = 'success', updated_at = NOW() WHERE id = $1`, id)
	return err
}

// markFailed marks a task as permanently failed
func (q *RetryQueue) markFailed(ctx context.Context, id string, lastErr error) error {
	_, err := q.db.Exec(ctx,
		`UPDATE retry_queue
		 SET status = 'failed', last_error = $1, updated_at = NOW()
		 WHERE id = $2`,
		lastErr.Error(), id)
	return err
}

// scheduleNextRetry calculates next retry time and updates task
func (q *RetryQueue) scheduleNextRetry(ctx context.Context, task *models.RetryTask, lastErr error) error {
	delay := models.GetNextRetryDelay(task.Attempt)
	nextRetry := time.Now().Add(delay)

	_, err := q.db.Exec(ctx,
		`UPDATE retry_queue
		 SET attempt = attempt + 1, next_retry_at = $1, last_error = $2, updated_at = NOW()
		 WHERE id = $3`,
		nextRetry, lastErr.Error(), task.ID)

	return err
}

// GetMetrics returns queue statistics
func (q *RetryQueue) GetMetrics(ctx context.Context) (*models.RetryStats, error) {
	stats := &models.RetryStats{}

	q.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM retry_queue WHERE status = 'pending'`).Scan(&stats.TotalPending)
	q.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM retry_queue WHERE status = 'success'`).Scan(&stats.TotalSuccess)
	q.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM retry_queue WHERE status = 'failed'`).Scan(&stats.TotalFailed)
	q.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM retry_queue WHERE status = 'pending'`).Scan(&stats.CurrentQueued)
	q.db.QueryRow(ctx,
		`SELECT COALESCE(AVG(attempt), 0) FROM retry_queue WHERE status != 'pending'`).Scan(&stats.AvgRetryCount)

	return stats, nil
}
```
