import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

export interface StaffNotification {
  id: string
  type?: string
  message: string
  time?: string
  read?: boolean
}

export function useNotifications() {
  const [items, setItems] = useState<StaffNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.notifications.list() as StaffNotification[]
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được thông báo")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const unread = items.filter(n => !n.read).length

  const markRead = async (id: string) => {
    await api.notifications.markRead(id)
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = async () => {
    await api.notifications.markAllRead()
    setItems(prev => prev.map(n => ({ ...n, read: true })))
  }

  return { items, loading, error, unread, reload: load, markRead, markAllRead }
}
