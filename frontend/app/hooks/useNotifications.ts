import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "@/lib/api"

export interface StaffNotification {
  id: string
  type?: string
  title?: string
  message: string
  time?: string
  read?: boolean
}

export function useNotifications(pollInterval = 30000) {
  const [items, setItems] = useState<StaffNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const data = await api.notifications.list() as StaffNotification[]
      const all = (data ?? []).sort((a, b) => {
        const ta = a.time ? new Date(a.time).getTime() : 0
        const tb = b.time ? new Date(b.time).getTime() : 0
        return tb - ta
      })

      setItems(all)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được thông báo")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    timerRef.current = setInterval(() => load(true), pollInterval)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [load, pollInterval])

  const unread = items.filter(n => !n.read).length

  const markRead = async (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await api.notifications.markRead(id)
  }

  const markAllRead = async () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })))
    await api.notifications.markAllRead()
  }

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(n => n.id !== id))
    await api.notifications.delete(id)
  }

  return { items, loading, error, unread, reload: () => load(), markRead, markAllRead, deleteItem }
}
