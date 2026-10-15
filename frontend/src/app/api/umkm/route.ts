import { NextRequest, NextResponse } from "next/server"
import { readServerData, writeServerData } from "@/lib/serverStorage"
import { UmkmRegistration, INITIAL_UMKM_REGISTRATIONS } from "@/lib/umkm"

const FILE_NAME = "umkm.json"

export async function GET() {
  try {
    const list = await readServerData<UmkmRegistration[]>(FILE_NAME, INITIAL_UMKM_REGISTRATIONS)
    return NextResponse.json({ success: true, data: list, count: list.length })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const list = await readServerData<UmkmRegistration[]>(FILE_NAME, INITIAL_UMKM_REGISTRATIONS)

    if (Array.isArray(body)) {
      await writeServerData(FILE_NAME, body)
      return NextResponse.json({ success: true, message: "Data UMKM berhasil disimpan", data: body })
    }

    const newRecord: UmkmRegistration = {
      ...body,
      id: body.id || "umkm_" + Math.random().toString(36).substring(2, 9),
      status: body.status || "PENDING",
      registeredAt: body.registeredAt || new Date().toISOString(),
    }

    const updated = [newRecord, ...list]
    await writeServerData(FILE_NAME, updated)

    return NextResponse.json({ success: true, message: "Pendaftaran UMKM berhasil disimpan", data: newRecord })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, adminNotes } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "ID UMKM wajib diisi" }, { status: 400 })
    }

    const list = await readServerData<UmkmRegistration[]>(FILE_NAME, INITIAL_UMKM_REGISTRATIONS)
    const idx = list.findIndex((u) => u.id === id)

    if (idx === -1) {
      return NextResponse.json({ success: false, error: `UMKM '${id}' tidak ditemukan` }, { status: 404 })
    }

    list[idx] = {
      ...list[idx],
      status: status || list[idx].status,
      adminNotes: adminNotes !== undefined ? adminNotes : list[idx].adminNotes,
      reviewedAt: new Date().toISOString(),
    }

    await writeServerData(FILE_NAME, list)
    return NextResponse.json({ success: true, message: "Status UMKM berhasil diperbarui", data: list[idx] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
