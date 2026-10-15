/**
 * Panel Mapping Manifest & UV Specification
 * Conforms to AstaKraf Packaging Technical Standard.
 * 
 * Provides an explicit, verifiable contract between 2D SVG Dieline panels
 * and 3D GLB/glTF mesh UV island regions without destructive coordinate alterations.
 */

export type PanelValidationStatus = "verified" | "provisional" | "unmapped"

export type PanelRotation = 0 | 90 | 180 | 270

export interface BoundingBox2D {
  x: number
  y: number
  width: number
  height: number
}

export interface UVBounds {
  uMin: number
  vMin: number
  uMax: number
  vMax: number
}

export interface PanelRegionMapping {
  /** Stable unique identifier (e.g. "face-front", "face-back", "face-top", "flap-dust-left") */
  id: string
  /** Human readable label (e.g. "Muka Depan", "Muka Belakang") */
  name: string
  /** Standard semantic surface target (front | back | top | left | right | bottom) */
  face: "front" | "back" | "top" | "left" | "right" | "bottom" | string
  /** Physical / SVG coordinate bounding box in mm */
  svgBounds: BoundingBox2D
  /** Target UV bounding coordinates in [0, 1] texture space */
  uvBounds: UVBounds
  /** Clockwise rotation (degrees) applied when projecting 2D artwork onto 3D UV space */
  rotation?: PanelRotation
  /** Horizontal flip required to align decal text with 3D face orientation */
  flipU?: boolean
  /** Vertical flip required to align decal text with 3D face orientation */
  flipV?: boolean
  /** Specific target mesh name in GLB, if model consists of separate node/mesh primitives */
  meshName?: string
}

export interface PanelMappingManifest {
  /** Schema specification version */
  schemaVersion: "1.0"
  /** Unique manifest ID */
  id: string
  /** Associated 3D Model ID or hash */
  modelId: string
  /** Associated 2D Dieline SVG template ID */
  dielineId?: string
  /** Verification lifecycle status */
  status: PanelValidationStatus
  /** Strategy for rendering textures */
  uvLayoutType: "atlas" | "per_panel" | "cad_mm"
  /** List of primary mesh node names receiving decal artwork */
  targetMeshNames?: string[]
  /** Map of panel ID to region mapping definition */
  panels: Record<string, PanelRegionMapping>
  /** Metadata and audit logs */
  metadata?: {
    author?: string
    notes?: string
    verifiedAt?: string
    verifiedBy?: string
    sourceCadTool?: string
  }
}

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
