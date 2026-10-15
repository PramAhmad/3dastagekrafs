// AstaKraf Universal SVG Dieline to 3D Folding Packaging Engine
// Inspired by Pacdora Dieline-to-3D-Mockup CAD Architecture
// Converts 2D SVG Dielines (Cut & Crease vectors) into 3D Folded Packaging Meshes with Realtime Kinematic Hinges

import * as THREE from "three"
import { DielinePanelZone } from "./dielineGenerator"

export interface DielineAnalysis {
  totalWidthMm: number
  totalHeightMm: number
  cutBox: { x: number; y: number; w: number; h: number }
  verticalCreases: number[]
  horizontalCreases: number[]
  panels: DielinePanelZone[]
  boxType: "gable" | "tube-box" | "mailer-0427" | "pouch" | "cylinder" | "generic-box"
  dims: {
    length: number // mm
    width: number  // mm
    height: number // mm
  }
}

/**
 * Parses raw SVG dieline and extracts cut boundaries, crease lines, and semantic panels
 */
export function analyzeSvgDieline(svgText: string): DielineAnalysis {
  if (!svgText) {
    return {
      totalWidthMm: 200,
      totalHeightMm: 200,
      cutBox: { x: 20, y: 20, w: 160, h: 160 },
      verticalCreases: [],
      horizontalCreases: [],
      panels: [],
      boxType: "generic-box",
      dims: { length: 100, width: 60, height: 100 },
    }
  }

  // 1. Determine overall SVG dimensions
  let totalW = 200
  let totalH = 200

  const wMatch = svgText.match(/width=["\']([\d.]+)(mm|px|cm)?["\']/i)
  const hMatch = svgText.match(/height=["\']([\d.]+)(mm|px|cm)?["\']/i)
  const vbMatch = svgText.match(/viewBox=["\']([\d.\s,-]+)["\']/i)

  if (wMatch && wMatch[1]) totalW = parseFloat(wMatch[1])
  if (hMatch && hMatch[1]) totalH = parseFloat(hMatch[1])

  if (vbMatch && vbMatch[1]) {
    const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number)
    if (parts.length >= 4 && (!totalW || totalW === 200)) {
      totalW = parts[2]
      totalH = parts[3]
    }
  }

  // 2. Parse cut line coordinates (Magenta / red / cut-line)
  const allCutPaths = [
    ...svgText.matchAll(/class=["\'][^"\']*cut-line[\s\S]*?d=["\']([^"\']+)["\']/gi),
    ...svgText.matchAll(/id=["\'][^"\']*cut[\s\S]*?d=["\']([^"\']+)["\']/gi),
    ...svgText.matchAll(/stroke=["\']#(ff007f|e11d48|f43f5e|ff0000|magenta)["\'][^>]*d=["\']([^"\']+)["\']/gi),
  ]

  const cutXs: number[] = []
  const cutYs: number[] = []

  allCutPaths.forEach((m) => {
    const d = m[1] || m[2] || ""
    const nums = d.match(/[-+]?\d*\.?\d+/g)?.map(Number) || []
    for (let i = 0; i < nums.length; i += 2) {
      if (!isNaN(nums[i])) cutXs.push(nums[i])
      if (!isNaN(nums[i + 1])) cutYs.push(nums[i + 1])
    }
  })

  // Fallback to all paths if no explicit cut lines tagged
  if (cutXs.length === 0) {
    const generalPaths = [...svgText.matchAll(/d=["\']([^"\']+)["\']/g)]
    generalPaths.forEach((m) => {
      const nums = m[1].match(/[-+]?\d*\.?\d+/g)?.map(Number) || []
      for (let i = 0; i < nums.length; i += 2) {
        if (!isNaN(nums[i])) cutXs.push(nums[i])
        if (!isNaN(nums[i + 1])) cutYs.push(nums[i + 1])
      }
    })
  }

  let cutBox = { x: 20, y: 20, w: totalW * 0.8, h: totalH * 0.7 }
  if (cutXs.length > 0 && cutYs.length > 0) {
    const minX = Math.min(...cutXs)
    const maxX = Math.max(...cutXs)
    const minY = Math.min(...cutYs)
    const maxY = Math.max(...cutYs)
    if (maxX - minX > 10 && maxY - minY > 10) {
      cutBox = { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
    }
  }

  // 3. Parse crease lines (Green / dashed / crease-line)
  const creasePaths = [
    ...svgText.matchAll(/class=["\'][^"\']*crease-line[\s\S]*?d=["\']([^"\']+)["\']/gi),
    ...svgText.matchAll(/id=["\'][^"\']*crease[\s\S]*?d=["\']([^"\']+)["\']/gi),
    ...svgText.matchAll(/stroke=["\']#(00a651|10b981|22c55e|00ff00)["\'][^>]*d=["\']([^"\']+)["\']/gi),
  ]

  const rawVertX: number[] = []
  const rawHorizY: number[] = []

  creasePaths.forEach((m) => {
    const d = m[1] || m[2] || ""
    const nums = d.match(/[-+]?\d*\.?\d+/g)?.map(Number) || []
    if (nums.length === 4) {
      const [x1, y1, x2, y2] = nums
      if (Math.abs(x1 - x2) < 1.0 && Math.abs(y2 - y1) > 15) rawVertX.push((x1 + x2) / 2)
      else if (Math.abs(y1 - y2) < 1.0 && Math.abs(x2 - x1) > 15) rawHorizY.push((y1 + y2) / 2)
    }
  })

  // Cluster creases
  const cluster = (arr: number[]) => {
    if (arr.length === 0) return []
    const sorted = [...arr].sort((a, b) => a - b)
    const result: number[] = [sorted[0]]
    for (let i = 1; i < sorted.length; i++) {
      if (Math.abs(sorted[i] - result[result.length - 1]) > 2.0) {
        result.push(sorted[i])
      }
    }
    return result
  }

  const verticalCreases = cluster(rawVertX).filter((x) => x > cutBox.x + 5 && x < cutBox.x + cutBox.w - 5)
  const horizontalCreases = cluster(rawHorizY).filter((y) => y > cutBox.y + 5 && y < cutBox.y + cutBox.h - 5)

  // 4. Detect Box Type & Form Dimensions
  const isGable = /gable|milk|susu|beverage/i.test(svgText)
  const isCylinder = /cylinder|bottle|can|kaleng|spray|cup/i.test(svgText)
  const isMailer = /0427|mailer|tuck-top|pizza/i.test(svgText)

  let boxType: DielineAnalysis["boxType"] = "generic-box"
  if (isGable) boxType = "gable"
  else if (isCylinder) boxType = "cylinder"
  else if (isMailer) boxType = "mailer-0427"
  else if (verticalCreases.length >= 3) boxType = "tube-box"

  const panels: DielinePanelZone[] = []
  let length = 100
  let width = 60
  let height = 120

  if (verticalCreases.length >= 4) {
    const v0 = verticalCreases[0]
    const v1 = verticalCreases[1]
    const v2 = verticalCreases[2]
    const v3 = verticalCreases[3]
    const topCrease = horizontalCreases.length > 0 ? horizontalCreases[0] : cutBox.y + cutBox.h * 0.15
    const bottomCrease = horizontalCreases.length > 1 ? horizontalCreases[horizontalCreases.length - 1] : cutBox.y + cutBox.h * 0.85
    const bodyH = bottomCrease - topCrease

    length = Math.round(v2 - v1)
    width = Math.round(v1 - v0)
    height = Math.round(bodyH)

    panels.push(
      { face: "glue-flap", x: cutBox.x, y: topCrease, width: v0 - cutBox.x, height: bodyH, label: "LIDAH LEM (GLUE FLAP)" },
      { face: "left", x: v0, y: topCrease, width: v1 - v0, height: bodyH, label: "SISI KIRI (LEFT)" },
      { face: "front", x: v1, y: topCrease, width: v2 - v1, height: bodyH, label: "MUKA DEPAN (FRONT)" },
      { face: "right", x: v2, y: topCrease, width: v3 - v2, height: bodyH, label: "SISI KANAN (RIGHT)" },
      { face: "back", x: v3, y: topCrease, width: (cutBox.x + cutBox.w) - v3, height: bodyH, label: "MUKA BELAKANG (BACK)" },
      { face: "top", x: v1, y: cutBox.y, width: v2 - v1, height: topCrease - cutBox.y, label: "TUTUP ATAS (TOP)" },
      { face: "bottom", x: v1, y: bottomCrease, width: v2 - v1, height: (cutBox.y + cutBox.h) - bottomCrease, label: "ALAS BAWAH (BOTTOM)" }
    )
  } else {
    // Proportional division
    const glueW = cutBox.w * 0.06
    const pW = (cutBox.w - glueW) / 4
    const topH = cutBox.h * 0.18
    const bottomH = cutBox.h * 0.18
    const bodyH = cutBox.h - topH - bottomH
    const bodyY = cutBox.y + topH

    length = Math.round(pW)
    width = Math.round(pW)
    height = Math.round(bodyH)

    panels.push(
      { face: "glue-flap", x: cutBox.x, y: bodyY, width: glueW, height: bodyH, label: "LIDAH LEM" },
      { face: "left", x: cutBox.x + glueW, y: bodyY, width: pW, height: bodyH, label: "SISI KIRI (LEFT)" },
      { face: "front", x: cutBox.x + glueW + pW, y: bodyY, width: pW, height: bodyH, label: "MUKA DEPAN (FRONT)" },
      { face: "right", x: cutBox.x + glueW + pW * 2, y: bodyY, width: pW, height: bodyH, label: "SISI KANAN (RIGHT)" },
      { face: "back", x: cutBox.x + glueW + pW * 3, y: bodyY, width: pW, height: bodyH, label: "MUKA BELAKANG (BACK)" },
      { face: "top", x: cutBox.x + glueW + pW, y: cutBox.y, width: pW, height: topH, label: "TUTUP ATAS (TOP)" },
      { face: "bottom", x: cutBox.x + glueW + pW, y: bodyY + bodyH, width: pW, height: bottomH, label: "ALAS BAWAH (BOTTOM)" }
    )
  }

  return {
    totalWidthMm: Math.round(totalW),
    totalHeightMm: Math.round(totalH),
    cutBox,
    verticalCreases,
    horizontalCreases,
    panels,
    boxType,
    dims: { length, width, height },
  }
}

/**
 * Creates a panel plane geometry in local XY coordinates with 1:1 UV mapping to SVG dieline canvas
 */
export function createPanelGeometry(
  widthMm: number,
  heightMm: number,
  panelSvgX: number,
  panelSvgY: number,
  svgTotalW: number,
  svgTotalH: number
): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(widthMm, heightMm, 1, 1)
  const uvAttr = geo.attributes.uv

  const u0 = panelSvgX / svgTotalW
  const u1 = (panelSvgX + widthMm) / svgTotalW
  // With Three.js flipY=false, canvas Y=0 maps to V=0 (top)
  const v0 = panelSvgY / svgTotalH
  const v1 = (panelSvgY + heightMm) / svgTotalH

  // Vertex order in PlaneGeometry:
  // 0: top-left (-w/2, +h/2) -> (u0, v0)
  // 1: top-right (+w/2, +h/2) -> (u1, v0)
  // 2: bottom-left (-w/2, -h/2) -> (u0, v1)
  // 3: bottom-right (+w/2, -h/2) -> (u1, v1)
  uvAttr.setXY(0, u0, v0)
  uvAttr.setXY(1, u1, v0)
  uvAttr.setXY(2, u0, v1)
  uvAttr.setXY(3, u1, v1)
  uvAttr.needsUpdate = true

  return geo
}

export interface FoldModelHierarchy {
  rootGroup: THREE.Group
  updateFold: (progress: number) => void // 0.0 (flat 2D) to 1.0 (fully folded 3D)
  materials: THREE.MeshPhysicalMaterial[]
}

/**
 * Builds a dynamic 3D kinematic folding model from SVG analysis
 * Supports continuous fold angle transitions from flat dieline sheet to fully folded 3D box
 */
export function buildFolded3DModel(
  analysis: DielineAnalysis,
  boxColor: string = "#ffffff",
  materialFinish: string = "matte",
  dielineTexture: THREE.CanvasTexture | null = null
): FoldModelHierarchy {
  const rootGroup = new THREE.Group()
  const materials: THREE.MeshPhysicalMaterial[] = []

  const isKraft = materialFinish === "kraft"
  const roughness = isKraft ? 0.92 : materialFinish === "glossy" ? 0.08 : materialFinish === "metallic" ? 0.15 : 0.65
  const metalness = materialFinish === "metallic" ? 0.88 : 0.04
  const clearcoat = materialFinish === "glossy" ? 0.95 : 0.0

  const createMaterial = () => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: dielineTexture ? 0xffffff : new THREE.Color(boxColor),
      map: dielineTexture,
      roughness,
      metalness,
      clearcoat,
      side: THREE.DoubleSide,
    })
    materials.push(mat)
    return mat
  }

  const { totalWidthMm: svgW, totalHeightMm: svgH, panels, dims, boxType } = analysis
  const L = dims.length
  const W = dims.width
  const H = dims.height

  // Normalization factor to fit nicely in ~1.5 world units
  const maxDim = Math.max(L, W, H, 80)
  const scale = 1.55 / maxDim

  const panelMap: Record<string, DielinePanelZone> = {}
  panels.forEach((p) => { panelMap[p.face] = p })

  const frontP = panelMap.front || { face: "front", x: 120, y: 60, width: L, height: H }
  const backP = panelMap.back || { face: "back", x: 260, y: 60, width: L, height: H }
  const leftP = panelMap.left || { face: "left", x: 50, y: 60, width: W, height: H }
  const rightP = panelMap.right || { face: "right", x: 190, y: 60, width: W, height: H }
  const topP = panelMap.top || { face: "top", x: 120, y: 20, width: L, height: W }
  const bottomP = panelMap.bottom || { face: "bottom", x: 120, y: 180, width: L, height: W }

  // Kinematic Hinge Groups
  // Base anchor panel: Bottom Base (rests horizontally on XZ floor)
  const baseGroup = new THREE.Group()
  rootGroup.add(baseGroup)

  // 1. Bottom Base Mesh
  const bottomGeo = createPanelGeometry(L * scale, W * scale, bottomP.x, bottomP.y, svgW, svgH)
  bottomGeo.rotateX(Math.PI / 2) // Lay flat on XZ
  const bottomMesh = new THREE.Mesh(bottomGeo, createMaterial())
  bottomMesh.castShadow = true
  bottomMesh.receiveShadow = true
  baseGroup.add(bottomMesh)

  // 2. Front Wall Hinge (attached to front edge of bottom base: Z = +W/2)
  const frontHinge = new THREE.Group()
  frontHinge.position.set(0, 0, (W * scale) / 2)
  baseGroup.add(frontHinge)

  const frontGeo = createPanelGeometry(L * scale, H * scale, frontP.x, frontP.y, svgW, svgH)
  frontGeo.translate(0, (H * scale) / 2, 0) // Center at hinge line
  const frontMesh = new THREE.Mesh(frontGeo, createMaterial())
  frontMesh.castShadow = true
  frontMesh.receiveShadow = true
  frontHinge.add(frontMesh)

  // 3. Back Wall Hinge (attached to back edge of bottom base: Z = -W/2)
  const backHinge = new THREE.Group()
  backHinge.position.set(0, 0, (-W * scale) / 2)
  baseGroup.add(backHinge)

  const backGeo = createPanelGeometry(L * scale, H * scale, backP.x, backP.y, svgW, svgH)
  backGeo.translate(0, (H * scale) / 2, 0)
  const backMesh = new THREE.Mesh(backGeo, createMaterial())
  backMesh.castShadow = true
  backMesh.receiveShadow = true
  backHinge.add(backMesh)

  // 4. Top Lid Hinge (attached to top edge of back wall: Y = +H)
  const topHinge = new THREE.Group()
  topHinge.position.set(0, H * scale, 0)
  backHinge.add(topHinge)

  const topGeo = createPanelGeometry(L * scale, W * scale, topP.x, topP.y, svgW, svgH)
  topGeo.translate(0, (W * scale) / 2, 0)
  const topMesh = new THREE.Mesh(topGeo, createMaterial())
  topMesh.castShadow = true
  topMesh.receiveShadow = true
  topHinge.add(topMesh)

  // 5. Left Wall Hinge (attached to left edge of bottom base: X = -L/2)
  const leftHinge = new THREE.Group()
  leftHinge.position.set((-L * scale) / 2, 0, 0)
  baseGroup.add(leftHinge)

  const leftGeo = createPanelGeometry(W * scale, H * scale, leftP.x, leftP.y, svgW, svgH)
  leftGeo.rotateY(Math.PI / 2) // Orient facing Left (-X)
  leftGeo.translate(0, (H * scale) / 2, 0)
  const leftMesh = new THREE.Mesh(leftGeo, createMaterial())
  leftMesh.castShadow = true
  leftMesh.receiveShadow = true
  leftHinge.add(leftMesh)

  // 6. Right Wall Hinge (attached to right edge of bottom base: X = +L/2)
  const rightHinge = new THREE.Group()
  rightHinge.position.set((L * scale) / 2, 0, 0)
  baseGroup.add(rightHinge)

  const rightGeo = createPanelGeometry(W * scale, H * scale, rightP.x, rightP.y, svgW, svgH)
  rightGeo.rotateY(-Math.PI / 2) // Orient facing Right (+X)
  rightGeo.translate(0, (H * scale) / 2, 0)
  const rightMesh = new THREE.Mesh(rightGeo, createMaterial())
  rightMesh.castShadow = true
  rightMesh.receiveShadow = true
  rightHinge.add(rightMesh)

  // Gable Carton Roof Slope (if Gable style)
  let gableFrontRoof: THREE.Group | null = null
  let gableBackRoof: THREE.Group | null = null

  if (boxType === "gable") {
    // Front gable roof attached to front wall top
    gableFrontRoof = new THREE.Group()
    gableFrontRoof.position.set(0, H * scale, 0)
    frontHinge.add(gableFrontRoof)

    const gableRoofH = (W * scale) * 0.7
    const gFrontGeo = createPanelGeometry(L * scale, gableRoofH, frontP.x, topP.y, svgW, svgH)
    gFrontGeo.translate(0, gableRoofH / 2, 0)
    const gFrontMesh = new THREE.Mesh(gFrontGeo, createMaterial())
    gableFrontRoof.add(gFrontMesh)

    // Back gable roof attached to back wall top
    gableBackRoof = new THREE.Group()
    gableBackRoof.position.set(0, H * scale, 0)
    backHinge.add(gableBackRoof)

    const gBackGeo = createPanelGeometry(L * scale, gableRoofH, backP.x, topP.y, svgW, svgH)
    gBackGeo.translate(0, gableRoofH / 2, 0)
    const gBackMesh = new THREE.Mesh(gBackGeo, createMaterial())
    gableBackRoof.add(gBackMesh)

    // Hide standard flat top lid for gable cartons
    topMesh.visible = false
  }

  // Update Fold Kinematics
  // t = 0.0: Flat 2D dieline (panels lie flat on XZ plane, rotation = 0)
  // t = 1.0: Fully folded 3D packaging (walls at 90°, lids closed)
  const updateFold = (progress: number) => {
    const t = Math.max(0, Math.min(1, progress))

    if (boxType === "gable") {
      // 4 walls fold 90° up
      frontHinge.rotation.x = -((Math.PI / 2) * t)
      backHinge.rotation.x = (Math.PI / 2) * t
      leftHinge.rotation.z = -((Math.PI / 2) * t)
      rightHinge.rotation.z = (Math.PI / 2) * t

      // Gable roof slopes fold inward towards center ridge at ~42°
      if (gableFrontRoof) {
        gableFrontRoof.rotation.x = ((Math.PI / 4.2) * t)
      }
      if (gableBackRoof) {
        gableBackRoof.rotation.x = -((Math.PI / 4.2) * t)
      }
    } else {
      // Standard folding box:
      // Front wall folds up by 90°
      frontHinge.rotation.x = -((Math.PI / 2) * t)
      // Back wall folds up by 90°
      backHinge.rotation.x = (Math.PI / 2) * t
      // Left wall folds up by 90°
      leftHinge.rotation.z = -((Math.PI / 2) * t)
      // Right wall folds up by 90°
      rightHinge.rotation.z = (Math.PI / 2) * t
      // Top lid folds 90° relative to Back wall (so it covers top horizontally)
      topHinge.rotation.x = (Math.PI / 2) * t
    }
  }

  // Initialize at 100% folded
  updateFold(1.0)

  // Center entire box around origin
  rootGroup.position.set(0, (-(H * scale) / 2), 0)

  return {
    rootGroup,
    updateFold,
    materials,
  }
}
