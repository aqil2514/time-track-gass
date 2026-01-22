// backend/internal/services/organization_service.go
package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/timetrack/backend/internal/config"
	"github.com/timetrack/backend/internal/models"
	"github.com/timetrack/backend/internal/utils"
	"golang.org/x/crypto/bcrypt"
)

type OrganizationService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

func NewOrganizationService(db *pgxpool.Pool, cfg *config.Config) *OrganizationService {
	return &OrganizationService{
		db:  db,
		cfg: cfg,
	}
}

// CreateOrganizationWithOwner creates a new organization and the owner user transactionally
func (s *OrganizationService) CreateOrganizationWithOwner(ctx context.Context, orgName, email, password string) (*models.OrganizationResponse, *models.UserResponse, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// 1. Create Organization
	orgID := uuid.New()
	org := &models.Organization{
		ID:        orgID,
		Name:      orgName,
		Timezone:  "Asia/Jakarta", // Default
		CreatedAt: time.Now(),
	}

	_, err = tx.Exec(ctx,
		`INSERT INTO organizations (id, name, timezone, created_at) VALUES ($1, $2, $3, $4)`,
		org.ID, org.Name, org.Timezone, org.CreatedAt,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create organization: %w", err)
	}

	// 2. Create User (Owner)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to hash password: %w", err)
	}

	userID := uuid.New()
	user := &models.User{
		ID:             userID,
		Email:          email,
		Name:           email, // Default name to email
		OrganizationID: &orgID,
		Role:           "owner",
		CreatedAt:      time.Now(),
	}

	_, err = tx.Exec(ctx,
		`INSERT INTO users (id, email, password_hash, name, organization_id, role, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		user.ID, user.Email, string(hashedPassword), user.Name, user.OrganizationID, user.Role, user.CreatedAt,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create user: %w", err)
	}

	// 3. Update Organization Owner
	_, err = tx.Exec(ctx,
		`UPDATE organizations SET owner_id = $1 WHERE id = $2`,
		user.ID, org.ID,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to update organization owner: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	org.OwnerID = &user.ID

	return &models.OrganizationResponse{
		ID:        org.ID,
		Name:      org.Name,
		HasAPIKey: false,
		CreatedAt: org.CreatedAt,
	}, user.ToResponse(), nil
}

// GetOrganization retrieves organization details
func (s *OrganizationService) GetOrganization(ctx context.Context, id uuid.UUID) (*models.OrganizationResponse, error) {
	var org models.Organization
	err := s.db.QueryRow(ctx,
		`SELECT id, name, owner_id, timezone, ai_api_key_encrypted, created_at FROM organizations WHERE id = $1`,
		id,
	).Scan(&org.ID, &org.Name, &org.OwnerID, &org.Timezone, &org.AIApiKeyEncrypted, &org.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get organization: %w", err)
	}

	// Get member count
	var memberCount int
	err = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE organization_id = $1`, id).Scan(&memberCount)
	if err != nil {
		return nil, fmt.Errorf("failed to get member count: %w", err)
	}

	return &models.OrganizationResponse{
		ID:          org.ID,
		Name:        org.Name,
		Timezone:    org.Timezone,
		HasAPIKey:   org.AIApiKeyEncrypted != "",
		MemberCount: memberCount,
		CreatedAt:   org.CreatedAt,
	}, nil
}

// AddMember adds a new member to the organization
func (s *OrganizationService) AddMember(ctx context.Context, orgID uuid.UUID, email, password, name, role string) (*models.MemberResponse, error) {
	// Validate role
	if role != "admin" && role != "member" {
		return nil, errors.New("invalid role")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	userID := uuid.New()
	createdAt := time.Now()

	_, err = s.db.Exec(ctx,
		`INSERT INTO users (id, email, password_hash, name, organization_id, role, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		userID, email, string(hashedPassword), name, orgID, role, createdAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create member: %w", err)
	}

	return &models.MemberResponse{
		ID:        userID,
		Email:     email,
		Name:      name,
		Role:      role,
		CreatedAt: createdAt,
	}, nil
}

// GetMembers retrieves all members of an organization
func (s *OrganizationService) GetMembers(ctx context.Context, orgID uuid.UUID) ([]*models.MemberResponse, error) {
	rows, err := s.db.Query(ctx,
		`SELECT id, email, name, role, created_at FROM users WHERE organization_id = $1 ORDER BY created_at DESC`,
		orgID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get members: %w", err)
	}
	defer rows.Close()

	var members []*models.MemberResponse
	for rows.Next() {
		var m models.MemberResponse
		if err := rows.Scan(&m.ID, &m.Email, &m.Name, &m.Role, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan member: %w", err)
		}
		members = append(members, &m)
	}

	return members, nil
}

// UpdateMember updates a member's details
func (s *OrganizationService) UpdateMember(ctx context.Context, orgID, memberID uuid.UUID, name, role string) (*models.MemberResponse, error) {
	// Validate role if provided
	if role != "" && role != "admin" && role != "member" {
		return nil, errors.New("invalid role")
	}

	// Build query
	query := `UPDATE users SET `
	args := []interface{}{}
	argIdx := 1

	if name != "" {
		query += fmt.Sprintf("name = $%d, ", argIdx)
		args = append(args, name)
		argIdx++
	}
	if role != "" {
		query += fmt.Sprintf("role = $%d, ", argIdx)
		args = append(args, role)
		argIdx++
	}

	// Remove trailing comma
	query = query[:len(query)-2]

	query += fmt.Sprintf(" WHERE id = $%d AND organization_id = $%d RETURNING id, email, name, role, created_at", argIdx, argIdx+1)
	args = append(args, memberID, orgID)

	var m models.MemberResponse
	err := s.db.QueryRow(ctx, query, args...).Scan(&m.ID, &m.Email, &m.Name, &m.Role, &m.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to update member: %w", err)
	}

	return &m, nil
}

// RemoveMember removes a member from the organization
// Admin cannot remove Owner or other Admins
// Owner can remove anyone except themselves (there must always be an owner)
func (s *OrganizationService) RemoveMember(ctx context.Context, orgID, memberID, requesterID uuid.UUID, requesterRole string) error {
	// Check if trying to remove owner
	var count int
	err := s.db.QueryRow(ctx, `SELECT COUNT(*) FROM organizations WHERE id = $1 AND owner_id = $2`, orgID, memberID).Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return errors.New("cannot remove organization owner")
	}

	// Admin cannot remove other admins
	if requesterRole == "admin" {
		var targetRole string
		err = s.db.QueryRow(ctx, `SELECT role FROM users WHERE id = $1 AND organization_id = $2`, memberID, orgID).Scan(&targetRole)
		if err != nil {
			return fmt.Errorf("failed to get member role: %w", err)
		}
		if targetRole == "admin" {
			return errors.New("admin cannot remove other admins")
		}
	}

	result, err := s.db.Exec(ctx, `DELETE FROM users WHERE id = $1 AND organization_id = $2`, memberID, orgID)
	if err != nil {
		return fmt.Errorf("failed to remove member: %w", err)
	}
	if result.RowsAffected() == 0 {
		return errors.New("member not found")
	}
	return nil
}

// SetAPIKey sets the AI API key for the organization
func (s *OrganizationService) SetAPIKey(ctx context.Context, orgID uuid.UUID, apiKey string) error {
	encrypted, iv, err := utils.EncryptSplit(apiKey, s.cfg.EncryptionKey)
	if err != nil {
		return fmt.Errorf("encryption failed: %w", err)
	}

	// We'll store IV in a separate column if we had one, but let's check schema/migration again.
	// Migration: ai_api_key_encrypted TEXT, ai_api_key_iv TEXT
	// Okay we have separate columns.

	_, err = s.db.Exec(ctx,
		`UPDATE organizations SET ai_api_key_encrypted = $1, ai_api_key_iv = $2 WHERE id = $3`,
		encrypted, iv, orgID,
	)
	if err != nil {
		return fmt.Errorf("failed to set API key: %w", err)
	}

	return nil
}

// RemoveAPIKey removes the AI API key for the organization
func (s *OrganizationService) RemoveAPIKey(ctx context.Context, orgID uuid.UUID) error {
	_, err := s.db.Exec(ctx,
		`UPDATE organizations SET ai_api_key_encrypted = NULL, ai_api_key_iv = NULL WHERE id = $1`,
		orgID,
	)
	if err != nil {
		return fmt.Errorf("failed to remove API key: %w", err)
	}
	return nil
}

// GetAPIKey retrieves detailed API key (decrypted)
func (s *OrganizationService) GetDecryptedAPIKey(ctx context.Context, orgID uuid.UUID) (string, error) {
	var encrypted, iv string
	err := s.db.QueryRow(ctx,
		`SELECT ai_api_key_encrypted, ai_api_key_iv FROM organizations WHERE id = $1`,
		orgID,
	).Scan(&encrypted, &iv)
	if err != nil {
		return "", fmt.Errorf("failed to get API key info: %w", err)
	}

	if encrypted == "" {
		return "", errors.New("API key not configured")
	}

	decrypted, err := utils.DecryptSplit(encrypted, iv, s.cfg.EncryptionKey)
	if err != nil {
		return "", fmt.Errorf("decryption failed: %w", err)
	}

	return decrypted, nil
}

func (s *OrganizationService) UpdateSettings(ctx context.Context, orgID uuid.UUID, name, timezone string) (*models.OrganizationResponse, error) {
	query := `UPDATE organizations SET `
	args := []interface{}{}
	argIdx := 1

	if name != "" {
		query += fmt.Sprintf("name = $%d, ", argIdx)
		args = append(args, name)
		argIdx++
	}
	if timezone != "" {
		query += fmt.Sprintf("timezone = $%d, ", argIdx)
		args = append(args, timezone)
		argIdx++
	}

	query = query[:len(query)-2] // remove trailing comma
	query += fmt.Sprintf(" WHERE id = $%d RETURNING id, name, owner_id, timezone, ai_api_key_encrypted, created_at", argIdx)
	args = append(args, orgID)

	var org models.Organization
	err := s.db.QueryRow(ctx, query, args...).Scan(&org.ID, &org.Name, &org.OwnerID, &org.Timezone, &org.AIApiKeyEncrypted, &org.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to update settings: %w", err)
	}

	// Get member count
	var memberCount int
	err = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE organization_id = $1`, orgID).Scan(&memberCount)
	if err != nil {
		return nil, fmt.Errorf("failed to get member count: %w", err)
	}

	return &models.OrganizationResponse{
		ID:          org.ID,
		Name:        org.Name,
		Timezone:    org.Timezone,
		HasAPIKey:   org.AIApiKeyEncrypted != "",
		MemberCount: memberCount,
		CreatedAt:   org.CreatedAt,
	}, nil
}

// GetOrganizationStats retrieves aggregated statistics for the organization
func (s *OrganizationService) GetOrganizationStats(ctx context.Context, orgID uuid.UUID, from, to time.Time) (*models.OrganizationStatsResponse, error) {
	// Default date range: today (UTC)
	if from.IsZero() {
		from = time.Now().UTC().Truncate(24 * time.Hour)
	}
	if to.IsZero() {
		to = from.Add(24 * time.Hour)
	}

	// Get member count
	var memberCount int
	err := s.db.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE organization_id = $1`, orgID).Scan(&memberCount)
	if err != nil {
		return nil, fmt.Errorf("failed to get member count: %w", err)
	}

	// Get total hours (activities count * 5 minutes / 60)
	var totalActivities int
	err = s.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM activities a
		 JOIN users u ON a.user_id = u.id
		 WHERE u.organization_id = $1 AND a.captured_at >= $2 AND a.captured_at < $3`,
		orgID, from, to,
	).Scan(&totalActivities)
	if err != nil {
		return nil, fmt.Errorf("failed to get total activities: %w", err)
	}

	totalHours := float64(totalActivities*5) / 60.0
	avgHoursPerMember := 0.0
	if memberCount > 0 {
		avgHoursPerMember = totalHours / float64(memberCount)
	}

	// Get breakdown by category
	rows, err := s.db.Query(ctx,
		`SELECT a.category, COUNT(*) as count
		 FROM activities a
		 JOIN users u ON a.user_id = u.id
		 WHERE u.organization_id = $1 AND a.captured_at >= $2 AND a.captured_at < $3
		 GROUP BY a.category`,
		orgID, from, to,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get category stats: %w", err)
	}
	defer rows.Close()

	byCategory := make(map[string]float64)
	totalCount := 0
	for rows.Next() {
		var category string
		var count int
		if err := rows.Scan(&category, &count); err != nil {
			return nil, fmt.Errorf("failed to scan category stat: %w", err)
		}
		totalCount += count
		byCategory[category] = float64(count)
	}

	// Convert to percentages
	for cat, count := range byCategory {
		if totalCount > 0 {
			byCategory[cat] = (count / float64(totalCount)) * 100
		}
	}

	return &models.OrganizationStatsResponse{
		TotalHours:        totalHours,
		AvgHoursPerMember: avgHoursPerMember,
		ByCategory:        byCategory,
		MemberCount:       memberCount,
	}, nil
}

// GetMembersSummary retrieves summary statistics for all members
func (s *OrganizationService) GetMembersSummary(ctx context.Context, orgID uuid.UUID, from, to time.Time) ([]*models.MemberSummaryResponse, error) {
	// Default date range: today (UTC)
	if from.IsZero() {
		from = time.Now().UTC().Truncate(24 * time.Hour)
	}
	if to.IsZero() {
		to = from.Add(24 * time.Hour)
	}

	// Get members with their activity counts
	rows, err := s.db.Query(ctx,
		`SELECT u.id, u.name, u.role,
		  COUNT(a.id) as activity_count,
		  MIN(DATE_TRUNC('hour', a.captured_at)) as active_from,
		  MAX(DATE_TRUNC('hour', a.captured_at)) as active_to
		 FROM users u
		 LEFT JOIN activities a ON u.id = a.user_id AND a.captured_at >= $2 AND a.captured_at < $3
		 WHERE u.organization_id = $1
		 GROUP BY u.id, u.name, u.role
		 ORDER BY u.created_at DESC`,
		orgID, from, to,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get members summary: %w", err)
	}
	defer rows.Close()

	var summaries []*models.MemberSummaryResponse
	for rows.Next() {
		var m models.MemberSummaryResponse
		var activityCount int
		var activeFrom, activeTo *time.Time

		err := rows.Scan(&m.ID, &m.Name, &m.Role, &activityCount, &activeFrom, &activeTo)
		if err != nil {
			return nil, fmt.Errorf("failed to scan member summary: %w", err)
		}

		// Calculate hours (5 minutes per activity)
		m.TotalHours = float64(activityCount*5) / 60.0

		if activeFrom != nil {
			m.ActiveFrom = activeFrom.Format("15:04")
		}
		if activeTo != nil {
			m.ActiveTo = activeTo.Format("15:04")
		}

		summaries = append(summaries, &m)
	}

	return summaries, nil
}

// GetMemberActivities retrieves activities for a specific member (Owner/Admin only)
func (s *OrganizationService) GetMemberActivities(ctx context.Context, orgID, memberID uuid.UUID, from, to time.Time, page, perPage int) ([]*models.Activity, int, error) {
	// Verify member belongs to org
	var count int
	err := s.db.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE id = $1 AND organization_id = $2`, memberID, orgID).Scan(&count)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to verify member: %w", err)
	}
	if count == 0 {
		return nil, 0, errors.New("member not found in organization")
	}

	// Default date range: today (UTC)
	if from.IsZero() {
		from = time.Now().UTC().Truncate(24 * time.Hour)
	}
	if to.IsZero() {
		to = from.Add(24 * time.Hour)
	}

	// Pagination
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	// Count total
	var total int
	err = s.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM activities WHERE user_id = $1 AND captured_at >= $2 AND captured_at < $3`,
		memberID, from, to,
	).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count activities: %w", err)
	}

	// Get activities
	offset := (page - 1) * perPage
	rows, err := s.db.Query(ctx,
		`SELECT id, user_id, captured_at, app_name, window_title, category, summary, ai_status, created_at
		 FROM activities
		 WHERE user_id = $1 AND captured_at >= $2 AND captured_at < $3
		 ORDER BY captured_at DESC
		 LIMIT $4 OFFSET $5`,
		memberID, from, to, perPage, offset,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query activities: %w", err)
	}
	defer rows.Close()

	var activities []*models.Activity
	for rows.Next() {
		a := &models.Activity{}
		err := rows.Scan(&a.ID, &a.UserID, &a.CapturedAt, &a.AppName, &a.WindowTitle,
			&a.Category, &a.Summary, &a.AIStatus, &a.CreatedAt)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan activity: %w", err)
		}
		activities = append(activities, a)
	}

	return activities, total, nil
}

// GetMemberStats retrieves statistics for a specific member
func (s *OrganizationService) GetMemberStats(ctx context.Context, orgID, memberID uuid.UUID, from, to time.Time) (*models.ActivityStats, error) {
	// Verify member belongs to org
	var count int
	err := s.db.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE id = $1 AND organization_id = $2`, memberID, orgID).Scan(&count)
	if err != nil {
		return nil, fmt.Errorf("failed to verify member: %w", err)
	}
	if count == 0 {
		return nil, errors.New("member not found in organization")
	}

	// Default date range: today (UTC)
	if from.IsZero() {
		from = time.Now().UTC().Truncate(24 * time.Hour)
	}
	if to.IsZero() {
		to = from.Add(24 * time.Hour)
	}

	rows, err := s.db.Query(ctx,
		`SELECT category, COUNT(*) as count
		 FROM activities
		 WHERE user_id = $1 AND captured_at >= $2 AND captured_at < $3
		 GROUP BY category`,
		memberID, from, to,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query stats: %w", err)
	}
	defer rows.Close()

	stats := &models.ActivityStats{
		ByCategory: make(map[string]models.CategoryStat),
	}

	totalCount := 0
	for rows.Next() {
		var category string
		var count int
		if err := rows.Scan(&category, &count); err != nil {
			return nil, fmt.Errorf("failed to scan stat row: %w", err)
		}
		totalCount += count
		stats.ByCategory[category] = models.CategoryStat{
			Count:   count,
			Minutes: count * 5,
		}
	}

	stats.TotalMinutes = totalCount * 5
	stats.TotalHours = float64(stats.TotalMinutes) / 60

	// Calculate percentages
	for cat, stat := range stats.ByCategory {
		if totalCount > 0 {
			stat.Percentage = float64(stat.Count) / float64(totalCount) * 100
		}
		stats.ByCategory[cat] = stat
	}

	return stats, nil
}

// GetActivityHeatmap retrieves activity heatmap data for a date
func (s *OrganizationService) GetActivityHeatmap(ctx context.Context, orgID uuid.UUID, date time.Time) (*models.HeatmapResponse, error) {
	// Default to today
	if date.IsZero() {
		date = time.Now().UTC()
	}
	from := date.Truncate(24 * time.Hour)
	to := from.Add(24 * time.Hour)

	// Get all members
	members, err := s.GetMembers(ctx, orgID)
	if err != nil {
		return nil, fmt.Errorf("failed to get members: %w", err)
	}

	// Build heatmap data
	var heatmapMembers []models.HeatmapMemberResponse
	for _, m := range members {
		rows, err := s.db.Query(ctx,
			`SELECT EXTRACT(HOUR FROM captured_at) as hour, COUNT(*) as count
			 FROM activities
			 WHERE user_id = $1 AND captured_at >= $2 AND captured_at < $3
			 GROUP BY EXTRACT(HOUR FROM captured_at)
			 ORDER BY hour`,
			m.ID, from, to,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to get heatmap data for member %s: %w", m.ID, err)
		}

		hours := make(map[string]int)
		for rows.Next() {
			var hour float64
			var count int
			if err := rows.Scan(&hour, &count); err != nil {
				rows.Close()
				return nil, fmt.Errorf("failed to scan heatmap row: %w", err)
			}
			hours[fmt.Sprintf("%.0f", hour)] = count
		}
		rows.Close()

		heatmapMembers = append(heatmapMembers, models.HeatmapMemberResponse{
			ID:    m.ID,
			Name:  m.Name,
			Hours: hours,
		})
	}

	return &models.HeatmapResponse{
		Date:    from.Format("2006-01-02"),
		Members: heatmapMembers,
	}, nil
}
