// Lightweight IndexedDB storage for large 3D models (.glb, .gltf), dieline SVGs, and manifests
// Exceeds localStorage's 5MB origin limit safely

const DB_NAME = "kemasan3d_assets_db"
const STORE_NAME = "assets"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not supported"))
    }
    const request = window.indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveAsset(id: string, data: any): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)
      store.put({ id, data, updatedAt: Date.now() })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn("[IndexedDB] Failed to save asset:", id, e)
  }
}

export async function getAsset<T = any>(id: string): Promise<T | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(id)
      req.onsuccess = () => resolve(req.result ? (req.result.data as T) : null)
      req.onerror = () => resolve(null)
    })
  } catch (e) {
    return null
  }
}
