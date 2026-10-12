package middleware

import (
	"context"
	"net/http"
	"strings"

	"3dkemasansaas/internal/domain"
	"3dkemasansaas/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type tenantCtxKey string

const (
	TenantContextKey   tenantCtxKey = "tenant_context"
	TenantIDContextKey tenantCtxKey = "tenant_id_context"
	GinTenantKey                    = "current_tenant"
)

// Helper functions to get Tenant from context
func GetTenantFromGin(c *gin.Context) (*domain.Tenant, bool) {
	val, exists := c.Get(GinTenantKey)
	if !exists {
		return nil, false
	}
	tenant, ok := val.(*domain.Tenant)
	return tenant, ok
}

func GetTenantID(ctx context.Context) (uuid.UUID, bool) {
	val := ctx.Value(TenantIDContextKey)
	if val == nil {
		return uuid.Nil, false
	}
	id, ok := val.(uuid.UUID)
	return id, ok
}

// TenantResolverMiddleware resolves the tenant by Custom Domain or Subdomain
func TenantResolverMiddleware(tenantRepo domain.TenantRepository, baseDomain string) gin.HandlerFunc {
	return func(c *gin.Context) {
		host := c.Request.Host
		
		// Strip port if exists (e.g. localhost:8080 or domain.com:443)
		if idx := strings.Index(host, ":"); idx != -1 {
			host = host[:idx]
		}

		// Allow manual override header for API testing or frontend proxy
		if overrideDomain := c.GetHeader("X-Tenant-Domain"); overrideDomain != "" {
			host = overrideDomain
		}

		var tenant *domain.Tenant
		var err error

		// 1. Check if it's a subdomain (e.g. tenant-a.kemasan3d.id)
		if strings.HasSuffix(host, "."+baseDomain) {
			slug := strings.TrimSuffix(host, "."+baseDomain)
			tenant, err = tenantRepo.GetBySlug(slug)
		} else if headerSlug := c.GetHeader("X-Tenant-Slug"); headerSlug != "" {
			tenant, err = tenantRepo.GetBySlug(headerSlug)
		} else {
			// 2. Custom Domain lookup (e.g. store.brandumkm.com)
			tenant, err = tenantRepo.GetByDomain(host)
		}

		if err != nil || tenant == nil {
			response.Error(c, http.StatusNotFound, "TENANT_NOT_FOUND", "Domain atau UMKM Storefront tidak ditemukan", nil)
			c.Abort()
			return
		}

		if tenant.Status != domain.TenantStatusActive {
			response.Error(c, http.StatusForbidden, "TENANT_SUSPENDED", "Storefront UMKM sedang dinonaktifkan sementara", nil)
			c.Abort()
			return
		}

		// Set to Gin Context and standard request context
		c.Set(GinTenantKey, tenant)
		
		ctx := context.WithValue(c.Request.Context(), TenantContextKey, tenant)
		ctx = context.WithValue(ctx, TenantIDContextKey, tenant.ID)
		c.Request = c.Request.WithContext(ctx)

		c.Next()
	}
}
