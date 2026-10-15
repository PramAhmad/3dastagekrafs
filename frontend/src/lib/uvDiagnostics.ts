import * as THREE from "three"
import {
  MeshUVReport,
  ModelUVDiagnosticReport,
  PanelMappingManifest,
  PanelRegionMapping,
} from "@/types/panelMapping"

/**
 * Non-destructive 3D Mesh UV Channel Analyzer
 * Conforms to AstaKraf Packaging Technical Standard.
 * 
 * Inspects geometry buffers without modifying vertex attributes or mutating original arrays.
 */
export function analyzeModelUV(rootObject: THREE.Object3D, modelUrl?: string): ModelUVDiagnosticReport {
  const meshReports: MeshUVReport[] = []
  let totalMeshes = 0
  let hasErrors = false
  let hasWarnings = false
  let hasCadScale = false

  rootObject.traverse((node) => {
    if (!(node as THREE.Mesh).isMesh) return

    totalMeshes++
    const mesh = node as THREE.Mesh
    const geometry = mesh.geometry

    if (!geometry) {
      meshReports.push({
        meshName: mesh.name || `mesh_${mesh.id}`,
        meshId: mesh.id,
        hasUV: false,
        vertexCount: 0,
        uMin: 0,
        uMax: 0,
        vMin: 0,
        vMax: 0,
        spanU: 0,
        spanV: 0,
        centerU: 0,
        centerV: 0,
        isNormalized01: false,
        isCadMm: false,
        isDegenerate: true,
        hasNegativeUV: false,
        hasExcessiveUV: false,
        possibleOverlap: false,
        issues: ["Geometri tidak memiliki buffer vertex valid."],
      })
      hasErrors = true
      return
    }

    const uv = geometry.attributes.uv
    if (!uv) {
      meshReports.push({
        meshName: mesh.name || `mesh_${mesh.id}`,
        meshId: mesh.id,
        hasUV: false,
        vertexCount: geometry.attributes.position ? geometry.attributes.position.count : 0,
        uMin: 0,
        uMax: 0,
        vMin: 0,
        vMax: 0,
        spanU: 0,
        spanV: 0,
        centerU: 0,
        centerV: 0,
        isNormalized01: false,
        isCadMm: false,
        isDegenerate: true,
        hasNegativeUV: false,
        hasExcessiveUV: false,
        possibleOverlap: false,
        issues: ["Mesh tidak memiliki attribute UV (TEXCOORD_0 hilang). Tekstur tidak dapat dipetakan."],
      })
      hasErrors = true
      return
    }

    let minU = Infinity
    let maxU = -Infinity
    let minV = Infinity
    let maxV = -Infinity
    const vertexCount = uv.count

    // Non-destructive read pass
    for (let i = 0; i < vertexCount; i++) {
      const u = uv.getX(i)
      const v = uv.getY(i)
      if (u < minU) minU = u
      if (u > maxU) maxU = u
      if (v < minV) minV = v
      if (v > maxV) maxV = v
    }

    if (minU === Infinity || maxU === -Infinity) {
      minU = 0
      maxU = 0
      minV = 0
      maxV = 0
    }

    const spanU = maxU - minU
    const spanV = maxV - minV
    const centerU = (minU + maxU) / 2
    const centerV = (minV + maxV) / 2

    const issues: string[] = []
    const hasNegativeUV = minU < -1e-4 || minV < -1e-4
    const hasExcessiveUV = maxU > 1.0001 || maxV > 1.0001
    const isDegenerate = spanU < 1e-4 || spanV < 1e-4

    // CAD coordinate detection: authors often unwrap in mm (e.g. [-100, 100] or span > 10)
    const isCadMm = spanU > 5.0 || spanV > 5.0 || Math.abs(minU) > 10 || Math.abs(maxU) > 10

    const isNormalized01 = !hasNegativeUV && !hasExcessiveUV && !isCadMm && !isDegenerate

    if (isDegenerate) {
      issues.push("UV degeneratif (rentang span mendekati nol). Permukaan UV collapse.")
      hasWarnings = true
    }

    if (isCadMm) {
      issues.push(
        `UV menggunakan koordinat CAD milimeter [${minU.toFixed(1)}, ${maxU.toFixed(1)}] × [${minV.toFixed(1)}, ${maxV.toFixed(1)}]. Memerlukan manifest kalibrasi.`
      )
      hasCadScale = true
    } else if (hasNegativeUV || hasExcessiveUV) {
      issues.push(
        `UV di luar rentang unit [0, 1]: U=[${minU.toFixed(3)}, ${maxU.toFixed(3)}], V=[${minV.toFixed(3)}, ${maxV.toFixed(3)}].`
      )
      hasWarnings = true
    }

    // Rough overlap detection (if vertex count high but UV bounding box very small)
    const possibleOverlap = !isDegenerate && vertexCount > 100 && spanU < 0.05 && spanV < 0.05
    if (possibleOverlap) {
      issues.push("Potensi UV overlap atau stacked island terdeteksi.")
      hasWarnings = true
    }

    meshReports.push({
      meshName: mesh.name || `mesh_${mesh.id}`,
      meshId: mesh.id,
      hasUV: true,
      vertexCount,
      primitiveType: mesh.geometry.type,
      uMin: minU,
      uMax: maxU,
      vMin: minV,
      vMax: maxV,
      spanU,
      spanV,
      centerU,
      centerV,
      isNormalized01,
      isCadMm,
      isDegenerate,
      hasNegativeUV,
      hasExcessiveUV,
      possibleOverlap,
      issues,
    })
  })

  let overallStatus: "valid" | "warning" | "error" | "cad_uncalibrated" = "valid"
  if (hasErrors) {
    overallStatus = "error"
  } else if (hasCadScale) {
    overallStatus = "cad_uncalibrated"
  } else if (hasWarnings) {
    overallStatus = "warning"
  }

  let summary = ""
  let recommendedStrategy: "atlas" | "manifest_projection" | "manual_calibration_needed" = "atlas"

  if (overallStatus === "valid") {
    summary = `Semua ${totalMeshes} mesh memiliki UV [0, 1] yang valid dan siap dipetakan.`
    recommendedStrategy = "atlas"
  } else if (overallStatus === "cad_uncalibrated") {
    summary = `Terdeteksi mesh dengan koordinat UV CAD/milimeter. Sistem menggunakan panel manifest untuk mapping presisi.`
    recommendedStrategy = "manifest_projection"
  } else if (overallStatus === "warning") {
    summary = `Terdapat peringatan UV (rentang melebihi 1.0 atau overlapping). Perlu verifikasi manifest.`
    recommendedStrategy = "manifest_projection"
  } else {
    summary = `Ditemukan error kritis pada UV geometry. Model tidak dapat diproyeksikan tanpa UV channel.`
    recommendedStrategy = "manual_calibration_needed"
  }

  return {
    modelUrl,
    totalMeshes,
    analyzedMeshes: meshReports,
    overallStatus,
    summary,
    recommendedStrategy,
  }
}

/**
 * Creates a diagnostic UV overlay canvas texture to visualize UV islands,
 * grid alignment, and panel boundaries directly on the 3D model.
 */
export function createUVDebugTexture(manifest?: PanelMappingManifest | null): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext("2d")

  if (ctx) {
    // 1. Grid background
    ctx.fillStyle = "#1e293b"
    ctx.fillRect(0, 0, 1024, 1024)

    const gridSize = 64
    ctx.lineWidth = 1
    for (let x = 0; x <= 1024; x += gridSize) {
      ctx.strokeStyle = x % 256 === 0 ? "#38bdf8" : "#334155"
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 1024)
      ctx.stroke()
    }
    for (let y = 0; y <= 1024; y += gridSize) {
      ctx.strokeStyle = y % 256 === 0 ? "#38bdf8" : "#334155"
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(1024, y)
      ctx.stroke()
    }

    // Coordinates guide
    ctx.fillStyle = "#94a3b8"
    ctx.font = "bold 16px monospace"
    ctx.fillText("U=0, V=0", 12, 28)
    ctx.fillText("U=1, V=0", 920, 28)
    ctx.fillText("U=0, V=1", 12, 1010)
    ctx.fillText("U=1, V=1", 920, 1010)
    ctx.fillText("[DEBUG UV CHECKER GRID]", 380, 512)

    // 2. Draw Panels from Manifest if available
    if (manifest && manifest.panels) {
      const colors = ["#f43f5e", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]
      let colorIdx = 0

      Object.values(manifest.panels).forEach((panel: any) => {
        const uv = panel.uvRegion || panel.uvBounds
        if (!uv) return
        const { uMin, vMin, uMax, vMax } = uv
        if (uMax <= uMin || vMax <= vMin) return

        const col = colors[colorIdx % colors.length]
        colorIdx++

        const px = uMin * 1024
        const py = vMin * 1024
        const pw = (uMax - uMin) * 1024
        const ph = (vMax - vMin) * 1024

        ctx.fillStyle = `${col}33`
        ctx.fillRect(px, py, pw, ph)

        ctx.lineWidth = 3
        ctx.strokeStyle = col
        ctx.strokeRect(px, py, pw, ph)

        ctx.fillStyle = col
        ctx.font = "bold 20px sans-serif"
        const label = `${panel.panelId || panel.id || "panel"} (${panel.name || panel.face || ""})`
        ctx.fillText(label, px + 10, py + 30)
      })
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
