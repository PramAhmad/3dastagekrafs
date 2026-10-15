"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  getCurrentUser,
  setCurrentUser,
  getUserSavedProjects,
  deleteSavedProject,
  saveProjectToHistory,
  logoutUser,
} from "@/lib/auth"
import { UserSession, SavedProject } from "@/types/auth"
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
  User,
  Settings,
  History,
  Save,
  CheckCircle2,
  Phone,
  Mail,
  Building,
  MapPin,
  Camera,
} from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserSession | null>(null)
  const [activeTab, setActiveTab] = useState<"history" | "profile">("history")
  const [projects, setProjects] = useState<SavedProject[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  // Profile Edit Form State
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [brandName, setBrandName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [bio, setBio] = useState("")
  const [avatar, setAvatar] = useState("")
  const [profileSuccessNotice, setProfileSuccessNotice] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/login?redirect=/profile")
      return
    }
    setUser(currentUser)
    setName(currentUser.name || "")
    setEmail(currentUser.email || "")
    setBrandName(currentUser.brandName || "UMKM Mandiri")
    setPhone(currentUser.phone || "081234567890")
    setAddress(currentUser.address || "Bandung, Jawa Barat")
    setBio(currentUser.bio || "Produsen kemasan produk kreatif & retail.")
    setAvatar(currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80")
    setProjects(getUserSavedProjects(currentUser.id))
    setLoading(false)
  }, [router])

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const updatedUser: UserSession = {
      ...user,
      name,
      email,
      brandName,
      phone,
      address,
      bio,
      avatar,
    }

    setCurrentUser(updatedUser)
    setUser(updatedUser)
    setProfileSuccessNotice(true)
    setTimeout(() => setProfileSuccessNotice(false), 3000)
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target?.result as string
      if (url) {
        setAvatar(url)
      }
    }
    reader.readAsDataURL(file)
  }

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
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-xs text-neutral-500 font-sans">
        Memeriksa profil pengguna...
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
              <span className="text-[9.5px] text-[#2F79A6] block font-mono">STUDIO & PROFIL</span>
            </div>
          </a>

          <div className="h-4 w-px bg-[#4394C3]/30 hidden sm:block" />

          <nav className="hidden sm:flex items-center gap-4 text-xs font-bold text-[#1F3A5C]/80">
            <a href="/" className="hover:text-[#1F3A5C] hover:bg-[#EEF4F8] px-2.5 py-1 rounded-lg transition-all">
              Beranda
            </a>
            <a href="/editor" className="hover:text-[#1F3A5C] hover:bg-[#EEF4F8] px-2.5 py-1 rounded-lg transition-all">
              3D Studio
            </a>
            <span className="text-[#1F3A5C] bg-[#EEF4F8] px-2.5 py-1 rounded-lg font-black">Profil & Riwayat</span>
          </nav>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => router.push("/editor")}
            className="px-4 py-2 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-[#F7CB45]" />
            <span>Mulai Desain Baru</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-[#1F3A5C] hover:text-red-600 transition-colors"
            title="Keluar / Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN PROFILE CONTAINER */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6 sm:p-10 space-y-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl border border-white/80 p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative group">
              <img
                src={avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
                alt=""
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-[#4394C3]/40 shadow-sm"
              />
              <label className="absolute inset-0 bg-[#1F3A5C]/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                <Camera className="w-5 h-5 text-[#F7CB45]" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#1F3A5C] tracking-tight">
                  {user?.name}
                </h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#F7CB45] text-[#1F3A5C] font-black border border-[#F7CB45]/60 shadow-2xs">
                  {user?.role === "admin" ? "ADMIN" : "UMKM MEMBER"}
                </span>
              </div>
              <p className="text-[#1F3A5C]/70 text-xs">{user?.email}</p>
              <p className="text-[#2F79A6] text-xs font-bold pt-1">
                {user?.brandName || "UMKM Mandiri"} • {user?.address || "Indonesia"}
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-center sm:justify-end">
            <div className="px-5 py-3 rounded-2xl bg-[#EEF4F8] border border-[#4394C3]/30 text-center min-w-[110px]">
              <span className="text-xl font-black text-[#1F3A5C] block leading-none">{projects.length}</span>
              <span className="text-[10px] text-[#2F79A6] font-bold">Desain Tersimpan</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/30 pb-2">
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === "history"
                ? "bg-[#1F3A5C] text-[#F7CB45] shadow-md scale-102"
                : "bg-white/90 hover:bg-white text-[#1F3A5C] border border-white/40"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Desain ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === "profile"
                ? "bg-[#1F3A5C] text-[#F7CB45] shadow-md scale-102"
                : "bg-white/90 hover:bg-white text-[#1F3A5C] border border-white/40"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Edit Profil & Usaha</span>
          </button>
        </div>

        {/* TAB 1: RIWAYAT DESAIN KEMASAN */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Koleksi Desain Kemasan</h2>
                <p className="text-white/80 text-xs">Semua rancangan 3D dan pola potong 2D yang pernah Anda simpan.</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#1F3A5C]/60" />
                <input
                  type="text"
                  placeholder="Cari nama desain / kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-xs pl-9 pr-3 py-2.5 rounded-xl border border-white focus:border-[#1F3A5C] focus:outline-none transition-all shadow-sm text-[#1F3A5C]"
                />
              </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-white/80 shadow-2xl p-8 space-y-4 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF4F8] border border-[#4394C3]/30 flex items-center justify-center mx-auto text-[#4394C3]">
                  <Package className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-[#1F3A5C] text-sm">Belum Ada Riwayat Desain</h3>
                  <p className="text-[#1F3A5C]/70 text-xs">
                    {searchQuery
                      ? "Tidak ada proyek yang sesuai dengan pencarian Anda."
                      : "Anda belum memiliki riwayat desain kemasan. Buka 3D Studio untuk membuat desain pertama!"}
                  </p>
                </div>
                <button
                  onClick={() => router.push("/editor")}
                  className="px-5 py-2.5 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-xs transition-all shadow-md inline-flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-4 h-4 text-[#F7CB45]" />
                  <span>Buka 3D Studio Sekarang</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/editor?projectId=${p.id}`)}
                    className="group bg-white rounded-2xl border border-white/80 hover:border-[#1F3A5C] p-4 flex flex-col justify-between cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden"
                  >
                    {/* Visual Card */}
                    <div className="w-full h-40 bg-[#EEF4F8] rounded-xl border border-[#4394C3]/20 flex items-center justify-center relative overflow-hidden group-hover:bg-[#EEF4F8]/80 transition-colors p-3">
                      <div
                        className="w-20 h-20 rounded-2xl shadow-md border border-black/10 flex flex-col items-center justify-center group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: p.boxColor || "#4394C3" }}
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

                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#1F3A5C] text-[#F7CB45] font-mono text-[8px] font-bold shadow-2xs">
                        {p.category}
                      </div>

                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-white border border-[#4394C3]/30 text-[#1F3A5C] text-[8px] font-bold shadow-2xs">
                        {p.materialName}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="pt-3.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-[#1F3A5C] text-sm group-hover:text-[#2F79A6] leading-snug line-clamp-1">
                          {p.name}
                        </h3>
                        <p className="text-[#1F3A5C]/60 text-[10.5px] mt-0.5 line-clamp-1 font-medium">
                          {p.templateName}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#4394C3]/20 space-y-2 text-[10.5px]">
                        <div className="flex justify-between text-[#1F3A5C]/70">
                          <span>Dimensi:</span>
                          <span className="font-mono font-bold text-[#1F3A5C]">
                            {p.dimensions.length}×{p.dimensions.width}×{p.dimensions.height} mm
                          </span>
                        </div>

                        <div className="flex justify-between text-[#1F3A5C]/50 text-[9.5px]">
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
                            className="flex-1 py-1.5 rounded-lg bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-[10.5px] flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95"
                          >
                            <span>Lanjutkan Edit</span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#F7CB45]" />
                          </button>

                          <button
                            onClick={(e) => handleDuplicate(p, e)}
                            className="p-1.5 rounded-lg border border-neutral-200 hover:bg-[#EEF4F8] text-[#1F3A5C] transition-colors"
                            title="Duplikat Desain"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleDelete(p.id, e)}
                            className="p-1.5 rounded-lg border border-neutral-200 hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors"
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
          </div>
        )}

        {/* TAB 2: UPDATE PROFIL & USAHA */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-3xl border border-white/80 p-6 sm:p-8 shadow-2xl max-w-2xl mx-auto space-y-6">
            <div className="space-y-1 pb-4 border-b border-[#4394C3]/20">
              <h2 className="text-xl font-black text-[#1F3A5C]">Perbarui Informasi Profil</h2>
              <p className="text-[#1F3A5C]/70 text-xs">
                Informasi ini digunakan untuk identitas proyek desain dan kontak pesanan produksi kemasan Anda.
              </p>
            </div>

            {profileSuccessNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Profil dan informasi usaha berhasil diperbarui!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#1F3A5C] block">Nama Lengkap</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4394C3]" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-[#EEF4F8]/40"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1F3A5C] block">Nama Usaha / Brand</label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4394C3]" />
                    <input
                      type="text"
                      required
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-[#EEF4F8]/40"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#1F3A5C] block">Alamat Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4394C3]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-[#EEF4F8]/40"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1F3A5C] block">Nomor WhatsApp / Telp</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4394C3]" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-[#EEF4F8]/40"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1F3A5C] block">Kota / Alamat Usaha</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4394C3]" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Contoh: Bandung, Jawa Barat"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-[#EEF4F8]/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1F3A5C] block">URL Foto Profil / Logo Usaha</label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-[#EEF4F8]/40"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1F3A5C] block">Deskripsi Singkat Usaha</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Deskripsikan jenis produk kemasan atau bidang usaha Anda..."
                  className="w-full p-3 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs resize-none bg-[#EEF4F8]/40"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <Save className="w-4 h-4 text-[#F7CB45]" />
                  <span>Simpan Perbarui Profil</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
