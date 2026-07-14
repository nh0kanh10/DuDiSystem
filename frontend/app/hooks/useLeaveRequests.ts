import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "@/lib/api"
import type { LeaveRequestRecord } from "../components/nghi-phep/leaveRequestModel"

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

  const submit = async (payload: unknown) => {
    const created = await api.requests.create(payload) as LeaveRequestRecord
    await load()
    return created
  }

  const cancel = async (id: string) => {
    await api.requests.cancel(id, employeeId)
    await load()
  }

  const update = async (id: string, payload: unknown) => {
    const updated = await api.requests.update(id, payload) as LeaveRequestRecord
    await load()
    return updated
  }

  return { requests, loading, error, reload: load, submit, cancel, update }
}
