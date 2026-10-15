"use client"

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import PackagingCanvas, {
  DecalType,
  SurfaceTarget,
  CanvasObject,
} from "@/components/3d/PackagingCanvas"
import DielineCanvas from "@/components/2d/DielineCanvas"
import PacdoraLoadingScreen from "@/components/ui/PacdoraLoadingScreen"
import UserImageLibrary from "@/components/editor/UserImageLibrary"
import { formatRupiah } from "@/lib/utils"
import { getCurrentUser, getProjectById, saveProjectToHistory, getUserSavedProjects, logoutUser } from "@/lib/auth"
import { UserSession, SavedProject } from "@/types/auth"
import { BRAND_COLORS } from "@/lib/theme"
import { DEFAULT_PACKAGING_TEMPLATES } from "@/types/admin"
import jsPDF from "jspdf"
import {
  Box,
  Layers,
  Sparkles,
  Download,
  ShoppingCart,
  Sliders,
  Palette,
  UploadCloud,
  LayoutDashboard,
  Grid as GridIcon,
  Circle,
  Square,
  Triangle,
  Star,
  Hexagon,
  Award,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Plus,
  ShieldCheck,
  Move,
  X,
  Check,
  Maximize2,
  RotateCw,
  Type as TypeIcon,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Search,
  ArrowLeft,
  ArrowRight,
  Package,
  CheckCircle2,
  History,
  Save,
  LogOut,
  User,
  Keyboard,
  Undo2,
  Redo2,
  Info,
  HelpCircle,
  FileText,
  Tag,
} from "lucide-react"

interface PricingQuote {
  raw_volume_cm3: number
  effective_volume_cm3: number
  filament_weight_grams: number
  estimated_print_minutes: number
  material_cost: number
  machine_cost: number
  packaging_fee: number
  final_total_price: number
}

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
  dieline_svg_url?: string
  available_materials?: string[]
}

const TEMPLATES: TemplateItem[] = DEFAULT_PACKAGING_TEMPLATES.map((t) => ({
  id: t.id,
  name: t.name,
  category: t.category,
  description: t.description,
  defaultDims: {
    length: t.default_dimensions?.length_mm ?? 65,
    width: t.default_dimensions?.width_mm ?? 45,
    height: t.default_dimensions?.height_mm ?? 35,
    radius: t.default_dimensions?.radius_mm ?? 25,
  },
  badge: t.badge,
  preview_url: t.preview_url,
  model_3d_url: t.model_3d_url,
  model_format: t.model_format,
  dieline_svg_url: t.dieline_svg_url,
  available_materials: t.available_materials,
}))

const BOX_COLORS = [
  { name: "Biru Brand Kemasan", hex: BRAND_COLORS.primary },
  { name: "Navy Premium", hex: BRAND_COLORS.navy },
  { name: "Kuning Cerah (Aksen)", hex: BRAND_COLORS.yellow },
  { name: "Putih Bersih", hex: "#ffffff" },
  { name: "Kraft Cokelat", hex: "#d97706" },
  { name: "Hitam Pekat", hex: "#18181b" },
  { name: "Abu Natural", hex: "#71717a" },
  { name: "Hijau Sage", hex: "#10b981" },
]

export interface MaterialOption {
  id: string
  name: string
  subtitle: string
  finish: "matte" | "glossy" | "kraft" | "metallic" | "frosted"
  textureType: "corrugated" | "kraft" | "matte" | "glossy" | "gold_foil" | "silver_foil" | "metallic"
  defaultColor: string
  previewSwatch: string
}

const MATERIALS: MaterialOption[] = [
  {
    id: "corrugated",
    name: "Corrugated Cardboard",
    subtitle: "Karton Gelombang Cokelat",
    finish: "kraft",
    textureType: "corrugated",
    defaultColor: "#ba8b57",
    previewSwatch: "#ba8b57",
  },
  {
    id: "kraft",
    name: "Brown Kraft Paper",
    subtitle: "Kertas Kraft Natural",
    finish: "kraft",
    textureType: "kraft",
    defaultColor: "#ca9a66",
    previewSwatch: "#ca9a66",
  },
  {
    id: "matte_art",
    name: "Matte Art Paper",
    subtitle: "Putih Halus Doff",
    finish: "matte",
    textureType: "matte",
    defaultColor: "#f4f4f5",
    previewSwatch: "#f4f4f5",
  },
  {
    id: "glossy",
    name: "Glossy Coated UV",
    subtitle: "Putih Mengkilap (High Gloss)",
    finish: "glossy",
    textureType: "glossy",
    defaultColor: "#ffffff",
    previewSwatch: "#ffffff",
  },
  {
    id: "metallic_gold",
    name: "Metallic Gold Foil",
    subtitle: "Hot Stamping Emas Mewah",
    finish: "metallic",
    textureType: "gold_foil",
    defaultColor: BRAND_COLORS.yellow,
    previewSwatch: "#d4af37",
  },
  {
    id: "metallic_silver",
    name: "Metallic Silver Foil",
    subtitle: "Perak Foil / Chrome",
    finish: "metallic",
    textureType: "silver_foil",
    defaultColor: "#cbd5e1",
    previewSwatch: "#cbd5e1",
  },
  {
    id: "black_matte",
    name: "Navy Matte Soft-Touch",
    subtitle: "Navy Doff Premium",
    finish: "matte",
    textureType: "matte",
    defaultColor: BRAND_COLORS.navy,
    previewSwatch: BRAND_COLORS.navy,
  },
  {
    id: "frosted",
    name: "Frosted Glass & Translucent",
    subtitle: "Mika / Kaca Buram",
    finish: "frosted",
    textureType: "matte",
    defaultColor: "#e2e8f0",
    previewSwatch: "#e2e8f0",
  },
  {
    id: "metallic",
    name: "Tinplate Metal",
    subtitle: "Kaleng Logam Metalik",
    finish: "metallic",
    textureType: "metallic",
    defaultColor: "#94a3b8",
    previewSwatch: "#94a3b8",
  },
  {
    id: "ivory",
    name: "Ivory Paperboard",
    subtitle: "Ivory Putih Premium",
    finish: "matte",
    textureType: "matte",
    defaultColor: "#faf8f5",
    previewSwatch: "#faf8f5",
  },
  {
    id: "duplex",
    name: "Duplex Board",
    subtitle: "Karton Duplex Abu-Putih",
    finish: "kraft",
    textureType: "kraft",
    defaultColor: "#d1d5db",
    previewSwatch: "#d1d5db",
  },
]

const SHAPES_LIST: { id: DecalType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "circle", label: "Lingkaran", icon: Circle },
  { id: "square", label: "Kotak", icon: Square },
  { id: "triangle", label: "Segitiga", icon: Triangle },
  { id: "star", label: "Bintang", icon: Star },
  { id: "hexagon", label: "Hexagon", icon: Hexagon },
  { id: "badge", label: "Badge", icon: Award },
]

const SHAPE_PALETTE = [
  BRAND_COLORS.navy,
  BRAND_COLORS.primary,
  BRAND_COLORS.yellow,
  "#ffffff",
  "#18181b",
  "#059669",
  "#dc2626",
]

function EditorComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateParam = searchParams.get("template")
  const projectIdParam = searchParams.get("projectId")

  // Auth User State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [isStudioLoading, setIsStudioLoading] = useState(true)

  // Current Project Info
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectIdParam || null)
  const [projectName, setProjectName] = useState("Desain Kemasan Saya")
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false)

  // Editor View Mode: "mockup" (3D Mode) | "dieline" (2D Mode)
  const [editorMode, setEditorMode] = useState<"mockup" | "dieline">("mockup")

  // Selected Template & Dimensions
  const [templateList, setTemplateList] = useState<TemplateItem[]>(TEMPLATES)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem>(TEMPLATES[0])
  const [length, setLength] = useState(65)
  const [width, setWidth] = useState(45)
  const [height, setHeight] = useState(35)
  const [radius, setRadius] = useState(25)
  const [wallThickness, setWallThickness] = useState(1.6)
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialOption>(MATERIALS[0])
  const [boxColor, setBoxColor] = useState(MATERIALS[0].defaultColor)
  const [faceColors, setFaceColors] = useState<Record<string, string>>({})
  const [viewSide, setViewSide] = useState<"outside" | "inside">("outside")

  // Decal / Graphic Objects
  const [objects, setObjects] = useState<CanvasObject[]>([])
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  const [activeSurface, setActiveSurface] = useState<SurfaceTarget>("front")
  const [studioTab, setStudioTab] = useState<"uploads" | "elements" | "text" | "tools">("uploads")

  // Undo / Redo history & Shortcut Modal
  const [undoStack, setUndoStack] = useState<CanvasObject[][]>([])
  const [redoStack, setRedoStack] = useState<CanvasObject[][]>([])
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [showImageLibraryModal, setShowImageLibraryModal] = useState(false)
  const [replacingObjectId, setReplacingObjectId] = useState<string | null>(null)

  // Camera Orbit & Grid
  const [cameraView, setCameraView] = useState<"iso" | "front" | "back" | "top" | "side">("iso")
  const [showGrid, setShowGrid] = useState(false)
  const [dielineZoom, setDielineZoom] = useState(50)
  const [openProgress, setOpenProgress] = useState(0)

  const handleUpdateFaceColor = (faceId: string, color: string) => {
    setFaceColors((prev) => ({ ...prev, [faceId]: color }))
  }

  // Pricing Quote
  const [quote, setQuote] = useState<PricingQuote>({
    raw_volume_cm3: 102.37,
    effective_volume_cm3: 20.47,
    filament_weight_grams: 25.59,
    estimated_print_minutes: 51,
    material_cost: 6398,
    machine_cost: 8530,
    packaging_fee: 5000,
    final_total_price: 19928,
  })

  // 1. Initial Auth & Project Loader
  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent("/editor" + (projectIdParam ? `?projectId=${projectIdParam}` : templateParam ? `?template=${templateParam}` : ""))}`)
      return
    }
    setCurrentUser(user)
    setAuthChecking(false)

    // Load custom templates if exists in LocalStorage
    const savedCustomTemplates = localStorage.getItem("kemasan3d_custom_templates") || localStorage.getItem("kemasan3d_admin_templates")
    let combinedTemplates = [...TEMPLATES]
    if (savedCustomTemplates) {
      try {
        const parsed = JSON.parse(savedCustomTemplates)
        if (Array.isArray(parsed)) {
          const normalized: TemplateItem[] = parsed.map((t: any) => ({
            id: t.id,
            name: t.name,
            category: t.category,
            description: t.description || "Kemasan produk UMKM.",
            preview_url: t.preview_url || undefined,
            model_3d_url: t.model_3d_url || undefined,
            model_format: t.model_format || (t.model_3d_url ? "glb" : undefined),
            dieline_svg_url: t.dieline_svg_url || undefined,
            defaultDims: {
              length: t.defaultDims?.length ?? t.default_dimensions?.length_mm ?? 65,
              width: t.defaultDims?.width ?? t.default_dimensions?.width_mm ?? 45,
              height: t.defaultDims?.height ?? t.default_dimensions?.height_mm ?? 35,
              radius: t.defaultDims?.radius ?? t.default_dimensions?.radius_mm ?? 25,
            },
            badge: t.badge || (t.model_3d_url ? "3D Mesh" : undefined),
            available_materials: t.available_materials || undefined,
          }))
          const idSet = new Set(normalized.map((n) => n.id))
          combinedTemplates = [...normalized, ...TEMPLATES.filter((tpl) => !idSet.has(tpl.id))]
          setTemplateList(combinedTemplates)
        }
      } catch (e) {}
    }

    // If projectId provided, load saved project
    if (projectIdParam) {
      const savedProj = getProjectById(projectIdParam)
      if (savedProj) {
        setProjectName(savedProj.name)
        const matchedTpl = combinedTemplates.find((t) => t.id === savedProj.templateId) || {
          id: savedProj.templateId,
          name: savedProj.templateName,
          category: savedProj.category,
          description: savedProj.description,
          defaultDims: { ...savedProj.dimensions, radius: savedProj.dimensions.radius || 25 },
          model_3d_url: savedProj.model3dUrl,
          model_format: savedProj.modelFormat,
          available_materials: undefined,
        }
        setSelectedTemplate(matchedTpl as TemplateItem)
        setLength(savedProj.dimensions.length)
        setWidth(savedProj.dimensions.width)
        setHeight(savedProj.dimensions.height)
        if (savedProj.dimensions.radius) setRadius(savedProj.dimensions.radius)
        if (savedProj.dimensions.wallThickness) setWallThickness(savedProj.dimensions.wallThickness)

        const matchedMat = MATERIALS.find((m) => m.id === savedProj.materialId) || MATERIALS[0]
        setSelectedMaterial(matchedMat)
        setBoxColor(savedProj.boxColor || matchedMat.defaultColor)
        setObjects(savedProj.objects || [])
        return
      }
    }

    // If template param passed
    if (templateParam) {
      const found = combinedTemplates.find((t) => t.id === templateParam || t.category?.toLowerCase() === templateParam.toLowerCase())
      if (found) {
        setSelectedTemplate(found)
        const dims = found.defaultDims || { length: 65, width: 45, height: 35, radius: 25 }
        setLength(dims.length ?? 65)
        setWidth(dims.width ?? 45)
        setHeight(dims.height ?? 35)
        setRadius(dims.radius ?? 25)
      }
    }
  }, [router, templateParam, projectIdParam])

  // Filter materials available specifically for the active packaging template
  const activeMaterials = useMemo(() => {
    if (selectedTemplate.available_materials && selectedTemplate.available_materials.length > 0) {
      const filtered = MATERIALS.filter((m) => selectedTemplate.available_materials?.includes(m.id))
      return filtered.length > 0 ? filtered : MATERIALS
    }
    return MATERIALS
  }, [selectedTemplate])

  // If currently selected material is not in active template's allowed materials, switch to first allowed
  useEffect(() => {
    if (!activeMaterials.some((m) => m.id === selectedMaterial.id)) {
      const first = activeMaterials[0]
      if (first) {
        setSelectedMaterial(first)
        setBoxColor(first.defaultColor)
      }
    }
  }, [activeMaterials, selectedMaterial])

  // 2. Real-time Pricing Calculator
  useEffect(() => {
    let volRaw = 0
    if (selectedTemplate.category === "JAR" || selectedTemplate.category === "BOTTLE" || selectedTemplate.category === "CAN") {
      volRaw = (Math.PI * Math.pow(radius / 10, 2) * height) / 10
    } else if (selectedTemplate.category === "TRIANGLE") {
      volRaw = (0.5 * (length / 10) * (width / 10) * height) / 10
    } else {
      volRaw = ((length / 10) * (width / 10) * height) / 10
    }

    const volEffective = volRaw * 0.20
    const weightGrams = volEffective * 1.25
    const printMins = Math.max(15, Math.round(weightGrams * 2.0))
    const matCost = Math.round(weightGrams * 250)
    const machCost = Math.round(printMins * 166.6)
    const packFee = 5000
    const total = matCost + machCost + packFee

    setQuote({
      raw_volume_cm3: parseFloat(volRaw.toFixed(2)),
      effective_volume_cm3: parseFloat(volEffective.toFixed(2)),
      filament_weight_grams: parseFloat(weightGrams.toFixed(2)),
      estimated_print_minutes: printMins,
      material_cost: matCost,
      machine_cost: machCost,
      packaging_fee: packFee,
      final_total_price: total,
    })
  }, [length, width, height, radius, selectedTemplate.category])

  // Save Project to History
  const handleSaveProject = () => {
    if (!currentUser) return
    const saved = saveProjectToHistory({
      id: currentProjectId || undefined,
      userId: currentUser.id,
      name: projectName,
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      category: selectedTemplate.category,
      description: selectedTemplate.description,
      dimensions: {
        length,
        width,
        height,
        radius,
        wallThickness,
      },
      materialId: selectedMaterial.id,
      materialName: selectedMaterial.name,
      boxColor,
      objects,
      model3dUrl: selectedTemplate.model_3d_url,
      modelFormat: selectedTemplate.model_format,
    })

    setCurrentProjectId(saved.id)
    setSaveSuccessNotice(true)
    setTimeout(() => setSaveSuccessNotice(false), 3000)
  }

  // Material selection
  const handleSelectMaterial = (mat: MaterialOption) => {
    setSelectedMaterial(mat)
    setBoxColor(mat.defaultColor)
  }

  // Push current objects state to undo stack before mutation
  const pushToUndo = (currentObjs: CanvasObject[]) => {
    setUndoStack((prev) => [...prev.slice(-25), currentObjs])
    setRedoStack([])
  }

  const handleUndo = () => {
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    setUndoStack((s) => s.slice(0, -1))
    setRedoStack((s) => [...s, objects])
    setObjects(prev)
    if (selectedObjectId && !prev.some((o) => o.id === selectedObjectId)) {
      setSelectedObjectId(null)
    }
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    setRedoStack((s) => s.slice(0, -1))
    setUndoStack((s) => [...s, objects])
    setObjects(next)
  }

  // Object manipulations
  const addObject = (type: DecalType, color: string = BRAND_COLORS.navy, imageUrl?: string) => {
    pushToUndo(objects)
    const isImage = type === "image"
    const newObj: CanvasObject = {
      id: "obj_" + Math.random().toString(36).substring(2, 9),
      name: `${type.toUpperCase()} #${objects.length + 1}`,
      type,
      color,
      imageUrl: imageUrl || null,
      surfaceTarget: activeSurface,
      posX: 0,
      posY: 0,
      scale: 1,
      widthMm: isImage ? 45 : 22,
      heightMm: isImage ? 45 : 22,
      rotation: 0,
      opacity: 1,
      visible: true,
    }
    setObjects((prev) => [...prev, newObj])
    setSelectedObjectId(newObj.id)
  }

  const updateObject = (id: string, patch: Partial<CanvasObject>) => {
    setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }

  const removeObject = (id: string) => {
    pushToUndo(objects)
    setObjects((prev) => prev.filter((o) => o.id !== id))
    if (selectedObjectId === id) setSelectedObjectId(null)
  }

  const duplicateObject = (id: string) => {
    const target = objects.find((o) => o.id === id)
    if (!target) return
    pushToUndo(objects)
    const dup: CanvasObject = {
      ...target,
      id: "obj_" + Math.random().toString(36).substring(2, 9),
      name: `${target.name} (Copy)`,
      posX: (target.posX || 0) + 5,
      posY: (target.posY || 0) + 5,
    }
    setObjects((prev) => [...prev, dup])
    setSelectedObjectId(dup.id)
  }

  // Global Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input / textarea
      const target = e.target as HTMLElement | null
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)

      if (isInput) return

      // 1. Delete / Backspace -> Hapus objek terpilih
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedObjectId) {
          e.preventDefault()
          removeObject(selectedObjectId)
        }
        return
      }

      // 2. Escape -> Deselect objek atau tutup modal
      if (e.key === "Escape") {
        if (showShortcutsModal) {
          setShowShortcutsModal(false)
        } else if (selectedObjectId) {
          setSelectedObjectId(null)
        }
        return
      }

      // 3. Ctrl+S / Cmd+S -> Simpan Proyek
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault()
        handleSaveProject()
        return
      }

      // 4. Ctrl+G / Cmd+G -> Toggle Grid
      if ((e.ctrlKey || e.metaKey) && (e.key === "g" || e.key === "G")) {
        e.preventDefault()
        setShowGrid((prev) => !prev)
        return
      }

      // 5. Ctrl+Z / Cmd+Z -> Undo
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z") && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
        return
      }

      // 6. Ctrl+Y atau Ctrl+Shift+Z -> Redo
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y")) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "z" || e.key === "Z"))
      ) {
        e.preventDefault()
        handleRedo()
        return
      }

      // 7. Ctrl+D -> Duplicate object
      if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) {
        if (selectedObjectId) {
          e.preventDefault()
          duplicateObject(selectedObjectId)
        }
        return
      }

      // 8. 1-5 -> Quick Camera View switch (when not dragging / typing)
      if (["1", "2", "3", "4", "5"].includes(e.key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        const views = ["iso", "front", "back", "top", "side"] as const
        setCameraView(views[parseInt(e.key) - 1])
        return
      }

      // 9. ? -> Open Shortcuts Modal
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault()
        setShowShortcutsModal(true)
        return
      }

      // 10. V -> Toggle selected object visibility
      if ((e.key === "v" || e.key === "V") && !e.ctrlKey && !e.metaKey) {
        if (selectedObjectId) {
          e.preventDefault()
          setObjects((prev) =>
            prev.map((o) => (o.id === selectedObjectId ? { ...o, visible: !o.visible } : o))
          )
        }
        return
      }

      // 11. Arrow Keys -> Nudge position
      if (
        selectedObjectId &&
        (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight")
      ) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 2
        setObjects((prev) =>
          prev.map((o) => {
            if (o.id !== selectedObjectId) return o
            let deltaX = 0
            let deltaY = 0
            if (e.key === "ArrowLeft") deltaX = -step
            if (e.key === "ArrowRight") deltaX = step
            if (e.key === "ArrowUp") deltaY = -step
            if (e.key === "ArrowDown") deltaY = step
            return {
              ...o,
              posX: (o.posX || 0) + deltaX,
              posY: (o.posY || 0) + deltaY,
            }
          })
        )
        return
      }

      // 12. Plus / Minus / Bracket / Rotate
      if (selectedObjectId) {
        if (e.key === "+" || e.key === "=") {
          e.preventDefault()
          setObjects((prev) =>
            prev.map((o) =>
              o.id === selectedObjectId ? { ...o, scale: Math.min(4, (o.scale || 1) + 0.1) } : o
            )
          )
        } else if (e.key === "-" || e.key === "_") {
          e.preventDefault()
          setObjects((prev) =>
            prev.map((o) =>
              o.id === selectedObjectId ? { ...o, scale: Math.max(0.2, (o.scale || 1) - 0.1) } : o
            )
          )
        } else if (e.key === "r" || e.key === "R") {
          e.preventDefault()
          // Shift+R rotates counter-clockwise (-15°), R rotates clockwise (+15°)
          const deltaRot = e.shiftKey ? -15 : 15
          setObjects((prev) =>
            prev.map((o) =>
              o.id === selectedObjectId
                ? { ...o, rotation: ((o.rotation || 0) + deltaRot + 360) % 360 }
                : o
            )
          )
        } else if (e.key === "[") {
          e.preventDefault()
          setObjects((prev) =>
            prev.map((o) =>
              o.id === selectedObjectId
                ? { ...o, opacity: Math.max(0.1, Number(((o.opacity ?? 1) - 0.1).toFixed(2))) }
                : o
            )
          )
        } else if (e.key === "]") {
          e.preventDefault()
          setObjects((prev) =>
            prev.map((o) =>
              o.id === selectedObjectId
                ? { ...o, opacity: Math.min(1.0, Number(((o.opacity ?? 1) + 0.1).toFixed(2))) }
                : o
            )
          )
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedObjectId, objects, undoStack, redoStack, showShortcutsModal, length, width, height, radius, wallThickness, selectedTemplate, selectedMaterial, boxColor, projectName, currentProjectId, currentUser])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    let finalUrl = ""
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      if (res.ok) {
        const json = await res.json()
        if (json.url) finalUrl = json.url
      }
    } catch (err) {
      console.warn("Upload fallback to data URL:", err)
    }

    if (!finalUrl) {
      finalUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (event) => resolve((event.target?.result as string) || "")
        reader.readAsDataURL(file)
      })
    }

    if (finalUrl) {
      if (replacingObjectId) {
        updateObject(replacingObjectId, { imageUrl: finalUrl })
        setReplacingObjectId(null)
      } else {
        addObject("image", "#ffffff", finalUrl)
      }

      // Save to user library in background
      try {
        const cleanName = file.name.replace(/\.[^/.]+$/, "")
        await fetch("/api/user-library", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: cleanName,
            url: finalUrl,
            category: "upload",
            userId: currentUser?.id,
          }),
        })
      } catch (e) {}
    }
  }

  // Download STL export
  const handleDownloadSTL = () => {
    const stlHeader = "solid ExportedPackagingModel\n"
    const stlFooter = "endsolid ExportedPackagingModel\n"
    const facetSample = `  facet normal 0 0 1\n    outer loop\n      vertex 0 0 ${height}\n      vertex ${length} 0 ${height}\n      vertex ${length} ${width} ${height}\n    endloop\n  endfacet\n`
    const stlContent = stlHeader + facetSample + stlFooter

    const blob = new Blob([stlContent], { type: "model/stl" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${selectedTemplate.name.toLowerCase().replace(/\s+/g, "_")}_${length}x${width}x${height}.stl`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Export PDF blueprint with 2D Dieline, specifications, and 3D preview
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      // 1. Header Ribbon (#1F3A5C)
      doc.setFillColor(31, 58, 92)
      doc.rect(10, 8, 277, 18, "F")

      doc.setTextColor(247, 203, 69) // #F7CB45
      doc.setFont("helvetica", "bold")
      doc.setFontSize(13)
      doc.text("ASTAKRAFT STUDIO — LEMBAR KERJA DIELINE & SPESIFIKASI TEKNIS", 15, 17)

      doc.setTextColor(238, 244, 248)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.text(
        `Model: ${selectedTemplate.name}   |   Kategori: ${selectedTemplate.category}   |   Tanggal: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
        15,
        22
      )

      // 2. Technical Specifications Card (Left Box)
      doc.setDrawColor(213, 228, 240)
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(10, 29, 130, 42, 3, 3, "FD")

      doc.setTextColor(31, 58, 92)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.text("SPESIFIKASI TEKNIS KEMASAN", 14, 35)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(75, 107, 148)

      doc.text("• Dimensi Utama (P × L × T):", 14, 42)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(31, 58, 92)
      doc.text(`${length} mm × ${width} mm × ${height} mm (Radius: ${radius} mm)`, 60, 42)

      doc.setFont("helvetica", "normal")
      doc.setTextColor(75, 107, 148)
      doc.text("• Jenis Bahan / Material:", 14, 48)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(31, 58, 92)
      doc.text(`${selectedMaterial.name}`, 60, 48)

      doc.setFont("helvetica", "normal")
      doc.setTextColor(75, 107, 148)
      doc.text("• Warna Latar Kemasan:", 14, 54)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(31, 58, 92)
      doc.text(`${boxColor.toUpperCase()}`, 60, 54)

      doc.setFont("helvetica", "normal")
      doc.setTextColor(75, 107, 148)
      doc.text("• Finishing Karakter:", 14, 60)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(31, 58, 92)
      const finishDesc =
        selectedMaterial.finish === "glossy"
          ? "Glossy / Lapisan Kilap"
          : selectedMaterial.finish === "metallic"
          ? "Foil Emas Metalik (Hot Stamping)"
          : selectedMaterial.finish === "kraft"
          ? "Karton Kraft Alami (Recycled Eco-Kraft)"
          : "Matte / Doff Karton Alami"
      doc.text(`${finishDesc}`, 60, 60)

      doc.setFont("helvetica", "normal")
      doc.setTextColor(75, 107, 148)
      doc.text("• Elemen Artwork / Logo:", 14, 66)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(31, 58, 92)
      doc.text(`${objects.length} elemen visual terpasang`, 60, 66)

      // 3. 3D Preview Snapshot (Right Box)
      doc.setDrawColor(213, 228, 240)
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(145, 29, 142, 42, 3, 3, "FD")

      doc.setTextColor(31, 58, 92)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.text("PREVIEW VISUAL 3D REAL-TIME", 149, 35)

      // Capture 3D Canvas
      try {
        const canvasEl = document.querySelector("canvas")
        if (canvasEl) {
          const imgData = canvasEl.toDataURL("image/png")
          doc.addImage(imgData, "PNG", 195, 31, 88, 38, undefined, "FAST")
        }
      } catch (e) {
        doc.setFont("helvetica", "italic")
        doc.setFontSize(7.5)
        doc.setTextColor(113, 139, 170)
        doc.text("Model 3D interaktif tersimpan di studio", 149, 45)
      }

      // Legend in 3D box
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7.5)
      doc.setTextColor(75, 107, 148)
      doc.text("Standar Garis Dieline:", 149, 42)

      doc.setDrawColor(225, 29, 72) // Red
      doc.setLineWidth(0.6)
      doc.setLineDashPattern([], 0)
      doc.line(149, 47, 160, 47)
      doc.setTextColor(225, 29, 72)
      doc.text("Garis Potong (Cut)", 162, 48)

      doc.setDrawColor(37, 99, 235) // Blue
      doc.setLineWidth(0.5)
      doc.setLineDashPattern([2, 1], 0)
      doc.line(149, 54, 160, 54)
      doc.setTextColor(37, 99, 235)
      doc.text("Garis Lipatan (Crease)", 162, 55)

      doc.setDrawColor(5, 150, 105) // Green
      doc.setLineWidth(0.5)
      doc.setLineDashPattern([1, 1], 0)
      doc.line(149, 61, 160, 61)
      doc.setTextColor(5, 150, 105)
      doc.text("Lidah Kancing / Lem (Flap)", 162, 62)

      // Reset Line Dash
      doc.setLineDashPattern([], 0)

      // 4. Main 2D Dieline Blueprint Area
      doc.setDrawColor(213, 228, 240)
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(10, 75, 277, 118, 3, 3, "FD")

      doc.setTextColor(31, 58, 92)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.text("SKETSA POLA POTONG 2D (DIELINE BLUEPRINT)", 14, 82)

      const cx = 148
      const cy = 135
      const L = length
      const W = width
      const H = height

      if (selectedTemplate.category === "BOX" || !selectedTemplate.category) {
        // Mailer / Tuck-end Box Layout
        const totalMmW = L + 2 * H + 20
        const totalMmH = 2 * W + 2 * H + 25
        const scale = Math.min(220 / totalMmW, 85 / totalMmH, 0.7)

        const sL = L * scale
        const sW = W * scale
        const sH = H * scale
        const sFlap = 12 * scale

        const bx = cx - sL / 2
        const by = cy - sW / 2

        // Panels Background
        doc.setFillColor(241, 245, 249)
        doc.rect(bx, by, sL, sW, "F") // Bottom
        doc.rect(bx, by + sW, sL, sH, "F") // Front
        doc.rect(bx, by - sH, sL, sH, "F") // Back
        doc.rect(bx, by - sH - sW, sL, sW, "F") // Lid
        doc.rect(bx, by - sH - sW - sFlap, sL, sFlap, "F") // Tuck flap
        doc.rect(bx - sH, by, sH, sW, "F") // Left side
        doc.rect(bx + sL, by, sH, sW, "F") // Right side
        doc.rect(bx - sH, by + sW, sH, sH * 0.8, "F")
        doc.rect(bx + sL, by + sW, sH, sH * 0.8, "F")
        doc.rect(bx - sH, by - sH * 0.8, sH, sH * 0.8, "F")
        doc.rect(bx + sL, by - sH * 0.8, sH, sH * 0.8, "F")

        // Draw Crease Lines (Fold lines) - Blue Dashed
        doc.setDrawColor(37, 99, 235)
        doc.setLineWidth(0.4)
        doc.setLineDashPattern([2, 1], 0)

        doc.line(bx, by, bx + sL, by)
        doc.line(bx, by + sW, bx + sL, by + sW)
        doc.line(bx, by, bx, by + sW)
        doc.line(bx + sL, by, bx + sL, by + sW)
        doc.line(bx, by - sH, bx + sL, by - sH)
        doc.line(bx, by - sH - sW, bx + sL, by - sH - sW)
        doc.line(bx - sH, by, bx - sH, by + sW)
        doc.line(bx + sL + sH, by, bx + sL + sH, by + sW)

        // Draw Outer Cut Lines - Red Solid
        doc.setDrawColor(225, 29, 72)
        doc.setLineWidth(0.6)
        doc.setLineDashPattern([], 0)

        doc.line(bx, by - sH - sW - sFlap, bx + sL, by - sH - sW - sFlap)
        doc.line(bx, by - sH - sW - sFlap, bx, by - sH)
        doc.line(bx, by - sH, bx - sH, by - sH)
        doc.line(bx - sH, by - sH, bx - sH, by + sW + sH * 0.8)
        doc.line(bx - sH, by + sW + sH * 0.8, bx, by + sW + sH * 0.8)
        doc.line(bx, by + sW + sH * 0.8, bx, by + sW + sH)
        doc.line(bx, by + sW + sH, bx + sL, by + sW + sH)
        doc.line(bx + sL, by + sW + sH, bx + sL, by + sW + sH * 0.8)
        doc.line(bx + sL, by + sW + sH * 0.8, bx + sL + sH, by + sW + sH * 0.8)
        doc.line(bx + sL + sH, by + sW + sH * 0.8, bx + sL + sH, by - sH)
        doc.line(bx + sL + sH, by - sH, bx + sL, by - sH)
        doc.line(bx + sL, by - sH, bx + sL, by - sH - sW - sFlap)

        // Labels
        doc.setTextColor(31, 58, 92)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(7)
        doc.text("DASAR (Bawah)", bx + sL / 2, by + sW / 2, { align: "center" })
        doc.text("DEPAN (Front)", bx + sL / 2, by + sW + sH / 2, { align: "center" })
        doc.text("BELAKANG (Back)", bx + sL / 2, by - sH / 2, { align: "center" })
        doc.text("TUTUP (Lid)", bx + sL / 2, by - sH - sW / 2, { align: "center" })
        doc.text("LIDAH KANCING", bx + sL / 2, by - sH - sW - sFlap / 2, { align: "center" })
        doc.text("SISI KIRI", bx - sH / 2, by + sW / 2, { align: "center" })
        doc.text("SISI KANAN", bx + sL + sH / 2, by + sW / 2, { align: "center" })

        // Dimension callouts
        doc.setTextColor(37, 99, 235)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(6.5)
        doc.text(`${L} mm`, bx + sL / 2, by + sW + 3, { align: "center" })
        doc.text(`${W} mm`, bx + sL + 2, by + sW / 2)
        doc.text(`${H} mm`, bx + sL + 2, by + sW + sH / 2)
      } else {
        // Generic / Pouch / Cylindrical schematic
        const totalMmW = L * 2 + 30
        const totalMmH = H + 30
        const scale = Math.min(200 / totalMmW, 75 / totalMmH, 0.8)

        const sL = L * scale
        const sH = H * scale
        const sSeal = 12 * scale

        const p1x = cx - sL - 4
        const p2x = cx + 4
        const py = cy - sH / 2

        doc.setFillColor(241, 245, 249)
        doc.rect(p1x, py, sL, sH, "F")
        doc.rect(p2x, py, sL, sH, "F")

        doc.setDrawColor(225, 29, 72)
        doc.setLineWidth(0.6)
        doc.rect(p1x, py, sL, sH)
        doc.rect(p2x, py, sL, sH)

        doc.setDrawColor(37, 99, 235)
        doc.setLineWidth(0.4)
        doc.setLineDashPattern([2, 1], 0)
        doc.line(p1x, py + sSeal, p1x + sL, py + sSeal)
        doc.line(p1x, py + sH - sSeal, p1x + sL, py + sH - sSeal)
        doc.line(p2x, py + sSeal, p2x + sL, py + sSeal)
        doc.line(p2x, py + sH - sSeal, p2x + sL, py + sH - sSeal)
        doc.setLineDashPattern([], 0)

        doc.setTextColor(31, 58, 92)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(8)
        doc.text("MUKA DEPAN (Front)", p1x + sL / 2, py + sH / 2, { align: "center" })
        doc.text("MUKA BELAKANG (Back)", p2x + sL / 2, py + sH / 2, { align: "center" })

        doc.setTextColor(37, 99, 235)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7)
        doc.text(`Lebar: ${L} mm`, p1x + sL / 2, py + sH + 5, { align: "center" })
        doc.text(`Tinggi: ${H} mm`, p2x + sL / 2, py + sH + 5, { align: "center" })
      }

      // 5. Footer & Production Guidelines
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(100, 116, 139)
      doc.text(
        "Catatan Produksi Pisau Pond: Gunakan cetakan 100% tanpa skala (Do not scale / Actual size). Berikan bleed artwork minimal 3 mm di luar garis potong merah.",
        14,
        198
      )
      doc.text(
        "Hak Cipta © AstaKraft Studio • Kolaborasi astacode.id (IT Consultant Tasikmalaya) & GEKRAFS",
        283,
        198,
        { align: "right" }
      )

      const filename = `${selectedTemplate.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${length}x${width}x${height}_dieline.pdf`
      doc.save(filename)
    } catch (err) {
      console.error("Gagal mengekspor PDF:", err)
      alert("Terjadi kendala saat membuat file PDF. Silakan coba kembali.")
    }
  }

  const renderImageLibraryModal = () => {
    if (!showImageLibraryModal) return null
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-3xl border border-[#D5E4F0] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
          <div className="p-5 flex-1 overflow-y-auto">
            <UserImageLibrary
              compact={false}
              activeSurface={activeSurface}
              onSurfaceChange={setActiveSurface}
              currentUserId={currentUser?.id}
              onSelectImage={(url, name) => {
                if (replacingObjectId) {
                  updateObject(replacingObjectId, { imageUrl: url, name })
                  setReplacingObjectId(null)
                } else {
                  addObject("image", "#ffffff", url)
                }
                setShowImageLibraryModal(false)
              }}
              onCloseModal={() => {
                setShowImageLibraryModal(false)
                setReplacingObjectId(null)
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  const selectedObject = objects.find((o) => o.id === selectedObjectId)

  if (authChecking || isStudioLoading) {
    return (
      <PacdoraLoadingScreen
        message="Memuat Studio 3D & Dieline Kemasan..."
        durationMs={1300}
        onLoaded={() => {
          if (!authChecking) setIsStudioLoading(false)
        }}
      />
    )
  }

  // -------------------------------------------------------------
  // MODE 2: 2D DIELINE & LIVE SYNC EDITOR
  // -------------------------------------------------------------
  if (editorMode === "dieline") {
    return (
      <div className="h-screen w-full max-w-full bg-[#EEF4F8] text-[#1F3A5C] relative font-sans select-none overflow-hidden text-[11px] antialiased">
        {/* Full Edge-to-Edge 2D Dieline Canvas in Background */}
        <div className="absolute inset-0 z-0">
          <DielineCanvas
            category={selectedTemplate.category}
            dielineSvgUrl={selectedTemplate.dieline_svg_url}
            length={length}
            width={width}
            height={height}
            boxColor={boxColor}
            faceColors={faceColors}
            onUpdateFaceColor={handleUpdateFaceColor}
            materialType={selectedMaterial.textureType}
            objects={objects}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            onUpdateObject={updateObject}
            zoom={dielineZoom}
            onZoomChange={setDielineZoom}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
          />
        </div>

        {/* Floating Top Navbar */}
        <header className="absolute top-3.5 left-4 right-4 h-13 bg-white/90 backdrop-blur-md border border-[#D5E4F0] px-4 rounded-2xl flex items-center justify-between z-40 shadow-lg shadow-[#1F3A5C]/5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditorMode("mockup")}
              className="p-1.5 rounded-xl hover:bg-[#EEF4F8] text-[#1F3A5C] transition-all border border-[#D5E4F0]"
              title="Kembali ke 3D Mode"
            >
              <ArrowLeft className="w-4 h-4 text-[#1F3A5C]" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#1F3A5C] text-xs tracking-tight">Upload & Desain Pola (2D Dieline)</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#EEF4F8] text-[#1F3A5C] border border-[#D5E4F0] font-mono uppercase">
                {selectedTemplate.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#D5E4F0] hover:bg-[#EEF4F8] text-[#1F3A5C] font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
              title="Daftar Shortcut Keyboard"
            >
              <Keyboard className="w-3.5 h-3.5 text-[#2F79A6]" />
              <span className="hidden sm:inline">Shortcuts</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#D5E4F0] hover:bg-[#EEF4F8] text-[#1F3A5C] font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
              title="Export Dieline & Spesifikasi ke PDF"
            >
              <FileText className="w-3.5 h-3.5 text-[#E11D48]" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            <button
              onClick={handleSaveProject}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-[#D5E4F0] hover:bg-[#EEF4F8] text-[#1F3A5C] font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5 text-[#2F79A6]" />
              <span>{saveSuccessNotice ? "Tersimpan!" : "Simpan Proyek"}</span>
            </button>

            <button
              onClick={() => setEditorMode("mockup")}
              className="px-4 py-1.5 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Check className="w-3.5 h-3.5 text-[#F7CB45]" />
              <span>Selesai & Ke 3D</span>
            </button>
          </div>
        </header>

        {/* Floating Left Tools Dock */}
        <div className="absolute top-18.5 left-4 bottom-4 z-30 flex gap-2.5 pointer-events-none">
          {/* Left Icon Strip */}
          <nav className="w-12 shrink-0 bg-white/90 backdrop-blur-md border border-[#D5E4F0] rounded-2xl flex flex-col items-center py-3.5 gap-2.5 shadow-lg shadow-[#1F3A5C]/5 pointer-events-auto">
            <button
              onClick={() => setStudioTab("uploads")}
              className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all ${
                studioTab === "uploads" ? "bg-[#1F3A5C] text-[#F7CB45] shadow-sm" : "text-[#4B6B94] hover:text-[#1F3A5C] hover:bg-[#EEF4F8]"
              }`}
              title="Pustaka Gambar & Upload (Logo, Sertifikasi)"
            >
              <UploadCloud className="w-4 h-4" />
            </button>

            <button
              onClick={() => setStudioTab("elements")}
              className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all ${
                studioTab === "elements" ? "bg-[#1F3A5C] text-[#F7CB45] shadow-sm" : "text-[#4B6B94] hover:text-[#1F3A5C] hover:bg-[#EEF4F8]"
              }`}
              title="Elements"
            >
              <Square className="w-4 h-4" />
            </button>

            <button
              onClick={() => setStudioTab("text")}
              className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all ${
                studioTab === "text" ? "bg-[#1F3A5C] text-[#F7CB45] shadow-sm" : "text-[#4B6B94] hover:text-[#1F3A5C] hover:bg-[#EEF4F8]"
              }`}
              title="Text"
            >
              <TypeIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => setStudioTab("tools")}
              className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all ${
                studioTab === "tools" ? "bg-[#1F3A5C] text-[#F7CB45] shadow-sm" : "text-[#4B6B94] hover:text-[#1F3A5C] hover:bg-[#EEF4F8]"
              }`}
              title="Tools / Layers"
            >
              <Layers className="w-4 h-4" />
            </button>
          </nav>

          {/* Left Feature Panel */}
          <div
            className={`${
              studioTab === "uploads" ? "w-80" : "w-64"
            } shrink-0 bg-white/90 backdrop-blur-md border border-[#D5E4F0] rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-lg shadow-[#1F3A5C]/5 pointer-events-auto transition-all duration-200`}
          >
            <div className="space-y-4">
              {studioTab === "uploads" && (
                <UserImageLibrary
                  compact={true}
                  activeSurface={activeSurface}
                  onSurfaceChange={setActiveSurface}
                  currentUserId={currentUser?.id}
                  onSelectImage={(url, name) => {
                    if (replacingObjectId) {
                      updateObject(replacingObjectId, { imageUrl: url, name })
                      setReplacingObjectId(null)
                    } else {
                      addObject("image", "#ffffff", url)
                    }
                  }}
                  onExpandModal={() => {
                    setReplacingObjectId(null)
                    setShowImageLibraryModal(true)
                  }}
                />
              )}

              {studioTab === "elements" && (
                <div className="space-y-3">
                  <span className="font-extrabold text-[#1F3A5C] text-xs block">Bentuk Stiker & Ikon</span>
                  <div className="grid grid-cols-2 gap-2">
                    {SHAPES_LIST.map((shp) => {
                      const IconComp = shp.icon
                      return (
                        <button
                          key={shp.id}
                          onClick={() => addObject(shp.id, BRAND_COLORS.navy)}
                          className="p-2.5 rounded-xl bg-[#EEF4F8] hover:bg-[#E2EDF5] border border-[#D5E4F0] hover:border-[#4394C3] text-[#1F3A5C] flex flex-col items-center gap-1.5 text-[10px] font-bold transition-all"
                        >
                          <IconComp className="w-4 h-4 text-[#2F79A6]" />
                          <span>{shp.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {studioTab === "text" && (
                <div className="space-y-3">
                  <span className="font-extrabold text-[#1F3A5C] text-xs block">Tambahkan Teks</span>
                  <button
                    onClick={() => addObject("badge", BRAND_COLORS.navy)}
                    className="w-full py-2.5 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#F7CB45]" />
                    <span>Tambah Badge Label</span>
                  </button>
                </div>
              )}

              {studioTab === "tools" && (
                <div className="space-y-3">
                  <span className="font-extrabold text-[#1F3A5C] text-xs block">Daftar Layer Desain</span>
                  {objects.length === 0 ? (
                    <p className="text-[10.5px] text-[#718BAA] italic">Belum ada elemen ditambahkan.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {objects.map((obj) => (
                        <div
                          key={obj.id}
                          onClick={() => setSelectedObjectId(obj.id)}
                          className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            selectedObjectId === obj.id
                              ? "bg-[#EEF4F8] border-[#4394C3] font-bold text-[#1F3A5C] shadow-xs"
                              : "bg-white border-[#D5E4F0] text-[#1F3A5C]/80 hover:bg-[#EEF4F8]"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {obj.type === "image" && obj.imageUrl ? (
                              <img src={obj.imageUrl} alt="" className="w-4 h-4 rounded-sm object-contain shrink-0 border border-[#D5E4F0]" />
                            ) : null}
                            <span className="truncate max-w-[110px]">{obj.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {obj.type === "image" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setReplacingObjectId(obj.id)
                                  setShowImageLibraryModal(true)
                                }}
                                className="text-[#718BAA] hover:text-[#2F79A6] p-1 transition-colors"
                                title="Ganti Gambar dari Pustaka"
                              >
                                <FolderOpen className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                duplicateObject(obj.id)
                              }}
                              className="text-[#718BAA] hover:text-[#1F3A5C] p-1 transition-colors"
                              title="Duplikat (Ctrl+D)"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeObject(obj.id)
                              }}
                              className="text-[#718BAA] hover:text-red-600 p-1 transition-colors"
                              title="Hapus (Delete / Backspace)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Right 3D Preview Island (Pacdora Style) */}
        <div className="absolute top-18.5 right-4 bottom-4 w-76 z-30 bg-white/90 backdrop-blur-md border border-[#D5E4F0] rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-lg shadow-[#1F3A5C]/5 pointer-events-auto space-y-4">
          <div className="space-y-4">
            {/* 3D Live Widget with Distinct Neutral Grey Studio Background */}
            <div className="rounded-2xl border border-[#D5E4F0] overflow-hidden bg-[#eaedf0] relative shadow-xs">
              <div className="h-52 w-full relative">
                <PackagingCanvas
                  category={selectedTemplate.category}
                  length={length}
                    width={width}
                    height={height}
                    radius={radius}
                    wallThickness={wallThickness}
                    boxColor={boxColor}
                    faceColors={faceColors}
                    materialFinish={selectedMaterial.finish}
                    materialType={selectedMaterial.textureType}
                    model3dUrl={selectedTemplate.model_3d_url}
                    modelFormat={selectedTemplate.model_format}
                    dielineSvgUrl={selectedTemplate.dieline_svg_url}
                    objects={objects}
                    selectedObjectId={selectedObjectId}
                    showGrid={false}
                    cameraView="iso"
                    openProgress={openProgress}
                    canvasBackground="#eaedf0"
                    maxVisualBound={1.65}
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-[#1F3A5C]/80 text-[#F7CB45] text-[9px] font-extrabold font-mono shadow-xs backdrop-blur-xs border border-[#1F3A5C]">
                    3D LIVE
                  </div>
                </div>
              </div>

              {/* Pacdora-Style Open to Close 3D Fold Slider */}
              <div className="space-y-1.5 bg-[#EEF4F8] p-3 rounded-2xl border border-[#D5E4F0]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#1F3A5C]">Open / Close Fold</span>
                  <span className="font-mono text-[9.5px] font-extrabold px-2 py-0.5 rounded-md bg-white text-[#2F79A6] border border-[#D5E4F0] shadow-xs">
                    {openProgress === 0 ? "Closed (0%)" : openProgress === 100 ? "Open (100%)" : `${openProgress}%`}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[9.5px] font-bold text-[#718BAA]">Close</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={openProgress}
                    onChange={(e) => setOpenProgress(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-[#D5E4F0] rounded-lg appearance-none cursor-pointer accent-[#1F3A5C]"
                  />
                  <span className="text-[9.5px] font-bold text-[#718BAA]">Open</span>
                </div>
              </div>

              {/* Outside / Inside Switcher (Pacdora Style) */}
              <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-xl border border-neutral-200 text-xs font-bold">
                <button
                  onClick={() => setViewSide("outside")}
                  className={`py-1.5 rounded-lg transition-all ${
                    viewSide === "outside"
                      ? "bg-white text-neutral-900 shadow-xs font-bold"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Outside
                </button>
                <button
                  onClick={() => setViewSide("inside")}
                  className={`py-1.5 rounded-lg transition-all ${
                    viewSide === "inside"
                      ? "bg-white text-neutral-900 shadow-xs font-bold"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Inside
                </button>
              </div>

              {/* Package Color Palette (Pacdora Style) */}
              <div className="space-y-2 bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-neutral-800">Package Color</span>
                  <span className="text-[10px] font-mono text-neutral-500">{boxColor}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* Plus Custom Color Picker */}
                  <label className="w-7 h-7 rounded-full border border-dashed border-neutral-400 hover:border-neutral-900 flex items-center justify-center cursor-pointer bg-white transition-all text-neutral-600 hover:text-neutral-900 shadow-xs" title="Pilih Warna Kustom">
                    <Plus className="w-3.5 h-3.5" />
                    <input
                      type="color"
                      value={boxColor}
                      onChange={(e) => setBoxColor(e.target.value)}
                      className="hidden"
                    />
                  </label>

                  {/* Preset Swatches */}
                  {BOX_COLORS.map((c) => {
                    const isSelected = boxColor.toLowerCase() === c.hex.toLowerCase()
                    return (
                      <button
                        key={c.hex}
                        onClick={() => {
                          setBoxColor(c.hex)
                          // Clear per-face overrides if global color changed
                          setFaceColors({})
                        }}
                        className={`w-7 h-7 rounded-full border shadow-xs transition-all ${
                          isSelected
                            ? "scale-110 border-neutral-900 ring-2 ring-neutral-900"
                            : "border-neutral-300 hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Material Texture Preview */}
              <div className="space-y-2 bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-neutral-800">Material</span>
                  <span className="text-[9.5px] font-mono font-bold text-blue-600 truncate max-w-[110px]">
                    {selectedMaterial.name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {activeMaterials.map((mat) => {
                    const isSelected = selectedMaterial.id === mat.id
                    return (
                      <button
                        key={mat.id}
                        onClick={() => handleSelectMaterial(mat)}
                        className={`w-6 h-6 rounded-full transition-all flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "ring-2 ring-neutral-900 ring-offset-1 scale-110 shadow-sm z-10"
                            : "border border-neutral-300 hover:border-neutral-600 hover:scale-105 opacity-85 hover:opacity-100"
                        }`}
                        style={{
                          backgroundColor: mat.previewSwatch,
                          backgroundImage:
                            mat.textureType === "gold_foil"
                              ? "linear-gradient(135deg, #d4af37 0%, #fff2a8 50%, #aa7c11 100%)"
                              : mat.textureType === "silver_foil"
                              ? "linear-gradient(135deg, #cbd5e1 0%, #ffffff 50%, #94a3b8 100%)"
                              : mat.textureType === "corrugated"
                              ? "repeating-linear-gradient(90deg, #ba8b57 0px, #ba8b57 2px, #a47640 3px, #c5945e 4px)"
                              : undefined,
                        }}
                        title={`${mat.name} (${mat.subtitle})`}
                      >
                        {isSelected && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              mat.id === "glossy" || mat.id === "matte_art" || mat.id === "metallic_silver"
                                ? "bg-neutral-900"
                                : "bg-white"
                            }`}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => setEditorMode("mockup")}
              className="w-full py-2.5 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 mt-3"
            >
              <Check className="w-3.5 h-3.5 text-[#F7CB45]" />
              <span>Selesai & Ke 3D</span>
            </button>
          </div>

        {renderImageLibraryModal()}
      </div>
    )
  }

  // -------------------------------------------------------------
  // MODE 1: 3D PACKAGING STUDIO UTAMA (FULL SCREEN)
  // -------------------------------------------------------------
  return (
    <div className="h-screen w-full max-w-full bg-[#EEF4F8] text-[#1F3A5C] relative font-sans select-none overflow-hidden text-[11px] antialiased">
      {/* 3D Viewport Centered Between Left & Right Sidebars with Equal Padding */}
      <div className="absolute top-18.5 left-4 right-4 lg:left-[336px] lg:right-[336px] bottom-4 z-0 bg-[#eaedf0] rounded-2xl overflow-hidden border border-[#D5E4F0] shadow-sm flex items-center justify-center">
        <PackagingCanvas
          category={selectedTemplate.category}
          length={length}
          width={width}
          height={height}
          radius={radius}
          wallThickness={wallThickness}
          boxColor={boxColor}
          faceColors={faceColors}
          materialFinish={selectedMaterial.finish}
          materialType={selectedMaterial.textureType}
          model3dUrl={selectedTemplate.model_3d_url}
          modelFormat={selectedTemplate.model_format}
          dielineSvgUrl={selectedTemplate.dieline_svg_url}
          objects={objects}
          selectedObjectId={selectedObjectId}
          showGrid={showGrid}
          cameraView={cameraView}
          canvasBackground="#eaedf0"
          maxVisualBound={1.65}
        />
      </div>

      {/* 1. Floating Top Header Island */}
      <header className="absolute top-3.5 left-4 right-4 h-13 bg-white/90 backdrop-blur-md border border-[#D5E4F0] px-4 rounded-2xl flex items-center justify-between z-40 shadow-lg shadow-[#1F3A5C]/5">
        {/* Brand & Project Name */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2 group"
            title="AstaKraft Studio - Kembali ke Beranda"
          >
            <div className="w-7 h-7 rounded-lg bg-white border border-[#D5E4F0] overflow-hidden shadow-xs group-hover:border-[#1F3A5C] transition-all p-0.5 shrink-0">
              <img
                src="/logo/astakraft-primary.jpg"
                alt="Logo AstaKraft"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="hidden sm:inline font-black text-xs text-[#1F3A5C] tracking-tight">
              AstaKraft
            </span>
          </a>

          <div className="w-px h-4 bg-[#D5E4F0]" />

          <a
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EEF4F8] hover:bg-[#D5E4F0] text-[#1F3A5C] font-bold text-xs transition-all border border-[#D5E4F0] shadow-xs"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#2F79A6]" />
            <span>Katalog</span>
          </a>

          <div className="w-px h-4 bg-[#D5E4F0]" />

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="font-extrabold text-[#1F3A5C] tracking-tight text-xs bg-transparent hover:bg-[#EEF4F8] focus:bg-white px-2.5 py-1 rounded-lg border border-transparent focus:border-[#4394C3] focus:outline-none transition-all max-w-[200px]"
              title="Klik untuk ubah nama proyek"
            />
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#EEF4F8] text-[#1F3A5C] font-mono uppercase border border-[#D5E4F0]">
              {selectedTemplate.category}
            </span>
          </div>
        </div>

        {/* Center Camera Orbit Buttons */}
        <div className="flex items-center gap-1 bg-[#EEF4F8] p-1 rounded-xl border border-[#D5E4F0]">
          {(["iso", "front", "back", "top", "side"] as const).map((view) => (
            <button
              key={view}
              onClick={() => setCameraView(view)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                cameraView === view
                  ? "bg-[#1F3A5C] text-white shadow-xs"
                  : "text-[#4B6B94] hover:text-[#1F3A5C]"
              }`}
            >
              {view === "iso" ? "3D Orbit" : view === "front" ? "Depan" : view === "back" ? "Belakang" : view === "top" ? "Atas" : "Samping"}
            </button>
          ))}
          <div className="w-px h-4 bg-[#D5E4F0] mx-0.5" />
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 py-1 rounded-lg text-[10px] transition-colors ${showGrid ? "text-[#1F3A5C] bg-[#D5E4F0] font-bold" : "text-[#718BAA]"}`}
            title="Toggle Grid (Ctrl+G)"
          >
            <GridIcon className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-[#D5E4F0] mx-0.5" />
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className={`p-1.5 rounded-lg text-[10px] transition-all ${
              undoStack.length > 0 ? "text-[#1F3A5C] hover:bg-[#D5E4F0] cursor-pointer" : "text-[#A0B6CD] opacity-40 cursor-not-allowed"
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className={`p-1.5 rounded-lg text-[10px] transition-all ${
              redoStack.length > 0 ? "text-[#1F3A5C] hover:bg-[#D5E4F0] cursor-pointer" : "text-[#A0B6CD] opacity-40 cursor-not-allowed"
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Actions: Clean, Uncluttered Header */}
        <div className="flex items-center gap-2">
          {/* Shortcuts Info Button */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white hover:bg-[#EEF4F8] text-[#1F3A5C] border border-[#D5E4F0] text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            title="Daftar Shortcut Keyboard"
          >
            <Keyboard className="w-3.5 h-3.5 text-[#2F79A6]" />
            <span className="hidden md:inline">Shortcuts</span>
          </button>

          {/* User Profile Link & Logout */}
          <div className="pl-1 border-l border-[#D5E4F0] flex items-center gap-1.5">
            <a
              href="/profile"
              className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-[#EEF4F8] text-[#1F3A5C] text-xs font-bold transition-colors"
              title="Buka Profil Saya & Riwayat Desain"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover border border-[#D5E4F0]"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#1F3A5C] text-[#F7CB45] text-[9px] font-bold flex items-center justify-center">
                  {currentUser?.name?.charAt(0) || "U"}
                </div>
              )}
              <span className="hidden md:inline text-[#1F3A5C]">{currentUser?.name?.split(" ")[0]}</span>
            </a>

            <button
              onClick={() => {
                logoutUser()
                router.push("/login")
              }}
              className="p-1.5 rounded-lg text-[#718BAA] hover:text-red-600 hover:bg-[#EEF4F8] transition-colors"
              title="Keluar / Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Floating Left Parameter Panel Island (Geometry & Material) */}
      <aside className="absolute top-18.5 left-4 bottom-4 w-68 z-30 bg-white/90 backdrop-blur-md border border-[#D5E4F0] rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-lg shadow-[#1F3A5C]/5 pointer-events-auto space-y-4">
          <div className="space-y-4">
            {/* 1. Dieline Card CTA */}
            <div className="space-y-2">
              <span className="font-extrabold text-[#1F3A5C] text-xs block">Pola Kemasan (Dieline)</span>
              <div
                onClick={() => setEditorMode("dieline")}
                className="w-full h-28 rounded-2xl border-2 border-dashed border-[#4394C3]/30 hover:border-[#4394C3] bg-[#EEF4F8] hover:bg-[#E2EDF5] p-2.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all group relative overflow-hidden shadow-xs"
              >
                <div className="w-full h-14 bg-white/80 rounded-xl flex items-center justify-center p-1 relative border border-[#D5E4F0]">
                  <div className="grid grid-cols-4 gap-0.5 w-full h-full opacity-60">
                    <div className="bg-[#D5E4F0] rounded-sm border border-[#4394C3]/20" />
                    <div className="bg-[#D5E4F0] rounded-sm border border-[#4394C3]/20" />
                    <div className="bg-[#D5E4F0] rounded-sm border border-[#4394C3]/20" />
                    <div className="bg-[#D5E4F0] rounded-sm border border-[#4394C3]/20" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1F3A5C]/10 rounded-xl backdrop-blur-[0.5px]">
                    <span className="px-3 py-1 rounded-full bg-[#1F3A5C] text-[#F7CB45] text-[9px] font-extrabold shadow-sm group-hover:scale-105 transition-all">
                      Adjust images (2D)
                    </span>
                  </div>
                </div>

                <span className="text-[9.5px] text-[#2F79A6] font-bold group-hover:text-[#1F3A5C]">
                  Klik untuk edit desain di 2D
                </span>
              </div>
            </div>

            {/* 2. Material Selector */}
            <div className="space-y-2.5 bg-[#EEF4F8] p-3 rounded-2xl border border-[#D5E4F0]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#1F3A5C]">Material Kemasan</span>
                <span className="text-[9px] font-mono font-bold text-[#2F79A6] truncate max-w-[100px]">
                  {selectedMaterial.name}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {activeMaterials.map((mat) => {
                  const isSelected = selectedMaterial.id === mat.id
                  return (
                    <button
                      key={mat.id}
                      onClick={() => handleSelectMaterial(mat)}
                      className={`w-6 h-6 rounded-full transition-all flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "ring-2 ring-[#1F3A5C] ring-offset-1 scale-110 shadow-sm z-10"
                          : "border border-[#D5E4F0] hover:border-[#4394C3] hover:scale-105 opacity-85 hover:opacity-100"
                      }`}
                      style={{
                        backgroundColor: mat.previewSwatch,
                        backgroundImage:
                          mat.textureType === "gold_foil"
                            ? "linear-gradient(135deg, #d4af37 0%, #fff2a8 50%, #aa7c11 100%)"
                            : mat.textureType === "silver_foil"
                            ? "linear-gradient(135deg, #cbd5e1 0%, #ffffff 50%, #94a3b8 100%)"
                            : mat.textureType === "corrugated"
                            ? "repeating-linear-gradient(90deg, #ba8b57 0px, #ba8b57 2px, #a47640 3px, #c5945e 4px)"
                            : undefined,
                      }}
                      title={`${mat.name} (${mat.subtitle})`}
                    >
                      {isSelected && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            mat.id === "glossy" || mat.id === "matte_art" || mat.id === "metallic_silver"
                              ? "bg-[#1F3A5C]"
                              : "bg-white"
                          }`}
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="pt-2 border-t border-[#D5E4F0] flex items-center justify-between text-[8.5px] text-[#4B6B94]">
                <span className="font-bold text-[#1F3A5C]">{selectedMaterial.name}</span>
                <span className="text-[8px] text-[#718BAA]">{selectedMaterial.subtitle}</span>
              </div>
            </div>

            {/* 3. Custom Dimensions */}
            <div className="space-y-2.5 bg-[#EEF4F8] p-3 rounded-2xl border border-[#D5E4F0]">
              <div className="flex justify-between items-center text-xs font-extrabold text-[#1F3A5C]">
                <span>Ukuran Kustom</span>
                <span className="font-mono text-[9.5px] text-[#1F3A5C] font-extrabold bg-white px-2 py-0.5 rounded-md border border-[#D5E4F0] shadow-xs">
                  {length}×{width}×{height} mm
                </span>
              </div>

              {/* Length */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-[#4B6B94]">
                  <span>Panjang (L)</span>
                  <span className="font-mono text-[#1F3A5C] font-bold">{length} mm</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="150"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#D5E4F0] rounded-lg appearance-none cursor-pointer accent-[#4394C3]"
                />
              </div>

              {/* Width */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-[#4B6B94]">
                  <span>Lebar (W)</span>
                  <span className="font-mono text-[#1F3A5C] font-bold">{width} mm</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="120"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#D5E4F0] rounded-lg appearance-none cursor-pointer accent-[#4394C3]"
                />
              </div>

              {/* Height */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-[#4B6B94]">
                  <span>Tinggi (H)</span>
                  <span className="font-mono text-[#1F3A5C] font-bold">{height} mm</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#D5E4F0] rounded-lg appearance-none cursor-pointer accent-[#4394C3]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-[#D5E4F0]">
            <button
              onClick={() => setEditorMode("dieline")}
              className="w-full py-2.5 rounded-xl bg-[#F7CB45] hover:bg-[#E5B932] text-[#1F3A5C] font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Layers className="w-4 h-4 text-[#1F3A5C]" />
              <span>Buka Desain 2D Dieline</span>
            </button>
          </div>
        </aside>

        {/* Floating Right Inspector & Order Panel Island */}
        <aside className="absolute top-18.5 right-4 bottom-4 w-76 z-30 bg-white/90 backdrop-blur-md border border-[#D5E4F0] rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-lg shadow-[#1F3A5C]/5 pointer-events-auto space-y-4">
          <div className="space-y-4">
            {/* Header Status Ringkasan */}
            <div className="flex items-center justify-between pb-2 border-b border-[#D5E4F0]">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#2F79A6]" />
                <span className="font-extrabold text-[#1F3A5C] text-xs">Spesifikasi Kemasan</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#EEF4F8] text-[#2F79A6] border border-[#D5E4F0]">
                {selectedTemplate.category}
              </span>
            </div>

            {/* Quick Spec Cards */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-[#EEF4F8] p-2.5 rounded-xl border border-[#D5E4F0] space-y-0.5">
                <span className="text-[8.5px] font-bold text-[#718BAA] uppercase tracking-wider block">Dimensi</span>
                <span className="font-mono text-[#1F3A5C] font-extrabold">{length}×{width}×{height}</span>
                <span className="text-[8px] text-[#718BAA] block">Milimeter (mm)</span>
              </div>

              <div className="bg-[#EEF4F8] p-2.5 rounded-xl border border-[#D5E4F0] space-y-0.5">
                <span className="text-[8.5px] font-bold text-[#718BAA] uppercase tracking-wider block">Volume Efektif</span>
                <span className="font-mono text-[#1F3A5C] font-extrabold">{quote.effective_volume_cm3} cm³</span>
                <span className="text-[8px] text-[#718BAA] block">Total {quote.raw_volume_cm3} cm³</span>
              </div>

              <div className="bg-[#EEF4F8] p-2.5 rounded-xl border border-[#D5E4F0] space-y-0.5">
                <span className="text-[8.5px] font-bold text-[#718BAA] uppercase tracking-wider block">Material</span>
                <span className="text-[#1F3A5C] font-extrabold truncate block">{selectedMaterial.name}</span>
                <span className="text-[8px] text-[#718BAA] block capitalize">{selectedMaterial.finish} finish</span>
              </div>

              <div className="bg-[#EEF4F8] p-2.5 rounded-xl border border-[#D5E4F0] space-y-0.5">
                <span className="text-[8.5px] font-bold text-[#718BAA] uppercase tracking-wider block">Elemen 2D</span>
                <span className="font-mono text-[#1F3A5C] font-extrabold">{objects.length} Layer</span>
                <span className="text-[8px] text-[#718BAA] block">{objects.filter(o => o.type === "image").length} gambar, {objects.filter(o => o.type !== "image").length} bentuk</span>
              </div>
            </div>

            {/* Layer Elements Preview */}
            <div className="space-y-2 bg-[#EEF4F8] p-3 rounded-2xl border border-[#D5E4F0]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#1F3A5C]">Layer Grafis Aktif</span>
                <span className="text-[9.5px] text-[#2F79A6] font-bold">{objects.length} elemen</span>
              </div>

              {objects.length === 0 ? (
                <div className="py-2 text-center text-[10px] text-[#718BAA] italic">
                  Belum ada artwork/logo. Buka Studio 2D untuk menambah.
                </div>
              ) : (
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {objects.map((obj) => (
                    <div
                      key={obj.id}
                      className="px-2 py-1.5 rounded-lg bg-white border border-[#D5E4F0] flex items-center justify-between text-[10px]"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {obj.type === "image" && obj.imageUrl ? (
                          <img src={obj.imageUrl} alt="" className="w-3.5 h-3.5 rounded-xs object-contain shrink-0 border border-[#D5E4F0]" />
                        ) : (
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: obj.color || "#1F3A5C" }} />
                        )}
                        <span className="font-bold text-[#1F3A5C] truncate max-w-[100px]">{obj.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[8.5px] text-[#718BAA] uppercase font-mono">{obj.surfaceTarget}</span>
                        {obj.type === "image" && (
                          <button
                            type="button"
                            onClick={() => {
                              setReplacingObjectId(obj.id)
                              setShowImageLibraryModal(true)
                            }}
                            className="text-[#718BAA] hover:text-[#2F79A6] p-0.5 transition-colors"
                            title="Ganti Gambar dari Pustaka"
                          >
                            <FolderOpen className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Image Library Attach in 3D Mode */}
              <button
                type="button"
                onClick={() => {
                  setReplacingObjectId(null)
                  setShowImageLibraryModal(true)
                }}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#EEF4F8] border border-[#4394C3]/40 hover:border-[#2F79A6] text-[#1F3A5C] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs mt-2 active:scale-98"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#2F79A6]" />
                <span>Pustaka Gambar &amp; Logo</span>
              </button>
            </div>
          </div>

          {/* Action CTAs in Right Panel */}
          <div className="space-y-2 pt-3 border-t border-[#D5E4F0]">
            {/* Primary Save Button */}
            <button
              onClick={handleSaveProject}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                saveSuccessNotice
                  ? "bg-emerald-600 text-white"
                  : "bg-[#1F3A5C] hover:bg-[#2F79A6] text-white"
              }`}
            >
              {saveSuccessNotice ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Save className="w-4 h-4 text-[#F7CB45]" />}
              <span>{saveSuccessNotice ? "Tersimpan ke Riwayat!" : "Simpan Desain Proyek"}</span>
            </button>

            {/* Export PDF Blueprint */}
            <button
              onClick={handleExportPDF}
              className="w-full py-2.5 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
            >
              <FileText className="w-4 h-4 text-[#F7CB45]" />
              <span>Export Lembar Kerja PDF (.PDF)</span>
            </button>

            {/* Export STL */}
            <button
              onClick={handleDownloadSTL}
              className="w-full py-2 rounded-xl bg-white hover:bg-[#EEF4F8] border border-[#D5E4F0] text-[#1F3A5C] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98"
            >
              <Download className="w-3.5 h-3.5 text-[#2F79A6]" />
              <span>Export File 3D (.STL)</span>
            </button>
          </div>
        </aside>

        {/* Floating Info Pill (Bottom Center) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-white/90 border border-[#D5E4F0] text-[10px] text-[#1F3A5C] backdrop-blur-md shadow-md flex items-center gap-2.5 font-semibold pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-[#4394C3] animate-pulse" />
          <span>Model: <strong className="text-[#1F3A5C] font-extrabold">{selectedTemplate.name}</strong></span>
          <span className="text-[#D5E4F0]">•</span>
          <span>Dimensi: <strong className="text-[#2F79A6] font-mono">{length}×{width}×{height} mm</strong></span>
        </div>

        {/* Floating Save Toast Notification */}
        {saveSuccessNotice && (
          <div className="absolute top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xl border border-emerald-400/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="w-4 h-4 text-[#F7CB45]" />
            <span>Desain berhasil disimpan ke Riwayat!</span>
          </div>
        )}

        {/* Keyboard Shortcuts Dialog Modal */}
        {showShortcutsModal && (
          <div
            className="fixed inset-0 z-50 bg-[#1F3A5C]/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowShortcutsModal(false)}
          >
            <div
              className="bg-white rounded-2xl border border-[#D5E4F0] shadow-2xl max-w-md w-full p-5 space-y-4 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#D5E4F0] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#EEF4F8] flex items-center justify-center text-[#2F79A6]">
                    <Keyboard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#1F3A5C] text-sm">Keyboard Shortcuts</h3>
                    <p className="text-[10px] text-[#718BAA]">Pintasan cepat untuk editing kemasan & stiker</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="p-1 rounded-lg text-[#718BAA] hover:text-[#1F3A5C] hover:bg-[#EEF4F8]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#EEF4F8]/60">
                  <span className="font-medium text-[#1F3A5C]">Simpan Desain Proyek</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">S</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#EEF4F8]/60">
                  <span className="font-medium text-[#1F3A5C]">Toggle Garis Bantu Grid</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">G</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#EEF4F8]/60">
                  <span className="font-medium text-[#1F3A5C]">Undo Perubahan</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">Z</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#EEF4F8]/60">
                  <span className="font-medium text-[#1F3A5C]">Redo Perubahan</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">Y</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#EEF4F8]/60">
                  <span className="font-medium text-[#1F3A5C]">Duplikat Elemen</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">D</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#EEF4F8]/60">
                  <span className="font-medium text-[#1F3A5C]">Ganti Sudut Kamera (Orbit, Depan, dll)</span>
                  <div className="flex gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">1</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">2</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">3</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">4</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">5</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#EEF4F8]/60">
                  <span className="font-medium text-[#1F3A5C]">Tampilkan / Sembunyikan Elemen</span>
                  <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">V</kbd>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#EEF4F8]/60">
                  <span className="font-medium text-[#1F3A5C]">Hapus Elemen Terpilih</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">Delete</kbd>
                    <span className="text-[#718BAA]">/</span>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">Backspace</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#EEF4F8]/60">
                  <span className="font-medium text-[#1F3A5C]">Geser Presisi (Nudge)</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">↑</kbd>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">↓</kbd>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">←</kbd>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">→</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#EEF4F8]/60">
                  <span className="font-medium text-[#1F3A5C]">Geser Cepat (10px)</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">Shift</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">Panah</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#EEF4F8]/60">
                  <span className="font-medium text-[#1F3A5C]">Perbesar / Perkecil Ukuran</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">+</kbd>
                    <span className="text-[#718BAA]">/</span>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">-</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#EEF4F8]/60">
                  <span className="font-medium text-[#1F3A5C]">Putar Searah / Lawan Jam</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">R</kbd>
                    <span className="text-[#718BAA]">/</span>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">Shift+R</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#EEF4F8]/60">
                  <span className="font-medium text-[#1F3A5C]">Transparansi / Opacity Elemen</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">[</kbd>
                    <span className="text-[#718BAA]">/</span>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">]</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#EEF4F8]/60">
                  <span className="font-medium text-[#1F3A5C]">Batal Pilih / Tutup Modal</span>
                  <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">Esc</kbd>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#EEF4F8]/60">
                  <span className="font-medium text-[#1F3A5C]">Buka Bantuan Shortcuts</span>
                  <kbd className="px-2 py-0.5 rounded bg-white border border-[#D5E4F0] text-[10px] font-mono font-bold text-[#1F3A5C] shadow-2xs">?</kbd>
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-[#1F3A5C] text-white font-bold hover:bg-[#2F79A6] transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {renderImageLibraryModal()}
      </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={<PacdoraLoadingScreen message="Memuat Studio 3D Kemasan..." />}>
      <EditorComponent />
    </Suspense>
  )
}
