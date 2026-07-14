import * as svc from "../services/notification.service.js"
import { ok, created, notFound, fail } from "../utils/response.js"
import { isAdminUser } from "../utils/access.js"

export function list(req, res) {
  const filter = {}
  if (req.query.read === "true") filter.read = true
  if (req.query.read === "false") filter.read = false
  
  const isNotificationAdmin = isAdminUser(req.user) || 
    (req.user?.permissions && (req.user.permissions.includes("all") || req.user.permissions.includes("thong-bao")))

  if (req.query.view === "sent" && isNotificationAdmin) {
    if (req.query.recipientId) filter.recipientId = req.query.recipientId
  } else {
    const recipientId = req.user?.employeeId || req.user?.id || null
    if (recipientId) filter.recipientId = recipientId
  }
  ok(res, svc.listNotifications(filter))
}

export function create(req, res) {
  const result = svc.createNotification(req.body)
  if (Array.isArray(result)) {
    return created(res, { items: result, count: result.length })
  }
  return created(res, result)
}

export function markRead(req, res) {
  const target = svc.getNotificationById(req.params.id)
  if (!target) return notFound(res, "Không tìm thấy thông báo")
  const actorId = req.user?.employeeId || req.user?.id || null
  if (!isAdminUser(req.user) && target.recipientId && target.recipientId !== actorId) {
    return fail(res, "Không có quyền thao tác thông báo này", 403)
  }
  const result = svc.markRead(req.params.id)
  ok(res, result)
}

export function markAllRead(req, res) {
  const recipientId = req.user?.employeeId || req.user?.id || null
  ok(res, { count: svc.markAllRead(recipientId) })
}

export function remove(req, res) {
  const target = svc.getNotificationById(req.params.id)
  if (!target) return notFound(res, "Không tìm thấy thông báo")
  const actorId = req.user?.employeeId || req.user?.id || null
  if (!isAdminUser(req.user) && target.recipientId && target.recipientId !== actorId) {
    return fail(res, "Không có quyền thao tác thông báo này", 403)
  }
  const deleted = svc.deleteNotification(req.params.id)
  ok(res, { message: "Đã xóa thông báo" })
}
