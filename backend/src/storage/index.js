import { FILE_STORAGE_PROVIDER } from "../config/index.js"
import * as local from "./local.provider.js"
import * as s3 from "./s3.provider.js"
import * as cloudinary from "./cloudinary.provider.js"

const providers = {
  local,
  s3,
  cloudinary,
}

export function getFileStorage() {
  const mod = providers[FILE_STORAGE_PROVIDER]
  if (!mod) {
    throw new Error(
      `FILE_STORAGE_PROVIDER không hợp lệ: ${FILE_STORAGE_PROVIDER}. `
      + "Dùng local, cloudinary hoặc s3.",
    )
  }
  return mod
}

export { leadDocumentKey, projectVaultFileKey, templateOverrideKey, templateMetaKey } from "./keys.js"
