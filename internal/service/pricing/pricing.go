package pricing

import (
	"math"

	"3dkemasansaas/internal/domain"
	"3dkemasansaas/pkg/stl"
)

// Material density in g/cm3 and raw material cost per gram in IDR (Rupiah)
var MaterialDensities = map[domain.FilamentMaterial]float64{
	domain.MaterialPLA:   1.24,
	domain.MaterialPETG:  1.27,
	domain.MaterialABS:   1.04,
	domain.MaterialResin: 1.15,
	domain.MaterialTPU:   1.21,
}

var MaterialCostPerGram = map[domain.FilamentMaterial]float64{
	domain.MaterialPLA:   250.0, // ~Rp 250,000 / 1kg spool
	domain.MaterialPETG:  280.0,
	domain.MaterialABS:   260.0,
	domain.MaterialResin: 500.0, // Resin is generally pricier
	domain.MaterialTPU:   350.0,
}

type PriceCalculationResult struct {
	Material          domain.FilamentMaterial `json:"material"`
	InfillDensityPct  int                     `json:"infill_density_pct"`
	RawVolumeCM3      float64                 `json:"raw_volume_cm3"`
	EffectiveVolumeCM3 float64                `json:"effective_volume_cm3"`
	FilamentWeightGrams float64               `json:"filament_weight_grams"`
	EstimatedPrintHours float64               `json:"estimated_print_hours"`
	EstimatedPrintMinutes int                 `json:"estimated_print_minutes"`
	
	// Price Breakdown (in IDR)
	MaterialCost      float64                 `json:"material_cost"`
	MachineCost       float64                 `json:"machine_cost"`
	PackagingFee      float64                 `json:"packaging_fee"`
	Subtotal          float64                 `json:"subtotal"`
	FinalTotalPrice   float64                 `json:"final_total_price"`
}

type PricingCalculator interface {
	Calculate(stats *stl.MeshStats, params domain.SlicingParams, config domain.TenantPricingConfig) *PriceCalculationResult
}

type pricingCalculator struct{}

func NewPricingCalculator() PricingCalculator {
	return &pricingCalculator{}
}

func (c *pricingCalculator) Calculate(stats *stl.MeshStats, params domain.SlicingParams, config domain.TenantPricingConfig) *PriceCalculationResult {
	density, ok := MaterialDensities[params.Material]
	if !ok {
		density = 1.24 // default PLA
	}

	rawCostPerGram, ok := MaterialCostPerGram[params.Material]
	if !ok {
		rawCostPerGram = 250.0
	}

	infill := params.InfillDensity
	if infill < 10 {
		infill = 20 // default standard infill 20%
	} else if infill > 100 {
		infill = 100
	}

	// 3D Prints have 100% dense outer shell (~1.2mm walls) and internal infill
	// Estimation: 35% of volume is shell (100% density), 65% is internal infill
	shellRatio := 0.35
	infillRatio := 0.65
	effectiveFactor := (shellRatio * 1.0) + (infillRatio * (float64(infill) / 100.0))
	effectiveVolumeCM3 := stats.VolumeCM3 * effectiveFactor

	// Weight in grams = Volume (cm3) * Density (g/cm3)
	weightGrams := effectiveVolumeCM3 * density

	// Estimated Print Duration
	// Standard FDM print speed volumetric extrusion ~ 8 mm3/s = 28.8 cm3/hour
	// Support structures add ~15% time if enabled
	printSpeedCM3PerHour := 15.0 // realistic average accounting for travel & retraction
	estimatedHours := effectiveVolumeCM3 / printSpeedCM3PerHour
	if params.HasSupports {
		estimatedHours *= 1.15
	}
	if estimatedHours < 0.25 {
		estimatedHours = 0.25 // minimum 15 mins
	}

	// 1. Material Cost with Tenant Markup
	markupFactor := 1.0 + (config.FilamentMarkupPct / 100.0)
	materialCost := weightGrams * rawCostPerGram * markupFactor

	// 2. Machine Usage Cost
	hourlyRate := config.MachineHourlyRate
	if hourlyRate <= 0 {
		hourlyRate = 15000.0 // default Rp 15,000 / hr
	}
	machineCost := estimatedHours * hourlyRate

	// 3. Packaging & Handling Fee
	packagingFee := config.PackagingFee
	if packagingFee <= 0 {
		packagingFee = 5000.0
	}

	subtotal := materialCost + machineCost + packagingFee

	// Round to nearest Rp 1,000
	roundedSubtotal := math.Ceil(subtotal/1000.0) * 1000.0

	// Min Order Price check
	finalPrice := roundedSubtotal
	if config.MinOrderPrice > 0 && finalPrice < config.MinOrderPrice {
		finalPrice = config.MinOrderPrice
	}

	return &PriceCalculationResult{
		Material:              params.Material,
		InfillDensityPct:      infill,
		RawVolumeCM3:          math.Round(stats.VolumeCM3*100) / 100,
		EffectiveVolumeCM3:    math.Round(effectiveVolumeCM3*100) / 100,
		FilamentWeightGrams:   math.Round(weightGrams*10) / 10,
		EstimatedPrintHours:   math.Round(estimatedHours*10) / 10,
		EstimatedPrintMinutes: int(math.Round(estimatedHours * 60)),
		MaterialCost:          math.Round(materialCost),
		MachineCost:           math.Round(machineCost),
		PackagingFee:          packagingFee,
		Subtotal:              subtotal,
		FinalTotalPrice:       finalPrice,
	}
}
