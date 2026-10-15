package domain

import (
	"time"

	"gorm.io/gorm"
)

type TemplateCategory string

const (
	CategoryBox      TemplateCategory = "BOX"
	CategoryPouch    TemplateCategory = "POUCH"
	CategoryJar      TemplateCategory = "JAR"
	CategoryBottle   TemplateCategory = "BOTTLE"
	CategoryCan      TemplateCategory = "CAN"
	CategoryTriangle TemplateCategory = "TRIANGLE"
	CategoryCup      TemplateCategory = "CUP"
	CategoryPillow   TemplateCategory = "PILLOW"
	CategoryClip     TemplateCategory = "CLIP"
)

type DimensionConstraint struct {
	MinMM   float64 `json:"min_mm"`
	MaxMM   float64 `json:"max_mm"`
	Default float64 `json:"default_mm"`
	StepMM  float64 `json:"step_mm"`
}

type PackagingTemplate struct {
	ID                 string             `gorm:"primaryKey;type:varchar(100)" json:"id"`
	Name               string             `gorm:"type:varchar(150);not null" json:"name"`
	Category           TemplateCategory   `gorm:"type:varchar(50);index;not null" json:"category"`
	Description        string             `gorm:"type:text" json:"description"`
	PreviewURL         string             `gorm:"column:preview_url;type:text" json:"preview_url"`
	Model3DURL         string             `gorm:"column:model_3d_url;type:text" json:"model_3d_url"`
	ModelFormat        string             `gorm:"column:model_format;type:varchar(20)" json:"model_format"`
	IsCustomMesh       bool               `gorm:"column:is_custom_mesh;default:false" json:"is_custom_mesh"`
	DielineSVGURL      string             `gorm:"column:dieline_svg_url;type:text" json:"dieline_svg_url"`
	ManifestJSON       string             `gorm:"column:manifest_json;type:text" json:"manifest_json"`
	UVTemplateURL      string             `gorm:"column:uv_template_url;type:text" json:"uv_template_url"`
	IsPrintable        bool               `gorm:"default:true" json:"is_printable"`
	Badge              string             `gorm:"type:varchar(50)" json:"badge"`

	// Serialized database storage for complex fields
	ConstraintsJSON    string             `gorm:"column:constraints;type:text" json:"-"`
	DefaultDimsJSON    string             `gorm:"column:default_dimensions;type:text" json:"-"`
	MaterialsJSON      string             `gorm:"column:available_materials;type:text" json:"-"`

	// In-memory structured fields (serialized to JSON for API responses)
	Constraints        map[string]DimensionConstraint `gorm:"-" json:"constraints,omitempty"`
	DefaultDimensions  map[string]float64             `gorm:"-" json:"default_dimensions,omitempty"`
	AvailableMaterials []string                       `gorm:"-" json:"available_materials,omitempty"`

	CreatedAt          time.Time          `json:"created_at"`
	UpdatedAt          time.Time          `json:"updated_at"`
	DeletedAt          gorm.DeletedAt     `gorm:"index" json:"-"`
}

type TemplateRepository interface {
	List() ([]PackagingTemplate, error)
	GetByID(id string) (*PackagingTemplate, error)
	Upsert(template *PackagingTemplate) error
	Delete(id string) error
	Count() (int64, error)
}
