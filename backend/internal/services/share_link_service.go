// [
package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/timetrack/backend/internal/models"
)

var (
	ErrLinkNotFound = errors.New("shared link not found")
)

type ShareLinkService struct {
	db *pgxpool.Pool
}

func NewShareLinkService(db *pgxpool.Pool) *ShareLinkService {
	return &ShareLinkService{db: db}
}

func (s *ShareLinkService) Create(ctx context.Context, userID uuid.UUID, input *models.CreateSharedLinkInput) (*models.SharedLink, error) {
	slug, err := generateRandomSlug(12)
	if err != nil {
		return nil, fmt.Errorf("failed to generate slug: %w", err)
	}

	link := &models.SharedLink{}
	err = s.db.QueryRow(ctx,
		`INSERT INTO shared_links (user_id, slug, name, expires_at, is_public)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, user_id, slug, name, expires_at, is_public, created_at, views`,
		userID, slug, input.Name, input.ExpiresAt, input.IsPublic,
	).Scan(
		&link.ID, &link.UserID, &link.Slug, &link.Name, &link.ExpiresAt, &link.IsPublic, &link.CreatedAt, &link.Views,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to insert shared link: %w", err)
	}

	return link, nil
}

func (s *ShareLinkService) GetBySlug(ctx context.Context, slug string) (*models.SharedLink, error) {
	link := &models.SharedLink{}
	err := s.db.QueryRow(ctx,
		`UPDATE shared_links SET views = views + 1 
		 WHERE slug = $1 AND (expires_at IS NULL OR expires_at > NOW())
		 RETURNING id, user_id, slug, name, expires_at, is_public, created_at, views`,
		slug,
	).Scan(
		&link.ID, &link.UserID, &link.Slug, &link.Name, &link.ExpiresAt, &link.IsPublic, &link.CreatedAt, &link.Views,
	)

	if err != nil {
		return nil, ErrLinkNotFound
	}

	return link, nil
}

func (s *ShareLinkService) ListByUser(ctx context.Context, userID uuid.UUID) ([]*models.SharedLink, error) {
	rows, err := s.db.Query(ctx,
		`SELECT id, user_id, slug, name, expires_at, is_public, created_at, views
		 FROM shared_links WHERE user_id = $1 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var links []*models.SharedLink
	for rows.Next() {
		link := &models.SharedLink{}
		err := rows.Scan(
			&link.ID, &link.UserID, &link.Slug, &link.Name, &link.ExpiresAt, &link.IsPublic, &link.CreatedAt, &link.Views,
		)
		if err != nil {
			return nil, err
		}
		links = append(links, link)
	}

	return links, nil
}

func (s *ShareLinkService) Delete(ctx context.Context, userID, linkID uuid.UUID) error {
	result, err := s.db.Exec(ctx,
		"DELETE FROM shared_links WHERE id = $1 AND user_id = $2",
		linkID, userID,
	)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrLinkNotFound
	}
	return nil
}

func generateRandomSlug(n int) (string, error) {
	bytes := make([]byte, n/2)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
