# Task 11: Add Health Endpoint with Queue Metrics

## Meta
- **File**: `backend/internal/handlers/health_handler.go`
- **Action**: create
- **Depends**: [08]
- **Priority**: P1
- **Phase**: 2

## Objective
Add health check endpoint that includes retry queue metrics.

## Requirements
- Basic health check (DB connectivity)
- Retry queue statistics
- AI service status

## Acceptance Criteria
- [ ] Health handler created
- [ ] `/health` endpoint returns queue metrics
- [ ] Returns DB status
- [ ] Returns AI service status
- [ ] Returns queue metrics (pending, success, failed, avg retry count)

## Implementation Notes

```go
// backend/internal/handlers/health_handler.go

package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/timetrack/backend/internal/services"
)

type HealthHandler struct {
	db          *pgxpool.Pool
	retryQueue  *services.RetryQueue
	aiService   *services.AIService
}

func NewHealthHandler(db *pgxpool.Pool, retryQueue *services.RetryQueue, aiService *services.AIService) *HealthHandler {
	return &HealthHandler{
		db:         db,
		retryQueue: retryQueue,
		aiService:  aiService,
	}
}

type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp string            `json:"timestamp"`
	Services  ServicesHealth    `json:"services"`
	Queue     *QueueMetrics     `json:"queue,omitempty"`
}

type ServicesHealth struct {
	Database string `json:"database"`
	AI       string `json:"ai"`
}

type QueueMetrics struct {
	TotalPending  int64   `json:"total_pending"`
	TotalSuccess  int64   `json:"total_success"`
	TotalFailed   int64   `json:"total_failed"`
	CurrentQueued int64   `json:"current_queued"`
	AvgRetryCount float64 `json:"avg_retry_count"`
}

// Health returns health status with optional queue metrics
func (h *HealthHandler) Health(c *gin.Context) {
	ctx := context.Background()

	response := HealthResponse{
		Status:    "ok",
		Timestamp: time.Now().Format(time.RFC3339),
		Services: ServicesHealth{
			Database: h.checkDatabase(ctx),
			AI:       h.checkAIService(),
		},
	}

	// Add queue metrics if available
	if h.retryQueue != nil {
		if metrics, err := h.retryQueue.GetMetrics(ctx); err == nil {
			response.Queue = &QueueMetrics{
				TotalPending:  metrics.TotalPending,
				TotalSuccess:  metrics.TotalSuccess,
				TotalFailed:   metrics.TotalFailed,
				CurrentQueued: metrics.CurrentQueued,
				AvgRetryCount: metrics.AvgRetryCount,
			}
		}
	}

	statusCode := http.StatusOK
	if response.Services.Database != "ok" || response.Services.AI != "ok" {
		statusCode = http.StatusServiceUnavailable
		response.Status = "degraded"
	}

	c.JSON(statusCode, response)
}

func (h *HealthHandler) checkDatabase(ctx context.Context) string {
	if err := h.db.Ping(ctx); err != nil {
		return "error: " + err.Error()
	}
	return "ok"
}

func (h *HealthHandler) checkAIService() string {
	if h.aiService == nil {
		return "not configured"
	}
	// Simple check - AI service is always "ok" if configured
	// Actual connectivity is checked during API calls
	return "ok"
}

// SimpleHealth returns a simple health check (for load balancers)
func (h *HealthHandler) SimpleHealth(c *gin.Context) {
	ctx := context.Background()
	if err := h.db.Ping(ctx); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
```

## Add Route

```go
// In cmd/api/main.go, add health routes

healthHandler := handlers.NewHealthHandler(db, retryQueue, aiService)

// Public routes
r.GET("/health", healthHandler.SimpleHealth)
r.GET("/health/detailed", healthHandler.Health)
```

## Example Response

```json
{
  "status": "ok",
  "timestamp": "2025-01-20T10:30:00Z",
  "services": {
    "database": "ok",
    "ai": "ok"
  },
  "queue": {
    "total_pending": 156,
    "total_success": 2340,
    "total_failed": 12,
    "current_queued": 45,
    "avg_retry_count": 1.2
  }
}
```

## Usage

```bash
# Simple health check (for load balancers)
curl http://localhost:8080/health

# Detailed health with metrics
curl http://localhost:8080/health/detailed
```
