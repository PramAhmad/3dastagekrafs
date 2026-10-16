"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLink, Menu, Server, Store, X } from "lucide-react"

interface AdminHeaderProps {
  onMenuClick: () => void
  navOpen: boolean
  navId: string
  isWorkspace: boolean
}

export default function AdminHeader({ onMenuClick, navOpen, navId, isWorkspace }: AdminHeaderProps) {
  const pathname = usePathname()

  const getPageMeta = () => {
    if (pathname.includes("/admin/svg-to-model")) return { title: "SVG to 3D Model", section: "Workspace" }
    if (pathname.includes("/admin/studio")) return { title: "3D Packaging Studio", section: "Workspace" }
    if (pathname.includes("/admin/categories")) return { title: "Kategori Kemasan", section: "Katalog" }
    if (pathname.includes("/admin/umkm")) return { title: "Validasi Mitra UMKM", section: "Overview" }
    if (pathname.includes("/admin/templates")) return { title: "Model Kemasan", section: "Katalog" }
    if (pathname.includes("/admin/pricing")) return { title: "Tarif & Mesin", section: "Operasional" }
    if (pathname.includes("/admin/orders")) return { title: "Antrian Produksi", section: "Operasional" }
    if (pathname.includes("/admin/settings")) return { title: "Pengaturan Toko", section: "Sistem" }
    return { title: "Ringkasan Bisnis", section: "Overview" }
  }

  const pageMeta = getPageMeta()

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 select-none items-center justify-between border-b border-[#D5E4F0] bg-white/95 px-3 shadow-[0_1px_0_rgba(31,58,92,0.03)] backdrop-blur-md sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={navOpen ? "Close admin navigation" : "Open admin navigation"}
          aria-expanded={navOpen}
          aria-controls={navId}
          className={`${isWorkspace ? "flex" : "flex lg:hidden"} h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent text-[#1F3A5C] transition-colors hover:border-[#D5E4F0] hover:bg-[#EEF4F8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F79A6]`}
        >
          {navOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
        <div className="min-w-0">
          <span className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#718BAA]">{pageMeta.section}</span>
          <span className="block truncate text-[13px] font-extrabold tracking-[-0.01em] text-[#1F3A5C]">{pageMeta.title}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden h-8 items-center gap-1.5 rounded-lg border border-[#D5E4F0] bg-[#F7FAFC] px-2.5 text-[9.5px] font-bold text-[#52708D] md:flex" role="status" aria-label="Backend API aktif pada port 8080">
          <Server className="h-3.5 w-3.5 text-[#2F79A6]" aria-hidden="true" />
          <span>API :8080</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        </div>

        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D5E4F0] bg-white text-[#1F3A5C] shadow-xs transition-colors hover:border-[#BFD5E3] hover:bg-[#EEF4F8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F79A6] sm:w-auto sm:gap-2 sm:px-3 sm:text-[11px] sm:font-bold"
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
