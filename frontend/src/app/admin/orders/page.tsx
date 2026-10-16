"use client"

import React, { useState } from "react"
import { formatRupiah } from "@/lib/utils"
import { Printer, Download, CheckCircle2 } from "lucide-react"
import { ProductionOrder } from "@/types/admin"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([
    {
      id: "ORD-9482",
      customer: "Kopi Nusantara - Biji Robusta",
      item: "Standing Pouch Zipper (90x40x130mm)",
      material: "PETG Eco Black",
      qty: 150,
      total: 750000,
      status: "PRINTING",
      progress: "65%",
      time: "10 menit lalu",
    },
    {
      id: "ORD-9481",
      customer: "Sabun Organik Bali",
      item: "Kotak Sabun Parametrik (65x45x35mm)",
      material: "PLA Kraft Brown",
      qty: 50,
      total: 1250000,
      status: "QUEUED",
      progress: "0%",
      time: "42 menit lalu",
    },
    {
      id: "ORD-9479",
      customer: "Glow Skin Kosmetik",
      item: "Toples Krim Jar (Ø50x35mm)",
      material: "Resin Rose Gold",
      qty: 200,
      total: 3600000,
      status: "COMPLETED",
      progress: "100%",
      time: "2 jam lalu",
    },
  ])

  const [notification, setNotification] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  return (
    <div className="space-y-4">
      {notification && (
        <div role="status" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-[11px] font-bold text-emerald-800 shadow-xl animate-slide-up">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      <div className="p-4 rounded-xl bg-white border border-[#D5E4F0] flex items-center justify-between shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-[#1F3A5C] flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#4394C3]" />
            Antrian Produksi 3D Print Farm
          </h2>
          <p className="text-[11px] text-[#718BAA]">
            Daftar pesanan kemasan masuk yang siap dicetak dan diekspor ke file STL / G-Code.
          </p>
        </div>

        <span className="px-3 py-1 rounded-lg bg-[#EEF4F8] text-[#1F3A5C] border border-[#D5E4F0] text-[11px] font-mono font-semibold">
          {orders.length} Pesanan Aktif
        </span>
      </div>

      <div className="space-y-3">
        {orders.map((ord) => (
          <div
            key={ord.id}
            className="p-4 rounded-xl bg-white border border-[#D5E4F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-[#4394C3] transition-all"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#4B6B94]">{ord.id}</span>
                <span className="text-xs font-bold text-[#1F3A5C]">{ord.customer}</span>
                <span
                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                    ord.status === "PRINTING"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : ord.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-[#EEF4F8] text-[#4B6B94] border border-[#D5E4F0]"
                  }`}
                >
                  {ord.status} {ord.status === "PRINTING" ? `(${ord.progress})` : ""}
                </span>
              </div>
              <p className="text-xs text-[#1F3A5C]">
                {ord.item} • <span className="text-[#718BAA]">{ord.material} ({ord.qty} pcs)</span>
              </p>
              <p className="text-[10px] text-[#718BAA]">{ord.time}</p>
            </div>

            <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2">
              <p className="text-base font-bold text-[#1F3A5C] font-mono">{formatRupiah(ord.total)}</p>
              <button
                onClick={() => showToast(`Mengunduh STL untuk pesanan ${ord.id}...`)}
                className="px-3 py-1.5 rounded-lg bg-[#1F3A5C] hover:bg-[#162a43] text-white text-[10.5px] font-bold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-[#F7CB45]" />
                Unduh STL Produksi
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
