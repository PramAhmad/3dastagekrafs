"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Store, ExternalLink } from "lucide-react"

interface AdminHeaderProps {
  onMenuClick: () => void
  navOpen: boolean
  navId: string
  isWorkspace: boolean
}

export default function AdminHeader({ onMenuClick, navOpen, navId, isWorkspace }: AdminHeaderProps) {
  const pathname = usePathname()

  const getPageTitle = () => {
    if (pathname.includes("/admin/svg-to-model")) return "SVG to 3D Model Template Generator"
    if (pathname.includes("/admin/studio")) return "3D Packaging Studio"
    if (pathname.includes("/admin/categories")) return "Master Kategori Kemasan"
    if (pathname.includes("/admin/umkm")) return "Validasi & Mitra UMKM"
    if (pathname.includes("/admin/templates")) return "Kelola Model Kemasan"
    if (pathname.includes("/admin/pricing")) return "Kalkulator Harga & Mesin"
    if (pathname.includes("/admin/orders")) return "Antrian Produksi 3D"
    if (pathname.includes("/admin/settings")) return "Pengaturan Toko"
    return "Ringkasan & Metrik"
  }

  return (
    <header className="sticky top-0 z-20 flex h-12 shrink-0 select-none items-center justify-between border-b border-[#D5E4F0] bg-white/90 px-3 shadow-xs backdrop-blur-md sm:px-4">
      <div className="flex min-w-0 items-center gap-2 text-[11px] text-[#4B6B94]">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={navOpen ? "Close admin navigation" : "Open admin navigation"}
          aria-expanded={navOpen}
          aria-controls={navId}
          className={`${isWorkspace ? "flex" : "flex lg:hidden"} h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#1F3A5C] transition-colors hover:bg-[#EEF4F8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F79A6]`}
        >
          {navOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
        <Link href="/admin/dashboard" className="shrink-0 transition-colors hover:text-[#1F3A5C]">
          Admin
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate font-extrabold text-[#1F3A5C]">{getPageTitle()}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 rounded-full border border-[#D5E4F0] bg-[#EEF4F8] px-2 py-1 text-[10px] font-semibold text-[#2F79A6]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10B981]" />
          <span className="hidden sm:inline">Backend API :8080 Active</span>
          <span className="sm:hidden" aria-label="Backend API active">API</span>
        </div>

        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D5E4F0] bg-white text-[#1F3A5C] transition-all hover:bg-[#EEF4F8] shadow-xs sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[11px] sm:font-bold"
          title="Buka Halaman Client 3D Studio"
        >
          <Store className="h-3.5 w-3.5 text-[#2F79A6]" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Buka Storefront</span>
          <ExternalLink className="hidden h-3 w-3 text-[#718BAA] sm:block" aria-hidden="true" />
        </Link>
      </div>
    </header>
  )
}
