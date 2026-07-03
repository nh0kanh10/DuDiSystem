import jwt from "jsonwebtoken"
import { Server } from "socket.io"
import { JWT_SECRET, CORS_ORIGINS } from "../config/index.js"
import { getById } from "../repositories/user.repository.js"
import { getById as getEmployeeById } from "../repositories/employee.repository.js"
import { isAdminUser } from "../utils/access.js"
import * as staffChat from "../services/staffChat.service.js"

/** @type {import("socket.io").Server | null} */
let io = null

const typingTimers = new Map()

export function getIO() {
  return io
}

export function initChatSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: CORS_ORIGINS,
      credentials: true,
    },
    path: "/socket.io",
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
      || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "")
    if (!token) return next(new Error("Unauthorized"))
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const dbUser = getById(decoded.id)
      if (!dbUser || dbUser.status !== "active") {
        return next(new Error("Unauthorized"))
      }
      const dbVersion = dbUser.permissionsVersion ?? 0
      const tokenVersion = decoded.permissionsVersion ?? 0
      if (dbVersion !== tokenVersion) {
        return next(new Error("Session expired"))
      }
      socket.user = { ...decoded, permissionsVersion: dbVersion }
      next()
    } catch {
      next(new Error("Unauthorized"))
    }
  })

  io.on("connection", (socket) => {
    const user = socket.user
    const employeeId = user?.employeeId
    if (!employeeId) {
      socket.disconnect(true)
      return
    }

    const employee = getEmployeeById(employeeId)
    const branchId = user.branchId || employee?.branchId || null

    socket.join(roomEmployee(employeeId))
    if (branchId) socket.join(roomBranch(branchId))
    if (isAdminUser(user)) socket.join(roomAdmins())

    const heartbeat = () => {
      const result = staffChat.heartbeat(user)
      if (result?.error) return
      broadcastPresence(employeeId, branchId, true, result.lastSeenAt)
    }

    heartbeat()

    socket.on("chat:heartbeat", heartbeat)

    socket.on("chat:typing", ({ peerId }) => {
      if (!peerId || peerId === employeeId) return
      const scopeErr = staffChat.assertCanChatWithPeer(user, peerId)
      if (scopeErr) return
      io.to(roomEmployee(peerId)).emit("chat:typing", {
        peerId: employeeId,
        typing: true,
      })
      const key = `${employeeId}:${peerId}`
      if (typingTimers.has(key)) clearTimeout(typingTimers.get(key))
      typingTimers.set(key, setTimeout(() => {
        io.to(roomEmployee(peerId)).emit("chat:typing", {
          peerId: employeeId,
          typing: false,
        })
        typingTimers.delete(key)
      }, 2500))
    })

    socket.on("disconnect", () => {
      staffChat.setOffline(user)
      broadcastPresence(employeeId, branchId, false, new Date().toISOString())
    })
  })

  console.log("Chat socket ready on /socket.io")
  return io
}

function roomEmployee(id) {
  return `employee:${id}`
}

function roomBranch(id) {
  return `branch:${id}`
}

function roomAdmins() {
  return "chat:admins"
}

function broadcastPresence(employeeId, branchId, online, lastSeenAt) {
  if (!io) return
  const payload = { employeeId, online, lastSeenAt }
  if (branchId) io.to(roomBranch(branchId)).emit("chat:presence", payload)
  io.to(roomAdmins()).emit("chat:presence", payload)
}

export function emitChatMessage({ senderId, recipientId, conversationId, rawMessage }) {
  if (!io) return

  const recipientMsg = staffChat.messageForViewer(rawMessage, recipientId)
  io.to(roomEmployee(recipientId)).emit("chat:message", {
    peerId: senderId,
    conversationId,
    message: recipientMsg,
    lastMessage: rawMessage.body,
    lastMessageAt: rawMessage.createdAt,
    incrementUnread: true,
  })

  const senderMsg = staffChat.messageForViewer(rawMessage, senderId)
  io.to(roomEmployee(senderId)).emit("chat:message", {
    peerId: recipientId,
    conversationId,
    message: senderMsg,
    lastMessage: rawMessage.body,
    lastMessageAt: rawMessage.createdAt,
    incrementUnread: false,
    syncTab: true,
  })
}

export function emitChatRead({ readerId, peerId, conversationId }) {
  if (!io) return
  io.to(roomEmployee(readerId)).emit("chat:read", {
    peerId,
    conversationId,
    unreadCount: 0,
  })
  io.to(roomEmployee(peerId)).emit("chat:read", {
    peerId: readerId,
    conversationId,
    readByPeer: true,
  })
}

export function notifyPresenceHeartbeat(user, lastSeenAt) {
  const employee = getEmployeeById(user.employeeId)
  const branchId = user.branchId || employee?.branchId || null
  broadcastPresence(user.employeeId, branchId, true, lastSeenAt)
}

export function emitUnreadCount(employeeId, totalUnread) {
  if (!io) return
  io.to(roomEmployee(employeeId)).emit("chat:unread", { totalUnread })
}
