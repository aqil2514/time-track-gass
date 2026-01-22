// backend/internal/handlers/activity_handler_test.go
package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/suite"
	"github.com/timetrack/backend/internal/config"
	"github.com/timetrack/backend/internal/middleware"
	"github.com/timetrack/backend/internal/models"
	"github.com/timetrack/backend/internal/services"
	"github.com/timetrack/backend/tests/testutils"
)

type ActivityHandlerTestSuite struct {
	suite.Suite
	db              *testutils.TestFixtures
	router          *gin.Engine
	activityHandler *ActivityHandler
	authHandler     *AuthHandler
	authService     *services.AuthService
	activityService *services.ActivityService
	aiService       *services.AIService
	cfg             *config.Config
}

func (s *ActivityHandlerTestSuite) SetupSuite() {
	// Connect to test database
	dbPool := testutils.ConnectTestDB()
	ctx := context.Background()

	// Load config
	s.cfg = config.Load()

	// Setup fixtures
	fixtures, err := testutils.SetupFixtures(ctx, dbPool)
	s.Require().NoError(err)
	s.db = fixtures

	// Create services
	s.aiService = services.NewAIService(s.cfg)
	s.activityService = services.NewActivityService(dbPool, s.aiService)
	s.authService = services.NewAuthService(dbPool)
	orgService := services.NewOrganizationService(dbPool, s.cfg)
	s.authService.SetOrganizationService(orgService)

	// Create handlers
	s.activityHandler = NewActivityHandler(s.activityService)
	s.authHandler = NewAuthHandler(s.authService)

	// Setup Gin router
	gin.SetMode(gin.TestMode)
	s.router = gin.New()

	// Public routes
	s.router.POST("/login", s.authHandler.Login)

	// Protected routes
	protected := s.router.Group("/")
	protected.Use(middleware.AuthMiddleware(s.authService))
	{
		protected.POST("/activities", s.activityHandler.Upload)
		protected.GET("/activities", s.activityHandler.List)
		protected.GET("/activities/stats", s.activityHandler.Stats)
		protected.PATCH("/activities/:id", s.activityHandler.Update)
	}
}

func (s *ActivityHandlerTestSuite) TearDownSuite() {
	ctx := context.Background()
	s.db.Cleanup(ctx)
}

func (s *ActivityHandlerTestSuite) SetupTest() {
	// Each test gets fresh state by creating new users
}

func (s *ActivityHandlerTestSuite) loginAndGetToken(email, password string) string {
	loginInput := models.LoginInput{
		Email:    email,
		Password: password,
	}
	w := s.makeRequest("POST", "/login", loginInput, "")
	s.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	data := response["data"].(map[string]interface{})
	return data["token"].(string)
}

func (s *ActivityHandlerTestSuite) makeRequest(method, path string, body interface{}, token string) *httptest.ResponseRecorder {
	var reqBody *bytes.Buffer
	if body != nil {
		jsonBody, err := json.Marshal(body)
		s.Require().NoError(err)
		reqBody = bytes.NewBuffer(jsonBody)
	} else {
		reqBody = bytes.NewBuffer(nil)
	}

	req, err := http.NewRequest(method, path, reqBody)
	s.Require().NoError(err)

	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)
	return w
}

func (s *ActivityHandlerTestSuite) TestUploadActivity_Success() {
	// Arrange - Login to get token
	token := s.loginAndGetToken(s.db.Member.Email, testutils.TestPassword)

	activityInput := models.UploadActivityInput{
		AppName:     "VS Code",
		WindowTitle: "backend/internal/handlers/activity_handler_test.go",
		Category:    "coding",
		Summary:     "Writing comprehensive activity handler tests",
		CapturedAt:  time.Now().UTC().Format(time.RFC3339),
	}

	// Act
	w := s.makeRequest("POST", "/activities", activityInput, token)

	// Assert
	s.Equal(http.StatusCreated, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.True(response["success"].(bool))
	data := response["data"].(map[string]interface{})
	s.NotEmpty(data["id"])
	s.Equal("VS Code", data["app_name"])
	s.Equal("coding", data["category"])
	s.Equal("Writing comprehensive activity handler tests", data["summary"])
}

func (s *ActivityHandlerTestSuite) TestUploadActivity_NoAppName() {
	// Arrange - Login to get token
	token := s.loginAndGetToken(s.db.Member.Email, testutils.TestPassword)

	activityInput := map[string]string{
		"window_title": "Test Window",
		"category":     "coding",
		"summary":      "Test summary",
	}

	// Act
	w := s.makeRequest("POST", "/activities", activityInput, token)

	// Assert
	s.Equal(http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("VALIDATION_ERROR", errData["code"])
}

func (s *ActivityHandlerTestSuite) TestUploadActivity_Unauthorized() {
	// Arrange - No token
	activityInput := models.UploadActivityInput{
		AppName:     "VS Code",
		WindowTitle: "test.go",
		Category:    "coding",
	}

	// Act
	w := s.makeRequest("POST", "/activities", activityInput, "")

	// Assert
	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
}

func (s *ActivityHandlerTestSuite) TestUploadActivity_InvalidToken() {
	// Arrange - Invalid token
	activityInput := models.UploadActivityInput{
		AppName:     "VS Code",
		WindowTitle: "test.go",
		Category:    "coding",
	}

	// Act
	w := s.makeRequest("POST", "/activities", activityInput, "invalid-token-12345")

	// Assert
	s.Equal(http.StatusUnauthorized, w.Code)
}

func (s *ActivityHandlerTestSuite) TestGetActivities_Success() {
	// Arrange - Login to get token
	token := s.loginAndGetToken(s.db.Member.Email, testutils.TestPassword)

	// Act
	w := s.makeRequest("GET", "/activities", nil, token)

	// Assert
	s.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.True(response["success"].(bool))
	data := response["data"].([]interface{})
	s.GreaterOrEqual(len(data), 10) // Fixtures create 10 activities

	meta := response["meta"].(map[string]interface{})
	s.Equal(float64(1), meta["page"])
	s.Equal(float64(20), meta["per_page"])
	s.NotZero(meta["total"])
}

func (s *ActivityHandlerTestSuite) TestGetActivities_FilterByDate() {
	// Arrange - Login to get token
	token := s.loginAndGetToken(s.db.Member.Email, testutils.TestPassword)

	// Create activities with specific dates
	now := time.Now()
	today := now.Format("2006-01-02")

	// Create activity for today
	todayActivity := models.UploadActivityInput{
		AppName:     "TestApp",
		WindowTitle: "Today Test",
		Category:    "testing",
		Summary:     "Test activity for today",
		CapturedAt:  now.UTC().Format(time.RFC3339),
	}
	w1 := s.makeRequest("POST", "/activities", todayActivity, token)
	s.Equal(http.StatusCreated, w1.Code)

	// Create activity for yesterday
	yesterdayActivity := models.UploadActivityInput{
		AppName:     "TestApp",
		WindowTitle: "Yesterday Test",
		Category:    "testing",
		Summary:     "Test activity for yesterday",
		CapturedAt:  now.Add(-24 * time.Hour).UTC().Format(time.RFC3339),
	}
	w2 := s.makeRequest("POST", "/activities", yesterdayActivity, token)
	s.Equal(http.StatusCreated, w2.Code)

	// Act - Get activities from today only
	w := s.makeRequest("GET", "/activities?from="+today, nil, token)

	// Assert
	s.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.True(response["success"].(bool))
	data := response["data"].([]interface{})

	// Should have at least the today activity
	s.GreaterOrEqual(len(data), 1)
}

func (s *ActivityHandlerTestSuite) TestGetActivities_FilterByCategory() {
	// Arrange - Login to get token
	token := s.loginAndGetToken(s.db.Member.Email, testutils.TestPassword)

	// Create activities with different categories
	codingActivity := models.UploadActivityInput{
		AppName:     "VS Code",
		WindowTitle: "test.go",
		Category:    "coding",
		Summary:     "Coding activity",
		CapturedAt:  time.Now().UTC().Format(time.RFC3339),
	}
	w1 := s.makeRequest("POST", "/activities", codingActivity, token)
	s.Equal(http.StatusCreated, w1.Code)

	meetingActivity := models.UploadActivityInput{
		AppName:     "Zoom",
		WindowTitle: "Standup Meeting",
		Category:    "meeting",
		Summary:     "Daily standup",
		CapturedAt:  time.Now().UTC().Format(time.RFC3339),
	}
	w2 := s.makeRequest("POST", "/activities", meetingActivity, token)
	s.Equal(http.StatusCreated, w2.Code)

	// Act - Get activities filtered by coding category
	w := s.makeRequest("GET", "/activities?category=coding", nil, token)

	// Assert
	s.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.True(response["success"].(bool))
	data := response["data"].([]interface{})

	// All activities should be coding category
	for _, item := range data {
		activity := item.(map[string]interface{})
		s.Equal("coding", activity["category"])
	}
}

func (s *ActivityHandlerTestSuite) TestGetActivities_Pagination() {
	// Arrange - Login to get token
	token := s.loginAndGetToken(s.db.Member.Email, testutils.TestPassword)

	// Create additional activities to ensure we have enough for pagination
	for i := 0; i < 5; i++ {
		activity := models.UploadActivityInput{
			AppName:     fmt.Sprintf("App %d", i),
			WindowTitle: fmt.Sprintf("Window %d", i),
			Category:    "testing",
			Summary:     fmt.Sprintf("Test activity %d", i),
			CapturedAt:  time.Now().UTC().Format(time.RFC3339),
		}
		w := s.makeRequest("POST", "/activities", activity, token)
		s.Equal(http.StatusCreated, w.Code)
	}

	// Act - Get first page
	w1 := s.makeRequest("GET", "/activities?page=1&per_page=5", nil, token)

	// Assert first page
	s.Equal(http.StatusOK, w1.Code)

	var response1 map[string]interface{}
	err := json.Unmarshal(w1.Body.Bytes(), &response1)
	s.Require().NoError(err)

	s.True(response1["success"].(bool))
	data1 := response1["data"].([]interface{})
	s.Equal(5, len(data1))

	meta1 := response1["meta"].(map[string]interface{})
	s.Equal(float64(1), meta1["page"])
	s.Equal(float64(5), meta1["per_page"])

	// Act - Get second page
	w2 := s.makeRequest("GET", "/activities?page=2&per_page=5", nil, token)

	// Assert second page
	s.Equal(http.StatusOK, w2.Code)

	var response2 map[string]interface{}
	err = json.Unmarshal(w2.Body.Bytes(), &response2)
	s.Require().NoError(err)

	s.True(response2["success"].(bool))
	_ = response2["data"].([]interface{}) // Verify data exists

	meta2 := response2["meta"].(map[string]interface{})
	s.Equal(float64(2), meta2["page"])
	s.Equal(float64(5), meta2["per_page"])

	// Total should be the same across pages
	s.Equal(meta1["total"], meta2["total"])
}

func (s *ActivityHandlerTestSuite) TestGetActivities_InvalidDateFormat() {
	// Arrange - Login to get token
	token := s.loginAndGetToken(s.db.Member.Email, testutils.TestPassword)

	// Act - Invalid date format
	w := s.makeRequest("GET", "/activities?from=invalid-date", nil, token)

	// Assert
	s.Equal(http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("VALIDATION_ERROR", errData["code"])
}

func (s *ActivityHandlerTestSuite) TestUpdateActivity_Success() {
	// Arrange - Login to get token and create activity
	token := s.loginAndGetToken(s.db.Member.Email, testutils.TestPassword)

	activityInput := models.UploadActivityInput{
		AppName:     "VS Code",
		WindowTitle: "test.go",
		Category:    "coding",
		Summary:     "Initial summary",
		CapturedAt:  time.Now().UTC().Format(time.RFC3339),
	}
	w1 := s.makeRequest("POST", "/activities", activityInput, token)
	s.Equal(http.StatusCreated, w1.Code)

	var createResponse map[string]interface{}
	err := json.Unmarshal(w1.Body.Bytes(), &createResponse)
	s.Require().NoError(err)
	data := createResponse["data"].(map[string]interface{})
	activityID := data["id"].(string)

	// Act - Update activity
	updateInput := models.ScreenshotAnalysis{
		AppName:     "VS Code Updated",
		WindowTitle: "test.go - Updated",
		Category:    "debugging",
		Summary:     "Updated summary with new AI analysis",
	}
	w2 := s.makeRequest("PATCH", "/activities/"+activityID, updateInput, token)

	// Assert
	s.Equal(http.StatusOK, w2.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w2.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.True(response["success"].(bool))
}

func (s *ActivityHandlerTestSuite) TestUpdateActivity_NotOwner() {
	// Arrange - Member creates an activity
	memberToken := s.loginAndGetToken(s.db.Member.Email, testutils.TestPassword)

	activityInput := models.UploadActivityInput{
		AppName:     "VS Code",
		WindowTitle: "test.go",
		Category:    "coding",
		Summary:     "Member activity",
		CapturedAt:  time.Now().UTC().Format(time.RFC3339),
	}
	w1 := s.makeRequest("POST", "/activities", activityInput, memberToken)
	s.Equal(http.StatusCreated, w1.Code)

	var createResponse map[string]interface{}
	err := json.Unmarshal(w1.Body.Bytes(), &createResponse)
	s.Require().NoError(err)
	data := createResponse["data"].(map[string]interface{})
	activityID := data["id"].(string)

	// Act - Owner tries to update member's activity (should fail - not owner)
	ownerToken := s.loginAndGetToken(s.db.Owner.Email, testutils.TestPassword)

	updateInput := models.ScreenshotAnalysis{
		AppName:     "Hacked App",
		WindowTitle: "Hacked Window",
		Category:    "hacking",
		Summary:     "This should fail",
	}
	w2 := s.makeRequest("PATCH", "/activities/"+activityID, updateInput, ownerToken)

	// Assert - Should fail with internal server error (RowsAffected == 0)
	s.Equal(http.StatusInternalServerError, w2.Code)
}

func (s *ActivityHandlerTestSuite) TestUpdateActivity_InvalidID() {
	// Arrange - Login to get token
	token := s.loginAndGetToken(s.db.Member.Email, testutils.TestPassword)

	// Act - Update with invalid UUID
	updateInput := models.ScreenshotAnalysis{
		AppName:     "Test",
		WindowTitle: "Test",
		Category:    "test",
		Summary:     "Test",
	}
	w := s.makeRequest("PATCH", "/activities/invalid-uuid", updateInput, token)

	// Assert
	s.Equal(http.StatusBadRequest, w.Code)
}

func (s *ActivityHandlerTestSuite) TestUpdateActivity_Unauthorized() {
	// Arrange - No token
	activityID := uuid.New().String()
	updateInput := models.ScreenshotAnalysis{
		AppName:     "Test",
		WindowTitle: "Test",
		Category:    "test",
		Summary:     "Test",
	}

	// Act
	w := s.makeRequest("PATCH", "/activities/"+activityID, updateInput, "")

	// Assert
	s.Equal(http.StatusUnauthorized, w.Code)
}

func (s *ActivityHandlerTestSuite) TestGetStats_Success() {
	// Arrange - Login to get token
	token := s.loginAndGetToken(s.db.Member.Email, testutils.TestPassword)

	// Create some test activities with known categories
	activities := []models.UploadActivityInput{
		{AppName: "VS Code", WindowTitle: "test.go", Category: "coding", Summary: "Coding", CapturedAt: time.Now().UTC().Format(time.RFC3339)},
		{AppName: "VS Code", WindowTitle: "main.go", Category: "coding", Summary: "More coding", CapturedAt: time.Now().UTC().Format(time.RFC3339)},
		{AppName: "Zoom", WindowTitle: "Meeting", Category: "meeting", Summary: "Standup", CapturedAt: time.Now().UTC().Format(time.RFC3339)},
	}

	for _, activity := range activities {
		w := s.makeRequest("POST", "/activities", activity, token)
		s.Equal(http.StatusCreated, w.Code)
	}

	// Act
	w := s.makeRequest("GET", "/activities/stats", nil, token)

	// Assert
	s.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.True(response["success"].(bool))
	data := response["data"].(map[string]interface{})

	s.NotZero(data["total_minutes"])
	s.NotZero(data["total_hours"])

	byCategory := data["by_category"].(map[string]interface{})
	s.NotEmpty(byCategory)
}

func (s *ActivityHandlerTestSuite) TestGetStats_FilterByDate() {
	// Arrange - Login to get token
	token := s.loginAndGetToken(s.db.Member.Email, testutils.TestPassword)

	now := time.Now()
	today := now.Format("2006-01-02")

	// Create activity for today
	todayActivity := models.UploadActivityInput{
		AppName:     "VS Code",
		WindowTitle: "today.go",
		Category:    "coding",
		Summary:     "Today coding",
		CapturedAt:  now.UTC().Format(time.RFC3339),
	}
	w1 := s.makeRequest("POST", "/activities", todayActivity, token)
	s.Equal(http.StatusCreated, w1.Code)

	// Create activity for yesterday
	yesterdayActivity := models.UploadActivityInput{
		AppName:     "VS Code",
		WindowTitle: "yesterday.go",
		Category:    "coding",
		Summary:     "Yesterday coding",
		CapturedAt:  now.Add(-24 * time.Hour).UTC().Format(time.RFC3339),
	}
	w2 := s.makeRequest("POST", "/activities", yesterdayActivity, token)
	s.Equal(http.StatusCreated, w2.Code)

	// Act - Get stats for today only
	w := s.makeRequest("GET", "/activities/stats?from="+today, nil, token)

	// Assert
	s.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.True(response["success"].(bool))
	data := response["data"].(map[string]interface{})

	// Should have some time (at least 5 minutes for the today activity)
	totalMinutes := int(data["total_minutes"].(float64))
	s.GreaterOrEqual(totalMinutes, 5)
}

func (s *ActivityHandlerTestSuite) TestGetStats_InvalidDateFormat() {
	// Arrange - Login to get token
	token := s.loginAndGetToken(s.db.Member.Email, testutils.TestPassword)

	// Act - Invalid date format
	w := s.makeRequest("GET", "/activities/stats?from=invalid-date", nil, token)

	// Assert
	s.Equal(http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("VALIDATION_ERROR", errData["code"])
	s.Contains(errData["message"], "Invalid from date format")
}

func (s *ActivityHandlerTestSuite) TestGetStats_Unauthorized() {
	// Act - No token
	w := s.makeRequest("GET", "/activities/stats", nil, "")

	// Assert
	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
}

func (s *ActivityHandlerTestSuite) TestUploadActivity_MultipleUsers() {
	// Arrange - Create two different users and login
	ctx := context.Background()
	user1, token1, err := s.db.CreateUser(ctx, "member")
	s.Require().NoError(err)

	user2, token2, err := s.db.CreateUser(ctx, "member")
	s.Require().NoError(err)

	// User 1 creates activity
	activity1 := models.UploadActivityInput{
		AppName:     "User1 App",
		WindowTitle: "User1 Window",
		Category:    "coding",
		Summary:     "User1 activity",
		CapturedAt:  time.Now().UTC().Format(time.RFC3339),
	}
	w1 := s.makeRequest("POST", "/activities", activity1, token1)
	s.Equal(http.StatusCreated, w1.Code)

	// User 2 creates activity
	activity2 := models.UploadActivityInput{
		AppName:     "User2 App",
		WindowTitle: "User2 Window",
		Category:    "meeting",
		Summary:     "User2 activity",
		CapturedAt:  time.Now().UTC().Format(time.RFC3339),
	}
	w2 := s.makeRequest("POST", "/activities", activity2, token2)
	s.Equal(http.StatusCreated, w2.Code)

	// User 1 should only see their own activity
	w3 := s.makeRequest("GET", "/activities", nil, token1)
	s.Equal(http.StatusOK, w3.Code)

	var response1 map[string]interface{}
	err = json.Unmarshal(w3.Body.Bytes(), &response1)
	s.Require().NoError(err)

	data1 := response1["data"].([]interface{})
	// Should only have User1's activity (and any default activities, but not User2's)
	for _, item := range data1 {
		activity := item.(map[string]interface{})
		userID := activity["user_id"].(string)
		s.Equal(user1.ID.String(), userID)
	}

	// User 2 should only see their own activity
	w4 := s.makeRequest("GET", "/activities", nil, token2)
	s.Equal(http.StatusOK, w4.Code)

	var response2 map[string]interface{}
	err = json.Unmarshal(w4.Body.Bytes(), &response2)
	s.Require().NoError(err)

	data2 := response2["data"].([]interface{})
	for _, item := range data2 {
		activity := item.(map[string]interface{})
		userID := activity["user_id"].(string)
		s.Equal(user2.ID.String(), userID)
	}
}

func (s *ActivityHandlerTestSuite) TestGetActivities_DefaultPagination() {
	// Arrange - Login to get token
	token := s.loginAndGetToken(s.db.Member.Email, testutils.TestPassword)

	// Act - No pagination params (should use defaults)
	w := s.makeRequest("GET", "/activities", nil, token)

	// Assert
	s.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	meta := response["meta"].(map[string]interface{})
	s.Equal(float64(1), meta["page"])      // Default page
	s.Equal(float64(20), meta["per_page"]) // Default per_page
}

func (s *ActivityHandlerTestSuite) TestGetActivities_MaxPerPage() {
	// Arrange - Login to get token
	token := s.loginAndGetToken(s.db.Member.Email, testutils.TestPassword)

	// Act - Request more than max per_page (100)
	// Handler sets per_page to 20 when value > 100 (fallback to default)
	w := s.makeRequest("GET", "/activities?per_page=200", nil, token)

	// Assert - Should fallback to 20 when > 100
	s.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	meta := response["meta"].(map[string]interface{})
	s.Equal(float64(20), meta["per_page"]) // Fallback to default 20
}

func TestActivityHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(ActivityHandlerTestSuite))
}
