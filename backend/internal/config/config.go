// backend/internal/config/config.go
// [TimeTrack Backend Configuration]
// Screenshot analysis is now client-side, so vision model configs removed from backend.
package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string

	// AI Base URL (for server-side summary generation)
	ZAIBaseURL string

	// Text models (for summaries - server-side)
	ZAITextModelFast  string
	ZAITextModelSmart string

	// Feature flags
	EnableSessions     bool
	EnableDailySummary bool

	// Security
	EncryptionKey string
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://timetrack:timetrack123@localhost:5432/timetrack?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		ZAIBaseURL:  getEnv("ZAI_BASE_URL", "https://open.bigmodel.cn/api/paas/v4"),

		// Text models for summary generation (server-side)
		ZAITextModelFast:  getEnv("ZAI_TEXT_MODEL_FAST", "glm-4-flashx"),
		ZAITextModelSmart: getEnv("ZAI_TEXT_MODEL_SMART", "glm-4"),

		// Feature flags
		EnableSessions:     getEnvBool("ENABLE_SESSIONS", true),
		EnableDailySummary: getEnvBool("ENABLE_DAILY_SUMMARY", true),

		// Security
		EncryptionKey: getEnv("ENCRYPTION_KEY", "your-32-byte-hex-key-here-123456"),
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
