package domain

import (
	"time"

	"github.com/google/uuid"
)

type AIJobType string

const (
	AIJobType2DTo3DRelief  AIJobType = "2D_TO_3D_RELIEF"  // Logo/Image to 3D Emboss
	AIJobTypeTextTo3DModel AIJobType = "TEXT_TO_3D_MODEL"  // Prompt to 3D Geometry
	AIJobTypeMeshAutoFix   AIJobType = "MESH_AUTO_FIX"    // Non-manifold healing
)

type AIJobStatus string

const (
	AIStatusPending    AIJobStatus = "PENDING"
	AIStatusProcessing AIJobStatus = "PROCESSING"
	AIStatusCompleted  AIJobStatus = "COMPLETED"
	AIStatusFailed     AIJobStatus = "FAILED"
)

type AIGenerateRequest struct {
	JobType       AIJobType `json:"job_type"`
	Prompt        string    `json:"prompt,omitempty"`
	SourceImageURL string   `json:"source_image_url,omitempty"`
	ReliefDepthMM float64   `json:"relief_depth_mm,omitempty"` // e.g. 2.0 mm emboss
}

type AIGenerateResult struct {
	JobID         uuid.UUID   `json:"job_id"`
	Status        AIJobStatus `json:"status"`
	ProgressPct   int         `json:"progress_pct"`
	OutputGLBURL  string      `json:"output_glb_url,omitempty"` // For 3D Web Viewer
	OutputSTLURL  string      `json:"output_stl_url,omitempty"` // For 3D Printing
	EstimatedGrams float64    `json:"estimated_grams,omitempty"`
	Message       string      `json:"message,omitempty"`
	CreatedAt     time.Time   `json:"created_at"`
}
