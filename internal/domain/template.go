package domain

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
	ID          string              `json:"id"`
	Name        string              `json:"name"`
	Category    TemplateCategory    `json:"category"`
	Description string              `json:"description"`
	PreviewURL  string              `json:"preview_url"`
	IsPrintable bool                `json:"is_printable"` // Ready for 3D printing
	
	// Constraints for UI Sliders (Pacdora style)
	Constraints map[string]DimensionConstraint `json:"constraints"`
	DefaultDimensions map[string]float64        `json:"default_dimensions"`
}
