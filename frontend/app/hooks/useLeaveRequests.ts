import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { LeaveRequestRecord } from "../components/nghi-phep/leaveRequestModel"

export function useLeaveRequests(employeeId?: string) {
  const [requests, setRequests] = useState<LeaveRequestRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!employeeId) {
      setRequests([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await api.requests.list({ employeeId }) as LeaveRequestRecord[]
      setRequests(data.sort((a, b) => {
        const ta = a.submittedAt ?? ""
        const tb = b.submittedAt ?? ""
        return tb.localeCompare(ta)
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách đơn")
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  useEffect(() => { load() }, [load])

  const submit = async (payload: unknown) => {
    const created = await api.requests.create(payload) as LeaveRequestRecord
    setRequests(prev => [created, ...prev])
    return created
  }

  const cancel = async (id: string) => {
    await api.requests.cancel(id, employeeId)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "cancelled" as const } : r))
  }

  return { requests, loading, error, reload: load, submit, cancel }
}
