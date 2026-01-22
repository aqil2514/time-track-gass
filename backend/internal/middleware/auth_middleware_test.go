// backend/internal/middleware/auth_middleware_test.go
package middleware

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
	"github.com/timetrack/backend/internal/config"
	"github.com/timetrack/backend/internal/models"
	"github.com/timetrack/backend/internal/services"
	"github.com/timetrack/backend/tests/testutils"
)

type AuthMiddlewareTestSuite struct {
	suite.Suite
	db          *testutils.TestFixtures
	router      *gin.Engine
	authService *services.AuthService
	orgService  *services.OrganizationService
	cfg         *config.Config
}

func (s *AuthMiddlewareTestSuite) SetupSuite() {
	dbPool := testutils.ConnectTestDB()
	ctx := context.Background()

	s.cfg = config.Load()

	fixtures, err := testutils.SetupFixtures(ctx, dbPool)
	s.Require().NoError(err)
	s.db = fixtures

	s.orgService = services.NewOrganizationService(dbPool, s.cfg)
	s.authService = services.NewAuthService(dbPool)
	s.authService.SetOrganizationService(s.orgService)

	gin.SetMode(gin.TestMode)
	s.router = gin.New()

	s.setupRoutes()
}

func (s *AuthMiddlewareTestSuite) TearDownSuite() {
	ctx := context.Background()
	s.db.Cleanup(ctx)
}

func (s *AuthMiddlewareTestSuite) setupRoutes() {
	testHandler := func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"data":    gin.H{"message": "no user"},
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"user_id":  user.(*models.User).ID,
				"email":    user.(*models.User).Email,
				"name":     user.(*models.User).Name,
				"role":     user.(*models.User).Role,
				"message":  "authenticated",
			},
		})
	}

	protected := s.router.Group("/protected")
	protected.Use(AuthMiddleware(s.authService))
	{
		protected.GET("/test", testHandler)
		protected.POST("/test", testHandler)
		protected.PUT("/test", testHandler)
		protected.PATCH("/test", testHandler)
		protected.DELETE("/test", testHandler)
	}

	s.router.GET("/public", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    gin.H{"message": "public endpoint"},
		})
	})
}

func (s *AuthMiddlewareTestSuite) makeRequest(method, path string, body interface{}, token string) *httptest.ResponseRecorder {
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

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_ValidToken() {
	w := s.makeRequest("GET", "/protected/test", nil, s.db.MemberToken)

	s.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.True(response["success"].(bool))
	data := response["data"].(map[string]interface{})
	s.Equal("authenticated", data["message"])
	s.Equal(s.db.Member.Email, data["email"])
	s.Equal(s.db.Member.Name, data["name"])
	s.Equal(s.db.Member.Role, data["role"])
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_NoToken() {
	w := s.makeRequest("GET", "/protected/test", nil, "")

	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
	s.Equal("Authorization header required", errData["message"])
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_InvalidToken() {
	w := s.makeRequest("GET", "/protected/test", nil, "invalid-token-12345")

	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
	s.Equal("Invalid or expired token", errData["message"])
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_MalformedBearerToken() {
	req, err := http.NewRequest("GET", "/protected/test", bytes.NewBuffer(nil))
	s.Require().NoError(err)

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "InvalidFormat token123")

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
	s.Equal("Invalid authorization header format", errData["message"])
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_TokenOnlyWithoutBearer() {
	req, err := http.NewRequest("GET", "/protected/test", bytes.NewBuffer(nil))
	s.Require().NoError(err)

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", s.db.MemberToken)

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
	s.Equal("Invalid authorization header format", errData["message"])
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_BearerOnlyWithoutToken() {
	req, err := http.NewRequest("GET", "/protected/test", bytes.NewBuffer(nil))
	s.Require().NoError(err)

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer ")

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
	s.Equal("Invalid or expired token", errData["message"])
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_TooManyPartsInHeader() {
	req, err := http.NewRequest("GET", "/protected/test", bytes.NewBuffer(nil))
	s.Require().NoError(err)

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer token1 token2 extra")

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
	s.Equal("Invalid authorization header format", errData["message"])
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_EmptyAuthorizationHeader() {
	req, err := http.NewRequest("GET", "/protected/test", bytes.NewBuffer(nil))
	s.Require().NoError(err)

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "")

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
	s.Equal("Authorization header required", errData["message"])
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_ExpiredToken() {
	ctx := context.Background()

	_, token, err := s.db.CreateUser(ctx, "member")
	s.Require().NoError(err)

	_, err = s.db.DB.Exec(ctx, "UPDATE sessions SET expires_at = NOW() - INTERVAL '1 hour' WHERE token = $1", token)
	s.Require().NoError(err)

	w := s.makeRequest("GET", "/protected/test", nil, token)

	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
	s.Equal("Invalid or expired token", errData["message"])
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_DeletedToken() {
	ctx := context.Background()

	_, token, err := s.db.CreateUser(ctx, "member")
	s.Require().NoError(err)

	_, err = s.db.DB.Exec(ctx, "DELETE FROM sessions WHERE token = $1", token)
	s.Require().NoError(err)

	w := s.makeRequest("GET", "/protected/test", nil, token)

	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
	s.Equal("Invalid or expired token", errData["message"])
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_DeletedUser() {
	ctx := context.Background()

	deletedUser, token, err := s.db.CreateUser(ctx, "member")
	s.Require().NoError(err)

	_, err = s.db.DB.Exec(ctx, "DELETE FROM users WHERE id = $1", deletedUser.ID)
	s.Require().NoError(err)

	w := s.makeRequest("GET", "/protected/test", nil, token)

	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
	s.Equal("Invalid or expired token", errData["message"])
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_VerifiesUserContext() {
	w := s.makeRequest("GET", "/protected/test", nil, s.db.OwnerToken)

	s.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.True(response["success"].(bool))
	data := response["data"].(map[string]interface{})
	s.Equal(s.db.Owner.ID.String(), data["user_id"].(string))
	s.Equal(s.db.Owner.Email, data["email"])
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_VerifiesTokenContext() {
	w := s.makeRequest("POST", "/protected/test", nil, s.db.AdminToken)

	s.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.True(response["success"].(bool))
	data := response["data"].(map[string]interface{})
	s.Equal(s.db.Admin.Email, data["email"])
	s.Equal("admin", data["role"])
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_AllowedMethods() {
	methods := []string{"GET", "POST", "PUT", "PATCH", "DELETE"}

	for _, method := range methods {
		w := s.makeRequest(method, "/protected/test", nil, s.db.MemberToken)
		s.Equal(http.StatusOK, w.Code, "Method %s should work with valid token", method)
	}
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_AllDifferentUserRoles() {
	tests := []struct {
		name     string
		token    string
		expected string
	}{
		{"owner token", s.db.OwnerToken, "owner"},
		{"admin token", s.db.AdminToken, "admin"},
		{"member token", s.db.MemberToken, "member"},
	}

	for _, tt := range tests {
		s.Run(tt.name, func() {
			w := s.makeRequest("GET", "/protected/test", nil, tt.token)

			s.Equal(http.StatusOK, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			s.Require().NoError(err)

			s.True(response["success"].(bool))
			data := response["data"].(map[string]interface{})
			s.Equal(tt.expected, data["role"])
		})
	}
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_VerifiesMultipleUsers() {
	ctx := context.Background()

	user1, token1, err := s.db.CreateUser(ctx, "member")
	s.Require().NoError(err)

	user2, token2, err := s.db.CreateUser(ctx, "admin")
	s.Require().NoError(err)

	w1 := s.makeRequest("GET", "/protected/test", nil, token1)
	s.Equal(http.StatusOK, w1.Code)

	var response1 map[string]interface{}
	err = json.Unmarshal(w1.Body.Bytes(), &response1)
	s.Require().NoError(err)

	data1 := response1["data"].(map[string]interface{})
	s.Equal(user1.ID.String(), data1["user_id"].(string))
	s.Equal("member", data1["role"])

	w2 := s.makeRequest("GET", "/protected/test", nil, token2)
	s.Equal(http.StatusOK, w2.Code)

	var response2 map[string]interface{}
	err = json.Unmarshal(w2.Body.Bytes(), &response2)
	s.Require().NoError(err)

	data2 := response2["data"].(map[string]interface{})
	s.Equal(user2.ID.String(), data2["user_id"].(string))
	s.Equal("admin", data2["role"])
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_TokenLength() {
	shortToken := "abc"
	w := s.makeRequest("GET", "/protected/test", nil, shortToken)

	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_WhitespaceInToken() {
	whitespaceToken := " " + s.db.MemberToken + " "
	w := s.makeRequest("GET", "/protected/test", nil, whitespaceToken)

	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_CaseSensitiveBearer() {
	req, err := http.NewRequest("GET", "/protected/test", bytes.NewBuffer(nil))
	s.Require().NoError(err)

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "bearer "+s.db.MemberToken)

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	s.Equal(http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	s.Require().NoError(err)

	s.False(response["success"].(bool))
	errData := response["error"].(map[string]interface{})
	s.Equal("UNAUTHORIZED", errData["code"])
	s.Equal("Invalid authorization header format", errData["message"])
}

func (s *AuthMiddlewareTestSuite) TestJWTMiddleware_NewlineInToken() {
	newlineToken := "Bearer " + s.db.MemberToken[:16] + "\n" + s.db.MemberToken[16:]
	req, err := http.NewRequest("GET", "/protected/test", bytes.NewBuffer(nil))
	s.Require().NoError(err)

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", newlineToken)

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	s.Equal(http.StatusUnauthorized, w.Code)
}

func TestAuthMiddlewareTestSuite(t *testing.T) {
	suite.Run(t, new(AuthMiddlewareTestSuite))
}
