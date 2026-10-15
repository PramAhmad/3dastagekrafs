"use client"

import React, { useRef, useState, useEffect, useMemo, useCallback } from "react"
import { CanvasObject, DecalType, SurfaceTarget } from "@/components/3d/PackagingCanvas"
import { BRAND_COLORS } from "@/lib/theme"
import { parseSvgDielinePanels, DielinePanelZone } from "@/lib/dielineGenerator"
import { autoFixDielineSvg } from "@/lib/dielineAutoFixer"
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  MousePointer,
  Hand,
  Undo2,
  Redo2,
  Palette,
  Check,
  Upload,
  X,
  Sparkles,
} from "lucide-react"

interface DielineCanvasProps {
  category: "BOX" | "POUCH" | "JAR" | "BOTTLE" | "CAN" | "TRIANGLE" | "CUP" | "PILLOW" | "CLIP" | string
  dielineSvgUrl?: string // Custom vector SVG dieline uploaded by admin
  length: number // mm
  width: number  // mm
  height: number // mm
  boxColor: string
  faceColors?: Record<string, string>
  onUpdateFaceColor?: (faceId: string, color: string) => void
  materialType?: string
  objects: CanvasObject[]
  selectedObjectId: string | null
  onSelectObject: (id: string | null) => void
  onUpdateObject: (id: string, patch: Partial<CanvasObject>) => void
  onAddObjectToFace?: (faceTarget: SurfaceTarget, imageUrl?: string) => void
  zoom: number
  onZoomChange: (newZoom: number) => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
}

interface FaceDef {
  id: string
  name: string
  surfaceTarget: SurfaceTarget
  x: number
  y: number
  w: number
  h: number
  dimLabelW?: string
  dimLabelH?: string
  isMainFace: boolean
  extraPaths?: string[]
}

const PRESET_FACE_COLORS = [
  { name: "Putih", hex: "#ffffff" },
  { name: "Kraft Natural", hex: "#ca9a66" },
  { name: "Cokelat Kardus", hex: "#ba8b57" },
  { name: "Kuning Gold", hex: "#F7CB45" },
  { name: "Biru Brand", hex: "#4394C3" },
  { name: "Navy Premium", hex: "#1F3A5C" },
  { name: "Orange Cerah", hex: "#ea580c" },
  { name: "Pink Pastel", hex: "#f472b6" },
  { name: "Hijau Sage", hex: "#10b981" },
  { name: "Hitam Doff", hex: "#18181b" },
]

export default function DielineCanvas({
  category,
  dielineSvgUrl,
  length,
  width,
  height,
  boxColor,
  faceColors = {},
  onUpdateFaceColor,
  materialType,
  objects,
  selectedObjectId,
  onSelectObject,
  onUpdateObject,
  onAddObjectToFace,
  zoom = 70,
  onZoomChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: DielineCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [activeTool, setActiveTool] = useState<"select" | "pan">("select")
  const [rotationAngle, setRotationAngle] = useState(0)

  // Custom SVG state
  const [svgMeta, setSvgMeta] = useState<{
    width: number
    height: number
    innerSvg: string
    panels?: DielinePanelZone[]
  } | null>(null)

  // Parse custom uploaded SVG dieline when dielineSvgUrl changes
  useEffect(() => {
    if (!dielineSvgUrl) {
      setSvgMeta(null)
      return
    }

    const loadSvg = async () => {
      try {
        let svgText = ""
        if (dielineSvgUrl.startsWith("data:image/svg+xml")) {
          const base64Index = dielineSvgUrl.indexOf(";base64,")
          if (base64Index !== -1) {
            const base64Data = dielineSvgUrl.substring(base64Index + 8)
            svgText = decodeURIComponent(escape(atob(base64Data)))
          } else {
            const urlEncoded = dielineSvgUrl.substring(dielineSvgUrl.indexOf(",") + 1)
            svgText = decodeURIComponent(urlEncoded)
          }
        } else {
          const res = await fetch(dielineSvgUrl)
          if (res.ok) svgText = await res.text()
        }

        if (svgText) {
          const autoFix = autoFixDielineSvg(svgText)
          const parser = new DOMParser()
          const doc = parser.parseFromString(autoFix.fixedSvg, "image/svg+xml")

          // Make sheet background and base color rect transparent so custom boxColor and faceColors show through
          const sheet = doc.querySelector("#layer-sheet, #Sheet-Background")
          if (sheet) {
            sheet.querySelectorAll("rect").forEach((r) => r.setAttribute("fill", "none"))
          }
          const baseColor = doc.querySelector("#base-face-color")
          if (baseColor) {
            baseColor.setAttribute("fill", "none")
          }

          // Auto-clean unneeded drafting texts, registration crosshairs, and technical legends
          doc.querySelectorAll("text, tspan").forEach((t) => t.remove())
          const junkSelectors = [
            "#layer-annotations",
            "#Technical-Annotations",
            "#Legend",
            "#Registration-Marks",
            ".title-label",
            ".dim-label",
            ".txt-title",
            ".txt-meta",
            ".txt-dim",
            ".dim-line",
          ]
          junkSelectors.forEach((sel) => {
            doc.querySelectorAll(sel).forEach((el) => el.remove())
          })
          // Remove 4 corner registration crosshairs
          doc.querySelectorAll("circle").forEach((c) => {
            const r = parseFloat(c.getAttribute("r") || "0")
            if (r <= 3.5 && c.parentElement && c.parentElement.querySelectorAll("line").length >= 2) {
              c.parentElement.remove()
            }
          })

          const svgEl = doc.querySelector("svg")
          if (svgEl) {
            // Extract inner elements (excluding outer <svg>)
            setSvgMeta({
              width: autoFix.totalWidth,
              height: autoFix.totalHeight,
              innerSvg: svgEl.innerHTML,
              panels: autoFix.panels,
            })
          }
        }
      } catch (err) {
        console.error("Failed to parse custom dieline SVG:", err)
      }
    }

    loadSvg()
  }, [dielineSvgUrl])

  // Selected Face & Color Popover state
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>("bottom")
  const [showColorPopover, setShowColorPopover] = useState(false)

  // Transform / Drag state for selected object on 2D dieline
  const [isDraggingObject, setIsDraggingObject] = useState(false)
  const [isTransforming, setIsTransforming] = useState<"scale" | "rotate" | null>(null)
  const [dragStart, setDragStart] = useState({ mouseX: 0, mouseY: 0, objPosX: 0, objPosY: 0, objScale: 1, objRot: 0 })

  const selectedObject = objects.find((o) => o.id === selectedObjectId) || null

  const isCustomSvg = !!svgMeta

  // Raw millimeter dimensions before scaling
  const rawDielineW = useMemo(() => {
    if (svgMeta) return svgMeta.width
    const isBox = category === "BOX" || !category
    const isCylinder = category === "JAR" || category === "BOTTLE" || category === "CAN"
    if (isBox) {
      const flapH = height
      const dustWingW = height * 0.75
      const centerX = dustWingW + flapH + 20
      return centerX + length + flapH + dustWingW + 40
    }
    if (isCylinder) {
      const radiusMm = (length || 65) / 2
      const circumference = Math.round(2 * Math.PI * radiusMm)
      return 15 + circumference + 15 + 40
    }
    return (length || 100) + 40
  }, [svgMeta, category, length, height])

  const rawDielineH = useMemo(() => {
    if (svgMeta) return svgMeta.height
    const isBox = category === "BOX" || !category
    const isCylinder = category === "JAR" || category === "BOTTLE" || category === "CAN"
    if (isBox) {
      const flapH = height
      const tuckH = Math.min(25, height * 0.7)
      const topOffset = flapH * 2 + 15
      const baseY = topOffset + flapH
      const lidY = baseY + width + flapH
      const tuckY = lidY + width
      return tuckY + tuckH + 40
    }
    if (isCylinder) {
      return (height || 98) + 60
    }
    return (height || 100) + 40
  }, [svgMeta, category, width, height])

  // Responsive base scale so any packaging dieline (custom SVG or procedural) fits cleanly at 100% zoom (~520px target)
  const basePxPerMm = useMemo(() => {
    const maxDim = Math.max(rawDielineW, rawDielineH, 50)
    const ideal = 520 / maxDim
    return Math.max(0.5, Math.min(3.0, ideal))
  }, [rawDielineW, rawDielineH])

  const activeScale = useMemo(() => {
    return basePxPerMm * (zoom / 100)
  }, [basePxPerMm, zoom])

  const scaleMmToPx = activeScale

  // --------------------------------------------------------------------------
  // PACDORA-STYLE REVERSE SVG & PACKAGING DIELINE GENERATION
  // If SVG dieline exists, canvas prioritizes & aligns to the SVG vector dimensions
  // --------------------------------------------------------------------------
  const dieline = useMemo(() => {
    // 0. CUSTOM UPLOADED VECTOR SVG DIELINE (Pacdora Reverse-Engineered System)
    if (svgMeta) {
      const svgW = svgMeta.width
      const svgH = svgMeta.height

      let faces: FaceDef[] = []
      if (svgMeta.panels && svgMeta.panels.length > 0) {
        faces = svgMeta.panels.map((p) => ({
          id: p.face,
          name: p.label || p.face.toUpperCase(),
          surfaceTarget: p.face as SurfaceTarget,
          x: p.x,
          y: p.y,
          w: p.width,
          h: p.height,
          dimLabelW: `${Math.round(p.width)} mm`,
          dimLabelH: `${Math.round(p.height)} mm`,
          isMainFace: true,
        }))
      } else {
        // Fallback: Construct default front/back regions matching coordinate grid
        const mainFaceW = svgW * 0.4
        const mainFaceH = svgH * 0.4
        const centerX = (svgW - mainFaceW) / 2
        const centerY = (svgH - mainFaceH) / 2

        faces = [
          {
            id: "front",
            name: "Muka Depan (Front Panel)",
            surfaceTarget: "front",
            x: centerX,
            y: centerY,
            w: mainFaceW,
            h: mainFaceH,
            dimLabelW: `${Math.round(mainFaceW)} mm`,
            dimLabelH: `${Math.round(mainFaceH)} mm`,
            isMainFace: true,
          },
          {
            id: "back",
            name: "Muka Belakang (Back Panel)",
            surfaceTarget: "back",
            x: centerX,
            y: centerY,
            w: mainFaceW,
            h: mainFaceH,
            dimLabelW: `${Math.round(mainFaceW)} mm`,
            dimLabelH: `${Math.round(mainFaceH)} mm`,
            isMainFace: true,
          },
        ]
      }

      const faceMap: Record<string, FaceDef> = {}
      faces.forEach((f) => {
        faceMap[f.id] = f
        faceMap[f.surfaceTarget] = f
      })
      if (!faceMap.front && faces[0]) faceMap.front = faces[0]

      return {
        faces,
        lockSlots: [],
        totalW: svgW,
        totalH: svgH,
        isCustomSvg: true,
        faceMap,
      }
    }

    const isBox = category === "BOX" || !category
    const isCylinder = category === "JAR" || category === "BOTTLE" || category === "CAN"
    const isPouch = category === "POUCH"

    // 1. PACDORA OPEN MAILER BOX (FEFCO 0427 / Roll End Tuck Top)
    // Structure:
    // Center: Bottom Base (L x W)
    // Top: Front Wall (L x H) + Inside Locking Rollover Flap (L x H)
    // Bottom: Back Wall (L x H) + Top Lid (L x W) with Side Dust Wings + Front Tuck Tab
    // Left: Left Double Wall (W x H) + Roll-in Side Flap
    // Right: Right Double Wall (W x H) + Roll-in Side Flap
    if (isBox) {
      const flapH = height
      const tuckH = Math.min(25, height * 0.7)
      const dustWingW = height * 0.75

      // Positions in mm
      const centerX = dustWingW + flapH + 20
      const topOffset = flapH * 2 + 15
      const baseY = topOffset + flapH
      const lidY = baseY + width + flapH
      const tuckY = lidY + width

      const totalW = centerX + length + flapH + dustWingW + 40
      const totalH = tuckY + tuckH + 40

      // Sub-paths attached to respective faces (in mm)
      // Front Rollover Flap (above front wall) -> belongs to 'front'
      const frontRolloverPath = `M ${centerX * scaleMmToPx},${topOffset * scaleMmToPx} L ${(centerX + 4) * scaleMmToPx},${(topOffset - flapH + 6) * scaleMmToPx} Q ${(centerX + 8) * scaleMmToPx},${(topOffset - flapH) * scaleMmToPx} ${(centerX + 16) * scaleMmToPx},${(topOffset - flapH) * scaleMmToPx} L ${(centerX + length - 16) * scaleMmToPx},${(topOffset - flapH) * scaleMmToPx} Q ${(centerX + length - 8) * scaleMmToPx},${(topOffset - flapH) * scaleMmToPx} ${(centerX + length - 4) * scaleMmToPx},${(topOffset - flapH + 6) * scaleMmToPx} L ${(centerX + length) * scaleMmToPx},${topOffset * scaleMmToPx} Z`

      // Left Double Wall Outer Flap -> belongs to 'left'
      const leftOuterFlapPath = `M ${(centerX - flapH) * scaleMmToPx},${baseY * scaleMmToPx} L ${(centerX - flapH * 2 + 4) * scaleMmToPx},${(baseY + 4) * scaleMmToPx} L ${(centerX - flapH * 2 + 4) * scaleMmToPx},${(baseY + width - 4) * scaleMmToPx} L ${(centerX - flapH) * scaleMmToPx},${(baseY + width) * scaleMmToPx} Z`

      // Right Double Wall Outer Flap -> belongs to 'right'
      const rightOuterFlapPath = `M ${(centerX + length + flapH) * scaleMmToPx},${baseY * scaleMmToPx} L ${(centerX + length + flapH * 2 - 4) * scaleMmToPx},${(baseY + 4) * scaleMmToPx} L ${(centerX + length + flapH * 2 - 4) * scaleMmToPx},${(baseY + width - 4) * scaleMmToPx} L ${(centerX + length + flapH) * scaleMmToPx},${(baseY + width) * scaleMmToPx} Z`

      // Top Lid Left & Right Curved Dust Wings & Front Tuck Tab -> belong to 'top'
      const lidLeftWingPath = `M ${centerX * scaleMmToPx},${lidY * scaleMmToPx} L ${(centerX - dustWingW + 8) * scaleMmToPx},${(lidY + 8) * scaleMmToPx} Q ${(centerX - dustWingW) * scaleMmToPx},${(lidY + width / 2) * scaleMmToPx} ${(centerX - dustWingW + 8) * scaleMmToPx},${(lidY + width - 8) * scaleMmToPx} L ${centerX * scaleMmToPx},${(lidY + width) * scaleMmToPx} Z`
      const lidRightWingPath = `M ${(centerX + length) * scaleMmToPx},${lidY * scaleMmToPx} L ${(centerX + length + dustWingW - 8) * scaleMmToPx},${(lidY + 8) * scaleMmToPx} Q ${(centerX + length + dustWingW) * scaleMmToPx},${(lidY + width / 2) * scaleMmToPx} ${(centerX + length + dustWingW - 8) * scaleMmToPx},${(lidY + width - 8) * scaleMmToPx} L ${(centerX + length) * scaleMmToPx},${(lidY + width) * scaleMmToPx} Z`
      const tuckTabPath = `M ${centerX * scaleMmToPx},${tuckY * scaleMmToPx} L ${(centerX + 4) * scaleMmToPx},${(tuckY + tuckH - 6) * scaleMmToPx} Q ${(centerX + 8) * scaleMmToPx},${(tuckY + tuckH) * scaleMmToPx} ${(centerX + 18) * scaleMmToPx},${(tuckY + tuckH) * scaleMmToPx} L ${(centerX + length - 18) * scaleMmToPx},${(tuckY + tuckH) * scaleMmToPx} Q ${(centerX + length - 8) * scaleMmToPx},${(tuckY + tuckH) * scaleMmToPx} ${(centerX + length - 4) * scaleMmToPx},${(tuckY + tuckH - 6) * scaleMmToPx} L ${(centerX + length) * scaleMmToPx},${tuckY * scaleMmToPx} Z`

      // Face definitions - each face has its main rectangle + attached flaps
      const faces: FaceDef[] = [
        // 1. Center Bottom Base (Base / Dasar Kotak)
        {
          id: "bottom",
          name: "Dasar Kotak (Base)",
          surfaceTarget: "bottom" as SurfaceTarget,
          x: centerX,
          y: baseY,
          w: length,
          h: width,
          dimLabelW: `${length} mm`,
          dimLabelH: `${width} mm`,
          isMainFace: true,
        },
        // 2. Front Wall + Rollover Flap
        {
          id: "front",
          name: "Muka Depan (Front)",
          surfaceTarget: "front",
          x: centerX,
          y: topOffset,
          w: length,
          h: flapH,
          dimLabelW: `${length} mm`,
          dimLabelH: `${height} mm`,
          isMainFace: true,
          extraPaths: [frontRolloverPath],
        },
        // 3. Back Wall
        {
          id: "back",
          name: "Muka Belakang (Back)",
          surfaceTarget: "back",
          x: centerX,
          y: baseY + width,
          w: length,
          h: flapH,
          dimLabelW: `${length} mm`,
          dimLabelH: `${height} mm`,
          isMainFace: true,
        },
        // 4. Top Lid + Dust Wings + Tuck Tab
        {
          id: "top",
          name: "Tutup Atas (Top Lid)",
          surfaceTarget: "top",
          x: centerX,
          y: lidY,
          w: length,
          h: width,
          dimLabelW: `${length} mm`,
          dimLabelH: `${width} mm`,
          isMainFace: true,
          extraPaths: [lidLeftWingPath, lidRightWingPath, tuckTabPath],
        },
        // 5. Left Wall + Outer Flap
        {
          id: "left",
          name: "Sisi Kiri (Left)",
          surfaceTarget: "left",
          x: centerX - flapH,
          y: baseY,
          w: flapH,
          h: width,
          dimLabelW: `${height} mm`,
          dimLabelH: `${width} mm`,
          isMainFace: true,
          extraPaths: [leftOuterFlapPath],
        },
        // 6. Right Wall + Outer Flap
        {
          id: "right",
          name: "Sisi Kanan (Right)",
          surfaceTarget: "right",
          x: centerX + length,
          y: baseY,
          w: flapH,
          h: width,
          dimLabelW: `${height} mm`,
          dimLabelH: `${width} mm`,
          isMainFace: true,
          extraPaths: [rightOuterFlapPath],
        },
      ]

      // Locking slots (white pill cutouts on side fold crease)
      const lockSlots = [
        { x: centerX, y: baseY + 10, w: 2.5, h: 12 },
        { x: centerX, y: baseY + width - 22, w: 2.5, h: 12 },
        { x: centerX + length - 2.5, y: baseY + 10, w: 2.5, h: 12 },
        { x: centerX + length - 2.5, y: baseY + width - 22, w: 2.5, h: 12 },
      ]

      return {
        faces,
        lockSlots,
        totalW,
        totalH,
        faceMap: {
          bottom: faces[0],
          front: faces[1],
          back: faces[2],
          top: faces[3],
          left: faces[4],
          right: faces[5],
        } as Record<string, FaceDef>,
      }
    }

    // 2. CYLINDRICAL UNWRAPPED LABEL (JAR / BOTTLE / CAN)
    if (isCylinder) {
      const radius = width / 2 || 25
      const circumference = Math.round(2 * Math.PI * radius)
      const glueOverlap = 12
      const quadW = circumference / 4
      const capRadius = radius
      const capMargin = 15
      const totalW = circumference + glueOverlap + 30
      const totalH = height + capRadius * 2 + capMargin + 30
      const mainY = capRadius * 2 + capMargin

      const glueLapPath = `M ${(15 + circumference) * scaleMmToPx},${mainY * scaleMmToPx} L ${(15 + circumference + glueOverlap) * scaleMmToPx},${(mainY + 4) * scaleMmToPx} L ${(15 + circumference + glueOverlap) * scaleMmToPx},${(mainY + height - 4) * scaleMmToPx} L ${(15 + circumference) * scaleMmToPx},${(mainY + height) * scaleMmToPx} Z`

      const faces: FaceDef[] = [
        {
          id: "front",
          name: "Muka Depan (Front)",
          surfaceTarget: "front",
          x: 15,
          y: mainY,
          w: quadW,
          h: height,
          dimLabelW: `${Math.round(quadW)} mm`,
          dimLabelH: `${height} mm`,
          isMainFace: true,
        },
        {
          id: "right",
          name: "Sisi Kanan (Right)",
          surfaceTarget: "right",
          x: 15 + quadW,
          y: mainY,
          w: quadW,
          h: height,
          dimLabelW: `${Math.round(quadW)} mm`,
          dimLabelH: `${height} mm`,
          isMainFace: true,
        },
        {
          id: "back",
          name: "Muka Belakang (Back)",
          surfaceTarget: "back",
          x: 15 + quadW * 2,
          y: mainY,
          w: quadW,
          h: height,
          dimLabelW: `${Math.round(quadW)} mm`,
          dimLabelH: `${height} mm`,
          isMainFace: true,
        },
        {
          id: "left",
          name: "Sisi Kiri (Left)",
          surfaceTarget: "left",
          x: 15 + quadW * 3,
          y: mainY,
          w: quadW,
          h: height,
          dimLabelW: `${Math.round(quadW)} mm`,
          dimLabelH: `${height} mm`,
          isMainFace: true,
          extraPaths: [glueLapPath],
        },
        {
          id: "top",
          name: "Tutup Atas (Cap)",
          surfaceTarget: "top",
          x: 15 + quadW - capRadius,
          y: 10,
          w: capRadius * 2,
          h: capRadius * 2,
          dimLabelW: `Ø${Math.round(radius * 2)} mm`,
          dimLabelH: `Ø${Math.round(radius * 2)} mm`,
          isMainFace: true,
        },
      ]

      return {
        faces,
        lockSlots: [],
        totalW,
        totalH,
        faceMap: {
          front: faces[0],
          right: faces[1],
          back: faces[2],
          left: faces[3],
          top: faces[4],
          bottom: faces[0],
        } as Record<string, FaceDef>,
      }
    }

    // 3. STANDING POUCH
    const pouchW = length
    const pouchH = height
    const gussetH = width * 0.75
    const totalW = pouchW * 2 + 40
    const totalH = pouchH + gussetH + 30

    const faces: FaceDef[] = [
      {
        id: "front",
        name: "Muka Depan (Front)",
        surfaceTarget: "front",
        x: 15,
        y: 10,
        w: pouchW,
        h: pouchH,
        dimLabelW: `${pouchW} mm`,
        dimLabelH: `${pouchH} mm`,
        isMainFace: true,
      },
      {
        id: "back",
        name: "Muka Belakang (Back)",
        surfaceTarget: "back",
        x: 25 + pouchW,
        y: 10,
        w: pouchW,
        h: pouchH,
        dimLabelW: `${pouchW} mm`,
        dimLabelH: `${pouchH} mm`,
        isMainFace: true,
      },
      {
        id: "bottom",
        name: "Lipatan Bawah (Gusset)",
        surfaceTarget: "bottom" as SurfaceTarget,
        x: 15,
        y: pouchH + 18,
        w: pouchW,
        h: gussetH,
        dimLabelW: `${pouchW} mm`,
        dimLabelH: `${Math.round(gussetH)} mm`,
        isMainFace: false,
      },
    ]

    return {
      faces,
      lockSlots: [],
      totalW,
      totalH,
      faceMap: {
        front: faces[0],
        back: faces[1],
        right: faces[0],
        left: faces[1],
        top: faces[0],
        bottom: faces[2],
      } as Record<string, FaceDef>,
    }
  }, [svgMeta, category, length, width, height, scaleMmToPx])

  // Get color fill for a specific face (custom face color or general boxColor)
  const getFaceFill = useCallback(
    (faceId: string) => {
      const customColor = faceColors[faceId]
      if (customColor) return customColor

      if (materialType === "corrugated") return "url(#corrugatedPattern)"
      if (materialType === "kraft") return "url(#kraftPattern)"
      if (materialType === "gold_foil") return "url(#goldGradient)"
      if (materialType === "silver_foil") return "url(#silverGradient)"
      return boxColor
    },
    [faceColors, materialType, boxColor]
  )

  // Auto Center & Fit on Initial Mount or Dimensions / Zoom change
  const centerDieline = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const renderedW = dieline.totalW * activeScale
      const renderedH = dieline.totalH * activeScale
      setPan({
        x: Math.round((rect.width - renderedW) / 2),
        y: Math.round(Math.max(20, (rect.height - renderedH) / 2)),
      })
    }
  }, [dieline.totalW, dieline.totalH, activeScale])

  useEffect(() => {
    centerDieline()
  }, [centerDieline])

  // Pan Canvas handlers
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (activeTool === "pan" || e.button === 1 || (e.button === 0 && (e.target as HTMLElement).tagName === "svg")) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
      return
    }

    if (isDraggingObject && selectedObject) {
      const deltaScreenX = e.clientX - dragStart.mouseX
      const deltaScreenY = e.clientY - dragStart.mouseY
      const deltaMmX = deltaScreenX / activeScale
      const deltaMmY = -deltaScreenY / activeScale

      onUpdateObject(selectedObject.id, {
        posX: Math.round(dragStart.objPosX + deltaMmX),
        posY: Math.round(dragStart.objPosY + deltaMmY),
      })
    } else if (isTransforming === "scale" && selectedObject) {
      const deltaScreenX = e.clientX - dragStart.mouseX
      const scaleDelta = (deltaScreenX / activeScale) / (selectedObject.widthMm || 18)
      const newScale = Math.max(0.2, Math.min(3.0, dragStart.objScale + scaleDelta))
      onUpdateObject(selectedObject.id, { scale: Math.round(newScale * 100) / 100 })
    } else if (isTransforming === "rotate" && selectedObject) {
      const deltaScreenX = e.clientX - dragStart.mouseX
      const newRot = Math.round((dragStart.objRot + deltaScreenX * 1.2) % 360)
      onUpdateObject(selectedObject.id, { rotation: newRot < 0 ? newRot + 360 : newRot })
    }
  }

  const handleMouseUpCanvas = () => {
    setIsPanning(false)
    setIsDraggingObject(false)
    setIsTransforming(null)
  }

  // Object drag start
  const handleMouseDownObject = (e: React.MouseEvent, obj: CanvasObject) => {
    e.stopPropagation()
    onSelectObject(obj.id)
    setSelectedFaceId(obj.surfaceTarget)
    setIsDraggingObject(true)
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      objPosX: obj.posX,
      objPosY: obj.posY,
      objScale: obj.scale || 1.0,
      objRot: obj.rotation || 0,
    })
  }

  // Calculate pixel position of an object on 2D dieline
  const getObject2DPosition = useCallback(
    (obj: CanvasObject) => {
      const targetFace =
        dieline.faceMap[obj.surfaceTarget] ||
        dieline.faceMap.front ||
        dieline.faces[0]

      const faceCenterMmX = targetFace ? targetFace.x + targetFace.w / 2 : dieline.totalW / 2
      const faceCenterMmY = targetFace ? targetFace.y + targetFace.h / 2 : dieline.totalH / 2

      const objMmX = faceCenterMmX + (obj.posX || 0)
      const objMmY = faceCenterMmY - (obj.posY || 0)

      const x = objMmX * activeScale
      const y = objMmY * activeScale

      // Ensure objects have an aesthetically pleasing visible dimension
      const faceMinDim = targetFace ? Math.min(targetFace.w, targetFace.h) : 60
      const defaultSizeMm = isCustomSvg ? Math.max(30, Math.min(faceMinDim * 0.45, 70)) : 22
      const wMm = obj.widthMm || defaultSizeMm
      const hMm = obj.heightMm || defaultSizeMm

      const w = wMm * (obj.scale || 1.0) * activeScale
      const h = hMm * (obj.scale || 1.0) * activeScale

      return { x, y, w, h }
    },
    [dieline.faceMap, dieline.faces, dieline.totalW, dieline.totalH, activeScale, isCustomSvg]
  )

  const activeFace = dieline.faces.find((f) => f.id === selectedFaceId) || dieline.faces[0]

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDownCanvas}
      onMouseMove={handleMouseMoveCanvas}
      onMouseUp={handleMouseUpCanvas}
      className={`relative w-full h-full bg-[#f8fafc] select-none overflow-hidden ${
        activeTool === "pan" || isPanning ? "cursor-grab active:cursor-grabbing" : "cursor-default"
      }`}
    >
      {/* Background Subtle Dot Grid */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
          backgroundSize: `20px 20px`,
        }}
      />

      {/* SVG Dieline Canvas */}
      <svg
        className="absolute inset-0 w-full h-full overflow-visible"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotationAngle}deg)`,
          transformOrigin: `${(dieline.totalW * activeScale) / 2}px ${(dieline.totalH * activeScale) / 2}px`,
        }}
      >
        <defs>
          {/* Real Corrugated Cardboard Pattern with flutes */}
          <pattern id="corrugatedPattern" width="24" height="24" patternUnits="userSpaceOnUse">
            <rect width="24" height="24" fill={boxColor} />
            <rect x="0" y="0" width="10" height="24" fill="rgba(35, 18, 5, 0.08)" />
            <rect x="10" y="0" width="14" height="24" fill="rgba(255, 250, 240, 0.09)" />
            <line x1="0" y1="0" x2="0" y2="24" stroke="rgba(30, 15, 5, 0.07)" strokeWidth="1.5" />
            <line x1="3" y1="4" x2="8" y2="6" stroke="rgba(40, 20, 8, 0.12)" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="14" y1="15" x2="19" y2="13" stroke="rgba(40, 20, 8, 0.10)" strokeWidth="0.7" strokeLinecap="round" />
            <line x1="7" y1="18" x2="11" y2="22" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.8" strokeLinecap="round" />
          </pattern>

          {/* Real Natural Kraft Paper Pattern */}
          <pattern id="kraftPattern" width="36" height="36" patternUnits="userSpaceOnUse">
            <rect width="36" height="36" fill={boxColor} />
            <line x1="4" y1="8" x2="12" y2="10" stroke="rgba(50, 25, 10, 0.12)" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="20" y1="26" x2="28" y2="24" stroke="rgba(50, 25, 10, 0.10)" strokeWidth="0.7" strokeLinecap="round" />
            <circle cx="8" cy="18" r="0.9" fill="rgba(40, 20, 8, 0.14)" />
            <circle cx="26" cy="12" r="1.1" fill="rgba(40, 20, 8, 0.10)" />
          </pattern>

          {/* Foil Gradients */}
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="35%" stopColor="#fff2a8" />
            <stop offset="70%" stopColor="#c59339" />
            <stop offset="100%" stopColor="#d4af37" />
          </linearGradient>
          <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="40%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          {/* Dimension Arrow Marker */}
          <marker id="arrowStart" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M 5,1 L 1,3 L 5,5 Z" fill="#2563eb" />
          </marker>
          <marker id="arrowEnd" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M 1,1 L 5,3 L 1,5 Z" fill="#2563eb" />
          </marker>

          {/* Soft Shadow for Cardboard Dieline */}
          <filter id="cardboardShadow" x="-2%" y="-2%" width="104%" height="104%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.08" />
          </filter>
        </defs>

        <g filter="url(#cardboardShadow)">
          {/* 1. CUSTOM UPLOADED VECTOR SVG DIELINE (PACDORA REVERSE SYSTEM) */}
          {svgMeta && (
            <>
              {/* Base packaging sheet background colored with boxColor */}
              <rect
                x={0}
                y={0}
                width={dieline.totalW * activeScale}
                height={dieline.totalH * activeScale}
                fill={boxColor}
                rx={4}
              />

              {/* Interactive Face Panels underneath custom vector paths */}
              {dieline.faces.map((face) => {
                const isSelected = selectedFaceId === face.id
                const faceFill = getFaceFill(face.id)
                return (
                  <g
                    key={`custom_panel_${face.id}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFaceId(face.id)
                      setShowColorPopover(false)
                    }}
                    className="cursor-pointer group"
                  >
                    <rect
                      x={face.x * activeScale}
                      y={face.y * activeScale}
                      width={face.w * activeScale}
                      height={face.h * activeScale}
                      fill={faceFill}
                      fillOpacity={1.0}
                      stroke={isSelected ? "#2563eb" : "rgba(37,99,235,0.3)"}
                      strokeWidth={isSelected ? 2.5 : 1}
                      strokeDasharray={isSelected ? undefined : "3,2"}
                    />
                    <text
                      x={(face.x + face.w / 2) * activeScale}
                      y={(face.y + face.h / 2) * activeScale + 3}
                      textAnchor="middle"
                      className="fill-slate-600 font-mono text-[9.5px] font-bold pointer-events-none select-none opacity-80"
                    >
                      {face.name}
                    </text>
                  </g>
                )
              })}

              <g
                id="pacdora-reverse-svg-layer"
                transform={`scale(${activeScale})`}
                dangerouslySetInnerHTML={{ __html: svgMeta.innerSvg }}
              />
            </>
          )}

          {/* Render All Interactive Faces and Their Connected Flaps (Only if NOT custom SVG or as interactive overlay) */}
          {!svgMeta && dieline.faces.map((face) => {
            const isSelected = selectedFaceId === face.id
            const faceFill = getFaceFill(face.id)

            return (
              <g
                key={face.id}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedFaceId(face.id)
                  setShowColorPopover(false)
                }}
                className="cursor-pointer group"
              >
                {/* Extra connected flaps (wings, rollovers, tabs) belonging to this face */}
                {face.extraPaths?.map((extraP, idx) => (
                  <path
                    key={`extra_${face.id}_${idx}`}
                    d={extraP}
                    fill={faceFill}
                    stroke="#78350f"
                    strokeWidth="1.2"
                    strokeOpacity="0.5"
                    className="transition-colors group-hover:brightness-98"
                  />
                ))}

                {/* Main Face Rectangle */}
                <rect
                  x={face.x * scaleMmToPx}
                  y={face.y * scaleMmToPx}
                  width={face.w * scaleMmToPx}
                  height={face.h * scaleMmToPx}
                  fill={faceFill}
                  stroke="#78350f"
                  strokeWidth="1.2"
                  strokeOpacity="0.5"
                  className="transition-colors group-hover:brightness-98"
                />

                {/* Subtle dashed crease lines on fold boundaries */}
                <line
                  x1={face.x * scaleMmToPx}
                  y1={face.y * scaleMmToPx}
                  x2={(face.x + face.w) * scaleMmToPx}
                  y2={face.y * scaleMmToPx}
                  stroke="#78350f"
                  strokeWidth="1"
                  strokeDasharray="4,3"
                  strokeOpacity="0.4"
                />
                <line
                  x1={face.x * scaleMmToPx}
                  y1={(face.y + face.h) * scaleMmToPx}
                  x2={(face.x + face.w) * scaleMmToPx}
                  y2={(face.y + face.h) * scaleMmToPx}
                  stroke="#78350f"
                  strokeWidth="1"
                  strokeDasharray="4,3"
                  strokeOpacity="0.4"
                />

                {/* Selected Face Pacdora Blue Active Outline & Dimension Callouts */}
                {isSelected && (
                  <g className="pointer-events-none">
                    {/* Active Blue Selection Outline */}
                    <rect
                      x={face.x * scaleMmToPx}
                      y={face.y * scaleMmToPx}
                      width={face.w * scaleMmToPx}
                      height={face.h * scaleMmToPx}
                      fill="rgba(37, 99, 235, 0.04)"
                      stroke="#2563eb"
                      strokeWidth="2"
                    />

                    {/* Corner Grips (White squares with blue border) */}
                    <rect x={face.x * scaleMmToPx - 3} y={face.y * scaleMmToPx - 3} width="6" height="6" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />
                    <rect x={(face.x + face.w) * scaleMmToPx - 3} y={face.y * scaleMmToPx - 3} width="6" height="6" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />
                    <rect x={face.x * scaleMmToPx - 3} y={(face.y + face.h) * scaleMmToPx - 3} width="6" height="6" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />
                    <rect x={(face.x + face.w) * scaleMmToPx - 3} y={(face.y + face.h) * scaleMmToPx - 3} width="6" height="6" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />

                    {/* Midpoint Notch Grips */}
                    <rect x={(face.x + face.w / 2) * scaleMmToPx - 2} y={face.y * scaleMmToPx - 4} width="4" height="8" rx="1" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />
                    <rect x={(face.x + face.w / 2) * scaleMmToPx - 2} y={(face.y + face.h) * scaleMmToPx - 4} width="4" height="8" rx="1" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />
                    <rect x={face.x * scaleMmToPx - 4} y={(face.y + face.h / 2) * scaleMmToPx - 2} width="8" height="4" rx="1" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />
                    <rect x={(face.x + face.w) * scaleMmToPx - 4} y={(face.y + face.h / 2) * scaleMmToPx - 2} width="8" height="4" rx="1" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />

                    {/* Dimension Line 1: Horizontal Width Arrow */}
                    <g className="font-sans text-[10px] font-semibold fill-blue-600">
                      <line
                        x1={(face.x + 12) * scaleMmToPx}
                        y1={(face.y + 16) * scaleMmToPx}
                        x2={(face.x + face.w - 12) * scaleMmToPx}
                        y2={(face.y + 16) * scaleMmToPx}
                        stroke="#2563eb"
                        strokeWidth="1.2"
                        markerStart="url(#arrowStart)"
                        markerEnd="url(#arrowEnd)"
                      />
                      <rect
                        x={(face.x + face.w / 2) * scaleMmToPx - 28}
                        y={(face.y + 16) * scaleMmToPx - 8}
                        width="56"
                        height="16"
                        fill="rgba(255,255,255,0.85)"
                        rx="4"
                      />
                      <text
                        x={(face.x + face.w / 2) * scaleMmToPx}
                        y={(face.y + 16) * scaleMmToPx + 3}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[9.5px] font-mono font-bold fill-blue-600"
                      >
                        {face.dimLabelW}
                      </text>
                    </g>

                    {/* Dimension Line 2: Vertical Height Arrow */}
                    <g className="font-sans text-[10px] font-semibold fill-blue-600">
                      <line
                        x1={(face.x + 16) * scaleMmToPx}
                        y1={(face.y + 24) * scaleMmToPx}
                        x2={(face.x + 16) * scaleMmToPx}
                        y2={(face.y + face.h - 16) * scaleMmToPx}
                        stroke="#2563eb"
                        strokeWidth="1.2"
                        markerStart="url(#arrowStart)"
                        markerEnd="url(#arrowEnd)"
                      />
                      <rect
                        x={(face.x + 16) * scaleMmToPx - 24}
                        y={(face.y + face.h / 2) * scaleMmToPx - 8}
                        width="48"
                        height="16"
                        fill="rgba(255,255,255,0.85)"
                        rx="4"
                      />
                      <text
                        x={(face.x + 16) * scaleMmToPx}
                        y={(face.y + face.h / 2) * scaleMmToPx + 3}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[9.5px] font-mono font-bold fill-blue-600"
                      >
                        {face.dimLabelH}
                      </text>
                    </g>
                  </g>
                )}
              </g>
            )
          })}

          {/* Locking Slots (Cutout slots) */}
          {dieline.lockSlots.map((slot, idx) => (
            <rect
              key={`slot_${idx}`}
              x={slot.x * scaleMmToPx}
              y={slot.y * scaleMmToPx}
              width={slot.w * scaleMmToPx}
              height={slot.h * scaleMmToPx}
              rx="1.5"
              fill="#ffffff"
              stroke="#78350f"
              strokeWidth="1"
            />
          ))}

          {/* Render User Graphic Objects / Stickers */}
          {objects.map((obj) => {
            const pos = getObject2DPosition(obj)
            const isSel = obj.id === selectedObjectId

            return (
              <g
                key={obj.id}
                onMouseDown={(e) => handleMouseDownObject(e, obj)}
                className="cursor-move"
                opacity={obj.visible ? (obj.opacity ?? 1.0) : 0}
                transform={`translate(${pos.x}, ${pos.y}) rotate(${obj.rotation || 0})`}
              >
                {/* Object Shape / Image */}
                {obj.type === "image" && obj.imageUrl ? (
                  <image
                    href={obj.imageUrl}
                    xlinkHref={obj.imageUrl}
                    x={-pos.w / 2}
                    y={-pos.h / 2}
                    width={pos.w}
                    height={pos.h}
                    preserveAspectRatio="none"
                  />
                ) : obj.type === "circle" ? (
                  <circle cx="0" cy="0" r={pos.w / 2} fill={obj.color} />
                ) : obj.type === "square" ? (
                  <rect x={-pos.w / 2} y={-pos.h / 2} width={pos.w} height={pos.h} rx="6" fill={obj.color} />
                ) : obj.type === "triangle" ? (
                  <polygon
                    points={`0,${-pos.h / 2} ${pos.w / 2},${pos.h / 2} ${-pos.w / 2},${pos.h / 2}`}
                    fill={obj.color}
                  />
                ) : obj.type === "star" ? (
                  <polygon
                    points={`0,${-pos.h / 2} ${pos.w * 0.15},${-pos.h * 0.15} ${pos.w / 2},${-pos.h * 0.15} ${pos.w * 0.22},${pos.h * 0.1} ${pos.w * 0.35},${pos.h / 2} 0,${pos.h * 0.25} ${-pos.w * 0.35},${pos.h / 2} ${-pos.w * 0.22},${pos.h * 0.1} ${-pos.w / 2},${-pos.h * 0.15} ${-pos.w * 0.15},${-pos.h * 0.15}`}
                    fill={obj.color}
                  />
                ) : (
                  <g>
                    <circle cx="0" cy="0" r={pos.w / 2} fill={obj.color} stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4,2" />
                    <text
                      x="0"
                      y="1"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#FFFFFF"
                      className="text-[9px] font-bold font-sans select-none pointer-events-none"
                    >
                      ★ LABEL
                    </text>
                  </g>
                )}

                {/* Active Object Bounding Box & Transformation Handles */}
                {isSel && (
                  <g>
                    <rect
                      x={-pos.w / 2 - 4}
                      y={-pos.h / 2 - 4}
                      width={pos.w + 8}
                      height={pos.h + 8}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="1.8"
                      strokeDasharray="4,3"
                    />

                    {/* Scale corner handle */}
                    <circle
                      cx={pos.w / 2 + 4}
                      cy={pos.h / 2 + 4}
                      r="5"
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth="2"
                      className="cursor-nwse-resize shadow-sm"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        setIsTransforming("scale")
                        setDragStart({
                          mouseX: e.clientX,
                          mouseY: e.clientY,
                          objPosX: obj.posX,
                          objPosY: obj.posY,
                          objScale: obj.scale || 1.0,
                          objRot: obj.rotation || 0,
                        })
                      }}
                    />

                    {/* Rotate handle on top */}
                    <line x1="0" y1={-pos.h / 2 - 4} x2="0" y2={-pos.h / 2 - 18} stroke="#2563eb" strokeWidth="1.8" />
                    <circle
                      cx="0"
                      cy={-pos.h / 2 - 18}
                      r="5"
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-pointer shadow-sm"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        setIsTransforming("rotate")
                        setDragStart({
                          mouseX: e.clientX,
                          mouseY: e.clientY,
                          objPosX: obj.posX,
                          objPosY: obj.posY,
                          objScale: obj.scale || 1.0,
                          objRot: obj.rotation || 0,
                        })
                      }}
                    />
                  </g>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* ------------------------------------------------------------- */}
      {/* FLOATING PACDORA "[ 🌈 Face color ]" POPOVER BUTTON (ABOVE FACE) */}
      {/* ------------------------------------------------------------- */}
      {activeFace && (
        <div
          className="absolute z-30 pointer-events-auto transition-all"
          style={{
            left: `${pan.x + (activeFace.x + activeFace.w / 2) * scaleMmToPx}px`,
            top: `${pan.y + activeFace.y * scaleMmToPx - 38}px`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="relative">
            <button
              onClick={() => setShowColorPopover(!showColorPopover)}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center gap-1.5 text-xs font-semibold transition-all hover:scale-105"
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-neutral-300 shadow-xs"
                style={{
                  background:
                    faceColors[activeFace.id] ||
                    (materialType === "kraft"
                      ? "#ca9a66"
                      : materialType === "corrugated"
                      ? "#ba8b57"
                      : boxColor),
                }}
              />
              <span className="text-[11px] font-bold text-neutral-800">Face color</span>
            </button>

            {/* Color Selector Popover Modal */}
            {showColorPopover && (
              <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white rounded-2xl border border-neutral-200 shadow-xl p-3.5 w-64 space-y-3 z-40 text-neutral-800 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-extrabold text-neutral-800">
                      Warna Bidang ({activeFace.name})
                    </span>
                  </div>
                  <button
                    onClick={() => setShowColorPopover(false)}
                    className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Preset Color Swatches */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-neutral-500 block">
                    Pilihan Warna Populer:
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_FACE_COLORS.map((c) => {
                      const currentFaceColor = faceColors[activeFace.id] || boxColor
                      const isCurrent = currentFaceColor.toLowerCase() === c.hex.toLowerCase()

                      return (
                        <button
                          key={c.hex}
                          onClick={() => {
                            if (onUpdateFaceColor) {
                              onUpdateFaceColor(activeFace.id, c.hex)
                            }
                          }}
                          className={`w-7 h-7 rounded-xl border transition-all flex items-center justify-center shrink-0 shadow-xs ${
                            isCurrent
                              ? "ring-2 ring-blue-600 ring-offset-1 scale-110"
                              : "border-neutral-200 hover:scale-105"
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {isCurrent && (
                            <Check
                              className={`w-3.5 h-3.5 ${
                                c.hex === "#ffffff" || c.hex === "#F7CB45"
                                  ? "text-neutral-900"
                                  : "text-white"
                              }`}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Hex Custom Color Input */}
                <div className="flex items-center gap-2 pt-1 border-t border-neutral-100">
                  <span className="text-[10.5px] font-bold text-neutral-600">Hex:</span>
                  <input
                    type="color"
                    value={faceColors[activeFace.id] || boxColor}
                    onChange={(e) => {
                      if (onUpdateFaceColor) {
                        onUpdateFaceColor(activeFace.id, e.target.value)
                      }
                    }}
                    className="w-7 h-7 rounded-lg border border-neutral-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={faceColors[activeFace.id] || boxColor}
                    onChange={(e) => {
                      if (onUpdateFaceColor) {
                        onUpdateFaceColor(activeFace.id, e.target.value)
                      }
                    }}
                    className="flex-1 px-2 py-1 text-xs font-mono border border-neutral-200 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>

                {/* Action button to reset to default box color */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => {
                      if (onUpdateFaceColor) {
                        onUpdateFaceColor(activeFace.id, boxColor)
                      }
                    }}
                    className="text-[10px] text-neutral-500 hover:text-neutral-800 font-semibold"
                  >
                    Reset Warna Default
                  </button>
                  <button
                    onClick={() => setShowColorPopover(false)}
                    className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold shadow-xs"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PACDORA-STYLE FLOATING BOTTOM TOOLBAR (Select, Pan, Undo, Zoom) */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-white/95 px-3 py-1.5 rounded-2xl border border-neutral-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.08)] backdrop-blur-md">
        {/* Select Tool */}
        <button
          onClick={() => setActiveTool("select")}
          className={`p-1.5 rounded-xl transition-all ${
            activeTool === "select"
              ? "bg-blue-50 text-blue-600 font-bold"
              : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100"
          }`}
          title="Selection Tool"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        {/* Pan Hand Tool */}
        <button
          onClick={() => setActiveTool("pan")}
          className={`p-1.5 rounded-xl transition-all ${
            activeTool === "pan"
              ? "bg-blue-50 text-blue-600 font-bold"
              : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100"
          }`}
          title="Hand Pan Tool"
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-neutral-200 mx-0.5" />

        {/* Undo / Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded-xl transition-colors ${
            canUndo
              ? "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
              : "text-neutral-300 cursor-not-allowed"
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded-xl transition-colors ${
            canRedo
              ? "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
              : "text-neutral-300 cursor-not-allowed"
          }`}
          title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-neutral-200 mx-0.5" />

        {/* Zoom Out */}
        <button
          onClick={() => onZoomChange(Math.max(30, zoom - 10))}
          className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-700 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Zoom % */}
        <span className="text-xs font-bold text-neutral-900 font-mono px-1.5 select-none min-w-[44px] text-center">
          {zoom}%
        </span>

        {/* Zoom In */}
        <button
          onClick={() => onZoomChange(Math.min(200, zoom + 10))}
          className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-700 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-neutral-200 mx-0.5" />

        {/* Rotate 90 deg */}
        <button
          onClick={() => setRotationAngle((prev) => (prev + 90) % 360)}
          className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-700 transition-colors"
          title="Putar Kanvas 90°"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Fit / Center View (100% Default) */}
        <button
          onClick={() => {
            onZoomChange(100)
            setRotationAngle(0)
            centerDieline()
          }}
          className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-700 transition-colors"
          title="Reset Zoom ke 100% & Pusatkan"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
