// backend/internal/services/ai_service.go
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
	apiKey           string
	baseURL          string
	client           *http.Client
	visionPrimary    string
	visionFallback   string
	textFast         string
	textSmart        string
	maxInlineRetries int
}

type ScreenshotAnalysis struct {
	AppName     string `json:"app_name"`
	WindowTitle string `json:"window_title"`
	Category    string `json:"category"`
	Summary     string `json:"summary"`
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
	Type     string    `json:"type"`
	Text     string    `json:"text,omitempty"`
	ImageURL *imageURL `json:"image_url,omitempty"`
}

type imageURL struct {
	URL string `json:"url"`
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
		apiKey:  cfg.ZAIAPIKey,
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
		visionPrimary:    cfg.ZAIVisionModelPrimary,
		visionFallback:   cfg.ZAIVisionModelFallback,
		textFast:         cfg.ZAITextModelFast,
		textSmart:        cfg.ZAITextModelSmart,
		maxInlineRetries: cfg.ZAIMaxInlineRetries,
	}
}

// AnalyzeScreenshotWithRetry attempts screenshot analysis with model cascade
// Tries primary model (FlashX) first, then falls back to full model
// Returns error only if both models fail, allowing caller to implement retry logic
func (s *AIService) AnalyzeScreenshotWithRetry(ctx context.Context, imageBase64 string) (*ScreenshotAnalysis, error) {
	// If key is empty, return mock immediately with no error
	// This allows the system to function without AI API
	if s.apiKey == "" {
		return &ScreenshotAnalysis{
			AppName:     "Unknown",
			WindowTitle: "Unknown",
			Category:    "other",
			Summary:     "Screenshot captured (AI analysis not configured)",
		}, nil
	}

	var lastErr error

	// Try primary model first (FlashX - faster and cheaper)
	analysis, err := s.analyzeScreenshotWithModel(ctx, imageBase64, s.visionPrimary, 30*time.Second)
	if err == nil {
		return analysis, nil
	}
	lastErr = err

	// Primary failed, try fallback model (full model)
	analysis, err = s.analyzeScreenshotWithModel(ctx, imageBase64, s.visionFallback, 60*time.Second)
	if err == nil {
		return analysis, nil
	}

	// Both failed - return error to trigger retry queue
	// The caller should enqueue for background retry
	return nil, fmt.Errorf("both AI models failed: primary (%s): %w, fallback (%s): %w",
		s.visionPrimary, lastErr, s.visionFallback, err)
}

// analyzeScreenshotWithModel performs analysis with specific model and timeout
func (s *AIService) analyzeScreenshotWithModel(ctx context.Context, imageBase64, model string, timeout time.Duration) (*ScreenshotAnalysis, error) {
	// Create context with timeout
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	fmt.Printf("[DEBUG] Analyzing screenshot with model: '%s' (timeout: %s)\n", model, timeout)
	if len(s.apiKey) > 5 {
		fmt.Printf("[DEBUG] API Key (truncated): %s...\n", s.apiKey[:5])
	}

	// Simple prompt for debugging to match Python script
	prompt := "Analyze this screenshot and identify the app name, window title, category (coding, meeting, browsing, communication, design, other), and a brief summary. Respond in JSON."

	reqBody := zaiRequest{
		Model: model,
		Messages: []zaiMessage{
			{
				Role: "user",
				Content: []zaiContent{
					{Type: "image_url", ImageURL: &imageURL{URL: s.ensureDataURI(imageBase64)}},
					{Type: "text", Text: prompt},
				},
			},
		},
	}

	var body bytes.Buffer
	enc := json.NewEncoder(&body)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(reqBody); err != nil {
		return nil, fmt.Errorf("marshal error: %w", err)
	}

	// Debug log
	bodyBytes := body.Bytes()
	if len(bodyBytes) > 1000 {
		fmt.Printf("[DEBUG] Request Body (truncated): %s...}\n", string(bodyBytes[:500]))
	} else {
		fmt.Printf("[DEBUG] Request Body: %s\n", string(bodyBytes))
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.baseURL+"/chat/completions", &body)
	if err != nil {
		return nil, fmt.Errorf("request creation error: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("network error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		// Truncate request body for error message
		reqBodyStr := body.String()
		if len(reqBodyStr) > 200 {
			reqBodyStr = reqBodyStr[:200] + "..."
		}
		return nil, fmt.Errorf("API error (status %d) for model '%s': %s. Request: %s", resp.StatusCode, model, string(respBody), reqBodyStr)
	}

	var zaiResp zaiResponse
	if err := json.NewDecoder(resp.Body).Decode(&zaiResp); err != nil {
		return nil, fmt.Errorf("decode error: %w", err)
	}

	if len(zaiResp.Choices) == 0 {
		return nil, fmt.Errorf("no choices returned")
	}

	var analysis ScreenshotAnalysis
	if err := json.Unmarshal([]byte(zaiResp.Choices[0].Message.Content), &analysis); err != nil {
		// If JSON parsing fails, return raw content as summary
		return &ScreenshotAnalysis{
			AppName:     "Unknown",
			WindowTitle: "Unknown",
			Category:    "other",
			Summary:     zaiResp.Choices[0].Message.Content,
		}, nil
	}

	return &analysis, nil
}

// GenerateSessionSummary generates a summary for a work session
func (s *AIService) GenerateSessionSummary(ctx context.Context, input *SessionSummaryInput) (*SessionSummary, error) {
	if s.apiKey == "" {
		return &SessionSummary{
			Overview:   "Session summary not available (AI not configured)",
			Categories: []string{},
			KeyPoints:  []string{},
		}, nil
	}

	// Build prompt from activities
	prompt := s.buildSessionSummaryPrompt(input)

	summary, err := s.generateTextSummary(ctx, prompt, s.textFast)
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
func (s *AIService) GenerateDailySummary(ctx context.Context, activities []ActivitySummary, totalHours float64) (*DailySummary, error) {
	if s.apiKey == "" {
		return &DailySummary{
			Overview:      "Daily summary not available (AI not configured)",
			TopCategories: []string{},
			TotalHours:    totalHours,
			Highlights:    []string{},
		}, nil
	}

	prompt := s.buildDailySummaryPrompt(activities, totalHours)

	summary, err := s.generateTextSummary(ctx, prompt, s.textSmart)
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
	return fmt.Sprintf(`Generate a daily work summary for %.1f hours of activity across %d activities.
Provide:
1. A brief overview of the day
2. Top categories worked on
3. Key highlights

Respond in JSON format:
{
  "overview": "brief overview",
  "categories": ["category1", "category2"],
  "key_points": ["highlight1", "highlight2"]
}`, totalHours, len(activities))
}

func (s *AIService) generateTextSummary(ctx context.Context, prompt, model string) (*SessionSummary, error) {
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
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

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

func (s *AIService) ensureDataURI(data string) string {
	if strings.HasPrefix(data, "data:image/") {
		return data
	}
	return "data:image/png;base64," + data
}
