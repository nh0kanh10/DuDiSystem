import * as repo from "../repositories/request.repository.js"
import * as empRepo from "../repositories/employee.repository.js"
import { expandRequestToSlots, findSlotConflict } from "../utils/leaveRequestSlots.js"
import { notifyRequestApproved, notifyRequestRejected, notifyRequestUpdated } from "../utils/requestNotifications.js"

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

function isWeekend(dateStr) {
  const d = parseVnDate(dateStr)
  if (!d) return false
  const day = d.getDay()
  return day === 0 || day === 6
}


const VALID_SCOPES = ["full_day", "date_range", "half_session", "multi_session"]
const VALID_SESSIONS = ["sang", "chieu"]
const VALID_CATEGORIES = ["leave", "timeoff"]
const VALID_LEAVE_TYPES = ["annual", "sick", "personal", "unpaid", "timeoff"]

function validateCreateData(data, options = {}) {
  const skipPastDate = options.skipPastDate === true
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
      if (!skipPastDate && isDateInPast(data.startDate)) return "Không thể đăng ký ngày đã qua"
      if (isWeekend(data.startDate)) return "Không thể xin nghỉ vào Thứ Bảy, Chủ Nhật"
      break
    case "date_range":
      if (!data.startDate || !data.endDate) return "Vui lòng chọn đủ ngày bắt đầu và kết thúc"
      if (parseVnDate(data.endDate) < parseVnDate(data.startDate)) return "Ngày kết thúc phải sau ngày bắt đầu"
      if (!skipPastDate && isDateInPast(data.startDate)) return "Không thể đăng ký ngày đã qua"
      break
    case "half_session":
      if (!data.startDate) return "Vui lòng chọn ngày nghỉ"
      if (!VALID_SESSIONS.includes(data.session)) return "Vui lòng chọn buổi sáng hoặc chiều"
      if (!skipPastDate && isDateInPast(data.startDate)) return "Không thể đăng ký ngày đã qua"
      if (isWeekend(data.startDate)) return "Không thể xin nghỉ vào Thứ Bảy, Chủ Nhật"
      break
    case "multi_session": {
      const sessions = data.sessions
      if (!Array.isArray(sessions) || sessions.length === 0) return "Vui lòng chọn ít nhất một buổi nghỉ"
      for (const slot of sessions) {
        if (!slot.date || !VALID_SESSIONS.includes(slot.session)) return "Dữ liệu buổi nghỉ không hợp lệ"
        if (!skipPastDate && isDateInPast(slot.date)) return "Không thể chọn buổi đã qua"
        if (isWeekend(slot.date)) return `Không thể xin nghỉ vào Thứ Bảy, Chủ Nhật (${slot.date})`
      }
      break
    }
    default:
      return "Hình thức nghỉ không hợp lệ"
  }

  const slots = expandRequestToSlots(data)
  if (slots.length === 0) return "Khoảng thời gian chọn không có ngày làm việc nào"

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
  // Giữ đơn pending quá hạn để admin vẫn duyệt được (UI gắn nhãn "Quá hạn").
  // Nhân viên có thể hủy thủ công hoặc nộp đơn mới cho cùng buổi (rejected/cancelled không chặn).
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

export function createRequest(data, options = {}) {
  const emp = empRepo.getById(data.employeeId)
  if (!emp) return { error: "Không tìm thấy nhân viên", status: 400 }

  const err = validateCreateData(data, { skipPastDate: options.isAdmin === true })
  if (err) return { error: err, status: 400 }

  const normalized = normalizeCreateData(data)
  const newSlots = expandRequestToSlots(normalized)
  const conflict = findSlotConflict(normalized.employeeId, newSlots, repo.getAll())
  if (conflict) {
    const sessionLabel = conflict.slot.session === "sang" ? "sáng" : "chiều"
    return {
      error: `Đã có đơn ${conflict.existing.status === "approved" ? "đã duyệt" : "chờ duyệt"} (${conflict.existing.id}) trùng ${conflict.slot.date} buổi ${sessionLabel}`,
      status: 409,
    }
  }

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
  const updated = withEmployee(repo.update(id, { status: "approved" }))
  notifyRequestApproved(updated)
  return updated
}

export function rejectRequest(id) {
  const req = repo.getById(id)
  if (!req) return null
  if (req.status !== "pending") return { error: "Chỉ từ chối được đơn đang chờ xử lý", status: 400 }
  const updated = withEmployee(repo.update(id, { status: "rejected" }))
  notifyRequestRejected(updated)
  return updated
}

export function updateRequest(id, data, options = {}) {
  const existing = repo.getById(id)
  if (!existing) return null
  if (existing.status !== "pending") {
    return { error: "Chỉ sửa được đơn đang chờ duyệt", status: 400 }
  }

  const merged = {
    employeeId: existing.employeeId,
    category: existing.category,
    leaveType: existing.leaveType,
    scope: existing.scope,
    reason: data.reason !== undefined ? String(data.reason).trim() : existing.reason,
    startDate: data.startDate !== undefined ? data.startDate : existing.startDate,
    endDate: data.endDate !== undefined ? data.endDate : existing.endDate,
    session: data.session !== undefined ? data.session : existing.session,
    sessions: data.sessions !== undefined ? data.sessions : existing.sessions,
  }

  const err = validateCreateData(merged, { skipPastDate: options.adminEdit === true })
  if (err) return { error: err, status: 400 }

  const normalized = normalizeCreateData(merged)
  const newSlots = expandRequestToSlots(normalized)
  const conflict = findSlotConflict(normalized.employeeId, newSlots, repo.getAll(), id)
  if (conflict) {
    const sessionLabel = conflict.slot.session === "sang" ? "sáng" : "chiều"
    return {
      error: `Trùng ${conflict.slot.date} buổi ${sessionLabel} với đơn ${conflict.existing.id}`,
      status: 409,
    }
  }

  const patch = { ...normalized }
  if (existing.scope !== "date_range") delete patch.endDate
  if (existing.scope !== "half_session") delete patch.session
  if (existing.scope !== "multi_session") delete patch.sessions
  if (existing.scope === "date_range" && !patch.endDate) patch.endDate = patch.startDate

  const updated = withEmployee(repo.update(id, patch))
  notifyRequestUpdated(updated, existing)
  return updated
}

export function approveRequestsBulk(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { error: "Danh sách đơn trống", status: 400 }
  }
  const approved = []
  const failed = []
  for (const id of ids) {
    const result = approveRequest(id)
    if (!result) failed.push({ id, error: "Không tìm thấy đơn" })
    else if (result.error) failed.push({ id, error: result.error })
    else approved.push(result)
  }
  return { approved, failed, count: approved.length }
}

export function cancelRequest(id, employeeId) {
  const req = repo.getById(id)
  if (!req) return null
  if (req.status !== "pending") return { error: "Chỉ hủy được đơn đang chờ duyệt", status: 400 }
  if (employeeId && req.employeeId !== employeeId) return { error: "Không có quyền hủy đơn này", status: 403 }
  return withEmployee(repo.update(id, { status: "cancelled" }))
}

export function deleteRequest(id) {
  const req = repo.getById(id)
  if (!req) return null
  if (req.status === "approved") return { error: "Không thể xóa đơn đã được duyệt", status: 400 }
  return repo.remove(id)
}
