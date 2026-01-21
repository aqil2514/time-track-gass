# Task 10: Start Retry Queue Workers

## Meta
- **File**: `backend/cmd/api/main.go`
- **Action**: modify
- **Depends**: [08]
- **Priority**: P0
- **Phase**: 2

## Objective
Initialize and start retry queue workers when server starts.

## Existing Code Pattern Analysis

**Current initialization (lines 34-40)**:
```go
db := database.GetPool()
authService := services.NewAuthService(db)
aiService := services.NewAIService(cfg.ZAIAPIKey, cfg.ZAIBaseURL)
activityService := services.NewActivityService(db, aiService)
shareService := services.NewShareService(db, authService)
linkService := services.NewShareLinkService(db)
```

## Requirements
- Initialize AI service with new config (using NewAIServiceWithConfig)
- Initialize RetryQueue service
- Start background workers
- Wire up dependencies (set retry queue on activity service)
- Graceful shutdown on server exit

## Acceptance Criteria
- [ ] AI service initialized with NewAIServiceWithConfig (or kept as-is with defaults)
- [ ] RetryQueue initialized
- [ ] Workers started on server startup
- [ ] Graceful shutdown implemented
- [ ] Worker count configurable via env var

## Implementation Notes

```go
// backend/cmd/api/main.go

package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/timetrack/backend/internal/config"
	"github.com/timetrack/backend/internal/database"
	"github.com/timetrack/backend/internal/handlers"
	"github.com/timetrack/backend/internal/middleware"
	"github.com/timetrack/backend/internal/services"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load config
	cfg := config.Load()

	// Connect to database
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	db := database.GetPool()

	// Initialize services
	authService := services.NewAuthService(db)

	// CHANGED: Initialize AI service with config
	// Option 1: Use new constructor with config values
	aiService := services.NewAIServiceWithConfig(
		cfg.ZAIAPIKey,
		cfg.ZAIBaseURL,
		cfg.ZAIVisionModelPrimary,
		cfg.ZAIVisionModelFallback,
		cfg.ZAIMaxInlineRetries,
	)

	// Option 2: Keep existing constructor (uses defaults)
	// aiService := services.NewAIService(cfg.ZAIAPIKey, cfg.ZAIBaseURL)

	activityService := services.NewActivityService(db, aiService)
	shareService := services.NewShareService(db, authService)
	linkService := services.NewShareLinkService(db)

	// NEW: Initialize retry queue
	retryWorkerCount := getEnvInt("RETRY_QUEUE_WORKERS", 3)
	retryQueue := services.NewRetryQueue(db, aiService, retryWorkerCount)
	retryHandler := services.NewRetryHandler(db, aiService, activityService)
	retryQueue.SetHandler(retryHandler)

	// NEW: Wire retry queue to activity service
	activityService.SetRetryQueue(retryQueue)

	// NEW: Start retry queue workers
	retryQueue.Start()
	defer retryQueue.Stop()
	log.Printf("Started %d retry queue workers", retryWorkerCount)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	activityHandler := handlers.NewActivityHandler(activityService)
	shareHandler := handlers.NewShareHandler(shareService, activityService)
	linkHandler := handlers.NewShareLinkHandler(linkService, activityService)

	// NEW: Health handler (optional, for monitoring)
	// healthHandler := handlers.NewHealthHandler(db, retryQueue, aiService)

	// Setup Gin
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.DebugMode)
	}
	r := gin.Default()

	// CORS middleware - configure allowed origins from environment
	allowedOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		// Default to localhost for development
		allowedOrigins = "http://localhost:3000,http://localhost:5173,http://localhost:1420"
	}
	originList := strings.Split(allowedOrigins, ",")
	r.Use(func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		// Check if origin is in allowed list
		allowed := false
		for _, allowedOrigin := range originList {
			if origin == strings.TrimSpace(allowedOrigin) {
				allowed = true
				break
			}
		}
		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
		} else if origin != "" {
			// Reject requests from non-allowed origins
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "FORBIDDEN",
					"message": "Origin not allowed",
				},
			})
			return
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		// Public Shared Links
		v1.GET("/s/:slug", linkHandler.GetPublicStats)

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(authService))
		{
			// Auth
			protected.POST("/auth/logout", authHandler.Logout)
			protected.GET("/auth/me", authHandler.Me)

			// Activity
			protected.POST("/activity/upload", activityHandler.Upload)
			protected.GET("/activity", activityHandler.List)
			protected.GET("/activity/stats", activityHandler.Stats)

			// Sharing
			protected.POST("/share", shareHandler.Create)
			protected.GET("/share/viewers", shareHandler.GetViewers)
			protected.GET("/share/watching", shareHandler.GetWatching)
			protected.DELETE("/share/:id", shareHandler.Delete)

			// Share Links
			protected.POST("/share/link", linkHandler.Create)
			protected.GET("/share/link", linkHandler.List)
			protected.DELETE("/share/link/:id", linkHandler.Delete)

			// Supervisor
			protected.GET("/supervise/:user_id/activity", shareHandler.GetUserActivity)
			protected.GET("/supervise/:user_id/stats", shareHandler.GetUserStats)
		}
	}

	// NEW: Add detailed health endpoint with queue metrics
	// r.GET("/health/detailed", healthHandler.Health)

	// Start server with graceful shutdown
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	// Run server in goroutine
	go func() {
		log.Printf("Server starting on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Stop retry queue workers first
	retryQueue.Stop()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

// getEnvInt reads an integer environment variable
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}
```

## Key Changes from Existing Code

| Line | Change |
|------|--------|
| 37 | Changed to `NewAIServiceWithConfig` (or keep existing with defaults) |
| NEW | Added `retryQueue` initialization |
| NEW | Added `retryHandler` initialization |
| NEW | Added `activityService.SetRetryQueue(retryQueue)` |
| NEW | Added `retryQueue.Start()` and `defer retryQueue.Stop()` |
| NEW | Added graceful shutdown for retry queue |
| NEW | Added `getEnvInt` helper (or use existing from config) |

## Environment Variables

```bash
# New variables
RETRY_QUEUE_WORKERS=3     # Number of background workers (default: 3)
```

## Shutdown Flow

```
SIGTERM/SIGINT received
    ↓
Stop accepting new connections
    ↓
Stop retry queue workers
    ↓
Wait for in-flight requests (10s timeout)
    ↓
Close database connection
    ↓
Exit
```

## Import Changes

No new imports needed - all packages are already imported.

## Note on Backward Compatibility

The changes are backward compatible:
- If `NewAIServiceWithConfig` doesn't exist, can use `NewAIService` (uses defaults)
- Retry queue is optional - if not configured, uploads still work (just don't retry)
- Workers can be disabled by setting `RETRY_QUEUE_WORKERS=0`
