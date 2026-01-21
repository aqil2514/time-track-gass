// backend/internal/services/activity_service.go
package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/timetrack/backend/internal/models"
)

type ActivityService struct {
	db         *pgxpool.Pool
	aiService  *AIService
	retryQueue *RetryQueueService
}

func NewActivityService(db *pgxpool.Pool, aiService *AIService) *ActivityService {
	return &ActivityService{
		db:        db,
		aiService: aiService,
	}
}

// SetRetryQueue sets the retry queue service (called during initialization)
func (s *ActivityService) SetRetryQueue(rq *RetryQueueService) {
	s.retryQueue = rq
}

// Upload handles activity upload with inline retry and fallback to queue
func (s *ActivityService) Upload(ctx context.Context, userID uuid.UUID, input *models.UploadActivityInput) (*models.Activity, error) {
	// Always use UTC for timestamps
	capturedAt := time.Now().UTC()

	// Parse captured_at if provided
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
				capturedAt = capturedAt.UTC()
				break
			}
		}
	}

	// Try inline AI analysis first (with model cascade)
	analysis, aiErr := s.aiService.AnalyzeScreenshotWithRetry(ctx, input.Image)

	aiStatus := models.AIStatusSuccess

	if aiErr != nil {
		// AI analysis failed - need to queue for retry
		fmt.Printf("[UPLOAD] AI analysis failed for user %s: %v\n", userID, aiErr)

		// Use fallback data for initial insert
		analysis = &ScreenshotAnalysis{
			AppName:     "Unknown",
			WindowTitle: "Unknown",
			Category:    "other",
			Summary:     "Processing...",
		}
	}

	// Insert activity first (with or without AI data)
	activity := &models.Activity{
		UserID:     userID,
		CapturedAt: capturedAt,
		AppName:    analysis.AppName,
		WindowTitle: analysis.WindowTitle,
		Category:   analysis.Category,
		Summary:    analysis.Summary,
		AIStatus:   aiStatus,
	}

	// If AI failed, mark as processing and enqueue after insert
	if aiErr != nil {
		activity.AIStatus = models.AIStatusProcessing
	}

	var retryQueueIDParam interface{} = nil

	err := s.db.QueryRow(ctx,
		`INSERT INTO activities (user_id, captured_at, app_name, window_title, category, summary, ai_status, retry_queue_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id, user_id, captured_at, app_name, window_title, category, summary, ai_status, retry_queue_id, created_at`,
		activity.UserID, activity.CapturedAt, activity.AppName, activity.WindowTitle,
		activity.Category, activity.Summary, activity.AIStatus, retryQueueIDParam,
	).Scan(&activity.ID, &activity.UserID, &activity.CapturedAt, &activity.AppName,
		&activity.WindowTitle, &activity.Category, &activity.Summary, &activity.AIStatus,
		&activity.RetryQueueID, &activity.CreatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to insert activity: %w", err)
	}

	// If AI failed, now enqueue retry task with actual activity ID
	if aiErr != nil && s.retryQueue != nil {
		taskID, queueErr := s.retryQueue.EnqueueScreenshotAnalysisForActivity(ctx, activity.ID, input.Image)
		if queueErr != nil {
			// Failed to enqueue - mark activity as failed
			fmt.Printf("[UPLOAD] Failed to enqueue retry task for activity %s: %v\n", activity.ID, queueErr)
			markErr := s.MarkAIFailed(ctx, activity.ID)
			if markErr != nil {
				fmt.Printf("[UPLOAD] Failed to mark activity as failed: %v\n", markErr)
			}
			// Return the original queue error to caller
			return nil, fmt.Errorf("AI analysis failed and retry queue unavailable: %w", queueErr)
		}

		// Successfully enqueued - update activity with queued status
		updateErr := s.db.QueryRow(ctx,
			`UPDATE activities SET ai_status = 'queued', retry_queue_id = $1
			 WHERE id = $2
			 RETURNING ai_status, retry_queue_id`,
			taskID, activity.ID,
		).Scan(&activity.AIStatus, &activity.RetryQueueID)

		if updateErr != nil {
			fmt.Printf("[UPLOAD] Failed to update activity status: %v\n", updateErr)
		} else {
			fmt.Printf("[UPLOAD] Activity %s queued for retry (task: %s)\n", activity.ID, taskID)
		}
	}

	return activity, nil
}

// List retrieves activities with pagination
func (s *ActivityService) List(ctx context.Context, userID uuid.UUID, from, to time.Time, category string, page, perPage int) ([]*models.Activity, int, error) {
	// Default date range: today (UTC)
	if from.IsZero() {
		from = time.Now().UTC().Truncate(24 * time.Hour)
	}
	if to.IsZero() {
		to = from.Add(24 * time.Hour)
	}

	// Build query
	query := `SELECT id, user_id, captured_at, app_name, window_title, category, summary, ai_status, retry_queue_id, created_at
			  FROM activities
			  WHERE user_id = $1 AND captured_at >= $2 AND captured_at < $3`
	args := []interface{}{userID, from, to}
	argIdx := 4

	if category != "" {
		query += fmt.Sprintf(" AND category = $%d", argIdx)
		args = append(args, category)
		argIdx++
	}

	query += ` ORDER BY captured_at DESC`

	// Count total
	countQuery := `SELECT COUNT(*) FROM activities WHERE user_id = $1 AND captured_at >= $2 AND captured_at < $3`
	var total int
	err := s.db.QueryRow(ctx, countQuery, userID, from, to).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count activities: %w", err)
	}

	// Pagination
	offset := (page - 1) * perPage
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, perPage, offset)

	// Execute query
	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query activities: %w", err)
	}
	defer rows.Close()

	var activities []*models.Activity
	for rows.Next() {
		a := &models.Activity{}
		err := rows.Scan(&a.ID, &a.UserID, &a.CapturedAt, &a.AppName, &a.WindowTitle,
			&a.Category, &a.Summary, &a.AIStatus, &a.RetryQueueID, &a.CreatedAt)
		if err != nil {
			rows.Close()
			return nil, 0, fmt.Errorf("failed to scan activity: %w", err)
		}
		activities = append(activities, a)
	}

	// Check for errors during iteration
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating activities: %w", err)
	}

	return activities, total, nil
}

// GetStats retrieves activity statistics
func (s *ActivityService) GetStats(ctx context.Context, userID uuid.UUID, from, to time.Time) (*models.ActivityStats, error) {
	if from.IsZero() {
		from = time.Now().UTC().Truncate(24 * time.Hour)
	}
	if to.IsZero() {
		to = from.Add(24 * time.Hour)
	}

	rows, err := s.db.Query(ctx,
		`SELECT category, COUNT(*) as count
		 FROM activities
		 WHERE user_id = $1 AND captured_at >= $2 AND captured_at < $3
		 GROUP BY category`,
		userID, from, to,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query stats: %w", err)
	}
	defer rows.Close()

	stats := &models.ActivityStats{
		ByCategory: make(map[string]models.CategoryStat),
	}

	totalCount := 0
	for rows.Next() {
		var category string
		var count int
		if err := rows.Scan(&category, &count); err != nil {
			rows.Close()
			return nil, fmt.Errorf("failed to scan stat row: %w", err)
		}
		totalCount += count
		stats.ByCategory[category] = models.CategoryStat{
			Count:   count,
			Minutes: count * 5,
		}
	}

	// Check for errors during iteration
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating stats: %w", err)
	}

	stats.TotalMinutes = totalCount * 5
	stats.TotalHours = float64(stats.TotalMinutes) / 60

	// Calculate percentages
	for cat, stat := range stats.ByCategory {
		if totalCount > 0 {
			stat.Percentage = float64(stat.Count) / float64(totalCount) * 100
		}
		stats.ByCategory[cat] = stat
	}

	return stats, nil
}

// UpdateAIAnalysis updates an activity with successful AI analysis
func (s *ActivityService) UpdateAIAnalysis(ctx context.Context, activityID uuid.UUID, analysis *ScreenshotAnalysis) error {
	_, err := s.db.Exec(ctx,
		`UPDATE activities
		 SET app_name = $2, window_title = $3, category = $4, summary = $5, ai_status = 'success', retry_queue_id = NULL
		 WHERE id = $1`,
		activityID, analysis.AppName, analysis.WindowTitle, analysis.Category, analysis.Summary,
	)
	if err != nil {
		return fmt.Errorf("failed to update activity: %w", err)
	}
	return nil
}

// MarkAIFailed marks an activity's AI analysis as permanently failed
func (s *ActivityService) MarkAIFailed(ctx context.Context, activityID uuid.UUID) error {
	_, err := s.db.Exec(ctx,
		`UPDATE activities
		 SET ai_status = 'failed', summary = 'AI analysis failed', retry_queue_id = NULL
		 WHERE id = $1`,
		activityID,
	)
	if err != nil {
		return fmt.Errorf("failed to mark activity as failed: %w", err)
	}
	return nil
}
