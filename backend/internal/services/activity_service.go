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
	db        *pgxpool.Pool
	aiService *AIService
}

func NewActivityService(db *pgxpool.Pool, aiService *AIService) *ActivityService {
	return &ActivityService{db: db, aiService: aiService}
}

func (s *ActivityService) Upload(ctx context.Context, userID uuid.UUID, input *models.UploadActivityInput) (*models.Activity, error) {
	// Analyze screenshot with AI
	analysis, err := s.aiService.AnalyzeScreenshot(ctx, input.Image)
	if err != nil {
		return nil, fmt.Errorf("failed to analyze screenshot: %w", err)
	}

	capturedAt := input.CapturedAt
	if capturedAt.IsZero() {
		capturedAt = time.Now()
	}

	// Insert activity
	activity := &models.Activity{}
	err = s.db.QueryRow(ctx,
		`INSERT INTO activities (user_id, captured_at, app_name, window_title, category, summary)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, user_id, captured_at, app_name, window_title, category, summary, created_at`,
		userID, capturedAt, analysis.AppName, analysis.WindowTitle, analysis.Category, analysis.Summary,
	).Scan(&activity.ID, &activity.UserID, &activity.CapturedAt, &activity.AppName,
		&activity.WindowTitle, &activity.Category, &activity.Summary, &activity.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to insert activity: %w", err)
	}

	return activity, nil
}

func (s *ActivityService) List(ctx context.Context, userID uuid.UUID, input *models.ActivityListInput) ([]*models.Activity, int, error) {
	// Default date range: today
	if input.From.IsZero() {
		input.From = time.Now().Truncate(24 * time.Hour)
	}
	if input.To.IsZero() {
		input.To = input.From.Add(24 * time.Hour)
	}

	// Build query
	query := `SELECT id, user_id, captured_at, app_name, window_title, category, summary, created_at
			  FROM activities
			  WHERE user_id = $1 AND captured_at >= $2 AND captured_at < $3`
	args := []interface{}{userID, input.From, input.To}
	argIdx := 4

	if input.Category != "" {
		query += fmt.Sprintf(" AND category = $%d", argIdx)
		args = append(args, input.Category)
		argIdx++
	}

	query += ` ORDER BY captured_at DESC`

	// Count total
	countQuery := `SELECT COUNT(*) FROM activities WHERE user_id = $1 AND captured_at >= $2 AND captured_at < $3`
	var total int
	err := s.db.QueryRow(ctx, countQuery, userID, input.From, input.To).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count activities: %w", err)
	}

	// Pagination
	offset := (input.Page - 1) * input.PerPage
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, input.PerPage, offset)

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
			&a.Category, &a.Summary, &a.CreatedAt)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan activity: %w", err)
		}
		activities = append(activities, a)
	}

	return activities, total, nil
}

func (s *ActivityService) GetStats(ctx context.Context, userID uuid.UUID, from, to time.Time) (*models.ActivityStats, error) {
	if from.IsZero() {
		from = time.Now().Truncate(24 * time.Hour)
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
			return nil, fmt.Errorf("failed to scan stat row: %w", err)
		}
		totalCount += count
		stats.ByCategory[category] = models.CategoryStat{
			Count:   count,
			Minutes: count * 5, // 5 minutes per screenshot
		}
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
