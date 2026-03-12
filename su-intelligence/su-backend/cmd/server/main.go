package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"su-intelligence/internal/auth"
	"su-intelligence/internal/config"
	"su-intelligence/internal/handlers"
	"su-intelligence/internal/middleware"
	"su-intelligence/internal/models"
)

func main() {
	cfg := config.Load()

	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// ── Services ───────────────────────────────────────────────────────
	userStore := auth.NewUserStore()
	jwtSvc    := auth.NewJWTService(cfg.JWTSecret, cfg.JWTExpiry)

	// ── Handlers ───────────────────────────────────────────────────────
	authH      := handlers.NewAuthHandler(userStore, jwtSvc)
	usersH     := handlers.NewUsersHandler(userStore)
	aiH        := handlers.NewAIHandler()
	marketH    := handlers.NewMarketHandler()
	dashboardH := handlers.NewDashboardHandler()

	// ── Router ─────────────────────────────────────────────────────────
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())

	// CORS — allow the Vite dev server
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "env": cfg.Env})
	})

	v1 := r.Group("/api/v1")
	{
		// ── Public ──────────────────────────────────────────────────
		authGroup := v1.Group("/auth")
		{
			authGroup.POST("/login", authH.Login)
		}

		// ── Protected (any authenticated user) ──────────────────────
		protected := v1.Group("")
		protected.Use(middleware.JWTAuth(jwtSvc))
		{
			// Auth
			protected.POST("/auth/logout",          authH.Logout)
			protected.GET ("/auth/me",               authH.Me)
			protected.POST("/auth/refresh",          authH.Refresh)
			protected.POST("/auth/change-password",  authH.ChangePassword)

			// Dashboard
			protected.GET("/dashboard/stats",    dashboardH.Stats)
			protected.GET("/dashboard/activity", dashboardH.Activity)

			// AI
			protected.GET ("/ai/models",         aiH.ListModels)
			protected.GET ("/ai/models/:id",     aiH.GetModel)
			protected.GET ("/ai/stats",          aiH.Stats)
			protected.POST("/ai/chat",           aiH.Chat)
			protected.GET ("/ai/sessions",       aiH.ListSessions)
			protected.GET ("/ai/sessions/:id",   aiH.GetSession)
			protected.DELETE("/ai/sessions/:id", aiH.DeleteSession)

			// Market
			protected.GET("/market/assets",                marketH.ListAssets)
			protected.GET("/market/assets/:symbol",        marketH.GetAsset)
			protected.GET("/market/assets/:symbol/chart",  marketH.GetChart)
			protected.GET("/market/summary",               marketH.Summary)

			// Users (admin only)
			adminOnly := protected.Group("/users")
			adminOnly.Use(middleware.RequireRole(models.RoleAdmin))
			{
				adminOnly.GET("",    usersH.List)
				adminOnly.GET("/:id", usersH.Get)
			}
		}
	}

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("🚀  SU Intelligence API  →  http://localhost%s  [%s]\n", addr, cfg.Env)
	if err := r.Run(addr); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
