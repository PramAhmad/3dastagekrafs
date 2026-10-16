"use client"

import React, { useState, useEffect } from "react"
import { formatRupiah } from "@/lib/utils"
import { DollarSign, Play, Sparkles, Check, CheckCircle2 } from "lucide-react"

export default function AdminPricingPage() {
  const [markupPct, setMarkupPct] = useState(30)
  const [machineRate, setMachineRate] = useState(15000)
  const [plaRate, setPlaRate] = useState(350)
  const [petgRate, setPetgRate] = useState(450)
  const [resinRate, setResinRate] = useState(850)
  const [packagingFee, setPackagingFee] = useState(5000)
  const [minOrder, setMinOrder] = useState(25000)

  // Live Test state
  const [calcLength, setCalcLength] = useState(65)
  const [calcWidth, setCalcWidth] = useState(45)
  const [calcHeight, setCalcHeight] = useState(35)
  const [calcMaterial, setCalcMaterial] = useState("PLA")
  const [calcResult, setCalcResult] = useState<{
    weight: number
    timeMins: number
    materialCost: number
    machineCost: number
    totalPrice: number
  } | null>(null)

  const [notification, setNotification] = useState<string | null>(null)

  useEffect(() => {
    // 1. Check local storage
    const saved = localStorage.getItem("kemasan3d_pricing_config")
    if (saved) {
      try {
        const p = JSON.parse(saved)
        if (p.machineRate) setMachineRate(p.machineRate)
        if (p.markupPct) setMarkupPct(p.markupPct)
        if (p.plaRate) setPlaRate(p.plaRate)
        if (p.petgRate) setPetgRate(p.petgRate)
        if (p.resinRate) setResinRate(p.resinRate)
        if (p.packagingFee) setPackagingFee(p.packagingFee)
        if (p.minOrder) setMinOrder(p.minOrder)
      } catch (e) {}
    }

    // 2. Fetch from server API
    fetch("/api/pricing")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          const p = json.data
          if (p.machineRate) setMachineRate(p.machineRate)
          if (p.markupPct) setMarkupPct(p.markupPct)
          if (p.plaRate) setPlaRate(p.plaRate)
          if (p.petgRate) setPetgRate(p.petgRate)
          if (p.resinRate) setResinRate(p.resinRate)
          if (p.packagingFee) setPackagingFee(p.packagingFee)
          if (p.minOrder) setMinOrder(p.minOrder)
          localStorage.setItem("kemasan3d_pricing_config", JSON.stringify(p))
        }
      })
      .catch(() => {})
  }, [])

  // Live Calculation
  useEffect(() => {
    const vol = (calcLength * calcWidth * calcHeight) / 1000
    const effVol = vol * 0.4
    const matRate = calcMaterial === "RESIN" ? resinRate : calcMaterial === "PETG" ? petgRate : plaRate
    const weight = Math.round(effVol * (calcMaterial === "RESIN" ? 1.15 : 1.24) * 10) / 10
    const printTime = Math.max(15, Math.round(weight * 3.2))
    const matCost = Math.round(weight * matRate)
    const machCost = Math.round((printTime / 60) * machineRate)
    const subtotal = matCost + machCost + packagingFee
    const total = Math.max(minOrder, Math.round(subtotal * (1 + markupPct / 100)))

    setCalcResult({
      weight,
      timeMins: printTime,
      materialCost: matCost,
      machineCost: machCost,
      totalPrice: total,
    })
  }, [calcLength, calcWidth, calcHeight, calcMaterial, machineRate, plaRate, petgRate, resinRate, packagingFee, minOrder, markupPct])

  const handleSaveConfig = async () => {
    const config = {
      machineRate,
      markupPct,
      plaRate,
      petgRate,
      resinRate,
      packagingFee,
      minOrder,
    }

    // 1. LocalStorage
    localStorage.setItem("kemasan3d_pricing_config", JSON.stringify(config))

    // 2. Server API
    try {
      await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
    } catch (e) {}

    setNotification("Konfigurasi harga berhasil disimpan secara permanen di server!")
    setTimeout(() => setNotification(null), 3000)
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div role="status" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-[11px] font-bold text-emerald-800 shadow-xl animate-slide-up">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-[#D5E4F0] shadow-xs space-y-4">
          <div className="border-b border-[#D5E4F0] pb-3">
            <h2 className="text-base font-bold text-[#1F3A5C] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Konfigurasi Parameter Biaya Cetak & Margin
            </h2>
            <p className="text-[11px] text-[#718BAA]">
              Parameter ini disimpan permanen dan digunakan langsung oleh kalkulator 3D Slicer client.
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Machine Rate */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="font-semibold text-[#1F3A5C]">Tarif Mesin (Rp / Jam Operasional):</span>
                <span className="font-mono text-emerald-600 font-bold">{formatRupiah(machineRate)}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="50000"
                step="1000"
                value={machineRate}
                onChange={(e) => setMachineRate(Number(e.target.value))}
                className="w-full h-1.5 bg-[#EEF4F8] rounded appearance-none cursor-pointer accent-[#1F3A5C]"
              />
            </div>

            {/* Markup Percentage */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="font-semibold text-[#1F3A5C]">Margin Profit Toko (%):</span>
                <span className="font-mono text-[#4394C3] font-bold">{markupPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={markupPct}
                onChange={(e) => setMarkupPct(Number(e.target.value))}
                className="w-full h-1.5 bg-[#EEF4F8] rounded appearance-none cursor-pointer accent-[#1F3A5C]"
              />
            </div>

            {/* Material Rates */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="space-y-1 bg-[#F6FAFC] p-2 rounded-xl border border-[#D5E4F0]">
                <span className="text-[10px] text-[#718BAA] block font-semibold">PLA (Rp/g)</span>
                <input
                  type="number"
                  value={plaRate}
                  onChange={(e) => setPlaRate(Number(e.target.value))}
                  className="w-full bg-white border border-[#D5E4F0] rounded p-1 text-[#1F3A5C] font-mono text-[11px] focus:outline-none focus:border-[#4394C3]"
                />
              </div>
              <div className="space-y-1 bg-[#F6FAFC] p-2 rounded-xl border border-[#D5E4F0]">
                <span className="text-[10px] text-[#718BAA] block font-semibold">PETG (Rp/g)</span>
                <input
                  type="number"
                  value={petgRate}
                  onChange={(e) => setPetgRate(Number(e.target.value))}
                  className="w-full bg-white border border-[#D5E4F0] rounded p-1 text-[#1F3A5C] font-mono text-[11px] focus:outline-none focus:border-[#4394C3]"
                />
              </div>
              <div className="space-y-1 bg-[#F6FAFC] p-2 rounded-xl border border-[#D5E4F0]">
                <span className="text-[10px] text-[#718BAA] block font-semibold">Resin (Rp/g)</span>
                <input
                  type="number"
                  value={resinRate}
                  onChange={(e) => setResinRate(Number(e.target.value))}
                  className="w-full bg-white border border-[#D5E4F0] rounded p-1 text-[#1F3A5C] font-mono text-[11px] focus:outline-none focus:border-[#4394C3]"
                />
              </div>
            </div>

            {/* Packaging & Minimum Order */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1 bg-[#F6FAFC] p-2.5 rounded-xl border border-[#D5E4F0]">
                <span className="text-[10px] text-[#718BAA] block font-semibold">Biaya Packaging (Rp)</span>
                <input
                  type="number"
                  value={packagingFee}
                  onChange={(e) => setPackagingFee(Number(e.target.value))}
                  className="w-full bg-white border border-[#D5E4F0] rounded p-1 text-[#1F3A5C] font-mono text-[11px] focus:outline-none focus:border-[#4394C3]"
                />
              </div>
              <div className="space-y-1 bg-[#F6FAFC] p-2.5 rounded-xl border border-[#D5E4F0]">
                <span className="text-[10px] text-[#718BAA] block font-semibold">Minimal Pesanan (Rp)</span>
                <input
                  type="number"
                  value={minOrder}
                  onChange={(e) => setMinOrder(Number(e.target.value))}
                  className="w-full bg-white border border-[#D5E4F0] rounded p-1 text-[#1F3A5C] font-mono text-[11px] focus:outline-none focus:border-[#4394C3]"
                />
              </div>
            </div>

            <button
              onClick={handleSaveConfig}
              className="w-full py-2.5 rounded-lg bg-[#1F3A5C] hover:bg-[#162a43] text-white font-bold text-[11px] shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-[#F7CB45]" />
              Simpan Konfigurasi Permanen
            </button>
          </div>
        </div>

        {/* Right: Live Slicer Test Box */}
        <div className="lg:col-span-6 p-5 rounded-xl bg-white border border-[#D5E4F0] shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#D5E4F0] pb-3">
              <h2 className="text-sm font-bold text-[#1F3A5C] flex items-center gap-2">
                <Play className="w-4 h-4 text-[#4394C3]" />
                Simulasi Kalkulator Real-time
              </h2>
              <p className="text-[11px] text-[#718BAA]">
                Simulasi instan biaya cetak yang akan dihitung otomatis saat pembeli memilih dimensi kemasan.
              </p>
            </div>

            {/* Test Inputs */}
            <div className="grid grid-cols-4 gap-2 pt-3">
              <div>
                <span className="text-[10px] text-[#718BAA] block font-semibold">P (mm)</span>
                <input
                  type="number"
                  value={calcLength}
                  onChange={(e) => setCalcLength(Number(e.target.value))}
                  className="w-full bg-[#F6FAFC] border border-[#D5E4F0] rounded p-1 text-[#1F3A5C] font-mono text-[11px] focus:outline-none focus:border-[#4394C3]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#718BAA] block font-semibold">L (mm)</span>
                <input
                  type="number"
                  value={calcWidth}
                  onChange={(e) => setCalcWidth(Number(e.target.value))}
                  className="w-full bg-[#F6FAFC] border border-[#D5E4F0] rounded p-1 text-[#1F3A5C] font-mono text-[11px] focus:outline-none focus:border-[#4394C3]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#718BAA] block font-semibold">T (mm)</span>
                <input
                  type="number"
                  value={calcHeight}
                  onChange={(e) => setCalcHeight(Number(e.target.value))}
                  className="w-full bg-[#F6FAFC] border border-[#D5E4F0] rounded p-1 text-[#1F3A5C] font-mono text-[11px] focus:outline-none focus:border-[#4394C3]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#718BAA] block font-semibold">Material</span>
                <select
                  value={calcMaterial}
                  onChange={(e) => setCalcMaterial(e.target.value)}
                  className="w-full bg-[#F6FAFC] border border-[#D5E4F0] rounded p-1 text-[#1F3A5C] font-mono text-[11px] focus:outline-none focus:border-[#4394C3]"
                >
                  <option value="PLA">PLA</option>
                  <option value="PETG">PETG</option>
                  <option value="RESIN">RESIN</option>
                </select>
              </div>
            </div>

            {/* Output Card */}
            {calcResult && (
              <div className="mt-4 p-4 rounded-xl bg-[#F6FAFC] border border-[#D5E4F0] space-y-2 text-[11px]">
                <div className="flex justify-between text-[#718BAA]">
                  <span>Estimasi Berat:</span>
                  <span className="font-mono text-[#1F3A5C] font-bold">{calcResult.weight} gram</span>
                </div>
                <div className="flex justify-between text-[#718BAA]">
                  <span>Estimasi Waktu Cetak:</span>
                  <span className="font-mono text-[#1F3A5C] font-bold">{calcResult.timeMins} menit</span>
                </div>
                <div className="flex justify-between text-[#718BAA]">
                  <span>Biaya Bahan Baku:</span>
                  <span className="font-mono text-[#4B6B94]">{formatRupiah(calcResult.materialCost)}</span>
                </div>
                <div className="flex justify-between text-[#718BAA]">
                  <span>Biaya Mesin & Listrik:</span>
                  <span className="font-mono text-[#4B6B94]">{formatRupiah(calcResult.machineCost)}</span>
                </div>
                <div className="pt-2 border-t border-[#D5E4F0] flex justify-between items-center text-sm font-bold">
                  <span className="text-[#1F3A5C]">Harga Jual Otomatis:</span>
                  <span className="font-mono text-emerald-600 text-base">{formatRupiah(calcResult.totalPrice)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-[#EEF4F8] border border-[#D5E4F0] text-[10px] text-[#718BAA] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#4394C3] shrink-0" />
            <span>Kalkulasi ini terhubung langsung secara real-time pada 3D studio client.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
