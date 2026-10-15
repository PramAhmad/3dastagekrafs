import fs from "fs"
import { writeFile, readFile } from "fs/promises"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "public", "data")

function ensureDataDir(): string {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  return DATA_DIR
}

export async function readServerData<T>(fileName: string, fallback: T): Promise<T> {
  try {
    ensureDataDir()
    const filePath = path.join(DATA_DIR, fileName)

    if (!fs.existsSync(filePath)) {
      await writeServerData(fileName, fallback)
      return fallback
    }

    const content = await readFile(filePath, "utf-8")
    return JSON.parse(content) as T
  } catch (err) {
    console.warn(`[serverStorage] Failed to read ${fileName}, returning fallback:`, err)
    return fallback
  }
}

export async function writeServerData<T>(fileName: string, data: T): Promise<void> {
  try {
    ensureDataDir()
    const filePath = path.join(DATA_DIR, fileName)
    const jsonString = JSON.stringify(data, null, 2)
    await writeFile(filePath, jsonString, "utf-8")
  } catch (err) {
    console.error(`[serverStorage] Failed to write ${fileName}:`, err)
    throw err
  }
}
