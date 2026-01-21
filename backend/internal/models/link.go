// [
package models

import (
	"time"

	"github.com/google/uuid"
)

type SharedLink struct {
	ID        uuid.UUID  `json:"id"`
	UserID    uuid.UUID  `json:"user_id"`
	Slug      string     `json:"slug"`
	Name      string     `json:"name"`
	ExpiresAt *time.Time `json:"expires_at"`
	IsPublic  bool       `json:"is_public"`
	CreatedAt time.Time  `json:"created_at"`
	Views     int        `json:"views"`
}

type CreateSharedLinkInput struct {
	Name      string     `json:"name" binding:"required"`
	ExpiresAt *time.Time `json:"expires_at"`
	IsPublic  bool       `json:"is_public"`
}

type SharedLinkResponse struct {
	ID        uuid.UUID  `json:"id"`
	Slug      string     `json:"slug"`
	Name      string     `json:"name"`
	ExpiresAt *time.Time `json:"expires_at"`
	Url       string     `json:"url"`
	CreatedAt time.Time  `json:"created_at"`
}
