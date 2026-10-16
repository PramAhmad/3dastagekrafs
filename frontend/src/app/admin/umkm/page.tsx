"use client"

import React, { useState, useEffect } from "react"
import {
  getAllUmkm,
  updateUmkmStatus,
  fetchUmkmList,
  extendUmkmTrial,
  getRemainingTrialDays,
  isUmkmTrialActive,
  TRIAL_DURATION_DAYS,
} from "@/lib/umkm"
import { UmkmRegistration, UmkmStatus } from "@/types/umkm"
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Search,
  Filter,
  MessageSquare,
  AlertCircle,
  X,
  Check,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react"

export default function AdminUmkmPage() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [umkmList, setUmkmList] = useState<UmkmRegistration[]>([])
  const [activeFilter, setActiveFilter] = useState<"ALL" | UmkmStatus>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedUmkm, setSelectedUmkm] = useState<UmkmRegistration | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  // Extension Toast Notice
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  useEffect(() => {
    const auth = localStorage.getItem("kemasan3d_admin_auth")
    if (auth === "true") {
      setIsAdminLoggedIn(true)
    }
    setUmkmList(getAllUmkm())
    fetchUmkmList().then((list) => setUmkmList(list))
  }, [])

  const showNotification = (msg: string) => {
    setActionNotice(msg)
    setTimeout(() => setActionNotice(null), 3500)
  }

  const handleApprove = (id: string) => {
    const updated = updateUmkmStatus(id, "APPROVED")
    if (updated) {
      setUmkmList(getAllUmkm())
      showNotification(`UMKM '${updated.businessName}' berhasil disetujui dengan masa trial 14 hari.`)
    }
  }

  const handleExtendTrial = (id: string, days: number = 14) => {
    const updated = extendUmkmTrial(id, days)
    if (updated) {
      setUmkmList(getAllUmkm())
      showNotification(`Masa trial prototype untuk '${updated.businessName}' berhasil diperpanjang +${days} hari.`)
    }
  }

  const handleSetInactive = (id: string) => {
    const updated = updateUmkmStatus(id, "INACTIVE", "Dinonaktifkan oleh Administrator.")
    if (updated) {
      setUmkmList(getAllUmkm())
      showNotification(`Status UMKM '${updated.businessName}' diubah menjadi Inactive.`)
    }
  }

  const handleOpenRejectModal = (umkm: UmkmRegistration) => {
    setSelectedUmkm(umkm)
    setRejectReason("")
    setRejectModalOpen(true)
  }

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUmkm) return
    updateUmkmStatus(selectedUmkm.id, "REJECTED", rejectReason || "Data usaha belum memenuhi kriteria validasi kemasan.")
    setUmkmList(getAllUmkm())
    setRejectModalOpen(false)
    setSelectedUmkm(null)
    showNotification("Pendaftaran UMKM ditolak.")
  }

  const pendingCount = umkmList.filter((u) => u.status === "PENDING").length
  const approvedCount = umkmList.filter((u) => u.status === "APPROVED").length
  const inactiveCount = umkmList.filter((u) => u.status === "INACTIVE").length
  const rejectedCount = umkmList.filter((u) => u.status === "REJECTED").length

  const filteredUmkm = umkmList.filter((u) => {
    const matchStatus = activeFilter === "ALL" || u.status === activeFilter
    const matchSearch =
      u.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery) ||
      u.city.toLowerCase().includes(searchQuery.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 bg-[#1F3A5C] text-white px-4 py-3 rounded-2xl shadow-2xl border border-[#4394C3] flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#F7CB45]" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header Title & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#1F3A5C] tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#2F79A6]" />
            <span>Validasi &amp; Manajemen Mitra UMKM</span>
          </h1>
          <p className="text-[#718BAA] text-xs mt-0.5">
            Kelola pendaftaran mitra UMKM, masa coba (trial) prototype 2 minggu, serta status aktif/inaktif akun.
          </p>
        </div>
      </div>

      {/* Metric Cards - 5 Columns */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-[#D5E4F0] rounded-2xl p-4 space-y-1 shadow-xs">
          <span className="text-xs text-[#718BAA] font-semibold">Total Pendaftar</span>
          <div className="text-xl font-black text-[#1F3A5C]">{umkmList.length}</div>
        </div>

        <div className="bg-white border border-amber-200 rounded-2xl p-4 space-y-1 shadow-xs">
          <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Validasi</span>
          </span>
          <div className="text-xl font-black text-amber-600">{pendingCount}</div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-4 space-y-1 shadow-xs">
          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Trial Aktif (14 Hari)</span>
          </span>
          <div className="text-xl font-black text-emerald-600">{approvedCount}</div>
        </div>

        <div className="bg-white border border-rose-200 rounded-2xl p-4 space-y-1 shadow-xs">
          <span className="text-xs text-rose-700 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Trial Berakhir (Inactive)</span>
          </span>
          <div className="text-xl font-black text-rose-600">{inactiveCount}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-1 shadow-xs">
          <span className="text-xs text-gray-600 font-semibold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Ditolak</span>
          </span>
          <div className="text-xl font-black text-gray-700">{rejectedCount}</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-[#D5E4F0] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {(
            [
              { id: "ALL", label: `Semua (${umkmList.length})` },
              { id: "PENDING", label: `Menunggu (${pendingCount})` },
              { id: "APPROVED", label: `Trial Aktif (${approvedCount})` },
              { id: "INACTIVE", label: `Trial Berakhir / Inactive (${inactiveCount})` },
              { id: "REJECTED", label: `Ditolak (${rejectedCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? "bg-[#1F3A5C] text-white shadow-xs"
                  : "text-[#4B6B94] hover:text-[#1F3A5C] hover:bg-[#EEF4F8]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#718BAA]" />
          <input
            type="text"
            placeholder="Cari nama brand, pemilik, kota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#EEF4F8] text-xs text-[#1F3A5C] pl-9 pr-3 py-2 rounded-xl border border-[#D5E4F0] focus:border-[#4394C3] focus:bg-white focus:outline-none transition-all placeholder-[#718BAA]"
          />
        </div>
      </div>

      {/* UMKM List Cards */}
      {filteredUmkm.length === 0 ? (
        <div className="py-16 text-center text-[#718BAA] bg-white border border-[#D5E4F0] rounded-2xl space-y-2 shadow-xs">
          <Building className="w-8 h-8 mx-auto opacity-30 text-[#2F79A6]" />
          <p className="font-bold text-[#1F3A5C] text-xs">Tidak ada data pendaftaran UMKM</p>
          <p className="text-[11px]">Coba ubah filter status atau kata kunci pencarian Anda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUmkm.map((umkm) => {
            const formattedPhone = umkm.phone.startsWith("0")
              ? "62" + umkm.phone.slice(1)
              : umkm.phone.replace("+", "")

            const remainingDays = getRemainingTrialDays(umkm)
            const isTrialActive = isUmkmTrialActive(umkm)

            return (
              <div
                key={umkm.id}
                className="bg-white border border-[#D5E4F0] hover:border-[#4394C3] rounded-2xl p-5 transition-all space-y-4 shadow-xs"
              >
                {/* Top Row: Business Name & Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D5E4F0]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF4F8] border border-[#D5E4F0] flex items-center justify-center text-[#2F79A6] font-bold">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-[#1F3A5C] text-sm">{umkm.businessName}</h3>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#EEF4F8] text-[#1F3A5C] border border-[#D5E4F0] font-bold">
                          {umkm.businessCategory}
                        </span>
                      </div>
                      <span className="text-[#718BAA] text-[11px]">
                        Pemilik: <strong className="text-[#1F3A5C]">{umkm.ownerName}</strong> • Terdaftar: {new Date(umkm.registeredAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Status & Trial Tags */}
                  <div className="flex flex-wrap items-center gap-2">
                    {umkm.status === "PENDING" && (
                      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Menunggu Validasi</span>
                      </span>
                    )}

                    {umkm.status === "APPROVED" && (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Trial Aktif: Sisa {remainingDays} Hari</span>
                      </span>
                    )}

                    {umkm.status === "INACTIVE" && (
                      <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-300 text-[11px] font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Trial Berakhir (Inactive)</span>
                      </span>
                    )}

                    {umkm.status === "REJECTED" && (
                      <span className="px-3 py-1 rounded-full bg-red-50 text-red-800 border border-red-300 text-[11px] font-bold flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>Ditolak</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Row: Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[#718BAA] text-[10.5px]">Kontak WhatsApp & Email:</span>
                    <div className="text-[#1F3A5C] flex items-center gap-1.5 font-bold">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{umkm.phone}</span>
                    </div>
                    <div className="text-[#4B6B94] text-[11px] truncate">{umkm.email}</div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[#718BAA] text-[10.5px]">Masa Trial Prototype:</span>
                    {umkm.trialEndsAt ? (
                      <div>
                        <div className="text-[#1F3A5C] flex items-center gap-1.5 font-bold">
                          <Calendar className="w-3.5 h-3.5 text-[#2F79A6]" />
                          <span>
                            {new Date(umkm.trialEndsAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#718BAA]">
                          {isTrialActive ? `Aktif (${remainingDays} hari lagi)` : "Telah kadaluarsa (Inactive)"}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[#718BAA] text-[11px]">Trial 14 hari dimulai saat disetujui</div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[#718BAA] text-[10.5px]">Volume Kemasan & NIB:</span>
                    <div className="text-[#1F3A5C] font-extrabold">{umkm.monthlyProductionEst}</div>
                    {umkm.nibOrDoc && (
                      <div className="text-[#2F79A6] font-mono font-bold text-[10px]">NIB: {umkm.nibOrDoc}</div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[#718BAA] text-[10.5px]">Workshop & Deskripsi:</span>
                    <div className="text-[#1F3A5C] flex items-center gap-1 font-bold truncate">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{umkm.city}</span>
                    </div>
                    <p className="text-[#4B6B94] text-[11px] line-clamp-2">
                      {umkm.productDescription || "Tidak ada deskripsi."}
                    </p>
                  </div>
                </div>

                {/* Admin Notes if any */}
                {umkm.adminNotes && (
                  <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                    umkm.status === "INACTIVE"
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : umkm.status === "REJECTED"
                      ? "bg-red-50 border-red-200 text-red-800"
                      : "bg-[#EEF4F8] border-[#D5E4F0] text-[#1F3A5C]"
                  }`}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Catatan: {umkm.adminNotes}</span>
                  </div>
                )}

                {/* Bottom Actions Row */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  {/* Direct WhatsApp Contact Button */}
                  <a
                    href={`https://wa.me/${formattedPhone}?text=Halo%20${encodeURIComponent(umkm.ownerName)}%20(${encodeURIComponent(umkm.businessName)}),%20kami%20dari%20Admin%20AstaKraft%20Studio.%20Status%20akun%20trial%20prototype%20Anda:%20${encodeURIComponent(umkm.status === "APPROVED" ? `Aktif (Sisa ${remainingDays} hari)` : umkm.status === "INACTIVE" ? "Masa Trial Berakhir (Inactive)" : umkm.status)}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Chat WhatsApp Mitra</span>
                  </a>

                  {/* Approval / Extension / Status Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Extend Trial Button (for both Approved & Inactive) */}
                    {(umkm.status === "APPROVED" || umkm.status === "INACTIVE") && (
                      <button
                        onClick={() => handleExtendTrial(umkm.id, 14)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#EEF4F8] hover:bg-[#D5E4F0] text-[#1F3A5C] border border-[#D5E4F0] hover:border-[#4394C3] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-98"
                        title="Tambah masa coba prototype 14 hari"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#2F79A6]" />
                        <span>Perpanjang Trial (+14 Hari)</span>
                      </button>
                    )}

                    {/* Approve button if pending */}
                    {umkm.status === "PENDING" && (
                      <button
                        onClick={() => handleApprove(umkm.id)}
                        className="px-4 py-1.5 rounded-xl bg-[#1F3A5C] hover:bg-[#2F79A6] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-[#F7CB45]" />
                        <span>Setujui (Trial 14 Hari)</span>
                      </button>
                    )}

                    {/* Set to Inactive manually if approved */}
                    {umkm.status === "APPROVED" && (
                      <button
                        onClick={() => handleSetInactive(umkm.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#EEF4F8] hover:bg-rose-50 text-[#718BAA] hover:text-rose-600 border border-[#D5E4F0] hover:border-rose-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Nonaktifkan akun UMKM ini"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Set Inactive</span>
                      </button>
                    )}

                    {/* Reject button if not rejected */}
                    {umkm.status !== "REJECTED" && (
                      <button
                        onClick={() => handleOpenRejectModal(umkm)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#EEF4F8] hover:bg-red-50 text-[#718BAA] hover:text-red-600 border border-[#D5E4F0] hover:border-red-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Tolak</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* REJECT CONFIRMATION MODAL */}
      {rejectModalOpen && selectedUmkm && (
        <div className="fixed inset-0 bg-[#1F3A5C]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#D5E4F0] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D5E4F0]">
              <h3 className="font-extrabold text-[#1F3A5C] text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>Tolak Pendaftaran UMKM</span>
              </h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="p-1 rounded-lg text-[#718BAA] hover:text-[#1F3A5C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[#4B6B94] text-xs">
              Apakah Anda yakin ingin menolak pendaftaran untuk <strong className="text-[#1F3A5C]">{selectedUmkm.businessName}</strong> ({selectedUmkm.ownerName})?
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#1F3A5C] block font-bold">Alasan Penolakan (akan dikirimkan ke mitra):</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Dokumen perizinan/kategori produk belum memenuhi standar produksi batch minimal."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-[#EEF4F8] border border-[#D5E4F0] text-[#1F3A5C] rounded-xl p-3 focus:border-red-500 focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#EEF4F8] hover:bg-[#D5E4F0] text-[#1F3A5C] font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Konfirmasi Tolak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
