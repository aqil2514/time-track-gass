# Task 15: Add Sessions API Endpoints

## Meta
- **File**: `backend/internal/handlers/session_handler.go`
- **Action**: create
- **Depends**: [14]
- **Priority**: P1
- **Phase**: 3

## Objective
Add HTTP handlers for sessions API endpoints.

## Requirements
- GET /api/v1/sessions - List sessions
- GET /api/v1/sessions/:id - Get session details
- POST /api/v1/sessions/:id/summary - Generate session summary
- Lazy load summaries on first access

## Acceptance Criteria
- [ ] SessionHandler struct defined
- [ ] `List` handler implemented
- [ ] `Get` handler implemented
- [ ] `GenerateSummary` handler implemented
- [ ] Routes registered in main.go
- [ ] Lazy summary loading (generate if missing)

## Implementation Notes

```go
// backend/internal/handlers/session_handler.go

package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/timetrack/backend/internal/models"
	"github.com/timetrack/backend/internal/services"
)

type SessionHandler struct {
	sessionService *services.SessionService
}

func NewSessionHandler(sessionService *services.SessionService) *SessionHandler {
	return &SessionHandler{
		sessionService: sessionService,
	}
}

// List handles GET /api/v1/sessions
func (h *SessionHandler) List(c *gin.Context) {
	userID := c.MustGet("user_id").(string)

	// Parse query params
	var from, to time.Time
	if fromStr := c.Query("from"); fromStr != "" {
		from, _ = time.Parse(time.RFC3339, fromStr)
	} else {
		from = time.Now().Truncate(24 * time.Hour)
	}

	if toStr := c.Query("to"); toStr != "" {
		to, _ = time.Parse(time.RFC3339, toStr)
	} else {
		to = from.Add(24 * time.Hour)
	}

	category := c.Query("category")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	// Parse user ID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	sessions, total, err := h.sessionService.List(c.Request.Context(), userUUID, from, to, category, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  sessions,
		"total": total,
		"page":  page,
		"per_page": perPage,
	})
}

// Get handles GET /api/v1/sessions/:id
func (h *SessionHandler) Get(c *gin.Context) {
	userID := c.MustGet("user_id").(string)
	sessionID := c.Param("id")

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	sessionUUID, err := uuid.Parse(sessionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session_id"})
		return
	}

	session, err := h.sessionService.Get(c.Request.Context(), userUUID, sessionUUID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": session})
}

// GenerateSummary handles POST /api/v1/sessions/:id/summary
func (h *SessionHandler) GenerateSummary(c *gin.Context) {
	userID := c.MustGet("user_id").(string)
	sessionID := c.Param("id")

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	sessionUUID, err := uuid.Parse(sessionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session_id"})
		return
	}

	// Check if summary already exists
	session, err := h.sessionService.Get(c.Request.Context(), userUUID, sessionUUID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	if session.Summary != "" && !c.GetBool("force") {
		// Summary exists, return it
		c.JSON(http.StatusOK, gin.H{"data": session})
		return
	}

	// Fetch activities for this session
	activities, err := h.sessionService.GetSessionActivities(c.Request.Context(), sessionUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Generate summary
	summary, err := h.sessionService.GenerateSummary(c.Request.Context(), sessionUUID, activities)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Summary generated",
		"data": gin.H{
			"summary": summary,
		},
	})
}
```

## Route Registration

```go
// In cmd/api/main.go

sessionService := services.NewSessionService(db, aiService)
sessionHandler := handlers.NewSessionHandler(sessionService)

// Protected routes
protected := v1.Group("")
protected.Use(middleware.AuthMiddleware(authService))
{
    // ... existing routes

    // Session routes (NEW)
    protected.GET("/sessions", sessionHandler.List)
    protected.GET("/sessions/:id", sessionHandler.Get)
    protected.POST("/sessions/:id/summary", sessionHandler.GenerateSummary)
}
```

## API Usage

```bash
# List sessions for today
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/sessions?from=2025-01-20T00:00:00Z"

# Get specific session
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/sessions/{session_id}"

# Generate session summary
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/sessions/{session_id}/summary"

# Force regenerate summary
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/sessions/{session_id}/summary?force=true"
```
