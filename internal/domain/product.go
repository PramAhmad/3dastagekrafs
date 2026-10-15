package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ModelSourceType string

const (
	ModelSourceTemplate   ModelSourceType = "TEMPLATE"    // Parametric packaging template
	ModelSourceAIGenerated ModelSourceType = "AI_GENERATED"// Generated via 2D-to-3D / Text-to-3D
	ModelSourceCustomUpload ModelSourceType = "CUSTOM_UPLOAD" // STL/OBJ uploaded by client
)

type PackagingDimensions struct {
	LengthMM       float64 `json:"length_mm"`
	WidthMM        float64 `json:"width_mm"`
	HeightMM       float64 `json:"height_mm"`
	WallThicknessMM float64 `json:"wall_thickness_mm"`
}

type Model3D struct {
	ID            uuid.UUID           `gorm:"primaryKey" json:"id"`
	TenantID      uuid.UUID           `gorm:"index;not null" json:"tenant_id"`
	Name          string              `gorm:"type:varchar(150);not null" json:"name"`
	Description   string              `gorm:"type:text" json:"description"`
	SourceType    ModelSourceType     `gorm:"type:varchar(30);not null" json:"source_type"`
	
	// File URLs stored on S3/MinIO
	PreviewGLBURL string              `gorm:"type:text" json:"preview_glb_url"` // Web Viewer (Three.js)
	SourceSTLURL  string              `gorm:"type:text" json:"source_stl_url"`  // Manufacturing file
	ThumbnailURL  string              `gorm:"type:text" json:"thumbnail_url"`
	
	// Dimensions & Packaging params
	Dimensions    PackagingDimensions `gorm:"serializer:json" json:"dimensions"`
	
	// Slicing pre-calculated cache
	EstimatedVolumeCm3 float64        `json:"estimated_volume_cm3"`
	EstimatedGrams     float64        `json:"estimated_grams"`
	BasePrice          float64        `json:"base_price"`
	
	IsActive      bool                `gorm:"default:true" json:"is_active"`
	CreatedAt     time.Time           `json:"created_at"`
	UpdatedAt     time.Time           `json:"updated_at"`
	DeletedAt     gorm.DeletedAt      `gorm:"index" json:"-"`
}

func (m *Model3D) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

type Model3DRepository interface {
	Create(model *Model3D) error
	GetByID(tenantID uuid.UUID, id uuid.UUID) (*Model3D, error)
	List(tenantID uuid.UUID, page int, limit int) ([]Model3D, int64, error)
	Update(model *Model3D) error
	Delete(tenantID uuid.UUID, id uuid.UUID) error
}
