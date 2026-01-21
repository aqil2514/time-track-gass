# Task 01: Add AI Model Configuration

## Meta
- **File**: `backend/internal/config/config.go`
- **Action**: modify
- **Depends**: []
- **Priority**: P0
- **Phase**: 1

## Objective
Add configuration options for multiple AI models (vision and text) with fallback support.

## Requirements
- Add vision model configuration (primary and fallback)
- Add text model configuration (fast and smart)
- Add retry configuration options
- Fix base URL to correct Z.ai endpoint
- Maintain backward compatibility

## Acceptance Criteria
- [ ] `ZAI_VISION_MODEL_PRIMARY` env var (default: "glm-4.6v-flashx")
- [ ] `ZAI_VISION_MODEL_FALLBACK` env var (default: "glm-4.6v")
- [ ] `ZAI_TEXT_MODEL_FAST` env var (default: "glm-4.7-flashx")
- [ ] `ZAI_TEXT_MODEL_SMART` env var (default: "glm-4.7")
- [ ] `ZAI_MAX_INLINE_RETRIES` env var (default: 2)
- [ ] `ZAI_MAX_QUEUE_RETRIES` env var (default: 5)
- [ ] Base URL defaults to "https://api.z.ai/api/paas/v4/"
- [ ] All new fields added to Config struct
- [ ] Backward compatible (existing configs still work)

## Implementation Notes

```go
// backend/internal/config/config.go

type Config struct {
    Port        string
    DatabaseURL string
    JWTSecret   string
    ZAIAPIKey   string
    ZAIBaseURL  string

    // New fields
    ZAIVisionModelPrimary   string
    ZAIVisionModelFallback  string
    ZAITextModelFast        string
    ZAITextModelSmart       string
    ZAIMaxInlineRetries     int
    ZAIMaxQueueRetries      int
}

func Load() *Config {
    return &Config{
        Port:                    getEnv("PORT", "8080"),
        DatabaseURL:             getEnv("DATABASE_URL", "postgres://timetrack:timetrack123@localhost:5432/timetrack?sslmode=disable"),
        JWTSecret:               getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
        ZAIAPIKey:               getEnv("ZAI_API_KEY", ""),
        ZAIBaseURL:              getEnv("ZAI_BASE_URL", "https://api.z.ai/api/paas/v4/"), // FIXED from /v1
        ZAIVisionModelPrimary:   getEnv("ZAI_VISION_MODEL_PRIMARY", "glm-4.6v-flashx"),
        ZAIVisionModelFallback:  getEnv("ZAI_VISION_MODEL_FALLBACK", "glm-4.6v"),
        ZAITextModelFast:        getEnv("ZAI_TEXT_MODEL_FAST", "glm-4.7-flashx"),
        ZAITextModelSmart:       getEnv("ZAI_TEXT_MODEL_SMART", "glm-4.7"),
        ZAIMaxInlineRetries:     getEnvInt("ZAI_MAX_INLINE_RETRIES", 2),
        ZAIMaxQueueRetries:      getEnvInt("ZAI_MAX_QUEUE_RETRIES", 5),
    }
}

// Note: getEnvInt already exists in config.go (line 34-40), no need to add
```
