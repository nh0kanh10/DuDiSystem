import * as svc from "../services/staffChat.service.js"
import { ok, created, fail } from "../utils/response.js"
import { emitChatMessage, emitChatRead, emitUnreadCount, notifyPresenceHeartbeat } from "../socket/chat.socket.js"

function handleServiceResult(res, result) {
  if (result?.error) return fail(res, result.error, result.status ?? 400)
  return ok(res, result)
}

async function pushUnread(user) {
  const unread = svc.getUnreadCount(user)
  if (!unread?.error) {
    emitUnreadCount(user.employeeId, unread.totalUnread ?? 0)
  }
}

export function listConversations(req, res) {
  const result = svc.listConversations(req.user)
  if (result?.error) return fail(res, result.error, result.status ?? 400)
  ok(res, result)
}

export function openConversation(req, res) {
  const peerId = req.body?.peerId || req.params.peerId
  if (!peerId) return fail(res, "Thiếu mã nhân viên", 400)
  const result = svc.openConversation(req.user, peerId)
  if (result?.error) return fail(res, result.error, result.status ?? 400)
  created(res, result)
}

export function getThread(req, res) {
  const result = svc.getThreadMessages(req.user, req.params.peerId, {
    before: req.query.before,
    limit: req.query.limit,
  })
  return handleServiceResult(res, result)
}

export function sendMessage(req, res) {
  const body = req.body?.body ?? req.body?.text ?? req.body?.message
  const peerId = req.params.peerId
  const result = svc.sendMessage(req.user, peerId, body)
  if (result?.error) return fail(res, result.error, result.status ?? 400)

  emitChatMessage({
    senderId: req.user.employeeId,
    recipientId: peerId,
    conversationId: result.conversationId,
    rawMessage: result.rawMessage,
  })
  pushUnread({ employeeId: peerId })
  pushUnread(req.user)

  created(res, {
    conversationId: result.conversationId,
    message: result.message,
  })
}

export function markRead(req, res) {
  const peerId = req.params.peerId
  const result = svc.markThreadRead(req.user, peerId)
  if (result?.error) return fail(res, result.error, result.status ?? 400)

  emitChatRead({
    readerId: req.user.employeeId,
    peerId,
    conversationId: result.conversationId,
  })
  pushUnread(req.user)

  return handleServiceResult(res, result)
}

export function unreadCount(req, res) {
  const result = svc.getUnreadCount(req.user)
  return handleServiceResult(res, result)
}

export function roster(req, res) {
  const scope = req.query.scope === "all" ? "all" : "conversations"
  const result = svc.getRoster(req.user, req.query.q ?? "", { scope })
  return handleServiceResult(res, result)
}

export function presenceHeartbeat(req, res) {
  const result = svc.heartbeat(req.user)
  if (!result?.error) {
    notifyPresenceHeartbeat(req.user, result.lastSeenAt)
  }
  return handleServiceResult(res, result)
}

export function online(req, res) {
  const result = svc.getOnlineStatus(req.user)
  return handleServiceResult(res, result)
}
