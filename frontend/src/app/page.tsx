"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Box,
  Layers,
  Sparkles,
  Download,
  LayoutDashboard,
  Circle,
  Square,
  Triangle,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowRight,
  Package,
  Phone,
  Mail,
  Clock,
  MapPin,
  MessageSquare,
  User,
  History,
  LogOut,
  Building,
  ShieldCheck,
  Send,
  CheckCircle2,
  Palette,
  Feather,
  Award,
  Compass,
  Heart,
  Crown,
  HelpCircle,
  Flame,
} from "lucide-react"
import { CategoryMaster, DEFAULT_MASTER_CATEGORIES } from "@/types/admin"
import { getCurrentUser, logoutUser } from "@/lib/auth"
import { UserSession } from "@/types/auth"

export interface TemplateItem {
  id: string
  name: string
  category: "BOX" | "POUCH" | "JAR" | "BOTTLE" | "CAN" | "TRIANGLE" | "CUP" | "PILLOW" | "CLIP" | string
  description: string
  defaultDims: { length: number; width: number; height: number; radius: number }
  badge?: string
  preview_url?: string
  model_3d_url?: string
  model_format?: string
}

const TEMPLATES: TemplateItem[] = [
  {
    id: "box_rectangular_v1",
    name: "Kotak Persegi (Mailer Box)",
    category: "BOX",
    description: "Kemasan kotak kardus / art paper universal untuk e-commerce, sabun, parfum, dan gift box.",
    defaultDims: { length: 65, width: 45, height: 35, radius: 25 },
    badge: "Terpopuler",
  },
  {
    id: "pouch_standing_v1",
    name: "Standing Pouch Zipper",
    category: "POUCH",
    description: "Kantong kemasan fleksibel berdiri dengan segel zipper kedap udara untuk kopi dan snack.",
    defaultDims: { length: 90, width: 40, height: 130, radius: 20 },
    badge: "Favorit Makanan",
  },
  {
    id: "jar_cosmetic_v1",
    name: "Toples Kosmetik Silinder (Jar)",
    category: "JAR",
    description: "Wadah silinder mulus dengan tutup ulir rapat untuk krim wajah, skincare, lulur, atau pomade.",
    defaultDims: { length: 50, width: 50, height: 35, radius: 25 },
    badge: "Skincare & Beauty",
  },
  {
    id: "bottle_pump_v1",
    name: "Botol Pump Kosmetik (Bottle)",
    category: "BOTTLE",
    description: "Botol silinder modern dengan dispenser head untuk serum kecantikan, sabun cair, dan lotion.",
    defaultDims: { length: 40, width: 40, height: 110, radius: 20 },
    badge: "Botol Cairan",
  },
  {
    id: "can_tin_v1",
    name: "Kaleng Tin Canister",
    category: "CAN",
    description: "Tabung kaleng metalik vintage dengan tutup timbul untuk teh artisan, kopi kaleng, dan biskuit.",
    defaultDims: { length: 60, width: 60, height: 80, radius: 30 },
    badge: "Vintage Metal",
  },
  {
    id: "box_triangle_v1",
    name: "Kotak Prisma Segitiga (Toblerone)",
    category: "TRIANGLE",
    description: "Kemasan prisma 3 sisi geometris untuk cokelat batangan, slice cake, dan souvenir premium.",
    defaultDims: { length: 80, width: 45, height: 40, radius: 25 },
    badge: "Bentuk Unik",
  },
  {
    id: "cup_coffee_v1",
    name: "Paper Cup Minuman & Kopi",
    category: "CUP",
    description: "Gelas kertas kerucut dengan tutup plastik lid untuk kafe, boba, kopi susu, dan minuman take-away.",
    defaultDims: { length: 70, width: 70, height: 100, radius: 35 },
    badge: "F&B Kafe",
  },
  {
    id: "box_pillow_v1",
    name: "Pillow Box Bantal (Hijab & Aksesoris)",
    category: "PILLOW",
    description: "Kotak lengkung bentuk bantal elegan yang mudah dilipat untuk hijab, perhiasan, dan gift.",
    defaultDims: { length: 100, width: 60, height: 25, radius: 30 },
    badge: "Fashion & Gift",
  },
  {
    id: "pouch_sealer_clip_v1",
    name: "Klip Segel Kemasan (Clip)",
    category: "CLIP",
    description: "Klip pengunci kedap udara untuk kemasan plastik snack dan biji kopi UMKM.",
    defaultDims: { length: 90, width: 15, height: 12, radius: 10 },
    badge: "Aksesoris",
  },
]

function useDraggableScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const isDown = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const hasDragged = useRef(false)

  const onMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return
    isDown.current = true
    hasDragged.current = false
    startX.current = e.pageX - ref.current.offsetLeft
    scrollLeft.current = ref.current.scrollLeft
  }

  const onMouseLeave = () => {
    isDown.current = false
  }

  const onMouseUp = () => {
    isDown.current = false
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !ref.current) return
    e.preventDefault()
    hasDragged.current = true
    const x = e.pageX - ref.current.offsetLeft
    const walk = (x - startX.current) * 1.5
    ref.current.scrollLeft = scrollLeft.current - walk
  }

  const scroll = (direction: "left" | "right", amount = 320) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      })
    }
  }

  return {
    ref,
    onMouseDown,
    onMouseLeave,
    onMouseUp,
    onMouseMove,
    scroll,
    hasDragged,
  }
}

const TITI_POSES = [
  { src: "/maskot/titi%20ckg.png", alt: "Maskot Titi - Gaya Tradisional" },
  { src: "/maskot/titi%20tanpa%20payung.png", alt: "Maskot Titi - Gaya Dinamis" },
  { src: "/maskot/titi-revisi.png", alt: "Maskot Titi - Kriya Nusantara" },
]

const TATA_POSES = [
  { src: "/maskot/tata%20ckg.png", alt: "Maskot Tata - Gaya Presisi" },
  { src: "/maskot/tata%20tanpa%20payung.png", alt: "Maskot Tata - Rekayasa Dieline" },
  { src: "/maskot/tata-revisi.png", alt: "Maskot Tata - Struktur Kokoh" },
]

export default function LandingPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null)
  const [masterCategories, setMasterCategories] = useState<CategoryMaster[]>(DEFAULT_MASTER_CATEGORIES)
  const [templateList, setTemplateList] = useState<TemplateItem[]>(TEMPLATES)
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Dynamic Mascot Animation State (Auto-cycle poses & position swap)
  const [mascotPoseIndex, setMascotPoseIndex] = useState(0)
  const [isMascotSwapped, setIsMascotSwapped] = useState(false)
  const [isMascotTransitioning, setIsMascotTransitioning] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setIsMascotTransitioning(true)
      setTimeout(() => {
        setMascotPoseIndex((prev) => (prev + 1) % 3)
        setIsMascotSwapped((prev) => !prev)
        setIsMascotTransitioning(false)
      }, 400)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const leftMascot = isMascotSwapped ? TATA_POSES[mascotPoseIndex] : TITI_POSES[mascotPoseIndex]
  const rightMascot = isMascotSwapped ? TITI_POSES[mascotPoseIndex] : TATA_POSES[mascotPoseIndex]
  const leftGlow = isMascotSwapped ? "from-[#1F3A5C]/50 to-white/20" : "from-[#F7CB45]/45 to-white/20"
  const rightGlow = isMascotSwapped ? "from-[#F7CB45]/45 to-white/20" : "from-[#1F3A5C]/50 to-white/20"

  // Horizontal Drag Scroll Handlers
  const categoryScroll = useDraggableScroll()
  const filterTabsScroll = useDraggableScroll()

  useEffect(() => {
    setCurrentUser(getCurrentUser())

    // Load custom categories from LocalStorage
    const savedCategories = localStorage.getItem("kemasan3d_master_categories")
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMasterCategories(parsed)
        }
      } catch (err) {}
    }

    // Load custom templates from LocalStorage (check both custom and admin keys)
    const savedCustomTemplates = localStorage.getItem("kemasan3d_custom_templates")
    const savedAdminTemplates = localStorage.getItem("kemasan3d_admin_templates")
    const rawTemplatesString = savedCustomTemplates || savedAdminTemplates

    if (rawTemplatesString) {
      try {
        const parsed = JSON.parse(rawTemplatesString)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped: TemplateItem[] = parsed.map((t: any) => ({
            id: t.id,
            name: t.name,
            category: t.category,
            description: t.description || "Kemasan produk UMKM.",
            preview_url: t.preview_url || undefined,
            model_3d_url: t.model_3d_url || undefined,
            model_format: t.model_format || (t.model_3d_url ? "glb" : undefined),
            dieline_svg_url: t.dieline_svg_url || undefined,
            defaultDims: {
              length: t.default_dimensions?.length_mm || 65,
              width: t.default_dimensions?.width_mm || 45,
              height: t.default_dimensions?.height_mm || 35,
              radius: t.default_dimensions?.radius_mm || 25,
            },
            badge: t.model_3d_url
              ? `3D Mesh (${(t.model_format || "GLB").toUpperCase()})`
              : t.is_custom_mesh
              ? "3D Mesh"
              : undefined,
          }))
          setTemplateList((prev) => {
            const ids = new Set(mapped.map((m) => m.id))
            const rest = prev.filter((p) => !ids.has(p.id))
            return [...mapped, ...rest]
          })
        }
      } catch (e) {}
    }
  }, [])

  const handleSelectTemplateAndStart = (tmpl: TemplateItem) => {
    if (!currentUser) {
      router.push(`/login?redirect=/editor?template=${tmpl.id}`)
    } else {
      router.push(`/editor?template=${tmpl.id}`)
    }
  }

  const handleLogout = () => {
    logoutUser()
    setCurrentUser(null)
  }

  // Filter models
  const filteredTemplates = templateList.filter((t) => {
    const matchCat = categoryFilter === "ALL" || t.category.toUpperCase() === categoryFilter.toUpperCase()
    const matchSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  // Category filter tabs list
  const categoryMap = new Map(masterCategories.map((c) => [c.id.toUpperCase(), c]))
  const distinctCategoryIds = Array.from(
    new Set([
      ...masterCategories.filter((c) => c.is_active).map((c) => c.id.toUpperCase()),
      ...templateList.map((t) => t.category.toUpperCase()),
    ])
  )

  const CATEGORIES = [
    { id: "ALL", label: "Semua Model", image_url: undefined as string | undefined },
    ...distinctCategoryIds.map((id) => {
      const cat = categoryMap.get(id)
      return {
        id: id,
        label: cat?.name || id,
        image_url: cat?.image_url,
      }
    }),
  ]

  return (
    <div className="min-h-screen w-full bg-[#4394C3] text-[#1F3A5C] flex flex-col font-sans select-none text-xs antialiased">
      {/* 1. FIXED FLOATING PILL NAVBAR */}
      <div className="fixed top-3 left-0 right-0 z-50 px-4 sm:px-6 max-w-6xl mx-auto w-full pointer-events-none">
        <header className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl border border-white/40 shadow-[0_12px_36px_rgba(31,58,92,0.18)] px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all">
          {/* Brand Seal / Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#4394C3]/30 overflow-hidden shadow-xs group-hover:border-[#1F3A5C] transition-all p-0.5 shrink-0">
              <img
                src="/logo/astakraft-primary.jpg"
                alt="Logo AstaKraft"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[#1F3A5C] tracking-tight text-sm leading-none">
                AstaKraft
              </span>
              <span className="text-[9.5px] text-[#2F79A6] font-medium tracking-tight mt-0.5">Studio Mockup &amp; Dieline</span>
            </div>
          </a>

          {/* Refined Navigation Menu */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[#1F3A5C]/80">
            <a
              href="#kategori"
              className="hover:text-[#1F3A5C] hover:bg-[#EEF4F8] px-2.5 py-1 rounded-lg transition-all"
            >
              Kategori Kemasan
            </a>
            <a
              href="#featured-models"
              className="hover:text-[#1F3A5C] hover:bg-[#EEF4F8] px-2.5 py-1 rounded-lg transition-all"
            >
              Katalog Model
            </a>
            <a
              href="#kontak"
              className="hover:text-[#1F3A5C] hover:bg-[#EEF4F8] px-2.5 py-1 rounded-lg transition-all"
            >
              Konsultasi & Kontak
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <a
                  href="/profile"
                  className="px-3.5 py-1.5 rounded-xl bg-[#EEF4F8] hover:bg-[#4394C3]/20 text-[#1F3A5C] font-bold text-xs border border-[#4394C3]/30 transition-all flex items-center gap-1.5 shadow-2xs"
                  title="Buka Profil & Riwayat Desain"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover border border-[#4394C3]/40"
                    />
                  ) : (
                    <User className="w-3.5 h-3.5 text-[#1F3A5C]" />
                  )}
                  <span>{currentUser.name.split(" ")[0]}</span>
                </a>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-[#1F3A5C] hover:text-red-600 transition-colors"
                  title="Keluar / Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href="/login"
                  className="px-3.5 py-1.5 rounded-xl text-[#1F3A5C] hover:text-[#2F79A6] font-bold text-xs transition-colors"
                >
                  Masuk
                </a>

                <a
                  href="/daftar-umkm"
                  className="px-4 py-2 rounded-xl bg-[#F7CB45] hover:bg-[#F7CB45]/90 text-[#1F3A5C] font-black text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 border border-[#F7CB45]/80 hover:shadow-lg"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1F3A5C]" />
                  <span>Daftar Mitra UMKM</span>
                </a>
              </div>
            )}
          </div>
        </header>
      </div>

      {/* 2. HERO SECTION WITH MASCOT VISUALS */}
      <section className="relative px-4 sm:px-6 pt-24 sm:pt-28 pb-14 sm:pb-20 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Batik Kawung Watermark Background */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <svg className="w-full h-full text-white" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="batik-hero-kawung" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="40" cy="40" r="24" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="24" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="80" cy="0" r="24" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="0" cy="80" r="24" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="80" cy="80" r="24" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M40 16 C30 30, 30 50, 40 64 C50 50, 50 30, 40 16 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16 40 C30 30, 50 30, 64 40 C50 50, 30 50, 16 40 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="40" cy="40" r="4" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#batik-hero-kawung)" />
          </svg>
        </div>

        {/* Content Container */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-center">
          {/* LEFT: Dynamic Mascot Display (Auto-swaps every 5s) */}
          <div className="hidden lg:flex lg:col-span-3 flex-col items-center justify-center text-center select-none pointer-events-none">
            <div className="relative">
              {/* Dynamic Aura Glow */}
              <div className={`absolute -inset-4 bg-gradient-to-t ${leftGlow} rounded-full blur-2xl opacity-80 transition-all duration-700`} />
              <img
                src={leftMascot.src}
                alt={leftMascot.alt}
                className={`relative w-56 h-56 xl:w-64 xl:h-64 object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.3)] transition-all duration-500 ease-in-out ${
                  isMascotTransitioning ? "opacity-0 scale-90 -rotate-3" : "opacity-100 scale-100 rotate-0"
                }`}
                loading="eager"
              />
            </div>
          </div>

          {/* CENTER: Clean Minimalist Pitch & Hero Headline */}
          <div className="lg:col-span-6 text-center space-y-4 sm:space-y-5">
            {/* Elegant Minimal Eyebrow */}
            <div className="text-[11px] font-bold font-mono tracking-widest uppercase text-[#F7CB45]">
              ASTACODE.ID × GEKRAFS
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12] drop-shadow-sm">
              Desain Kemasan 3D &amp; Dieline Presisi UMKM
            </h1>

            <p className="text-white/90 text-xs sm:text-sm font-medium leading-relaxed max-w-lg mx-auto">
              Simulasi bahan kardus kraft nyata, kalibrasi ukuran milimeter, dan cetak biru pola potong siap produksi.
            </p>

            {/* Mobile / Tablet Dynamic Mascot Stage (Auto-swaps every 5s) */}
            <div className="flex lg:hidden flex-col items-center justify-center my-3 w-full select-none pointer-events-none">
              <div className="relative p-3.5 sm:p-5 rounded-3xl bg-gradient-to-b from-white/25 via-white/15 to-white/5 backdrop-blur-md border border-white/40 shadow-[0_16px_36px_rgba(31,58,92,0.25)] max-w-xs sm:max-w-sm w-full overflow-hidden">
                {/* Dual Ambient Glow Auras */}
                <div className={`absolute top-1/2 left-1/4 -translate-y-1/2 w-28 h-28 ${isMascotSwapped ? "bg-[#1F3A5C]/50" : "bg-[#F7CB45]/45"} rounded-full blur-2xl pointer-events-none transition-colors duration-700`} />
                <div className={`absolute top-1/2 right-1/4 -translate-y-1/2 w-28 h-28 ${isMascotSwapped ? "bg-[#F7CB45]/45" : "bg-[#1F3A5C]/50"} rounded-full blur-2xl pointer-events-none transition-colors duration-700`} />

                {/* Mascots Duo Display with Automatic Swap */}
                <div className="relative z-10 flex items-end justify-center gap-6 sm:gap-8 pt-1">
                  <div className={`flex flex-col items-center transition-all duration-500 ease-in-out ${isMascotTransitioning ? "opacity-0 scale-90 -rotate-6" : "opacity-100 scale-100 rotate-0"}`}>
                    <img
                      src={leftMascot.src}
                      alt={leftMascot.alt}
                      className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.3)]"
                    />
                  </div>

                  <div className={`flex flex-col items-center transition-all duration-500 ease-in-out ${isMascotTransitioning ? "opacity-0 scale-90 rotate-6" : "opacity-100 scale-100 rotate-0"}`}>
                    <img
                      src={rightMascot.src}
                      alt={rightMascot.alt}
                      className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.3)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleSelectTemplateAndStart(templateList[0])}
                className="px-6 py-3.5 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 active:scale-95 group"
              >
                <Box className="w-4 h-4 text-[#F7CB45] group-hover:rotate-12 transition-transform" />
                <span>Mulai Studio 3D Sekarang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#kategori"
                className="px-5 py-3.5 rounded-xl bg-white hover:bg-[#EEF4F8] text-[#1F3A5C] font-bold text-xs border border-white transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Package className="w-3.5 h-3.5 text-[#2F79A6]" />
                <span>Lihat Model Kemasan</span>
              </a>
            </div>
          </div>

          {/* RIGHT: Dynamic Mascot Display (Auto-swaps every 5s) */}
          <div className="hidden lg:flex lg:col-span-3 flex-col items-center justify-center text-center select-none pointer-events-none">
            <div className="relative">
              {/* Dynamic Aura Glow */}
              <div className={`absolute -inset-4 bg-gradient-to-t ${rightGlow} rounded-full blur-2xl opacity-80 transition-all duration-700`} />
              <img
                src={rightMascot.src}
                alt={rightMascot.alt}
                className={`relative w-56 h-56 xl:w-64 xl:h-64 object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.3)] transition-all duration-500 ease-in-out ${
                  isMascotTransitioning ? "opacity-0 scale-90 rotate-3" : "opacity-100 scale-100 rotate-0"
                }`}
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. MASTER CATEGORY SECTION */}
      <section id="kategori" className="px-6 py-14 bg-white border-y border-[#4394C3]/20 overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-5">
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#EEF4F8] via-white to-[#EEF4F8] border-2 border-[#F7CB45]/60 p-1 flex items-center justify-center shadow-md">
                  <img
                    src="/maskot/titi%20tanpa%20payung.png"
                    alt="Maskot"
                    className="w-full h-full object-contain drop-shadow-sm hover:scale-105 transition-transform"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1F3A5C] border border-[#F7CB45] text-[#F7CB45] flex items-center justify-center text-[10px] shadow-xs">
                  ✨
                </div>
              </div>
              <div>
                <span className="text-[10px] sm:text-[10.5px] font-bold font-mono text-[#4394C3] uppercase tracking-wider block mb-0.5 sm:mb-1">
                  Master Kategori Kemasan
                </span>
                <h2 className="text-xl sm:text-3xl font-black text-[#1F3A5C] tracking-tight">
                  Pilihan Kategori Kemasan
                </h2>
                <p className="text-[#1F3A5C]/75 text-[11px] sm:text-xs mt-0.5 sm:mt-1 max-w-xl font-medium">
                  Geser kartu kategori di bawah untuk menemukan bentuk kemasan yang tepat untuk produk Anda.
                </p>
              </div>
            </div>

            {/* Slider Controls & Badge */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-[#1F3A5C] bg-[#EEF4F8] px-3 py-1.5 rounded-xl border border-[#4394C3]/30">
                {masterCategories.filter((c) => c.is_active).length} Kategori
              </span>
              <button
                type="button"
                onClick={() => categoryScroll.scroll("left", 320)}
                className="w-8 h-8 rounded-xl border border-[#4394C3]/30 bg-white hover:bg-[#EEF4F8] flex items-center justify-center text-[#1F3A5C] transition-all shadow-sm active:scale-95"
                title="Geser Kiri"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => categoryScroll.scroll("right", 320)}
                className="w-8 h-8 rounded-xl border border-[#4394C3]/30 bg-white hover:bg-[#EEF4F8] flex items-center justify-center text-[#1F3A5C] transition-all shadow-sm active:scale-95"
                title="Geser Kanan"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Draggable Category Cards Row (Modern Seamless Cards - No Box-in-Box) */}
          <div
            ref={categoryScroll.ref}
            onMouseDown={categoryScroll.onMouseDown}
            onMouseLeave={categoryScroll.onMouseLeave}
            onMouseUp={categoryScroll.onMouseUp}
            onMouseMove={categoryScroll.onMouseMove}
            className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing pb-3 pt-1 select-none"
          >
            {masterCategories
              .filter((c) => c.is_active)
              .map((cat) => {
                const isSelected = categoryFilter.toUpperCase() === cat.id.toUpperCase()
                const modelCount = templateList.filter(
                  (t) => t.category.toUpperCase() === cat.id.toUpperCase()
                ).length

                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      if (categoryScroll.hasDragged.current) return
                      setCategoryFilter(cat.id)
                      const el = document.getElementById("featured-models")
                      if (el) el.scrollIntoView({ behavior: "smooth" })
                    }}
                    className={`w-40 sm:w-48 shrink-0 group rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col ${
                      isSelected
                        ? "bg-white ring-2 ring-[#1F3A5C] shadow-lg -translate-y-1 border border-transparent"
                        : "bg-white border border-[#4394C3]/25 hover:border-[#1F3A5C]/40 shadow-xs hover:shadow-xl hover:-translate-y-1.5"
                    }`}
                  >
                    {/* Unified Seamless Visual (No nested box) */}
                    <div className="w-full aspect-square relative overflow-hidden bg-[#EEF4F8] pointer-events-none">
                      {cat.image_url ? (
                        <img
                          src={cat.image_url}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                          loading="lazy"
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = "none"
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#4394C3]">
                          <Package className="w-10 h-10 group-hover:scale-110 transition-transform" />
                        </div>
                      )}

                      {/* Gentle bottom scrim for photo depth */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-50 group-hover:opacity-30 transition-opacity" />

                      {/* Active Status Badge */}
                      {isSelected && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#1F3A5C] text-[#F7CB45] shadow-xs flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-[#F7CB45]" />
                          <span>Dipilih</span>
                        </span>
                      )}

                      {/* Model Count Badge */}
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-white/95 backdrop-blur-md text-[#1F3A5C] shadow-xs border border-white/60">
                        {modelCount} Model
                      </span>
                    </div>

                    {/* Clean Card Body */}
                    <div className="p-3 sm:p-3.5 flex flex-col items-center justify-center text-center bg-white group-hover:bg-[#F9FCFE] transition-colors flex-1">
                      <h3 className="font-extrabold text-[#1F3A5C] text-xs sm:text-sm group-hover:text-[#2F79A6] transition-colors line-clamp-1">
                        {cat.name}
                      </h3>
                      <span className="text-[10px] text-[#4394C3] font-semibold mt-0.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-all">
                        <span>Lihat Koleksi</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </section>

      {/* 4. FEATURED / ALL PACKAGING MODELS CATALOG */}
      <section id="featured-models" className="px-6 py-14 max-w-7xl mx-auto w-full space-y-8 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/20">
          <div className="flex items-center gap-3.5 sm:gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 p-1 flex items-center justify-center shadow-lg">
                <img
                  src="/maskot/tata%20tanpa%20payung.png"
                  alt="Maskot"
                  className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1F3A5C] border border-[#F7CB45] text-[#F7CB45] flex items-center justify-center text-[10px] shadow-xs">
                📐
              </div>
            </div>
            <div>
              <span className="text-[10px] sm:text-[10.5px] font-bold font-mono text-[#F7CB45] uppercase tracking-wider block mb-0.5 sm:mb-1">
                Katalog Kemasan 3D
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                Model Kemasan Siap Kustomisasi
              </h2>
              <p className="text-white/85 text-[11px] sm:text-xs mt-0.5 sm:mt-1 max-w-xl font-medium">
                Pilih salah satu template di bawah untuk membuka 3D Studio interaktif dan mulai mendesain ukuran, material, serta pola potong.
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#1F3A5C]/60" />
            <input
              type="text"
              placeholder="Cari nama model kemasan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-xs pl-9 pr-3 py-2 rounded-xl border border-white focus:border-[#1F3A5C] focus:outline-none transition-all text-[#1F3A5C] placeholder-[#1F3A5C]/60 shadow-sm"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => filterTabsScroll.scroll("left", 200)}
            className="w-8 h-8 shrink-0 rounded-xl border border-white/30 bg-white/90 hover:bg-white flex items-center justify-center text-[#1F3A5C] shadow-sm transition-all active:scale-95"
            title="Geser Tab ke Kiri"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div
            ref={filterTabsScroll.ref}
            onMouseDown={filterTabsScroll.onMouseDown}
            onMouseLeave={filterTabsScroll.onMouseLeave}
            onMouseUp={filterTabsScroll.onMouseUp}
            onMouseMove={filterTabsScroll.onMouseMove}
            className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing pb-1 select-none"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  if (filterTabsScroll.hasDragged.current) return
                  setCategoryFilter(cat.id)
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all shrink-0 ${
                  categoryFilter === cat.id
                    ? "bg-[#1F3A5C] text-[#F7CB45] shadow-md scale-102"
                    : "bg-white/90 hover:bg-white text-[#1F3A5C] border border-white/40"
                }`}
              >
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt=""
                    className="w-4 h-4 rounded-md object-cover shrink-0 border border-neutral-300 pointer-events-none"
                  />
                ) : cat.id !== "ALL" ? (
                  <Package className="w-3.5 h-3.5 text-[#1F3A5C]" />
                ) : null}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => filterTabsScroll.scroll("right", 200)}
            className="w-8 h-8 shrink-0 rounded-xl border border-white/30 bg-white/90 hover:bg-white flex items-center justify-center text-[#1F3A5C] shadow-sm transition-all active:scale-95"
            title="Geser Tab ke Kanan"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Models Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="py-20 text-center text-white/80 space-y-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
            <Package className="w-10 h-10 mx-auto opacity-60 text-white" />
            <p className="font-bold text-white text-base">Model tidak ditemukan</p>
            <p className="text-xs">Coba ubah kata kunci pencarian atau pilih kategori lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => handleSelectTemplateAndStart(tmpl)}
                className="group bg-white rounded-2xl border border-white/80 hover:border-[#1F3A5C] p-4 flex flex-col justify-between cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
              >
                {/* 3D Mockup Visual Box (Clean, Prominent Packaging Character) */}
                <div className="w-full h-52 bg-[#EEF4F8] rounded-xl flex items-center justify-center p-4 group-hover:bg-[#EEF4F8]/80 transition-colors relative overflow-hidden border border-[#4394C3]/15">
                  {/* Badge */}
                  {tmpl.badge && (
                    <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-md bg-[#1F3A5C] text-[#F7CB45] font-bold text-[9px] uppercase tracking-wider font-mono shadow-xs flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-[#F7CB45]" />
                      <span>{tmpl.badge}</span>
                    </div>
                  )}

                  {tmpl.preview_url ? (
                    <img
                      src={tmpl.preview_url}
                      alt={tmpl.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-md"
                    />
                  ) : tmpl.model_3d_url ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <div className="w-24 h-24 rounded-2xl bg-white/90 border border-[#4394C3]/30 shadow-md flex flex-col items-center justify-center gap-1.5 p-3">
                        <Box className="w-10 h-10 text-[#2F79A6] animate-pulse" />
                        <span className="text-[10px] font-black font-mono text-[#1F3A5C] tracking-wider uppercase">
                          {(tmpl.model_format || "GLB").toUpperCase()} MESH
                        </span>
                      </div>
                      <span className="text-[9.5px] text-[#2F79A6] font-semibold mt-2 font-mono">
                        Model 3D Interaktif
                      </span>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex flex-col items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {tmpl.category === "BOX" ? (
                        <svg className="w-28 h-28 text-[#1F3A5C] drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M50 15 L85 33 L50 51 L15 33 Z" fill="#EEF4F8" stroke="#1F3A5C" strokeWidth="2.5" strokeLinejoin="round" />
                          <path d="M15 33 L50 51 L50 85 L15 67 Z" fill="#4394C3" stroke="#1F3A5C" strokeWidth="2.5" strokeLinejoin="round" />
                          <path d="M50 51 L85 33 L85 67 L50 85 Z" fill="#2F79A6" stroke="#1F3A5C" strokeWidth="2.5" strokeLinejoin="round" />
                          <path d="M57 47 L78 36" stroke="#F7CB45" strokeWidth="2" strokeDasharray="3 2" />
                          <path d="M57 58 L78 47" stroke="#F7CB45" strokeWidth="2" strokeDasharray="3 2" />
                        </svg>
                      ) : tmpl.category === "POUCH" ? (
                        <svg className="w-24 h-28 text-[#1F3A5C] drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M28 20 L72 20 L80 82 C80 86, 75 90, 50 90 C25 90, 20 86, 20 82 Z" fill="#EEF4F8" stroke="#1F3A5C" strokeWidth="2.5" strokeLinejoin="round" />
                          <rect x="25" y="14" width="50" height="6" rx="2" fill="#1F3A5C" />
                          <line x1="28" y1="28" x2="72" y2="28" stroke="#2F79A6" strokeWidth="1.5" strokeDasharray="2 2" />
                          <rect x="36" y="42" width="28" height="24" rx="4" fill="#F7CB45" stroke="#1F3A5C" strokeWidth="1.5" />
                        </svg>
                      ) : tmpl.category === "JAR" ? (
                        <svg className="w-26 h-26 text-[#1F3A5C] drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="18" y="24" width="64" height="14" rx="5" fill="#1F3A5C" />
                          <path d="M20 38 L80 38 L78 78 C78 84, 72 88, 50 88 C28 88, 22 84, 22 78 Z" fill="#EEF4F8" stroke="#1F3A5C" strokeWidth="2.5" strokeLinejoin="round" />
                          <rect x="30" y="50" width="40" height="18" rx="2" fill="#4394C3" stroke="#1F3A5C" strokeWidth="1.5" />
                        </svg>
                      ) : tmpl.category === "BOTTLE" ? (
                        <svg className="w-22 h-28 text-[#1F3A5C] drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M42 12 L65 12 L65 16 L50 16 L50 24 L42 24 Z" fill="#1F3A5C" />
                          <rect x="44" y="24" width="12" height="6" fill="#4394C3" />
                          <rect x="30" y="30" width="40" height="58" rx="8" fill="#EEF4F8" stroke="#1F3A5C" strokeWidth="2.5" />
                          <rect x="36" y="46" width="28" height="26" rx="2" fill="#F7CB45" stroke="#1F3A5C" strokeWidth="1.5" />
                        </svg>
                      ) : tmpl.category === "CAN" ? (
                        <svg className="w-24 h-28 text-[#1F3A5C] drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <ellipse cx="50" cy="26" rx="30" ry="10" fill="#1F3A5C" />
                          <path d="M20 26 L20 74 C20 80, 33 85, 50 85 C67 85, 80 80, 80 74 L80 26" fill="#EEF4F8" stroke="#1F3A5C" strokeWidth="2.5" />
                          <ellipse cx="50" cy="26" rx="30" ry="10" fill="#4394C3" stroke="#1F3A5C" strokeWidth="2.5" />
                          <line x1="20" y1="50" x2="80" y2="50" stroke="#F7CB45" strokeWidth="2" strokeDasharray="3 2" />
                        </svg>
                      ) : tmpl.category === "CUP" ? (
                        <svg className="w-24 h-28 text-[#1F3A5C] drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M24 22 L76 22 L70 84 C70 87, 65 90, 50 90 C35 90, 30 87, 30 84 Z" fill="#EEF4F8" stroke="#1F3A5C" strokeWidth="2.5" />
                          <rect x="20" y="16" width="60" height="7" rx="3" fill="#1F3A5C" />
                          <circle cx="50" cy="54" r="14" fill="#F7CB45" stroke="#1F3A5C" strokeWidth="1.5" />
                        </svg>
                      ) : tmpl.category === "TRIANGLE" ? (
                        <svg className="w-26 h-26 text-[#1F3A5C] drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M50 18 L85 78 L15 78 Z" fill="#EEF4F8" stroke="#1F3A5C" strokeWidth="2.5" strokeLinejoin="round" />
                          <path d="M50 18 L50 78 L85 78 Z" fill="#4394C3" stroke="#1F3A5C" strokeWidth="2.5" strokeLinejoin="round" />
                          <line x1="50" y1="18" x2="50" y2="78" stroke="#1F3A5C" strokeWidth="2" />
                        </svg>
                      ) : (
                        <svg className="w-24 h-24 text-[#1F3A5C] drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="20" y="25" width="60" height="50" rx="6" fill="#EEF4F8" stroke="#1F3A5C" strokeWidth="2.5" />
                          <path d="M20 40 L80 40" stroke="#1F3A5C" strokeWidth="2" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>

                {/* Info Details & Button */}
                <div className="pt-3.5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold font-mono text-[#4394C3] uppercase tracking-wider">
                      {tmpl.category}
                    </span>
                    <h3 className="font-bold text-[#1F3A5C] text-sm group-hover:text-[#2F79A6] leading-snug line-clamp-1">
                      {tmpl.name}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectTemplateAndStart(tmpl)
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98"
                  >
                    <span>Buka di 3D Studio</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#F7CB45]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. CONTACT & CUSTOM PACKAGING SECTION */}
      <section id="kontak" className="px-6 py-16 bg-white border-t border-[#4394C3]/20">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[10.5px] font-bold font-mono text-[#4394C3] uppercase tracking-wider block">
              Konsultasi & Hubungi Kami
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1F3A5C] tracking-tight">
              Butuh Cetakan Khusus atau Konsultasi Kemasan UMKM?
            </h2>
            <p className="text-[#1F3A5C]/75 text-xs sm:text-sm leading-relaxed">
              Kunjungi workshop fisik kami atau kirim formulir konsultasi untuk permintaan ukuran kustom, pisau pond, dan sampel cetak.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Map & Workshop Info (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Visual Map Box */}
              <div className="rounded-2xl border border-[#4394C3]/30 overflow-hidden bg-[#EEF4F8] shadow-2xs">
                <div className="h-44 w-full relative bg-[#EEF4F8]">
                  <iframe
                    title="Studio AstaKraft & astacode.id Tasikmalaya"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126589.65991823136!2d108.1718972!3d-7.3274296!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6f575c325c898b%3A0x301e8f1fc28b8e0!2sTasikmalaya%2C%20Jawa%20Barat!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid"
                    className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all opacity-85 hover:opacity-100"
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 left-2 bg-[#1F3A5C]/90 backdrop-blur-xs text-white text-[9.5px] font-mono px-2 py-1 rounded-md flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#F7CB45]" />
                    <span>astacode.id Hub • Tasikmalaya</span>
                  </div>
                </div>

                {/* Details List */}
                <div className="p-4 space-y-3.5 bg-white">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#EEF4F8] border border-[#4394C3]/30 text-[#1F3A5C] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1F3A5C] text-xs">Studio IT &amp; Produksi Desain</h4>
                      <p className="text-[#1F3A5C]/70 text-[11px] leading-relaxed">
                        astacode.id (IT Consultant), Jl. BKR No. 12, Kota Tasikmalaya, Jawa Barat 46115
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#EEF4F8] border border-[#4394C3]/30 text-[#1F3A5C] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1F3A5C] text-xs">Jam Operasional</h4>
                      <p className="text-[#1F3A5C]/70 text-[11px] leading-relaxed">
                        Senin – Sabtu: 08:00 – 18:00 WIB<br />
                        Minggu &amp; Hari Libur: Penjadwalan Khusus
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#EEF4F8] border border-[#4394C3]/30 text-[#1F3A5C] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1F3A5C] text-xs">Email Penawaran &amp; Kemitraan</h4>
                      <a
                        href="mailto:halo@astakraft.id"
                        className="text-[#2F79A6] hover:text-[#1F3A5C] font-semibold text-[11px] transition-colors"
                      >
                        halo@astakraft.id
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Callout */}
              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20AstaKraft,%20saya%20ingin%20konsultasi%20desain%20kemasan%20custom"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#2F79A6] hover:bg-[#1F3A5C] text-white font-bold text-xs flex items-center justify-between transition-all shadow-md group"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#F7CB45]" />
                  <span>Chat WhatsApp Tim Produksi</span>
                </div>
                <span className="font-mono text-[10.5px] text-[#F7CB45] font-bold group-hover:translate-x-0.5 transition-transform">+62 812-3456-7890</span>
              </a>

              {/* Mascot Packaging Consultation Card */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-white via-white to-[#EEF4F8] border-2 border-[#4394C3]/30 shadow-md space-y-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#F7CB45]/15 to-transparent rounded-bl-full pointer-events-none" />
                <div className="flex items-center gap-3.5 relative z-10">
                  <div className="flex -space-x-2.5 shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#EEF4F8] border-2 border-[#F7CB45] p-0.5 shadow-md overflow-hidden transform group-hover:-translate-y-0.5 transition-transform">
                      <img
                        src="/maskot/titi-revisi.png"
                        alt="Maskot"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#EEF4F8] border-2 border-[#1F3A5C] p-0.5 shadow-md overflow-hidden transform group-hover:translate-y-0.5 transition-transform">
                      <img
                        src="/maskot/tata-revisi.png"
                        alt="Maskot"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-[#1F3A5C] text-xs sm:text-sm">Konsultasi Desain &amp; Pisau Pond Cetak</h5>
                    <span className="text-[10px] text-[#2F79A6] font-bold">Layanan Bantuan Teknis UMKM</span>
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-[#1F3A5C]/80 leading-relaxed relative z-10">
                  Ingin kemasan berciri khas khusus, ukuran custom, atau pola pisau pond cetak siap pakai? Tim teknis kami siap mendampingi mulai dari rancangan 3D hingga siap diproduksi di percetakan.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Consultation Form (7 Cols) */}
            <div className="lg:col-span-7 bg-[#EEF4F8] rounded-2xl border border-[#4394C3]/30 p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="border-b border-[#4394C3]/20 pb-3">
                <h3 className="font-bold text-[#1F3A5C] text-sm">Formulir Permintaan Desain &amp; Mockup Custom</h3>
                <p className="text-[#1F3A5C]/70 text-xs">Isi formulir untuk mendapatkan estimasi spesifikasi dan konsultasi pisau pond gratis.</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const form = e.currentTarget
                  const formData = new FormData(form)
                  const name = formData.get("name")
                  const brand = formData.get("brand")
                  const type = formData.get("type")
                  const notes = formData.get("notes")
                  const waText = encodeURIComponent(
                    `Halo AstaKraft, saya ${name} (${brand}). Ingin konsultasi kemasan tipe: ${type}. Detail: ${notes}`
                  )
                  window.open(`https://wa.me/6281234567890?text=${waText}`, "_blank")
                }}
                className="space-y-3.5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#1F3A5C]">Nama Lengkap</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-3 py-2 bg-white border border-[#4394C3]/30 rounded-xl text-xs text-[#1F3A5C] focus:outline-none focus:border-[#2F79A6]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#1F3A5C]">Nama Brand / Usaha</label>
                    <input
                      type="text"
                      name="brand"
                      required
                      placeholder="Contoh: Kopi Nusantara UMKM"
                      className="w-full px-3 py-2 bg-white border border-[#4394C3]/30 rounded-xl text-xs text-[#1F3A5C] focus:outline-none focus:border-[#2F79A6]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#1F3A5C]">Nomor WhatsApp</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3 py-2 bg-white border border-[#4394C3]/30 rounded-xl text-xs text-[#1F3A5C] focus:outline-none focus:border-[#2F79A6]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#1F3A5C]">Jenis Kemasan Dibutuhkan</label>
                    <select
                      name="type"
                      className="w-full px-3 py-2 bg-white border border-[#4394C3]/30 rounded-xl text-xs text-[#1F3A5C] focus:outline-none focus:border-[#2F79A6] font-sans"
                    >
                      <option value="Kotak Persegi / Mailer Box">Kotak Persegi / Mailer Box</option>
                      <option value="Standing Pouch Zipper">Standing Pouch Zipper</option>
                      <option value="Toples Silinder / Jar Kosmetik">Toples Silinder / Jar Kosmetik</option>
                      <option value="Botol Kosmetik & Pump">Botol Kosmetik & Pump</option>
                      <option value="Paper Cup / Gelas Kopi">Paper Cup / Gelas Kopi</option>
                      <option value="Pillow Box Hijab / Aksesoris">Pillow Box Hijab / Aksesoris</option>
                      <option value="Bentuk Khusus Lainnya">Bentuk Khusus Lainnya</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1F3A5C]">Perkiraan Ukuran (P x L x T mm) &amp; Catatan Tambahan</label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Contoh: Ukuran 150 x 100 x 50 mm, bahan Kraft cokelat 350gsm dengan foil emas di bagian logo..."
                    className="w-full px-3 py-2 bg-white border border-[#4394C3]/30 rounded-xl text-xs text-[#1F3A5C] focus:outline-none focus:border-[#2F79A6] resize-none font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
                >
                  <Send className="w-3.5 h-3.5 text-[#F7CB45]" />
                  <span>Kirim Permintaan Konsultasi</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="bg-[#1F3A5C] text-[#EEF4F8] py-10 px-6 border-t border-[#2F79A6]/40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-white/40 overflow-hidden shadow-sm p-0.5 shrink-0">
              <img
                src="/logo/astakraft-primary.jpg"
                alt="Logo AstaKraft"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm block">AstaKraft Studio</span>
              <span className="text-[9.5px] text-[#4394C3]">Kolaborasi astacode.id (IT Consultant Tasikmalaya) &amp; GEKRAFS</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <a href="#kategori" className="hover:text-[#F7CB45] transition-colors">
              Kategori
            </a>
            <a href="#featured-models" className="hover:text-[#F7CB45] transition-colors">
              Model Kemasan
            </a>
            <a href="#kontak" className="hover:text-[#F7CB45] transition-colors">
              Kontak
            </a>
            <a href="/profile" className="hover:text-[#F7CB45] transition-colors">
              Profil &amp; Riwayat
            </a>
            <a href="/admin" className="hover:text-[#F7CB45] transition-colors">
              Admin Portal
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-8 mt-8 border-t border-[#2F79A6]/30 text-center sm:text-left text-[10px] text-[#4394C3] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 AstaKraft. Kolaborasi astacode.id (IT Consultant Tasikmalaya) &amp; GEKRAFS. Hak Cipta Dilindungi.</span>
          <span>Dibangun dengan Next.js, Three.js &amp; Tailwind CSS.</span>
        </div>
      </footer>

      {/* 7. EYE-CATCHING MOBILE FLOATING MASCOT QUICK-PILL */}
      <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden pointer-events-none flex justify-center">
        <button
          type="button"
          onClick={() => handleSelectTemplateAndStart(templateList[0])}
          className="pointer-events-auto bg-[#1F3A5C]/95 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl shadow-[0_12px_32px_rgba(31,58,92,0.4)] border border-[#F7CB45]/50 flex items-center justify-between gap-3 w-full max-w-xs active:scale-95 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#F7CB45]/60 p-0.5 shrink-0 flex items-center justify-center shadow-xs">
              <img
                src="/maskot/titi-revisi.png"
                alt="Maskot"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-black text-white leading-tight flex items-center gap-1.5">
                <span>Studio 3D Kemasan</span>
                <span className="text-[8px] bg-[#F7CB45] text-[#1F3A5C] px-1 py-0.2 rounded font-mono font-bold">AK</span>
              </div>
              <div className="text-[9px] text-[#4394C3] font-medium">Buka Editor &amp; Dieline</div>
            </div>
          </div>
          <div className="w-7 h-7 rounded-xl bg-[#F7CB45] text-[#1F3A5C] flex items-center justify-center font-bold text-xs shadow-xs group-hover:translate-x-0.5 transition-transform">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>
    </div>
  )
}
