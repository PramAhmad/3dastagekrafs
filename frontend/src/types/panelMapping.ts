/**
 * AstaKraf Packaging Technical Specification
 * Panel Mapping Manifest Schema (V2.0.0)
 * 
 * Formal contract between 2D Packaging Dieline SVG panels and 3D GLTF/GLB mesh surfaces.
 * Supports UV atlas islands, multi-mesh primitives, CAD coordinate systems,
 * and robust geometric surface identification without destructive buffer modifications.
 */

export type ManifestValidationStatus = "unmapped" | "needs_review" | "verified"

export type PanelRotation = 0 | 90 | 180 | 270

export interface BoundingBox2D {
  /** X coordinate in physical millimeters (relative to SVG dieline origin) */
  x: number
  /** Y coordinate in physical millimeters (relative to SVG dieline origin) */
  y: number
  /** Physical width in millimeters */
  width: number
  /** Physical height in millimeters */
  height: number
}

export interface UVRegion {
  /** Minimum U coordinate in normalized texture space [0, 1] */
  uMin: number
  /** Minimum V coordinate in normalized texture space [0, 1] */
  vMin: number
  /** Maximum U coordinate in normalized texture space [0, 1] */
  uMax: number
  /** Maximum V coordinate in normalized texture space [0, 1] */
  vMax: number
}

/**
 * Geometric signature to uniquely identify a packaging surface,
 * even when multiple panels share the same single mesh and material.
 */
export interface PanelGeometrySignature {
  /** Target mesh index in glTF meshes array */
  meshIndex: number
  /** Target node or mesh name in glTF hierarchy (if named) */
  meshName?: string
  /** Target primitive index within the mesh */
  primitiveIndex: number
  /**
   * Outward-pointing surface normal unit vector [nx, ny, nz]
   * Front (+Z): [0, 0, 1]
   * Back  (-Z): [0, 0, -1]
   * Top   (+Y): [0, 1, 0]
   * Bottom(-Y): [0, -1, 0]
   * Right (+X): [1, 0, 0]
   * Left  (-X): [-1, 0, 0]
   */
  surfaceNormal: [number, number, number]
  /** Dot product threshold to qualify matching face normal (default: 0.85) */
  normalTolerance?: number
  /** Local 3D coordinate bounding box of the surface face in model units */
  localBounds3D?: {
    min: [number, number, number]
    max: [number, number, number]
  }
  /** Contiguous triangle vertex index range (if model uses indexed geometry) */
  indexRange?: {
    start: number
    count: number
  }
}

/**
 * 2D to 3D orientation and scale transformation
 */
export interface PanelTransform {
  /** Clockwise rotation (degrees) applied to align 2D artwork orientation with 3D face */
  rotation: PanelRotation
  /** Mirror horizontally if UV island was unwrapped mirrored */
  flipU: boolean
  /** Mirror vertically if UV island was unwrapped inverted */
  flipV: boolean
  /** Scale multiplier [scaleU, scaleV] */
  scale?: [number, number]
}

/**
 * Complete definition for an individual packaging panel mapping
 */
export interface PanelMappingDefinition {
  /**
   * Stable unique panel identifier
   * Primary faces: "front" | "back" | "left" | "right" | "top" | "bottom"
   * Secondary flaps: "flap_dust_left" | "flap_dust_right" | "tuck_front" | "glue_tab"
   */
  panelId: "front" | "back" | "left" | "right" | "top" | "bottom" | string
  /** Human-readable label (e.g. "Muka Depan (Front Face)") */
  name: string
  /** Semantic surface face target */
  face: "front" | "back" | "left" | "right" | "top" | "bottom" | string
  /** Verification lifecycle status of this specific panel */
  status: ManifestValidationStatus
  /** Geometric identification data for the 3D surface */
  geometry: PanelGeometrySignature
  /** 2D SVG Dieline bounding coordinates (physical mm) */
  svgRegion: BoundingBox2D
  /** Calibrated UV texture atlas bounding coordinates [0, 1] */
  uvRegion: UVRegion
  /** Orientation transformation */
  transform: PanelTransform
  /** Optional verification metadata */
  verifiedAt?: string
  notes?: string
}

/**
 * Root Schema: Packaging Panel Mapping Manifest V2.0.0
 */
export interface PackagingManifestV2 {
  /** Schema specification version */
  schemaVersion: "2.0.0"
  /** Unique manifest ID */
  manifestId: string
  /** Associated 3D Model ID or filename */
  modelId: string
  /** Associated 2D Dieline SVG template ID or filename */
  dielineId?: string
  /** Overall verification status */
  status: ManifestValidationStatus
  /** Texture projection layout strategy */
  uvLayoutStrategy: "atlas" | "multi_mesh" | "cad_projection" | "unmapped"
  /** List of primary mesh node names receiving decal artwork */
  targetMeshNames?: string[]
  /** Map of stable panelId to panel mapping definition */
  panels: Record<string, PanelMappingDefinition>
  /** Metadata and audit logs */
  metadata?: {
    modelDimensionsMm?: { length: number; width: number; height: number }
    author?: string
    notes?: string
    verifiedAt?: string
    verifiedBy?: string
    cadSoftware?: string
    created?: string
    updated?: string
    [key: string]: any
  }
}

/**
 * Backward compatibility aliases
 */
export type PanelMappingManifest = PackagingManifestV2
export type PanelRegionMapping = PanelMappingDefinition

/**
 * Non-destructive UV Channel Diagnostic Report
 */
export interface MeshUVReport {
  meshName: string
  meshId: number
  hasUV: boolean
  vertexCount: number
  primitiveType?: string
  uMin: number
  uMax: number
  vMin: number
  vMax: number
  spanU: number
  spanV: number
  centerU: number
  centerV: number
  isNormalized01: boolean
  isCadMm: boolean
  isDegenerate: boolean
  hasNegativeUV: boolean
  hasExcessiveUV: boolean
  possibleOverlap: boolean
  issues: string[]
}

export interface ModelUVDiagnosticReport {
  modelUrl?: string
  totalMeshes: number
  analyzedMeshes: MeshUVReport[]
  overallStatus: "valid" | "warning" | "error" | "cad_uncalibrated"
  summary: string
  recommendedStrategy: "atlas" | "manifest_projection" | "manual_calibration_needed"
}
