import "dotenv/config"
import { connectDB, disconnectDB } from "./src/db/connect.js"
import { getModel } from "./src/db/models.js"
import { loadCache } from "./src/db/index.js"
import * as ProfileUpdateRequestRepo from "./src/repositories/profileUpdateRequest.repository.js"
import * as EmployeeRepo from "./src/repositories/employee.repository.js"

async function seed() {
  await connectDB()
  await loadCache()

  const empId = "NV009"
  const employee = EmployeeRepo.getById(empId)

  if (!employee) {
    console.error("Không tìm thấy nhân viên NV009 (Nhân)")
    process.exit(1)
  }

  const existing = ProfileUpdateRequestRepo.getAll({ employeeId: empId })
  if (existing.length === 0) {
    const draftData = {
      ...employee,
      phone: "0999 888 999", 
      curStreet: "Số 1 Đường Mới",
      bankAccount: "123456789",
      bank: "Vietinbank"
    }

    const newReq = ProfileUpdateRequestRepo.create({
      employeeId: empId,
      status: "pending_approval",
      pendingData: draftData,
      submittedAt: new Date().toLocaleDateString("en-GB")
    })

    console.log("Đã tạo seed request:", newReq.id)
  } else {
    console.log("Đã có request cho NV009")
  }

  // Chờ chút để mongoose kịp lưu
  setTimeout(async () => {
    await disconnectDB()
    console.log("Xong!")
    process.exit(0)
  }, 1000)
}

seed()
