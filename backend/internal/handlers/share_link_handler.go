// [
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

type ShareLinkHandler struct {
	linkService     *services.ShareLinkService
	activityService *services.ActivityService
}

func NewShareLinkHandler(linkService *services.ShareLinkService, activityService *services.ActivityService) *ShareLinkHandler {
	return &ShareLinkHandler{linkService: linkService, activityService: activityService}
}

func (h *ShareLinkHandler) Create(c *gin.Context) {
	user := c.MustGet("user").(*models.User)

	var input models.CreateSharedLinkInput
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

	link, err := h.linkService.Create(c.Request.Context(), user.ID, &input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   gin.H{"code": "INTERNAL_ERROR", "message": "Failed to create share link"},
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    link,
	})
}

func (h *ShareLinkHandler) List(c *gin.Context) {
	user := c.MustGet("user").(*models.User)

	links, err := h.linkService.ListByUser(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   gin.H{"code": "INTERNAL_ERROR", "message": "Failed to list share links"},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    links,
	})
}

func (h *ShareLinkHandler) Delete(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	linkIDStr := c.Param("id")
	linkID, err := uuid.Parse(linkIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "INVALID_ID", "message": "Invalid link ID"}})
		return
	}

	err = h.linkService.Delete(c.Request.Context(), user.ID, linkID)
	if err != nil {
		if errors.Is(err, services.ErrLinkNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": gin.H{"code": "NOT_FOUND", "message": "Link not found"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to delete link"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": nil})
}

func (h *ShareLinkHandler) GetPublicStats(c *gin.Context) {
	slug := c.Param("slug")
	link, err := h.linkService.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": gin.H{"code": "NOT_FOUND", "message": "Shared link not found or expired"}})
		return
	}

	// For now, public links just show stats. Activities could be sensitive.
	stats, err := h.activityService.GetStats(c.Request.Context(), link.UserID, time.Time{}, time.Time{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to fetch stats"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"link_name": link.Name,
			"stats":     stats,
		},
	})
}
