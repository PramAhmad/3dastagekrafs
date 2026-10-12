package usecase

import (
	"errors"
	"time"

	"3dkemasansaas/internal/domain"
	"3dkemasansaas/pkg/jwt"
	"3dkemasansaas/pkg/password"

	"github.com/google/uuid"
)

type RegisterTenantDTO struct {
	TenantName string `json:"tenant_name" binding:"required"`
	Slug       string `json:"slug" binding:"required,alphanum"`
	AdminName  string `json:"admin_name" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required,min=6"`
	Phone      string `json:"phone"`
}

type LoginDTO struct {
	Email      string  `json:"email" binding:"required,email"`
	Password   string  `json:"password" binding:"required"`
	TenantSlug *string `json:"tenant_slug,omitempty"`
}

type AuthResponseDTO struct {
	Token string       `json:"token"`
	User  *domain.User `json:"user"`
}

type AuthUsecase interface {
	RegisterTenant(dto *RegisterTenantDTO) (*domain.Tenant, *domain.User, string, error)
	Login(dto *LoginDTO) (*AuthResponseDTO, error)
	GetProfile(userID uuid.UUID) (*domain.User, error)
}

type authUsecase struct {
	tenantRepo domain.TenantRepository
	userRepo   domain.UserRepository
	jwtService jwt.JWTService
}

func NewAuthUsecase(tenantRepo domain.TenantRepository, userRepo domain.UserRepository, jwtService jwt.JWTService) AuthUsecase {
	return &authUsecase{
		tenantRepo: tenantRepo,
		userRepo:   userRepo,
		jwtService: jwtService,
	}
}

func (u *authUsecase) RegisterTenant(dto *RegisterTenantDTO) (*domain.Tenant, *domain.User, string, error) {
	// 1. Check if slug is taken
	existingTenant, _ := u.tenantRepo.GetBySlug(dto.Slug)
	if existingTenant != nil {
		return nil, nil, "", errors.New("subdomain/slug UMKM sudah digunakan")
	}

	// 2. Hash Password
	hashedPassword, err := password.HashPassword(dto.Password)
	if err != nil {
		return nil, nil, "", err
	}

	// 3. Create Tenant
	tenant := &domain.Tenant{
		Name:  dto.TenantName,
		Slug:  dto.Slug,
		Email: dto.Email,
		Phone: dto.Phone,
		Status: domain.TenantStatusActive,
		Branding: domain.TenantBranding{
			PrimaryColor: "#3B82F6", // Default blue
			HeroTitle:    "Custom 3D Packaging & Merchandise",
			HeroSubtitle: "Kreasikan kemasan unik brand Anda secara 3D instan",
		},
		PricingConfig: domain.TenantPricingConfig{
			FilamentMarkupPct: 30.0,
			MachineHourlyRate: 15000.0,
			MinOrderPrice:     25000.0,
			PackagingFee:      5000.0,
		},
	}

	if err := u.tenantRepo.Create(tenant); err != nil {
		return nil, nil, "", err
	}

	// 4. Create Tenant Admin User
	adminUser := &domain.User{
		TenantID:     &tenant.ID,
		Name:         dto.AdminName,
		Email:        dto.Email,
		PasswordHash: hashedPassword,
		Role:         domain.RoleTenantAdmin,
		Phone:        dto.Phone,
		IsActive:     true,
	}

	if err := u.userRepo.Create(adminUser); err != nil {
		return nil, nil, "", err
	}

	// 5. Generate JWT Token (valid 7 days)
	token, err := u.jwtService.GenerateToken(adminUser, 7*24*time.Hour)
	if err != nil {
		return nil, nil, "", err
	}

	return tenant, adminUser, token, nil
}

func (u *authUsecase) Login(dto *LoginDTO) (*AuthResponseDTO, error) {
	var tenantID *uuid.UUID

	if dto.TenantSlug != nil && *dto.TenantSlug != "" {
		tenant, err := u.tenantRepo.GetBySlug(*dto.TenantSlug)
		if err != nil || tenant == nil {
			return nil, errors.New("storefront UMKM tidak ditemukan")
		}
		tenantID = &tenant.ID
	}

	user, err := u.userRepo.GetByEmail(dto.Email, tenantID)
	if err != nil || user == nil {
		// Also try global lookup if not specified
		user, err = u.userRepo.GetByEmailGlobal(dto.Email)
		if err != nil || user == nil {
			return nil, domain.ErrInvalidCredentials
		}
	}

	if !password.CheckPassword(dto.Password, user.PasswordHash) {
		return nil, domain.ErrInvalidCredentials
	}

	if !user.IsActive {
		return nil, errors.New("akun Anda sedang dinonaktifkan")
	}

	token, err := u.jwtService.GenerateToken(user, 7*24*time.Hour)
	if err != nil {
		return nil, err
	}

	return &AuthResponseDTO{
		Token: token,
		User:  user,
	}, nil
}

func (u *authUsecase) GetProfile(userID uuid.UUID) (*domain.User, error) {
	return u.userRepo.GetByID(userID)
}
