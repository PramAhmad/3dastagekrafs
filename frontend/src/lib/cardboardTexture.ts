// Photorealistic Aesthetic Natural Kraft & Corrugated Cardboard PBR Texture & Bump Map Generator
// Engineered to match Pacdora, high-end Apple/D2C unboxing aesthetics, and packaging standards
// Clean, aesthetic, warm golden tones — free of dirty/moldy spots ("bulukan") and vertical stripes

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
 * Generates an isotropic tactile paper tooth bump map for realistic cardboard relief.
 * - Brown Kraft: micro-fine paper tooth, subtle fiber relief (smooth satin paper touch).
 * - Corrugated: tactile clean packaging board tooth, subtle fiber impressions.
 * Completely free of dirty pits, moldy flecks, and vertical fluting lines.
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
  // Smooth, continuous fibers without harsh dark pits
  const fiberCount = isCorrugated ? 5200 : 3600
  for (let i = 0; i < fiberCount; i++) {
    const fx = rand() * canvas.width
    const fy = rand() * canvas.height
    const fLength = isCorrugated ? (rand() * 10 + 3) : (rand() * 7 + 3)
    const angle = rand() * Math.PI * 2 // Fully isotropic
    const curvature = (rand() - 0.5) * 0.5
    const isRaised = rand() > 0.48

    ctx.beginPath()
    ctx.moveTo(fx, fy)
    const midX = fx + Math.cos(angle + curvature * 0.5) * (fLength * 0.5)
    const midY = fy + Math.sin(angle + curvature * 0.5) * (fLength * 0.5)
    const endX = fx + Math.cos(angle + curvature) * fLength
    const endY = fy + Math.sin(angle + curvature) * fLength

    ctx.quadraticCurveTo(midX, midY, endX, endY)
    const alpha = isCorrugated ? (rand() * 0.12 + 0.05) : (rand() * 0.08 + 0.04)
    ctx.strokeStyle = isRaised
      ? `rgba(215, 215, 215, ${alpha})`
      : `rgba(60, 60, 60, ${alpha})`
    ctx.lineWidth = isCorrugated ? (rand() * 0.7 + 0.35) : (rand() * 0.5 + 0.3)
    ctx.stroke()
  }

  // 3. Tactile micro-paper tooth stippling noise (smooth, luxurious paper tooth)
  const stippleDots = isCorrugated ? 7000 : 4000
  const stippleOpacity = isCorrugated ? 0.04 : 0.025
  ctx.fillStyle = `rgba(40, 40, 40, ${stippleOpacity})`
  for (let i = 0; i < stippleDots; i++) {
    const rx = rand() * canvas.width
    const ry = rand() * canvas.height
    ctx.fillRect(rx, ry, 1, 1)
  }
  ctx.fillStyle = `rgba(220, 220, 220, ${stippleOpacity})`
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
 * Draws clean, aesthetic photorealistic cardboard background onto a 2D canvas context.
 * Differentiates:
 * 1. Brown Kraft Paper: Lighter golden sand (#CBA578), smooth, refined, satin touch.
 * 2. Corrugated Cardboard: Warm golden camel (#C29662), sturdy packaging board, subtle tooth.
 * 
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

  // Clean, aesthetic warm packaging tones:
  // - Corrugated: Warm golden camel cardboard (#C29662)
  // - Brown Kraft Paper: Warm golden sand paper (#CBA578)
  let baseColor = options.baseColor
  if (
    !baseColor ||
    baseColor.toLowerCase() === "#ffffff" ||
    baseColor.toLowerCase() === "#d97706" ||
    baseColor.toLowerCase() === "#ba8852" ||
    baseColor.toLowerCase() === "#c49866" ||
    baseColor.toLowerCase() === "#c6a57f" ||
    baseColor.toLowerCase() === "#b8864e"
  ) {
    baseColor = isCorrugated ? "#c29662" : "#cba578"
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

  // 2. Soft, warm lighting glow & gentle paper density variation (Clean & Radiant - NO dirty dark blotches!)
  const cloudCount = isCorrugated
    ? Math.max(24, Math.floor((w * h) / 36000))
    : Math.max(16, Math.floor((w * h) / 48000))

  for (let i = 0; i < cloudCount; i++) {
    const bx = rand() * w
    const by = rand() * h
    const br = isCorrugated ? (rand() * 160 + 80) : (rand() * 130 + 70)
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br)
    const isHighlight = rand() > 0.38
    if (isHighlight) {
      grad.addColorStop(0, "rgba(255, 248, 225, 0.065)") // Warm creamy glow
      grad.addColorStop(1, "rgba(255, 248, 225, 0.0)")
    } else {
      grad.addColorStop(0, "rgba(120, 75, 25, 0.035)") // Soft warm amber depth
      grad.addColorStop(1, "rgba(120, 75, 25, 0.0)")
    }
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(bx, by, br, 0, Math.PI * 2)
    ctx.fill()
  }

  // 3. Delicate Organic Paper Fibers (Ultra-fine, isotropic 360° - NO thick black squiggles!)
  const fiberCount = isCorrugated
    ? Math.max(4500, Math.floor((w * h) / 250))
    : Math.max(3200, Math.floor((w * h) / 360))

  for (let i = 0; i < fiberCount; i++) {
    const fx = rand() * w
    const fy = rand() * h
    const fLength = isCorrugated ? (rand() * 9 + 3) : (rand() * 7 + 3)
    const angle = rand() * Math.PI * 2 // Fully isotropic
    const curvature = (rand() - 0.5) * 0.5
    const isLight = rand() > 0.45

    ctx.beginPath()
    ctx.moveTo(fx, fy)
    const midX = fx + Math.cos(angle + curvature * 0.5) * (fLength * 0.5)
    const midY = fy + Math.sin(angle + curvature * 0.5) * (fLength * 0.5)
    const endX = fx + Math.cos(angle + curvature) * fLength
    const endY = fy + Math.sin(angle + curvature) * fLength

    ctx.quadraticCurveTo(midX, midY, endX, endY)

    if (isLight) {
      // Light unbleached silk cellulose fiber
      ctx.strokeStyle = `rgba(255, 250, 235, ${rand() * 0.12 + 0.04})`
      ctx.lineWidth = rand() * 0.6 + 0.3
    } else {
      // Warm amber-gold wood fiber (clean, not dirty black!)
      ctx.strokeStyle = `rgba(135, 82, 28, ${rand() * 0.08 + 0.03})`
      ctx.lineWidth = rand() * 0.55 + 0.3
    }
    ctx.stroke()
  }

  // 4. Fine tactile paper tooth stippling noise (micro-porosity for tactile feel)
  const stippleDots = isCorrugated ? 6000 : 3500
  const stippleAlpha = isCorrugated ? 0.025 : 0.016

  ctx.fillStyle = `rgba(60, 35, 10, ${stippleAlpha})`
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
