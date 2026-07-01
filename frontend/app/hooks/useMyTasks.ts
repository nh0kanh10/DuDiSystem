import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export interface StaffTask {
  id: string
  title: string
  description?: string
  assigneeId?: string
  dueDate?: string
  priority?: string
  status?: string
  assigneeName?: string
}

export function useMyTasks(assigneeId?: string) {
  const [tasks, setTasks] = useState<StaffTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!assigneeId) {
      setTasks([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await api.tasks.list({ assigneeId }) as StaffTask[]
      setTasks(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được công việc")
    } finally {
      setLoading(false)
    }
  }, [assigneeId])

  useEffect(() => { load() }, [load])

  const stats = {
    todo: tasks.filter(t => t.status === "todo" || !t.status).length,
    inProgress: tasks.filter(t => t.status === "in-progress").length,
    done: tasks.filter(t => t.status === "done").length,
  }

  return { tasks, loading, error, reload: load, stats }
}
