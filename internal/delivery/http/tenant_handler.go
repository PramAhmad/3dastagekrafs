package http

import (
	"net/http"

	"3dkemasansaas/internal/domain"
	"3dkemasansaas/internal/middleware"
	"3dkemasansaas/pkg/response"

	"github.com/gin-gonic/gin"
)

type TenantHandler struct {
	tenantRepo domain.TenantRepository
}

func NewTenantHandler(tenantRepo domain.TenantRepository) *TenantHandler {
	return &TenantHandler{tenantRepo: tenantRepo}
}

// GetCurrentStorefront returns public tenant info for the visiting customer
func (h *TenantHandler) GetCurrentStorefront(c *gin.Context) {
	tenant, exists := middleware.GetTenantFromGin(c)
	if !exists {
		response.NotFound(c, "Storefront tidak ditemukan")
		return
	}

	// Filter sensitive information for public customer view
	publicStorefront := gin.H{
		"id":             tenant.ID,
		"name":           tenant.Name,
		"slug":           tenant.Slug,
		"custom_domain":  tenant.CustomDomain,
		"branding":       tenant.Branding,
		"pricing_config": tenant.PricingConfig,
		"email":          tenant.Email,
		"phone":          tenant.Phone,
	}

	response.Success(c, http.StatusOK, "Berhasil memuat data storefront", publicStorefront)
}
