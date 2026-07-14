import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BACKEND_ROOT = path.resolve(__dirname, "../..")

const DEFAULT_ORIGINS = ["http://localhost:5173", "http://localhost:3000"]

function parseCorsOrigins() {
  const fromEnv = process.env.CORS_ORIGIN
  if (!fromEnv) return DEFAULT_ORIGINS
  const extra = fromEnv.split(",").map(s => s.trim()).filter(Boolean)
  return [...new Set([...DEFAULT_ORIGINS, ...extra])]
}

export const PORT = process.env.PORT || 3001
export const JWT_SECRET = process.env.JWT_SECRET || "dudi-secret-key-2026"
export const JWT_EXPIRES_IN = "8h"
export const CORS_ORIGINS = parseCorsOrigins()

export const FILE_STORAGE_PROVIDER = process.env.FILE_STORAGE_PROVIDER || "local"
export const FILE_STORAGE_LOCAL_ROOT = process.env.FILE_STORAGE_LOCAL_ROOT
  || path.join(BACKEND_ROOT, "storage", "files")

export const S3_BUCKET = process.env.S3_BUCKET || ""
export const S3_REGION = process.env.S3_REGION || "auto"
export const S3_ENDPOINT = process.env.S3_ENDPOINT || ""
export const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || ""
export const S3_SECRET_KEY = process.env.S3_SECRET_KEY || ""
export const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || ""

export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || ""
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || ""
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || ""
export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "dudi"

export const TEMPLATE_OVERRIDE_ROOT = process.env.TEMPLATE_OVERRIDE_ROOT
  || path.join(BACKEND_ROOT, "storage", "templates")

