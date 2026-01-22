// backend/internal/handlers/organization_handler_test.go
package handlers_test

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
	"github.com/timetrack/backend/internal/handlers"
	"github.com/timetrack/backend/internal/models"
	"github.com/timetrack/backend/internal/services"
	"github.com/timetrack/backend/tests/testutils"
)

type OrganizationHandlerTestSuite struct {
	suite.Suite
	db              *testutils.TestFixtures
	router          *gin.Engine
	orgHandler      *handlers.OrganizationHandler
	orgService      *services.OrganizationService
}

func (s *OrganizationHandlerTestSuite) SetupSuite() {
	db := testutils.ConnectTestDB()

	var err error
	s.db, err = testutils.SetupFixtures(context.Background(), db)
	s.Require().NoError(err)

	// Create services
	cfg := &config.Config{
		EncryptionKey: "test-32-byte-hex-key-here-123456",
	}
	s.orgService = services.NewOrganizationService(db, cfg)
	s.orgHandler = handlers.NewOrganizationHandler(s.orgService)

	// Setup router
	gin.SetMode(gin.TestMode)
	s.router = gin.New()

	// Auth middleware mock - sets user from X-User-Role header
	s.router.Use(func(c *gin.Context) {
		role := c.GetHeader("X-User-Role")
		if role == "" {
			role = "member"
		}
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			userID = s.db.Member.ID.String()
		}

		var user *models.User
		switch role {
		case "owner":
			user = s.db.Owner
		case "admin":
			user = s.db.Admin
		default:
			user = s.db.Member
		}
		c.Set("user", user)
		c.Next()
	})

	// Routes
	api := s.router.Group("/api/v1/org")
	{
		api.GET("", s.orgHandler.GetOrganization)
		api.PATCH("/settings", s.orgHandler.UpdateSettings)
		api.PUT("/settings/api-key", s.orgHandler.SetAPIKey)
		api.DELETE("/settings/api-key", s.orgHandler.RemoveAPIKey)
		api.GET("/api-key", s.orgHandler.GetDecryptedAPIKey)
		api.GET("/members", s.orgHandler.ListMembers)
		api.POST("/members", s.orgHandler.AddMember)
		api.PATCH("/members/:id", s.orgHandler.UpdateMember)
		api.DELETE("/members/:id", s.orgHandler.RemoveMember)
		api.GET("/stats", s.orgHandler.GetOrganizationStats)
		api.GET("/members/summary", s.orgHandler.GetMembersSummary)
		api.GET("/members/:id/activities", s.orgHandler.GetMemberActivities)
		api.GET("/members/:id/stats", s.orgHandler.GetMemberStats)
		api.GET("/activity-heatmap", s.orgHandler.GetActivityHeatmap)
	}
}

func (s *OrganizationHandlerTestSuite) TearDownSuite() {
	s.db.Cleanup(context.Background())
}

func (s *OrganizationHandlerTestSuite) makeRequest(method, path string, body interface{}, role string) *httptest.ResponseRecorder {
	var reqBody *bytes.Buffer
	if body != nil {
		jsonBody, _ := json.Marshal(body)
		reqBody = bytes.NewBuffer(jsonBody)
	} else {
		reqBody = bytes.NewBuffer(nil)
	}

	req := httptest.NewRequest(method, path, reqBody)
	req.Header.Set("Content-Type", "application/json")
	if role != "" {
		req.Header.Set("X-User-Role", role)
	}

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)
	return w
}

func (s *OrganizationHandlerTestSuite) TestGetOrganization_Success() {
	resp := s.makeRequest("GET", "/api/v1/org", nil, "member")

	s.Equal(http.StatusOK, resp.Code)

	var result map[string]interface{}
	json.Unmarshal(resp.Body.Bytes(), &result)

	s.True(result["success"].(bool))
	s.NotEmpty(result["data"])
}

func (s *OrganizationHandlerTestSuite) TestGetOrganization_AsOwner() {
	resp := s.makeRequest("GET", "/api/v1/org", nil, "owner")

	s.Equal(http.StatusOK, resp.Code)

	var result map[string]interface{}
	json.Unmarshal(resp.Body.Bytes(), &result)

	s.True(result["success"].(bool))
	data := result["data"].(map[string]interface{})
	s.NotEmpty(data["id"])
	s.NotEmpty(data["name"])
}

func (s *OrganizationHandlerTestSuite) TestUpdateSettings_Success() {
	body := map[string]string{
		"name":     "Updated Organization",
		"timezone": "America/New_York",
	}
	resp := s.makeRequest("PATCH", "/api/v1/org/settings", body, "owner")

	s.Equal(http.StatusOK, resp.Code)

	var result map[string]interface{}
	json.Unmarshal(resp.Body.Bytes(), &result)

	if result["success"] != nil {
		s.True(result["success"].(bool))
	}
}

func (s *OrganizationHandlerTestSuite) TestUpdateSettings_NotOwner_Forbidden() {
	body := map[string]string{
		"name": "Hacked Name",
	}
	resp := s.makeRequest("PATCH", "/api/v1/org/settings", body, "member")

	s.Equal(http.StatusForbidden, resp.Code)
}

func (s *OrganizationHandlerTestSuite) TestUpdateSettings_Admin_Forbidden() {
	body := map[string]string{
		"name": "Admin Update",
	}
	resp := s.makeRequest("PATCH", "/api/v1/org/settings", body, "admin")

	s.Equal(http.StatusForbidden, resp.Code)
}

func (s *OrganizationHandlerTestSuite) TestSetAPIKey_Success() {
	body := map[string]string{
		"api_key": "test-api-key-123456",
	}
	resp := s.makeRequest("PUT", "/api/v1/org/settings/api-key", body, "owner")

	s.Equal(http.StatusOK, resp.Code)

	var result map[string]interface{}
	json.Unmarshal(resp.Body.Bytes(), &result)

	s.True(result["success"].(bool))
}

func (s *OrganizationHandlerTestSuite) TestSetAPIKey_NotOwner_Forbidden() {
	body := map[string]string{
		"api_key": "test-key",
	}
	resp := s.makeRequest("PUT", "/api/v1/org/settings/api-key", body, "member")

	s.Equal(http.StatusForbidden, resp.Code)
}

func (s *OrganizationHandlerTestSuite) TestSetAPIKey_MissingKey_BadRequest() {
	body := map[string]string{} // Missing api_key
	resp := s.makeRequest("PUT", "/api/v1/org/settings/api-key", body, "owner")

	s.Equal(http.StatusBadRequest, resp.Code)
}

func (s *OrganizationHandlerTestSuite) TestRemoveAPIKey_Success() {
	// First set a key
	setBody := map[string]string{"api_key": "test-key"}
	s.makeRequest("PUT", "/api/v1/org/settings/api-key", setBody, "owner")

	// Then remove it
	resp := s.makeRequest("DELETE", "/api/v1/org/settings/api-key", nil, "owner")

	s.Equal(http.StatusOK, resp.Code)
}

func (s *OrganizationHandlerTestSuite) TestGetDecryptedAPIKey_NotSet() {
	// First, ensure no API key is set by removing any existing key
	s.makeRequest("DELETE", "/api/v1/org/settings/api-key", nil, "owner")

	resp := s.makeRequest("GET", "/api/v1/org/api-key", nil, "member")

	// Service returns 404 when no key is set
	s.Equal(http.StatusNotFound, resp.Code)

	var result map[string]interface{}
	json.Unmarshal(resp.Body.Bytes(), &result)

	s.Contains(result, "error")
}

func (s *OrganizationHandlerTestSuite) TestGetDecryptedAPIKey_AfterSet() {
	// Set API key
	setBody := map[string]string{"api_key": "test-key-123"}
	s.makeRequest("PUT", "/api/v1/org/settings/api-key", setBody, "owner")

	// Get API key
	resp := s.makeRequest("GET", "/api/v1/org/api-key", nil, "member")

	s.Equal(http.StatusOK, resp.Code)

	var result map[string]interface{}
	json.Unmarshal(resp.Body.Bytes(), &result)

	s.True(result["success"].(bool))
	data := result["data"].(map[string]interface{})
	s.NotEmpty(data["api_key"])
}

func (s *OrganizationHandlerTestSuite) TestListMembers_Success() {
	resp := s.makeRequest("GET", "/api/v1/org/members", nil, "owner")

	s.Equal(http.StatusOK, resp.Code)

	var result map[string]interface{}
	json.Unmarshal(resp.Body.Bytes(), &result)

	s.True(result["success"].(bool))
	data := result["data"].([]interface{})
	// Should have at least 3 members (owner, admin, member from fixtures)
	s.GreaterOrEqual(len(data), 3)
}

func (s *OrganizationHandlerTestSuite) TestListMembers_Member_Forbidden() {
	resp := s.makeRequest("GET", "/api/v1/org/members", nil, "member")

	s.Equal(http.StatusForbidden, resp.Code)
}

func (s *OrganizationHandlerTestSuite) TestAddMember_Success() {
	body := map[string]string{
		"email":    "newmember@test.com",
		"password": "Password123!",
		"name":     "New Member",
		"role":     "member",
	}
	resp := s.makeRequest("POST", "/api/v1/org/members", body, "owner")

	s.Equal(http.StatusCreated, resp.Code)

	var result map[string]interface{}
	json.Unmarshal(resp.Body.Bytes(), &result)

	s.True(result["success"].(bool))
	data := result["data"].(map[string]interface{})
	s.Equal("newmember@test.com", data["email"])

	// Cleanup
	s.db.DB.Exec(context.Background(), "DELETE FROM users WHERE email = 'newmember@test.com'")
}

func (s *OrganizationHandlerTestSuite) TestAddMember_Member_Forbidden() {
	body := map[string]string{
		"email":    "another@test.com",
		"password": "Password123!",
		"name":     "Should Fail",
		"role":     "member",
	}
	resp := s.makeRequest("POST", "/api/v1/org/members", body, "member")

	s.Equal(http.StatusForbidden, resp.Code)
}

func (s *OrganizationHandlerTestSuite) TestAddMember_MissingFields_BadRequest() {
	body := map[string]string{
		"email": "test@test.com", // Missing password
	}
	resp := s.makeRequest("POST", "/api/v1/org/members", body, "owner")

	s.Equal(http.StatusBadRequest, resp.Code)
}

func (s *OrganizationHandlerTestSuite) TestUpdateMember_Success() {
	// Create a member to update
	addBody := map[string]string{
		"email":    "updateme@test.com",
		"password": "Password123!",
		"name":     "Original Name",
		"role":     "member",
	}
	addResp := s.makeRequest("POST", "/api/v1/org/members", addBody, "owner")

	var addResult map[string]interface{}
	json.Unmarshal(addResp.Body.Bytes(), &addResult)
	memberID := addResult["data"].(map[string]interface{})["id"].(string)

	// Update the member
	updateBody := map[string]string{
		"name": "Updated Name",
		"role": "admin",
	}
	resp := s.makeRequest("PATCH", "/api/v1/org/members/"+memberID, updateBody, "owner")

	s.Equal(http.StatusOK, resp.Code)

	// Cleanup
	s.db.DB.Exec(context.Background(), "DELETE FROM users WHERE email = 'updateme@test.com'")
}

func (s *OrganizationHandlerTestSuite) TestUpdateMember_InvalidUUID() {
	body := map[string]string{
		"name": "Test",
	}
	resp := s.makeRequest("PATCH", "/api/v1/org/members/invalid-uuid", body, "owner")

	s.Equal(http.StatusBadRequest, resp.Code)
}

func (s *OrganizationHandlerTestSuite) TestRemoveMember_Success() {
	// Create a member to remove
	addBody := map[string]string{
		"email":    "removeme@test.com",
		"password": "Password123!",
		"name":     "To Remove",
		"role":     "member",
	}
	addResp := s.makeRequest("POST", "/api/v1/org/members", addBody, "owner")

	var addResult map[string]interface{}
	json.Unmarshal(addResp.Body.Bytes(), &addResult)
	memberID := addResult["data"].(map[string]interface{})["id"].(string)

	// Remove the member
	resp := s.makeRequest("DELETE", "/api/v1/org/members/"+memberID, nil, "owner")

	s.Equal(http.StatusOK, resp.Code)
}

func (s *OrganizationHandlerTestSuite) TestGetOrganizationStats_Success() {
	resp := s.makeRequest("GET", "/api/v1/org/stats", nil, "owner")

	s.Equal(http.StatusOK, resp.Code)

	var result map[string]interface{}
	json.Unmarshal(resp.Body.Bytes(), &result)

	s.True(result["success"].(bool))
	s.NotEmpty(result["data"])
}

func (s *OrganizationHandlerTestSuite) TestGetOrganizationStats_WithDateFilter() {
	resp := s.makeRequest("GET", "/api/v1/org/stats?from=2024-01-01&to=2024-12-31", nil, "owner")

	s.Equal(http.StatusOK, resp.Code)
}

func (s *OrganizationHandlerTestSuite) TestGetOrganizationStats_InvalidDate() {
	resp := s.makeRequest("GET", "/api/v1/org/stats?from=invalid-date", nil, "owner")

	s.Equal(http.StatusBadRequest, resp.Code)
}

func (s *OrganizationHandlerTestSuite) TestGetOrganizationStats_Member_Forbidden() {
	resp := s.makeRequest("GET", "/api/v1/org/stats", nil, "member")

	s.Equal(http.StatusForbidden, resp.Code)
}

func (s *OrganizationHandlerTestSuite) TestGetMembersSummary_Success() {
	resp := s.makeRequest("GET", "/api/v1/org/members/summary", nil, "owner")

	s.Equal(http.StatusOK, resp.Code)

	var result map[string]interface{}
	json.Unmarshal(resp.Body.Bytes(), &result)

	s.True(result["success"].(bool))
	s.NotEmpty(result["data"])
}

func (s *OrganizationHandlerTestSuite) TestGetMemberActivities_Success() {
	resp := s.makeRequest("GET", "/api/v1/org/members/"+s.db.Member.ID.String()+"/activities", nil, "owner")

	s.Equal(http.StatusOK, resp.Code)

	var result map[string]interface{}
	json.Unmarshal(resp.Body.Bytes(), &result)

	s.True(result["success"].(bool))
	s.NotEmpty(result["data"])
	s.NotEmpty(result["meta"])

	meta := result["meta"].(map[string]interface{})
	s.NotEmpty(meta["page"])
	s.NotEmpty(meta["per_page"])
	s.NotEmpty(meta["total"])
}

func (s *OrganizationHandlerTestSuite) TestGetMemberActivities_WithPagination() {
	resp := s.makeRequest("GET", "/api/v1/org/members/"+s.db.Member.ID.String()+"/activities?page=1&per_page=5", nil, "owner")

	s.Equal(http.StatusOK, resp.Code)
}

func (s *OrganizationHandlerTestSuite) TestGetMemberActivities_InvalidMemberID() {
	resp := s.makeRequest("GET", "/api/v1/org/members/invalid-uuid/activities", nil, "owner")

	s.Equal(http.StatusBadRequest, resp.Code)
}

func (s *OrganizationHandlerTestSuite) TestGetMemberStats_Success() {
	resp := s.makeRequest("GET", "/api/v1/org/members/"+s.db.Member.ID.String()+"/stats", nil, "owner")

	s.Equal(http.StatusOK, resp.Code)

	var result map[string]interface{}
	json.Unmarshal(resp.Body.Bytes(), &result)

	s.True(result["success"].(bool))
	s.NotEmpty(result["data"])
}

func (s *OrganizationHandlerTestSuite) TestGetMemberStats_WithDateFilter() {
	resp := s.makeRequest("GET", "/api/v1/org/members/"+s.db.Member.ID.String()+"/stats?from=2024-01-01&to=2024-12-31", nil, "owner")

	s.Equal(http.StatusOK, resp.Code)
}

func (s *OrganizationHandlerTestSuite) TestGetActivityHeatmap_Success() {
	resp := s.makeRequest("GET", "/api/v1/org/activity-heatmap?date=2024-01-15", nil, "owner")

	s.Equal(http.StatusOK, resp.Code)

	var result map[string]interface{}
	json.Unmarshal(resp.Body.Bytes(), &result)

	s.True(result["success"].(bool))
	s.NotEmpty(result["data"])
}

func (s *OrganizationHandlerTestSuite) TestGetActivityHeatmap_InvalidDate() {
	resp := s.makeRequest("GET", "/api/v1/org/activity-heatmap?date=not-a-date", nil, "owner")

	s.Equal(http.StatusBadRequest, resp.Code)
}

func TestOrganizationHandlerSuite(t *testing.T) {
	suite.Run(t, new(OrganizationHandlerTestSuite))
}
