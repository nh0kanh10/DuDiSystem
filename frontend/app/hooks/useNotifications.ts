import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "@/lib/api"

export interface StaffNotification {
  id: string
  type?: string
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
      setItems(data)
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
    await api.notifications.markRead(id)
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = async () => {
    await api.notifications.markAllRead()
    setItems(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteItem = async (id: string) => {
    await api.notifications.delete(id)
    setItems(prev => prev.filter(n => n.id !== id))
  }

  return { items, loading, error, unread, reload: () => load(), markRead, markAllRead, deleteItem }
}
