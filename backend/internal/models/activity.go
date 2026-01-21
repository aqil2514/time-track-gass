// backend/internal/models/activity.go
package models

import (
	"time"

	"github.com/google/uuid"
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
	RetryQueueID *uuid.UUID `json:"retry_queue_id,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type UploadActivityInput struct {
	Image      string  `json:"image" binding:"required"` // base64 encoded
	CapturedAt *string `json:"captured_at"`              // optional ISO string
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

type DailySummary struct {
	Day           time.Time `json:"day"`
	Category      string    `json:"category"`
	ActivityCount int       `json:"activity_count"`
	TotalMinutes  int       `json:"total_minutes"`
}
