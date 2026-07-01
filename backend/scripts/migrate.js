import "dotenv/config"
import { readFileSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { connectDB, disconnectDB } from "../src/db/connect.js"
import { getModel } from "../src/db/models.js"
import { COLLECTIONS } from "../src/db/collections.js"

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dir, "../src/db/data")

async function migrateCollection(collection) {
  const filePath = join(DATA_DIR, `${collection}.json`)
  if (!existsSync(filePath)) {
    console.log(`  skip ${collection} (no JSON file)`)
    return 0
  }

  const data = JSON.parse(readFileSync(filePath, "utf-8"))
  if (!Array.isArray(data)) {
    throw new Error(`${collection}.json must be a JSON array`)
  }

  const Model = getModel(collection)
  await Model.deleteMany({})
  if (data.length > 0) {
    await Model.insertMany(data)
  }

  console.log(`  ${collection}: ${data.length} documents`)
  return data.length
}

async function main() {
  console.log("DuDiSystem — migrate JSON → MongoDB Atlas\n")
  await connectDB()

  let total = 0
  for (const collection of COLLECTIONS) {
    total += await migrateCollection(collection)
  }

  console.log(`\nDone. ${total} documents migrated to database "${process.env.MONGODB_URI?.split("/").pop()?.split("?")[0] ?? "dudi_system"}".`)
  await disconnectDB()
}

main().catch(err => {
  console.error("\nMigrate failed:", err.message)
  process.exit(1)
})
