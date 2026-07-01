import type { AttendanceRecord } from "../../types"

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
  if (r.employeeStatus === "intern") {
    const am = `${r.checkInAm ?? "--"} → ${r.checkOutAm ?? "--"}`
    const pm = `${r.checkInPm ?? "--"} → ${r.checkOutPm ?? "--"}`
    return { primary: am, secondary: pm, combined: `S: ${am} | C: ${pm}` }
  }
  return {
    primary: r.checkIn ?? "--",
    secondary: r.checkOut ?? "--",
    combined: `${r.checkIn ?? "--"} → ${r.checkOut ?? "--"}`,
  }
}

export const ATT_STATUS_LABEL: Record<string, string> = {
  "on-time": "Đúng giờ",
  late: "Đi trễ",
  early: "Về sớm",
  late_early: "Trễ & sớm",
  absent: "Vắng",
  leave: "Nghỉ phép",
}
