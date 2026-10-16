"use client"

import React, { useState, useEffect } from "react"
import { Box, Sparkles } from "lucide-react"

interface AstaLoadingScreenProps {
  message?: string
  onLoaded?: () => void
  durationMs?: number
}

export default function AstaLoadingScreen({
  message = "Memuat Studio 3D & Dieline Kemasan...",
  onLoaded,
  durationMs = 1200,
}: AstaLoadingScreenProps) {
  const [progress, setProgress] = useState(15)
  const [statusIdx, setStatusIdx] = useState(0)

  const statusMessages = [
    "Menginisialisasi Engine Tiga Dimensi...",
    "Mengalibrasi Geometri & UV Surface...",
    "Menghubungkan Vector Dieline & Sisi Panel...",
    "Menyiapkan Studio Lighting & Material...",
  ]

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const ratio = Math.min(1, elapsed / durationMs)
      const currentProgress = Math.round(15 + ratio * 85)
      setProgress(currentProgress)

      const stage = Math.min(
        statusMessages.length - 1,
        Math.floor(ratio * statusMessages.length)
      )
      setStatusIdx(stage)

      if (ratio >= 1) {
        clearInterval(interval)
        if (onLoaded) {
          setTimeout(onLoaded, 150)
        }
      }
    }, 40)

    return () => clearInterval(interval)
  }, [durationMs, onLoaded])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#F8FAFC] via-[#EEF4F8] to-[#E2E8F0] select-none text-[#1F3A5C] overflow-hidden">
      {/* Background ambient lighting circles */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-400/10 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

      {/* 3D ASTA ROTATING BOX STAGE */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Tech Orbit Ring */}
        <div className="absolute w-36 h-36 rounded-full border border-blue-400/30 border-dashed animate-[spin_8s_linear_infinite]" />
        <div className="absolute w-44 h-44 rounded-full border border-slate-300/40 border-dotted animate-[spin_16s_linear_infinite_reverse]" />

        {/* 3D CSS Cube Stage */}
        <div className="asta-cube-scene">
          <div className="asta-cube">
            {/* Front */}
            <div className="asta-face asta-front">
              <div className="w-full h-full border border-blue-500/50 bg-blue-500/20 backdrop-blur-xs flex items-center justify-center">
                <Box className="w-5 h-5 text-blue-600 opacity-70" />
              </div>
            </div>
            {/* Back */}
            <div className="asta-face asta-back">
              <div className="w-full h-full border border-blue-600/40 bg-blue-600/15" />
            </div>
            {/* Right */}
            <div className="asta-face asta-right">
              <div className="w-full h-full border border-sky-400/50 bg-sky-400/25 flex items-center justify-center">
                <span className="font-mono text-[9px] font-bold text-sky-800 opacity-60">ASTA</span>
              </div>
            </div>
            {/* Left */}
            <div className="asta-face asta-left">
              <div className="w-full h-full border border-blue-400/40 bg-blue-400/15" />
            </div>
            {/* Top */}
            <div className="asta-face asta-top">
              <div className="w-full h-full border border-amber-400/60 bg-amber-400/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-500 opacity-80" />
              </div>
            </div>
            {/* Bottom */}
            <div className="asta-face asta-bottom">
              <div className="w-full h-full border border-slate-400/50 bg-slate-400/30" />
            </div>
          </div>
        </div>

        {/* Ground Soft Dynamic Shadow */}
        <div className="absolute -bottom-2 w-28 h-6 bg-slate-900/15 rounded-full blur-md animate-[pulse_2s_ease-in-out_infinite]" />
      </div>

      {/* Brand & Loading Info */}
      <div className="mt-6 flex flex-col items-center max-w-sm px-6 text-center z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-extrabold text-[15px] tracking-tight text-[#1F3A5C]">
            AstaKraft <span className="text-[#4394C3]">Studio 3D</span>
          </span>
          <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-[#1F3A5C] text-[#F7CB45] font-mono font-bold tracking-wider">
            ASTAKRAF-ENGINE
          </span>
        </div>

        <p className="text-[11.5px] text-[#475569] h-5 transition-all duration-300 font-medium">
          {statusMessages[statusIdx]}
        </p>

        {/* Modern Progress Bar */}
        <div className="w-56 h-1.5 bg-slate-200/80 rounded-full mt-4 overflow-hidden p-0.5 border border-slate-300/40">
          <div
            className="h-full bg-gradient-to-r from-[#4394C3] via-[#2F79A6] to-[#F7CB45] rounded-full transition-all duration-100 ease-out shadow-xs"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-56 mt-1.5 text-[10px] font-mono text-[#64748b]">
          <span>Loading Engine</span>
          <span className="font-bold text-[#1F3A5C]">{progress}%</span>
        </div>
      </div>

      {/* CSS 3D Cube Animation Styles */}
      <style jsx>{`
        .asta-cube-scene {
          width: 64px;
          height: 64px;
          perspective: 600px;
        }

        .asta-cube {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          animation: astaTurntable 3.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }

        .asta-face {
          position: absolute;
          width: 64px;
          height: 64px;
          border-radius: 6px;
          box-shadow: inset 0 0 12px rgba(67, 148, 195, 0.2);
        }

        .asta-front  { transform: rotateY(  0deg) translateZ(32px); }
        .asta-back   { transform: rotateY(180deg) translateZ(32px); }
        .asta-right  { transform: rotateY( 90deg) translateZ(32px); }
        .asta-left   { transform: rotateY(-90deg) translateZ(32px); }
        .asta-top    { transform: rotateX( 90deg) translateZ(32px); }
        .asta-bottom { transform: rotateX(-90deg) translateZ(32px); }

        @keyframes astaTurntable {
          0% {
            transform: rotateX(-22deg) rotateY(0deg);
          }
          50% {
            transform: rotateX(-28deg) rotateY(180deg) scale(1.04);
          }
          100% {
            transform: rotateX(-22deg) rotateY(360deg);
          }
        }
      `}</style>
    </div>
  )
}
