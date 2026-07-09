import "dotenv/config"
import { connectDB } from "./src/db/connect.js"
import mongoose from "mongoose"

async function test() {
  await connectDB()
  const db = mongoose.connection.db
  const col = db.collection("attendances")
  const records = await col.find({ employeeId: "NV005", date: { $regex: "^2026-07-" } }).toArray()
  console.log("RECORDS IN MONGO FOR NV005 (JULY 2026):", JSON.stringify(records, null, 2))
  process.exit(0)
}
test()
