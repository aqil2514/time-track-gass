// backend/internal/handlers/auth_handler_test.go
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
	"github.com/stretchr/testify/suite"
	"github.com/timetrack/backend/internal/config"
	"github.com/timetrack/backend/internal/middleware"
	"github.com/timetrack/backend/internal/models"
	"github.com/timetrack/backend/internal/services"
	"github.com/timetrack/backend/tests/testutils"
)

type AuthHandlerTestSuite struct {
	suite.Suite
	db          *testutils.TestFixtures
	router      *gin.Engine
	authHandler *AuthHandler
	authService *services.AuthService
	orgService  *services.OrganizationService
	cfg         *config.Config
}

func (s *AuthHandlerTestSuite) SetupSuite() {
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
	s.orgService = services.NewOrganizationService(dbPool, s.cfg)
	s.authService = services.NewAuthService(dbPool)
	s.authService.SetOrganizationService(s.orgService)

	// Create handler
	s.authHandler = NewAuthHandler(s.authService)

	// Setup Gin router
	gin.SetMode(gin.TestMode)
	s.router = gin.New()

	// Public routes
	s.router.POST("/register", s.authHandler.Register)
	s.router.POST("/login", s.authHandler.Login)

	// Protected routes
	protected := s.router.Group("/")
	protected.Use(middleware.AuthMiddleware(s.authService))
	{
		protected.POST("/logout", s.authHandler.Logout)
		protected.GET("/me", s.authHandler.Me)
	}
}

func (s *AuthHandlerTestSuite) TearDownSuite() {
	ctx := context.Background()
	s.db.Cleanup(ctx)
}

func (s *AuthHandlerTestSuite) SetupTest() {
	// Note: We don't cleanup before each test because that would delete fixtures
	// Tests that need fresh state should use unique identifiers (e.g., unique email)
}

func (s *AuthHandlerTestSuite) makeRequest(method, path string, body interface{}, token string) *httptest.ResponseRecorder {
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

func (s *AuthHandlerTestSuite) TestLogin_Success() {
	// Arrange - Use existing owner user from fixtures
	loginInput := models.LoginInput{
		Email:    s.db.Owner.Email,
		Password: testutils.TestPassword,
	}

	// Act
	w := s.makeRequest("POST", "/login", loginInput, "")

	// Assert
	s.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.True(response["success"].(bool))
	data := response["data"].(map[string]interface{})
	s.NotEmpty(data["token"])

	user := data["user"].(map[string]interface{})
	s.Equal(s.db.Owner.Email, user["email"])
	s.Equal(s.db.Owner.Name, user["name"])
	s.Equal(s.db.Owner.Role, user["role"])
}

func (s *AuthHandlerTestSuite) TestLogin_WrongPassword() {
	// Arrange
	loginInput := models.LoginInput{
		Email:    s.db.Owner.Email,
		Password: "WrongPassword123!",
	}

	// Act
	w := s.makeRequest("POST", "/login", loginInput, "")

	// Assert
	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("INVALID_CREDENTIALS", errData["code"])
	s.Equal("Invalid email or password", errData["message"])
}

func (s *AuthHandlerTestSuite) TestLogin_UserNotFound() {
	// Arrange
	loginInput := models.LoginInput{
		Email:    "nonexistent@example.com",
		Password: testutils.TestPassword,
	}

	// Act
	w := s.makeRequest("POST", "/login", loginInput, "")

	// Assert
	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("INVALID_CREDENTIALS", errData["code"])
	s.Equal("Invalid email or password", errData["message"])
}

func (s *AuthHandlerTestSuite) TestLogin_InvalidEmailFormat() {
	// Arrange
	loginInput := map[string]string{
		"email":    "invalid-email",
		"password": testutils.TestPassword,
	}

	// Act
	w := s.makeRequest("POST", "/login", loginInput, "")

	// Assert
	s.Equal(http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("VALIDATION_ERROR", errData["code"])
}

func (s *AuthHandlerTestSuite) TestLogin_MissingPassword() {
	// Arrange
	loginInput := map[string]string{
		"email": "test@example.com",
	}

	// Act
	w := s.makeRequest("POST", "/login", loginInput, "")

	// Assert
	s.Equal(http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("VALIDATION_ERROR", errData["code"])
}

func (s *AuthHandlerTestSuite) TestRegister_Success() {
	// Arrange - Use unique email for each test
	uniqueID := "newuser" + "-" + uuid.New().String()[:8]
	registerInput := models.CreateUserInput{
		Email:    uniqueID + "@example.com",
		Password: "NewPassword123!",
		Name:     "New User",
	}

	// Act
	w := s.makeRequest("POST", "/register", registerInput, "")

	// Assert
	s.Equal(http.StatusCreated, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.True(response["success"].(bool))
	data := response["data"].(map[string]interface{})
	s.Equal(registerInput.Email, data["email"])
	// Note: The register service defaults name to email if name is empty
	// The CreateOrganizationWithOwner method sets user.Name = email
	s.Equal("owner", data["role"])
	s.NotEmpty(data["id"])
	s.NotEmpty(data["created_at"])

	// Verify user can login
	loginInput := models.LoginInput{
		Email:    registerInput.Email,
		Password: registerInput.Password,
	}
	w2 := s.makeRequest("POST", "/login", loginInput, "")
	s.Equal(http.StatusOK, w2.Code)
}

func (s *AuthHandlerTestSuite) TestRegister_DuplicateEmail() {
	// Arrange - Use existing email from fixtures
	registerInput := models.CreateUserInput{
		Email:    s.db.Owner.Email,
		Password: "AnotherPassword123!",
		Name:     "Another User",
	}

	// Act
	w := s.makeRequest("POST", "/register", registerInput, "")

	// Assert
	s.Equal(http.StatusConflict, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("EMAIL_EXISTS", errData["code"])
	s.Equal("Email already registered", errData["message"])
}

func (s *AuthHandlerTestSuite) TestRegister_InvalidEmailFormat() {
	// Arrange
	registerInput := map[string]string{
		"email":    "invalid-email-format",
		"password": "Password123!",
		"name":     "Test User",
	}

	// Act
	w := s.makeRequest("POST", "/register", registerInput, "")

	// Assert
	s.Equal(http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("VALIDATION_ERROR", errData["code"])
}

func (s *AuthHandlerTestSuite) TestRegister_PasswordTooShort() {
	// Arrange
	registerInput := map[string]string{
		"email":    "test@example.com",
		"password": "short",
		"name":     "Test User",
	}

	// Act
	w := s.makeRequest("POST", "/register", registerInput, "")

	// Assert
	s.Equal(http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("VALIDATION_ERROR", errData["code"])
}

func (s *AuthHandlerTestSuite) TestRegister_MissingRequiredFields() {
	// Arrange - Missing password
	registerInput := map[string]string{
		"email": "test@example.com",
	}

	// Act
	w := s.makeRequest("POST", "/register", registerInput, "")

	// Assert
	s.Equal(http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("VALIDATION_ERROR", errData["code"])
}

func (s *AuthHandlerTestSuite) TestLogout_Success() {
	// Arrange - Login to get a fresh token
	loginInput := models.LoginInput{
		Email:    s.db.Owner.Email,
		Password: testutils.TestPassword,
	}
	loginResp := s.makeRequest("POST", "/login", loginInput, "")
	s.Equal(http.StatusOK, loginResp.Code)

	var loginResponse map[string]interface{}
	err := json.Unmarshal(loginResp.Body.Bytes(), &loginResponse)
	s.Require().NoError(err)

	data := loginResponse["data"].(map[string]interface{})
	token := data["token"].(string)

	// Act - Logout with the token
	w := s.makeRequest("POST", "/logout", nil, token)

	// Assert
	s.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.True(response["success"].(bool))
	s.Nil(response["data"])

	// Verify token is now invalid - subsequent request should fail
	w2 := s.makeRequest("GET", "/me", nil, token)
	s.Equal(http.StatusUnauthorized, w2.Code)
}

func (s *AuthHandlerTestSuite) TestLogout_InvalidToken() {
	// Arrange
	invalidToken := "invalid-token-12345"

	// Act
	w := s.makeRequest("POST", "/logout", nil, invalidToken)

	// Assert
	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
}

func (s *AuthHandlerTestSuite) TestLogout_MissingToken() {
	// Act - No authorization header
	w := s.makeRequest("POST", "/logout", nil, "")

	// Assert
	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
}

func (s *AuthHandlerTestSuite) TestLogout_MalformedToken() {
	// Arrange - Malformed bearer token
	reqBody := bytes.NewBuffer(nil)
	req, err := http.NewRequest("POST", "/logout", reqBody)
	s.Require().NoError(err)

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "InvalidFormat token123")

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	// Assert
	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
}

func (s *AuthHandlerTestSuite) TestMe_Success() {
	// Arrange - Login to get a fresh token
	loginInput := models.LoginInput{
		Email:    s.db.Owner.Email,
		Password: testutils.TestPassword,
	}
	loginResp := s.makeRequest("POST", "/login", loginInput, "")
	s.Equal(http.StatusOK, loginResp.Code)

	var loginResponse map[string]interface{}
	err := json.Unmarshal(loginResp.Body.Bytes(), &loginResponse)
	s.Require().NoError(err)

	data := loginResponse["data"].(map[string]interface{})
	token := data["token"].(string)

	// Act
	w := s.makeRequest("GET", "/me", nil, token)

	// Assert
	s.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.True(response["success"].(bool))
	data = response["data"].(map[string]interface{})
	s.Equal(s.db.Owner.Email, data["email"])
	s.Equal(s.db.Owner.Name, data["name"])
	s.Equal(s.db.Owner.Role, data["role"])
	s.NotEmpty(data["id"])
}

func (s *AuthHandlerTestSuite) TestMe_InvalidToken() {
	// Arrange
	invalidToken := "invalid-token-12345"

	// Act
	w := s.makeRequest("GET", "/me", nil, invalidToken)

	// Assert
	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
}

func (s *AuthHandlerTestSuite) TestMe_MissingToken() {
	// Act
	w := s.makeRequest("GET", "/me", nil, "")

	// Assert
	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
}

func (s *AuthHandlerTestSuite) TestLoginAfterLogout_TokenInvalidated() {
	// Arrange - Login to get new token
	loginInput := models.LoginInput{
		Email:    s.db.Owner.Email,
		Password: testutils.TestPassword,
	}
	w1 := s.makeRequest("POST", "/login", loginInput, "")
	s.Equal(http.StatusOK, w1.Code)

	var loginResponse map[string]interface{}
	err := json.Unmarshal(w1.Body.Bytes(), &loginResponse)
	s.Require().NoError(err)

	data := loginResponse["data"].(map[string]interface{})
	token := data["token"].(string)

	// Act - Logout with the token
	w2 := s.makeRequest("POST", "/logout", nil, token)
	s.Equal(http.StatusOK, w2.Code)

	// Assert - Token is now invalid for /me endpoint
	w3 := s.makeRequest("GET", "/me", nil, token)
	s.Equal(http.StatusUnauthorized, w3.Code)
}

func TestAuthHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(AuthHandlerTestSuite))
}
