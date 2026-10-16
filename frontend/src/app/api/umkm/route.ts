import { NextRequest, NextResponse } from "next/server"
import { readServerData, writeServerData } from "@/lib/serverStorage"
import { UmkmRegistration, checkAndExpireTrials } from "@/lib/umkm"
import { getSeedUmkmData } from "@/seeds/umkmSeed"

const FILE_NAME = "umkm.json"

export async function GET() {
  try {
    const list = await readServerData<UmkmRegistration[]>(FILE_NAME, getSeedUmkmData())
    const { updated, hasChanges } = checkAndExpireTrials(list)
    if (hasChanges) {
      await writeServerData(FILE_NAME, updated)
    }
    return NextResponse.json({ success: true, data: updated, count: updated.length })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const list = await readServerData<UmkmRegistration[]>(FILE_NAME, getSeedUmkmData())

    if (Array.isArray(body)) {
      const { updated } = checkAndExpireTrials(body)
      await writeServerData(FILE_NAME, updated)
      return NextResponse.json({ success: true, message: "Data UMKM berhasil disimpan", data: updated })
    }

    const now = new Date()
    const trialEnds = new Date(now.getTime() + 14 * 86400000)

    const newRecord: UmkmRegistration = {
      ...body,
      id: body.id || "umkm_" + Math.random().toString(36).substring(2, 9),
      status: body.status || "PENDING",
      registeredAt: body.registeredAt || now.toISOString(),
      trialStartedAt: body.trialStartedAt || now.toISOString(),
      trialEndsAt: body.trialEndsAt || trialEnds.toISOString(),
      subscriptionPlan: body.subscriptionPlan || "TRIAL",
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
    const { id, status, adminNotes, trialStartedAt, trialEndsAt, subscriptionPlan } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "ID UMKM wajib diisi" }, { status: 400 })
    }

    const list = await readServerData<UmkmRegistration[]>(FILE_NAME, getSeedUmkmData())
    const idx = list.findIndex((u) => u.id === id)

    if (idx === -1) {
      return NextResponse.json({ success: false, error: `UMKM '${id}' tidak ditemukan` }, { status: 404 })
    }

    list[idx] = {
      ...list[idx],
      status: status || list[idx].status,
      adminNotes: adminNotes !== undefined ? adminNotes : list[idx].adminNotes,
      reviewedAt: new Date().toISOString(),
      trialStartedAt: trialStartedAt !== undefined ? trialStartedAt : list[idx].trialStartedAt,
      trialEndsAt: trialEndsAt !== undefined ? trialEndsAt : list[idx].trialEndsAt,
      subscriptionPlan: subscriptionPlan !== undefined ? subscriptionPlan : list[idx].subscriptionPlan,
    }

    await writeServerData(FILE_NAME, list)
    return NextResponse.json({ success: true, message: "Status UMKM berhasil diperbarui", data: list[idx] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
