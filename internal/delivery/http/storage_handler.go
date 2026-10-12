package http

import (
	"net/http"

	"3dkemasansaas/internal/middleware"
	"3dkemasansaas/internal/service/storage"
	"3dkemasansaas/pkg/jwt"
	"3dkemasansaas/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type StorageHandler struct {
	storageService storage.StorageService
}

func NewStorageHandler(storageService storage.StorageService) *StorageHandler {
	return &StorageHandler{storageService: storageService}
}

// UploadAsset uploads 3D files (.stl, .glb) or brand logos (.png, .svg)
func (h *StorageHandler) UploadAsset(c *gin.Context) {
	// 1. Get Tenant context (either from custom domain resolver or auth claims)
	var tenantID uuid.UUID
	if tenant, exists := middleware.GetTenantFromGin(c); exists {
		tenantID = tenant.ID
	} else if claimsVal, exists := c.Get(middleware.GinUserClaimsKey); exists {
		claims := claimsVal.(*jwt.JWTClaims)
		if claims.TenantID != nil {
			tenantID = *claims.TenantID
		}
	}

	if tenantID == uuid.Nil {
		response.BadRequest(c, "Tenant ID tidak terdeteksi", nil)
		return
	}

	// 2. Read Multipart form file
	fileHeader, err := c.FormFile("file")
	if err != nil {
		response.BadRequest(c, "Field 'file' wajib diisi", err.Error())
		return
	}

	if fileHeader.Size > storage.MaxFileSize {
		response.BadRequest(c, "Ukuran file melebihi 50MB", nil)
		return
	}

	src, err := fileHeader.Open()
	if err != nil {
		response.InternalServerError(c, "Gagal membaca file upload")
		return
	}
	defer src.Close()

	folder := c.DefaultPostForm("folder", "assets") // e.g. "models", "logos", "textures"

	// 3. Save via Storage Service
	fileURL, err := h.storageService.Upload(tenantID, folder, fileHeader.Filename, src)
	if err != nil {
		response.BadRequest(c, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "File berhasil diunggah", gin.H{
		"file_url":  fileURL,
		"filename":  fileHeader.Filename,
		"size_bytes": fileHeader.Size,
	})
}
