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
  ExternalLink,
  ShieldCheck,
  Layers,
  Sparkles,
} from "lucide-react"

import { getAllUmkm } from "@/lib/umkm"

interface AdminSidebarProps {
  templateCount?: number
  orderCount?: number
  pendingUmkmCount?: number
}

export default function AdminSidebar({ templateCount = 8, orderCount = 3, pendingUmkmCount }: AdminSidebarProps) {
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
      badge: "PACDORA",
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
    <aside className="w-64 shrink-0 bg-white border-r border-[#D5E4F0] flex flex-col justify-between p-4 z-30 select-none shadow-xs">
      <div className="space-y-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 px-2 group">
          <div className="w-8 h-8 rounded-xl bg-white border border-[#D5E4F0] overflow-hidden p-0.5 shadow-xs group-hover:scale-105 transition-all shrink-0">
            <img
              src="/logo/astakraft-primary.jpg"
              alt="Logo AstaKraft Admin"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-extrabold text-[#1F3A5C] tracking-tight text-[13px] block leading-tight">
              AstaKraft Admin
            </span>
            <span className="text-[9px] text-[#718BAA] block font-mono font-bold">PORTAL SAAS UMKM</span>
          </div>
        </Link>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const IconComp = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full px-3 py-2 rounded-xl text-[11.5px] flex items-center justify-between transition-all ${
                  item.active
                    ? "bg-[#1F3A5C] text-[#F7CB45] font-bold shadow-xs border border-[#1F3A5C]"
                    : "text-[#4B6B94] hover:text-[#1F3A5C] hover:bg-[#EEF4F8]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconComp className={`w-4 h-4 ${item.active ? "text-[#F7CB45]" : "text-[#2F79A6]"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono font-bold ${
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

      {/* Sidebar Footer */}
      <div className="pt-4 border-t border-[#D5E4F0] space-y-2">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="w-7 h-7 rounded-full bg-[#1F3A5C] flex items-center justify-center text-[#F7CB45] font-bold text-[10px]">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="truncate flex-1">
            <span className="text-[11px] font-extrabold text-[#1F3A5C] block truncate">Super Admin</span>
            <span className="text-[9.5px] text-[#718BAA] block truncate">admin@kemasan3d.id</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 rounded-xl bg-[#EEF4F8] hover:bg-red-50 text-[#718BAA] hover:text-red-600 font-bold text-[11px] flex items-center justify-center gap-2 transition-all border border-[#D5E4F0]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar (Logout)</span>
        </button>
      </div>
    </aside>
  )
}
