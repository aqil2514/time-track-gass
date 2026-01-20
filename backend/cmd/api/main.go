// backend/cmd/api/main.go
package main

import (
	"log"
	"net/http"
	"os"
	"strings"

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
	aiService := services.NewAIService(cfg.ZAIAPIKey, cfg.ZAIBaseURL)
	activityService := services.NewActivityService(db, aiService)
	shareService := services.NewShareService(db, authService)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	activityHandler := handlers.NewActivityHandler(activityService)
	shareHandler := handlers.NewShareHandler(shareService, activityService)

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

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

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

			// Supervisor
			protected.GET("/supervise/:user_id/activity", shareHandler.GetUserActivity)
			protected.GET("/supervise/:user_id/stats", shareHandler.GetUserStats)
		}
	}

	// Start server
	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
