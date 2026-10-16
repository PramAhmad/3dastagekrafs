// Photorealistic Industrial Packaging Grade Kraft & Corrugated Cardboard Texture & Bump Generator
// Color & micro-texture calibration from physical corrugated packaging standards
// Base color: #B59D7B (Natural desaturated warm raw cardboard grey-beige)

import * as THREE from "three"

export interface CardboardOptions {
  baseColor?: string
  materialFinish?: string
  materialType?: string
  isCorrugated?: boolean
  orientation?: "vertical" | "horizontal"
  seed?: number
}

// Pseudo-random number generator (Mulberry32) for reproducible, non-flickering texture synthesis
function createPRNG(seed: number = 1337) {
  let a = seed >>> 0
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let cachedKraftBumpTex: THREE.CanvasTexture | null = null
let cachedCorrugatedBumpTex: THREE.CanvasTexture | null = null

/**
 * Generates an authentic tactile paper tooth bump map matching packaging industry PBR specs.
 * Fine isotropic paper tooth, delicate fiber micro-relief, completely clean without moldy spots or vertical stripes.
 */
export function getCardboardBumpTexture(isCorrugated: boolean = false): THREE.CanvasTexture {
  if (typeof document === "undefined") {
    // SSR Fallback
    return new THREE.CanvasTexture({} as any)
  }

  if (isCorrugated && cachedCorrugatedBumpTex) return cachedCorrugatedBumpTex
  if (!isCorrugated && cachedKraftBumpTex) return cachedKraftBumpTex

  const canvas = document.createElement("canvas")
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return new THREE.CanvasTexture(canvas)
  }

  const rand = createPRNG(isCorrugated ? 8080 : 90210)

  // 1. Neutral mid-gray base (128 = zero displacement)
  ctx.fillStyle = "#808080"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 2. Delicate Wood & Cellulose Fiber Relief Strands (Omnidirectional / Isotropic 360°)
  const fiberCount = isCorrugated ? 4600 : 3400
  for (let i = 0; i < fiberCount; i++) {
    const fx = rand() * canvas.width
    const fy = rand() * canvas.height
    const fLength = isCorrugated ? (rand() * 9 + 3) : (rand() * 7 + 3)
    const angle = rand() * Math.PI * 2 // Fully isotropic
    const curvature = (rand() - 0.5) * 0.45
    const isRaised = rand() > 0.48

    ctx.beginPath()
    ctx.moveTo(fx, fy)
    const midX = fx + Math.cos(angle + curvature * 0.5) * (fLength * 0.5)
    const midY = fy + Math.sin(angle + curvature * 0.5) * (fLength * 0.5)
    const endX = fx + Math.cos(angle + curvature) * fLength
    const endY = fy + Math.sin(angle + curvature) * fLength

    ctx.quadraticCurveTo(midX, midY, endX, endY)
    const alpha = isCorrugated ? (rand() * 0.10 + 0.04) : (rand() * 0.07 + 0.03)
    ctx.strokeStyle = isRaised
      ? `rgba(215, 215, 215, ${alpha})`
      : `rgba(65, 65, 65, ${alpha})`
    ctx.lineWidth = isCorrugated ? (rand() * 0.65 + 0.3) : (rand() * 0.5 + 0.25)
    ctx.stroke()
  }

  // 3. Tactile micro-paper tooth stippling noise (smooth, clean paper tooth)
  const stippleDots = isCorrugated ? 6000 : 3500
  const stippleOpacity = isCorrugated ? 0.035 : 0.022
  ctx.fillStyle = `rgba(45, 45, 45, ${stippleOpacity})`
  for (let i = 0; i < stippleDots; i++) {
    const rx = rand() * canvas.width
    const ry = rand() * canvas.height
    ctx.fillRect(rx, ry, 1, 1)
  }
  ctx.fillStyle = `rgba(215, 215, 215, ${stippleOpacity})`
  for (let i = 0; i < stippleDots; i++) {
    const rx = rand() * canvas.width
    const ry = rand() * canvas.height
    ctx.fillRect(rx, ry, 1, 1)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 3)
  tex.needsUpdate = true

  if (isCorrugated) {
    cachedCorrugatedBumpTex = tex
  } else {
    cachedKraftBumpTex = tex
  }
  return tex
}

/**
 * Draws photorealistic packaging cardboard background onto a 2D canvas context.
 * Calibrated color match (#B59D7B) and clean paperboard pulp texture.
 * Free of dirty stains, moldy specks ("bulukan"), and vertical stripes.
 */
export function applyCardboardBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  options: CardboardOptions = {}
): void {
  const isCorrugated =
    options.isCorrugated ||
    options.materialType === "corrugated" ||
    options.materialFinish === "corrugated"

  const isKraft =
    isCorrugated ||
    options.materialFinish === "kraft" ||
    options.materialType === "kraft" ||
    !options.materialFinish

  // Industrial PBR baseline tones:
  // Corrugated Cardboard: #B58A63 (Kardus tebal/gelap)
  // Brown Kraft Paper: #C6A07A (Eco Kraft)
  let baseColor = options.baseColor
  if (
    !baseColor ||
    baseColor.toLowerCase() === "#ffffff" ||
    baseColor.toLowerCase() === "#d97706" ||
    baseColor.toLowerCase() === "#ba8852" ||
    baseColor.toLowerCase() === "#c49866" ||
    baseColor.toLowerCase() === "#c6a57f" ||
    baseColor.toLowerCase() === "#b8864e" ||
    baseColor.toLowerCase() === "#c29662" ||
    baseColor.toLowerCase() === "#cba578" ||
    baseColor.toLowerCase() === "#b59d7b" ||
    baseColor.toLowerCase() === "#b09673"
  ) {
    baseColor = isCorrugated ? "#B58A63" : "#C6A07A"
  }

  // 1. Solid base tone
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, w, h)

  if (!isKraft) {
    // Clean matte art paperboard subtle pulp grain
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.012)"
    for (let i = 0; i < 2500; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
    }
    ctx.restore()
    return
  }

  ctx.save()

  const rand = createPRNG(options.seed || (isCorrugated ? 8888 : 4242))

  // 2. Soft, natural paper density clouds (Soft cream & subtle khaki depth - NO dirty dark blotches!)
  const cloudCount = isCorrugated
    ? Math.max(22, Math.floor((w * h) / 38000))
    : Math.max(16, Math.floor((w * h) / 48000))

  for (let i = 0; i < cloudCount; i++) {
    const bx = rand() * w
    const by = rand() * h
    const br = isCorrugated ? (rand() * 150 + 75) : (rand() * 130 + 65)
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br)
    const isHighlight = rand() > 0.4
    if (isHighlight) {
      grad.addColorStop(0, "rgba(255, 250, 235, 0.055)") // Warm creamy glow
      grad.addColorStop(1, "rgba(255, 250, 235, 0.0)")
    } else {
      grad.addColorStop(0, "rgba(90, 68, 35, 0.030)") // Subtle khaki depth
      grad.addColorStop(1, "rgba(90, 68, 35, 0.0)")
    }
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(bx, by, br, 0, Math.PI * 2)
    ctx.fill()
  }

  // 3. Delicate Organic Paper Fibers (Ultra-fine, isotropic 360° - NO thick black squiggles!)
  const fiberCount = isCorrugated
    ? Math.max(4000, Math.floor((w * h) / 280))
    : Math.max(3000, Math.floor((w * h) / 360))

  for (let i = 0; i < fiberCount; i++) {
    const fx = rand() * w
    const fy = rand() * h
    const fLength = isCorrugated ? (rand() * 9 + 3) : (rand() * 7 + 3)
    const angle = rand() * Math.PI * 2 // Fully isotropic
    const curvature = (rand() - 0.5) * 0.45
    const isLight = rand() > 0.48

    ctx.beginPath()
    ctx.moveTo(fx, fy)
    const midX = fx + Math.cos(angle + curvature * 0.5) * (fLength * 0.5)
    const midY = fy + Math.sin(angle + curvature * 0.5) * (fLength * 0.5)
    const endX = fx + Math.cos(angle + curvature) * fLength
    const endY = fy + Math.sin(angle + curvature) * fLength

    ctx.quadraticCurveTo(midX, midY, endX, endY)

    if (isLight) {
      // Light unbleached silk cellulose fiber
      ctx.strokeStyle = `rgba(255, 252, 240, ${rand() * 0.09 + 0.03})`
      ctx.lineWidth = rand() * 0.55 + 0.25
    } else {
      // Raw khaki wood fiber (clean, not dirty black!)
      ctx.strokeStyle = `rgba(110, 85, 50, ${rand() * 0.07 + 0.02})`
      ctx.lineWidth = rand() * 0.50 + 0.25
    }
    ctx.stroke()
  }

  // 4. Fine tactile paper tooth stippling noise (micro-porosity for tactile feel)
  const stippleDots = isCorrugated ? 5500 : 3200
  const stippleAlpha = isCorrugated ? 0.022 : 0.015

  ctx.fillStyle = `rgba(50, 38, 20, ${stippleAlpha})`
  for (let i = 0; i < stippleDots; i++) {
    const rx = rand() * w
    const ry = rand() * h
    ctx.fillRect(rx, ry, 1, 1)
  }
  ctx.fillStyle = `rgba(255, 255, 255, ${stippleAlpha})`
  for (let i = 0; i < stippleDots; i++) {
    const rx = rand() * w
    const ry = rand() * h
    ctx.fillRect(rx, ry, 1, 1)
  }

  ctx.restore()
}
