import * as repo from "../repositories/attendance.repository.js"
import * as empRepo from "../repositories/employee.repository.js"

function withEmployee(record) {
  const emp = empRepo.getById(record.employeeId)
  return {
    ...record,
    employeeName: emp?.name ?? "—",
    department: emp?.department ?? "—",
  }
}

export function listAttendance(filter) {
  let records = repo.getAll(filter)
  if (filter.department) {
    records = records.filter(r => {
      const emp = empRepo.getById(r.employeeId)
      return emp?.department === filter.department
    })
  }
  return records.map(withEmployee)
}

export function getAttendanceStats(filter = {}) {
  const records = repo.getAll(filter)
  return {
    onTime: records.filter(r => r.status === "on-time").length,
    late: records.filter(r => r.status === "late").length,
    absent: records.filter(r => r.status === "absent").length,
    leave: records.filter(r => r.status === "leave").length,
    total: records.length
  }
}

export function getAttendance(id) {
  const record = repo.getById(id)
  if (!record) return null
  return withEmployee(record)
}

export function createAttendance(data) {
  const existing = repo.findByEmployeeAndDate(data.employeeId, data.date)
  if (existing) return { error: "Đã có bản ghi chấm công cho nhân viên này hôm nay", status: 409 }

  const count = repo.count()
  const record = repo.create({
    id: `ATT${String(count + 1).padStart(3, "0")}`,
    employeeId: data.employeeId,
    checkIn: data.checkIn || "--",
    checkOut: data.checkOut || "--",
    date: data.date,
    status: data.status || "on-time",
    note: data.note || ""
  })

  return withEmployee(record)
}

export function updateAttendance(id, patch) {
  const ALLOWED = ["checkIn", "checkOut", "status", "note"]
  const safe = Object.fromEntries(Object.entries(patch).filter(([k]) => ALLOWED.includes(k)))
  const record = repo.update(id, safe)
  if (!record) return null
  return withEmployee(record)
}

export function deleteAttendance(id) {
  return repo.remove(id)
}
