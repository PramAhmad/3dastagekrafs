package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleSuperAdmin  UserRole = "SUPERADMIN"
	RoleTenantAdmin UserRole = "TENANT_ADMIN"
	RoleTenantStaff UserRole = "TENANT_STAFF"
	RoleCustomer    UserRole = "CUSTOMER"
)

type User struct {
	ID           uuid.UUID      `gorm:"primaryKey" json:"id"`
	TenantID     *uuid.UUID     `gorm:"index" json:"tenant_id,omitempty"` // Nullable for SuperAdmin
	Name         string         `gorm:"type:varchar(100);not null" json:"name"`
	Email        string         `gorm:"type:varchar(150);not null;index" json:"email"`
	PasswordHash string         `gorm:"type:varchar(255);not null" json:"-"`
	Role         UserRole       `gorm:"type:varchar(20);default:'CUSTOMER'" json:"role"`
	Phone        string         `gorm:"type:varchar(30)" json:"phone"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

type UserRepository interface {
	Create(user *User) error
	GetByID(id uuid.UUID) (*User, error)
	GetByEmail(email string, tenantID *uuid.UUID) (*User, error)
	GetByEmailGlobal(email string) (*User, error)
	Update(user *User) error
}
