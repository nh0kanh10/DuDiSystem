import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { v2 as cloudinary } from "cloudinary"
import { findAll } from "../db/index.js"
import { getFileStorage } from "./index.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function extractKeyFromUrl(url) {
  if (!url) return null
  try {
    if (url.includes("key=")) {
      const parts = url.split("key=")
      return decodeURIComponent(parts[1].split("&")[0])
    }
  } catch (e) {
    console.error("[GC] Error parsing URL key:", e)
  }
  return null
}

function getUsedKeys() {
  const keys = new Set()

  const emps = findAll("employees") || []
  for (const e of emps) {
    if (Array.isArray(e.photos)) {
      e.photos.forEach(p => {
        const k = extractKeyFromUrl(p)
        if (k) keys.add(k)
      })
    }
    if (Array.isArray(e.attachments)) {
      e.attachments.forEach(a => {
        const k = extractKeyFromUrl(a.url)
        if (k) keys.add(k)
      })
    }
  }

  const projs = findAll("projects") || []
  for (const p of projs) {
    if (Array.isArray(p.attachments)) {
      p.attachments.forEach(a => {
        const k = extractKeyFromUrl(a.url)
        if (k) keys.add(k)
      })
    }
  }

  const vaults = findAll("projectVaultItems") || []
  for (const v of vaults) {
    const k = extractKeyFromUrl(v.url)
    if (k) keys.add(k)
    if (Array.isArray(v.attachments)) {
      v.attachments.forEach(a => {
        const k2 = extractKeyFromUrl(a.url)
        if (k2) keys.add(k2)
      })
    }
  }

  return keys
}

async function cleanCloudinary(usedKeys) {
  const folder = process.env.CLOUDINARY_FOLDER || "dudi"
  const prefix = `${folder}/`

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  const types = ["image", "raw"]
  let totalDeleted = 0

  for (const resourceType of types) {
    try {
      let nextCursor = null
      do {
        const res = await cloudinary.api.resources({
          type: "upload",
          prefix,
          resource_type: resourceType,
          max_results: 500,
          next_cursor: nextCursor
        })

        if (!res.resources || res.resources.length === 0) break

        const orphans = []
        for (const item of res.resources) {
          const publicId = item.public_id
          if (publicId.startsWith(prefix)) {
            const key = publicId.substring(prefix.length)
            if (!usedKeys.has(key)) {
              const ageInMs = Date.now() - new Date(item.created_at).getTime()
              const oneHourInMs = 60 * 60 * 1000
              if (ageInMs < oneHourInMs) {
                console.log(`[GC] Bỏ qua file mới upload: ${key} (chờ lưu)`)
                continue
              }
              orphans.push(publicId)
            }
          }
        }

        if (orphans.length > 0) {
          console.log(`[GC] Đang dọn dẹp ${orphans.length} file rác (${resourceType}) trên Cloudinary...`)
          for (const pid of orphans) {
            try {
              await cloudinary.uploader.destroy(pid, {
                resource_type: resourceType,
                type: "upload",
                invalidate: true
              })
              totalDeleted++
            } catch (err) {
              console.error(`[GC] Lỗi xóa file ${pid}:`, err.message)
            }
          }
        }

        nextCursor = res.next_cursor
      } while (nextCursor)
    } catch (err) {
      console.error(`[GC] Lỗi quét Cloudinary (${resourceType}):`, err.message)
    }
  }

  if (totalDeleted > 0) {
    console.log(`[GC] Đã dọn dẹp tổng cộng ${totalDeleted} file rác trên Cloudinary thành công!`)
  }
}

function cleanLocal(usedKeys) {
  const uploadDir = path.resolve(__dirname, "../../uploads")
  if (!fs.existsSync(uploadDir)) return

  let totalDeleted = 0

  function scanAndClean(dirPath, relativePrefix = "") {
    const items = fs.readdirSync(dirPath)
    for (const item of items) {
      const fullPath = path.join(dirPath, item)
      const relKey = relativePrefix ? `${relativePrefix}/${item}` : item
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        scanAndClean(fullPath, relKey)
        if (fs.readdirSync(fullPath).length === 0) {
          fs.rmdirSync(fullPath)
        }
      } else {
        if (!usedKeys.has(relKey)) {
          // Bỏ qua nếu file mới được tạo trong vòng 1 tiếng
          const ageInMs = Date.now() - stat.mtimeMs
          const oneHourInMs = 60 * 60 * 1000
          if (ageInMs < oneHourInMs) {
            continue
          }
          try {
            fs.unlinkSync(fullPath)
            console.log(`[GC] Đã xóa file rác local: ${relKey}`)
            totalDeleted++
          } catch (err) {
            console.error(`[GC] Lỗi xóa file local ${relKey}:`, err.message)
          }
        }
      }
    }
  }

  try {
    scanAndClean(uploadDir)
    if (totalDeleted > 0) {
      console.log(`[GC] Đã dọn dẹp tổng cộng ${totalDeleted} file rác trong uploads local!`)
    }
  } catch (err) {
    console.error("[GC] Lỗi dọn dẹp local uploads:", err.message)
  }
}

export async function runGarbageCollector() {
  console.log("[GC] Bắt đầu quét và dọn dẹp tệp tin mồ côi...")
  try {
    const usedKeys = getUsedKeys()
    const provider = process.env.FILE_STORAGE_PROVIDER || "local"

    if (provider === "cloudinary") {
      await cleanCloudinary(usedKeys)
    } else {
      cleanLocal(usedKeys)
    }
  } catch (err) {
    console.error("[GC] Lỗi chạy Garbage Collector:", err.message)
  }
}
