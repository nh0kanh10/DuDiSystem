import { io, type Socket } from "socket.io-client"

const SOCKET_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:3001/api").replace(/\/api\/?$/, "")

let socket: Socket | null = null
let refCount = 0

export type ChatSocketStatus = "disconnected" | "connecting" | "connected"

function token() {
  return localStorage.getItem("dudi_token") ?? ""
}

export function connectChatSocket(): Socket | null {
  const t = token()
  if (!t) return null

  refCount += 1
  if (socket) return socket

  socket = io(SOCKET_BASE, {
    path: "/socket.io",
    auth: { token: t },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  })

  socket.on("connect_error", () => {
    /* fallback REST polling handles offline */
  })

  return socket
}

export function releaseChatSocket() {
  refCount = Math.max(0, refCount - 1)
  if (refCount === 0 && socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}

export function getChatSocket() {
  return socket
}

export function chatHeartbeat() {
  socket?.emit("chat:heartbeat")
}

export function chatTyping(peerId: string) {
  socket?.emit("chat:typing", { peerId })
}

export function getChatSocketStatus(): ChatSocketStatus {
  if (!socket) return "disconnected"
  if (socket.connected) return "connected"
  return "connecting"
}
