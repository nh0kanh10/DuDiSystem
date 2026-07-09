import "dotenv/config"
import { connectDB } from "./src/db/connect.js"
import mongoose from "mongoose"

async function test() {
  await connectDB()
  const db = mongoose.connection.db
  const col = db.collection("requests")
  const records = await col.find({ employeeId: "NV001" }).toArray()
  console.log("REQUESTS IN MONGO FOR NV001:", JSON.stringify(records, null, 2))
  process.exit(0)
}
test()
