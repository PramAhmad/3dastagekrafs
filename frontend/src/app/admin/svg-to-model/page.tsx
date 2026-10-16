"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Box,
  Layers,
  Upload,
  Download,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Sliders,
  Maximize2,
  FileCode,
  Tag,
  ArrowRight,
  Info,
  RefreshCw,
  FolderPlus,
  Palette,
  ExternalLink,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from "lucide-react"

import DielineFoldCanvas from "@/components/3d/DielineFoldCanvas"
import AdminDrawer from "@/components/admin/AdminDrawer"
import WorkspaceTabs from "@/components/admin/WorkspaceTabs"
import type { WorkspaceTabItem } from "@/components/admin/WorkspaceTabs"
import { analyzeSvgDieline, DielineAnalysis } from "@/lib/dielineTo3D"
import { generateParametricDieline } from "@/lib/dielineGenerator"
import { autoFixDielineSvg, sanitizeSvgFor3D } from "@/lib/dielineAutoFixer"
import { PackagingTemplate } from "@/types/admin"

// Sample Presets for instant testing
const SAMPLE_PRESETS = [
  {
    id: "gable-carton",
    name: "Gable-Top Milk Carton (Susu/Jus)",
    desc: "Dus karton minuman gable top dengan atap segitiga miring & segel lidah lem.",
    style: "gable",
    svgUrl: "/uploads/gable-top-carton-dieline_1792088420245.svg",
    category: "BOX",
  },
  {
    id: "fefco-0427-mailer",
    name: "FEFCO 0427 Mailer Box (Kardus E-Commerce)",
    desc: "Kardus lipat roll-end tuck top tanpa isolasi untuk pengiriman & merchandise.",
    style: "fefco-0427",
    category: "BOX",
    dims: { w: 180, d: 120, h: 60 },
  },
  {
    id: "fefco-0211-tuck",
    name: "FEFCO 0211 Tuck-End Carton (Dus Ritel)",
    desc: "Dus karton lipat standar untuk kosmetik, obat-obatan, dan botol parfum.",
    style: "fefco-0211",
    category: "BOX",
    dims: { w: 100, d: 60, h: 140 },
  },
  {
    id: "fefco-0201-rsc",
    name: "FEFCO 0201 Regular Slotted Container (RSC)",
    desc: "Karton gelombang master box industri standar untuk logistik & pergudangan.",
    style: "fefco-0201",
    category: "BOX",
    dims: { w: 220, d: 150, h: 160 },
  },
]

function DielinePreviewViewport({ svg, className = "" }: { svg: string; className?: string }) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOrigin = useRef({ pointerX: 0, pointerY: 0, panX: 0, panY: 0 })

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [svg])

  const changeZoom = (delta: number) => {
    setZoom((current) => Math.min(4, Math.max(0.5, Number((current + delta).toFixed(2)))))
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-[linear-gradient(45deg,#f4f7fa_25%,transparent_25%),linear-gradient(-45deg,#f4f7fa_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f4f7fa_75%),linear-gradient(-45deg,transparent_75%,#f4f7fa_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] touch-none ${isDragging ? "cursor-grabbing" : "cursor-grab"} ${className}`}
      onWheel={(event) => {
        event.preventDefault()
        changeZoom(event.deltaY < 0 ? 0.15 : -0.15)
      }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        dragOrigin.current = { pointerX: event.clientX, pointerY: event.clientY, panX: pan.x, panY: pan.y }
        setIsDragging(true)
      }}
      onPointerMove={(event) => {
        if (!isDragging) return
        setPan({
          x: dragOrigin.current.panX + event.clientX - dragOrigin.current.pointerX,
          y: dragOrigin.current.panY + event.clientY - dragOrigin.current.pointerY,
        })
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        setIsDragging(false)
      }}
      onPointerCancel={() => setIsDragging(false)}
      onDoubleClick={resetView}
      aria-label="Workspace preview dieline. Scroll untuk zoom, drag untuk menggeser."
    >
      <img
        src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
        alt="Preview dieline SVG"
        draggable={false}
        className="pointer-events-none h-[88%] w-[88%] select-none object-contain will-change-transform"
        style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})` }}
      />
      <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-xl border border-[#D5E4F0] bg-white/95 p-1 shadow-sm backdrop-blur-sm">
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => changeZoom(-0.25)} disabled={zoom <= 0.5} aria-label="Zoom out preview" className="flex h-7 w-7 items-center justify-center rounded-lg text-[#4B6B94] hover:bg-[#EEF4F8] disabled:opacity-35"><ZoomOut className="h-3.5 w-3.5" /></button>
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={resetView} aria-label="Reset preview view" className="min-w-11 rounded-lg px-1.5 py-1 font-mono text-[8px] font-extrabold text-[#1F3A5C] hover:bg-[#EEF4F8]">{Math.round(zoom * 100)}%</button>
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => changeZoom(0.25)} disabled={zoom >= 4} aria-label="Zoom in preview" className="flex h-7 w-7 items-center justify-center rounded-lg text-[#2F79A6] hover:bg-[#EEF4F8] disabled:opacity-35"><ZoomIn className="h-3.5 w-3.5" /></button>
      </div>
      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-[#D5E4F0] bg-white/90 px-2.5 py-1 text-[8px] font-bold text-[#718BAA] shadow-sm backdrop-blur-sm">
        Scroll untuk zoom · Drag untuk geser · Double click untuk reset
      </div>
    </div>
  )
}

export default function SvgToModelPage() {
  const router = useRouter()

  // State
  const [selectedPresetId, setSelectedPresetId] = useState<string>("gable-carton")
  const [svgString, setSvgString] = useState<string>("")
  const [dielinePreviewSvg, setDielinePreviewSvg] = useState<string>("")
  const [modelTextureSvg, setModelTextureSvg] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(true)
  const [analysis, setAnalysis] = useState<DielineAnalysis | null>(null)
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false)
  const [isMobileLayout, setIsMobileLayout] = useState<boolean>(false)
  const [svgSourceTab, setSvgSourceTab] = useState<"upload" | "presets" | "analysis">("upload")

  // Folding Animation State
  const [foldProgress, setFoldProgress] = useState<number>(1.0) // 1.0 = 100% folded
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const animFrameRef = useRef<number | null>(null)

  // Material & Appearance (Default Kraft Cardboard)
  const [boxColor, setBoxColor] = useState<string>("#be8d58")
  const [materialFinish, setMaterialFinish] = useState<"matte" | "glossy" | "kraft" | "metallic">("kraft")

  // GLB Export & Save Modal State
  const [exportTrigger, setExportTrigger] = useState<number>(0)
  const [captureTrigger, setCaptureTrigger] = useState<number>(0)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState<boolean>(false)
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false)

  // Template Form Metadata
  const [templateName, setTemplateName] = useState<string>("Gable-Top Beverage Carton")
  const [templateCategory, setTemplateCategory] = useState<string>("BOX")
  const [templateDesc, setTemplateDesc] = useState<string>("Model kemasan 3D hasil generate otomatis dari pola vector SVG dieline.")
  const [templateBadge, setTemplateBadge] = useState<string>("Auto 3D")
  const [capturedThumbnail, setCapturedThumbnail] = useState<string>("")

  // Toast Feedback
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null)

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 4000)
  }

  // 1. Load Initial Preset or SVG
  const loadPreset = async (presetId: string) => {
    setSelectedPresetId(presetId)
    setIsAnalyzing(true)

    const preset = SAMPLE_PRESETS.find((p) => p.id === presetId)
    if (!preset) return

    setTemplateName(preset.name)
    setTemplateCategory(preset.category)

    try {
      let rawSvg = ""
      if (preset.svgUrl) {
        const res = await fetch(preset.svgUrl)
        if (res.ok) rawSvg = await res.text()
      } else if (preset.style && preset.dims) {
        const gen = generateParametricDieline({
          width: preset.dims.w,
          depth: preset.dims.d,
          height: preset.dims.h,
          style: preset.style as any,
        })
        rawSvg = gen.svgString
      }

      if (rawSvg) {
        const autoFix = autoFixDielineSvg(rawSvg)
        setSvgString(autoFix.fixedSvg)
        setDielinePreviewSvg(rawSvg)
        setModelTextureSvg(sanitizeSvgFor3D(rawSvg))
        // Analyze original CAD source so structural metadata and exact layer geometry survive cleanup.
        const ana = analyzeSvgDieline(rawSvg)
        setAnalysis(ana)
        showToast(`Pola dieline "${preset.name}" berhasil dianalisis & dilipat ke 3D!`)
      }
    } catch (err) {
      console.error("Gagal memuat preset SVG:", err)
      showToast("Gagal memuat pola preset SVG.", "error")
    } finally {
      setIsAnalyzing(false)
    }
  }

  useEffect(() => {
    loadPreset("gable-carton")
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)")
    const updateLayout = () => {
      const isMobile = mediaQuery.matches
      setIsMobileLayout(isMobile)
      if (!isMobile) setIsInspectorOpen(false)
    }

    updateLayout()
    mediaQuery.addEventListener("change", updateLayout)
    return () => mediaQuery.removeEventListener("change", updateLayout)
  }, [])

  // 2. Handle Custom SVG Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsAnalyzing(true)
    setSelectedPresetId("custom-upload")
    const cleanName = file.name.replace(/\.[^/.]+$/, "")
    setTemplateName(cleanName)

    try {
      const text = await file.text()
      const autoFix = autoFixDielineSvg(text)
      setSvgString(autoFix.fixedSvg)
      setDielinePreviewSvg(text)
      setModelTextureSvg(sanitizeSvgFor3D(text))
      const ana = analyzeSvgDieline(text)
      setAnalysis(ana)
      showToast(`✓ SVG Dieline "${file.name}" berhasil dianalisis & digambar menjadi model 3D!`, "success")
    } catch (err) {
      console.error("Gagal membaca SVG:", err)
      showToast("Gagal membaca file SVG.", "error")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 3. Automated Folding Play / Pause Animation
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      return
    }

    let direction = 1
    const animate = () => {
      setFoldProgress((prev) => {
        let next = prev + 0.008 * direction
        if (next >= 1.0) {
          next = 1.0
          direction = -1
        } else if (next <= 0.0) {
          next = 0.0
          direction = 1
        }
        return next
      })
      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isPlaying])

  const [glbExportCallback, setGlbExportCallback] = useState<{ cb: (blob: Blob) => void } | null>(null)

  // 4. Trigger GLB Download
  const handleDownloadGlb = () => {
    setIsExporting(true)
    setExportTrigger((prev) => prev + 1)
    showToast("Mengenerate file 3D GLB dari pola lipat...")
  }

  // 5. Handle Generated GLB Blob
  const handleExportDone = async (blob: Blob, filename: string) => {
    setIsExporting(false)

    if (glbExportCallback) {
      const cb = glbExportCallback.cb
      setGlbExportCallback(null)
      cb(blob)
      return
    }

    // Trigger download on client
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10000)

    showToast(`Model 3D "${filename}" berhasil diunduh!`)
  }

  // 6. Handle Save Template Workflow
  const handleOpenSaveModal = () => {
    // Capture 3D view as thumbnail
    setCaptureTrigger((prev) => prev + 1)
    setShowSaveModal(true)
  }

  const handleSaveAsTemplate = async () => {
    if (!analysis) return
    setIsSavingTemplate(true)

    try {
      // 1. Export GLB from current 3D folded geometry
      let glbUrl = ""
      const glbFilename = `${templateName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-3d.glb`

      try {
        const glbBlob = await new Promise<Blob>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Timeout generating GLB")), 10000)
          setGlbExportCallback({
            cb: (blob: Blob) => {
              clearTimeout(timeout)
              resolve(blob)
            },
          })
          setExportTrigger((prev) => prev + 1)
        })

        if (glbBlob && glbBlob.size > 0) {
          const glbFormData = new FormData()
          glbFormData.append("file", glbBlob, glbFilename)
          const uploadRes = await fetch("/api/upload", { method: "POST", body: glbFormData })
          const uploadJson = await uploadRes.json()
          if (uploadJson.url) {
            glbUrl = uploadJson.url
          }
        }
      } catch (glbErr) {
        console.warn("Gagal mengekspor GLB untuk template:", glbErr)
      }

      // 2. Upload SVG dieline to server
      let dielineUrl = ""
      try {
        const svgBlob = new Blob([svgString], { type: "image/svg+xml" })
        const formData = new FormData()
        formData.append("file", svgBlob, `${templateName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-dieline.svg`)
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        const json = await res.json()
        if (json.url) dielineUrl = json.url
      } catch (uploadErr) {
        console.warn("SVG upload error:", uploadErr)
      }

      // 3. Create Template Object
      const newTemplate: PackagingTemplate = {
        id: `template_svg3d_${Date.now()}`,
        name: templateName,
        category: templateCategory,
        description: templateDesc,
        preview_url: capturedThumbnail || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&auto=format&fit=crop&q=80",
        dieline_svg_url: dielineUrl || undefined,
        model_3d_url: glbUrl || undefined,
        is_printable: true,
        is_custom_mesh: !!glbUrl,
        badge: templateBadge,
        default_dimensions: {
          length_mm: analysis.dims.length,
          width_mm: analysis.dims.width,
          height_mm: analysis.dims.height,
        },
        available_materials: ["kraft", "ivory", "corrugated", "matte_art", "glossy"],
      }

      // 4. Save to Backend /api/templates
      const saveRes = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplate),
      })

      if (saveRes.ok) {
        showToast(`Template "${templateName}" berhasil disimpan ke sistem!`)
        setShowSaveModal(false)
        // Redirect to editor or templates
        setTimeout(() => {
          router.push(`/editor?template=${newTemplate.id}`)
        }, 1200)
      } else {
        showToast("Template tersimpan lokal.", "info")
        setShowSaveModal(false)
      }
    } catch (err: any) {
      console.error("Gagal menyimpan template:", err)
      showToast(`Gagal: ${err.message || "Gagal menyimpan template"}`, "error")
    } finally {
      setIsSavingTemplate(false)
    }
  }

  const sourceTabs: WorkspaceTabItem[] = [
    { id: "upload", label: "Upload SVG", shortLabel: "Upload", icon: Upload },
    { id: "presets", label: "Sample Presets", shortLabel: "Presets", icon: Layers },
    { id: "analysis", label: "Analysis", shortLabel: "Analysis", icon: Sliders },
  ]

  const inspectorContent = (
    <div className="space-y-4">
      <WorkspaceTabs items={sourceTabs} activeId={svgSourceTab} onChange={(id) => setSvgSourceTab(id as typeof svgSourceTab)} tablistLabel="SVG source workflow" panelIdPrefix="svg-source" />
      {/* 1. File Upload Dropzone */}
      {svgSourceTab === "upload" && <div className="space-y-1.5">
        <span className="text-[10.5px] font-bold text-[#1F3A5C] uppercase tracking-wider flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5 text-[#2F79A6]" />
          1. Upload Pola Dieline SVG Anda:
        </span>
        <label className="border-2 border-dashed border-[#4394C3]/40 hover:border-[#4394C3] bg-[#EEF4F8] hover:bg-[#E2EDF5] rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group text-center">
          <FileCode className="w-7 h-7 text-[#2F79A6] group-hover:scale-110 mb-1.5 transition-transform" />
          <span className="text-xs font-bold text-[#1F3A5C]">Klik atau Drag & Drop File SVG</span>
          <span className="text-[9.5px] text-[#718BAA] mt-0.5">
            Mendukung file ekspor dari Adobe Illustrator, ArtiosCAD, & CorelDraw
          </span>
          <input type="file" accept=".svg,image/svg+xml" onChange={handleFileUpload} className="hidden" />
        </label>
        {dielinePreviewSvg && (
          <div className="overflow-hidden rounded-2xl border border-[#D5E4F0] bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-[#D5E4F0] px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#1F3A5C]">Preview dieline</p>
                <p className="truncate text-[9px] text-[#718BAA]">Sumber SVG asli: cut, crease, bleed, dan area kerja</p>
              </div>
              <span className="shrink-0 rounded-full border border-[#BFD9E8] bg-[#EAF4F9] px-2 py-0.5 font-mono text-[8px] font-bold text-[#2F79A6]">2D WORKSPACE</span>
            </div>
            <DielinePreviewViewport svg={dielinePreviewSvg} className="aspect-[4/3]" />
          </div>
        )}
      </div>}

      {svgSourceTab === "presets" && <div className="space-y-1.5">
      {/* 2. Preset Samples Selector */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-[#718BAA] uppercase tracking-wider">
          Atau pilih contoh pola packaging siap pakai:
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {SAMPLE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => loadPreset(p.id)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedPresetId === p.id
                  ? "border-[#2F79A6] bg-[#EAF4F9] text-[#1F3A5C] ring-1 ring-[#BFD9E8]"
                  : "bg-white border-[#D5E4F0] hover:bg-[#EEF4F8] text-[#1F3A5C]"
              }`}
            >
              <p className="text-[10px] font-bold truncate">{p.name}</p>
              <p className="text-[8.5px] text-[#718BAA] line-clamp-1 mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>
      </div></div>}

      {/* 3. Auto-Detected Specifications */}
      {svgSourceTab === "analysis" && analysis && (
        <div className="bg-[#EEF4F8] p-3 rounded-2xl border border-[#D5E4F0] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-[#1F3A5C] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Spesifikasi 3D Terdeteksi Otomatis:
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[8.5px] font-mono font-bold uppercase">
              {analysis.boxType === "mailer-0427"
                ? "FEFCO 0427 MAILER BOX"
                : analysis.boxType === "gable"
                ? "GABLE-TOP CARTON"
                : analysis.boxType === "tube-box"
                ? "4-PANEL FOLDING CARTON"
                : analysis.boxType === "cylinder-wrap"
                ? "CYLINDRICAL WRAP LABEL"
                : analysis.boxType === "pouch"
                ? "STAND-UP POUCH / DOYPACK"
                : analysis.boxType === "flat-card"
                ? "FLAT DIE-CUT BOARD"
                : analysis.boxType === "folder"
                ? `${analysis.verticalCreases.length + 1}-PANEL FOLDER`
                : analysis.boxType === "polygon-prism"
                ? `${analysis.verticalCreases.length + 1}-PANEL POLYGON PRISM`
                : analysis.boxType.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-white p-2 rounded-xl border border-[#D5E4F0]"><span className="text-[8.5px] text-[#718BAA] block">Panjang (L)</span><span className="text-xs font-mono font-extrabold text-[#1F3A5C]">{analysis.dims.length} mm</span></div>
            <div className="bg-white p-2 rounded-xl border border-[#D5E4F0]"><span className="text-[8.5px] text-[#718BAA] block">Lebar/Tebal (W)</span><span className="text-xs font-mono font-extrabold text-[#1F3A5C]">{analysis.dims.width} mm</span></div>
            <div className="bg-white p-2 rounded-xl border border-[#D5E4F0]"><span className="text-[8.5px] text-[#718BAA] block">Tinggi (H)</span><span className="text-xs font-mono font-extrabold text-[#1F3A5C]">{analysis.dims.height} mm</span></div>
          </div>

          <div className="space-y-1 text-[9.5px] text-[#4B6B94] pt-1">
            <div className="flex justify-between"><span>Ukuran Lembaran Pola:</span><span className="font-mono font-bold text-[#1F3A5C]">{analysis.totalWidthMm} × {analysis.totalHeightMm} mm</span></div>
            <div className="flex justify-between"><span>Garis Lipat Vertikal:</span><span className="font-mono font-bold text-[#1F3A5C]">{analysis.verticalCreases.length} sumbu lipat</span></div>
            <div className="flex justify-between"><span>Jumlah Sisi Panel:</span><span className="font-mono font-bold text-[#1F3A5C]">{analysis.panels.length} zona semantik</span></div>
          </div>

          <div className="pt-2 border-t border-[#D5E4F0]/80 space-y-1.5">
            <span className="text-[9px] font-extrabold text-[#1F3A5C] uppercase tracking-wider block">Aturan Garis CAD (Standar Industri):</span>
            <div className="space-y-1">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-[#D5E4F0] text-[8.5px]"><div className="flex items-center gap-1.5"><div className="w-5 h-0.5 bg-[#e11d48] rounded-full shrink-0" /><div><span className="font-bold text-[#1F3A5C]">Merah Solid: Pisau Potong (Through Cut)</span><span className="text-[7.5px] text-[#718BAA] block">Memotong kontur luar & sudut flap (Dipotong, bukan dilipat)</span></div></div><span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-mono font-bold text-[8px]">{analysis.cadStats?.cutSegmentsCount || 0} potong</span></div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-[#D5E4F0] text-[8.5px]"><div className="flex items-center gap-1.5"><div className="w-5 h-0.5 border-t-2 border-dashed border-[#10b981] shrink-0" /><div><span className="font-bold text-[#1F3A5C]">Hijau Dashed: Garis Lipat (Score / Crease)</span><span className="text-[7.5px] text-[#718BAA] block">Ditekan membentuk sendi lipatan 3D (Hinges)</span></div></div><span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold text-[8px]">{analysis.cadStats?.creaseSegmentsCount || 0} lipatan</span></div>
              {analysis.cadStats?.bleedSegmentsCount > 0 && <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-[#D5E4F0] text-[8.5px]"><div className="flex items-center gap-1.5"><div className="w-5 h-0.5 border-t border-dotted border-[#00a0e9] shrink-0" /><div><span className="font-bold text-[#1F3A5C]">Biru / Cyan: Batas Bleed & Margin</span><span className="text-[7.5px] text-[#718BAA] block">Toleransi area lebihan cetak 3mm</span></div></div><span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[8px]">{analysis.cadStats?.bleedSegmentsCount} bleed</span></div>}
            </div>
          </div>

          <div className="flex flex-wrap gap-1 pt-1">
            {analysis.panels.map((p, i) => <span key={i} className="px-1.5 py-0.5 rounded-md bg-white border border-[#D5E4F0] text-[8px] font-mono font-bold text-[#2F79A6]">{p.face.toUpperCase()} ({Math.round(p.width)}×{Math.round(p.height)}mm)</span>)}
          </div>
        </div>
      )}

      {svgSourceTab === "analysis" && <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-[#718BAA] uppercase tracking-wider">Preview Pola Lembaran 2D:</span>
        {dielinePreviewSvg ? <DielinePreviewViewport svg={dielinePreviewSvg} className="aspect-4/3 rounded-2xl border border-[#D5E4F0] shadow-inner" /> : <div className="w-full aspect-4/3 bg-[#F8FAFC] rounded-2xl border border-[#D5E4F0] p-2 flex items-center justify-center"><div className="text-center text-[#718BAA] space-y-1"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#2F79A6]" /><p className="text-[10px]">Memuat pola SVG...</p></div></div>}
      </div>}
    </div>
  )

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#EEF4F8] text-[#1F3A5C] font-sans antialiased text-xs select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-xl flex items-center gap-2 animate-slide-up ${
            toastMsg.type === "success"
              ? "bg-emerald-600"
              : toastMsg.type === "error"
              ? "bg-red-600"
              : "bg-[#1F3A5C]"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-[#F7CB45]" />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="min-h-14 shrink-0 bg-white border-b border-[#D5E4F0] px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#BFD9E8] bg-[#EAF4F9] text-[#2F79A6]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="min-w-0 truncate text-sm font-extrabold text-[#1F3A5C]">SVG to 3D Model Template Generator</h1>
              <span className="hidden shrink-0 rounded-full border border-[#D5E4F0] bg-[#EEF4F8] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#2F79A6] sm:inline-block">
                ASTAKRAF 3D ENGINE
              </span>
            </div>
            <p className="hidden truncate text-[10px] text-[#718BAA] sm:block">
              Upload pola vector SVG dieline, sistem otomatis mendeteksi garis potong & garis lipat lalu melipatnya menjadi 3D nyata.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsInspectorOpen(true)}
            className="flex min-h-11 min-w-11 items-center gap-1.5 rounded-xl border border-[#D5E4F0] bg-white px-2.5 text-xs font-bold text-[#1F3A5C] shadow-xs transition-all hover:bg-[#EEF4F8] lg:hidden"
            aria-label="Open SVG parser inspector"
            title="Open SVG parser inspector"
          >
            <Sliders className="h-3.5 w-3.5 text-[#2F79A6]" aria-hidden="true" />
            <span className="hidden sm:inline">Inspector</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadGlb}
            disabled={isExporting || !analysis}
            className="flex min-h-11 min-w-11 items-center gap-1.5 rounded-xl border border-[#D5E4F0] bg-white px-2.5 text-xs font-bold text-[#1F3A5C] shadow-xs transition-all hover:bg-[#EEF4F8] disabled:cursor-not-allowed disabled:opacity-60 sm:px-3"
            aria-label="Export 3D GLB"
            title="Export 3D (.GLB)"
          >
            {isExporting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Download className="h-3.5 w-3.5 text-[#2F79A6]" aria-hidden="true" />}
            <span className="hidden sm:inline">Export 3D (.GLB)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenSaveModal}
            disabled={!analysis}
            className="flex min-h-11 min-w-11 items-center gap-1.5 rounded-xl bg-[#1F3A5C] px-2.5 text-xs font-extrabold text-[#F7CB45] shadow-sm transition-all hover:bg-[#152840] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            aria-label="Save as model template"
            title="Simpan Sebagai Model Template"
          >
            <FolderPlus className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden md:inline">Simpan Sebagai Model Template</span>
            <span className="md:hidden">Simpan</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop parser inspector */}
        <aside className="hidden min-h-0 w-[22rem] shrink-0 flex-col justify-between overflow-y-auto border-r border-[#D5E4F0] bg-white p-4 lg:flex xl:w-96">
          {inspectorContent}
          <div className="pt-2 border-t border-[#D5E4F0] text-[9.5px] text-[#718BAA] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#2F79A6] shrink-0" aria-hidden="true" />
            <span>Pola SVG langsung dimapping 1:1 ke koordinat UV model 3D tanpa distorsi.</span>
          </div>
        </aside>

        <AdminDrawer open={isMobileLayout && isInspectorOpen} onClose={() => setIsInspectorOpen(false)} title="SVG Parser Inspector" side="left">
          {inspectorContent}
          <div className="mt-4 pt-2 border-t border-[#D5E4F0] text-[9.5px] text-[#718BAA] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#2F79A6] shrink-0" aria-hidden="true" />
            <span>Pola SVG langsung dimapping 1:1 ke koordinat UV model 3D tanpa distorsi.</span>
          </div>
        </AdminDrawer>

        {/* Right Column: 3D Live Folded Viewport & Folding Controls */}
        <div className="flex-1 flex flex-col bg-[#F0F5FA] relative overflow-hidden">
          {/* 3D Viewport */}
          <div className="flex-1 relative">
            <button
              type="button"
              onClick={() => setIsInspectorOpen(true)}
              className="absolute left-4 top-4 z-10 flex h-11 items-center gap-1.5 rounded-xl border border-[#D5E4F0] bg-white/95 px-3 text-xs font-bold text-[#1F3A5C] shadow-lg backdrop-blur-md transition-all hover:bg-white lg:hidden"
              aria-label="Open SVG parser inspector"
              title="Open SVG parser inspector"
            >
              <Sliders className="h-3.5 w-3.5 text-[#2F79A6]" aria-hidden="true" />
              <span>Inspector</span>
            </button>
            {analysis ? (
              <DielineFoldCanvas
                analysis={analysis}
                foldProgress={foldProgress}
                boxColor={boxColor}
                materialFinish={materialFinish}
                dielineSvgString={modelTextureSvg || undefined}
                exportTrigger={exportTrigger}
                onExportDone={handleExportDone}
                captureTrigger={captureTrigger}
                onCaptureThumbnail={(thumb) => setCapturedThumbnail(thumb)}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#718BAA] space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin text-[#2F79A6]" />
                <p className="text-xs font-bold text-[#1F3A5C]">Menganalisis & Melipat Pola 3D...</p>
              </div>
            )}

            {/* Floating Camera & Reset View Widget */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md border border-[#D5E4F0] rounded-xl p-1.5 shadow-lg flex items-center gap-1 z-10">
              <span className="text-[9px] font-bold text-[#718BAA] px-2 font-mono">
                {Math.round(foldProgress * 100)}% FOLDED
              </span>
              <button
                onClick={() => setFoldProgress(1.0)}
                className="px-2 py-1 rounded-lg bg-[#EEF4F8] hover:bg-[#E2EDF5] text-[9px] font-bold text-[#1F3A5C]"
              >
                100% Kotak
              </button>
              <button
                onClick={() => setFoldProgress(0.0)}
                className="px-2 py-1 rounded-lg bg-[#EEF4F8] hover:bg-[#E2EDF5] text-[9px] font-bold text-[#1F3A5C]"
              >
                0% Datar
              </button>
            </div>
          </div>

          {/* Bottom Control Bar: Fold Progress Slider & Material Selector */}
          <div className="min-h-24 h-auto shrink-0 bg-white/95 backdrop-blur-md border-t border-[#D5E4F0] px-3 py-3 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 z-20 shadow-lg">
            {/* Play/Pause & Folding Slider */}
            <div className="min-w-0 w-full lg:max-w-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span id="folding-progress-label" className="min-w-0 truncate text-xs font-extrabold text-[#1F3A5C] flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 shrink-0 text-purple-600" aria-hidden="true" />
                  <span className="truncate">Simulasi Lipat Pola Kemasan (Folding Progress):</span>
                </span>
                <span className="text-xs font-mono font-black text-purple-700">
                  {Math.round(foldProgress * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all shadow-xs ${
                    isPlaying
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-[#1F3A5C] text-[#F7CB45] hover:bg-[#152840]"
                  }`}
                  aria-label={isPlaying ? "Pause folding simulation" : "Play folding simulation"}
                  title={isPlaying ? "Jeda Simulasi" : "Mulai Animasi Lipat Otomatis"}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                <div className="flex-1 relative flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.005"
                    value={foldProgress}
                    aria-labelledby="folding-progress-label"
                    aria-valuetext={`${Math.round(foldProgress * 100)}% folded`}
                    onChange={(e) => {
                      setIsPlaying(false)
                      setFoldProgress(parseFloat(e.target.value))
                    }}
                    className="w-full accent-purple-600 cursor-pointer h-2 bg-[#EEF4F8] rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-between gap-2 text-[8.5px] font-bold text-[#718BAA]">
                <span>0% Lembaran Pola Datar</span>
                <span className="hidden sm:inline">50% Setengah Terlipat</span>
                <span>100% Kotak Utuh Sempurna</span>
              </div>
            </div>

            {/* Material & Appearance Selector */}
            <div className="min-w-0 w-full lg:w-auto shrink-0 flex items-center gap-4 border-t border-[#D5E4F0] pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
              {/* Material Finish Pills */}
              <div className="min-w-0 space-y-1">
                <span className="text-[9px] font-bold text-[#718BAA] uppercase tracking-wider block">
                  Material Karton:
                </span>
                <div className="flex min-w-0 gap-1 overflow-x-auto pb-1">
                  {[
                    { id: "kraft", label: "Karton Kraft Cokelat", color: "#be8d58" },
                    { id: "matte", label: "Ivory / Duplex Putih", color: "#f8f9fa" },
                    { id: "glossy", label: "Glossy Coated UV", color: "#ffffff" },
                    { id: "metallic", label: "Metallic Gold Foil", color: "#d4af37" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setMaterialFinish(m.id as any)
                        setBoxColor(m.color)
                      }}
                      className={`min-h-11 shrink-0 px-2.5 py-1 rounded-xl text-[9.5px] font-bold transition-all border ${
                        materialFinish === m.id
                          ? "bg-[#1F3A5C] text-[#F7CB45] border-[#1F3A5C] shadow-xs"
                          : "bg-white text-[#4B6B94] border-[#D5E4F0] hover:bg-[#EEF4F8]"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#D5E4F0] shadow-2xl w-full max-w-lg p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#D5E4F0] pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-extrabold text-[#1F3A5C]">Simpan Sebagai Template 3D Baru</h3>
              </div>
              <button
                onClick={() => setShowSaveModal(false)}
                className="w-7 h-7 rounded-lg text-[#718BAA] hover:bg-[#EEF4F8] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#1F3A5C] block mb-1">Nama Model Kemasan</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] text-xs font-bold text-[#1F3A5C] focus:bg-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#1F3A5C] block mb-1">Kategori</label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] text-xs font-bold text-[#1F3A5C] focus:bg-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="BOX">Kotak / Box</option>
                    <option value="POUCH">Standing Pouch</option>
                    <option value="JAR">Toples / Jar</option>
                    <option value="BOTTLE">Botol</option>
                    <option value="CAN">Kaleng</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#1F3A5C] block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={templateBadge}
                    onChange={(e) => setTemplateBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] text-xs font-bold text-[#1F3A5C] focus:bg-white focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#1F3A5C] block mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] text-xs text-[#1F3A5C] focus:bg-white focus:outline-none focus:border-purple-600"
                />
              </div>

              {analysis && (
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-[10px] text-purple-900 flex justify-between">
                  <span>Dimensi Default:</span>
                  <span className="font-mono font-bold">
                    {analysis.dims.length} × {analysis.dims.width} × {analysis.dims.height} mm
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D5E4F0]">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-xl border border-[#D5E4F0] text-xs font-bold text-[#718BAA] hover:bg-[#EEF4F8]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={isSavingTemplate}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20"
              >
                {isSavingTemplate ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Simpan &amp; Buka di 3D Editor</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
