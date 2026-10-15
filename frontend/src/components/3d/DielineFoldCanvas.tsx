"use client"

import React, { useRef, useEffect, useMemo, useState } from "react"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { OrbitControls, ContactShadows, Center, Environment } from "@react-three/drei"
import * as THREE from "three"
import { DielineAnalysis, buildFolded3DModel, FoldModelHierarchy } from "@/lib/dielineTo3D"

interface DielineFoldCanvasProps {
  analysis: DielineAnalysis
  foldProgress: number // 0.0 (flat 2D) to 1.0 (fully folded 3D)
  boxColor?: string
  materialFinish?: "matte" | "glossy" | "kraft" | "metallic" | "frosted"
  dielineSvgString?: string
  exportTrigger?: number
  onExportDone?: (blob: Blob, filename: string) => void
  onCaptureThumbnail?: (dataUrl: string) => void
  captureTrigger?: number
}

// Inner Model Renderer inside R3F Canvas
function FoldedMeshRenderer({
  analysis,
  foldProgress,
  boxColor = "#ffffff",
  materialFinish = "matte",
  dielineTexture,
  modelRef,
}: {
  analysis: DielineAnalysis
  foldProgress: number
  boxColor?: string
  materialFinish?: string
  dielineTexture: THREE.CanvasTexture | null
  modelRef: React.RefObject<THREE.Group | null>
}) {
  const containerRef = useRef<THREE.Group>(null)
  const hierarchyRef = useRef<FoldModelHierarchy | null>(null)

  // Build the folding hierarchy whenever dieline geometry or texture changes
  useEffect(() => {
    if (!containerRef.current) return

    // Clean up previous children
    while (containerRef.current.children.length > 0) {
      containerRef.current.remove(containerRef.current.children[0])
    }

    const hierarchy = buildFolded3DModel(analysis, boxColor, materialFinish, dielineTexture)
    hierarchyRef.current = hierarchy

    containerRef.current.add(hierarchy.rootGroup)
    if (modelRef) {
      // @ts-ignore
      modelRef.current = hierarchy.rootGroup
    }

    hierarchy.updateFold(foldProgress)
  }, [analysis, boxColor, materialFinish, dielineTexture])

  // Update fold angle dynamically when slider moves
  useEffect(() => {
    if (hierarchyRef.current) {
      hierarchyRef.current.updateFold(foldProgress)
    }
  }, [foldProgress])

  return <group ref={containerRef} />
}

// GLTF Exporter & Thumbnail Snapshot Controller inside R3F Context
function ExporterController({
  exportTrigger,
  onExportDone,
  captureTrigger,
  onCaptureThumbnail,
  modelRef,
  fileName = "model-kemasan-3d.glb",
}: {
  exportTrigger?: number
  onExportDone?: (blob: Blob, filename: string) => void
  captureTrigger?: number
  onCaptureThumbnail?: (dataUrl: string) => void
  modelRef: React.RefObject<THREE.Group | null>
  fileName?: string
}) {
  const { gl, scene, camera } = useThree()

  // 1. Export GLB
  useEffect(() => {
    if (!exportTrigger || !onExportDone) return

    import("three/examples/jsm/exporters/GLTFExporter.js")
      .then(({ GLTFExporter }) => {
        const exporter = new GLTFExporter()
        const target = modelRef.current || scene

        exporter.parse(
          target,
          (gltf) => {
            const blob = new Blob([gltf as ArrayBuffer], { type: "model/gltf-binary" })
            onExportDone(blob, fileName)
          },
          (err) => {
            console.error("Gagal mengekspor GLB:", err)
          },
          { binary: true }
        )
      })
      .catch((err) => {
        console.error("Gagal memuat GLTFExporter:", err)
      })
  }, [exportTrigger, modelRef, onExportDone, fileName, scene])

  // 2. Capture Thumbnail PNG
  useEffect(() => {
    if (!captureTrigger || !onCaptureThumbnail) return
    try {
      gl.render(scene, camera)
      const dataUrl = gl.domElement.toDataURL("image/jpeg", 0.9)
      onCaptureThumbnail(dataUrl)
    } catch (e) {
      console.warn("Gagal capture thumbnail 3D:", e)
    }
  }, [captureTrigger, gl, scene, camera, onCaptureThumbnail])

  return null
}

export default function DielineFoldCanvas({
  analysis,
  foldProgress,
  boxColor = "#ffffff",
  materialFinish = "matte",
  dielineSvgString,
  exportTrigger,
  onExportDone,
  onCaptureThumbnail,
  captureTrigger,
}: DielineFoldCanvasProps) {
  const modelRef = useRef<THREE.Group | null>(null)
  const [dielineTexture, setDielineTexture] = useState<THREE.CanvasTexture | null>(null)

  // Bake 2D SVG Dieline into a Three.js CanvasTexture for 1:1 mapping
  useEffect(() => {
    if (!dielineSvgString) {
      setDielineTexture(null)
      return
    }

    let isMounted = true
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      if (!isMounted) return
      const canvas = document.createElement("canvas")
      const svgW = analysis.svgCanvasW || analysis.totalWidthMm || 2048
      const svgH = analysis.svgCanvasH || analysis.totalHeightMm || 2048
      const aspect = svgW / svgH

      const maxRes = 2048
      if (aspect >= 1) {
        canvas.width = maxRes
        canvas.height = Math.max(256, Math.round(maxRes / aspect))
      } else {
        canvas.width = Math.max(256, Math.round(maxRes * aspect))
        canvas.height = maxRes
      }

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Base background
      ctx.fillStyle = boxColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw SVG dieline graphics
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const tex = new THREE.CanvasTexture(canvas)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.flipY = false
      tex.needsUpdate = true

      setDielineTexture(tex)
    }

    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(dielineSvgString)}`

    return () => {
      isMounted = false
    }
  }, [dielineSvgString, boxColor, analysis.svgCanvasW, analysis.svgCanvasH, analysis.totalWidthMm, analysis.totalHeightMm])

  const maxDim = Math.max(analysis.dims.length, analysis.dims.width, analysis.dims.height, 80)
  const scale = 1.5 / maxDim
  const boxHeight = analysis.dims.height * scale
  const centerY = boxHeight / 2

  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        camera={{ position: [1.8, centerY + 0.6, 2.2], fov: 42 }}
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[4, 8, 5]} intensity={1.2} castShadow shadow-mapSize={1024} />
        <directionalLight position={[-4, -3, -4]} intensity={0.4} />

        <FoldedMeshRenderer
          analysis={analysis}
          foldProgress={foldProgress}
          boxColor={boxColor}
          materialFinish={materialFinish}
          dielineTexture={dielineTexture}
          modelRef={modelRef}
        />

        {/* Soft realistic ground shadow sitting flush under box */}
        <ContactShadows
          position={[0, -0.005, 0]}
          opacity={0.65}
          scale={3.5}
          blur={1.8}
          far={2.0}
        />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          target={[0, centerY, 0]}
          minDistance={0.5}
          maxDistance={8.0}
        />

        <ExporterController
          exportTrigger={exportTrigger}
          onExportDone={onExportDone}
          captureTrigger={captureTrigger}
          onCaptureThumbnail={onCaptureThumbnail}
          modelRef={modelRef}
          fileName={`${analysis.boxType}-${analysis.dims.length}x${analysis.dims.width}x${analysis.dims.height}mm.glb`}
        />
      </Canvas>
    </div>
  )
}
