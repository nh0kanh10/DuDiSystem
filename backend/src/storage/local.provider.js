import fs from "fs"
import path from "path"
import { FILE_STORAGE_LOCAL_ROOT } from "../config/index.js"

function absPath(key) {
  return path.join(FILE_STORAGE_LOCAL_ROOT, key.replace(/\//g, path.sep))
}

export const provider = "local"

export async function put(key, buffer) {
  const target = absPath(key)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, buffer)
  return { key, provider }
}

export async function get(key) {
  const target = absPath(key)
  if (!fs.existsSync(target)) return null
  return fs.readFileSync(target)
}

export async function remove(key) {
  const target = absPath(key)
  if (!fs.existsSync(target)) return
  fs.unlinkSync(target)
}
