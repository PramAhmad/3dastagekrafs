// Photorealistic Kraft & Corrugated Cardboard PBR Texture & Bump Map Generator
// Modeled after Pacdora and professional packaging CAD studio rendering engines

import * as THREE from "three"

export interface CardboardOptions {
  baseColor?: string
  materialFinish?: string
  isCorrugated?: boolean
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

  // 1. Neutral mid-gray base (128 = zero height displacement)
  ctx.fillStyle = "#808080"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 2. Corrugated fluting waves (soft sinusoidal ridges & valleys of flute B/E)
  if (isCorrugated) {
    const flutePitch = 30
    for (let x = 0; x < canvas.width; x += flutePitch) {
      // Valley groove (darker = indented into cardboard surface)
      const valleyGrad = ctx.createLinearGradient(x, 0, x + flutePitch * 0.45, 0)
      valleyGrad.addColorStop(0, "rgba(40, 40, 40, 0.48)")
      valleyGrad.addColorStop(1, "rgba(128, 128, 128, 0)")
      ctx.fillStyle = valleyGrad
      ctx.fillRect(x, 0, flutePitch * 0.45, canvas.height)

      // Crest ridge (lighter = raised above cardboard surface)
      const crestGrad = ctx.createLinearGradient(x + flutePitch * 0.45, 0, x + flutePitch, 0)
      crestGrad.addColorStop(0, "rgba(128, 128, 128, 0)")
      crestGrad.addColorStop(0.5, "rgba(215, 215, 215, 0.45)")
      crestGrad.addColorStop(1, "rgba(128, 128, 128, 0)")
      ctx.fillStyle = crestGrad
      ctx.fillRect(x + flutePitch * 0.45, 0, flutePitch * 0.55, canvas.height)

      // Fine linear press groove along the flute root
      ctx.fillStyle = "rgba(35, 35, 35, 0.30)"
      ctx.fillRect(x, 0, 1.5, canvas.height)
    }
  }

  // 3. Tactile Wood & Cellulose Fiber Relief Strands
  const fiberCount = 4500
  for (let i = 0; i < fiberCount; i++) {
    const fx = Math.random() * canvas.width
    const fy = Math.random() * canvas.height
    const fLength = Math.random() * 18 + 5
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
      ? `rgba(225, 225, 225, ${Math.random() * 0.30 + 0.15})`
      : `rgba(40, 40, 40, ${Math.random() * 0.32 + 0.15})`
    ctx.lineWidth = Math.random() * 1.3 + 0.5
    ctx.stroke()
  }

  // 4. Recycled pulp flakes & flecks (tactile bumps & indentations)
  const speckCount = 2400
  for (let i = 0; i < speckCount; i++) {
    const sx = Math.random() * canvas.width
    const sy = Math.random() * canvas.height
    const sSize = Math.random() * 2.4 + 0.6
    const isRaised = Math.random() > 0.5
    ctx.fillStyle = isRaised
      ? `rgba(230, 230, 230, ${Math.random() * 0.40 + 0.15})`
      : `rgba(30, 30, 30, ${Math.random() * 0.40 + 0.15})`
    ctx.fillRect(sx, sy, sSize, sSize)
  }

  // 5. Fine unbleached paper grain stippling noise
  ctx.fillStyle = "rgba(25, 25, 25, 0.10)"
  for (let i = 0; i < 4000; i++) {
    const rx = Math.random() * canvas.width
    const ry = Math.random() * canvas.height
    ctx.fillRect(rx, ry, 1, 1)
  }
  ctx.fillStyle = "rgba(235, 235, 235, 0.10)"
  for (let i = 0; i < 4000; i++) {
    const rx = Math.random() * canvas.width
    const ry = Math.random() * canvas.height
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
 * Includes natural unbleached pulp blotches, corrugated fluting waves, organic wood fibers,
 * recycled flecks, and paper machine grain.
 */
export function applyCardboardBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  options: CardboardOptions = {}
): void {
  const isKraft = options.materialFinish === "kraft" || options.isCorrugated || !options.materialFinish
  const baseColor = options.baseColor || (isKraft ? "#be8d58" : "#ffffff")

  // Fill base solid tone
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, w, h)

  if (!isKraft) {
    // If ivory/white matte paperboard, add subtle clean paper pulp stipple
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.015)"
    for (let i = 0; i < 3000; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
    }
    ctx.restore()
    return
  }

  ctx.save()

  // 1. Organic unbleached pulp cloud blotches (warm amber/brown depth variation)
  const blotchCount = Math.max(45, Math.floor((w * h) / 25000))
  for (let i = 0; i < blotchCount; i++) {
    const bx = Math.random() * w
    const by = Math.random() * h
    const br = Math.random() * 120 + 40
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br)
    const isDark = Math.random() > 0.45
    grad.addColorStop(0, isDark ? "rgba(50, 24, 6, 0.08)" : "rgba(255, 238, 200, 0.07)")
    grad.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(bx, by, br, 0, Math.PI * 2)
    ctx.fill()
  }

  // 2. Corrugated cardboard fluting ridges (Gelombang Karton)
  const isCorrugated = options.isCorrugated !== false
  if (isCorrugated) {
    const flutePitch = 28 // pixels per flute ridge
    for (let x = 0; x < w; x += flutePitch) {
      // Flute shadow valley (left side of flute rib)
      const shadowGrad = ctx.createLinearGradient(x, 0, x + flutePitch * 0.45, 0)
      shadowGrad.addColorStop(0, "rgba(35, 16, 4, 0.13)")
      shadowGrad.addColorStop(1, "rgba(35, 16, 4, 0.0)")
      ctx.fillStyle = shadowGrad
      ctx.fillRect(x, 0, flutePitch * 0.45, h)

      // Flute crest highlight (right side of flute rib)
      const highlightGrad = ctx.createLinearGradient(x + flutePitch * 0.45, 0, x + flutePitch, 0)
      highlightGrad.addColorStop(0, "rgba(255, 250, 225, 0.16)")
      highlightGrad.addColorStop(0.5, "rgba(255, 250, 225, 0.08)")
      highlightGrad.addColorStop(1, "rgba(255, 250, 225, 0.0)")
      ctx.fillStyle = highlightGrad
      ctx.fillRect(x + flutePitch * 0.45, 0, flutePitch * 0.55, h)

      // Fine linear indentation press line along flute crease
      ctx.fillStyle = "rgba(40, 18, 4, 0.12)"
      ctx.fillRect(x, 0, 1.5, h)
    }
  }

  // 3. Subtle horizontal paper machine grain streaks
  const streakCount = Math.max(140, Math.floor((w * h) / 8000))
  for (let i = 0; i < streakCount; i++) {
    const sx = Math.random() * w
    const sy = Math.random() * h
    const sLen = Math.random() * 90 + 35
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(45, 22, 6, 0.035)" : "rgba(255, 245, 220, 0.04)"
    ctx.fillRect(sx, sy, sLen, 1)
  }

  // 4. Realistic Wood & Cellulose Fiber Strands (Ribuan serat kayu pulp asli)
  const fiberCount = Math.max(3500, Math.floor((w * h) / 320))
  for (let i = 0; i < fiberCount; i++) {
    const fx = Math.random() * w
    const fy = Math.random() * h
    const fLength = Math.random() * 15 + 4
    const angle = (Math.random() - 0.5) * 0.45 // aligned with paper grain
    const fiberType = Math.random()

    ctx.beginPath()
    ctx.moveTo(fx, fy)
    const midX = fx + Math.cos(angle) * (fLength / 2) + (Math.random() - 0.5) * 1.5
    const midY = fy + Math.sin(angle) * (fLength / 2) + (Math.random() - 0.5) * 1.5
    const endX = fx + Math.cos(angle) * fLength
    const endY = fy + Math.sin(angle) * fLength

    ctx.quadraticCurveTo(midX, midY, endX, endY)

    if (fiberType < 0.42) {
      // Dark unbleached wood fiber
      ctx.strokeStyle = `rgba(45, 20, 6, ${Math.random() * 0.20 + 0.07})`
      ctx.lineWidth = Math.random() * 1.1 + 0.4
    } else if (fiberType < 0.72) {
      // Light cellulose fiber
      ctx.strokeStyle = `rgba(255, 250, 230, ${Math.random() * 0.22 + 0.08})`
      ctx.lineWidth = Math.random() * 1.1 + 0.4
    } else {
      // Reddish-amber raw wood lignin fiber
      ctx.strokeStyle = `rgba(130, 65, 20, ${Math.random() * 0.16 + 0.05})`
      ctx.lineWidth = Math.random() * 0.9 + 0.35
    }
    ctx.stroke()
  }

  // 5. Recycled pulp flecks & dark specks
  const speckCount = Math.max(1800, Math.floor((w * h) / 650))
  for (let i = 0; i < speckCount; i++) {
    const sx = Math.random() * w
    const sy = Math.random() * h
    const sSize = Math.random() * 2.2 + 0.6
    const speckType = Math.random()
    if (speckType < 0.45) {
      ctx.fillStyle = `rgba(38, 16, 4, ${Math.random() * 0.28 + 0.10})`
    } else if (speckType < 0.8) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.28 + 0.10})`
    } else {
      ctx.fillStyle = `rgba(145, 75, 20, ${Math.random() * 0.22 + 0.08})`
    }
    ctx.fillRect(sx, sy, sSize, sSize)
  }

  // 6. Micro-grain paper pulp stippling noise
  ctx.fillStyle = "rgba(0, 0, 0, 0.04)"
  for (let i = 0; i < 5000; i++) {
    const rx = Math.random() * w
    const ry = Math.random() * h
    ctx.fillRect(rx, ry, 1, 1)
  }
  ctx.fillStyle = "rgba(255, 255, 255, 0.035)"
  for (let i = 0; i < 5000; i++) {
    const rx = Math.random() * w
    const ry = Math.random() * h
    ctx.fillRect(rx, ry, 1, 1)
  }

  ctx.restore()
}
