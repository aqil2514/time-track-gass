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

	// Create core services first
	authService := services.NewAuthService(db)
	organizationService := services.NewOrganizationService(db, cfg)

	// Set dependencies
	authService.SetOrganizationService(organizationService)

	aiService := services.NewAIService(cfg)
	// RetryQueue and WorkerPool removed as per plan (Phase 4)
	// retryQueue := services.NewRetryQueueService(db, aiService, cfg.ZAIMaxQueueRetries)
	activityService := services.NewActivityService(db, aiService)
	shareService := services.NewShareService(db, authService)
	linkService := services.NewShareLinkService(db)
	notificationService := services.NewNotificationService(db)
	dailySummaryService := services.NewDailySummaryService(db, aiService, organizationService, cfg)

	// Wire up circular dependencies
	// activityService.SetRetryQueue(retryQueue)
	// retryQueue.SetActivityService(activityService)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	organizationHandler := handlers.NewOrganizationHandler(organizationService)
	activityHandler := handlers.NewActivityHandler(activityService)
	shareHandler := handlers.NewShareHandler(shareService, activityService)
	linkHandler := handlers.NewShareLinkHandler(linkService, activityService)
	notificationHandler := handlers.NewNotificationHandler(notificationService)
	// var healthHandler *handlers.HealthHandler
	// if workerPool != nil {
	// 	healthHandler = handlers.NewHealthHandler(workerPool)
	// }

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
	// if healthHandler != nil {
	// 	r.GET("/health/detailed", healthHandler.DetailedHealth)
	// }

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
			protected.PATCH("/auth/password", authHandler.UpdatePassword)

			// Organization
			protected.GET("/org", organizationHandler.GetOrganization)
			protected.PATCH("/org/settings", organizationHandler.UpdateSettings)
			protected.PUT("/org/settings/api-key", organizationHandler.SetAPIKey)
			protected.DELETE("/org/settings/api-key", organizationHandler.RemoveAPIKey)
			protected.GET("/org/api-key", organizationHandler.GetDecryptedAPIKey) // For desktop app

			protected.POST("/org/members", organizationHandler.AddMember)
			protected.GET("/org/members", organizationHandler.ListMembers)
			protected.PATCH("/org/members/:id", organizationHandler.UpdateMember)
			protected.DELETE("/org/members/:id", organizationHandler.RemoveMember)

			// Organization Reporting (Owner/Admin only)
			protected.GET("/org/stats", organizationHandler.GetOrganizationStats)
			protected.GET("/org/members/summary", organizationHandler.GetMembersSummary)
			protected.GET("/org/members/:id/activities", organizationHandler.GetMemberActivities)
			protected.GET("/org/members/:id/stats", organizationHandler.GetMemberStats)
			protected.GET("/org/activity-heatmap", organizationHandler.GetActivityHeatmap)

			// Activity
			protected.POST("/activity/upload", activityHandler.Upload)
			protected.PATCH("/activity/:id", activityHandler.Update)
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

			// Notifications (org-scoped as per design)
			protected.POST("/org/notifications", notificationHandler.CreateNotification)
			protected.GET("/org/notifications", notificationHandler.ListNotifications)
			protected.PATCH("/org/notifications/:id", notificationHandler.MarkAsRead)
		}
	}

	// Create context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start daily summary scheduler
	go dailySummaryService.StartDailySummaryScheduler(ctx)

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
	cancel() // Cancel context to stop daily summary scheduler
	// Give scheduler time to stop gracefully
	time.Sleep(1 * time.Second)

	log.Println("Shutdown complete")
}
