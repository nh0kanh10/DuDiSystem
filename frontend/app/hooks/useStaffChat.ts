import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "@/lib/api"
import type { ChatMessageDto, ChatOnlineEmployee, ChatRosterItem } from "@/lib/api"
import {
  chatHeartbeat,
  chatTyping,
  connectChatSocket,
  getChatSocket,
  getChatSocketStatus,
  releaseChatSocket,
} from "@/lib/chatSocket"

export interface ChatMessage {
  id: string
  from: "me" | "them"
  text: string
  time: string
  failed?: boolean
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

export function formatChatTime(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return "Hôm qua"
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (diffDays > 0 && diffDays < 7) return `${diffDays} ngày trước`
  return d.toLocaleDateString("vi-VN")
}

/** Thời gian hiển thị ở danh sách hội thoại */
export function formatChatTimeRoster(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return "Hôm nay"
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return "Hôm qua"
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (diffDays > 0 && diffDays < 7) return `${diffDays} ngày trước`
  return d.toLocaleDateString("vi-VN")
}

function mapRosterItem(row: ChatRosterItem) {
  return {
    id: row.id,
    name: row.name,
    department: row.department,
    position: row.position,
    photos: row.photos ?? [],
    online: row.online,
    unread: row.unread,
    lastMessage: row.lastMessage,
    lastTime: formatChatTimeRoster(row.lastMessageAt),
  }
}

function mapMessage(m: ChatMessageDto): ChatMessage {
  return {
    id: m.id,
    from: m.from,
    text: m.body,
    time: formatChatTime(m.createdAt),
  }
}

interface SocketMessagePayload {
  peerId: string
  conversationId: string
  message: ChatMessageDto
  lastMessage: string
  lastMessageAt: string
  incrementUnread?: boolean
  syncTab?: boolean
}

export function useStaffChat(options?: { panelOpen?: boolean }) {
  const panelOpen = options?.panelOpen ?? false

  const [employees, setEmployees] = useState<ReturnType<typeof mapRosterItem>[]>([])
  const [searchResults, setSearchResults] = useState<ReturnType<typeof mapRosterItem>[]>([])
  const [searching, setSearching] = useState(false)
  const [rosterScope, setRosterScope] = useState<"branch" | "company">("branch")
  const [onlineCount, setOnlineCount] = useState(0)
  const [onlineEmployees, setOnlineEmployees] = useState<ChatOnlineEmployee[]>([])
  const [totalUnread, setTotalUnread] = useState(0)
  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)
  const [peerTyping, setPeerTyping] = useState<string | null>(null)
  const [threadHasMore, setThreadHasMore] = useState<Record<string, boolean>>({})
  const [loadingMore, setLoadingMore] = useState(false)

  const fallbackTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const onlinePollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const presenceDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activePeerRef = useRef<string | null>(null)
  const typingClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadRosterRef = useRef<(q?: string, silent?: boolean) => Promise<void>>(async () => {})

  const loadRoster = useCallback(async (q = "", silent = false) => {
    if (!panelOpen) return
    if (!silent) setLoading(true)
    setError(null)
    try {
      const data = await api.staffChat.roster(q || undefined, "conversations")
      const rows = (data.items ?? []).map(mapRosterItem)
      setEmployees(rows)
      setOnlineCount(data.onlineCount ?? 0)
      if (data.rosterScope) setRosterScope(data.rosterScope)
      const unread = await api.staffChat.unreadCount()
      setTotalUnread(unread.totalUnread ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách chat")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [panelOpen])

  loadRosterRef.current = loadRoster

  const searchRoster = useCallback(async (q: string) => {
    setSearching(true)
    try {
      const data = await api.staffChat.roster(q.trim() || undefined, "all")
      setSearchResults((data.items ?? []).map(mapRosterItem))
      if (data.rosterScope) setRosterScope(data.rosterScope)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const refreshUnread = useCallback(async () => {
    try {
      const unread = await api.staffChat.unreadCount()
      setTotalUnread(unread.totalUnread ?? 0)
    } catch {
      /* optional */
    }
  }, [])

  const loadOnlineList = useCallback(async () => {
    try {
      const data = await api.staffChat.online()
      setOnlineCount(data.onlineCount ?? 0)
      setOnlineEmployees(data.onlineEmployees ?? [])
      if (data.rosterScope) setRosterScope(data.rosterScope)
    } catch {
      /* optional */
    }
  }, [])

  const loadThread = useCallback(async (peerId: string) => {
    if (!panelOpen || !peerId) return
    try {
      const data = await api.staffChat.getThread(peerId)
      setThreads(prev => ({
        ...prev,
        [peerId]: (data.messages ?? []).map(mapMessage),
      }))
      setThreadHasMore(prev => ({ ...prev, [peerId]: data.hasMore ?? false }))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được hội thoại")
    }
  }, [panelOpen])

  const loadMoreMessages = useCallback(async (peerId: string) => {
    if (!panelOpen || !peerId || loadingMore || !threadHasMore[peerId]) return false
    const current = threads[peerId] ?? []
    const firstId = current[0]?.id
    if (!firstId || firstId.startsWith("opt-") || firstId.startsWith("fail-")) return false

    setLoadingMore(true)
    try {
      const data = await api.staffChat.getThread(peerId, { before: firstId, limit: "30" })
      const older = (data.messages ?? []).map(mapMessage)
      if (older.length === 0) {
        setThreadHasMore(prev => ({ ...prev, [peerId]: false }))
        return false
      }
      setThreads(prev => {
        const merged = [...older, ...(prev[peerId] ?? [])]
        const seen = new Set<string>()
        const unique = merged.filter(m => {
          if (seen.has(m.id)) return false
          seen.add(m.id)
          return true
        })
        return { ...prev, [peerId]: unique }
      })
      setThreadHasMore(prev => ({ ...prev, [peerId]: data.hasMore ?? false }))
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải thêm tin nhắn")
      return false
    } finally {
      setLoadingMore(false)
    }
  }, [panelOpen, loadingMore, threadHasMore, threads])

  const openChat = useCallback(async (peerId: string) => {
    activePeerRef.current = peerId
    setPeerTyping(null)
    await loadThread(peerId)
    await api.staffChat.markRead(peerId).catch(() => {})
    setEmployees(prev => prev.map(e => (e.id === peerId ? { ...e, unread: 0 } : e)))
    refreshUnread()
  }, [loadThread, refreshUnread])

  const sendMessage = useCallback(async (peerId: string, text: string, opts?: { replaceId?: string }) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return false
    setSending(true)
    const optimisticId = opts?.replaceId ?? `opt-${Date.now()}`
    const optimistic: ChatMessage = {
      id: optimisticId,
      from: "me",
      text: trimmed,
      time: formatChatTime(new Date().toISOString()),
      failed: false,
    }
    setThreads(prev => {
      const list = prev[peerId] ?? []
      const withoutOld = opts?.replaceId ? list.filter(m => m.id !== opts.replaceId) : list
      return { ...prev, [peerId]: [...withoutOld, optimistic] }
    })
    setEmployees(prev => prev.map(e =>
      e.id === peerId ? { ...e, lastMessage: trimmed, lastTime: "Hôm nay" } : e
    ))
    try {
      const data = await api.staffChat.sendMessage(peerId, trimmed)
      const real = mapMessage(data.message)
      setThreads(prev => ({
        ...prev,
        [peerId]: (prev[peerId] ?? []).map(m => (m.id === optimisticId ? real : m)),
      }))
      void loadRoster("", true)
      return true
    } catch (e) {
      setThreads(prev => ({
        ...prev,
        [peerId]: (prev[peerId] ?? []).map(m =>
          m.id === optimisticId ? { ...m, id: `fail-${optimisticId}`, failed: true } : m
        ),
      }))
      setError(e instanceof Error ? e.message : "Gửi tin nhắn thất bại")
      return false
    } finally {
      setSending(false)
    }
  }, [sending, loadRoster])

  const retryMessage = useCallback(async (peerId: string, messageId: string, text: string) => {
    return sendMessage(peerId, text, { replaceId: messageId })
  }, [sendMessage])

  const setActivePeer = useCallback((peerId: string | null) => {
    activePeerRef.current = peerId
    setPeerTyping(null)
  }, [])

  const notifyTyping = useCallback((peerId: string) => {
    if (socketConnected) chatTyping(peerId)
  }, [socketConnected])

  const applyIncomingMessage = useCallback((payload: SocketMessagePayload) => {
    const { peerId, message, lastMessage, lastMessageAt, incrementUnread, syncTab } = payload
    const mapped = mapMessage(message)
    const isActive = activePeerRef.current === peerId

    setThreads(prev => {
      const existing = prev[peerId] ?? []
      if (existing.some(m => m.id === mapped.id)) return prev
      if (syncTab) {
        const cleaned = existing.filter(m => !m.id.startsWith("opt-"))
        if (cleaned.some(m => m.id === mapped.id)) return prev
        return { ...prev, [peerId]: [...cleaned, mapped] }
      }
      return { ...prev, [peerId]: [...existing, mapped] }
    })

    setEmployees(prev => {
      const exists = prev.some(e => e.id === peerId)
      if (!exists) {
        void loadRosterRef.current("", true)
        return prev
      }
      const time = formatChatTimeRoster(lastMessageAt)
      const next = prev.map(e => {
        if (e.id !== peerId) return e
        return {
          ...e,
          lastMessage,
          lastTime: time,
          unread: incrementUnread && !isActive ? e.unread + 1 : isActive ? 0 : e.unread,
        }
      })
      return next
    })

    if (incrementUnread && !isActive) {
      setTotalUnread(n => n + 1)
    } else if (incrementUnread && isActive) {
      api.staffChat.markRead(peerId).catch(() => {})
      setEmployees(prev => prev.map(e => (e.id === peerId ? { ...e, unread: 0 } : e)))
    }
  }, [])

  useEffect(() => {
    const socket = connectChatSocket()
    if (!socket) return () => releaseChatSocket()

    const onConnect = () => {
      setSocketConnected(true)
      chatHeartbeat()
      refreshUnread()
      void loadOnlineList()
    }
    const onDisconnect = () => setSocketConnected(false)

    const onMessage = (payload: SocketMessagePayload) => applyIncomingMessage(payload)
    const onPresence = () => {
      if (presenceDebounce.current) clearTimeout(presenceDebounce.current)
      presenceDebounce.current = setTimeout(() => void loadOnlineList(), 400)
    }
    const onUnread = ({ totalUnread: n }: { totalUnread: number }) => setTotalUnread(n)
    const onRead = ({ peerId, unreadCount }: { peerId: string; unreadCount?: number }) => {
      if (unreadCount === 0) {
        setEmployees(prev => prev.map(e => (e.id === peerId ? { ...e, unread: 0 } : e)))
      }
    }
    const onTyping = ({ peerId, typing }: { peerId: string; typing: boolean }) => {
      if (activePeerRef.current !== peerId) return
      if (typingClearTimer.current) clearTimeout(typingClearTimer.current)
      if (typing) {
        setPeerTyping(peerId)
        typingClearTimer.current = setTimeout(() => setPeerTyping(null), 3000)
      } else {
        setPeerTyping(null)
      }
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("chat:message", onMessage)
    socket.on("chat:presence", onPresence)
    socket.on("chat:unread", onUnread)
    socket.on("chat:read", onRead)
    socket.on("chat:typing", onTyping)

    if (socket.connected) onConnect()

    heartbeatTimer.current = setInterval(() => {
      if (getChatSocketStatus() === "connected") {
        chatHeartbeat()
      } else {
        api.staffChat.heartbeat().catch(() => {})
      }
    }, 25_000)

    refreshUnread()

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("chat:message", onMessage)
      socket.off("chat:presence", onPresence)
      socket.off("chat:unread", onUnread)
      socket.off("chat:read", onRead)
      socket.off("chat:typing", onTyping)
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current)
      if (presenceDebounce.current) clearTimeout(presenceDebounce.current)
      if (typingClearTimer.current) clearTimeout(typingClearTimer.current)
      releaseChatSocket()
    }
  }, [applyIncomingMessage, refreshUnread, loadOnlineList])

  useEffect(() => {
    if (!panelOpen) {
      setLoading(false)
      if (fallbackTimer.current) clearInterval(fallbackTimer.current)
      if (onlinePollTimer.current) clearInterval(onlinePollTimer.current)
      return
    }
    loadRoster()
    void loadOnlineList()
    onlinePollTimer.current = setInterval(() => void loadOnlineList(), 30_000)
    fallbackTimer.current = setInterval(() => {
      if (getChatSocket()?.connected) return
      loadRoster("", true)
      refreshUnread()
    }, 60_000)
    return () => {
      if (fallbackTimer.current) clearInterval(fallbackTimer.current)
      if (onlinePollTimer.current) clearInterval(onlinePollTimer.current)
    }
  }, [panelOpen, loadRoster, refreshUnread, loadOnlineList])

  return {
    employees,
    searchResults,
    searching,
    rosterScope,
    onlineCount,
    onlineEmployees,
    totalUnread,
    threads,
    loading,
    error,
    sending,
    socketConnected,
    peerTyping,
    threadHasMore,
    loadingMore,
    loadRoster,
    searchRoster,
    loadOnlineList,
    loadThread,
    loadMoreMessages,
    openChat,
    sendMessage,
    retryMessage,
    setActivePeer,
    notifyTyping,
    clearError: () => setError(null),
  }
}
