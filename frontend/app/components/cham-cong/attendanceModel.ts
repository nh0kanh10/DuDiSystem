import type { AttendanceRecord, Employee } from "../../types"

export const EMPTY_TIME = "--"

export type InternSession = "am" | "pm"
export type PunchKind = "in" | "out"

export const INTERN_SESSION = {
  am: { short: "S", label: "Buổi sáng" },
  pm: { short: "C", label: "Buổi chiều" },
} as const

export const EMPLOYEE_KIND = {
  intern: {
    label: "Thực tập",
    badge: "TT",
    badgeClass: "bg-purple-100 text-purple-700",
    filterLabel: "Thực tập (TT)",
  },
  staff: {
    label: "Chính thức",
    badge: "CT",
    badgeClass: "bg-blue-50 text-blue-700",
    filterLabel: "Chính thức (CT)",
  },
} as const

const INTERN_PUNCH_FIELDS = {
  "am-in": "checkInAm",
  "am-out": "checkOutAm",
  "pm-in": "checkInPm",
  "pm-out": "checkOutPm",
} as const satisfies Record<string, keyof AttendanceRecord>

const IN_ROW_CLASS = "text-emerald-700 bg-emerald-50/80"
const OUT_ROW_CLASS = "text-slate-600 bg-slate-50/90"

export type MonthTimeRow = {
  id: string
  session?: InternSession
  kind: PunchKind
  label: string
  labelClass: string
}

/** Classify staff vs intern from contract type only — never from employment status (active/inactive). */
export function isInternContractType(contractType?: string | null) {
  if (!contractType) return false
  const t = String(contractType).trim().toLowerCase()
  return t === "intern" || t === "thực tập" || t.startsWith("thực tập") || t === "thuc tap"
}

export function isInternStatus(status?: string) {
  return status === "intern"
}

export function isInternEmployee(emp: Pick<Employee, "contractType">) {
  return isInternContractType(emp.contractType)
}

export function isInternRecord(rec: Pick<AttendanceRecord, "employeeStatus">) {
  return isInternStatus(rec.employeeStatus)
}

export function employeeKindMeta(status?: string) {
  return isInternStatus(status) ? EMPLOYEE_KIND.intern : EMPLOYEE_KIND.staff
}

export function enrichAttendanceRecord(rec: AttendanceRecord, emp: Employee): AttendanceRecord {
  // Always prefer current contract type over stale attendance.employeeStatus
  return { ...rec, employeeStatus: isInternEmployee(emp) ? "intern" : "staff" }
}

export function monthRowsForEmployee(emp: Employee): MonthTimeRow[] {
  if (!isInternEmployee(emp)) {
    return [
      { id: "in", kind: "in", label: "Vào", labelClass: IN_ROW_CLASS },
      { id: "out", kind: "out", label: "Ra", labelClass: OUT_ROW_CLASS },
    ]
  }
  return (Object.keys(INTERN_SESSION) as InternSession[]).flatMap(session => {
    const short = INTERN_SESSION[session].short
    return [
      { id: `${session}-in`, session, kind: "in", label: `${short}·Vào`, labelClass: IN_ROW_CLASS },
      { id: `${session}-out`, session, kind: "out", label: `${short}·Ra`, labelClass: OUT_ROW_CLASS },
    ]
  })
}

export function getPunchFieldKey(row: MonthTimeRow): keyof AttendanceRecord | null {
  if (!row.session) return row.kind === "in" ? "checkIn" : "checkOut"
  const key = `${row.session}-${row.kind}` as keyof typeof INTERN_PUNCH_FIELDS
  return INTERN_PUNCH_FIELDS[key] ?? null
}

export function getPunchTime(rec: AttendanceRecord, row: MonthTimeRow): string | undefined {
  const field = getPunchFieldKey(row)
  if (!field) return undefined
  const value = rec[field]
  return typeof value === "string" ? value : undefined
}

export function sessionLabel(session?: InternSession) {
  if (!session) return ""
  return INTERN_SESSION[session].label
}

export function internLegendText() {
  return monthRowsForEmployee({ contractType: "intern" } as Employee).map(r => r.label).join(" / ")
}

export function emptyTimeFormValue(value?: string) {
  return !value || value === EMPTY_TIME ? "" : value
}

export function toApiTime(value: string) {
  return value || EMPTY_TIME
}

export function hasPunchTime(value?: string) {
  return !!value && value !== EMPTY_TIME
}

export function isInternDone(record: AttendanceRecord | null) {
  if (!record) return false
  const cia = hasPunchTime(record.checkInAm)
  const coa = hasPunchTime(record.checkOutAm)
  const cip = hasPunchTime(record.checkInPm)
  const cop = hasPunchTime(record.checkOutPm)
  if (cia && coa && cip && cop) return true
  if (cia && coa && !cip && !cop) return true
  if (!cia && !coa && cip && cop) return true
  if (cia && cop && (record.autoFilled || (coa && cip))) return true
  return false
}

export function isStaffDone(record: AttendanceRecord | null) {
  if (!record) return false
  return hasPunchTime(record.checkIn) && hasPunchTime(record.checkOut)
}

export function getPunchLabel(record: AttendanceRecord | null, intern: boolean) {
  if (intern) {
    if (isInternDone(record)) return { label: "Hoàn thành", done: true as const }
    const cia = hasPunchTime(record?.checkInAm)
    const coa = hasPunchTime(record?.checkOutAm)
    const cip = hasPunchTime(record?.checkInPm)
    if (!cia && !cip) return { label: "Vào làm", done: false as const }
    if (cia && !coa && !cip) return { label: "Chấm tiếp", done: false as const }
    if (cia && coa && !cip) return { label: "Vào chiều", done: false as const }
    if (cip && !hasPunchTime(record?.checkOutPm)) return { label: "Tan ca", done: false as const }
    return { label: "Chấm tiếp", done: false as const }
  }
  if (isStaffDone(record)) return { label: "Hoàn thành", done: true as const }
  if (!record || !hasPunchTime(record.checkIn)) return { label: "Check-in", done: false as const }
  return { label: "Check-out", done: false as const }
}

export function getTodayStatusText(record: AttendanceRecord | null, intern: boolean) {
  const punch = getPunchLabel(record, intern)
  if (punch.done) return "Đã kết thúc ca hôm nay"
  if (intern) {
    if (!record || (!hasPunchTime(record.checkInAm) && !hasPunchTime(record.checkInPm))) return "Chưa chấm công"
    return "Đang làm việc"
  }
  if (!record || !hasPunchTime(record.checkIn)) return "Chưa chấm công"
  if (!hasPunchTime(record.checkOut)) return "Đang làm việc"
  return "Đã kết thúc ca hôm nay"
}

export function internSessionRange(record: AttendanceRecord, session: InternSession) {
  const meta = INTERN_SESSION[session]
  const inTime = session === "am" ? record.checkInAm : record.checkInPm
  const outTime = session === "am" ? record.checkOutAm : record.checkOutPm
  return `${meta.short}: ${inTime ?? EMPTY_TIME} → ${outTime ?? EMPTY_TIME}`
}

export type AttendanceStatus = AttendanceRecord["status"]

export type AddAttendanceFormState = {
  employeeId: string
  checkIn: string
  checkOut: string
  checkInAm: string
  checkOutAm: string
  checkInPm: string
  checkOutPm: string
  status: AttendanceStatus
  note: string
}

export const INTERN_DEFAULT_TIMES = {
  checkInAm: "08:00",
  checkOutAm: "12:00",
  checkInPm: "13:00",
  checkOutPm: "17:00",
}

export const STAFF_DEFAULT_TIMES = {
  checkIn: "08:00",
  checkOut: "17:00",
}

export function createAddAttendanceForm(): AddAttendanceFormState {
  return {
    employeeId: "",
    ...STAFF_DEFAULT_TIMES,
    ...INTERN_DEFAULT_TIMES,
    status: "on-time",
    note: "",
  }
}
