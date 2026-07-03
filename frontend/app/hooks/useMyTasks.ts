import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "@/lib/api"
import { mergeTaskList, subscribeTaskSocket, type TaskSocketRecord } from "@/lib/taskSocket"

export interface StaffTask {
  id: string
  title: string
  description?: string
  assigneeId?: string
  dueDate?: string
  priority?: string
  status?: string
  assigneeName?: string
  projectId?: string
  parentId?: string
}

const FALLBACK_POLL_MS = 120_000

export function useMyTasks(assigneeId?: string, options?: { enableSocket?: boolean }) {
  const enableSocket = options?.enableSocket !== false
  const [tasks, setTasks] = useState<StaffTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const assigneeRef = useRef(assigneeId)
  assigneeRef.current = assigneeId

  const load = useCallback(async (silent = false) => {
    if (!assigneeId) {
      setTasks([])
      setLoading(false)
      return
    }
    if (!silent) setLoading(true)
    setError(null)
    try {
      const data = await api.tasks.list({ assigneeId }) as StaffTask[]
      setTasks(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được công việc")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [assigneeId])

  useEffect(() => {
    load()
    const timer = setInterval(() => load(true), FALLBACK_POLL_MS)
    return () => clearInterval(timer)
  }, [load])

  useEffect(() => {
    if (!enableSocket || !assigneeId) return
    const unsub = subscribeTaskSocket({
      onChange: ({ action, task }) => {
        setTasks(prev => {
          if (action === "deleted") {
            return prev.filter(t => t.id !== task.id && t.parentId !== task.id)
          }
          if (task.assigneeId !== assigneeRef.current) {
            return prev.filter(t => t.id !== task.id)
          }
          return mergeTaskList(prev, { action, task })
        })
      },
    })
    return () => { unsub() }
  }, [enableSocket, assigneeId])

  const stats = {
    todo: tasks.filter(t => t.status === "todo" || !t.status).length,
    inProgress: tasks.filter(t => t.status === "in-progress").length,
    done: tasks.filter(t => t.status === "done").length,
  }

  return { tasks, loading, error, reload: () => load(), stats }
}

/** Admin / bảng công việc — nhận mọi thay đổi task. */
export function useTaskBoardRealtime(
  onChange: (payload: { action: "created" | "updated" | "deleted"; task: TaskSocketRecord }) => void,
) {
  useEffect(() => {
    const unsub = subscribeTaskSocket({ onChange })
    return () => { unsub() }
  }, [onChange])
}
