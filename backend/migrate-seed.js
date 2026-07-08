import "dotenv/config"
import { connectDB } from "./src/db/connect.js"
import mongoose from "mongoose"

async function test() {
  await connectDB()
  const db = mongoose.connection.db
  const col = db.collection("employees")
  
  const res = await col.updateOne(
    { id: "NV001" },
    {
      $set: {
        contractHistory: [
          {
            contractType: "intern",
            startDate: "28/05/2026",
            endDate: "30/06/2026"
          },
          {
            contractType: "staff",
            startDate: "01/07/2026",
            endDate: ""
          }
        ]
      }
    }
  )
  console.log("MongoDB Employee NV001 Seed Status:", res)
  process.exit(0)
}
test()
