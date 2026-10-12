# 🛠️ Developer & System Skills Guide
## Panduan Keterampilan & SOP Pengembangan (AI & 3D SaaS)

---

## 1. Skillset yang Dibutuhkan untuk Proyek Ini

### A. Backend Engineering (Go)
* **Go Concurrency & Task Queue**: Manajemen goroutines, channel, dan worker queue menggunakan **Asynq / Redis** untuk memproses task slicing & AI.
* **Multi-Tenant Architecture**: Implementasi middleware host-based routing, isolasi data berbasis tenant_id, dan dynamic branding configuration.
* **REST & Realtime Delivery**: Pembuatan REST API standar, SSE (Server-Sent Events) / WebSockets untuk progress bar kalkulasi 3D.

### B. 3D & Computational Geometry
* **File Format Parsing**: Memahami perbedaan `.stl`, `.obj`, `.step`, dan `.glb`.
* **Headless Slicing CLI**: Integrasi PrusaSlicer CLI / CuraEngine via CLI / Docker wrapper di backend Go.
* **Mesh Analysis**: Menghitung volume mesh ($V = \sum \frac{1}{6} (v_1 \times v_2) \cdot v_3$), bounding box, dan manifold check (watertight).

### C. AI 3D & Computer Vision Integration
* **2D-to-3D Pipeline**: Integrasi model AI (Trellis / TripoSR / Stable Fast 3D / Relief Extruder) melalui worker Python microservice atau External SaaS GPU API.
* **Prompt Engineering untuk 3D**: Template prompt otomatis untuk menghasilkan model kemasan yang memiliki struktur solid dan simetris.

### D. Frontend 3D (Next.js + Three.js)
* **React Three Fiber (@react-three/fiber & @react-three/drei)**:
  * Viewer 3D interaktif (orbit controls, lighting studio, realistic shadow).
  * Material switcher (mengganti warna filamen / tekstur matte / glossy).
  * Dimensi visualizer (menampilkan garis penggaris ukuran $P \times L \times T$ pada canvas 3D).

---

## 2. Standard Operating Procedures (SOP)

### A. Alur Penambahan Fitur Baru (Feature Flow)
1. Definisikan entitas dan interface di `internal/domain/`.
2. Implementasikan query database di `internal/repository/` (selalu filter `tenant_id`).
3. Buat business logic di `internal/usecase/`.
4. Expose melalui handler di `internal/delivery/http/` dan daftarkan router.
5. Jika butuh proses berat (>500ms), delegasikan ke `internal/delivery/worker/`.

### B. Pengetesan File 3D (Sanity Check)
Sebelum memproses pesanan ke printer:
1. Validasi bounding box tidak melebihi volume build plate mesin (misal: $220 \times 220 \times 250$ mm).
2. Validasi file tidak corrupt dan tidak memiliki lubang (*non-manifold*).
3. Jalankan kalkulasi estimasi waktu dan berat filamen.
