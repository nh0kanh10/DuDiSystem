import { useState, useEffect, useCallback, useMemo } from "react"
import { api } from "@/lib/api"
import type { AttendanceRecord } from "../types"
import {
  getPunchLabel,
  getTodayStatusText,
  hasPunchTime,
  isInternStatus,
} from "../components/cham-cong/attendanceModel"

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

function readStoredUser() {
  try {
    const raw = localStorage.getItem("dudi_user")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export {
  getPunchLabel,
  getTodayStatusText,
  hasPunchTime,
  isInternDone,
  isStaffDone,
} from "../components/cham-cong/attendanceModel"

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
  const [ipStatus, setIpStatus] = useState<{ valid: boolean; ip: string; message: string } | null>(null)

  const verifyWifi = useCallback(async () => {
    try {
      const data = await api.attendance.checkIP()
      setIpStatus({ valid: true, ip: data.ip, message: data.message })
    } catch (e) {
      setIpStatus({
        valid: false,
        ip: "",
        message: e instanceof Error ? e.message : "Không xác thực được WiFi",
      })
    }
  }, [])

  const today = todayISO()
  const monthStart = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
  }, [])
  const historyStart = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
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
      }
      const empId = profile?.employeeId as string
      if (!empId) throw new Error("Không tìm thấy mã nhân viên trên tài khoản")
      const intern = isInternStatus(profile?.employeeStatus)
      setEmployeeId(empId)
      setEmployeeName((profile?.name as string) || empId)
      setIsIntern(intern)

      const [todayRows, historyRows, stats] = await Promise.all([
        api.attendance.list({ startDate: today, endDate: today, employeeId: empId }),
        api.attendance.list({ startDate: historyStart, endDate: today, employeeId: empId }),
        api.attendance.stats({ startDate: monthStart, endDate: today, employeeId: empId }),
      ])
      const todayList = todayRows as AttendanceRecord[]
      const todayMine =
        todayList.find(r => r.employeeId === empId) ??
        todayList.find(r => String(r.id).startsWith(`TEMP_${empId}_`)) ??
        todayList[0] ??
        null
      setTodayRecord(todayMine)
      setHistory(
        (historyRows as AttendanceRecord[])
          .filter(r => !String(r.id).startsWith("TEMP_"))
          .sort((a, b) => b.date.localeCompare(a.date))
      )
      setMonthStats(stats)
      await verifyWifi()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải chấm công")
    } finally {
      setLoading(false)
    }
  }, [today, monthStart, historyStart, verifyWifi])

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
      await verifyWifi()
      const time = formatTimeNow()
      const activeRecord = todayRecord?.employeeId === employeeId ? todayRecord : null
      const recordId = activeRecord?.id ?? `TEMP_${employeeId}_${today}`
      const body: Record<string, string> = isIntern
        ? { checkIn: time }
        : hasPunchTime(activeRecord?.checkIn) && !hasPunchTime(activeRecord?.checkOut)
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
  }, [employeeId, isIntern, today, todayRecord, load, verifyWifi])

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
    ipStatus,
    verifyWifi,
    punch,
    punchLabel,
    statusText,
    reload: load,
  }
}
