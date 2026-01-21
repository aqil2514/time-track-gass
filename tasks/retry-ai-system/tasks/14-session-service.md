# Task 14: Implement Session Service

## Meta
- **File**: `backend/internal/services/session_service.go`
- **Action**: create
- **Depends**: [13]
- **Priority**: P1
- **Phase**: 3

## Objective
Implement session grouping logic and session summary generation.

## Requirements
- Group activities into sessions algorithmically
- Generate session summaries using text AI model
- List sessions with pagination
- Lazy summary generation

## Acceptance Criteria
- [ ] `SessionService` struct defined
- [ ] `GroupActivitiesToSessions` method implemented
- [ ] `GenerateSummary` method using text AI
- [ ] `List` method with pagination
- [ ] `GetOrCreateSession` for activity upload integration

## Implementation Notes

```go
// backend/internal/services/session_service.go

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

type SessionService struct {
	db         *pgxpool.Pool
	aiService  *AIService
	retryQueue *RetryQueue
}

func NewSessionService(db *pgxpool.Pool, aiService *AIService) *SessionService {
	return &SessionService{
		db:        db,
		aiService: aiService,
	}
}

func (s *SessionService) SetRetryQueue(rq *RetryQueue) {
	s.retryQueue = rq
}

// GroupActivitiesToSessions groups activities into sessions based on rules
func (s *SessionService) GroupActivitiesToSessions(ctx context.Context, userID uuid.UUID, from, to time.Time) ([]*models.Session, error) {
	// Fetch activities ordered by time
	activities, err := s.fetchActivitiesForGrouping(ctx, userID, from, to)
	if err != nil {
		return nil, err
	}

	rules := models.DefaultSessionGroupingRules()
	var sessions []*models.Session
	var currentSession *models.Session
	var lastActivity *models.Activity

	for _, activity := range activities {
		shouldStartNew := models.ShouldStartNewSession(lastActivity, activity, rules)

		if shouldStartNew || currentSession == nil {
			// Finalize previous session
			if currentSession != nil {
				sessions = append(sessions, currentSession)
			}

			// Start new session
			currentSession = &models.Session{
				ID:            uuid.New(),
				UserID:        userID,
				Category:      activity.Category,
				AppName:       activity.AppName,
				StartedAt:     activity.CapturedAt,
				ActivityCount: 1,
			}
		} else {
			// Add to current session
			currentSession.ActivityCount++
			endedAt := activity.CapturedAt
			currentSession.EndedAt = &endedAt
		}

		lastActivity = activity
	}

	// Add last session
	if currentSession != nil {
		sessions = append(sessions, currentSession)
	}

	return sessions, nil
}

// GenerateSummary generates AI summary for a session
func (s *SessionService) GenerateSummary(ctx context.Context, sessionID uuid.UUID, activities []models.Activity) (string, error) {
	prompt := s.buildSessionSummaryPrompt(activities)

	// Use text model (GLM-4.7-FlashX for fast, or GLM-4.7 for quality)
	model := s.aiService.textModelFast // Could be configurable

	response, err := s.callTextAI(ctx, model, prompt)
	if err != nil {
		return "", err
	}

	// Update session
	_, err = s.db.Exec(ctx,
		`UPDATE activity_sessions
		 SET summary = $1, summary_generated_at = NOW()
		 WHERE id = $2`,
		response, sessionID)

	return response, err
}

// buildSessionSummaryPrompt creates the AI prompt for session summary
func (s *SessionService) buildSessionSummaryPrompt(activities []models.Activity) string {
	// Format activities for prompt
	activitiesText := ""
	for i, a := range activities {
		activitiesText += fmt.Sprintf("%d. %s - %s: %s\n",
			i+1, a.CapturedAt.Format("15:04"), a.AppName, a.Summary)
	}

	// Calculate duration
	duration := activities[len(activities)-1].CapturedAt.Sub(activities[0].CapturedAt)
	minutes := int(duration.Minutes())

	prompt := fmt.Sprintf(`Generate a 1-2 sentence summary of this work session:

Time: %s to %s (%d minutes)
Category: %s
Activities:
%s

Focus on:
- What was accomplished (outcome, not just activities)
- Key tasks or features worked on
- Any progress made

Keep it concise and specific. Use the same language as the activities.`,
		activities[0].CapturedAt.Format("15:04"),
		activities[len(activities)-1].CapturedAt.Format("15:04"),
		minutes,
		activities[0].Category,
		activitiesText)

	return prompt
}

// callTextAI calls the text-only AI model
func (s *SessionService) callTextAI(ctx context.Context, model, prompt string) (string, error) {
	reqBody := map[string]interface{}{
		"model": model,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
		"max_tokens": 500,
	}

	// Make API call
	// ... (similar to AI service but text-only)
	return "", nil
}

// List returns sessions with pagination
func (s *SessionService) List(ctx context.Context, userID uuid.UUID, from, to time.Time, category string, page, perPage int) ([]*models.Session, int, error) {
	// Build query
	query := `SELECT id, user_id, category, app_name, started_at, ended_at, activity_count, total_minutes, summary, summary_generated_at, created_at
			  FROM activity_sessions
			  WHERE user_id = $1 AND started_at >= $2 AND started_at < $3`
	args := []interface{}{userID, from, to}
	argIdx := 4

	if category != "" {
		query += fmt.Sprintf(" AND category = $%d", argIdx)
		args = append(args, category)
		argIdx++
	}

	query += ` ORDER BY started_at DESC`

	// Count total
	countQuery := `SELECT COUNT(*) FROM activity_sessions WHERE user_id = $1 AND started_at >= $2 AND started_at < $3`
	var total int
	err := s.db.QueryRow(ctx, countQuery, userID, from, to).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Pagination
	offset := (page - 1) * perPage
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, perPage, offset)

	// Execute
	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var sessions []*models.Session
	for rows.Next() {
		s := &models.Session{}
		err := rows.Scan(&s.ID, &s.UserID, &s.Category, &s.AppName,
			&s.StartedAt, &s.EndedAt, &s.ActivityCount, &s.TotalMinutes,
			&s.Summary, &s.SummaryGeneratedAt, &s.CreatedAt)
		if err != nil {
			return nil, 0, err
		}
		sessions = append(sessions, s)
	}

	return sessions, total, nil
}
```

## Session Grouping Algorithm

```go
// In session_service.go

func (s *SessionService) fetchActivitiesForGrouping(ctx context.Context, userID uuid.UUID, from, to time.Time) ([]*models.Activity, error) {
	query := `SELECT id, user_id, captured_at, app_name, window_title, category, summary, created_at
			  FROM activities
			  WHERE user_id = $1 AND captured_at >= $2 AND captured_at < $3
			  ORDER BY captured_at ASC`

	rows, err := s.db.Query(ctx, query, userID, from, to)
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
