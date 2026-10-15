import { NextRequest, NextResponse } from "next/server"
import { readServerData, writeServerData } from "@/lib/serverStorage"
import { LibraryImageItem, PRESET_LIBRARY_IMAGES } from "@/lib/presetAssets"

const FILE_NAME = "user_library.json"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    // Read saved user library images from persistent server storage
    const userImages = await readServerData<LibraryImageItem[]>(FILE_NAME, [])

    // Filter by userId if provided, but also keep items with no userId or usr_umkm_01
    const filteredUserImages = userId
      ? userImages.filter((img) => !img.userId || img.userId === userId || img.userId === "usr_umkm_01")
      : userImages

    // Merge preset images + user uploaded images (user images first)
    const combined = [...filteredUserImages, ...PRESET_LIBRARY_IMAGES]

    return NextResponse.json({
      success: true,
      data: combined,
      userCount: filteredUserImages.length,
      totalCount: combined.length,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memuat pustaka gambar" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, url, category = "upload", userId, width, height } = body

    if (!url) {
      return NextResponse.json(
        { success: false, error: "Field 'url' wajib diisi" },
        { status: 400 }
      )
    }

    const currentList = await readServerData<LibraryImageItem[]>(FILE_NAME, [])

    const newItem: LibraryImageItem = {
      id: "lib_" + Math.random().toString(36).substring(2, 9),
      name: name || "Gambar Kustom " + (currentList.length + 1),
      url,
      category,
      userId: userId || "usr_umkm_01",
      width: width || undefined,
      height: height || undefined,
      createdAt: new Date().toISOString(),
      isPreset: false,
    }

    const updated = [newItem, ...currentList]
    await writeServerData(FILE_NAME, updated)

    return NextResponse.json({
      success: true,
      data: newItem,
      message: "Gambar berhasil disimpan ke pustaka",
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menyimpan gambar ke pustaka" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Parameter 'id' wajib diisi" },
        { status: 400 }
      )
    }

    // Do not allow deleting preset images
    if (id.startsWith("preset_")) {
      return NextResponse.json(
        { success: false, error: "Gambar bawaan sistem tidak dapat dihapus" },
        { status: 403 }
      )
    }

    const currentList = await readServerData<LibraryImageItem[]>(FILE_NAME, [])
    const updated = currentList.filter((img) => img.id !== id)

    await writeServerData(FILE_NAME, updated)

    return NextResponse.json({
      success: true,
      message: "Gambar berhasil dihapus dari pustaka",
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus gambar" },
      { status: 500 }
    )
  }
}
