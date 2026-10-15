package http

import (
	"encoding/json"
	"net/http"
	"strings"

	"3dkemasansaas/internal/domain"
	"3dkemasansaas/pkg/response"
	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	repo domain.CategoryRepository
}

func NewCategoryHandler(repo domain.CategoryRepository) *CategoryHandler {
	return &CategoryHandler{repo: repo}
}

func (h *CategoryHandler) ListCategories(c *gin.Context) {
	categories, err := h.repo.List()
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar kategori dari database: "+err.Error())
		return
	}
	response.Success(c, http.StatusOK, "Berhasil memuat master kategori kemasan", categories)
}

func (h *CategoryHandler) SaveCategories(c *gin.Context) {
	var body json.RawMessage
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "Payload tidak valid: "+err.Error(), nil)
		return
	}

	// Case 1: Array of categories passed
	var list []domain.Category
	if err := json.Unmarshal(body, &list); err == nil && len(list) > 0 {
		for i := range list {
			list[i].ID = strings.ToUpper(strings.TrimSpace(list[i].ID))
			if err := h.repo.Upsert(&list[i]); err != nil {
				response.InternalServerError(c, "Gagal menyimpan kategori ke database: "+err.Error())
				return
			}
		}
		updated, _ := h.repo.List()
		response.Success(c, http.StatusOK, "Kategori berhasil diperbarui di database", updated)
		return
	}

	// Case 2: Single category passed
	var single domain.Category
	if err := json.Unmarshal(body, &single); err == nil && single.ID != "" {
		single.ID = strings.ToUpper(strings.TrimSpace(single.ID))
		if err := h.repo.Upsert(&single); err != nil {
			response.InternalServerError(c, "Gagal menyimpan kategori ke database: "+err.Error())
			return
		}
		updated, _ := h.repo.List()
		response.Success(c, http.StatusOK, "Kategori berhasil disimpan di database", updated)
		return
	}

	response.BadRequest(c, "Format data kategori tidak dikenali", nil)
}

func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		id = c.Query("id")
	}
	id = strings.ToUpper(strings.TrimSpace(id))

	if id == "" {
		response.BadRequest(c, "ID kategori wajib diisi", nil)
		return
	}

	if err := h.repo.Delete(id); err != nil {
		response.InternalServerError(c, "Gagal menghapus kategori dari database: "+err.Error())
		return
	}

	updated, _ := h.repo.List()
	response.Success(c, http.StatusOK, "Kategori berhasil dihapus dari database", updated)
}
