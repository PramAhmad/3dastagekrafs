package usecase

import (
	"errors"
	"io"
	"math"

	"3dkemasansaas/internal/domain"
	"3dkemasansaas/internal/service/pricing"
	"3dkemasansaas/pkg/stl"
)

type InstantQuoteRequest struct {
	Material      domain.FilamentMaterial `form:"material" json:"material"`
	InfillDensity int                     `form:"infill_density" json:"infill_density"`
	HasSupports   bool                    `form:"has_supports" json:"has_supports"`
	ColorHex      string                  `form:"color_hex" json:"color_hex"`
}

type InstantQuoteResponse struct {
	MeshStats *stl.MeshStats                 `json:"mesh_stats"`
	Pricing   *pricing.PriceCalculationResult `json:"pricing"`
}

type CalculatorUsecase interface {
	CalculateFromSTL(r io.Reader, req InstantQuoteRequest, config domain.TenantPricingConfig) (*InstantQuoteResponse, error)
	CalculateFromDimensions(dim domain.PackagingDimensions, req InstantQuoteRequest, config domain.TenantPricingConfig) (*InstantQuoteResponse, error)
}

type calculatorUsecase struct {
	pricingCalc pricing.PricingCalculator
}

func NewCalculatorUsecase(pricingCalc pricing.PricingCalculator) CalculatorUsecase {
	return &calculatorUsecase{
		pricingCalc: pricingCalc,
	}
}

func (u *calculatorUsecase) CalculateFromSTL(r io.Reader, req InstantQuoteRequest, config domain.TenantPricingConfig) (*InstantQuoteResponse, error) {
	stats, err := stl.ParseSTL(r)
	if err != nil {
		return nil, err
	}

	if !stats.IsWatertight || stats.VolumeCM3 <= 0 {
		return nil, errors.New("file STL tidak memiliki volume valid atau bukan model 3D solid (non-manifold)")
	}

	params := domain.SlicingParams{
		Material:      req.Material,
		InfillDensity: req.InfillDensity,
		HasSupports:   req.HasSupports,
		ColorHex:      req.ColorHex,
	}

	priceResult := u.pricingCalc.Calculate(stats, params, config)

	return &InstantQuoteResponse{
		MeshStats: stats,
		Pricing:   priceResult,
	}, nil
}

func (u *calculatorUsecase) CalculateFromDimensions(dim domain.PackagingDimensions, req InstantQuoteRequest, config domain.TenantPricingConfig) (*InstantQuoteResponse, error) {
	if dim.LengthMM <= 0 || dim.WidthMM <= 0 || dim.HeightMM <= 0 {
		return nil, errors.New("dimensi panjang, lebar, dan tinggi harus lebih besar dari 0")
	}

	thickness := dim.WallThicknessMM
	if thickness <= 0 {
		thickness = 1.6 // default 1.6mm solid wall
	}

	// Calculate hollow box volume: Outer Volume - Inner Volume
	outerVolMM3 := dim.LengthMM * dim.WidthMM * dim.HeightMM
	innerL := math.Max(0, dim.LengthMM-2*thickness)
	innerW := math.Max(0, dim.WidthMM-2*thickness)
	innerH := math.Max(0, dim.HeightMM-thickness) // open top
	innerVolMM3 := innerL * innerW * innerH

	netSolidVolMM3 := outerVolMM3 - innerVolMM3
	netSolidVolCM3 := netSolidVolMM3 / 1000.0

	surfaceAreaMM2 := 2*(dim.LengthMM*dim.WidthMM + dim.LengthMM*dim.HeightMM + dim.WidthMM*dim.HeightMM)

	stats := &stl.MeshStats{
		TriangleCount:  12, // procedural box
		VolumeMM3:      netSolidVolMM3,
		VolumeCM3:      netSolidVolCM3,
		SurfaceAreaMM2: surfaceAreaMM2,
		BoundingBox: stl.BoundingBox{
			SizeX: dim.LengthMM,
			SizeY: dim.WidthMM,
			SizeZ: dim.HeightMM,
		},
		IsWatertight: true,
	}

	params := domain.SlicingParams{
		Material:      req.Material,
		InfillDensity: req.InfillDensity,
		HasSupports:   req.HasSupports,
		ColorHex:      req.ColorHex,
	}

	priceResult := u.pricingCalc.Calculate(stats, params, config)

	return &InstantQuoteResponse{
		MeshStats: stats,
		Pricing:   priceResult,
	}, nil
}
