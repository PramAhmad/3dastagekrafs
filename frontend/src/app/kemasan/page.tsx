"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Box,
  Layers,
  Sparkles,
  Download,
  Package,
  Search,
  ArrowRight,
  CheckCircle2,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  LogOut,
  Palette,
  ExternalLink,
  Info,
  Maximize2,
  FileBox,
  Scissors,
} from "lucide-react"
import {
  PackagingTemplate,
  CategoryMaster,
  DEFAULT_MASTER_CATEGORIES,
  DEFAULT_PACKAGING_TEMPLATES,
  MASTER_MATERIAL_OPTIONS,
} from "@/types/admin"
import { getCurrentUser, logoutUser } from "@/lib/auth"
import { UserSession } from "@/types/auth"

export default function KemasanCatalogPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null)
  const [templates, setTemplates] = useState<PackagingTemplate[]>(DEFAULT_PACKAGING_TEMPLATES)
  const [masterCategories, setMasterCategories] = useState<CategoryMaster[]>(DEFAULT_MASTER_CATEGORIES)
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")
  
  // Load More State (Display 8 initially, then load more until all 12 are visible)
  const INITIAL_DISPLAY_COUNT = 8
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_DISPLAY_COUNT)
  
  // Selected detail modal
  const [selectedDetailModal, setSelectedDetailModal] = useState<PackagingTemplate | null>(null)

  useEffect(() => {
    setCurrentUser(getCurrentUser())

    // 1. Load custom categories (Local first, then fresh from API)
    const savedCategories = localStorage.getItem("kemasan3d_master_categories")
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMasterCategories(parsed)
        }
      } catch (err) {}
    }

    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          setMasterCategories(json.data)
          localStorage.setItem("kemasan3d_master_categories", JSON.stringify(json.data))
        }
      })
      .catch(() => {})

    // 2. Load custom templates (Local first, then fresh from API)
    const applyTemplatesData = (parsed: any[]) => {
      const ids = new Set(parsed.map((p: any) => p.id))
      const rest = DEFAULT_PACKAGING_TEMPLATES.filter((p) => !ids.has(p.id))
      setTemplates([...parsed, ...rest])
    }

    const savedCustomTemplates = localStorage.getItem("kemasan3d_custom_templates")
    const savedAdminTemplates = localStorage.getItem("kemasan3d_admin_templates")
    const rawTemplatesString = savedCustomTemplates || savedAdminTemplates

    if (rawTemplatesString) {
      try {
        const parsed = JSON.parse(rawTemplatesString)
        if (Array.isArray(parsed) && parsed.length > 0) {
          applyTemplatesData(parsed)
        }
      } catch (e) {}
    }

    fetch("/api/templates")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          applyTemplatesData(json.data)
          localStorage.setItem("kemasan3d_custom_templates", JSON.stringify(json.data))
        }
      })
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    logoutUser()
    setCurrentUser(null)
  }

  const handleStartDesign = (tmplId: string) => {
    if (!currentUser) {
      router.push(`/login?redirect=/editor?template=${tmplId}`)
    } else {
      router.push(`/editor?template=${tmplId}`)
    }
  }

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchCat = categoryFilter === "ALL" || t.category.toUpperCase() === categoryFilter.toUpperCase()
    const matchSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchMaterial =
      selectedMaterialFilter === "ALL" ||
      (t.available_materials && t.available_materials.includes(selectedMaterialFilter))
    return matchCat && matchSearch && matchMaterial
  })

  // Sliced items for Load More
  const displayedTemplates = filteredTemplates.slice(0, visibleCount)
  const hasMore = visibleCount < filteredTemplates.length

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 4)
  }

  const handleShowAll = () => {
    setVisibleCount(filteredTemplates.length)
  }

  // Categories list for filter tabs
  const categoryMap = new Map(masterCategories.map((c) => [c.id.toUpperCase(), c]))
  const distinctCategoryIds = Array.from(
    new Set([
      ...masterCategories.filter((c) => c.is_active).map((c) => c.id.toUpperCase()),
      ...templates.map((t) => t.category.toUpperCase()),
    ])
  )

  const CATEGORIES = [
    { id: "ALL", label: "Semua Kategori", image_url: undefined },
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
    <div className="min-h-screen w-full bg-[#EEF4F8] text-[#1F3A5C] flex flex-col font-sans select-none text-xs antialiased">
      {/* 1. NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#D5E4F0] px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#4394C3]/30 overflow-hidden shadow-xs group-hover:border-[#1F3A5C] transition-all p-0.5 shrink-0">
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
              <span className="text-[9px] text-[#2F79A6] font-medium tracking-tight mt-0.5">
                Katalog Kemasan 3D
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-xs font-bold text-[#1F3A5C]/80">
            <Link
              href="/"
              className="hover:text-[#1F3A5C] hover:bg-[#EEF4F8] px-2.5 py-1 rounded-lg transition-all"
            >
              Beranda
            </Link>
            <Link
              href="/#kategori"
              className="hover:text-[#1F3A5C] hover:bg-[#EEF4F8] px-2.5 py-1 rounded-lg transition-all"
            >
              Kategori Kemasan
            </Link>
            <Link
              href="/kemasan"
              className="text-[#2F79A6] bg-[#EEF4F8] px-2.5 py-1 rounded-lg transition-all"
            >
              Katalog Model
            </Link>
            <Link
              href="/editor"
              className="hover:text-[#1F3A5C] hover:bg-[#EEF4F8] px-2.5 py-1 rounded-lg transition-all"
            >
              3D Studio Editor
            </Link>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="px-3.5 py-1.5 rounded-xl bg-[#EEF4F8] hover:bg-[#4394C3]/20 text-[#1F3A5C] font-bold text-xs border border-[#4394C3]/30 transition-all flex items-center gap-1.5 shadow-2xs"
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
              </Link>
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
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-xl text-[#1F3A5C] hover:text-[#2F79A6] font-bold text-xs transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/daftar-umkm"
                className="px-3.5 py-1.5 rounded-xl bg-[#F7CB45] hover:bg-[#F7CB45]/90 text-[#1F3A5C] font-black text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 border border-[#F7CB45]/80"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#1F3A5C]" />
                <span>Mitra UMKM</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* 2. CATALOG HEADER HERO BANNER */}
      <section className="bg-gradient-to-b from-white to-[#EEF4F8] border-b border-[#D5E4F0] px-4 sm:px-8 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1F3A5C] text-[#F7CB45] font-mono text-[10px] font-bold shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#F7CB45]" />
              <span>KOLEKSI LENGKAP {templates.length > 0 ? `${templates.length} ` : ""}MODEL KEMASAN</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-[#1F3A5C] tracking-tight leading-tight">
              Katalog Model Kemasan 3D &amp; Dieline Presisi
            </h1>
            <p className="text-[#4B6B94] text-xs sm:text-sm font-medium leading-relaxed">
              Jelajahi seluruh varian kemasan produk UMKM, mulai dari mailer box kardus kraft, standing pouch, toples kosmetik, botol pump, tin canister, hingga slide drawer hampers. Setiap model memiliki opsi bahan yang disesuaikan dan siap diexport ke blueprint cetak PDF/SVG.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 font-mono text-[11px] font-bold text-[#1F3A5C]">
              <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-[#D5E4F0]">
                📦 {templates.length > 0 ? templates.length : 12} Model Siap Desain
              </span>
              <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-[#D5E4F0]">
                🎨 11 Pilihan Bahan Khusus
              </span>
              <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-[#D5E4F0]">
                📐 Dieline Otomatis Milimeter
              </span>
            </div>
          </div>

          {/* Mascot Companion Mini Showcase */}
          <div className="shrink-0 flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-[#D5E4F0] shadow-md">
            <div className="w-16 h-16 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] overflow-hidden p-1 flex items-center justify-center shrink-0">
              <img
                src="/maskot/tata%20ckg.png"
                alt="Maskot Tata"
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-[#2F79A6] block">Panduan Studio</span>
              <p className="font-extrabold text-[#1F3A5C] text-xs leading-snug">
                Pilih model kemasan favoritmu!
              </p>
              <span className="text-[10px] text-[#718BAA] block">
                Klik tombol "Desain di Studio 3D" untuk mulai kustomisasi.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SEARCH & FILTER CONTROLS */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-8 pb-4 space-y-4">
        {/* Search Bar & Material Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#D5E4F0] shadow-xs">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#718BAA]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setVisibleCount(INITIAL_DISPLAY_COUNT)
              }}
              placeholder="Cari nama kemasan, jenis toples, botol, mailer box..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] text-xs text-[#1F3A5C] font-medium placeholder:text-[#718BAA] focus:outline-none focus:border-[#4394C3] focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#718BAA] hover:text-[#1F3A5C] bg-[#D5E4F0] w-4 h-4 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          {/* Material Quick Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-[#4B6B94] shrink-0 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-[#2F79A6]" />
              Filter Bahan:
            </span>
            <select
              value={selectedMaterialFilter}
              onChange={(e) => {
                setSelectedMaterialFilter(e.target.value)
                setVisibleCount(INITIAL_DISPLAY_COUNT)
              }}
              className="bg-[#EEF4F8] border border-[#D5E4F0] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1F3A5C] focus:outline-none focus:border-[#4394C3] cursor-pointer"
            >
              <option value="ALL">Semua Jenis Bahan ({MASTER_MATERIAL_OPTIONS.length})</option>
              {MASTER_MATERIAL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.subtitle})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => {
            const isSelected = categoryFilter.toUpperCase() === cat.id.toUpperCase()
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoryFilter(cat.id)
                  setVisibleCount(INITIAL_DISPLAY_COUNT)
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? "bg-[#1F3A5C] text-[#F7CB45] shadow-xs scale-102"
                    : "bg-white hover:bg-[#EEF4F8] text-[#1F3A5C] border border-[#D5E4F0]"
                }`}
              >
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt=""
                    className="w-4 h-4 rounded-md object-cover shrink-0 pointer-events-none"
                  />
                ) : cat.id !== "ALL" ? (
                  <Package className="w-3.5 h-3.5 text-[#2F79A6]" />
                ) : null}
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 4. PACKAGING MODELS GRID */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#4B6B94] text-xs">
            Menampilkan <span className="text-[#1F3A5C] font-extrabold">{displayedTemplates.length}</span> dari{" "}
            <span className="text-[#1F3A5C] font-extrabold">{filteredTemplates.length}</span> model kemasan
          </span>
          {hasMore && (
            <button
              onClick={handleShowAll}
              className="text-[#2F79A6] hover:underline font-bold text-xs"
            >
              Tampilkan Semua ({filteredTemplates.length})
            </button>
          )}
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-[#D5E4F0] p-8 space-y-2">
            <Package className="w-10 h-10 mx-auto text-[#718BAA]" />
            <h3 className="font-extrabold text-[#1F3A5C] text-sm">Tidak ada model kemasan yang sesuai</h3>
            <p className="text-xs text-[#718BAA]">
              Coba sesuaikan kata kunci pencarian atau ubah filter bahan/kategori.
            </p>
            <button
              onClick={() => {
                setSearchQuery("")
                setCategoryFilter("ALL")
                setSelectedMaterialFilter("ALL")
              }}
              className="mt-3 px-4 py-2 rounded-xl bg-[#1F3A5C] text-white font-bold text-xs"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {displayedTemplates.map((tmpl) => {
              const materials = tmpl.available_materials || ["corrugated", "kraft", "matte_art", "glossy"]
              return (
                <div
                  key={tmpl.id}
                  onClick={() => handleStartDesign(tmpl.id)}
                  className="group bg-white rounded-2xl border border-[#D5E4F0] hover:border-[#1F3A5C] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 cursor-pointer relative"
                >
                  {/* Full-Bleed 3D Visual Preview Area (Full Width & Auto Crop) */}
                  <div className="w-full aspect-square bg-[#EEF4F8] relative overflow-hidden flex items-center justify-center group-hover:bg-[#E5EFF5] transition-colors">
                    {/* Top Badge */}
                    {tmpl.badge && (
                      <div className="absolute top-3 right-3 z-10 px-2.5 py-0.5 rounded-full bg-[#1F3A5C] text-[#F7CB45] font-bold text-[9px] uppercase tracking-wider font-mono shadow-xs flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-[#F7CB45]" />
                        <span>{tmpl.badge}</span>
                      </div>
                    )}

                    {/* 3D Format Pill */}
                    <div className="absolute bottom-3 left-3 z-10 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs border border-white/80 text-[#1F3A5C] font-mono text-[9px] font-bold shadow-xs flex items-center gap-1">
                      <Box className="w-3 h-3 text-[#2F79A6]" />
                      <span>{(tmpl.model_format || "GLB").toUpperCase()}</span>
                    </div>

                    {tmpl.preview_url ? (
                      <img
                        src={tmpl.preview_url}
                        alt={tmpl.name}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out pointer-events-none"
                      />
                    ) : tmpl.model_3d_url ? (
                      <div className="p-5 flex flex-col items-center justify-center gap-1.5 group-hover:scale-108 transition-transform duration-300">
                        <div className="w-16 h-16 rounded-2xl bg-white/90 border border-[#4394C3]/30 shadow-md flex flex-col items-center justify-center gap-1 p-2">
                          <Box className="w-8 h-8 text-[#2F79A6] animate-pulse" />
                          <span className="text-[9px] font-black font-mono text-[#1F3A5C] tracking-wider uppercase">
                            {(tmpl.model_format || "GLB").toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[9px] text-[#2F79A6] font-bold font-mono">
                          3D Mesh Interaktif
                        </span>
                      </div>
                    ) : (
                      <div className="p-5 relative w-full h-full flex flex-col items-center justify-center group-hover:scale-108 transition-transform duration-300">
                        {tmpl.category === "BOX" ? (
                          <svg className="w-24 h-24 text-[#1F3A5C] drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M50 15 L85 33 L50 51 L15 33 Z" fill="#EEF4F8" stroke="#1F3A5C" strokeWidth="2.5" strokeLinejoin="round" />
                            <path d="M15 33 L50 51 L50 85 L15 67 Z" fill="#4394C3" stroke="#1F3A5C" strokeWidth="2.5" strokeLinejoin="round" />
                            <path d="M50 51 L85 33 L85 67 L50 85 Z" fill="#2F79A6" stroke="#1F3A5C" strokeWidth="2.5" strokeLinejoin="round" />
                            <path d="M57 47 L78 36" stroke="#F7CB45" strokeWidth="2" strokeDasharray="3 2" />
                            <path d="M57 58 L78 47" stroke="#F7CB45" strokeWidth="2" strokeDasharray="3 2" />
                          </svg>
                        ) : tmpl.category === "POUCH" ? (
                          <svg className="w-22 h-24 text-[#1F3A5C] drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M28 20 L72 20 L80 82 C80 86, 75 90, 50 90 C25 90, 20 86, 20 82 Z" fill="#EEF4F8" stroke="#1F3A5C" strokeWidth="2.5" strokeLinejoin="round" />
                            <rect x="25" y="14" width="50" height="6" rx="2" fill="#1F3A5C" />
                            <line x1="28" y1="28" x2="72" y2="28" stroke="#2F79A6" strokeWidth="1.5" strokeDasharray="2 2" />
                            <rect x="36" y="42" width="28" height="24" rx="4" fill="#F7CB45" stroke="#1F3A5C" strokeWidth="1.5" />
                          </svg>
                        ) : tmpl.category === "JAR" ? (
                          <svg className="w-22 h-22 text-[#1F3A5C] drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="18" y="24" width="64" height="14" rx="5" fill="#1F3A5C" />
                            <path d="M20 38 L80 38 L78 78 C78 84, 72 88, 50 88 C28 88, 22 84, 22 78 Z" fill="#EEF4F8" stroke="#1F3A5C" strokeWidth="2.5" strokeLinejoin="round" />
                            <rect x="30" y="50" width="40" height="18" rx="2" fill="#4394C3" stroke="#1F3A5C" strokeWidth="1.5" />
                          </svg>
                        ) : tmpl.category === "BOTTLE" ? (
                          <svg className="w-20 h-24 text-[#1F3A5C] drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M42 12 L65 12 L65 16 L50 16 L50 24 L42 24 Z" fill="#1F3A5C" />
                            <rect x="44" y="24" width="12" height="6" fill="#4394C3" />
                            <rect x="30" y="30" width="40" height="58" rx="8" fill="#EEF4F8" stroke="#1F3A5C" strokeWidth="2.5" />
                            <rect x="36" y="46" width="28" height="26" rx="2" fill="#F7CB45" stroke="#1F3A5C" strokeWidth="1.5" />
                          </svg>
                        ) : tmpl.category === "CAN" ? (
                          <svg className="w-20 h-24 text-[#1F3A5C] drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <ellipse cx="50" cy="26" rx="30" ry="10" fill="#1F3A5C" />
                            <path d="M20 26 L20 74 C20 80, 33 85, 50 85 C67 85, 80 80, 80 74 L80 26" fill="#EEF4F8" stroke="#1F3A5C" strokeWidth="2.5" />
                            <ellipse cx="50" cy="26" rx="30" ry="10" fill="#4394C3" stroke="#1F3A5C" strokeWidth="2.5" />
                            <line x1="20" y1="50" x2="80" y2="50" stroke="#F7CB45" strokeWidth="2" strokeDasharray="3 2" />
                          </svg>
                        ) : tmpl.category === "CUP" ? (
                          <svg className="w-20 h-24 text-[#1F3A5C] drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M24 22 L76 22 L70 84 C70 87, 65 90, 50 90 C35 90, 30 87, 30 84 Z" fill="#EEF4F8" stroke="#1F3A5C" strokeWidth="2.5" />
                            <rect x="20" y="16" width="60" height="7" rx="3" fill="#1F3A5C" />
                            <circle cx="50" cy="54" r="14" fill="#F7CB45" stroke="#1F3A5C" strokeWidth="1.5" />
                          </svg>
                        ) : tmpl.category === "TRIANGLE" ? (
                          <svg className="w-22 h-22 text-[#1F3A5C] drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M50 18 L85 78 L15 78 Z" fill="#EEF4F8" stroke="#1F3A5C" strokeWidth="2.5" strokeLinejoin="round" />
                            <path d="M50 18 L50 78 L85 78 Z" fill="#4394C3" stroke="#1F3A5C" strokeWidth="2.5" strokeLinejoin="round" />
                            <line x1="50" y1="18" x2="50" y2="78" stroke="#1F3A5C" strokeWidth="2" />
                          </svg>
                        ) : (
                          <svg className="w-20 h-20 text-[#1F3A5C] drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="20" y="25" width="60" height="50" rx="6" fill="#EEF4F8" stroke="#1F3A5C" strokeWidth="2.5" />
                            <path d="M20 40 L80 40" stroke="#1F3A5C" strokeWidth="2" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Clean, Simple Model Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3 bg-white">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#EEF4F8] text-[#1F3A5C] font-mono text-[9.5px] uppercase font-bold">
                          {tmpl.category}
                        </span>
                        <span className="text-[10.5px] font-mono text-[#718BAA]">
                          {tmpl.default_dimensions ? (
                            tmpl.category === "JAR" || tmpl.category === "BOTTLE" || tmpl.category === "CAN" || tmpl.category === "CUP" ? (
                              `Ø${(tmpl.default_dimensions.radius_mm || 25) * 2} × ${tmpl.default_dimensions.height_mm || 35} mm`
                            ) : (
                              `${tmpl.default_dimensions.length_mm || 65}×${tmpl.default_dimensions.width_mm || 45}×${tmpl.default_dimensions.height_mm || 35} mm`
                            )
                          ) : (
                            "Dimensi Bebas"
                          )}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-[#1F3A5C] text-sm group-hover:text-[#2F79A6] transition-colors line-clamp-1">
                        {tmpl.name}
                      </h3>
                      <p className="text-[11px] text-[#4B6B94] line-clamp-1 leading-snug">
                        {tmpl.description}
                      </p>
                    </div>

                    {/* Simple Action CTAs */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartDesign(tmpl.id)
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-[#1F3A5C] group-hover:bg-[#2F79A6] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98"
                      >
                        <Box className="w-3.5 h-3.5 text-[#F7CB45]" />
                        <span>Desain 3D</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDetailModal(tmpl)
                        }}
                        className="p-2.5 rounded-xl bg-[#EEF4F8] hover:bg-[#D5E4F0] text-[#1F3A5C] transition-all border border-[#D5E4F0]"
                        title="Lihat Rincian Spesifikasi & Dieline"
                      >
                        <Info className="w-4 h-4 text-[#2F79A6]" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 5. LOAD MORE CONTROLS */}
        {hasMore ? (
          <div className="pt-6 pb-12 flex flex-col items-center justify-center gap-2">
            <button
              onClick={handleLoadMore}
              className="px-6 py-3 rounded-2xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95 hover:shadow-lg"
            >
              <span>Muat Lebih Banyak Model Kemasan</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[#F7CB45] text-[10px] font-mono">
                +{Math.min(4, filteredTemplates.length - visibleCount)} Model
              </span>
            </button>
            <span className="text-[10px] text-[#718BAA] font-mono">
              Menampilkan {displayedTemplates.length} dari {filteredTemplates.length} model
            </span>
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="pt-6 pb-12 text-center">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#D5E4F0] text-[#4B6B94] font-bold text-xs shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Semua {filteredTemplates.length} model kemasan telah ditampilkan</span>
            </span>
          </div>
        ) : null}
      </main>

      {/* MODAL: DETAIL SPESIFIKASI MODEL KEMASAN */}
      {selectedDetailModal && (
        <div className="fixed inset-0 z-50 bg-[#1F3A5C]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#D5E4F0] rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D5E4F0] pb-3">
              <div>
                <span className="text-[9.5px] font-bold font-mono text-[#2F79A6] uppercase tracking-wider block">
                  Detail Model Kemasan
                </span>
                <h3 className="text-base font-black text-[#1F3A5C]">
                  {selectedDetailModal.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailModal(null)}
                className="w-7 h-7 rounded-full bg-[#EEF4F8] hover:bg-[#D5E4F0] text-[#1F3A5C] flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-[#4B6B94] leading-relaxed">
                {selectedDetailModal.description}
              </p>

              {/* Dimension Specs */}
              <div className="p-3.5 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] space-y-1.5">
                <span className="font-extrabold text-[#1F3A5C] block text-[11px]">
                  Dimensi Bawaan Standar (mm):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg border border-[#D5E4F0]">
                    <span className="text-[9.5px] text-[#718BAA] block">Panjang</span>
                    <span className="font-extrabold text-[#1F3A5C]">
                      {selectedDetailModal.default_dimensions?.length_mm || "-"} mm
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-[#D5E4F0]">
                    <span className="text-[9.5px] text-[#718BAA] block">Lebar</span>
                    <span className="font-extrabold text-[#1F3A5C]">
                      {selectedDetailModal.default_dimensions?.width_mm || "-"} mm
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-[#D5E4F0]">
                    <span className="text-[9.5px] text-[#718BAA] block">Tinggi</span>
                    <span className="font-extrabold text-[#1F3A5C]">
                      {selectedDetailModal.default_dimensions?.height_mm || "-"} mm
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-[#D5E4F0]">
                    <span className="text-[9.5px] text-[#718BAA] block">Radius / Ø</span>
                    <span className="font-extrabold text-[#1F3A5C]">
                      {selectedDetailModal.default_dimensions?.radius_mm
                        ? `Ø${selectedDetailModal.default_dimensions.radius_mm * 2} mm`
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Supported Materials */}
              <div className="space-y-2">
                <span className="font-extrabold text-[#1F3A5C] block text-[11px]">
                  Material yang Didukung untuk Model Ini:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(selectedDetailModal.available_materials || ["corrugated", "kraft", "matte_art", "glossy"]).map((matId) => {
                    const matObj = MASTER_MATERIAL_OPTIONS.find((m) => m.id === matId)
                    return (
                      <div
                        key={matId}
                        className="flex items-center gap-2 p-2 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0]"
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-neutral-300 shrink-0"
                          style={{ backgroundColor: matObj?.color || "#94a3b8" }}
                        />
                        <div className="truncate">
                          <span className="font-bold text-[#1F3A5C] block truncate">
                            {matObj?.name || matId}
                          </span>
                          <span className="text-[9.5px] text-[#718BAA] block truncate">
                            {matObj?.subtitle}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Modal CTA */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#D5E4F0]">
                <button
                  onClick={() => setSelectedDetailModal(null)}
                  className="px-4 py-2 rounded-xl bg-[#EEF4F8] hover:bg-[#D5E4F0] text-[#1F3A5C] font-bold text-xs"
                >
                  Tutup
                </button>
                <button
                  onClick={() => handleStartDesign(selectedDetailModal.id)}
                  className="px-5 py-2 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Box className="w-3.5 h-3.5 text-[#F7CB45]" />
                  <span>Buka di 3D Studio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. FOOTER */}
      <footer className="bg-white border-t border-[#D5E4F0] px-4 sm:px-8 py-8 mt-auto text-center text-xs text-[#718BAA]">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="font-bold text-[#1F3A5C]">
            AstaKraft — Kolaborasi <span className="text-[#2F79A6]">astacode.id</span> (IT Consultant Tasikmalaya) &amp; <span className="text-[#F7CB45]">GEKRAFS</span> (Gerakan Ekonomi Kreatif Nasional)
          </p>
          <p className="text-[11px]">
            Platform simulator kemasan 3D &amp; CAD dieline presisi milimeter terintegrasi untuk akselerasi UMKM Indonesia.
          </p>
        </div>
      </footer>
    </div>
  )
}
