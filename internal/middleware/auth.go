package middleware

import (
	"net/http"
	"strings"

	"3dkemasansaas/internal/domain"
	"3dkemasansaas/pkg/jwt"
	"3dkemasansaas/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	GinUserClaimsKey = "current_user_claims"
	GinUserIDKey     = "current_user_id"
	GinUserRoleKey   = "current_user_role"
)

func AuthMiddleware(jwtService jwt.JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, "Header Authorization diperlukan")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && strings.ToLower(parts[0]) == "bearer") {
			response.Unauthorized(c, "Format header Authorization harus Bearer <token>")
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims, err := jwtService.ValidateToken(tokenString)
		if err != nil {
			response.Unauthorized(c, "Token tidak valid atau kadaluarsa")
			c.Abort()
			return
		}

		c.Set(GinUserClaimsKey, claims)
		c.Set(GinUserIDKey, claims.UserID)
		c.Set(GinUserRoleKey, claims.Role)

		c.Next()
	}
}

func RequireRole(allowedRoles ...domain.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get(GinUserRoleKey)
		if !exists {
			response.Unauthorized(c, "Autentikasi diperlukan")
			c.Abort()
			return
		}

		userRole := roleVal.(domain.UserRole)
		for _, role := range allowedRoles {
			if userRole == role {
				c.Next()
				return
			}
		}

		response.Error(c, http.StatusForbidden, "FORBIDDEN", "Anda tidak memiliki hak akses untuk aksi ini", nil)
		c.Abort()
	}
}

func GetCurrentUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get(GinUserIDKey)
	if !exists {
		return uuid.Nil, false
	}
	id, ok := val.(uuid.UUID)
	return id, ok
}
