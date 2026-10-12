package http

import (
	"net/http"

	"3dkemasansaas/internal/domain"
	"3dkemasansaas/internal/middleware"
	"3dkemasansaas/internal/usecase"
	"3dkemasansaas/pkg/response"

	"github.com/gin-gonic/gin"
)

type CalculatorHandler struct {
	calcUsecase usecase.CalculatorUsecase
}

func NewCalculatorHandler(calcUsecase usecase.CalculatorUsecase) *CalculatorHandler {
	return &CalculatorHandler{calcUsecase: calcUsecase}
}

// CalculateSTLQuote calculates instant price from uploaded .stl file
func (h *CalculatorHandler) CalculateSTLQuote(c *gin.Context) {
	tenant, _ := middleware.GetTenantFromGin(c)
	pricingConfig := domain.TenantPricingConfig{
		FilamentMarkupPct: 30.0,
		MachineHourlyRate: 15000.0,
		MinOrderPrice:     25000.0,
		PackagingFee:      5000.0,
	}
	if tenant != nil {
		pricingConfig = tenant.PricingConfig
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		response.BadRequest(c, "File STL (.stl) diperlukan pada form-data 'file'", err.Error())
		return
	}

	src, err := fileHeader.Open()
	if err != nil {
		response.InternalServerError(c, "Gagal membaca file STL")
		return
	}
	defer src.Close()

	material := domain.FilamentMaterial(c.DefaultPostForm("material", string(domain.MaterialPLA)))
	infill := 20
	if c.PostForm("infill_density") != "" {
		_ = c.ShouldBindQuery(&infill)
	}

	req := usecase.InstantQuoteRequest{
		Material:      material,
		InfillDensity: infill,
		HasSupports:   c.PostForm("has_supports") == "true",
		ColorHex:      c.DefaultPostForm("color_hex", "#FFFFFF"),
	}

	res, err := h.calcUsecase.CalculateFromSTL(src, req, pricingConfig)
	if err != nil {
		response.BadRequest(c, "Gagal mengkalkulasi model 3D: "+err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Kalkulasi model 3D berhasil", res)
}

type ParametricQuoteDTO struct {
	Dimensions domain.PackagingDimensions `json:"dimensions" binding:"required"`
	Material   domain.FilamentMaterial    `json:"material"`
	Infill     int                        `json:"infill_density"`
	Supports   bool                       `json:"has_supports"`
	ColorHex   string                     `json:"color_hex"`
}

// CalculateParametricQuote calculates instant price for 3D packaging editor sliders (P x L x T)
func (h *CalculatorHandler) CalculateParametricQuote(c *gin.Context) {
	tenant, _ := middleware.GetTenantFromGin(c)
	pricingConfig := domain.TenantPricingConfig{
		FilamentMarkupPct: 30.0,
		MachineHourlyRate: 15000.0,
		MinOrderPrice:     25000.0,
		PackagingFee:      5000.0,
	}
	if tenant != nil {
		pricingConfig = tenant.PricingConfig
	}

	var dto ParametricQuoteDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.BadRequest(c, "Format input dimensi tidak valid", err.Error())
		return
	}

	if dto.Material == "" {
		dto.Material = domain.MaterialPLA
	}
	if dto.Infill <= 0 {
		dto.Infill = 20
	}

	req := usecase.InstantQuoteRequest{
		Material:      dto.Material,
		InfillDensity: dto.Infill,
		HasSupports:   dto.Supports,
		ColorHex:      dto.ColorHex,
	}

	res, err := h.calcUsecase.CalculateFromDimensions(dto.Dimensions, req, pricingConfig)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Kalkulasi kemasan parametrik berhasil", res)
}
