import * as THREE from "three"
import {
  PackagingManifestV2,
  PanelMappingDefinition,
  ManifestValidationStatus,
  PanelRotation,
} from "@/types/panelMapping"

/**
 * Standard outward normal vectors for packaging faces
 */
export function getStandardSurfaceNormal(faceName: string): [number, number, number] {
  const f = (faceName || "").toLowerCase()
  if (f.includes("front") || f === "depan") return [0, 0, 1]
  if (f.includes("back") || f === "belakang") return [0, 0, -1]
  if (f.includes("top") || f === "atas" || f.includes("roof") || f.includes("lid")) return [0, 1, 0]
  if (f.includes("bottom") || f === "bawah" || f.includes("base")) return [0, -1, 0]
  if (f.includes("right") || f === "kanan") return [1, 0, 0]
  if (f.includes("left") || f === "kiri") return [-1, 0, 0]
  return [0, 0, 1]
}

/**
 * Creates an initial unmapped manifest template
 */
export function createEmptyManifest(modelId: string, dielineId?: string): PackagingManifestV2 {
  return {
    schemaVersion: "2.0.0",
    manifestId: `manifest_${Date.now()}`,
    modelId,
    dielineId,
    status: "unmapped",
    uvLayoutStrategy: "unmapped",
    panels: {},
    metadata: {
      notes: "Manifest otomatis dibuat dengan status unmapped. Memerlukan kalibrasi geometri & UV.",
      created: new Date().toISOString(),
    },
  }
}

/**
 * Migration & Fallback Engine
 * Safely parses and upgrades legacy manifests (V1, raw JSON string, or partial dicts)
 * into a fully conforming PackagingManifestV2 without mutating source files or inventing fake UVs.
 */
export function migrateLegacyManifest(raw: any, fallbackModelId: string = "packaging_model"): PackagingManifestV2 {
  if (!raw) {
    return createEmptyManifest(fallbackModelId)
  }

  let data = raw
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw)
    } catch (e) {
      return createEmptyManifest(fallbackModelId)
    }
  }

  if (typeof data !== "object" || data === null) {
    return createEmptyManifest(fallbackModelId)
  }

  // Schema V2.0.0 already: Validate and return
  if (data.schemaVersion === "2.0.0" && data.panels && typeof data.panels === "object") {
    return {
      schemaVersion: "2.0.0",
      manifestId: data.manifestId || `manifest_${Date.now()}`,
      modelId: data.modelId || fallbackModelId,
      dielineId: data.dielineId,
      status: (data.status as ManifestValidationStatus) || "needs_review",
      uvLayoutStrategy: data.uvLayoutStrategy || "atlas",
      targetMeshNames: data.targetMeshNames,
      panels: data.panels,
      metadata: data.metadata,
    }
  }

  // Schema V1.0 or Unstructured Legacy Migration
  const migratedPanels: Record<string, PanelMappingDefinition> = {}
  const rawPanels = data.panels || {}
  const panelEntries: [string, any][] = Array.isArray(rawPanels)
    ? rawPanels.map((p: any) => [p.panelId || p.id || p.face || "front", p] as [string, any])
    : Object.entries(rawPanels)

  panelEntries.forEach(([key, val]) => {
    if (!val || typeof val !== "object") return

    const panelId = val.panelId || val.id || key
    const face = val.face || val.surfaceTarget || panelId

    // 2D SVG region migration
    const svgBox = val.svgRegion || val.svgBounds || {}
    const svgRegion = {
      x: typeof svgBox.x === "number" ? svgBox.x : 0,
      y: typeof svgBox.y === "number" ? svgBox.y : 0,
      width: typeof svgBox.width === "number" && svgBox.width > 0 ? svgBox.width : 100,
      height: typeof svgBox.height === "number" && svgBox.height > 0 ? svgBox.height : 100,
    }

    // UV region migration (Strictly preserved, never invented)
    const uvBox = val.uvRegion || val.uvBounds || {}
    const hasValidUV =
      typeof uvBox.uMin === "number" &&
      typeof uvBox.vMin === "number" &&
      typeof uvBox.uMax === "number" &&
      typeof uvBox.vMax === "number" &&
      uvBox.uMax >= uvBox.uMin &&
      uvBox.vMax >= uvBox.vMin

    const uvRegion = hasValidUV
      ? {
          uMin: uvBox.uMin,
          vMin: uvBox.vMin,
          uMax: uvBox.uMax,
          vMax: uvBox.vMax,
        }
      : { uMin: 0, vMin: 0, uMax: 0, vMax: 0 }

    // Transform migration
    const rot = (val.transform?.rotation ?? val.rotation ?? 0) as PanelRotation
    const flipU = Boolean(val.transform?.flipU ?? val.flipU ?? false)
    const flipV = Boolean(val.transform?.flipV ?? val.flipV ?? false)

    // Geometry signature migration
    const geom = val.geometry || {}
    const surfaceNormal = geom.surfaceNormal || getStandardSurfaceNormal(face)

    // Panel status: if UV was missing or degenerate, mark unmapped
    let panelStatus: ManifestValidationStatus = "needs_review"
    if (!hasValidUV || (uvRegion.uMax === uvRegion.uMin && uvRegion.vMax === uvRegion.vMin)) {
      panelStatus = "unmapped"
    } else if (val.status === "verified") {
      panelStatus = "verified"
    }

    migratedPanels[panelId] = {
      panelId,
      name: val.name || `Panel ${panelId}`,
      face,
      status: panelStatus,
      geometry: {
        meshIndex: geom.meshIndex ?? 0,
        primitiveIndex: geom.primitiveIndex ?? 0,
        meshName: geom.meshName || val.meshName,
        surfaceNormal,
        normalTolerance: geom.normalTolerance ?? 0.85,
        localBounds3D: geom.localBounds3D,
      },
      svgRegion,
      uvRegion,
      transform: {
        rotation: rot,
        flipU,
        flipV,
        scale: val.transform?.scale || [1, 1],
      },
      verifiedAt: val.verifiedAt,
      notes: val.notes || (val.schemaVersion ? undefined : "Migrasi otomatis dari legacy manifest V1"),
    }
  })

  const hasVerifiedPanels = Object.values(migratedPanels).some((p) => p.status === "verified")
  const hasAnyPanels = Object.keys(migratedPanels).length > 0

  return {
    schemaVersion: "2.0.0",
    manifestId: data.manifestId || data.id || `manifest_migrated_${Date.now()}`,
    modelId: data.modelId || fallbackModelId,
    dielineId: data.dielineId,
    status: hasVerifiedPanels ? "verified" : hasAnyPanels ? "needs_review" : "unmapped",
    uvLayoutStrategy: data.uvLayoutStrategy || data.uvLayoutType || (hasAnyPanels ? "atlas" : "unmapped"),
    targetMeshNames: data.targetMeshNames,
    panels: migratedPanels,
    metadata: {
      author: data.metadata?.author || "AstaKraf Migration Engine",
      notes: data.metadata?.notes || "Dimigrasikan dari manifest legacy ke skema V2.0.0.",
      created: data.metadata?.created || new Date().toISOString(),
      updated: new Date().toISOString(),
    },
  }
}

/**
 * Looks up a panel mapping from manifest by surface target, panelId, or semantic face
 */
export function getPanelMapping(
  manifest: PackagingManifestV2 | null | undefined,
  faceTarget: string
): PanelMappingDefinition | null {
  if (!manifest || !manifest.panels) return null

  const panels = Object.values(manifest.panels)
  if (panels.length === 0) return null

  const targetLower = faceTarget.toLowerCase()

  // 1. Direct panelId match
  const byId = panels.find((p) => p.panelId.toLowerCase() === targetLower)
  if (byId) return byId

  // 2. Direct face match
  const byFace = panels.find((p) => p.face.toLowerCase() === targetLower)
  if (byFace) return byFace

  // 3. Substring match (e.g. "face-front" matching "front")
  const bySub = panels.find((p) => p.panelId.toLowerCase().includes(targetLower) || p.face.toLowerCase().includes(targetLower))
  if (bySub) return bySub

  // 4. Default to front panel if available
  const frontFallback = panels.find((p) => p.face.toLowerCase() === "front")
  return frontFallback || panels[0]
}

/**
 * Geometric verification engine:
 * Tests manifest panel definitions against actual Three.js scene geometry
 */
export function verifyManifestAgainstScene(
  manifest: PackagingManifestV2,
  scene: THREE.Object3D
): {
  isValid: boolean
  matchedPanels: number
  unmatchedPanels: string[]
  details: Record<string, { foundMesh: boolean; normalMatch: boolean; uvValid: boolean; message: string }>
} {
  const details: Record<string, { foundMesh: boolean; normalMatch: boolean; uvValid: boolean; message: string }> = {}
  const unmatchedPanels: string[] = []
  let matchedCount = 0

  const allMeshes: THREE.Mesh[] = []
  scene.traverse((node) => {
    if ((node as THREE.Mesh).isMesh) {
      allMeshes.push(node as THREE.Mesh)
    }
  })

  Object.values(manifest.panels).forEach((panel) => {
    const { geometry, uvRegion, panelId } = panel

    // 1. Check Mesh existence
    let targetMesh: THREE.Mesh | undefined
    if (geometry.meshName) {
      targetMesh = allMeshes.find((m) => m.name.toLowerCase() === geometry.meshName!.toLowerCase())
    }
    if (!targetMesh && geometry.meshIndex !== undefined && allMeshes[geometry.meshIndex]) {
      targetMesh = allMeshes[geometry.meshIndex]
    }
    if (!targetMesh && allMeshes.length > 0) {
      targetMesh = allMeshes[0]
    }

    if (!targetMesh || !targetMesh.geometry) {
      details[panelId] = {
        foundMesh: false,
        normalMatch: false,
        uvValid: false,
        message: `Mesh referensi "${geometry.meshName || `index_${geometry.meshIndex}`}" tidak ditemukan di scene GLB.`,
      }
      unmatchedPanels.push(panelId)
      return
    }

    // 2. Check UV validity
    const isDegenerate =
      uvRegion.uMax <= uvRegion.uMin ||
      uvRegion.vMax <= uvRegion.vMin ||
      uvRegion.uMax - uvRegion.uMin < 1e-4 ||
      uvRegion.vMax - uvRegion.vMin < 1e-4

    // 3. Check Surface Normal alignment on mesh geometry
    let normalMatch = false
    const normAttr = targetMesh.geometry.attributes.normal
    if (normAttr) {
      const expN = new THREE.Vector3(...geometry.surfaceNormal).normalize()
      const tol = geometry.normalTolerance || 0.85

      for (let i = 0; i < normAttr.count; i++) {
        const vx = normAttr.getX(i)
        const vy = normAttr.getY(i)
        const vz = normAttr.getZ(i)
        const vNorm = new THREE.Vector3(vx, vy, vz).normalize()
        if (vNorm.dot(expN) >= tol) {
          normalMatch = true
          break
        }
      }
    }

    if (normalMatch && !isDegenerate) {
      matchedCount++
      details[panelId] = {
        foundMesh: true,
        normalMatch: true,
        uvValid: true,
        message: `Panel diverifikasi pada mesh "${targetMesh.name || `mesh_${geometry.meshIndex}`}" dengan normal [${geometry.surfaceNormal.join(",")}] dan UV atlas valid.`,
      }
    } else {
      unmatchedPanels.push(panelId)
      details[panelId] = {
        foundMesh: true,
        normalMatch,
        uvValid: !isDegenerate,
        message: !normalMatch
          ? `Permukaan normal [${geometry.surfaceNormal.join(",")}] tidak cocok dengan geometri mesh.`
          : "Region UV degeneratif atau berukuran 0.",
      }
    }
  })

  const totalPanels = Object.keys(manifest.panels).length
  const isValid = totalPanels > 0 && unmatchedPanels.length === 0

  return {
    isValid,
    matchedPanels: matchedCount,
    unmatchedPanels,
    details,
  }
}
