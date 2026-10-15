"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { formatRupiah } from "@/lib/utils"
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Printer,
  Box,
  ChevronRight,
  Plus,
  Sliders,
  Store,
} from "lucide-react"
import { PackagingTemplate } from "@/types/admin"

export default function AdminDashboardPage() {
  const [templateCount, setTemplateCount] = useState(8)

  const orders = [
    {
      id: "ORD-9482",
      customer: "Kopi Nusantara - Biji Robusta",
      item: "Standing Pouch Zipper (90x40x130mm)",
      status: "PRINTING",
      total: 750000,
    },
    {
      id: "ORD-9481",
      customer: "Sabun Organik Bali",
      item: "Kotak Sabun Parametrik (65x45x35mm)",
      status: "QUEUED",
      total: 1250000,
    },
    {
      id: "ORD-9479",
      customer: "Glow Skin Kosmetik",
      item: "Toples Krim Jar (Ø50x35mm)",
      status: "COMPLETED",
      total: 3600000,
    },
  ]

  useEffect(() => {
    const saved = localStorage.getItem("kemasan3d_custom_templates")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setTemplateCount(parsed.length)
      } catch (e) {}
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#D5E4F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#718BAA] text-[11px] mb-1">
            <span className="font-semibold">Total Omset Bulan Ini</span>
            <DollarSign className="w-4 h-4 text-[#2F79A6]" />
          </div>
          <p className="text-2xl font-black text-[#1F3A5C]">{formatRupiah(18450000)}</p>
          <p className="text-[10.5px] text-emerald-600 flex items-center gap-1 font-bold">
            <TrendingUp className="w-3 h-3" /> +24% dari bulan lalu
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#D5E4F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#718BAA] text-[11px] mb-1">
            <span className="font-semibold">Pesanan Aktif</span>
            <ShoppingBag className="w-4 h-4 text-[#2F79A6]" />
          </div>
          <p className="text-2xl font-black text-[#1F3A5C]">{orders.length} Pesanan</p>
          <p className="text-[10.5px] text-[#4B6B94] flex items-center gap-1 font-medium">
            1 Dalam proses pencetakan
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#D5E4F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#718BAA] text-[11px] mb-1">
            <span className="font-semibold">Status 3D Print Farm</span>
            <Printer className="w-4 h-4 text-[#2F79A6]" />
          </div>
          <p className="text-2xl font-black text-[#1F3A5C]">4 / 6 Mesin</p>
          <p className="text-[10.5px] text-[#4B6B94] flex items-center gap-1 font-medium">
            66% Kapasitas terpakai
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#D5E4F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#718BAA] text-[11px] mb-1">
            <span className="font-semibold">Model Kemasan Aktif</span>
            <Box className="w-4 h-4 text-[#2F79A6]" />
          </div>
          <p className="text-2xl font-black text-[#1F3A5C]">{templateCount} Model</p>
          <p className="text-[10.5px] text-[#4B6B94] flex items-center gap-1 font-medium">
            Siap dicustomize & diekspor
          </p>
        </div>
      </div>

      {/* Two Column Layout: Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-white border border-[#D5E4F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#D5E4F0] pb-3">
            <h2 className="text-sm font-extrabold text-[#1F3A5C] flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#2F79A6]" />
              Pesanan Terbaru Siap Diproduksi
            </h2>
            <Link
              href="/admin/orders"
              className="text-[#2F79A6] hover:text-[#1F3A5C] text-[11px] font-bold flex items-center gap-1"
            >
              <span>Lihat Antrian Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="p-3.5 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] flex items-center justify-between hover:border-[#4394C3] transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#2F79A6] font-extrabold text-[11px]">{ord.id}</span>
                    <span className="font-bold text-[#1F3A5C] text-[11px]">{ord.customer}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                        ord.status === "PRINTING"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : ord.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-white text-[#1F3A5C] border border-[#D5E4F0]"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-[#718BAA] text-[10.5px]">{ord.item}</p>
                </div>
                <span className="font-black font-mono text-[#1F3A5C] text-[12px]">{formatRupiah(ord.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-white border border-[#D5E4F0] shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#1F3A5C] mb-1">Aksi Cepat Admin</h3>
            <p className="text-[#718BAA] text-[11px] mb-4">Pintasan ke modul pengelolaan yang sering dipakai.</p>

            <div className="space-y-2">
              <Link
                href="/admin/templates"
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-[11px] flex items-center justify-between transition-all shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-[#F7CB45]" />
                  <span>Tambah / Edit Model Kemasan</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/admin/pricing"
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#EEF4F8] hover:bg-[#E2EDF5] text-[#1F3A5C] font-bold text-[11px] flex items-center justify-between transition-all border border-[#D5E4F0]"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-[#2F79A6]" />
                  <span>Atur Parameter Tarif & Slicer</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/"
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#EEF4F8] hover:bg-[#E2EDF5] text-[#1F3A5C] font-bold text-[11px] flex items-center justify-between transition-all border border-[#D5E4F0]"
              >
                <div className="flex items-center gap-2">
                  <Store className="w-3.5 h-3.5 text-[#2F79A6]" />
                  <span>Lihat Tampilan Storefront Client</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] text-[10.5px] text-[#4B6B94] font-medium">
            Perubahan template dan harga yang disimpan di menu admin akan langsung tersimpan permanen.
          </div>
        </div>
      </div>
    </div>
  )
}
