// AstaKraf Universal SVG Dieline to 3D Folding Packaging Engine
// Converts 2D SVG Dielines (Cut & Crease vectors) into 3D Folded Packaging Meshes with Realtime Kinematic Hinges

import * as THREE from "three"
import { DielinePanelZone } from "./dielineGenerator"
import { getCardboardBumpTexture } from "./cardboardTexture"
import { AssemblyFamily, getAssemblyPreviewSpec } from "./dielineAssemblyCatalog"

export type DielineBoxType =
  | "tube-box"
  | "gable"
  | "mailer-0427"
  | "cylinder-wrap"
  | "pouch"
  | "flat-card"
  | "polygon-prism"
  | "folder"
  | "generic-box"

export interface DielineAnalysis {
  modelId?: string
  assemblyFile?: string
  assemblyFamily?: AssemblyFamily
  assemblyDimensions?: Record<string, number | Record<string, number>>
  totalWidthMm: number
  totalHeightMm: number
  svgCanvasW: number // in viewBox coordinate units
  svgCanvasH: number // in viewBox coordinate units
  cutBox: { x: number; y: number; w: number; h: number }
  cutContours: Array<Array<{ x: number; y: number }>>
  verticalCreases: number[]
  horizontalCreases: number[]
  panels: DielinePanelZone[]
  boxType: DielineBoxType
  dims: {
    length: number // mm
    width: number  // mm
    height: number // mm
  }
  cadStats: {
    cutSegmentsCount: number       // Pisau Potong (Merah Solid / Non-dash)
    creaseSegmentsCount: number    // Garis Lipat (Hijau Dashed)
    bleedSegmentsCount: number     // Garis Bleed / Safe Zone (Biru/Cyan)
  }
}

interface PathSegment {
  x1: number
  y1: number
  x2: number
  y2: number
}

function parseSvgPoints(points: string, close: boolean = false): PathSegment[] {
  const values = (points.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi) || []).map(Number)
  const segments: PathSegment[] = []

  for (let i = 0; i + 3 < values.length; i += 2) {
    segments.push({ x1: values[i], y1: values[i + 1], x2: values[i + 2], y2: values[i + 3] })
  }

  if (close && values.length >= 6) {
    segments.push({
      x1: values[values.length - 2],
      y1: values[values.length - 1],
      x2: values[0],
      y2: values[1],
    })
  }

  return segments
}

function getSvgAttribute(attrs: string, name: string): string {
  return (attrs.match(new RegExp(`(?:^|\\s)${name}=["']([^"']+)["']`, "i")) || [])[1] || ""
}

function polygonArea(points: Array<{ x: number; y: number }>): number {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const current = points[i]
    const next = points[(i + 1) % points.length]
    area += current.x * next.y - next.x * current.y
  }
  return area / 2
}

function pointInPolygon(point: { x: number; y: number }, polygon: Array<{ x: number; y: number }>): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    const crosses = (a.y > point.y) !== (b.y > point.y) && point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || Number.EPSILON) + a.x
    if (crosses) inside = !inside
  }
  return inside
}

/**
 * Parses SVG path d attribute into linear coordinate segments
 */
export function parseSvgPathSegments(d: string): PathSegment[] {
  const segments: PathSegment[] = []
  const cmdReg = /([a-df-z])([^a-df-z]*)/gi
  let match: RegExpExecArray | null
  let curX = 0, curY = 0
  let startX = 0, startY = 0

  while ((match = cmdReg.exec(d)) !== null) {
    const cmd = match[1]
    const args = (match[2].match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi) || []).map(Number)
    const isRel = cmd === cmd.toLowerCase()
    const type = cmd.toUpperCase()

    if (type === "M") {
      for (let i = 0; i < args.length; i += 2) {
        const x = isRel && i > 0 ? curX + args[i] : (isRel ? curX + args[i] : args[i])
        const y = isRel && i > 0 ? curY + args[i + 1] : (isRel ? curY + args[i + 1] : args[i + 1])
        if (i === 0) {
          curX = x
          curY = y
          startX = x
          startY = y
        } else {
          segments.push({ x1: curX, y1: curY, x2: x, y2: y })
          curX = x
          curY = y
        }
      }
    } else if (type === "L") {
      for (let i = 0; i < args.length; i += 2) {
        const x = isRel ? curX + args[i] : args[i]
        const y = isRel ? curY + args[i + 1] : args[i + 1]
        segments.push({ x1: curX, y1: curY, x2: x, y2: y })
        curX = x
        curY = y
      }
    } else if (type === "H") {
      for (let i = 0; i < args.length; i++) {
        const x = isRel ? curX + args[i] : args[i]
        segments.push({ x1: curX, y1: curY, x2: x, y2: curY })
        curX = x
      }
    } else if (type === "V") {
      for (let i = 0; i < args.length; i++) {
        const y = isRel ? curY + args[i] : args[i]
        segments.push({ x1: curX, y1: curY, x2: curX, y2: y })
        curY = y
      }
    } else if (type === "C") {
      // Cubic Bezier: (cp1x, cp1y, cp2x, cp2y, endX, endY)
      for (let i = 0; i < args.length; i += 6) {
        const endX = isRel ? curX + args[i + 4] : args[i + 4]
        const endY = isRel ? curY + args[i + 5] : args[i + 5]
        segments.push({ x1: curX, y1: curY, x2: endX, y2: endY })
        curX = endX
        curY = endY
      }
    } else if (type === "S" || type === "Q") {
      for (let i = 0; i < args.length; i += 4) {
        const endX = isRel ? curX + args[i + 2] : args[i + 2]
        const endY = isRel ? curY + args[i + 3] : args[i + 3]
        segments.push({ x1: curX, y1: curY, x2: endX, y2: endY })
        curX = endX
        curY = endY
      }
    } else if (type === "A") {
      // Arc: rx ry rot large sweep endX endY
      for (let i = 0; i < args.length; i += 7) {
        const endX = isRel ? curX + args[i + 5] : args[i + 5]
        const endY = isRel ? curY + args[i + 6] : args[i + 6]
        segments.push({ x1: curX, y1: curY, x2: endX, y2: endY })
        curX = endX
        curY = endY
      }
    } else if (type === "Z") {
      segments.push({ x1: curX, y1: curY, x2: startX, y2: startY })
      curX = startX
      curY = startY
    }
  }
  return segments
}

/**
 * Parses raw SVG dieline and extracts cut boundaries, crease lines, and semantic panels
 * Strictly follows Packaging CAD & Structural Diemaking rules:
 * - Red / Magenta / Non-dash Solid = PISAU POTONG (Through Cut) -> Boundary & cutout profile
 * - Green / Dashed (stroke-dasharray) / Fold Group = GARIS LIPAT (Crease / Score) -> Sendi lipatan kemasan 3D (Hinges)
 * - Cyan / Blue = BLEED / SAFE MARGIN (Batas lebihan cetak 3mm)
 */
export function analyzeSvgDieline(svgText: string): DielineAnalysis {
  if (!svgText) {
    return {
      totalWidthMm: 200,
      totalHeightMm: 200,
      svgCanvasW: 200,
      svgCanvasH: 200,
      cutBox: { x: 20, y: 20, w: 160, h: 160 },
      cutContours: [],
      verticalCreases: [],
      horizontalCreases: [],
      panels: [],
      boxType: "flat-card",
      dims: { length: 160, width: 1, height: 160 },
      cadStats: { cutSegmentsCount: 0, creaseSegmentsCount: 0, bleedSegmentsCount: 0 },
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
  const modelId = (svgText.match(/\bdata-model-id=["']([^"']+)["']/i) || [])[1]
  const assemblyFile = (svgText.match(/\bdata-assembly-file=["']([^"']+)["']/i) || [])[1]
  const assemblySpec = getAssemblyPreviewSpec(modelId)

  // Scale factor: viewBox units per millimeter
  let pxPerMm = 1.0
  if (hasVb && physW > 0) {
    pxPerMm = vbW / physW
  }

  // 2. Tokenize elements and track group hierarchy
  const groupStack: Array<{ id: string; cls: string; stroke: string; isCut: boolean; isCrease: boolean; isNonFold: boolean }> = []
  const tagReg = /<(\/)?([a-zA-Z0-9:-]+)([^>]*?)(\/)?>/g
  let match: RegExpExecArray | null

  const cutSegs: PathSegment[] = []
  const cutContours: Array<Array<{ x: number; y: number }>> = []
  const creaseSegs: PathSegment[] = []

  let cutSegmentsCount = 0
  let creaseSegmentsCount = 0
  let bleedSegmentsCount = 0

  while ((match = tagReg.exec(svgText)) !== null) {
    const isClose = !!match[1]
    // Compare local names so namespaced SVG tags such as ns0:g remain valid input.
    const tag = match[2].toLowerCase().split(":").pop() || ""
    const attrsStr = match[3] || ""
    const isSelfClosing = !!match[4] || attrsStr.trim().endsWith("/")

    if (tag === "g") {
      if (isClose) {
        groupStack.pop()
      } else {
        const id = (attrsStr.match(/\bid=["\']([^"\']+)["\']/i) || [])[1] || ""
        const cls = (attrsStr.match(/\bclass=["\']([^"\']+)["\']/i) || [])[1] || ""
        const stroke = (attrsStr.match(/\bstroke=["\']([^"\']+)["\']/i) || [])[1] || ""
        const dash = (attrsStr.match(/\bstroke-dasharray=["\']([^"\']+)["\']/i) || [])[1] || ""
        const context = id + " " + cls
        const isNonFold = /seal|glue|bleed|safe|perf|kiss[_-]?cut|artwork|info|annotation/i.test(context)
        const isCut = !isNonFold && (/cut|die-cut|page-cut|pisau/i.test(context) || /#(ff007f|e11d48|f43f5e|ff0000|d41a5a|magenta)/i.test(stroke))
        const isCrease = !isNonFold && (/crease|fold|page-fold|score|lipat/i.test(context) || /#(00a651|10b981|22c55e|00ff00)/i.test(stroke) || (dash.length > 0 && dash !== "none"))
        groupStack.push({ id, cls, stroke, isCut, isCrease, isNonFold })
        if (isSelfClosing) groupStack.pop()
      }
      continue
    }

    if (tag === "path" || tag === "line" || tag === "polyline" || tag === "polygon" || tag === "rect") {
      const id = (attrsStr.match(/\bid=["\']([^"\']+)["\']/i) || [])[1] || ""
      const cls = (attrsStr.match(/\bclass=["\']([^"\']+)["\']/i) || [])[1] || ""
      const stroke = (attrsStr.match(/\bstroke=["\']([^"\']+)["\']/i) || [])[1] || ""
      const dash = (attrsStr.match(/\bstroke-dasharray=["\']([^"\']+)["\']/i) || [])[1] || ""

      // Filter out dimensions, annotations, registration marks, sheet, pagetext, labels, title-block
      const fullContext = (id + " " + cls + " " + groupStack.map(g => g.id + " " + g.cls).join(" ")).toLowerCase()
      if (/dim|annotation|crosshair|register|sheet|pagetext|labels|title-block|artwork/i.test(fullContext)) {
        continue
      }

      const isDashed = dash.length > 0 && dash !== "none"
      const isRedStroke = /#(ff007f|e11d48|f43f5e|ff0000|d41a5a|magenta|red)/i.test(stroke)
      const isGreenStroke = /#(00a651|10b981|22c55e|00ff00|008000|green)/i.test(stroke)
      const isBleedGroup = /bleed|safe/i.test(fullContext)

      const parentCut = groupStack.some((g) => g.isCut)
      const parentCrease = groupStack.some((g) => g.isCrease)
      const parentNonFold = groupStack.some((g) => g.isNonFold)

      // Crease: Green stroke OR Dashed line OR inside fold/crease group (e.g. templatemaker #00adee inside page-fold)
      const isCrease = !isBleedGroup && !parentNonFold && (parentCrease || isDashed || isGreenStroke || /crease|fold|page-fold|score|lipat/i.test(id + " " + cls))
      // Cut: Red/Magenta stroke OR inside cut/die-cut group
      const isCut = !isBleedGroup && !isCrease && (parentCut || isRedStroke || /cut|die-cut|page-cut|pisau/i.test(id + " " + cls))
      const isBleed = isBleedGroup && !isCut && !isCrease

      let segs: PathSegment[] = []
      if (tag === "path") {
        const d = getSvgAttribute(attrsStr, "d")
        segs = parseSvgPathSegments(d)
      } else if (tag === "line") {
        const x1 = parseFloat((attrsStr.match(/x1=["\']([\d.-]+)/i) || [])[1] || "0")
        const y1 = parseFloat((attrsStr.match(/y1=["\']([\d.-]+)/i) || [])[1] || "0")
        const x2 = parseFloat((attrsStr.match(/x2=["\']([\d.-]+)/i) || [])[1] || "0")
        const y2 = parseFloat((attrsStr.match(/y2=["\']([\d.-]+)/i) || [])[1] || "0")
        segs = [{ x1, y1, x2, y2 }]
      } else if (tag === "polyline" || tag === "polygon") {
        segs = parseSvgPoints(getSvgAttribute(attrsStr, "points"), tag === "polygon")
      } else if (tag === "rect") {
        const x = parseFloat(getSvgAttribute(attrsStr, "x") || "0")
        const y = parseFloat(getSvgAttribute(attrsStr, "y") || "0")
        const w = parseFloat(getSvgAttribute(attrsStr, "width") || "0")
        const h = parseFloat(getSvgAttribute(attrsStr, "height") || "0")
        if (w > 0 && h > 0) {
          segs = [
            { x1: x, y1: y, x2: x + w, y2: y },
            { x1: x + w, y1: y, x2: x + w, y2: y + h },
            { x1: x + w, y1: y + h, x2: x, y2: y + h },
            { x1: x, y1: y + h, x2: x, y2: y },
          ]
        }
      }

      if (isBleed) {
        bleedSegmentsCount += segs.length
      } else if (isCrease) {
        creaseSegmentsCount += segs.length
        creaseSegs.push(...segs)
      } else if (isCut) {
        cutSegmentsCount += segs.length
        cutSegs.push(...segs)
        if (segs.length >= 3) {
          const points = [{ x: segs[0].x1, y: segs[0].y1 }, ...segs.map((segment) => ({ x: segment.x2, y: segment.y2 }))]
          const first = points[0]
          const last = points[points.length - 1]
          if (Math.hypot(first.x - last.x, first.y - last.y) <= 0.5) {
            cutContours.push(points.slice(0, -1))
          }
        }
      }
    }
  }

  // 3. Determine cut box from cut segments
  let cutBox = { x: vbMinX + vbW * 0.08, y: vbMinY + vbH * 0.08, w: vbW * 0.84, h: vbH * 0.84 }
  if (cutSegs.length > 0) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    cutSegs.forEach((s) => {
      minX = Math.min(minX, s.x1, s.x2)
      maxX = Math.max(maxX, s.x1, s.x2)
      minY = Math.min(minY, s.y1, s.y2)
      maxY = Math.max(maxY, s.y1, s.y2)
    })
    if (maxX - minX > 10 && maxY - minY > 10) {
      cutBox = { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
    }
  }

  // 4. Cluster and filter creases
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

  const rawVCreases: number[] = []
  const rawHCreases: Array<{ value: number; length: number }> = []

  creaseSegs.forEach((s) => {
    if (Math.abs(s.x1 - s.x2) < 2.5 && Math.abs(s.y2 - s.y1) > 8) {
      rawVCreases.push((s.x1 + s.x2) / 2)
    } else if (Math.abs(s.y1 - s.y2) < 2.5 && Math.abs(s.x2 - s.x1) > 8) {
      rawHCreases.push({ value: (s.y1 + s.y2) / 2, length: Math.abs(s.x2 - s.x1) })
    }
  })

  const verticalCreases = clusterValues(rawVCreases).filter(
    (x) => x > cutBox.x + 3 && x < cutBox.x + cutBox.w - 3
  )

  // Body boundaries usually have broad coverage across several adjacent panels.
  // Rank clustered horizontal creases by total span so short roof/handle folds do not become body edges.
  const horizontalClusters: Array<{ y: number; coverage: number }> = []
  rawHCreases
    .sort((a, b) => a.value - b.value)
    .forEach(({ value, length }) => {
      const cluster = horizontalClusters.find((item) => Math.abs(item.y - value) <= 3)
      if (cluster) {
        cluster.coverage += length
      } else {
        horizontalClusters.push({ y: value, coverage: length })
      }
    })

  const horizontalCreases = horizontalClusters
    .filter(({ y }) => y > cutBox.y + 3 && y < cutBox.y + cutBox.h - 3)
    .sort((a, b) => b.coverage - a.coverage)
    .slice(0, 2)
    .map(({ y }) => y)
    .sort((a, b) => a - b)

  // 5. Structure & Shape Topology Detection (No artificial forced classification!)
  const isGable = assemblySpec?.family === "gable_carton" || /gable|milk|susu|beverage/i.test(svgText)
  const isCylinder = /cylinder|bottle|can|kaleng|spray|cup/i.test(svgText)
  const isMailer = /0427|mailer|tuck-top|pizza/i.test(svgText)
  const isPouch = /pouch|doypack|standing-pouch|sachet/i.test(svgText)

  const cutAspect = cutBox.w / (cutBox.h || 1)

  let boxType: DielineBoxType = "generic-box"

  if (assemblySpec?.family === "flexible_gusset_pouch" || assemblySpec?.family === "film_seal_and_deformation") {
    boxType = "pouch"
  } else if (assemblySpec?.family === "flat_sheet_or_curved_label_wrap") {
    boxType = typeof assemblySpec.dimensions.outerDiameter === "number" ? "cylinder-wrap" : "flat-card"
  } else if (assemblySpec?.family === "flat_sheet_selective_folding") {
    boxType = "folder"
  } else if (assemblySpec?.family === "tapered_cup" || assemblySpec?.family === "tapered_cup_sleeve" || assemblySpec?.family === "circular_tube") {
    boxType = "cylinder-wrap"
  } else if (assemblySpec?.family === "rolled_wall_mailer" || assemblySpec?.family === "food_clamshell") {
    boxType = "mailer-0427"
  } else if (isMailer) {
    boxType = "mailer-0427"
  } else if (isGable) {
    boxType = "gable"
  } else if (verticalCreases.length === 0) {
    if (isPouch) {
      boxType = "pouch"
    } else if (isCylinder || cutAspect > 1.35) {
      boxType = "cylinder-wrap"
    } else {
      boxType = "flat-card"
    }
  } else if (verticalCreases.length === 1) {
    boxType = "folder"
  } else if (verticalCreases.length === 2) {
    boxType = "folder"
  } else if (verticalCreases.length === 4) {
    boxType = "tube-box"
  } else {
    // 3 creases (triangular prism), 5 creases (pentagon), 6 creases (hexagonal), etc.
    boxType = "polygon-prism"
  }

  // 6. Build Panels and Physical Dimensions
  const panels: DielinePanelZone[] = []
  let lengthMm = 100
  let widthMm = 60
  let heightMm = 120

  const topCrease = horizontalCreases.length > 0 ? horizontalCreases[0] : cutBox.y
  const bottomCrease =
    horizontalCreases.length > 1
      ? horizontalCreases[horizontalCreases.length - 1]
      : cutBox.y + cutBox.h
  const bodyH = Math.max(10, bottomCrease - topCrease)

  if (verticalCreases.length >= 1) {
    // Dynamic N-panel partitioning along extracted vertical creases
    const boundaries = [cutBox.x, ...verticalCreases, cutBox.x + cutBox.w]
    const panelWidths = []
    for (let i = 0; i < boundaries.length - 1; i++) {
      panelWidths.push(boundaries[i + 1] - boundaries[i])
    }

    // Check if panel 0 is a glue flap (significantly narrower than adjacent wall)
    const isPanel0Glue = panelWidths.length >= 4 && panelWidths[0] < 0.42 * panelWidths[1] && panelWidths[0] / pxPerMm < 65
    const lastPanelIndex = panelWidths.length - 1
    const isLastPanelGlue = panelWidths.length >= 4 && panelWidths[lastPanelIndex] < 0.42 * panelWidths[lastPanelIndex - 1] && panelWidths[lastPanelIndex] / pxPerMm < 65

    panelWidths.forEach((w, i) => {
      const pX = boundaries[i]
      let label = `PANEL ${i + 1}`
      let faceName = `panel-${i}`

      if (isPanel0Glue && i === 0) {
        label = "LIDAH LEM (GLUE FLAP)"
        faceName = "glue-flap"
      } else if (isLastPanelGlue && i === lastPanelIndex) {
        label = "LIDAH LEM (GLUE FLAP)"
        faceName = "glue-flap"
      } else if (panelWidths.length === 5 && isPanel0Glue) {
        // Standard 4-wall tube box
        if (i === 1) { label = "SISI KIRI (LEFT)"; faceName = "left" }
        else if (i === 2) { label = "MUKA DEPAN (FRONT)"; faceName = "front" }
        else if (i === 3) { label = "SISI KANAN (RIGHT)"; faceName = "right" }
        else if (i === 4) { label = "MUKA BELAKANG (BACK)"; faceName = "back" }
      }

      panels.push({
        face: faceName,
        x: pX,
        y: topCrease,
        width: w,
        height: bodyH,
        label,
      })
    })

    if (panelWidths.length >= 4) {
      const wallWidths = panelWidths.filter((_, index) => !(isPanel0Glue && index === 0) && !(isLastPanelGlue && index === lastPanelIndex))
      lengthMm = Math.round(wallWidths[0] / pxPerMm)
      widthMm = Math.round((wallWidths[1] || wallWidths[0]) / pxPerMm)
    } else {
      lengthMm = Math.round(panelWidths[0] / pxPerMm)
      widthMm = Math.round((panelWidths[1] || panelWidths[0]) / pxPerMm)
    }
    heightMm = Math.round(bodyH / pxPerMm)
  } else {
    // 0 vertical creases: Single piece (Wrap, Pouch, or Flat Card) - NEVER cut into fake 4 walls!
    if (boxType === "cylinder-wrap") {
      const diam = Math.round((cutBox.w / Math.PI) / pxPerMm)
      lengthMm = diam
      widthMm = diam
      heightMm = Math.round(cutBox.h / pxPerMm)
      panels.push({
        face: "wrap-body",
        x: cutBox.x,
        y: cutBox.y,
        width: cutBox.w,
        height: cutBox.h,
        label: "LABEL KELILING (CYLINDER WRAP)",
      })
    } else if (boxType === "pouch") {
      lengthMm = Math.round(cutBox.w / pxPerMm)
      widthMm = Math.round((cutBox.w * 0.28) / pxPerMm)
      heightMm = Math.round(cutBox.h / pxPerMm)
      panels.push({
        face: "pouch-body",
        x: cutBox.x,
        y: cutBox.y,
        width: cutBox.w,
        height: cutBox.h,
        label: "BADAN POUCH (STAND-UP POUCH)",
      })
    } else {
      lengthMm = Math.round(cutBox.w / pxPerMm)
      widthMm = 1 // Board thickness
      heightMm = Math.round(cutBox.h / pxPerMm)
      panels.push({
        face: "flat-card",
        x: cutBox.x,
        y: cutBox.y,
        width: cutBox.w,
        height: cutBox.h,
        label: "PAPAN KEMASAN (FLAT DIE-CUT BOARD)",
      })
    }
  }

  const assemblyLength = assemblySpec?.dimensions.L
  const assemblyWidth = assemblySpec?.dimensions.W
  const assemblyHeight = assemblySpec?.dimensions.H
  if (typeof assemblyLength === "number") lengthMm = assemblyLength
  if (typeof assemblyWidth === "number") widthMm = assemblyWidth
  if (typeof assemblyHeight === "number") heightMm = assemblyHeight
  const assemblyTopDiameter = assemblySpec?.dimensions.topOuterDiameter
  const assemblyOuterDiameter = assemblySpec?.dimensions.outerDiameter
  const assemblyNominalDiameter = assemblySpec?.dimensions.nominalDiameter
  const assemblyWallHeight = assemblySpec?.dimensions.wallHeight
  if (typeof assemblyTopDiameter === "number") {
    lengthMm = assemblyTopDiameter
    widthMm = assemblyTopDiameter
  } else if (typeof assemblyOuterDiameter === "number") {
    lengthMm = assemblyOuterDiameter
    widthMm = assemblyOuterDiameter
  } else if (typeof assemblyNominalDiameter === "number") {
    lengthMm = assemblyNominalDiameter
    widthMm = assemblyNominalDiameter
  }
  if (typeof assemblyWallHeight === "number") heightMm = assemblyWallHeight
  const assemblyFilmWidth = assemblySpec?.dimensions.filmWidth
  const assemblyPanelHeight = assemblySpec?.dimensions.panelHeight
  const assemblyGusset = assemblySpec?.dimensions.bottomGusset
  if (typeof assemblyFilmWidth === "number") lengthMm = assemblyFilmWidth
  if (typeof assemblyGusset === "number") widthMm = assemblyGusset
  if (typeof assemblyPanelHeight === "number") heightMm = assemblyPanelHeight
  const assemblyPrimaryPart = assemblySpec?.dimensions.tray || assemblySpec?.dimensions.base
  if (assemblyPrimaryPart && typeof assemblyPrimaryPart === "object") {
    lengthMm = assemblyPrimaryPart.L
    widthMm = assemblyPrimaryPart.W
    heightMm = assemblyPrimaryPart.H
  }
  if (modelId === "hangtag") widthMm = 0.8
  if (modelId === "keychain-mockup") widthMm = 3
  if (modelId === "pin-button") {
    lengthMm = 58
    widthMm = 3.5
    heightMm = 58
  }

  return {
    modelId,
    assemblyFile,
    assemblyFamily: assemblySpec?.family,
    assemblyDimensions: assemblySpec?.dimensions,
    totalWidthMm: Math.round(physW),
    totalHeightMm: Math.round(physH),
    svgCanvasW,
    svgCanvasH,
    cutBox,
    cutContours,
    verticalCreases,
    horizontalCreases,
    panels,
    boxType,
    dims: { length: Math.max(10, lengthMm), width: Math.max(0.05, widthMm), height: Math.max(10, heightMm) },
    cadStats: {
      cutSegmentsCount,
      creaseSegmentsCount,
      bleedSegmentsCount,
    },
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
  const v0 = Math.max(0, Math.min(1, panelSvgY / svgTotalH))
  const v1 = Math.max(0, Math.min(1, (panelSvgY + pH) / svgTotalH))

  uvAttr.setXY(0, u0, v0)
  uvAttr.setXY(1, u1, v0)
  uvAttr.setXY(2, u0, v1)
  uvAttr.setXY(3, u1, v1)
  uvAttr.needsUpdate = true

  return geo
}

/**
 * Creates an authentically die-cut packaging flap geometry with tapered or chamfered edges
 */
export function createDieCutFlapGeometry(
  widthWorld: number,
  heightWorld: number,
  panelSvgX: number,
  panelSvgY: number,
  svgTotalW: number,
  svgTotalH: number,
  panelSvgW?: number,
  panelSvgH?: number,
  flapType: "glue" | "dust-top" | "dust-bottom" | "tuck" | "rect" = "rect"
): THREE.BufferGeometry {
  const pW = panelSvgW !== undefined ? panelSvgW : widthWorld
  const pH = panelSvgH !== undefined ? panelSvgH : heightWorld

  if (flapType === "glue") {
    // Glue flap: hinged at x=0 (y in [-H/2, +H/2]), extends into -X (width G)
    const taper = Math.min(heightWorld * 0.12, widthWorld * 0.45)
    const shape = new THREE.Shape()
    shape.moveTo(0, -heightWorld / 2)
    shape.lineTo(-widthWorld, -heightWorld / 2 + taper)
    shape.lineTo(-widthWorld, heightWorld / 2 - taper)
    shape.lineTo(0, heightWorld / 2)
    shape.closePath()

    const geo = new THREE.ShapeGeometry(shape)
    applyShapeUVs(geo, -widthWorld, 0, -heightWorld / 2, heightWorld / 2, panelSvgX, panelSvgY, pW, pH, svgTotalW, svgTotalH)
    return geo
  }

  if (flapType === "dust-top") {
    // Top dust flap: hinged at y=0 (x in [-W/2, +W/2]), extends into +Y (height H_flap)
    const chamfer = Math.min(widthWorld * 0.22, heightWorld * 0.4)
    const shape = new THREE.Shape()
    shape.moveTo(-widthWorld / 2, 0)
    shape.lineTo(-widthWorld / 2 + chamfer, heightWorld)
    shape.lineTo(widthWorld / 2 - chamfer, heightWorld)
    shape.lineTo(widthWorld / 2, 0)
    shape.closePath()

    const geo = new THREE.ShapeGeometry(shape)
    applyShapeUVs(geo, -widthWorld / 2, widthWorld / 2, 0, heightWorld, panelSvgX, panelSvgY, pW, pH, svgTotalW, svgTotalH)
    return geo
  }

  if (flapType === "dust-bottom") {
    // Bottom dust flap: hinged at y=0 (x in [-W/2, +W/2]), extends into -Y (height H_flap)
    const chamfer = Math.min(widthWorld * 0.22, heightWorld * 0.4)
    const shape = new THREE.Shape()
    shape.moveTo(-widthWorld / 2, 0)
    shape.lineTo(-widthWorld / 2 + chamfer, -heightWorld)
    shape.lineTo(widthWorld / 2 - chamfer, -heightWorld)
    shape.lineTo(widthWorld / 2, 0)
    shape.closePath()

    const geo = new THREE.ShapeGeometry(shape)
    applyShapeUVs(geo, -widthWorld / 2, widthWorld / 2, -heightWorld, 0, panelSvgX, panelSvgY, pW, pH, svgTotalW, svgTotalH)
    return geo
  }

  return createPanelGeometry(widthWorld, heightWorld, panelSvgX, panelSvgY, svgTotalW, svgTotalH, pW, pH)
}

function applyShapeUVs(
  geo: THREE.BufferGeometry,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  panelSvgX: number,
  panelSvgY: number,
  pW: number,
  pH: number,
  svgTotalW: number,
  svgTotalH: number
) {
  const posAttr = geo.attributes.position
  const uvArr = new Float32Array(posAttr.count * 2)

  const spanX = Math.max(0.001, maxX - minX)
  const spanY = Math.max(0.001, maxY - minY)

  for (let i = 0; i < posAttr.count; i++) {
    const px = posAttr.getX(i)
    const py = posAttr.getY(i)

    const nx = (px - minX) / spanX
    const ny = (py - minY) / spanY

    const u = Math.max(0, Math.min(1, (panelSvgX + nx * pW) / svgTotalW))
    const v = Math.max(0, Math.min(1, (panelSvgY + (1 - ny) * pH) / svgTotalH))

    uvArr[i * 2] = u
    uvArr[i * 2 + 1] = v
  }

  geo.setAttribute("uv", new THREE.BufferAttribute(uvArr, 2))
  geo.attributes.uv.needsUpdate = true
}

export interface FoldModelHierarchy {
  rootGroup: THREE.Group
  updateFold: (progress: number) => void // 0.0 (flat 2D) to 1.0 (fully folded 3D)
  materials: THREE.MeshPhysicalMaterial[]
}

/**
 * Builds a dynamic 3D kinematic folding model from SVG analysis
 * Supports continuous fold angle transitions from flat dieline sheet (0%) to fully folded 3D model (100%)
 */
export function buildFolded3DModel(
  analysis: DielineAnalysis,
  boxColor: string = "#be8d58",
  materialFinish: string = "kraft",
  dielineTexture: THREE.CanvasTexture | null = null
): FoldModelHierarchy {
  const rootGroup = new THREE.Group()
  const materials: THREE.MeshPhysicalMaterial[] = []

  const isCorrugated = materialFinish === "corrugated"
  const isKraft = materialFinish === "kraft" || isCorrugated
  const kraftBumpMap = isKraft ? getCardboardBumpTexture(isCorrugated) : null
  const bumpScale = isCorrugated ? 0.0065 : isKraft ? 0.0035 : 0

  const defaultColor = isCorrugated ? "#B58A63" : isKraft ? "#C6A07A" : boxColor
  const roughness = isCorrugated ? 0.92 : isKraft ? 0.88 : materialFinish === "glossy" ? 0.08 : materialFinish === "metallic" ? 0.15 : 0.65
  const metalness = materialFinish === "metallic" ? 0.88 : 0.0
  const clearcoat = materialFinish === "glossy" ? 0.95 : 0.0

  const createMaterial = () => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: dielineTexture ? 0xffffff : new THREE.Color(boxColor || defaultColor),
      map: dielineTexture,
      roughness,
      metalness,
      clearcoat,
      clearcoatRoughness: 0.1,
      sheen: isKraft ? (isCorrugated ? 0.20 : 0.28) : 0.0,
      sheenRoughness: 0.8,
      sheenColor: new THREE.Color(isCorrugated ? "#cca37b" : "#dfc29f"),
      bumpMap: kraftBumpMap,
      bumpScale: bumpScale,
      side: THREE.DoubleSide,
    })
    materials.push(mat)
    return mat
  }

  const { svgCanvasW: svgW, svgCanvasH: svgH, cutBox, verticalCreases, horizontalCreases, boxType } = analysis

  // World scale so model fits within ~1.6 world units
  const maxDim = Math.max(cutBox.w, cutBox.h, 50)
  const scale = 1.6 / maxDim
  const family = analysis.assemblyFamily
  const spec = analysis.assemblyDimensions
  const numberSpec = (key: string, fallback: number) => {
    const value = spec?.[key]
    return typeof value === "number" && Number.isFinite(value) ? value : fallback
  }
  const objectSpec = (key: string) => {
    const value = spec?.[key]
    return value && typeof value === "object" ? value : undefined
  }

  const makeMesh = (geometry: THREE.BufferGeometry) => {
    const mesh = new THREE.Mesh(geometry, createMaterial())
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }

  const addOpenTray = (parent: THREE.Group, length: number, width: number, height: number, wall = 0.012) => {
    const parts: THREE.Mesh[] = []
    const add = (geometry: THREE.BufferGeometry, x: number, y: number, z: number) => {
      const mesh = makeMesh(geometry)
      mesh.position.set(x, y, z)
      parent.add(mesh)
      parts.push(mesh)
    }
    add(new THREE.BoxGeometry(length, wall, width), 0, wall / 2, 0)
    add(new THREE.BoxGeometry(length, height, wall), 0, height / 2, width / 2)
    add(new THREE.BoxGeometry(length, height, wall), 0, height / 2, -width / 2)
    add(new THREE.BoxGeometry(wall, height, width), -length / 2, height / 2, 0)
    add(new THREE.BoxGeometry(wall, height, width), length / 2, height / 2, 0)
    return parts
  }

  // Assembly metadata selects topology before SVG heuristics. These builders provide
  // a faithful assembled preview for curved and multi-part packages that cannot be
  // reconstructed from axis-aligned crease strips.
  if (family === "tapered_cup" || family === "tapered_cup_sleeve" || family === "circular_tube") {
    const topD = numberSpec("topOuterDiameter", numberSpec("outerDiameter", analysis.dims.length))
    const bottomD = numberSpec("bottomOuterDiameter", topD)
    const height = numberSpec("wallHeight", numberSpec("H", analysis.dims.height))
    const localScale = 1.5 / Math.max(topD, height)
    const group = new THREE.Group()
    rootGroup.add(group)

    const wall = makeMesh(new THREE.CylinderGeometry(topD * localScale / 2, bottomD * localScale / 2, height * localScale, 64, 1, true))
    wall.position.y = height * localScale / 2
    group.add(wall)

    if (family !== "tapered_cup_sleeve") {
      const bottom = makeMesh(new THREE.CircleGeometry(bottomD * localScale / 2, 64))
      bottom.rotation.x = -Math.PI / 2
      group.add(bottom)
      if (family === "circular_tube") {
        const top = makeMesh(new THREE.CircleGeometry(topD * localScale / 2, 64))
        top.rotation.x = Math.PI / 2
        top.position.y = height * localScale
        group.add(top)
      }
    }

    const updateFold = (progress: number) => {
      const t = Math.max(0.001, Math.min(1, progress))
      group.scale.set(t, 1, t)
    }
    updateFold(1)
    return { rootGroup, updateFold, materials }
  }

  if (family === "faceted_tube") {
    const diameter = numberSpec("nominalDiameter", analysis.dims.length)
    const height = numberSpec("H", analysis.dims.height)
    const localScale = 1.5 / Math.max(diameter, height)
    const group = new THREE.Group()
    rootGroup.add(group)
    const body = makeMesh(new THREE.CylinderGeometry(diameter * localScale / 2, diameter * localScale / 2, height * localScale, 6))
    body.position.y = height * localScale / 2
    group.add(body)
    const updateFold = (progress: number) => {
      const t = Math.max(0.001, Math.min(1, progress))
      group.scale.set(t, 1, t)
    }
    updateFold(1)
    return { rootGroup, updateFold, materials }
  }

  if (family === "open_tray" || family === "food_formed_carton") {
    const L = numberSpec("L", Math.max(analysis.dims.length, 80)) * scale
    const W = numberSpec("W", Math.max(analysis.dims.width, 45)) * scale
    const H = numberSpec("H", Math.max(analysis.dims.height, 35)) * scale
    const group = new THREE.Group()
    rootGroup.add(group)
    if (analysis.modelId === "fries-box") {
      const bottomL = L * 0.68
      const bottomW = W * 0.72
      const makePanel = (bottom: number, top: number, height: number) => {
        const shape = new THREE.Shape()
        shape.moveTo(-bottom / 2, 0)
        shape.lineTo(bottom / 2, 0)
        shape.lineTo(top / 2, height)
        shape.lineTo(-top / 2, height)
        shape.closePath()
        return new THREE.ShapeGeometry(shape)
      }
      const bottom = makeMesh(new THREE.BoxGeometry(bottomL, 0.012, bottomW)); group.add(bottom)
      const front = makeMesh(makePanel(bottomL, L, H * 0.78)); front.position.z = W / 2; group.add(front)
      const back = makeMesh(makePanel(bottomL, L, H)); back.position.z = -W / 2; group.add(back)
      const left = makeMesh(makePanel(bottomW, W, H)); left.rotation.y = Math.PI / 2; left.position.x = -L / 2; group.add(left)
      const right = makeMesh(makePanel(bottomW, W, H)); right.rotation.y = -Math.PI / 2; right.position.x = L / 2; group.add(right)
      const updateFold = (progress: number) => {
        const t = Math.max(0.02, Math.min(1, progress))
        front.scale.y = back.scale.y = left.scale.y = right.scale.y = t
      }
      updateFold(1)
      return { rootGroup, updateFold, materials }
    }
    const parts = addOpenTray(group, L, W, H)
    const walls = parts.slice(1)
    const updateFold = (progress: number) => {
      const t = Math.max(0, Math.min(1, progress))
      walls.forEach((wall) => {
        wall.scale.y = t
        wall.position.y = H * t / 2
      })
    }
    updateFold(1)
    return { rootGroup, updateFold, materials }
  }

  if (family === "food_clamshell") {
    const L = numberSpec("L", 128) * scale
    const W = numberSpec("W", 128) * scale
    const H = numberSpec("H", 54) * scale
    const lidH = numberSpec("lidHeight", 48) * scale
    const group = new THREE.Group()
    rootGroup.add(group)
    addOpenTray(group, L, W, H)
    const lidPivot = new THREE.Group(); lidPivot.position.set(0, H, -W / 2); group.add(lidPivot)
    const lidTray = new THREE.Group(); lidTray.position.z = W / 2; lidTray.rotation.x = Math.PI; lidPivot.add(lidTray)
    addOpenTray(lidTray, L, W, lidH)
    const updateFold = (progress: number) => {
      const t = Math.max(0, Math.min(1, progress))
      lidPivot.rotation.x = -Math.PI / 2 * (1 - t)
    }
    updateFold(1)
    return { rootGroup, updateFold, materials }
  }

  if (family === "rigid_set") {
    const traySpec = objectSpec("tray") || objectSpec("base") || { L: analysis.dims.length, W: analysis.dims.width, H: Math.max(20, analysis.dims.height * 0.25) }
    const L = traySpec.L * scale
    const W = traySpec.W * scale
    const H = traySpec.H * scale
    const group = new THREE.Group()
    rootGroup.add(group)
    const trayGroup = new THREE.Group()
    group.add(trayGroup)
    addOpenTray(trayGroup, L, W, H)
    const lidSpec = objectSpec("lid")
    let movableGroup: THREE.Group | null = null
    let closedX = 0
    let closedY = 0
    if (lidSpec || analysis.modelId === "lidbase") {
      const lidL = (lidSpec?.L || traySpec.L + 5) * scale
      const lidW = (lidSpec?.W || traySpec.W + 5) * scale
      const lidH = (lidSpec?.H || Math.max(12, traySpec.H * 0.8)) * scale
      const lidGroup = new THREE.Group(); lidGroup.position.set(0, H + lidH + 0.04, 0); lidGroup.rotation.x = Math.PI; group.add(lidGroup)
      addOpenTray(lidGroup, lidL, lidW, lidH)
      movableGroup = lidGroup
      closedY = lidGroup.position.y
    } else if (analysis.modelId === "book-box") {
      const cover = new THREE.Group()
      cover.position.set(-L / 2, 0, -W / 2 - 0.025)
      group.add(cover)
      const back = makeMesh(new THREE.BoxGeometry(L, 0.012, W)); back.position.set(L / 2, -0.02, W / 2); cover.add(back)
      const spine = makeMesh(new THREE.BoxGeometry(0.012, H, W)); spine.position.set(0, H / 2, W / 2); cover.add(spine)
      const front = makeMesh(new THREE.BoxGeometry(L, 0.012, W)); front.position.set(L / 2, H, W / 2); cover.add(front)
      movableGroup = cover
    } else {
      const sleeveGroup = new THREE.Group(); sleeveGroup.position.set(L * 0.64, 0, 0); group.add(sleeveGroup)
      const sleeveL = L * 1.04, sleeveW = W * 1.04, sleeveH = H * 1.12, wall = 0.012
      const top = makeMesh(new THREE.BoxGeometry(sleeveL, wall, sleeveW)); top.position.y = sleeveH; sleeveGroup.add(top)
      const bottom = makeMesh(new THREE.BoxGeometry(sleeveL, wall, sleeveW)); sleeveGroup.add(bottom)
      const front = makeMesh(new THREE.BoxGeometry(sleeveL, sleeveH, wall)); front.position.set(0, sleeveH / 2, sleeveW / 2); sleeveGroup.add(front)
      const back = makeMesh(new THREE.BoxGeometry(sleeveL, sleeveH, wall)); back.position.set(0, sleeveH / 2, -sleeveW / 2); sleeveGroup.add(back)
      movableGroup = sleeveGroup
      closedX = sleeveGroup.position.x
    }
    const updateFold = (progress: number) => {
      const t = Math.max(0, Math.min(1, progress))
      if (!movableGroup) return
      if (analysis.modelId === "lidbase") movableGroup.position.y = closedY + H * 1.6 * (1 - t)
      else if (analysis.modelId === "book-box") movableGroup.rotation.z = -Math.PI * 0.78 * (1 - t)
      else movableGroup.position.x = closedX + L * 0.82 * (1 - t)
    }
    updateFold(1)
    return { rootGroup, updateFold, materials }
  }

  if (family === "curved_pillow_carton") {
    const L = numberSpec("L", 130)
    const W = numberSpec("W", 75)
    const H = numberSpec("H", W * 0.56)
    const localScale = 1.5 / Math.max(L, W)
    const group = new THREE.Group()
    rootGroup.add(group)
    const shell = makeMesh(new THREE.CylinderGeometry(H * localScale / 2, H * localScale / 2, L * localScale, 64, 1, false))
    shell.rotation.z = Math.PI / 2
    shell.scale.z = W / H
    shell.position.y = H * localScale / 2
    group.add(shell)
    const updateFold = (progress: number) => { shell.scale.z = (W / H) * Math.max(0.03, Math.min(1, progress)) }
    updateFold(1)
    return { rootGroup, updateFold, materials }
  }

  if (family === "rsc_corrugated" || family === "four_wall_tuck_carton") {
    const L = numberSpec("L", analysis.dims.length) * scale
    const W = numberSpec("W", analysis.dims.width) * scale
    const H = numberSpec("H", analysis.dims.height) * scale
    const group = new THREE.Group()
    rootGroup.add(group)
    const wall = 0.012

    if (analysis.modelId === "window-carton") {
      const addPart = (geometry: THREE.BufferGeometry, x: number, y: number, z: number) => {
        const mesh = makeMesh(geometry); mesh.position.set(x, y, z); group.add(mesh)
      }
      addPart(new THREE.BoxGeometry(L, wall, W), 0, wall / 2, 0)
      addPart(new THREE.BoxGeometry(L, wall, W), 0, H, 0)
      addPart(new THREE.BoxGeometry(L, H, wall), 0, H / 2, -W / 2)
      addPart(new THREE.BoxGeometry(wall, H, W), -L / 2, H / 2, 0)
      addPart(new THREE.BoxGeometry(wall, H, W), L / 2, H / 2, 0)
      const frameBar = Math.min(L, H) * 0.14
      addPart(new THREE.BoxGeometry(L, frameBar, wall), 0, frameBar / 2, W / 2)
      addPart(new THREE.BoxGeometry(L, frameBar, wall), 0, H - frameBar / 2, W / 2)
      addPart(new THREE.BoxGeometry(frameBar, H - frameBar * 2, wall), -L / 2 + frameBar / 2, H / 2, W / 2)
      addPart(new THREE.BoxGeometry(frameBar, H - frameBar * 2, wall), L / 2 - frameBar / 2, H / 2, W / 2)
    } else {
      const addPart = (geometry: THREE.BufferGeometry, x: number, y: number, z: number) => {
        const mesh = makeMesh(geometry); mesh.position.set(x, y, z); group.add(mesh)
      }
      addPart(new THREE.BoxGeometry(L, wall, W), 0, wall / 2, 0)
      addPart(new THREE.BoxGeometry(L, wall, W), 0, H, 0)
      addPart(new THREE.BoxGeometry(L, H, wall), 0, H / 2, -W / 2)
      addPart(new THREE.BoxGeometry(L, H, wall), 0, H / 2, W / 2)
      addPart(new THREE.BoxGeometry(wall, H, W), -L / 2, H / 2, 0)
      addPart(new THREE.BoxGeometry(wall, H, W), L / 2, H / 2, 0)
      if (analysis.modelId === "hanger-box") {
        const headerW = L * 0.82
        const headerH = Math.min(H * 0.32, L * 0.55)
        const headerShape = new THREE.Shape()
        headerShape.moveTo(-headerW / 2, 0); headerShape.lineTo(headerW / 2, 0); headerShape.lineTo(headerW / 2, headerH); headerShape.lineTo(-headerW / 2, headerH); headerShape.closePath()
        const slot = new THREE.Path()
        slot.absellipse(0, headerH * 0.58, headerW * 0.19, headerH * 0.1, 0, Math.PI * 2, false, 0)
        headerShape.holes.push(slot)
        const header = makeMesh(new THREE.ExtrudeGeometry(headerShape, { depth: wall, bevelEnabled: false }))
        header.position.set(0, H, -wall / 2)
        group.add(header)
      }
    }
    const updateFold = (progress: number) => { group.scale.y = Math.max(0.02, Math.min(1, progress)) }
    updateFold(1)
    return { rootGroup, updateFold, materials }
  }

  if (family === "flat_sheet_selective_folding") {
    const L = numberSpec("L", analysis.dims.length)
    const W = numberSpec("W", analysis.dims.width)
    const H = numberSpec("H", analysis.dims.height)
    const localScale = 1.5 / Math.max(L * 2, H, 100)
    const group = new THREE.Group()
    rootGroup.add(group)

    if (analysis.modelId === "belly-band") {
      const faceW = L * localScale
      const sideW = W * localScale
      const height = H * localScale
      const front = makeMesh(new THREE.PlaneGeometry(faceW, height)); front.position.set(0, height / 2, sideW / 2); group.add(front)
      const back = makeMesh(new THREE.PlaneGeometry(faceW, height)); back.rotation.y = Math.PI; back.position.set(0, height / 2, -sideW / 2); group.add(back)
      const left = makeMesh(new THREE.PlaneGeometry(sideW, height)); left.rotation.y = Math.PI / 2; left.position.set(-faceW / 2, height / 2, 0); group.add(left)
      const right = makeMesh(new THREE.PlaneGeometry(sideW, height)); right.rotation.y = -Math.PI / 2; right.position.set(faceW / 2, height / 2, 0); group.add(right)
      const updateFold = (progress: number) => { group.scale.z = Math.max(0.02, Math.min(1, progress)) }
      updateFold(1)
      return { rootGroup, updateFold, materials }
    }

    if (analysis.modelId === "calendar-desk") {
      const length = L * localScale
      const radius = Math.max(W, H * 0.72) * localScale / Math.sqrt(3)
      const tent = makeMesh(new THREE.CylinderGeometry(radius, radius, length, 3, 1, true))
      tent.rotation.z = Math.PI / 2
      tent.position.y = radius * 0.86
      group.add(tent)
      const updateFold = (progress: number) => { tent.scale.z = Math.max(0.02, Math.min(1, progress)) }
      updateFold(1)
      return { rootGroup, updateFold, materials }
    }

    if (analysis.modelId === "envelope-mockup") {
      const width = L * localScale
      const height = H * localScale
      const body = makeMesh(new THREE.PlaneGeometry(width, height)); body.position.y = height / 2; group.add(body)
      const makeTriangle = (halfWidth: number, triangleHeight: number) => {
        const shape = new THREE.Shape()
        shape.moveTo(-halfWidth, 0); shape.lineTo(halfWidth, 0); shape.lineTo(0, triangleHeight); shape.closePath()
        return makeMesh(new THREE.ShapeGeometry(shape))
      }
      const topPivot = new THREE.Group(); topPivot.position.set(0, height, 0); group.add(topPivot)
      const topFlap = makeTriangle(width / 2, height * 0.72); topPivot.add(topFlap)
      const bottomPivot = new THREE.Group(); group.add(bottomPivot)
      const bottomFlap = makeTriangle(width / 2, -height * 0.78); bottomPivot.add(bottomFlap)
      const leftPivot = new THREE.Group(); leftPivot.position.set(-width / 2, height / 2, 0); group.add(leftPivot)
      const leftFlap = makeTriangle(height / 2, width * 0.42); leftFlap.rotation.z = -Math.PI / 2; leftPivot.add(leftFlap)
      const rightPivot = new THREE.Group(); rightPivot.position.set(width / 2, height / 2, 0); group.add(rightPivot)
      const rightFlap = makeTriangle(height / 2, width * 0.42); rightFlap.rotation.z = Math.PI / 2; rightPivot.add(rightFlap)
      const updateFold = (progress: number) => {
        const t = Math.max(0, Math.min(1, progress))
        leftPivot.rotation.y = Math.PI * 0.96 * t
        rightPivot.rotation.y = -Math.PI * 0.96 * t
        bottomPivot.rotation.x = -Math.PI * 0.96 * t
        topPivot.rotation.x = Math.PI * 0.94 * t
      }
      updateFold(1)
      return { rootGroup, updateFold, materials }
    }

    const panelWidths = analysis.modelId === "trifold-brochure"
      ? [100, 100, 97]
      : analysis.modelId === "notebook-cover" || analysis.modelId === "folder-map"
        ? [L, W, L]
        : [L, L]
    const panelHeight = H * localScale
    const scaledWidths = panelWidths.map((value) => value * localScale)
    const anchor = new THREE.Group()
    anchor.position.y = panelHeight / 2
    group.add(anchor)
    anchor.add(makeMesh(new THREE.PlaneGeometry(scaledWidths[0], panelHeight)))

    const hinges: THREE.Group[] = []
    let parent = anchor
    let offset = scaledWidths[0] / 2
    for (let i = 1; i < scaledWidths.length; i++) {
      const hinge = new THREE.Group()
      hinge.position.x = offset
      parent.add(hinge)
      const panel = makeMesh(new THREE.PlaneGeometry(scaledWidths[i], panelHeight))
      panel.position.x = scaledWidths[i] / 2
      hinge.add(panel)
      hinges.push(hinge)
      parent = hinge
      offset = scaledWidths[i]
    }

    if (analysis.modelId === "folder-map") {
      const pocket = makeMesh(new THREE.PlaneGeometry(L * localScale, 65 * localScale))
      pocket.position.set(scaledWidths[0] / 2, -panelHeight / 2 + 32.5 * localScale, 0.006)
      hinges[hinges.length - 1]?.add(pocket)
    }

    const updateFold = (progress: number) => {
      const t = Math.max(0, Math.min(1, progress))
      hinges.forEach((hinge, index) => {
        if (analysis.modelId === "trifold-brochure") hinge.rotation.y = (index === 0 ? Math.PI : -Math.PI) * 0.96 * t
        else if (analysis.modelId === "wedding-invitation") hinge.rotation.y = Math.PI * 0.94 * t
        else hinge.rotation.y = Math.PI / 2 * t
      })
    }
    updateFold(1)
    return { rootGroup, updateFold, materials }
  }

  if (family === "film_seal_and_deformation") {
    const L = numberSpec("L", analysis.dims.length)
    const W = numberSpec("W", analysis.dims.width)
    const H = numberSpec("H", analysis.dims.height)
    const localScale = 1.5 / Math.max(L, H)
    const displayW = L * localScale
    const displayH = H * localScale
    const depth = W * localScale
    const isPillowPack = analysis.modelId === "pillow-pack"
    const segsX = 32
    const segsY = 32
    const group = new THREE.Group()
    group.position.y = displayH / 2
    rootGroup.add(group)

    const frontGeo = new THREE.PlaneGeometry(displayW, displayH, segsX, segsY)
    const backGeo = new THREE.PlaneGeometry(displayW, displayH, segsX, segsY)
    const front = makeMesh(frontGeo)
    const back = makeMesh(backGeo)
    group.add(front, back)

    const sealBand = Math.max(0.018, Math.min(displayW, displayH) * 0.055)
    const sealDepth = 0.008
    const seals: THREE.Mesh[] = []
    const addSeal = (width: number, height: number, x: number, y: number) => {
      const seal = makeMesh(new THREE.BoxGeometry(width, height, sealDepth))
      seal.position.set(x, y, 0)
      seals.push(seal)
      group.add(seal)
    }

    if (isPillowPack) {
      addSeal(sealBand, displayH, -displayW / 2 + sealBand / 2, 0)
      addSeal(sealBand, displayH, displayW / 2 - sealBand / 2, 0)
      addSeal(displayW * 0.42, sealBand * 0.65, 0, 0)
    } else {
      addSeal(displayW, sealBand, 0, displayH / 2 - sealBand / 2)
      addSeal(displayW, sealBand, 0, -displayH / 2 + sealBand / 2)
      addSeal(sealBand, displayH, -displayW / 2 + sealBand / 2, 0)
      addSeal(sealBand, displayH, displayW / 2 - sealBand / 2, 0)
    }

    const updateFold = (progress: number) => {
      const t = Math.max(0, Math.min(1, progress))
      const frontPos = frontGeo.attributes.position
      const backPos = backGeo.attributes.position
      for (let row = 0; row <= segsY; row++) {
        const ny = row / segsY
        for (let col = 0; col <= segsX; col++) {
          const nx = col / segsX
          const idx = row * (segsX + 1) + col
          const edgeX = Math.sin(nx * Math.PI)
          const edgeY = Math.sin(ny * Math.PI)
          const pillowBias = isPillowPack ? Math.pow(edgeY, 0.55) : edgeY
          const bulge = depth * 0.5 * edgeX * pillowBias * t
          frontPos.setZ(idx, bulge)
          backPos.setZ(idx, -bulge)
        }
      }
      frontPos.needsUpdate = true
      backPos.needsUpdate = true
      frontGeo.computeVertexNormals()
      backGeo.computeVertexNormals()
      seals.forEach((seal) => { seal.scale.z = Math.max(0.1, t) })
    }

    updateFold(1)
    return { rootGroup, updateFold, materials }
  }

  // ==========================================
  // CASE 1: MAILER BOX (FEFCO 0427)
  // ==========================================
  if (boxType === "mailer-0427") {
    const baseGroup = new THREE.Group()
    rootGroup.add(baseGroup)

    const L = analysis.dims.length * scale
    const W = analysis.dims.width * scale
    const H = analysis.dims.height * scale

    // Bottom Base Mesh (XZ ground)
    const bottomGeo = new THREE.PlaneGeometry(L, W)
    bottomGeo.rotateX(Math.PI / 2)
    const bottomMesh = new THREE.Mesh(bottomGeo, createMaterial())
    bottomMesh.castShadow = true
    bottomMesh.receiveShadow = true
    baseGroup.add(bottomMesh)

    // Front Wall Hinge
    const frontHinge = new THREE.Group()
    frontHinge.position.set(0, 0, W / 2)
    baseGroup.add(frontHinge)
    const frontGeo = new THREE.PlaneGeometry(L, H)
    frontGeo.translate(0, H / 2, 0)
    frontHinge.add(new THREE.Mesh(frontGeo, createMaterial()))

    // Back Wall Hinge
    const backHinge = new THREE.Group()
    backHinge.position.set(0, 0, -W / 2)
    baseGroup.add(backHinge)
    const backGeo = new THREE.PlaneGeometry(L, H)
    backGeo.translate(0, H / 2, 0)
    backHinge.add(new THREE.Mesh(backGeo, createMaterial()))

    // Top Lid Hinge
    const topHinge = new THREE.Group()
    topHinge.position.set(0, H, 0)
    backHinge.add(topHinge)
    const topGeo = new THREE.PlaneGeometry(L, W)
    topGeo.translate(0, W / 2, 0)
    topHinge.add(new THREE.Mesh(topGeo, createMaterial()))

    // Left Wall Hinge
    const leftHinge = new THREE.Group()
    leftHinge.position.set(-L / 2, 0, 0)
    baseGroup.add(leftHinge)
    const leftGeo = new THREE.PlaneGeometry(W, H)
    leftGeo.rotateY(Math.PI / 2)
    leftGeo.translate(0, H / 2, 0)
    leftHinge.add(new THREE.Mesh(leftGeo, createMaterial()))

    // Right Wall Hinge
    const rightHinge = new THREE.Group()
    rightHinge.position.set(L / 2, 0, 0)
    baseGroup.add(rightHinge)
    const rightGeo = new THREE.PlaneGeometry(W, H)
    rightGeo.rotateY(-Math.PI / 2)
    rightGeo.translate(0, H / 2, 0)
    rightHinge.add(new THREE.Mesh(rightGeo, createMaterial()))

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
  // CASE 2: CYLINDRICAL WRAP / BOTTLE LABEL
  // 0 vertical creases, wide wrap aspect ratio
  // Continuous smooth cylindrical roll: t=0 (flat sheet) -> t=1 (3D cylinder)
  // ==========================================
  if (boxType === "cylinder-wrap") {
    const centerGroup = new THREE.Group()
    rootGroup.add(centerGroup)

    const W = cutBox.w * scale
    const H = cutBox.h * scale
    const targetDiameter = analysis.assemblyDimensions?.outerDiameter
    const R = typeof targetDiameter === "number" ? targetDiameter * scale / 2 : W / (Math.PI * 2)
    const fullWrapAngle = W / R

    centerGroup.position.y = H / 2

    const segsX = 64
    const geo = new THREE.PlaneGeometry(W, H, segsX, 1)

    // Map UVs 1:1 to SVG canvas cutBox
    const uvs = geo.attributes.uv
    const u0 = Math.max(0, Math.min(1, cutBox.x / svgW))
    const u1 = Math.max(0, Math.min(1, (cutBox.x + cutBox.w) / svgW))
    const v0 = Math.max(0, Math.min(1, cutBox.y / svgH))
    const v1 = Math.max(0, Math.min(1, (cutBox.y + cutBox.h) / svgH))

    for (let i = 0; i < uvs.count; i++) {
      const col = i % (segsX + 1)
      const row = Math.floor(i / (segsX + 1))
      const uNorm = col / segsX
      const vNorm = row
      uvs.setXY(i, u0 + uNorm * (u1 - u0), v0 + vNorm * (v1 - v0))
    }
    uvs.needsUpdate = true

    const mesh = new THREE.Mesh(geo, createMaterial())
    mesh.castShadow = true
    mesh.receiveShadow = true
    centerGroup.add(mesh)

    const origPositions = geo.attributes.position.clone()

    const updateFold = (progress: number) => {
      const t = Math.max(0, Math.min(1, progress))
      const pos = geo.attributes.position

      if (t < 0.002) {
        for (let i = 0; i < pos.count; i++) {
          pos.setXYZ(i, origPositions.getX(i), origPositions.getY(i), origPositions.getZ(i))
        }
        centerGroup.position.z = 0
      } else {
        const phi = fullWrapAngle * t
        const r = W / phi
        for (let i = 0; i < pos.count; i++) {
          const col = i % (segsX + 1)
          const uNorm = col / segsX - 0.5
          const angle = uNorm * phi
          const x = r * Math.sin(angle)
          const z = r * (1 - Math.cos(angle))
          pos.setXYZ(i, x, origPositions.getY(i), z)
        }
        centerGroup.position.z = -R * t
      }
      pos.needsUpdate = true
      geo.computeVertexNormals()
    }

    updateFold(1.0)
    return { rootGroup, updateFold, materials }
  }

  // ==========================================
  // CASE 3: STAND-UP POUCH / DOYPACK
  // Flexible front & back panels with bottom gusset
  // ==========================================
  if (boxType === "pouch") {
    const centerGroup = new THREE.Group()
    rootGroup.add(centerGroup)

    const W = cutBox.w * scale
    const H = cutBox.h * scale
    const depthMax = W * 0.28

    centerGroup.position.y = H / 2

    const segsX = 24
    const segsY = 24

    const fGeo = new THREE.PlaneGeometry(W, H, segsX, segsY)
    const bGeo = new THREE.PlaneGeometry(W, H, segsX, segsY)

    const u0 = Math.max(0, Math.min(1, cutBox.x / svgW))
    const u1 = Math.max(0, Math.min(1, (cutBox.x + cutBox.w) / svgW))
    const v0 = Math.max(0, Math.min(1, cutBox.y / svgH))
    const v1 = Math.max(0, Math.min(1, (cutBox.y + cutBox.h) / svgH))

    const setupUVs = (geo: THREE.PlaneGeometry) => {
      const uvs = geo.attributes.uv
      for (let i = 0; i < uvs.count; i++) {
        const col = i % (segsX + 1)
        const row = Math.floor(i / (segsX + 1))
        uvs.setXY(i, u0 + (col / segsX) * (u1 - u0), v0 + (row / segsY) * (v1 - v0))
      }
      uvs.needsUpdate = true
    }
    setupUVs(fGeo)
    setupUVs(bGeo)

    const fMesh = new THREE.Mesh(fGeo, createMaterial())
    const bMesh = new THREE.Mesh(bGeo, createMaterial())
    fMesh.castShadow = true
    bMesh.castShadow = true
    centerGroup.add(fMesh)
    centerGroup.add(bMesh)

    if (analysis.modelId === "spout-pouch") {
      const spout = makeMesh(new THREE.CylinderGeometry(W * 0.055, W * 0.065, H * 0.13, 24))
      spout.position.set(W * 0.3, H * 0.54, 0)
      centerGroup.add(spout)
    }

    const updateFold = (progress: number) => {
      const t = Math.max(0, Math.min(1, progress))
      const fPos = fGeo.attributes.position
      const bPos = bGeo.attributes.position

      for (let r = 0; r <= segsY; r++) {
        const ny = r / segsY // 0 at top, 1 at bottom
        // Pouch curves wider in middle & bottom, pinched flat at top zipper seal
        const vWeight = Math.sin(ny * Math.PI) * (ny > 0.15 ? 1.0 : ny / 0.15)
        for (let c = 0; c <= segsX; c++) {
          const idx = r * (segsX + 1) + c
          const nx = c / segsX // 0 to 1
          const uWeight = Math.sin(nx * Math.PI)
          const zDisp = depthMax * uWeight * vWeight * t * 0.5
          fPos.setZ(idx, zDisp)
          bPos.setZ(idx, -zDisp)
        }
      }
      fPos.needsUpdate = true
      bPos.needsUpdate = true
      fGeo.computeVertexNormals()
      bGeo.computeVertexNormals()
    }

    updateFold(1.0)
    return { rootGroup, updateFold, materials }
  }

  // ==========================================
  // CASE 4: FLAT PACKAGING BOARD / BLISTER CARD
  // 0 vertical creases, single die-cut card
  // ==========================================
  if (boxType === "flat-card") {
    const centerGroup = new THREE.Group()
    rootGroup.add(centerGroup)

    const W = cutBox.w * scale
    const H = cutBox.h * scale
    centerGroup.position.y = H / 2

    if (analysis.modelId === "pin-button") {
      const finishedDiameterMm = 58
      const radius = finishedDiameterMm * scale / 2
      const depth = Math.max(0.025, 3.5 * scale)
      const dome = makeMesh(new THREE.SphereGeometry(radius, 64, 24))
      dome.scale.z = 0.14
      dome.position.z = depth * 0.35
      centerGroup.add(dome)

      const back = makeMesh(new THREE.CylinderGeometry(radius * 0.98, radius * 0.98, depth, 64))
      back.rotation.x = Math.PI / 2
      back.position.z = -depth * 0.35
      centerGroup.add(back)

      const updateFold = (_progress: number) => {}
      return { rootGroup, updateFold, materials }
    }

    if (analysis.cutContours.length > 0) {
      const contours = [...analysis.cutContours].sort((a, b) => Math.abs(polygonArea(b)) - Math.abs(polygonArea(a)))
      const outer = contours[0]
      const toVectors = (points: Array<{ x: number; y: number }>) => points.map((point) => new THREE.Vector2(
        (point.x - (cutBox.x + cutBox.w / 2)) * scale,
        ((cutBox.y + cutBox.h / 2) - point.y) * scale
      ))

      let outerVectors = toVectors(outer)
      if (!THREE.ShapeUtils.isClockWise(outerVectors)) outerVectors = outerVectors.reverse()
      const shape = new THREE.Shape(outerVectors)

      contours.slice(1).forEach((contour) => {
        if (!pointInPolygon(contour[0], outer)) return
        let holeVectors = toVectors(contour)
        if (THREE.ShapeUtils.isClockWise(holeVectors)) holeVectors = holeVectors.reverse()
        shape.holes.push(new THREE.Path(holeVectors))
      })

      const nominalThicknessMm = analysis.modelId === "keychain-mockup" ? 3 : analysis.modelId === "hangtag" ? 0.8 : analysis.dims.width
      const hasSoftBevel = analysis.modelId === "keychain-mockup" || analysis.modelId === "mousepad-mockup"
      const depth = Math.max(0.002, nominalThicknessMm * scale)
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: hasSoftBevel,
        bevelSegments: 2,
        bevelSize: hasSoftBevel ? depth * 0.16 : 0,
        bevelThickness: hasSoftBevel ? depth * 0.12 : 0,
        curveSegments: 24,
      })
      geo.translate(0, 0, -depth / 2)
      centerGroup.add(makeMesh(geo))

      const updateFold = (_progress: number) => {}
      return { rootGroup, updateFold, materials }
    }

    const geo = createPanelGeometry(W, H, cutBox.x, cutBox.y, svgW, svgH, cutBox.w, cutBox.h)
    const mesh = new THREE.Mesh(geo, createMaterial())
    mesh.castShadow = true
    mesh.receiveShadow = true
    centerGroup.add(mesh)

    const updateFold = (_progress: number) => {
      // Flat card remains authentic planar board
    }

    updateFold(1.0)
    return { rootGroup, updateFold, materials }
  }

  // ==========================================
  // CASE 5: DYNAMIC KINEMATIC CHAIN (FOKUS NYAMBUNGIN)
  // Connects N panels sequentially along their real crease lines
  // Supports 4-wall boxes, hexagonal boxes, triangular prisms, folders, etc.
  // ==========================================

  const boundaries = [cutBox.x, ...verticalCreases, cutBox.x + cutBox.w]
  const panelWidths = []
  for (let i = 0; i < boundaries.length - 1; i++) {
    panelWidths.push((boundaries[i + 1] - boundaries[i]) * scale)
  }

  const numPanels = panelWidths.length

  // Creases & Body Height
  const topCreaseY = horizontalCreases.length > 0 ? horizontalCreases[0] : cutBox.y
  const botCreaseY =
    horizontalCreases.length > 1
      ? horizontalCreases[horizontalCreases.length - 1]
      : cutBox.y + cutBox.h

  const bodyH = Math.max(10 * scale, (botCreaseY - topCreaseY) * scale)
  const topFlapH = Math.max(0, (topCreaseY - cutBox.y) * scale)
  const botFlapH = Math.max(0, ((cutBox.y + cutBox.h) - botCreaseY) * scale)

  // Glue tabs can sit before or after the wall strip, depending on CAD convention.
  const hasLeadingGlueFlap = numPanels >= 4 && panelWidths[0] < 0.42 * panelWidths[1]
  const hasTrailingGlueFlap = numPanels >= 4 && panelWidths[numPanels - 1] < 0.42 * panelWidths[numPanels - 2]
  const glueWidth = hasLeadingGlueFlap
    ? panelWidths[0]
    : hasTrailingGlueFlap
      ? panelWidths[numPanels - 1]
      : 0

  // Main body walls
  const wallIndices: number[] = []
  for (let i = (hasLeadingGlueFlap ? 1 : 0); i < numPanels - (hasTrailingGlueFlap ? 1 : 0); i++) {
    wallIndices.push(i)
  }

  const numWalls = wallIndices.length
  // Step fold angle per hinge (e.g. 4 walls -> 90°, 6 walls -> 60°, 3 walls -> 120°)
  const stepFoldAngle = numWalls >= 3 ? (Math.PI * 2) / numWalls : Math.PI

  const centerGroup = new THREE.Group()
  rootGroup.add(centerGroup)

  const anchorIdx = wallIndices[0]
  const anchorW = panelWidths[anchorIdx]

  const anchorGroup = new THREE.Group()
  anchorGroup.position.y = bodyH / 2
  centerGroup.add(anchorGroup)

  // 1. Anchor Wall Mesh (centered at 0,0,0 inside anchorGroup)
  const anchorGeo = createPanelGeometry(
    anchorW,
    bodyH,
    boundaries[anchorIdx],
    topCreaseY,
    svgW,
    svgH,
    boundaries[anchorIdx + 1] - boundaries[anchorIdx],
    botCreaseY - topCreaseY
  )
  const anchorMesh = new THREE.Mesh(anchorGeo, createMaterial())
  anchorMesh.castShadow = true
  anchorMesh.receiveShadow = true
  anchorGroup.add(anchorMesh)

  // Anchor Top & Bottom Flaps
  let anchorTopHinge: THREE.Group | null = null
  let anchorBotHinge: THREE.Group | null = null

  if (topFlapH > 0.02) {
    anchorTopHinge = new THREE.Group()
    anchorTopHinge.position.set(0, bodyH / 2, 0)
    anchorGroup.add(anchorTopHinge)

    const tGeo = createPanelGeometry(
      anchorW,
      topFlapH,
      boundaries[anchorIdx],
      cutBox.y,
      svgW,
      svgH,
      boundaries[anchorIdx + 1] - boundaries[anchorIdx],
      topCreaseY - cutBox.y
    )
    tGeo.translate(0, topFlapH / 2, 0)
    anchorTopHinge.add(new THREE.Mesh(tGeo, createMaterial()))
  }

  if (botFlapH > 0.02) {
    anchorBotHinge = new THREE.Group()
    anchorBotHinge.position.set(0, -bodyH / 2, 0)
    anchorGroup.add(anchorBotHinge)

    const bGeo = createPanelGeometry(
      anchorW,
      botFlapH,
      boundaries[anchorIdx],
      botCreaseY,
      svgW,
      svgH,
      boundaries[anchorIdx + 1] - boundaries[anchorIdx],
      cutBox.y + cutBox.h - botCreaseY
    )
    bGeo.translate(0, -botFlapH / 2, 0)
    anchorBotHinge.add(new THREE.Mesh(bGeo, createMaterial()))
  }

  // 2. Glue Flap Hinge (to the left of anchor wall: X = -anchorW/2)
  let glueHinge: THREE.Group | null = null
  if (hasLeadingGlueFlap) {
    glueHinge = new THREE.Group()
    glueHinge.position.set(-anchorW / 2, 0, 0)
    anchorGroup.add(glueHinge)

    const gGeo = createDieCutFlapGeometry(
      glueWidth,
      bodyH,
      boundaries[0],
      topCreaseY,
      svgW,
      svgH,
      boundaries[1] - boundaries[0],
      botCreaseY - topCreaseY,
      "glue"
    )
    const glueMesh = new THREE.Mesh(gGeo, createMaterial())
    glueHinge.add(glueMesh)
  }

  // 3. Right Kinematic Chain: Panels chained sequentially along their shared crease line ("NYAMBUNGIN")
  const rightHinges: Array<{
    group: THREE.Group
    topHinge: THREE.Group | null
    botHinge: THREE.Group | null
    panelIdx: number
  }> = []

  let prevHingeGroup: THREE.Group = anchorGroup
  let prevOffset = anchorW / 2

  for (let k = 1; k < wallIndices.length; k++) {
    const pIdx = wallIndices[k]
    const pW = panelWidths[pIdx]

    const hGroup = new THREE.Group()
    hGroup.position.set(prevOffset, 0, 0)
    prevHingeGroup.add(hGroup)

    // Panel mesh extends from local X=0 to X=pW
    const pGeo = createPanelGeometry(
      pW,
      bodyH,
      boundaries[pIdx],
      topCreaseY,
      svgW,
      svgH,
      boundaries[pIdx + 1] - boundaries[pIdx],
      botCreaseY - topCreaseY
    )
    pGeo.translate(pW / 2, 0, 0)
    const pMesh = new THREE.Mesh(pGeo, createMaterial())
    pMesh.castShadow = true
    pMesh.receiveShadow = true
    hGroup.add(pMesh)

    // Top flap for this panel
    let pTopHinge: THREE.Group | null = null
    if (topFlapH > 0.02) {
      pTopHinge = new THREE.Group()
      pTopHinge.position.set(pW / 2, bodyH / 2, 0)
      hGroup.add(pTopHinge)

      const isDustFlap = k % 2 === 1 && numWalls === 4
      const ptGeo = isDustFlap
        ? createDieCutFlapGeometry(
            pW,
            topFlapH * 0.8,
            boundaries[pIdx],
            cutBox.y,
            svgW,
            svgH,
            boundaries[pIdx + 1] - boundaries[pIdx],
            topCreaseY - cutBox.y,
            "dust-top"
          )
        : createPanelGeometry(
            pW,
            topFlapH,
            boundaries[pIdx],
            cutBox.y,
            svgW,
            svgH,
            boundaries[pIdx + 1] - boundaries[pIdx],
            topCreaseY - cutBox.y
          )
      if (!isDustFlap) ptGeo.translate(0, topFlapH / 2, 0)
      pTopHinge.add(new THREE.Mesh(ptGeo, createMaterial()))
    }

    // Bottom flap for this panel
    let pBotHinge: THREE.Group | null = null
    if (botFlapH > 0.02) {
      pBotHinge = new THREE.Group()
      pBotHinge.position.set(pW / 2, -bodyH / 2, 0)
      hGroup.add(pBotHinge)

      const isDustFlap = k % 2 === 1 && numWalls === 4
      const pbGeo = isDustFlap
        ? createDieCutFlapGeometry(
            pW,
            botFlapH * 0.8,
            boundaries[pIdx],
            botCreaseY,
            svgW,
            svgH,
            boundaries[pIdx + 1] - boundaries[pIdx],
            cutBox.y + cutBox.h - botCreaseY,
            "dust-bottom"
          )
        : createPanelGeometry(
            pW,
            botFlapH,
            boundaries[pIdx],
            botCreaseY,
            svgW,
            svgH,
            boundaries[pIdx + 1] - boundaries[pIdx],
            cutBox.y + cutBox.h - botCreaseY
          )
      if (!isDustFlap) pbGeo.translate(0, -botFlapH / 2, 0)
      pBotHinge.add(new THREE.Mesh(pbGeo, createMaterial()))
    }

    rightHinges.push({
      group: hGroup,
      topHinge: pTopHinge,
      botHinge: pBotHinge,
      panelIdx: pIdx,
    })

    prevHingeGroup = hGroup
    prevOffset = pW
  }

  let trailingGlueHinge: THREE.Group | null = null
  if (hasTrailingGlueFlap) {
    const gluePanelIndex = numPanels - 1
    trailingGlueHinge = new THREE.Group()
    trailingGlueHinge.position.set(prevOffset, 0, 0)
    prevHingeGroup.add(trailingGlueHinge)

    const gGeo = createDieCutFlapGeometry(
      glueWidth,
      bodyH,
      boundaries[gluePanelIndex],
      topCreaseY,
      svgW,
      svgH,
      boundaries[gluePanelIndex + 1] - boundaries[gluePanelIndex],
      botCreaseY - topCreaseY,
      "glue"
    )
    gGeo.translate(glueWidth / 2, 0, 0)
    trailingGlueHinge.add(new THREE.Mesh(gGeo, createMaterial()))
  }

  // Flat sheet center along X so flat dieline is centered at X=0
  const flatTotalW = panelWidths.reduce((a, b) => a + b, 0)
  const flatMinX = -anchorW / 2 - (hasLeadingGlueFlap ? glueWidth : 0)
  const flatMaxX = flatMinX + flatTotalW
  const flatCenterX = (flatMinX + flatMaxX) / 2

  // Center of mass when fully folded
  const sideW = panelWidths[wallIndices[1]] || anchorW
  const closedCenterZ = numWalls === 4 ? sideW / 2 : (anchorW / (2 * Math.sin(stepFoldAngle / 2)))

  const updateFold = (progress: number) => {
    const t = Math.max(0, Math.min(1, progress))

    // 1. Chained body wall hinges rotate around Y
    rightHinges.forEach((rh) => {
      rh.group.rotation.y = stepFoldAngle * t
    })

    // 2. Glue flap folds inward
    if (glueHinge) {
      glueHinge.rotation.y = -stepFoldAngle * t
    }
    if (trailingGlueHinge) {
      trailingGlueHinge.rotation.y = stepFoldAngle * t
    }

    // 3. Top Flaps
    if (boxType === "gable") {
      const gableAngle = (Math.PI / 4.2) * t
      if (anchorTopHinge) anchorTopHinge.rotation.x = -gableAngle
      rightHinges.forEach((rh, idx) => {
        if (!rh.topHinge) return
        if (idx === 1) rh.topHinge.rotation.x = -gableAngle // Opposite main slope
        else rh.topHinge.rotation.x = -((Math.PI / 2) * t) // Side slopes
      })
    } else {
      if (anchorTopHinge) anchorTopHinge.rotation.x = -((Math.PI / 2) * t)
      rightHinges.forEach((rh) => {
        if (rh.topHinge) rh.topHinge.rotation.x = -((Math.PI / 2) * t)
      })
    }

    // 4. Bottom Flaps
    if (anchorBotHinge) anchorBotHinge.rotation.x = (Math.PI / 2) * t
    rightHinges.forEach((rh) => {
      if (rh.botHinge) rh.botHinge.rotation.x = (Math.PI / 2) * t
    })

    // 5. Smoothly interpolate position between 2D flat center and 3D closed center
    centerGroup.position.x = -flatCenterX * (1 - t)
    centerGroup.position.z = closedCenterZ * t
  }

  updateFold(1.0)

  return {
    rootGroup,
    updateFold,
    materials,
  }
}
