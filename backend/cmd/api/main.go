// backend/cmd/api/main.go
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
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

	// Initialize services
	db := database.GetPool()
	authService := services.NewAuthService(db)
	aiService := services.NewAIService(cfg)
	retryQueue := services.NewRetryQueueService(db, aiService, cfg.ZAIMaxQueueRetries)
	activityService := services.NewActivityService(db, aiService)
	shareService := services.NewShareService(db, authService)
	linkService := services.NewShareLinkService(db)

	// Wire up circular dependencies
	activityService.SetRetryQueue(retryQueue)
	retryQueue.SetActivityService(activityService)

	// Initialize worker pool
	var workerPool *services.WorkerPool
	if cfg.RetryQueueWorkers > 0 {
		workerPool = services.NewWorkerPool(retryQueue, cfg.RetryQueueWorkers, cfg.RetryQueueInterval)
	}

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	activityHandler := handlers.NewActivityHandler(activityService)
	shareHandler := handlers.NewShareHandler(shareService, activityService)
	linkHandler := handlers.NewShareLinkHandler(linkService, activityService)
	var healthHandler *handlers.HealthHandler
	if workerPool != nil {
		healthHandler = handlers.NewHealthHandler(workerPool)
	}

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
			// Reject requests from non-allowed origins (except for same-origin requests without Origin header)
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
	if healthHandler != nil {
		r.GET("/health/detailed", healthHandler.DetailedHealth)
	}

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

	// Create context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start worker pool if configured
	var cleanupDone, recoveryDone chan struct{}
	if workerPool != nil {
		workerPool.Start(ctx)

		// Start cleanup job (runs every hour)
		cleanupDone = services.StartCleanupJob(ctx, retryQueue, 1*time.Hour)

		// Start recovery job (runs every 5 minutes, recovers tasks stuck for >10 minutes)
		recoveryDone = services.StartRecoveryJob(ctx, retryQueue, 5*time.Minute, 10*time.Minute)
	}

	// Start server in goroutine
	serverErr := make(chan error, 1)
	go func() {
		log.Printf("Server starting on port %s", cfg.Port)
		if err := r.Run(":" + cfg.Port); err != nil && err != http.ErrServerClosed {
			serverErr <- err
		}
	}()

	// Wait for shutdown signal or server error
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	select {
	case <-sigCh:
		log.Println("Shutdown signal received")
	case err := <-serverErr:
		log.Fatalf("Server error: %v", err)
	}

	// Graceful shutdown
	log.Println("Shutting down gracefully...")
	cancel() // Cancel context to stop workers

	// Shutdown worker pool with timeout
	if workerPool != nil {
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer shutdownCancel()

		if err := workerPool.Shutdown(shutdownCtx); err != nil {
			log.Printf("Worker pool shutdown error: %v", err)
		}

		// Wait for cleanup and recovery jobs to finish
		if cleanupDone != nil {
			log.Println("Waiting for cleanup job to finish...")
			<-cleanupDone
		}
		if recoveryDone != nil {
			log.Println("Waiting for recovery job to finish...")
			<-recoveryDone
		}
	}

	log.Println("Shutdown complete")
}
