import * as THREE from "three"
import { PackagingManifestV2 } from "@/types/panelMapping"

export const PANEL_CALIBRATION_COLORS: Record<string, string> = {
  front: "#EF4444", // Vibrant Red
  back: "#1E40AF",  // Royal Navy Blue
  top: "#F59E0B",   // Amber Gold
  bottom: "#10B981",// Emerald Green
  left: "#8B5CF6",  // Violet Purple
  right: "#06B6D4", // Cyan Teal
}

/**
 * Generates an unambiguous visual calibration texture with high-contrast colors,
 * directional orientation arrows, top-left asymmetry indicators, and coordinate readouts.
 */
export function createVisualCalibrationTexture(
  manifest: PackagingManifestV2 | null | undefined,
  canvasSize: number = 2048
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = canvasSize
  canvas.height = canvasSize
  const ctx = canvas.getContext("2d")

  if (ctx) {
    // 1. Dark base background
    ctx.fillStyle = "#0f172a"
    ctx.fillRect(0, 0, canvasSize, canvasSize)

    // 2. Global background checkerboard (128px)
    const bgStep = 128
    for (let x = 0; x < canvasSize; x += bgStep) {
      for (let y = 0; y < canvasSize; y += bgStep) {
        if ((x / bgStep + y / bgStep) % 2 === 1) {
          ctx.fillStyle = "#1e293b"
          ctx.fillRect(x, y, bgStep, bgStep)
        }
      }
    }

    // 3. Render each panel from manifest
    if (manifest && manifest.panels && Object.keys(manifest.panels).length > 0) {
      Object.values(manifest.panels).forEach((panel) => {
        const uv = panel.uvRegion
        if (uv.uMax <= uv.uMin || uv.vMax <= uv.vMin) return

        const px = uv.uMin * canvasSize
        const py = uv.vMin * canvasSize
        const pw = (uv.uMax - uv.uMin) * canvasSize
        const ph = (uv.vMax - uv.vMin) * canvasSize

        const baseColor =
          PANEL_CALIBRATION_COLORS[panel.panelId.toLowerCase()] ||
          PANEL_CALIBRATION_COLORS[panel.face.toLowerCase()] ||
          "#64748b"

        ctx.save()

        // Panel background fill
        ctx.fillStyle = baseColor
        ctx.fillRect(px, py, pw, ph)

        // Panel border
        ctx.lineWidth = 6
        ctx.strokeStyle = "#ffffff"
        ctx.strokeRect(px + 3, py + 3, pw - 6, ph - 6)

        // Top-Left Asymmetry Marker (Corner notch to detect horizontal/vertical flips)
        const notchSize = Math.min(pw, ph) * 0.18
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.moveTo(px + 3, py + 3)
        ctx.lineTo(px + 3 + notchSize, py + 3)
        ctx.lineTo(px + 3, py + 3 + notchSize)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = "#0f172a"
        ctx.font = `bold ${Math.max(10, Math.floor(notchSize * 0.45))}px monospace`
        ctx.fillText("TL", px + 8, py + notchSize * 0.55)

        // Center Crosshair
        const cx = px + pw / 2
        const cy = py + ph / 2
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(cx, py + 10)
        ctx.lineTo(cx, py + ph - 10)
        ctx.moveTo(px + 10, cy)
        ctx.lineTo(px + pw - 10, cy)
        ctx.stroke()

        // Directional Arrow: Pointing UP
        const arrowH = Math.min(pw, ph) * 0.22
        const arrowW = arrowH * 0.6
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.moveTo(cx, cy - arrowH * 0.4)
        ctx.lineTo(cx + arrowW, cy + arrowH * 0.4)
        ctx.lineTo(cx + arrowW * 0.4, cy + arrowH * 0.4)
        ctx.lineTo(cx + arrowW * 0.4, cy + arrowH * 0.8)
        ctx.lineTo(cx - arrowW * 0.4, cy + arrowH * 0.8)
        ctx.lineTo(cx - arrowW * 0.4, cy + arrowH * 0.4)
        ctx.lineTo(cx - arrowW, cy + arrowH * 0.4)
        ctx.closePath()
        ctx.fill()

        // Panel Title & Normal Vector Label
        const titleSize = Math.max(14, Math.min(36, Math.floor(pw * 0.08)))
        ctx.fillStyle = "#ffffff"
        ctx.font = `900 ${titleSize}px sans-serif`
        ctx.textAlign = "center"
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)"
        ctx.shadowBlur = 6
        ctx.fillText(`▲ ${panel.panelId.toUpperCase()}`, cx, cy - arrowH * 0.55)

        const normStr = `Normal: [${panel.geometry.surfaceNormal.join(", ")}]`
        ctx.font = `bold ${Math.max(10, Math.floor(titleSize * 0.55))}px monospace`
        ctx.fillText(normStr, cx, cy + arrowH * 1.1)

        // Coordinates Readout
        const uvStr = `UV: [${uv.uMin.toFixed(3)}, ${uv.vMin.toFixed(3)}] → [${uv.uMax.toFixed(3)}, ${uv.vMax.toFixed(3)}]`
        ctx.font = `bold ${Math.max(9, Math.floor(titleSize * 0.45))}px monospace`
        ctx.fillText(uvStr, cx, cy + arrowH * 1.35)

        const dimStr = `${panel.svgRegion.width}mm × ${panel.svgRegion.height}mm`
        ctx.fillText(dimStr, cx, cy + arrowH * 1.6)

        ctx.restore()
      })
    } else {
      // Default checker guide when no panels are mapped
      ctx.fillStyle = "#e2e8f0"
      ctx.font = "bold 28px monospace"
      ctx.textAlign = "center"
      ctx.fillText("[TIDAK ADA PANEL YANG DIPETAKAN]", canvasSize / 2, canvasSize / 2)
      ctx.font = "16px sans-serif"
      ctx.fillText("Model belum memiliki panel mapping manifest terverifikasi.", canvasSize / 2, canvasSize / 2 + 40)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.flipY = false
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}
