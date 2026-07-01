import { useState, useEffect, useCallback, useMemo } from "react"
import { api } from "@/lib/api"
import type { AttendanceRecord } from "../types"

function pad(n: number) {
  return String(n).padStart(2, "0")
}

export function todayISO() {
  return new Date().toISOString().split("T")[0]
}

export function formatTimeNow() {
  const n = new Date()
  return `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`
}

function hasTime(v?: string) {
  return !!v && v !== "--"
}

export function isInternDone(r: AttendanceRecord | null) {
  if (!r) return false
  const cia = hasTime(r.checkInAm)
  const coa = hasTime(r.checkOutAm)
  const cip = hasTime(r.checkInPm)
  const cop = hasTime(r.checkOutPm)
  if (cia && coa && cip && cop) return true
  if (cia && coa && !cip && !cop) return true
  if (!cia && !coa && cip && cop) return true
  if (cia && cop && (r.autoFilled || (coa && cip))) return true
  return false
}

export function isStaffDone(r: AttendanceRecord | null) {
  if (!r) return false
  return hasTime(r.checkIn) && hasTime(r.checkOut)
}

export function getPunchLabel(r: AttendanceRecord | null, isIntern: boolean) {
  if (isIntern) {
    if (isInternDone(r)) return { label: "Hoàn thành", done: true as const }
    const cia = hasTime(r?.checkInAm)
    const coa = hasTime(r?.checkOutAm)
    const cip = hasTime(r?.checkInPm)
    if (!cia && !cip) return { label: "Vào làm", done: false as const }
    if (cia && !coa && !cip) return { label: "Chấm tiếp", done: false as const }
    if (cia && coa && !cip) return { label: "Vào chiều", done: false as const }
    if (cip && !hasTime(r?.checkOutPm)) return { label: "Tan ca", done: false as const }
    return { label: "Chấm tiếp", done: false as const }
  }
  if (isStaffDone(r)) return { label: "Hoàn thành", done: true as const }
  if (!r || !hasTime(r.checkIn)) return { label: "Check-in", done: false as const }
  return { label: "Check-out", done: false as const }
}

export function getTodayStatusText(r: AttendanceRecord | null, isIntern: boolean) {
  const punch = getPunchLabel(r, isIntern)
  if (punch.done) return "Đã kết thúc ca hôm nay"
  if (isIntern) {
    if (!r || (!hasTime(r.checkInAm) && !hasTime(r.checkInPm))) return "Chưa chấm công"
    return "Đang làm việc"
  }
  if (!r || !hasTime(r.checkIn)) return "Chưa chấm công"
  if (!hasTime(r.checkOut)) return "Đang làm việc"
  return "Đã kết thúc ca hôm nay"
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem("dudi_user")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function useEmployeeAttendance() {
  const [employeeId, setEmployeeId] = useState("")
  const [employeeName, setEmployeeName] = useState("")
  const [isIntern, setIsIntern] = useState(false)
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [monthStats, setMonthStats] = useState({ onTime: 0, late: 0, absent: 0, leave: 0 })
  const [loading, setLoading] = useState(true)
  const [punching, setPunching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = todayISO()
  const monthStart = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let profile = readStoredUser()
      try {
        profile = await api.auth.me()
        localStorage.setItem("dudi_user", JSON.stringify(profile))
      } catch {
        /* use cached profile */
      }
      const empId = profile?.employeeId as string
      if (!empId) throw new Error("Không tìm thấy mã nhân viên trên tài khoản")
      setEmployeeId(empId)
      setEmployeeName((profile?.name as string) || empId)
      setIsIntern(profile?.employeeStatus === "intern")

      const [todayRows, monthRows, stats] = await Promise.all([
        api.attendance.list({ startDate: today, endDate: today, employeeId: empId }),
        api.attendance.list({ startDate: monthStart, endDate: today, employeeId: empId }),
        api.attendance.stats({ startDate: monthStart, endDate: today, employeeId: empId }),
      ])
      const todayList = todayRows as AttendanceRecord[]
      setTodayRecord(todayList[0] ?? null)
      setHistory(
        (monthRows as AttendanceRecord[])
          .filter(r => r.date !== today)
          .sort((a, b) => b.date.localeCompare(a.date))
      )
      setMonthStats(stats)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải chấm công")
    } finally {
      setLoading(false)
    }
  }, [today, monthStart])

  useEffect(() => {
    load()
  }, [load])

  const punch = useCallback(async () => {
    if (!employeeId) return
    const punchInfo = getPunchLabel(todayRecord, isIntern)
    if (punchInfo.done) return

    setPunching(true)
    setError(null)
    try {
      await api.attendance.checkIP()
      const time = formatTimeNow()
      const recordId = todayRecord?.id ?? `TEMP_${employeeId}_${today}`
      const body: Record<string, string> = isIntern
        ? { checkIn: time }
        : hasTime(todayRecord?.checkIn) && !hasTime(todayRecord?.checkOut)
          ? { checkOut: time }
          : { checkIn: time }

      const updated = (await api.attendance.update(recordId, body)) as AttendanceRecord
      setTodayRecord(updated)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chấm công thất bại")
    } finally {
      setPunching(false)
    }
  }, [employeeId, isIntern, today, todayRecord, load])

  const punchLabel = getPunchLabel(todayRecord, isIntern)
  const statusText = getTodayStatusText(todayRecord, isIntern)

  return {
    employeeId,
    employeeName,
    isIntern,
    todayRecord,
    history,
    monthStats,
    loading,
    punching,
    error,
    punch,
    punchLabel,
    statusText,
    reload: load,
  }
}
