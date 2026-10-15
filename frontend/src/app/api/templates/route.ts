import { NextRequest, NextResponse } from "next/server"
import { readServerData, writeServerData } from "@/lib/serverStorage"
import { PackagingTemplate, DEFAULT_PACKAGING_TEMPLATES } from "@/types/admin"

const FILE_NAME = "templates.json"

export async function GET() {
  try {
    const templates = await readServerData<PackagingTemplate[]>(FILE_NAME, DEFAULT_PACKAGING_TEMPLATES)
    return NextResponse.json({
      success: true,
      data: templates,
      count: templates.length,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memuat template kemasan" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const currentList = await readServerData<PackagingTemplate[]>(FILE_NAME, DEFAULT_PACKAGING_TEMPLATES)

    let updatedList: PackagingTemplate[] = []

    if (Array.isArray(body)) {
      updatedList = body
    } else if (body.templates && Array.isArray(body.templates)) {
      updatedList = body.templates
    } else if (body.id && body.name) {
      const newTemplate: PackagingTemplate = body
      const existingIndex = currentList.findIndex((t) => t.id === newTemplate.id)

      if (existingIndex !== -1) {
        updatedList = [...currentList]
        updatedList[existingIndex] = newTemplate
      } else {
        updatedList = [newTemplate, ...currentList]
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Format data template tidak valid" },
        { status: 400 }
      )
    }

    await writeServerData(FILE_NAME, updatedList)

    return NextResponse.json({
      success: true,
      message: "Template kemasan berhasil disimpan permanen di server",
      data: updatedList,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menyimpan template kemasan" },
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

    const currentList = await readServerData<PackagingTemplate[]>(FILE_NAME, DEFAULT_PACKAGING_TEMPLATES)
    const updatedList = currentList.filter((t) => t.id !== id)

    await writeServerData(FILE_NAME, updatedList)

    return NextResponse.json({
      success: true,
      message: `Template '${id}' berhasil dihapus dari server`,
      data: updatedList,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus template kemasan" },
      { status: 500 }
    )
  }
}
