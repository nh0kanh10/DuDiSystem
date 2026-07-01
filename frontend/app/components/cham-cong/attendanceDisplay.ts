import type { AttendanceRecord } from "../../types"
import { INTERN_SESSION, isInternRecord } from "./attendanceModel"

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
  late_early: "Trễ & sớm",
  absent: "Vắng",
  leave: "Nghỉ phép",
}
