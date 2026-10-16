// Photorealistic Natural Kraft & Recycled Corrugated Cardboard PBR Texture & Bump Map Generator
// Engineered to match Pacdora, Esko Studio, and physical packaging industry standards
// Distinguishes Brown Kraft Paper (smooth, fine grain, golden-tan) from Corrugated Cardboard (earthy, recycled fiberboard)
// Completely free of artificial vertical wood planks or linear stripes

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
 * - Brown Kraft: micro-fine paper tooth, subtle fiber relief (smooth paper touch).
 * - Corrugated: tactile recycled paperboard relief, deeper tooth, recycled fiber impressions.
 * Completely free of artificial vertical fluting bands or wood plank lines.
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

  // 2. Tactile Wood & Cellulose Fiber Relief Strands (Omnidirectional / Isotropic 360°)
  // Corrugated has denser, more pronounced recycled fiber relief
  const fiberCount = isCorrugated ? 7500 : 4200
  for (let i = 0; i < fiberCount; i++) {
    const fx = rand() * canvas.width
    const fy = rand() * canvas.height
    const fLength = isCorrugated ? (rand() * 12 + 4) : (rand() * 8 + 3)
    const angle = rand() * Math.PI * 2 // Fully isotropic
    const curvature = (rand() - 0.5) * 0.55
    const isRaised = rand() > 0.48

    ctx.beginPath()
    ctx.moveTo(fx, fy)
    const midX = fx + Math.cos(angle + curvature * 0.5) * (fLength * 0.5)
    const midY = fy + Math.sin(angle + curvature * 0.5) * (fLength * 0.5)
    const endX = fx + Math.cos(angle + curvature) * fLength
    const endY = fy + Math.sin(angle + curvature) * fLength

    ctx.quadraticCurveTo(midX, midY, endX, endY)
    const alphaDelta = isCorrugated ? 0.08 : 0.04
    ctx.strokeStyle = isRaised
      ? `rgba(225, 225, 225, ${rand() * 0.20 + 0.08 + alphaDelta})`
      : `rgba(40, 40, 40, ${rand() * 0.20 + 0.08 + alphaDelta})`
    ctx.lineWidth = isCorrugated ? (rand() * 0.9 + 0.45) : (rand() * 0.6 + 0.35)
    ctx.stroke()
  }

  // 3. Recycled pulp flakes & flecks (tactile micro-relief indentations & raised specs)
  // Corrugated board has rich recycled pulp flecks (wood bits, straw fibers)
  const speckCount = isCorrugated ? 3800 : 1200
  for (let i = 0; i < speckCount; i++) {
    const sx = rand() * canvas.width
    const sy = rand() * canvas.height
    const sSize = isCorrugated ? (rand() * 1.8 + 0.6) : (rand() * 1.2 + 0.4)
    const isRaised = rand() > 0.5
    ctx.fillStyle = isRaised
      ? `rgba(230, 230, 230, ${rand() * 0.24 + 0.12})`
      : `rgba(30, 30, 30, ${rand() * 0.24 + 0.12})`
    ctx.fillRect(sx, sy, sSize, sSize)
  }

  // 4. Paper tooth stippling noise (paper porosity tooth)
  // Corrugated has a rougher, more tactile paper tooth than smooth kraft paper
  const stippleCount = isCorrugated ? 10000 : 5000
  const stippleOpacity = isCorrugated ? 0.08 : 0.04
  ctx.fillStyle = `rgba(20, 20, 20, ${stippleOpacity})`
  for (let i = 0; i < stippleCount; i++) {
    const rx = rand() * canvas.width
    const ry = rand() * canvas.height
    ctx.fillRect(rx, ry, 1, 1)
  }
  ctx.fillStyle = `rgba(240, 240, 240, ${stippleOpacity})`
  for (let i = 0; i < stippleCount; i++) {
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
 * Draws photorealistic paperboard background onto a 2D canvas context.
 * Clearly differentiates:
 * 1. Brown Kraft Paper: Lighter golden-tan (#C6A57F), smooth, refined, delicate micro-fibers.
 * 2. Corrugated Cardboard: Earthier, deeper tone (#B8864E), rich recycled pulp mottling, raw cellulose flecks, sturdy cardboard tooth.
 * 
 * Free of artificial vertical wood planks or flute stripes.
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

  // Base colors:
  // - Corrugated: Earthy, warm, unbleached recycled testliner cardboard (#B8864E)
  // - Brown Kraft Paper: Smooth, golden-tan virgin kraft paper (#C6A57F)
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
    baseColor = isCorrugated ? "#b8864e" : "#c6a57f"
  }

  // 1. Solid base tone
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, w, h)

  if (!isKraft) {
    // Clean matte art paperboard subtle pulp grain
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.015)"
    for (let i = 0; i < 3000; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
    }
    ctx.restore()
    return
  }

  ctx.save()

  const rand = createPRNG(options.seed || (isCorrugated ? 8888 : 4242))

  // 2. Multi-octave organic unbleached pulp cloud mottling (natural paper density variation)
  // Corrugated cardboard has stronger organic mottling (recycled pulp cushioning)
  const macroCount = isCorrugated
    ? Math.max(40, Math.floor((w * h) / 28000))
    : Math.max(25, Math.floor((w * h) / 42000))

  for (let i = 0; i < macroCount; i++) {
    const bx = rand() * w
    const by = rand() * h
    const br = isCorrugated ? (rand() * 180 + 80) : (rand() * 140 + 60)
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br)
    const isDark = rand() > 0.46
    const darkAlpha = isCorrugated ? "0.065" : "0.038"
    const lightAlpha = isCorrugated ? "0.070" : "0.045"
    grad.addColorStop(0, isDark ? `rgba(50, 24, 6, ${darkAlpha})` : `rgba(255, 245, 218, ${lightAlpha})`)
    grad.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(bx, by, br, 0, Math.PI * 2)
    ctx.fill()
  }

  // Meso clouds
  const mesoCount = isCorrugated
    ? Math.max(65, Math.floor((w * h) / 14000))
    : Math.max(35, Math.floor((w * h) / 22000))

  for (let i = 0; i < mesoCount; i++) {
    const bx = rand() * w
    const by = rand() * h
    const br = isCorrugated ? (rand() * 80 + 30) : (rand() * 60 + 20)
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br)
    const isDark = rand() > 0.5
    const darkAlpha = isCorrugated ? "0.055" : "0.030"
    const lightAlpha = isCorrugated ? "0.060" : "0.035"
    grad.addColorStop(0, isDark ? `rgba(45, 20, 5, ${darkAlpha})` : `rgba(255, 248, 225, ${lightAlpha})`)
    grad.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(bx, by, br, 0, Math.PI * 2)
    ctx.fill()
  }

  // 3. Realistic Wood & Cellulose Fiber Strands (Isotropic / Omnidirectional 360°)
  // Corrugated has denser, longer recycled fibers; Kraft Paper has fine, subtle fibers
  const fiberCount = isCorrugated
    ? Math.max(5500, Math.floor((w * h) / 210))
    : Math.max(3200, Math.floor((w * h) / 360))

  for (let i = 0; i < fiberCount; i++) {
    const fx = rand() * w
    const fy = rand() * h
    const fLength = isCorrugated ? (rand() * 13 + 4) : (rand() * 8 + 3)
    const angle = rand() * Math.PI * 2 // Fully isotropic omnidirectional
    const curvature = (rand() - 0.5) * 0.55
    const fiberType = rand()

    ctx.beginPath()
    ctx.moveTo(fx, fy)
    const midX = fx + Math.cos(angle + curvature * 0.5) * (fLength * 0.5)
    const midY = fy + Math.sin(angle + curvature * 0.5) * (fLength * 0.5)
    const endX = fx + Math.cos(angle + curvature) * fLength
    const endY = fy + Math.sin(angle + curvature) * fLength

    ctx.quadraticCurveTo(midX, midY, endX, endY)

    if (fiberType < 0.46) {
      // Dark unbleached lignin wood fiber
      const op = isCorrugated ? (rand() * 0.18 + 0.06) : (rand() * 0.10 + 0.03)
      ctx.strokeStyle = `rgba(42, 18, 5, ${op})`
      ctx.lineWidth = isCorrugated ? (rand() * 0.85 + 0.4) : (rand() * 0.6 + 0.3)
    } else if (fiberType < 0.78) {
      // Light bleached cellulose fiber
      const op = isCorrugated ? (rand() * 0.20 + 0.07) : (rand() * 0.12 + 0.04)
      ctx.strokeStyle = `rgba(255, 250, 235, ${op})`
      ctx.lineWidth = isCorrugated ? (rand() * 0.85 + 0.4) : (rand() * 0.6 + 0.3)
    } else {
      // Warm golden raw umber lignin fiber
      const op = isCorrugated ? (rand() * 0.15 + 0.05) : (rand() * 0.08 + 0.02)
      ctx.strokeStyle = `rgba(140, 72, 20, ${op})`
      ctx.lineWidth = isCorrugated ? (rand() * 0.75 + 0.35) : (rand() * 0.5 + 0.25)
    }
    ctx.stroke()
  }

  // 4. Recycled pulp flecks & dark specks
  // Corrugated board features rich recycled carton bits, specks, and straw flakes
  // Kraft paper has minimal, refined flecks
  const speckCount = isCorrugated
    ? Math.max(3000, Math.floor((w * h) / 420))
    : Math.max(900, Math.floor((w * h) / 1400))

  for (let i = 0; i < speckCount; i++) {
    const sx = rand() * w
    const sy = rand() * h
    const sSize = isCorrugated ? (rand() * 1.8 + 0.6) : (rand() * 1.2 + 0.4)
    const speckType = rand()
    if (speckType < 0.48) {
      // Dark lignin speck
      const op = isCorrugated ? (rand() * 0.28 + 0.10) : (rand() * 0.16 + 0.06)
      ctx.fillStyle = `rgba(35, 14, 3, ${op})`
    } else if (speckType < 0.8) {
      // Light unbleached flake
      const op = isCorrugated ? (rand() * 0.26 + 0.10) : (rand() * 0.16 + 0.06)
      ctx.fillStyle = `rgba(255, 255, 255, ${op})`
    } else {
      // Straw raw pulp speck
      const op = isCorrugated ? (rand() * 0.22 + 0.08) : (rand() * 0.12 + 0.04)
      ctx.fillStyle = `rgba(160, 85, 22, ${op})`
    }
    ctx.fillRect(sx, sy, sSize, sSize)
  }

  // 5. Micro-grain paper pulp stippling noise (paper porosity tooth)
  const stippleDots = isCorrugated ? 8000 : 4000
  const stippleOp = isCorrugated ? 0.035 : 0.020

  ctx.fillStyle = `rgba(20, 10, 3, ${stippleOp})`
  for (let i = 0; i < stippleDots; i++) {
    const rx = rand() * w
    const ry = rand() * h
    ctx.fillRect(rx, ry, 1, 1)
  }
  ctx.fillStyle = `rgba(255, 255, 255, ${stippleOp})`
  for (let i = 0; i < stippleDots; i++) {
    const rx = rand() * w
    const ry = rand() * h
    ctx.fillRect(rx, ry, 1, 1)
  }

  ctx.restore()
}
