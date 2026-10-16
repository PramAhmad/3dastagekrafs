"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  Box,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Layers3,
  Plus,
  Printer,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  TrendingUp,
} from "lucide-react"

import { formatRupiah } from "@/lib/utils"

const orders = [
  { id: "ORD-9482", customer: "Kopi Nusantara", item: "Standing Pouch Zipper", status: "PRINTING", total: 750000 },
  { id: "ORD-9481", customer: "Sabun Organik Bali", item: "Kotak Sabun Parametrik", status: "QUEUED", total: 1250000 },
  { id: "ORD-9479", customer: "Glow Skin Kosmetik", item: "Toples Krim Jar", status: "COMPLETED", total: 3600000 },
]

const statusStyles: Record<string, string> = {
  PRINTING: "border-amber-200 bg-amber-50 text-amber-800",
  QUEUED: "border-[#D5E4F0] bg-[#F7FAFC] text-[#52708D]",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
}

export default function AdminDashboardPage() {
  const [templateCount, setTemplateCount] = useState(8)

  useEffect(() => {
    const saved = localStorage.getItem("kemasan3d_custom_templates")
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) setTemplateCount(parsed.length)
    } catch {}
  }, [])

  const metrics = [
    { label: "Omzet bulan ini", value: formatRupiah(18450000), detail: "+24% dari bulan lalu", icon: CircleDollarSign, positive: true },
    { label: "Pesanan aktif", value: `${orders.length}`, suffix: "pesanan", detail: "1 sedang dicetak", icon: ShoppingBag },
    { label: "Kapasitas mesin", value: "4 / 6", suffix: "aktif", detail: "66% utilisasi", icon: Printer },
    { label: "Model kemasan", value: `${templateCount}`, suffix: "model", detail: "Siap digunakan", icon: Box },
  ]

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-[#D5E4F0] bg-[#1F3A5C] text-white shadow-[0_18px_48px_rgba(31,58,92,0.16)]">
        <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#BFD5E3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F7CB45]" />
              Operations overview
            </div>
            <h1 className="text-xl font-extrabold tracking-[-0.025em] sm:text-2xl">Produksi berjalan stabil.</h1>
            <p className="mt-2 max-w-xl text-[12px] leading-5 text-[#D5E4F0]">
              Pantau transaksi, kapasitas mesin, dan katalog kemasan dari satu workspace operasional.
            </p>
          </div>
          <Link href="/admin/templates" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#F7CB45] px-4 text-[11px] font-extrabold text-[#1F3A5C] transition-colors hover:bg-[#E5B932] focus-visible:outline-[#F7CB45]">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah model
          </Link>
        </div>
      </section>

      <section aria-label="Metrik bisnis" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <article key={metric.label} className="rounded-2xl border border-[#D5E4F0] bg-white p-4 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#718BAA]">{metric.label}</p>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <p className="font-mono text-xl font-extrabold tracking-[-0.03em] text-[#1F3A5C]">{metric.value}</p>
                    {metric.suffix && <span className="text-[10px] font-semibold text-[#718BAA]">{metric.suffix}</span>}
                  </div>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF4F8] text-[#2F79A6]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <p className={`mt-3 flex items-center gap-1 text-[10.5px] font-semibold ${metric.positive ? "text-emerald-700" : "text-[#52708D]"}`}>
                {metric.positive ? <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> : <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />}
                {metric.detail}
              </p>
            </article>
          )
        })}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.75fr)]">
        <section className="overflow-hidden rounded-2xl border border-[#D5E4F0] bg-white shadow-xs">
          <div className="flex items-center justify-between gap-4 border-b border-[#D5E4F0] px-5 py-4">
            <div>
              <h2 className="text-[13px] font-extrabold text-[#1F3A5C]">Pesanan terbaru</h2>
              <p className="mt-0.5 text-[10.5px] text-[#718BAA]">Prioritas produksi dan nilai transaksi terkini.</p>
            </div>
            <Link href="/admin/orders" className="flex items-center gap-1 text-[10.5px] font-bold text-[#2F79A6] hover:text-[#1F3A5C]">
              Lihat semua <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[38rem] text-left">
              <thead className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#718BAA]">
                <tr>
                  <th className="px-5 py-3">Pesanan</th>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3ECF2]">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-5 py-3.5">
                      <span className="block font-mono text-[10px] font-bold text-[#2F79A6]">{order.id}</span>
                      <span className="mt-0.5 block text-[11px] font-bold text-[#1F3A5C]">{order.customer}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-[#52708D]">{order.item}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex h-5 items-center rounded-md border px-2 font-mono text-[8.5px] font-bold ${statusStyles[order.status]}`}>{order.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-[11px] font-extrabold text-[#1F3A5C]">{formatRupiah(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-2xl border border-[#D5E4F0] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-[#2F79A6]" aria-hidden="true" />
            <h2 className="text-[13px] font-extrabold text-[#1F3A5C]">Akses cepat</h2>
          </div>
          <p className="mt-1 text-[10.5px] leading-4 text-[#718BAA]">Masuk langsung ke pekerjaan yang paling sering digunakan.</p>
          <div className="mt-4 space-y-1.5">
            {[
              { href: "/admin/templates", label: "Kelola model kemasan", icon: Box },
              { href: "/admin/pricing", label: "Atur tarif dan mesin", icon: SlidersHorizontal },
              { href: "/", label: "Tinjau storefront", icon: Store },
            ].map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.href} href={action.href} className="group flex min-h-11 items-center gap-3 rounded-xl border border-transparent px-2.5 text-[11px] font-bold text-[#1F3A5C] transition-colors hover:border-[#D5E4F0] hover:bg-[#F7FAFC]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF4F8] text-[#2F79A6]"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">{action.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#9AAEBD] transition-colors group-hover:text-[#2F79A6]" aria-hidden="true" />
                </Link>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}
