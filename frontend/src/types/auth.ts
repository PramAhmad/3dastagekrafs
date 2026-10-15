import { CanvasObject } from "@/components/3d/PackagingCanvas"

export interface UserSession {
  id: string
  name: string
  email: string
  role: "user" | "admin"
  avatar?: string
  phone?: string
  brandName?: string
  address?: string
  bio?: string
  token?: string
}

export interface SavedProject {
  id: string
  userId: string
  name: string
  templateId: string
  templateName: string
  category: string
  description?: string
  dimensions: {
    length: number
    width: number
    height: number
    radius: number
    wallThickness: number
  }
  materialId: string
  materialName: string
  boxColor: string
  objects: CanvasObject[]
  previewUrl?: string
  model3dUrl?: string
  modelFormat?: string
  createdAt: string
  updatedAt: string
}
