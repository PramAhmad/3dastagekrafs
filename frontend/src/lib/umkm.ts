import { UmkmRegistration, UmkmStatus, SubscriptionPlan } from "@/types/umkm"
import { SEED_UMKM_REGISTRATIONS, getSeedUmkmData } from "@/seeds/umkmSeed"

export type { UmkmRegistration, UmkmStatus, SubscriptionPlan }
export { SEED_UMKM_REGISTRATIONS, getSeedUmkmData }

// For backwards compatibility
export const INITIAL_UMKM_REGISTRATIONS = SEED_UMKM_REGISTRATIONS

const UMKM_STORAGE_KEY = "kemasan3d_umkm_registrations"
export const TRIAL_DURATION_DAYS = 14 // 2 Minggu Trial Prototype

/**
 * Menghitung sisa hari masa trial 2 minggu UMKM
 */
export function getRemainingTrialDays(umkm: UmkmRegistration): number {
  if (!umkm.trialEndsAt) return 0
  const diffMs = new Date(umkm.trialEndsAt).getTime() - Date.now()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Cek apakah UMKM sedang dalam masa trial aktif
 */
export function isUmkmTrialActive(umkm: UmkmRegistration): boolean {
  if (umkm.status !== "APPROVED") return false
  if (umkm.subscriptionPlan && umkm.subscriptionPlan !== "TRIAL") return true
  if (!umkm.trialEndsAt) return false
  return new Date(umkm.trialEndsAt).getTime() > Date.now()
}

/**
 * Periksa dan ubah status UMKM yang telah melewati masa trial 14 hari menjadi INACTIVE
 */
export function checkAndExpireTrials(umkms: UmkmRegistration[]): { updated: UmkmRegistration[]; hasChanges: boolean } {
  let hasChanges = false
  const now = Date.now()

  const updated = umkms.map((u) => {
    // Jika masih status APPROVED dan paket TRIAL tapi sudah melewati trialEndsAt (2 minggu)
    if (u.status === "APPROVED" && (!u.subscriptionPlan || u.subscriptionPlan === "TRIAL") && u.trialEndsAt) {
      if (new Date(u.trialEndsAt).getTime() <= now) {
        hasChanges = true
        return {
          ...u,
          status: "INACTIVE" as UmkmStatus,
          adminNotes: u.adminNotes || "Masa coba trial prototype 2 minggu telah berakhir (Inactive).",
        }
      }
    }
    return u
  })

  return { updated, hasChanges }
}

export function getAllUmkm(): UmkmRegistration[] {
  if (typeof window === "undefined") {
    return checkAndExpireTrials(getSeedUmkmData()).updated
  }
  try {
    const raw = localStorage.getItem(UMKM_STORAGE_KEY)
    let list: UmkmRegistration[]
    if (!raw) {
      list = getSeedUmkmData()
    } else {
      list = JSON.parse(raw) as UmkmRegistration[]
    }

    const { updated, hasChanges } = checkAndExpireTrials(list)
    if (hasChanges || !raw) {
      localStorage.setItem(UMKM_STORAGE_KEY, JSON.stringify(updated))
    }
    return updated
  } catch (err) {
    return checkAndExpireTrials(getSeedUmkmData()).updated
  }
}

export async function fetchUmkmList(): Promise<UmkmRegistration[]> {
  try {
    const res = await fetch("/api/umkm")
    if (res.ok) {
      const json = await res.json()
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        const { updated } = checkAndExpireTrials(json.data)
        if (typeof window !== "undefined") {
          localStorage.setItem(UMKM_STORAGE_KEY, JSON.stringify(updated))
        }
        return updated
      }
    }
  } catch (e) {}
  return getAllUmkm()
}

export function registerNewUmkm(
  data: Omit<UmkmRegistration, "id" | "status" | "registeredAt" | "reviewedAt">
): UmkmRegistration {
  const all = getAllUmkm()
  const now = new Date()
  const trialEnds = new Date(now.getTime() + TRIAL_DURATION_DAYS * 86400000)

  const newUmkm: UmkmRegistration = {
    ...data,
    id: "umkm_" + Math.random().toString(36).substring(2, 9),
    status: "PENDING",
    registeredAt: now.toISOString(),
    trialStartedAt: now.toISOString(),
    trialEndsAt: trialEnds.toISOString(),
    subscriptionPlan: "TRIAL",
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

  const target = all[idx]
  let trialStartedAt = target.trialStartedAt
  let trialEndsAt = target.trialEndsAt

  // Jika diubah jadi APPROVED dan belum ada trial atau trial sudah habis, berikan 14 hari baru
  if (status === "APPROVED") {
    const now = Date.now()
    if (!trialEndsAt || new Date(trialEndsAt).getTime() <= now) {
      trialStartedAt = new Date().toISOString()
      trialEndsAt = new Date(now + TRIAL_DURATION_DAYS * 86400000).toISOString()
    }
  }

  const updated: UmkmRegistration = {
    ...target,
    status,
    adminNotes: adminNotes !== undefined ? adminNotes : target.adminNotes,
    reviewedAt: new Date().toISOString(),
    trialStartedAt,
    trialEndsAt,
    subscriptionPlan: target.subscriptionPlan || "TRIAL",
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
      body: JSON.stringify({
        id,
        status,
        adminNotes: updated.adminNotes,
        trialStartedAt: updated.trialStartedAt,
        trialEndsAt: updated.trialEndsAt,
        subscriptionPlan: updated.subscriptionPlan,
      }),
    }).catch(() => {})
  }

  return updated
}

/**
 * Perpanjang masa trial prototype untuk UMKM tertentu (default: +14 hari)
 */
export function extendUmkmTrial(id: string, additionalDays: number = TRIAL_DURATION_DAYS): UmkmRegistration | null {
  const all = getAllUmkm()
  const idx = all.findIndex((u) => u.id === id)
  if (idx < 0) return null

  const target = all[idx]
  const currentExpiry = target.trialEndsAt ? new Date(target.trialEndsAt).getTime() : Date.now()
  const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now()
  const newEndsAt = new Date(baseTime + additionalDays * 86400000).toISOString()

  const updated: UmkmRegistration = {
    ...target,
    status: "APPROVED",
    trialStartedAt: target.trialStartedAt || new Date().toISOString(),
    trialEndsAt: newEndsAt,
    adminNotes: `Trial diperpanjang +${additionalDays} hari oleh Admin pada ${new Date().toLocaleDateString("id-ID")}`,
    reviewedAt: new Date().toISOString(),
  }

  all[idx] = updated
  if (typeof window !== "undefined") {
    localStorage.setItem(UMKM_STORAGE_KEY, JSON.stringify(all))
  }

  if (typeof window !== "undefined") {
    fetch("/api/umkm", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        status: updated.status,
        trialStartedAt: updated.trialStartedAt,
        trialEndsAt: updated.trialEndsAt,
        adminNotes: updated.adminNotes,
      }),
    }).catch(() => {})
  }

  return updated
}

export function getUmkmByEmail(email: string): UmkmRegistration | null {
  const all = getAllUmkm()
  return all.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
}
