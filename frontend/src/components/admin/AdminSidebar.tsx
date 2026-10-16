"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Box,
  Tags,
  DollarSign,
  Printer,
  Settings,
  LogOut,
  User,
  ShieldCheck,
  Layers,
  Sparkles,
} from "lucide-react"

import { getAllUmkm } from "@/lib/umkm"

interface AdminSidebarProps {
  mode?: "persistent" | "drawer"
  onNavigate?: () => void
  templateCount?: number
  orderCount?: number
  pendingUmkmCount?: number
}

export default function AdminSidebar({
  mode = "persistent",
  onNavigate,
  templateCount = 8,
  orderCount = 3,
  pendingUmkmCount,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const [livePendingUmkm, setLivePendingUmkm] = React.useState<number>(pendingUmkmCount ?? 0)

  React.useEffect(() => {
    if (pendingUmkmCount !== undefined) {
      setLivePendingUmkm(pendingUmkmCount)
      return
    }
    const umkms = getAllUmkm()
    const pending = umkms.filter((u) => u.status === "PENDING").length
    setLivePendingUmkm(pending)
  }, [pendingUmkmCount])

  const handleLogout = () => {
    localStorage.removeItem("kemasan3d_admin_auth")
    window.location.reload()
  }

  const menuItems = [
    {
      label: "Ringkasan & Metrik",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/admin" || pathname === "/admin/dashboard",
    },
    {
      label: "Validasi UMKM",
      href: "/admin/umkm",
      icon: ShieldCheck,
      badge: livePendingUmkm,
      badgeColor: "bg-amber-500/20 text-amber-300",
      active: pathname.startsWith("/admin/umkm"),
    },
    {
      label: "Master Kategori",
      href: "/admin/categories",
      icon: Tags,
      active: pathname.startsWith("/admin/categories"),
    },
    {
      label: "Kelola Model Kemasan",
      href: "/admin/templates",
      icon: Box,
      badge: templateCount,
      active: pathname.startsWith("/admin/templates") && !pathname.startsWith("/admin/studio"),
    },
    {
      label: "SVG to Model Template",
      href: "/admin/svg-to-model",
      icon: Sparkles,
      badge: "AUTO 3D",
      badgeColor: "bg-purple-500/20 text-purple-700",
      active: pathname.startsWith("/admin/svg-to-model"),
    },
    {
      label: "3D Packaging Studio",
      href: "/admin/studio",
      icon: Layers,
      badge: "3DPAKS",
      badgeColor: "bg-[#2f81f7]/20 text-[#2f81f7]",
      active: pathname.startsWith("/admin/studio"),
    },
    {
      label: "Kalkulator & Mesin",
      href: "/admin/pricing",
      icon: DollarSign,
      active: pathname.startsWith("/admin/pricing"),
    },
    {
      label: "Antrian Produksi",
      href: "/admin/orders",
      icon: Printer,
      badge: orderCount,
      badgeColor: "bg-amber-500/20 text-amber-300",
      active: pathname.startsWith("/admin/orders"),
    },
    {
      label: "Pengaturan Toko",
      href: "/admin/settings",
      icon: Settings,
      active: pathname.startsWith("/admin/settings"),
    },
  ]

  return (
    <aside
      id={mode === "drawer" ? "admin-global-navigation" : undefined}
      className={
        mode === "drawer"
          ? "flex min-h-full flex-col justify-between select-none"
          : "hidden w-56 shrink-0 flex-col justify-between border-r border-[#D5E4F0] bg-white p-3 shadow-xs select-none lg:flex"
      }
    >
      <div className="space-y-4">
        <Link href="/admin/dashboard" onClick={onNavigate} className="group flex items-center gap-2 px-1.5">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-xl border border-[#D5E4F0] bg-white p-0.5 shadow-xs transition-all group-hover:scale-105">
            <img src="/logo/astakraft-primary.jpg" alt="Logo AstaKraft Admin" className="h-full w-full object-contain" />
          </div>
          <div>
            <span className="block text-[13px] font-extrabold leading-tight tracking-tight text-[#1F3A5C]">AstaKraft Admin</span>
            <span className="block font-mono text-[9px] font-bold text-[#718BAA]">PORTAL SAAS UMKM</span>
          </div>
        </Link>

        <nav aria-label="Admin navigation" className="space-y-0.5">
          {menuItems.map((item) => {
            const IconComp = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[11.5px] transition-all ${
                  item.active
                    ? "border border-[#1F3A5C] bg-[#1F3A5C] font-bold text-[#F7CB45] shadow-xs"
                    : "text-[#4B6B94] hover:bg-[#EEF4F8] hover:text-[#1F3A5C]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <IconComp className={`h-4 w-4 ${item.active ? "text-[#F7CB45]" : "text-[#2F79A6]"}`} aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[9.5px] font-bold ${
                      item.badgeColor || (item.active ? "bg-white/20 text-white" : "bg-[#EEF4F8] text-[#1F3A5C]")
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="space-y-2 border-t border-[#D5E4F0] pt-3">
        <div className="flex items-center gap-2 px-1.5 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1F3A5C] text-[10px] font-bold text-[#F7CB45]">
            <User className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <div className="flex-1 truncate">
            <span className="block truncate text-[11px] font-extrabold text-[#1F3A5C]">Super Admin</span>
            <span className="block truncate text-[9.5px] text-[#718BAA]">admin@kemasan3d.id</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#D5E4F0] bg-[#EEF4F8] px-2.5 py-1.5 text-[11px] font-bold text-[#718BAA] transition-all hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Keluar (Logout)</span>
        </button>
      </div>
    </aside>
  )
}
