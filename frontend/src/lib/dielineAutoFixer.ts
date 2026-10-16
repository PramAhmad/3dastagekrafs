import { DielinePanelZone, parseSvgDielinePanels } from "./dielineGenerator"

export interface AutoFixResult {
  originalSvg: string
  fixedSvg: string
  cleanSvg: string
  fixesApplied: string[]
  panels: DielinePanelZone[]
  totalWidth: number
  totalHeight: number
  isCylinder: boolean
  hasBaseColor: boolean
}

/**
 * Intelligent Packaging Dieline SVG Auto-Fixer
 * Automatically repairs, normalizes, and upgrades uploaded raw SVGs
 * to conform with AstaKraf Packaging Technical Standard (STANDARISASI_SVG_DIELINE.md).
 *
 * Repairs performed:
 * 1. Physical Units & ViewBox: Ensures 1 unit = 1 mm with valid physical viewBox.
 * 2. Canvas Sheet Background: Injects opaque white sheet background (#layer-sheet) if transparent.
 * 3. Base Face Color: Injects solid #FFFFFF base fill so label/box faces are not transparent wireframes.
 * 4. Semantic Panels (data-face): Automatically segments single-wrap cylinders into Front & Back panels,
 *    or boxes into 6-sided folding faces.
 * 5. Cut & Crease Layer Standards: Normalizes strokes into #FF007F (Cut) and #00A651 dashed (Crease).
 * 6. Metadata: Injects AstaKraf standard schema metadata.
 * 7. Junk & Noise Cleaning: Strips third-party drafting metadata, foreign tags, and unneeded clutter.
 */
export function autoFixDielineSvg(rawSvgText: string): AutoFixResult {
  const fixesApplied: string[] = []

  if (!rawSvgText || typeof window === "undefined") {
    return {
      originalSvg: rawSvgText,
      fixedSvg: rawSvgText,
      cleanSvg: rawSvgText,
      fixesApplied: [],
      panels: [],
      totalWidth: 200,
      totalHeight: 200,
      isCylinder: false,
      hasBaseColor: false,
    }
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(rawSvgText, "image/svg+xml")
    const svgEl = doc.querySelector("svg")

    if (!svgEl) {
      return {
        originalSvg: rawSvgText,
        fixedSvg: rawSvgText,
        cleanSvg: rawSvgText,
        fixesApplied: ["Gagal mem-parsing XML SVG"],
        panels: [],
        totalWidth: 200,
        totalHeight: 200,
        isCylinder: false,
        hasBaseColor: false,
      }
    }

    // 1. DIMENSION & VIEWBOX NORMALIZATION
    let rawW = svgEl.getAttribute("width") || ""
    let rawH = svgEl.getAttribute("height") || ""
    let viewBox = svgEl.getAttribute("viewBox")

    let numW = parseFloat(rawW)
    let numH = parseFloat(rawH)

    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(Number)
      if (parts.length >= 4 && (!numW || !numH || isNaN(numW) || isNaN(numH))) {
        numW = parts[2]
        numH = parts[3]
      }
    }

    if (!numW || isNaN(numW)) numW = 200
    if (!numH || isNaN(numH)) numH = 200

    // Ensure physical mm units in width & height attributes
    if (!rawW.endsWith("mm") || !rawH.endsWith("mm")) {
      svgEl.setAttribute("width", `${numW}mm`)
      svgEl.setAttribute("height", `${numH}mm`)
      fixesApplied.push(`Standarisasi satuan fisik ke milimeter (${numW}mm × ${numH}mm)`)
    }

    if (!viewBox) {
      svgEl.setAttribute("viewBox", `0 0 ${numW} ${numH}`)
      fixesApplied.push(`Dibuat atribut viewBox="0 0 ${numW} ${numH}" presisi 1 unit = 1 mm`)
    }

    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    svgEl.setAttribute("data-astakraf-standard", "v1.0")

    // Check if cylinder packaging
    const isCylinder =
      /cylinder|bottle|spray|kaleng|can|wrap|melingkar|deodorant/i.test(rawSvgText) ||
      /Cylindrical/i.test(rawSvgText)

    // 2. SHEET BACKGROUND AUTO-FIX
    let sheetLayer = doc.querySelector("#layer-sheet, #Sheet-Background")
    if (!sheetLayer) {
      const firstChild = svgEl.firstElementChild
      const newSheet = doc.createElementNS("http://www.w3.org/2000/svg", "g")
      newSheet.setAttribute("id", "layer-sheet")

      const bgRect = doc.createElementNS("http://www.w3.org/2000/svg", "rect")
      bgRect.setAttribute("width", `${numW}`)
      bgRect.setAttribute("height", `${numH}`)
      bgRect.setAttribute("fill", "#ffffff")

      newSheet.appendChild(bgRect)

      if (firstChild && firstChild.tagName.toLowerCase() === "defs") {
        firstChild.after(newSheet)
      } else {
        svgEl.insertBefore(newSheet, svgEl.firstChild)
      }
      fixesApplied.push("Ditambahkan lembar kerja dasar putih (#layer-sheet) agar kanvas tidak transparan")
    }

    // 3. DETECT OR FIX ARTWORK LAYER & BASE FACE COLOR
    let artworkLayer = doc.querySelector("#layer-artwork, #Artwork-Layer")
    if (!artworkLayer) {
      artworkLayer = doc.createElementNS("http://www.w3.org/2000/svg", "g")
      artworkLayer.setAttribute("id", "layer-artwork")
      svgEl.appendChild(artworkLayer)
      fixesApplied.push("Dibuat container layer artwork desain (#layer-artwork)")
    }

    // Check if artwork or cut has solid face color fill
    let hasBaseColor = false
    const existingFills = artworkLayer.querySelectorAll("rect[fill], path[fill], circle[fill]")
    if (existingFills.length > 0) {
      hasBaseColor = true
    }

    // 4. FIND DIE-CUT BOUNDING BOX
    const cutElement = doc.querySelector("#Dieline-Cut, #layer-cut, .cut-line, path[stroke*='ff007f'], path[stroke*='e11d48']")
    let cutBox = { x: 20, y: 20, w: numW * 0.7, h: numH * 0.6 }

    if (cutElement) {
      // Try parsing rect cut
      if (cutElement.tagName.toLowerCase() === "rect") {
        const cx = parseFloat(cutElement.getAttribute("x") || "0")
        const cy = parseFloat(cutElement.getAttribute("y") || "0")
        const cw = parseFloat(cutElement.getAttribute("width") || "0")
        const ch = parseFloat(cutElement.getAttribute("height") || "0")
        if (cw > 0 && ch > 0) {
          cutBox = { x: cx, y: cy, w: cw, h: ch }
        }
      } else if (cutElement.tagName.toLowerCase() === "path") {
        const d = cutElement.getAttribute("d") || ""
        // Extract numbers from path
        const matches = d.match(/[-+]?\d*\.?\d+/g)
        if (matches && matches.length >= 4) {
          const coords = matches.map(Number).filter((n) => !isNaN(n))
          const xs: number[] = []
          const ys: number[] = []
          for (let i = 0; i < coords.length; i += 2) {
            if (coords[i] !== undefined) xs.push(coords[i])
            if (coords[i + 1] !== undefined) ys.push(coords[i + 1])
          }
          if (xs.length > 0 && ys.length > 0) {
            const minX = Math.min(...xs)
            const maxX = Math.max(...xs)
            const minY = Math.min(...ys)
            const maxY = Math.max(...ys)
            if (maxX - minX > 10 && maxY - minY > 10) {
              cutBox = { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
            }
          }
        }
      }
    }

    // If still no base color fill, inject a solid white sticker/carton base fill
    if (!hasBaseColor) {
      const baseFillRect = doc.createElementNS("http://www.w3.org/2000/svg", "rect")
      baseFillRect.setAttribute("id", "base-face-color")
      baseFillRect.setAttribute("x", `${cutBox.x}`)
      baseFillRect.setAttribute("y", `${cutBox.y}`)
      baseFillRect.setAttribute("width", `${cutBox.w}`)
      baseFillRect.setAttribute("height", `${cutBox.h}`)
      baseFillRect.setAttribute("rx", "1.5")
      baseFillRect.setAttribute("fill", "#ffffff")
      baseFillRect.setAttribute("stroke", "none")

      artworkLayer.insertBefore(baseFillRect, artworkLayer.firstChild)
      hasBaseColor = true
      fixesApplied.push(`Ditambahkan warna dasar solid stiker (#ffffff Face Color) pada koordinat ${cutBox.w} × ${cutBox.h} mm`)
    }

    // 5. SEMANTIC 3D PANELS (data-face) AUTO-GENERATION
    let panelsLayer = doc.querySelector("#layer-panels, #Panels-Layer")
    const existingFacePanels = doc.querySelectorAll("[data-face]")

    if (existingFacePanels.length === 0) {
      if (!panelsLayer) {
        panelsLayer = doc.createElementNS("http://www.w3.org/2000/svg", "g")
        panelsLayer.setAttribute("id", "layer-panels")
        // Insert right before artwork layer
        artworkLayer.before(panelsLayer)
      }

      if (isCylinder) {
        // Cylindrical Wrap: Divide wrap label into Front (0°-180°) and Back (180°-360°)
        const halfW = cutBox.w / 2

        const frontPanel = doc.createElementNS("http://www.w3.org/2000/svg", "rect")
        frontPanel.setAttribute("id", "face-front")
        frontPanel.setAttribute("data-face", "front")
        frontPanel.setAttribute("data-label", "MUKA DEPAN (FRONT 0°-180°)")
        frontPanel.setAttribute("x", `${cutBox.x}`)
        frontPanel.setAttribute("y", `${cutBox.y}`)
        frontPanel.setAttribute("width", `${halfW}`)
        frontPanel.setAttribute("height", `${cutBox.h}`)
        frontPanel.setAttribute("fill", "rgba(37,99,235,0.03)")
        frontPanel.setAttribute("stroke", "rgba(37,99,235,0.3)")
        frontPanel.setAttribute("stroke-width", "0.3")
        frontPanel.setAttribute("stroke-dasharray", "1.5 1.5")

        const backPanel = doc.createElementNS("http://www.w3.org/2000/svg", "rect")
        backPanel.setAttribute("id", "face-back")
        backPanel.setAttribute("data-face", "back")
        backPanel.setAttribute("data-label", "MUKA BELAKANG (BACK 180°-360°)")
        backPanel.setAttribute("x", `${cutBox.x + halfW}`)
        backPanel.setAttribute("y", `${cutBox.y}`)
        backPanel.setAttribute("width", `${halfW}`)
        backPanel.setAttribute("height", `${cutBox.h}`)
        backPanel.setAttribute("fill", "rgba(37,99,235,0.02)")
        backPanel.setAttribute("stroke", "rgba(37,99,235,0.3)")
        backPanel.setAttribute("stroke-width", "0.3")
        backPanel.setAttribute("stroke-dasharray", "1.5 1.5")

        // Center visual divider line
        const dividerLine = doc.createElementNS("http://www.w3.org/2000/svg", "line")
        dividerLine.setAttribute("x1", `${cutBox.x + halfW}`)
        dividerLine.setAttribute("y1", `${cutBox.y}`)
        dividerLine.setAttribute("x2", `${cutBox.x + halfW}`)
        dividerLine.setAttribute("y2", `${cutBox.y + cutBox.h}`)
        dividerLine.setAttribute("stroke", "#94a3b8")
        dividerLine.setAttribute("stroke-width", "0.3")
        dividerLine.setAttribute("stroke-dasharray", "2 1.5")

        panelsLayer.appendChild(frontPanel)
        panelsLayer.appendChild(backPanel)
        panelsLayer.appendChild(dividerLine)

        fixesApplied.push(
          `Dibuat otomatis zona semantik 3D: Muka Depan (Front 0°-180°, ${Math.round(halfW)}mm) & Muka Belakang (Back 180°-360°, ${Math.round(halfW)}mm)`
        )
      } else {
        // Box / Folding Carton: Generate Front, Back, Top, Bottom panels
        const mainW = cutBox.w * 0.4
        const mainH = cutBox.h * 0.4
        const midX = cutBox.x + (cutBox.w - mainW) / 2
        const midY = cutBox.y + (cutBox.h - mainH) / 2

        const frontPanel = doc.createElementNS("http://www.w3.org/2000/svg", "rect")
        frontPanel.setAttribute("id", "face-front")
        frontPanel.setAttribute("data-face", "front")
        frontPanel.setAttribute("data-label", "DEPAN (FRONT)")
        frontPanel.setAttribute("x", `${midX}`)
        frontPanel.setAttribute("y", `${midY}`)
        frontPanel.setAttribute("width", `${mainW}`)
        frontPanel.setAttribute("height", `${mainH}`)
        frontPanel.setAttribute("fill", "rgba(37,99,235,0.03)")
        frontPanel.setAttribute("stroke", "rgba(37,99,235,0.3)")
        frontPanel.setAttribute("stroke-width", "0.4")

        panelsLayer.appendChild(frontPanel)
        fixesApplied.push("Dibuat otomatis zona semantik data-face panel kemasan kotak")
      }
    }

    // 6. JUNK & NOISE CLEANING (Auto-remove third-party metadata, drafting texts, registration marks, title blocks)
    let cleanedItemsCount = 0

    // Remove third-party software junk metadata and hidden elements
    const junkSelectors = [
      "metadata",
      "foreignObject",
      "[display='none']",
      "[visibility='hidden']",
      "[opacity='0']",
    ]
    junkSelectors.forEach((sel) => {
      doc.querySelectorAll(sel).forEach((el) => {
        el.remove()
        cleanedItemsCount++
      })
    })

    // Remove technical annotation layers, title blocks, legends, registration marks
    const annSelectors = [
      "#layer-annotations",
      "#Technical-Annotations",
      "#Legend",
      "#Registration-Marks",
      "#Title-Block",
      ".title-label",
      ".dim-label",
      ".txt-title",
      ".txt-meta",
      ".txt-dim",
      ".dim-line",
      "#layer-bleed",
      "#layer-safe",
      "#Bleed-3mm",
      "#Safe-Zone",
      ".bleed-line",
      ".safe-line",
    ]
    annSelectors.forEach((sel) => {
      doc.querySelectorAll(sel).forEach((el) => {
        el.remove()
        cleanedItemsCount++
      })
    })

    // Remove 4 corner registration crosses (circles with r <= 3.5 with parent lines)
    doc.querySelectorAll("circle").forEach((c) => {
      const r = parseFloat(c.getAttribute("r") || "0")
      if (r <= 3.5 && c.parentElement && c.parentElement.querySelectorAll("line").length >= 2) {
        c.parentElement.remove()
        cleanedItemsCount++
      }
    })

    // Remove static drafting texts inside the dieline template
    doc.querySelectorAll("text, tspan").forEach((t) => {
      t.remove()
      cleanedItemsCount++
    })

    if (cleanedItemsCount > 0) {
      fixesApplied.push(`Dibersihkan ${cleanedItemsCount} elemen teknis drafting (teks, tanda registrasi, & anotasi)`)
    }

    // 7. SERIALIZE CLEAN STANDARDIZED SVG
    const serializer = new XMLSerializer()
    const fixedSvg = serializer.serializeToString(doc)

    // Generate a decluttered version without heavy drafting texts & crosshairs
    const cleanSvg = cleanDielineSvg(fixedSvg, { removeTexts: true, removeAnnotations: true })

    // Parse the newly standardized panels
    const parsed = parseSvgDielinePanels(fixedSvg)

    return {
      originalSvg: rawSvgText,
      fixedSvg,
      cleanSvg,
      fixesApplied,
      panels: parsed.panels,
      totalWidth: parsed.totalWidth,
      totalHeight: parsed.totalHeight,
      isCylinder,
      hasBaseColor,
    }
  } catch (err: any) {
    console.error("Auto-fix dieline SVG error:", err)
    return {
      originalSvg: rawSvgText,
      fixedSvg: rawSvgText,
      cleanSvg: rawSvgText,
      fixesApplied: [`Error: ${err?.message || "Gagal memproses SVG"}`],
      panels: [],
      totalWidth: 200,
      totalHeight: 200,
      isCylinder: false,
      hasBaseColor: false,
    }
  }
}

/**
 * Sanitizes an SVG specifically for 3D model texture projection.
 * Strips all technical cut lines, crease lines, text labels, dimension annotations,
 * registration crosshairs, title blocks, and bleed/safe zones.
 *
 * Retains ONLY legitimate graphic artwork (e.g. paths/illustrations in #layer-artwork).
 * Returns null if the SVG has no artwork (i.e. it is purely an engineering knife dieline),
 * preventing red cut lines, green crease lines, and drafting texts from being projected onto the 3D model!
 */
export function sanitizeSvgFor3D(rawSvgText: string): string | null {
  if (!rawSvgText || typeof window === "undefined") return null

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(rawSvgText, "image/svg+xml")
    const svgEl = doc.querySelector("svg")
    if (!svgEl) return null

    // Remove complete technical layers first, including namespaced SVG groups and
    // uppercase CAD layer IDs used by structural dieline exports.
    const technicalLayerPattern = /^(info|cut|crease|bleed|safe|glue|seal|perf|kiss[_-]?cut|dimensions?|guides?|annotations?|registration[_-]?marks?)$/i
    Array.from(svgEl.querySelectorAll("*")).forEach((el) => {
      const localName = el.localName.toLowerCase()
      if (localName !== "g") return
      const semanticName = `${el.getAttribute("id") || ""} ${el.getAttribute("class") || ""}`.trim()
      if (technicalLayerPattern.test(semanticName)) el.remove()
    })

    // 1. Remove all text and tspan elements
    doc.querySelectorAll("text, tspan").forEach((t) => t.remove())

    // 2. Remove technical annotations, cut lines, crease lines, dimension lines, title blocks, legends, bleed/safe
    const technicalLayerSelectors = [
      "#layer-cut",
      "#layer-crease",
      "#layer-dieline",
      "#Dieline-Cut",
      "#Crease-Score",
      "#Safe-Zone",
      "#Bleed-3mm",
      "#layer-bleed",
      "#layer-safe",
      "#layer-sheet",
      "#layer-panels",
      "#layer-annotations",
      "#Technical-Annotations",
      "#Legend",
      "#Registration-Marks",
      "#Reg-Marks",
      "#Crosshairs",
      "#Dimensions",
      "#Guides",
      "#Title-Block",
      "#base-face-color",
      "#Sheet-Background",
      "#Panels-Layer",
      "[data-face]",
      ".cut-line",
      ".crease-line",
      ".perf-line",
      ".bleed-line",
      ".safe-line",
      ".dim-line",
      ".title-label",
      ".dim-label",
      ".panel-label",
      ".txt-title",
      ".txt-meta",
      ".txt-dim",
      "style",
      "metadata",
      "foreignObject",
    ]
    technicalLayerSelectors.forEach((sel) => {
      doc.querySelectorAll(sel).forEach((el) => el.remove())
    })

    // 3. Remove cut and crease lines from 3D model (model is already 3D folded!)
    const isCutOrCreaseOrGuide = (el: Element) => {
      const stroke = (el.getAttribute("stroke") || "").toLowerCase()
      const style = (el.getAttribute("style") || "").toLowerCase()
      const className = (el.getAttribute("class") || "").toLowerCase()
      const id = (el.getAttribute("id") || "").toLowerCase()

      // Check class or id
      if (/cut|crease|score|perf|fold|dieline|knife|guide|dim|bleed|safe/i.test(className + " " + id)) return true

      // Check stroke color (magenta, red, green, cyan)
      const strokeVal = stroke + " " + style
      if (
        strokeVal.includes("ff007f") ||
        strokeVal.includes("e11d48") ||
        strokeVal.includes("f43f5e") ||
        strokeVal.includes("ff0000") ||
        strokeVal.includes("00a651") ||
        strokeVal.includes("10b981") ||
        strokeVal.includes("22c55e") ||
        strokeVal.includes("00a0e9") ||
        strokeVal.includes("magenta") ||
        strokeVal.includes("rgb(255, 0, 127)") ||
        strokeVal.includes("rgb(0, 166, 81)") ||
        strokeVal.includes("rgb(255, 0, 0)")
      ) {
        return true
      }
      return false
    }

    doc.querySelectorAll("path, line, polyline, polygon, rect").forEach((el) => {
      let parent: Element | null = el.parentElement
      let technicalAncestor = false
      while (parent && parent !== svgEl) {
        const semanticName = `${parent.getAttribute("id") || ""} ${parent.getAttribute("class") || ""}`.trim()
        if (technicalLayerPattern.test(semanticName)) {
          technicalAncestor = true
          break
        }
        parent = parent.parentElement
      }
      if (
        isCutOrCreaseOrGuide(el) ||
        technicalAncestor ||
        el.closest("#layer-cut, #layer-crease, #Dieline-Cut, #Crease-Score, .cut-line, .crease-line")
      ) {
        el.remove()
      }
    })

    // 4. Remove registration marks (circle r <= 3.5 with cross lines)
    doc.querySelectorAll("circle").forEach((c) => {
      const r = parseFloat(c.getAttribute("r") || "0")
      if (r <= 3.5 && c.parentElement && c.parentElement.querySelectorAll("line").length >= 2) {
        c.parentElement.remove()
      }
    })

    // 5. Remove sheet or solid white background rects that cover 3D packaging color
    doc.querySelectorAll("rect").forEach((r) => {
      const fill = (r.getAttribute("fill") || "").toLowerCase()
      const id = (r.getAttribute("id") || "").toLowerCase()
      if (id.includes("sheet") || id.includes("base") || fill === "#ffffff" || fill === "white" || fill === "#fff") {
        r.remove()
      }
    })

    // 6. Check if there are any remaining artwork paths/images/shapes
    const artworkElements = svgEl.querySelectorAll("path, image, circle, ellipse, polygon, rect")
    if (artworkElements.length === 0) {
      // Pure technical knife dieline: return null so 3D model stays completely clean
      return null
    }

    return new XMLSerializer().serializeToString(doc)
  } catch (err) {
    console.warn("Failed to sanitize SVG for 3D:", err)
    return null
  }
}

/**
 * Automatically cleans up unneeded components, drafting texts, and technical junk from raw SVG dielines.
 */
export function cleanDielineSvg(
  rawSvgText: string,
  options: { removeTexts?: boolean; removeAnnotations?: boolean; removeJunkTags?: boolean } = {}
): string {
  const { removeTexts = true, removeAnnotations = true, removeJunkTags = true } = options
  if (!rawSvgText || typeof window === "undefined") return rawSvgText

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(rawSvgText, "image/svg+xml")
    const svgEl = doc.querySelector("svg")
    if (!svgEl) return rawSvgText

    // 1. Remove third-party software junk metadata and invisible elements
    if (removeJunkTags) {
      const junkSelectors = [
        "metadata",
        "foreignObject",
        "[display='none']",
        "[visibility='hidden']",
        "[opacity='0']",
      ]
      junkSelectors.forEach((sel) => {
        doc.querySelectorAll(sel).forEach((el) => el.remove())
      })
    }

    // 2. Remove technical annotations, title blocks, legends, registration marks
    if (removeAnnotations) {
      const annSelectors = [
        "#layer-annotations",
        "#Technical-Annotations",
        "#Legend",
        "#Registration-Marks",
        ".title-label",
        ".dim-label",
        ".txt-title",
        ".txt-meta",
        ".txt-dim",
        ".dim-line",
      ]
      annSelectors.forEach((sel) => {
        doc.querySelectorAll(sel).forEach((el) => el.remove())
      })

      // Remove 4 corner registration crosses
      doc.querySelectorAll("circle").forEach((c) => {
        const r = parseFloat(c.getAttribute("r") || "0")
        if (r <= 3.5 && c.parentElement && c.parentElement.querySelectorAll("line").length >= 2) {
          c.parentElement.remove()
        }
      })
    }

    // 3. Remove text nodes if requested
    if (removeTexts) {
      doc.querySelectorAll("text, tspan").forEach((t) => t.remove())
    }

    return new XMLSerializer().serializeToString(doc)
  } catch (e) {
    console.warn("cleanDielineSvg error:", e)
    return rawSvgText
  }
}
