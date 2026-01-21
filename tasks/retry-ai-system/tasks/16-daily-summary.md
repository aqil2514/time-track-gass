# Task 16: Implement Daily Summary Service

## Meta
- **File**: `backend/internal/services/daily_summary.go`
- **Action**: create
- **Depends**: [05]
- **Priority**: P2
- **Phase**: 3

## Objective
Implement daily summary generation job using GLM-4.7 for deep reasoning.

## Requirements
- Generate daily summary from all activities
- Use GLM-4.7 (full model) for best quality
- Store in daily_summaries table
- Scheduled job (nightly) or on-demand

## Acceptance Criteria
- [ ] `DailySummaryService` struct defined
- [ ] `Generate` method implemented
- [ ] `GenerateForUser` method
- [ ] `Get` method to retrieve stored summary
- [ ] Uses GLM-4.7 with thinking mode enabled

## Implementation Notes

```go
// backend/internal/services/daily_summary.go

package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/timetrack/backend/internal/models"
)

type DailySummaryService struct {
	db        *pgxpool.Pool
	aiService *AIService
}

func NewDailySummaryService(db *pgxpool.Pool, aiService *AIService) *DailySummaryService {
	return &DailySummaryService{
		db:        db,
		aiService: aiService,
	}
}

// DailySummary represents a generated daily summary
type DailySummary struct {
	ID        uuid.UUID              `json:"id"`
	UserID    uuid.UUID              `json:"user_id"`
	Date      time.Time              `json:"date"`
	Summary   string                 `json:"summary"`
	Stats     map[string]interface{} `json:"stats"`
	CreatedAt time.Time              `json:"created_at"`
}

// GenerateForUser generates a daily summary for a specific user and date
func (s *DailySummaryService) GenerateForUser(ctx context.Context, userID uuid.UUID, date time.Time) (*DailySummary, error) {
	// Check if summary already exists
	existing, err := s.Get(ctx, userID, date)
	if err == nil {
		return existing, nil
	}

	// Fetch activities for the day
	activities, err := s.fetchActivitiesForDay(ctx, userID, date)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch activities: %w", err)
	}

	if len(activities) == 0 {
		return nil, fmt.Errorf("no activities found for this date")
	}

	// Build prompt
	prompt := s.buildDailySummaryPrompt(date, activities)

	// Call AI with GLM-4.7 (full model) for best reasoning
	response, err := s.callAIForSummary(ctx, s.aiService.textModelSmart, prompt)
	if err != nil {
		return nil, fmt.Errorf("AI generation failed: %w", err)
	}

	// Calculate stats
	stats := s.calculateStats(activities)

	// Store summary
	summary := &DailySummary{
		ID:        uuid.New(),
		UserID:    userID,
		Date:      date,
		Summary:   response,
		Stats:     stats,
		CreatedAt: time.Now(),
	}

	err = s.storeSummary(ctx, summary)
	if err != nil {
		return nil, err
	}

	return summary, nil
}

// buildDailySummaryPrompt creates the AI prompt for daily summary
func (s *DailySummaryService) buildDailySummaryPrompt(date time.Time, activities []*models.Activity) string {
	// Group by category
	categoryGroups := make(map[string][]*models.Activity)
	for _, a := range activities {
		categoryGroups[a.Category] = append(categoryGroups[a.Category], a)
	}

	// Build prompt
	prompt := fmt.Sprintf(`Generate a comprehensive daily work summary for %s.

Total Activities: %d
Work Duration: %.1f hours

By Category:
`, date.Format("2006-01-02 (Monday)"), len(activities), float64(len(activities)*5)/60)

	for category, acts := range categoryGroups {
		duration := float64(len(acts)*5) / 60
		prompt += fmt.Sprintf("- %s: %.1f hours (%d activities)\n", category, duration, len(acts))
	}

	prompt += `
Key Activities (chronological):
`

	// Add first few and last few activities
	maxActivities := 10
	if len(activities) > maxActivities {
		// Show first 5
		for i := 0; i < 5; i++ {
			a := activities[i]
			prompt += fmt.Sprintf("- %s: %s in %s\n", a.CapturedAt.Format("15:04"), a.Summary, a.Category)
		}
		prompt += fmt.Sprintf("... (%d more activities) ...\n", len(activities)-10)
		// Show last 5
		for i := len(activities) - 5; i < len(activities); i++ {
			a := activities[i]
			prompt += fmt.Sprintf("- %s: %s in %s\n", a.CapturedAt.Format("15:04"), a.Summary, a.Category)
		}
	} else {
		for _, a := range activities {
			prompt += fmt.Sprintf("- %s: %s in %s\n", a.CapturedAt.Format("15:04"), a.Summary, a.Category)
		}
	}

	prompt += `
Please provide:
1. Overview of the day's focus areas
2. Key accomplishments and progress made
3. Time distribution insights
4. Any patterns or observations

Keep it concise (3-5 sentences) but informative.`

	return prompt
}

// callAIForSummary calls the AI model for summary generation
func (s *DailySummaryService) callAIForSummary(ctx context.Context, model, prompt string) (string, error) {
	reqBody := map[string]interface{}{
		"model": model,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
		"thinking": map[string]string{"type": "enabled"},
		"max_tokens": 1000,
	}

	// Make API call to Z.ai
	// ... (similar to AI service)
	return "", nil
}

// calculateStats computes statistics from activities
func (s *DailySummaryService) calculateStats(activities []*models.Activity) map[string]interface{} {
	categoryCounts := make(map[string]int)
	for _, a := range activities {
		categoryCounts[a.Category]++
	}

	totalMinutes := len(activities) * 5

	return map[string]interface{}{
		"total_activities":  len(activities),
		"total_minutes":     totalMinutes,
		"total_hours":       float64(totalMinutes) / 60,
		"by_category":       categoryCounts,
	}
}

// storeSummary saves the summary to database
func (s *DailySummaryService) storeSummary(ctx context.Context, summary *DailySummary) error {
	statsJSON, _ := json.Marshal(summary.Stats)

	_, err := s.db.Exec(ctx,
		`INSERT INTO daily_summaries (id, user_id, date, summary, stats, created_at)
		 VALUES ($1, $2, $3, $4, $5, NOW())
		 ON CONFLICT (user_id, date) DO UPDATE
		 SET summary = EXCLUDED.summary, stats = EXCLUDED.stats`,
		summary.ID, summary.UserID, summary.Date, summary.Summary, statsJSON)

	return err
}

// Get retrieves a stored daily summary
func (s *DailySummaryService) Get(ctx context.Context, userID uuid.UUID, date time.Time) (*DailySummary, error) {
	var summary DailySummary
	var statsJSON []byte

	err := s.db.QueryRow(ctx,
		`SELECT id, user_id, date, summary, stats, created_at
		 FROM daily_summaries
		 WHERE user_id = $1 AND date = $2`,
		userID, date).Scan(&summary.ID, &summary.UserID, &summary.Date,
		&summary.Summary, &statsJSON, &summary.CreatedAt)

	if err != nil {
		return nil, err
	}

	json.Unmarshal(statsJSON, &summary.Stats)

	return &summary, nil
}

// fetchActivitiesForDay gets all activities for a user on a specific date
func (s *DailySummaryService) fetchActivitiesForDay(ctx context.Context, userID uuid.UUID, date time.Time) ([]*models.Activity, error) {
	from := date.Truncate(24 * time.Hour)
	to := from.Add(24 * time.Hour)

	rows, err := s.db.Query(ctx,
		`SELECT id, user_id, captured_at, app_name, window_title, category, summary, created_at
		 FROM activities
		 WHERE user_id = $1 AND captured_at >= $2 AND captured_at < $3
		 ORDER BY captured_at ASC`,
		userID, from, to)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var activities []*models.Activity
	for rows.Next() {
		a := &models.Activity{}
		err := rows.Scan(&a.ID, &a.UserID, &a.CapturedAt, &a.AppName,
			&a.WindowTitle, &a.Category, &a.Summary, &a.CreatedAt)
		if err != nil {
			return nil, err
		}
		activities = append(activities, a)
	}

	return activities, nil
}
```

## Scheduled Job

```go
// backend/internal/jobs/daily_summary_job.go

package jobs

import (
	"context"
	"log"
	"time"

	"github.com/robfig/cron/v3"
	"github.com/timetrack/backend/internal/services"
)

type DailySummaryJob struct {
	service       *services.DailySummaryService
	cron          *cron.Cron
}

func NewDailySummaryJob(service *services.DailySummaryService) *DailySummaryJob {
	return &DailySummaryJob{
		service: service,
		cron:    cron.New(),
	}
}

func (j *DailySummaryJob) Start() {
	// Run every day at 1 AM
	j.cron.AddFunc("0 1 * * *", func() {
		j.Run(context.Background())
	})
	j.cron.Start()
	log.Println("Daily summary job scheduled")
}

func (j *DailySummaryJob) Run(ctx context.Context) {
	log.Println("Running daily summary generation...")
	yesterday := time.Now().AddDate(0, 0, -1).Truncate(24 * time.Hour)

	// Get all active users
	userIDs := j.getActiveUsers(ctx)

	for _, userID := range userIDs {
		_, err := j.service.GenerateForUser(ctx, userID, yesterday)
		if err != nil {
			log.Printf("Failed to generate summary for user %s: %v", userID, err)
		}
	}

	log.Println("Daily summary generation completed")
}

func (j *DailySummaryJob) Stop() {
	j.cron.Stop()
}
```

## API Endpoint

```go
// In handlers, add daily summary handler

func (h *DailySummaryHandler) Generate(c *gin.Context) {
    userID := c.MustGet("user_id").(string)
    dateStr := c.Query("date") // Format: 2025-01-20

    date, err := time.Parse("2006-01-02", dateStr)
    if err != nil {
        date = time.Now().Truncate(24 * time.Hour)
    }

    userUUID, _ := uuid.Parse(userID)
    summary, err := h.service.GenerateForUser(c.Request.Context(), userUUID, date)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(200, gin.H{"data": summary})
}
```
