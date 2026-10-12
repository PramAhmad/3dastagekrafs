package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TenantStatus string

const (
	TenantStatusActive    TenantStatus = "ACTIVE"
	TenantStatusSuspended TenantStatus = "SUSPENDED"
	TenantStatusPending   TenantStatus = "PENDING"
)

type TenantBranding struct {
	LogoURL        string `json:"logo_url"`
	FaviconURL     string `json:"favicon_url"`
	PrimaryColor   string `json:"primary_color"`
	SecondaryColor string `json:"secondary_color"`
	HeroTitle      string `json:"hero_title"`
	HeroSubtitle   string `json:"hero_subtitle"`
}

type TenantPricingConfig struct {
	FilamentMarkupPct float64 `json:"filament_markup_pct"` // e.g., 30% markup on filament
	MachineHourlyRate float64 `json:"machine_hourly_rate"` // e.g., Rp 15,000 / hour
	MinOrderPrice     float64 `json:"min_order_price"`     // e.g., Rp 25,000
	PackagingFee      float64 `json:"packaging_fee"`       // e.g., Rp 5,000
}

type Tenant struct {
	ID            uuid.UUID           `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name          string              `gorm:"type:varchar(100);not null" json:"name"`
	Slug          string              `gorm:"type:varchar(100);uniqueIndex;not null" json:"slug"` // subdomain: {slug}.kemasan3d.id
	CustomDomain  *string             `gorm:"type:varchar(255);uniqueIndex" json:"custom_domain,omitempty"` // e.g. store.brand.com
	Status        TenantStatus        `gorm:"type:varchar(20);default:'ACTIVE'" json:"status"`
	Email         string              `gorm:"type:varchar(150);not null" json:"email"`
	Phone         string              `gorm:"type:varchar(30)" json:"phone"`
	
	// Configuration (stored as JSONB in PostgreSQL)
	Branding      TenantBranding      `gorm:"type:jsonb;serializer:json" json:"branding"`
	PricingConfig TenantPricingConfig `gorm:"type:jsonb;serializer:json" json:"pricing_config"`
	
	CreatedAt     time.Time           `json:"created_at"`
	UpdatedAt     time.Time           `json:"updated_at"`
	DeletedAt     gorm.DeletedAt      `gorm:"index" json:"-"`
}

type TenantRepository interface {
	Create(tenant *Tenant) error
	GetByID(id uuid.UUID) (*Tenant, error)
	GetBySlug(slug string) (*Tenant, error)
	GetByDomain(domain string) (*Tenant, error)
	Update(tenant *Tenant) error
	List(page int, limit int) ([]Tenant, int64, error)
}
