# 📐 Standarisasi Kode, Arsitektur & AI
## Go Backend Multi-Tenant & AI 3D Printing System

---

## 1. Standarisasi Arsitektur Backend (Clean / Hexagonal Architecture)

Struktur direktori Go diatur dengan standar berikut:

```text
.
├── cmd/
│   ├── api/             # Entrypoint server HTTP REST API
│   └── worker/          # Entrypoint background worker (slicing, AI jobs)
├── internal/
│   ├── config/          # Environment configuration
│   ├── domain/          # Entity models, interfaces, domain errors (pure Go, no external deps)
│   ├── middleware/      # Tenant resolver, Auth JWT, CORS, Rate Limiter
│   ├── usecase/         # Business logic (order, slicer, tenant, ai_generation)
│   ├── repository/      # Database implementation (PostgreSQL / GORM / pgx)
│   ├── delivery/
│   │   └── http/        # HTTP handlers, DTO request/response, validation
│   └── service/         # External integrations (S3/MinIO, Slicer CLI, AI Providers)
├── pkg/
│   ├── slicer/          # Helper kalkulasi volume & parser G-code
│   └── utils/           # Helper utility umum
├── migrations/          # SQL migration files
├── docker-compose.yml
├── Makefile
├── go.mod
└── go.sum
```

---

## 2. Aturan Multi-Tenancy (Shared Database)

### 2.1 Schema & Table Rule
Setiap tabel yang berelasi dengan data tenant **WAJIB** memiliki kolom:
```sql
tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
```
Tambahkan index gabungan pada tabel:
```sql
CREATE INDEX idx_products_tenant ON products(tenant_id, id);
CREATE INDEX idx_orders_tenant ON orders(tenant_id, id);
```

### 2.2 Tenant Middleware Contract
1. Middleware mengecek header `Host` (atau `X-Tenant-Domain` untuk testing lokal).
2. Mengecek cache Redis untuk domain tersebut. Jika miss, query DB `tenants WHERE domain = :host OR subdomain = :subdomain`.
3. Set `tenant_id` ke dalam Go `context.Context`:
   ```go
   type contextKey string
   const TenantKey contextKey = "tenant_id"
   
   func SetTenant(ctx context.Context, tenantID uuid.UUID) context.Context {
       return context.WithValue(ctx, TenantKey, tenantID)
   }
   
   func GetTenant(ctx context.Context) (uuid.UUID, error) {
       val, ok := ctx.Value(TenantKey).(uuid.UUID)
       if !ok {
           return uuid.Nil, ErrTenantNotFound
       }
       return val, nil
   }
   ```
4. Setiap Query Repository **WAJIB** menyertakan filter `tenant_id = ?` untuk mencegah *data leak* antar UMKM.

---

## 3. Standarisasi Integrasi AI & Slicer (Async Processing)

Karena proses AI Generative (2D to 3D) dan 3D Slicing memakan waktu beberapa detik hingga menit:
1. **Dilarang Blocking Request**: Endpoint API HTTP hanya bertindak sebagai penerima task, menyimpan status `PENDING`, dan mengirimkan job ke Redis Queue (`asynq`).
2. **Real-Time Update**:
   * Frontend dapat melakukan polling status `GET /api/v1/jobs/:job_id` ATAU menggunakan **SSE (Server-Sent Events) / WebSocket** untuk streaming progres:
     - `10% - Validating Mesh`
     - `40% - Generating 3D Geometry`
     - `75% - Slicing & Calculating Cost`
     - `100% - Ready`
3. **Format Standard Model**:
   * Output visual browser: Selalu hasilkan file `.glb` yang sudah di-kompresi dengan Draco compression.
   * Output manufaktur: File `.stl` biner (binary STL) untuk efisiensi ukuran.

---

## 4. Standarisasi Error Handling & Response API

Format JSON API seragam:
```json
// Success Response
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 10, "total": 100 } // opsional untuk pagination
}

// Error Response
{
  "success": false,
  "error": {
    "code": "SLICER_MESH_NON_MANIFOLD",
    "message": "File 3D memiliki celah/bolong dan tidak dapat diproses untuk cetak.",
    "details": []
  }
}
```

---

## 5. Security & File Validation Rules
* File upload hanya menerima ekstensi: `.stl`, `.obj`, `.step`, `.glb`, `.gltf`, `.png`, `.jpg`, `.svg`.
* Batas ukuran upload (Max payload): **50MB** per file 3D.
* Sanitasi file nama (UUID format saat disimpan di object storage).
