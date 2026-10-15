import { UmkmRegistration, UmkmStatus } from "@/types/umkm"

export type { UmkmRegistration, UmkmStatus }

const UMKM_STORAGE_KEY = "kemasan3d_umkm_registrations"

export const INITIAL_UMKM_REGISTRATIONS: UmkmRegistration[] = [
  {
    id: "umkm_001",
    ownerName: "Budi Santoso",
    email: "budi.umkm@gmail.com",
    phone: "081234567890",
    businessName: "Kopi Robusta Puntang",
    businessCategory: "Makanan & Minuman",
    city: "Bandung, Jawa Barat",
    fullAddress: "Jl. Raya Pangalengan No. 45, Bandung",
    productDescription: "Kopi sangrai arabika & robusta kemasan standing pouch zipper kedap udara.",
    monthlyProductionEst: "500 - 1.000 pouch/bulan",
    nibOrDoc: "NIB-91203920194",
    status: "APPROVED",
    registeredAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    reviewedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "umkm_002",
    ownerName: "Siti Rahmawati",
    email: "siti.rahma@skincarenature.id",
    phone: "085712349988",
    businessName: "GlowHerb Organics",
    businessCategory: "Kosmetik & Skincare",
    city: "Yogyakarta, DIY",
    fullAddress: "Jl. Kaliurang KM 7.5 No. 12, Sleman",
    productDescription: "Serum herbal & face cream wadah jar kosmetik kaca doff.",
    monthlyProductionEst: "1.000 - 3.000 jar/bulan",
    nibOrDoc: "NIB-10293847561",
    status: "PENDING",
    registeredAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "umkm_003",
    ownerName: "Hendro Wijaya",
    email: "hendro@snackkriuk.com",
    phone: "081399887766",
    businessName: "Keripik Singkong Renyah",
    businessCategory: "Makanan & Minuman",
    city: "Malang, Jawa Timur",
    fullAddress: "Jl. Soekarno Hatta No. 88, Malang",
    productDescription: "Camilan keripik singkong aneka rasa kemasan foil kraft.",
    monthlyProductionEst: "3.000 - 5.000 pcs/bulan",
    nibOrDoc: "NIB-5544332211",
    status: "PENDING",
    registeredAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "umkm_004",
    ownerName: "Ahmad Fauzi",
    email: "ahmad@parfums.co.id",
    phone: "082133445566",
    businessName: "Artisan Scents Batavia",
    businessCategory: "Fashion & Aksesoris",
    city: "Jakarta Selatan, DKI Jakarta",
    fullAddress: "Jl. Kemang Raya No. 10B, Jaksel",
    productDescription: "Parfum artisan botol pump kaca dengan outer box karton hardbox.",
    monthlyProductionEst: "200 - 500 box/bulan",
    status: "APPROVED",
    registeredAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    reviewedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
  },
]

export function getAllUmkm(): UmkmRegistration[] {
  if (typeof window === "undefined") return INITIAL_UMKM_REGISTRATIONS
  try {
    const raw = localStorage.getItem(UMKM_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(UMKM_STORAGE_KEY, JSON.stringify(INITIAL_UMKM_REGISTRATIONS))
      return INITIAL_UMKM_REGISTRATIONS
    }
    return JSON.parse(raw) as UmkmRegistration[]
  } catch (err) {
    return INITIAL_UMKM_REGISTRATIONS
  }
}

export async function fetchUmkmList(): Promise<UmkmRegistration[]> {
  try {
    const res = await fetch("/api/umkm")
    if (res.ok) {
      const json = await res.json()
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem(UMKM_STORAGE_KEY, JSON.stringify(json.data))
        }
        return json.data
      }
    }
  } catch (e) {}
  return getAllUmkm()
}

export function registerNewUmkm(
  data: Omit<UmkmRegistration, "id" | "status" | "registeredAt" | "reviewedAt">
): UmkmRegistration {
  const all = getAllUmkm()
  const newUmkm: UmkmRegistration = {
    ...data,
    id: "umkm_" + Math.random().toString(36).substring(2, 9),
    status: "PENDING",
    registeredAt: new Date().toISOString(),
  }

  all.unshift(newUmkm)
  if (typeof window !== "undefined") {
    localStorage.setItem(UMKM_STORAGE_KEY, JSON.stringify(all))
  }

  // Sync to server API in background
  if (typeof window !== "undefined") {
    fetch("/api/umkm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUmkm),
    }).catch(() => {})
  }

  return newUmkm
}

export function updateUmkmStatus(
  id: string,
  status: UmkmStatus,
  adminNotes?: string
): UmkmRegistration | null {
  const all = getAllUmkm()
  const idx = all.findIndex((u) => u.id === id)
  if (idx < 0) return null

  const updated: UmkmRegistration = {
    ...all[idx],
    status,
    adminNotes: adminNotes ?? all[idx].adminNotes,
    reviewedAt: new Date().toISOString(),
  }

  all[idx] = updated
  if (typeof window !== "undefined") {
    localStorage.setItem(UMKM_STORAGE_KEY, JSON.stringify(all))
  }

  // Sync to server API in background
  if (typeof window !== "undefined") {
    fetch("/api/umkm", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, adminNotes: updated.adminNotes }),
    }).catch(() => {})
  }

  return updated
}

export function getUmkmByEmail(email: string): UmkmRegistration | null {
  const all = getAllUmkm()
  return all.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
}
