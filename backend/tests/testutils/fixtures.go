// backend/tests/testutils/fixtures.go
package testutils

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/timetrack/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

const TestPassword = "TestPassword123!"

type TestFixtures struct {
	DB           *pgxpool.Pool
	Organization *models.Organization
	Owner        *models.User
	Admin        *models.User
	Member       *models.User
	OwnerToken   string
	AdminToken   string
	MemberToken  string
	Activities   []*models.Activity
	SharedLink   *models.SharedLink
}

// SetupFixtures creates test fixtures in the database
func SetupFixtures(ctx context.Context, db *pgxpool.Pool) (*TestFixtures, error) {
	f := &TestFixtures{DB: db}

	// Clean up any existing data first
	if err := CleanupTestDB(ctx, db); err != nil {
		return nil, fmt.Errorf("failed to cleanup before setup: %w", err)
	}

	// 1. Create Organization
	orgID := uuid.New()
	now := time.Now()
	_, err := db.Exec(ctx,
		`INSERT INTO organizations (id, name, timezone, created_at) VALUES ($1, $2, $3, $4)`,
		orgID, "Test Organization", "Asia/Jakarta", now,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create organization: %w", err)
	}
	f.Organization = &models.Organization{ID: orgID, Name: "Test Organization", Timezone: "Asia/Jakarta"}

	// 2. Create Users
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(TestPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Owner
	f.Owner = createUser(ctx, db, "owner@test.com", string(hashedPassword), "Test Owner", orgID, "owner", now)

	// Update org owner
	_, err = db.Exec(ctx, `UPDATE organizations SET owner_id = $1 WHERE id = $2`, f.Owner.ID, orgID)
	if err != nil {
		return nil, fmt.Errorf("failed to update org owner: %w", err)
	}
	f.Organization.OwnerID = &f.Owner.ID

	// Admin
	f.Admin = createUser(ctx, db, "admin@test.com", string(hashedPassword), "Test Admin", orgID, "admin", now)

	// Member
	f.Member = createUser(ctx, db, "member@test.com", string(hashedPassword), "Test Member", orgID, "member", now)

	// 3. Create Sessions (Tokens)
	f.OwnerToken = createSession(ctx, db, f.Owner.ID, now)
	f.AdminToken = createSession(ctx, db, f.Admin.ID, now)
	f.MemberToken = createSession(ctx, db, f.Member.ID, now)

	// 4. Create Sample Activities (10 activities for member)
	f.Activities = createSampleActivities(ctx, db, f.Member.ID, 10, now)

	// 5. Create Sample SharedLink
	f.SharedLink = createSharedLink(ctx, db, f.Member.ID, now)

	return f, nil
}

// Cleanup removes all test data from the database
func (f *TestFixtures) Cleanup(ctx context.Context) {
	CleanupTestDB(ctx, f.DB)
}

// CreateUser creates a new user with unique email for isolation
func (f *TestFixtures) CreateUser(ctx context.Context, role string) (*models.User, string, error) {
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(TestPassword), bcrypt.DefaultCost)
	uniqueID := uuid.New().String()[:8]
	email := fmt.Sprintf("user-%s@test.com", uniqueID)

	user := createUser(ctx, f.DB, email, string(hashedPassword), fmt.Sprintf("Test User %s", uniqueID), f.Organization.ID, role, time.Now())
	token := createSession(ctx, f.DB, user.ID, time.Now())

	return user, token, nil
}

// CreateActivity creates a new activity for a user
func (f *TestFixtures) CreateActivity(ctx context.Context, userID uuid.UUID, category string) (*models.Activity, error) {
	return createActivity(ctx, f.DB, userID, category, time.Now())
}

// ResetActivities removes and recreates activities for the member user
func (f *TestFixtures) ResetActivities(ctx context.Context, count int) error {
	_, err := f.DB.Exec(ctx, "DELETE FROM activities WHERE user_id = $1", f.Member.ID)
	if err != nil {
		return err
	}
	f.Activities = createSampleActivities(ctx, f.DB, f.Member.ID, count, time.Now())
	return nil
}

// createUser inserts a user into the database
func createUser(ctx context.Context, db *pgxpool.Pool, email, passwordHash, name string, orgID uuid.UUID, role string, createdAt time.Time) *models.User {
	userID := uuid.New()
	db.Exec(ctx,
		`INSERT INTO users (id, email, password_hash, name, organization_id, role, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		userID, email, passwordHash, name, orgID, role, createdAt,
	)
	return &models.User{
		ID:           userID,
		Email:        email,
		Name:         name,
		OrganizationID: &orgID,
		Role:         role,
		CreatedAt:    createdAt,
	}
}

// createSession inserts a session into the database
func createSession(ctx context.Context, db *pgxpool.Pool, userID uuid.UUID, now time.Time) string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	token := hex.EncodeToString(bytes)
	expiresAt := now.Add(7 * 24 * time.Hour)

	sessionID := uuid.New()
	db.Exec(ctx,
		`INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES ($1, $2, $3, $4, $5)`,
		sessionID, userID, token, expiresAt, now,
	)
	return token
}

// createSampleActivities creates sample activities for testing
func createSampleActivities(ctx context.Context, db *pgxpool.Pool, userID uuid.UUID, count int, now time.Time) []*models.Activity {
	categories := []string{"coding", "meeting", "browsing", "documentation", "debugging"}
	appNames := []string{"VS Code", "Chrome", "Zoom", "Notion", "Terminal"}
	windowTitles := []string{"main.go", "TimeTrack Dashboard", "Weekly Standup", "Project Docs", "Running tests"}

	activities := make([]*models.Activity, count)

	for i := 0; i < count; i++ {
		activityID := uuid.New()
		capturedAt := now.Add(-time.Duration(i*5) * time.Minute)
		category := categories[i%len(categories)]

		db.Exec(ctx,
			`INSERT INTO activities (id, user_id, captured_at, app_name, window_title, category, summary, ai_status, created_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			activityID, userID, capturedAt, appNames[i%len(appNames)], windowTitles[i%len(windowTitles)], category,
			"Working on test implementation", "success", now,
		)
		activities[i] = &models.Activity{
			ID:         activityID,
			UserID:     userID,
			CapturedAt: capturedAt,
			AppName:    appNames[i%len(appNames)],
			Category:   category,
			Summary:    "Working on test implementation",
			AIStatus:   "success",
		}
	}
	return activities
}

// createActivity creates a single activity
func createActivity(ctx context.Context, db *pgxpool.Pool, userID uuid.UUID, category string, now time.Time) (*models.Activity, error) {
	activityID := uuid.New()
	capturedAt := now

	_, err := db.Exec(ctx,
		`INSERT INTO activities (id, user_id, captured_at, app_name, window_title, category, summary, ai_status, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		activityID, userID, capturedAt, "Test App", "Test Window", category,
		"Test activity summary", "success", now,
	)
	if err != nil {
		return nil, err
	}

	return &models.Activity{
		ID:         activityID,
		UserID:     userID,
		CapturedAt: capturedAt,
		AppName:    "Test App",
		Category:   category,
		Summary:    "Test activity summary",
		AIStatus:   "success",
	}, nil
}

// createSharedLink creates a shared link for testing
func createSharedLink(ctx context.Context, db *pgxpool.Pool, userID uuid.UUID, now time.Time) *models.SharedLink {
	linkID := uuid.New()
	slug := fmt.Sprintf("test-%s", uuid.New().String()[:8])
	expiresAt := now.Add(24 * time.Hour)

	db.Exec(ctx,
		`INSERT INTO shared_links (id, user_id, slug, name, expires_at, is_public, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		linkID, userID, slug, "Test Share", &expiresAt, true, now,
	)
	return &models.SharedLink{
		ID:        linkID,
		UserID:    userID,
		Slug:      slug,
		Name:      "Test Share",
		ExpiresAt: &expiresAt,
		IsPublic:  true,
	}
}
