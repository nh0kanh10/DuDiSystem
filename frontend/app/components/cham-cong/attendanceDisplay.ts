import type { AttendanceRecord } from "../../types"
import { INTERN_SESSION, isInternRecord } from "./attendanceModel"

export const ATT_STATUS_STYLE: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  "on-time": { label: "Đúng giờ", bg: "bg-green-100 dark:bg-green-500/15", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  late: { label: "Đi trễ", bg: "bg-orange-100 dark:bg-orange-500/15", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
  early: { label: "Về sớm", bg: "bg-amber-100 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  late_early: { label: "Vào trễ, ra sớm", bg: "bg-orange-100 dark:bg-orange-500/15", text: "text-orange-800 dark:text-orange-400", dot: "bg-orange-600" },
  absent: { label: "Vắng", bg: "bg-red-100 dark:bg-red-500/15", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
  leave: { label: "Nghỉ phép", bg: "bg-violet-100 dark:bg-violet-500/15", text: "text-violet-700 dark:text-violet-400", dot: "bg-violet-500" },
}

const VN_DAYS = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"]

export function fmtIsoDate(iso: string) {
  if (!iso) return "--"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

export function weekdayFromIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return VN_DAYS[new Date(y, m - 1, d).getDay()]
}

export function formatAttendanceTimes(r: AttendanceRecord) {
  if (isInternRecord(r)) {
    const am = `${r.checkInAm ?? "--"} → ${r.checkOutAm ?? "--"}`
    const pm = `${r.checkInPm ?? "--"} → ${r.checkOutPm ?? "--"}`
    return {
      primary: am,
      secondary: pm,
      combined: `${INTERN_SESSION.am.short}: ${am} | ${INTERN_SESSION.pm.short}: ${pm}`,
    }
  }
  return {
    primary: r.checkIn ?? "--",
    secondary: r.checkOut ?? "--",
    combined: `${r.checkIn ?? "--"} → ${r.checkOut ?? "--"}`,
  }
}

export function formatDurationHms(raw: string): string {
  if (!raw || raw === "--") return "--"
  const str = raw.trim()
  let h = 0
  let m = 0
  let s = 0
  const gm = str.match(/(\d+)g/)
  const pm = str.match(/(\d+)p/)
  const sm = str.match(/(\d+)s/)
  if (gm) h = parseInt(gm[1], 10)
  if (pm) m = parseInt(pm[1], 10)
  if (sm) s = parseInt(sm[1], 10)
  if (!gm && !pm && !sm) return raw
  const totalSec = h * 3600 + m * 60 + s
  const rh = Math.floor(totalSec / 3600)
  const rm = Math.floor((totalSec % 3600) / 60)
  const rs = totalSec % 60
  const parts: string[] = []
  if (rh > 0) parts.push(`${rh}h`)
  if (rm > 0) parts.push(`${rm}p`)
  if (rs > 0) parts.push(`${rs}s`)
  return parts.length ? parts.join(" ") : "0s"
}

export function formatAttendanceNote(note: string): string {
  if (!note || note === "--") return "--"
  return note.replace(/\d+g\d*p\d*s?|\d+p\d*s?|\d+g\d*p|\d+p|\d+s/g, match => formatDurationHms(match))
}

export function formatCheckTime(t?: string): string {
  if (!t || t === "--") return "—"
  return t.length > 5 ? t.slice(0, 8) : t
}

export const ATT_STATUS_LABEL: Record<string, string> = {
  "on-time": "Đúng giờ",
  late: "Đi trễ",
  early: "Về sớm",
  late_early: "Vào trễ, ra sớm",
  absent: "Vắng",
  leave: "Nghỉ phép",
}

export function internPunchClass(status?: string, time?: string): string {
  if (!time || time === "--") return "text-gray-300"
  if (status === "late" || status === "late_early") return "text-orange-600 font-bold"
  if (status === "early") return "text-amber-600 font-bold"
  if (status === "absent" || status === "leave") return "text-gray-300"
  return "text-gray-700 font-bold"
}

export function recordMatchesStatusFilter(record: AttendanceRecord, filterStatus: string): boolean {
  if (filterStatus === "all") return true
  if (isInternRecord(record)) {
    return record.statusAm === filterStatus || record.statusPm === filterStatus
  }
  return record.status === filterStatus
}

export function internSessionStatusForRow(record: AttendanceRecord, session?: "am" | "pm"): string | undefined {
  if (session === "am") return record.statusAm
  if (session === "pm") return record.statusPm
  return record.status
}
