"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, getUserSavedProjects, deleteSavedProject, saveProjectToHistory, logoutUser } from "@/lib/auth"
import { UserSession, SavedProject } from "@/types/auth"
import { formatRupiah } from "@/lib/utils"
import { BRAND_COLORS } from "@/lib/theme"
import {
  Box,
  Layers,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  ArrowLeft,
  Calendar,
  Clock,
  Package,
  LogOut,
  Sparkles,
  ChevronRight,
  Circle,
  Square,
  Triangle,
} from "lucide-react"

export default function HistoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserSession | null>(null)
  const [projects, setProjects] = useState<SavedProject[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/login?redirect=/history")
      return
    }
    setUser(currentUser)
    setProjects(getUserSavedProjects(currentUser.id))
    setLoading(false)
  }, [router])

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Apakah Anda yakin ingin menghapus proyek desain ini dari riwayat?")) {
      deleteSavedProject(id)
      if (user) {
        setProjects(getUserSavedProjects(user.id))
      }
    }
  }

  const handleDuplicate = (project: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return
    const duplicated = saveProjectToHistory({
      userId: user.id,
      name: `${project.name} (Copy)`,
      templateId: project.templateId,
      templateName: project.templateName,
      category: project.category,
      description: project.description,
      dimensions: { ...project.dimensions },
      materialId: project.materialId,
      materialName: project.materialName,
      boxColor: project.boxColor,
      objects: [...project.objects],
      previewUrl: project.previewUrl,
      model3dUrl: project.model3dUrl,
      modelFormat: project.modelFormat,
    })
    setProjects(getUserSavedProjects(user.id))
    router.push(`/editor?projectId=${duplicated.id}`)
  }

  const handleLogout = () => {
    logoutUser()
    router.push("/login")
  }

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEF4F8] flex items-center justify-center text-xs text-[#1F3A5C] font-bold">
        Memeriksa sesi login...
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#4394C3] text-[#1F3A5C] font-sans select-none flex flex-col antialiased">
      {/* 1. TOP NAVBAR */}
      <header className="h-16 shrink-0 bg-white/95 backdrop-blur-md border-b border-white/20 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#4394C3]/30 overflow-hidden p-0.5 shadow-sm group-hover:border-[#1F3A5C] transition-all shrink-0">
              <img
                src="/logo/astakraft-primary.jpg"
                alt="Logo AstaKraft"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <span className="font-extrabold text-[#1F3A5C] tracking-tight text-sm block leading-tight">
                AstaKraft
              </span>
              <span className="text-[9.5px] text-[#2F79A6] block font-mono">STUDIO & DIELINE</span>
            </div>
          </a>

          <div className="h-4 w-px bg-[#D5E4F0] hidden sm:block" />

          <span className="text-xs font-bold text-[#1F3A5C] hidden sm:block">
            Riwayat Desain & Proyek Saya
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => router.push("/editor")}
            className="px-4 py-2 rounded-xl bg-[#F7CB45] hover:bg-[#E5B932] text-[#1F3A5C] font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Mulai Desain Baru</span>
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-[#D5E4F0]">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="w-7 h-7 rounded-full object-cover border border-[#D5E4F0]"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#1F3A5C] text-[#F7CB45] text-[10px] font-bold flex items-center justify-center">
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="hidden md:block text-left">
              <span className="font-bold text-[11px] block leading-tight text-[#1F3A5C]">{user?.name}</span>
              <span className="text-[9.5px] text-[#2F79A6] block">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-[#EEF4F8] text-[#718BAA] hover:text-red-600 transition-colors ml-1"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-10 space-y-8">
        {/* Header Title & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/20 bg-white/90 backdrop-blur-md p-6 rounded-3xl border shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#2F79A6] mb-1 font-bold">
              <a href="/" className="hover:text-[#1F3A5C] transition-colors">
                Beranda
              </a>
              <span>/</span>
              <span className="text-[#1F3A5C]">Riwayat Desain</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F3A5C] tracking-tight">
              Riwayat Desain Kemasan
            </h1>
            <p className="text-[#2F79A6] text-xs mt-1 font-medium">
              Kelola dan lanjutkan pengeditan kemasan yang telah Anda simpan sebelumnya.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#718BAA]" />
              <input
                type="text"
                placeholder="Cari nama desain / kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#EEF4F8] text-xs text-[#1F3A5C] pl-9 pr-3 py-2 rounded-xl border border-[#D5E4F0] focus:border-[#4394C3] focus:outline-none transition-all shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-[#D5E4F0] shadow-sm p-8 space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF4F8] flex items-center justify-center mx-auto text-[#2F79A6]">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-[#1F3A5C] text-sm">Belum Ada Riwayat Desain</h3>
              <p className="text-[#718BAA] text-xs">
                {searchQuery
                  ? "Tidak ada proyek yang sesuai dengan kata kunci pencarian Anda."
                  : "Anda belum menyimpan desain kemasan. Buka 3D editor dan simpan rancangan pertama Anda!"}
              </p>
            </div>
            <button
              onClick={() => router.push("/editor")}
              className="px-5 py-2.5 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-xs transition-all shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-[#F7CB45]" />
              <span>Buat Desain Kemasan Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/editor?projectId=${p.id}`)}
                className="group bg-white rounded-2xl border border-[#D5E4F0] hover:border-[#4394C3] p-4 flex flex-col justify-between cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 relative overflow-hidden"
              >
                {/* Visual Thumbnail */}
                <div className="w-full h-40 bg-[#EEF4F8] rounded-xl border border-[#D5E4F0] flex items-center justify-center relative overflow-hidden group-hover:bg-[#E2EDF5] transition-colors p-3">
                  <div
                    className="w-20 h-20 rounded-2xl shadow-md border border-black/10 flex flex-col items-center justify-center group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: p.boxColor || "#ba8b57" }}
                  >
                    {p.category === "POUCH" ? (
                      <Layers className="w-8 h-8 text-white/90" />
                    ) : p.category === "JAR" ? (
                      <Circle className="w-8 h-8 text-white/90" />
                    ) : p.category === "BOTTLE" ? (
                      <Square className="w-8 h-8 text-white/90" />
                    ) : p.category === "TRIANGLE" ? (
                      <Triangle className="w-8 h-8 text-white/90" />
                    ) : (
                      <Box className="w-8 h-8 text-white/90" />
                    )}
                    <span className="text-[8px] text-white/80 font-mono font-bold mt-1">
                      {p.dimensions.length}×{p.dimensions.width}×{p.dimensions.height}
                    </span>
                  </div>

                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#1F3A5C] text-[#F7CB45] font-mono text-[8px] font-extrabold shadow-xs">
                    {p.category}
                  </div>

                  {/* Material Tag */}
                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-white/95 border border-[#D5E4F0] text-[#1F3A5C] text-[8.5px] font-bold backdrop-blur shadow-xs">
                    {p.materialName}
                  </div>
                </div>

                {/* Details */}
                <div className="pt-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-[#1F3A5C] text-sm group-hover:text-[#2F79A6] leading-snug line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-[#718BAA] text-[10.5px] mt-0.5 line-clamp-1">
                      {p.templateName}
                    </p>
                  </div>

                  {/* Dimensions & Date */}
                  <div className="pt-2 border-t border-[#EEF4F8] space-y-2 text-[10.5px]">
                    <div className="flex justify-between text-[#4B6B94]">
                      <span>Dimensi (mm):</span>
                      <span className="font-mono font-bold text-[#1F3A5C]">
                        {p.dimensions.length} × {p.dimensions.width} × {p.dimensions.height} mm
                      </span>
                    </div>

                    <div className="flex justify-between text-[#718BAA] text-[9.5px]">
                      <span>Disimpan:</span>
                      <span>{new Date(p.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/editor?projectId=${p.id}`)
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-[10.5px] flex items-center justify-center gap-1 shadow-xs transition-all"
                      >
                        <span>Lanjutkan Edit</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#F7CB45]" />
                      </button>

                      <button
                        onClick={(e) => handleDuplicate(p, e)}
                        className="p-1.5 rounded-xl border border-[#D5E4F0] hover:bg-[#EEF4F8] text-[#1F3A5C] transition-colors"
                        title="Duplikat Desain"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(p.id, e)}
                        className="p-1.5 rounded-xl border border-[#D5E4F0] hover:bg-red-50 text-[#718BAA] hover:text-red-600 transition-colors"
                        title="Hapus dari Riwayat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
