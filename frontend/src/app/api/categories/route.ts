import { NextRequest, NextResponse } from "next/server"
import { readServerData, writeServerData } from "@/lib/serverStorage"
import { CategoryMaster, DEFAULT_MASTER_CATEGORIES } from "@/types/admin"

const FILE_NAME = "categories.json"

export async function GET() {
  try {
    const categories = await readServerData<CategoryMaster[]>(FILE_NAME, DEFAULT_MASTER_CATEGORIES)
    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memuat kategori" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const currentList = await readServerData<CategoryMaster[]>(FILE_NAME, DEFAULT_MASTER_CATEGORIES)

    let updatedList: CategoryMaster[] = []

    // Case 1: Client passed a full array of categories
    if (Array.isArray(body)) {
      updatedList = body
    } else if (body.categories && Array.isArray(body.categories)) {
      updatedList = body.categories
    }
    // Case 2: Client passed a single category to upsert
    else if (body.id && body.name) {
      const targetCategory: CategoryMaster = {
        id: body.id.trim().toUpperCase().replace(/\s+/g, "_"),
        name: body.name,
        description: body.description || "",
        image_url: body.image_url || "",
        icon_name: body.icon_name || "",
        is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
        display_order: body.display_order || currentList.length + 1,
      }

      const existingIndex = currentList.findIndex(
        (c) => c.id.toUpperCase() === targetCategory.id.toUpperCase()
      )

      if (existingIndex !== -1) {
        updatedList = [...currentList]
        updatedList[existingIndex] = targetCategory
      } else {
        updatedList = [targetCategory, ...currentList]
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Format data kategori tidak valid" },
        { status: 400 }
      )
    }

    await writeServerData(FILE_NAME, updatedList)

    return NextResponse.json({
      success: true,
      message: "Kategori berhasil disimpan permanen di server",
      data: updatedList,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menyimpan kategori" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Parameter 'id' wajib diisi" }, { status: 400 })
    }

    const currentList = await readServerData<CategoryMaster[]>(FILE_NAME, DEFAULT_MASTER_CATEGORIES)
    const updatedList = currentList.filter((c) => c.id.toUpperCase() !== id.toUpperCase())

    await writeServerData(FILE_NAME, updatedList)

    return NextResponse.json({
      success: true,
      message: `Kategori '${id}' berhasil dihapus dari server`,
      data: updatedList,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus kategori" },
      { status: 500 }
    )
  }
}
