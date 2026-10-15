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

export interface AvailableMaterialOption {
  id: string
  name: string
  subtitle: string
  color: string
}

export const MASTER_MATERIAL_OPTIONS: AvailableMaterialOption[] = [
  { id: "corrugated", name: "Corrugated Cardboard", subtitle: "Karton Gelombang Cokelat", color: "#ba8b57" },
  { id: "kraft", name: "Brown Kraft Paper", subtitle: "Kertas Kraft Natural", color: "#ca9a66" },
  { id: "matte_art", name: "Matte Art Paper", subtitle: "Putih Halus Doff", color: "#f4f4f5" },
  { id: "glossy", name: "Glossy Coated UV", subtitle: "Putih Mengkilap High Gloss", color: "#ffffff" },
  { id: "metallic_gold", name: "Metallic Gold Foil", subtitle: "Hot Stamping Emas Mewah", color: "#d4af37" },
  { id: "metallic_silver", name: "Metallic Silver Foil", subtitle: "Perak Foil / Chrome", color: "#cbd5e1" },
  { id: "black_matte", name: "Navy Matte Soft-Touch", subtitle: "Navy Doff Premium", color: "#1F3A5C" },
  { id: "frosted", name: "Frosted Translucent", subtitle: "Mika / Kaca Buram", color: "#e2e8f0" },
  { id: "metallic", name: "Tinplate Metal", subtitle: "Kaleng Logam Metalik", color: "#94a3b8" },
  { id: "ivory", name: "Ivory Paperboard", subtitle: "Ivory Putih Premium", color: "#faf8f5" },
  { id: "duplex", name: "Duplex Board", subtitle: "Karton Duplex Abu-Putih", color: "#d1d5db" },
]

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
  available_materials?: string[] // IDs of materials selectable for this model
}

export const DEFAULT_PACKAGING_TEMPLATES: PackagingTemplate[] = [
  {
    id: "box_rectangular_v1",
    name: "Kotak Persegi (Mailer Box)",
    category: "BOX",
    description: "Kemasan kotak kardus corrugated & art paper universal untuk e-commerce, sabun, parfum, dan gift box.",
    is_printable: true,
    default_dimensions: { length_mm: 65, width_mm: 45, height_mm: 35, wall_thickness_mm: 1.6 },
    badge: "Terpopuler",
    available_materials: ["corrugated", "kraft", "matte_art", "glossy", "black_matte", "ivory", "duplex"],
  },
  {
    id: "pouch_standing_v1",
    name: "Standing Pouch Zipper",
    category: "POUCH",
    description: "Kantong kemasan fleksibel berdiri dengan segel zipper kedap udara untuk kopi, keripik, dan snack UMKM.",
    is_printable: true,
    default_dimensions: { length_mm: 90, width_mm: 40, height_mm: 130, wall_thickness_mm: 1.6 },
    badge: "Favorit Makanan",
    available_materials: ["kraft", "glossy", "matte_art", "metallic_gold", "metallic_silver"],
  },
  {
    id: "jar_cosmetic_v1",
    name: "Toples Kosmetik Silinder (Jar)",
    category: "JAR",
    description: "Wadah silinder mulus dengan tutup ulir rapat untuk krim wajah, skincare, lulur, atau pomade.",
    is_printable: true,
    default_dimensions: { radius_mm: 25, height_mm: 35, wall_thickness_mm: 1.8 },
    badge: "Skincare & Beauty",
    available_materials: ["frosted", "glossy", "matte_art", "metallic_gold", "black_matte"],
  },
  {
    id: "bottle_pump_v1",
    name: "Botol Pump Kosmetik (Bottle)",
    category: "BOTTLE",
    description: "Botol silinder modern dengan dispenser head pump untuk serum kecantikan, sabun cair, dan lotion.",
    is_printable: true,
    default_dimensions: { radius_mm: 20, height_mm: 110, wall_thickness_mm: 1.8 },
    badge: "Botol Cairan",
    available_materials: ["frosted", "glossy", "matte_art", "black_matte"],
  },
  {
    id: "can_tin_v1",
    name: "Kaleng Tin Canister",
    category: "CAN",
    description: "Tabung kaleng metalik vintage dengan tutup timbul untuk teh artisan, kopi kaleng, dan biskuit.",
    is_printable: true,
    default_dimensions: { radius_mm: 30, height_mm: 80, wall_thickness_mm: 1.8 },
    badge: "Vintage Metal",
    available_materials: ["metallic", "metallic_gold", "metallic_silver", "glossy", "matte_art"],
  },
  {
    id: "box_triangle_v1",
    name: "Kotak Prisma Segitiga (Toblerone)",
    category: "TRIANGLE",
    description: "Kemasan prisma 3 sisi geometris untuk cokelat batangan, slice cake, dan souvenir unik.",
    is_printable: true,
    default_dimensions: { length_mm: 80, width_mm: 45, height_mm: 40, wall_thickness_mm: 1.6 },
    badge: "Bentuk Unik",
    available_materials: ["ivory", "matte_art", "kraft", "glossy", "metallic_gold"],
  },
  {
    id: "cup_coffee_v1",
    name: "Paper Cup Minuman & Kopi",
    category: "CUP",
    description: "Gelas kertas kerucut dengan tutup plastik lid untuk kafe, boba, kopi susu, dan take-away.",
    is_printable: true,
    default_dimensions: { radius_mm: 35, height_mm: 100, wall_thickness_mm: 1.6 },
    badge: "F&B Kafe",
    available_materials: ["kraft", "matte_art", "glossy", "ivory"],
  },
  {
    id: "box_pillow_v1",
    name: "Pillow Box Bantal (Hijab & Aksesoris)",
    category: "PILLOW",
    description: "Kotak lengkung bentuk bantal elegan yang mudah dilipat untuk hijab, perhiasan, dan gift.",
    is_printable: true,
    default_dimensions: { length_mm: 100, width_mm: 60, height_mm: 25, wall_thickness_mm: 1.6 },
    badge: "Fashion & Gift",
    available_materials: ["kraft", "ivory", "matte_art", "glossy", "metallic_gold", "black_matte"],
  },
  {
    id: "pouch_sealer_clip_v1",
    name: "Klip Segel Kemasan (Clip)",
    category: "CLIP",
    description: "Klip pengunci kedap udara untuk kemasan plastik snack, keripik, dan biji kopi UMKM.",
    is_printable: true,
    default_dimensions: { length_mm: 90, width_mm: 15, height_mm: 12, wall_thickness_mm: 1.6 },
    badge: "Aksesoris",
    available_materials: ["glossy", "matte_art", "black_matte"],
  },
  {
    id: "box_sleeve_drawer_v1",
    name: "Kotak Geser Laci (Slide Drawer Box)",
    category: "BOX",
    description: "Kemasan slide box tarik dua lapis (outer sleeve + inner tray) mewah untuk hampers, bakery, dan gadget.",
    is_printable: true,
    default_dimensions: { length_mm: 80, width_mm: 60, height_mm: 30, wall_thickness_mm: 1.6 },
    badge: "Premium Hampers",
    available_materials: ["corrugated", "kraft", "ivory", "matte_art", "black_matte", "metallic_gold"],
  },
  {
    id: "box_tuck_end_v1",
    name: "Kotak Lipat Standar (Straight Tuck End)",
    category: "BOX",
    description: "Kotak karton lipat vertikal klasik dengan lid flap atas-bawah untuk obat sirup, kosmetik kecil, dan pasta gigi.",
    is_printable: true,
    default_dimensions: { length_mm: 40, width_mm: 40, height_mm: 110, wall_thickness_mm: 1.6 },
    badge: "Farmasi & Skincare",
    available_materials: ["ivory", "duplex", "matte_art", "glossy", "kraft"],
  },
  {
    id: "bottle_dropper_v1",
    name: "Botol Pipet Serum (Dropper Bottle)",
    category: "BOTTLE",
    description: "Botol silinder kaca amber / bening dengan pipet tetes karet untuk serum anti-aging dan essential oil.",
    is_printable: true,
    default_dimensions: { radius_mm: 22, height_mm: 85, wall_thickness_mm: 1.8 },
    badge: "Essential Oil",
    available_materials: ["frosted", "glossy", "black_matte", "metallic_gold"],
  },
]

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
