import { NextRequest, NextResponse } from "next/server"
import { readServerData, writeServerData } from "@/lib/serverStorage"
import { SavedProject, INITIAL_PROJECTS } from "@/lib/auth"

const FILE_NAME = "projects.json"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const list = await readServerData<SavedProject[]>(FILE_NAME, INITIAL_PROJECTS)

    if (userId) {
      const filtered = list.filter((p) => p.userId === userId || p.userId === "usr_umkm_01")
      return NextResponse.json({ success: true, data: filtered, count: filtered.length })
    }

    return NextResponse.json({ success: true, data: list, count: list.length })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const all = await readServerData<SavedProject[]>(FILE_NAME, INITIAL_PROJECTS)
    const now = new Date().toISOString()

    let savedItem: SavedProject

    if (body.id) {
      const existingIndex = all.findIndex((p) => p.id === body.id)
      if (existingIndex >= 0) {
        savedItem = {
          ...all[existingIndex],
          ...body,
          updatedAt: now,
        }
        all[existingIndex] = savedItem
      } else {
        savedItem = {
          ...body,
          id: body.id,
          createdAt: now,
          updatedAt: now,
        }
        all.unshift(savedItem)
      }
    } else {
      savedItem = {
        ...body,
        id: "proj_" + Math.random().toString(36).substring(2, 9),
        createdAt: now,
        updatedAt: now,
      }
      all.unshift(savedItem)
    }

    await writeServerData(FILE_NAME, all)
    return NextResponse.json({ success: true, message: "Project berhasil disimpan di server", data: savedItem })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Parameter 'id' wajib diisi" }, { status: 400 })
    }

    const all = await readServerData<SavedProject[]>(FILE_NAME, INITIAL_PROJECTS)
    const updated = all.filter((p) => p.id !== id)
    await writeServerData(FILE_NAME, updated)

    return NextResponse.json({ success: true, message: `Project '${id}' berhasil dihapus` })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
