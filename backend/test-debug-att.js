import "dotenv/config"
import { connectDB } from "./src/db/connect.js"
import * as empRepo from "./src/repositories/employee.repository.js"
import { listAttendance } from "./src/services/attendance.service.js"

async function test() {
  await connectDB()
  
  const employees = empRepo.getAll()
  console.log("TOTAL EMPLOYEES IN REPO:", employees.length)
  console.log("EMPLOYEES IDS:", employees.map(e => e.id))
  
  const result = await listAttendance({
    startDate: "2026-07-01",
    endDate: "2026-07-31"
  })
  
  console.log("TOTAL RECORDS RETURNED:", result.length)
  if (result.length > 0) {
    console.log("SAMPLE RECORD:", JSON.stringify(result[0], null, 2))
  }
  
  process.exit(0)
}
test()
