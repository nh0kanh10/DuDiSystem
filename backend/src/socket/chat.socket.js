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
      socket.user = {
        ...decoded,
        employeeId: dbUser.employeeId ?? decoded.employeeId,
        roleId: dbUser.roleId ?? decoded.roleId,
        permissionsVersion: dbVersion,
      }
      next()
    } catch {
      next(new Error("Unauthorized"))
    }
  })

  io.on("connection", (socket) => {
    const resolveUser = () => {
      const base = socket.user
      if (!base?.id) return base
      const dbUser = getById(base.id)
      if (!dbUser) return base
      return {
        ...base,
        employeeId: dbUser.employeeId ?? base.employeeId,
        roleId: dbUser.roleId ?? base.roleId,
      }
    }

    const user = resolveUser()
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
    socket.join(roomNotificationsBroadcast())

    const heartbeat = () => {
      const activeUser = resolveUser()
      const result = staffChat.heartbeat(activeUser)
      if (result?.error) return
      const activeId = activeUser?.employeeId ?? employeeId
      broadcastPresence(activeId, branchId, true, result.lastSeenAt)
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
      const activeUser = resolveUser()
      const activeId = activeUser?.employeeId ?? employeeId
      staffChat.setOffline(activeUser)
      broadcastPresence(activeId, branchId, false, new Date().toISOString())
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

function roomNotificationsBroadcast() {
  return "notifications:broadcast"
}

/** @param {object} notification */
export function emitNotificationCreated(notification) {
  if (!io || !notification) return
  const payload = { notification }
  if (notification.recipientId) {
    io.to(roomEmployee(notification.recipientId)).emit("notification:new", payload)
  } else {
    io.to(roomNotificationsBroadcast()).emit("notification:new", payload)
  }
}

export function emitNotificationRead(recipientId, data) {
  if (!io) return
  const payload = { ...data }
  if (recipientId) {
    io.to(roomEmployee(recipientId)).emit("notification:read", payload)
  } else {
    io.to(roomNotificationsBroadcast()).emit("notification:read", payload)
  }
}

/** @param {"created"|"updated"|"deleted"} action */
export function emitTaskChanged(action, task) {
  if (!io || !task) return
  const payload = { action, task }
  if (task.assigneeId) {
    io.to(roomEmployee(task.assigneeId)).emit("task:changed", payload)
  }
  io.to(roomAdmins()).emit("task:changed", payload)
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
