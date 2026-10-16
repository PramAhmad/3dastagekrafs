"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { registerNewUmkm } from "@/lib/umkm"
import {
  Box,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Package,
  Layers,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

const CATEGORIES_LIST = [
  "Makanan & Minuman (F&B / Kopi / Snack)",
  "Kosmetik, Skincare & Beauty",
  "Herbal, Jamu & Farmasi",
  "Fashion, Hijab & Aksesoris",
  "Elektronik & Gadget Accessories",
  "Kerajinan & Souvenir",
  "Lainnya",
]

const VOLUME_OPTIONS = [
  "Kurang dari 500 pcs/bulan",
  "500 - 2.000 pcs/bulan",
  "2.000 - 10.000 pcs/bulan",
  "Lebih dari 10.000 pcs/bulan",
]

export default function DaftarUmkmPage() {
  const router = useRouter()

  const [ownerName, setOwnerName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [businessCategory, setBusinessCategory] = useState(CATEGORIES_LIST[0])
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [fullAddress, setFullAddress] = useState("")
  const [productDescription, setProductDescription] = useState("")
  const [monthlyProductionEst, setMonthlyProductionEst] = useState(VOLUME_OPTIONS[1])
  const [nibOrDoc, setNibOrDoc] = useState("")
  const [password, setPassword] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [registeredId, setRegisteredId] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    setTimeout(() => {
      const created = registerNewUmkm({
        ownerName,
        businessName,
        businessCategory,
        email,
        phone,
        city,
        fullAddress,
        productDescription,
        monthlyProductionEst,
        nibOrDoc: nibOrDoc || undefined,
        password,
      })

      setRegisteredId(created.id)
      setSubmitting(false)
      setIsSuccess(true)
    }, 400)
  }

  return (
    <div className="min-h-screen w-full bg-[#4394C3] font-sans text-[#1F3A5C] select-none flex flex-col antialiased">
      {/* 1. TOP NAVBAR */}
      <header className="h-16 shrink-0 bg-white/95 backdrop-blur-md border-b border-white/20 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40">
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-white border border-[#4394C3]/30 overflow-hidden p-0.5 shadow-sm group-hover:border-[#1F3A5C] transition-all shrink-0">
            <img
              src="/logo/astakraft-primary.jpg"
              alt="Logo AstaKraft"
              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <span className="font-extrabold text-[#1F3A5C] tracking-tight text-sm block leading-tight">
              AstaKraft
            </span>
            <span className="text-[9.5px] text-[#2F79A6] block font-mono">MITRA UMKM • ASTACODE.ID × GEKRAFS</span>
          </div>
        </a>

        <div className="flex items-center gap-3 text-xs">
          <a
            href="/"
            className="flex items-center gap-1.5 text-[#1F3A5C] hover:text-[#2F79A6] font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#2F79A6]" />
            <span>Kembali ke Beranda</span>
          </a>
        </div>
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 sm:p-10 space-y-8">
        {isSuccess ? (
          /* SUCCESS SUBMISSION CARD */
          <div className="bg-white rounded-3xl border border-white/80 p-8 sm:p-12 shadow-2xl text-center space-y-6 max-w-xl mx-auto animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-[#F7CB45]/20 border border-[#F7CB45]/40 text-[#1F3A5C] flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-8 h-8 text-[#1F3A5C]" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-[#F7CB45] text-[#1F3A5C] font-bold text-[11px] font-mono uppercase tracking-wider">
                Status: Menunggu Validasi Admin
              </span>
              <h1 className="text-2xl font-black text-[#1F3A5C] tracking-tight">
                Pendaftaran UMKM Berhasil Dikirim!
              </h1>
              <p className="text-[#1F3A5C]/70 text-xs leading-relaxed max-w-md mx-auto">
                Terima kasih, <strong>{ownerName}</strong> ({businessName}). Data usaha Anda telah kami terima dan saat ini sedang dalam proses validasi oleh tim kurasi AstaKraft Studio (astacode.id &amp; GEKRAFS).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#EEF4F8] border border-[#4394C3]/30 text-left space-y-2 text-xs">
              <div className="flex justify-between text-[#1F3A5C]/80">
                <span>Nomor Registrasi:</span>
                <span className="font-mono font-bold text-[#1F3A5C]">{registeredId}</span>
              </div>
              <div className="flex justify-between text-[#1F3A5C]/80">
                <span>Estimasi Waktu Verifikasi:</span>
                <span className="font-bold text-[#1F3A5C]">1 × 24 Jam Kerja</span>
              </div>
              <div className="flex justify-between text-[#1F3A5C]/80">
                <span>Fasilitas Masa Coba:</span>
                <span className="font-bold text-emerald-700">Trial Prototype 2 Minggu (14 Hari)</span>
              </div>
              <div className="flex justify-between text-[#1F3A5C]/80">
                <span>Notifikasi Persetujuan:</span>
                <span className="font-bold text-[#2F79A6]">WhatsApp ({phone})</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/"
                className="px-6 py-3 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-xs shadow-sm transition-all"
              >
                Kembali ke Beranda
              </a>
              <a
                href="/login"
                className="px-6 py-3 rounded-xl bg-[#EEF4F8] hover:bg-[#4394C3]/20 text-[#1F3A5C] font-bold text-xs border border-[#4394C3]/30 transition-all"
              >
                Halaman Masuk (Login)
              </a>
            </div>
          </div>
        ) : (
          /* REGISTRATION FORM */
          <div className="bg-white rounded-3xl border border-white/80 p-6 sm:p-10 shadow-2xl space-y-8">
            <div className="space-y-2 pb-6 border-b border-[#4394C3]/20">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF4F8] border border-[#4394C3]/30 text-[10.5px] font-bold text-[#1F3A5C]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F7CB45]" />
                <span>Program Kemitraan Desain & Produksi Kemasan UMKM • Trial Prototype 2 Minggu</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1F3A5C] tracking-tight">
                Formulir Pendaftaran Mitra UMKM
              </h1>
              <p className="text-[#1F3A5C]/70 text-xs">
                Daftarkan usaha Anda untuk mendapatkan fasilitas masa coba gratis (trial) prototype kemasan selama 2 minggu (14 hari), akses Studio 3D parametrik, generator pola pisau pond (dieline 2D), serta harga cetak khusus batch skala UMKM.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* 1. Informasi Pemilik Usaha */}
              <div className="space-y-4">
                <span className="font-extrabold text-[#1F3A5C] text-xs uppercase tracking-wider block">
                  1. Informasi Pemilik & Kontak
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-[#1F3A5C] block">Nama Lengkap Pemilik *</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4394C3]" />
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Budi Santoso"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-[#EEF4F8]/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#1F3A5C] block">Nomor WhatsApp Aktif *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4394C3]" />
                      <input
                        type="text"
                        required
                        placeholder="081234567890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-[#EEF4F8]/40"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-[#1F3A5C] block">Alamat Email *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4394C3]" />
                      <input
                        type="email"
                        required
                        placeholder="nama@usaha.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-[#EEF4F8]/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#1F3A5C] block">Kata Sandi Akun *</label>
                    <input
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-[#EEF4F8]/40"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Informasi Usaha & Brand */}
              <div className="space-y-4 pt-4 border-t border-[#4394C3]/20">
                <span className="font-extrabold text-[#1F3A5C] text-xs uppercase tracking-wider block">
                  2. Profil Usaha & Produk
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-[#1F3A5C] block">Nama Usaha / Brand *</label>
                    <div className="relative">
                      <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4394C3]" />
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Kopi Robusta Puntang"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-[#EEF4F8]/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#1F3A5C] block">Kategori Produk *</label>
                    <select
                      value={businessCategory}
                      onChange={(e) => setBusinessCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-white"
                    >
                      {CATEGORIES_LIST.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-[#1F3A5C] block">Kota / Kabupaten *</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4394C3]" />
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Bandung, Jawa Barat"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-[#EEF4F8]/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#1F3A5C] block">Estimasi Kebutuhan Kemasan *</label>
                    <select
                      value={monthlyProductionEst}
                      onChange={(e) => setMonthlyProductionEst(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-white"
                    >
                      {VOLUME_OPTIONS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1F3A5C] block">Alamat Lengkap Workshop / Toko</label>
                  <input
                    type="text"
                    placeholder="Alamat pengiriman sample fisik mockup atau kantor"
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-[#EEF4F8]/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1F3A5C] block">Nomor NIB / Izin Usaha (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Nomor Induk Berusaha (NIB) jika ada"
                    value={nibOrDoc}
                    onChange={(e) => setNibOrDoc(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-[#EEF4F8]/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1F3A5C] block">Deskripsi Produk & Kebutuhan Kemasan</label>
                  <textarea
                    rows={3}
                    placeholder="Jelaskan secara singkat jenis kemasan yang Anda cari (misal: standing pouch zipper sablon emas, kardus gift box doff, dll.)"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs resize-none bg-[#EEF4F8]/40"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-[#4394C3]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-[10px] text-[#1F3A5C]/70">
                  Dengan mendaftar, Anda menyetujui verifikasi data profil usaha oleh tim AstaKraft Studio (astacode.id &amp; GEKRAFS).
                </span>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  <span>{submitting ? "Mengirim Pendaftaran..." : "Kirim Pendaftaran UMKM"}</span>
                  <ArrowRight className="w-4 h-4 text-[#F7CB45]" />
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
