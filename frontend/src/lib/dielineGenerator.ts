// Parametric Packaging Dieline Vector SVG Generator
// Standard FEFCO & Packaging Structural CAD Algorithms (inspired by 3DPAKS & ArtiosCAD)

export interface DielineParams {
  width: number // mm (W)
  depth: number // mm (D)
  height: number // mm (H)
  caliper?: number // mm (karton caliper, default 1.5mm)
  style: "fefco-0427" | "fefco-0201" | "fefco-0211" | "fefco-0422"
}

export interface DielinePanelZone {
  face: "front" | "back" | "left" | "right" | "top" | "bottom" | "glue-flap" | "dust-flap"
  x: number
  y: number
  width: number
  height: number
  label?: string
}

export interface GeneratedDieline {
  style: string
  name: string
  totalWidthMm: number
  totalHeightMm: number
  svgString: string
  dataUrl: string
  canvasWidthPx: number // at 150 DPI
  canvasHeightPx: number // at 150 DPI
  panels: DielinePanelZone[]
}

// 150 DPI physical conversion rule: pixels = (mm / 25.4) * 150
export function mmToPixels150Dpi(mm: number): number {
  return Math.round((mm / 25.4) * 150)
}

/**
 * Generates production-ready packaging dieline in SVG vector format with standard CAD layers:
 * - Red solid lines (#e11d48) = Cut lines (pisau potong luar / thru-cut)
 * - Green dashed lines (#10b981) = Crease lines (garis lipat / score)
 * - Blue text & arrows (#2563eb) = Dimensional annotations
 */
export function generateParametricDieline({
  width: W,
  depth: D,
  height: H,
  caliper = 1.5,
  style = "fefco-0427",
}: DielineParams): GeneratedDieline {
  // Sanitize inputs
  W = Math.max(20, Math.round(W))
  D = Math.max(20, Math.round(D))
  H = Math.max(20, Math.round(H))
  const c = Math.max(0.5, caliper)

  let name = "FEFCO 0427 (Roll-End Tuck Top Mailer)"
  let cutPaths: string[] = []
  let creaseLines: { x1: number; y1: number; x2: number; y2: number }[] = []
  let panelZones: DielinePanelZone[] = []
  let totalW = 100
  let totalH = 100

  if (style === "fefco-0427") {
    name = "FEFCO 0427 (Roll-End Tuck Top Mailer Box)"
    // Structure:
    // Flap heights and margins
    const flapH = H
    const tuckH = Math.min(30, H * 0.7)
    const dustWingW = H * 0.75

    const pad = 20
    const startX = pad + dustWingW + flapH
    const topFlapY = pad
    const frontWallY = topFlapY + flapH
    const baseY = frontWallY + flapH
    const backWallY = baseY + D
    const lidY = backWallY + H
    const tuckY = lidY + D

    totalW = Math.round(startX + W + flapH + dustWingW + pad)
    totalH = Math.round(tuckY + tuckH + pad)

    // Outer Cut Path
    cutPaths.push(`
      M ${startX},${frontWallY}
      L ${startX + 4},${topFlapY + 4}
      Q ${startX + 10},${topFlapY} ${startX + 20},${topFlapY}
      L ${startX + W - 20},${topFlapY}
      Q ${startX + W - 10},${topFlapY} ${startX + W - 4},${topFlapY + 4}
      L ${startX + W},${frontWallY}
      L ${startX + W + flapH},${frontWallY}
      L ${startX + W + flapH * 2},${baseY}
      L ${startX + W + flapH * 2},${baseY + D}
      L ${startX + W + flapH},${backWallY}
      L ${startX + W},${backWallY}
      L ${startX + W + dustWingW},${lidY}
      L ${startX + W + dustWingW},${lidY + D - 8}
      L ${startX + W},${lidY + D}
      L ${startX + W},${tuckY}
      L ${startX + W - 6},${tuckY + tuckH - 4}
      Q ${startX + W - 12},${tuckY + tuckH} ${startX + W - 20},${tuckY + tuckH}
      L ${startX + 20},${tuckY + tuckH}
      Q ${startX + 12},${tuckY + tuckH} ${startX + 6},${tuckY + tuckH - 4}
      L ${startX},${tuckY}
      L ${startX},${lidY + D}
      L ${startX - dustWingW},${lidY + D - 8}
      L ${startX - dustWingW},${lidY}
      L ${startX},${backWallY}
      L ${startX - flapH},${backWallY}
      L ${startX - flapH * 2},${baseY + D}
      L ${startX - flapH * 2},${baseY}
      L ${startX - flapH},${frontWallY}
      Z
    `.replace(/\s+/g, " ").trim())

    // Crease / Fold Lines
    creaseLines = [
      { x1: startX, y1: frontWallY, x2: startX + W, y2: frontWallY },
      { x1: startX, y1: baseY, x2: startX + W, y2: baseY },
      { x1: startX, y1: backWallY, x2: startX + W, y2: backWallY },
      { x1: startX, y1: lidY, x2: startX + W, y2: lidY },
      { x1: startX, y1: tuckY, x2: startX + W, y2: tuckY },
      { x1: startX, y1: baseY, x2: startX, y2: baseY + D },
      { x1: startX + W, y1: baseY, x2: startX + W, y2: baseY + D },
    ]

    panelZones = [
      { face: "front", x: startX, y: frontWallY, width: W, height: flapH, label: "DEPAN (FRONT)" },
      { face: "bottom", x: startX, y: baseY, width: W, height: D, label: "ALAS (BOTTOM)" },
      { face: "back", x: startX, y: backWallY, width: W, height: H, label: "BELAKANG (BACK)" },
      { face: "top", x: startX, y: lidY, width: W, height: D, label: "TUTUP (TOP LID)" },
      { face: "left", x: startX - flapH, y: baseY, width: flapH, height: D, label: "KIRI (LEFT)" },
      { face: "right", x: startX + W, y: baseY, width: flapH, height: D, label: "KANAN (RIGHT)" },
    ]
  } else if (style === "fefco-0201") {
    name = "FEFCO 0201 (Regular Slotted Container - RSC)"
    const flap = Math.round(D / 2)
    const glueTab = 30
    const pad = 20

    totalW = Math.round(pad * 2 + glueTab + (W * 2) + (D * 2))
    totalH = Math.round(pad * 2 + flap * 2 + H)

    const y0 = pad
    const y1 = y0 + flap
    const y2 = y1 + H
    const y3 = y2 + flap

    let x = pad + glueTab
    const panels = [W, D, W, D]

    // Glue flap
    cutPaths.push(`M ${pad},${y1 + 4} L ${pad + glueTab},${y1} L ${pad + glueTab},${y2} L ${pad},${y2 - 4} Z`)

    // Perimeter cut
    cutPaths.push(`
      M ${pad + glueTab},${y1}
      L ${pad + glueTab},${y0}
      L ${totalW - pad},${y0}
      L ${totalW - pad},${y3}
      L ${pad + glueTab},${y3}
      L ${pad + glueTab},${y2}
    `.replace(/\s+/g, " ").trim())

    // Slots between flaps
    let currX = pad + glueTab
    panels.forEach((pW, idx) => {
      if (idx > 0) {
        cutPaths.push(`M ${currX},${y0} L ${currX},${y1}`)
        cutPaths.push(`M ${currX},${y2} L ${currX},${y3}`)
      }
      creaseLines.push({ x1: currX, y1: y1, x2: currX, y2: y2 })
      currX += pW
    })

    creaseLines.push({ x1: pad + glueTab, y1: y1, x2: totalW - pad, y2: y1 })
    creaseLines.push({ x1: pad + glueTab, y1: y2, x2: totalW - pad, y2: y2 })
    creaseLines.push({ x1: pad + glueTab, y1: y1, x2: pad + glueTab, y2: y2 })

    panelZones = [
      { face: "glue-flap", x: pad, y: y1, width: glueTab, height: H, label: "LEM (GLUE)" },
      { face: "front", x: pad + glueTab, y: y1, width: W, height: H, label: "DEPAN (FRONT)" },
      { face: "right", x: pad + glueTab + W, y: y1, width: D, height: H, label: "KANAN (RIGHT)" },
      { face: "back", x: pad + glueTab + W + D, y: y1, width: W, height: H, label: "BELAKANG (BACK)" },
      { face: "left", x: pad + glueTab + W * 2 + D, y: y1, width: D, height: H, label: "KIRI (LEFT)" },
    ]
  } else if (style === "fefco-0211") {
    name = "FEFCO 0211 (Straight Tuck-End Carton)"
    const tuck = Math.min(25, D * 0.6)
    const glueTab = 20
    const pad = 20

    totalW = Math.round(pad * 2 + glueTab + (W * 2) + (D * 2))
    totalH = Math.round(pad * 2 + (D + tuck) * 2 + H)

    const yTopTuck = pad
    const yTopLid = yTopTuck + tuck
    const yBodyTop = yTopLid + D
    const yBodyBottom = yBodyTop + H
    const yBottomLid = yBodyBottom + D
    const yBottomTuck = yBottomLid + tuck

    let startX = pad + glueTab

    cutPaths.push(`
      M ${startX},${yBodyTop}
      L ${startX},${yTopLid}
      L ${startX + W},${yTopLid}
      L ${startX + W},${yTopTuck}
      L ${startX + W + D - 4},${yTopTuck}
      L ${startX + W + D},${yTopLid}
      L ${totalW - pad},${yTopLid}
      L ${totalW - pad},${yBottomLid}
      L ${startX + W + D},${yBottomLid}
      L ${startX + W + D - 4},${yBottomTuck}
      L ${startX + W},${yBottomTuck}
      L ${startX + W},${yBottomLid}
      L ${startX},${yBottomLid}
      Z
    `.replace(/\s+/g, " ").trim())

    creaseLines = [
      { x1: startX, y1: yBodyTop, x2: totalW - pad, y2: yBodyTop },
      { x1: startX, y1: yBodyBottom, x2: totalW - pad, y2: yBodyBottom },
      { x1: startX + W, y1: yTopLid, x2: startX + W + D, y2: yTopLid },
      { x1: startX + W, y1: yBottomLid, x2: startX + W + D, y2: yBottomLid },
      { x1: startX + W, y1: yTopTuck, x2: startX + W + D, y2: yTopTuck },
      { x1: startX + W, y1: yBottomTuck, x2: startX + W + D, y2: yBottomTuck },
      { x1: startX, y1: yBodyTop, x2: startX, y2: yBodyBottom },
      { x1: startX + W, y1: yBodyTop, x2: startX + W, y2: yBodyBottom },
      { x1: startX + W + D, y1: yBodyTop, x2: startX + W + D, y2: yBodyBottom },
      { x1: startX + W * 2 + D, y1: yBodyTop, x2: startX + W * 2 + D, y2: yBodyBottom },
    ]

    panelZones = [
      { face: "glue-flap", x: pad, y: yBodyTop, width: glueTab, height: H, label: "LEM (GLUE)" },
      { face: "front", x: startX, y: yBodyTop, width: W, height: H, label: "DEPAN (FRONT)" },
      { face: "right", x: startX + W, y: yBodyTop, width: D, height: H, label: "KANAN (RIGHT)" },
      { face: "back", x: startX + W + D, y: yBodyTop, width: W, height: H, label: "BELAKANG (BACK)" },
      { face: "left", x: startX + W * 2 + D, y: yBodyTop, width: D, height: H, label: "KIRI (LEFT)" },
      { face: "top", x: startX + W, y: yTopLid, width: D, height: D, label: "TUTUP ATAS" },
      { face: "bottom", x: startX + W, y: yBodyBottom, width: D, height: D, label: "TUTUP BAWAH" },
    ]
  } else {
    // FEFCO 0422 (Counter Display Tray)
    name = "FEFCO 0422 (Counter Display Tray)"
    const lip = Math.min(35, H * 0.4)
    const pad = 20
    totalW = Math.round(pad * 2 + W + H * 2)
    totalH = Math.round(pad * 2 + D + H + lip)

    const bx = pad + H
    const by = pad + H

    cutPaths.push(`
      M ${bx},${by - H}
      L ${bx + W},${by - H}
      L ${bx + W + H},${by}
      L ${bx + W + H},${by + D}
      L ${bx + W},${by + D + lip}
      L ${bx},${by + D + lip}
      L ${bx - H},${by + D}
      L ${bx - H},${by}
      Z
    `.replace(/\s+/g, " ").trim())

    creaseLines = [
      { x1: bx, y1: by, x2: bx + W, y2: by },
      { x1: bx, y1: by + D, x2: bx + W, y2: by + D },
      { x1: bx, y1: by, x2: bx, y2: by + D },
      { x1: bx + W, y1: by, x2: bx + W, y2: by + D },
    ]

    panelZones = [
      { face: "bottom", x: bx, y: by, width: W, height: D, label: "DASAR TRAY" },
      { face: "left", x: bx - H, y: by, width: H, height: D, label: "DINDING KIRI" },
      { face: "right", x: bx + W, y: by, width: H, height: D, label: "DINDING KANAN" },
      { face: "back", x: bx, y: by - H, width: W, height: H, label: "DINDING BELAKANG" },
      { face: "front", x: bx, y: by + D, width: W, height: H, label: "DINDING DEPAN" },
    ]
  }

  // Calculate 150 DPI pixel dimensions
  const canvasWidthPx = mmToPixels150Dpi(totalW)
  const canvasHeightPx = mmToPixels150Dpi(totalH)

  // Construct pure SVG XML conforming to AstaKraf Packaging Standard v1.0
  const svgString = `
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="0 0 ${totalW} ${totalH}" 
  width="${totalW}mm" 
  height="${totalH}mm"
  data-generator="astakraf-dieline-engine"
  data-style="${style}"
  data-width="${W}"
  data-depth="${D}"
  data-height="${H}"
  data-unit="mm"
>
  <defs>
    <!-- AstaKraf Packaging Technical Metadata -->
    <metadata>
      <astakraf:packaging
        xmlns:astakraf="https://kemasan3d.id/schema/dieline/v1"
        style="${style}"
        length="${W}"
        width="${D}"
        height="${H}"
        caliper="${caliper}"
        unit="mm"
      />
    </metadata>

    <style>
      .cut-line { stroke: #e11d48; stroke-width: 1.2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .crease-line { stroke: #10b981; stroke-width: 1.0; stroke-dasharray: 4 3; fill: none; }
      .perf-line { stroke: #8b5cf6; stroke-width: 0.8; stroke-dasharray: 1.5 2; fill: none; }
      .bleed-line { stroke: #ec4899; stroke-width: 0.5; stroke-dasharray: 2 2; fill: none; }
      .safe-line { stroke: #06b6d4; stroke-width: 0.5; stroke-dasharray: 1 2; fill: none; }
      .dim-label { font-family: monospace; font-size: 8px; font-weight: bold; fill: #2563eb; }
      .title-label { font-family: sans-serif; font-size: 9px; font-weight: bold; fill: #0f172a; }
      .panel-label { font-family: sans-serif; font-size: 7px; font-weight: bold; fill: #64748b; text-anchor: middle; }
    </style>
  </defs>

  <!-- Layer 1: Sheet Background -->
  <g id="layer-sheet">
    <rect width="${totalW}" height="${totalH}" fill="#ffffff" />
  </g>

  <!-- Layer 2: Semantic Panels (3D Face UV Mapping) -->
  <g id="layer-panels">
    ${panelZones
      .map(
        (p) => `
    <rect id="face-${p.face}" data-face="${p.face}" x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" fill="rgba(37,99,235,0.02)" stroke="rgba(37,99,235,0.2)" stroke-width="0.4" />
    <text x="${p.x + p.width / 2}" y="${p.y + p.height / 2 + 2.5}" class="panel-label">${p.label || p.face.toUpperCase()}</text>`
      )
      .join("")}
  </g>

  <!-- Layer 3: Artwork (Designers place custom graphics/stickers here) -->
  <g id="layer-artwork">
  </g>

  <!-- Layer 4: Crease / Fold Lines -->
  <g id="layer-crease" class="crease-line">
    ${creaseLines.map((c) => `<line x1="${c.x1}" y1="${c.y1}" x2="${c.x2}" y2="${c.y2}" />`).join("\n    ")}
  </g>

  <!-- Layer 5: Cut Lines (Pisau Potong Luar) -->
  <g id="layer-cut" class="cut-line">
    ${cutPaths.map((p) => `<path d="${p}" />`).join("\n    ")}
  </g>

  <!-- Layer 6: Technical Annotations & Legend -->
  <g id="layer-annotations">
    <text x="15" y="15" class="title-label">${name} — ${W} × ${D} × ${H} mm (Caliper: ${caliper} mm)</text>
    <text x="15" y="25" class="dim-label" fill="#64748b">150 DPI: ${canvasWidthPx} × ${canvasHeightPx} px | Solid Red = Cut | Dashed Green = Crease</text>
  </g>
</svg>
`.trim()

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`

  return {
    style,
    name,
    totalWidthMm: totalW,
    totalHeightMm: totalH,
    svgString,
    dataUrl,
    canvasWidthPx,
    canvasHeightPx,
    panels: panelZones,
  }
}

/**
 * Universal SVG Dieline Parser
 * Extracts physical dimensions and semantic panel zones (data-face) for exact 2D-to-3D UV mapping.
 */
export function parseSvgDielinePanels(svgText: string): {
  totalWidth: number
  totalHeight: number
  panels: DielinePanelZone[]
} {
  if (!svgText || typeof window === "undefined") {
    return { totalWidth: 200, totalHeight: 200, panels: [] }
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgText, "image/svg+xml")
    const svgEl = doc.querySelector("svg")
    if (!svgEl) return { totalWidth: 200, totalHeight: 200, panels: [] }

    // 1. Determine total dimensions from width/height or viewBox
    let totalWidth = parseFloat(svgEl.getAttribute("width") || "")
    let totalHeight = parseFloat(svgEl.getAttribute("height") || "")
    const viewBox = svgEl.getAttribute("viewBox")

    if (viewBox && (!totalWidth || !totalHeight || isNaN(totalWidth) || isNaN(totalHeight))) {
      const parts = viewBox.split(/[\s,]+/).map(Number)
      if (parts.length >= 4) {
        totalWidth = parts[2]
        totalHeight = parts[3]
      }
    }

    if (!totalWidth || isNaN(totalWidth)) totalWidth = 200
    if (!totalHeight || isNaN(totalHeight)) totalHeight = 200

    const panels: DielinePanelZone[] = []

    // 2. Query elements with [data-face] (AstaKraf standard)
    const faceElements = doc.querySelectorAll("[data-face]")
    if (faceElements.length > 0) {
      faceElements.forEach((el) => {
        const rawFace = el.getAttribute("data-face") || "front"
        const face = rawFace.toLowerCase() as DielinePanelZone["face"]
        const x = parseFloat(el.getAttribute("x") || "0")
        const y = parseFloat(el.getAttribute("y") || "0")
        const width = parseFloat(el.getAttribute("width") || "50")
        const height = parseFloat(el.getAttribute("height") || "50")
        const label = el.getAttribute("data-label") || el.getAttribute("id") || face.toUpperCase()

        panels.push({ face, x, y, width, height, label })
      })
    } else {
      // 3. Fallback: Query elements with id containing face names
      const standardFaces: Array<DielinePanelZone["face"]> = ["front", "back", "top", "bottom", "left", "right", "glue-flap"]
      standardFaces.forEach((f) => {
        const el = doc.querySelector(`#face-${f}, #${f}, [id*="${f}"]`)
        if (el && (el.tagName === "rect" || el.tagName === "g")) {
          const x = parseFloat(el.getAttribute("x") || "0")
          const y = parseFloat(el.getAttribute("y") || "0")
          const width = parseFloat(el.getAttribute("width") || "50")
          const height = parseFloat(el.getAttribute("height") || "50")
          if (width > 0 && height > 0) {
            panels.push({ face: f, x, y, width, height, label: f.toUpperCase() })
          }
        }
      })

      // 4. Fallback for Cylindrical Wrap Labels
      if (panels.length === 0) {
        const isCylinder = /cylinder|bottle|spray|can|wrap/i.test(svgText)
        if (isCylinder) {
          const wrapW = totalWidth * 0.7
          const wrapH = totalHeight * 0.6
          const startX = (totalWidth - wrapW) / 2
          const startY = (totalHeight - wrapH) / 2
          panels.push(
            { face: "front", x: startX, y: startY, width: wrapW / 2, height: wrapH, label: "MUKA DEPAN (FRONT 0°-180°)" },
            { face: "back", x: startX + wrapW / 2, y: startY, width: wrapW / 2, height: wrapH, label: "MUKA BELAKANG (BACK 180°-360°)" }
          )
        }
      }
    }

    return { totalWidth, totalHeight, panels }
  } catch (e) {
    console.error("Failed to parse SVG dieline panels:", e)
    return { totalWidth: 200, totalHeight: 200, panels: [] }
  }
}
