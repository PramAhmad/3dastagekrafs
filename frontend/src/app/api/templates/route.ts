import { NextRequest, NextResponse } from "next/server"
import { PackagingTemplate, DEFAULT_PACKAGING_TEMPLATES } from "@/types/admin"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/templates`, { cache: "no-store" })
    if (res.ok) {
      const json = await res.json()
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        return NextResponse.json({
          success: true,
          data: json.data,
          count: json.data.length,
        })
      }
    }
  } catch (err) {
    console.warn("[Templates API] Backend not reachable, using fallback", err)
  }

  return NextResponse.json({
    success: true,
    data: DEFAULT_PACKAGING_TEMPLATES,
    count: DEFAULT_PACKAGING_TEMPLATES.length,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${BACKEND_URL}/api/v1/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menyimpan template kemasan ke database" },
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

    const res = await fetch(`${BACKEND_URL}/api/v1/templates/${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus template kemasan dari database" },
      { status: 500 }
    )
  }
}
