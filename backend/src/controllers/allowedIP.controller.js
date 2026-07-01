import * as svc from "../services/allowedIP.service.js"
import { ok, created, notFound, fail } from "../utils/response.js"

export function list(req, res) {
  ok(res, svc.listAllowedIPs(req.query))
}

export function getOne(req, res) {
  const record = svc.getAllowedIP(req.params.id)
  if (!record) return notFound(res, "Không tìm thấy IP trong hệ thống")
  ok(res, record)
}

export function create(req, res) {
  const result = svc.createAllowedIP(req.body)
  if (result?.error) return fail(res, result.error, result.status)
  created(res, result)
}

export function update(req, res) {
  const result = svc.updateAllowedIP(req.params.id, req.body)
  if (!result) return notFound(res, "Không tìm thấy IP trong hệ thống")
  if (result?.error) return fail(res, result.error, result.status)
  ok(res, result)
}

export function toggle(req, res) {
  const result = svc.toggleAllowedIP(req.params.id)
  if (!result) return notFound(res, "Không tìm thấy IP trong hệ thống")
  ok(res, result)
}

export function remove(req, res) {
  const deleted = svc.deleteAllowedIP(req.params.id)
  if (!deleted) return notFound(res, "Không tìm thấy IP trong hệ thống")
  ok(res, { message: "Đã xóa địa chỉ IP khỏi danh sách cho phép" })
}
