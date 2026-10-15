package http

import (
	"fmt"
	"net/http"

	"3dkemasansaas/internal/domain"
	"3dkemasansaas/internal/usecase"
	"3dkemasansaas/pkg/response"

	"github.com/gin-gonic/gin"
)

type TemplateHandler struct {
	templateUsecase usecase.TemplateUsecase
}

func NewTemplateHandler(templateUsecase usecase.TemplateUsecase) *TemplateHandler {
	return &TemplateHandler{templateUsecase: templateUsecase}
}

func (h *TemplateHandler) ListTemplates(c *gin.Context) {
	templates := h.templateUsecase.GetCatalog()
	response.Success(c, http.StatusOK, "Berhasil memuat katalog template kemasan", templates)
}

func (h *TemplateHandler) GetTemplateDetail(c *gin.Context) {
	id := c.Param("id")
	template, err := h.templateUsecase.GetByID(id)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Berhasil memuat detail template", template)
}

func (h *TemplateHandler) CreateTemplate(c *gin.Context) {
	var tmpl domain.PackagingTemplate
	var input struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Category    string `json:"category"`
		Description string `json:"description"`
		PreviewURL  string `json:"preview_url"`
		IsPrintable bool   `json:"is_printable"`
		Constraints map[string]struct {
			MinMM   float64 `json:"min_mm"`
			MaxMM   float64 `json:"max_mm"`
			Default float64 `json:"default_mm"`
			StepMM  float64 `json:"step_mm"`
		} `json:"constraints"`
		DefaultDimensions map[string]float64 `json:"default_dimensions"`
	}
	_ = tmpl

	var template domain.PackagingTemplate
	if err := c.ShouldBindJSON(&template); err != nil {
		response.BadRequest(c, "Payload template tidak valid: "+err.Error(), nil)
		return
	}

	created, err := h.templateUsecase.CreateTemplate(template)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}
	_ = input
	response.Success(c, http.StatusCreated, "Template model kemasan berhasil ditambahkan", created)
}

// UpdateTemplate updates an existing template
func (h *TemplateHandler) UpdateTemplate(c *gin.Context) {
	id := c.Param("id")
	var template domain.PackagingTemplate
	if err := c.ShouldBindJSON(&template); err != nil {
		response.BadRequest(c, "Payload template tidak valid: "+err.Error(), nil)
		return
	}

	updated, err := h.templateUsecase.UpdateTemplate(id, template)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Template model kemasan berhasil diperbarui", updated)
}

// DeleteTemplate deletes a template
func (h *TemplateHandler) DeleteTemplate(c *gin.Context) {
	id := c.Param("id")
	if err := h.templateUsecase.DeleteTemplate(id); err != nil {
		response.NotFound(c, err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Template model kemasan berhasil dihapus", nil)
}

func (h *TemplateHandler) GenerateSTL(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Dimensions map[string]float64 `json:"dimensions"`
	}
	_ = c.ShouldBindJSON(&req)

	stlBytes, stats, filename, err := h.templateUsecase.GenerateSTL(id, req.Dimensions)
	if err != nil {
		response.BadRequest(c, "Gagal generate model STL: "+err.Error(), nil)
		return
	}

	// Check if user requested direct binary download (?download=true)
	if c.Query("download") == "true" {
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
		c.Data(http.StatusOK, "application/octet-stream", stlBytes)
		return
	}

	response.Success(c, http.StatusOK, "Model 3D STL berhasil digenerate secara prosedural", gin.H{
		"filename":     filename,
		"size_bytes":   len(stlBytes),
		"mesh_stats":   stats,
		"download_url": fmt.Sprintf("/api/v1/templates/%s/export-stl?download=true", id),
	})
}
