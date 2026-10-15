import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import fs from "fs"
import path from "path"

function getTargetUploadDirs(): string[] {
  const cwd = process.cwd()
  const candidates = [
    path.join(cwd, "public", "uploads"),
    path.join(cwd, "frontend", "public", "uploads"),
    path.join("/var/www/astaKraf/frontend/public/uploads"),
  ]

  const validDirs: string[] = []
  for (const dir of candidates) {
    try {
      if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      validDirs.push(dir)
    } catch (e) {}
  }
  return validDirs.length > 0 ? validDirs : [path.join(cwd, "public", "uploads")]
}

export async function POST(req: NextRequest) {
  try {
    const uploadDirs = getTargetUploadDirs()

    const contentType = req.headers.get("content-type") || ""

    // 1. JSON Payload with base64/dataUrl
    if (contentType.includes("application/json")) {
      const body = await req.json()
      const dataUrl = body.dataUrl || body.base64
      let filename = body.filename || `upload_${Date.now()}.png`

      if (!dataUrl) {
        return NextResponse.json({ success: false, error: "Field 'dataUrl' atau 'base64' wajib diisi" }, { status: 400 })
      }

      // Extract mime and base64 data
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
      let buffer: Buffer

      if (matches && matches.length === 3) {
        const mime = matches[1]
        buffer = Buffer.from(matches[2], "base64")
        if (!filename.includes(".")) {
          const ext = mime.split("/")[1] || "png"
          filename = `${filename}.${ext}`
        }
      } else {
        buffer = Buffer.from(dataUrl, "base64")
      }

      const ext = path.extname(filename) || ".png"
      const cleanBase = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, "_")
      const finalName = `${cleanBase}_${Date.now()}${ext}`

      for (const dir of uploadDirs) {
        try {
          await writeFile(path.join(dir, finalName), buffer)
        } catch (e) {}
      }

      const publicUrl = `/uploads/${finalName}`

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: finalName,
        size: buffer.length,
      })
    }

    // 2. Multipart Form Data (Standard File Upload)
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: "File tidak ditemukan dalam form data (field 'file')" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const originalName = file.name || "upload.png"
    const ext = path.extname(originalName) || ".png"
    const cleanBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, "_")
    const finalName = `${cleanBase}_${Date.now()}${ext}`

    for (const dir of uploadDirs) {
      try {
        await writeFile(path.join(dir, finalName), buffer)
      } catch (e) {}
    }

    const publicUrl = `/uploads/${finalName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: finalName,
      size: buffer.length,
    })
  } catch (err: any) {
    console.error("[Upload API] Error saving file:", err)
    return NextResponse.json({ success: false, error: err.message || "Gagal mengunggah file" }, { status: 500 })
  }
}
