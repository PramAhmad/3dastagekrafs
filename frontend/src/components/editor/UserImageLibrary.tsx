"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  UploadCloud,
  Search,
  Trash2,
  Check,
  Plus,
  Sparkles,
  ShieldCheck,
  Tag,
  Maximize2,
  X,
  FileImage,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  Layers,
} from "lucide-react"
import { LibraryImageItem, PRESET_LIBRARY_IMAGES } from "@/lib/presetAssets"
import { SurfaceTarget } from "@/components/3d/PackagingCanvas"

interface UserImageLibraryProps {
  onSelectImage: (imageUrl: string, imageName: string) => void
  activeSurface?: SurfaceTarget
  onSurfaceChange?: (surface: SurfaceTarget) => void
  currentUserId?: string
  compact?: boolean
  onCloseModal?: () => void
  onExpandModal?: () => void
}

const STORAGE_KEY = "astakraf_user_image_library"

const SURFACE_OPTIONS: { id: SurfaceTarget; label: string }[] = [
  { id: "front", label: "Muka / Depan" },
  { id: "back", label: "Belakang" },
  { id: "left", label: "Sisi Kiri" },
  { id: "right", label: "Sisi Kanan" },
  { id: "top", label: "Tutup / Atas" },
]

export default function UserImageLibrary({
  onSelectImage,
  activeSurface = "front",
  onSurfaceChange,
  currentUserId = "usr_umkm_01",
  compact = false,
  onCloseModal,
  onExpandModal,
}: UserImageLibraryProps) {
  const [images, setImages] = useState<LibraryImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [justAttachedId, setJustAttachedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // 1. Load library images (API + localStorage fallback)
  useEffect(() => {
    let isMounted = true

    async function loadLibrary() {
      setLoading(true)
      try {
        // Try fetching from backend API
        const res = await fetch(`/api/user-library?userId=${encodeURIComponent(currentUserId)}`)
        if (res.ok) {
          const json = await res.json()
          if (json.success && Array.isArray(json.data) && isMounted) {
            setImages(json.data)
            // Sync to localStorage
            const userOnly = json.data.filter((item: LibraryImageItem) => !item.isPreset)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnly))
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.warn("Backend user-library unreachable, fallback to localStorage:", err)
      }

      // Fallback to localStorage + presets
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        let localUserImages: LibraryImageItem[] = []
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) localUserImages = parsed
        }
        if (isMounted) {
          setImages([...localUserImages, ...PRESET_LIBRARY_IMAGES])
        }
      } catch (e) {
        if (isMounted) setImages(PRESET_LIBRARY_IMAGES)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadLibrary()
    return () => {
      isMounted = false
    }
  }, [currentUserId])

  // 2. Handle File Upload (direct to server /api/upload & persist to user library)
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploading(true)
    setUploadError(null)

    const newUploadedItems: LibraryImageItem[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith("image/")) continue

      try {
        // 1. Try uploading to server /api/upload
        let finalUrl = ""
        try {
          const formData = new FormData()
          formData.append("file", file)
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })
          if (uploadRes.ok) {
            const data = await uploadRes.json()
            if (data.url) finalUrl = data.url
          }
        } catch (uploadErr) {
          console.warn("Server upload fallback to FileReader:", uploadErr)
        }

        // 2. Fallback to Data URL if server upload failed
        if (!finalUrl) {
          finalUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
        }

        const cleanName = file.name.replace(/\.[^/.]+$/, "")

        // 3. Save to backend /api/user-library
        let savedItem: LibraryImageItem = {
          id: "lib_" + Math.random().toString(36).substring(2, 9),
          name: cleanName,
          url: finalUrl,
          category: "upload",
          userId: currentUserId,
          createdAt: new Date().toISOString(),
          isPreset: false,
        }

        try {
          const libRes = await fetch("/api/user-library", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: cleanName,
              url: finalUrl,
              category: "upload",
              userId: currentUserId,
            }),
          })
          if (libRes.ok) {
            const libData = await libRes.json()
            if (libData.data) savedItem = libData.data
          }
        } catch (libErr) {
          console.warn("Could not save to /api/user-library:", libErr)
        }

        newUploadedItems.push(savedItem)

        // Automatically attach the first uploaded image to the active surface
        if (i === 0) {
          onSelectImage(savedItem.url, savedItem.name)
          setJustAttachedId(savedItem.id)
          setTimeout(() => setJustAttachedId(null), 2500)
        }
      } catch (err: any) {
        console.error("Upload error for file:", file.name, err)
        setUploadError(`Gagal mengunggah ${file.name}`)
      }
    }

    if (newUploadedItems.length > 0) {
      setImages((prev) => {
        const next = [...newUploadedItems, ...prev]
        // Save user items in localStorage
        const userOnly = next.filter((item) => !item.isPreset)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnly))
        return next
      })
      // Switch tab to "upload" so user immediately sees their new uploads
      setSelectedCategory("upload")
    }

    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // 3. Handle Delete image from library
  const handleDeleteImage = async (e: React.MouseEvent, item: LibraryImageItem) => {
    e.stopPropagation()
    if (item.isPreset) return

    const confirmDelete = window.confirm(`Hapus "${item.name}" dari pustaka gambar Anda?`)
    if (!confirmDelete) return

    // Update state & localStorage
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== item.id)
      const userOnly = next.filter((img) => !img.isPreset)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnly))
      return next
    })

    // Delete from server
    try {
      await fetch(`/api/user-library?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      })
    } catch (e) {
      console.warn("Failed to delete from server:", e)
    }
  }

  // 4. Handle Select & Attach Image
  const handleSelect = (item: LibraryImageItem) => {
    onSelectImage(item.url, item.name)
    setJustAttachedId(item.id)
    setTimeout(() => setJustAttachedId(null), 2000)
  }

  // 5. Filter images
  const filteredImages = images.filter((img) => {
    const matchesSearch =
      !searchQuery ||
      img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (img.category && img.category.toLowerCase().includes(searchQuery.toLowerCase()))

    if (!matchesSearch) return false

    if (selectedCategory === "all") return true
    if (selectedCategory === "upload") return !img.isPreset || img.category === "upload"
    return img.category === selectedCategory
  })

  const userUploadCount = images.filter((img) => !img.isPreset).length

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* 1. Header with Title & Optional Action Buttons */}
      <div className="flex items-center justify-between pb-1 border-b border-[#D5E4F0]">
        <div>
          <div className="flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4 text-[#2F79A6]" />
            <h3 className="font-extrabold text-[#1F3A5C] text-xs">Pustaka Gambar Saya</h3>
          </div>
          <p className="text-[9px] text-[#718BAA] mt-0.5">
            Gambar tersimpan &amp; reusable untuk semua sisi kemasan
          </p>
        </div>

        <div className="flex items-center gap-1">
          {onExpandModal && compact && (
            <button
              onClick={onExpandModal}
              className="p-1 rounded-lg text-[#718BAA] hover:text-[#1F3A5C] hover:bg-[#EEF4F8] transition-colors"
              title="Perbesar Pustaka"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onCloseModal && (
            <button
              onClick={onCloseModal}
              className="p-1 rounded-lg text-[#718BAA] hover:text-[#1F3A5C] hover:bg-[#EEF4F8] transition-colors"
              title="Tutup Pustaka"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Target Surface Selector (Which packaging face will receive the image) */}
      {onSurfaceChange && (
        <div className="bg-[#EEF4F8] p-2.5 rounded-xl border border-[#D5E4F0] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-bold text-[#1F3A5C] flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#2F79A6]" />
              Tempel ke Sisi:
            </span>
            <span className="text-[9px] font-mono font-bold text-[#2F79A6] uppercase">
              {SURFACE_OPTIONS.find((s) => s.id === activeSurface)?.label || activeSurface}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {SURFACE_OPTIONS.map((surf) => (
              <button
                key={surf.id}
                onClick={() => onSurfaceChange(surf.id)}
                className={`py-1 px-1.5 rounded-lg text-[9px] font-bold transition-all truncate text-center ${
                  activeSurface === surf.id
                    ? "bg-[#1F3A5C] text-[#F7CB45] shadow-xs"
                    : "bg-white text-[#4B6B94] hover:bg-white/80 border border-[#D5E4F0]/60"
                }`}
              >
                {surf.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }}
        className="relative"
      >
        <label
          className={`border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all group ${
            isUploading
              ? "bg-[#EEF4F8] border-[#4394C3] animate-pulse"
              : "border-[#4394C3]/40 hover:border-[#4394C3] bg-[#EEF4F8] hover:bg-[#E2EDF5]"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-1 py-1">
              <RefreshCw className="w-5 h-5 text-[#2F79A6] animate-spin" />
              <span className="text-[10px] font-bold text-[#1F3A5C]">Mengunggah ke Pustaka...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <UploadCloud className="w-5 h-5 text-[#2F79A6] group-hover:scale-110 mb-1 transition-all" />
              <span className="text-[10.5px] font-bold text-[#1F3A5C]">
                Upload Gambar Baru
              </span>
              <span className="text-[8.5px] text-[#718BAA] mt-0.5">
                PNG, JPG, SVG transparan (Tersimpan otomatis)
              </span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            disabled={isUploading}
          />
        </label>

        {uploadError && (
          <p className="text-[9px] text-red-600 font-bold mt-1 text-center">{uploadError}</p>
        )}
      </div>

      {/* 4. Search & Category Tabs */}
      <div className="space-y-2">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#718BAA] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari logo, Halal, SNI, Barcode..."
            className="w-full pl-7 pr-6 py-1.5 rounded-lg bg-[#EEF4F8] border border-[#D5E4F0] text-[10px] font-medium text-[#1F3A5C] placeholder:text-[#718BAA] focus:outline-none focus:border-[#4394C3] focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#718BAA] hover:text-[#1F3A5C]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 select-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold whitespace-nowrap transition-all ${
              selectedCategory === "all"
                ? "bg-[#1F3A5C] text-[#F7CB45] shadow-xs"
                : "bg-white text-[#4B6B94] hover:bg-[#EEF4F8] border border-[#D5E4F0]"
            }`}
          >
            Semua ({images.length})
          </button>

          <button
            onClick={() => setSelectedCategory("upload")}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
              selectedCategory === "upload"
                ? "bg-[#1F3A5C] text-[#F7CB45] shadow-xs"
                : "bg-white text-[#4B6B94] hover:bg-[#EEF4F8] border border-[#D5E4F0]"
            }`}
          >
            <span>Upload Saya</span>
            {userUploadCount > 0 && (
              <span className="px-1 py-0.2 rounded-full bg-[#2F79A6] text-white text-[8px]">
                {userUploadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSelectedCategory("certification")}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold whitespace-nowrap transition-all ${
              selectedCategory === "certification"
                ? "bg-[#1F3A5C] text-[#F7CB45] shadow-xs"
                : "bg-white text-[#4B6B94] hover:bg-[#EEF4F8] border border-[#D5E4F0]"
            }`}
          >
            Sertifikasi
          </button>

          <button
            onClick={() => setSelectedCategory("symbol")}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold whitespace-nowrap transition-all ${
              selectedCategory === "symbol"
                ? "bg-[#1F3A5C] text-[#F7CB45] shadow-xs"
                : "bg-white text-[#4B6B94] hover:bg-[#EEF4F8] border border-[#D5E4F0]"
            }`}
          >
            Simbol &amp; Kode
          </button>

          <button
            onClick={() => setSelectedCategory("brand")}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold whitespace-nowrap transition-all ${
              selectedCategory === "brand"
                ? "bg-[#1F3A5C] text-[#F7CB45] shadow-xs"
                : "bg-white text-[#4B6B94] hover:bg-[#EEF4F8] border border-[#D5E4F0]"
            }`}
          >
            Brand
          </button>
        </div>
      </div>

      {/* 5. Library Image Grid */}
      <div className="flex-1 overflow-y-auto pr-0.5 space-y-2 min-h-[140px] max-h-[380px]">
        {loading ? (
          <div className="py-8 text-center text-[#718BAA] space-y-1">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#2F79A6]" />
            <p className="text-[10px]">Memuat pustaka gambar...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="py-8 text-center bg-[#EEF4F8] rounded-xl p-4 border border-[#D5E4F0] space-y-2">
            <FileImage className="w-7 h-7 mx-auto text-[#718BAA]" />
            <p className="font-bold text-[#1F3A5C] text-xs">Belum ada gambar</p>
            <p className="text-[9px] text-[#718BAA]">
              {selectedCategory === "upload"
                ? "Unggah logo atau stiker pertama Anda di atas."
                : "Coba ubah kata kunci pencarian Anda."}
            </p>
            {selectedCategory === "upload" && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-[#1F3A5C] text-[#F7CB45] font-bold text-[10px] shadow-xs"
              >
                Pilih File Sekarang
              </button>
            )}
          </div>
        ) : (
          <div className={`grid ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"} gap-2`}>
            {filteredImages.map((item) => {
              const isJustAttached = justAttachedId === item.id

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`group relative bg-white rounded-xl border p-2 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 select-none ${
                    isJustAttached
                      ? "border-emerald-500 ring-2 ring-emerald-400 bg-emerald-50/40"
                      : "border-[#D5E4F0] hover:border-[#1F3A5C]"
                  }`}
                  title={`Klik untuk menempelkan "${item.name}" ke sisi ${activeSurface}`}
                >
                  {/* Badge */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-[7.5px] font-bold font-mono px-1.5 py-0.2 rounded-md uppercase tracking-wider ${
                        item.isPreset
                          ? "bg-[#EEF4F8] text-[#2F79A6]"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {item.isPreset ? "Preset" : "Upload"}
                    </span>

                    {/* Delete button (for user uploads only) */}
                    {!item.isPreset && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteImage(e, item)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#718BAA] hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Hapus dari Pustaka"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* 1:1 Aspect Ratio Thumbnail Preview Box */}
                  <div className="w-full aspect-square bg-[#EEF4F8] rounded-lg p-2 flex items-center justify-center overflow-hidden border border-[#D5E4F0]/60 relative group-hover:bg-[#EEF4F8]/80 transition-colors">
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200 drop-shadow-xs"
                      loading="lazy"
                    />

                    {/* Hover Overlay "Tempel" */}
                    <div className="absolute inset-0 bg-[#1F3A5C]/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center text-white p-1 text-center">
                      <Plus className="w-4 h-4 text-[#F7CB45] mb-0.5" />
                      <span className="text-[8.5px] font-black leading-tight text-[#F7CB45]">
                        Tempel ke {activeSurface}
                      </span>
                    </div>

                    {/* Just Attached Indicator */}
                    {isJustAttached && (
                      <div className="absolute inset-0 bg-emerald-600/90 text-white rounded-lg flex flex-col items-center justify-center p-1 text-center animate-fade-in">
                        <CheckCircle2 className="w-5 h-5 text-white mb-0.5" />
                        <span className="text-[8.5px] font-bold">Ditempel!</span>
                      </div>
                    )}
                  </div>

                  {/* Name Label */}
                  <div className="pt-1.5">
                    <p className="text-[9.5px] font-bold text-[#1F3A5C] truncate group-hover:text-[#2F79A6] leading-tight">
                      {item.name}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 6. Footer Info / Helper */}
      <div className="pt-2 border-t border-[#D5E4F0] flex items-center justify-between text-[8.5px] text-[#718BAA]">
        <span>
          💡 Klik gambar untuk langsung menempelkan ke kemasan.
        </span>
        <span className="font-mono font-bold text-[#1F3A5C]">
          {filteredImages.length} item
        </span>
      </div>
    </div>
  )
}
