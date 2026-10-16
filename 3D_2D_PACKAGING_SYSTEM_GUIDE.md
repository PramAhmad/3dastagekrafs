# 📦 Panduan Arsitektur 2D Dieline, 3D Rendering & Pipeline Pembuatan Aset Kemasan (AstaKraft CAD)

Dokumen ini menjelaskan secara mendalam bagaimana sistem editor kemasan 2D/3D pada platform ini bekerja, sinkronisasi tekstur real-time, asal aset saat ini, serta panduan praktis langkah demi langkah untuk memproduksi ratusan model kemasan 3D baru.

---

## 1. 🏗️ Arsitektur Sistem 2D Dieline & 3D Rendering

Sistem ini menghubungkan dua dunia: **Vector 2D (Dieline Pola Lipatan)** dan **Mesh 3D (Three.js WebGL / React Three Fiber)** secara real-time.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           APP STATE (Editor)                            │
│  - Dimensi (W x H x D dalam mm)                                         │
│  - Design Elements (Text, Image, Shape) per Face                        │
│  - Face Colors (Record<faceKey, hexColor>)                              │
│  - View Mode (3D Interactive vs 2D Dieline Canvas)                      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│     2D DIELINE CANVAS (SVG)     │     │      3D PACKAGING CANVAS        │
│                                 │     │       (Three.js / R3F)          │
│ - Menghitung skala mm -> px     │     │                                 │
│ - Render FEFCO Pola Lipatan     │     │ 1. Dynamic Canvas Texture Engine│
│ - Interactive Face Selection    │     │    - Render wrapTexture (2048px)│
│ - Flaps & Wings terhubung ke    │     │    - Render per-face background │
│   Face ID masing-masing         │     │    - Draw user text / sticker   │
│ - Floating [Face color] Popover │     │ 2. Box Mesh UV Mapping          │
│ - Default scale otomatis (70%)  │     │    - MeshStandardMaterial       │
│                                 │     │    - Roughness / Metalness PBR  │
└─────────────────────────────────┘     └─────────────────────────────────┘
```

---

## 2. 🔄 Cara Kerja Sinkronisasi 2D Dieline ke 3D Model

### A. Dynamic UV Texture Painting
- Setiap kali user mengubah warna `faceColors[faceKey]` atau menambahkan teks/gambar pada sisi tertentu (misal `front`, `top`, `lid`), Three.js tidak perlu me-reload 3D model.
- Terdapat modul **Off-screen Canvas Texture Generator** (`PackagingCanvas.tsx`):
  1. Membuat HTML5 `<canvas>` beresolusi tinggi (contoh: 2048x1024 atau 2048x2048).
  2. Melukis background warna per kuadran face (`wrapCtx.fillStyle = faceColors.front`).
  3. Menggambar elemen grafis (SVG/PNG/Canvas Path) sesuai UV offset.
  4. Menyetel `texture.needsUpdate = true` ke Three.js `MeshStandardMaterial`.

### B. Masalah Flap Melengkung (Tuck Flap / Dust Wings) di `screen118.jpg` & Solusinya:
- **Penyebab:** Sebelumnya flap lengkung bawah dan kuping penutup (dust flaps) digambar sebagai elemen SVG dekoratif terpisah dengan `transform="scale(...)"` yang tidak terdaftar ke ID sisi (Face ID) manapun. Akibatnya kursor tidak mengenali area klik, dan tidak ada mapping warna ke material 3D.
- **Solusi yang Diterapkan:**
  1. Semua path lengkung dan flap diintegrasikan langsung sebagai turunan dari sisi induknya (contoh: Tuck flap melengkung terikat ke sisi `top` lid, dust wings terikat ke `left` & `right`).
  2. Koordinat path dihitung langsung secara absolut menggunakan rumus skala millimeter ke pixel (`scaleMmToPx`), sehingga seluruh area bidang (termasuk lengkungan flap) bisa diklik dan memunculkan popover `[ 🎨 Face color ]`.
  3. Warna yang dipilih pada sisi tersebut langsung memicu update material 3D pada lid & penutup depan kemasan.

---

## 3. 📂 Dari Mana Aset 3D & 2D Saat Ini Berasal?

Saat ini, platform menggunakan **2 Jenis Model**:

1. **Parametrik Procedural Mesh (Continuous Box Mesh)**:
   - Dibuat secara matematis menggunakan Three.js primitives (`BoxGeometry` / Custom BufferGeometry).
   - Kelebihan: Dimensi Panjang (W), Tinggi (H), Tebal (D) bisa diubah-ubah bebas tanpa batas oleh pengguna dan model 3D langsung melar/menyesuaikan secara proporsional.
   - Lokasi Code: `frontend/src/components/3d/PackagingCanvas.tsx` (komponen `ContinuousBoxModel`).

2. **Pola Dieline 2D Standar Industri (FEFCO 0427 & FEFCO 0201)**:
   - Mengikuti standar internasional standarisasi kemasan karton box lipat (**ECMA / FEFCO**).
   - Lokasi Code: `frontend/src/components/2d/DielineCanvas.tsx`.

---

## 4. 🚀 Cara Membuat & Menambah Koleksi Model Kemasan Baru

Untuk memiliki perpustakaan model yang sangat lengkap (seperti standing pouch, botol pump, tube kosmetik, can/kaleng, mailer box kancing, pillow box, hard box magnet):

### 🛠️ Pipeline Pembuatan Model 3D (Blender ke Web)

#### Langkah 1: Modeling & UV Unwrapping di Blender
1. Buat model 3D kemasan di **Blender**.
2. Buat **UV Seam** yang rapi dan logis sesuai pola lipatan kemasan nyata:
   - Pastikan UV Island datar menyerupai pola Dieline 2D.
   - Beri nama Vertex Groups / Material slots yang jelas (`front`, `back`, `left`, `right`, `top`, `bottom`, `cap`, `label`).
3. Set origin / pivot point di titik dasar bawah `(0, 0, 0)`.

#### Langkah 2: Export ke Format WebGL Standar
1. Export model dari Blender dalam format **`.glb` / `.gltf`** (glTF 2.0 Binary):
   - Centang **Include UVs**, **Normals**, dan **Materials**.
   - Kompresi mesh menggunakan **Draco Compression** (opsional untuk loading super cepat).
2. Letakkan file `.glb` di folder `frontend/public/models/packaging/` (misal: `mailer-box.glb`, `pouch-standup.glb`, `cosmetic-bottle.glb`).

#### Langkah 3: Membuat Definisi Pola 2D Dieline (SVG Generator)
Di `frontend/src/components/2d/`:
1. Buat generator path SVG sesuai ukuran nyata kemasan.
2. Definisikan mapping koordinat UV:
   ```ts
   export interface PackagingModelDefinition {
     id: 'mailer-box' | 'pillow-box' | 'cosmetic-tube' | 'standing-pouch';
     name: 'Pillow Box' | 'Standing Pouch';
     glbUrl: '/models/packaging/pillow-box.glb';
     faces: [
       { key: 'body_front', label: 'Depan', uvRect: { u: 0, v: 0, w: 0.5, h: 1 } },
       { key: 'body_back', label: 'Belakang', uvRect: { u: 0.5, v: 0, w: 0.5, h: 1 } },
       { key: 'flap_top', label: 'Tutup Atas', uvRect: { ... } }
     ];
   }
   ```

#### Langkah 4: Load Model dengan `@react-three/drei`
Di Three.js Canvas:
```tsx
import { useGLTF } from '@react-three/drei';

function GenericPackagingModel({ modelUrl, texture }) {
  const { scene } = useGLTF(modelUrl);
  
  // Pasang texture dynamic yang di-generate dari 2D Canvas ke material label kemasan
  scene.traverse((child) => {
    if (child.isMesh && child.name.includes('Label')) {
      child.material.map = texture;
      child.material.needsUpdate = true;
    }
  });

  return <primitive object={scene} />;
}
```

---

## 5. 🎨 Standar Warna Global (Color Code Sync)

Seluruh color palette sistem editor dan UI telah distandarisasi di `frontend/src/lib/theme.ts`:

- **Navy Brand**: `#1F3A5C` (Header, button solid, judul utama)
- **Primary Blue**: `#4394C3` (Aksen aktif, highlight garis seleksi dieline, hover states)
- **Primary Hover**: `#2F79A6`
- **Yellow Gold**: `#F7CB45` (Badge, aksen bintang, call-to-action)
- **Ice Blue Surface**: `#EEF4F8` (Background canvas 2D & 3D yang bersih)
- **Ice Border**: `#D5E4F0` (Garis grid canvas & pembatas panel)

Jika ingin mengganti tema warna seluruh aplikasi di masa mendatang, cukup ubah nilai HEX di `frontend/src/lib/theme.ts`.
