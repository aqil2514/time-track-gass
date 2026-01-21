// backend/internal/handlers/health_handler.go
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/timetrack/backend/internal/services"
)

type HealthHandler struct {
	workerPool *services.WorkerPool
}

func NewHealthHandler(workerPool *services.WorkerPool) *HealthHandler {
	return &HealthHandler{
		workerPool: workerPool,
	}
}

// Health returns basic health status
func (h *HealthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
	})
}

// DetailedHealth returns detailed health and queue status
func (h *HealthHandler) DetailedHealth(c *gin.Context) {
	stats, err := h.workerPool.GetStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"workers": gin.H{
			"active": stats.ActiveWorkers,
			"total":  stats.TotalWorkers,
		},
		"queue": stats.QueueStats,
	})
}
