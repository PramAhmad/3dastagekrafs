"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Store, ExternalLink } from "lucide-react"

export default function AdminHeader() {
  const pathname = usePathname()

  const getPageTitle = () => {
    if (pathname.includes("/admin/categories")) return "Master Kategori Kemasan"
    if (pathname.includes("/admin/umkm")) return "Validasi & Mitra UMKM"
    if (pathname.includes("/admin/templates")) return "Kelola Model Kemasan"
    if (pathname.includes("/admin/pricing")) return "Kalkulator Harga & Mesin"
    if (pathname.includes("/admin/orders")) return "Antrian Produksi 3D"
    if (pathname.includes("/admin/settings")) return "Pengaturan Toko"
    return "Ringkasan & Metrik"
  }

  return (
    <header className="h-14 shrink-0 bg-white/90 backdrop-blur-md border-b border-[#D5E4F0] px-6 flex items-center justify-between sticky top-0 z-20 select-none shadow-xs">
      <div className="flex items-center gap-2 text-[11.5px] text-[#4B6B94]">
        <Link href="/admin/dashboard" className="hover:text-[#1F3A5C] transition-colors">
          Admin
        </Link>
        <span>/</span>
        <span className="text-[#1F3A5C] font-extrabold">{getPageTitle()}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF4F8] border border-[#D5E4F0] text-[10px] text-[#2F79A6] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span>Backend API :8080 Active</span>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#EEF4F8] text-[#1F3A5C] text-[11px] font-bold border border-[#D5E4F0] transition-all shadow-xs"
          title="Buka Halaman Client 3D Studio"
        >
          <Store className="w-3.5 h-3.5 text-[#2F79A6]" />
          <span>Buka Storefront</span>
          <ExternalLink className="w-3 h-3 text-[#718BAA]" />
        </Link>
      </div>
    </header>
  )
}
