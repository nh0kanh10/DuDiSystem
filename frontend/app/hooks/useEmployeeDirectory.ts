import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { Employee } from "../types"

const SYSTEM_EMPLOYEE_IDS = new Set(["0000000000", "1111111111", "2222222222"])

export function useEmployeeDirectory() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.employees.list() as Employee[]
      setEmployees(data.filter(e => !SYSTEM_EMPLOYEE_IDS.has(e.id)))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được danh bạ")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { employees, loading, error, reload: load }
}
