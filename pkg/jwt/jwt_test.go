package jwt_test

import (
	"testing"
	"time"

	"3dkemasansaas/internal/domain"
	"3dkemasansaas/pkg/jwt"

	"github.com/google/uuid"
)

func TestJWTGenerateAndValidate(t *testing.T) {
	secret := "test-secret-key-3dkemasan"
	jwtSvc := jwt.NewJWTService(secret)

	tenantID := uuid.New()
	user := &domain.User{
		ID:       uuid.New(),
		TenantID: &tenantID,
		Email:    "admin@kopinusantara.id",
		Role:     domain.RoleTenantAdmin,
	}

	token, err := jwtSvc.GenerateToken(user, 1*time.Hour)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	claims, err := jwtSvc.ValidateToken(token)
	if err != nil {
		t.Fatalf("Failed to validate token: %v", err)
	}

	if claims.UserID != user.ID {
		t.Errorf("Expected UserID %v, got %v", user.ID, claims.UserID)
	}
	if *claims.TenantID != *user.TenantID {
		t.Errorf("Expected TenantID %v, got %v", *user.TenantID, *claims.TenantID)
	}
	if claims.Role != domain.RoleTenantAdmin {
		t.Errorf("Expected Role %v, got %v", domain.RoleTenantAdmin, claims.Role)
	}
}
