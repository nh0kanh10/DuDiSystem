import { getChatSocket } from "./chatSocket"
import type { Socket } from "socket.io-client"

export interface NotificationSocketPayload {
  id: string
  type?: string
  title?: string
  message: string
  time?: string
  read?: boolean
  recipientId?: string | null
}

export type NotificationReadPayload = {
  id?: string
  all?: boolean
  deleted?: boolean
  unreadCount?: number
}

type NotificationHandlers = {
  onNew?: (notification: NotificationSocketPayload) => void
  onRead?: (payload: NotificationReadPayload) => void
}

const handlers = new Set<NotificationHandlers>()
let boundSocket: Socket | null = null

function onNotificationNew(data: { notification?: NotificationSocketPayload }) {
  if (!data?.notification) return
  handlers.forEach(h => h.onNew?.(data.notification!))
}

function onNotificationRead(payload: NotificationReadPayload) {
  handlers.forEach(h => h.onRead?.(payload))
}

function bindSocket(socket: Socket) {
  if (boundSocket === socket) return
  if (boundSocket) {
    boundSocket.off("notification:new", onNotificationNew)
    boundSocket.off("notification:read", onNotificationRead)
  }
  boundSocket = socket
  socket.on("notification:new", onNotificationNew)
  socket.on("notification:read", onNotificationRead)
  socket.on("disconnect", () => {
    boundSocket = null
  })
}

/** Đăng ký nhận push thông báo realtime (dùng chung socket với chat). */
export function subscribeNotificationSocket(h: NotificationHandlers) {
  handlers.add(h)
  const tryBind = () => {
    const socket = getChatSocket()
    if (socket) bindSocket(socket)
  }
  tryBind()
  window.addEventListener("dudi:chat-socket-connect", tryBind)
  return () => {
    handlers.delete(h)
    window.removeEventListener("dudi:chat-socket-connect", tryBind)
  }
}
