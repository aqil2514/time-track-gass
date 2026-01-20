// backend/internal/handlers/activity_handler.go
package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/timetrack/backend/internal/models"
	"github.com/timetrack/backend/internal/services"
)

const (
	maxImageSize = 10 * 1024 * 1024 // 10MB max image size
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

	// Validate image size
	if len(input.Image) > maxImageSize {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "IMAGE_TOO_LARGE",
				"message": "Image size exceeds maximum allowed size of 10MB",
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
