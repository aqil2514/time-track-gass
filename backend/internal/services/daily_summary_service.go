// backend/internal/services/daily_summary_service.go
// [TimeTrack Daily Summary Service]
// Handles scheduled daily summary generation for organizations
package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/timetrack/backend/internal/config"
	"github.com/timetrack/backend/internal/utils"
)

type DailySummaryService struct {
	db         *pgxpool.Pool
	aiService  *AIService
	orgService *OrganizationService
	cfg        *config.Config
}

func NewDailySummaryService(db *pgxpool.Pool, aiService *AIService, orgService *OrganizationService, cfg *config.Config) *DailySummaryService {
	return &DailySummaryService{
		db:         db,
		aiService:  aiService,
		orgService: orgService,
		cfg:        cfg,
	}
}

// GenerateDailySummariesForOrg generates daily summary for a specific organization
// Should be called at midnight in the organization's timezone
func (s *DailySummaryService) GenerateDailySummariesForOrg(ctx context.Context, orgID uuid.UUID) error {
	// Get organization to determine timezone and API key
	var org struct {
		ID                uuid.UUID
		Name              string
		Timezone          string
		AIApiKeyEncrypted string
		AIApiKeyIV        string
	}

	err := s.db.QueryRow(ctx,
		`SELECT id, name, timezone, ai_api_key_encrypted, ai_api_key_iv FROM organizations WHERE id = $1`,
		orgID,
	).Scan(&org.ID, &org.Name, &org.Timezone, &org.AIApiKeyEncrypted, &org.AIApiKeyIV)
	if err != nil {
		return fmt.Errorf("failed to get organization: %w", err)
	}

	// Decrypt API key if configured
	var apiKey string
	if org.AIApiKeyEncrypted != "" {
		apiKey, err = utils.DecryptSplit(org.AIApiKeyEncrypted, org.AIApiKeyIV, s.cfg.EncryptionKey)
		if err != nil {
			return fmt.Errorf("failed to decrypt API key: %w", err)
		}
	}

	// Calculate "yesterday" in org's timezone
	loc, err := time.LoadLocation(org.Timezone)
	if err != nil {
		loc = time.FixedZone(org.Timezone, 0) // Fallback
	}

	now := time.Now().In(loc)
	yesterday := now.AddDate(0, 0, -1)
	yesterdayStart := time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, loc)
	yesterdayEnd := yesterdayStart.Add(24 * time.Hour)

	// Fetch all activities from yesterday for this org
	rows, err := s.db.Query(ctx,
		`SELECT a.app_name, a.window_title, a.category, a.summary, a.captured_at
		 FROM activities a
		 JOIN users u ON a.user_id = u.id
		 WHERE u.organization_id = $1 AND a.captured_at >= $2 AND a.captured_at < $3
		 ORDER BY a.captured_at ASC`,
		orgID, yesterdayStart, yesterdayEnd,
	)
	if err != nil {
		return fmt.Errorf("failed to query activities: %w", err)
	}
	defer rows.Close()

	var activities []ActivitySummary
	for rows.Next() {
		var a ActivitySummary
		var capturedAt time.Time
		if err := rows.Scan(&a.AppName, &a.WindowTitle, &a.Category, &a.Summary, &capturedAt); err != nil {
			return fmt.Errorf("failed to scan activity: %w", err)
		}
		a.Time = capturedAt.Format("15:04")
		activities = append(activities, a)
	}

	if len(activities) == 0 {
		// No activities yesterday, skip or mark as empty
		return nil
	}

	// Calculate total hours (5 minutes per activity)
	totalHours := float64(len(activities)*5) / 60.0

	// Generate summary using AI
	var dailySummary *DailySummary
	var genErr error

	if apiKey != "" {
		dailySummary, genErr = s.aiService.GenerateDailySummary(ctx, apiKey, activities, totalHours)
		if genErr != nil {
			// Mark as failed but don't return error - we still want to record the attempt
			dailySummary = &DailySummary{
				Overview:      "Failed to generate AI summary",
				TopCategories: []string{},
				TotalHours:    totalHours,
				Highlights:    []string{},
			}
		}
	} else {
		dailySummary = &DailySummary{
			Overview:      "Daily summary (AI not configured)",
			TopCategories: []string{},
			TotalHours:    totalHours,
			Highlights:    []string{},
		}
	}

	// Store in daily_summaries table
	status := "success"
	if genErr != nil {
		status = "failed"
	}

	// Convert highlights to JSONB-compatible format
	highlightsJSON := fmt.Sprintf("[%q]", dailySummary.Highlights)

	_, err = s.db.Exec(ctx,
		`INSERT INTO daily_summaries (organization_id, summary_date, overview, top_categories, total_hours, highlights, status)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 ON CONFLICT (organization_id, summary_date) DO UPDATE SET
		 overview = EXCLUDED.overview,
		 top_categories = EXCLUDED.top_categories,
		 total_hours = EXCLUDED.total_hours,
		 highlights = EXCLUDED.highlights,
		 status = EXCLUDED.status`,
		orgID, yesterdayStart.Format("2006-01-02"), dailySummary.Overview,
		dailySummary.TopCategories, dailySummary.TotalHours, highlightsJSON, status,
	)

	if err != nil {
		return fmt.Errorf("failed to store daily summary: %w", err)
	}

	// If AI failed, create a notification
	if genErr != nil && apiKey != "" {
		// Get owner to notify
		var ownerID uuid.UUID
		err = s.db.QueryRow(ctx, `SELECT owner_id FROM organizations WHERE id = $1`, orgID).Scan(&ownerID)
		if err == nil {
			// Create notification for owner
			_, _ = s.db.Exec(ctx,
				`INSERT INTO notifications (organization_id, user_id, type, title, message, metadata, is_read)
				 VALUES ($1, $2, 'ai_failure', 'Daily Summary Failed', 'Failed to generate daily summary: '+$3, $4, false)`,
				orgID, ownerID, genErr.Error(), fmt.Sprintf(`{"error": "%s", "date": "%s"}`, genErr.Error(), yesterdayStart.Format("2006-01-02")),
			)
		}
	}

	return nil
}

// StartDailySummaryScheduler starts a background worker that checks for organizations
// whose local time is midnight and triggers daily summary generation
func (s *DailySummaryService) StartDailySummaryScheduler(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Minute) // Check every minute
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.checkAndGenerateSummaries(ctx)
		}
	}
}

func (s *DailySummaryService) checkAndGenerateSummaries(ctx context.Context) {
	// Get all organizations
	rows, err := s.db.Query(ctx, `SELECT id FROM organizations`)
	if err != nil {
		return
	}
	defer rows.Close()

	var orgIDs []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			continue
		}
		orgIDs = append(orgIDs, id)
	}

	// For each org, check if it's midnight in their timezone
	for _, orgID := range orgIDs {
		s.checkOrgMidnight(ctx, orgID)
	}
}

func (s *DailySummaryService) checkOrgMidnight(ctx context.Context, orgID uuid.UUID) {
	var timezone string
	err := s.db.QueryRow(ctx, `SELECT timezone FROM organizations WHERE id = $1`, orgID).Scan(&timezone)
	if err != nil {
		return
	}

	loc, err := time.LoadLocation(timezone)
	if err != nil {
		return
	}

	now := time.Now().In(loc)

	// If it's between 00:00 and 00:59, trigger daily summary generation
	// But only if we haven't already generated for today
	if now.Hour() == 0 && now.Minute() < 5 {
		// Check if summary already exists for yesterday
		yesterday := now.AddDate(0, 0, -1)
		yesterdayStr := yesterday.Format("2006-01-02")

		var exists bool
		err = s.db.QueryRow(ctx,
			`SELECT EXISTS(SELECT 1 FROM daily_summaries WHERE organization_id = $1 AND summary_date = $2)`,
			orgID, yesterdayStr,
		).Scan(&exists)

		if err == nil && !exists {
			// Generate summary
			_ = s.GenerateDailySummariesForOrg(ctx, orgID)
		}
	}
}
