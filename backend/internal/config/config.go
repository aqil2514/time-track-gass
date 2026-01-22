// backend/internal/config/config.go
package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string
	ZAIAPIKey   string
	ZAIBaseURL  string

	// Vision models (screenshot analysis)
	ZAIVisionModelPrimary  string
	ZAIVisionModelFallback string

	// Text models (summaries)
	ZAITextModelFast  string
	ZAITextModelSmart string

	// Retry settings
	ZAIMaxInlineRetries int
	ZAIMaxQueueRetries  int

	// Queue workers
	RetryQueueWorkers  int
	RetryQueueInterval time.Duration

	// Feature flags
	EnableSessions     bool
	EnableDailySummary bool
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://timetrack:timetrack123@localhost:5432/timetrack?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		ZAIAPIKey:   getEnv("ZAI_API_KEY", ""),
		ZAIBaseURL:  getEnv("ZAI_BASE_URL", "https://open.bigmodel.cn/api/coding/paas/v4/"),

		// Vision models
		ZAIVisionModelPrimary:  getEnv("ZAI_VISION_MODEL_PRIMARY", "glm-4.6v"),
		ZAIVisionModelFallback: getEnv("ZAI_VISION_MODEL_FALLBACK", "glm-4.6v"),

		// Text models
		ZAITextModelFast:  getEnv("ZAI_TEXT_MODEL_FAST", "glm-4.7-flashx"),
		ZAITextModelSmart: getEnv("ZAI_TEXT_MODEL_SMART", "glm-4.7"),

		// Retry settings
		ZAIMaxInlineRetries: getEnvInt("ZAI_MAX_INLINE_RETRIES", 2),
		ZAIMaxQueueRetries:  getEnvInt("ZAI_MAX_QUEUE_RETRIES", 5),

		// Queue workers
		RetryQueueWorkers:  getEnvInt("RETRY_QUEUE_WORKERS", 3),
		RetryQueueInterval: getEnvDuration("RETRY_QUEUE_INTERVAL", 10*time.Second),

		// Feature flags
		EnableSessions:     getEnvBool("ENABLE_SESSIONS", true),
		EnableDailySummary: getEnvBool("ENABLE_DAILY_SUMMARY", true),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return strings.TrimSpace(value)
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolVal, err := strconv.ParseBool(value); err == nil {
			return boolVal
		}
	}
	return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}
