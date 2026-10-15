package repository

import (
	"3dkemasansaas/internal/domain"
	"gorm.io/gorm"
)

type categoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) domain.CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) List() ([]domain.Category, error) {
	var categories []domain.Category
	if r.db == nil {
		return nil, nil
	}
	err := r.db.Order("display_order asc, id asc").Find(&categories).Error
	return categories, err
}

func (r *categoryRepository) GetByID(id string) (*domain.Category, error) {
	var category domain.Category
	if r.db == nil {
		return nil, gorm.ErrRecordNotFound
	}
	err := r.db.Where("id = ?", id).First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepository) Upsert(category *domain.Category) error {
	if r.db == nil {
		return nil
	}
	return r.db.Save(category).Error
}

func (r *categoryRepository) Delete(id string) error {
	if r.db == nil {
		return nil
	}
	return r.db.Where("id = ?", id).Delete(&domain.Category{}).Error
}

func (r *categoryRepository) Count() (int64, error) {
	var count int64
	if r.db == nil {
		return 0, nil
	}
	err := r.db.Model(&domain.Category{}).Count(&count).Error
	return count, err
}
