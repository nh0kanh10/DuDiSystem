import "dotenv/config"
import { v2 as cloudinary } from "cloudinary"
import { getFileStorage } from "../src/storage/index.js"
import {
  FILE_STORAGE_PROVIDER,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_FOLDER,
} from "../src/config/index.js"

const mask = (v) => (v ? `${v.slice(0, 4)}...${v.slice(-2)}` : "(empty)")

function checkEnv() {
  console.log("Provider:", FILE_STORAGE_PROVIDER)
  console.log("Cloud name:", CLOUDINARY_CLOUD_NAME || "(empty)")
  console.log("API key:", mask(CLOUDINARY_API_KEY))
  console.log("API secret set:", Boolean(process.env.CLOUDINARY_API_SECRET))
  console.log("Folder:", CLOUDINARY_FOLDER)

  const s = process.env.CLOUDINARY_API_SECRET || ""
  const k = process.env.CLOUDINARY_API_KEY || ""
  console.log("Key trim ok:", k === k.trim())
  console.log("Secret trim ok:", s === s.trim())
  console.log("Secret length:", s.length)
}

async function testPing() {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
  const res = await cloudinary.api.ping()
  console.log("API ping:", res.status)
}

async function testStorageRoundTrip() {
  const key = `_healthcheck/test-${Date.now()}.txt`
  const payload = Buffer.from(`DuDi test ${new Date().toISOString()}`, "utf8")
  const storage = getFileStorage()
  console.log("Uploading via app storage...")
  await storage.put(key, payload)
  const got = await storage.get(key)
  const match = got?.toString("utf8") === payload.toString("utf8")
  console.log("Download match:", match)
  await storage.remove(key)
  const after = await storage.get(key)
  console.log("Deleted:", after === null)
  return match && after === null
}

async function main() {
  checkEnv()
  if (FILE_STORAGE_PROVIDER !== "cloudinary") {
    console.error("FAIL: set FILE_STORAGE_PROVIDER=cloudinary")
    process.exit(1)
  }
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("FAIL: missing Cloudinary env")
    process.exit(1)
  }

  try {
    await testPing()
  } catch (err) {
    console.error("FAIL ping:", err.message || err)
    console.error("→ API Key và API Secret không khớp. Lấy cặp key/secret từ cùng một API Key trên Cloudinary.")
    process.exit(1)
  }

  try {
    const ok = await testStorageRoundTrip()
    console.log(ok ? "PASS: upload / download / delete OK" : "FAIL: round-trip")
    process.exit(ok ? 0 : 1)
  } catch (err) {
    console.error("FAIL storage:", err.message || err)
    process.exit(1)
  }
}

main()
