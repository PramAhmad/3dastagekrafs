package main

import (
	"log"
	"net/http"

	"3dkemasansaas/internal/config"
	deliveryHttp "3dkemasansaas/internal/delivery/http"
	"3dkemasansaas/internal/domain"
	"3dkemasansaas/internal/middleware"
	"3dkemasansaas/internal/repository"
	"3dkemasansaas/internal/service/ai"
	"3dkemasansaas/internal/service/pricing"
	"3dkemasansaas/internal/service/storage"
	"3dkemasansaas/internal/usecase"
	"3dkemasansaas/pkg/jwt"
	"3dkemasansaas/pkg/parametric"
	"3dkemasansaas/pkg/response"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	cfg := config.LoadConfig()

	// 1. Connect Database
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Printf("[WARN] Tidak dapat terhubung ke database postgres: %v. (Gunakan docker-compose untuk DB lokal)", err)
	} else {
		log.Println("[INFO] Terhubung ke PostgreSQL Database")
		// Auto-migrate domain models
		_ = db.AutoMigrate(
			&domain.Tenant{},
			&domain.User{},
			&domain.Model3D{},
			&domain.SlicerJob{},
		)
	}

	// 2. Initialize Services, Generators & Security
	jwtService := jwt.NewJWTService(cfg.JWTSecret)
	storageService := storage.NewLocalStorageService("./uploads", "http://localhost:"+cfg.AppPort)
	pricingCalculator := pricing.NewPricingCalculator()
	parametricGen := parametric.NewGenerator()
	aiService := ai.NewAIService("http://localhost:" + cfg.AppPort)

	// 3. Initialize Repositories
	tenantRepo := repository.NewTenantRepository(db)
	userRepo := repository.NewUserRepository(db)

	// 4. Initialize Usecases
	authUsecase := usecase.NewAuthUsecase(tenantRepo, userRepo, jwtService)
	calcUsecase := usecase.NewCalculatorUsecase(pricingCalculator)
	templateUsecase := usecase.NewTemplateUsecase(parametricGen)

	// 5. Initialize Handlers
	authHandler := deliveryHttp.NewAuthHandler(authUsecase)
	tenantHandler := deliveryHttp.NewTenantHandler(tenantRepo)
	storageHandler := deliveryHttp.NewStorageHandler(storageService)
	calculatorHandler := deliveryHttp.NewCalculatorHandler(calcUsecase)
	templateHandler := deliveryHttp.NewTemplateHandler(templateUsecase)
	aiHandler := deliveryHttp.NewAIHandler(aiService)

	// 6. Initialize Gin Router
	router := gin.Default()

	// Serve uploaded static files
	router.Static("/uploads", "./uploads")

	// Global Health Check
	router.GET("/health", func(c *gin.Context) {
		response.Success(c, http.StatusOK, "SaaS 3D Packaging AI API is running healthy", gin.H{
			"env": cfg.AppEnv,
		})
	})

	// Public Auth Routes (Tenant Registration & Login)
	authGroup := router.Group("/api/v1/auth")
	{
		authGroup.POST("/register-tenant", authHandler.RegisterTenant)
		authGroup.POST("/login", authHandler.Login)
	}

	// Packaging Templates Catalog & Management (Pacdora-style presets)
	templateGroup := router.Group("/api/v1/templates")
	{
		templateGroup.GET("", templateHandler.ListTemplates)
		templateGroup.POST("", templateHandler.CreateTemplate)
		templateGroup.GET("/:id", templateHandler.GetTemplateDetail)
		templateGroup.PUT("/:id", templateHandler.UpdateTemplate)
		templateGroup.DELETE("/:id", templateHandler.DeleteTemplate)
		templateGroup.POST("/:id/export-stl", templateHandler.GenerateSTL)
		templateGroup.GET("/:id/export-stl", templateHandler.GenerateSTL)
	}

	// Public 3D Pricing Calculator
	calcGroup := router.Group("/api/v1/calculator")
	{
		calcGroup.POST("/stl-quote", calculatorHandler.CalculateSTLQuote)
		calcGroup.POST("/parametric-quote", calculatorHandler.CalculateParametricQuote)
	}

	// AI 3D Generation Bridge
	aiGroup := router.Group("/api/v1/ai")
	{
		aiGroup.POST("/generate-3d", aiHandler.Generate3DAsset)
	}

	// Protected Routes (Requires JWT Token)
	protectedGroup := router.Group("/api/v1")
	protectedGroup.Use(middleware.AuthMiddleware(jwtService))
	{
		protectedGroup.GET("/auth/me", authHandler.GetMe)
		protectedGroup.POST("/storage/upload", storageHandler.UploadAsset)
	}

	// Tenant-Scoped Public Storefront & Customizer API
	// (Resolved dynamically from Host header: *.kemasan3d.id or store.customdomain.com)
	storefrontGroup := router.Group("/api/v1/storefront")
	if db != nil {
		storefrontGroup.Use(middleware.TenantResolverMiddleware(tenantRepo, cfg.BaseDomain))
	}
	{
		storefrontGroup.GET("", tenantHandler.GetCurrentStorefront)
		storefrontGroup.POST("/upload", storageHandler.UploadAsset)
		storefrontGroup.POST("/stl-quote", calculatorHandler.CalculateSTLQuote)
		storefrontGroup.POST("/parametric-quote", calculatorHandler.CalculateParametricQuote)
	}

	log.Printf("[INFO] Server berjalan pada port :%s (Base Domain: %s)", cfg.AppPort, cfg.BaseDomain)
	if err := router.Run(":" + cfg.AppPort); err != nil {
		log.Fatalf("Gagal menjalankan server: %v", err)
	}
}
