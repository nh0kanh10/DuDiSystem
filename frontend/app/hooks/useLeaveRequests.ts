import { useCallback, useEffect, useRef, useState } from "react"
import type { LeaveRequestRecord } from "../components/nghi-phep/leaveRequestModel"

// Mock data for testing without API
const mockRequests: LeaveRequestRecord[] = [
  {
    id: "XN00001",
    employeeId: "EMP001",
    employeeName: "Nguyễn Văn A",
    department: "IT Department",
    category: "leave",
    leaveType: "annual",
    leaveSubType: "none",
    scope: "full_day",
    startDate: "15/07/2026",
    reason: "Nghỉ phép năm cuối tuần",
    status: "approved",
    submittedAt: "08:30 14/07/2026"
  },
  {
    id: "XN00002",
    employeeId: "EMP001",
    employeeName: "Nguyễn Văn A",
    department: "IT Department",
    category: "leave",
    leaveType: "sick",
    leaveSubType: "sick_cert",
    scope: "half_session",
    startDate: "12/07/2026",
    session: "sang",
    reason: "Khám bệnh định kỳ tại bệnh viện",
    status: "pending",
    submittedAt: "09:15 11/07/2026"
  },
  {
    id: "XN00003",
    employeeId: "EMP001",
    employeeName: "Nguyễn Văn A",
    department: "IT Department",
    category: "leave",
    leaveType: "annual",
    leaveSubType: "none",
    scope: "multi_session",
    startDate: "16/07/2026",
    sessions: [
      { date: "16/07/2026", session: "sang" },
      { date: "17/07/2026", session: "chieu" },
      { date: "18/07/2026", session: "sang" }
    ],
    reason: "Nghỉ phép lẻ theo tuần để xử lý việc cá nhân",
    status: "pending",
    submittedAt: "14:20 10/07/2026"
  },
  {
    id: "XN00004",
    employeeId: "EMP001",
    employeeName: "Nguyễn Văn A",
    department: "IT Department",
    category: "leave",
    leaveType: "annual",
    leaveSubType: "none",
    scope: "date_range",
    startDate: "22/07/2026",
    endDate: "24/07/2026",
    reason: "Nghỉ phép du lịch gia đình",
    status: "approved",
    submittedAt: "16:45 20/07/2026"
  }
]

let mockIdCounter = 5

export function useLeaveRequests(employeeId?: string) {
  const [requests, setRequests] = useState<LeaveRequestRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadingRef = useRef(false)

  const load = useCallback(async () => {
    if (!employeeId) {
      setRequests([])
      setLoading(false)
      return
    }
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError(null)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      // Filter mock data by employeeId
      const data = mockRequests.filter(r => r.employeeId === employeeId)
      setRequests(data.sort((a, b) => {
        const ta = a.submittedAt ?? ""
        const tb = b.submittedAt ?? ""
        return tb.localeCompare(ta)
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách đơn")
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [employeeId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const onFocus = () => load()
    window.addEventListener("focus", onFocus)
    const interval = setInterval(load, 60000)
    return () => {
      window.removeEventListener("focus", onFocus)
      clearInterval(interval)
    }
  }, [load])

  const submit = async (payload: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    const newRequest: LeaveRequestRecord = {
      id: `XN${String(mockIdCounter++).padStart(5, "0")}`,
      employeeId: payload.employeeId,
      employeeName: "Nguyễn Văn A",
      department: "IT Department",
      category: payload.category,
      leaveType: payload.leaveType,
      leaveSubType: payload.leaveSubType,
      scope: payload.scope,
      startDate: payload.startDate,
      endDate: payload.endDate,
      session: payload.session,
      sessions: payload.sessions,
      reason: payload.reason,
      status: "pending",
      submittedAt: new Date().toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }).replace(", ", " ")
    }

    // Add to mock data
    mockRequests.push(newRequest)
    await load()
    return newRequest
  }

  const cancel = async (id: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300))

    const requestIndex = mockRequests.findIndex(r => r.id === id)
    if (requestIndex >= 0) {
      mockRequests[requestIndex].status = "cancelled"
    }
    await load()
  }

  const update = async (id: string, payload: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600))

    const requestIndex = mockRequests.findIndex(r => r.id === id)
    if (requestIndex >= 0) {
      const updated = {
        ...mockRequests[requestIndex],
        ...payload,
        leaveSubType: payload.leaveSubType || mockRequests[requestIndex].leaveSubType
      }
      mockRequests[requestIndex] = updated
      await load()
      return updated
    }
    throw new Error("Không tìm thấy đơn")
  }

  return { requests, loading, error, reload: load, submit, cancel, update }
}
