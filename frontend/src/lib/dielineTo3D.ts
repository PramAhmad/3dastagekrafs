// AstaKraf Universal SVG Dieline to 3D Folding Packaging Engine
// Inspired by Pacdora Dieline-to-3D-Mockup CAD Architecture
// Converts 2D SVG Dielines (Cut & Crease vectors) into 3D Folded Packaging Meshes with Realtime Kinematic Hinges

import * as THREE from "three"
import { DielinePanelZone } from "./dielineGenerator"

export interface DielineAnalysis {
  totalWidthMm: number
  totalHeightMm: number
  svgCanvasW: number // in viewBox coordinate units
  svgCanvasH: number // in viewBox coordinate units
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
 * Handles viewBox coordinate systems, millimeter scaling, and FEFCO/CAD vector topologies
 */
export function analyzeSvgDieline(svgText: string): DielineAnalysis {
  if (!svgText) {
    return {
      totalWidthMm: 200,
      totalHeightMm: 200,
      svgCanvasW: 200,
      svgCanvasH: 200,
      cutBox: { x: 20, y: 20, w: 160, h: 160 },
      verticalCreases: [],
      horizontalCreases: [],
      panels: [],
      boxType: "generic-box",
      dims: { length: 100, width: 60, height: 100 },
    }
  }

  // 1. Determine viewBox and physical mm dimensions
  const vbMatch = svgText.match(/viewBox=["\']([\d.\s,-]+)["\']/i)
  let vbMinX = 0
  let vbMinY = 0
  let vbW = 200
  let vbH = 200
  let hasVb = false

  if (vbMatch && vbMatch[1]) {
    const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number)
    if (parts.length >= 4 && !isNaN(parts[2]) && !isNaN(parts[3]) && parts[2] > 0 && parts[3] > 0) {
      vbMinX = parts[0]
      vbMinY = parts[1]
      vbW = parts[2]
      vbH = parts[3]
      hasVb = true
    }
  }

  const wMatch = svgText.match(/width=["\']([\d.]+)(mm|px|cm)?["\']/i)
  const hMatch = svgText.match(/height=["\']([\d.]+)(mm|px|cm)?["\']/i)

  let physW = wMatch && wMatch[1] ? parseFloat(wMatch[1]) : (hasVb ? vbW : 200)
  let physH = hMatch && hMatch[1] ? parseFloat(hMatch[1]) : (hasVb ? vbH : 200)

  if (wMatch && wMatch[2]?.toLowerCase() === "cm") physW *= 10
  if (hMatch && hMatch[2]?.toLowerCase() === "cm") physH *= 10

  const svgCanvasW = hasVb ? vbW : physW
  const svgCanvasH = hasVb ? vbH : physH

  // Scale factor: viewBox units per millimeter
  let pxPerMm = 1.0
  if (hasVb && physW > 0) {
    pxPerMm = vbW / physW
  }

  // 2. Tokenize elements and track group hierarchy
  const groupStack: Array<{ id: string; cls: string; stroke: string; isCut: boolean; isCrease: boolean }> = []
  const tagReg = /<(\/)?([a-zA-Z0-9:-]+)([^>]*?)(\/)?>/g
  let match: RegExpExecArray | null

  const cutXs: number[] = []
  const cutYs: number[] = []
  const rawVertSegments: Array<{ x: number; y1: number; y2: number }> = []
  const rawHorizSegments: Array<{ y: number; x1: number; x2: number }> = []

  while ((match = tagReg.exec(svgText)) !== null) {
    const isClose = !!match[1]
    const tag = match[2].toLowerCase()
    const attrsStr = match[3] || ""
    const isSelfClosing = !!match[4] || attrsStr.trim().endsWith("/")

    if (tag === "g") {
      if (isClose) {
        groupStack.pop()
      } else {
        const id = (attrsStr.match(/\bid=["\']([^"\']+)["\']/i) || [])[1] || ""
        const cls = (attrsStr.match(/\bclass=["\']([^"\']+)["\']/i) || [])[1] || ""
        const stroke = (attrsStr.match(/\bstroke=["\']([^"\']+)["\']/i) || [])[1] || ""
        const isCut = /cut|die-cut|pisau/i.test(id + " " + cls) || /#(ff007f|e11d48|f43f5e|ff0000|d41a5a|magenta)/i.test(stroke)
        const isCrease = /crease|fold|score|lipat/i.test(id + " " + cls) || /#(00a651|10b981|22c55e|00ff00|00adee)/i.test(stroke)
        groupStack.push({ id, cls, stroke, isCut, isCrease })
        if (isSelfClosing) groupStack.pop()
      }
      continue
    }

    if (tag === "path" || tag === "line") {
      const id = (attrsStr.match(/\bid=["\']([^"\']+)["\']/i) || [])[1] || ""
      const cls = (attrsStr.match(/\bclass=["\']([^"\']+)["\']/i) || [])[1] || ""
      const stroke = (attrsStr.match(/\bstroke=["\']([^"\']+)["\']/i) || [])[1] || ""

      // Filter out dimensions, annotations, registration marks, bleed, safe lines
      if (/dim|annotation|crosshair|register|bleed|safe|sheet/i.test(id + " " + cls)) {
        continue
      }

      const parentCut = groupStack.some((g) => g.isCut)
      const parentCrease = groupStack.some((g) => g.isCrease)

      const isCut = parentCut || /cut|die-cut|pisau/i.test(id + " " + cls) || /#(ff007f|e11d48|f43f5e|ff0000|d41a5a|magenta)/i.test(stroke)
      const isCrease = !isCut && (parentCrease || /crease|fold|score|lipat/i.test(id + " " + cls) || /#(00a651|10b981|22c55e|00ff00|00adee)/i.test(stroke))

      if (tag === "path") {
        const d = (attrsStr.match(/\bd=["\']([^"\']+)["\']/i) || [])[1] || ""
        const nums = (d.match(/[-+]?\d*\.?\d+/g) || []).map(Number)
        if (isCut) {
          for (let i = 0; i < nums.length; i += 2) {
            if (!isNaN(nums[i]) && !isNaN(nums[i + 1])) {
              cutXs.push(nums[i])
              cutYs.push(nums[i + 1])
            }
          }
        }
        if (isCrease) {
          for (let i = 0; i < nums.length - 3; i += 2) {
            const x1 = nums[i]
            const y1 = nums[i + 1]
            const x2 = nums[i + 2]
            const y2 = nums[i + 3]
            if (Math.abs(x1 - x2) < 2.0 && Math.abs(y2 - y1) > 8) {
              rawVertSegments.push({ x: (x1 + x2) / 2, y1: Math.min(y1, y2), y2: Math.max(y1, y2) })
            } else if (Math.abs(y1 - y2) < 2.0 && Math.abs(x2 - x1) > 8) {
              rawHorizSegments.push({ y: (y1 + y2) / 2, x1: Math.min(x1, x2), x2: Math.max(x1, x2) })
            }
          }
        }
      } else if (tag === "line") {
        const x1 = parseFloat((attrsStr.match(/x1=["\']([\d.-]+)/i) || [])[1] || "0")
        const y1 = parseFloat((attrsStr.match(/y1=["\']([\d.-]+)/i) || [])[1] || "0")
        const x2 = parseFloat((attrsStr.match(/x2=["\']([\d.-]+)/i) || [])[1] || "0")
        const y2 = parseFloat((attrsStr.match(/y2=["\']([\d.-]+)/i) || [])[1] || "0")
        if (isCut) {
          cutXs.push(x1, x2)
          cutYs.push(y1, y2)
        }
        if (isCrease) {
          if (Math.abs(x1 - x2) < 2.0 && Math.abs(y2 - y1) > 8) {
            rawVertSegments.push({ x: (x1 + x2) / 2, y1: Math.min(y1, y2), y2: Math.max(y1, y2) })
          } else if (Math.abs(y1 - y2) < 2.0 && Math.abs(x2 - x1) > 8) {
            rawHorizSegments.push({ y: (y1 + y2) / 2, x1: Math.min(x1, x2), x2: Math.max(x1, x2) })
          }
        }
      }
    }
  }

  // 3. Determine cut box
  const validCutXs = cutXs.filter((x) => x >= vbMinX && x <= vbMinX + vbW)
  const validCutYs = cutYs.filter((y) => y >= vbMinY && y <= vbMinY + vbH)

  let cutBox = { x: vbMinX + vbW * 0.08, y: vbMinY + vbH * 0.08, w: vbW * 0.84, h: vbH * 0.84 }
  if (validCutXs.length > 0 && validCutYs.length > 0) {
    const minX = Math.min(...validCutXs)
    const maxX = Math.max(...validCutXs)
    const minY = Math.min(...validCutYs)
    const maxY = Math.max(...validCutYs)
    if (maxX - minX > 20 && maxY - minY > 20) {
      cutBox = { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
    }
  }

  // 4. Cluster and filter creases
  // Vertical creases: group by X position
  const clusterValues = (arr: number[], threshold: number = 3.0) => {
    if (arr.length === 0) return []
    const sorted = [...arr].sort((a, b) => a - b)
    const result = [sorted[0]]
    for (let i = 1; i < sorted.length; i++) {
      if (Math.abs(sorted[i] - result[result.length - 1]) > threshold) {
        result.push(sorted[i])
      }
    }
    return result
  }

  const verticalCreases = clusterValues(rawVertSegments.map((s) => s.x)).filter(
    (x) => x > cutBox.x + 3 && x < cutBox.x + cutBox.w - 3
  )

  // Horizontal creases: find the two primary body creases (highest total horizontal spans)
  const hSpans: Record<number, number> = {}
  rawHorizSegments.forEach((s) => {
    const yKey = Math.round(s.y / 2) * 2 // bucket by 2 units
    const span = Math.abs(s.x2 - s.x1)
    hSpans[yKey] = (hSpans[yKey] || 0) + span
  })

  // Pick top horizontal creases with largest spans that lie within cutBox
  const validHKeys = Object.keys(hSpans)
    .map(Number)
    .filter((y) => y > cutBox.y + 5 && y < cutBox.y + cutBox.h - 5)
    .sort((a, b) => (hSpans[b] || 0) - (hSpans[a] || 0))

  let horizontalCreases: number[] = []
  if (validHKeys.length >= 2) {
    const topTwo = [validHKeys[0], validHKeys[1]].sort((a, b) => a - b)
    horizontalCreases = topTwo
  } else {
    horizontalCreases = clusterValues(rawHorizSegments.map((s) => s.y)).filter(
      (y) => y > cutBox.y + 5 && y < cutBox.y + cutBox.h - 5
    )
  }

  // 5. Detect Box Type
  const isGable = /gable|milk|susu|beverage/i.test(svgText)
  const isCylinder = /cylinder|bottle|can|kaleng|spray|cup/i.test(svgText)
  const isMailer = /0427|mailer|tuck-top|pizza/i.test(svgText)

  let boxType: DielineAnalysis["boxType"] = "generic-box"
  if (isGable) boxType = "gable"
  else if (isCylinder) boxType = "cylinder"
  else if (isMailer) boxType = "mailer-0427"
  else if (verticalCreases.length >= 3) boxType = "tube-box"

  // 6. Build Panels and Dimensions
  const panels: DielinePanelZone[] = []
  let lengthMm = 100
  let widthMm = 60
  let heightMm = 120

  const topCrease =
    horizontalCreases.length > 0 ? horizontalCreases[0] : cutBox.y + cutBox.h * 0.18
  const bottomCrease =
    horizontalCreases.length > 1
      ? horizontalCreases[horizontalCreases.length - 1]
      : cutBox.y + cutBox.h * 0.82
  const bodyH = Math.max(10, bottomCrease - topCrease)

  if (verticalCreases.length >= 4) {
    const v0 = verticalCreases[0]
    const v1 = verticalCreases[1]
    const v2 = verticalCreases[2]
    const v3 = verticalCreases[3]

    const glueW = Math.max(8, v0 - cutBox.x)
    const leftW = Math.max(10, v1 - v0)
    const frontW = Math.max(10, v2 - v1)
    const rightW = Math.max(10, v3 - v2)
    const backW = Math.max(10, cutBox.x + cutBox.w - v3)

    lengthMm = Math.round(frontW / pxPerMm)
    widthMm = Math.round(leftW / pxPerMm)
    heightMm = Math.round(bodyH / pxPerMm)

    const topFlapH = Math.max(5, topCrease - cutBox.y)
    const bottomFlapH = Math.max(5, cutBox.y + cutBox.h - bottomCrease)

    panels.push(
      { face: "glue-flap", x: cutBox.x, y: topCrease, width: glueW, height: bodyH, label: "LIDAH LEM (GLUE FLAP)" },
      { face: "left", x: v0, y: topCrease, width: leftW, height: bodyH, label: "SISI KIRI (LEFT)" },
      { face: "front", x: v1, y: topCrease, width: frontW, height: bodyH, label: "MUKA DEPAN (FRONT)" },
      { face: "right", x: v2, y: topCrease, width: rightW, height: bodyH, label: "SISI KANAN (RIGHT)" },
      { face: "back", x: v3, y: topCrease, width: backW, height: bodyH, label: "MUKA BELAKANG (BACK)" },
      { face: "top", x: v1, y: cutBox.y, width: frontW, height: topFlapH, label: "TUTUP ATAS (TOP)" },
      { face: "bottom", x: v1, y: bottomCrease, width: frontW, height: bottomFlapH, label: "ALAS BAWAH (BOTTOM)" }
    )
  } else {
    // Proportional division into 4 tube panels + glue flap
    const glueW = cutBox.w * 0.06
    const pW = (cutBox.w - glueW) / 4
    const topFlapH = cutBox.h * 0.18
    const bottomFlapH = cutBox.h * 0.18
    const calcBodyH = cutBox.h - topFlapH - bottomFlapH
    const calcBodyY = cutBox.y + topFlapH

    lengthMm = Math.round(pW / pxPerMm)
    widthMm = Math.round(pW / pxPerMm)
    heightMm = Math.round(calcBodyH / pxPerMm)

    panels.push(
      { face: "glue-flap", x: cutBox.x, y: calcBodyY, width: glueW, height: calcBodyH, label: "LIDAH LEM" },
      { face: "left", x: cutBox.x + glueW, y: calcBodyY, width: pW, height: calcBodyH, label: "SISI KIRI (LEFT)" },
      { face: "front", x: cutBox.x + glueW + pW, y: calcBodyY, width: pW, height: calcBodyH, label: "MUKA DEPAN (FRONT)" },
      { face: "right", x: cutBox.x + glueW + pW * 2, y: calcBodyY, width: pW, height: calcBodyH, label: "SISI KANAN (RIGHT)" },
      { face: "back", x: cutBox.x + glueW + pW * 3, y: calcBodyY, width: pW, height: calcBodyH, label: "MUKA BELAKANG (BACK)" },
      { face: "top", x: cutBox.x + glueW + pW, y: cutBox.y, width: pW, height: topFlapH, label: "TUTUP ATAS (TOP)" },
      { face: "bottom", x: cutBox.x + glueW + pW, y: calcBodyY + calcBodyH, width: pW, height: bottomFlapH, label: "ALAS BAWAH (BOTTOM)" }
    )
  }

  return {
    totalWidthMm: Math.round(physW),
    totalHeightMm: Math.round(physH),
    svgCanvasW,
    svgCanvasH,
    cutBox,
    verticalCreases,
    horizontalCreases,
    panels,
    boxType,
    dims: { length: lengthMm, width: widthMm, height: heightMm },
  }
}

/**
 * Creates a panel plane geometry in local XY coordinates with 1:1 UV mapping to SVG dieline canvas
 */
export function createPanelGeometry(
  widthWorld: number,
  heightWorld: number,
  panelSvgX: number,
  panelSvgY: number,
  svgTotalW: number,
  svgTotalH: number,
  panelSvgW?: number,
  panelSvgH?: number
): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(widthWorld, heightWorld, 1, 1)
  const uvAttr = geo.attributes.uv

  const pW = panelSvgW !== undefined ? panelSvgW : widthWorld
  const pH = panelSvgH !== undefined ? panelSvgH : heightWorld

  const u0 = Math.max(0, Math.min(1, panelSvgX / svgTotalW))
  const u1 = Math.max(0, Math.min(1, (panelSvgX + pW) / svgTotalW))
  // With flipY = false, Y=0 is top (V=0), Y=H is bottom (V=1)
  const v0 = Math.max(0, Math.min(1, panelSvgY / svgTotalH))
  const v1 = Math.max(0, Math.min(1, (panelSvgY + pH) / svgTotalH))

  // PlaneGeometry vertex order:
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
 * Supports continuous fold angle transitions from flat dieline sheet (0%) to fully folded 3D box (100%)
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

  const { svgCanvasW: svgW, svgCanvasH: svgH, panels, dims, boxType, cutBox } = analysis
  const L_mm = dims.length
  const W_mm = dims.width
  const H_mm = dims.height

  // Normalization factor so box fits comfortably in ~1.5 world units
  const maxDim = Math.max(L_mm, W_mm, H_mm, 80)
  const scale = 1.5 / maxDim

  const L = L_mm * scale
  const W = W_mm * scale
  const H = H_mm * scale

  const panelMap: Record<string, DielinePanelZone> = {}
  panels.forEach((p) => { panelMap[p.face] = p })

  const frontP = panelMap.front || { face: "front", x: 120, y: 60, width: L_mm, height: H_mm }
  const backP = panelMap.back || { face: "back", x: 260, y: 60, width: L_mm, height: H_mm }
  const leftP = panelMap.left || { face: "left", x: 50, y: 60, width: W_mm, height: H_mm }
  const rightP = panelMap.right || { face: "right", x: 190, y: 60, width: W_mm, height: H_mm }
  const glueP = panelMap["glue-flap"] || { face: "glue-flap", x: 20, y: 60, width: W_mm * 0.25, height: H_mm }
  const topP = panelMap.top || { face: "top", x: 120, y: 20, width: L_mm, height: W_mm }
  const bottomP = panelMap.bottom || { face: "bottom", x: 120, y: 180, width: L_mm, height: W_mm }

  const G = (glueP.width * (L / (frontP.width || 1))) || (W * 0.22)
  const topFlapH = (topP.height * (H / (frontP.height || 1))) || W
  const bottomFlapH = (bottomP.height * (H / (frontP.height || 1))) || W

  // ==========================================
  // CASE 1: MAILER BOX (FEFCO 0427)
  // Base anchor panel: Bottom Base (rests on XZ floor)
  // ==========================================
  if (boxType === "mailer-0427") {
    const baseGroup = new THREE.Group()
    rootGroup.add(baseGroup)

    // 1. Bottom Base Mesh (XZ ground)
    const bottomGeo = createPanelGeometry(L, W, bottomP.x, bottomP.y, svgW, svgH, bottomP.width, bottomP.height)
    bottomGeo.rotateX(Math.PI / 2)
    const bottomMesh = new THREE.Mesh(bottomGeo, createMaterial())
    bottomMesh.castShadow = true
    bottomMesh.receiveShadow = true
    baseGroup.add(bottomMesh)

    // 2. Front Wall Hinge
    const frontHinge = new THREE.Group()
    frontHinge.position.set(0, 0, W / 2)
    baseGroup.add(frontHinge)
    const frontGeo = createPanelGeometry(L, H, frontP.x, frontP.y, svgW, svgH, frontP.width, frontP.height)
    frontGeo.translate(0, H / 2, 0)
    const frontMesh = new THREE.Mesh(frontGeo, createMaterial())
    frontHinge.add(frontMesh)

    // 3. Back Wall Hinge
    const backHinge = new THREE.Group()
    backHinge.position.set(0, 0, -W / 2)
    baseGroup.add(backHinge)
    const backGeo = createPanelGeometry(L, H, backP.x, backP.y, svgW, svgH, backP.width, backP.height)
    backGeo.translate(0, H / 2, 0)
    const backMesh = new THREE.Mesh(backGeo, createMaterial())
    backHinge.add(backMesh)

    // 4. Top Lid Hinge
    const topHinge = new THREE.Group()
    topHinge.position.set(0, H, 0)
    backHinge.add(topHinge)
    const topGeo = createPanelGeometry(L, W, topP.x, topP.y, svgW, svgH, topP.width, topP.height)
    topGeo.translate(0, W / 2, 0)
    const topMesh = new THREE.Mesh(topGeo, createMaterial())
    topHinge.add(topMesh)

    // 5. Left Wall Hinge
    const leftHinge = new THREE.Group()
    leftHinge.position.set(-L / 2, 0, 0)
    baseGroup.add(leftHinge)
    const leftGeo = createPanelGeometry(W, H, leftP.x, leftP.y, svgW, svgH, leftP.width, leftP.height)
    leftGeo.rotateY(Math.PI / 2)
    leftGeo.translate(0, H / 2, 0)
    const leftMesh = new THREE.Mesh(leftGeo, createMaterial())
    leftHinge.add(leftMesh)

    // 6. Right Wall Hinge
    const rightHinge = new THREE.Group()
    rightHinge.position.set(L / 2, 0, 0)
    baseGroup.add(rightHinge)
    const rightGeo = createPanelGeometry(W, H, rightP.x, rightP.y, svgW, svgH, rightP.width, rightP.height)
    rightGeo.rotateY(-Math.PI / 2)
    rightGeo.translate(0, H / 2, 0)
    const rightMesh = new THREE.Mesh(rightGeo, createMaterial())
    rightHinge.add(rightMesh)

    const updateFold = (progress: number) => {
      const t = Math.max(0, Math.min(1, progress))
      frontHinge.rotation.x = -((Math.PI / 2) * t)
      backHinge.rotation.x = (Math.PI / 2) * t
      leftHinge.rotation.z = -((Math.PI / 2) * t)
      rightHinge.rotation.z = (Math.PI / 2) * t
      topHinge.rotation.x = (Math.PI / 2) * t
    }

    updateFold(1.0)
    return { rootGroup, updateFold, materials }
  }

  // ==========================================
  // CASE 2: TUBE CARTONS & GABLE CARTONS
  // 4 main vertical walls in horizontal chain:
  // [Glue Flap (G)] | [Left (W)] | [Front (L)] | [Right (W)] | [Back (L)]
  // Anchor panel: Front Panel (Panel 2) at (0, 0, 0)
  // ==========================================

  const centerGroup = new THREE.Group()
  rootGroup.add(centerGroup)

  const frontGroup = new THREE.Group()
  frontGroup.position.y = H / 2
  centerGroup.add(frontGroup)

  // 1. Front Wall Mesh (Width L, Height H, centered at local 0,0,0)
  const frontGeo = createPanelGeometry(L, H, frontP.x, frontP.y, svgW, svgH, frontP.width, frontP.height)
  const frontMesh = new THREE.Mesh(frontGeo, createMaterial())
  frontMesh.castShadow = true
  frontMesh.receiveShadow = true
  frontGroup.add(frontMesh)

  // 2. Right Wall Hinge (attached to right edge of Front: X = +L/2)
  const rightHinge = new THREE.Group()
  rightHinge.position.set(L / 2, 0, 0)
  frontGroup.add(rightHinge)

  const rightGeo = createPanelGeometry(W, H, rightP.x, rightP.y, svgW, svgH, rightP.width, rightP.height)
  rightGeo.translate(W / 2, 0, 0)
  const rightMesh = new THREE.Mesh(rightGeo, createMaterial())
  rightMesh.castShadow = true
  rightMesh.receiveShadow = true
  rightHinge.add(rightMesh)

  // 3. Back Wall Hinge (attached to right edge of Right Wall: X = +W)
  const backHinge = new THREE.Group()
  backHinge.position.set(W, 0, 0)
  rightHinge.add(backHinge)

  const backGeo = createPanelGeometry(L, H, backP.x, backP.y, svgW, svgH, backP.width, backP.height)
  backGeo.translate(L / 2, 0, 0)
  const backMesh = new THREE.Mesh(backGeo, createMaterial())
  backMesh.castShadow = true
  backMesh.receiveShadow = true
  backHinge.add(backMesh)

  // 4. Left Wall Hinge (attached to left edge of Front: X = -L/2)
  const leftHinge = new THREE.Group()
  leftHinge.position.set(-L / 2, 0, 0)
  frontGroup.add(leftHinge)

  const leftGeo = createPanelGeometry(W, H, leftP.x, leftP.y, svgW, svgH, leftP.width, leftP.height)
  leftGeo.translate(-W / 2, 0, 0)
  const leftMesh = new THREE.Mesh(leftGeo, createMaterial())
  leftMesh.castShadow = true
  leftMesh.receiveShadow = true
  leftHinge.add(leftMesh)

  // 5. Glue Flap Hinge (attached to left edge of Left Wall: X = -W)
  const glueHinge = new THREE.Group()
  glueHinge.position.set(-W, 0, 0)
  leftHinge.add(glueHinge)

  const glueGeo = createPanelGeometry(G, H, glueP.x, glueP.y, svgW, svgH, glueP.width, glueP.height)
  glueGeo.translate(-G / 2, 0, 0)
  const glueMesh = new THREE.Mesh(glueGeo, createMaterial())
  glueHinge.add(glueMesh)

  // 6. Top Flaps / Lids / Gable Slopes
  // Front Top Flap:
  const frontTopHinge = new THREE.Group()
  frontTopHinge.position.set(0, H / 2, 0)
  frontGroup.add(frontTopHinge)

  const gableRoofH = boxType === "gable" ? W * 0.72 : topFlapH
  const fTopGeo = createPanelGeometry(L, gableRoofH, frontP.x, topP.y, svgW, svgH, frontP.width, topP.height)
  fTopGeo.translate(0, gableRoofH / 2, 0)
  const fTopMesh = new THREE.Mesh(fTopGeo, createMaterial())
  frontTopHinge.add(fTopMesh)

  // Back Top Flap (Gable back slope or top closure):
  const backTopHinge = new THREE.Group()
  backTopHinge.position.set(L / 2, H / 2, 0)
  backHinge.add(backTopHinge)

  const bTopGeo = createPanelGeometry(L, gableRoofH, backP.x, topP.y, svgW, svgH, backP.width, topP.height)
  bTopGeo.translate(0, gableRoofH / 2, 0)
  const bTopMesh = new THREE.Mesh(bTopGeo, createMaterial())
  backTopHinge.add(bTopMesh)

  // Gable Carton Top Spout Fin (heat seal at ridge)
  let fFinMesh: THREE.Mesh | null = null
  let bFinMesh: THREE.Mesh | null = null
  if (boxType === "gable") {
    const finH = W * 0.18
    const fFinGeo = createPanelGeometry(L, finH, frontP.x, cutBox.y, svgW, svgH, frontP.width, cutBox.h * 0.05)
    fFinGeo.translate(0, finH / 2, 0)
    fFinMesh = new THREE.Mesh(fFinGeo, createMaterial())
    fFinMesh.position.set(0, gableRoofH, 0)
    frontTopHinge.add(fFinMesh)

    const bFinGeo = createPanelGeometry(L, finH, backP.x, cutBox.y, svgW, svgH, backP.width, cutBox.h * 0.05)
    bFinGeo.translate(0, finH / 2, 0)
    bFinMesh = new THREE.Mesh(bFinGeo, createMaterial())
    bFinMesh.position.set(0, gableRoofH, 0)
    backTopHinge.add(bFinMesh)
  }

  // Left & Right Top Dust Flaps:
  const leftTopHinge = new THREE.Group()
  leftTopHinge.position.set(-W / 2, H / 2, 0)
  leftHinge.add(leftTopHinge)

  const lTopGeo = createPanelGeometry(W, topFlapH * 0.75, leftP.x, topP.y, svgW, svgH, leftP.width, topP.height)
  lTopGeo.translate(0, (topFlapH * 0.75) / 2, 0)
  const lTopMesh = new THREE.Mesh(lTopGeo, createMaterial())
  leftTopHinge.add(lTopMesh)

  const rightTopHinge = new THREE.Group()
  rightTopHinge.position.set(W / 2, H / 2, 0)
  rightHinge.add(rightTopHinge)

  const rTopGeo = createPanelGeometry(W, topFlapH * 0.75, rightP.x, topP.y, svgW, svgH, rightP.width, topP.height)
  rTopGeo.translate(0, (topFlapH * 0.75) / 2, 0)
  const rTopMesh = new THREE.Mesh(rTopGeo, createMaterial())
  rightTopHinge.add(rTopMesh)

  // 7. Bottom Flaps (Fold under the box to close base)
  // Front Bottom Flap:
  const frontBottomHinge = new THREE.Group()
  frontBottomHinge.position.set(0, -H / 2, 0)
  frontGroup.add(frontBottomHinge)

  const fBotGeo = createPanelGeometry(L, bottomFlapH, frontP.x, bottomP.y, svgW, svgH, frontP.width, bottomP.height)
  fBotGeo.translate(0, -bottomFlapH / 2, 0)
  const fBotMesh = new THREE.Mesh(fBotGeo, createMaterial())
  frontBottomHinge.add(fBotMesh)

  // Back Bottom Flap:
  const backBottomHinge = new THREE.Group()
  backBottomHinge.position.set(L / 2, -H / 2, 0)
  backHinge.add(backBottomHinge)

  const bBotGeo = createPanelGeometry(L, bottomFlapH, backP.x, bottomP.y, svgW, svgH, backP.width, bottomP.height)
  bBotGeo.translate(0, -bottomFlapH / 2, 0)
  const bBotMesh = new THREE.Mesh(bBotGeo, createMaterial())
  backBottomHinge.add(bBotMesh)

  // Left & Right Bottom Flaps:
  const leftBottomHinge = new THREE.Group()
  leftBottomHinge.position.set(-W / 2, -H / 2, 0)
  leftHinge.add(leftBottomHinge)

  const lBotGeo = createPanelGeometry(W, bottomFlapH * 0.75, leftP.x, bottomP.y, svgW, svgH, leftP.width, bottomP.height)
  lBotGeo.translate(0, -(bottomFlapH * 0.75) / 2, 0)
  const lBotMesh = new THREE.Mesh(lBotGeo, createMaterial())
  leftBottomHinge.add(lBotMesh)

  const rightBottomHinge = new THREE.Group()
  rightBottomHinge.position.set(W / 2, -H / 2, 0)
  rightHinge.add(rightBottomHinge)

  const rBotGeo = createPanelGeometry(W, bottomFlapH * 0.75, rightP.x, bottomP.y, svgW, svgH, rightP.width, bottomP.height)
  rBotGeo.translate(0, -(bottomFlapH * 0.75) / 2, 0)
  const rBotMesh = new THREE.Mesh(rBotGeo, createMaterial())
  rightBottomHinge.add(rBotMesh)

  // Calculate flat 2D layout center offset along X so flat sheet is centered at X=0
  const flatMinX = -L / 2 - W - G
  const flatMaxX = L / 2 + W + L
  const flatCenterX = (flatMinX + flatMaxX) / 2

  // Update Fold Kinematics
  // t = 0.0: Flat 2D dieline sheet (rotations = 0, flat in XY plane)
  // t = 1.0: Fully folded 3D carton (walls at 90°, lids and base closed)
  const updateFold = (progress: number) => {
    const t = Math.max(0, Math.min(1, progress))

    // 1. Vertical wall hinges fold 90° into rectangular tube
    rightHinge.rotation.y = (Math.PI / 2) * t
    backHinge.rotation.y = (Math.PI / 2) * t
    leftHinge.rotation.y = -((Math.PI / 2) * t)
    glueHinge.rotation.y = -((Math.PI / 2) * t)

    // 2. Top Flaps / Lids / Roof
    if (boxType === "gable") {
      // Slopes fold inward ~42° towards apex ridge
      const gableAngle = (Math.PI / 4.2) * t
      frontTopHinge.rotation.x = -gableAngle
      backTopHinge.rotation.x = -gableAngle

      // Counter-rotate the top spout fin so they stand vertical together at the ridge
      if (fFinMesh) fFinMesh.rotation.x = gableAngle
      if (bFinMesh) bFinMesh.rotation.x = gableAngle

      // Side dust flaps fold inwards
      leftTopHinge.rotation.x = -((Math.PI / 2) * t)
      rightTopHinge.rotation.x = -((Math.PI / 2) * t)
    } else {
      // Standard folding box top lid
      frontTopHinge.rotation.x = -((Math.PI / 2) * t)
      backTopHinge.rotation.x = -((Math.PI / 2) * t)
      leftTopHinge.rotation.x = -((Math.PI / 2) * t)
      rightTopHinge.rotation.x = -((Math.PI / 2) * t)
    }

    // 3. Bottom Flaps fold 90° under the box to seal base
    frontBottomHinge.rotation.x = (Math.PI / 2) * t
    backBottomHinge.rotation.x = (Math.PI / 2) * t
    leftBottomHinge.rotation.x = (Math.PI / 2) * t
    rightBottomHinge.rotation.x = (Math.PI / 2) * t

    // 4. Smoothly shift center so 2D flat sheet is centered at X=0, Z=0,
    // and folded 3D box center of mass is centered at X=0, Z=0
    centerGroup.position.z = (W / 2) * t
    centerGroup.position.x = -flatCenterX * (1 - t)
  }

  // Initialize at 100% folded
  updateFold(1.0)

  return {
    rootGroup,
    updateFold,
    materials,
  }
}
