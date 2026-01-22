// backend/internal/models/activity.go
// [TimeTrack Activity Model]
package models

import (
	"time"

	"github.com/google/uuid"
)

// AIStatus defines the AI analysis status for activities
type AIStatus string

const (
	AIStatusSuccess    AIStatus = "success"
	AIStatusQueued     AIStatus = "queued"
	AIStatusFailed     AIStatus = "failed"
	AIStatusProcessing AIStatus = "processing"
)

type Activity struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	CapturedAt  time.Time  `json:"captured_at"`
	AppName     string     `json:"app_name"`
	WindowTitle string     `json:"window_title"`
	Category    string     `json:"category"`
	Summary     string     `json:"summary"`
	AIStatus    AIStatus   `json:"ai_status"`
	CreatedAt   time.Time  `json:"created_at"`
}

type UploadActivityInput struct {
	AppName     string `json:"app_name" binding:"required"`
	WindowTitle string `json:"window_title"`
	Category    string `json:"category"`
	Summary     string `json:"summary"`
	CapturedAt  string `json:"captured_at"`
}

type ActivityListInput struct {
	From     string `form:"from"`
	To       string `form:"to"`
	Category string `form:"category"`
	Page     int    `form:"page,default=1"`
	PerPage  int    `form:"per_page,default=20"`
}

type ActivityStats struct {
	TotalMinutes int                     `json:"total_minutes"`
	TotalHours   float64                 `json:"total_hours"`
	ByCategory   map[string]CategoryStat `json:"by_category"`
}

type CategoryStat struct {
	Minutes    int     `json:"minutes"`
	Percentage float64 `json:"percentage"`
	Count      int     `json:"count"`
}

type DailyCategoryStat struct {
	Day           time.Time `json:"day"`
	Category      string    `json:"category"`
	ActivityCount int       `json:"activity_count"`
	TotalMinutes  int       `json:"total_minutes"`
}

type ScreenshotAnalysis struct {
	AppName     string `json:"app_name"`
	WindowTitle string `json:"window_title"`
	Category    string `json:"category"`
	Summary     string `json:"summary"`
}
