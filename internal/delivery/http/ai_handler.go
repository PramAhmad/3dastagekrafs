package http

import (
	"net/http"

	"3dkemasansaas/internal/domain"
	"3dkemasansaas/internal/middleware"
	"3dkemasansaas/internal/service/ai"
	"3dkemasansaas/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AIHandler struct {
	aiService ai.AIService
}

func NewAIHandler(aiService ai.AIService) *AIHandler {
	return &AIHandler{aiService: aiService}
}

// Generate3DAsset handles prompt or 2D image conversion to 3D models
func (h *AIHandler) Generate3DAsset(c *gin.Context) {
	tenantID, exists := middleware.GetTenantID(c.Request.Context())
	if !exists {
		// Fallback for public demo
		tenantID = uuid.New()
	}

	var req domain.AIGenerateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Format input request AI tidak valid", err.Error())
		return
	}

	if req.JobType == "" {
		req.JobType = domain.AIJobTypeTextTo3DModel
	}

	res, err := h.aiService.SubmitGenerationJob(c.Request.Context(), tenantID, req)
	if err != nil {
		response.InternalServerError(c, "Gagal memproses job AI 3D: "+err.Error())
		return
	}

	response.Success(c, http.StatusAccepted, "Job AI 3D generation berhasil diproses", res)
}
