import * as repo from "../repositories/request.repository.js"
import * as empRepo from "../repositories/employee.repository.js"

function getNowFormatted() {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, "0")
  const mm = String(now.getMinutes()).padStart(2, "0")
  const dd = String(now.getDate()).padStart(2, "0")
  const mth = String(now.getMonth() + 1).padStart(2, "0")
  const yyyy = now.getFullYear()
  return `${hh}:${mm} ${dd}/${mth}/${yyyy}`
}

function parseVnDate(str) {
  if (!str) return null
  const datePart = str.includes(" ") ? str.split(" ")[1] : str
  const parts = datePart.split("/")
  if (parts.length !== 3) return null
  const d = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  const y = parseInt(parts[2], 10)
  if (Number.isNaN(d) || Number.isNaN(m) || Number.isNaN(y)) return null
  return new Date(y, m - 1, d)
}

function isDateInPast(dateStr) {
  const d = parseVnDate(dateStr)
  if (!d) return true
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d < today
}

const VALID_SCOPES = ["full_day", "date_range", "half_session", "multi_session"]
const VALID_SESSIONS = ["sang", "chieu"]
const VALID_CATEGORIES = ["leave", "timeoff"]
const VALID_LEAVE_TYPES = ["annual", "sick", "personal", "unpaid", "timeoff"]

function validateCreateData(data) {
  const { employeeId, category, scope, reason } = data
  if (!employeeId) return "Thiếu mã nhân viên"
  if (!VALID_CATEGORIES.includes(category)) return "Loại đơn không hợp lệ"
  if (!VALID_SCOPES.includes(scope)) return "Hình thức nghỉ không hợp lệ"
  if (!reason || !String(reason).trim()) return "Vui lòng nhập lý do"

  const leaveType = data.leaveType || (category === "timeoff" ? "timeoff" : "annual")
  if (!VALID_LEAVE_TYPES.includes(leaveType)) return "Loại nghỉ không hợp lệ"
  if (category === "timeoff" && leaveType !== "timeoff") return "Time off phải dùng loại timeoff"
  if (category === "leave" && leaveType === "timeoff") return "Đơn nghỉ phép không dùng loại timeoff"

  switch (scope) {
    case "full_day":
      if (!data.startDate) return "Vui lòng chọn ngày nghỉ"
      if (isDateInPast(data.startDate)) return "Không thể đăng ký ngày đã qua"
      break
    case "date_range":
      if (!data.startDate || !data.endDate) return "Vui lòng chọn đủ ngày bắt đầu và kết thúc"
      if (parseVnDate(data.endDate) < parseVnDate(data.startDate)) return "Ngày kết thúc phải sau ngày bắt đầu"
      if (isDateInPast(data.startDate)) return "Không thể đăng ký ngày đã qua"
      break
    case "half_session":
      if (!data.startDate) return "Vui lòng chọn ngày nghỉ"
      if (!VALID_SESSIONS.includes(data.session)) return "Vui lòng chọn buổi sáng hoặc chiều"
      if (isDateInPast(data.startDate)) return "Không thể đăng ký ngày đã qua"
      break
    case "multi_session": {
      const sessions = data.sessions
      if (!Array.isArray(sessions) || sessions.length === 0) return "Vui lòng chọn ít nhất một buổi nghỉ"
      for (const slot of sessions) {
        if (!slot.date || !VALID_SESSIONS.includes(slot.session)) return "Dữ liệu buổi nghỉ không hợp lệ"
        if (isDateInPast(slot.date)) return "Không thể chọn buổi đã qua"
      }
      break
    }
    default:
      return "Hình thức nghỉ không hợp lệ"
  }

  return null
}

function normalizeCreateData(data) {
  const scope = data.scope
  const category = data.category || "leave"
  const leaveType = data.leaveType || (category === "timeoff" ? "timeoff" : "annual")

  const base = {
    employeeId: data.employeeId,
    category,
    leaveType,
    scope,
    reason: String(data.reason).trim(),
  }

  switch (scope) {
    case "full_day":
      return { ...base, startDate: data.startDate }
    case "date_range":
      return { ...base, startDate: data.startDate, endDate: data.endDate }
    case "half_session":
      return { ...base, startDate: data.startDate, session: data.session }
    case "multi_session": {
      const sorted = [...data.sessions].sort((a, b) => parseVnDate(a.date) - parseVnDate(b.date))
      return { ...base, startDate: sorted[0].date, sessions: sorted }
    }
    default:
      return base
  }
}

function getEarliestDate(req) {
  if (req.scope === "multi_session" && Array.isArray(req.sessions) && req.sessions.length > 0) {
    return parseVnDate(req.sessions[0].date)
  }
  return parseVnDate(req.startDate)
}

function autoCancelExpiredRequests() {
  const all = repo.getAll()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const req of all) {
    if (req.status === "pending") {
      try {
        const start = getEarliestDate(req)
        if (!start) continue
        start.setHours(0, 0, 0, 0)
        if (start < today) {
          repo.update(req.id, { status: "cancelled" })
        }
      } catch {
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
  let rows = repo.getAll(filter)
  if (filter.branchId && filter.branchId !== "all") {
    const employees = empRepo.getAll({ branchId: filter.branchId })
    const empIds = new Set(employees.map(e => e.id))
    rows = rows.filter(r => empIds.has(r.employeeId))
  }
  return rows.map(withEmployee)
}

export function getRequest(id) {
  autoCancelExpiredRequests()
  const req = repo.getById(id)
  if (!req) return null
  return withEmployee(req)
}

export function createRequest(data) {
  const emp = empRepo.getById(data.employeeId)
  if (!emp) return { error: "Không tìm thấy nhân viên", status: 400 }

  const err = validateCreateData(data)
  if (err) return { error: err, status: 400 }

  const normalized = normalizeCreateData(data)
  const prefix = normalized.category === "timeoff" ? "TO" : "XN"
  const count = repo.countByPrefix(prefix)
  const newId = `${prefix}${String(count + 1).padStart(5, "0")}`

  const request = repo.create({
    id: newId,
    ...normalized,
    status: "pending",
    submittedAt: getNowFormatted(),
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

export function cancelRequest(id, employeeId) {
  const req = repo.getById(id)
  if (!req) return null
  if (req.status !== "pending") return { error: "Chỉ hủy được đơn đang chờ duyệt", status: 400 }
  if (employeeId && req.employeeId !== employeeId) return { error: "Không có quyền hủy đơn này", status: 403 }
  return withEmployee(repo.update(id, { status: "cancelled" }))
}

export function deleteRequest(id) {
  return repo.remove(id)
}
