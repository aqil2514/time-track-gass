// backend/internal/handlers/notification_handler.go
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/timetrack/backend/internal/models"
	"github.com/timetrack/backend/internal/services"
)

type NotificationHandler struct {
	notifService *services.NotificationService
}

func NewNotificationHandler(notifService *services.NotificationService) *NotificationHandler {
	return &NotificationHandler{notifService: notifService}
}

// CreateNotification allows creating a notification (e.g. from Desktop app for AI failures)
func (h *NotificationHandler) CreateNotification(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	if user.OrganizationID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User does not belong to an organization"})
		return
	}

	var input models.CreateNotificationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If user_id is not set in input, default to current user if type is personal?
	// Or maybe Desktop app sends 'ai_failure' for the current user.
	if input.UserID == "" {
		input.UserID = user.ID.String()
	}

	notif, err := h.notifService.CreateNotification(c.Request.Context(), *user.OrganizationID, &input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    notif,
	})
}

// ListNotifications lists notifications for Admin/Owner (all org notifications) or Members (their own only)
func (h *NotificationHandler) ListNotifications(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	if user.OrganizationID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User does not belong to an organization"})
		return
	}

	// Admin/Owner can see all organization notifications
	// Members can only see their own notifications
	var userID *uuid.UUID
	if user.Role != "owner" && user.Role != "admin" {
		userID = &user.ID
	}

	notifs, err := h.notifService.ListNotifications(c.Request.Context(), *user.OrganizationID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    notifs,
	})
}

// MarkAsRead marks a notification as read
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	if err := h.notifService.MarkAsRead(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}
