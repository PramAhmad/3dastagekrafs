package domain

import (
	"time"

	"github.com/google/uuid"
)

type SlicerJobStatus string

const (
	SlicerStatusQueued     SlicerJobStatus = "QUEUED"
	SlicerStatusProcessing SlicerJobStatus = "PROCESSING"
	SlicerStatusCompleted  SlicerJobStatus = "COMPLETED"
	SlicerStatusFailed     SlicerJobStatus = "FAILED"
)

type FilamentMaterial string

const (
	MaterialPLA   FilamentMaterial = "PLA"
	MaterialPETG  FilamentMaterial = "PETG"
	MaterialResin FilamentMaterial = "RESIN"
	MaterialABS   FilamentMaterial = "ABS"
	MaterialTPU   FilamentMaterial = "TPU"
)

type SlicingParams struct {
	Material       FilamentMaterial `json:"material"`
	LayerHeightMM  float64          `json:"layer_height_mm"` // default 0.2mm
	InfillDensity  int              `json:"infill_density"`  // e.g. 15-100%
	HasSupports    bool             `json:"has_supports"`
	ColorHex       string           `json:"color_hex"`
}

type SlicingResult struct {
	FilamentUsedGrams float64 `json:"filament_used_grams"`
	FilamentLengthM   float64 `json:"filament_length_m"`
	PrintDurationSec  int64   `json:"print_duration_sec"` // in seconds
	LayerCount        int     `json:"layer_count"`
	TotalCalculatedPrice float64 `json:"total_calculated_price"`
}

type SlicerJob struct {
	ID         uuid.UUID       `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	TenantID   uuid.UUID       `gorm:"type:uuid;index;not null" json:"tenant_id"`
	Model3DID  uuid.UUID       `gorm:"type:uuid;index;not null" json:"model_3d_id"`
	Status     SlicerJobStatus `gorm:"type:varchar(20);default:'QUEUED'" json:"status"`
	ProgressPct int            `gorm:"default:0" json:"progress_pct"` // 0 - 100%
	
	Params     SlicingParams   `gorm:"type:jsonb;serializer:json" json:"params"`
	Result     *SlicingResult  `gorm:"type:jsonb;serializer:json" json:"result,omitempty"`
	
	ErrorMessage *string       `json:"error_message,omitempty"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}
