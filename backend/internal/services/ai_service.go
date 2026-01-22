// backend/internal/services/ai_service.go
// [TimeTrack Backend AI Service - Server-side summary generation only]
// Screenshot analysis has been moved to client-side (desktop app).
// This service now handles only: SessionSummary, DailySummary generation.
package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/timetrack/backend/internal/config"
)

type AIService struct {
	baseURL   string
	client    *http.Client
	textFast  string
	textSmart string
}

type SessionSummaryInput struct {
	Activities []ActivitySummary `json:"activities"`
}

type ActivitySummary struct {
	AppName     string `json:"app_name"`
	WindowTitle string `json:"window_title"`
	Category    string `json:"category"`
	Summary     string `json:"summary"`
	Time        string `json:"time"`
}

type SessionSummary struct {
	Overview   string   `json:"overview"`
	Categories []string `json:"categories"`
	KeyPoints  []string `json:"key_points"`
}

type DailySummary struct {
	Overview      string   `json:"overview"`
	TopCategories []string `json:"top_categories"`
	TotalHours    float64  `json:"total_hours"`
	Highlights    []string `json:"highlights"`
}

type zaiRequest struct {
	Model    string       `json:"model"`
	Messages []zaiMessage `json:"messages"`
}

type zaiMessage struct {
	Role    string       `json:"role"`
	Content []zaiContent `json:"content"`
}

type zaiContent struct {
	Type string `json:"type"`
	Text string `json:"text,omitempty"`
}

type zaiResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func NewAIService(cfg *config.Config) *AIService {
	return &AIService{
		baseURL: cfg.ZAIBaseURL,
		client: &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				DialContext: (&net.Dialer{
					Timeout:   5 * time.Second,
					KeepAlive: 30 * time.Second,
				}).DialContext,
				ResponseHeaderTimeout: 10 * time.Second,
				IdleConnTimeout:       90 * time.Second,
			},
		},
		textFast:  cfg.ZAITextModelFast,
		textSmart: cfg.ZAITextModelSmart,
	}
}

// GenerateSessionSummary generates a summary for a work session
// Note: apiKey must be provided by caller (from organization settings)
func (s *AIService) GenerateSessionSummary(ctx context.Context, apiKey string, input *SessionSummaryInput) (*SessionSummary, error) {
	if apiKey == "" {
		return &SessionSummary{
			Overview:   "Session summary not available (AI not configured)",
			Categories: []string{},
			KeyPoints:  []string{},
		}, nil
	}

	// Build prompt from activities
	prompt := s.buildSessionSummaryPrompt(input)

	summary, err := s.generateTextSummary(ctx, apiKey, prompt, s.textFast)
	if err != nil {
		return &SessionSummary{
			Overview:   "Unable to generate session summary",
			Categories: []string{},
			KeyPoints:  []string{},
		}, nil
	}

	return summary, nil
}

// GenerateDailySummary generates a daily work summary
// Note: apiKey must be provided by caller (from organization settings)
func (s *AIService) GenerateDailySummary(ctx context.Context, apiKey string, activities []ActivitySummary, totalHours float64) (*DailySummary, error) {
	if apiKey == "" {
		return &DailySummary{
			Overview:      "Daily summary not available (AI not configured)",
			TopCategories: []string{},
			TotalHours:    totalHours,
			Highlights:    []string{},
		}, nil
	}

	prompt := s.buildDailySummaryPrompt(activities, totalHours)

	summary, err := s.generateTextSummary(ctx, apiKey, prompt, s.textSmart)
	if err != nil {
		return &DailySummary{
			Overview:      "Unable to generate daily summary",
			TopCategories: []string{},
			TotalHours:    totalHours,
			Highlights:    []string{},
		}, nil
	}

	// Convert session summary to daily summary
	return &DailySummary{
		Overview:      summary.Overview,
		TopCategories: summary.Categories,
		TotalHours:    totalHours,
		Highlights:    summary.KeyPoints,
	}, nil
}

func (s *AIService) buildSessionSummaryPrompt(input *SessionSummaryInput) string {
	// Simplified prompt - in production would include activity details
	return fmt.Sprintf(`Generate a concise work session summary based on %d activities.
Provide:
1. A brief overview (1-2 sentences)
2. Main categories worked on
3. Key accomplishments

Respond in JSON format:
{
  "overview": "brief overview",
  "categories": ["category1", "category2"],
  "key_points": ["accomplishment1", "accomplishment2"]
}`, len(input.Activities))
}

func (s *AIService) buildDailySummaryPrompt(activities []ActivitySummary, totalHours float64) string {
	var activityList strings.Builder
	for _, a := range activities {
		activityList.WriteString(fmt.Sprintf("- %s [%s]: %s\n", a.Time, a.Category, a.Summary))
	}

	return fmt.Sprintf(`Analyze this day's work activities and synthesize a meaningful summary.

**Activity Log (%.1f hours, %d entries):**
%s

**Instructions:**
1. Group related activities by project/topic (infer from paths or context)
2. Identify what was actually accomplished, not just categories
3. Connect research → coding → debugging as unified tasks when related

**Output JSON:**
{
  "overview": "1-2 sentence summary of the day's work",
  "categories": ["top category 1", "top category 2"],
  "key_points": ["specific accomplishment 1", "specific accomplishment 2"]
}`, totalHours, len(activities), activityList.String())
}

func (s *AIService) generateTextSummary(ctx context.Context, apiKey string, prompt, model string) (*SessionSummary, error) {
	ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	reqBody := zaiRequest{
		Model: model,
		Messages: []zaiMessage{
			{
				Role:    "user",
				Content: []zaiContent{{Type: "text", Text: prompt}},
			},
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal error: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("request creation error: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("network error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var zaiResp zaiResponse
	if err := json.NewDecoder(resp.Body).Decode(&zaiResp); err != nil {
		return nil, fmt.Errorf("decode error: %w", err)
	}

	if len(zaiResp.Choices) == 0 {
		return nil, fmt.Errorf("no choices returned")
	}

	var summary SessionSummary
	if err := json.Unmarshal([]byte(zaiResp.Choices[0].Message.Content), &summary); err != nil {
		// If JSON parsing fails, return basic summary
		return &SessionSummary{
			Overview:   zaiResp.Choices[0].Message.Content,
			Categories: []string{},
			KeyPoints:  []string{},
		}, nil
	}

	return &summary, nil
}
