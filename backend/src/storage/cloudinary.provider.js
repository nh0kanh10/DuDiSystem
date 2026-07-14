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

function normalizeKey(key) {
  return String(key).replace(/\\/g, "/").replace(/^\/+/, "")
}

function publicIdFromKey(key) {
  return `${CLOUDINARY_FOLDER}/${normalizeKey(key)}`
}

function downloadFormatFromKey(key) {
  const normalized = normalizeKey(key)
  const m = normalized.match(/\.([^.]+)$/)
  return m ? m[1] : ""
}

function uploadOptions(key) {
  return {
    resource_type: "raw",
    type: "authenticated",
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
  try {
    await cloudinary.api.resource(publicId, {
      resource_type: "raw",
      type: "authenticated",
    })
  } catch (err) {
    if (err?.error?.http_code === 404) return null
    throw err
  }
  const url = cloudinary.utils.private_download_url(publicId, format, {
    resource_type: "raw",
    type: "authenticated",
  })
  const res = await fetch(url)
  if (!res.ok) return null
  return Buffer.from(await res.arrayBuffer())
}

export async function remove(key) {
  ensureConfig()
  const publicId = publicIdFromKey(key)
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
      type: "authenticated",
      invalidate: true,
    })
  } catch (err) {
    if (err?.error?.http_code === 404) return
    throw err
  }
}
