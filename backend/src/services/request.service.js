import * as repo from "../repositories/request.repository.js"
import * as empRepo from "../repositories/employee.repository.js"

function withEmployee(req) {
  const emp = empRepo.getById(req.employeeId)
  return {
    ...req,
    employeeName: emp?.name ?? "—",
    department: emp?.department ?? "—",
  }
}

export function listRequests(filter) {
  return repo.getAll(filter).map(withEmployee)
}

export function getRequest(id) {
  const req = repo.getById(id)
  if (!req) return null
  return withEmployee(req)
}

export function createRequest(data) {
  const { employeeId, leaveType, category, startDate } = data
  const prefix = category === "timeoff" ? "TO" : "XN"
  const count = repo.countByPrefix(prefix)
  const newId = `${prefix}${String(count + 1).padStart(3, "0")}`

  const request = repo.create({
    id: newId,
    employeeId,
    leaveType,
    category: category || "leave",
    startDate,
    endDate: data.endDate || startDate,
    reason: data.reason || "",
    status: "pending",
    submittedAt: new Date().toLocaleDateString("vi-VN")
  })

  return withEmployee(request)
}

export function approveRequest(id) {
  const req = repo.getById(id)
  if (!req) return null
  if (req.status !== "pending") return { error: "Chỉ duyệt được đơn đang chờ xử lý", status: 400 }
  return withEmployee(repo.update(id, { status: "approved" }))
}

export function rejectRequest(id) {
  const req = repo.getById(id)
  if (!req) return null
  if (req.status !== "pending") return { error: "Chỉ từ chối được đơn đang chờ xử lý", status: 400 }
  return withEmployee(repo.update(id, { status: "rejected" }))
}

export function deleteRequest(id) {
  return repo.remove(id)
}
