import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "@/lib/api"
import { subscribeNotificationSocket, type NotificationSocketPayload } from "@/lib/notificationSocket"

export interface StaffNotification {
  id: string
  type?: string
  title?: string
  message: string
  time?: string
  read?: boolean
}

const FALLBACK_POLL_MS = 120_000

export function useNotifications(options?: { pollInterval?: number; enableSocket?: boolean }) {
  const pollInterval = options?.pollInterval ?? FALLBACK_POLL_MS
  const enableSocket = options?.enableSocket !== false

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

  useEffect(() => {
    if (!enableSocket) return

    const unsub = subscribeNotificationSocket({
      onNew: (notification: NotificationSocketPayload) => {
        setItems(prev => {
          if (prev.some(n => n.id === notification.id)) return prev
          const next: StaffNotification = {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            time: notification.time,
            read: false,
          }
          return [next, ...prev]
        })
      },
      onRead: (payload) => {
        if (payload.all) {
          setItems(prev => prev.map(n => ({ ...n, read: true })))
          return
        }
        if (payload.id) {
          if (payload.deleted) {
            setItems(prev => prev.filter(n => n.id !== payload.id))
          } else {
            setItems(prev => prev.map(n => n.id === payload.id ? { ...n, read: true } : n))
          }
        }
      },
    })

    return () => {
      unsub()
    }
  }, [enableSocket])

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

/** Badge + dropdown admin — đồng bộ unread qua socket. */
export function useNotificationBadge(initialLoad = true) {
  const [unread, setUnread] = useState(0)
  const [latest, setLatest] = useState<StaffNotification[]>([])

  const reload = useCallback(async () => {
    try {
      const data = await api.notifications.list({ read: "false" }) as StaffNotification[]
      setLatest(data ?? [])
      setUnread((data ?? []).filter(n => !n.read).length)
    } catch {
      /* giữ số cũ */
    }
  }, [])

  useEffect(() => {
    if (initialLoad) reload()
    const timer = setInterval(reload, FALLBACK_POLL_MS)
    return () => clearInterval(timer)
  }, [initialLoad, reload])

  useEffect(() => {
    const unsub = subscribeNotificationSocket({
      onNew: (notification) => {
        setUnread(c => c + 1)
        setLatest(prev => {
          if (prev.some(n => n.id === notification.id)) return prev
          const row: StaffNotification = {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            time: notification.time,
            read: false,
          }
          return [row, ...prev]
        })
      },
      onRead: (payload) => {
        if (payload.unreadCount !== undefined) {
          setUnread(payload.unreadCount)
        } else if (payload.all) {
          setUnread(0)
          setLatest([])
        } else if (payload.id) {
          if (payload.deleted) {
            setLatest(prev => prev.filter(n => n.id !== payload.id))
          } else {
            setLatest(prev => prev.map(n => n.id === payload.id ? { ...n, read: true } : n))
          }
          setUnread(c => Math.max(0, payload.unreadCount ?? c - 1))
        }
      },
    })
    return () => {
      unsub()
    }
  }, [])

  return { unread, latest, reload, setLatest, setUnread }
}
