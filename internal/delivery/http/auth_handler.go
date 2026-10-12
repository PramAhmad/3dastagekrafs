package http

import (
	"net/http"

	"3dkemasansaas/internal/middleware"
	"3dkemasansaas/internal/usecase"
	"3dkemasansaas/pkg/response"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authUsecase usecase.AuthUsecase
}

func NewAuthHandler(authUsecase usecase.AuthUsecase) *AuthHandler {
	return &AuthHandler{authUsecase: authUsecase}
}

// RegisterTenant handles UMKM onboarding with automatic admin user and initial storefront setup
func (h *AuthHandler) RegisterTenant(c *gin.Context) {
	var req usecase.RegisterTenantDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format input tidak valid", err.Error())
		return
	}

	tenant, user, token, err := h.authUsecase.RegisterTenant(&req)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusCreated, "Registrasi tenant UMKM berhasil", gin.H{
		"token":  token,
		"tenant": tenant,
		"user":   user,
	})
}

// Login handles authentication for both Tenant Admin and Customers
func (h *AuthHandler) Login(c *gin.Context) {
	var req usecase.LoginDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format input tidak valid", err.Error())
		return
	}

	res, err := h.authUsecase.Login(&req)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "AUTH_FAILED", err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Login berhasil", res)
}

// GetMe returns current authenticated user profile
func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		response.Unauthorized(c, "Pengguna tidak terautentikasi")
		return
	}

	user, err := h.authUsecase.GetProfile(userID)
	if err != nil || user == nil {
		response.NotFound(c, "Profil user tidak ditemukan")
		return
	}

	response.Success(c, http.StatusOK, "Berhasil memuat profil", user)
}
