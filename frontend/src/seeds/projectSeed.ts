import { SavedProject } from "@/types/auth"

export const SEED_SAVED_PROJECTS: SavedProject[] = [
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

export function getSeedProjectData(): SavedProject[] {
  return JSON.parse(JSON.stringify(SEED_SAVED_PROJECTS))
}
