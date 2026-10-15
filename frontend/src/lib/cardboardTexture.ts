// Photorealistic Kraft & Corrugated Cardboard PBR Texture & Bump Map Generator
// Engineered to match Pacdora, Esko Studio, and physical packaging industry standards

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
 * Generates a high-contrast procedural 3D tactile bump map for realistic cardboard relief.
 * Simulates micro-fluting ridges, wood cellulose fiber strands, and recycled pulp flecks.
 */
export function getCardboardBumpTexture(isCorrugated: boolean = true): THREE.CanvasTexture {
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

  const rand = createPRNG(90210)

  // 1. Neutral mid-gray base (128 = zero displacement)
  ctx.fillStyle = "#808080"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 2. Corrugated fluting waves (soft sinusoidal ridges & valleys of flute B/E)
  if (isCorrugated) {
    const flutePitch = 28
    for (let x = 0; x < canvas.width; x += flutePitch) {
      const fluteGrad = ctx.createLinearGradient(x, 0, x + flutePitch, 0)
      fluteGrad.addColorStop(0.0, "rgb(75, 75, 75)") // Valley depression
      fluteGrad.addColorStop(0.25, "rgb(128, 128, 128)") // Zero inflection
      fluteGrad.addColorStop(0.5, "rgb(180, 180, 180)") // Crest ridge
      fluteGrad.addColorStop(0.75, "rgb(128, 128, 128)") // Zero inflection
      fluteGrad.addColorStop(1.0, "rgb(75, 75, 75)") // Next valley
      ctx.fillStyle = fluteGrad
      ctx.fillRect(x, 0, flutePitch, canvas.height)

      // Fine linear press groove along the flute root
      ctx.fillStyle = "rgba(45, 45, 45, 0.35)"
      ctx.fillRect(x, 0, 1.2, canvas.height)
    }
  }

  // 3. Tactile Wood & Cellulose Fiber Relief Strands
  const fiberCount = 5000
  for (let i = 0; i < fiberCount; i++) {
    const fx = rand() * canvas.width
    const fy = rand() * canvas.height
    const fLength = rand() * 18 + 5
    const angle = (rand() - 0.5) * 0.4 // gentle paper grain angle
    const isRaised = rand() > 0.4

    ctx.beginPath()
    ctx.moveTo(fx, fy)
    const midX = fx + Math.cos(angle) * (fLength / 2) + (rand() - 0.5) * 1.5
    const midY = fy + Math.sin(angle) * (fLength / 2) + (rand() - 0.5) * 1.5
    const endX = fx + Math.cos(angle) * fLength
    const endY = fy + Math.sin(angle) * fLength

    ctx.quadraticCurveTo(midX, midY, endX, endY)
    ctx.strokeStyle = isRaised
      ? `rgba(230, 230, 230, ${rand() * 0.32 + 0.16})`
      : `rgba(35, 35, 35, ${rand() * 0.35 + 0.16})`
    ctx.lineWidth = rand() * 1.3 + 0.5
    ctx.stroke()
  }

  // 4. Recycled pulp flakes & flecks (tactile bumps & indentations)
  const speckCount = 2800
  for (let i = 0; i < speckCount; i++) {
    const sx = rand() * canvas.width
    const sy = rand() * canvas.height
    const sSize = rand() * 2.5 + 0.6
    const isRaised = rand() > 0.5
    ctx.fillStyle = isRaised
      ? `rgba(235, 235, 235, ${rand() * 0.42 + 0.18})`
      : `rgba(25, 25, 25, ${rand() * 0.42 + 0.18})`
    ctx.fillRect(sx, sy, sSize, sSize)
  }

  // 5. Fine unbleached paper grain stippling noise (micro-roughness tooth)
  ctx.fillStyle = "rgba(20, 20, 20, 0.12)"
  for (let i = 0; i < 5000; i++) {
    const rx = rand() * canvas.width
    const ry = rand() * canvas.height
    ctx.fillRect(rx, ry, 1, 1)
  }
  ctx.fillStyle = "rgba(240, 240, 240, 0.12)"
  for (let i = 0; i < 5000; i++) {
    const rx = rand() * canvas.width
    const ry = rand() * canvas.height
    ctx.fillRect(rx, ry, 1, 1)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 2)
  tex.needsUpdate = true

  if (isCorrugated) {
    cachedCorrugatedBumpTex = tex
  } else {
    cachedKraftBumpTex = tex
  }
  return tex
}

/**
 * Draws photorealistic Pacdora-style kraft cardboard background onto a 2D canvas context.
 * Multi-layer rendering:
 * 1. Authentic warm unbleached kraft baseline tone.
 * 2. Multi-octave organic pulp cloud mottling (warm amber and golden raw umber).
 * 3. Physical corrugated fluting waves with soft shadows and highlights.
 * 4. Micro-directional Fourdrinier paper machine grain.
 * 5. Thousands of curved wood cellulose fiber strands (dark lignin, golden amber, cream cellulose).
 * 6. Organic recycled carton bits, flecks, and cellulose porosity.
 */
export function applyCardboardBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  options: CardboardOptions = {}
): void {
  const isKraft = options.materialFinish === "kraft" || options.isCorrugated || options.materialType === "kraft" || options.materialType === "corrugated" || !options.materialFinish
  const isCorrugated = options.isCorrugated || options.materialType === "corrugated"

  // Base natural kraft color if color is white/empty/default
  let baseColor = options.baseColor
  if (!baseColor || baseColor.toLowerCase() === "#ffffff" || baseColor.toLowerCase() === "#d97706") {
    baseColor = isCorrugated ? "#ba8852" : "#c49866"
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

  // 2. Multi-octave organic unbleached pulp cloud blotches (warm amber/brown depth)
  // Macro clouds
  const macroCount = Math.max(30, Math.floor((w * h) / 35000))
  for (let i = 0; i < macroCount; i++) {
    const bx = rand() * w
    const by = rand() * h
    const br = rand() * 180 + 80
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br)
    const isDark = rand() > 0.45
    grad.addColorStop(0, isDark ? "rgba(58, 28, 8, 0.11)" : "rgba(255, 238, 195, 0.10)")
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
    const br = rand() * 80 + 30
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br)
    const isDark = rand() > 0.5
    grad.addColorStop(0, isDark ? "rgba(50, 24, 6, 0.09)" : "rgba(255, 245, 215, 0.08)")
    grad.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(bx, by, br, 0, Math.PI * 2)
    ctx.fill()
  }

  // 3. Corrugated cardboard fluting ridges (Gelombang Karton)
  if (isCorrugated) {
    const isVertical = options.orientation !== "horizontal"
    const flutePitch = 28 // ~2.8mm - 3.2mm in physical scale

    if (isVertical) {
      for (let x = 0; x < w; x += flutePitch) {
        const fluteGrad = ctx.createLinearGradient(x, 0, x + flutePitch, 0)
        fluteGrad.addColorStop(0.0, "rgba(42, 22, 6, 0.12)") // Soft valley shadow
        fluteGrad.addColorStop(0.25, "rgba(42, 22, 6, 0.0)")
        fluteGrad.addColorStop(0.5, "rgba(255, 248, 220, 0.14)") // Soft crest highlight
        fluteGrad.addColorStop(0.75, "rgba(42, 22, 6, 0.0)")
        fluteGrad.addColorStop(1.0, "rgba(42, 22, 6, 0.12)")
        ctx.fillStyle = fluteGrad
        ctx.fillRect(x, 0, flutePitch, h)

        // Fine linear indentation press line along flute crease root
        ctx.fillStyle = "rgba(42, 20, 6, 0.08)"
        ctx.fillRect(x, 0, 1.2, h)
      }
    } else {
      // Horizontal flutes
      for (let y = 0; y < h; y += flutePitch) {
        const fluteGrad = ctx.createLinearGradient(0, y, 0, y + flutePitch)
        fluteGrad.addColorStop(0.0, "rgba(42, 22, 6, 0.12)")
        fluteGrad.addColorStop(0.25, "rgba(42, 22, 6, 0.0)")
        fluteGrad.addColorStop(0.5, "rgba(255, 248, 220, 0.14)")
        fluteGrad.addColorStop(0.75, "rgba(42, 22, 6, 0.0)")
        fluteGrad.addColorStop(1.0, "rgba(42, 22, 6, 0.12)")
        ctx.fillStyle = fluteGrad
        ctx.fillRect(0, y, w, flutePitch)

        ctx.fillStyle = "rgba(42, 20, 6, 0.08)"
        ctx.fillRect(0, y, w, 1.2)
      }
    }
  }

  // 4. Subtle machine direction paper grain streaks
  const streakCount = Math.max(180, Math.floor((w * h) / 7000))
  for (let i = 0; i < streakCount; i++) {
    const sx = rand() * w
    const sy = rand() * h
    const sLen = rand() * 110 + 40
    ctx.fillStyle = rand() > 0.5 ? "rgba(48, 24, 7, 0.04)" : "rgba(255, 248, 225, 0.045)"
    ctx.fillRect(sx, sy, sLen, 1)
  }

  // 5. Realistic Wood & Cellulose Fiber Strands (Curved Splines)
  const fiberCount = Math.max(4200, Math.floor((w * h) / 280))
  for (let i = 0; i < fiberCount; i++) {
    const fx = rand() * w
    const fy = rand() * h
    const fLength = rand() * 16 + 5
    const angle = (rand() - 0.5) * 0.45
    const fiberType = rand()

    ctx.beginPath()
    ctx.moveTo(fx, fy)
    const midX = fx + Math.cos(angle) * (fLength / 2) + (rand() - 0.5) * 1.5
    const midY = fy + Math.sin(angle) * (fLength / 2) + (rand() - 0.5) * 1.5
    const endX = fx + Math.cos(angle) * fLength
    const endY = fy + Math.sin(angle) * fLength

    ctx.quadraticCurveTo(midX, midY, endX, endY)

    if (fiberType < 0.42) {
      // Dark unbleached lignin wood fiber
      ctx.strokeStyle = `rgba(45, 20, 6, ${rand() * 0.24 + 0.08})`
      ctx.lineWidth = rand() * 1.1 + 0.4
    } else if (fiberType < 0.72) {
      // Light bleached cellulose fiber
      ctx.strokeStyle = `rgba(255, 250, 230, ${rand() * 0.26 + 0.09})`
      ctx.lineWidth = rand() * 1.1 + 0.4
    } else {
      // Reddish-amber raw wood lignin fiber
      ctx.strokeStyle = `rgba(135, 68, 22, ${rand() * 0.18 + 0.06})`
      ctx.lineWidth = rand() * 0.9 + 0.35
    }
    ctx.stroke()
  }

  // 6. Recycled pulp flecks & dark specks
  const speckCount = Math.max(2200, Math.floor((w * h) / 550))
  for (let i = 0; i < speckCount; i++) {
    const sx = rand() * w
    const sy = rand() * h
    const sSize = rand() * 2.2 + 0.6
    const speckType = rand()
    if (speckType < 0.45) {
      ctx.fillStyle = `rgba(38, 16, 4, ${rand() * 0.32 + 0.12})`
    } else if (speckType < 0.8) {
      ctx.fillStyle = `rgba(255, 255, 255, ${rand() * 0.32 + 0.12})`
    } else {
      ctx.fillStyle = `rgba(150, 78, 22, ${rand() * 0.24 + 0.09})`
    }
    ctx.fillRect(sx, sy, sSize, sSize)
  }

  // 7. Micro-grain paper pulp stippling noise (paper porosity tooth)
  ctx.fillStyle = "rgba(0, 0, 0, 0.045)"
  for (let i = 0; i < 6000; i++) {
    const rx = rand() * w
    const ry = rand() * h
    ctx.fillRect(rx, ry, 1, 1)
  }
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)"
  for (let i = 0; i < 6000; i++) {
    const rx = rand() * w
    const ry = rand() * h
    ctx.fillRect(rx, ry, 1, 1)
  }

  ctx.restore()
}
