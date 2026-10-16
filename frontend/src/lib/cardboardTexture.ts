// Photorealistic Pacdora-Style Natural Kraft Cardboard PBR Texture & Bump Map Generator
// Engineered to match Pacdora, Esko Studio, and physical packaging industry standards
// Eliminates artificial vertical plank/wood stripes in favor of authentic isotropic paper pulp

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

/**
 * Generates an isotropic tactile paper tooth bump map for realistic cardboard relief.
 * Simulates micro-roughness tooth, omnidirectional wood cellulose fibers, and recycled pulp flecks.
 * Free of artificial vertical fluting bands or wood plank lines.
 */
export function getCardboardBumpTexture(_isCorrugated: boolean = false): THREE.CanvasTexture {
  if (typeof document === "undefined") {
    // SSR Fallback
    return new THREE.CanvasTexture({} as any)
  }

  if (cachedKraftBumpTex) return cachedKraftBumpTex

  const canvas = document.createElement("canvas")
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return new THREE.CanvasTexture(canvas)
  }

  const rand = createPRNG(90210)

  // 1. Neutral mid-gray base (128 = zero displacement)
  ctx.fillStyle = "#808080"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 2. Tactile Wood & Cellulose Fiber Relief Strands (Omnidirectional / Isotropic 360°)
  const fiberCount = 6500
  for (let i = 0; i < fiberCount; i++) {
    const fx = rand() * canvas.width
    const fy = rand() * canvas.height
    const fLength = rand() * 11 + 3
    const angle = rand() * Math.PI * 2 // Fully isotropic, no vertical or horizontal bias
    const curvature = (rand() - 0.5) * 0.55
    const isRaised = rand() > 0.48

    ctx.beginPath()
    ctx.moveTo(fx, fy)
    const midX = fx + Math.cos(angle + curvature * 0.5) * (fLength * 0.5)
    const midY = fy + Math.sin(angle + curvature * 0.5) * (fLength * 0.5)
    const endX = fx + Math.cos(angle + curvature) * fLength
    const endY = fy + Math.sin(angle + curvature) * fLength

    ctx.quadraticCurveTo(midX, midY, endX, endY)
    ctx.strokeStyle = isRaised
      ? `rgba(220, 220, 220, ${rand() * 0.18 + 0.08})`
      : `rgba(45, 45, 45, ${rand() * 0.18 + 0.08})`
    ctx.lineWidth = rand() * 0.8 + 0.4
    ctx.stroke()
  }

  // 3. Recycled pulp flakes & flecks (tactile micro-relief indentations & raised specs)
  const speckCount = 3200
  for (let i = 0; i < speckCount; i++) {
    const sx = rand() * canvas.width
    const sy = rand() * canvas.height
    const sSize = rand() * 1.5 + 0.5
    const isRaised = rand() > 0.5
    ctx.fillStyle = isRaised
      ? `rgba(225, 225, 225, ${rand() * 0.22 + 0.10})`
      : `rgba(35, 35, 35, ${rand() * 0.22 + 0.10})`
    ctx.fillRect(sx, sy, sSize, sSize)
  }

  // 4. Fine unbleached paper grain stippling noise (micro-roughness tooth)
  ctx.fillStyle = "rgba(25, 25, 25, 0.06)"
  for (let i = 0; i < 7000; i++) {
    const rx = rand() * canvas.width
    const ry = rand() * canvas.height
    ctx.fillRect(rx, ry, 1, 1)
  }
  ctx.fillStyle = "rgba(235, 235, 235, 0.06)"
  for (let i = 0; i < 7000; i++) {
    const rx = rand() * canvas.width
    const ry = rand() * canvas.height
    ctx.fillRect(rx, ry, 1, 1)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 3)
  tex.needsUpdate = true

  cachedKraftBumpTex = tex
  return tex
}

/**
 * Draws photorealistic Pacdora-style natural Kraft cardboard background onto a 2D canvas context.
 * Multi-layer procedural paper pulp rendering:
 * 1. Authentic warm unbleached natural kraft baseline tone (#C6A57F).
 * 2. Multi-octave organic pulp cloud mottling (warm amber and golden raw umber density depth).
 * 3. Thousands of curved wood cellulose fiber strands distributed isotropically (all 360° directions).
 * 4. Micro recycled paper flecks, dark lignin bits, and straw cellulose.
 * 5. Micro-grain tactile paper tooth stippling noise.
 * 
 * Free of artificial vertical wood planks or flute stripes.
 */
export function applyCardboardBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  options: CardboardOptions = {}
): void {
  const isKraft =
    options.materialFinish === "kraft" ||
    options.isCorrugated ||
    options.materialType === "kraft" ||
    options.materialType === "corrugated" ||
    !options.materialFinish

  // Base natural kraft color matching Pacdora (#C6A57F) if color is white/empty/default
  let baseColor = options.baseColor
  if (
    !baseColor ||
    baseColor.toLowerCase() === "#ffffff" ||
    baseColor.toLowerCase() === "#d97706" ||
    baseColor.toLowerCase() === "#ba8852" ||
    baseColor.toLowerCase() === "#c49866"
  ) {
    baseColor = "#c6a57f" // Exact Pacdora Natural Kraft tone
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

  const rand = createPRNG(options.seed || 4242)

  // 2. Multi-octave organic unbleached pulp cloud mottling (natural paper density variation)
  // Macro clouds
  const macroCount = Math.max(30, Math.floor((w * h) / 36000))
  for (let i = 0; i < macroCount; i++) {
    const bx = rand() * w
    const by = rand() * h
    const br = rand() * 160 + 75
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br)
    const isDark = rand() > 0.45
    grad.addColorStop(0, isDark ? "rgba(56, 28, 8, 0.045)" : "rgba(255, 245, 222, 0.055)")
    grad.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(bx, by, br, 0, Math.PI * 2)
    ctx.fill()
  }

  // Meso clouds
  const mesoCount = Math.max(50, Math.floor((w * h) / 18000))
  for (let i = 0; i < mesoCount; i++) {
    const bx = rand() * w
    const by = rand() * h
    const br = rand() * 70 + 25
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br)
    const isDark = rand() > 0.5
    grad.addColorStop(0, isDark ? "rgba(48, 24, 6, 0.038)" : "rgba(255, 248, 228, 0.045)")
    grad.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(bx, by, br, 0, Math.PI * 2)
    ctx.fill()
  }

  // 3. Realistic Wood & Cellulose Fiber Strands (Isotropic / Omnidirectional 360°)
  // In real Kraft paper, pulp fibers settle randomly in all directions
  const fiberCount = Math.max(4200, Math.floor((w * h) / 280))
  for (let i = 0; i < fiberCount; i++) {
    const fx = rand() * w
    const fy = rand() * h
    const fLength = rand() * 10 + 3
    const angle = rand() * Math.PI * 2 // Fully isotropic
    const curvature = (rand() - 0.5) * 0.55
    const fiberType = rand()

    ctx.beginPath()
    ctx.moveTo(fx, fy)
    const midX = fx + Math.cos(angle + curvature * 0.5) * (fLength * 0.5)
    const midY = fy + Math.sin(angle + curvature * 0.5) * (fLength * 0.5)
    const endX = fx + Math.cos(angle + curvature) * fLength
    const endY = fy + Math.sin(angle + curvature) * fLength

    ctx.quadraticCurveTo(midX, midY, endX, endY)

    if (fiberType < 0.44) {
      // Dark unbleached lignin wood fiber
      ctx.strokeStyle = `rgba(45, 20, 6, ${rand() * 0.14 + 0.04})`
      ctx.lineWidth = rand() * 0.75 + 0.35
    } else if (fiberType < 0.76) {
      // Light bleached cellulose fiber
      ctx.strokeStyle = `rgba(255, 250, 235, ${rand() * 0.16 + 0.05})`
      ctx.lineWidth = rand() * 0.75 + 0.35
    } else {
      // Warm golden raw umber lignin fiber
      ctx.strokeStyle = `rgba(135, 68, 22, ${rand() * 0.10 + 0.03})`
      ctx.lineWidth = rand() * 0.65 + 0.3
    }
    ctx.stroke()
  }

  // 4. Recycled pulp flecks & dark specks
  const speckCount = Math.max(2400, Math.floor((w * h) / 520))
  for (let i = 0; i < speckCount; i++) {
    const sx = rand() * w
    const sy = rand() * h
    const sSize = rand() * 1.6 + 0.5
    const speckType = rand()
    if (speckType < 0.45) {
      ctx.fillStyle = `rgba(38, 16, 4, ${rand() * 0.22 + 0.08})`
    } else if (speckType < 0.8) {
      ctx.fillStyle = `rgba(255, 255, 255, ${rand() * 0.22 + 0.08})`
    } else {
      ctx.fillStyle = `rgba(150, 78, 22, ${rand() * 0.16 + 0.06})`
    }
    ctx.fillRect(sx, sy, sSize, sSize)
  }

  // 5. Micro-grain paper pulp stippling noise (paper porosity tooth)
  ctx.fillStyle = "rgba(25, 12, 4, 0.025)"
  for (let i = 0; i < 6000; i++) {
    const rx = rand() * w
    const ry = rand() * h
    ctx.fillRect(rx, ry, 1, 1)
  }
  ctx.fillStyle = "rgba(255, 255, 255, 0.025)"
  for (let i = 0; i < 6000; i++) {
    const rx = rand() * w
    const ry = rand() * h
    ctx.fillRect(rx, ry, 1, 1)
  }

  ctx.restore()
}
