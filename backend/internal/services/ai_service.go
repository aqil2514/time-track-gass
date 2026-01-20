// backend/internal/services/ai_service.go
package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type AIService struct {
	apiKey  string
	baseURL string
	client  *http.Client
}

type ScreenshotAnalysis struct {
	AppName     string `json:"app_name"`
	WindowTitle string `json:"window_title"`
	Category    string `json:"category"`
	Summary     string `json:"summary"`
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

func NewAIService(apiKey, baseURL string) *AIService {
	return &AIService{
		apiKey:  apiKey,
		baseURL: baseURL,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (s *AIService) AnalyzeScreenshot(ctx context.Context, imageBase64 string) (*ScreenshotAnalysis, error) {
	// If no API key, return mock analysis
	if s.apiKey == "" {
		return &ScreenshotAnalysis{
			AppName:     "Unknown",
			WindowTitle: "Unknown",
			Category:    "other",
			Summary:     "Screenshot captured (AI analysis not configured)",
		}, nil
	}

	prompt := `Analyze this screenshot and extract the following information in JSON format:
{
  "app_name": "the application name visible (e.g., VS Code, Chrome, Slack)",
  "window_title": "the window title or tab name",
  "category": "one of: coding, meeting, browsing, communication, design, other",
  "summary": "brief 1-sentence description of what the user is doing"
}

Only respond with valid JSON, no other text.`

	reqBody := zaiRequest{
		Model: "glm-4.6v",
		Messages: []zaiMessage{
			{
				Role: "user",
				Content: []zaiContent{
					{Type: "text", Text: prompt},
					{Type: "image_url", ImageURL: &imageURL{URL: "data:image/png;base64," + imageBase64}},
				},
			},
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var zaiResp zaiResponse
	if err := json.NewDecoder(resp.Body).Decode(&zaiResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(zaiResp.Choices) == 0 {
		return nil, fmt.Errorf("no response from AI")
	}

	var analysis ScreenshotAnalysis
	if err := json.Unmarshal([]byte(zaiResp.Choices[0].Message.Content), &analysis); err != nil {
		// If JSON parsing fails, try to extract some info
		return &ScreenshotAnalysis{
			AppName:     "Unknown",
			WindowTitle: "Unknown",
			Category:    "other",
			Summary:     zaiResp.Choices[0].Message.Content,
		}, nil
	}

	return &analysis, nil
}
