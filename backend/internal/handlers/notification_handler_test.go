// backend/internal/handlers/notification_handler_test.go
package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/timetrack/backend/internal/config"
	"github.com/timetrack/backend/internal/models"
	"github.com/timetrack/backend/internal/services"
	"github.com/timetrack/backend/tests/testutils"
)

type NotificationHandlerTestSuite struct {
	suite.Suite
	db              *testutils.TestFixtures
	notifHandler    *NotificationHandler
	notifService    *services.NotificationService
	authService     *services.AuthService
}

func (s *NotificationHandlerTestSuite) SetupSuite() {
	db := testutils.ConnectTestDB()

	var err error
	s.db, err = testutils.SetupFixtures(context.Background(), db)
	s.Require().NoError(err)

	// Create services
	cfg := &config.Config{
		DatabaseURL:   "",
		EncryptionKey: "test-32-byte-hex-key-here-123456",
	}
	orgService := services.NewOrganizationService(db, cfg)
	s.authService = services.NewAuthService(db)
	s.authService.SetOrganizationService(orgService)

	s.notifService = services.NewNotificationService(db)
	s.notifHandler = NewNotificationHandler(s.notifService)
}

func (s *NotificationHandlerTestSuite) TearDownSuite() {
	testutils.CleanupTestDB(context.Background(), s.db.DB)
	s.db.DB.Close()
}

func (s *NotificationHandlerTestSuite) SetupTest() {
	// Clean up before each test
	_, err := s.db.DB.Exec(context.Background(), "DELETE FROM notifications")
	require.NoError(s.T(), err)
}

func (s *NotificationHandlerTestSuite) makeRequest(method, path string, body interface{}, token string, setupRoutes func(*gin.Engine)) *httptest.ResponseRecorder {
	var reqBody *bytes.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		require.NoError(s.T(), err)
		reqBody = bytes.NewReader(jsonBody)
	} else {
		reqBody = bytes.NewReader(nil)
	}

	req, err := http.NewRequest(method, path, reqBody)
	require.NoError(s.T(), err)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	gin.SetMode(gin.TestMode)
	router := gin.New()
	setupRoutes(router)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

func (s *NotificationHandlerTestSuite) getOwnerToken() string {
	loginInput := &models.LoginInput{
		Email:    s.db.Owner.Email,
		Password: testutils.TestPassword,
	}
	_, token, err := s.authService.Login(context.Background(), loginInput)
	require.NoError(s.T(), err)
	return token
}

func (s *NotificationHandlerTestSuite) getMemberToken() string {
	loginInput := &models.LoginInput{
		Email:    s.db.Member.Email,
		Password: testutils.TestPassword,
	}
	_, token, err := s.authService.Login(context.Background(), loginInput)
	require.NoError(s.T(), err)
	return token
}

func (s *NotificationHandlerTestSuite) TestCreateNotification_Success() {
	input := &models.CreateNotificationInput{
		Type:    "ai_failure",
		Title:   "AI Analysis Failed",
		Message: "Failed to analyze activity screenshot",
	}

	w := s.makeRequest("POST", "/notifications", input, s.getOwnerToken(), func(router *gin.Engine) {
		router.POST("/notifications", func(c *gin.Context) {
			c.Set("user", s.db.Owner)
			s.notifHandler.CreateNotification(c)
		})
	})

	assert.Equal(s.T(), http.StatusCreated, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.True(s.T(), response["success"].(bool))
	data := response["data"].(map[string]interface{})
	assert.NotEmpty(s.T(), data["id"])
	assert.Equal(s.T(), "ai_failure", data["type"])
	assert.Equal(s.T(), "AI Analysis Failed", data["title"])
}

func (s *NotificationHandlerTestSuite) TestCreateNotification_WithMetadata() {
	input := &models.CreateNotificationInput{
		Type:    "ai_failure",
		Title:   "AI Analysis Failed",
		Message: "Failed to analyze activity",
		Metadata: map[string]interface{}{
			"activity_id": uuid.New().String(),
			"error":       "API timeout",
		},
	}

	w := s.makeRequest("POST", "/notifications", input, s.getOwnerToken(), func(router *gin.Engine) {
		router.POST("/notifications", func(c *gin.Context) {
			c.Set("user", s.db.Owner)
			s.notifHandler.CreateNotification(c)
		})
	})

	assert.Equal(s.T(), http.StatusCreated, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.True(s.T(), response["success"].(bool))
	data := response["data"].(map[string]interface{})
	assert.NotNil(s.T(), data["metadata"])
}

func (s *NotificationHandlerTestSuite) TestCreateNotification_DefaultsUserID() {
	input := &models.CreateNotificationInput{
		Type:    "info",
		Title:   "Test Notification",
		Message: "Test message",
		// UserID is empty - should default to current user
	}

	w := s.makeRequest("POST", "/notifications", input, s.getOwnerToken(), func(router *gin.Engine) {
		router.POST("/notifications", func(c *gin.Context) {
			c.Set("user", s.db.Owner)
			s.notifHandler.CreateNotification(c)
		})
	})

	assert.Equal(s.T(), http.StatusCreated, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.True(s.T(), response["success"].(bool))
	data := response["data"].(map[string]interface{})
	// User ID should be set to current user
	assert.NotNil(s.T(), data["user_id"])
}

func (s *NotificationHandlerTestSuite) TestCreateNotification_ValidationError() {
	// Invalid JSON body
	w := s.makeRequest("POST", "/notifications", "invalid json", s.getOwnerToken(), func(router *gin.Engine) {
		router.POST("/notifications", func(c *gin.Context) {
			c.Set("user", s.db.Owner)
			s.notifHandler.CreateNotification(c)
		})
	})

	assert.Equal(s.T(), http.StatusBadRequest, w.Code)
}

func (s *NotificationHandlerTestSuite) TestListNotifications_AsOwner() {
	// Create some notifications
	_, err := s.notifService.CreateNotification(context.Background(), *s.db.Owner.OrganizationID, &models.CreateNotificationInput{
		Type:    "info", Title: "Test 1", Message: "Message 1",
	})
	require.NoError(s.T(), err)
	_, err = s.notifService.CreateNotification(context.Background(), *s.db.Owner.OrganizationID, &models.CreateNotificationInput{
		Type:    "warning", Title: "Test 2", Message: "Message 2",
	})
	require.NoError(s.T(), err)

	w := s.makeRequest("GET", "/notifications", nil, s.getOwnerToken(), func(router *gin.Engine) {
		router.GET("/notifications", func(c *gin.Context) {
			c.Set("user", s.db.Owner)
			s.notifHandler.ListNotifications(c)
		})
	})

	assert.Equal(s.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.True(s.T(), response["success"].(bool))
	data := response["data"].([]interface{})
	assert.Len(s.T(), data, 2)
}

func (s *NotificationHandlerTestSuite) TestListNotifications_AsMember() {
	// Create a notification for owner only
	_, err := s.notifService.CreateNotification(context.Background(), *s.db.Owner.OrganizationID, &models.CreateNotificationInput{
		Type:    "info", Title: "Owner Notif", Message: "For owner",
		UserID:  s.db.Owner.ID.String(),
	})
	require.NoError(s.T(), err)

	// Create a notification for member
	_, err = s.notifService.CreateNotification(context.Background(), *s.db.Owner.OrganizationID, &models.CreateNotificationInput{
		Type:    "info", Title: "Member Notif", Message: "For member",
		UserID:  s.db.Member.ID.String(),
	})
	require.NoError(s.T(), err)

	// Member should only see their own notifications
	w := s.makeRequest("GET", "/notifications", nil, s.getMemberToken(), func(router *gin.Engine) {
		router.GET("/notifications", func(c *gin.Context) {
			c.Set("user", s.db.Member)
			s.notifHandler.ListNotifications(c)
		})
	})

	assert.Equal(s.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.True(s.T(), response["success"].(bool))
	data := response["data"].([]interface{})
	// Member should only see their own notification (1)
	assert.Len(s.T(), data, 1)
}

func (s *NotificationHandlerTestSuite) TestListNotifications_Empty() {
	w := s.makeRequest("GET", "/notifications", nil, s.getOwnerToken(), func(router *gin.Engine) {
		router.GET("/notifications", func(c *gin.Context) {
			c.Set("user", s.db.Owner)
			s.notifHandler.ListNotifications(c)
		})
	})

	assert.Equal(s.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.True(s.T(), response["success"].(bool))
}

func (s *NotificationHandlerTestSuite) TestMarkAsRead_Success() {
	// Create a notification
	notif, err := s.notifService.CreateNotification(context.Background(), *s.db.Owner.OrganizationID, &models.CreateNotificationInput{
		Type:    "info", Title: "Test", Message: "Test message",
	})
	require.NoError(s.T(), err)

	// Mark as read
	w := s.makeRequest("PUT", "/notifications/"+notif.ID.String(), nil, s.getOwnerToken(), func(router *gin.Engine) {
		router.PUT("/notifications/:id", func(c *gin.Context) {
			s.notifHandler.MarkAsRead(c)
		})
	})

	assert.Equal(s.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.True(s.T(), response["success"].(bool))
}

func (s *NotificationHandlerTestSuite) TestMarkAsRead_InvalidID() {
	w := s.makeRequest("PUT", "/notifications/invalid-uuid", nil, s.getOwnerToken(), func(router *gin.Engine) {
		router.PUT("/notifications/:id", func(c *gin.Context) {
			s.notifHandler.MarkAsRead(c)
		})
	})

	assert.Equal(s.T(), http.StatusBadRequest, w.Code)
}

func (s *NotificationHandlerTestSuite) TestMarkAsRead_NonExistent() {
	w := s.makeRequest("PUT", "/notifications/"+uuid.New().String(), nil, s.getOwnerToken(), func(router *gin.Engine) {
		router.PUT("/notifications/:id", func(c *gin.Context) {
			s.notifHandler.MarkAsRead(c)
		})
	})

	// Should return 200 (service succeeds even if notification doesn't exist)
	assert.Equal(s.T(), http.StatusOK, w.Code)
}

func TestNotificationHandlerSuite(t *testing.T) {
	suite.Run(t, new(NotificationHandlerTestSuite))
}
