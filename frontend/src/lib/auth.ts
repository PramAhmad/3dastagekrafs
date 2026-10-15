import { UserSession, SavedProject } from "@/types/auth"

export type { UserSession, SavedProject }

const AUTH_STORAGE_KEY = "kemasan3d_user_session"
const PROJECTS_STORAGE_KEY = "kemasan3d_saved_projects"

// Default demo session if user wants quick test
export const DEMO_USER: UserSession = {
  id: "usr_umkm_01",
  name: "Budi Santoso",
  email: "budi.umkm@gmail.com",
  role: "user",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
}

// Initial sample projects history
export const INITIAL_PROJECTS: SavedProject[] = [
  {
    id: "proj_sample_01",
    userId: "usr_umkm_01",
    name: "Kardus Packaging Sabun Organik",
    templateId: "box_rectangular_v1",
    templateName: "Kotak Persegi (Mailer Box)",
    category: "BOX",
    description: "Desain kardus kraft untuk sabun herbal alami batch 500 pcs.",
    dimensions: {
      length: 80,
      width: 55,
      height: 35,
      radius: 25,
      wallThickness: 1.8,
    },
    materialId: "corrugated",
    materialName: "Corrugated Cardboard",
    boxColor: "#ba8b57",
    objects: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "proj_sample_02",
    userId: "usr_umkm_01",
    name: "Standing Pouch Kopi Robusta 250g",
    templateId: "pouch_standing_v1",
    templateName: "Standing Pouch Zipper",
    category: "POUCH",
    description: "Kantong kedap udara zipper hitam doff dengan logo emas.",
    dimensions: {
      length: 95,
      width: 45,
      height: 140,
      radius: 20,
      wallThickness: 1.5,
    },
    materialId: "black_matte",
    materialName: "Black Matte Soft-Touch",
    boxColor: "#1c1917",
    objects: [],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
]

// -------------------------------------------------------------
// Auth Helpers
// -------------------------------------------------------------
export function getCurrentUser(): UserSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserSession
  } catch (err) {
    return null
  }
}

export function setCurrentUser(user: UserSession | null): void {
  if (typeof window === "undefined") return
  if (!user) {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } else {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  }
}

export function loginUser(email: string, name?: string): UserSession {
  const user: UserSession = {
    id: "usr_" + Math.random().toString(36).substring(2, 9),
    name: name || email.split("@")[0],
    email,
    role: "user",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    token: "tok_" + Date.now(),
  }
  setCurrentUser(user)
  return user
}

export function logoutUser(): void {
  setCurrentUser(null)
}

// -------------------------------------------------------------
// Project History Storage Helpers
// -------------------------------------------------------------
export function getAllSavedProjects(): SavedProject[] {
  if (typeof window === "undefined") return INITIAL_PROJECTS
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS))
      return INITIAL_PROJECTS
    }
    return JSON.parse(raw) as SavedProject[]
  } catch (err) {
    return INITIAL_PROJECTS
  }
}

export function getUserSavedProjects(userId?: string): SavedProject[] {
  const all = getAllSavedProjects()
  if (!userId) return all
  return all.filter((p) => p.userId === userId || p.userId === "usr_umkm_01")
}

export async function fetchUserProjectsFromServer(userId?: string): Promise<SavedProject[]> {
  try {
    const url = userId ? `/api/projects?userId=${encodeURIComponent(userId)}` : "/api/projects"
    const res = await fetch(url)
    if (res.ok) {
      const json = await res.json()
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(json.data))
        }
        return json.data
      }
    }
  } catch (e) {}
  return getUserSavedProjects(userId)
}

export function saveProjectToHistory(project: Omit<SavedProject, "id" | "createdAt" | "updatedAt"> & { id?: string }): SavedProject {
  const all = getAllSavedProjects()
  const now = new Date().toISOString()

  let savedItem: SavedProject

  if (project.id) {
    const existingIndex = all.findIndex((p) => p.id === project.id)
    if (existingIndex >= 0) {
      savedItem = {
        ...all[existingIndex],
        ...project,
        id: project.id,
        updatedAt: now,
      }
      all[existingIndex] = savedItem
    } else {
      savedItem = {
        ...project,
        id: project.id,
        createdAt: now,
        updatedAt: now,
      } as SavedProject
      all.unshift(savedItem)
    }
  } else {
    savedItem = {
      ...project,
      id: "proj_" + Math.random().toString(36).substring(2, 9),
      createdAt: now,
      updatedAt: now,
    } as SavedProject
    all.unshift(savedItem)
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(all))
    // Sync to server API in background
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(savedItem),
    }).catch(() => {})
  }
  return savedItem
}

export function deleteSavedProject(id: string): void {
  const all = getAllSavedProjects().filter((p) => p.id !== id)
  if (typeof window !== "undefined") {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(all))
    // Sync to server API in background
    fetch(`/api/projects?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).catch(() => {})
  }
}

export function getProjectById(id: string): SavedProject | null {
  const all = getAllSavedProjects()
  return all.find((p) => p.id === id) || null
}
