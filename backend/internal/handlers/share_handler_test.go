// backend/internal/handlers/share_handler_test.go
package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

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

type ShareHandlerTestSuite struct {
	suite.Suite
	db           *testutils.TestFixtures
	shareHandler *ShareHandler
	authService  *services.AuthService
	shareService *services.ShareService
}

func (s *ShareHandlerTestSuite) SetupSuite() {
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

	s.shareService = services.NewShareService(db, s.authService)
	activityService := services.NewActivityService(db, nil)

	s.shareHandler = NewShareHandler(s.shareService, activityService)
}

func (s *ShareHandlerTestSuite) TearDownSuite() {
	testutils.CleanupTestDB(context.Background(), s.db.DB)
	s.db.DB.Close()
}

func (s *ShareHandlerTestSuite) SetupTest() {
	// Clean up before each test - delete shares but keep users
	_, err := s.db.DB.Exec(context.Background(), "DELETE FROM shares")
	require.NoError(s.T(), err)
}

func (s *ShareHandlerTestSuite) makeRequest(method, path string, body interface{}, token string, setupRoutes func(*gin.Engine)) *httptest.ResponseRecorder {
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

	// Create fresh router for each request
	gin.SetMode(gin.TestMode)
	router := gin.New()
	setupRoutes(router)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

func (s *ShareHandlerTestSuite) getOwnerToken() string {
	// Login as owner to get a fresh token
	loginInput := &models.LoginInput{
		Email:    s.db.Owner.Email,
		Password: testutils.TestPassword,
	}
	_, token, err := s.authService.Login(context.Background(), loginInput)
	require.NoError(s.T(), err)
	return token
}

func (s *ShareHandlerTestSuite) TestCreate_Success() {
	input := &models.CreateShareInput{
		Email: s.db.Admin.Email,
	}

	w := s.makeRequest("POST", "/shares", input, s.getOwnerToken(), func(router *gin.Engine) {
		router.POST("/shares", func(c *gin.Context) {
			c.Set("user", s.db.Owner)
			s.shareHandler.Create(c)
		})
	})

	assert.Equal(s.T(), http.StatusCreated, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.True(s.T(), response["success"].(bool))
	data := response["data"].(map[string]interface{})
	assert.NotEmpty(s.T(), data["id"])
}

func (s *ShareHandlerTestSuite) TestCreate_UserNotFound() {
	input := &models.CreateShareInput{
		Email: "nonexistent@example.com",
	}

	w := s.makeRequest("POST", "/shares", input, s.getOwnerToken(), func(router *gin.Engine) {
		router.POST("/shares", func(c *gin.Context) {
			c.Set("user", s.db.Owner)
			s.shareHandler.Create(c)
		})
	})

	assert.Equal(s.T(), http.StatusNotFound, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.False(s.T(), response["success"].(bool))
	errObj := response["error"].(map[string]interface{})
	assert.Equal(s.T(), "USER_NOT_FOUND", errObj["code"])
}

func (s *ShareHandlerTestSuite) TestCreate_ShareWithSelf() {
	input := &models.CreateShareInput{
		Email: s.db.Owner.Email,
	}

	w := s.makeRequest("POST", "/shares", input, s.getOwnerToken(), func(router *gin.Engine) {
		router.POST("/shares", func(c *gin.Context) {
			c.Set("user", s.db.Owner)
			s.shareHandler.Create(c)
		})
	})

	assert.Equal(s.T(), http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.False(s.T(), response["success"].(bool))
	errObj := response["error"].(map[string]interface{})
	assert.Equal(s.T(), "CANNOT_SHARE_SELF", errObj["code"])
}

func (s *ShareHandlerTestSuite) TestCreate_AlreadyExists() {
	// First create a share
	_, err := s.shareService.Create(context.Background(), s.db.Owner.ID, s.db.Admin.Email)
	require.NoError(s.T(), err)

	input := &models.CreateShareInput{
		Email: s.db.Admin.Email,
	}

	w := s.makeRequest("POST", "/shares", input, s.getOwnerToken(), func(router *gin.Engine) {
		router.POST("/shares", func(c *gin.Context) {
			c.Set("user", s.db.Owner)
			s.shareHandler.Create(c)
		})
	})

	assert.Equal(s.T(), http.StatusConflict, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.False(s.T(), response["success"].(bool))
	errObj := response["error"].(map[string]interface{})
	assert.Equal(s.T(), "SHARE_EXISTS", errObj["code"])
}

func (s *ShareHandlerTestSuite) TestGetViewers_Success() {
	// Create some shares
	_, err := s.shareService.Create(context.Background(), s.db.Owner.ID, s.db.Admin.Email)
	require.NoError(s.T(), err)
	_, err = s.shareService.Create(context.Background(), s.db.Owner.ID, s.db.Member.Email)
	require.NoError(s.T(), err)

	w := s.makeRequest("GET", "/shares/viewers", nil, s.getOwnerToken(), func(router *gin.Engine) {
		router.GET("/shares/viewers", func(c *gin.Context) {
			c.Set("user", s.db.Owner)
			s.shareHandler.GetViewers(c)
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

func (s *ShareHandlerTestSuite) TestGetViewers_Empty() {
	w := s.makeRequest("GET", "/shares/viewers", nil, s.getOwnerToken(), func(router *gin.Engine) {
		router.GET("/shares/viewers", func(c *gin.Context) {
			c.Set("user", s.db.Owner)
			s.shareHandler.GetViewers(c)
		})
	})

	assert.Equal(s.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.True(s.T(), response["success"].(bool))
	// data may be nil or empty array - just check success response
}

func (s *ShareHandlerTestSuite) TestGetWatching_Success() {
	// Owner shares with Admin - Admin watches Owner
	_, err := s.shareService.Create(context.Background(), s.db.Owner.ID, s.db.Admin.Email)
	require.NoError(s.T(), err)

	// Login as admin to get token
	loginInput := &models.LoginInput{
		Email:    s.db.Admin.Email,
		Password: testutils.TestPassword,
	}
	_, adminToken, err := s.authService.Login(context.Background(), loginInput)
	require.NoError(s.T(), err)

	w := s.makeRequest("GET", "/shares/watching", nil, adminToken, func(router *gin.Engine) {
		router.GET("/shares/watching", func(c *gin.Context) {
			c.Set("user", s.db.Admin)
			s.shareHandler.GetWatching(c)
		})
	})

	assert.Equal(s.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.True(s.T(), response["success"].(bool))
	data := response["data"].([]interface{})
	assert.Len(s.T(), data, 1)
}

func (s *ShareHandlerTestSuite) TestDelete_Success() {
	// Create a share
	share, err := s.shareService.Create(context.Background(), s.db.Owner.ID, s.db.Admin.Email)
	require.NoError(s.T(), err)

	w := s.makeRequest("DELETE", "/shares/"+share.ID.String(), nil, s.getOwnerToken(), func(router *gin.Engine) {
		router.DELETE("/shares/:id", func(c *gin.Context) {
			c.Set("user", s.db.Owner)
			s.shareHandler.Delete(c)
		})
	})

	assert.Equal(s.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.True(s.T(), response["success"].(bool))
}

func (s *ShareHandlerTestSuite) TestDelete_NotFound() {
	w := s.makeRequest("DELETE", "/shares/"+uuid.New().String(), nil, s.getOwnerToken(), func(router *gin.Engine) {
		router.DELETE("/shares/:id", func(c *gin.Context) {
			c.Set("user", s.db.Owner)
			s.shareHandler.Delete(c)
		})
	})

	assert.Equal(s.T(), http.StatusNotFound, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.False(s.T(), response["success"].(bool))
	errObj := response["error"].(map[string]interface{})
	assert.Equal(s.T(), "SHARE_NOT_FOUND", errObj["code"])
}

func (s *ShareHandlerTestSuite) TestDelete_InvalidID() {
	w := s.makeRequest("DELETE", "/shares/invalid-uuid", nil, s.getOwnerToken(), func(router *gin.Engine) {
		router.DELETE("/shares/:id", func(c *gin.Context) {
			c.Set("user", s.db.Owner)
			s.shareHandler.Delete(c)
		})
	})

	assert.Equal(s.T(), http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.False(s.T(), response["success"].(bool))
	errObj := response["error"].(map[string]interface{})
	assert.Equal(s.T(), "VALIDATION_ERROR", errObj["code"])
}

func (s *ShareHandlerTestSuite) TestGetUserActivity_Success() {
	// Create share - Owner shares with Admin
	_, err := s.shareService.Create(context.Background(), s.db.Owner.ID, s.db.Admin.Email)
	require.NoError(s.T(), err)

	// Login as admin
	loginInput := &models.LoginInput{
		Email:    s.db.Admin.Email,
		Password: testutils.TestPassword,
	}
	_, adminToken, err := s.authService.Login(context.Background(), loginInput)
	require.NoError(s.T(), err)

	w := s.makeRequest("GET", "/users/"+s.db.Owner.ID.String()+"/activities", nil, adminToken, func(router *gin.Engine) {
		router.GET("/users/:user_id/activities", func(c *gin.Context) {
			c.Set("user", s.db.Admin)
			s.shareHandler.GetUserActivity(c)
		})
	})

	assert.Equal(s.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.True(s.T(), response["success"].(bool))
	// Note: Owner may have no activities in test fixtures, so total may be 0
	// The test verifies the endpoint works and returns correct structure
	meta := response["meta"].(map[string]interface{})
	assert.NotNil(s.T(), meta["total"])
}

func (s *ShareHandlerTestSuite) TestGetUserActivity_Forbidden() {
	// Login as admin
	loginInput := &models.LoginInput{
		Email:    s.db.Admin.Email,
		Password: testutils.TestPassword,
	}
	_, adminToken, err := s.authService.Login(context.Background(), loginInput)
	require.NoError(s.T(), err)

	w := s.makeRequest("GET", "/users/"+s.db.Owner.ID.String()+"/activities", nil, adminToken, func(router *gin.Engine) {
		router.GET("/users/:user_id/activities", func(c *gin.Context) {
			c.Set("user", s.db.Admin)
			s.shareHandler.GetUserActivity(c)
		})
	})

	assert.Equal(s.T(), http.StatusForbidden, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.False(s.T(), response["success"].(bool))
	errObj := response["error"].(map[string]interface{})
	assert.Equal(s.T(), "FORBIDDEN", errObj["code"])
}

func (s *ShareHandlerTestSuite) TestGetUserActivity_InvalidUserID() {
	w := s.makeRequest("GET", "/users/invalid-uuid/activities", nil, s.getOwnerToken(), func(router *gin.Engine) {
		router.GET("/users/:user_id/activities", func(c *gin.Context) {
			c.Set("user", s.db.Admin)
			s.shareHandler.GetUserActivity(c)
		})
	})

	assert.Equal(s.T(), http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.False(s.T(), response["success"].(bool))
	errObj := response["error"].(map[string]interface{})
	assert.Equal(s.T(), "VALIDATION_ERROR", errObj["code"])
}

func (s *ShareHandlerTestSuite) TestGetUserStats_Success() {
	// Create share
	_, err := s.shareService.Create(context.Background(), s.db.Owner.ID, s.db.Admin.Email)
	require.NoError(s.T(), err)

	// Login as admin
	loginInput := &models.LoginInput{
		Email:    s.db.Admin.Email,
		Password: testutils.TestPassword,
	}
	_, adminToken, err := s.authService.Login(context.Background(), loginInput)
	require.NoError(s.T(), err)

	fromDate := time.Now().AddDate(0, 0, -7).Format("2006-01-02")
	toDate := time.Now().Format("2006-01-02")

	w := s.makeRequest("GET", "/users/"+s.db.Owner.ID.String()+"/stats?from="+fromDate+"&to="+toDate, nil, adminToken, func(router *gin.Engine) {
		router.GET("/users/:user_id/stats", func(c *gin.Context) {
			c.Set("user", s.db.Admin)
			s.shareHandler.GetUserStats(c)
		})
	})

	assert.Equal(s.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.True(s.T(), response["success"].(bool))
}

func (s *ShareHandlerTestSuite) TestGetUserStats_Forbidden() {
	// Login as member
	loginInput := &models.LoginInput{
		Email:    s.db.Member.Email,
		Password: testutils.TestPassword,
	}
	_, memberToken, err := s.authService.Login(context.Background(), loginInput)
	require.NoError(s.T(), err)

	w := s.makeRequest("GET", "/users/"+s.db.Owner.ID.String()+"/stats", nil, memberToken, func(router *gin.Engine) {
		router.GET("/users/:user_id/stats", func(c *gin.Context) {
			c.Set("user", s.db.Member)
			s.shareHandler.GetUserStats(c)
		})
	})

	assert.Equal(s.T(), http.StatusForbidden, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.False(s.T(), response["success"].(bool))
	errObj := response["error"].(map[string]interface{})
	assert.Equal(s.T(), "FORBIDDEN", errObj["code"])
}

func (s *ShareHandlerTestSuite) TestGetUserActivity_WithDateFilter() {
	// Create share
	_, err := s.shareService.Create(context.Background(), s.db.Owner.ID, s.db.Admin.Email)
	require.NoError(s.T(), err)

	// Login as admin
	loginInput := &models.LoginInput{
		Email:    s.db.Admin.Email,
		Password: testutils.TestPassword,
	}
	_, adminToken, err := s.authService.Login(context.Background(), loginInput)
	require.NoError(s.T(), err)

	fromDate := time.Now().AddDate(0, 0, -7).Format("2006-01-02")
	toDate := time.Now().Format("2006-01-02")

	w := s.makeRequest("GET", "/users/"+s.db.Owner.ID.String()+"/activities?from="+fromDate+"&to="+toDate, nil, adminToken, func(router *gin.Engine) {
		router.GET("/users/:user_id/activities", func(c *gin.Context) {
			c.Set("user", s.db.Admin)
			s.shareHandler.GetUserActivity(c)
		})
	})

	assert.Equal(s.T(), http.StatusOK, w.Code)
}

func (s *ShareHandlerTestSuite) TestGetUserActivity_InvalidDateFormat() {
	// Create share
	_, err := s.shareService.Create(context.Background(), s.db.Owner.ID, s.db.Admin.Email)
	require.NoError(s.T(), err)

	// Login as admin
	loginInput := &models.LoginInput{
		Email:    s.db.Admin.Email,
		Password: testutils.TestPassword,
	}
	_, adminToken, err := s.authService.Login(context.Background(), loginInput)
	require.NoError(s.T(), err)

	w := s.makeRequest("GET", "/users/"+s.db.Owner.ID.String()+"/activities?from=invalid-date", nil, adminToken, func(router *gin.Engine) {
		router.GET("/users/:user_id/activities", func(c *gin.Context) {
			c.Set("user", s.db.Admin)
			s.shareHandler.GetUserActivity(c)
		})
	})

	assert.Equal(s.T(), http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(s.T(), err)

	assert.False(s.T(), response["success"].(bool))
}

func TestShareHandlerSuite(t *testing.T) {
	suite.Run(t, new(ShareHandlerTestSuite))
}
