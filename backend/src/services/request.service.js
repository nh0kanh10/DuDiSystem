import * as repo from "../repositories/request.repository.js"
import * as empRepo from "../repositories/employee.repository.js"

function getNowFormatted() {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const mth = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = now.getFullYear()
  return `${hh}:${mm} ${dd}/${mth}/${yyyy}`
}

function parseVnDate(str) {
  if (!str) return new Date()
  const datePart = str.includes(" ") ? str.split(" ")[1] : str
  const parts = datePart.split("/")
  if (parts.length !== 3) return new Date()
  const d = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  const y = parseInt(parts[2], 10)
  return new Date(y, m - 1, d)
}

function autoCancelExpiredRequests() {
  const all = repo.getAll()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (const req of all) {
    if (req.status === "pending") {
      try {
        const end = parseVnDate(req.endDate)
        end.setHours(0, 0, 0, 0)
        if (end < today) {
          repo.update(req.id, { status: "cancelled" })
        }
      } catch (e) {
      }
    }
  }
}

function withEmployee(req) {
  const emp = empRepo.getById(req.employeeId)
  return {
    ...req,
    employeeName: emp?.name ?? "—",
    department: emp?.department ?? "—",
  }
}

export function listRequests(filter) {
  autoCancelExpiredRequests()
  return repo.getAll(filter).map(withEmployee)
}

export function getRequest(id) {
  autoCancelExpiredRequests()
  const req = repo.getById(id)
  if (!req) return null
  return withEmployee(req)
}

export function createRequest(data) {
  const { employeeId, category, startDate } = data
  const prefix = category === "timeoff" ? "TO" : "XN"
  const count = repo.countByPrefix(prefix)
  const newId = `${prefix}${String(count + 1).padStart(5, "0")}`

  const request = repo.create({
    id: newId,
    employeeId,
    category: category || "leave",
    startDate,
    endDate: data.endDate || startDate,
    reason: data.reason || "",
    status: "pending",
    session: data.session || "all",
    submittedAt: getNowFormatted()
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
