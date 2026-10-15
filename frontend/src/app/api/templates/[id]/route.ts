import { NextRequest, NextResponse } from "next/server"
import { readServerData, writeServerData } from "@/lib/serverStorage"
import { PackagingTemplate, DEFAULT_PACKAGING_TEMPLATES } from "@/types/admin"

const FILE_NAME = "templates.json"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const list = await readServerData<PackagingTemplate[]>(FILE_NAME, DEFAULT_PACKAGING_TEMPLATES)
    const found = list.find((t) => t.id === id)

    if (!found) {
      return NextResponse.json({ success: false, error: `Template '${id}' tidak ditemukan` }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: found })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body: PackagingTemplate = await req.json()
    const list = await readServerData<PackagingTemplate[]>(FILE_NAME, DEFAULT_PACKAGING_TEMPLATES)

    const index = list.findIndex((t) => t.id === id)
    if (index === -1) {
      // Append if not found
      list.unshift({ ...body, id })
    } else {
      list[index] = { ...list[index], ...body, id }
    }

    await writeServerData(FILE_NAME, list)
    return NextResponse.json({ success: true, message: "Template berhasil diperbarui", data: list[index] || body })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const list = await readServerData<PackagingTemplate[]>(FILE_NAME, DEFAULT_PACKAGING_TEMPLATES)
    const updated = list.filter((t) => t.id !== id)
    await writeServerData(FILE_NAME, updated)
    return NextResponse.json({ success: true, message: `Template '${id}' berhasil dihapus` })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
