// backend/internal/services/auth_service.go
package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/timetrack/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound    = errors.New("user not found")
	ErrInvalidPassword = errors.New("invalid password")
	ErrEmailExists     = errors.New("email already exists")
	ErrInvalidToken    = errors.New("invalid or expired token")
)

type AuthService struct {
	db         *pgxpool.Pool
	orgService *OrganizationService
}

func NewAuthService(db *pgxpool.Pool) *AuthService {
	return &AuthService{db: db}
}

// SetOrganizationService sets the organization service
func (s *AuthService) SetOrganizationService(os *OrganizationService) {
	s.orgService = os
}

func (s *AuthService) Register(ctx context.Context, input *models.CreateUserInput) (*models.User, error) {
	// Check if email exists
	var exists bool
	err := s.db.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", input.Email).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrEmailExists
	}

	// Create Organization with Owner using OrganizationService
	if s.orgService == nil {
		return nil, errors.New("organization service not initialized")
	}

	// Default organization name to "My Organization" or user's name + "Org"
	orgName := input.Name
	if orgName == "" {
		orgName = "My Organization"
	} else {
		orgName += "'s Organization"
	}

	// Transactional creation of Org + Owner
	// Note: CreateOrganizationWithOwner returns UserResponse, but we need User model here for consistency with existing signature
	// Modifying signature or mapping back
	_, userResponse, err := s.orgService.CreateOrganizationWithOwner(ctx, orgName, input.Email, input.Password)
	if err != nil {
		return nil, err
	}

	// Map UserResponse back to User (limited fields needed for response)
	user := &models.User{
		ID:        userResponse.ID,
		Email:     userResponse.Email,
		Name:      userResponse.Name,
		Role:      userResponse.Role,
		CreatedAt: userResponse.CreatedAt,
	}

	return user, nil
}

func (s *AuthService) Login(ctx context.Context, input *models.LoginInput) (*models.User, string, error) {
	// Find user by email
	user := &models.User{}
	err := s.db.QueryRow(ctx,
		`SELECT id, email, password_hash, name, organization_id, role, created_at FROM users WHERE email = $1`,
		input.Email,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.OrganizationID, &user.Role, &user.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, "", ErrUserNotFound
		}
		return nil, "", err
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, "", ErrInvalidPassword
	}

	// Generate session token
	token, err := generateToken()
	if err != nil {
		return nil, "", err
	}

	// Create session (expires in 7 days)
	expiresAt := time.Now().Add(7 * 24 * time.Hour)
	_, err = s.db.Exec(ctx,
		`INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)`,
		user.ID, token, expiresAt,
	)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *AuthService) Logout(ctx context.Context, token string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM sessions WHERE token = $1`, token)
	return err
}

func (s *AuthService) ValidateToken(ctx context.Context, token string) (*models.User, error) {
	user := &models.User{}
	err := s.db.QueryRow(ctx,
		`SELECT u.id, u.email, u.password_hash, u.name, u.organization_id, u.role, u.created_at
		 FROM users u
		 JOIN sessions s ON s.user_id = u.id
		 WHERE s.token = $1 AND s.expires_at > NOW()`,
		token,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.OrganizationID, &user.Role, &user.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInvalidToken
		}
		return nil, err
	}

	return user, nil
}

func (s *AuthService) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user := &models.User{}
	err := s.db.QueryRow(ctx,
		`SELECT id, email, password_hash, name, organization_id, role, created_at FROM users WHERE id = $1`,
		id,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.OrganizationID, &user.Role, &user.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return user, nil
}

func (s *AuthService) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	user := &models.User{}
	err := s.db.QueryRow(ctx,
		`SELECT id, email, password_hash, name, organization_id, role, created_at FROM users WHERE email = $1`,
		email,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.OrganizationID, &user.Role, &user.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return user, nil
}

func generateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// UpdatePassword updates the user's password
func (s *AuthService) UpdatePassword(ctx context.Context, userID uuid.UUID, oldPassword, newPassword string) error {
	var currentPasswordHash string
	err := s.db.QueryRow(ctx, "SELECT password_hash FROM users WHERE id = $1", userID).Scan(&currentPasswordHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrUserNotFound
		}
		return err
	}

	// Verify old password
	if err := bcrypt.CompareHashAndPassword([]byte(currentPasswordHash), []byte(oldPassword)); err != nil {
		return ErrInvalidPassword
	}

	// Hash new password
	newHashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Update password
	_, err = s.db.Exec(ctx, "UPDATE users SET password_hash = $1 WHERE id = $2", string(newHashedPassword), userID)
	return err
}
