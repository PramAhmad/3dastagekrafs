import { NextRequest, NextResponse } from "next/server"
import { readServerData, writeServerData } from "@/lib/serverStorage"

const FILE_NAME = "pricing.json"

const DEFAULT_PRICING = {
  markupPct: 30,
  machineRate: 15000,
  plaRate: 350,
  petgRate: 450,
  resinRate: 850,
  packagingFee: 5000,
  minOrder: 25000,
}

export async function GET() {
  try {
    const data = await readServerData(FILE_NAME, DEFAULT_PRICING)
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const current = await readServerData(FILE_NAME, DEFAULT_PRICING)
    const updated = { ...current, ...body }
    await writeServerData(FILE_NAME, updated)
    return NextResponse.json({ success: true, message: "Konfigurasi harga berhasil disimpan di server", data: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
