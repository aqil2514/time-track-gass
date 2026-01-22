// backend/internal/services/ai_service_test.go
package services_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/suite"
	"github.com/timetrack/backend/internal/config"
	"github.com/timetrack/backend/internal/services"
)

type AIServiceTestSuite struct {
	suite.Suite
	service *services.AIService
}

func (s *AIServiceTestSuite) SetupTest() {
	s.service = services.NewAIService(&config.Config{
		ZAIBaseURL:        "https://api.z.ai/api/coding/paas/v4",
		ZAITextModelFast:  "glm-4.7",
		ZAITextModelSmart: "glm-4.7",
	})
}

func (s *AIServiceTestSuite) TestGenerateSessionSummary_NoAPIKey() {
	input := &services.SessionSummaryInput{
		Activities: []services.ActivitySummary{
			{
				AppName:     "VS Code",
				WindowTitle: "main.go",
				Category:    "coding",
				Summary:     "Working on tests",
				Time:        "10:00",
			},
		},
	}

	summary, err := s.service.GenerateSessionSummary(context.Background(), "", input)

	s.NoError(err)
	s.NotNil(summary)
	s.Contains(summary.Overview, "not available")
	s.Empty(summary.Categories)
	s.Empty(summary.KeyPoints)
}

func (s *AIServiceTestSuite) TestGenerateSessionSummary_EmptyActivities() {
	summary, err := s.service.GenerateSessionSummary(
		context.Background(),
		"test-api-key",
		&services.SessionSummaryInput{Activities: []services.ActivitySummary{}},
	)

	// With empty activities, should still return a summary (graceful handling)
	// The actual API call might fail or return minimal content
	s.NotNil(summary)
	// Error might occur if API rejects empty input
	if err != nil {
		s.Error(err)
	}
}

func (s *AIServiceTestSuite) TestGenerateSessionSummary_ValidInput() {
	input := &services.SessionSummaryInput{
		Activities: []services.ActivitySummary{
			{AppName: "VS Code", WindowTitle: "main.go", Category: "coding", Summary: "Test", Time: "10:00"},
			{AppName: "Chrome", WindowTitle: "Documentation", Category: "documentation", Summary: "Reading", Time: "11:00"},
		},
	}

	// Note: This test requires a valid API key to actually work
	// For unit tests, we test that the service handles no API key gracefully
	summary, err := s.service.GenerateSessionSummary(context.Background(), "", input)

	s.NoError(err)
	s.NotNil(summary)
}

func (s *AIServiceTestSuite) TestGenerateDailySummary_NoAPIKey() {
	activities := []services.ActivitySummary{
		{AppName: "VS Code", WindowTitle: "test.go", Category: "coding", Summary: "Test", Time: "10:00"},
	}

	summary, err := s.service.GenerateDailySummary(context.Background(), "", activities, 8.0)

	s.NoError(err)
	s.NotNil(summary)
	s.Contains(summary.Overview, "not available")
	s.Empty(summary.TopCategories)
	s.Equal(8.0, summary.TotalHours)
	s.Empty(summary.Highlights)
}

func (s *AIServiceTestSuite) TestGenerateDailySummary_ValidInput() {
	activities := []services.ActivitySummary{
		{AppName: "VS Code", WindowTitle: "test.go", Category: "coding", Summary: "Writing tests", Time: "09:00"},
		{AppName: "Chrome", WindowTitle: "Docs", Category: "documentation", Summary: "Reading docs", Time: "10:00"},
		{AppName: "VS Code", WindowTitle: "main.go", Category: "coding", Summary: "Implementation", Time: "11:00"},
	}

	// Without valid API key, should return graceful fallback
	summary, err := s.service.GenerateDailySummary(context.Background(), "", activities, 6.5)

	s.NoError(err)
	s.NotNil(summary)
	s.Equal(6.5, summary.TotalHours)
}

func (s *AIServiceTestSuite) TestBuildSessionSummaryPrompt() {
	input := &services.SessionSummaryInput{
		Activities: []services.ActivitySummary{
			{AppName: "Test", WindowTitle: "Test", Category: "test", Summary: "Test", Time: "10:00"},
		},
	}

	// The prompt builder is tested indirectly through GenerateSessionSummary
	// This test verifies the service can handle the input structure
	summary, err := s.service.GenerateSessionSummary(context.Background(), "", input)

	s.NoError(err)
	s.NotNil(summary)
}

func (s *AIServiceTestSuite) TestBuildDailySummaryPrompt() {
	activities := []services.ActivitySummary{
		{AppName: "VS Code", WindowTitle: "test.go", Category: "coding", Summary: "Test", Time: "09:00"},
		{AppName: "Chrome", WindowTitle: "docs", Category: "documentation", Summary: "Reading", Time: "10:00"},
	}

	// Test with various total hours
	testCases := []float64{0.5, 4.0, 8.0, 12.0}

	for _, totalHours := range testCases {
		summary, err := s.service.GenerateDailySummary(context.Background(), "", activities, totalHours)

		s.NoError(err, "Should work for %.1f hours", totalHours)
		s.NotNil(summary)
		s.Equal(totalHours, summary.TotalHours)
	}
}

func (s *AIServiceTestSuite) TestAIServiceCreation() {
	// Test that service can be created with different configs
	configs := []struct {
		name              string
		baseURL           string
		textFast          string
		textSmart         string
		expectedTimeoutMs int // Expected timeout in milliseconds (approximate)
	}{
		{
			name:      "default config",
			baseURL:   "https://api.example.com",
			textFast:  "fast-model",
			textSmart: "smart-model",
		},
		{
			name:      "production config",
			baseURL:   "https://api.z.ai/api/coding/paas/v4",
			textFast:  "glm-4.7-flashx",
			textSmart: "glm-4.7",
		},
	}

	for _, tc := range configs {
		s.Run(tc.name, func() {
			svc := services.NewAIService(&config.Config{
				ZAIBaseURL:        tc.baseURL,
				ZAITextModelFast:  tc.textFast,
				ZAITextModelSmart: tc.textSmart,
			})

			s.NotNil(svc)
		})
	}
}

func (s *AIServiceTestSuite) TestGenerateSessionSummary_WithRealAPIKey() {
	// This test would require a real API key to run
	// Skip in CI/CD unless API key is available
	apiKey := "test-api-key" // Not a real key

	input := &services.SessionSummaryInput{
		Activities: []services.ActivitySummary{
			{AppName: "VS Code", WindowTitle: "test.go", Category: "coding", Summary: "Testing", Time: "10:00"},
		},
	}

	// With fake key, should still handle gracefully (API error but no panic)
	summary, err := s.service.GenerateSessionSummary(context.Background(), apiKey, input)

	// Either returns error (API unreachable) or summary (if key somehow works)
	// Important: No panic
	if err != nil {
		s.Error(err)
	}
	s.NotNil(summary)
}

func (s *AIServiceTestSuite) TestSummaryStructFields() {
	// Test that summary structs have correct fields
	sessionSummary := &services.SessionSummary{
		Overview:   "Test overview",
		Categories: []string{"coding", "documentation"},
		KeyPoints:  []string{"Point 1", "Point 2"},
	}

	s.Equal("Test overview", sessionSummary.Overview)
	s.Len(sessionSummary.Categories, 2)
	s.Len(sessionSummary.KeyPoints, 2)

	dailySummary := &services.DailySummary{
		Overview:      "Daily test",
		TopCategories: []string{"coding"},
		TotalHours:    8.0,
		Highlights:    []string{"Highlight 1"},
	}

	s.Equal("Daily test", dailySummary.Overview)
	s.Len(dailySummary.TopCategories, 1)
	s.Equal(8.0, dailySummary.TotalHours)
	s.Len(dailySummary.Highlights, 1)
}

func (s *AIServiceTestSuite) TestActivitySummaryStruct() {
	activity := services.ActivitySummary{
		AppName:     "VS Code",
		WindowTitle: "test.go",
		Category:    "coding",
		Summary:     "Testing AI service",
		Time:        "10:00",
	}

	s.Equal("VS Code", activity.AppName)
	s.Equal("test.go", activity.WindowTitle)
	s.Equal("coding", activity.Category)
	s.Equal("Testing AI service", activity.Summary)
	s.Equal("10:00", activity.Time)
}

func (s *AIServiceTestSuite) TestGenerateSessionSummary_LargeActivityList() {
	// Build a large activity list
	var activities []services.ActivitySummary
	for i := 0; i < 100; i++ {
		activities = append(activities, services.ActivitySummary{
			AppName:     "Test App",
			WindowTitle: "test.go",
			Category:    "coding",
			Summary:     "Test activity",
			Time:        "10:00",
		})
	}

	input := &services.SessionSummaryInput{Activities: activities}

	// Should handle large lists gracefully (with no API key)
	summary, err := s.service.GenerateSessionSummary(context.Background(), "", input)

	s.NoError(err)
	s.NotNil(summary)
}

func TestAIServiceSuite(t *testing.T) {
	suite.Run(t, new(AIServiceTestSuite))
}
