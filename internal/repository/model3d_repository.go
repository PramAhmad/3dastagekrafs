package repository

import (
	"3dkemasansaas/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type model3DRepository struct {
	db *gorm.DB
}

func NewModel3DRepository(db *gorm.DB) domain.Model3DRepository {
	return &model3DRepository{db: db}
}

func (r *model3DRepository) Create(model *domain.Model3D) error {
	return r.db.Create(model).Error
}

// GetByID strictly filters by tenantID to guarantee data isolation between UMKM
func (r *model3DRepository) GetByID(tenantID uuid.UUID, id uuid.UUID) (*domain.Model3D, error) {
	var model domain.Model3D
	err := r.db.Where("tenant_id = ? AND id = ?", tenantID, id).First(&model).Error
	if err != nil {
		return nil, err
	}
	return &model, nil
}

func (r *model3DRepository) List(tenantID uuid.UUID, page int, limit int) ([]domain.Model3D, int64, error) {
	var models []domain.Model3D
	var total int64

	offset := (page - 1) * limit
	query := r.db.Model(&domain.Model3D{}).Where("tenant_id = ? AND is_active = ?", tenantID, true)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Offset(offset).Limit(limit).Order("created_at desc").Find(&models).Error
	return models, total, err
}

func (r *model3DRepository) Update(model *domain.Model3D) error {
	// Updates with tenant_id condition to ensure cross-tenant modifications are prevented
	return r.db.Where("tenant_id = ? AND id = ?", model.TenantID, model.ID).Save(model).Error
}

func (r *model3DRepository) Delete(tenantID uuid.UUID, id uuid.UUID) error {
	return r.db.Where("tenant_id = ? AND id = ?", tenantID, id).Delete(&domain.Model3D{}).Error
}
