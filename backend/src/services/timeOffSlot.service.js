import * as repo from "../repositories/timeOffSlot.repository.js"
import { v4 as uuidv4 } from "uuid"

export function listSlots(filter = {}) {
  return repo.getAll(filter)
}

export function createSlot(data) {
  const newItem = {
    id: `S-${Date.now()}-${uuidv4().substring(0, 4)}`,
    empId: data.empId || "",
    empName: data.empName || "",
    empCode: data.empCode || "",
    department: data.department || "",
    day: data.day != null ? Number(data.day) : 1,
    session: data.session || "sang",
    reason: data.reason || "",
    status: data.status || "pending",
    week: data.week || "",
    registeredAt: data.registeredAt || new Date().toLocaleDateString("vi-VN"),
    adminNote: data.adminNote || "",
    processedAt: data.processedAt || "",
  }
  return repo.create(newItem)
}

export function approveSlot(id, note = "") {
  const slot = repo.getById(id)
  if (!slot) throw new Error("Không tìm thấy ca đăng ký nghỉ")
  return repo.update(id, {
    status: "approved",
    adminNote: note || "Đã duyệt",
    processedAt: new Date().toLocaleString("vi-VN"),
  })
}

export function rejectSlot(id, note = "") {
  const slot = repo.getById(id)
  if (!slot) throw new Error("Không tìm thấy ca đăng ký nghỉ")
  return repo.update(id, {
    status: "rejected",
    adminNote: note || "Từ chối",
    processedAt: new Date().toLocaleString("vi-VN"),
  })
}

export function approveAllSlots(week) {
  if (!week) throw new Error("Vui lòng cung cấp tuần (week)")
  repo.updateStatusMany(
    { week, status: "pending" },
    {
      status: "approved",
      adminNote: "Duyệt hàng loạt",
      processedAt: new Date().toLocaleString("vi-VN"),
    }
  )
  return { success: true }
}
