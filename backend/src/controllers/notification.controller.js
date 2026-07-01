import * as svc from "../services/notification.service.js"
import { ok, created, notFound } from "../utils/response.js"

export function list(req, res) {
  const filter = {}
  if (req.query.read === "true") filter.read = true
  if (req.query.read === "false") filter.read = false
  const recipientId = req.user?.employeeId || req.user?.id || null
  if (recipientId) filter.recipientId = recipientId
  ok(res, svc.listNotifications(filter))
}

export function create(req, res) {
  created(res, svc.createNotification(req.body))
}

export function markRead(req, res) {
  const result = svc.markRead(req.params.id)
  if (!result) return notFound(res, "Không tìm thấy thông báo")
  ok(res, result)
}

export function markAllRead(req, res) {
  const recipientId = req.user?.employeeId || req.user?.id || null
  ok(res, { count: svc.markAllRead(recipientId) })
}

export function remove(req, res) {
  const deleted = svc.deleteNotification(req.params.id)
  if (!deleted) return notFound(res, "Không tìm thấy thông báo")
  ok(res, { message: "Đã xóa thông báo" })
}
