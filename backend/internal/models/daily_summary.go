// backend/internal/models/daily_summary.go
package models

import (
	"time"

	"github.com/google/uuid"
)

type DailySummary struct {
	ID             uuid.UUID      `json:"id"`
	OrganizationID uuid.UUID      `json:"organization_id"`
	SummaryDate    time.Time      `json:"summary_date"` // Using time.Time for DATE type
	Overview       string         `json:"overview"`
	TopCategories  map[string]any `json:"top_categories"` // JSONB
	TotalHours     float64        `json:"total_hours"`
	Highlights     []string       `json:"highlights"` // JSONB
	Status         string         `json:"status"`
	CreatedAt      time.Time      `json:"created_at"`
}
