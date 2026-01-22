// backend/internal/models/organization.go
package models

import (
	"time"

	"github.com/google/uuid"
)

type Organization struct {
	ID                uuid.UUID  `json:"id"`
	Name              string     `json:"name"`
	OwnerID           *uuid.UUID `json:"owner_id"`
	Timezone          string     `json:"timezone"`
	AIApiKeyEncrypted string     `json:"-"`
	AIApiKeyIV        string     `json:"-"`
	CreatedAt         time.Time  `json:"created_at"`
}

type CreateOrganizationInput struct {
	Name     string `json:"name" binding:"required"`
	Timezone string `json:"timezone"`
}

type OrganizationResponse struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Timezone    string    `json:"timezone"`
	HasAPIKey   bool      `json:"has_api_key"`
	MemberCount int       `json:"member_count"`
	CreatedAt   time.Time `json:"created_at"`
}

type MemberResponse struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name,omitempty"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

// Organization Stats Response
type OrganizationStatsResponse struct {
	TotalHours       float64            `json:"total_hours"`
	AvgHoursPerMember float64           `json:"avg_hours_per_member"`
	ByCategory       map[string]float64 `json:"by_category"`
	MemberCount      int                `json:"member_count"`
}

// Member Summary Response for reporting
type MemberSummaryResponse struct {
	ID         uuid.UUID `json:"id"`
	Name       string    `json:"name"`
	Role       string    `json:"role"`
	TotalHours float64   `json:"total_hours"`
	ActiveFrom string    `json:"active_from,omitempty"`
	ActiveTo   string    `json:"active_to,omitempty"`
}

// Heatmap Response
type HeatmapResponse struct {
	Date    string                `json:"date"`
	Members []HeatmapMemberResponse `json:"members"`
}

type HeatmapMemberResponse struct {
	ID    uuid.UUID            `json:"id"`
	Name  string               `json:"name"`
	Hours map[string]int       `json:"hours"` // hour -> count
}
