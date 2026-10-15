package repository

import (
	"encoding/json"

	"3dkemasansaas/internal/domain"
	"gorm.io/gorm"
)

type templateRepository struct {
	db *gorm.DB
}

func NewTemplateRepository(db *gorm.DB) domain.TemplateRepository {
	return &templateRepository{db: db}
}

func (r *templateRepository) List() ([]domain.PackagingTemplate, error) {
	var templates []domain.PackagingTemplate
	if r.db == nil {
		return nil, nil
	}
	err := r.db.Order("created_at asc, id asc").Find(&templates).Error
	if err != nil {
		return nil, err
	}
	for i := range templates {
		r.deserializeHelperFields(&templates[i])
	}
	return templates, nil
}

func (r *templateRepository) GetByID(id string) (*domain.PackagingTemplate, error) {
	var template domain.PackagingTemplate
	if r.db == nil {
		return nil, gorm.ErrRecordNotFound
	}
	err := r.db.Where("id = ?", id).First(&template).Error
	if err != nil {
		return nil, err
	}
	r.deserializeHelperFields(&template)
	return &template, nil
}

func (r *templateRepository) Upsert(template *domain.PackagingTemplate) error {
	if r.db == nil {
		return nil
	}
	r.serializeHelperFields(template)
	return r.db.Save(template).Error
}

func (r *templateRepository) Delete(id string) error {
	if r.db == nil {
		return nil
	}
	return r.db.Where("id = ?", id).Delete(&domain.PackagingTemplate{}).Error
}

func (r *templateRepository) Count() (int64, error) {
	var count int64
	if r.db == nil {
		return 0, nil
	}
	err := r.db.Model(&domain.PackagingTemplate{}).Count(&count).Error
	return count, err
}

func (r *templateRepository) serializeHelperFields(t *domain.PackagingTemplate) {
	if t.Constraints != nil {
		if b, err := json.Marshal(t.Constraints); err == nil {
			t.ConstraintsJSON = string(b)
		}
	}
	if t.DefaultDimensions != nil {
		if b, err := json.Marshal(t.DefaultDimensions); err == nil {
			t.DefaultDimsJSON = string(b)
		}
	}
	if t.AvailableMaterials != nil {
		if b, err := json.Marshal(t.AvailableMaterials); err == nil {
			t.MaterialsJSON = string(b)
		}
	}
}

func (r *templateRepository) deserializeHelperFields(t *domain.PackagingTemplate) {
	if t.ConstraintsJSON != "" {
		_ = json.Unmarshal([]byte(t.ConstraintsJSON), &t.Constraints)
	}
	if t.DefaultDimsJSON != "" {
		_ = json.Unmarshal([]byte(t.DefaultDimsJSON), &t.DefaultDimensions)
	}
	if t.MaterialsJSON != "" {
		_ = json.Unmarshal([]byte(t.MaterialsJSON), &t.AvailableMaterials)
	}
}
