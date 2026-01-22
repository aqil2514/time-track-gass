// backend/internal/services/notification_service.go
// [TimeTrack Notification Service]
// Handles CRUD operations for notifications (AI failures, system events, etc.)
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

type NotificationService struct {
	db *pgxpool.Pool
}

func NewNotificationService(db *pgxpool.Pool) *NotificationService {
	return &NotificationService{db: db}
}

// CreateNotification creates a new notification
func (s *NotificationService) CreateNotification(ctx context.Context, orgID uuid.UUID, input *models.CreateNotificationInput) (*models.Notification, error) {
	var userID *uuid.UUID
	if input.UserID != "" {
		parsed, err := uuid.Parse(input.UserID)
		if err == nil {
			userID = &parsed
		}
	}

	// Convert metadata to JSON for storage
	var metadataJSON []byte
	var err error
	if input.Metadata != nil {
		metadataJSON, err = json.Marshal(input.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
	}

	notification := &models.Notification{
		ID:             uuid.New(),
		OrganizationID: orgID,
		UserID:         userID,
		Type:           input.Type,
		Title:          input.Title,
		Message:        input.Message,
		Metadata:       input.Metadata,
		IsRead:         false,
		CreatedAt:      time.Now(),
	}

	_, err = s.db.Exec(ctx,
		`INSERT INTO notifications (id, organization_id, user_id, type, title, message, metadata, is_read, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		notification.ID, notification.OrganizationID, notification.UserID, notification.Type,
		notification.Title, notification.Message, metadataJSON, notification.IsRead, notification.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create notification: %w", err)
	}

	return notification, nil
}

// ListNotifications lists notifications for an organization (and specific user if provided)
func (s *NotificationService) ListNotifications(ctx context.Context, orgID uuid.UUID, userID *uuid.UUID) ([]*models.Notification, error) {
	query := `SELECT id, organization_id, user_id, type, title, message, metadata, is_read, created_at 
			  FROM notifications 
			  WHERE organization_id = $1`
	args := []interface{}{orgID}

	if userID != nil {
		query += ` AND (user_id IS NULL OR user_id = $2)`
		args = append(args, userID)
	}

	query += ` ORDER BY created_at DESC LIMIT 50`

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list notifications: %w", err)
	}
	defer rows.Close()

	var notifications []*models.Notification
	for rows.Next() {
		var n models.Notification
		var metadataJSON []byte
		if err := rows.Scan(&n.ID, &n.OrganizationID, &n.UserID, &n.Type, &n.Title, &n.Message, &metadataJSON, &n.IsRead, &n.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan notification: %w", err)
		}
		// Parse metadata JSON
		if metadataJSON != nil && len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &n.Metadata); err != nil {
				// Log but don't fail - metadata is optional
				n.Metadata = nil
			}
		}
		notifications = append(notifications, &n)
	}

	return notifications, nil
}

// MarkAsRead marks a notification as read
func (s *NotificationService) MarkAsRead(ctx context.Context, id uuid.UUID) error {
	_, err := s.db.Exec(ctx, `UPDATE notifications SET is_read = true WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to mark notification as read: %w", err)
	}
	return nil
}
