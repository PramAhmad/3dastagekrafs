# 📐 Standarisasi Desain SVG Dieline & Sinkronisasi Model 3D (AstaKraf Standard)

Dokumen ini merupakan panduan spesifikasi teknis resmi (**AstaKraf Packaging Dieline Specification v1.0**) untuk pembuatan, impor, dan ekspor pola vektor SVG jaring-jaring kemasan (*dieline*) agar sinkron 100% dengan model 3D (Three.js WebGL / GLB) di AstaKraf.

Standar ini mengadopsi konvensi industri percetakan internasional (**FEFCO / ECMA / ArtiosCAD**) dan standar visualisasi kemasan digital modern (**AstaKraft / 3DPAKS**).

---

## 1. 📏 Satuan Ukuran & ViewBox Fisik

Semua dimensi desain harus berpatokan pada **ukuran fisik nyata (Milimeter / mm)**.

### Aturan Skala SVG:
- **1 Unit SVG = 1 Milimeter (mm)**.
- Atribut `width` dan `height` pada elemen root `<svg>` **wajib** mencantumkan unit `mm`.
- `viewBox` wajib menggunakan rasio $1:1$ terhadap ukuran lembaran datar kemasan ($W_{\text{total}} \times H_{\text{total}}$).

```xml
<!-- Contoh lembaran total 380mm x 460mm -->
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="0 0 380 460" 
  width="380mm" 
  height="460mm"
  data-unit="mm"
>
```

### Tabel Konversi Resolusi Rendering:
| Target | Resolusi | Rumus Konversi (mm ke px) | Penggunaan |
| :--- | :--- | :--- | :--- |
| **Web 3D Texture** | 150 DPI | `px = (mm / 25.4) * 150` | Tekstur real-time Three.js (cepat & tajam) |
| **High-Res Print** | 300 DPI | `px = (mm / 25.4) * 300` | Ekspor siap cetak offset / digital printing |

---

## 2. 🎨 Standar Garis & Warna (Layer CAD Percetakan)

Mesin 3D dan mesin pisau pond (die-cutter) membaca layer berdasarkan atribut warna `stroke`, `stroke-dasharray`, dan `id`/`class`:

| Jenis Garis | Warna Heksadesimal | Stroke Style | Tebal | Fungsi Percetakan & 3D |
| :--- | :--- | :--- | :--- | :--- |
| **Cut Lines (Pisau Potong)** | `#E11D48` *(Solid Red)* | `solid` | `1.0 - 1.2 pt` | Batas potong putus karton luar & lubang |
| **Crease / Score (Garis Lipat)** | `#10B981` *(Green)* | `dashed` (`4 3`) | `0.8 - 1.0 pt` | Garis lipatan / tekukan engsel 3D |
| **Perforation (Cacah/Sobek)** | `#8B5CF6` *(Purple)* | `dotted` (`1.5 2`) | `0.8 pt` | Garis segel pembuka kemasan |
| **Bleed Margin (Lebih Desain)**| `#EC4899` *(Pink/Magenta)*| `dashed` (`2 2`) | `0.5 pt` | Batas warna lebih (+3 mm dari cut) |
| **Safe Zone (Batas Aman Teks)**| `#06B6D4` *(Cyan)* | `dotted` (`1 2`) | `0.5 pt` | Batas aman logo/teks (-3 mm dari cut) |
| **Dimensions / Guides** | `#2563EB` *(Blue)* | `solid` | `0.5 pt` | Keterangan ukuran mm (disembunyikan di 3D) |

---

## 3. 🏷️ Semantic Panel & Face Tagging (`data-face`)

Agar Three.js dapat mengetahui bagian mana yang merupakan sisi **Depan**, **Belakang**, **Tutup Atas**, atau **Lidah Lem**, setiap panel utama harus ditandai dengan atribut `data-face`:

| Atribut `data-face` | Nama Sisi Fisik | Orientasi Grafis | Posisi pada Model 3D |
| :--- | :--- | :--- | :--- |
| `data-face="front"` | Muka Depan Utama | Normal (Atas = Up) | Sisi depan viewport 3D |
| `data-face="back"` | Muka Belakang | Normal (Atas = Up) | Sisi belakang kemasan |
| `data-face="left"` | Dinding Samping Kiri | Normal (Atas = Up) | Sisi kiri kemasan |
| `data-face="right"` | Dinding Samping Kanan| Normal (Atas = Up) | Sisi kanan kemasan |
| `data-face="top"` | Tutup Atas (*Lid / Top Flap*)| **Tergantung engsel lipatan** | Bagian atap kemasan |
| `data-face="bottom"` | Alas Bawah (*Base*) | Normal | Bagian dasar lantai kemasan |
| `data-face="glue-flap"` | Lidah Lem (*Glue Tab*) | - | Bagian tersembunyi sambungan lem |
| `data-face="dust-flap"` | Kuping Pengunci Debu | - | Lipatan samping penahan debu |

> [!IMPORTANT]
> **Aturan Orientasi Desain Cetak:**
> Pada tutup atas (*Lid / Top Flap*) yang melipat dari dinding belakang ke arah depan, grafik teks/logo biasanya harus diputar **180 derajat (terbalik di bidang datar 2D)** agar saat ditutup dan dilihat dari depan pada model 3D, posisinya tegak lurus sempurna.

---

## 4. 📂 Struktur Hierarki Elemen SVG (DOM Tree)

SVG harus disusun dalam grup (`<g>`) yang terpisah secara bersih:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 460" width="380mm" height="460mm">
  <defs>
    <!-- Metadata Spesifikasi Dimensi AstaKraf -->
    <astakraf:meta 
      xmlns:astakraf="https://kemasan3d.id/schema/v1"
      style="fefco-0427"
      length="180"
      width="120"
      height="60"
      caliper="1.5"
      unit="mm"
    />
    
    <style>
      .cut-line { stroke: #e11d48; stroke-width: 1.2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .crease-line { stroke: #10b981; stroke-width: 1.0; stroke-dasharray: 4 3; fill: none; }
      .perf-line { stroke: #8b5cf6; stroke-width: 0.8; stroke-dasharray: 1.5 2; fill: none; }
      .bleed-line { stroke: #ec4899; stroke-width: 0.5; stroke-dasharray: 2 2; fill: none; }
      .safe-line { stroke: #06b6d4; stroke-width: 0.5; stroke-dasharray: 1 2; fill: none; }
      .panel-zone { fill: transparent; }
    </style>
  </defs>

  <!-- 1. LAYER ALAS KERTAS / LEMBARAN DASAR -->
  <g id="layer-sheet">
    <rect width="100%" height="100%" fill="#ffffff" />
  </g>

  <!-- 2. LAYER SEMANTIC PANELS (Untuk deteksi klik & mapping tekstur per sisi) -->
  <g id="layer-panels" class="panel-zone">
    <rect id="panel-front" data-face="front" x="80" y="80" width="180" height="60" />
    <rect id="panel-bottom" data-face="bottom" x="80" y="140" width="180" height="120" />
    <rect id="panel-back" data-face="back" x="80" y="260" width="180" height="60" />
    <rect id="panel-top" data-face="top" x="80" y="320" width="180" height="120" />
    <rect id="panel-left" data-face="left" x="20" y="140" width="60" height="120" />
    <rect id="panel-right" data-face="right" x="260" y="140" width="60" height="120" />
  </g>

  <!-- 3. LAYER ARTWORK / DESAIN GRAFIS (Gambar, Warna, Logo, Teks) -->
  <g id="layer-artwork">
    <!-- Elemen desain pengguna ditempatkan di sini -->
  </g>

  <!-- 4. LAYER BLEED & SAFE ZONE (Panduan Margin) -->
  <g id="layer-guides">
    <!-- Garis batas bleed & safe area -->
  </g>

  <!-- 5. LAYER CREASE / SCORE (Garis Lipat Tekuk) -->
  <g id="layer-crease" class="crease-line">
    <line x1="80" y1="140" x2="260" y2="140" />
    <line x1="80" y1="260" x2="260" y2="260" />
    <line x1="80" y1="320" x2="260" y2="320" />
    <line x1="80" y1="140" x2="80" y2="260" />
    <line x1="260" y1="140" x2="260" y2="260" />
  </g>

  <!-- 6. LAYER CUT LINES (Pisau Potong Luar) -->
  <g id="layer-cut" class="cut-line">
    <path d="M 80,80 L 260,80 L 260,140 ... Z" />
  </g>

  <!-- 7. LAYER ANNOTATIONS (Dimensi & Tulisan Teknis) -->
  <g id="layer-annotations">
    <text x="15" y="25" font-family="sans-serif" font-size="9" font-weight="bold" fill="#0f172a">
      FEFCO 0427 Mailer Box — 180 × 120 × 60 mm (Karton: 1.5mm)
    </text>
  </g>
</svg>
```

---

## 5. 🔄 Formula Sinkronisasi UV 2D Dieline ke 3D WebGL (Three.js)

Saat tekstur Dieline diterapkan pada model 3D (Mesh Kemasan):

1. **Normalisasi Koordinat UV**:
   Koordinat fisik piksel $(X, Y)$ pada bidang SVG 2D dikonversikan ke UV Space $(U, V) \in [0, 1]$:
   $$U = \frac{X}{W_{\text{total}}}$$
   $$V = 1.0 - \frac{Y}{H_{\text{total}}} \quad \text{(karena sistem koordinat Y Three.js terbalik dari SVG)}$$

2. **Deteksi Otomatis Bounding Box Panel**:
   Mesin 3D memindai elemen bertanda `data-face="front"`, mengambil `x, y, width, height`, lalu secara presisi memetakan stiker artwork pelanggan langsung ke muka kubus 3D yang sesuai tanpa bocor ke sisi sebelah.

---

## 6. 🧴 Standarisasi Khusus Model Silinder, Botol, Tube & Kaleng (Cylindrical Wrap Label)

Untuk kemasan silindris (seperti botol spray kosmetik, kaleng aluminium, jar, atau botol kaca), dieline berupa lembaran stiker wrap yang melingkar 360° pada badan 3D model.

### 📐 Rumus Perhitungan Dimensi Silinder:
- **Panjang Wrap ($W$)**: Keliling silinder $= \pi \times \text{Diameter} = 2 \times \pi \times \text{Radius}$. *(Misal botol diameter 40mm $\rightarrow$ wrap = 125.66 mm $\approx$ 126 mm).*
- **Tinggi Label ($H$)**: Tinggi area label pada model 3D (misal 98 mm).
- **Bleed Margin**: $+3.0\text{ mm}$ di sekeliling cut outline.
- **Safe Margin**: $-3.0\text{ mm}$ di dalam cut outline.

### Struktur Layer Khusus Cylindrical Dieline:
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="226mm" height="223mm" viewBox="0 0 226 223">
  <defs>
    <style>
      .cut-line { stroke: #ff007f; stroke-width: 0.45; fill: none; }
      .crease-line { stroke: #00a651; stroke-width: 0.45; stroke-dasharray: 2 1.5; fill: none; }
      .bleed-line { stroke: #00a0e9; stroke-width: 0.35; stroke-dasharray: 1.5 1.5; fill: none; }
      .safe-line { stroke: #2e7d32; stroke-width: 0.25; stroke-dasharray: 0.8 1.2; fill: none; }
    </style>
  </defs>

  <!-- 1. LAYER ARTWORK (Grafik label 360 derajat) -->
  <g id="Artwork-Layer" />

  <!-- 2. SAFE ZONE (-3mm) -->
  <g id="Safe-Zone" class="safe-line"> ... </g>

  <!-- 3. BLEED ZONE (+3mm) -->
  <g id="Bleed-3mm" class="bleed-line"> ... </g>

  <!-- 4. DIE CUT LINE (Pisau Potong Stiker) -->
  <g id="Dieline-Cut" class="cut-line"> ... </g>

  <!-- 5. ANOTASI UKURAN TEKNIS -->
  <g id="Technical-Annotations"> ... </g>
</svg>
```

---

## 7. 🛠️ Kompatibilitas Software Desain Eksternal

Jika Anda atau klien mendesain di software grafis profesional:

- **Adobe Illustrator**:
  - Simpan sebagai: **SVG 1.1** atau **SVG Tiny**.
  - Font: Pilih **Convert to Outlines** (Jadikan kurva).
  - CSS Properties: Pilih **Presentation Attributes** atau **Style Elements**.
- **Figma**:
  - Pastikan frame utama berukuran sesuai mm (misal `380px` untuk `380mm` pada skala 1:1).
  - Beri nama layer persis: `cut-lines`, `crease-lines`, `artwork`.
  - Export: SVG dengan centang *"Include id attribute"*.
- **CorelDraw**:
  - Export SVG dengan warna outline hairline `#E11D48` / `#FF007F` untuk potong dan garis putus-putus `#10B981` untuk lipat.

---

## 8. 🚀 Keuntungan Mengikuti Standar Ini

1. **1-Click Auto 3D Folding & Wrapping**: Dieline yang diunggah langsung terlipat menjadi kotak atau terbalut melingkar 360° pada model tabung silinder/botol di AstaKraf Studio.
2. **Anti Salah Cetak**: Percetakan tidak akan salah membedakan mana garis yang harus dipotong dan mana yang harus dilipat.
3. **Multi-Platform Export**: SVG dapat diekspor langsung menjadi file 3D **`.GLB`**, pisau pond cetak **`.DXF / PDF`**, atau mock-up photorealistic secara konsisten.
