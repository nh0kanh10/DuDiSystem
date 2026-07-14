import * as convRepo from "../repositories/chatConversation.repository.js"
import * as msgRepo from "../repositories/chatMessage.repository.js"
import * as readRepo from "../repositories/chatReadState.repository.js"
import * as presenceRepo from "../repositories/chatPresence.repository.js"
import * as empRepo from "../repositories/employee.repository.js"
import { isAdminUser } from "../utils/access.js"
import crypto from "crypto"

const ALGORITHM = "aes-256-cbc"
const ENCRYPTION_KEY = process.env.CHAT_ENCRYPTION_KEY || "dudi_system_chat_secret_key_32b"
const IV_LENGTH = 16

function encryptText(text) {
  if (!text) return ""
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
    let encrypted = cipher.update(text, "utf8")
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return iv.toString("hex") + ":" + encrypted.toString("hex")
  } catch (err) {
    console.error("Encryption error:", err)
    return text
  }
}

function decryptText(text) {
  if (!text) return ""
  try {
    const textParts = text.split(":")
    if (textParts.length < 2) return text
    const iv = Buffer.from(textParts.shift(), "hex")
    const encryptedText = Buffer.from(textParts.join(":"), "hex")
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString("utf8")
  } catch (err) {
    return text
  }
}

export const MAX_MESSAGE_LENGTH = 2000
export const ONLINE_THRESHOLD_MS = 60_000
export const HEARTBEAT_INTERVAL_MS = 25_000
const DEFAULT_MESSAGE_LIMIT = 50

export function buildParticipantKey(a, b) {
  return [a, b].sort().join("|")
}

function nextId(prefix) {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function requireEmployeeId(user) {
  if (!user?.employeeId) {
    return { error: "Tài khoản chưa liên kết nhân viên", status: 403 }
  }
  return null
}

function getPeerId(conversation, myId) {
  return conversation.participantIds.find(id => id !== myId) ?? null
}

export function isOnline(presence, now = Date.now()) {
  if (!presence?.lastSeenAt) return false
  if (presence.status === "offline") return false
  return now - new Date(presence.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS
}

function buildPresenceMap(employeeIds) {
  const all = presenceRepo.getAll()
  const map = new Map(all.map(p => [p.employeeId, p]))
  const result = {}
  for (const id of employeeIds) {
    result[id] = isOnline(map.get(id))
  }
  return result
}

function countUnread(conversationId, employeeId) {
  const readState = readRepo.getForConversation(conversationId, employeeId)
  return msgRepo.countUnreadFor(conversationId, employeeId, readState?.lastReadAt ?? null)
}

function peerSummary(peer, online) {
  if (!peer) return null
  return {
    id: peer.id,
    name: peer.name,
    department: peer.department ?? "",
    position: peer.position ?? "",
    photos: peer.photos ?? [],
    online,
  }
}

function resolveUserBranchId(user) {
  const me = empRepo.getById(user.employeeId)
  const fromToken = user.branchId
  if (fromToken && fromToken !== "all") return fromToken
  return me?.branchId || null
}

function getChatBranchFilter(user) {
  if (isAdminUser(user)) return null
  return resolveUserBranchId(user)
}

function rosterFilterForUser(user) {
  const filter = { status: "active" }
  const branchId = getChatBranchFilter(user)
  if (branchId) filter.branchId = branchId
  return filter
}

function assertChatPeerInScope(user, peerId) {
  if (isAdminUser(user)) return null
  const myBranch = resolveUserBranchId(user)
  if (!myBranch) return null
  const peer = empRepo.getById(peerId)
  if (peer && peer.branchId && peer.branchId !== myBranch) {
    return { error: "Chỉ được nhắn tin với nhân viên cùng chi nhánh", status: 403 }
  }
  return null
}

function assertCanChatWith(user, peerId) {
  const selfErr = requireEmployeeId(user)
  if (selfErr) return selfErr

  if (peerId === user.employeeId) {
    return { error: "Không thể chat với chính mình", status: 400 }
  }

  const scopeErr = assertChatPeerInScope(user, peerId)
  if (scopeErr) return scopeErr

  const peer = empRepo.getById(peerId)
  if (!peer || peer.status !== "active") {
    return { error: "Nhân viên không tồn tại hoặc đã nghỉ", status: 404 }
  }

  return null
}

function assertConversationAccess(user, conversation) {
  const selfErr = requireEmployeeId(user)
  if (selfErr) return selfErr
  if (!conversation) return { error: "Không tìm thấy hội thoại", status: 404 }
  if (!conversation.participantIds.includes(user.employeeId)) {
    return { error: "Không có quyền truy cập hội thoại này", status: 403 }
  }
  return null
}

export function getOrCreateConversation(myId, peerId) {
  const key = buildParticipantKey(myId, peerId)
  const existing = convRepo.getByParticipantKey(key)
  if (existing) return existing

  const now = new Date().toISOString()
  return convRepo.create({
    id: nextId("CONV"),
    type: "direct",
    participantIds: [myId, peerId],
    participantKey: key,
    lastMessage: "",
    lastMessageAt: null,
    lastSenderId: null,
    createdAt: now,
    updatedAt: now,
  })
}

function enrichConversation(conversation, user) {
  const myId = user.employeeId
  const peerId = getPeerId(conversation, myId)
  const peer = empRepo.getById(peerId)
  const presence = presenceRepo.getByEmployeeId(peerId)
  const unreadCount = countUnread(conversation.id, myId)

  return {
    id: conversation.id,
    peerId,
    peer: peerSummary(peer, isOnline(presence)),
    lastMessage: decryptText(conversation.lastMessage ?? ""),
    lastMessageAt: conversation.lastMessageAt ?? null,
    lastSenderId: conversation.lastSenderId ?? null,
    unreadCount,
  }
}

export function listConversations(user) {
  const selfErr = requireEmployeeId(user)
  if (selfErr) return selfErr

  const items = convRepo.getForParticipant(user.employeeId)
    .map(c => enrichConversation(c, user))
    .sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
      return tb - ta
    })

  return { items, totalUnread: items.reduce((n, c) => n + c.unreadCount, 0) }
}

export function openConversation(user, peerId) {
  const err = assertCanChatWith(user, peerId)
  if (err) return err

  const conversation = getOrCreateConversation(user.employeeId, peerId)
  return enrichConversation(conversation, user)
}

export function getThreadMessages(user, peerId, options = {}) {
  const err = assertCanChatWith(user, peerId)
  if (err) return err

  const conversation = convRepo.getByParticipantKey(
    buildParticipantKey(user.employeeId, peerId)
  )
  if (!conversation) {
    return {
      conversationId: null,
      peerId,
      messages: [],
      hasMore: false,
    }
  }

  const accessErr = assertConversationAccess(user, conversation)
  if (accessErr) return accessErr

  let messages = msgRepo.getByConversation(conversation.id)
  const limit = Math.min(Math.max(Number(options.limit) || DEFAULT_MESSAGE_LIMIT, 1), 100)

  if (options.before) {
    const idx = messages.findIndex(m => m.id === options.before)
    if (idx > 0) {
      messages = messages.slice(Math.max(0, idx - limit), idx)
    } else {
      messages = []
    }
  } else {
    messages = messages.slice(-limit)
  }

  const peer = empRepo.getById(peerId)
  const presence = presenceRepo.getByEmployeeId(peerId)

  return {
    conversationId: conversation.id,
    peerId,
    peer: peerSummary(peer, isOnline(presence)),
    messages: messages.map(m => formatMessage(m, user.employeeId)),
    hasMore: messages.length >= limit,
  }
}

function formatMessage(message, myId) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    from: message.senderId === myId ? "me" : "them",
    body: decryptText(message.body),
    type: message.type ?? "text",
    createdAt: message.createdAt,
  }
}

export function messageForViewer(message, viewerEmployeeId) {
  return formatMessage(message, viewerEmployeeId)
}

/** @internal test / socket */
export function assertCanChatWithPeer(user, peerId) {
  return assertCanChatWith(user, peerId)
}

export function sendMessage(user, peerId, body) {
  const err = assertCanChatWith(user, peerId)
  if (err) return err

  const text = String(body ?? "").trim()
  if (!text) return { error: "Nội dung tin nhắn không được để trống", status: 400 }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return { error: `Tin nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự`, status: 400 }
  }

  const conversation = getOrCreateConversation(user.employeeId, peerId)
  const now = new Date().toISOString()
  const encryptedText = encryptText(text)

  const message = msgRepo.create({
    id: nextId("MSG"),
    conversationId: conversation.id,
    senderId: user.employeeId,
    body: encryptedText,
    type: "text",
    createdAt: now,
  })

  convRepo.update(conversation.id, {
    lastMessage: encryptedText,
    lastMessageAt: now,
    lastSenderId: user.employeeId,
    updatedAt: now,
  })

  return {
    conversationId: conversation.id,
    message: formatMessage(message, user.employeeId),
    rawMessage: { ...message, body: text },
    peerId,
  }
}

export function markThreadRead(user, peerId) {
  const err = assertCanChatWith(user, peerId)
  if (err) return err

  const conversation = convRepo.getByParticipantKey(
    buildParticipantKey(user.employeeId, peerId)
  )
  if (!conversation) {
    return { conversationId: null, unreadCount: 0 }
  }

  const accessErr = assertConversationAccess(user, conversation)
  if (accessErr) return accessErr

  const messages = msgRepo.getByConversation(conversation.id)
  const latest = messages[messages.length - 1] ?? null
  const now = new Date().toISOString()

  readRepo.upsert(conversation.id, user.employeeId, {
    lastReadMessageId: latest?.id ?? null,
    lastReadAt: latest?.createdAt ?? now,
  })

  return {
    conversationId: conversation.id,
    unreadCount: 0,
    lastReadAt: latest?.createdAt ?? now,
  }
}

export function getUnreadCount(user) {
  const selfErr = requireEmployeeId(user)
  if (selfErr) return selfErr

  const total = convRepo.getForParticipant(user.employeeId)
    .reduce((n, c) => n + countUnread(c.id, user.employeeId), 0)

  return { totalUnread: total }
}

export function getRoster(user, query = "", options = {}) {
  const selfErr = requireEmployeeId(user)
  if (selfErr) return selfErr

  const scope = options.scope === "all" ? "all" : "conversations"
  const filter = rosterFilterForUser(user)
  if (query.trim()) filter.q = query.trim()

  const employees = empRepo.getAll(filter)
    .filter(e => e.id !== user.employeeId)

  const conversations = convRepo.getForParticipant(user.employeeId)
  const convByPeer = new Map()
  for (const conv of conversations) {
    const peerId = getPeerId(conv, user.employeeId)
    if (peerId) convByPeer.set(peerId, conv)
  }

  const presenceRows = presenceRepo.getAll()
  const presenceMap = new Map(presenceRows.map(p => [p.employeeId, p]))

  let items = employees.map(emp => {
    const conv = convByPeer.get(emp.id)
    const unread = conv ? countUnread(conv.id, user.employeeId) : 0
    return {
      id: emp.id,
      name: emp.name,
      department: emp.department ?? "",
      position: emp.position ?? "",
      photos: emp.photos ?? [],
      online: isOnline(presenceMap.get(emp.id)),
      unread,
      lastMessage: decryptText(conv?.lastMessage ?? ""),
      lastMessageAt: conv?.lastMessageAt ?? null,
      conversationId: conv?.id ?? null,
    }
  })

  const onlineCount = items.filter(i => i.online).length

  if (scope === "conversations") {
    items = items.filter(i => i.conversationId && String(i.lastMessage ?? "").trim())
  }

  items.sort((a, b) => {
    if (b.unread !== a.unread) return b.unread - a.unread
    if (b.online !== a.online) return (b.online ? 1 : 0) - (a.online ? 1 : 0)
    const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
    const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
    return tb - ta
  })

  return { items, onlineCount, total: items.length, scope, rosterScope: getChatBranchFilter(user) ? "branch" : "company" }
}

export function heartbeat(user) {
  const selfErr = requireEmployeeId(user)
  if (selfErr) return selfErr

  const now = new Date().toISOString()
  const row = presenceRepo.upsert(user.employeeId, {
    status: "online",
    lastSeenAt: now,
  })

  return { employeeId: user.employeeId, lastSeenAt: row.lastSeenAt, online: true }
}

export function setOffline(user) {
  if (!user?.employeeId) return null
  return presenceRepo.upsert(user.employeeId, {
    status: "offline",
    lastSeenAt: new Date().toISOString(),
  })
}

export function getOnlineStatus(user) {
  const selfErr = requireEmployeeId(user)
  if (selfErr) return selfErr

  const filter = rosterFilterForUser(user)
  const employees = empRepo.getAll({ ...filter, status: "active" })
    .filter(e => e.id !== user.employeeId)

  const onlineMap = buildPresenceMap(employees.map(e => e.id))
  const onlineEmployees = employees
    .filter(e => onlineMap[e.id])
    .map(e => ({
      id: e.id,
      name: e.name,
      department: e.department ?? "",
      position: e.position ?? "",
      branchId: e.branchId ?? "",
      online: true,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"))

  return {
    onlineCount: onlineEmployees.length,
    onlineIds: onlineEmployees.map(e => e.id),
    presence: onlineMap,
    onlineEmployees,
    rosterScope: getChatBranchFilter(user) ? "branch" : "company",
  }
}
