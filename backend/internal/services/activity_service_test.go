// backend/internal/services/activity_service_test.go
package services_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/suite"
	"github.com/timetrack/backend/internal/config"
	"github.com/timetrack/backend/internal/models"
	"github.com/timetrack/backend/internal/services"
	"github.com/timetrack/backend/tests/testutils"
)

type ActivityServiceTestSuite struct {
	suite.Suite
	db         *testutils.TestFixtures
	service    *services.ActivityService
	aiService   *services.AIService
}

func (s *ActivityServiceTestSuite) SetupSuite() {
	db := testutils.ConnectTestDB()

	var err error
	s.db, err = testutils.SetupFixtures(context.Background(), db)
	s.Require().NoError(err)

	// Create AI service with minimal config
	s.aiService = services.NewAIService(&config.Config{
		ZAIBaseURL:         "https://api.z.ai/api/coding/paas/v4",
		ZAITextModelFast:   "glm-4.7",
		ZAITextModelSmart:  "glm-4.7",
	})
	s.service = services.NewActivityService(db, s.aiService)
}

func (s *ActivityServiceTestSuite) TearDownSuite() {
	s.db.Cleanup(context.Background())
}

func (s *ActivityServiceTestSuite) TestUploadActivity_Success() {
	input := &models.UploadActivityInput{
		CapturedAt:  time.Now().Format(time.RFC3339),
		AppName:     "VS Code",
		WindowTitle: "main.go - TimeTrack",
		Category:    "coding",
		Summary:     "Working on activity service",
	}

	activity, err := s.service.Upload(context.Background(), s.db.Member.ID, input)

	s.NoError(err)
	s.NotEqual(uuid.UUID{}, activity.ID)
	s.Equal(s.db.Member.ID, activity.UserID)
	s.Equal("VS Code", activity.AppName)
	s.Equal("coding", activity.Category)
}

func (s *ActivityServiceTestSuite) TestUploadActivity_DefaultCapturedAt() {
	input := &models.UploadActivityInput{
		AppName:     "Chrome",
		WindowTitle: "Documentation",
		Category:    "documentation",
		Summary:     "Reading docs",
	}

	activity, err := s.service.Upload(context.Background(), s.db.Member.ID, input)

	s.NoError(err)
	// CapturedAt should be set to now (within 1 minute tolerance)
	s.WithinDuration(time.Now().UTC(), activity.CapturedAt, time.Minute)
}

func (s *ActivityServiceTestSuite) TestListActivities_DefaultPagination() {
	from := time.Now().UTC().Truncate(24 * time.Hour)
	to := from.Add(24 * time.Hour)

	activities, total, err := s.service.List(context.Background(), s.db.Member.ID, from, to, "", 1, 20)

	s.NoError(err)
	s.GreaterOrEqual(total, len(s.db.Activities))
	s.LessOrEqual(len(activities), 20)
}

func (s *ActivityServiceTestSuite) TestListActivities_Pagination() {
	from := time.Now().UTC().Add(-24 * time.Hour)
	to := time.Now().UTC().Add(24 * time.Hour)

	// First page
	page1, total, err := s.service.List(context.Background(), s.db.Member.ID, from, to, "", 1, 5)
	s.NoError(err)
	s.LessOrEqual(len(page1), 5)

	// Second page if there are more
	if total > 5 {
		page2, _, err := s.service.List(context.Background(), s.db.Member.ID, from, to, "", 2, 5)
		s.NoError(err)

		// Pages should have different content
		if len(page1) > 0 && len(page2) > 0 {
			s.NotEqual(page1[0].ID, page2[0].ID)
		}
	}
}

func (s *ActivityServiceTestSuite) TestListActivities_FilterByCategory() {
	from := time.Now().UTC().Add(-24 * time.Hour)
	to := time.Now().UTC().Add(24 * time.Hour)

	activities, _, err := s.service.List(context.Background(), s.db.Member.ID, from, to, "coding", 1, 20)

	s.NoError(err)
	for _, act := range activities {
		s.Equal("coding", act.Category)
	}
}

func (s *ActivityServiceTestSuite) TestListActivities_FilterByDate() {
	now := time.Now().UTC()
	from := now.Truncate(24 * time.Hour)
	to := from.Add(24 * time.Hour)

	activities, _, err := s.service.List(context.Background(), s.db.Member.ID, from, to, "", 1, 20)

	s.NoError(err)
	for _, act := range activities {
		s.True(act.CapturedAt.After(from.Add(-time.Second)) || act.CapturedAt.Equal(from))
		s.True(act.CapturedAt.Before(to))
	}
}

func (s *ActivityServiceTestSuite) TestListActivities_EmptyResult() {
	future := time.Now().UTC().Add(24 * time.Hour)
	from := future
	to := future.Add(24 * time.Hour)

	activities, total, err := s.service.List(context.Background(), s.db.Member.ID, from, to, "", 1, 20)

	s.NoError(err)
	s.Equal(0, total)
	s.Equal(0, len(activities))
}

func (s *ActivityServiceTestSuite) TestGetStats_Success() {
	from := time.Now().UTC().Truncate(24 * time.Hour)
	to := from.Add(24 * time.Hour)

	stats, err := s.service.GetStats(context.Background(), s.db.Member.ID, from, to)

	s.NoError(err)
	s.GreaterOrEqual(stats.TotalMinutes, 0)
	s.GreaterOrEqual(stats.TotalHours, 0.0)
	s.NotEmpty(stats.ByCategory)
}

func (s *ActivityServiceTestSuite) TestGetStats_CategoryPercentages() {
	// Create specific activities for percentage test
	inputs := []models.UploadActivityInput{
		{AppName: "VS Code", WindowTitle: "test.go", Category: "coding", Summary: "Test 1"},
		{AppName: "VS Code", WindowTitle: "test.go", Category: "coding", Summary: "Test 2"},
		{AppName: "Chrome", WindowTitle: "Docs", Category: "documentation", Summary: "Test 3"},
	}

	for _, input := range inputs {
		_, err := s.service.Upload(context.Background(), s.db.Member.ID, &input)
		s.NoError(err)
	}

	from := time.Now().UTC().Add(-1 * time.Hour)
	to := time.Now().UTC().Add(1 * time.Hour)

	stats, err := s.service.GetStats(context.Background(), s.db.Member.ID, from, to)

	s.NoError(err)
	totalPercentage := 0.0
	for _, stat := range stats.ByCategory {
		totalPercentage += stat.Percentage
	}
	// Percentages should roughly sum to 100 (allowing some float tolerance)
	s.InDelta(100.0, totalPercentage, 1.0)
}

func (s *ActivityServiceTestSuite) TestGetStats_EmptyResult() {
	future := time.Now().UTC().Add(24 * time.Hour)
	from := future
	to := future.Add(24 * time.Hour)

	stats, err := s.service.GetStats(context.Background(), s.db.Member.ID, from, to)

	s.NoError(err)
	s.Equal(0, stats.TotalMinutes)
	s.Equal(0.0, stats.TotalHours)
	s.Empty(stats.ByCategory)
}

func (s *ActivityServiceTestSuite) TestUpdateAIAnalysis_Success() {
	// Create an activity first
	input := &models.UploadActivityInput{
		AppName:     "Old App",
		WindowTitle: "Old Title",
		Category:    "other",
		Summary:     "Old summary",
	}
	activity, err := s.service.Upload(context.Background(), s.db.Member.ID, input)
	s.Require().NoError(err)

	// Update with AI analysis
	analysis := &models.ScreenshotAnalysis{
		AppName:     "VS Code",
		WindowTitle: "activity_service_test.go",
		Category:    "coding",
		Summary:     "Working on tests",
	}

	err = s.service.UpdateAIAnalysis(context.Background(), activity.ID, s.db.Member.ID, analysis)
	s.NoError(err)
}

func (s *ActivityServiceTestSuite) TestUpdateAIAnalysis_NotFound() {
	analysis := &models.ScreenshotAnalysis{
		AppName:     "VS Code",
		WindowTitle: "test.go",
		Category:    "coding",
		Summary:     "Test",
	}

	fakeID := uuid.New()
	err := s.service.UpdateAIAnalysis(context.Background(), fakeID, s.db.Member.ID, analysis)

	s.Error(err)
	s.Contains(err.Error(), "not found")
}

func (s *ActivityServiceTestSuite) TestMarkAIFailed_Success() {
	input := &models.UploadActivityInput{
		AppName:     "Test App",
		WindowTitle: "Test Window",
		Category:    "test",
		Summary:     "Test summary",
	}
	activity, err := s.service.Upload(context.Background(), s.db.Member.ID, input)
	s.Require().NoError(err)

	err = s.service.MarkAIFailed(context.Background(), activity.ID)
	s.NoError(err)
}

func (s *ActivityServiceTestSuite) TestUploadActivity_MultipleDateFormats() {
	formats := []string{
		time.RFC3339,
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04:05.999Z",
	}

	for _, format := range formats {
		timestamp := time.Now().Format(format)
		input := &models.UploadActivityInput{
			CapturedAt:  timestamp,
			AppName:     "Test App",
			WindowTitle: "Test Window",
			Category:    "test",
			Summary:     "Test summary",
		}

		activity, err := s.service.Upload(context.Background(), s.db.Member.ID, input)

		s.NoError(err, "Format: %s should parse", format)
		s.NotEqual(uuid.UUID{}, activity.ID)
	}
}

func (s *ActivityServiceTestSuite) TestListActivities_MaxPerPage() {
	from := time.Now().UTC().Add(-24 * time.Hour)
	to := time.Now().UTC().Add(24 * time.Hour)

	// Request large per_page
	_, total, err := s.service.List(context.Background(), s.db.Member.ID, from, to, "", 1, 1000)

	s.NoError(err)
	// Should return actual count, not error
	s.GreaterOrEqual(total, 0)
	// API layer handles max validation
}

func TestActivityServiceSuite(t *testing.T) {
	suite.Run(t, new(ActivityServiceTestSuite))
}
