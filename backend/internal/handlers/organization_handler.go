// backend/internal/handlers/organization_handler.go
package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/timetrack/backend/internal/models"
	"github.com/timetrack/backend/internal/services"
)

type OrganizationHandler struct {
	orgService *services.OrganizationService
}

func NewOrganizationHandler(orgService *services.OrganizationService) *OrganizationHandler {
	return &OrganizationHandler{orgService: orgService}
}

// GetOrganization returns the current user's organization details
func (h *OrganizationHandler) GetOrganization(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	if user.OrganizationID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User does not belong to an organization"})
		return
	}

	org, err := h.orgService.GetOrganization(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organization"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    org,
	})
}

// UpdateSettings updates organization settings (Owner only)
func (h *OrganizationHandler) UpdateSettings(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	if user.OrganizationID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User does not belong to an organization"})
		return
	}

	if user.Role != "owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only owner can update organization settings"})
		return
	}

	var input struct {
		Name     string `json:"name"`
		Timezone string `json:"timezone"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	org, err := h.orgService.UpdateSettings(c.Request.Context(), *user.OrganizationID, input.Name, input.Timezone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    org,
	})
}

// SetAPIKey sets the AI API key (Owner only)
func (h *OrganizationHandler) SetAPIKey(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	if user.OrganizationID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User does not belong to an organization"})
		return
	}

	if user.Role != "owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only owner can manage API key"})
		return
	}

	var input struct {
		APIKey string `json:"api_key" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.orgService.SetAPIKey(c.Request.Context(), *user.OrganizationID, input.APIKey); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set API key"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// RemoveAPIKey removes the AI API key (Owner only)
func (h *OrganizationHandler) RemoveAPIKey(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	if user.OrganizationID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User does not belong to an organization"})
		return
	}

	if user.Role != "owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only owner can manage API key"})
		return
	}

	if err := h.orgService.RemoveAPIKey(c.Request.Context(), *user.OrganizationID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove API key"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// GetDecryptedAPIKey fetches the decrypted API key (Authenticated members)
func (h *OrganizationHandler) GetDecryptedAPIKey(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	if user.OrganizationID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User does not belong to an organization"})
		return
	}

	// Any member can fetch the key securely to use in desktop app
	apiKey, err := h.orgService.GetDecryptedAPIKey(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"api_key": apiKey,
		},
	})
}

// ListMembers lists all members (Owner/Admin only)
func (h *OrganizationHandler) ListMembers(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	if user.OrganizationID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User does not belong to an organization"})
		return
	}

	if user.Role != "owner" && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	members, err := h.orgService.GetMembers(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list members"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    members,
	})
}

// AddMember adds a new member (Owner/Admin only)
func (h *OrganizationHandler) AddMember(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	if user.OrganizationID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User does not belong to an organization"})
		return
	}

	if user.Role != "owner" && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=8"`
		Name     string `json:"name"`
		Role     string `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	member, err := h.orgService.AddMember(c.Request.Context(), *user.OrganizationID, input.Email, input.Password, input.Name, input.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    member,
	})
}

// UpdateMember updates a member (Owner/Admin only)
func (h *OrganizationHandler) UpdateMember(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	if user.OrganizationID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User does not belong to an organization"})
		return
	}

	if user.Role != "owner" && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	memberIDParam := c.Param("id")
	memberID, err := uuid.Parse(memberIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid member ID"})
		return
	}

	var input struct {
		Name string `json:"name"`
		Role string `json:"role"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	member, err := h.orgService.UpdateMember(c.Request.Context(), *user.OrganizationID, memberID, input.Name, input.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    member,
	})
}

// RemoveMember removes a member (Owner/Admin only)
// Owner can remove any member except themselves
// Admin cannot remove Owner or other Admins
func (h *OrganizationHandler) RemoveMember(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	if user.OrganizationID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User does not belong to an organization"})
		return
	}

	if user.Role != "owner" && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	memberIDParam := c.Param("id")
	memberID, err := uuid.Parse(memberIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid member ID"})
		return
	}

	err = h.orgService.RemoveMember(c.Request.Context(), *user.OrganizationID, memberID, user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// GetOrganizationStats retrieves organization stats (Owner/Admin only)
func (h *OrganizationHandler) GetOrganizationStats(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	if user.OrganizationID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User does not belong to an organization"})
		return
	}

	if user.Role != "owner" && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	fromStr := c.Query("from")
	toStr := c.Query("to")

	var from, to time.Time
	var err error

	if fromStr != "" {
		from, err = time.Parse("2006-01-02", fromStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid from date format (use YYYY-MM-DD)"})
			return
		}
	}

	if toStr != "" {
		to, err = time.Parse("2006-01-02", toStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid to date format (use YYYY-MM-DD)"})
			return
		}
		to = to.Add(24 * time.Hour) // Include the whole day
	}

	stats, err := h.orgService.GetOrganizationStats(c.Request.Context(), *user.OrganizationID, from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get organization stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

// GetMembersSummary retrieves summary of all members (Owner/Admin only)
func (h *OrganizationHandler) GetMembersSummary(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	if user.OrganizationID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User does not belong to an organization"})
		return
	}

	if user.Role != "owner" && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	fromStr := c.Query("from")
	toStr := c.Query("to")

	var from, to time.Time
	var err error

	if fromStr != "" {
		from, err = time.Parse("2006-01-02", fromStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid from date format (use YYYY-MM-DD)"})
			return
		}
	}

	if toStr != "" {
		to, err = time.Parse("2006-01-02", toStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid to date format (use YYYY-MM-DD)"})
			return
		}
		to = to.Add(24 * time.Hour)
	}

	summaries, err := h.orgService.GetMembersSummary(c.Request.Context(), *user.OrganizationID, from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get members summary"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    summaries,
	})
}

// GetMemberActivities retrieves activities for a specific member (Owner/Admin only)
func (h *OrganizationHandler) GetMemberActivities(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	if user.OrganizationID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User does not belong to an organization"})
		return
	}

	if user.Role != "owner" && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	memberIDParam := c.Param("id")
	memberID, err := uuid.Parse(memberIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid member ID"})
		return
	}

	fromStr := c.Query("from")
	toStr := c.Query("to")
	page := c.DefaultQuery("page", "1")
	perPage := c.DefaultQuery("per_page", "20")

	var from, to time.Time

	if fromStr != "" {
		from, err = time.Parse("2006-01-02", fromStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid from date format (use YYYY-MM-DD)"})
			return
		}
	}

	if toStr != "" {
		to, err = time.Parse("2006-01-02", toStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid to date format (use YYYY-MM-DD)"})
			return
		}
		to = to.Add(24 * time.Hour)
	}

	pageInt := 1
	perPageInt := 20
	if p, err := strconv.Atoi(page); err == nil && p > 0 {
		pageInt = p
	}
	if pp, err := strconv.Atoi(perPage); err == nil && pp > 0 && pp <= 100 {
		perPageInt = pp
	}

	activities, total, err := h.orgService.GetMemberActivities(c.Request.Context(), *user.OrganizationID, memberID, from, to, pageInt, perPageInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    activities,
		"meta": gin.H{
			"page":     pageInt,
			"per_page": perPageInt,
			"total":    total,
		},
	})
}

// GetMemberStats retrieves statistics for a specific member (Owner/Admin only)
func (h *OrganizationHandler) GetMemberStats(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	if user.OrganizationID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User does not belong to an organization"})
		return
	}

	if user.Role != "owner" && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	memberIDParam := c.Param("id")
	memberID, err := uuid.Parse(memberIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid member ID"})
		return
	}

	fromStr := c.Query("from")
	toStr := c.Query("to")

	var from, to time.Time

	if fromStr != "" {
		from, err = time.Parse("2006-01-02", fromStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid from date format (use YYYY-MM-DD)"})
			return
		}
	}

	if toStr != "" {
		to, err = time.Parse("2006-01-02", toStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid to date format (use YYYY-MM-DD)"})
			return
		}
		to = to.Add(24 * time.Hour)
	}

	stats, err := h.orgService.GetMemberStats(c.Request.Context(), *user.OrganizationID, memberID, from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

// GetActivityHeatmap retrieves activity heatmap for a date (Owner/Admin only)
func (h *OrganizationHandler) GetActivityHeatmap(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	if user.OrganizationID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User does not belong to an organization"})
		return
	}

	if user.Role != "owner" && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	dateStr := c.Query("date")
	var date time.Time
	var err error

	if dateStr != "" {
		date, err = time.Parse("2006-01-02", dateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format (use YYYY-MM-DD)"})
			return
		}
	}

	heatmap, err := h.orgService.GetActivityHeatmap(c.Request.Context(), *user.OrganizationID, date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get activity heatmap"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    heatmap,
	})
}
