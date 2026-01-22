// backend/internal/models/notification.go
// [TimeTrack Notification Model]
// Used for Admin/Owner notifications (AI failures, system events, etc.)
package models

import (
	"time"

	"github.com/google/uuid"
)

type Notification struct {
	ID             uuid.UUID              `json:"id"`
	OrganizationID uuid.UUID              `json:"organization_id"`
	UserID         *uuid.UUID             `json:"user_id,omitempty"` // Optional: specific user
	Type           string                 `json:"type"`              // 'ai_failure', 'sync_error', 'system', 'summary_ready'
	Title          string                 `json:"title"`
	Message        string                 `json:"message"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"` // Additional context data
	IsRead         bool                   `json:"is_read"`
	CreatedAt      time.Time              `json:"created_at"`
}

type CreateNotificationInput struct {
	Type     string                 `json:"type" binding:"required"`
	Title    string                 `json:"title" binding:"required"`
	Message  string                 `json:"message" binding:"required"`
	UserID   string                 `json:"user_id"`            // Optional UUID string
	Metadata map[string]interface{} `json:"metadata,omitempty"` // Additional context
}
