import { v2 as cloudinary } from "cloudinary"
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_FOLDER,
} from "../config/index.js"

export const provider = "cloudinary"

let configured = false

function ensureConfig() {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      "FILE_STORAGE_PROVIDER=cloudinary nhưng thiếu CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET. "
      + "Dev: dùng FILE_STORAGE_PROVIDER=local",
    )
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    })
    configured = true
  }
}

function removeAccents(str) {
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
}

function normalizeKey(key) {
  return String(key).replace(/\\/g, "/").replace(/^\/+/, "")
}

function publicIdFromKey(key) {
  const norm = normalizeKey(key)
  const unsigned = removeAccents(norm)
  const sanitized = unsigned
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9.\-_/]/g, "")
  return `${CLOUDINARY_FOLDER}/${sanitized}`
}

function downloadFormatFromKey(key) {
  const normalized = normalizeKey(key)
  const m = normalized.match(/\.([^.]+)$/)
  return m ? m[1] : ""
}

function uploadOptions(key) {
  const ext = String(key).split(".").pop()?.toLowerCase()
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)
  return {
    resource_type: isImage ? "image" : "raw",
    type: "upload",
    public_id: publicIdFromKey(key),
    overwrite: true,
  }
}

export async function put(key, buffer) {
  ensureConfig()
  const opts = uploadOptions(key)
  await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
    stream.end(buffer)
  })
  return { key: normalizeKey(key), provider }
}

export async function get(key) {
  ensureConfig()
  const publicId = publicIdFromKey(key)
  const format = downloadFormatFromKey(key)
  const ext = String(key).split(".").pop()?.toLowerCase()
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)

  let url
  if (isImage) {
    url = cloudinary.url(publicId, {
      format: format,
      resource_type: "image",
      secure: true
    })
  } else {
    url = cloudinary.url(publicId, {
      resource_type: "raw",
      secure: true
    })
  }
  
  let res = await fetch(url)
  if (res.ok) {
    return Buffer.from(await res.arrayBuffer())
  }

  const fallbackUrl = isImage
    ? cloudinary.url(publicId, { resource_type: "raw", secure: true })
    : cloudinary.url(publicId, { format: format, resource_type: "image", secure: true })

  res = await fetch(fallbackUrl)
  if (res.ok) {
    return Buffer.from(await res.arrayBuffer())
  }

  return null
}

export async function remove(key) {
  ensureConfig()
  const publicId = publicIdFromKey(key)
  const ext = String(key).split(".").pop()?.toLowerCase()
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: isImage ? "image" : "raw",
      type: "upload",
      invalidate: true,
    })
  } catch (err) {
    if (err?.error?.http_code === 404) return
    throw err
  }
}
