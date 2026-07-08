import "dotenv/config"
import { connectDB } from "./src/db/connect.js"
import { listAttendance } from "./src/services/attendance.service.js"

async function test() {
  await connectDB()
  
  // Call listAttendance with filter for July 2026
  const result = await listAttendance({
    startDate: "2026-07-01",
    endDate: "2026-07-31"
  })
  
  const nv005 = result.filter(r => r.employeeId === "NV005")
  console.log("NV005 JULY 2026 RECORDS FROM API:")
  nv005.forEach(r => {
    console.log(`Date: ${r.date}, ID: ${r.id}, Status: ${r.status}, isIntern: ${r.employeeStatus}`)
  })

  const nv001 = result.filter(r => r.employeeId === "NV001")
  console.log("\nNV001 JULY 2026 RECORDS FROM API:")
  nv001.forEach(r => {
    console.log(`Date: ${r.date}, ID: ${r.id}, Status: ${r.status}, isIntern: ${r.employeeStatus}`)
  })
  
  process.exit(0)
}
test()
