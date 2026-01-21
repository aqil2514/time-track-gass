// backend/internal/models/share.go
package models

import (
	"time"

	"github.com/google/uuid"
)

type Share struct {
	ID        uuid.UUID `json:"id"`
	OwnerID   uuid.UUID `json:"owner_id"`
	ViewerID  uuid.UUID `json:"viewer_id"`
	CreatedAt time.Time `json:"created_at"`
}

type ShareWithUser struct {
	ID        uuid.UUID     `json:"id"`
	OwnerID   uuid.UUID     `json:"owner_id"`
	ViewerID  uuid.UUID     `json:"viewer_id"`
	CreatedAt time.Time     `json:"created_at"`
	User      *UserResponse `json:"user"` // Owner or Viewer depending on context
}

type CreateShareInput struct {
	Email string `json:"email" binding:"required,email"`
}
