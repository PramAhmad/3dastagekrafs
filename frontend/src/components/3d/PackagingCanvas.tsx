"use client"

import React, { useRef, useMemo, useEffect, useState, useCallback } from "react"
import { Canvas, useThree, ThreeEvent } from "@react-three/fiber"
import { OrbitControls, Center, ContactShadows, Text, Grid, Environment, Lightformer } from "@react-three/drei"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js"
import * as THREE from "three"

export type DecalType = "image" | "circle" | "square" | "triangle" | "star" | "hexagon" | "badge"
export type SurfaceTarget = "front" | "back" | "top" | "left" | "right"

export interface CanvasObject {
  id: string
  name: string
  type: DecalType
  color: string
  imageUrl?: string | null
  surfaceTarget: SurfaceTarget
  posX: number // mm relative to face center
  posY: number // mm (positive = up, negative = down)
  scale: number // multiplier
  widthMm?: number // physical width in mm (default 18mm)
  heightMm?: number // physical height in mm (default 18mm)
  rotation: number // degrees
  opacity: number // 0 to 1
  visible: boolean
}

export interface PackagingCanvasProps {
  category: "BOX" | "POUCH" | "JAR" | "BOTTLE" | "CAN" | "TRIANGLE" | "CUP" | "PILLOW" | "CLIP" | string
  length: number // mm
  width: number  // mm
  height: number // mm
  radius: number // mm
  wallThickness: number // mm
  boxColor: string
  faceColors?: Record<string, string>
  materialFinish: "matte" | "glossy" | "kraft" | "metallic" | "frosted"
  materialType?: string
  
  // Custom 3D Mesh URL & Format (.glb / .gltf / .stl)
  model3dUrl?: string
  modelFormat?: "glb" | "gltf" | "stl" | string
  dielineSvgUrl?: string

  // Multi-Object Layers
  objects: CanvasObject[]
  selectedObjectId: string | null
  onSelectObject?: (id: string | null) => void
  onUpdateSelectedObjectPos?: (x: number, y: number) => void

  showGrid: boolean
  cameraView: "iso" | "front" | "top" | "side" | "back"
  openProgress?: number // 0 (closed) to 100 (fully open)
  canvasBackground?: string

  // Auto-fit & max-bound controls for 1280px screen and custom mesh models
  maxVisualBound?: number // Maximum rendered visual size in Three.js world units (default 1.25)
  modelScaleMultiplier?: number // Manual multiplier for fine-tuning scale (default 1.0)

  // GLB 3D Model Exporter
  exportGLBTrigger?: number
  exportGLBFileName?: string
  onExportGLBDone?: (blob: Blob, fileName: string) => void
}

// Camera controller for smooth angle transitions
function CameraController({
  view,
  controlsRef,
}: {
  view: "iso" | "front" | "top" | "side" | "back"
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}) {
  const { camera } = useThree()

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    switch (view) {
      case "front":
        camera.position.set(0, 0, 2.75)
        controls.target.set(0, 0, 0)
        break
      case "back":
        camera.position.set(0, 0, -2.75)
        controls.target.set(0, 0, 0)
        break
      case "top":
        camera.position.set(0, 2.85, 0.001)
        controls.target.set(0, 0, 0)
        break
      case "side":
        camera.position.set(2.75, 0, 0)
        controls.target.set(0, 0, 0)
        break
      case "iso":
      default:
        camera.position.set(1.95, 1.25, 2.15)
        controls.target.set(0, 0, 0)
        break
    }
    controls.update()
  }, [view, camera, controlsRef])

  return null
}

// Dedicated GLB Exporter using Three.js GLTFExporter
function GLBExportController({
  trigger,
  modelRef,
  onExport,
  fileName,
}: {
  trigger?: number
  modelRef: React.RefObject<THREE.Group | null>
  onExport?: (blob: Blob, fileName: string) => void
  fileName?: string
}) {
  const { scene } = useThree()

  useEffect(() => {
    if (!trigger || !onExport) return

    import("three/examples/jsm/exporters/GLTFExporter.js")
      .then(({ GLTFExporter }) => {
        const exporter = new GLTFExporter()
        const target = modelRef.current || scene

        exporter.parse(
          target,
          (gltf) => {
            const blob = new Blob([gltf as ArrayBuffer], { type: "model/gltf-binary" })
            onExport(blob, fileName || "packaging-model.glb")
          },
          (error) => {
            console.error("Gagal mengekspor GLB:", error)
          },
          { binary: true }
        )
      })
      .catch((err) => {
        console.error("Gagal memuat GLTFExporter:", err)
      })
  }, [trigger, modelRef, onExport, fileName, scene])

  return null
}

// Helper to draw single object onto 2D canvas with exact mm / px physical bounds matching 2D dieline
function drawObject(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject,
  cx: number,
  cy: number,
  loadedImages: Map<string, HTMLImageElement>,
  isSelected: boolean,
  pxPerMmX: number,
  pxPerMmY: number
) {
  if (!obj.visible) return

  const scale = obj.scale || 1.0
  const wMm = obj.widthMm || 20
  const hMm = obj.heightMm || 20

  const widthPx = wMm * pxPerMmX * scale
  const heightPx = hMm * pxPerMmY * scale

  ctx.save()
  ctx.globalAlpha = obj.opacity ?? 1.0
  ctx.translate(cx, cy)
  ctx.rotate((obj.rotation * Math.PI) / 180)

  if (obj.type === "image") {
    const img = obj.imageUrl ? loadedImages.get(obj.imageUrl) : null
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, -widthPx / 2, -heightPx / 2, widthPx, heightPx)
    } else {
      ctx.strokeStyle = "#38bdf8"
      ctx.lineWidth = 4
      ctx.strokeRect(-widthPx / 2, -heightPx / 2, widthPx, heightPx)
    }
  } else if (obj.type === "circle") {
    ctx.beginPath()
    ctx.ellipse(0, 0, widthPx / 2, heightPx / 2, 0, 0, Math.PI * 2)
    ctx.fillStyle = obj.color
    ctx.fill()
  } else if (obj.type === "square") {
    ctx.fillStyle = obj.color
    const r = Math.min(16, widthPx * 0.15)
    ctx.beginPath()
    ctx.roundRect(-widthPx / 2, -heightPx / 2, widthPx, heightPx, r)
    ctx.fill()
  } else if (obj.type === "triangle") {
    ctx.beginPath()
    ctx.moveTo(0, -heightPx / 2)
    ctx.lineTo(widthPx / 2, heightPx / 2)
    ctx.lineTo(-widthPx / 2, heightPx / 2)
    ctx.closePath()
    ctx.fillStyle = obj.color
    ctx.fill()
  } else if (obj.type === "star") {
    ctx.fillStyle = obj.color
    ctx.beginPath()
    const spikes = 5
    const outerR = Math.min(widthPx, heightPx) / 2
    const innerR = outerR * 0.45
    let rot = (Math.PI / 2) * 3
    let step = Math.PI / spikes
    ctx.moveTo(0, -outerR)
    for (let i = 0; i < spikes; i++) {
      let x = Math.cos(rot) * outerR
      let y = Math.sin(rot) * outerR
      ctx.lineTo(x, y)
      rot += step
      x = Math.cos(rot) * innerR
      y = Math.sin(rot) * innerR
      ctx.lineTo(x, y)
      rot += step
    }
    ctx.lineTo(0, -outerR)
    ctx.closePath()
    ctx.fill()
  } else if (obj.type === "hexagon") {
    ctx.fillStyle = obj.color
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3
      const x = (widthPx / 2) * Math.cos(a)
      const y = (heightPx / 2) * Math.sin(a)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
  } else if (obj.type === "badge") {
    ctx.fillStyle = obj.color
    ctx.beginPath()
    ctx.ellipse(0, 0, widthPx / 2, heightPx / 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = Math.max(4, Math.min(widthPx, heightPx) * 0.04)
    ctx.setLineDash([12, 8])
    ctx.stroke()
  }

  // Active selection ring
  if (isSelected) {
    ctx.strokeStyle = "#38bdf8"
    ctx.lineWidth = 4
    ctx.setLineDash([8, 6])
    const pad = 8
    ctx.strokeRect(-widthPx / 2 - pad, -heightPx / 2 - pad, widthPx + pad * 2, heightPx + pad * 2)
  }

  ctx.restore()
}

// Calculate base center X position (in mm) along the continuous wrap perimeter for each face
function getFaceBaseCenterX(face: SurfaceTarget, length: number, width: number): number {
  switch (face) {
    case "front":
      return length / 2
    case "right":
      return length + width / 2
    case "back":
      return length + width + length / 2
    case "left":
      return length + width + length + width / 2
    default:
      return length / 2
  }
}

// Preloads user images
function useImageCache(objects: CanvasObject[]) {
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map())

  useEffect(() => {
    const urls = objects.filter((o) => o.type === "image" && o.imageUrl).map((o) => o.imageUrl!)
    const uniqueUrls = Array.from(new Set(urls))
    const map = new Map<string, HTMLImageElement>()
    let count = 0

    if (uniqueUrls.length === 0) {
      setLoadedImages(map)
      return
    }

    uniqueUrls.forEach((url) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = url
      img.onload = img.onerror = () => {
        map.set(url, img)
        count++
        if (count === uniqueUrls.length) {
          setLoadedImages(new Map(map))
        }
      }
    })
  }, [objects])

  return loadedImages
}

// Procedural Kraft / Corrugated Cardboard Bump Map (creates authentic physical fiber & fluting relief)
let cachedKraftBumpTex: THREE.CanvasTexture | null = null
let cachedCorrugatedBumpTex: THREE.CanvasTexture | null = null

function getKraftBumpTexture(isCorrugated: boolean): THREE.CanvasTexture {
  if (isCorrugated && cachedCorrugatedBumpTex) return cachedCorrugatedBumpTex
  if (!isCorrugated && cachedKraftBumpTex) return cachedKraftBumpTex

  const canvas = document.createElement("canvas")
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return new THREE.CanvasTexture(canvas)
  }

  // 1. Neutral mid-gray base (128)
  ctx.fillStyle = "#808080"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 2. Corrugated fluting waves (soft sinusoidal ridges & valleys)
  if (isCorrugated) {
    const flutePitch = 28
    for (let x = 0; x < canvas.width; x += flutePitch) {
      // Valley groove (darker = indented into surface)
      const valleyGrad = ctx.createLinearGradient(x, 0, x + flutePitch * 0.45, 0)
      valleyGrad.addColorStop(0, "rgba(45, 45, 45, 0.42)")
      valleyGrad.addColorStop(1, "rgba(128, 128, 128, 0)")
      ctx.fillStyle = valleyGrad
      ctx.fillRect(x, 0, flutePitch * 0.45, canvas.height)

      // Crest ridge (lighter = raised above surface)
      const crestGrad = ctx.createLinearGradient(x + flutePitch * 0.45, 0, x + flutePitch, 0)
      crestGrad.addColorStop(0, "rgba(128, 128, 128, 0)")
      crestGrad.addColorStop(0.5, "rgba(205, 205, 205, 0.38)")
      crestGrad.addColorStop(1, "rgba(128, 128, 128, 0)")
      ctx.fillStyle = crestGrad
      ctx.fillRect(x + flutePitch * 0.45, 0, flutePitch * 0.55, canvas.height)

      // Fine linear press groove
      ctx.fillStyle = "rgba(40, 40, 40, 0.25)"
      ctx.fillRect(x, 0, 1.2, canvas.height)
    }
  }

  // 3. Tactile Wood & Cellulose Fiber Relief Strands
  const fiberCount = 4200
  for (let i = 0; i < fiberCount; i++) {
    const fx = Math.random() * canvas.width
    const fy = Math.random() * canvas.height
    const fLength = Math.random() * 16 + 5
    const angle = (Math.random() - 0.5) * 0.4 // gentle paper grain angle
    const isRaised = Math.random() > 0.4

    ctx.beginPath()
    ctx.moveTo(fx, fy)
    const midX = fx + Math.cos(angle) * (fLength / 2) + (Math.random() - 0.5) * 1.5
    const midY = fy + Math.sin(angle) * (fLength / 2) + (Math.random() - 0.5) * 1.5
    const endX = fx + Math.cos(angle) * fLength
    const endY = fy + Math.sin(angle) * fLength

    ctx.quadraticCurveTo(midX, midY, endX, endY)
    ctx.strokeStyle = isRaised
      ? `rgba(215, 215, 215, ${Math.random() * 0.25 + 0.12})`
      : `rgba(45, 45, 45, ${Math.random() * 0.28 + 0.12})`
    ctx.lineWidth = Math.random() * 1.2 + 0.5
    ctx.stroke()
  }

  // 4. Recycled pulp flakes & flecks (tiny 3D bumps and dips)
  const speckCount = 2000
  for (let i = 0; i < speckCount; i++) {
    const sx = Math.random() * canvas.width
    const sy = Math.random() * canvas.height
    const sSize = Math.random() * 2.2 + 0.6
    const isRaised = Math.random() > 0.5
    ctx.fillStyle = isRaised
      ? `rgba(225, 225, 225, ${Math.random() * 0.35 + 0.15})`
      : `rgba(35, 35, 35, ${Math.random() * 0.35 + 0.15})`
    ctx.fillRect(sx, sy, sSize, sSize)
  }

  // 5. Fine unbleached paper grain stippling noise
  ctx.fillStyle = "rgba(30, 30, 30, 0.08)"
  for (let i = 0; i < 3500; i++) {
    const rx = Math.random() * canvas.width
    const ry = Math.random() * canvas.height
    ctx.fillRect(rx, ry, 1, 1)
  }
  ctx.fillStyle = "rgba(230, 230, 230, 0.08)"
  for (let i = 0; i < 3500; i++) {
    const rx = Math.random() * canvas.width
    const ry = Math.random() * canvas.height
    ctx.fillRect(rx, ry, 1, 1)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 1)
  tex.needsUpdate = true

  if (isCorrugated) {
    cachedCorrugatedBumpTex = tex
  } else {
    cachedKraftBumpTex = tex
  }
  return tex
}

// Helper to apply authentic procedural packaging material background (paper grain, flutes, cellulose fibers, sheen)
function applyMaterialBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  baseColor: string,
  finish: string,
  materialType?: string
) {
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, w, h)

  const type = materialType || finish

  if (type === "kraft" || type === "corrugated") {
    ctx.save()

    // 1. Organic unbleached pulp cloud blotches (warm amber/brown depth)
    const blotchCount = Math.max(35, Math.floor((w * h) / 30000))
    for (let i = 0; i < blotchCount; i++) {
      const bx = Math.random() * w
      const by = Math.random() * h
      const br = Math.random() * 110 + 35
      const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br)
      const isDark = Math.random() > 0.45
      grad.addColorStop(0, isDark ? "rgba(55, 28, 8, 0.07)" : "rgba(255, 235, 195, 0.06)")
      grad.addColorStop(1, "rgba(0, 0, 0, 0)")
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(bx, by, br, 0, Math.PI * 2)
      ctx.fill()
    }

    // 2. Corrugated cardboard fluting ridges (Gelombang Karton)
    if (type === "corrugated") {
      const flutePitch = 28 // px per flute ridge
      for (let x = 0; x < w; x += flutePitch) {
        // Flute shadow valley (left side of ridge)
        const shadowGrad = ctx.createLinearGradient(x, 0, x + flutePitch * 0.45, 0)
        shadowGrad.addColorStop(0, "rgba(35, 18, 5, 0.12)")
        shadowGrad.addColorStop(1, "rgba(35, 18, 5, 0.0)")
        ctx.fillStyle = shadowGrad
        ctx.fillRect(x, 0, flutePitch * 0.45, h)

        // Flute crest highlight (right side of ridge)
        const highlightGrad = ctx.createLinearGradient(x + flutePitch * 0.45, 0, x + flutePitch, 0)
        highlightGrad.addColorStop(0, "rgba(255, 250, 230, 0.14)")
        highlightGrad.addColorStop(0.5, "rgba(255, 250, 230, 0.07)")
        highlightGrad.addColorStop(1, "rgba(255, 250, 230, 0.0)")
        ctx.fillStyle = highlightGrad
        ctx.fillRect(x + flutePitch * 0.45, 0, flutePitch * 0.55, h)

        // Fine linear indentation press line
        ctx.fillStyle = "rgba(40, 20, 5, 0.10)"
        ctx.fillRect(x, 0, 1.5, h)
      }
    }

    // 3. Subtle horizontal paper machine grain streaks
    const streakCount = Math.max(120, Math.floor((w * h) / 9000))
    for (let i = 0; i < streakCount; i++) {
      const sx = Math.random() * w
      const sy = Math.random() * h
      const sLen = Math.random() * 80 + 30
      ctx.fillStyle = Math.random() > 0.5 ? "rgba(50, 25, 8, 0.03)" : "rgba(255, 245, 225, 0.035)"
      ctx.fillRect(sx, sy, sLen, 1)
    }

    // 4. Realistic Wood & Cellulose Fiber Strands (Serat kardus asli dengan berbagai warna pulp)
    const fiberCount = Math.max(3000, Math.floor((w * h) / 380))
    for (let i = 0; i < fiberCount; i++) {
      const fx = Math.random() * w
      const fy = Math.random() * h
      const fLength = Math.random() * 14 + 4
      const angle = (Math.random() - 0.5) * 0.5 // aligned with paper grain direction
      const fiberType = Math.random()

      ctx.beginPath()
      ctx.moveTo(fx, fy)
      const midX = fx + Math.cos(angle) * (fLength / 2) + (Math.random() - 0.5) * 1.5
      const midY = fy + Math.sin(angle) * (fLength / 2) + (Math.random() - 0.5) * 1.5
      const endX = fx + Math.cos(angle) * fLength
      const endY = fy + Math.sin(angle) * fLength

      ctx.quadraticCurveTo(midX, midY, endX, endY)

      if (fiberType < 0.4) {
        // Dark unbleached wood fiber
        ctx.strokeStyle = `rgba(50, 25, 8, ${Math.random() * 0.18 + 0.06})`
        ctx.lineWidth = Math.random() * 1.0 + 0.4
      } else if (fiberType < 0.7) {
        // Light cellulose fiber
        ctx.strokeStyle = `rgba(255, 248, 230, ${Math.random() * 0.20 + 0.08})`
        ctx.lineWidth = Math.random() * 1.0 + 0.4
      } else {
        // Reddish-amber raw wood lignin fiber
        ctx.strokeStyle = `rgba(120, 60, 20, ${Math.random() * 0.14 + 0.04})`
        ctx.lineWidth = Math.random() * 0.8 + 0.3
      }
      ctx.stroke()
    }

    // 5. Recycled pulp flecks & dark bits
    const speckCount = Math.max(1600, Math.floor((w * h) / 750))
    for (let i = 0; i < speckCount; i++) {
      const sx = Math.random() * w
      const sy = Math.random() * h
      const sSize = Math.random() * 2.2 + 0.6
      const speckType = Math.random()
      if (speckType < 0.45) {
        ctx.fillStyle = `rgba(40, 18, 5, ${Math.random() * 0.25 + 0.08})`
      } else if (speckType < 0.8) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.25 + 0.08})`
      } else {
        ctx.fillStyle = `rgba(140, 70, 20, ${Math.random() * 0.20 + 0.06})`
      }
      ctx.fillRect(sx, sy, sSize, sSize)
    }

    // 6. Micro-grain paper pulp stippling noise
    ctx.fillStyle = "rgba(0, 0, 0, 0.035)"
    for (let i = 0; i < 4500; i++) {
      const rx = Math.random() * w
      const ry = Math.random() * h
      ctx.fillRect(rx, ry, 1, 1)
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)"
    for (let i = 0; i < 4500; i++) {
      const rx = Math.random() * w
      const ry = Math.random() * h
      ctx.fillRect(rx, ry, 1, 1)
    }

    ctx.restore()
  } else if (type === "gold_foil" || type === "silver_foil" || finish === "metallic") {
    ctx.save()
    const grad = ctx.createLinearGradient(0, 0, w, h)
    if (type === "gold_foil") {
      grad.addColorStop(0, "rgba(212, 175, 55, 0.3)")
      grad.addColorStop(0.3, "rgba(255, 235, 150, 0.6)")
      grad.addColorStop(0.6, "rgba(200, 150, 40, 0.4)")
      grad.addColorStop(1, "rgba(255, 240, 180, 0.5)")
    } else if (type === "silver_foil") {
      grad.addColorStop(0, "rgba(200, 210, 220, 0.3)")
      grad.addColorStop(0.3, "rgba(255, 255, 255, 0.7)")
      grad.addColorStop(0.6, "rgba(160, 175, 190, 0.4)")
      grad.addColorStop(1, "rgba(240, 245, 255, 0.6)")
    } else {
      grad.addColorStop(0, "rgba(0, 0, 0, 0.1)")
      grad.addColorStop(0.5, "rgba(255, 255, 255, 0.3)")
      grad.addColorStop(1, "rgba(0, 0, 0, 0.1)")
    }
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
  } else if (finish === "matte") {
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.015)"
    for (let i = 0; i < 2000; i++) {
      const rx = Math.random() * w
      const ry = Math.random() * h
      ctx.fillRect(rx, ry, 1, 1)
    }
    ctx.restore()
  }
}

// Main procedural 3D Box with Continuous 360° Wrap UVs and direct click hit-testing
function ContinuousBoxModel({
  length,
  width,
  height,
  boxColor,
  faceColors,
  materialFinish,
  materialType,
  objects,
  selectedObjectId,
  onSelectObject,
  onUpdateSelectedObjectPos,
  setOrbitEnabled,
  setIsHoveringObject,
  openProgress = 0,
}: {
  length: number
  width: number
  height: number
  boxColor: string
  faceColors?: Record<string, string>
  materialFinish: "matte" | "glossy" | "kraft" | "metallic" | "frosted"
  materialType?: string
  objects: CanvasObject[]
  selectedObjectId: string | null
  onSelectObject?: (id: string | null) => void
  onUpdateSelectedObjectPos?: (x: number, y: number) => void
  setOrbitEnabled: (enabled: boolean) => void
  setIsHoveringObject: (hovering: boolean) => void
  openProgress?: number
}) {
  const isDraggingRef = useRef(false)
  const dragObjIdRef = useRef<string | null>(null)
  const dragStartUvRef = useRef<{ u: number; v: number; initialPosX: number; initialPosY: number } | null>(null)

  const perimeter = 2 * (length + width)
  const maxDim = Math.max(length, width, height)
  const normFactor = maxDim > 120 ? 1.55 / maxDim : 1.55 / Math.max(75, maxDim)
  const sx = length * normFactor
  const sy = height * normFactor
  const sz = width * normFactor

  const isMetallic = materialFinish === "metallic" || materialType === "gold_foil" || materialType === "silver_foil"
  const isGlossy = materialFinish === "glossy"
  const isCorrugated = materialType === "corrugated"
  const isKraft = materialFinish === "kraft" || materialType === "corrugated" || materialType === "kraft"
  const kraftBumpMap = isKraft ? getKraftBumpTexture(isCorrugated) : null
  const kraftBumpScale = isCorrugated ? 0.035 : 0.022

  const roughness = isGlossy ? 0.06 : isKraft ? 0.92 : isMetallic ? 0.15 : 0.65
  const metalness = isMetallic ? 0.88 : isGlossy ? 0.05 : 0.0
  const clearcoat = isGlossy ? 1.0 : 0.0

  const loadedImages = useImageCache(objects)

  // 1. Continuous UV-mapped Box Geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(sx, sy, sz)
    const uvAttr = geo.attributes.uv

    const u0 = 0
    const u1 = length / perimeter
    const u2 = (length + width) / perimeter
    const u3 = (2 * length + width) / perimeter
    const u4 = 1.0

    // Face 0 (+X, Right): index 0..3
    uvAttr.setXY(0, u1, 1); uvAttr.setXY(1, u2, 1); uvAttr.setXY(2, u1, 0); uvAttr.setXY(3, u2, 0)
    // Face 1 (-X, Left): index 4..7
    uvAttr.setXY(4, u3, 1); uvAttr.setXY(5, u4, 1); uvAttr.setXY(6, u3, 0); uvAttr.setXY(7, u4, 0)
    // Face 2 (+Y, Top): index 8..11 (Standard 0..1)
    uvAttr.setXY(8, 0, 1); uvAttr.setXY(9, 1, 1); uvAttr.setXY(10, 0, 0); uvAttr.setXY(11, 1, 0)
    // Face 3 (-Y, Bottom): index 12..15
    uvAttr.setXY(12, 0, 1); uvAttr.setXY(13, 1, 1); uvAttr.setXY(14, 0, 0); uvAttr.setXY(15, 1, 0)
    // Face 4 (+Z, Front): index 16..19
    uvAttr.setXY(16, u0, 1); uvAttr.setXY(17, u1, 1); uvAttr.setXY(18, u0, 0); uvAttr.setXY(19, u1, 0)
    // Face 5 (-Z, Back): index 20..23
    uvAttr.setXY(20, u2, 1); uvAttr.setXY(21, u3, 1); uvAttr.setXY(22, u2, 0); uvAttr.setXY(23, u3, 0)

    uvAttr.needsUpdate = true
    return geo
  }, [sx, sy, sz, length, width, perimeter])

  // 2. Continuous 360° Wrap Texture for all 4 side walls (Front, Right, Back, Left) + Top/Bottom wrap connection
  const wrapTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 2048
    canvas.height = 1024
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    applyMaterialBackground(ctx, canvas.width, canvas.height, boxColor, materialFinish, materialType)

    // Per-face background color rendering
    if (faceColors) {
      const u0 = 0
      const u1 = (length / perimeter) * canvas.width
      const u2 = ((length + width) / perimeter) * canvas.width
      const u3 = ((2 * length + width) / perimeter) * canvas.width
      const u4 = canvas.width

      if (faceColors.front) {
        ctx.fillStyle = faceColors.front
        ctx.fillRect(u0, 0, u1 - u0, canvas.height)
      }
      if (faceColors.right) {
        ctx.fillStyle = faceColors.right
        ctx.fillRect(u1, 0, u2 - u1, canvas.height)
      }
      if (faceColors.back) {
        ctx.fillStyle = faceColors.back
        ctx.fillRect(u2, 0, u3 - u2, canvas.height)
      }
      if (faceColors.left) {
        ctx.fillStyle = faceColors.left
        ctx.fillRect(u3, 0, u4 - u3, canvas.height)
      }
    }

    const pxPerMmX = canvas.width / perimeter
    const pxPerMmY = canvas.height / height
    const sideObjects = objects.filter((o) => o.surfaceTarget !== "top" && o.visible)

    sideObjects.forEach((obj) => {
      const baseCenterX = getFaceBaseCenterX(obj.surfaceTarget, length, width)
      const absX = baseCenterX + obj.posX
      const normX = (absX / perimeter) * canvas.width
      const normY = -(obj.posY / height) * canvas.height
      const cy = canvas.height / 2 + normY
      const maxObjPx = ((obj.widthMm || 20) * pxPerMmX * (obj.scale || 1.0)) * 1.5

      for (let offset = -canvas.width; offset <= canvas.width; offset += canvas.width) {
        const cx = normX + offset
        if (cx > -maxObjPx && cx < canvas.width + maxObjPx) {
          drawObject(ctx, obj, cx, cy, loadedImages, obj.id === selectedObjectId, pxPerMmX, pxPerMmY)
        }
      }
    })

    // Also draw top objects if they overflow onto the side walls
    const topObjects = objects.filter((o) => o.surfaceTarget === "top" && o.visible)
    topObjects.forEach((obj) => {
      if (obj.posY < -width / 2 + (obj.heightMm || 20)) {
        const absX = length / 2 + obj.posX
        const normX = (absX / perimeter) * canvas.width
        const cy = 0 - ((obj.posY + width / 2) / height) * canvas.height
        drawObject(ctx, obj, normX, cy, loadedImages, obj.id === selectedObjectId, pxPerMmX, pxPerMmY)
      }
    })

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    return tex
  }, [boxColor, faceColors, materialFinish, materialType, objects, selectedObjectId, loadedImages, length, width, height, perimeter])

  // 3. Top Face Texture with seamless connection to all 4 side walls
  const topTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    const topFaceColor = faceColors?.top || boxColor
    applyMaterialBackground(ctx, canvas.width, canvas.height, topFaceColor, materialFinish, materialType)

    const pxPerMmX = canvas.width / length
    const pxPerMmY = canvas.height / width
    const topObjs = objects.filter((o) => o.surfaceTarget === "top" && o.visible)
    topObjs.forEach((obj) => {
      const normX = (obj.posX / length) * canvas.width
      const normY = -(obj.posY / width) * canvas.height
      const cx = canvas.width / 2 + normX
      const cy = canvas.height / 2 + normY
      drawObject(ctx, obj, cx, cy, loadedImages, obj.id === selectedObjectId, pxPerMmX, pxPerMmY)
    })

    // Also draw side objects overflowing onto top face
    const sideObjects = objects.filter((o) => o.surfaceTarget !== "top" && o.visible)
    sideObjects.forEach((obj) => {
      const hMm = obj.heightMm || 20
      if (obj.posY > height / 2 - hMm) {
        const overflow = obj.posY - height / 2
        if (obj.surfaceTarget === "front") {
          const cx = canvas.width / 2 + (obj.posX / length) * canvas.width
          const cy = canvas.height - (overflow / width) * canvas.height
          drawObject(ctx, obj, cx, cy, loadedImages, obj.id === selectedObjectId, pxPerMmX, pxPerMmY)
        } else if (obj.surfaceTarget === "back") {
          const cx = canvas.width / 2 - (obj.posX / length) * canvas.width
          const cy = 0 + (overflow / width) * canvas.height
          drawObject(ctx, obj, cx, cy, loadedImages, obj.id === selectedObjectId, pxPerMmX, pxPerMmY)
        } else if (obj.surfaceTarget === "left") {
          const cx = 0 + (overflow / length) * canvas.width
          const cy = canvas.height / 2 + (obj.posX / width) * canvas.height
          drawObject(ctx, obj, cx, cy, loadedImages, obj.id === selectedObjectId, pxPerMmX, pxPerMmY)
        } else if (obj.surfaceTarget === "right") {
          const cx = canvas.width - (overflow / length) * canvas.width
          const cy = canvas.height / 2 - (obj.posX / width) * canvas.height
          drawObject(ctx, obj, cx, cy, loadedImages, obj.id === selectedObjectId, pxPerMmX, pxPerMmY)
        }
      }
    })

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    return tex
  }, [boxColor, materialFinish, materialType, objects, selectedObjectId, loadedImages, length, width, height])

  // 4. Materials array: [Right, Left, Top, Bottom, Front, Back]
  const materials = useMemo(() => {
    const wrapMat = new THREE.MeshPhysicalMaterial({
      map: wrapTexture || null,
      color: wrapTexture ? 0xffffff : boxColor,
      roughness,
      metalness,
      clearcoat,
      clearcoatRoughness: 0.1,
      bumpMap: isKraft ? kraftBumpMap : null,
      bumpScale: isKraft ? kraftBumpScale : 0,
    })

    const topMat = new THREE.MeshPhysicalMaterial({
      map: topTexture || null,
      color: topTexture ? 0xffffff : boxColor,
      roughness,
      metalness,
      clearcoat,
      clearcoatRoughness: 0.1,
      bumpMap: isKraft ? kraftBumpMap : null,
      bumpScale: isKraft ? kraftBumpScale : 0,
    })

    const bottomMat = new THREE.MeshPhysicalMaterial({
      color: boxColor,
      roughness,
      metalness,
      clearcoat,
      clearcoatRoughness: 0.1,
      bumpMap: isKraft ? kraftBumpMap : null,
      bumpScale: isKraft ? kraftBumpScale : 0,
    })

    const insideMat = new THREE.MeshPhysicalMaterial({
      color: faceColors?.inside || (isKraft ? "#b88959" : "#e8dfd5"),
      roughness: 0.92,
      metalness: 0.0,
      side: THREE.DoubleSide,
      bumpMap: isKraft ? kraftBumpMap : null,
      bumpScale: isKraft ? kraftBumpScale * 0.7 : 0,
    })

    return {
      materials: [wrapMat, wrapMat, topMat, bottomMat, wrapMat, wrapMat],
      wrapMat,
      topMat,
      bottomMat,
      insideMat,
    }
  }, [wrapTexture, topTexture, boxColor, faceColors, materialFinish, roughness, metalness, clearcoat, isKraft, kraftBumpMap, kraftBumpScale])

  // Find which object is located at continuous UV coordinate
  const findObjectAtUV = useCallback(
    (u: number, v: number, faceIndex?: number) => {
      const isTop = faceIndex !== undefined && Math.floor(faceIndex / 2) === 2

      if (isTop) {
        const hitX = (u - 0.5) * length
        const hitY = (v - 0.5) * width
        const topObjs = objects.filter((o) => o.surfaceTarget === "top" && o.visible)
        for (let i = topObjs.length - 1; i >= 0; i--) {
          const obj = topObjs[i]
          const halfW = ((obj.widthMm || 18) * (obj.scale || 1.0)) / 2
          const halfH = ((obj.heightMm || 18) * (obj.scale || 1.0)) / 2
          if (Math.abs(hitX - obj.posX) <= halfW && Math.abs(hitY - obj.posY) <= halfH) {
            return obj
          }
        }
        return null
      }

      // Vertical side walls:
      const hitWorldX = u * perimeter
      const hitWorldY = (v - 0.5) * height
      const sideObjs = objects.filter((o) => o.surfaceTarget !== "top" && o.visible)

      for (let i = sideObjs.length - 1; i >= 0; i--) {
        const obj = sideObjs[i]
        const baseCenterX = getFaceBaseCenterX(obj.surfaceTarget, length, width)
        const objWorldX = baseCenterX + obj.posX
        const halfW = ((obj.widthMm || 18) * (obj.scale || 1.0)) / 2
        const halfH = ((obj.heightMm || 18) * (obj.scale || 1.0)) / 2

        let dx = Math.abs(hitWorldX - objWorldX)
        if (dx > perimeter / 2) dx = perimeter - dx
        const dy = Math.abs(hitWorldY - obj.posY)

        if (dx <= halfW && dy <= halfH) {
          return obj
        }
      }

      return null
    },
    [objects, length, width, height, perimeter]
  )

  // Hover detection to update cursor and direct drag (Correct vertical and horizontal directions)
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (isDraggingRef.current) {
      e.stopPropagation()
      if (e.uv && dragStartUvRef.current && dragObjIdRef.current && onUpdateSelectedObjectPos) {
        const isTop = e.faceIndex !== undefined && e.faceIndex !== null && Math.floor(e.faceIndex / 2) === 2
        let deltaX = 0
        let deltaY = 0

        if (isTop) {
          deltaX = (e.uv.x - dragStartUvRef.current.u) * length
          deltaY = (e.uv.y - dragStartUvRef.current.v) * width
        } else {
          let du = e.uv.x - dragStartUvRef.current.u
          if (du > 0.5) du -= 1.0
          if (du < -0.5) du += 1.0
          deltaX = du * perimeter
          // Correct direction: upward mouse drag increases posY
          deltaY = (e.uv.y - dragStartUvRef.current.v) * height
        }

        const newPosX = Math.round(dragStartUvRef.current.initialPosX + deltaX)
        const newPosY = Math.round(dragStartUvRef.current.initialPosY + deltaY)
        onUpdateSelectedObjectPos(newPosX, newPosY)
      }
      return
    }

    if (e.uv) {
      const hitObj = findObjectAtUV(e.uv.x, e.uv.y, e.faceIndex ?? undefined)
      setIsHoveringObject(!!hitObj)
    }
  }

  // Pointer down: If clicked on an object -> grab it. Else -> let OrbitControls rotate 3D model!
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!e.uv) return
    const hitObj = findObjectAtUV(e.uv.x, e.uv.y, e.faceIndex ?? undefined)

    if (hitObj) {
      e.stopPropagation()
      isDraggingRef.current = true
      dragObjIdRef.current = hitObj.id
      dragStartUvRef.current = {
        u: e.uv.x,
        v: e.uv.y,
        initialPosX: hitObj.posX,
        initialPosY: hitObj.posY,
      }
      if (onSelectObject) onSelectObject(hitObj.id)
      setOrbitEnabled(false)
    }
  }

  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      dragObjIdRef.current = null
      dragStartUvRef.current = null
      setOrbitEnabled(true)
    }
  }

  const openRatio = Math.max(0, Math.min(1, (openProgress ?? 0) / 100))
  const fold = 1 - openRatio // 1 = 100% 3D assembled box, 0 = 100% flat 2D dieline sheet
  const tuckHeight = Math.min(sy * 0.4, 0.22)
  const dustWingW = Math.min(sy * 0.75, 0.45)
  const panelThick = 0.006

  return (
    <group position={[0, (sy / 2) * fold, 0]}>
      {openRatio === 0 ? (
        /* Optimized Closed 3D Box */
        <mesh
          castShadow
          receiveShadow
          geometry={geometry}
          material={materials.materials}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      ) : (
        /* Full Articulated 2D Dieline <-> 3D Box Folding Hierarchy (Pacdora-Style) */
        <group>
          {/* 1. CENTER BOTTOM BASE (Fixed at Origin on Ground Plane) */}
          <group position={[0, -sy / 2 * fold + panelThick / 2, 0]}>
            <mesh
              castShadow
              receiveShadow
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <boxGeometry args={[sx, panelThick, sz]} />
              <primitive object={materials.wrapMat} attach="material-0" />
              <primitive object={materials.wrapMat} attach="material-1" />
              <primitive object={materials.insideMat} attach="material-2" />
              <primitive object={materials.bottomMat} attach="material-3" />
              <primitive object={materials.wrapMat} attach="material-4" />
              <primitive object={materials.wrapMat} attach="material-5" />
            </mesh>

            {/* 2. FRONT WALL + ROLLOVER FLAP (Hinged at Front Edge of Base) */}
            <group position={[0, 0, sz / 2]} rotation-x={fold * (Math.PI / 2)}>
              {/* Main Front Wall */}
              <mesh position={[0, 0, sy / 2]} castShadow receiveShadow>
                <boxGeometry args={[sx, panelThick, sy]} />
                <primitive object={materials.wrapMat} attach="material-0" />
                <primitive object={materials.wrapMat} attach="material-1" />
                <primitive object={materials.wrapMat} attach="material-2" />
                <primitive object={materials.insideMat} attach="material-3" />
                <primitive object={materials.wrapMat} attach="material-4" />
                <primitive object={materials.wrapMat} attach="material-5" />
              </mesh>

              {/* Front Rollover Flap (Hinged at Top Edge of Front Wall) */}
              <group position={[0, 0, sy]} rotation-x={fold * Math.PI}>
                <mesh position={[0, 0, (sy * 0.85) / 2]} castShadow>
                  <boxGeometry args={[sx * 0.96, panelThick * 0.9, sy * 0.85]} />
                  <primitive object={materials.insideMat} attach="material" />
                </mesh>
              </group>
            </group>

            {/* 3. BACK WALL + TOP LID + FRONT TUCK TAB + DUST WINGS (Hinged at Back Edge of Base) */}
            <group position={[0, 0, -sz / 2]} rotation-x={-fold * (Math.PI / 2)}>
              {/* Main Back Wall */}
              <mesh position={[0, 0, -sy / 2]} castShadow receiveShadow>
                <boxGeometry args={[sx, panelThick, sy]} />
                <primitive object={materials.wrapMat} attach="material-0" />
                <primitive object={materials.wrapMat} attach="material-1" />
                <primitive object={materials.wrapMat} attach="material-2" />
                <primitive object={materials.insideMat} attach="material-3" />
                <primitive object={materials.wrapMat} attach="material-4" />
                <primitive object={materials.wrapMat} attach="material-5" />
              </mesh>

              {/* Top Lid Group (Hinged at Top Edge of Back Wall) */}
              <group position={[0, 0, -sy]} rotation-x={fold * (Math.PI / 2)}>
                {/* Main Top Lid Panel */}
                <mesh
                  position={[0, 0, -sz / 2]}
                  castShadow
                  receiveShadow
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                >
                  <boxGeometry args={[sx, panelThick, sz]} />
                  <primitive object={materials.wrapMat} attach="material-0" />
                  <primitive object={materials.wrapMat} attach="material-1" />
                  <primitive object={materials.topMat} attach="material-2" />
                  <primitive object={materials.insideMat} attach="material-3" />
                  <primitive object={materials.wrapMat} attach="material-4" />
                  <primitive object={materials.wrapMat} attach="material-5" />
                </mesh>

                {/* Left Dust Wing on Lid */}
                <group position={[-sx / 2, 0, -sz / 2]} rotation-z={-fold * (Math.PI / 2)}>
                  <mesh position={[-dustWingW / 2, 0, 0]} castShadow>
                    <boxGeometry args={[dustWingW, panelThick * 0.8, sz * 0.85]} />
                    <primitive object={materials.insideMat} attach="material" />
                  </mesh>
                </group>

                {/* Right Dust Wing on Lid */}
                <group position={[sx / 2, 0, -sz / 2]} rotation-z={fold * (Math.PI / 2)}>
                  <mesh position={[dustWingW / 2, 0, 0]} castShadow>
                    <boxGeometry args={[dustWingW, panelThick * 0.8, sz * 0.85]} />
                    <primitive object={materials.insideMat} attach="material" />
                  </mesh>
                </group>

                {/* Front Tuck Tab (Hinged at Far Edge of Top Lid) */}
                <group position={[0, 0, -sz]} rotation-x={fold * (Math.PI / 2)}>
                  <mesh position={[0, 0, -tuckHeight / 2]} castShadow>
                    <boxGeometry args={[sx * 0.94, panelThick * 0.9, tuckHeight]} />
                    <primitive object={materials.wrapMat} attach="material-2" />
                    <primitive object={materials.insideMat} attach="material-3" />
                    <primitive object={materials.wrapMat} attach="material-0" />
                    <primitive object={materials.wrapMat} attach="material-1" />
                    <primitive object={materials.wrapMat} attach="material-4" />
                    <primitive object={materials.wrapMat} attach="material-5" />
                  </mesh>
                </group>
              </group>
            </group>

            {/* 4. LEFT WALL + OUTER FLAP (Hinged at Left Edge of Base) */}
            <group position={[-sx / 2, 0, 0]} rotation-z={-fold * (Math.PI / 2)}>
              {/* Main Left Wall */}
              <mesh position={[-sy / 2, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[sy, panelThick, sz]} />
                <primitive object={materials.wrapMat} attach="material-0" />
                <primitive object={materials.wrapMat} attach="material-1" />
                <primitive object={materials.wrapMat} attach="material-2" />
                <primitive object={materials.insideMat} attach="material-3" />
                <primitive object={materials.wrapMat} attach="material-4" />
                <primitive object={materials.wrapMat} attach="material-5" />
              </mesh>

              {/* Left Outer Flap (Hinged at Top Edge of Left Wall) */}
              <group position={[-sy, 0, 0]} rotation-z={-fold * Math.PI}>
                <mesh position={[(-sy * 0.85) / 2, 0, 0]} castShadow>
                  <boxGeometry args={[sy * 0.85, panelThick * 0.8, sz * 0.92]} />
                  <primitive object={materials.insideMat} attach="material" />
                </mesh>
              </group>
            </group>

            {/* 5. RIGHT WALL + OUTER FLAP (Hinged at Right Edge of Base) */}
            <group position={[sx / 2, 0, 0]} rotation-z={fold * (Math.PI / 2)}>
              {/* Main Right Wall */}
              <mesh position={[sy / 2, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[sy, panelThick, sz]} />
                <primitive object={materials.wrapMat} attach="material-0" />
                <primitive object={materials.wrapMat} attach="material-1" />
                <primitive object={materials.wrapMat} attach="material-2" />
                <primitive object={materials.insideMat} attach="material-3" />
                <primitive object={materials.wrapMat} attach="material-4" />
                <primitive object={materials.wrapMat} attach="material-5" />
              </mesh>

              {/* Right Outer Flap (Hinged at Top Edge of Right Wall) */}
              <group position={[sy, 0, 0]} rotation-z={fold * Math.PI}>
                <mesh position={[(sy * 0.85) / 2, 0, 0]} castShadow>
                  <boxGeometry args={[sy * 0.85, panelThick * 0.8, sz * 0.92]} />
                  <primitive object={materials.insideMat} attach="material" />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      )}
    </group>
  )
}

// Procedural Jar Model with Continuous 360° Cylindrical Texture Wrap
function ContinuousJarModel({
  radius,
  height,
  boxColor,
  materialFinish,
  materialType,
  objects,
  selectedObjectId,
  onSelectObject,
  onUpdateSelectedObjectPos,
  setOrbitEnabled,
  setIsHoveringObject,
}: {
  radius: number
  height: number
  boxColor: string
  materialFinish: "matte" | "glossy" | "kraft" | "metallic" | "frosted"
  materialType?: string
  objects: CanvasObject[]
  selectedObjectId: string | null
  onSelectObject?: (id: string | null) => void
  onUpdateSelectedObjectPos?: (x: number, y: number) => void
  setOrbitEnabled: (enabled: boolean) => void
  setIsHoveringObject: (hovering: boolean) => void
}) {
  const isDraggingRef = useRef(false)
  const dragStartUvRef = useRef<{ u: number; v: number; initialPosX: number; initialPosY: number } | null>(null)

  const perimeter = 2 * Math.PI * radius
  const maxDim = Math.max(radius * 2, height)
  const normFactor = maxDim > 120 ? 1.55 / maxDim : 1.55 / Math.max(75, maxDim)
  const r = (radius * 2) * normFactor
  const h = height * normFactor

  const isCorrugated = materialType === "corrugated"
  const isKraft = materialFinish === "kraft" || materialType === "corrugated" || materialType === "kraft"
  const kraftBumpMap = isKraft ? getKraftBumpTexture(isCorrugated) : null

  const isMetallic = materialFinish === "metallic" || materialType === "gold_foil" || materialType === "silver_foil"
  const isGlossy = materialFinish === "glossy"

  const roughness = isGlossy ? 0.06 : isKraft ? 0.92 : isMetallic ? 0.15 : 0.45
  const metalness = isMetallic ? 0.88 : isGlossy ? 0.05 : 0.0
  const clearcoat = isGlossy ? 1.0 : 0.0

  const loadedImages = useImageCache(objects)

  const wrapTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 2048
    canvas.height = 1024
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    applyMaterialBackground(ctx, canvas.width, canvas.height, boxColor, materialFinish, materialType)

    const pxPerMmX = canvas.width / perimeter
    const pxPerMmY = canvas.height / height
    const sideObjs = objects.filter((o) => o.visible)

    sideObjs.forEach((obj) => {
      const absX = perimeter / 2 + obj.posX
      const normX = (absX / perimeter) * canvas.width
      const normY = -(obj.posY / height) * canvas.height
      const cy = canvas.height / 2 + normY
      const maxObjPx = ((obj.widthMm || 18) * pxPerMmX * (obj.scale || 1.0)) * 1.5

      for (let offset = -canvas.width; offset <= canvas.width; offset += canvas.width) {
        const cx = normX + offset
        if (cx > -maxObjPx && cx < canvas.width + maxObjPx) {
          drawObject(ctx, obj, cx, cy, loadedImages, obj.id === selectedObjectId, pxPerMmX, pxPerMmY)
        }
      }
    })

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    return tex
  }, [boxColor, materialFinish, materialType, objects, selectedObjectId, loadedImages, radius, height, perimeter])

  const findObjectAtUV = (u: number, v: number) => {
    const hitWorldX = u * perimeter
    const hitWorldY = (v - 0.5) * height
    const sideObjs = objects.filter((o) => o.visible)

    for (let i = sideObjs.length - 1; i >= 0; i--) {
      const obj = sideObjs[i]
      const objWorldX = perimeter / 2 + obj.posX
      const halfW = ((obj.widthMm || 18) * (obj.scale || 1.0)) / 2
      const halfH = ((obj.heightMm || 18) * (obj.scale || 1.0)) / 2
      let dx = Math.abs(hitWorldX - objWorldX)
      if (dx > perimeter / 2) dx = perimeter - dx
      const dy = Math.abs(hitWorldY - obj.posY)
      if (dx <= halfW && dy <= halfH) return obj
    }
    return null
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (isDraggingRef.current) {
      e.stopPropagation()
      if (e.uv && dragStartUvRef.current && onUpdateSelectedObjectPos) {
        let du = e.uv.x - dragStartUvRef.current.u
        if (du > 0.5) du -= 1.0
        if (du < -0.5) du += 1.0
        const deltaX = du * perimeter
        const deltaY = (e.uv.y - dragStartUvRef.current.v) * height
        onUpdateSelectedObjectPos(
          Math.round(dragStartUvRef.current.initialPosX + deltaX),
          Math.round(dragStartUvRef.current.initialPosY + deltaY)
        )
      }
      return
    }

    if (e.uv) {
      const hitObj = findObjectAtUV(e.uv.x, e.uv.y)
      setIsHoveringObject(!!hitObj)
    }
  }

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!e.uv) return
    const hitObj = findObjectAtUV(e.uv.x, e.uv.y)
    if (hitObj) {
      e.stopPropagation()
      isDraggingRef.current = true
      dragStartUvRef.current = {
        u: e.uv.x,
        v: e.uv.y,
        initialPosX: hitObj.posX,
        initialPosY: hitObj.posY,
      }
      if (onSelectObject) onSelectObject(hitObj.id)
      setOrbitEnabled(false)
    }
  }

  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      dragStartUvRef.current = null
      setOrbitEnabled(true)
    }
  }

  return (
    <group position={[0, h / 2, 0]}>
      <mesh
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <cylinderGeometry args={[r / 2, r / 2, h * 0.75, 64]} />
        <meshPhysicalMaterial
          map={wrapTexture || null}
          roughness={roughness}
          metalness={metalness}
          clearcoat={clearcoat}
          clearcoatRoughness={0.1}
          bumpMap={isKraft ? kraftBumpMap : null}
          bumpScale={isKraft ? 0.022 : 0}
        />
      </mesh>

      <mesh position={[0, (h * 0.75) / 2 + (h * 0.25) / 2, 0]} castShadow>
        <cylinderGeometry args={[(r / 2) * 1.05, (r / 2) * 1.05, h * 0.25, 48]} />
        <meshPhysicalMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  )
}

// 3. Procedural Standing Pouch Model (Kemasan Berdiri dengan Zip Lock & Bottom Gusset)
function ContinuousPouchModel({
  length,
  width,
  height,
  boxColor,
  materialFinish,
  materialType,
  objects,
  selectedObjectId,
  onSelectObject,
  onUpdateSelectedObjectPos,
  setOrbitEnabled,
  setIsHoveringObject,
}: {
  length: number
  width: number
  height: number
  boxColor: string
  materialFinish: "matte" | "glossy" | "kraft" | "metallic" | "frosted"
  materialType?: string
  objects: CanvasObject[]
  selectedObjectId: string | null
  onSelectObject?: (id: string | null) => void
  onUpdateSelectedObjectPos?: (x: number, y: number) => void
  setOrbitEnabled: (enabled: boolean) => void
  setIsHoveringObject: (hovering: boolean) => void
}) {
  const maxDim = Math.max(length, width, height)
  const normFactor = maxDim > 120 ? 1.55 / maxDim : 1.55 / Math.max(75, maxDim)
  const sx = length * normFactor
  const sy = height * normFactor
  const sz = (width * 0.7) * normFactor

  const isCorrugated = materialType === "corrugated"
  const isKraft = materialFinish === "kraft" || materialType === "corrugated" || materialType === "kraft"
  const kraftBumpMap = isKraft ? getKraftBumpTexture(isCorrugated) : null

  const isMetallic = materialFinish === "metallic" || materialType === "gold_foil" || materialType === "silver_foil"
  const isGlossy = materialFinish === "glossy"

  const roughness = isGlossy ? 0.08 : isKraft ? 0.90 : isMetallic ? 0.18 : 0.45
  const metalness = isMetallic ? 0.85 : isGlossy ? 0.05 : 0.02
  const clearcoat = isGlossy ? 0.9 : 0.0

  const loadedImages = useImageCache(objects)

  const pouchTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    applyMaterialBackground(ctx, canvas.width, canvas.height, boxColor, materialFinish, materialType)

    const pxPerMmX = canvas.width / length
    const pxPerMmY = canvas.height / height
    const visibleObjs = objects.filter((o) => o.visible)

    visibleObjs.forEach((obj) => {
      const cx = canvas.width / 2 + obj.posX * pxPerMmX
      const cy = canvas.height / 2 - obj.posY * pxPerMmY
      drawObject(ctx, obj, cx, cy, loadedImages, obj.id === selectedObjectId, pxPerMmX, pxPerMmY)
    })

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    return tex
  }, [boxColor, materialFinish, materialType, objects, selectedObjectId, loadedImages, length, height])

  return (
    <group position={[0, sy / 2, 0]}>
      {/* Pouch Main Flexible Body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[sx * 0.48, sx * 0.52, sy * 0.85, 32, 1, false]} />
        <meshPhysicalMaterial
          map={pouchTexture || null}
          roughness={roughness}
          metalness={metalness}
          clearcoat={clearcoat}
          bumpMap={isKraft ? kraftBumpMap : null}
          bumpScale={isKraft ? 0.022 : 0}
        />
      </mesh>

      {/* Top Heat-Sealed Zipper Strip */}
      <mesh position={[0, (sy * 0.85) / 2 + 0.08, 0]} castShadow>
        <boxGeometry args={[sx * 0.98, 0.16, 0.03]} />
        <meshPhysicalMaterial
          color={boxColor}
          roughness={0.3}
          metalness={isMetallic ? 0.8 : 0.1}
          bumpMap={isKraft ? kraftBumpMap : null}
          bumpScale={isKraft ? 0.015 : 0}
        />
      </mesh>

      {/* Top Seal Indentation Line (Zipper notch) */}
      <mesh position={[0, (sy * 0.85) / 2 + 0.04, 0.018]}>
        <boxGeometry args={[sx * 0.9, 0.012, 0.005]} />
        <meshBasicMaterial color="#334155" />
      </mesh>

      {/* Bottom Oval Gusset Base */}
      <mesh position={[0, -(sy * 0.85) / 2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[sz * 0.9, sz * 0.9, 0.02, 32]} />
        <meshPhysicalMaterial color={boxColor} roughness={0.7} bumpMap={isKraft ? kraftBumpMap : null} bumpScale={isKraft ? 0.015 : 0} />
      </mesh>
    </group>
  )
}

// 4. Procedural Cosmetic Pump Bottle Model (Botol Serum / Sabun Cair)
function ContinuousBottleModel({
  radius,
  height,
  boxColor,
  materialFinish,
  materialType,
  objects,
  selectedObjectId,
}: {
  radius: number
  height: number
  boxColor: string
  materialFinish: "matte" | "glossy" | "kraft" | "metallic" | "frosted"
  materialType?: string
  objects: CanvasObject[]
  selectedObjectId: string | null
}) {
  const maxDim = Math.max(radius * 2, height)
  const normFactor = maxDim > 120 ? 1.55 / maxDim : 1.55 / Math.max(75, maxDim)
  const r = (radius * 2) * normFactor
  const h = height * normFactor
  const bodyH = h * 0.7

  const loadedImages = useImageCache(objects)

  const bottleTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    applyMaterialBackground(ctx, canvas.width, canvas.height, boxColor, materialFinish, materialType)

    const perimeter = 2 * Math.PI * radius
    const pxPerMmX = canvas.width / perimeter
    const pxPerMmY = canvas.height / height

    objects.filter((o) => o.visible).forEach((obj) => {
      const cx = canvas.width / 2 + obj.posX * pxPerMmX
      const cy = canvas.height / 2 - obj.posY * pxPerMmY
      drawObject(ctx, obj, cx, cy, loadedImages, obj.id === selectedObjectId, pxPerMmX, pxPerMmY)
    })

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    return tex
  }, [boxColor, materialFinish, materialType, objects, selectedObjectId, loadedImages, radius, height])

  return (
    <group position={[0, h / 2, 0]}>
      {/* Bottle Main Body */}
      <mesh position={[0, -h / 2 + bodyH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r / 2, r / 2, bodyH, 48]} />
        <meshPhysicalMaterial
          map={bottleTexture || null}
          roughness={0.15}
          metalness={0.05}
          clearcoat={0.9}
        />
      </mesh>

      {/* Shoulder Taper */}
      <mesh position={[0, -h / 2 + bodyH + 0.08, 0]} castShadow>
        <cylinderGeometry args={[(r / 2) * 0.5, r / 2, 0.16, 48]} />
        <meshPhysicalMaterial color={boxColor} roughness={0.15} />
      </mesh>

      {/* Neck Collar */}
      <mesh position={[0, -h / 2 + bodyH + 0.22, 0]} castShadow>
        <cylinderGeometry args={[(r / 2) * 0.45, (r / 2) * 0.45, 0.12, 32]} />
        <meshPhysicalMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Pump Head Dispenser */}
      <mesh position={[0.1, -h / 2 + bodyH + 0.36, 0]} castShadow>
        <boxGeometry args={[0.3, 0.1, 0.12]} />
        <meshPhysicalMaterial color="#0f172a" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, -h / 2 + bodyH + 0.31, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.12, 16]} />
        <meshPhysicalMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  )
}

// 5. Procedural Metal Tin Canister Model (Kaleng Teh / Kopi)
function ContinuousCanModel({
  radius,
  height,
  boxColor,
  materialFinish,
  materialType,
  objects,
  selectedObjectId,
}: {
  radius: number
  height: number
  boxColor: string
  materialFinish: string
  materialType?: string
  objects: CanvasObject[]
  selectedObjectId: string | null
}) {
  const maxDim = Math.max(radius * 2, height)
  const normFactor = maxDim > 120 ? 1.55 / maxDim : 1.55 / Math.max(75, maxDim)
  const r = (radius * 2) * normFactor
  const h = height * normFactor

  const loadedImages = useImageCache(objects)

  const canTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    applyMaterialBackground(ctx, canvas.width, canvas.height, boxColor, "metallic", materialType || "silver_foil")

    const perimeter = 2 * Math.PI * radius
    const pxPerMmX = canvas.width / perimeter
    const pxPerMmY = canvas.height / height

    objects.filter((o) => o.visible).forEach((obj) => {
      const cx = canvas.width / 2 + obj.posX * pxPerMmX
      const cy = canvas.height / 2 - obj.posY * pxPerMmY
      drawObject(ctx, obj, cx, cy, loadedImages, obj.id === selectedObjectId, pxPerMmX, pxPerMmY)
    })

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    return tex
  }, [boxColor, materialType, objects, selectedObjectId, loadedImages, radius, height])

  return (
    <group position={[0, h / 2, 0]}>
      {/* Tin Canister Body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[r / 2, r / 2, h, 64]} />
        <meshPhysicalMaterial
          map={canTexture || null}
          roughness={0.2}
          metalness={0.85}
          clearcoat={0.6}
        />
      </mesh>

      {/* Top Rolled Metal Lip Rim */}
      <mesh position={[0, h / 2 + 0.02, 0]} castShadow>
        <torusGeometry args={[r / 2, 0.025, 16, 64]} />
        <meshPhysicalMaterial color="#cbd5e1" roughness={0.15} metalness={0.95} />
      </mesh>

      {/* Bottom Rolled Rim */}
      <mesh position={[0, -h / 2 - 0.01, 0]} castShadow>
        <torusGeometry args={[r / 2, 0.02, 16, 64]} />
        <meshPhysicalMaterial color="#cbd5e1" roughness={0.15} metalness={0.95} />
      </mesh>
    </group>
  )
}

// 6. Procedural Triangle Prism Box Model (Kotak Toblerone / Slice Cake)
function ContinuousTriangleModel({
  length,
  width,
  height,
  boxColor,
  materialFinish,
  materialType,
  objects,
  selectedObjectId,
}: {
  length: number
  width: number
  height: number
  boxColor: string
  materialFinish: string
  materialType?: string
  objects: CanvasObject[]
  selectedObjectId: string | null
}) {
  const sx = length / 50
  const sy = height / 50
  const r = (width * 0.8) / 50

  const loadedImages = useImageCache(objects)

  const triTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    applyMaterialBackground(ctx, canvas.width, canvas.height, boxColor, materialFinish, materialType)

    const pxPerMmX = canvas.width / length
    const pxPerMmY = canvas.height / width

    objects.filter((o) => o.visible).forEach((obj) => {
      const cx = canvas.width / 2 + obj.posX * pxPerMmX
      const cy = canvas.height / 2 - obj.posY * pxPerMmY
      drawObject(ctx, obj, cx, cy, loadedImages, obj.id === selectedObjectId, pxPerMmX, pxPerMmY)
    })

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    return tex
  }, [boxColor, materialFinish, materialType, objects, selectedObjectId, loadedImages, length, width])

  return (
    <group position={[0, sy / 2, 0]}>
      {/* 3-Sided Prism Box */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, sx, 3]} />
        <meshPhysicalMaterial
          map={triTexture || null}
          roughness={0.8}
          metalness={0.02}
        />
      </mesh>
    </group>
  )
}

// 7. Procedural Paper Coffee Cup Model (Gelas Kopi dengan Tutup Lid)
function ContinuousCupModel({
  radius,
  height,
  boxColor,
  materialFinish,
  materialType,
  objects,
  selectedObjectId,
}: {
  radius: number
  height: number
  boxColor: string
  materialFinish: string
  materialType?: string
  objects: CanvasObject[]
  selectedObjectId: string | null
}) {
  const topR = (radius * 2) / 50
  const botR = topR * 0.72
  const h = height / 50

  const loadedImages = useImageCache(objects)

  const cupTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    applyMaterialBackground(ctx, canvas.width, canvas.height, boxColor, materialFinish, materialType)

    const pxPerMmX = canvas.width / (2 * Math.PI * radius)
    const pxPerMmY = canvas.height / height

    objects.filter((o) => o.visible).forEach((obj) => {
      const cx = canvas.width / 2 + obj.posX * pxPerMmX
      const cy = canvas.height / 2 - obj.posY * pxPerMmY
      drawObject(ctx, obj, cx, cy, loadedImages, obj.id === selectedObjectId, pxPerMmX, pxPerMmY)
    })

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    return tex
  }, [boxColor, materialFinish, materialType, objects, selectedObjectId, loadedImages, radius, height])

  return (
    <group position={[0, h / 2, 0]}>
      {/* Tapered Cup Body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[topR / 2, botR / 2, h, 48]} />
        <meshPhysicalMaterial
          map={cupTexture || null}
          roughness={0.65}
          metalness={0.02}
        />
      </mesh>

      {/* Rolled Paper Top Lip */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <torusGeometry args={[topR / 2, 0.025, 16, 48]} />
        <meshPhysicalMaterial color={boxColor} roughness={0.6} />
      </mesh>

      {/* Snap-on Plastic Sip Lid */}
      <mesh position={[0, h / 2 + 0.07, 0]} castShadow>
        <cylinderGeometry args={[(topR / 2) * 1.04, (topR / 2) * 1.04, 0.1, 48]} />
        <meshPhysicalMaterial color="#1e293b" roughness={0.2} metalness={0.5} />
      </mesh>
    </group>
  )
}

// 8. Procedural Pillow Box Model (Kemasan Bantal)
function ContinuousPillowModel({
  length,
  width,
  height,
  boxColor,
  materialFinish,
  materialType,
  objects,
  selectedObjectId,
}: {
  length: number
  width: number
  height: number
  boxColor: string
  materialFinish: string
  materialType?: string
  objects: CanvasObject[]
  selectedObjectId: string | null
}) {
  const sx = length / 50
  const sy = height / 50
  const sz = width / 50

  const loadedImages = useImageCache(objects)

  const pillowTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    applyMaterialBackground(ctx, canvas.width, canvas.height, boxColor, materialFinish, materialType)

    const pxPerMmX = canvas.width / length
    const pxPerMmY = canvas.height / width

    objects.filter((o) => o.visible).forEach((obj) => {
      const cx = canvas.width / 2 + obj.posX * pxPerMmX
      const cy = canvas.height / 2 - obj.posY * pxPerMmY
      drawObject(ctx, obj, cx, cy, loadedImages, obj.id === selectedObjectId, pxPerMmX, pxPerMmY)
    })

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    return tex
  }, [boxColor, materialFinish, materialType, objects, selectedObjectId, loadedImages, length, width])

  return (
    <group position={[0, sy / 2, 0]}>
      {/* Convex Elliptical Pillow Body */}
      <mesh scale={[sx * 0.5, sy * 0.4, sz * 0.5]} castShadow receiveShadow>
        <sphereGeometry args={[1, 32, 24]} />
        <meshPhysicalMaterial
          map={pillowTexture || null}
          roughness={0.7}
          metalness={0.03}
        />
      </mesh>
    </group>
  )
}

// 9. Custom 3D Mesh Importer Model (GLTF / GLB / STL) with 3DPAKS-Style Auto-Fit, Parametric Scaling & Dieline Texture Sync
function CustomMeshModel({
  modelUrl,
  modelFormat,
  dielineSvgUrl,
  boxColor,
  materialFinish,
  materialType,
  length,
  width,
  height,
  objects,
  selectedObjectId,
  maxVisualBound = 1.25,
  modelScaleMultiplier = 1.0,
}: {
  modelUrl: string
  modelFormat?: string
  dielineSvgUrl?: string
  boxColor: string
  materialFinish: string
  materialType?: string
  length: number
  width: number
  height: number
  objects: CanvasObject[]
  selectedObjectId: string | null
  maxVisualBound?: number
  modelScaleMultiplier?: number
}) {
  const [stlGeometry, setStlGeometry] = useState<THREE.BufferGeometry | null>(null)
  const [gltfScene, setGltfScene] = useState<THREE.Group | null>(null)
  const [initialDims, setInitialDims] = useState<{
    width: number
    height: number
    depth: number
    normScale: number
  } | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [svgImage, setSvgImage] = useState<HTMLImageElement | null>(null)
  const [dielineTexture, setDielineTexture] = useState<THREE.CanvasTexture | null>(null)

  const loadedImages = useImageCache(objects)

  const isStl =
    (modelFormat && modelFormat.toLowerCase() === "stl") ||
    modelUrl.toLowerCase().includes(".stl") ||
    modelUrl.startsWith("data:model/stl") ||
    modelUrl.startsWith("data:application/sla")

  // 1. Preload 2D SVG Dieline for live 3D texture projection
  useEffect(() => {
    if (!dielineSvgUrl) {
      setSvgImage(null)
      return
    }
    let isMounted = true
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      if (isMounted) setSvgImage(img)
    }
    img.onerror = () => {
      // Fallback for raw SVG string or malformed data URL
      if (!dielineSvgUrl.startsWith("data:") && dielineSvgUrl.includes("<svg")) {
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(dielineSvgUrl)}`
      }
    }
    img.src = dielineSvgUrl
    return () => {
      isMounted = false
    }
  }, [dielineSvgUrl])

  // 2. Load 3D Model with True Bounding Box Auto-Fitting & Centering (Fixes invisible / clipped 3DPAKS models)
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setErrorMsg(null)

    if (isStl) {
      const loader = new STLLoader()
      loader.load(
        modelUrl,
        (geometry) => {
          if (!isMounted) return
          geometry.computeVertexNormals()
          geometry.center()
          geometry.computeBoundingBox()

          const size = new THREE.Vector3()
          if (geometry.boundingBox) {
            geometry.boundingBox.getSize(size)
          }

          const maxDim = Math.max(size.x, size.y, size.z, 1e-4)
          // Pacdora calibration: target dimension is ~1.55 world units in front of camera
          const normScale = maxDim > 0 ? 1.55 / maxDim : 1.0

          setInitialDims({
            width: size.x > 0 ? size.x : 1,
            height: size.y > 0 ? size.y : 1,
            depth: size.z > 0 ? size.z : 1,
            normScale,
          })
          setStlGeometry(geometry)
          setGltfScene(null)
          setLoading(false)
        },
        undefined,
        (err) => {
          if (!isMounted) return
          console.error("Error loading STL model:", err)
          setErrorMsg("Gagal memuat file STL 3D.")
          setLoading(false)
        }
      )
    } else {
      const loader = new GLTFLoader()
      loader.load(
        modelUrl,
        (gltf) => {
          if (!isMounted) return
          const scene = gltf.scene.clone()

          // Pacdora & Standard packaging calibration:
          // Measure true bounding box (e.g. 200mm height or 1280px mesh)
          const box = new THREE.Box3().setFromObject(scene)
          const size = new THREE.Vector3()
          box.getSize(size)
          const center = new THREE.Vector3()
          box.getCenter(center)

          // Center geometry to origin so camera orbits perfectly around center of mass
          scene.position.set(-center.x, -center.y, -center.z)

          const maxDim = Math.max(size.x, size.y, size.z, 1e-4)
          // Target display height in Three.js viewport is ~1.55 units
          const normScale = maxDim > 0 ? 1.55 / maxDim : 1.0

          const rootGroup = new THREE.Group()
          rootGroup.add(scene)

          setInitialDims({
            width: size.x > 0 ? size.x : 1,
            height: size.y > 0 ? size.y : 1,
            depth: size.z > 0 ? size.z : 1,
            normScale,
          })
          setGltfScene(rootGroup)
          setStlGeometry(null)
          setLoading(false)
        },
        undefined,
        (err) => {
          if (!isMounted) return
          console.error("Error loading GLTF/GLB model:", err)
          setErrorMsg("Gagal memuat file GLB/GLTF 3D. Pastikan format file valid.")
          setLoading(false)
        }
      )
    }

    return () => {
      isMounted = false
    }
  }, [modelUrl, isStl])

  const isCorrugated = materialType === "corrugated"
  const isKraft = materialFinish === "kraft" || materialType === "corrugated" || materialType === "kraft"
  const kraftBumpMap = isKraft ? getKraftBumpTexture(isCorrugated) : null
  const kraftBumpScale = isCorrugated ? 0.035 : 0.022

  // Dynamic Material Properties
  const roughness =
    isKraft ? 0.92 : materialFinish === "glossy" ? 0.08 : materialFinish === "metallic" ? 0.15 : materialFinish === "frosted" ? 0.4 : 0.65
  const metalness = isKraft ? 0.0 : materialFinish === "metallic" ? 0.88 : 0.04
  const clearcoat = isKraft ? 0.0 : materialFinish === "glossy" ? 0.95 : 0.0

  // 3. Dynamic Offscreen Texture Baking (Dieline SVG + Artwork Stickers -> 3D Mesh UV Bridge)
  useEffect(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 2048
    canvas.height = 2048
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // A. Base Material Finish & Color
    applyMaterialBackground(ctx, canvas.width, canvas.height, boxColor, materialFinish, materialType)

    // B. Draw 2D SVG Dieline (Cut & Crease Lines)
    if (svgImage && svgImage.complete && svgImage.naturalWidth > 0) {
      ctx.drawImage(svgImage, 0, 0, canvas.width, canvas.height)
    }

    // C. Draw Artwork Decals / Text / Logos placed by user
    const pxPerMm = canvas.width / Math.max(100, (length || 80) + (width || 60) * 2)
    objects.forEach((obj) => {
      if (!obj.visible) return
      let cx = canvas.width / 2
      let cy = canvas.height / 2

      if (obj.surfaceTarget === "front") {
        cx = canvas.width * 0.25
      } else if (obj.surfaceTarget === "right") {
        cx = canvas.width * 0.5
      } else if (obj.surfaceTarget === "back") {
        cx = canvas.width * 0.75
      } else if (obj.surfaceTarget === "left") {
        cx = canvas.width * 0.9
      } else if (obj.surfaceTarget === "top") {
        cy = canvas.height * 0.2
      }

      cx += (obj.posX || 0) * (pxPerMm * 0.35)
      cy -= (obj.posY || 0) * (pxPerMm * 0.35)

      drawObject(ctx, obj, cx, cy, loadedImages, false, pxPerMm * 0.35, pxPerMm * 0.35)
    })

    // D. Create Three.js Texture with 3DPAKS-Standard ColorSpace & FlipY=false
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.flipY = false
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.needsUpdate = true
    setDielineTexture(tex)

    return () => {
      tex.dispose()
    }
  }, [boxColor, materialFinish, materialType, svgImage, objects, loadedImages, length, width, height])

  // 4. Bind Texture to GLB (matches 3DPAKS loader: binds to LabelZone or primary body meshes)
  useEffect(() => {
    if (!gltfScene) return

    const applyMeshMaterial = (mesh: THREE.Mesh, tex: THREE.CanvasTexture | null) => {
      const updateSingleMat = (oldMat: THREE.Material) => {
        let mat: THREE.MeshPhysicalMaterial
        if (oldMat instanceof THREE.MeshPhysicalMaterial || oldMat instanceof THREE.MeshStandardMaterial) {
          mat = oldMat as THREE.MeshPhysicalMaterial
        } else {
          mat = new THREE.MeshPhysicalMaterial()
        }
        if (tex) {
          mat.map = tex
        } else {
          mat.color.set(boxColor)
        }
        mat.roughness = roughness
        mat.metalness = metalness
        mat.clearcoat = clearcoat
        if (isKraft && kraftBumpMap) {
          mat.bumpMap = kraftBumpMap
          mat.bumpScale = kraftBumpScale
        } else {
          mat.bumpMap = null
        }
        mat.side = THREE.DoubleSide
        mat.needsUpdate = true
        return mat
      }

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(updateSingleMat)
      } else if (mesh.material) {
        mesh.material = updateSingleMat(mesh.material)
      }
    }

    let boundLabelCount = 0
    gltfScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const name = (mesh.name || "").toLowerCase()
        mesh.castShadow = true
        mesh.receiveShadow = true

        const isLabelZone =
          name.includes("label") ||
          name.includes("decal") ||
          name.includes("art") ||
          name.includes("zone") ||
          name.includes("print")

        if (isLabelZone) {
          boundLabelCount++
          applyMeshMaterial(mesh, dielineTexture)
        }
      }
    })

    // If no dedicated label mesh found, bind to body packaging meshes (skipping cap/lid/closure)
    if (boundLabelCount === 0) {
      gltfScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          const name = (mesh.name || "").toLowerCase()
          const isCap =
            name.includes("cap") ||
            name.includes("lid") ||
            name.includes("cork") ||
            name.includes("stopper") ||
            name.includes("pump")

          if (!isCap) {
            applyMeshMaterial(mesh, dielineTexture)
          } else if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            mats.forEach((m) => {
              m.side = THREE.DoubleSide
            })
          }
        }
      })
    }
  }, [gltfScene, dielineTexture, boxColor, roughness, metalness, clearcoat, isKraft, kraftBumpMap, kraftBumpScale])

  // 5. 3DPAKS-Style Adaptive Scaling & Strict Max-Visual Bounding Cap
  // Normalizes 1280px assets, millimeter meshes, and meter models into a comfortable viewport size (~1.15 world units)
  const rawW = initialDims && initialDims.width > 0 ? initialDims.width : 1
  const rawH = initialDims && initialDims.height > 0 ? initialDims.height : 1
  const rawD = initialDims && initialDims.depth > 0 ? initialDims.depth : 1
  const rawMax = Math.max(rawW, rawH, rawD, 1e-4)

  // Target base visual dimension in Three.js world units (Pacdora-Style Prominent Zoom)
  const targetDefaultVisual = 1.55
  const baseNorm = targetDefaultVisual / rawMax

  let sx = baseNorm * modelScaleMultiplier
  let sy = baseNorm * modelScaleMultiplier
  let sz = baseNorm * modelScaleMultiplier

  // Check if user inputs custom dimensions (length, width, height)
  if (initialDims && length > 0 && width > 0 && height > 0) {
    const userMax = Math.max(length, width, height)
    const ratio = length / rawW
    // If the dimensions match the raw scale order of magnitude (within 0.15x to 6x):
    if (ratio >= 0.15 && ratio <= 6.0) {
      sx = (length / rawW) * baseNorm * modelScaleMultiplier
      sy = (height / rawH) * baseNorm * modelScaleMultiplier
      sz = (width / rawD) * baseNorm * modelScaleMultiplier
    } else {
      // Mesh was authored in pixels (e.g. 1280px) while inputs are in mm (or vice versa).
      // Modulate relative to userMax so user can still alter proportions without breaking model:
      sx = (length / userMax) * baseNorm * (rawMax / rawW) * modelScaleMultiplier
      sy = (height / userMax) * baseNorm * (rawMax / rawH) * modelScaleMultiplier
      sz = (width / userMax) * baseNorm * (rawMax / rawD) * modelScaleMultiplier
    }
  }

  // Calculate actual rendered visual dimensions in world units
  const visualX = rawW * Math.abs(sx)
  const visualY = rawH * Math.abs(sy)
  const visualZ = rawD * Math.abs(sz)
  const maxVisual = Math.max(visualX, visualY, visualZ)

  // STRICT PACDORA MAX BOUND CAP:
  // Guarantees that any 1280px asset will fill ~70-75% of viewport without overflowing
  const effectiveMaxBound = maxVisualBound > 0 ? maxVisualBound : 1.70
  const effectiveMinBound = 0.85

  let clampFactor = 1.0
  if (maxVisual > effectiveMaxBound) {
    clampFactor = effectiveMaxBound / maxVisual
  } else if (maxVisual < effectiveMinBound && maxVisual > 0) {
    clampFactor = effectiveMinBound / maxVisual
  }

  const finalScaleX = Math.max(1e-7, Number.isFinite(sx * clampFactor) ? sx * clampFactor : baseNorm)
  const finalScaleY = Math.max(1e-7, Number.isFinite(sy * clampFactor) ? sy * clampFactor : baseNorm)
  const finalScaleZ = Math.max(1e-7, Number.isFinite(sz * clampFactor) ? sz * clampFactor : baseNorm)

  if (loading) {
    return (
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#94a3b8" wireframe />
        </mesh>
      </group>
    )
  }

  if (errorMsg) {
    return (
      <group position={[0, 0, 0]}>
        <Text position={[0, 0, 0]} fontSize={0.09} color="#ef4444" anchorX="center" anchorY="middle">
          {errorMsg}
        </Text>
      </group>
    )
  }

  return (
    <group position={[0, 0, 0]} scale={[finalScaleX, finalScaleY, finalScaleZ]}>
      {isStl && stlGeometry ? (
        <mesh geometry={stlGeometry} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={boxColor}
            map={dielineTexture || undefined}
            roughness={roughness}
            metalness={metalness}
            clearcoat={clearcoat}
            bumpMap={isKraft ? kraftBumpMap : null}
            bumpScale={isKraft ? kraftBumpScale : 0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : gltfScene ? (
        <primitive object={gltfScene} />
      ) : null}
    </group>
  )
}

export default function PackagingCanvas({
  category,
  length,
  width,
  height,
  radius,
  boxColor,
  faceColors,
  materialFinish,
  materialType,
  model3dUrl,
  modelFormat,
  dielineSvgUrl,
  objects = [],
  selectedObjectId = null,
  onSelectObject,
  onUpdateSelectedObjectPos,
  showGrid,
  cameraView,
  openProgress = 0,
  canvasBackground = "#eaedf0",
  maxVisualBound = 1.25,
  modelScaleMultiplier = 1.0,
  exportGLBTrigger,
  exportGLBFileName,
  onExportGLBDone,
}: PackagingCanvasProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const modelGroupRef = useRef<THREE.Group>(null)
  const [orbitEnabled, setOrbitEnabled] = useState(true)
  const [isHoveringObject, setIsHoveringObject] = useState(false)
  const [modelBottomY, setModelBottomY] = useState(-0.65)

  return (
    <div
      className={`relative w-full h-full select-none overflow-hidden ${
        isHoveringObject ? "cursor-move" : "cursor-grab active:cursor-grabbing"
      }`}
      style={{ backgroundColor: canvasBackground }}
    >
      <Canvas shadows camera={{ position: [1.95, 1.25, 2.15], fov: 36 }}>
        <color attach="background" args={[canvasBackground]} />

        <CameraController view={cameraView} controlsRef={controlsRef} />

        {/* Realistic Studio Lighting & Procedural Environment Reflections (100% Offline / Zero Network Fetch) */}
        <ambientLight intensity={0.7} />
        <hemisphereLight args={["#ffffff", "#cbd5e1", 0.6]} />
        <directionalLight
          position={[6, 10, 6]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-6, 6, -4]} intensity={0.6} color="#e0f2fe" />
        <directionalLight position={[0, -4, 2]} intensity={0.2} color="#f8fafc" />

        {/* Procedural Lightformer reflections for glossy & metallic materials without downloading external HDR files */}
        <Environment resolution={256}>
          <group rotation={[-Math.PI / 3, 0, 1]}>
            <Lightformer form="circle" intensity={3} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
            <Lightformer form="ring" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
            <Lightformer form="rect" intensity={2} rotation-y={Math.PI / 2} position={[10, 1, 0]} scale={[10, 5, 1]} />
            <Lightformer form="rect" intensity={1.5} position={[-10, 2, 0]} rotation-y={-Math.PI / 2} scale={[10, 5, 1]} />
            <Lightformer form="rect" intensity={1} position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
          </group>
        </Environment>

        <GLBExportController
          trigger={exportGLBTrigger}
          modelRef={modelGroupRef}
          onExport={onExportGLBDone}
          fileName={exportGLBFileName}
        />

        <Center
          position={[0, 0, 0]}
          key={`${model3dUrl || category}`}
          cacheKey={`${model3dUrl || category}_${length}_${width}_${height}_${radius}_${openProgress}_${modelScaleMultiplier}`}
          onCentered={({ height: centeredH }) => {
            if (centeredH > 0) {
              // Perfectly place the shadow and grid plane flush at the bottom of the packaging mesh
              setModelBottomY(-centeredH / 2 - 0.003)
            }
          }}
        >
          <group ref={modelGroupRef}>
            {model3dUrl ? (
            <CustomMeshModel
              modelUrl={model3dUrl}
              modelFormat={modelFormat}
              dielineSvgUrl={dielineSvgUrl}
              boxColor={boxColor}
              materialFinish={materialFinish}
              materialType={materialType}
              length={length}
              width={width}
              height={height}
              objects={objects}
              selectedObjectId={selectedObjectId}
              maxVisualBound={maxVisualBound}
              modelScaleMultiplier={modelScaleMultiplier}
            />
          ) : category === "POUCH" ? (
            <ContinuousPouchModel
              length={length}
              width={width}
              height={height}
              boxColor={boxColor}
              materialFinish={materialFinish}
              materialType={materialType}
              objects={objects}
              selectedObjectId={selectedObjectId}
              onSelectObject={onSelectObject}
              onUpdateSelectedObjectPos={onUpdateSelectedObjectPos}
              setOrbitEnabled={setOrbitEnabled}
              setIsHoveringObject={setIsHoveringObject}
            />
          ) : category === "JAR" ? (
            <ContinuousJarModel
              radius={radius}
              height={height}
              boxColor={boxColor}
              materialFinish={materialFinish}
              materialType={materialType}
              objects={objects}
              selectedObjectId={selectedObjectId}
              onSelectObject={onSelectObject}
              onUpdateSelectedObjectPos={onUpdateSelectedObjectPos}
              setOrbitEnabled={setOrbitEnabled}
              setIsHoveringObject={setIsHoveringObject}
            />
          ) : category === "BOTTLE" ? (
            <ContinuousBottleModel
              radius={radius}
              height={height}
              boxColor={boxColor}
              materialFinish={materialFinish}
              materialType={materialType}
              objects={objects}
              selectedObjectId={selectedObjectId}
            />
          ) : category === "CAN" ? (
            <ContinuousCanModel
              radius={radius}
              height={height}
              boxColor={boxColor}
              materialFinish={materialFinish}
              materialType={materialType}
              objects={objects}
              selectedObjectId={selectedObjectId}
            />
          ) : category === "TRIANGLE" ? (
            <ContinuousTriangleModel
              length={length}
              width={width}
              height={height}
              boxColor={boxColor}
              materialFinish={materialFinish}
              materialType={materialType}
              objects={objects}
              selectedObjectId={selectedObjectId}
            />
          ) : category === "CUP" ? (
            <ContinuousCupModel
              radius={radius}
              height={height}
              boxColor={boxColor}
              materialFinish={materialFinish}
              materialType={materialType}
              objects={objects}
              selectedObjectId={selectedObjectId}
            />
          ) : category === "PILLOW" ? (
            <ContinuousPillowModel
              length={length}
              width={width}
              height={height}
              boxColor={boxColor}
              materialFinish={materialFinish}
              materialType={materialType}
              objects={objects}
              selectedObjectId={selectedObjectId}
            />
          ) : (
            <ContinuousBoxModel
              length={length}
              width={width}
              height={height}
              boxColor={boxColor}
              faceColors={faceColors}
              materialFinish={materialFinish}
              materialType={materialType}
              objects={objects}
              selectedObjectId={selectedObjectId}
              onSelectObject={onSelectObject}
              onUpdateSelectedObjectPos={onUpdateSelectedObjectPos}
              setOrbitEnabled={setOrbitEnabled}
              setIsHoveringObject={setIsHoveringObject}
              openProgress={openProgress}
            />
          )}
          </group>
        </Center>

        {showGrid && (
          <Grid
            renderOrder={-1}
            position={[0, modelBottomY - 0.001, 0]}
            infiniteGrid
            cellSize={0.2}
            cellThickness={0.5}
            cellColor="#e2e8f0"
            sectionSize={1.0}
            sectionThickness={1.0}
            sectionColor="#cbd5e1"
            fadeDistance={20}
          />
        )}

        <ContactShadows
          position={[0, modelBottomY, 0]}
          opacity={0.45}
          scale={8}
          blur={1.8}
          far={3.0}
          resolution={512}
          color="#0f172a"
        />

        <OrbitControls
          ref={controlsRef}
          enabled={orbitEnabled}
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minDistance={0.5}
          maxDistance={8}
          maxPolarAngle={Math.PI / 2 + 0.05}
        />
      </Canvas>
    </div>
  )
}
