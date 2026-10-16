"use client"

import React, { useState, useEffect } from "react"
import {
  Tags,
  Plus,
  Trash2,
  Edit3,
  Search,
  Check,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  Box,
  Layers,
  Circle,
  Triangle,
  Package,
  Layers2,
  AlertCircle,
} from "lucide-react"
import { CategoryMaster, DEFAULT_MASTER_CATEGORIES, PackagingTemplate } from "@/types/admin"

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryMaster[]>(DEFAULT_MASTER_CATEGORIES)
  const [templates, setTemplates] = useState<PackagingTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [editingCategory, setEditingCategory] = useState<CategoryMaster | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [uploadFileName, setUploadFileName] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  // 1. Load Categories from Backend API (with LocalStorage cache fallback)
  useEffect(() => {
    loadCategories()
    loadTemplates()
  }, [])

  const loadCategories = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/categories")
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setCategories(json.data)
          localStorage.setItem("kemasan3d_master_categories", JSON.stringify(json.data))
          setIsLoading(false)
          return
        }
      }
    } catch (e) {
      console.warn("Gagal memuat kategori dari server, menggunakan cache lokal:", e)
    }

    // Fallback: LocalStorage
    const savedCategories = localStorage.getItem("kemasan3d_master_categories")
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed)
          setIsLoading(false)
          return
        }
      } catch (e) {}
    }

    setCategories(DEFAULT_MASTER_CATEGORIES)
    localStorage.setItem("kemasan3d_master_categories", JSON.stringify(DEFAULT_MASTER_CATEGORIES))
    setIsLoading(false)
  }

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/templates")
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          setTemplates(json.data)
          return
        }
      }
    } catch (e) {}

    const savedTemplates = localStorage.getItem("kemasan3d_custom_templates")
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates)
        if (Array.isArray(parsed)) {
          setTemplates(parsed)
        }
      } catch (e) {}
    }
  }

  const showToast = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  // Handle Category Image Upload (Upload to Server /api/upload -> Real Public URL)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingCategory) return

    setUploadFileName(file.name)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const json = await res.json()
      if (json.success && json.url) {
        setEditingCategory({
          ...editingCategory,
          image_url: json.url,
        })
        showToast(`Foto "${file.name}" berhasil diunggah ke server!`)
      } else {
        throw new Error(json.error || "Gagal mengunggah gambar ke server")
      }
    } catch (err: any) {
      console.warn("Upload ke server gagal, fallback ke dataUrl:", err)
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setEditingCategory({
          ...editingCategory,
          image_url: dataUrl,
        })
        showToast(`Disimpan lokal: ${file.name}`)
      }
      reader.readAsDataURL(file)
    } finally {
      setIsUploading(false)
    }
  }

  // Helper: Convert existing base64 image to server file URL
  const convertBase64ToServer = async () => {
    if (!editingCategory?.image_url?.startsWith("data:")) return
    setIsUploading(true)
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataUrl: editingCategory.image_url,
          filename: `category_${editingCategory.id.toLowerCase()}.png`,
        }),
      })
      const json = await res.json()
      if (json.success && json.url) {
        setEditingCategory({
          ...editingCategory,
          image_url: json.url,
        })
        showToast("Gambar Base64 berhasil dikonversi menjadi file server publik!")
      }
    } catch (e) {
      showToast("Gagal konversi ke server")
    } finally {
      setIsUploading(false)
    }
  }

  // Save / Update Category (Sync to Backend API + LocalStorage)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    let finalImageUrl = editingCategory.image_url || ""

    // Auto-convert base64 to server file if image is still dataUrl
    if (finalImageUrl.startsWith("data:")) {
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataUrl: finalImageUrl,
            filename: `category_${editingCategory.id.toLowerCase()}.png`,
          }),
        })
        const json = await res.json()
        if (json.success && json.url) {
          finalImageUrl = json.url
        }
      } catch (e) {}
    }

    const sanitizedId = editingCategory.id.trim().toUpperCase().replace(/\s+/g, "_")
    const toSave: CategoryMaster = {
      ...editingCategory,
      id: sanitizedId,
      image_url: finalImageUrl,
    }

    const isEdit = categories.some((c) => c.id === toSave.id)
    let updatedList: CategoryMaster[] = []

    if (isEdit) {
      updatedList = categories.map((c) => (c.id === toSave.id ? toSave : c))
    } else {
      updatedList = [toSave, ...categories]
    }

    // 1. Optimistic update in UI and LocalStorage
    setCategories(updatedList)
    localStorage.setItem("kemasan3d_master_categories", JSON.stringify(updatedList))

    // 2. Persist to Backend API
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedList),
      })
      if (!res.ok) {
        console.warn("Gagal simpan ke /api/categories:", await res.text())
      }
    } catch (err) {
      console.warn("Gagal request ke backend /api/categories:", err)
    }

    showToast(isEdit ? "Kategori berhasil diperbarui & tersimpan di server!" : "Kategori baru berhasil ditambahkan & tersimpan di server!")
    setIsModalOpen(false)
    setEditingCategory(null)
    setUploadFileName(null)
  }

  // Delete Category (Sync to Backend API + LocalStorage)
  const handleDeleteCategory = async (id: string) => {
    const templateCount = templates.filter((t) => t.category.toUpperCase() === id.toUpperCase()).length
    if (templateCount > 0) {
      if (!confirm(`Peringatan: Ada ${templateCount} model kemasan yang menggunakan kategori "${id}". Tetap ingin menghapus?`)) {
        return
      }
    } else {
      if (!confirm(`Yakin ingin menghapus kategori "${id}"?`)) return
    }

    const updatedList = categories.filter((c) => c.id !== id)
    setCategories(updatedList)
    localStorage.setItem("kemasan3d_master_categories", JSON.stringify(updatedList))

    try {
      await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
    } catch (e) {}

    showToast("Kategori berhasil dihapus dari server!")
  }

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderCategoryIcon = (id: string) => {
    const c = id.toUpperCase()
    if (c === "BOX") return <Box className="w-4 h-4 text-slate-400" />
    if (c === "POUCH") return <Layers className="w-4 h-4 text-slate-400" />
    if (c === "JAR" || c === "CAN" || c === "CUP") return <Circle className="w-4 h-4 text-slate-400" />
    if (c === "TRIANGLE") return <Triangle className="w-4 h-4 text-slate-400" />
    return <Package className="w-4 h-4 text-slate-400" />
  }

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div role="status" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-[#D5E4F0] bg-white px-4 py-3 text-[11px] font-bold text-[#1F3A5C] shadow-xl animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-[#D5E4F0] shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-[#1F3A5C] flex items-center gap-2">
            <Tags className="w-4 h-4 text-[#4394C3]" />
            Master Data Kategori Kemasan
          </h2>
          <p className="text-[11px] text-[#718BAA]">
            Kelola master kategori kemasan lengkap dengan nama, gambar visual, dan status aktif untuk katalog 3D.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#718BAA]" />
            <input
              type="text"
              placeholder="Cari kategori atau kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#EEF4F8]/60 border border-[#D5E4F0] rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-[#1F3A5C] focus:outline-none focus:border-[#4394C3] placeholder-[#718BAA]"
            />
          </div>

          <button
            onClick={() => {
              setEditingCategory({
                id: `CAT_${Date.now().toString().slice(-4)}`,
                name: "Kategori Baru",
                description: "Deskripsi jenis kemasan dan kecocokan produk.",
                image_url: "",
                is_active: true,
                display_order: categories.length + 1,
              })
              setUploadFileName(null)
              setIsModalOpen(true)
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#1F3A5C] hover:bg-[#162a43] text-white font-semibold text-[11px] flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[#F7CB45]" />
            <span>Tambah Kategori</span>
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="rounded-xl bg-white border border-[#D5E4F0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#F6FAFC] text-[#4B6B94] border-b border-[#D5E4F0] font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5 w-16">Foto / Gambar</th>
                <th className="p-3.5">Kode (ID)</th>
                <th className="p-3.5">Nama Kategori</th>
                <th className="p-3.5">Deskripsi</th>
                <th className="p-3.5">Model Terkait</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5E4F0]/60 text-[#1F3A5C]">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#718BAA]">
                    Tidak ada master kategori yang cocok.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => {
                  const linkedCount = templates.filter((t) => t.category.toUpperCase() === cat.id.toUpperCase()).length

                  return (
                    <tr key={cat.id} className="hover:bg-[#EEF4F8]/40 transition-colors">
                      {/* Image Thumbnail Column */}
                      <td className="p-3.5">
                        <div className="w-11 h-11 rounded-lg bg-[#EEF4F8] border border-[#D5E4F0] flex items-center justify-center overflow-hidden shrink-0 relative group">
                          {cat.image_url ? (
                            <img
                              src={cat.image_url}
                              alt={cat.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                ;(e.target as HTMLElement).style.display = "none"
                              }}
                            />
                          ) : (
                            renderCategoryIcon(cat.id)
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-[#1F3A5C] font-bold">
                        <span className="px-2 py-0.5 rounded bg-[#EEF4F8] border border-[#D5E4F0] text-[#1F3A5C] text-[10px]">
                          {cat.id}
                        </span>
                      </td>

                      <td className="p-3.5 font-semibold text-[#1F3A5C]">
                        <span>{cat.name}</span>
                      </td>

                      <td className="p-3.5 text-[#4B6B94] max-w-xs">
                        <p className="line-clamp-2 text-[10.5px]">{cat.description}</p>
                      </td>

                      <td className="p-3.5 font-mono text-[#1F3A5C]">
                        <span className="px-2 py-0.5 rounded bg-[#F6FAFC] border border-[#D5E4F0] text-[10px]">
                          {linkedCount} Model
                        </span>
                      </td>

                      <td className="p-3.5">
                        {cat.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[9.5px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <Check className="w-2.5 h-2.5" /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9.5px] text-[#718BAA] font-medium bg-[#EEF4F8] border border-[#D5E4F0] px-2 py-0.5 rounded-full">
                            Nonaktif
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingCategory(cat)
                              setUploadFileName(cat.image_url ? "Gambar Terpasang" : null)
                              setIsModalOpen(true)
                            }}
                            className="p-1.5 rounded-md bg-[#EEF4F8] hover:bg-[#D5E4F0] text-[#4B6B94] hover:text-[#1F3A5C] transition-all border border-[#D5E4F0]"
                            title="Edit Kategori"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 rounded-md bg-[#EEF4F8] hover:bg-rose-50 text-[#718BAA] hover:text-rose-600 transition-all border border-[#D5E4F0]"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREATE / EDIT CATEGORY */}
      {isModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 bg-[#1F3A5C]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#D5E4F0] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D5E4F0] pb-3">
              <h3 className="text-base font-bold text-[#1F3A5C] flex items-center gap-2">
                <Tags className="w-4 h-4 text-[#4394C3]" />
                {categories.some((c) => c.id === editingCategory.id) ? "Edit Master Kategori" : "Tambah Master Kategori Baru"}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingCategory(null)
                }}
                className="p-1 rounded-lg text-[#718BAA] hover:text-[#1F3A5C] hover:bg-[#EEF4F8] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-[11px]">
              {/* ID & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1F3A5C] mb-1">Kode ID Kategori (Unique)</label>
                  <input
                    type="text"
                    required
                    value={editingCategory.id}
                    onChange={(e) => setEditingCategory({ ...editingCategory, id: e.target.value.toUpperCase() })}
                    className="w-full bg-[#F6FAFC] border border-[#D5E4F0] rounded-lg p-2 text-[#1F3A5C] font-mono uppercase focus:outline-none focus:border-[#4394C3]"
                    placeholder="e.g. SKINCARE"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1F3A5C] mb-1">Nama Tampilan Kategori</label>
                  <input
                    type="text"
                    required
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="w-full bg-[#F6FAFC] border border-[#D5E4F0] rounded-lg p-2 text-[#1F3A5C] focus:outline-none focus:border-[#4394C3]"
                    placeholder="e.g. Botol & Jar Skincare"
                  />
                </div>
              </div>

              {/* Image Thumbnail Upload / URL */}
              <div className="p-3.5 rounded-xl bg-[#F6FAFC] border border-[#D5E4F0] space-y-2.5">
                <label className="font-semibold text-[#1F3A5C] block">Foto / Gambar Visual Kategori</label>
                <div className="flex items-start gap-3">
                  {/* Thumbnail Preview Box */}
                  <div className="w-16 h-16 rounded-xl bg-white border border-[#D5E4F0] overflow-hidden shrink-0 flex items-center justify-center">
                    {editingCategory.image_url ? (
                      <img
                        src={editingCategory.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = "none"
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-[#718BAA]" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* File Upload Button */}
                    <label className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed transition-colors text-[10.5px] font-semibold cursor-pointer ${
                      isUploading
                        ? "bg-[#EEF4F8] border-[#4394C3] text-[#1F3A5C] animate-pulse"
                        : "bg-white border-[#D5E4F0] hover:border-[#4394C3] text-[#4B6B94]"
                    }`}>
                      <Upload className="w-3.5 h-3.5 text-[#4394C3]" />
                      <span>
                        {isUploading
                          ? "Mengunggah file ke server..."
                          : uploadFileName || "Pilih Foto / Gambar (PNG, JPG, WebP)"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Image URL input fallback */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9.5px] text-[#718BAA]">
                        <span>Atau masukkan URL HTTPS:</span>
                        {editingCategory.image_url?.startsWith("/uploads/") && (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            ✓ File Server Publik
                          </span>
                        )}
                        {editingCategory.image_url?.startsWith("data:") && (
                          <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            ⚠️ Masih Base64
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={editingCategory.image_url || ""}
                        onChange={(e) => {
                          setEditingCategory({ ...editingCategory, image_url: e.target.value })
                          setUploadFileName(e.target.value ? "URL Kustom" : null)
                        }}
                        placeholder="https://images.unsplash.com/... atau /uploads/..."
                        className="w-full bg-white border border-[#D5E4F0] rounded-lg p-1.5 text-[#1F3A5C] font-mono text-[10px] focus:outline-none focus:border-[#4394C3]"
                      />
                    </div>
                  </div>
                </div>

                {editingCategory.image_url && (
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-[#D5E4F0] text-[10px]">
                    {editingCategory.image_url.startsWith("data:") && (
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
                        <span className="text-amber-800 text-[10px]">
                          Gambar ini berupa Base64 lokal (tidak terlihat oleh orang lain).
                        </span>
                        <button
                          type="button"
                          onClick={convertBase64ToServer}
                          disabled={isUploading}
                          className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 text-[9.5px] transition-all"
                        >
                          {isUploading ? "Mengunggah..." : "Konversi ke Server Sekarang"}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-emerald-600 flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3" />
                        {editingCategory.image_url.startsWith("/uploads/")
                          ? "Tersimpan permanen di server & bisa dilihat semua orang"
                          : editingCategory.image_url.startsWith("http")
                          ? "URL Eksternal valid"
                          : "Gambar lokal terpasang"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory({ ...editingCategory, image_url: "" })
                          setUploadFileName(null)
                        }}
                        className="text-rose-500 hover:underline font-semibold"
                      >
                        Hapus Gambar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-[#1F3A5C] mb-1">Deskripsi Kategori</label>
                <textarea
                  rows={2}
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full bg-[#F6FAFC] border border-[#D5E4F0] rounded-lg p-2 text-[#1F3A5C] focus:outline-none focus:border-[#4394C3]"
                  placeholder="Keterangan fungsi kemasan dan tipe produk..."
                />
              </div>

              {/* Options: Status Active & Display Order */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-[#1F3A5C] mb-1">Urutan Tampilan</label>
                  <input
                    type="number"
                    value={editingCategory.display_order || 1}
                    onChange={(e) => setEditingCategory({ ...editingCategory, display_order: Number(e.target.value) })}
                    className="w-full bg-[#F6FAFC] border border-[#D5E4F0] rounded-lg p-2 text-[#1F3A5C] font-mono focus:outline-none focus:border-[#4394C3]"
                  />
                </div>
                <div className="flex flex-col justify-end pb-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-[#1F3A5C] font-semibold select-none">
                    <input
                      type="checkbox"
                      checked={editingCategory.is_active}
                      onChange={(e) => setEditingCategory({ ...editingCategory, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-[#D5E4F0] text-[#1F3A5C] accent-[#1F3A5C]"
                    />
                    <span>Tampilkan di Katalog (Aktif)</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[#D5E4F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingCategory(null)
                  }}
                  className="px-4 py-2 rounded-lg bg-[#EEF4F8] hover:bg-[#D5E4F0] text-[#4B6B94] font-semibold text-[11px] transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1F3A5C] hover:bg-[#162a43] text-white font-bold text-[11px] shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-[#F7CB45]" />
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
