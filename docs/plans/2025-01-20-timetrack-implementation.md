# TimeTrack Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a personal time tracking app with AI-powered screenshot analysis and supervisor sharing capabilities.

**Architecture:** Three-tier architecture with Tauri desktop app (screenshot capture + local dashboard), Go backend API (auth, activity, sharing, AI proxy), and React web dashboard (supervisor view). PostgreSQL with TimescaleDB for time-series activity data.

**Tech Stack:** Tauri 2.0, React 18, shadcn/ui, Go 1.21+, Gin, PostgreSQL 16, TimescaleDB, Z.AI API (GLM 4.6V)

---

## Phase 1: Project Setup & Infrastructure

### Task 1.1: Create Monorepo Structure

**Files:**
- Create: `package.json` (root workspace)
- Create: `.gitignore`
- Create: `README.md`

**Step 1: Initialize git repository**

```bash
cd D:/temp/timetrack
git init
```

**Step 2: Create root package.json for pnpm workspace**

```json
{
  "name": "timetrack",
  "private": true,
  "scripts": {
    "dev:backend": "cd backend && go run .",
    "dev:web": "cd web && pnpm dev",
    "dev:desktop": "cd desktop && pnpm tauri dev"
  }
}
```

**Step 3: Create pnpm-workspace.yaml**

```yaml
packages:
  - 'desktop'
  - 'web'
  - 'shared'
```

**Step 4: Create .gitignore**

```gitignore
# Dependencies
node_modules/
vendor/

# Build outputs
dist/
target/
build/
*.exe

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Database
*.db
*.sqlite
```

**Step 5: Create folder structure**

```bash
mkdir -p backend/cmd/api
mkdir -p backend/internal/{handlers,models,services,middleware,config}
mkdir -p backend/migrations
mkdir -p desktop
mkdir -p web
mkdir -p shared
mkdir -p docker
```

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: initialize monorepo structure

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 1.2: Setup Docker Compose for PostgreSQL + TimescaleDB

**Files:**
- Create: `docker/docker-compose.yml`
- Create: `docker/.env.example`

**Step 1: Create docker-compose.yml**

```yaml
version: '3.8'

services:
  db:
    image: timescale/timescaledb:latest-pg16
    container_name: timetrack-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-timetrack}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-timetrack123}
      POSTGRES_DB: ${POSTGRES_DB:-timetrack}
    volumes:
      - timetrack-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U timetrack"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  timetrack-db-data:
```

**Step 2: Create .env.example**

```env
POSTGRES_USER=timetrack
POSTGRES_PASSWORD=timetrack123
POSTGRES_DB=timetrack
```

**Step 3: Copy .env.example to .env**

```bash
cp docker/.env.example docker/.env
```

**Step 4: Start database**

```bash
cd docker && docker-compose up -d
```

**Step 5: Verify database is running**

```bash
docker-compose ps
```

Expected: `timetrack-db` status is `Up (healthy)`

**Step 6: Commit**

```bash
git add docker/
git commit -m "chore: add docker-compose for TimescaleDB

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 1.3: Create Database Migrations

**Files:**
- Create: `backend/migrations/001_init.up.sql`
- Create: `backend/migrations/001_init.down.sql`

**Step 1: Create up migration**

```sql
-- backend/migrations/001_init.up.sql

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities table (will be converted to hypertable)
CREATE TABLE activities (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    captured_at TIMESTAMPTZ NOT NULL,
    app_name VARCHAR(100),
    window_title VARCHAR(500),
    category VARCHAR(50),
    summary VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, captured_at)
);

-- Convert to hypertable
SELECT create_hypertable('activities', 'captured_at',
    chunk_time_interval => INTERVAL '1 week'
);

-- Enable compression
ALTER TABLE activities SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'user_id',
    timescaledb.compress_orderby = 'captured_at DESC'
);

-- Add compression policy (compress chunks older than 1 month)
SELECT add_compression_policy('activities', INTERVAL '1 month');

-- Add retention policy (delete data older than 1 year)
SELECT add_retention_policy('activities', INTERVAL '1 year');

-- Shares table
CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_id, viewer_id)
);

-- Shared Links
CREATE TABLE shared_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    expires_at TIMESTAMPTZ,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    views INT DEFAULT 0
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activities_user ON activities (user_id, captured_at DESC);
CREATE INDEX idx_activities_category ON activities (user_id, category);
CREATE INDEX idx_shares_owner ON shares (owner_id);
CREATE INDEX idx_shares_viewer ON shares (viewer_id);
CREATE INDEX idx_sessions_expires ON sessions (expires_at);
CREATE INDEX idx_sessions_token ON sessions (token);

-- Continuous Aggregate for daily summary
CREATE MATERIALIZED VIEW daily_summary
WITH (timescaledb.continuous) AS
SELECT
    user_id,
    time_bucket('1 day', captured_at) AS day,
    category,
    COUNT(*) as activity_count,
    COUNT(*) * 5 as total_minutes
FROM activities
GROUP BY user_id, day, category;

-- Add refresh policy for continuous aggregate
SELECT add_continuous_aggregate_policy('daily_summary',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
);
```

**Step 2: Create down migration**

```sql
-- backend/migrations/001_init.down.sql

DROP MATERIALIZED VIEW IF EXISTS daily_summary;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS shares;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS users;
```

**Step 3: Run migration manually (for now)**

```bash
docker exec -i timetrack-db psql -U timetrack -d timetrack < backend/migrations/001_init.up.sql
```

**Step 4: Verify tables created**

```bash
docker exec -it timetrack-db psql -U timetrack -d timetrack -c "\dt"
```

Expected: users, activities, shares, sessions tables listed

**Step 5: Commit**

```bash
git add backend/migrations/
git commit -m "feat: add database migrations for TimescaleDB

- Users, activities, shares, sessions tables
- Hypertable with compression and retention policies
- Continuous aggregate for daily summary

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 2: Backend API (Go + Gin)

### Task 2.1: Initialize Go Module

**Files:**
- Create: `backend/go.mod`
- Create: `backend/go.sum`

**Step 1: Initialize go module**

```bash
cd backend
go mod init github.com/timetrack/backend
```

**Step 2: Add dependencies**

```bash
go get github.com/gin-gonic/gin
go get github.com/jackc/pgx/v5
go get github.com/golang-jwt/jwt/v5
go get github.com/google/uuid
go get golang.org/x/crypto
go get github.com/joho/godotenv
```

**Step 3: Verify go.mod**

```bash
cat go.mod
```

**Step 4: Commit**

```bash
cd ..
git add backend/go.mod backend/go.sum
git commit -m "chore: initialize go module with dependencies

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.2: Create Config Package

**Files:**
- Create: `backend/internal/config/config.go`
- Create: `backend/.env.example`

**Step 1: Create config.go**

```go
// backend/internal/config/config.go
package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string
	ZAIAPIKey   string
	ZAIBaseURL  string
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://timetrack:timetrack123@localhost:5432/timetrack?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		ZAIAPIKey:   getEnv("ZAI_API_KEY", ""),
		ZAIBaseURL:  getEnv("ZAI_BASE_URL", "https://api.z.ai/v1"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}
```

**Step 2: Create .env.example**

```env
PORT=8080
DATABASE_URL=postgres://timetrack:timetrack123@localhost:5432/timetrack?sslmode=disable
JWT_SECRET=your-secret-key-change-in-production
ZAI_API_KEY=your-zai-api-key
ZAI_BASE_URL=https://api.z.ai/v1
```

**Step 3: Copy to .env**

```bash
cp backend/.env.example backend/.env
```

**Step 4: Commit**

```bash
git add backend/internal/config/ backend/.env.example
git commit -m "feat: add config package for environment variables

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.3: Create Database Connection

**Files:**
- Create: `backend/internal/database/db.go`

**Step 1: Create db.go**

```go
// backend/internal/database/db.go
package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var pool *pgxpool.Pool

func Connect(databaseURL string) error {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return fmt.Errorf("failed to parse database URL: %w", err)
	}

	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err = pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return fmt.Errorf("failed to create connection pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	return nil
}

func GetPool() *pgxpool.Pool {
	return pool
}

func Close() {
	if pool != nil {
		pool.Close()
	}
}
```

**Step 2: Commit**

```bash
git add backend/internal/database/
git commit -m "feat: add database connection pool

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.4: Create User Model

**Files:**
- Create: `backend/internal/models/user.go`

**Step 1: Create user.go**

```go
// backend/internal/models/user.go
package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Name         string    `json:"name,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

type CreateUserInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Name     string `json:"name"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type UserResponse struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

func (u *User) ToResponse() *UserResponse {
	return &UserResponse{
		ID:        u.ID,
		Email:     u.Email,
		Name:      u.Name,
		CreatedAt: u.CreatedAt,
	}
}
```

**Step 2: Commit**

```bash
git add backend/internal/models/user.go
git commit -m "feat: add user model

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.5: Create Activity Model

**Files:**
- Create: `backend/internal/models/activity.go`

**Step 1: Create activity.go**

```go
// backend/internal/models/activity.go
package models

import (
	"time"

	"github.com/google/uuid"
)

type Activity struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	CapturedAt  time.Time `json:"captured_at"`
	AppName     string    `json:"app_name"`
	WindowTitle string    `json:"window_title"`
	Category    string    `json:"category"`
	Summary     string    `json:"summary"`
	CreatedAt   time.Time `json:"created_at"`
}

type UploadActivityInput struct {
	Image      string    `json:"image" binding:"required"` // base64 encoded
	CapturedAt time.Time `json:"captured_at"`
}

type ActivityListInput struct {
	From     time.Time `form:"from"`
	To       time.Time `form:"to"`
	Category string    `form:"category"`
	Page     int       `form:"page,default=1"`
	PerPage  int       `form:"per_page,default=20"`
}

type ActivityStats struct {
	TotalMinutes int                    `json:"total_minutes"`
	TotalHours   float64                `json:"total_hours"`
	ByCategory   map[string]CategoryStat `json:"by_category"`
}

type CategoryStat struct {
	Minutes    int     `json:"minutes"`
	Percentage float64 `json:"percentage"`
	Count      int     `json:"count"`
}

type DailySummary struct {
	Day           time.Time `json:"day"`
	Category      string    `json:"category"`
	ActivityCount int       `json:"activity_count"`
	TotalMinutes  int       `json:"total_minutes"`
}
```

**Step 2: Commit**

```bash
git add backend/internal/models/activity.go
git commit -m "feat: add activity model

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.6: Create Share Model

**Files:**
- Create: `backend/internal/models/share.go`

**Step 1: Create share.go**

```go
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
	ID        uuid.UUID `json:"id"`
	OwnerID   uuid.UUID `json:"owner_id"`
	ViewerID  uuid.UUID `json:"viewer_id"`
	CreatedAt time.Time `json:"created_at"`
	User      *UserResponse `json:"user"` // Owner or Viewer depending on context
}

type CreateShareInput struct {
	Email string `json:"email" binding:"required,email"`
}
```

**Step 2: Commit**

```bash
git add backend/internal/models/share.go
git commit -m "feat: add share model

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.7: Create Session Model

**Files:**
- Create: `backend/internal/models/session.go`

**Step 1: Create session.go**

```go
// backend/internal/models/session.go
package models

import (
	"time"

	"github.com/google/uuid"
)

type Session struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}
```

**Step 2: Commit**

```bash
git add backend/internal/models/session.go
git commit -m "feat: add session model

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.8: Create Auth Service

**Files:**
- Create: `backend/internal/services/auth_service.go`

**Step 1: Create auth_service.go**

```go
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
	ErrUserNotFound      = errors.New("user not found")
	ErrInvalidPassword   = errors.New("invalid password")
	ErrEmailExists       = errors.New("email already exists")
	ErrInvalidToken      = errors.New("invalid or expired token")
)

type AuthService struct {
	db *pgxpool.Pool
}

func NewAuthService(db *pgxpool.Pool) *AuthService {
	return &AuthService{db: db}
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

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Insert user
	user := &models.User{}
	err = s.db.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)
		 RETURNING id, email, password_hash, name, created_at`,
		input.Email, string(hashedPassword), input.Name,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.CreatedAt)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) Login(ctx context.Context, input *models.LoginInput) (*models.User, string, error) {
	// Find user by email
	user := &models.User{}
	err := s.db.QueryRow(ctx,
		`SELECT id, email, password_hash, name, created_at FROM users WHERE email = $1`,
		input.Email,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.CreatedAt)
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
		`SELECT u.id, u.email, u.password_hash, u.name, u.created_at
		 FROM users u
		 JOIN sessions s ON s.user_id = u.id
		 WHERE s.token = $1 AND s.expires_at > NOW()`,
		token,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.CreatedAt)
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
		`SELECT id, email, password_hash, name, created_at FROM users WHERE id = $1`,
		id,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.CreatedAt)
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
		`SELECT id, email, password_hash, name, created_at FROM users WHERE email = $1`,
		email,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.CreatedAt)
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
```

**Step 2: Commit**

```bash
git add backend/internal/services/auth_service.go
git commit -m "feat: add auth service with register, login, logout

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.9: Create Activity Service

**Files:**
- Create: `backend/internal/services/activity_service.go`

**Step 1: Create activity_service.go**

```go
// backend/internal/services/activity_service.go
package services

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/timetrack/backend/internal/models"
)

type ActivityService struct {
	db        *pgxpool.Pool
	aiService *AIService
}

func NewActivityService(db *pgxpool.Pool, aiService *AIService) *ActivityService {
	return &ActivityService{db: db, aiService: aiService}
}

func (s *ActivityService) Upload(ctx context.Context, userID uuid.UUID, input *models.UploadActivityInput) (*models.Activity, error) {
	// Analyze screenshot with AI
	analysis, err := s.aiService.AnalyzeScreenshot(ctx, input.Image)
	if err != nil {
		return nil, err
	}

	capturedAt := input.CapturedAt
	if capturedAt.IsZero() {
		capturedAt = time.Now()
	}

	// Insert activity
	activity := &models.Activity{}
	err = s.db.QueryRow(ctx,
		`INSERT INTO activities (user_id, captured_at, app_name, window_title, category, summary)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, user_id, captured_at, app_name, window_title, category, summary, created_at`,
		userID, capturedAt, analysis.AppName, analysis.WindowTitle, analysis.Category, analysis.Summary,
	).Scan(&activity.ID, &activity.UserID, &activity.CapturedAt, &activity.AppName,
		&activity.WindowTitle, &activity.Category, &activity.Summary, &activity.CreatedAt)
	if err != nil {
		return nil, err
	}

	return activity, nil
}

func (s *ActivityService) List(ctx context.Context, userID uuid.UUID, input *models.ActivityListInput) ([]*models.Activity, int, error) {
	// Default date range: today
	if input.From.IsZero() {
		input.From = time.Now().Truncate(24 * time.Hour)
	}
	if input.To.IsZero() {
		input.To = input.From.Add(24 * time.Hour)
	}

	// Build query
	query := `SELECT id, user_id, captured_at, app_name, window_title, category, summary, created_at
			  FROM activities
			  WHERE user_id = $1 AND captured_at >= $2 AND captured_at < $3`
	args := []interface{}{userID, input.From, input.To}
	argIdx := 4

	if input.Category != "" {
		query += ` AND category = $` + string(rune('0'+argIdx))
		args = append(args, input.Category)
		argIdx++
	}

	query += ` ORDER BY captured_at DESC`

	// Count total
	countQuery := `SELECT COUNT(*) FROM activities WHERE user_id = $1 AND captured_at >= $2 AND captured_at < $3`
	var total int
	err := s.db.QueryRow(ctx, countQuery, userID, input.From, input.To).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Pagination
	offset := (input.Page - 1) * input.PerPage
	query += ` LIMIT $` + string(rune('0'+argIdx)) + ` OFFSET $` + string(rune('0'+argIdx+1))
	args = append(args, input.PerPage, offset)

	// Execute query
	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var activities []*models.Activity
	for rows.Next() {
		a := &models.Activity{}
		err := rows.Scan(&a.ID, &a.UserID, &a.CapturedAt, &a.AppName, &a.WindowTitle,
			&a.Category, &a.Summary, &a.CreatedAt)
		if err != nil {
			return nil, 0, err
		}
		activities = append(activities, a)
	}

	return activities, total, nil
}

func (s *ActivityService) GetStats(ctx context.Context, userID uuid.UUID, from, to time.Time) (*models.ActivityStats, error) {
	if from.IsZero() {
		from = time.Now().Truncate(24 * time.Hour)
	}
	if to.IsZero() {
		to = from.Add(24 * time.Hour)
	}

	rows, err := s.db.Query(ctx,
		`SELECT category, COUNT(*) as count
		 FROM activities
		 WHERE user_id = $1 AND captured_at >= $2 AND captured_at < $3
		 GROUP BY category`,
		userID, from, to,
	)
	if err != nil {
		return nil, err
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
			return nil, err
		}
		totalCount += count
		stats.ByCategory[category] = models.CategoryStat{
			Count:   count,
			Minutes: count * 5, // 5 minutes per screenshot
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
```

**Step 2: Commit**

```bash
git add backend/internal/services/activity_service.go
git commit -m "feat: add activity service with upload, list, stats

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.10: Create AI Service (Z.AI Proxy)

**Files:**
- Create: `backend/internal/services/ai_service.go`

**Step 1: Create ai_service.go**

```go
// backend/internal/services/ai_service.go
package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type AIService struct {
	apiKey  string
	baseURL string
	client  *http.Client
}

type ScreenshotAnalysis struct {
	AppName     string `json:"app_name"`
	WindowTitle string `json:"window_title"`
	Category    string `json:"category"`
	Summary     string `json:"summary"`
}

type zaiRequest struct {
	Model    string       `json:"model"`
	Messages []zaiMessage `json:"messages"`
}

type zaiMessage struct {
	Role    string       `json:"role"`
	Content []zaiContent `json:"content"`
}

type zaiContent struct {
	Type     string    `json:"type"`
	Text     string    `json:"text,omitempty"`
	ImageURL *imageURL `json:"image_url,omitempty"`
}

type imageURL struct {
	URL string `json:"url"`
}

type zaiResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func NewAIService(apiKey, baseURL string) *AIService {
	return &AIService{
		apiKey:  apiKey,
		baseURL: baseURL,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (s *AIService) AnalyzeScreenshot(ctx context.Context, imageBase64 string) (*ScreenshotAnalysis, error) {
	// If no API key, return mock analysis
	if s.apiKey == "" {
		return &ScreenshotAnalysis{
			AppName:     "Unknown",
			WindowTitle: "Unknown",
			Category:    "other",
			Summary:     "Screenshot captured (AI analysis not configured)",
		}, nil
	}

	prompt := `Analyze this screenshot and extract the following information in JSON format:
{
  "app_name": "the application name visible (e.g., VS Code, Chrome, Slack)",
  "window_title": "the window title or tab name",
  "category": "one of: coding, meeting, browsing, communication, design, other",
  "summary": "brief 1-sentence description of what the user is doing"
}

Only respond with valid JSON, no other text.`

	reqBody := zaiRequest{
		Model: "glm-4.6v",
		Messages: []zaiMessage{
			{
				Role: "user",
				Content: []zaiContent{
					{Type: "text", Text: prompt},
					{Type: "image_url", ImageURL: &imageURL{URL: "data:image/png;base64," + imageBase64}},
				},
			},
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var zaiResp zaiResponse
	if err := json.NewDecoder(resp.Body).Decode(&zaiResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(zaiResp.Choices) == 0 {
		return nil, fmt.Errorf("no response from AI")
	}

	var analysis ScreenshotAnalysis
	if err := json.Unmarshal([]byte(zaiResp.Choices[0].Message.Content), &analysis); err != nil {
		// If JSON parsing fails, try to extract some info
		return &ScreenshotAnalysis{
			AppName:     "Unknown",
			WindowTitle: "Unknown",
			Category:    "other",
			Summary:     zaiResp.Choices[0].Message.Content,
		}, nil
	}

	return &analysis, nil
}
```

**Step 2: Commit**

```bash
git add backend/internal/services/ai_service.go
git commit -m "feat: add AI service for Z.AI GLM-4.6V integration

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.11: Create Share Service

**Files:**
- Create: `backend/internal/services/share_service.go`

**Step 1: Create share_service.go**

```go
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
```

**Step 2: Commit**

```bash
git add backend/internal/services/share_service.go
git commit -m "feat: add share service for supervisor access

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.12: Create Auth Middleware

**Files:**
- Create: `backend/internal/middleware/auth.go`

**Step 1: Create auth.go**

```go
// backend/internal/middleware/auth.go
package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/timetrack/backend/internal/services"
)

func AuthMiddleware(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "UNAUTHORIZED",
					"message": "Authorization header required",
				},
			})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "UNAUTHORIZED",
					"message": "Invalid authorization header format",
				},
			})
			c.Abort()
			return
		}

		token := parts[1]

		// Validate token
		user, err := authService.ValidateToken(c.Request.Context(), token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "UNAUTHORIZED",
					"message": "Invalid or expired token",
				},
			})
			c.Abort()
			return
		}

		// Store user in context
		c.Set("user", user)
		c.Set("token", token)
		c.Next()
	}
}
```

**Step 2: Commit**

```bash
git add backend/internal/middleware/auth.go
git commit -m "feat: add auth middleware for token validation

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.13: Create Auth Handler

**Files:**
- Create: `backend/internal/handlers/auth_handler.go`

**Step 1: Create auth_handler.go**

```go
// backend/internal/handlers/auth_handler.go
package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/timetrack/backend/internal/models"
	"github.com/timetrack/backend/internal/services"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var input models.CreateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	user, err := h.authService.Register(c.Request.Context(), &input)
	if err != nil {
		if errors.Is(err, services.ErrEmailExists) {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "EMAIL_EXISTS",
					"message": "Email already registered",
				},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to register user",
			},
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    user.ToResponse(),
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input models.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	user, token, err := h.authService.Login(c.Request.Context(), &input)
	if err != nil {
		if errors.Is(err, services.ErrUserNotFound) || errors.Is(err, services.ErrInvalidPassword) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INVALID_CREDENTIALS",
					"message": "Invalid email or password",
				},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to login",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"user":  user.ToResponse(),
			"token": token,
		},
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	token, _ := c.Get("token")
	if err := h.authService.Logout(c.Request.Context(), token.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to logout",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    nil,
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	user, _ := c.Get("user")
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    user.(*models.User).ToResponse(),
	})
}
```

**Step 2: Commit**

```bash
git add backend/internal/handlers/auth_handler.go
git commit -m "feat: add auth handler for register, login, logout, me

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.14: Create Activity Handler

**Files:**
- Create: `backend/internal/handlers/activity_handler.go`

**Step 1: Create activity_handler.go**

```go
// backend/internal/handlers/activity_handler.go
package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/timetrack/backend/internal/models"
	"github.com/timetrack/backend/internal/services"
)

type ActivityHandler struct {
	activityService *services.ActivityService
}

func NewActivityHandler(activityService *services.ActivityService) *ActivityHandler {
	return &ActivityHandler{activityService: activityService}
}

func (h *ActivityHandler) Upload(c *gin.Context) {
	user := c.MustGet("user").(*models.User)

	var input models.UploadActivityInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	activity, err := h.activityService.Upload(c.Request.Context(), user.ID, &input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to upload activity",
			},
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    activity,
	})
}

func (h *ActivityHandler) List(c *gin.Context) {
	user := c.MustGet("user").(*models.User)

	var input models.ActivityListInput
	if err := c.ShouldBindQuery(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	if input.Page < 1 {
		input.Page = 1
	}
	if input.PerPage < 1 || input.PerPage > 100 {
		input.PerPage = 20
	}

	activities, total, err := h.activityService.List(c.Request.Context(), user.ID, &input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to list activities",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    activities,
		"meta": gin.H{
			"page":     input.Page,
			"per_page": input.PerPage,
			"total":    total,
		},
	})
}

func (h *ActivityHandler) Stats(c *gin.Context) {
	user := c.MustGet("user").(*models.User)

	fromStr := c.Query("from")
	toStr := c.Query("to")

	var from, to time.Time
	var err error

	if fromStr != "" {
		from, err = time.Parse("2006-01-02", fromStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Invalid from date format (use YYYY-MM-DD)",
				},
			})
			return
		}
	}

	if toStr != "" {
		to, err = time.Parse("2006-01-02", toStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Invalid to date format (use YYYY-MM-DD)",
				},
			})
			return
		}
		to = to.Add(24 * time.Hour) // Include the whole day
	}

	stats, err := h.activityService.GetStats(c.Request.Context(), user.ID, from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to get stats",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}
```

**Step 2: Commit**

```bash
git add backend/internal/handlers/activity_handler.go
git commit -m "feat: add activity handler for upload, list, stats

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.15: Create Share Handler

**Files:**
- Create: `backend/internal/handlers/share_handler.go`

**Step 1: Create share_handler.go**

```go
// backend/internal/handlers/share_handler.go
package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/timetrack/backend/internal/models"
	"github.com/timetrack/backend/internal/services"
)

type ShareHandler struct {
	shareService    *services.ShareService
	activityService *services.ActivityService
}

func NewShareHandler(shareService *services.ShareService, activityService *services.ActivityService) *ShareHandler {
	return &ShareHandler{shareService: shareService, activityService: activityService}
}

func (h *ShareHandler) Create(c *gin.Context) {
	user := c.MustGet("user").(*models.User)

	var input models.CreateShareInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	share, err := h.shareService.Create(c.Request.Context(), user.ID, input.Email)
	if err != nil {
		if errors.Is(err, services.ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "USER_NOT_FOUND",
					"message": "User with this email not found",
				},
			})
			return
		}
		if errors.Is(err, services.ErrShareExists) {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "SHARE_EXISTS",
					"message": "Already shared with this user",
				},
			})
			return
		}
		if errors.Is(err, services.ErrCannotShareSelf) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "CANNOT_SHARE_SELF",
					"message": "Cannot share with yourself",
				},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create share",
			},
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    share,
	})
}

func (h *ShareHandler) GetViewers(c *gin.Context) {
	user := c.MustGet("user").(*models.User)

	shares, err := h.shareService.GetViewers(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to get viewers",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    shares,
	})
}

func (h *ShareHandler) GetWatching(c *gin.Context) {
	user := c.MustGet("user").(*models.User)

	shares, err := h.shareService.GetWatching(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to get watching list",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    shares,
	})
}

func (h *ShareHandler) Delete(c *gin.Context) {
	user := c.MustGet("user").(*models.User)

	shareIDStr := c.Param("id")
	shareID, err := uuid.Parse(shareIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid share ID",
			},
		})
		return
	}

	if err := h.shareService.Delete(c.Request.Context(), user.ID, shareID); err != nil {
		if errors.Is(err, services.ErrShareNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "SHARE_NOT_FOUND",
					"message": "Share not found",
				},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to delete share",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    nil,
	})
}

// Supervisor endpoints
func (h *ShareHandler) GetUserActivity(c *gin.Context) {
	viewer := c.MustGet("user").(*models.User)

	userIDStr := c.Param("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid user ID",
			},
		})
		return
	}

	// Check permission
	canView, err := h.shareService.CanView(c.Request.Context(), viewer.ID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to check permission",
			},
		})
		return
	}
	if !canView {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "FORBIDDEN",
				"message": "Not authorized to view this user's activity",
			},
		})
		return
	}

	var input models.ActivityListInput
	if err := c.ShouldBindQuery(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	if input.Page < 1 {
		input.Page = 1
	}
	if input.PerPage < 1 || input.PerPage > 100 {
		input.PerPage = 20
	}

	activities, total, err := h.activityService.List(c.Request.Context(), userID, &input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to list activities",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    activities,
		"meta": gin.H{
			"page":     input.Page,
			"per_page": input.PerPage,
			"total":    total,
		},
	})
}

func (h *ShareHandler) GetUserStats(c *gin.Context) {
	viewer := c.MustGet("user").(*models.User)

	userIDStr := c.Param("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid user ID",
			},
		})
		return
	}

	// Check permission
	canView, err := h.shareService.CanView(c.Request.Context(), viewer.ID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to check permission",
			},
		})
		return
	}
	if !canView {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "FORBIDDEN",
				"message": "Not authorized to view this user's stats",
			},
		})
		return
	}

	// Get stats (reuse activity handler logic)
	// For now, return empty - will be implemented in activity service
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    nil,
	})
}
```

**Step 2: Commit**

```bash
git add backend/internal/handlers/share_handler.go
git commit -m "feat: add share handler for supervisor access

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2.16: Create Main Entry Point

**Files:**
- Create: `backend/cmd/api/main.go`

**Step 1: Create main.go**

```go
// backend/cmd/api/main.go
package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/timetrack/backend/internal/config"
	"github.com/timetrack/backend/internal/database"
	"github.com/timetrack/backend/internal/handlers"
	"github.com/timetrack/backend/internal/middleware"
	"github.com/timetrack/backend/internal/services"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load config
	cfg := config.Load()

	// Connect to database
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Initialize services
	db := database.GetPool()
	authService := services.NewAuthService(db)
	aiService := services.NewAIService(cfg.ZAIAPIKey, cfg.ZAIBaseURL)
	activityService := services.NewActivityService(db, aiService)
	shareService := services.NewShareService(db, authService)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	activityHandler := handlers.NewActivityHandler(activityService)
	shareHandler := handlers.NewShareHandler(shareService, activityService)

	// Setup Gin
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.DebugMode)
	}
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(authService))
		{
			// Auth
			protected.POST("/auth/logout", authHandler.Logout)
			protected.GET("/auth/me", authHandler.Me)

			// Activity
			protected.POST("/activity/upload", activityHandler.Upload)
			protected.GET("/activity", activityHandler.List)
			protected.GET("/activity/stats", activityHandler.Stats)

			// Sharing
			protected.POST("/share", shareHandler.Create)
			protected.GET("/share/viewers", shareHandler.GetViewers)
			protected.GET("/share/watching", shareHandler.GetWatching)
			protected.DELETE("/share/:id", shareHandler.Delete)

			// Supervisor
			protected.GET("/supervise/:user_id/activity", shareHandler.GetUserActivity)
			protected.GET("/supervise/:user_id/stats", shareHandler.GetUserStats)
		}
	}

	// Start server
	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
```

**Step 2: Verify build**

```bash
cd backend && go build ./cmd/api
```

Expected: No errors

**Step 3: Run server**

```bash
go run ./cmd/api
```

Expected: Server starting on port 8080

**Step 4: Test health endpoint**

```bash
curl http://localhost:8080/health
```

Expected: `{"status":"ok"}`

**Step 5: Commit**

```bash
cd ..
git add backend/cmd/api/
git commit -m "feat: add main entry point with all routes

- Auth: register, login, logout, me
- Activity: upload, list, stats
- Share: create, viewers, watching, delete
- Supervise: user activity, user stats

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 3: Desktop App (Tauri + React) - Coming Next

### Task 3.1: Initialize Tauri Project
### Task 3.2: Setup React + shadcn
### Task 3.3: Create Screenshot Capture (Rust)
### Task 3.4: Create Background Service
### Task 3.5: Create System Tray
### Task 3.6: Create Dashboard UI
### Task 3.7: Create Settings UI
### Task 3.8: Create API Client

---

## Phase 4: Web Dashboard - Coming Next

### Task 4.1: Initialize Vite + React
### Task 4.2: Setup shadcn
### Task 4.3: Create Auth Pages
### Task 4.4: Create Dashboard View
### Task 4.5: Create Supervisor View

---

## Phase 5: Integration & Deployment - Coming Next

### Task 5.1: Connect Desktop to Backend
### Task 5.2: End-to-end Testing
### Task 5.3: Docker Deployment
### Task 5.4: Documentation
