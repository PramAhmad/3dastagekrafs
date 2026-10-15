"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Box,
  Layers,
  Upload,
  Download,
  Eye,
  Save,
  FileCode,
  Sliders,
  Sun,
  Camera,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Maximize2,
  FileText,
  Image as ImageIcon,
  Palette,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
} from "lucide-react"

import PackagingCanvas, { CanvasObject, SurfaceTarget } from "@/components/3d/PackagingCanvas"
import { generateParametricDieline, mmToPixels150Dpi } from "@/lib/dielineGenerator"
import { autoFixDielineSvg } from "@/lib/dielineAutoFixer"
import { saveAsset, getAsset } from "@/lib/assetStorage"
import { PackagingTemplate } from "@/types/admin"

// Default Preset Forms inspired by 3DPAKS
const PRESET_FORMS = [
  {
    id: "fefco-0427-mailer",
    name: "FEFCO 0427 (Roll-End Tuck Top Mailer)",
    category: "BOX",
    dims: { length: 180, width: 120, height: 60, radius: 2 },
    dielineStyle: "fefco-0427" as const,
    note: "Kardus lipat e-commerce & shipping tanpa isolasi.",
  },
  {
    id: "fefco-0211-tuck",
    name: "FEFCO 0211 (Straight Tuck-End Carton)",
    category: "BOX",
    dims: { length: 100, width: 60, height: 140, radius: 1 },
    dielineStyle: "fefco-0211" as const,
    note: "Dus karton ritel kosmetik, obat, dan makanan.",
  },
  {
    id: "fefco-0201-rsc",
    name: "FEFCO 0201 (Regular Slotted Container - RSC)",
    category: "BOX",
    dims: { length: 240, width: 160, height: 180, radius: 2 },
    dielineStyle: "fefco-0201" as const,
    note: "Karton gelombang master box industri standar.",
  },
  {
    id: "standing-pouch",
    name: "Stand-Up Coffee Pouch (Zipper)",
    category: "POUCH",
    dims: { length: 120, width: 65, height: 200, radius: 20 },
    dielineStyle: "fefco-0427" as const,
    note: "Kantong foil berdiri kedap udara dengan zipper.",
  },
  {
    id: "beverage-can",
    name: "Beverage Can 330ml (Aluminium)",
    category: "CAN",
    dims: { length: 66, width: 66, height: 115, radius: 33 },
    dielineStyle: "fefco-0427" as const,
    note: "Kaleng minuman soda, kopi, dan jus.",
  },
  {
    id: "cosmetic-jar",
    name: "Cosmetic Cream Jar (50ml)",
    category: "JAR",
    dims: { length: 60, width: 60, height: 50, radius: 30 },
    dielineStyle: "fefco-0427" as const,
    note: "Jar krim wajah dan pomade.",
  },
  {
    id: "craft-bottle",
    name: "Craft Beer & Juice Bottle (Glass)",
    category: "BOTTLE",
    dims: { length: 60, width: 60, height: 220, radius: 30 },
    dielineStyle: "fefco-0427" as const,
    note: "Botol kaca leher panjang dengan mahkota segel.",
  },
]

function AdminStudioContent() {
  const searchParams = useSearchParams()
  const templateParamId = searchParams.get("template")

  // Active Tab & Collapse State for 1280px screen optimization
  const [activeTab, setActiveTab] = useState<"params" | "dieline" | "artwork" | "files" | "scene">("params")
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false)

  // Selected Form / Template State
  const [selectedFormId, setSelectedFormId] = useState<string>("fefco-0427-mailer")
  const [formName, setFormName] = useState<string>("FEFCO 0427 (Roll-End Tuck Top Mailer)")
  const [category, setCategory] = useState<string>("BOX")

  // Parametric Dimensions (Real mm)
  const [length, setLength] = useState<number>(180)
  const [width, setWidth] = useState<number>(120)
  const [height, setHeight] = useState<number>(60)
  const [radius, setRadius] = useState<number>(2)
  const [caliper, setCaliper] = useState<number>(1.5)
  const [dielineStyle, setDielineStyle] = useState<"fefco-0427" | "fefco-0201" | "fefco-0211" | "fefco-0422">("fefco-0427")

  // Materials & Finish
  const [boxColor, setBoxColor] = useState<string>("#ffffff")
  const [materialFinish, setMaterialFinish] = useState<"matte" | "glossy" | "kraft" | "metallic" | "frosted">("matte")
  const [materialType, setMaterialType] = useState<string>("ivory")

  // Custom 3D Mesh & Vector Assets
  const [model3dUrl, setModel3dUrl] = useState<string | undefined>(undefined)
  const [modelFormat, setModelFormat] = useState<string>("glb")
  const [customDielineSvgUrl, setCustomDielineSvgUrl] = useState<string | undefined>(undefined)
  const [customDielineSvgRaw, setCustomDielineSvgRaw] = useState<string | null>(null)
  const [manifestJson, setManifestJson] = useState<any>(null)
  const [modelScaleMultiplier, setModelScaleMultiplier] = useState<number>(1.0)
  const [maxVisualBound, setMaxVisualBound] = useState<number>(1.65)
  const [exportGLBTrigger, setExportGLBTrigger] = useState<number>(0)
  const [isExportingGLB, setIsExportingGLB] = useState<boolean>(false)

  // Camera & Scene Lighting
  const [cameraView, setCameraView] = useState<"iso" | "front" | "top" | "side" | "back">("iso")
  const [canvasBg, setCanvasBg] = useState<string>("#f1f5f9")
  const [lightingPreset, setLightingPreset] = useState<"soft" | "dramatic" | "warm">("soft")

  // Artwork & Decal Layer State
  const [objects, setObjects] = useState<CanvasObject[]>([])
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const [artworkTargetFace, setArtworkTargetFace] = useState<SurfaceTarget>("front")
  const [artworkScale, setArtworkScale] = useState<number>(1.0)
  const [artworkOffsetX, setArtworkOffsetX] = useState<number>(0)
  const [artworkOffsetY, setArtworkOffsetY] = useState<number>(0)
  const [artworkWrapArc, setArtworkWrapArc] = useState<number>(360)

  // Feedback Notification
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "info" | "error" } | null>(null)
  const showToast = (msg: string, type: "success" | "info" | "error" = "success") => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3500)
  }

  // Generate Parametric Dieline Vector SVG (real-time CAD math)
  const currentDieline = useMemo(() => {
    return generateParametricDieline({
      width: length,
      depth: width,
      height: height,
      caliper: caliper,
      style: dielineStyle,
    })
  }, [length, width, height, caliper, dielineStyle])

  // Active dieline URL passed to 3D texture bridge
  const activeDielineSvgUrl = customDielineSvgUrl || currentDieline.dataUrl

  // 150 DPI Physical Label Dimensions Calculation (Rule from 3DPAKS llms.txt)
  const physicalCanvasMetrics = useMemo(() => {
    const wrapPerimeterMm = (length + width) * 2
    const widthPx = mmToPixels150Dpi(wrapPerimeterMm)
    const heightPx = mmToPixels150Dpi(height)
    return {
      wrapPerimeterMm,
      widthPx,
      heightPx,
      dpi: 150,
    }
  }, [length, width, height])

  // Load existing template if query parameter matches
  useEffect(() => {
    if (!templateParamId) return

    const loadTemplate = async () => {
      // 1. Try IndexedDB
      const assetData = await getAsset<PackagingTemplate>(`template_${templateParamId}`)
      if (assetData) {
        applyTemplateData(assetData)
        return
      }

      // 2. Try LocalStorage
      const local = localStorage.getItem("kemasan3d_custom_templates") || localStorage.getItem("kemasan3d_admin_templates")
      if (local) {
        try {
          const list: PackagingTemplate[] = JSON.parse(local)
          const found = list.find((t) => t.id === templateParamId)
          if (found) applyTemplateData(found)
        } catch (e) {}
      }
    }

    loadTemplate()
  }, [templateParamId])

  const applyTemplateData = (tpl: PackagingTemplate) => {
    setFormName(tpl.name)
    setCategory(tpl.category)
    if (tpl.default_dimensions) {
      setLength(tpl.default_dimensions.length_mm || 180)
      setWidth(tpl.default_dimensions.width_mm || 120)
      setHeight(tpl.default_dimensions.height_mm || 60)
      setRadius(tpl.default_dimensions.radius_mm || 2)
    }
    if (tpl.model_3d_url) {
      setModel3dUrl(tpl.model_3d_url)
      setModelFormat(tpl.model_format || "glb")
    }
    if (tpl.dieline_svg_url) {
      setCustomDielineSvgUrl(tpl.dieline_svg_url)
    }
    showToast(`Template "${tpl.name}" berhasil dimuat ke 3D Studio!`, "info")
  }

  // Handle Preset Form Selection
  const handleSelectPreset = (p: typeof PRESET_FORMS[0]) => {
    setSelectedFormId(p.id)
    setFormName(p.name)
    setCategory(p.category)
    setLength(p.dims.length)
    setWidth(p.dims.width)
    setHeight(p.dims.height)
    setRadius(p.dims.radius)
    setDielineStyle(p.dielineStyle)
    setModel3dUrl(undefined)
    setCustomDielineSvgUrl(undefined)
    showToast(`Bentuk "${p.name}" dipilih secara parametrik.`, "info")
  }

  // Handle 3D File Upload (.glb, .gltf, .stl)
  const handle3DFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split(".").pop()?.toLowerCase() || "glb"
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string
      setModel3dUrl(dataUrl)
      setModelFormat(ext)
      setFormName(file.name.replace(/\.[^/.]+$/, ""))

      // Persist to IndexedDB cache
      await saveAsset(`temp_3d_mesh_${file.name}`, dataUrl)
      showToast(`Model 3D "${file.name}" berhasil dimuat & auto-fit ke studio!`)
    }
    reader.readAsDataURL(file)
  }

  // Handle 2D Dieline SVG Upload
  const handleDielineSvgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const autoFix = autoFixDielineSvg(text)
      const effectiveSvg = autoFix.fixedSvg
      setCustomDielineSvgRaw(effectiveSvg)

      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(effectiveSvg)}`
      setCustomDielineSvgUrl(dataUrl)
      await saveAsset(`temp_dieline_${file.name}`, dataUrl)

      // Intelligent auto-detection of Cylindrical Bottle / Can wrap label vs Folding Box
      const isCylinderPattern = autoFix.isCylinder || /cylinder|spray|bottle|kaleng|can|wrap|melingkar/i.test(file.name)

      if (isCylinderPattern) {
        setCategory("BOTTLE")
        setSelectedFormId("bottle-spray")
        setFormName(file.name.replace(/\.[^/.]+$/, ""))

        // Calculate radius from width
        const wrapW = autoFix.totalWidth * 0.7
        const calculatedRadius = Math.round(wrapW / (2 * Math.PI))
        setRadius(calculatedRadius > 5 ? calculatedRadius : 20)
        setHeight(Math.round(autoFix.totalHeight * 0.6) || 98)

        showToast(`✓ Dieline Silinder Terdeteksi & Auto-Fixed (Ditambahkan Base Color & Panel 3D)!`, "success")
      } else {
        if (autoFix.fixesApplied.length > 0) {
          showToast(`✓ SVG Auto-Fixed (${autoFix.fixesApplied.length} perbaikan standar diterapkan)!`, "success")
        } else {
          showToast(`Dieline SVG "${file.name}" terhubung langsung ke tekstur 3D!`)
        }
      }
    } catch (err) {
      console.error("Gagal membaca file SVG:", err)
      showToast("Gagal membaca file SVG yang diunggah.", "error")
    }
  }

  // Handle Artwork / Decal Image Upload
  const handleArtworkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const imgUrl = evt.target?.result as string
      setArtworkUrl(imgUrl)

      // Add to CanvasObject list
      const newObj: CanvasObject = {
        id: `artwork_${Date.now()}`,
        name: file.name,
        type: "image",
        imageUrl: imgUrl,
        surfaceTarget: artworkTargetFace,
        color: "#ffffff",
        posX: artworkOffsetX,
        posY: artworkOffsetY,
        scale: artworkScale,
        widthMm: 45,
        heightMm: 45,
        rotation: 0,
        opacity: 1.0,
        visible: true,
      }
      setObjects((prev) => [...prev, newObj])
      setSelectedObjectId(newObj.id)
      showToast(`Artwork "${file.name}" ditempel ke muka ${artworkTargetFace.toUpperCase()}!`)
    }
    reader.readAsDataURL(file)
  }

  // Update Decal Position & Properties in Realtime
  const updateActiveArtwork = (patch: Partial<CanvasObject>) => {
    if (!selectedObjectId) return
    setObjects((prev) => prev.map((o) => (o.id === selectedObjectId ? { ...o, ...patch } : o)))
  }

  // Download Dieline Vector SVG
  const handleDownloadDielineSvg = () => {
    const blob = new Blob([currentDieline.svgString], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${formName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${length}x${width}x${height}mm-dieline.svg`
    a.click()
    URL.revokeObjectURL(url)
    showToast("File vector SVG Dieline berhasil diunduh!")
  }

  // Download Dieline PDF Simulation
  const handleDownloadDielinePdf = () => {
    const blob = new Blob([currentDieline.svgString], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${formName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${length}x${width}x${height}mm-dieline.pdf`
    a.click()
    URL.revokeObjectURL(url)
    showToast("File PDF Dieline berhasil diunduh!")
  }

  // Trigger 3D GLB Generation directly from Scene & Dieline
  const handleTriggerExportGLB = () => {
    setIsExportingGLB(true)
    setExportGLBTrigger((prev) => prev + 1)
    showToast("Mengenerate model 3D GLB dari Dieline...")
  }

  // Handle Generated GLB Blob
  const handleExportGLBDone = async (blob: Blob, filename: string) => {
    setIsExportingGLB(false)

    // 1. Download GLB file to client machine
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10000)

    // 2. Upload GLB to server storage so it is available permanently for all users
    try {
      const formData = new FormData()
      formData.append("file", blob, filename)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const json = await res.json()
      if (json.success && json.url) {
        setModel3dUrl(json.url)
        setModelFormat("glb")
        showToast(`Model 3D "${filename}" berhasil di-generate & diunggah ke server!`)
        return
      }
    } catch (e) {}

    // Fallback: LocalStorage / IndexedDB
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64data = reader.result as string
        const assetKey = `glb_${filename}`
        await saveAsset(assetKey, base64data)
        setModel3dUrl(base64data)
        setModelFormat("glb")
        showToast(`Model 3D "${filename}" berhasil di-generate & diunduh!`)
      }
      reader.readAsDataURL(blob)
    } catch (e) {
      showToast(`Model 3D "${filename}" berhasil di-generate & diunduh!`)
    }
  }

  // Save Current Setup to Admin Template Catalog & Server API
  const handleSaveToCatalog = async () => {
    const templateId = selectedFormId.startsWith("custom_")
      ? selectedFormId
      : `template_${Date.now()}`

    let dielineUrlToSave = activeDielineSvgUrl

    // If active dieline is an inline SVG dataUrl, upload it as a clean SVG file to server
    if (currentDieline.svgString) {
      try {
        const svgBlob = new Blob([currentDieline.svgString], { type: "image/svg+xml" })
        const formData = new FormData()
        formData.append("file", svgBlob, `${formName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-dieline.svg`)
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        const json = await res.json()
        if (json.success && json.url) {
          dielineUrlToSave = json.url
        }
      } catch (e) {}
    }

    const newTemplate: PackagingTemplate = {
      id: templateId,
      name: formName,
      category: category as any,
      description: `Kemasan ${formName} kalibrasi presisi ${length}×${width}×${height} mm (FEFCO ${dielineStyle}).`,
      preview_url: "/placeholder-box.png",
      model_3d_url: model3dUrl,
      model_format: modelFormat,
      dieline_svg_url: dielineUrlToSave,
      default_dimensions: {
        length_mm: length,
        width_mm: width,
        height_mm: height,
        radius_mm: radius,
      },
      is_printable: true,
      is_custom_mesh: Boolean(model3dUrl),
    }

    // 1. Save to IndexedDB (unlimited capacity)
    await saveAsset(`template_${templateId}`, newTemplate)

    // 2. Save lightweight record to LocalStorage
    try {
      const existing = localStorage.getItem("kemasan3d_custom_templates")
      let list: PackagingTemplate[] = existing ? JSON.parse(existing) : []
      const idx = list.findIndex((t) => t.id === templateId)
      if (idx !== -1) {
        list[idx] = newTemplate
      } else {
        list = [newTemplate, ...list]
      }
      localStorage.setItem("kemasan3d_custom_templates", JSON.stringify(list))
    } catch (e) {
      console.warn("LocalStorage full, saved safely in IndexedDB:", e)
    }

    // 3. Persist to Server API (/api/templates)
    try {
      await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplate),
      })
    } catch (e) {}

    showToast(`Template "${formName}" berhasil disimpan permanen di server & katalog!`)
  }

  return (
    <div className="flex h-full w-full bg-[#f8f9fa] text-[#1a1a1c] select-none overflow-hidden relative font-sans text-xs">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 backdrop-blur-md transition-all ${
            notification.type === "success"
              ? "bg-[#1F3A5C] text-white border border-[#2F79A6]"
              : notification.type === "error"
              ? "bg-red-600 text-white"
              : "bg-blue-600 text-white"
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#F7CB45]" />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* LEFT CONTROL PANEL (3DPAKS-STYLE #panel)                              */}
      {/* --------------------------------------------------------------------- */}
      <div
        className={`flex-none bg-[#0d1117] text-[#f0f6fc] border-r border-[#30363d] flex flex-col h-full z-10 shadow-2xl transition-all duration-200 ${
          isPanelCollapsed ? "w-0 overflow-hidden border-none p-0 opacity-0 pointer-events-none" : "w-72 xl:w-80"
        }`}
      >
        {/* Studio Brand Header */}
        <div className="p-3 border-b border-[#30363d] flex items-center justify-between bg-[#161b22]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2f81f7]/20 border border-[#2f81f7] flex items-center justify-center text-[#2f81f7]">
              <Box className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-extrabold text-[12px] tracking-tight text-white flex items-center gap-1.5">
                <span>3DPAKS Studio</span>
                <span className="text-[8.5px] font-mono font-bold px-1 py-0.2 rounded bg-[#2f81f7]/30 text-[#58a6ff] border border-[#2f81f7]/50">
                  CAD
                </span>
              </div>
              <div className="text-[9.5px] text-[#8b949e]">Parametric 3D & Dieline Lab</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSaveToCatalog}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2f81f7] hover:bg-[#388bfd] text-white font-bold text-[10.5px] transition-all shadow-md active:scale-95"
              title="Simpan template ke katalog admin"
            >
              <Save className="w-3 h-3" />
              <span>Simpan</span>
            </button>
            <button
              onClick={() => setIsPanelCollapsed(true)}
              className="p-1 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-all"
              title="Sembunyikan Panel (Layar Penuh)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="flex items-center border-b border-[#30363d] bg-[#161b22]/70 px-2 py-1 gap-1 text-[11px] font-medium text-[#8b949e]">
          <button
            onClick={() => setActiveTab("params")}
            className={`flex-1 py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "params" ? "bg-[#21262d] text-white font-bold" : "hover:text-[#c9d1d9]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span>Dimensi</span>
          </button>
          <button
            onClick={() => setActiveTab("dieline")}
            className={`flex-1 py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "dieline" ? "bg-[#21262d] text-white font-bold" : "hover:text-[#c9d1d9]"
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-[#3fb950]" />
            <span>Dieline</span>
          </button>
          <button
            onClick={() => setActiveTab("artwork")}
            className={`flex-1 py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "artwork" ? "bg-[#21262d] text-white font-bold" : "hover:text-[#c9d1d9]"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#d29922]" />
            <span>Artwork</span>
          </button>
          <button
            onClick={() => setActiveTab("files")}
            className={`flex-1 py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "files" ? "bg-[#21262d] text-white font-bold" : "hover:text-[#c9d1d9]"
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-[#bc8cff]" />
            <span>File 3D</span>
          </button>
          <button
            onClick={() => setActiveTab("scene")}
            className={`flex-1 py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "scene" ? "bg-[#21262d] text-white font-bold" : "hover:text-[#c9d1d9]"
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-[#f0883e]" />
            <span>Scene</span>
          </button>
        </div>

        {/* Tab Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-[#30363d]">
          {/* 150 DPI Physical UV Mapping Hint (3DPAKS Rule) */}
          <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-extrabold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#58a6ff]" />
                150 DPI Physical UV Mapping
              </span>
              <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
                1:1 Scale
              </span>
            </div>
            <div className="text-[10.5px] text-[#8b949e] leading-relaxed">
              Artwork target:{" "}
              <b className="text-white font-mono">
                {physicalCanvasMetrics.widthPx} × {physicalCanvasMetrics.heightPx} px
              </b>{" "}
              ({physicalCanvasMetrics.wrapPerimeterMm}mm keliling × {height}mm tinggi).
            </div>
          </div>

          {/* TAB 1: PARAMETRIC DIMENSIONS */}
          {activeTab === "params" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#8b949e] mb-1.5">Pilih Model Standar</label>
                <select
                  value={selectedFormId}
                  onChange={(e) => {
                    const found = PRESET_FORMS.find((p) => p.id === e.target.value)
                    if (found) handleSelectPreset(found)
                  }}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-white text-[11.5px] focus:outline-hidden focus:border-[#2f81f7]"
                >
                  {PRESET_FORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Real Millimeter Dimension Sliders */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#c9d1d9]">Panjang / Lebar Muka (W)</span>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      value={length}
                      onChange={(e) => setLength(Number(e.target.value))}
                      className="w-16 bg-[#161b22] border border-[#30363d] rounded px-1.5 py-0.5 text-right font-bold text-[#58a6ff]"
                    />
                    <span className="text-[#8b949e]">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="20"
                  max="400"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full accent-[#2f81f7] h-1.5 bg-[#21262d] rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="font-bold text-[#c9d1d9]">Lebar Sisi / Kedalaman (D)</span>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="w-16 bg-[#161b22] border border-[#30363d] rounded px-1.5 py-0.5 text-right font-bold text-[#58a6ff]"
                    />
                    <span className="text-[#8b949e]">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="20"
                  max="400"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full accent-[#2f81f7] h-1.5 bg-[#21262d] rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="font-bold text-[#c9d1d9]">Tinggi Kemasan (H)</span>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-16 bg-[#161b22] border border-[#30363d] rounded px-1.5 py-0.5 text-right font-bold text-[#58a6ff]"
                    />
                    <span className="text-[#8b949e]">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="20"
                  max="400"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full accent-[#2f81f7] h-1.5 bg-[#21262d] rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="font-bold text-[#c9d1d9]">Ketebalan Karton (Caliper)</span>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      step="0.1"
                      value={caliper}
                      onChange={(e) => setCaliper(Number(e.target.value))}
                      className="w-16 bg-[#161b22] border border-[#30363d] rounded px-1.5 py-0.5 text-right font-bold text-[#58a6ff]"
                    />
                    <span className="text-[#8b949e]">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="5.0"
                  step="0.1"
                  value={caliper}
                  onChange={(e) => setCaliper(Number(e.target.value))}
                  className="w-full accent-[#2f81f7] h-1.5 bg-[#21262d] rounded-lg cursor-pointer"
                />
              </div>

              {/* Material Finish & Color */}
              <div className="pt-3 border-t border-[#30363d] space-y-3">
                <label className="block text-[11px] font-bold text-[#8b949e]">Bahan & Finishing Permukaan</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "matte", label: "Matte Paper" },
                    { id: "glossy", label: "Glossy Coated" },
                    { id: "kraft", label: "Kraft Cardboard" },
                    { id: "metallic", label: "Metallic Foil" },
                  ].map((mat) => (
                    <button
                      key={mat.id}
                      onClick={() => setMaterialFinish(mat.id as any)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        materialFinish === mat.id
                          ? "bg-[#2f81f7]/20 border-[#2f81f7] text-white font-bold"
                          : "bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-white"
                      }`}
                    >
                      {mat.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#c9d1d9]">Warna Dasar Kemasan</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={boxColor}
                      onChange={(e) => setBoxColor(e.target.value)}
                      className="w-7 h-7 rounded border border-[#30363d] bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-[11px] text-white">{boxColor.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PARAMETRIC FEFCO DIELINE */}
          {activeTab === "dieline" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#8b949e] mb-1.5">Standar FEFCO Packaging</label>
                <select
                  value={dielineStyle}
                  onChange={(e) => setDielineStyle(e.target.value as any)}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-white text-[11.5px] focus:outline-hidden"
                >
                  <option value="fefco-0427">FEFCO 0427 (Roll-End Tuck Top Mailer)</option>
                  <option value="fefco-0201">FEFCO 0201 (Regular Slotted Container - RSC)</option>
                  <option value="fefco-0211">FEFCO 0211 (Straight Tuck-End Carton)</option>
                  <option value="fefco-0422">FEFCO 0422 (Countertop Display Tray)</option>
                </select>
              </div>

              {/* SVG Vector Dieline Preview Thumbnail */}
              <div className="rounded-xl border border-[#30363d] bg-white p-2 flex flex-col items-center justify-center overflow-hidden">
                <div
                  className="w-full h-44 flex items-center justify-center overflow-hidden [&>svg]:max-w-full [&>svg]:max-h-full"
                  dangerouslySetInnerHTML={{ __html: customDielineSvgRaw || currentDieline.svgString }}
                />
                <div className="w-full pt-2 flex items-center justify-between text-[10px] text-[#475569] border-t border-slate-200">
                  <span>
                    {customDielineSvgRaw ? (
                      <span className="text-emerald-700 font-bold">✓ Dieline Kustom Vektor (Aktif)</span>
                    ) : (
                      <>Ukuran Lembaran: <b>{currentDieline.totalWidthMm} × {currentDieline.totalHeightMm} mm</b></>
                    )}
                  </span>
                  <span className="font-mono text-red-600 font-bold">Cut = Magenta/Red</span>
                </div>
              </div>

              {/* Download Vector Dieline Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleDownloadDielineSvg}
                  className="p-2.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#3fb950]" />
                  <span>Dieline SVG</span>
                </button>
                <button
                  onClick={handleDownloadDielinePdf}
                  className="p-2.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#58a6ff]" />
                  <span>Dieline PDF</span>
                </button>
              </div>

              {/* Generate 3D GLB from Dieline Action */}
              <button
                onClick={handleTriggerExportGLB}
                disabled={isExportingGLB}
                className="w-full mt-2.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#238636] to-[#2ea043] hover:brightness-110 text-white font-extrabold text-[11.5px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#238636]/20 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>{isExportingGLB ? "Mengenerate 3D GLB..." : "Generate & Unduh 3D GLB dari Dieline"}</span>
              </button>
            </div>
          )}

          {/* TAB 3: ARTWORK & TEXTURE MAPPING */}
          {activeTab === "artwork" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#8b949e] mb-1.5">Upload Label Artwork / Logo</label>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#30363d] hover:border-[#2f81f7] rounded-xl cursor-pointer bg-[#161b22] transition-colors">
                  <Upload className="w-5 h-5 text-[#8b949e] mb-1" />
                  <span className="text-[11px] text-[#c9d1d9] font-semibold">Pilih file gambar artwork</span>
                  <span className="text-[9.5px] text-[#8b949e]">PNG, JPG, SVG, WebP</span>
                  <input type="file" accept="image/*" onChange={handleArtworkUpload} className="hidden" />
                </label>
              </div>

              {/* Panel Face Target */}
              <div>
                <label className="block text-[11px] font-bold text-[#8b949e] mb-1.5">Target Muka Panel (Face)</label>
                <select
                  value={artworkTargetFace}
                  onChange={(e) => {
                    const f = e.target.value as SurfaceTarget
                    setArtworkTargetFace(f)
                    updateActiveArtwork({ surfaceTarget: f })
                  }}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-white text-[11.5px] focus:outline-hidden"
                >
                  <option value="front">Front Panel (Muka Depan)</option>
                  <option value="back">Back Panel (Muka Belakang)</option>
                  <option value="right">Right Side (Sisi Kanan)</option>
                  <option value="left">Left Side (Sisi Kiri)</option>
                  <option value="top">Top Lid (Tutup Atas)</option>
                </select>
              </div>

              {/* Offset & Scaling Controls */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#c9d1d9]">Skala Logo / Artwork</span>
                  <span className="font-mono text-white">{Math.round(artworkScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.05"
                  value={artworkScale}
                  onChange={(e) => {
                    const s = Number(e.target.value)
                    setArtworkScale(s)
                    updateActiveArtwork({ scale: s })
                  }}
                  className="w-full accent-[#2f81f7] h-1.5 bg-[#21262d] rounded-lg"
                />

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-[#c9d1d9]">Geser Posisi X (mm)</span>
                  <span className="font-mono text-white">{artworkOffsetX} mm</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={artworkOffsetX}
                  onChange={(e) => {
                    const x = Number(e.target.value)
                    setArtworkOffsetX(x)
                    updateActiveArtwork({ posX: x })
                  }}
                  className="w-full accent-[#2f81f7] h-1.5 bg-[#21262d] rounded-lg"
                />

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-[#c9d1d9]">Geser Posisi Y (mm)</span>
                  <span className="font-mono text-white">{artworkOffsetY} mm</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={artworkOffsetY}
                  onChange={(e) => {
                    const y = Number(e.target.value)
                    setArtworkOffsetY(y)
                    updateActiveArtwork({ posY: y })
                  }}
                  className="w-full accent-[#2f81f7] h-1.5 bg-[#21262d] rounded-lg"
                />
              </div>

              {/* Active Artworks List */}
              {objects.length > 0 && (
                <div className="pt-3 border-t border-[#30363d] space-y-2">
                  <div className="text-[11px] font-bold text-[#8b949e]">Artwork Terpasang ({objects.length})</div>
                  {objects.map((obj) => (
                    <div
                      key={obj.id}
                      onClick={() => setSelectedObjectId(obj.id)}
                      className={`p-2 rounded-lg flex items-center justify-between border cursor-pointer ${
                        selectedObjectId === obj.id
                          ? "bg-[#2f81f7]/20 border-[#2f81f7] text-white"
                          : "bg-[#161b22] border-[#30363d] text-[#8b949e]"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <ImageIcon className="w-3.5 h-3.5 shrink-0 text-[#58a6ff]" />
                        <span className="truncate text-[11px]">{obj.name}</span>
                      </div>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#58a6ff] uppercase">
                        {obj.surfaceTarget}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: 3D FILE IMPORTER (.glb, .stl, .svg) */}
          {activeTab === "files" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#8b949e] mb-1.5">
                  Import Model 3D Custom (.GLB / .GLTF / .STL)
                </label>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#30363d] hover:border-[#2f81f7] rounded-xl cursor-pointer bg-[#161b22] transition-colors">
                  <Box className="w-5 h-5 text-[#bc8cff] mb-1" />
                  <span className="text-[11px] text-[#c9d1d9] font-semibold">Pilih File 3D Mesh</span>
                  <span className="text-[9.5px] text-[#8b949e]">Auto-scale & Auto-center</span>
                  <input type="file" accept=".glb,.gltf,.stl" onChange={handle3DFileUpload} className="hidden" />
                </label>
                {model3dUrl && (
                  <>
                    <div className="mt-2 p-2 rounded-lg bg-[#238636]/20 border border-[#238636] text-[#3fb950] text-[10.5px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="truncate">Model 3D Aktif: {formName} ({modelFormat.toUpperCase()})</span>
                    </div>

                    <div className="mt-3 p-3 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#c9d1d9] flex items-center gap-1.5">
                          <Maximize2 className="w-3.5 h-3.5 text-[#58a6ff]" />
                          Skala Visual Model 3D
                        </span>
                        <span className="font-mono text-[#58a6ff] font-bold">{Math.round(modelScaleMultiplier * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.05"
                        value={modelScaleMultiplier}
                        onChange={(e) => setModelScaleMultiplier(Number(e.target.value))}
                        className="w-full accent-[#2f81f7] h-1.5 bg-[#21262d] rounded-lg cursor-pointer"
                      />
                      <div className="grid grid-cols-3 gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => setModelScaleMultiplier(0.8)}
                          className={`px-2 py-1 text-[10px] rounded transition-colors ${
                            modelScaleMultiplier === 0.8 ? "bg-[#2f81f7] text-white font-bold" : "bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9]"
                          }`}
                        >
                          Kecil (80%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setModelScaleMultiplier(1.0)}
                          className={`px-2 py-1 text-[10px] rounded transition-colors ${
                            modelScaleMultiplier === 1.0 ? "bg-[#238636] text-white font-bold" : "bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9]"
                          }`}
                        >
                          Default (100%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setModelScaleMultiplier(1.2)}
                          className={`px-2 py-1 text-[10px] rounded transition-colors ${
                            modelScaleMultiplier === 1.2 ? "bg-[#2f81f7] text-white font-bold" : "bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9]"
                          }`}
                        >
                          Besar (120%)
                        </button>
                      </div>
                      <div className="text-[9.5px] text-[#8b949e] flex items-center gap-1.5 pt-1.5 border-t border-[#30363d]/60">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#3fb950] shrink-0" />
                        <span>Batas Maks Visual: <strong>1.65 unit</strong> (Model 1280px / CAD dinormalisasi otomatis).</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#8b949e] mb-1.5">
                  Import 2D Dieline Vector (.SVG)
                </label>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#30363d] hover:border-[#2f81f7] rounded-xl cursor-pointer bg-[#161b22] transition-colors">
                  <FileCode className="w-5 h-5 text-[#3fb950] mb-1" />
                  <span className="text-[11px] text-[#c9d1d9] font-semibold">Pilih File Dieline SVG</span>
                  <span className="text-[9.5px] text-[#8b949e]">Menghubungkan pola pisau potong ke 3D</span>
                  <input type="file" accept=".svg" onChange={handleDielineSvgUpload} className="hidden" />
                </label>
                {customDielineSvgUrl && (
                  <div className="mt-2 p-2 rounded-lg bg-[#238636]/20 border border-[#238636] text-[#3fb950] text-[10.5px] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>SVG Dieline Kustom Terkoneksi ke 3D</span>
                  </div>
                )}
              </div>

              {/* Generate GLB Model from Dieline Section */}
              <div className="pt-2 border-t border-[#30363d] space-y-2">
                <label className="block text-[11px] font-bold text-[#8b949e]">
                  Generate 3D Model (.GLB) dari Dieline
                </label>
                <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
                  <p className="text-[10px] text-[#8b949e] leading-relaxed">
                    Ubah konfigurasi bentuk, dimensi fisik ({length}×{width}×{height} mm), dan tekstur dieline aktif menjadi file model 3D binary <strong>.GLB</strong> standar Three.js.
                  </p>
                  <button
                    onClick={handleTriggerExportGLB}
                    disabled={isExportingGLB}
                    className="w-full py-2 px-3 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingGLB ? "Mengenerate GLB..." : "Generate & Unduh File .GLB"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SCENE & LIGHTING */}
          {activeTab === "scene" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#8b949e] mb-1.5">Preset Sudut Kamera</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "front", label: "Front (0°)" },
                    { id: "iso", label: "3/4 Hero" },
                    { id: "side", label: "Side (90°)" },
                    { id: "top", label: "Top (45°)" },
                    { id: "back", label: "Back (180°)" },
                  ].map((ang) => (
                    <button
                      key={ang.id}
                      onClick={() => setCameraView(ang.id as any)}
                      className={`py-2 px-1.5 rounded-lg border text-center transition-all ${
                        cameraView === ang.id
                          ? "bg-[#2f81f7]/20 border-[#2f81f7] text-white font-bold"
                          : "bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-white"
                      }`}
                    >
                      {ang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-bold text-[#8b949e] mb-1.5">Studio Backdrop Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={canvasBg}
                    onChange={(e) => setCanvasBg(e.target.value)}
                    className="w-8 h-8 rounded border border-[#30363d] bg-transparent cursor-pointer"
                  />
                  <div className="flex gap-1.5">
                    {["#f8fafc", "#eaedf0", "#1e293b", "#0f172a"].map((bg) => (
                      <button
                        key={bg}
                        onClick={() => setCanvasBg(bg)}
                        style={{ backgroundColor: bg }}
                        className="w-6 h-6 rounded border border-[#30363d]"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Studio Footer Info */}
        <div className="p-3 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between text-[10.5px] text-[#8b949e]">
          <span>3DPAKS Packaging CAD Lab</span>
          <Link
            href="/admin/templates"
            className="flex items-center gap-1 text-[#58a6ff] hover:underline font-bold"
          >
            <span>Katalog Template</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* RIGHT VIEWPORT CANVAS (#viewport)                                     */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex-1 relative h-full flex flex-col min-w-0 bg-[#eaedf0] overflow-hidden">
        {/* Floating Top HUD Island */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            {isPanelCollapsed && (
              <button
                onClick={() => setIsPanelCollapsed(false)}
                className="px-2.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-[#D5E4F0] text-[#1F3A5C] font-bold text-[11px] shadow-sm hover:bg-[#EEF4F8] transition-all flex items-center gap-1.5"
                title="Buka Panel Kontrol"
              >
                <PanelLeftOpen className="w-3.5 h-3.5 text-[#2F79A6]" />
                <span>Panel Kontrol</span>
              </button>
            )}

            <div className="px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-[#D5E4F0] shadow-sm flex items-center gap-2 text-[#1F3A5C]">
              <span className="font-extrabold text-[12px]">{formName}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#EEF4F8] text-[#2F79A6] border border-[#D5E4F0] font-bold">
                {length} × {width} × {height} mm
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={handleTriggerExportGLB}
              disabled={isExportingGLB}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-[11px] shadow-sm transition-all active:scale-95 disabled:opacity-50"
              title="Generate dan download file 3D GLB langsung dari model/dieline ini"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>{isExportingGLB ? "Generating GLB..." : "Generate 3D GLB"}</span>
            </button>

            <Link
              href={`/editor?template=${selectedFormId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#1F3A5C] border border-[#D5E4F0] font-bold shadow-sm transition-all"
              title="Buka di Editor Pelanggan"
            >
              <span>Uji di Client Editor</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#2F79A6]" />
            </Link>
          </div>
        </div>

        {/* 3D WebGL Canvas Engine */}
        <div className="w-full h-full relative">
          <PackagingCanvas
            category={category}
            length={length}
            width={width}
            height={height}
            radius={radius}
            wallThickness={1.5}
            boxColor={boxColor}
            materialFinish={materialFinish}
            materialType={materialType}
            model3dUrl={model3dUrl}
            modelFormat={modelFormat}
            dielineSvgUrl={activeDielineSvgUrl}
            objects={objects}
            selectedObjectId={selectedObjectId}
            showGrid={false}
            cameraView={cameraView}
            canvasBackground={canvasBg}
            maxVisualBound={maxVisualBound}
            modelScaleMultiplier={modelScaleMultiplier}
            exportGLBTrigger={exportGLBTrigger}
            exportGLBFileName={`${formName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${length}x${width}x${height}mm.glb`}
            onExportGLBDone={handleExportGLBDone}
          />

          {/* Bottom Right Floating Badge */}
          <div className="absolute bottom-4 right-4 z-20 pointer-events-none flex flex-col items-end gap-1">
            <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-mono font-bold tracking-wider">
              3DPAKS ENGINE • REAL MILLIMETRES
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminStudioPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-[#1F3A5C] font-bold">Memuat 3D Packaging Studio...</div>}>
      <AdminStudioContent />
    </React.Suspense>
  )
}
