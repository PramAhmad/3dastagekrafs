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
                  className="group bg-white rounded-2xl border border-[#D5E4F0] hover:border-[#1F3A5C] p-4 flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1 relative"
                >
                  {/* Top Badge */}
                  {tmpl.badge && (
                    <div className="absolute top-6 right-6 z-10 px-2 py-0.5 rounded-md bg-[#1F3A5C] text-[#F7CB45] font-bold text-[9px] uppercase tracking-wider font-mono shadow-xs flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-[#F7CB45]" />
                      <span>{tmpl.badge}</span>
                    </div>
                  )}

                  {/* 3D Visual Preview Area */}
                  <div
                    onClick={() => handleStartDesign(tmpl.id)}
                    className="w-full aspect-square bg-[#EEF4F8] rounded-xl flex items-center justify-center p-4 cursor-pointer overflow-hidden border border-[#D5E4F0] relative group-hover:bg-[#EEF4F8]/80 transition-colors"
                  >
                    {tmpl.preview_url ? (
                      <img
                        src={tmpl.preview_url}
                        alt={tmpl.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-md"
                      />
                    ) : tmpl.model_3d_url ? (
                      <div className="flex flex-col items-center justify-center gap-1.5 group-hover:scale-110 transition-transform duration-300">
                        <div className="w-20 h-20 rounded-2xl bg-white/90 border border-[#4394C3]/30 shadow-md flex flex-col items-center justify-center gap-1 p-2">
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
                      <div className="flex flex-col items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Box className="w-20 h-20 text-[#2F79A6]" />
                        <span className="text-[9.5px] font-mono font-bold text-[#1F3A5C] mt-2">
                          Parametrik CAD 3D
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Model Meta Information */}
                  <div className="pt-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-[#EEF4F8] border border-[#D5E4F0] text-[#1F3A5C] font-mono text-[9px] uppercase font-bold">
                          {tmpl.category}
                        </span>
                        <span className="text-[10px] font-mono text-[#718BAA]">
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

                      <h3
                        onClick={() => handleStartDesign(tmpl.id)}
                        className="font-extrabold text-[#1F3A5C] text-sm group-hover:text-[#2F79A6] cursor-pointer transition-colors line-clamp-1"
                      >
                        {tmpl.name}
                      </h3>
                      <p className="text-[10.5px] text-[#4B6B94] line-clamp-2 mt-0.5 leading-snug">
                        {tmpl.description}
                      </p>
                    </div>

                    {/* Available Materials Swatches */}
                    <div className="pt-2 border-t border-[#EEF4F8] space-y-1">
                      <div className="flex items-center justify-between text-[9.5px] text-[#718BAA]">
                        <span>Bahan Tersedia:</span>
                        <span className="font-bold text-[#1F3A5C]">{materials.length} Pilihan</span>
                      </div>
                      <div className="flex items-center gap-1 overflow-hidden">
                        {materials.slice(0, 5).map((matId) => {
                          const matObj = MASTER_MATERIAL_OPTIONS.find((m) => m.id === matId)
                          return (
                            <span
                              key={matId}
                              className="w-4 h-4 rounded-full border border-neutral-300 shrink-0 shadow-2xs"
                              style={{ backgroundColor: matObj?.color || "#94a3b8" }}
                              title={matObj ? `${matObj.name} (${matObj.subtitle})` : matId}
                            />
                          )
                        })}
                        {materials.length > 5 && (
                          <span className="text-[9px] text-[#718BAA] font-bold">
                            +{materials.length - 5}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action CTAs */}
                    <div className="pt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleStartDesign(tmpl.id)}
                        className="flex-1 py-2 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 group/btn"
                      >
                        <Box className="w-3.5 h-3.5 text-[#F7CB45]" />
                        <span>Desain 3D</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>

                      <button
                        onClick={() => setSelectedDetailModal(tmpl)}
                        className="p-2 rounded-xl bg-[#EEF4F8] hover:bg-[#D5E4F0] text-[#1F3A5C] transition-all border border-[#D5E4F0]"
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
