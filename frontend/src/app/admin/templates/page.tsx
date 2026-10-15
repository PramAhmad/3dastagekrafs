"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  Box,
  Plus,
  Trash2,
  Edit3,
  Search,
  Download,
  Check,
  X,
  RefreshCw,
  CheckCircle2,
  Image as ImageIcon,
  Tag,
  Layers,
  Circle,
  Triangle,
  Package,
  Upload,
  FileCode,
  FileBox,
  FileText,
  Scissors,
  FileCheck,
  Palette,
} from "lucide-react"
import {
  PackagingTemplate,
  CategoryMaster,
  DEFAULT_MASTER_CATEGORIES,
  DEFAULT_PACKAGING_TEMPLATES,
  MASTER_MATERIAL_OPTIONS,
} from "@/types/admin"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const DEFAULT_TEMPLATES: PackagingTemplate[] = DEFAULT_PACKAGING_TEMPLATES

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<PackagingTemplate[]>(DEFAULT_TEMPLATES)
  const [masterCategories, setMasterCategories] = useState<CategoryMaster[]>(DEFAULT_MASTER_CATEGORIES)
  const [searchTemplate, setSearchTemplate] = useState("")
  const [editingTemplate, setEditingTemplate] = useState<PackagingTemplate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [uploadFileName, setUploadFileName] = useState<string | null>(null)
  const [uploadDielineName, setUploadDielineName] = useState<string | null>(null)
  const [uploadManifestName, setUploadManifestName] = useState<string | null>(null)
  const [uploadUvName, setUploadUvName] = useState<string | null>(null)
  const [uploadPreviewName, setUploadPreviewName] = useState<string | null>(null)

  // Load persistent templates & master categories
  useEffect(() => {
    // 1. Load Categories
    const savedCats = localStorage.getItem("kemasan3d_master_categories")
    if (savedCats) {
      try {
        const parsed = JSON.parse(savedCats)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMasterCategories(parsed)
        }
      } catch (e) {}
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

    // 2. Load Templates
    const saved = localStorage.getItem("kemasan3d_custom_templates")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTemplates(parsed)
        }
      } catch (e) {}
    }

    fetchTemplatesFromBackend()
  }, [])

  const fetchTemplatesFromBackend = async () => {
    // First try Next.js App Router API
    try {
      const res = await fetch("/api/templates")
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setTemplates(json.data)
          localStorage.setItem("kemasan3d_custom_templates", JSON.stringify(json.data))
          return
        }
      }
    } catch (e) {}

    // Fallback: Go backend
    try {
      const res = await fetch(`${API_URL}/api/v1/templates`)
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setTemplates(json.data)
          localStorage.setItem("kemasan3d_custom_templates", JSON.stringify(json.data))
        }
      }
    } catch (e) {}
  }

  const showToast = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  // Handle 3D File Upload (.glb, .gltf, .stl) - Uploads to Server /api/upload
  const handle3DFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingTemplate) return

    const ext = file.name.split(".").pop()?.toLowerCase() || "glb"
    setUploadFileName(file.name)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const json = await res.json()
      if (json.success && json.url) {
        setEditingTemplate({
          ...editingTemplate,
          model_3d_url: json.url,
          model_format: ext,
          is_custom_mesh: true,
        })
        showToast(`Model 3D "${file.name}" berhasil diunggah ke server!`)
        return
      }
    } catch (e) {}

    // Fallback to dataUrl
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setEditingTemplate({
        ...editingTemplate,
        model_3d_url: dataUrl,
        model_format: ext,
        is_custom_mesh: true,
      })
      showToast(`Model 3D "${file.name}" disimpan secara lokal!`)
    }
    reader.readAsDataURL(file)
  }

  // Handle 2D Dieline SVG Upload (.svg) - Uploads to Server /api/upload
  const handleDielineUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingTemplate) return

    setUploadDielineName(file.name)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const json = await res.json()
      if (json.success && json.url) {
        setEditingTemplate({
          ...editingTemplate,
          dieline_svg_url: json.url,
        })
        showToast(`Dieline 2D SVG "${file.name}" berhasil diunggah ke server!`)
        return
      }
    } catch (e) {}

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setEditingTemplate({
        ...editingTemplate,
        dieline_svg_url: dataUrl,
      })
      showToast(`Dieline 2D SVG "${file.name}" berhasil dimuat!`)
    }
    reader.readAsDataURL(file)
  }

  // Handle JSON Manifest Upload (.json) - File Only
  const handleManifestUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingTemplate) return

    setUploadManifestName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const textContent = event.target?.result as string
      try {
        const parsed = JSON.parse(textContent)
        setEditingTemplate({
          ...editingTemplate,
          manifest_json: parsed,
        })
        showToast(`Manifest JSON "${file.name}" valid & berhasil dimuat!`)
      } catch (err) {
        setEditingTemplate({
          ...editingTemplate,
          manifest_json: textContent,
        })
        showToast(`Manifest JSON "${file.name}" disimpan sebagai string!`)
      }
    }
    reader.readAsText(file)
  }

  // Handle UV Template PNG Upload (.png, .webp) - File Only
  const handleUvTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingTemplate) return

    setUploadUvName(file.name)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const json = await res.json()
      if (json.success && json.url) {
        setEditingTemplate({
          ...editingTemplate,
          uv_template_url: json.url,
        })
        showToast(`UV Template "${file.name}" berhasil diunggah ke server!`)
        return
      }
    } catch (e) {}

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setEditingTemplate({
        ...editingTemplate,
        uv_template_url: dataUrl,
      })
      showToast(`UV Template "${file.name}" berhasil dimuat!`)
    }
    reader.readAsDataURL(file)
  }

  // Handle Thumbnail Preview Upload (.png, .jpg, .webp) - Uploads to Server /api/upload
  const handlePreviewUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingTemplate) return

    setUploadPreviewName(file.name)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const json = await res.json()
      if (json.success && json.url) {
        setEditingTemplate({
          ...editingTemplate,
          preview_url: json.url,
        })
        showToast(`Gambar Thumbnail "${file.name}" berhasil diunggah ke server!`)
        return
      }
    } catch (e) {}

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setEditingTemplate({
        ...editingTemplate,
        preview_url: dataUrl,
      })
      showToast(`Gambar Thumbnail "${file.name}" berhasil dimuat!`)
    }
    reader.readAsDataURL(file)
  }

  // Save / Update Template (Persistent in server API + localStorage)
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTemplate) return

    const isEdit = templates.some((t) => t.id === editingTemplate.id)
    let updatedList: PackagingTemplate[] = []

    if (isEdit) {
      updatedList = templates.map((t) => (t.id === editingTemplate.id ? editingTemplate : t))
    } else {
      updatedList = [editingTemplate, ...templates]
    }

    // 1. Optimistic update in UI & LocalStorage
    setTemplates(updatedList)
    localStorage.setItem("kemasan3d_custom_templates", JSON.stringify(updatedList))

    // 2. Sync to Next.js API route (/api/templates)
    try {
      await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedList),
      })
    } catch (err) {}

    // 3. Also sync to Go Backend API if available
    try {
      const url = isEdit
        ? `${API_URL}/api/v1/templates/${editingTemplate.id}`
        : `${API_URL}/api/v1/templates`
      const method = isEdit ? "PUT" : "POST"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTemplate),
      })
    } catch (err) {}

    showToast(isEdit ? "Template berhasil diperbarui & disimpan permanen di server!" : "Template baru berhasil ditambahkan & disimpan di server!")
    setIsModalOpen(false)
    setEditingTemplate(null)
    setUploadFileName(null)
  }

  // Delete Template (Sync to server API + localStorage)
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm(`Yakin ingin menghapus template "${id}"?`)) return

    const updatedList = templates.filter((t) => t.id !== id)
    setTemplates(updatedList)
    localStorage.setItem("kemasan3d_custom_templates", JSON.stringify(updatedList))

    try {
      await fetch(`/api/templates?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
    } catch (e) {}

    try {
      await fetch(`${API_URL}/api/v1/templates/${id}`, {
        method: "DELETE",
      })
    } catch (e) {}

    showToast(`Template "${id}" berhasil dihapus dari server!`)
  }

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTemplate.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTemplate.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTemplate.toLowerCase())
  )

  // Collect all unique categories
  const existingCategories = Array.from(
    new Set([...masterCategories.map((c) => c.id), ...templates.map((t) => t.category)])
  )

  const renderCategoryIcon = (cat: string) => {
    const c = cat.toUpperCase()
    if (c === "BOX") return <Box className="w-4 h-4 text-slate-400" />
    if (c === "POUCH") return <Layers className="w-4 h-4 text-slate-400" />
    if (c === "JAR" || c === "CAN" || c === "CUP") return <Circle className="w-4 h-4 text-slate-400" />
    if (c === "TRIANGLE") return <Triangle className="w-4 h-4 text-slate-400" />
    return <Package className="w-4 h-4 text-slate-400" />
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-xl bg-[#1F3A5C] text-white border border-[#2F79A6] text-[12px] font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#D5E4F0] shadow-xs">
        <div>
          <h2 className="text-sm font-extrabold text-[#1F3A5C] flex items-center gap-2">
            <Box className="w-4 h-4 text-[#2F79A6]" />
            Kelola Model & Template Kemasan 3D
          </h2>
          <p className="text-[11px] text-[#718BAA]">
            Mendukung model parametrik bawaan dan impor model kustom 3D (.GLB, .GLTF, .STL).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#718BAA]" />
            <input
              type="text"
              placeholder="Cari model atau kategori..."
              value={searchTemplate}
              onChange={(e) => setSearchTemplate(e.target.value)}
              className="w-full bg-[#EEF4F8] border border-[#D5E4F0] rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-[#1F3A5C] focus:outline-none focus:border-[#4394C3] focus:bg-white placeholder-[#718BAA]"
            />
          </div>

          <button
            onClick={() => {
              setEditingTemplate({
                id: `model_${Date.now()}`,
                name: "Kemasan Kustom Baru",
                category: "BOX",
                description: "Kemasan custom siap produksi untuk produk UMKM.",
                preview_url: "",
                model_3d_url: "",
                model_format: "glb",
                is_custom_mesh: false,
                dieline_svg_url: "",
                manifest_json: "",
                uv_template_url: "",
                is_printable: true,
                default_dimensions: { length_mm: 65, width_mm: 45, height_mm: 35, wall_thickness_mm: 1.6 },
                available_materials: ["corrugated", "kraft", "matte_art", "glossy", "black_matte"],
              })
              setUploadFileName(null)
              setUploadDielineName(null)
              setUploadManifestName(null)
              setUploadUvName(null)
              setUploadPreviewName(null)
              setIsModalOpen(true)
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[#F7CB45]" />
            <span>Tambah Model</span>
          </button>

          <Link
            href="/admin/studio"
            className="px-3.5 py-1.5 rounded-xl bg-[#2F79A6] hover:bg-[#4394C3] text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all"
            title="Buka 3D Packaging Studio & Dieline CAD Lab"
          >
            <Layers className="w-3.5 h-3.5 text-[#F7CB45]" />
            <span>3DPAKS Studio</span>
          </Link>
        </div>
      </div>

      {/* Templates Table */}
      <div className="rounded-2xl bg-white border border-[#D5E4F0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#EEF4F8] text-[#4B6B94] border-b border-[#D5E4F0] font-extrabold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5 w-14">Thumbnail</th>
                <th className="p-3.5">ID Model</th>
                <th className="p-3.5">Nama Kemasan</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Dimensi Bawaan</th>
                <th className="p-3.5">Tipe 3D</th>
                <th className="p-3.5">Bahan Tersedia</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5E4F0] text-[#1F3A5C]">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#718BAA]">
                    Tidak ada model kemasan yang cocok.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((tmpl) => (
                  <tr key={tmpl.id} className="hover:bg-[#EEF4F8]/60 transition-colors">
                    {/* Image Thumbnail Column */}
                    <td className="p-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] flex items-center justify-center overflow-hidden shrink-0">
                        {tmpl.preview_url ? (
                          <img
                            src={tmpl.preview_url}
                            alt={tmpl.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              ;(e.target as HTMLElement).style.display = "none"
                            }}
                          />
                        ) : (
                          renderCategoryIcon(tmpl.category)
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-[#2F79A6] font-bold">{tmpl.id}</td>
                    <td className="p-3.5">
                      <span className="font-extrabold text-[#1F3A5C] block">{tmpl.name}</span>
                      <span className="text-[10px] text-[#718BAA] line-clamp-1">{tmpl.description}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EEF4F8] border border-[#D5E4F0] text-[#1F3A5C] font-mono text-[9.5px] uppercase font-bold">
                        {tmpl.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[#4B6B94] font-semibold">
                      {tmpl.default_dimensions ? (
                        tmpl.category === "JAR" || tmpl.category === "BOTTLE" || tmpl.category === "CAN" || tmpl.category === "CUP" ? (
                          `Ø${(tmpl.default_dimensions.radius_mm || 25) * 2} × ${tmpl.default_dimensions.height_mm || 35} mm`
                        ) : (
                          `${tmpl.default_dimensions.length_mm || 65}×${tmpl.default_dimensions.width_mm || 45}×${tmpl.default_dimensions.height_mm || 35} mm`
                        )
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap items-center gap-1">
                        {tmpl.model_3d_url ? (
                          <span className="inline-flex items-center gap-1 text-[9.5px] text-purple-700 font-bold bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                            <FileBox className="w-2.5 h-2.5 text-purple-600" />
                            <span>{(tmpl.model_format || "GLB").toUpperCase()}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9.5px] text-[#2F79A6] font-bold bg-[#EEF4F8] border border-[#D5E4F0] px-2 py-0.5 rounded-md">
                            <Check className="w-2.5 h-2.5 text-[#10B981]" /> Parametrik
                          </span>
                        )}

                        {tmpl.dieline_svg_url && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded" title="2D Dieline SVG Terpasang">
                            <Scissors className="w-2.5 h-2.5" /> SVG
                          </span>
                        )}

                        {tmpl.manifest_json && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] text-blue-700 font-bold bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded" title="Manifest JSON Terpasang">
                            <FileCode className="w-2.5 h-2.5" /> JSON
                          </span>
                        )}

                        {tmpl.uv_template_url && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded" title="UV Template PNG Terpasang">
                            <FileCheck className="w-2.5 h-2.5" /> UV
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Available Materials Column */}
                    <td className="p-3.5">
                      <div className="flex flex-wrap items-center gap-1 max-w-[160px]">
                        {tmpl.available_materials && tmpl.available_materials.length > 0 ? (
                          tmpl.available_materials.map((matId) => {
                            const matObj = MASTER_MATERIAL_OPTIONS.find((m) => m.id === matId)
                            return (
                              <span
                                key={matId}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-semibold bg-[#EEF4F8] text-[#1F3A5C] border border-[#D5E4F0]"
                                title={matObj ? `${matObj.name} (${matObj.subtitle})` : matId}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: matObj?.color || "#94a3b8" }}
                                />
                                <span className="truncate max-w-[65px]">{matObj?.name.split(" ")[0] || matId}</span>
                              </span>
                            )
                          })
                        ) : (
                          <span className="text-[9.5px] text-[#718BAA] italic">Semua Bahan</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`${API_URL}/api/v1/templates/${tmpl.id}/export-stl?download=true`}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#EEF4F8] text-[#1F3A5C] hover:text-[#2F79A6] transition-all flex items-center gap-1 text-[10px] font-bold border border-[#D5E4F0] shadow-2xs"
                          title="Download STL Hasil Generate"
                        >
                          <Download className="w-3 h-3 text-[#2F79A6]" />
                          STL
                        </a>

                        <Link
                          href={`/admin/studio?template=${tmpl.id}`}
                          className="p-1.5 rounded-lg bg-white hover:bg-[#EEF4F8] text-[#1F3A5C] transition-all border border-[#D5E4F0] shadow-2xs flex items-center gap-1 font-bold text-[10.5px]"
                          title="Buka & Kustomisasi di 3D Studio"
                        >
                          <Layers className="w-3.5 h-3.5 text-[#2F79A6]" />
                          <span className="hidden sm:inline">Studio</span>
                        </Link>

                        <button
                          onClick={() => {
                            setEditingTemplate(tmpl)
                            setUploadFileName(tmpl.model_3d_url ? `Model 3D (${tmpl.model_format || "3D"})` : null)
                            setUploadDielineName(tmpl.dieline_svg_url ? "Dieline SVG Terpasang" : null)
                            setUploadManifestName(tmpl.manifest_json ? "Manifest JSON Terpasang" : null)
                            setUploadUvName(tmpl.uv_template_url ? "UV Template Terpasang" : null)
                            setUploadPreviewName(tmpl.preview_url ? "Thumbnail Terpasang" : null)
                            setIsModalOpen(true)
                          }}
                          className="p-1.5 rounded-lg bg-white hover:bg-[#EEF4F8] text-[#1F3A5C] transition-all border border-[#D5E4F0] shadow-2xs"
                          title="Edit Template"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#2F79A6]" />
                        </button>

                        <button
                          onClick={() => handleDeleteTemplate(tmpl.id)}
                          className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-[#718BAA] hover:text-red-600 transition-all border border-[#D5E4F0] hover:border-red-300 shadow-2xs"
                          title="Hapus Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREATE / EDIT PACKAGING TEMPLATE */}
      {isModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 bg-[#1F3A5C]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#D5E4F0] rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D5E4F0] pb-3">
              <h3 className="text-base font-extrabold text-[#1F3A5C] flex items-center gap-2">
                <Box className="w-4 h-4 text-[#2F79A6]" />
                {templates.some((t) => t.id === editingTemplate.id) ? "Edit Model Kemasan" : "Tambah Model Kemasan Baru"}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingTemplate(null)
                }}
                className="p-1 rounded-lg text-[#718BAA] hover:text-[#1F3A5C] hover:bg-[#EEF4F8] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-[11px]">
              {/* ID & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1F3A5C] mb-1">ID Model (Unique Key)</label>
                  <input
                    type="text"
                    required
                    value={editingTemplate.id}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, id: e.target.value })}
                    className="w-full bg-[#EEF4F8] border border-[#D5E4F0] rounded-xl p-2.5 text-[#1F3A5C] font-mono focus:border-[#4394C3] focus:bg-white focus:outline-none"
                    placeholder="e.g. bottle_serum_custom"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1F3A5C] mb-1">Nama Model Kemasan</label>
                  <input
                    type="text"
                    required
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full bg-[#EEF4F8] border border-[#D5E4F0] rounded-xl p-2.5 text-[#1F3A5C] focus:border-[#4394C3] focus:bg-white focus:outline-none"
                    placeholder="e.g. Botol Serum Pipet Kustom"
                  />
                </div>
              </div>

              {/* Category Selection from Master Data */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-[#1F3A5C]">Pilih Master Kategori Kemasan</label>
                  <a
                    href="/admin/categories"
                    target="_blank"
                    className="text-[10px] text-[#2F79A6] hover:underline font-bold"
                  >
                    Kelola Master Kategori ↗
                  </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-[#EEF4F8] rounded-xl border border-[#D5E4F0]">
                  {masterCategories.map((cat) => {
                    const isSelected = editingTemplate.category.toUpperCase() === cat.id.toUpperCase()
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setEditingTemplate({ ...editingTemplate, category: cat.id })}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "bg-[#1F3A5C] border-[#1F3A5C] text-[#F7CB45] font-bold shadow-xs"
                            : "bg-white border-[#D5E4F0] text-[#4B6B94] hover:bg-[#EEF4F8] hover:text-[#1F3A5C]"
                        }`}
                      >
                        <div className="w-7 h-7 rounded bg-[#EEF4F8] border border-[#D5E4F0] overflow-hidden shrink-0 flex items-center justify-center">
                          {cat.image_url ? (
                            <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-3.5 h-3.5 text-[#718BAA]" />
                          )}
                        </div>
                        <div className="truncate flex-1">
                          <span className="text-[10.5px] block truncate leading-tight">{cat.name}</span>
                          <span className="text-[8px] font-mono opacity-70 block">{cat.id}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-2">
                  <input
                    type="text"
                    required
                    value={editingTemplate.category}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value.toUpperCase() })}
                    className="w-full bg-[#EEF4F8] border border-[#D5E4F0] rounded-xl p-2 text-[#1F3A5C] font-mono uppercase text-[10.5px] focus:bg-white focus:outline-none focus:border-[#4394C3]"
                    placeholder="Kode Kategori terpilih atau ketik kode kustom baru (e.g. BOX, POUCH, SKINCARE)"
                  />
                </div>
              </div>

              {/* 1. 3D Model Mesh (.GLB / .GLTF / .STL) */}
              <div className="p-3.5 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1F3A5C] flex items-center gap-1.5 text-xs">
                    <FileBox className="w-4 h-4 text-purple-600" />
                    1. File Model 3D (.GLB / .GLTF / .STL)
                  </span>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Wajib untuk 3D Mesh
                  </span>
                </div>
                <p className="text-[10px] text-[#4B6B94]">
                  Memuat geometri 3D, koordinat UV, dan material kemasan dari Blender / CAD.
                </p>

                <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-[#D5E4F0] hover:border-[#4394C3] bg-white cursor-pointer transition-colors text-[#1F3A5C] text-[11px] font-bold">
                  <Upload className="w-3.5 h-3.5 text-[#2F79A6]" />
                  <span className="truncate">{uploadFileName || "Pilih File 3D (.glb, .gltf, .stl)"}</span>
                  <input
                    type="file"
                    accept=".glb,.gltf,.stl"
                    onChange={handle3DFileUpload}
                    className="hidden"
                  />
                </label>

                {editingTemplate.model_3d_url && (
                  <div className="flex items-center justify-between pt-1 text-[10.5px]">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> Model 3D Terpasang ({(editingTemplate.model_format || "GLB").toUpperCase()})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate({
                          ...editingTemplate,
                          model_3d_url: undefined,
                          model_format: undefined,
                          is_custom_mesh: false,
                        })
                        setUploadFileName(null)
                      }}
                      className="text-red-600 font-bold hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>

              {/* 2. 2D Dieline Vector (.SVG) */}
              <div className="p-3.5 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1F3A5C] flex items-center gap-1.5 text-xs">
                    <Scissors className="w-4 h-4 text-emerald-600" />
                    2. Pola Pisau Potong / Dieline 2D (.SVG)
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Wajib untuk Editor 2D
                  </span>
                </div>
                <p className="text-[10px] text-[#4B6B94]">
                  Garis potong (cut line), garis lipatan (crease), dan batas aman area desain di kanvas 2D.
                </p>

                <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-[#D5E4F0] hover:border-[#4394C3] bg-white cursor-pointer transition-colors text-[#1F3A5C] text-[11px] font-bold">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="truncate">{uploadDielineName || "Pilih File Dieline (.svg)"}</span>
                  <input
                    type="file"
                    accept=".svg"
                    onChange={handleDielineUpload}
                    className="hidden"
                  />
                </label>

                {editingTemplate.dieline_svg_url && (
                  <div className="flex items-center justify-between pt-1 text-[10.5px]">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> Dieline SVG Terpasang
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate({
                          ...editingTemplate,
                          dieline_svg_url: undefined,
                        })
                        setUploadDielineName(null)
                      }}
                      className="text-red-600 font-bold hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Panel Manifest (.JSON) */}
              <div className="p-3.5 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1F3A5C] flex items-center gap-1.5 text-xs">
                    <FileCode className="w-4 h-4 text-blue-600" />
                    3. Manifest Panel Kemasan (.JSON)
                  </span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Sangat Disarankan
                  </span>
                </div>
                <p className="text-[10px] text-[#4B6B94]">
                  Definisi panel (Depan, Belakang, Tutup), dimensi masing-masing sisi, serta UV mapping target.
                </p>

                <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-[#D5E4F0] hover:border-[#4394C3] bg-white cursor-pointer transition-colors text-[#1F3A5C] text-[11px] font-bold">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span className="truncate">{uploadManifestName || "Pilih File Manifest (.json)"}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleManifestUpload}
                    className="hidden"
                  />
                </label>

                {editingTemplate.manifest_json && (
                  <div className="flex items-center justify-between pt-1 text-[10.5px]">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> Manifest JSON Terpasang
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate({
                          ...editingTemplate,
                          manifest_json: undefined,
                        })
                        setUploadManifestName(null)
                      }}
                      className="text-red-600 font-bold hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>

              {/* 4. UV Template (.PNG) & Thumbnail (.PNG/.JPG) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* UV Template */}
                <div className="p-3.5 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1F3A5C] flex items-center gap-1.5 text-xs">
                      <FileCheck className="w-4 h-4 text-amber-600" />
                      4. UV Template (.PNG)
                    </span>
                    <span className="text-[9.5px] text-[#718BAA]">Opsional</span>
                  </div>
                  <p className="text-[10px] text-[#4B6B94]">
                    Wireframe tekstur UV untuk referensi pembeli & debugging layout.
                  </p>

                  <label className="flex items-center justify-center gap-2 p-2 rounded-xl border border-dashed border-[#D5E4F0] hover:border-[#4394C3] bg-white cursor-pointer transition-colors text-[#1F3A5C] text-[11px] font-bold">
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span className="truncate">{uploadUvName || "Pilih UV (.png)"}</span>
                    <input
                      type="file"
                      accept=".png,.webp"
                      onChange={handleUvTemplateUpload}
                      className="hidden"
                    />
                  </label>

                  {editingTemplate.uv_template_url && (
                    <div className="flex items-center justify-between pt-1 text-[10.5px]">
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> UV Terpasang
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTemplate({ ...editingTemplate, uv_template_url: undefined })
                          setUploadUvName(null)
                        }}
                        className="text-red-600 font-bold hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>

                {/* Thumbnail Preview Image */}
                <div className="p-3.5 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1F3A5C] flex items-center gap-1.5 text-xs">
                      <ImageIcon className="w-4 h-4 text-[#2F79A6]" />
                      5. Foto Thumbnail (.PNG/.JPG)
                    </span>
                    <span className="text-[9.5px] text-[#718BAA]">Katalog Web</span>
                  </div>
                  <p className="text-[10px] text-[#4B6B94]">
                    Gambar render / visual kemasan untuk katalog halaman utama.
                  </p>

                  <label className="flex items-center justify-center gap-2 p-2 rounded-xl border border-dashed border-[#D5E4F0] hover:border-[#4394C3] bg-white cursor-pointer transition-colors text-[#1F3A5C] text-[11px] font-bold">
                    <Upload className="w-3.5 h-3.5 text-[#2F79A6]" />
                    <span className="truncate">{uploadPreviewName || "Pilih Gambar"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePreviewUpload}
                      className="hidden"
                    />
                  </label>

                  {editingTemplate.preview_url && (
                    <div className="flex items-center justify-between pt-1 text-[10.5px]">
                      <div className="flex items-center gap-2">
                        <img src={editingTemplate.preview_url} alt="" className="w-6 h-6 rounded object-cover border border-[#D5E4F0]" />
                        <span className="text-emerald-700 font-bold">Foto Siap</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTemplate({ ...editingTemplate, preview_url: undefined })
                          setUploadPreviewName(null)
                        }}
                        className="text-red-600 font-bold hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-[#1F3A5C] mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="w-full bg-[#EEF4F8] border border-[#D5E4F0] rounded-xl p-2.5 text-[#1F3A5C] focus:bg-white focus:outline-none focus:border-[#4394C3]"
                  placeholder="Deskripsi fungsi kemasan dan produk yang cocok..."
                />
              </div>

              {/* Pilihan Material yang Tersedia (Available Materials Selection) */}
              <div className="p-3.5 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <span className="font-bold text-[#1F3A5C] flex items-center gap-1.5 text-xs">
                      <Palette className="w-4 h-4 text-[#2F79A6]" />
                      Pilihan Material yang Tersedia pada Model Ini
                    </span>
                    <span className="text-[10px] text-[#4B6B94] block mt-0.5">
                      Pilih bahan kemasan yang valid untuk model ini. Opsi bahan di 3D Editor akan disesuaikan dengan pilihan ini.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingTemplate({
                          ...editingTemplate,
                          available_materials: MASTER_MATERIAL_OPTIONS.map((m) => m.id),
                        })
                      }
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-white hover:bg-[#D5E4F0] text-[#1F3A5C] border border-[#D5E4F0]"
                    >
                      Pilih Semua
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingTemplate({
                          ...editingTemplate,
                          available_materials: [],
                        })
                      }
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-white hover:bg-red-50 text-red-600 border border-[#D5E4F0]"
                    >
                      Hapus Semua
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                  {MASTER_MATERIAL_OPTIONS.map((mat) => {
                    const currentList = editingTemplate.available_materials || []
                    const isChecked = currentList.includes(mat.id)
                    return (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => {
                          const updated = isChecked
                            ? currentList.filter((id) => id !== mat.id)
                            : [...currentList, mat.id]
                          setEditingTemplate({
                            ...editingTemplate,
                            available_materials: updated,
                          })
                        }}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                          isChecked
                            ? "bg-white border-[#1F3A5C] shadow-xs text-[#1F3A5C]"
                            : "bg-white/60 border-neutral-200 text-neutral-400 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-neutral-300 shrink-0 shadow-2xs"
                          style={{ backgroundColor: mat.color }}
                        />
                        <div className="truncate flex-1">
                          <span className="text-[10px] font-bold block truncate leading-tight">
                            {mat.name}
                          </span>
                          <span className="text-[8.5px] text-[#718BAA] block truncate">{mat.subtitle}</span>
                        </div>
                        {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Default Dimensions */}
              <div>
                <label className="block font-bold text-[#1F3A5C] mb-1">Dimensi Default (mm)</label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-[#718BAA] block font-semibold">Panjang</span>
                    <input
                      type="number"
                      value={editingTemplate.default_dimensions?.length_mm || 65}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          default_dimensions: {
                            ...editingTemplate.default_dimensions,
                            length_mm: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-[#EEF4F8] border border-[#D5E4F0] rounded-lg p-2 text-[#1F3A5C] font-mono focus:bg-white focus:outline-none focus:border-[#4394C3]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#718BAA] block font-semibold">Lebar</span>
                    <input
                      type="number"
                      value={editingTemplate.default_dimensions?.width_mm || 45}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          default_dimensions: {
                            ...editingTemplate.default_dimensions,
                            width_mm: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-[#EEF4F8] border border-[#D5E4F0] rounded-lg p-2 text-[#1F3A5C] font-mono focus:bg-white focus:outline-none focus:border-[#4394C3]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#718BAA] block font-semibold">Tinggi</span>
                    <input
                      type="number"
                      value={editingTemplate.default_dimensions?.height_mm || 35}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          default_dimensions: {
                            ...editingTemplate.default_dimensions,
                            height_mm: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-[#EEF4F8] border border-[#D5E4F0] rounded-lg p-2 text-[#1F3A5C] font-mono focus:bg-white focus:outline-none focus:border-[#4394C3]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#718BAA] block font-semibold">Radius</span>
                    <input
                      type="number"
                      value={editingTemplate.default_dimensions?.radius_mm || 25}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          default_dimensions: {
                            ...editingTemplate.default_dimensions,
                            radius_mm: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-[#EEF4F8] border border-[#D5E4F0] rounded-lg p-2 text-[#1F3A5C] font-mono focus:bg-white focus:outline-none focus:border-[#4394C3]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[#D5E4F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingTemplate(null)
                  }}
                  className="px-4 py-2 rounded-xl bg-[#EEF4F8] hover:bg-[#D5E4F0] text-[#1F3A5C] font-bold text-[11px] transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-[11px] shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-[#F7CB45]" />
                  Simpan Permanen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
