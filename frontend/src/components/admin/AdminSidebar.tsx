"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Box,
  DollarSign,
  Layers,
  LayoutDashboard,
  LogOut,
  Printer,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  User,
} from "lucide-react"

import { getAllUmkm } from "@/lib/umkm"

interface AdminSidebarProps {
  mode?: "persistent" | "drawer" | "rail"
  onNavigate?: () => void
  templateCount?: number
  orderCount?: number
  pendingUmkmCount?: number
}

type BadgeTone = "count" | "feature"

interface MenuItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  active: boolean
  badge?: number | string
  badgeTone?: BadgeTone
}

interface MenuGroup {
  label: string
  items: MenuItem[]
}

function SidebarBadge({ value, tone = "count", active = false }: { value: number | string; tone?: BadgeTone; active?: boolean }) {
  const isCount = tone === "count"

  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center justify-center whitespace-nowrap font-mono font-bold tabular-nums ${
        isCount ? "min-w-5 rounded-full px-1.5 text-[10px]" : "rounded-md px-1.5 text-[8px] uppercase tracking-[0.08em]"
      } ${
        active
          ? "bg-[#1F3A5C] text-white"
          : isCount
            ? "border border-[#C7D9E6] bg-white text-[#1F3A5C]"
            : "border border-[#C7D9E6] bg-[#F4F8FB] text-[#52708D]"
      }`}
    >
      {value}
    </span>
  )
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
    setLivePendingUmkm(getAllUmkm().filter((umkm) => umkm.status === "PENDING").length)
  }, [pendingUmkmCount])

  const handleLogout = () => {
    localStorage.removeItem("kemasan3d_admin_auth")
    window.location.reload()
  }

  const menuGroups: MenuGroup[] = [
    {
      label: "Overview",
      items: [
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
          active: pathname.startsWith("/admin/umkm"),
        },
      ],
    },
    {
      label: "Katalog",
      items: [
        {
          label: "Master Kategori",
          href: "/admin/categories",
          icon: Tags,
          active: pathname.startsWith("/admin/categories"),
        },
        {
          label: "Model Kemasan",
          href: "/admin/templates",
          icon: Box,
          badge: templateCount,
          active: pathname.startsWith("/admin/templates") && !pathname.startsWith("/admin/studio"),
        },
        {
          label: "SVG to Model",
          href: "/admin/svg-to-model",
          icon: Sparkles,
          badge: "Auto",
          badgeTone: "feature",
          active: pathname.startsWith("/admin/svg-to-model"),
        },
        {
          label: "Packaging Studio",
          href: "/admin/studio",
          icon: Layers,
          badge: "Studio",
          badgeTone: "feature",
          active: pathname.startsWith("/admin/studio"),
        },
      ],
    },
    {
      label: "Operasional",
      items: [
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
          active: pathname.startsWith("/admin/orders"),
        },
        {
          label: "Pengaturan Toko",
          href: "/admin/settings",
          icon: Settings,
          active: pathname.startsWith("/admin/settings"),
        },
      ],
    },
  ]
  const menuItems = menuGroups.flatMap((group) => group.items)

  if (mode === "rail") {
    return (
      <aside className="hidden w-16 shrink-0 flex-col items-center justify-between border-r border-[#D5E4F0] bg-white py-3 shadow-[4px_0_24px_rgba(31,58,92,0.04)] select-none lg:flex" aria-label="Admin workspace rail">
        <div className="flex w-full flex-col items-center gap-4">
          <Link href="/admin/dashboard" onClick={onNavigate} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[#D5E4F0] bg-white p-1 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F79A6]" title="AstaKraft Admin" aria-label="AstaKraft Admin dashboard">
            <img src="/logo/astakraft-primary.jpg" alt="" className="h-full w-full rounded-lg object-contain" />
          </Link>
          <nav aria-label="Admin workspace navigation" className="flex w-full flex-col items-center gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const updateLabel = item.badge !== undefined ? `, ${item.badge} ${item.badgeTone === "feature" ? "feature" : "item"}` : ""
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-label={`${item.label}${updateLabel}`}
                  aria-current={item.active ? "page" : undefined}
                  title={item.label}
                  className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F79A6] ${
                    item.active ? "bg-[#1F3A5C] text-[#F7CB45] shadow-sm" : "text-[#52708D] hover:bg-[#EEF4F8] hover:text-[#1F3A5C]"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden={true} />
                  {item.badge !== undefined && (
                    typeof item.badge === "number" ? (
                      <span className={`absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[8px] font-bold tabular-nums ring-2 ring-white ${item.active ? "bg-[#F7CB45] text-[#1F3A5C]" : "bg-[#1F3A5C] text-white"}`} aria-hidden="true">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    ) : (
                      <span className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ring-2 ring-white ${item.active ? "bg-[#F7CB45]" : "bg-[#4394C3]"}`} aria-hidden="true" />
                    )
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex flex-col items-center gap-2 border-t border-[#E3ECF2] pt-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF4F8] text-[#1F3A5C]" title="Super Admin" aria-label="Super Admin">
            <User className="h-4 w-4" aria-hidden={true} />
          </div>
          <button type="button" onClick={handleLogout} className="flex h-11 w-11 items-center justify-center rounded-xl text-[#718BAA] transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500" title="Keluar" aria-label="Keluar dari akun admin">
            <LogOut className="h-4 w-4" aria-hidden={true} />
          </button>
        </div>
      </aside>
    )
  }

  const isDrawer = mode === "drawer"

  return (
    <aside
      id={isDrawer ? "admin-global-navigation" : undefined}
      className={isDrawer ? "flex min-h-full flex-col justify-between select-none" : "hidden w-60 shrink-0 flex-col justify-between border-r border-[#D5E4F0] bg-[#FBFCFD] px-3 py-4 shadow-[4px_0_24px_rgba(31,58,92,0.035)] select-none lg:flex"}
    >
      <div>
        <Link href="/admin/dashboard" onClick={onNavigate} className="group flex items-center gap-3 rounded-xl px-2 py-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F79A6]">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-[#D5E4F0] bg-white p-1 shadow-xs">
            <img src="/logo/astakraft-primary.jpg" alt="Logo AstaKraft" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <span className="block truncate text-[13px] font-extrabold leading-tight tracking-[-0.01em] text-[#1F3A5C]">AstaKraft Admin</span>
            <span className="mt-0.5 block truncate text-[9px] font-bold uppercase tracking-[0.14em] text-[#718BAA]">Workspace</span>
          </div>
        </Link>

        <nav aria-label="Admin navigation" className="mt-5 space-y-5">
          {menuGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#8298AC]">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={item.active ? "page" : undefined}
                      className={`group relative flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[11.5px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2F79A6] ${
                        item.active ? "bg-[#E8F1F6] text-[#1F3A5C]" : "text-[#52708D] hover:bg-white hover:text-[#1F3A5C]"
                      }`}
                    >
                      {item.active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-[#1F3A5C]" aria-hidden="true" />}
                      <Icon className={`h-4 w-4 shrink-0 ${item.active ? "text-[#1F3A5C]" : "text-[#718BAA] group-hover:text-[#2F79A6]"}`} aria-hidden={true} />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge !== undefined && <SidebarBadge value={item.badge} tone={item.badgeTone} active={item.active} />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-5 border-t border-[#D5E4F0] pt-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1F3A5C] text-[#F7CB45]">
            <User className="h-3.5 w-3.5" aria-hidden={true} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-bold text-[#1F3A5C]">Super Admin</span>
            <span className="block truncate text-[9.5px] text-[#718BAA]">admin@kemasan3d.id</span>
          </div>
        </div>
        <button type="button" onClick={handleLogout} className="mt-1 flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[11px] font-bold text-[#718BAA] transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-500">
          <LogOut className="h-4 w-4" aria-hidden={true} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  )
}
