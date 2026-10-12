package repository

import (
	"3dkemasansaas/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type tenantRepository struct {
	db *gorm.DB
}

func NewTenantRepository(db *gorm.DB) domain.TenantRepository {
	return &tenantRepository{db: db}
}

func (r *tenantRepository) Create(tenant *domain.Tenant) error {
	return r.db.Create(tenant).Error
}

func (r *tenantRepository) GetByID(id uuid.UUID) (*domain.Tenant, error) {
	var tenant domain.Tenant
	err := r.db.Where("id = ?", id).First(&tenant).Error
	if err != nil {
		return nil, err
	}
	return &tenant, nil
}

func (r *tenantRepository) GetBySlug(slug string) (*domain.Tenant, error) {
	var tenant domain.Tenant
	err := r.db.Where("slug = ?", slug).First(&tenant).Error
	if err != nil {
		return nil, err
	}
	return &tenant, nil
}

func (r *tenantRepository) GetByDomain(domainName string) (*domain.Tenant, error) {
	var tenant domain.Tenant
	err := r.db.Where("custom_domain = ?", domainName).First(&tenant).Error
	if err != nil {
		return nil, err
	}
	return &tenant, nil
}

func (r *tenantRepository) Update(tenant *domain.Tenant) error {
	return r.db.Save(tenant).Error
}

func (r *tenantRepository) List(page int, limit int) ([]domain.Tenant, int64, error) {
	var tenants []domain.Tenant
	var total int64

	offset := (page - 1) * limit
	if err := r.db.Model(&domain.Tenant{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Offset(offset).Limit(limit).Order("created_at desc").Find(&tenants).Error
	return tenants, total, err
}
