import { io, type Socket } from "socket.io-client"

const SOCKET_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:3001/api").replace(/\/api\/?$/, "")

let socket: Socket | null = null
let refCount = 0
let connectedToken = ""

export type ChatSocketStatus = "disconnected" | "connecting" | "connected"

function token() {
  return localStorage.getItem("dudi_token") ?? ""
}

function destroySocket() {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  connectedToken = ""
}

function createSocket(t: string) {
  connectedToken = t
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

  socket.on("connect", () => {
    window.dispatchEvent(new Event("dudi:chat-socket-connect"))
  })

  return socket
}

/** Force disconnect regardless of refCount — call on logout or token identity change. */
export function resetChatSocket() {
  refCount = 0
  destroySocket()
}

export function getOrCreateChatSocket(): Socket | null {
  const t = token()
  if (!t) return null

  if (socket && connectedToken !== t) {
    destroySocket()
    refCount = 0
  }

  if (!socket) createSocket(t)
  return socket
}

export function connectChatSocket(): Socket | null {
  const s = getOrCreateChatSocket()
  if (s) refCount += 1
  return s
}

export function releaseChatSocket() {
  refCount = Math.max(0, refCount - 1)
  if (refCount === 0) destroySocket()
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
