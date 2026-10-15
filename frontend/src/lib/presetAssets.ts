export interface LibraryImageItem {
  id: string
  name: string
  url: string
  category: "upload" | "certification" | "brand" | "symbol" | string
  userId?: string
  width?: number
  height?: number
  createdAt: string
  isPreset?: boolean
}

export const PRESET_LIBRARY_IMAGES: LibraryImageItem[] = [
  {
    id: "preset_halal",
    name: "Halal Indonesia Resmi",
    url: "/presets/halal-indonesia.svg",
    category: "certification",
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "preset_sni",
    name: "SNI Mutu Indonesia",
    url: "/presets/sni-indonesia.svg",
    category: "certification",
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "preset_recycle",
    name: "Daur Ulang / Recyclable Kraft",
    url: "/presets/daur-ulang-recycle.svg",
    category: "certification",
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "preset_food_grade",
    name: "Food Grade (Aman Makanan)",
    url: "/presets/food-grade.svg",
    category: "certification",
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "preset_fragile",
    name: "Fragile (Jangan Dibanting)",
    url: "/presets/fragile-pecah-belah.svg",
    category: "symbol",
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "preset_jaga_kebersihan",
    name: "Jaga Kebersihan (Tempat Sampah)",
    url: "/presets/jaga-kebersihan.svg",
    category: "symbol",
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "preset_keep_dry",
    name: "Keep Dry (Hindari Lembab)",
    url: "/presets/keep-dry-payung.svg",
    category: "symbol",
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "preset_barcode",
    name: "Barcode Standar EAN-13",
    url: "/presets/barcode-standard.svg",
    category: "symbol",
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "preset_qrcode",
    name: "QR Code Scan Me / Info",
    url: "/presets/qr-code-scanme.svg",
    category: "symbol",
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "preset_astakraft",
    name: "AstaKraft 3D Packaging Emblem",
    url: "/presets/astakraft-brand-emblem.svg",
    category: "brand",
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "preset_astakraft_cube",
    name: "AstaKraft Primary Box Art",
    url: "/logo/astakraft-primary.jpg",
    category: "brand",
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "preset_astakraft_dieline",
    name: "AstaKraft Dieline Geometric Logo",
    url: "/logo/astakraft-dieline.jpg",
    category: "brand",
    isPreset: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
]
