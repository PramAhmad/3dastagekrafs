package storage

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

var (
	ErrInvalidFileType = errors.New("tipe file tidak didukung. Format yang diizinkan: .stl, .obj, .step, .glb, .gltf, .png, .jpg, .jpeg, .svg")
	ErrFileTooLarge    = errors.New("ukuran file melebihi batas maksimum (50MB)")
)

const MaxFileSize = 50 * 1024 * 1024 // 50MB

var AllowedExtensions = map[string]bool{
	".stl":  true,
	".obj":  true,
	".step": true,
	".stp":  true,
	".glb":  true,
	".gltf": true,
	".png":  true,
	".jpg":  true,
	".jpeg": true,
	".svg":  true,
}

type StorageService interface {
	Upload(tenantID uuid.UUID, folder string, originalFilename string, src io.Reader) (string, error)
	Delete(fileURL string) error
	GetBaseURL() string
}

type localStorageService struct {
	baseDir string
	baseURL string
}

func NewLocalStorageService(baseDir, baseURL string) StorageService {
	_ = os.MkdirAll(baseDir, 0755)
	return &localStorageService{
		baseDir: baseDir,
		baseURL: baseURL,
	}
}

func (s *localStorageService) Upload(tenantID uuid.UUID, folder string, originalFilename string, src io.Reader) (string, error) {
	ext := strings.ToLower(filepath.Ext(originalFilename))
	if !AllowedExtensions[ext] {
		return "", ErrInvalidFileType
	}

	// Create unique filename: {random_uuid}{ext}
	newFilename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	targetDir := filepath.Join(s.baseDir, tenantID.String(), folder)

	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return "", fmt.Errorf("gagal membuat direktori storage: %w", err)
	}

	targetPath := filepath.Join(targetDir, newFilename)
	dst, err := os.Create(targetPath)
	if err != nil {
		return "", fmt.Errorf("gagal membuat file tujuan: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("gagal menulis isi file: %w", err)
	}

	// Return public accessible URL path
	return fmt.Sprintf("%s/uploads/%s/%s/%s", s.baseURL, tenantID.String(), folder, newFilename), nil
}

func (s *localStorageService) Delete(fileURL string) error {
	// Strip baseURL to get relative path
	relPath := strings.TrimPrefix(fileURL, s.baseURL+"/uploads/")
	fullPath := filepath.Join(s.baseDir, relPath)
	return os.Remove(fullPath)
}

func (s *localStorageService) GetBaseURL() string {
	return s.baseURL
}
