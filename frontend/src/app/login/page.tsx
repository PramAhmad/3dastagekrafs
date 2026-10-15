"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { loginUser, getCurrentUser, DEMO_USER, setCurrentUser } from "@/lib/auth"
import { getUmkmByEmail } from "@/lib/umkm"
import { Box, Lock, Mail, ArrowRight, User, Sparkles, CheckCircle2, ArrowLeft, Clock, ShieldCheck } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect") || "/editor"

  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // If already logged in, redirect right away
    const user = getCurrentUser()
    if (user) {
      router.push(redirectUrl)
    }
  }, [redirectUrl, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Mohon isi alamat email dan kata sandi.")
      return
    }
    if (isRegister && !name) {
      setError("Mohon isi nama lengkap / nama usaha Anda.")
      return
    }

    setLoading(true)
    setError("")

    // Check if account is a registered UMKM pending validation
    const existingUmkm = getUmkmByEmail(email)
    if (existingUmkm) {
      if (existingUmkm.status === "PENDING") {
        setLoading(false)
        setError(`Pendaftaran UMKM Anda ('${existingUmkm.businessName}') masih dalam antrian validasi Admin (1x24 jam). Kami akan mengabari Anda via WhatsApp (${existingUmkm.phone}) setelah disetujui.`)
        return
      }
      if (existingUmkm.status === "REJECTED") {
        setLoading(false)
        setError(`Pendaftaran UMKM Anda belum disetujui oleh admin: ${existingUmkm.adminNotes || "Data belum memenuhi syarat produksi."}`)
        return
      }
    }

    setTimeout(() => {
      const user = loginUser(email, name || existingUmkm?.ownerName || email.split("@")[0])
      if (existingUmkm) {
        user.brandName = existingUmkm.businessName
        user.phone = existingUmkm.phone
        user.address = existingUmkm.city
      }
      router.push(redirectUrl)
    }, 400)
  }

  const handleDemoLogin = () => {
    setLoading(true)
    setTimeout(() => {
      setCurrentUser(DEMO_USER)
      router.push(redirectUrl)
    }, 300)
  }

  return (
    <div className="min-h-screen w-full bg-[#4394C3] flex flex-col justify-between font-sans text-[#1F3A5C] select-none">
      {/* Top Simple Bar */}
      <header className="h-16 px-6 sm:px-10 flex items-center justify-between border-b border-white/20 bg-white/95 backdrop-blur-md">
        <a href="/" className="flex items-center gap-2.5 group">
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
            <span className="text-[9.5px] text-[#2F79A6] block font-mono">STUDIO & DIELINE</span>
          </div>
        </a>

        <a
          href="/"
          className="flex items-center gap-1.5 text-xs text-[#1F3A5C] hover:text-[#2F79A6] font-bold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#2F79A6]" />
          <span>Kembali ke Beranda</span>
        </a>
      </header>

      {/* Center Auth Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl border border-white/80 shadow-2xl p-8 space-y-6">
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF4F8] border border-[#4394C3]/30 text-[#1F3A5C] flex items-center justify-center mx-auto shadow-sm">
              <Box className="w-6 h-6 text-[#1F3A5C]" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#1F3A5C]">
              {isRegister ? "Buat Akun Studio Baru" : "Masuk ke 3D Studio"}
            </h1>
            <p className="text-[#1F3A5C]/70 text-xs max-w-sm mx-auto">
              {isRegister
                ? "Daftar untuk menyimpan riwayat proyek, kustomisasi ukuran kemasan, dan ekspor pola pisau pond (dieline)."
                : "Akses 3D Editor parametrik, riwayat desain kemasan produk UMKM, dan simulasi material nyata."}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isRegister && (
              <div className="space-y-1">
                <label className="font-bold text-[#1F3A5C] block">Nama Lengkap / Brand</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4394C3]" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso (Kopi Nusantara)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-[#EEF4F8]/40"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-bold text-[#1F3A5C] block">Alamat Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4394C3]" />
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-[#EEF4F8]/40"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#1F3A5C] block">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4394C3]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#4394C3]/30 focus:border-[#2F79A6] focus:outline-none transition-all text-[#1F3A5C] text-xs bg-[#EEF4F8]/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <span>{loading ? "Memproses..." : isRegister ? "Daftar & Masuk Studio" : "Masuk ke Studio"}</span>
              <ArrowRight className="w-4 h-4 text-[#F7CB45]" />
            </button>
          </form>

          {/* Quick Demo Login Shortcut */}
          <div className="pt-2 border-t border-[#4394C3]/20 space-y-3">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 rounded-xl bg-[#EEF4F8] hover:bg-[#4394C3]/20 text-[#1F3A5C] font-bold text-xs border border-[#4394C3]/30 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4 text-[#2F79A6]" />
              <span>Masuk Cepat Demo UMKM (Budi Santoso)</span>
            </button>

            <div className="pt-2 border-t border-[#4394C3]/20 flex items-center justify-center gap-1.5 text-xs">
              <span className="text-[#1F3A5C]/70">Punya usaha produk?</span>
              <a
                href="/daftar-umkm"
                className="text-[#1F3A5C] font-black hover:text-[#2F79A6] hover:underline inline-flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#F7CB45]" />
                <span>Daftar Mitra UMKM</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-white/80 text-xs border-t border-white/20">
        © 2026 AstaKraft. Kolaborasi astacode.id (IT Consultant Tasikmalaya) &amp; GEKRAFS. Hak Cipta Dilindungi.
      </footer>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-xs text-neutral-500">Memuat...</div>}>
      <LoginForm />
    </Suspense>
  )
}
