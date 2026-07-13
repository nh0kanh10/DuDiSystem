import { getModel } from "./src/db/models.js"
import { connectDB } from "./src/db/connect.js"
import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

async function run() {
  await connectDB()
  
  const Model = getModel("orgNodes")
  
  const res = await Model.updateOne(
    { $or: [{ id: "branch-dudi" }, { name: "DuDiSolfware 49" }] },
    { $set: { name: "DUDI Software 49" } }
  )
  
  console.log("Rename result:", res)
  
  await mongoose.disconnect()
}

run().catch(console.error)
