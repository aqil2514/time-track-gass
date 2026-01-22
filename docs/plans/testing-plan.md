# Testing Plan - TimeTrack Application

## Overview

Plan untuk implementasi unit test dan integration test untuk Backend, Web, dan Desktop.
Test menggunakan **real API** (bukan mock) untuk memastikan behavior yang akurat.

---

## 🛠️ Prerequisites & Setup

### **1. Dependencies yang Perlu Di-Install**

#### Backend (Go)

```bash
cd backend

# Testing framework
go get github.com/stretchr/testify

# Untuk test suite
go get github.com/stretchr/testify/suite

# Environment
go get github.com/joho/godotenv
```

#### Web (React)

```bash
cd web

# Testing framework
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Tambahkan ke vite.config.ts
# test: { globals: true, environment: 'jsdom', setupFiles: './src/test/setup.ts' }
```

#### Desktop (React + Rust)

```bash
cd desktop

# React testing
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Rust testing sudah built-in, cukup jalankan:
# cargo test
```

### **2. Database Setup**

```bash
# Create test database
psql -U postgres -c "CREATE DATABASE timetrack_test;"

# Apply migrations ke test database
cd backend
DATABASE_URL="postgres://postgres:postgres@localhost:5432/timetrack_test?sslmode=disable" go run ./cmd/migrate up
```

### **3. Environment Variables untuk Testing**

Buat file `backend/.env.test`:

```bash
PORT=8081
DATABASE_URL=postgres://postgres:postgres@localhost:5432/timetrack_test?sslmode=disable
JWT_SECRET=test-secret-key
ZAI_API_KEY=3c33151a4acf4cfb88d28ccf2165e771.YkunVsPApJisCtdA
ZAI_BASE_URL=https://api.z.ai/api/coding/paas/v4
ZAI_VISION_MODEL_PRIMARY=glm-4.6v
```

### **4. Docker Setup (Recommended)**

Semua services sudah tersedia di Docker. Gunakan docker-compose untuk setup cepat:

```bash
cd docker

# Copy environment file
cp .env.example .env

# Edit .env dan isi ZAI_API_KEY
nano .env

# Start semua services (db + backend)
docker-compose up -d

# Start dengan test database juga
docker-compose --profile test up -d

# Lihat logs
docker-compose logs -f backend

# Stop semua
docker-compose down
```

#### Docker Services

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| `db` | timetrack-db | 5432 | TimescaleDB production |
| `db-test` | timetrack-db-test | 5433 | TimescaleDB for testing |
| `backend` | timetrack-backend | 8080 | Go API server |

> **Note**: Frontend (web) dijalankan manual dengan `pnpm dev` dari folder `web/`

#### Running Tests dengan Docker

```bash
# Start test database
docker-compose --profile test up -d db-test

# Run backend tests (dari host)
cd backend
TEST_DATABASE_URL="postgres://postgres:postgres@localhost:5433/timetrack_test?sslmode=disable" go test ./... -v

# Check backend health
curl http://localhost:8080/health
```

#### Running Frontend (Manual)

```bash
# Di terminal terpisah
cd web
pnpm install
pnpm dev  # http://localhost:5173
```

---

## 📋 API Endpoint Reference

### **Public Endpoints**

| Method | Endpoint | Handler | Description |
|--------|----------|---------|-------------|
| GET | `/health` | inline | Health check |
| POST | `/api/v1/auth/register` | `authHandler.Register` | Register user baru |
| POST | `/api/v1/auth/login` | `authHandler.Login` | Login user |
| GET | `/api/v1/s/:slug` | `linkHandler.GetPublicStats` | Public shared link |

### **Protected Endpoints (Butuh Token)**

#### Auth

| Method | Endpoint | Handler | Description |
|--------|----------|---------|-------------|
| POST | `/api/v1/auth/logout` | `authHandler.Logout` | Logout |
| GET | `/api/v1/auth/me` | `authHandler.Me` | Get current user |
| PATCH | `/api/v1/auth/password` | `authHandler.UpdatePassword` | Update password |

#### Organization

| Method | Endpoint | Handler | Description |
|--------|----------|---------|-------------|
| GET | `/api/v1/org` | `organizationHandler.GetOrganization` | Get org details |
| PATCH | `/api/v1/org/settings` | `organizationHandler.UpdateSettings` | Update org settings |
| PUT | `/api/v1/org/settings/api-key` | `organizationHandler.SetAPIKey` | Set AI API key |
| DELETE | `/api/v1/org/settings/api-key` | `organizationHandler.RemoveAPIKey` | Remove API key |
| GET | `/api/v1/org/api-key` | `organizationHandler.GetDecryptedAPIKey` | Get decrypted key |
| POST | `/api/v1/org/members` | `organizationHandler.AddMember` | Add member |
| GET | `/api/v1/org/members` | `organizationHandler.ListMembers` | List members |
| PATCH | `/api/v1/org/members/:id` | `organizationHandler.UpdateMember` | Update member |
| DELETE | `/api/v1/org/members/:id` | `organizationHandler.RemoveMember` | Remove member |
| GET | `/api/v1/org/stats` | `organizationHandler.GetOrganizationStats` | Org statistics |
| GET | `/api/v1/org/members/summary` | `organizationHandler.GetMembersSummary` | Members summary |
| GET | `/api/v1/org/members/:id/activities` | `organizationHandler.GetMemberActivities` | Member activities |
| GET | `/api/v1/org/members/:id/stats` | `organizationHandler.GetMemberStats` | Member stats |
| GET | `/api/v1/org/activity-heatmap` | `organizationHandler.GetActivityHeatmap` | Activity heatmap |

#### Activity

| Method | Endpoint | Handler | Description |
|--------|----------|---------|-------------|
| POST | `/api/v1/activity/upload` | `activityHandler.Upload` | Upload activity + screenshot |
| PATCH | `/api/v1/activity/:id` | `activityHandler.Update` | Update activity |
| GET | `/api/v1/activity` | `activityHandler.List` | List activities |
| GET | `/api/v1/activity/stats` | `activityHandler.Stats` | Activity statistics |

#### Share

| Method | Endpoint | Handler | Description |
|--------|----------|---------|-------------|
| POST | `/api/v1/share` | `shareHandler.Create` | Create share |
| GET | `/api/v1/share/viewers` | `shareHandler.GetViewers` | Get viewers |
| GET | `/api/v1/share/watching` | `shareHandler.GetWatching` | Get watching |
| DELETE | `/api/v1/share/:id` | `shareHandler.Delete` | Delete share |
| POST | `/api/v1/share/link` | `linkHandler.Create` | Create share link |
| GET | `/api/v1/share/link` | `linkHandler.List` | List share links |
| DELETE | `/api/v1/share/link/:id` | `linkHandler.Delete` | Delete share link |

#### Supervisor

| Method | Endpoint | Handler | Description |
|--------|----------|---------|-------------|
| GET | `/api/v1/supervise/:user_id/activity` | `shareHandler.GetUserActivity` | Get user activity |
| GET | `/api/v1/supervise/:user_id/stats` | `shareHandler.GetUserStats` | Get user stats |

#### Notifications

| Method | Endpoint | Handler | Description |
|--------|----------|---------|-------------|
| POST | `/api/v1/org/notifications` | `notificationHandler.CreateNotification` | Create notification |
| GET | `/api/v1/org/notifications` | `notificationHandler.ListNotifications` | List notifications |
| PATCH | `/api/v1/org/notifications/:id` | `notificationHandler.MarkAsRead` | Mark as read |

---

## 📨 Expected Response Examples

### **Success Response Format**

```json
{
  "success": true,
  "data": { ... }
}
```

### **Error Response Format**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### **Common Error Codes**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `INTERNAL_ERROR` | 500 | Server error |

### **Sample Responses**

#### Login Success
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "member",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "token": "64-char-hex-token"
  }
}
```

#### Activity List
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "captured_at": "2024-01-01T10:00:00Z",
        "app_name": "VS Code",
        "window_title": "main.go",
        "category": "coding",
        "summary": "Working on Go backend",
        "ai_status": "success"
      }
    ],
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

---

## 🔄 Implementation Order

Urutan implementasi test yang disarankan:

### **Phase 1: Setup & Infrastructure**
1. ✅ Create `backend/tests/testutils/` folder
2. ✅ Create `fixtures.go` - test data setup
3. ✅ Create `db.go` - test database connection
4. ✅ Create `screenshots.go` - test image helpers
5. ✅ Create `edge_cases.go` - edge case generators

### **Phase 2: Backend Core Tests**
1. `auth_handler_test.go` - Login, Register, Logout
2. `middleware_test.go` - Auth middleware
3. `activity_handler_test.go` - Upload, List, Update
4. `activity_service_test.go` - Business logic

### **Phase 3: Backend Extended Tests**
1. `organization_handler_test.go` - Org management
2. `share_handler_test.go` - Sharing feature
3. `ai_service_test.go` - AI integration
4. `notification_service_test.go` - Notifications

### **Phase 4: Web Tests**
1. Component tests (Button, Card, etc)
2. Page tests (LoginPage, DashboardPage)
3. Hook tests (useAuth)

### **Phase 5: Desktop Tests**
1. Hook tests (useCapture, useApiKey)
2. Lib tests (ai.ts, aiRetryQueue.ts)
3. Rust tests (screenshots.rs, offline_queue.rs)

---

## 🗄️ Test Fixtures (Seed Data)

### **Apakah Perlu Seed Data?**

**YA**, tapi bukan global seed. Gunakan **test fixtures** yang dibuat per-suite.

### **Alasan: Entity Dependencies**

```
Organization ◄─── User (FK: organization_id)
      │              │
      └── owner_id ──►│
                      ▼
                  Activity (FK: user_id)
                  Session (FK: user_id)
                  Share (FK: owner_id, viewer_id)
                  SharedLink (FK: user_id)
                  Notification (FK: user_id)
```

### **Test Fixtures Structure**

```go
// backend/tests/testutils/fixtures.go
package testutils

type TestFixtures struct {
    DB *pgxpool.Pool
    
    // Pre-created entities
    Organization *models.Organization
    Owner        *models.User      // Role: owner
    Admin        *models.User      // Role: admin
    Member       *models.User      // Role: member
    
    // Auth tokens
    OwnerToken   string
    AdminToken   string
    MemberToken  string
    
    // Sample data
    Activities   []*models.Activity
}

func SetupFixtures(ctx context.Context, db *pgxpool.Pool) (*TestFixtures, error)
func (f *TestFixtures) Cleanup(ctx context.Context)
```

### **Fixtures Content**

| Entity | Data |
|--------|------|
| **Organization** | 1 org: "Test Organization" |
| **Users** | 3 users: owner, admin, member |
| **Sessions** | 3 active tokens for each user |
| **Activities** | 10 sample activities untuk member |
| **SharedLinks** | 1 sample shared link |
| **Screenshots** | 5 sample screenshots untuk testing |

### **Sample Screenshots untuk Testing**

Screenshots disimpan di `backend/tests/testdata/screenshots/`

#### Screenshots yang Bisa Di-Generate

| File | Ukuran | Deskripsi | Cara Prepare |
|------|--------|-----------|--------------|
| `coding_vscode.png` | ~50KB | Screenshot VS Code | ✅ Auto-generate dengan AI |
| `meeting_zoom.png` | ~40KB | Screenshot Zoom meeting | ✅ Auto-generate dengan AI |
| `browsing_chrome.png` | ~60KB | Screenshot Chrome | ✅ Auto-generate dengan AI |
| `documentation_notion.png` | ~45KB | Screenshot Notion docs | ✅ Auto-generate dengan AI |
| `empty_desktop.png` | ~10KB | Screenshot desktop kosong | ✅ Auto-generate dengan AI |

#### Edge Case Files - Dibuat Programatik

| File | Deskripsi | Cara Prepare |
|------|-----------|--------------|
| `invalid_format.txt` | File text bukan image | ✅ Generate dalam test setup |
| `corrupted.webp` | File corrupt | ✅ Generate dalam test setup |
| `too_large.webp` | Image sangat besar (~15MB) | ⚠️ Skip atau generate dinamis |

#### Alternatif: Generate Edge Case Files dalam Code

```go
// backend/tests/testutils/edge_cases.go
package testutils

import (
    "bytes"
    "os"
)

// CreateInvalidFormatFile creates a text file for testing invalid format
func CreateInvalidFormatFile() []byte {
    return []byte("This is not an image file, just plain text.")
}

// CreateCorruptedWebP creates a truncated/corrupted WebP header
func CreateCorruptedWebP() []byte {
    // WebP header starts with RIFF....WEBP
    // Create partial header that will fail parsing
    return []byte("RIFF\x00\x00\x00\x00WEBP")
}

// CreateTooLargePayload creates a payload that exceeds max size
// Instead of actual 15MB image, create bytes that exceed limit
func CreateTooLargePayload(sizeBytes int) []byte {
    return bytes.Repeat([]byte{0xFF, 0xD8, 0xFF}, sizeBytes/3)
}

// CreateMinimalValidPNG creates a 1x1 pixel valid PNG
func CreateMinimalValidPNG() []byte {
    // Minimal valid 1x1 transparent PNG
    return []byte{
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
        0x42, 0x60, 0x82,
    }
}
```

#### Penggunaan di Test

```go
func (s *ActivityTestSuite) TestUploadActivity_InvalidFormat() {
    // Tidak perlu file fisik, generate langsung
    invalidData := testutils.CreateInvalidFormatFile()
    
    body := createMultipartBody("file.txt", invalidData)
    resp := s.doRequest("POST", "/activities", body, s.fixtures.MemberToken)
    
    s.Equal(400, resp.Code)
    s.Contains(resp.Body.String(), "invalid image format")
}

func (s *ActivityTestSuite) TestUploadActivity_TooLarge() {
    // Generate 15MB payload tanpa perlu file fisik
    maxSize := 10 * 1024 * 1024 // 10MB limit
    tooLargeData := testutils.CreateTooLargePayload(maxSize + 1)
    
    body := createMultipartBody("large.png", tooLargeData)
    resp := s.doRequest("POST", "/activities", body, s.fixtures.MemberToken)
    
    s.Equal(413, resp.Code) // Payload Too Large
}

func (s *ActivityTestSuite) TestUploadActivity_CorruptedImage() {
    corruptedData := testutils.CreateCorruptedWebP()
    
    body := createMultipartBody("corrupted.webp", corruptedData)
    resp := s.doRequest("POST", "/activities", body, s.fixtures.MemberToken)
    
    s.Equal(400, resp.Code)
}
```

#### Tests yang TIDAK Bisa/Perlu Di-Skip

| Test | Alasan | Alternatif |
|------|--------|------------|
| `TestAI_RealAnalysis` | Butuh real AI API + quota | Jalankan manual saat quota available |
| `TestScreenshot_MacOS` | Butuh macOS environment | Jalankan di CI dengan macOS runner |
| `TestScreenshot_Linux` | Butuh Linux environment | Jalankan di CI dengan Linux runner |

### **Sample Screenshot Generator**

```go
// backend/tests/testutils/screenshots.go
package testutils

import (
    "os"
    "path/filepath"
)

const TestDataDir = "tests/testdata/screenshots"

// GetTestScreenshot returns the path to a test screenshot
func GetTestScreenshot(name string) string {
    return filepath.Join(TestDataDir, name)
}

// GetTestScreenshotBytes returns the content of a test screenshot
func GetTestScreenshotBytes(name string) ([]byte, error) {
    return os.ReadFile(GetTestScreenshot(name))
}

// Test screenshot constants
const (
    ScreenshotCoding        = "coding_vscode.webp"
    ScreenshotMeeting       = "meeting_zoom.webp"
    ScreenshotBrowsing      = "browsing_chrome.webp"
    ScreenshotDocumentation = "documentation_notion.webp"
    ScreenshotEmpty         = "empty_desktop.webp"
    ScreenshotInvalid       = "invalid_format.txt"
    ScreenshotTooLarge      = "too_large.webp"
    ScreenshotCorrupted     = "corrupted.webp"
)
```

### **Penggunaan di Test**

```go
func (s *ActivityTestSuite) TestUploadActivity_WithScreenshot() {
    // Load test screenshot
    screenshotData, err := testutils.GetTestScreenshotBytes(testutils.ScreenshotCoding)
    s.Require().NoError(err)
    
    // Create multipart form
    body := &bytes.Buffer{}
    writer := multipart.NewWriter(body)
    
    part, _ := writer.CreateFormFile("screenshot", "screenshot.webp")
    part.Write(screenshotData)
    writer.WriteField("app_name", "VS Code")
    writer.Close()
    
    req := httptest.NewRequest("POST", "/activities", body)
    req.Header.Set("Content-Type", writer.FormDataContentType())
    req.Header.Set("Authorization", "Bearer "+s.fixtures.MemberToken)
    
    w := httptest.NewRecorder()
    s.router.ServeHTTP(w, req)
    
    s.Equal(201, w.Code)
}

func (s *ActivityTestSuite) TestUploadActivity_InvalidImage() {
    // Load invalid file (text file, not image)
    invalidData, _ := testutils.GetTestScreenshotBytes(testutils.ScreenshotInvalid)
    
    // ... create request with invalid data
    
    s.Equal(400, w.Code) // Should reject
}
```

### **Membuat Sample Screenshots**

Untuk generate sample screenshots, bisa menggunakan script:

```bash
# backend/tests/testdata/generate_screenshots.sh

#!/bin/bash
mkdir -p screenshots

# Generate placeholder screenshots (dalam production, pakai real screenshots)
# Option 1: Download sample images
curl -o screenshots/coding_vscode.webp "https://example.com/sample-vscode.webp"

# Option 2: Take actual screenshots dan convert ke WebP
# screencapture -x screenshots/temp.png
# cwebp screenshots/temp.png -o screenshots/coding_vscode.webp -q 80

# Create invalid test files
echo "This is not an image" > screenshots/invalid_format.txt

# Create corrupted WebP (truncated file)
head -c 5000 screenshots/coding_vscode.webp > screenshots/corrupted.webp
```

### **Lifecycle**

```
SetupSuite()     → Create fixtures ONCE
  ├── Test1()    → Uses fixtures (read-only)
  ├── Test2()    → Uses fixtures (read-only)
  └── Test3()    → Uses fixtures (read-only)
TearDownSuite()  → Cleanup fixtures ONCE
```

### **Password untuk Test Users**

Semua test users menggunakan password: `TestPassword123!`

### **Implementasi Fixtures (Complete Code)**

```go
// backend/tests/testutils/fixtures.go
package testutils

import (
    "context"
    "crypto/rand"
    "encoding/hex"
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
    SharedLink   *models.Link
}

func SetupFixtures(ctx context.Context, db *pgxpool.Pool) (*TestFixtures, error) {
    f := &TestFixtures{DB: db}

    // 1. Create Organization
    orgID := uuid.New()
    _, err := db.Exec(ctx,
        `INSERT INTO organizations (id, name, timezone, created_at) VALUES ($1, $2, $3, $4)`,
        orgID, "Test Organization", "Asia/Jakarta", time.Now(),
    )
    if err != nil {
        return nil, err
    }
    f.Organization = &models.Organization{ID: orgID, Name: "Test Organization"}

    // 2. Create Users
    hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(TestPassword), bcrypt.DefaultCost)

    // Owner
    f.Owner = createUser(ctx, db, "owner@test.com", string(hashedPassword), "Test Owner", orgID, "owner")
    
    // Update org owner
    db.Exec(ctx, `UPDATE organizations SET owner_id = $1 WHERE id = $2`, f.Owner.ID, orgID)

    // Admin
    f.Admin = createUser(ctx, db, "admin@test.com", string(hashedPassword), "Test Admin", orgID, "admin")

    // Member
    f.Member = createUser(ctx, db, "member@test.com", string(hashedPassword), "Test Member", orgID, "member")

    // 3. Create Sessions (Tokens)
    f.OwnerToken = createSession(ctx, db, f.Owner.ID)
    f.AdminToken = createSession(ctx, db, f.Admin.ID)
    f.MemberToken = createSession(ctx, db, f.Member.ID)

    // 4. Create Sample Activities (10 activities for member)
    f.Activities = createSampleActivities(ctx, db, f.Member.ID, 10)

    // 5. Create Sample SharedLink
    f.SharedLink = createSharedLink(ctx, db, f.Member.ID)

    return f, nil
}

func (f *TestFixtures) Cleanup(ctx context.Context) {
    // Delete in reverse order of dependencies
    f.DB.Exec(ctx, "DELETE FROM shared_links")
    f.DB.Exec(ctx, "DELETE FROM activities")
    f.DB.Exec(ctx, "DELETE FROM sessions")
    f.DB.Exec(ctx, "DELETE FROM notifications")
    f.DB.Exec(ctx, "DELETE FROM shares")
    f.DB.Exec(ctx, "DELETE FROM users")
    f.DB.Exec(ctx, "DELETE FROM organizations")
}

func createUser(ctx context.Context, db *pgxpool.Pool, email, passwordHash, name string, orgID uuid.UUID, role string) *models.User {
    userID := uuid.New()
    db.Exec(ctx,
        `INSERT INTO users (id, email, password_hash, name, organization_id, role, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        userID, email, passwordHash, name, orgID, role, time.Now(),
    )
    return &models.User{ID: userID, Email: email, Name: name, OrganizationID: &orgID, Role: role}
}

func createSession(ctx context.Context, db *pgxpool.Pool, userID uuid.UUID) string {
    bytes := make([]byte, 32)
    rand.Read(bytes)
    token := hex.EncodeToString(bytes)
    expiresAt := time.Now().Add(7 * 24 * time.Hour)
    db.Exec(ctx,
        `INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)`,
        userID, token, expiresAt,
    )
    return token
}

func createSampleActivities(ctx context.Context, db *pgxpool.Pool, userID uuid.UUID, count int) []*models.Activity {
    categories := []string{"coding", "meeting", "browsing", "documentation", "debugging"}
    activities := make([]*models.Activity, count)
    
    for i := 0; i < count; i++ {
        activityID := uuid.New()
        capturedAt := time.Now().Add(-time.Duration(i*5) * time.Minute)
        category := categories[i%len(categories)]
        
        db.Exec(ctx,
            `INSERT INTO activities (id, user_id, captured_at, app_name, window_title, category, summary, ai_status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            activityID, userID, capturedAt, "VS Code", "main.go - TimeTrack", category, 
            "Working on test implementation", "success", time.Now(),
        )
        activities[i] = &models.Activity{ID: activityID, UserID: userID, Category: category}
    }
    return activities
}

func createSharedLink(ctx context.Context, db *pgxpool.Pool, userID uuid.UUID) *models.Link {
    linkID := uuid.New()
    slug := "test-share-link"
    db.Exec(ctx,
        `INSERT INTO shared_links (id, user_id, slug, name, expires_at, is_public, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        linkID, userID, slug, "Test Share", time.Now().Add(24*time.Hour), true, time.Now(),
    )
    return &models.Link{ID: linkID, Slug: slug}
}
```

### **Penggunaan di Test Suite**

```go
// backend/internal/handlers/auth_handler_test.go
package handlers_test

import (
    "context"
    "testing"

    "github.com/stretchr/testify/suite"
    "github.com/timetrack/backend/tests/testutils"
)

type AuthTestSuite struct {
    suite.Suite
    fixtures *testutils.TestFixtures
    router   *gin.Engine
}

// SetupSuite - SEKALI sebelum semua tests
func (s *AuthTestSuite) SetupSuite() {
    db := testutils.ConnectTestDB()
    
    var err error
    s.fixtures, err = testutils.SetupFixtures(context.Background(), db)
    s.Require().NoError(err)
    
    // Setup router dengan services...
}

// TearDownSuite - SEKALI setelah semua tests
func (s *AuthTestSuite) TearDownSuite() {
    s.fixtures.Cleanup(context.Background())
}

// Test menggunakan fixtures
func (s *AuthTestSuite) TestLogin_Success() {
    body := fmt.Sprintf(`{"email": "%s", "password": "%s"}`,
        s.fixtures.Member.Email, testutils.TestPassword)
    
    resp := s.doRequest("POST", "/auth/login", body, "")
    
    s.Equal(200, resp.Code)
}

func (s *AuthTestSuite) TestGetActivities_WithAuth() {
    resp := s.doRequest("GET", "/activities", "", s.fixtures.MemberToken)
    
    s.Equal(200, resp.Code)
    // Should return the 10 pre-created activities
}

func TestAuthSuite(t *testing.T) {
    suite.Run(t, new(AuthTestSuite))
}
```

### **Test Database Setup**

```go
// backend/tests/testutils/db.go
package testutils

import (
    "context"
    "os"

    "github.com/jackc/pgx/v5/pgxpool"
)

func ConnectTestDB() *pgxpool.Pool {
    // Use separate test database
    connStr := os.Getenv("TEST_DATABASE_URL")
    if connStr == "" {
        connStr = "postgres://postgres:postgres@localhost:5432/timetrack_test"
    }

    pool, err := pgxpool.New(context.Background(), connStr)
    if err != nil {
        panic(err)
    }

    return pool
}
```

### **Test Environment Variables**

```bash
# .env.test
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/timetrack_test
AI_API_KEY=your-test-api-key
AI_API_URL=https://api.zai.com/v1
```

---

## 🔵 BACKEND (Go)

### Testing Framework
- **Unit Test**: Go built-in `testing` package
- **Integration Test**: Go `testing` + real database (SQLite test DB)
- **HTTP Test**: `net/http/httptest`

### Test Structure
```
backend/
├── internal/
│   ├── handlers/
│   │   ├── auth_handler.go
│   │   └── auth_handler_test.go      <- handler tests
│   ├── services/
│   │   ├── auth_service.go
│   │   └── auth_service_test.go      <- service tests
│   └── ...
└── tests/
    └── integration/
        └── api_test.go               <- full API integration tests
```

### Test Cases

#### 0. Infrastructure Tests

##### Health Handler (`health_handler_test.go`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestHealth_Success` | Unit | GET /health returns 200 OK |
| `TestHealth_DBConnected` | Integration | Health check includes DB status |

##### Database (`database_test.go`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestDatabaseConnection` | Integration | DB connection established successfully |
| `TestDatabasePing` | Integration | DB responds to ping |
| `TestDatabaseTimeout` | Integration | DB timeout handled gracefully |

##### Migrations (`migration_test.go`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestMigrationsUp` | Integration | All migrations run successfully |
| `TestMigrationsDown` | Integration | Rollback works correctly |
| `TestSchemaIntegrity` | Integration | Tables and columns exist as expected |

#### 1. Auth Handler (`auth_handler_test.go`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestLogin_Success` | Unit | Login dengan credentials valid, expect JWT token |
| `TestLogin_WrongPassword` | Unit | Login dengan password salah, expect 401 |
| `TestLogin_UserNotFound` | Unit | Login dengan email tidak ada, expect 401 |
| `TestRegister_Success` | Unit | Register user baru, expect 201 |
| `TestRegister_DuplicateEmail` | Unit | Register dengan email sudah ada, expect 409 |
| `TestLogout_Success` | Unit | Logout dengan token valid, expect 200 |
| `TestLogout_InvalidToken` | Unit | Logout tanpa token, expect 401 |

#### 2. Auth Service (`auth_service_test.go`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestHashPassword` | Unit | Password di-hash dengan benar |
| `TestVerifyPassword_Correct` | Unit | Password benar, return true |
| `TestVerifyPassword_Wrong` | Unit | Password salah, return false |
| `TestGenerateJWT` | Unit | Generate JWT dengan claims yang benar |
| `TestValidateJWT_Valid` | Unit | Token valid, return claims |
| `TestValidateJWT_Expired` | Unit | Token expired, return error |
| `TestValidateJWT_Invalid` | Unit | Token invalid, return error |

#### 3. Activity Handler (`activity_handler_test.go`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestCreateActivity_Success` | Integration | Create activity dengan image, expect 201 |
| `TestCreateActivity_NoImage` | Unit | Create activity tanpa image, expect 400 |
| `TestCreateActivity_Unauthorized` | Unit | Create tanpa auth, expect 401 |
| `TestGetActivities_Success` | Integration | Get activities, expect list dengan pagination |
| `TestGetActivities_FilterByDate` | Integration | Filter by date range, expect filtered results |
| `TestUpdateActivity_Success` | Integration | PATCH activity, expect updated data |
| `TestUpdateActivity_NotOwner` | Unit | Update activity milik orang lain, expect 403 |

#### 4. Activity Service (`activity_service_test.go`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestSaveActivity` | Integration | Save ke DB, verify data tersimpan |
| `TestGetActivitiesByUser` | Integration | Query by user ID, return correct activities |
| `TestGetActivitiesByDateRange` | Integration | Query by date, return filtered activities |
| `TestGetActivities_Pagination` | Integration | Pagination works correctly |

#### 5. AI Service (`ai_service_test.go`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestAnalyzeScreenshot_Success` | Integration | Call real AI API, expect parsed response |
| `TestAnalyzeScreenshot_Timeout` | Integration | AI API timeout, expect error handling |
| `TestAnalyzeScreenshot_InvalidImage` | Integration | Image invalid, expect error |
| `TestBuildPrompt` | Unit | Prompt dibangun dengan format benar |
| `TestParseAIResponse` | Unit | Parse JSON response dari AI |

#### 6. Organization Handler (`organization_handler_test.go`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestCreateOrganization_Success` | Integration | Create org, expect 201 |
| `TestAddMember_Success` | Integration | Add member ke org, expect 200 |
| `TestAddMember_NotAdmin` | Unit | Non-admin add member, expect 403 |
| `TestRemoveMember_Success` | Integration | Remove member, expect 200 |
| `TestGetOrganization_Success` | Integration | Get org details with members |
| `TestAssignSupervisor_Success` | Integration | Assign supervisor ke member |
| `TestGetTeamActivities_Supervisor` | Integration | Supervisor get team activities |

#### 7. Organization Service (`organization_service_test.go`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestCreateOrganization` | Integration | Org tersimpan di DB |
| `TestGetOrganizationMembers` | Integration | Return members dengan roles |
| `TestCheckPermission_Admin` | Unit | Admin punya semua permission |
| `TestCheckPermission_Supervisor` | Unit | Supervisor hanya lihat team-nya |
| `TestCheckPermission_Member` | Unit | Member hanya lihat diri sendiri |

#### 8. Share Handler (`share_handler_test.go`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestCreateShareLink_Success` | Integration | Generate share link, expect token |
| `TestGetSharedData_ValidToken` | Integration | Token valid, return shared data |
| `TestGetSharedData_ExpiredToken` | Integration | Token expired, expect 410 |
| `TestGetSharedData_InvalidToken` | Unit | Token invalid, expect 404 |

#### 9. Daily Summary Service (`daily_summary_service_test.go`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestGenerateDailySummary` | Integration | Generate summary dari activities |
| `TestAggregateActivities` | Unit | Aggregate statistics benar |
| `TestGenerateSummary_NoData` | Unit | Handle empty data gracefully |

#### 10. Notification Service (`notification_service_test.go`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestCreateNotification` | Integration | Notification tersimpan |
| `TestGetUnreadNotifications` | Integration | Return unread only |
| `TestMarkAsRead` | Integration | Status berubah jadi read |
| `TestGetUnreadCount` | Integration | Return correct count |

#### 11. Middleware (`middleware_test.go`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestJWTMiddleware_ValidToken` | Unit | Token valid, request pass |
| `TestJWTMiddleware_NoToken` | Unit | No token, expect 401 |
| `TestJWTMiddleware_InvalidToken` | Unit | Token invalid, expect 401 |
| `TestRoleMiddleware_Authorized` | Unit | Role authorized, request pass |
| `TestRoleMiddleware_Unauthorized` | Unit | Role tidak cukup, expect 403 |

---

## 🟢 WEB (React/TypeScript)

### Testing Framework
- **Unit Test**: Vitest + React Testing Library
- **Integration Test**: Vitest + MSW (untuk mock API jika perlu) atau real API
- **E2E Test**: Playwright (optional, untuk full browser test)

### Test Structure
```
web/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   └── DashboardPage.test.tsx
│   └── lib/
│       ├── api.ts
│       └── api.test.ts
└── tests/
    └── integration/
        └── auth-flow.test.tsx
```

### Test Cases

#### 1. LoginPage (`LoginPage.test.tsx`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `renders login form` | Unit | Form dengan email, password, button tampil |
| `shows validation error for empty email` | Unit | Submit kosong, show error |
| `shows validation error for empty password` | Unit | Password kosong, show error |
| `successful login redirects to dashboard` | Integration | Login berhasil, redirect ke /dashboard |
| `failed login shows error message` | Integration | Login gagal, tampil error message |
| `shows loading state during login` | Unit | Button disabled, spinner tampil |

#### 2. DashboardPage (`DashboardPage.test.tsx`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `renders dashboard with activities` | Integration | Activities dari API tampil di list |
| `renders empty state when no activities` | Integration | Tidak ada data, tampil empty state |
| `filters activities by date` | Integration | Date picker filter, list update |
| `opens screenshot modal on click` | Unit | Click activity, modal tampil |
| `displays activity statistics` | Integration | Stats (total time, categories) tampil |

#### 3. Sidebar (`Sidebar.test.tsx`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `renders navigation links` | Unit | Dashboard, Settings links tampil |
| `shows active state for current route` | Unit | Active route highlighted |
| `logout button clears auth and redirects` | Integration | Click logout, token cleared, redirect login |

#### 4. ShareModal (`ShareModal.test.tsx`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `renders share options` | Unit | Date range, expiry options tampil |
| `generates share link on submit` | Integration | Submit, API called, link tampil |
| `copies link to clipboard` | Unit | Click copy, clipboard updated |
| `shows validation error for invalid dates` | Unit | End < Start, show error |

#### 5. Components (Card, Button, Input, Badge)

| Test Name | Type | Description |
|-----------|------|-------------|
| `Button renders with correct text` | Unit | Text tampil |
| `Button handles click event` | Unit | onClick fired |
| `Button disabled state` | Unit | Disabled, click not fired |
| `Input handles value change` | Unit | onChange fired |
| `Card renders children` | Unit | Children tampil |
| `Badge renders with correct variant` | Unit | Variant class applied |

#### 6. API lib (`api.test.ts`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `api.get attaches auth token` | Unit | Header Authorization ada |
| `api.post sends correct body` | Integration | Body dikirim dengan benar |
| `handles 401 response` | Integration | 401 triggers logout/redirect |
| `handles network error` | Integration | Error ditangani gracefully |

#### 7. Auth hooks (`useAuth.test.ts`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `login stores token` | Integration | Token disimpan di localStorage |
| `logout clears token` | Unit | Token dihapus dari localStorage |
| `isAuthenticated returns correct state` | Unit | Berdasarkan ada/tidaknya token |

---

## 🟣 DESKTOP (Tauri + React + Rust)

### Testing Framework
- **React (Unit/Integration)**: Vitest + React Testing Library
- **Rust (Unit)**: Rust built-in test (`#[cfg(test)]`, `cargo test`)
- **Rust (Integration)**: Rust + tempfile untuk test file operations

### Test Structure
```
desktop/
├── src/
│   ├── hooks/
│   │   ├── useCapture.ts
│   │   └── useCapture.test.ts
│   └── lib/
│       ├── ai.ts
│       └── ai.test.ts
└── src-tauri/
    └── src/
        ├── screenshots.rs
        ├── screenshots_test.rs       <- atau inline #[cfg(test)]
        ├── offline_queue.rs
        └── offline_queue_test.rs
```

### Test Cases

#### 1. useCapture hook (`useCapture.test.ts`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `startCapture sets isCapturing to true` | Unit | State berubah |
| `stopCapture sets isCapturing to false` | Unit | State berubah |
| `capture interval triggers at correct time` | Integration | setInterval dipanggil dengan timing benar |
| `capture handles screenshot error gracefully` | Integration | Error tidak crash app |
| `capture uploads to API on success` | Integration | API dipanggil dengan data benar |

#### 2. useApiKey hook (`useApiKey.test.ts`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `saveApiKey stores to localStorage` | Unit | Key tersimpan |
| `getApiKey returns stored key` | Unit | Key retrieved |
| `hasApiKey returns true when key exists` | Unit | Boolean correct |
| `clearApiKey removes from storage` | Unit | Key removed |

#### 3. useNotification hook (`useNotification.test.ts`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `showNotification adds to queue` | Unit | Notification added |
| `notification auto-dismisses after timeout` | Unit | Removed after timeout |
| `dismissNotification removes from queue` | Unit | Removed on dismiss |

#### 4. AI lib (`ai.test.ts`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `analyzeScreenshot calls AI API` | Integration | Real API dipanggil |
| `analyzeScreenshot parses response correctly` | Integration | Response parsed |
| `analyzeScreenshot handles timeout` | Integration | Timeout error ditangani |
| `analyzeScreenshot handles API error` | Integration | API error ditangani |
| `buildPrompt formats correctly` | Unit | Prompt format benar |

#### 5. aiRetryQueue (`aiRetryQueue.test.ts`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `addToQueue stores item` | Unit | Item tersimpan di localStorage |
| `getQueue returns all items` | Unit | All items retrieved |
| `processQueue retries failed items` | Integration | Retry dipanggil untuk tiap item |
| `removeFromQueue deletes item` | Unit | Item removed |
| `clearExpiredItems removes old items` | Unit | Items > 24h removed |

#### 6. Tauri lib (`tauri.test.ts`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `isTauri returns true in Tauri env` | Unit | Detection works |
| `invoke calls Tauri command` | Integration | Command dipanggil |

#### 7. Logger (`logger.test.ts`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `log.info formats correctly` | Unit | Format [INFO] timestamp message |
| `log.error formats correctly` | Unit | Format [ERROR] timestamp message |
| `log stores to memory/file` | Integration | Logs retrievable |

#### 8. screenshots.rs (Rust)

| Test Name | Type | Description |
|-----------|------|-------------|
| `test_capture_screenshot_windows` | Integration | Screenshot captured on Windows |
| `test_capture_screenshot_macos` | Integration | Screenshot captured on macOS |
| `test_capture_screenshot_linux` | Integration | Screenshot captured on Linux |
| `test_compress_to_webp` | Unit | Image compressed to WebP format |
| `test_resize_image` | Unit | Image resized correctly |

#### 9. offline_queue.rs (Rust)

| Test Name | Type | Description |
|-----------|------|-------------|
| `test_queue_item` | Unit | Item added to queue |
| `test_dequeue_item` | Unit | Item removed from queue |
| `test_persist_to_disk` | Integration | Queue saved to file |
| `test_load_from_disk` | Integration | Queue loaded from file |
| `test_queue_order` | Unit | FIFO order maintained |

#### 10. sync.rs (Rust)

| Test Name | Type | Description |
|-----------|------|-------------|
| `test_upload_success` | Integration | Upload ke real API berhasil |
| `test_upload_network_error` | Integration | Network error, queued for retry |
| `test_sync_offline_queue` | Integration | Queue items synced when online |
| `test_retry_failed_upload` | Integration | Failed upload di-retry |

#### 11. lib.rs (Rust)

| Test Name | Type | Description |
|-----------|------|-------------|
| `test_system_tray_creation` | Unit | Tray created with menu items |
| `test_window_show_hide` | Integration | Window visibility toggle works |
| `test_app_startup` | Integration | App initializes correctly |

#### 12. Desktop Components (React)

##### ActivityTimeline (`ActivityTimeline.test.tsx`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `renders timeline with activities` | Unit | Activities ditampilkan dengan benar |
| `renders empty state` | Unit | No activities, tampil empty message |
| `shows correct time format` | Unit | Timestamp diformat dengan benar |
| `handles activity click` | Unit | Click event fired |

##### SettingsPanel (`SettingsPanel.test.tsx`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `renders all settings options` | Unit | Semua options tampil |
| `saves API key` | Integration | API key tersimpan |
| `validates interval input` | Unit | Invalid interval, show error |
| `toggles auto-start setting` | Unit | Toggle works correctly |

##### ErrorBoundary (`ErrorBoundary.test.tsx`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `renders children when no error` | Unit | Normal render |
| `catches error and shows fallback` | Unit | Error caught, fallback tampil |
| `logs error to console/service` | Unit | Error logged |

##### BrowserWarning (`BrowserWarning.test.tsx`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `shows warning when not in Tauri` | Unit | Warning tampil di browser |
| `hides when in Tauri environment` | Unit | Warning tidak tampil |

##### StatusIndicator (`StatusIndicator.test.tsx`)

| Test Name | Type | Description |
|-----------|------|-------------|
| `shows capturing status` | Unit | Green indicator when capturing |
| `shows idle status` | Unit | Gray indicator when idle |
| `shows error status` | Unit | Red indicator on error |

---

## 🔴 ADDITIONAL TEST TYPES

### E2E Tests (End-to-End)

Full flow testing across components.

#### Backend + Web E2E

| Test Name | Description |
|-----------|-------------|
| `TestE2E_LoginFlow` | Open login page → Enter credentials → Submit → Redirected to dashboard |
| `TestE2E_ViewActivities` | Login → Navigate to dashboard → See activity list → Click activity → See detail |
| `TestE2E_ShareLink` | Login → Create share link → Open link in incognito → See shared data |
| `TestE2E_OrganizationManagement` | Login as owner → Add member → Change role → Remove member |

#### Desktop E2E

| Test Name | Description |
|-----------|-------------|
| `TestE2E_CaptureFlow` | Start app → Login → Start capture → Wait 5 min → Stop → See activities |
| `TestE2E_OfflineSync` | Disconnect network → Capture → Reconnect → Data synced |
| `TestE2E_SettingsChange` | Open settings → Change interval → Save → Verify interval changed |

### Error Handling Tests

#### Backend Error Tests

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestDB_ConnectionLost` | Integration | DB disconnected mid-request, graceful error |
| `TestDB_Timeout` | Integration | Query timeout, return 503 |
| `TestAI_APITimeout` | Integration | AI API timeout, proper error message |
| `TestAI_RateLimited` | Integration | AI returns 429, handle gracefully |
| `TestAuth_ExpiredToken` | Unit | Token expired, return 401 |
| `TestUpload_InvalidImage` | Unit | Invalid image format, return 400 |
| `TestUpload_TooLarge` | Unit | Image > max size, return 413 |

#### Web/Desktop Error Tests

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestNetwork_Offline` | Integration | Network lost, show offline message |
| `TestAPI_ServerError` | Integration | 500 error, show error toast |
| `TestAPI_Timeout` | Integration | Request timeout, retry or show error |
| `TestCapture_ScreenshotFailed` | Integration | Screenshot fails, log and continue |

### Edge Case Tests

#### Backend Edge Cases

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestActivity_EmptyList` | Unit | No activities, return empty array not null |
| `TestActivity_NullCategory` | Unit | Category null, default to "other" |
| `TestActivity_FutureDate` | Unit | Captured_at in future, reject or normalize |
| `TestUser_VeryLongEmail` | Unit | Email 255 chars, handle correctly |
| `TestOrg_MaxMembers` | Integration | Org with 1000 members, performance OK |
| `TestSummary_NoActivities` | Unit | Generate summary with 0 activities |
| `TestDate_Timezone` | Integration | Different timezones, correct date handling |
| `TestPagination_BeyondLimit` | Unit | Page 9999, return empty not error |

#### Web/Desktop Edge Cases

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestDashboard_LargeDataset` | Integration | 10000 activities, no freeze |
| `TestInput_SpecialChars` | Unit | Input dengan <script> tag, sanitized |
| `TestDate_InvalidRange` | Unit | End date before start, show error |
| `TestCapture_RapidStartStop` | Integration | Start/stop rapidly, no race condition |

### Security Tests

#### Backend Security

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestSQL_Injection` | Unit | Input `'; DROP TABLE users;--`, properly escaped |
| `TestXSS_InSummary` | Unit | Summary contains `<script>`, sanitized |
| `TestAuth_BruteForce` | Integration | 10 failed logins, rate limited |
| `TestAuth_TokenReuse` | Unit | Reuse logged-out token, rejected |
| `TestAuth_CrossOrg` | Integration | User A access User B data, rejected |
| `TestAPI_MissingAuth` | Unit | All protected endpoints without token, 401 |
| `TestUpload_MaliciousFile` | Unit | Upload .exe as image, rejected |
| `TestPath_Traversal` | Unit | Path `../../etc/passwd`, rejected |

#### Web/Desktop Security

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestToken_NotInURL` | Unit | Token tidak exposed di URL |
| `TestStorage_Encrypted` | Unit | Sensitive data encrypted in localStorage |
| `TestAPIKey_NotLogged` | Unit | API key tidak muncul di logs |

### Concurrent Tests

| Test Name | Type | Description |
|-----------|------|-------------|
| `TestConcurrent_MultipleLogins` | Integration | Same user login from 2 devices |
| `TestConcurrent_SimultaneousCapture` | Integration | Multiple users capturing at same time |
| `TestConcurrent_BulkInsert` | Integration | 100 activities inserted simultaneously |
| `TestRace_TokenRefresh` | Integration | Token refresh while request in-flight |
| `TestRace_ActivityUpdate` | Integration | Update same activity from 2 sources |

---

## 📊 Test Execution Plan

### Phase 1: Backend Tests (Priority: HIGH)
1. Auth Handler & Service tests
2. Activity Handler & Service tests
3. Middleware tests
4. Organization tests
5. AI Service tests (real API)

### Phase 2: Web Tests (Priority: MEDIUM)
1. Component unit tests
2. Page integration tests
3. API lib tests

### Phase 3: Desktop Tests (Priority: MEDIUM)
1. React hooks unit tests
2. Lib unit tests
3. Rust unit tests
4. Rust integration tests

### Commands

```bash
# Backend
cd backend && go test ./... -v

# Web
cd web && pnpm test

# Desktop (React)
cd desktop && pnpm test

# Desktop (Rust)
cd desktop/src-tauri && cargo test
```

---

## 📝 Notes

- **Real API Testing**: Semua integration test menggunakan real API (backend + AI)
- **Test Database**: Backend tests menggunakan PostgreSQL test database terpisah
- **Test User**: Perlu setup test user di database untuk auth tests
- **AI API Key**: Test memerlukan valid AI API key di environment
- **CI/CD**: Tests akan dijalankan di CI pipeline sebelum deploy

### AI API Configuration untuk Testing

Konfigurasi AI API sudah tersedia di `backend/.env`:

```bash
# Z.AI API Configuration
ZAI_API_KEY=3c33151a4acf4cfb88d28ccf2165e771.YkunVsPApJisCtdA
ZAI_BASE_URL=https://api.z.ai/api/coding/paas/v4
ZAI_VISION_MODEL_PRIMARY=glm-4.6v
```

#### Model yang Tersedia

| Model | Fungsi | Endpoint |
|-------|--------|----------|
| `glm-4.6v` | Vision - Analisis Screenshot | `/chat/completions` |
| `glm-4.7` | Text - Generate Summary | `/chat/completions` |

#### Contoh Test Script

Sudah ada script test di folder `test/`:

| File | Fungsi |
|------|--------|
| `test/send_image_zai.py` | Test kirim image ke AI untuk analisis |
| `test/send_text_zai.py` | Test generate text summary |
| `test/test_login.py` | Test login flow |

#### Penggunaan di Go Test

```go
// backend/tests/testutils/ai_config.go
package testutils

import "os"

type AIConfig struct {
    APIKey     string
    BaseURL    string
    VisionModel string
}

func GetTestAIConfig() *AIConfig {
    return &AIConfig{
        APIKey:     os.Getenv("ZAI_API_KEY"),
        BaseURL:    os.Getenv("ZAI_BASE_URL"),
        VisionModel: os.Getenv("ZAI_VISION_MODEL_PRIMARY"),
    }
}

// TestAI_RealImageAnalysis - test dengan real API
func (s *AIServiceTestSuite) TestAnalyzeScreenshot_RealAPI() {
    // Load test screenshot
    screenshotData, _ := testutils.GetTestScreenshotBytes(testutils.ScreenshotCoding)
    
    // Call real AI API
    result, err := s.aiService.AnalyzeScreenshot(context.Background(), screenshotData)
    
    s.Require().NoError(err)
    s.NotEmpty(result.AppName)
    s.NotEmpty(result.Category)
    s.NotEmpty(result.Summary)
}
```

---

## 📚 Testing Documentation

### Test Naming Convention

#### Backend (Go)

```go
// Format: Test<Entity>_<Scenario>_<ExpectedResult>
func TestLogin_ValidCredentials_ReturnsToken(t *testing.T) {}
func TestLogin_WrongPassword_Returns401(t *testing.T) {}
func TestActivity_EmptyList_ReturnsEmptyArray(t *testing.T) {}

// Untuk table-driven tests
func TestActivity_Create(t *testing.T) {
    tests := []struct {
        name     string
        input    ActivityInput
        wantCode int
        wantErr  bool
    }{
        {"valid input", validInput, 201, false},
        {"missing app_name", missingAppName, 400, true},
    }
    // ...
}
```

#### Web/Desktop (TypeScript)

```typescript
// Format: describe('<Component>') -> it('<should do something>')
describe('LoginPage', () => {
  it('should render login form', () => {});
  it('should show error for empty email', () => {});
  it('should redirect on successful login', () => {});
});

// Atau format alternatif
describe('LoginPage', () => {
  describe('when form is empty', () => {
    it('shows validation error', () => {});
  });
  describe('when credentials are valid', () => {
    it('redirects to dashboard', () => {});
  });
});
```

#### Rust

```rust
// Format: test_<function>_<scenario>_<expected>
#[test]
fn test_capture_screenshot_windows_success() {}

#[test]
fn test_capture_screenshot_linux_missing_permission() {}

#[test]
fn test_queue_item_fifo_order_maintained() {}
```

### How to Add New Tests

#### 1. Backend (Go)

```bash
# 1. Buat file test di folder yang sama dengan file yang ditest
touch backend/internal/handlers/new_handler_test.go

# 2. Struktur dasar
```

```go
package handlers_test

import (
    "testing"
    "github.com/stretchr/testify/suite"
)

type NewHandlerTestSuite struct {
    suite.Suite
    fixtures *testutils.TestFixtures
}

func (s *NewHandlerTestSuite) SetupSuite() {
    // Setup
}

func (s *NewHandlerTestSuite) TearDownSuite() {
    // Cleanup
}

func (s *NewHandlerTestSuite) TestNewEndpoint_Success() {
    // Test
}

func TestNewHandlerSuite(t *testing.T) {
    suite.Run(t, new(NewHandlerTestSuite))
}
```

```bash
# 3. Run test
cd backend && go test ./internal/handlers -run TestNewHandler -v
```

#### 2. Web/Desktop (TypeScript)

```bash
# 1. Buat file test di samping component
touch web/src/components/NewComponent.test.tsx

# 2. Struktur dasar
```

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NewComponent } from './NewComponent';

describe('NewComponent', () => {
  it('renders correctly', () => {
    render(<NewComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles click event', () => {
    const onClick = vi.fn();
    render(<NewComponent onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

```bash
# 3. Run test
cd web && pnpm test NewComponent
```

#### 3. Rust

```rust
// Di dalam file yang sama (inline tests)
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_function() {
        let result = new_function();
        assert_eq!(result, expected);
    }
}
```

```bash
# Run test
cd desktop/src-tauri && cargo test new_function
```

### Debugging Failed Tests

#### Backend (Go)

```bash
# 1. Run specific test dengan verbose
go test ./internal/handlers -run TestLogin_Success -v

# 2. Dengan debugging output
go test ./... -v 2>&1 | tee test.log

# 3. Check test database
psql -h localhost -U postgres -d timetrack_test -c "SELECT * FROM users;"

# 4. Reset test database
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS timetrack_test; CREATE DATABASE timetrack_test;"
```

#### Web/Desktop (TypeScript)

```bash
# 1. Run specific test
pnpm test LoginPage -- --reporter=verbose

# 2. Run dengan UI mode untuk debugging
pnpm test -- --ui

# 3. Run single test file
pnpm test src/components/Button.test.tsx

# 4. Debug mode (attach debugger)
pnpm test -- --inspect-brk
```

#### Rust

```bash
# 1. Run specific test dengan output
cargo test test_capture -- --nocapture

# 2. Run dengan backtrace
RUST_BACKTRACE=1 cargo test

# 3. Run ignored tests
cargo test -- --ignored
```

### Test Data Reset

#### Antar Test Suite (Automatic)

```go
// Di TearDownSuite - HARUS dipanggil
func (s *AuthTestSuite) TearDownSuite() {
    s.fixtures.Cleanup(context.Background())
}
```

#### Manual Reset (Development)

```bash
# Backend: Reset test database
psql -h localhost -U postgres <<EOF
DROP DATABASE IF EXISTS timetrack_test;
CREATE DATABASE timetrack_test;
EOF

# Apply migrations
cd backend && go run ./cmd/migrate -db "postgres://postgres:postgres@localhost:5432/timetrack_test?sslmode=disable" up

# Web/Desktop: Clear localStorage (dalam browser console)
localStorage.clear()
```

#### Reset Specific Data

```go
// Helper untuk reset specific table tanpa full cleanup
func (f *TestFixtures) ResetActivities(ctx context.Context) {
    f.DB.Exec(ctx, "DELETE FROM activities WHERE user_id = $1", f.Member.ID)
    f.Activities = createSampleActivities(ctx, f.DB, f.Member.ID, 10)
}

func (f *TestFixtures) ResetSessions(ctx context.Context) {
    f.DB.Exec(ctx, "DELETE FROM sessions")
    f.OwnerToken = createSession(ctx, f.DB, f.Owner.ID)
    f.AdminToken = createSession(ctx, f.DB, f.Admin.ID)
    f.MemberToken = createSession(ctx, f.DB, f.Member.ID)
}
```

### Test Isolation

#### Prinsip

1. **Setiap test suite harus independent** - tidak bergantung pada test lain
2. **Data dibuat di SetupSuite, dihapus di TearDownSuite**
3. **Jangan modify fixtures data** - buat data baru jika perlu modify
4. **Gunakan unique identifiers** - email: `test-{uuid}@test.com`

#### Contoh Isolation

```go
func (s *AuthTestSuite) TestRegister_CreatesNewUser() {
    // Buat email unique untuk test ini
    uniqueEmail := fmt.Sprintf("newuser-%s@test.com", uuid.New().String()[:8])
    
    body := fmt.Sprintf(`{"email": "%s", "password": "Test123!"}`, uniqueEmail)
    resp := s.doRequest("POST", "/auth/register", body, "")
    
    s.Equal(201, resp.Code)
    
    // Cleanup: hapus user yang baru dibuat
    s.fixtures.DB.Exec(context.Background(), 
        "DELETE FROM users WHERE email = $1", uniqueEmail)
}
```
