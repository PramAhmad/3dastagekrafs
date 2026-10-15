import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".stl": "application/sla",
  ".pdf": "application/pdf",
  ".json": "application/json",
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params
    if (!segments || segments.length === 0) {
      return new NextResponse("File not specified", { status: 400 })
    }

    const filename = segments.join("/")

    // Prevent directory traversal attacks
    if (filename.includes("..") || filename.startsWith("/")) {
      return new NextResponse("Invalid file path", { status: 400 })
    }

    const cwd = process.cwd()
    const candidates = [
      path.join(cwd, "public", "uploads", filename),
      path.join(cwd, "frontend", "public", "uploads", filename),
      path.join("/var/www/astaKraf/frontend/public/uploads", filename),
      path.join("/var/www/astaKraf/uploads", filename),
    ]

    let foundPath: string | null = null
    for (const p of candidates) {
      if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
        foundPath = p
        break
      }
    }

    if (!foundPath) {
      return new NextResponse(`File '${filename}' not found on server`, { status: 404 })
    }

    const ext = path.extname(foundPath).toLowerCase()
    const contentType = MIME_TYPES[ext] || "application/octet-stream"
    const fileBuffer = fs.readFileSync(/*turbopackIgnore: true*/ foundPath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error: any) {
    console.error("[Uploads Route] Error serving file:", error)
    return new NextResponse("Error reading file", { status: 500 })
  }
}
