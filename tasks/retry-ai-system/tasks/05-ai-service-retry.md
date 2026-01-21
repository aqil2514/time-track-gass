# Task 05: Add Inline Retry with Model Cascade

## Meta
- **File**: `backend/internal/services/ai_service.go`
- **Action**: modify
- **Depends**: [01]
- **Priority**: P0
- **Phase**: 1

## Objective
Implement inline retry logic with model cascade (try FlashX first, then fall back to full model).

## CRITICAL NOTE: Mock Detection Instead of Error Checking

**Existing Behavior**: `AnalyzeScreenshot` NEVER returns error - it always returns `*ScreenshotAnalysis, nil`
- On error, it returns mock data: `AppName="Unknown"`, `WindowTitle="Unknown"`
- The error check in `ActivityService.Upload` line 25-28 is dead code

**Solution**: Detect "mock" responses to trigger retry:
```go
func isMockResult(analysis *ScreenshotAnalysis) bool {
    return analysis.AppName == "Unknown" ||
           strings.Contains(analysis.Summary, "AI analysis")
}
```

## Requirements
- Try primary model first, then fallback model
- Detect mock results (not errors) to trigger retry
- Exponential backoff between attempts
- Update to use config values for model selection
- Fix base URL path construction

## Acceptance Criteria
- [ ] Constructor updated to accept config params (keeping existing signature)
- [ ] `AnalyzeScreenshotWithRetry` method implemented
- [ ] Tries primary model, then fallback model
- [ ] Exponential backoff between attempts
- [ ] Returns mock result only if all attempts exhausted
- [ ] `isMockResult` helper to detect failed AI responses
- [ ] Base URL path fixed (remove duplicate /v1 paths)

## Implementation Notes

```go
// backend/internal/services/ai_service.go

package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type AIService struct {
	apiKey  string
	baseURL string
	client  *http.Client

	// Model names (new fields)
	visionModelPrimary   string
	visionModelFallback  string
	textModelFast        string
	textModelSmart       string

	// Retry config
	maxInlineRetries int
}

// KEEP EXISTING CONSTRUCTOR for backward compatibility
func NewAIService(apiKey, baseURL string) *AIService {
	return &AIService{
		apiKey:       apiKey,
		baseURL:      baseURL,
		visionModelPrimary:  "glm-4.6v-flashx",  // Defaults
		visionModelFallback: "glm-4.6v",
		maxInlineRetries:    2,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// NEW: Constructor with full config
func NewAIServiceWithConfig(apiKey, baseURL string, visionPrimary, visionFallback string, maxRetries int) *AIService {
	return &AIService{
		apiKey:               apiKey,
		baseURL:              baseURL,
		visionModelPrimary:   visionPrimary,
		visionModelFallback:  visionFallback,
		maxInlineRetries:     maxRetries,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// isMockResult detects if AI returned mock/fallback data
func isMockResult(analysis *ScreenshotAnalysis) bool {
	if analysis == nil {
		return true
	}
	// Check for mock indicators
	return analysis.AppName == "Unknown" ||
		analysis.WindowTitle == "Unknown" ||
		strings.Contains(analysis.Summary, "AI analysis") ||
		strings.Contains(analysis.Summary, "not configured")
}

// AnalyzeScreenshotWithRetry attempts analysis with model cascade
// Returns mock result only if all attempts fail
func (s *AIService) AnalyzeScreenshotWithRetry(ctx context.Context, imageBase64 string) (*ScreenshotAnalysis, error) {
	// If no API key, return mock immediately
	if s.apiKey == "" {
		return &ScreenshotAnalysis{
			AppName:     "Unknown",
			WindowTitle: "Unknown",
			Category:    "other",
			Summary:     "Screenshot captured (AI analysis not configured)",
		}, nil
	}

	// Try models in cascade
	models := []string{s.visionModelPrimary, s.visionModelFallback}
	var lastMock *ScreenshotAnalysis

	for _, model := range models {
		result := s.tryModelWithRetry(ctx, model, imageBase64)
		if !isMockResult(result) {
			return result, nil // Success!
		}
		lastMock = result // Save this mock result
		fmt.Printf("Model %s returned mock result, trying next model\n", model)
	}

	// All models failed, return last mock result
	fmt.Printf("All AI models failed after %d attempts per model\n", s.maxInlineRetries)
	return lastMock, nil
}

// tryModelWithRetry tries a single model with exponential backoff
func (s *AIService) tryModelWithRetry(ctx context.Context, model, imageBase64 string) *ScreenshotAnalysis {
	for attempt := 0; attempt < s.maxInlineRetries; attempt++ {
		result := s.analyzeScreenshotWithModel(ctx, model, imageBase64)
		if !isMockResult(result) {
			return result // Success
		}

		// Backoff before retry
		if attempt < s.maxInlineRetries-1 {
			delay := time.Duration(1<<uint(attempt)) * 500 * time.Millisecond
			fmt.Printf("Attempt %d for model %s failed, retrying in %v\n", attempt+1, model, delay)
			select {
			case <-time.After(delay):
				continue
			case <-ctx.Done():
				return result
			}
		}
	}

	return nil // All retries exhausted
}

// analyzeScreenshotWithModel performs a single analysis attempt
// MODIFIED from existing AnalyzeScreenshot to accept model parameter
func (s *AIService) analyzeScreenshotWithModel(ctx context.Context, model, imageBase64 string) *ScreenshotAnalysis {
	prompt := `Analyze this screenshot and extract the following information in JSON format:
{
  "app_name": "the application name visible (e.g., VS Code, Chrome, Slack)",
  "window_title": "the window title or tab name",
  "category": "one of: coding, meeting, browsing, communication, design, other",
  "summary": "brief 1-sentence description of what the user is doing"
}

Only respond with valid JSON, no other text.`

	reqBody := zaiRequest{
		Model:    model, // Use parameter instead of hardcoded "glm-4.6v"
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
		fmt.Printf("AI Service Error (Marshal): %v\n", err)
		return &ScreenshotAnalysis{
			AppName:     "Unknown",
			WindowTitle: "Unknown",
			Category:    "other",
			Summary:     "Screenshot captured (AI analysis failed)",
		}
	}

	// Fix base URL path handling
	// If baseURL already ends with /chat/completions, use it directly
	// Otherwise append /chat/completions
	apiURL := s.baseURL
	if !strings.HasSuffix(apiURL, "/chat/completions") {
		apiURL = strings.TrimSuffix(apiURL, "/") + "/chat/completions"
	}

	req, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewReader(body))
	if err != nil {
		fmt.Printf("AI Service Error (Request creation): %v\n", err)
		return &ScreenshotAnalysis{
			AppName:     "Unknown",
			WindowTitle: "Unknown",
			Category:    "other",
			Summary:     "Screenshot captured (AI analysis failed)",
		}
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		fmt.Printf("AI Service Error (Network): %v\n", err)
		return &ScreenshotAnalysis{
			AppName:     "Unknown",
			WindowTitle: "Unknown",
			Category:    "other",
			Summary:     "Screenshot captured (AI analysis failed)",
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		fmt.Printf("AI Service Error (Status %d): %s\n", resp.StatusCode, string(respBody))
		return &ScreenshotAnalysis{
			AppName:     "Unknown",
			WindowTitle: "Unknown",
			Category:    "other",
			Summary:     "Screenshot captured (AI analysis failed)",
		}
	}

	var zaiResp zaiResponse
	if err := json.NewDecoder(resp.Body).Decode(&zaiResp); err != nil {
		fmt.Printf("AI Service Error (Decode): %v\n", err)
		return &ScreenshotAnalysis{
			AppName:     "Unknown",
			WindowTitle: "Unknown",
			Category:    "other",
			Summary:     "Screenshot captured (AI analysis failed)",
		}
	}

	if len(zaiResp.Choices) == 0 {
		fmt.Printf("AI Service Error: No choices returned\n")
		return &ScreenshotAnalysis{
			AppName:     "Unknown",
			WindowTitle: "Unknown",
			Category:    "other",
			Summary:     "Screenshot captured (AI analysis failed)",
		}
	}

	var analysis ScreenshotAnalysis
	if err := json.Unmarshal([]byte(zaiResp.Choices[0].Message.Content), &analysis); err != nil {
		fmt.Printf("AI Service Error (JSON Unmarshal): %v\nContent: %s\n", err, zaiResp.Choices[0].Message.Content)
		return &ScreenshotAnalysis{
			AppName:     "Unknown",
			WindowTitle: "Unknown",
			Category:    "other",
			Summary:     zaiResp.Choices[0].Message.Content,
		}
	}

	return &analysis
}

// KEEP EXISTING AnalyzeScreenshot for backward compatibility
// It now uses the default model
func (s *AIService) AnalyzeScreenshot(ctx context.Context, imageBase64 string) (*ScreenshotAnalysis, error) {
	if s.apiKey == "" {
		return &ScreenshotAnalysis{
			AppName:     "Unknown",
			WindowTitle: "Unknown",
			Category:    "other",
			Summary:     "Screenshot captured (AI analysis not configured)",
		}, nil
	}

	return s.analyzeScreenshotWithModel(ctx, s.visionModelPrimary, imageBase64), nil
}
```

## Key Changes from Existing Code

1. **Added fields** to `AIService` for model names and retry config
2. **New constructor** `NewAIServiceWithConfig` while keeping `NewAIService`
3. **`isMockResult` helper** to detect failed AI responses
4. **`AnalyzeScreenshotWithRetry`** method that tries multiple models
5. **Base URL fix** to handle both `/v1` and `/api/paas/v4/` patterns
6. **Existing `AnalyzeScreenshot`** kept for backward compatibility

## Import Changes

Add `strings` to imports:
```go
import (
    "strings"  // Add this
    // ... other imports
)
```

## Error Handling

| Condition | Action | Note |
|-----------|--------|------|
| Empty API key | Return mock immediately | No retry |
| Mock result from primary | Retry with fallback | With backoff |
| Mock result from fallback | Return mock | All attempts exhausted |
| Network error | Return mock | Triggers retry in caller |
| HTTP 4xx error | Return mock | Don't retry (API issue) |
| HTTP 5xx error | Return mock | Triggers retry in caller |
