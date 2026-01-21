// backend/internal/handlers/share_handler.go
package handlers

import (
	"errors"
	"net/http"
	"time"

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

	var from, to time.Time

	if input.From != "" {
		from, err = time.Parse("2006-01-02", input.From)
		if err != nil {
			// Try RFC3339 as fallback
			from, err = time.Parse(time.RFC3339, input.From)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Invalid from date format (use YYYY-MM-DD or RFC3339)",
					},
				})
				return
			}
		}
	}

	if input.To != "" {
		to, err = time.Parse("2006-01-02", input.To)
		if err != nil {
			// Try RFC3339 as fallback
			to, err = time.Parse(time.RFC3339, input.To)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Invalid to date format (use YYYY-MM-DD or RFC3339)",
					},
				})
				return
			}
		} else {
			to = to.Add(24 * time.Hour) // If string was YYYY-MM-DD, include whole day
		}
	}

	activities, total, err := h.activityService.List(c.Request.Context(), userID, from, to, input.Category, input.Page, input.PerPage)
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

	// Get stats from query params
	fromStr := c.Query("from")
	toStr := c.Query("to")

	var from, to time.Time

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

	stats, err := h.activityService.GetStats(c.Request.Context(), userID, from, to)
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
