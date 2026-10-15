"use client"

import React, { useState, useEffect } from "react"
import { ShieldCheck, Lock, Mail, ChevronRight, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [authEmail, setAuthEmail] = useState("admin@kemasan3d.id")
  const [authPassword, setAuthPassword] = useState("admin123")
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState<boolean>(false)

  useEffect(() => {
    const savedAuth = localStorage.getItem("kemasan3d_admin_auth")
    setIsAuthenticated(savedAuth === "true")
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError(null)

    setTimeout(() => {
      if (
        (authEmail === "admin@kemasan3d.id" || authEmail === "admin") &&
        (authPassword === "admin123" || authPassword === "admin")
      ) {
        setIsAuthenticated(true)
        localStorage.setItem("kemasan3d_admin_auth", "true")
      } else {
        setAuthError("Email atau password tidak sesuai. Coba demo: admin@kemasan3d.id / admin123")
      }
      setAuthLoading(false)
    }, 400)
  }

  // Loading initial auth check
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen w-screen bg-[#EEF4F8] flex items-center justify-center text-[#718BAA] text-[12px]">
        <RefreshCw className="w-5 h-5 animate-spin text-[#4394C3]" />
      </div>
    )
  }

  // Not authenticated -> Render Login Page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-screen bg-[#EEF4F8] text-[#1F3A5C] flex flex-col items-center justify-center p-4 font-sans antialiased text-[12px]">
        <div className="w-full max-w-md bg-white border border-[#D5E4F0] rounded-2xl p-8 shadow-xl space-y-6 relative">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] flex items-center justify-center mx-auto shadow-xs">
              <ShieldCheck className="w-6 h-6 text-[#1F3A5C]" />
            </div>
            <h1 className="text-xl font-bold text-[#1F3A5C] tracking-tight">Portal Admin AstaKraft</h1>
            <p className="text-[#718BAA] text-[11px]">
              Masuk untuk mengelola model kemasan, kalkulator harga, dan pesanan cetak 3D.
            </p>
          </div>

          {/* Error Alert */}
          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#1F3A5C] block">Email / Username</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#718BAA]" />
                <input
                  type="text"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-[#F6FAFC] border border-[#D5E4F0] rounded-xl pl-9 pr-3 py-2 text-[#1F3A5C] text-[12px] focus:outline-none focus:border-[#4394C3] transition-all placeholder-[#718BAA]"
                  placeholder="admin@kemasan3d.id"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#1F3A5C] block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#718BAA]" />
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-[#F6FAFC] border border-[#D5E4F0] rounded-xl pl-9 pr-3 py-2 text-[#1F3A5C] text-[12px] focus:outline-none focus:border-[#4394C3] transition-all placeholder-[#718BAA]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 rounded-xl bg-[#1F3A5C] hover:bg-[#162a43] text-white font-bold text-[12px] shadow-xs transition-all flex items-center justify-center gap-2 mt-2"
            >
              {authLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#F7CB45]" />
              ) : (
                <>
                  <span>Masuk ke Admin Portal</span>
                  <ChevronRight className="w-4 h-4 text-[#F7CB45]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill & Back to Storefront */}
          <div className="pt-4 border-t border-[#D5E4F0] space-y-3">
            <button
              type="button"
              onClick={() => {
                setAuthEmail("admin@kemasan3d.id")
                setAuthPassword("admin123")
              }}
              className="w-full py-1.5 rounded-lg bg-[#EEF4F8] hover:bg-[#D5E4F0] text-[#4B6B94] text-[10.5px] font-medium border border-[#D5E4F0] transition-all"
            >
              Isi Akun Demo Admin (admin@kemasan3d.id / admin123)
            </button>

            <a
              href="/"
              className="flex items-center justify-center gap-1 text-[#718BAA] hover:text-[#1F3A5C] text-[11px] font-medium transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Storefront / 3D Studio</span>
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Authenticated -> Render Protected Admin Layout
  return <>{children}</>
}
