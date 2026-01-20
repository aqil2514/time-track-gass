// backend/internal/services/share_service.go
package services

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/timetrack/backend/internal/models"
)

var (
	ErrShareExists    = errors.New("share already exists")
	ErrShareNotFound  = errors.New("share not found")
	ErrCannotShareSelf = errors.New("cannot share with yourself")
	ErrNotAuthorized  = errors.New("not authorized to view this user's activity")
)

type ShareService struct {
	db          *pgxpool.Pool
	authService *AuthService
}

func NewShareService(db *pgxpool.Pool, authService *AuthService) *ShareService {
	return &ShareService{db: db, authService: authService}
}

func (s *ShareService) Create(ctx context.Context, ownerID uuid.UUID, viewerEmail string) (*models.Share, error) {
	// Find viewer by email
	viewer, err := s.authService.GetUserByEmail(ctx, viewerEmail)
	if err != nil {
		return nil, err
	}

	if ownerID == viewer.ID {
		return nil, ErrCannotShareSelf
	}

	// Check if share already exists
	var exists bool
	err = s.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM shares WHERE owner_id = $1 AND viewer_id = $2)`,
		ownerID, viewer.ID,
	).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrShareExists
	}

	// Create share
	share := &models.Share{}
	err = s.db.QueryRow(ctx,
		`INSERT INTO shares (owner_id, viewer_id) VALUES ($1, $2)
		 RETURNING id, owner_id, viewer_id, created_at`,
		ownerID, viewer.ID,
	).Scan(&share.ID, &share.OwnerID, &share.ViewerID, &share.CreatedAt)
	if err != nil {
		return nil, err
	}

	return share, nil
}

func (s *ShareService) GetViewers(ctx context.Context, ownerID uuid.UUID) ([]*models.ShareWithUser, error) {
	rows, err := s.db.Query(ctx,
		`SELECT s.id, s.owner_id, s.viewer_id, s.created_at,
		        u.id, u.email, u.name, u.created_at
		 FROM shares s
		 JOIN users u ON u.id = s.viewer_id
		 WHERE s.owner_id = $1
		 ORDER BY s.created_at DESC`,
		ownerID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var shares []*models.ShareWithUser
	for rows.Next() {
		share := &models.ShareWithUser{User: &models.UserResponse{}}
		err := rows.Scan(
			&share.ID, &share.OwnerID, &share.ViewerID, &share.CreatedAt,
			&share.User.ID, &share.User.Email, &share.User.Name, &share.User.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		shares = append(shares, share)
	}

	return shares, nil
}

func (s *ShareService) GetWatching(ctx context.Context, viewerID uuid.UUID) ([]*models.ShareWithUser, error) {
	rows, err := s.db.Query(ctx,
		`SELECT s.id, s.owner_id, s.viewer_id, s.created_at,
		        u.id, u.email, u.name, u.created_at
		 FROM shares s
		 JOIN users u ON u.id = s.owner_id
		 WHERE s.viewer_id = $1
		 ORDER BY s.created_at DESC`,
		viewerID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var shares []*models.ShareWithUser
	for rows.Next() {
		share := &models.ShareWithUser{User: &models.UserResponse{}}
		err := rows.Scan(
			&share.ID, &share.OwnerID, &share.ViewerID, &share.CreatedAt,
			&share.User.ID, &share.User.Email, &share.User.Name, &share.User.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		shares = append(shares, share)
	}

	return shares, nil
}

func (s *ShareService) Delete(ctx context.Context, ownerID, shareID uuid.UUID) error {
	result, err := s.db.Exec(ctx,
		`DELETE FROM shares WHERE id = $1 AND owner_id = $2`,
		shareID, ownerID,
	)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return ErrShareNotFound
	}

	return nil
}

func (s *ShareService) CanView(ctx context.Context, viewerID, ownerID uuid.UUID) (bool, error) {
	// User can always view their own activity
	if viewerID == ownerID {
		return true, nil
	}

	var exists bool
	err := s.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM shares WHERE owner_id = $1 AND viewer_id = $2)`,
		ownerID, viewerID,
	).Scan(&exists)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}

	return exists, nil
}
