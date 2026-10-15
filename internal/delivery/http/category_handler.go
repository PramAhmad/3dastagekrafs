package http

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"3dkemasansaas/pkg/response"
	"github.com/gin-gonic/gin"
)

type CategoryMaster struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	ImageURL     string `json:"image_url"`
	IconName     string `json:"icon_name"`
	IsActive     bool   `json:"is_active"`
	DisplayOrder int    `json:"display_order"`
}

var defaultCategories = []CategoryMaster{
	{ID: "BOX", Name: "Kotak / Box", Description: "Kemasan kotak kardus corrugated & art paper universal untuk e-commerce, sabun, dan parfum.", ImageURL: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&auto=format&fit=crop&q=80", IsActive: true, DisplayOrder: 1},
	{ID: "POUCH", Name: "Standing Pouch", Description: "Kantong kemasan fleksibel berdiri dengan segel zipper kedap udara untuk kopi dan snack.", ImageURL: "https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?w=300&auto=format&fit=crop&q=80", IsActive: true, DisplayOrder: 2},
	{ID: "JAR", Name: "Toples / Jar", Description: "Wadah silinder mulus dengan tutup ulir rapat untuk krim wajah, skincare, dan lulur.", ImageURL: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80", IsActive: true, DisplayOrder: 3},
	{ID: "BOTTLE", Name: "Botol Kosmetik & Pump", Description: "Botol silinder modern dengan dispenser head untuk serum, sabun cair, dan lotion.", ImageURL: "https://images.unsplash.com/photo-1608248597359-598971f114c0?w=300&auto=format&fit=crop&q=80", IsActive: true, DisplayOrder: 4},
	{ID: "CAN", Name: "Kaleng (Tin Can)", Description: "Tabung kaleng metalik vintage dengan tutup timbul untuk teh artisan dan biskuit.", ImageURL: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80", IsActive: true, DisplayOrder: 5},
	{ID: "TRIANGLE", Name: "Prisma Segitiga", Description: "Kemasan prisma 3 sisi geometris untuk cokelat batangan dan slice cake.", ImageURL: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=300&auto=format&fit=crop&q=80", IsActive: true, DisplayOrder: 6},
	{ID: "CUP", Name: "Paper Cup", Description: "Gelas kertas kerucut dengan tutup plastik lid untuk kafe dan minuman.", ImageURL: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=300&auto=format&fit=crop&q=80", IsActive: true, DisplayOrder: 7},
	{ID: "PILLOW", Name: "Pillow Box", Description: "Kotak lengkung bentuk bantal elegan yang mudah dilipat untuk hijab dan gift.", ImageURL: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300&auto=format&fit=crop&q=80", IsActive: true, DisplayOrder: 8},
	{ID: "CLIP", Name: "Klip Segel Kemasan", Description: "Klip pengunci kedap udara untuk kemasan plastik snack dan biji kopi UMKM.", ImageURL: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80", IsActive: true, DisplayOrder: 9},
}

type CategoryHandler struct {
	filePath string
	mu       sync.RWMutex
}

func NewCategoryHandler(storageDir string) *CategoryHandler {
	_ = os.MkdirAll(storageDir, 0755)
	filePath := filepath.Join(storageDir, "categories.json")

	h := &CategoryHandler{filePath: filePath}
	// Initialize default file if not exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		_ = h.saveToFile(defaultCategories)
	}
	return h
}

func (h *CategoryHandler) saveToFile(cats []CategoryMaster) error {
	bytes, err := json.MarshalIndent(cats, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(h.filePath, bytes, 0644)
}

func (h *CategoryHandler) readFromFile() ([]CategoryMaster, error) {
	bytes, err := os.ReadFile(h.filePath)
	if err != nil {
		return defaultCategories, nil
	}
	var cats []CategoryMaster
	if err := json.Unmarshal(bytes, &cats); err != nil {
		return defaultCategories, nil
	}
	return cats, nil
}

func (h *CategoryHandler) ListCategories(c *gin.Context) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	cats, _ := h.readFromFile()
	response.Success(c, http.StatusOK, "Berhasil memuat master kategori kemasan", cats)
}

func (h *CategoryHandler) SaveCategories(c *gin.Context) {
	h.mu.Lock()
	defer h.mu.Unlock()

	var body json.RawMessage
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "Payload tidak valid: "+err.Error(), nil)
		return
	}

	var list []CategoryMaster
	if err := json.Unmarshal(body, &list); err == nil {
		// Array passed
		if err := h.saveToFile(list); err != nil {
			response.InternalServerError(c, "Gagal menyimpan kategori ke server")
			return
		}
		response.Success(c, http.StatusOK, "Kategori berhasil diperbarui di server", list)
		return
	}

	var single CategoryMaster
	if err := json.Unmarshal(body, &single); err == nil && single.ID != "" {
		current, _ := h.readFromFile()
		single.ID = strings.ToUpper(strings.TrimSpace(single.ID))

		found := false
		for i, c := range current {
			if strings.EqualFold(c.ID, single.ID) {
				current[i] = single
				found = true
				break
			}
		}
		if !found {
			current = append([]CategoryMaster{single}, current...)
		}

		if err := h.saveToFile(current); err != nil {
			response.InternalServerError(c, "Gagal menyimpan kategori ke server")
			return
		}
		response.Success(c, http.StatusOK, "Kategori berhasil disimpan di server", current)
		return
	}

	response.BadRequest(c, "Format kategori tidak dikenali", nil)
}

func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	h.mu.Lock()
	defer h.mu.Unlock()

	id := c.Param("id")
	if id == "" {
		id = c.Query("id")
	}

	current, _ := h.readFromFile()
	var updated []CategoryMaster
	for _, c := range current {
		if !strings.EqualFold(c.ID, id) {
			updated = append(updated, c)
		}
	}

	_ = h.saveToFile(updated)
	response.Success(c, http.StatusOK, "Kategori berhasil dihapus dari server", updated)
}
