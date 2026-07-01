import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { Employee } from "../types"

export function useEmployeeDirectory() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.employees.list() as Employee[]
      setEmployees(data.filter(e => e.status === "active" || e.status === "intern"))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được danh bạ")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { employees, loading, error, reload: load }
}
