package domain

import "errors"

var (
	ErrTenantNotFound       = errors.New("tenant tidak ditemukan")
	ErrTenantInactive       = errors.New("tenant sedang non-aktif atau disuspend")
	ErrUserNotFound         = errors.New("user tidak ditemukan")
	ErrInvalidCredentials   = errors.New("email atau password salah")
	ErrUnauthorized         = errors.New("akses ditolak")
	ErrForbidden            = errors.New("anda tidak memiliki hak akses ke resource ini")
	ErrProductNotFound      = errors.New("produk 3D tidak ditemukan")
	ErrOrderNotFound        = errors.New("pesanan tidak ditemukan")
	ErrInvalid3DFile        = errors.New("format file 3D tidak valid atau rusak")
	ErrNonManifoldMesh      = errors.New("model 3D memiliki lubang atau non-manifold mesh")
	ErrSlicingFailed        = errors.New("gagal melakukan slicing pada model 3D")
	ErrAIGenerationTimeout  = errors.New("proses generate AI 3D melebihi batas waktu")
)
