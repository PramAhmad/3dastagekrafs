export type TemplateCategory =
  | "BOX"
  | "POUCH"
  | "JAR"
  | "BOTTLE"
  | "CAN"
  | "TRIANGLE"
  | "CUP"
  | "PILLOW"
  | "CLIP"
  | string

export interface CategoryMaster {
  id: string // e.g. "BOX", "POUCH", "BOTTLE", "SKINCARE"
  name: string // e.g. "Kotak Persegi / Box"
  description: string // e.g. "Kemasan kardus & paper box universal"
  image_url?: string // thumbnail image URL or Data URL
  icon_name?: string
  is_active: boolean
  display_order?: number
}

export const DEFAULT_MASTER_CATEGORIES: CategoryMaster[] = [
  {
    id: "BOX",
    name: "Kotak / Box",
    description: "Kemasan kotak kardus corrugated & art paper universal untuk e-commerce, sabun, dan parfum.",
    image_url: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&auto=format&fit=crop&q=80",
    is_active: true,
    display_order: 1,
  },
  {
    id: "POUCH",
    name: "Standing Pouch",
    description: "Kantong kemasan fleksibel berdiri dengan segel zipper kedap udara untuk kopi dan snack.",
    image_url: "https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?w=300&auto=format&fit=crop&q=80",
    is_active: true,
    display_order: 2,
  },
  {
    id: "JAR",
    name: "Toples / Jar",
    description: "Wadah silinder mulus dengan tutup ulir rapat untuk krim wajah, skincare, dan lulur.",
    image_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80",
    is_active: true,
    display_order: 3,
  },
  {
    id: "BOTTLE",
    name: "Botol Kosmetik & Pump",
    description: "Botol silinder modern dengan dispenser head untuk serum, sabun cair, dan lotion.",
    image_url: "https://images.unsplash.com/photo-1608248597359-598971f114c0?w=300&auto=format&fit=crop&q=80",
    is_active: true,
    display_order: 4,
  },
  {
    id: "CAN",
    name: "Kaleng (Tin Can)",
    description: "Tabung kaleng metalik vintage dengan tutup timbul untuk teh artisan dan biskuit.",
    image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80",
    is_active: true,
    display_order: 5,
  },
  {
    id: "TRIANGLE",
    name: "Prisma Segitiga",
    description: "Kemasan prisma 3 sisi geometris untuk cokelat batangan dan slice cake.",
    image_url: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=300&auto=format&fit=crop&q=80",
    is_active: true,
    display_order: 6,
  },
  {
    id: "CUP",
    name: "Paper Cup",
    description: "Gelas kertas kerucut dengan tutup plastik lid untuk kafe dan minuman.",
    image_url: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=300&auto=format&fit=crop&q=80",
    is_active: true,
    display_order: 7,
  },
  {
    id: "PILLOW",
    name: "Pillow Box",
    description: "Kotak lengkung bentuk bantal elegan yang mudah dilipat untuk hijab dan gift.",
    image_url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300&auto=format&fit=crop&q=80",
    is_active: true,
    display_order: 8,
  },
  {
    id: "CLIP",
    name: "Klip Segel Kemasan",
    description: "Klip pengunci kedap udara untuk kemasan plastik snack dan biji kopi UMKM.",
    image_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80",
    is_active: true,
    display_order: 9,
  },
]

export interface DimensionConstraint {
  min_mm: number
  max_mm: number
  default_mm: number
  step_mm: number
}

export interface PackagingTemplate {
  id: string
  name: string
  category: TemplateCategory
  description: string
  preview_url?: string
  model_3d_url?: string
  model_format?: "glb" | "gltf" | "stl" | string
  is_custom_mesh?: boolean
  dieline_svg_url?: string // 2D dieline SVG for cut/crease layout
  manifest_json?: string | Record<string, any> // Panel manifest JSON (names, dimensions, UV mappings)
  uv_template_url?: string // UV template reference PNG
  is_printable: boolean
  constraints?: Record<string, DimensionConstraint>
  default_dimensions?: {
    length_mm?: number
    width_mm?: number
    height_mm?: number
    radius_mm?: number
    wall_thickness_mm?: number
  }
  badge?: string
}

export interface PricingConfig {
  machineRate: number // Rp per hour
  markupPct: number // %
  plaRate: number // Rp per gram
  petgRate: number // Rp per gram
  resinRate: number // Rp per gram
  packagingFee: number // Rp
  minOrder: number // Rp
}

export type OrderStatus = "QUEUED" | "PRINTING" | "COMPLETED" | "CANCELLED"

export interface ProductionOrder {
  id: string
  customer: string
  item: string
  material: string
  qty: number
  total: number
  status: OrderStatus
  progress: string
  time: string
}

export interface StoreSettings {
  brandName: string
  subdomain: string
  whatsappNumber: string
  email: string
}
