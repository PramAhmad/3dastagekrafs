package domain

import (
	"time"

	"gorm.io/gorm"
)

type Category struct {
	ID           string         `gorm:"primaryKey;type:varchar(50)" json:"id"`
	Name         string         `gorm:"type:varchar(150);not null" json:"name"`
	Description  string         `gorm:"type:text" json:"description"`
	ImageURL     string         `gorm:"type:text" json:"image_url"`
	IconName     string         `gorm:"type:varchar(50)" json:"icon_name"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	DisplayOrder int            `gorm:"default:0" json:"display_order"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

type CategoryRepository interface {
	List() ([]Category, error)
	GetByID(id string) (*Category, error)
	Upsert(category *Category) error
	Delete(id string) error
	Count() (int64, error)
}
