import type { Employee } from "../../types"
import { isInternEmployee } from "../cham-cong/attendanceModel"

export type LeaveScope = "full_day" | "date_range" | "half_session" | "multi_session"
export type LeaveSession = "sang" | "chieu"
export type LeaveCategory = "leave" | "timeoff"
export type LeaveType = "annual" | "sick" | "personal" | "unpaid" | "timeoff"
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled"

export interface LeaveSessionSlot {
  date: string
  session: LeaveSession
}

export interface LeaveRequestRecord {
  id: string
  employeeId: string
  employeeName?: string
  department?: string
  category: LeaveCategory
  leaveType: LeaveType
  scope: LeaveScope
  startDate: string
  endDate?: string
  session?: LeaveSession
  sessions?: LeaveSessionSlot[]
  reason: string
  status: LeaveStatus
  submittedAt: string
}

export const LEAVE_SCOPE = {
  full_day: { label: "Cả ngày", short: "Cả ngày" },
  date_range: { label: "Nhiều ngày", short: "Nhiều ngày" },
  half_session: { label: "Một buổi", short: "Một buổi" },
  multi_session: { label: "Chọn lưới buổi", short: "Nhiều buổi" },
} as const

export const LEAVE_SESSION = {
  sang: { label: "Buổi sáng", short: "Sáng", color: "text-emerald-600" },
  chieu: { label: "Buổi chiều", short: "Chiều", color: "text-orange-600" },
} as const

export const LEAVE_TYPE = {
  annual: { label: "Nghỉ phép năm", category: "leave" as const },
  sick: { label: "Nghỉ ốm", category: "leave" as const },
  personal: { label: "Việc cá nhân", category: "leave" as const },
  unpaid: { label: "Nghỉ không lương", category: "leave" as const },
  timeoff: { label: "Time off bù tăng ca", category: "timeoff" as const },
} as const

export const LEAVE_STATUS = {
  pending: { label: "Chờ duyệt", bg: "bg-amber-100", color: "text-amber-700" },
  approved: { label: "Đã duyệt", bg: "bg-green-100", color: "text-green-700" },
  rejected: { label: "Từ chối", bg: "bg-red-100", color: "text-red-700" },
  cancelled: { label: "Đã hủy", bg: "bg-gray-100", color: "text-gray-500" },
} as const

export function parseVnDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split("/").map(Number)
  return new Date(year, month - 1, day)
}

export function formatVnDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
}

export function getWeekdayDateRange(startStr: string, endStr: string): Date[] {
  const start = parseVnDate(startStr)
  const end = parseVnDate(endStr)
  const dates: Date[] = []
  const current = new Date(start)
  while (current <= end) {
    if (!isWeekend(current)) dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export function expandRequestToSlots(req: Pick<LeaveRequestRecord, "scope" | "startDate" | "endDate" | "session" | "sessions">): { date: Date; session: LeaveSession }[] {
  const result: { date: Date; session: LeaveSession }[] = []
  switch (req.scope) {
    case "full_day":
      result.push(
        { date: parseVnDate(req.startDate), session: "sang" },
        { date: parseVnDate(req.startDate), session: "chieu" },
      )
      break
    case "date_range": {
      const end = req.endDate ?? req.startDate
      for (const d of getWeekdayDateRange(req.startDate, end)) {
        result.push({ date: d, session: "sang" }, { date: d, session: "chieu" })
      }
      break
    }
    case "half_session":
      if (req.session) {
        result.push({ date: parseVnDate(req.startDate), session: req.session })
      }
      break
    case "multi_session":
      for (const slot of req.sessions ?? []) {
        result.push({ date: parseVnDate(slot.date), session: slot.session })
      }
      break
  }
  return result
}

export function getRequestEarliestDate(req: LeaveRequestRecord): Date | null {
  const slots = expandRequestToSlots(req)
  if (slots.length === 0) {
    try {
      return parseVnDate(req.startDate)
    } catch {
      return null
    }
  }
  return slots.reduce((min, s) => (s.date < min ? s.date : min), slots[0].date)
}

export function isRequestExpired(req: LeaveRequestRecord): boolean {
  if (req.status !== "pending") return false
  const earliest = getRequestEarliestDate(req)
  if (!earliest) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  earliest.setHours(0, 0, 0, 0)
  return earliest < today
}

export function requestCoversDate(req: LeaveRequestRecord, filterDate: Date): boolean {
  return expandRequestToSlots(req).some(s => {
    return (
      s.date.getDate() === filterDate.getDate() &&
      s.date.getMonth() === filterDate.getMonth() &&
      s.date.getFullYear() === filterDate.getFullYear()
    )
  })
}

export function formatRequestTimeSummary(req: LeaveRequestRecord): string {
  switch (req.scope) {
    case "full_day":
      return req.startDate
    case "date_range":
      return `${req.startDate} → ${req.endDate ?? req.startDate}`
    case "half_session":
      return `${req.startDate} · ${LEAVE_SESSION[req.session ?? "sang"].short}`
    case "multi_session": {
      const count = req.sessions?.length ?? 0
      if (count === 0) return req.startDate
      if (count <= 3) {
        return (req.sessions ?? [])
          .map(s => `${s.date} (${LEAVE_SESSION[s.session].short})`)
          .join(", ")
      }
      return `${count} buổi · từ ${req.startDate}`
    }
    default:
      return req.startDate
  }
}

export function getScopeSessionLabel(req: LeaveRequestRecord): string {
  switch (req.scope) {
    case "full_day":
      return "Cả ngày"
    case "date_range":
      return "Nhiều ngày"
    case "half_session":
      return req.session === "sang" ? "Ca sáng" : "Ca chiều"
    case "multi_session":
      return `${req.sessions?.length ?? 0} buổi`
    default:
      return "—"
  }
}

export function scopesForEmployee(emp: Pick<Employee, "contractType">): LeaveScope[] {
  if (isInternEmployee(emp)) {
    return ["half_session", "full_day", "multi_session"]
  }
  return ["full_day", "date_range", "half_session"]
}

export function leaveTypesForEmployee(emp: Pick<Employee, "contractType">, category: LeaveCategory): LeaveType[] {
  if (category === "timeoff") return ["timeoff"]
  if (isInternEmployee(emp)) return ["personal", "sick", "unpaid"]
  return ["annual", "sick", "personal", "unpaid"]
}

export function isDateInPast(dateStr: string): boolean {
  const d = parseVnDate(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d < today
}

export interface LeaveFormState {
  category: LeaveCategory
  leaveType: LeaveType
  scope: LeaveScope
  startDate: string
  endDate: string
  session: LeaveSession
  sessions: LeaveSessionSlot[]
  reason: string
}

export function createLeaveForm(emp: Pick<Employee, "contractType">): LeaveFormState {
  const intern = isInternEmployee(emp)
  return {
    category: "leave",
    leaveType: intern ? "personal" : "annual",
    scope: intern ? "multi_session" : "full_day",
    startDate: "",
    endDate: "",
    session: "sang",
    sessions: [],
    reason: "",
  }
}

export function validateLeaveForm(form: LeaveFormState): string | null {
  if (!form.reason.trim()) return "Vui lòng nhập lý do"
  switch (form.scope) {
    case "full_day":
      if (!form.startDate) return "Vui lòng chọn ngày nghỉ"
      if (isDateInPast(form.startDate)) return "Không thể đăng ký ngày đã qua"
      break
    case "date_range":
      if (!form.startDate || !form.endDate) return "Vui lòng chọn đủ ngày bắt đầu và kết thúc"
      if (parseVnDate(form.endDate) < parseVnDate(form.startDate)) return "Ngày kết thúc phải sau ngày bắt đầu"
      if (isDateInPast(form.startDate)) return "Không thể đăng ký ngày đã qua"
      break
    case "half_session":
      if (!form.startDate) return "Vui lòng chọn ngày nghỉ"
      if (isDateInPast(form.startDate)) return "Không thể đăng ký ngày đã qua"
      break
    case "multi_session":
      if (form.sessions.length === 0) return "Vui lòng chọn ít nhất một buổi nghỉ"
      if (form.sessions.some(s => isDateInPast(s.date))) return "Không thể chọn buổi đã qua"
      break
  }
  return null
}

export function buildCreatePayload(employeeId: string, form: LeaveFormState) {
  const base = {
    employeeId,
    category: form.category,
    leaveType: form.leaveType,
    scope: form.scope,
    reason: form.reason.trim(),
  }
  switch (form.scope) {
    case "full_day":
      return { ...base, startDate: form.startDate }
    case "date_range":
      return { ...base, startDate: form.startDate, endDate: form.endDate }
    case "half_session":
      return { ...base, startDate: form.startDate, session: form.session }
    case "multi_session": {
      const sorted = [...form.sessions].sort((a, b) => parseVnDate(a.date).getTime() - parseVnDate(b.date).getTime())
      return { ...base, startDate: sorted[0].date, sessions: sorted }
    }
  }
}

export function countLeaveDays(req: LeaveRequestRecord): number {
  switch (req.scope) {
    case "full_day":
      return 1
    case "date_range":
      return getWeekdayDateRange(req.startDate, req.endDate ?? req.startDate).length
    case "half_session":
      return 0.5
    case "multi_session":
      return (req.sessions?.length ?? 0) * 0.5
    default:
      return 0
  }
}

export function isActiveLeaveRequest(req: LeaveRequestRecord): boolean {
  return req.status === "pending" || req.status === "approved"
}

export function expandFormToSlots(form: LeaveFormState): LeaveSessionSlot[] {
  const mock = buildCreatePayload("", form) as LeaveRequestRecord
  return expandRequestToSlots(mock).map(s => ({
    date: `${String(s.date.getDate()).padStart(2, "0")}/${String(s.date.getMonth() + 1).padStart(2, "0")}/${s.date.getFullYear()}`,
    session: s.session,
  }))
}

export function findSlotConflict(
  newSlots: LeaveSessionSlot[],
  requests: LeaveRequestRecord[],
  excludeId?: string | null,
): { slot: LeaveSessionSlot; existing: LeaveRequestRecord } | null {
  const occupied = new Map<string, LeaveRequestRecord>()
  for (const req of requests) {
    if (excludeId && req.id === excludeId) continue
    if (!isActiveLeaveRequest(req)) continue
    for (const slot of expandRequestToSlots(req)) {
      const dateStr = `${String(slot.date.getDate()).padStart(2, "0")}/${String(slot.date.getMonth() + 1).padStart(2, "0")}/${slot.date.getFullYear()}`
      occupied.set(`${dateStr}|${slot.session}`, req)
    }
  }
  for (const slot of newSlots) {
    const key = `${slot.date}|${slot.session}`
    const existing = occupied.get(key)
    if (existing) return { slot, existing }
  }
  return null
}
