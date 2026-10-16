"use client"

import React, { useState } from "react"
import { Settings, Check, CheckCircle2 } from "lucide-react"

export default function AdminSettingsPage() {
  const [brandName, setBrandName] = useState("Kemasan Nusantara 3D")
  const [subdomain, setSubdomain] = useState("kemasan-nusantara")
  const [whatsappNumber, setWhatsappNumber] = useState("+62 812-3456-7890")
  const [email, setEmail] = useState("owner@kemasan-nusantara.com")
  const [notification, setNotification] = useState<string | null>(null)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setNotification("Pengaturan toko & tenant berhasil disimpan!")
    setTimeout(() => setNotification(null), 3000)
  }

  return (
    <div className="max-w-2xl space-y-4">
      {notification && (
        <div role="status" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-[11px] font-bold text-emerald-800 shadow-xl animate-slide-up">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      <div className="p-6 rounded-xl bg-white border border-[#D5E4F0] shadow-xs space-y-4">
        <div className="border-b border-[#D5E4F0] pb-3">
          <h2 className="text-sm font-bold text-[#1F3A5C] flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#4394C3]" />
            Pengaturan Profil Toko & Tenant
          </h2>
          <p className="text-[11px] text-[#718BAA]">
            Pengaturan identitas brand, domain tenant, dan kontak WhatsApp untuk menerima pesanan.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 text-[11px]">
          <div>
            <label className="block font-semibold text-[#1F3A5C] mb-1">Nama Brand / Toko</label>
            <input
              type="text"
              required
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full bg-[#F6FAFC] border border-[#D5E4F0] rounded-lg p-2 text-[#1F3A5C] focus:outline-none focus:border-[#4394C3]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#1F3A5C] mb-1">Subdomain Kustom</label>
            <div className="flex items-center">
              <input
                type="text"
                required
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                className="w-full bg-[#F6FAFC] border border-[#D5E4F0] rounded-l-lg p-2 text-[#1F3A5C] font-mono focus:outline-none focus:border-[#4394C3]"
              />
              <span className="bg-[#EEF4F8] border border-l-0 border-[#D5E4F0] p-2 text-[#718BAA] rounded-r-lg font-mono">
                .kemasan3d.id
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#1F3A5C] mb-1">Nomor WhatsApp Admin (Notifikasi Order)</label>
            <input
              type="text"
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full bg-[#F6FAFC] border border-[#D5E4F0] rounded-lg p-2 text-[#1F3A5C] font-mono focus:outline-none focus:border-[#4394C3]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#1F3A5C] mb-1">Email Notifikasi</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F6FAFC] border border-[#D5E4F0] rounded-lg p-2 text-[#1F3A5C] focus:outline-none focus:border-[#4394C3]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#1F3A5C] hover:bg-[#162a43] text-white font-bold text-[11px] shadow-xs transition-all flex items-center justify-center gap-1.5 mt-4"
          >
            <Check className="w-3.5 h-3.5 text-[#F7CB45]" />
            Simpan Pengaturan
          </button>
        </form>
      </div>
    </div>
  )
}
