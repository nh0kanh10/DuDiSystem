import * as svc from "../services/request.service.js"
import { ok, created, notFound, fail } from "../utils/response.js"
import { canManageRequests } from "../utils/access.js"

export function list(req, res) {
  const filter = { ...req.query }
  if (!canManageRequests(req.user)) {
    filter.employeeId = req.user.employeeId
  }
  ok(res, svc.listRequests(filter))
}

export function getOne(req, res) {
  const req_ = svc.getRequest(req.params.id)
  if (!req_) return notFound(res, "Không tìm thấy đơn")
  if (!canManageRequests(req.user) && req_.employeeId !== req.user.employeeId) {
    return fail(res, "Không có quyền xem đơn này", 403)
  }
  ok(res, req_)
}

export function create(req, res) {
  const body = { ...req.body }
  if (!canManageRequests(req.user)) {
    body.employeeId = req.user.employeeId
  }
  const result = svc.createRequest(body)
  if (result?.error) return fail(res, result.error, result.status)
  created(res, result)
}

export function cancel(req, res) {
  const employeeId = canManageRequests(req.user) ? req.body?.employeeId : req.user.employeeId
  const result = svc.cancelRequest(req.params.id, employeeId)
  if (!result) return notFound(res, "Không tìm thấy đơn")
  if (result.error) return fail(res, result.error, result.status)
  ok(res, result)
}

export function approve(req, res) {
  if (!canManageRequests(req.user)) return fail(res, "Không có quyền duyệt đơn", 403)
  const result = svc.approveRequest(req.params.id)
  if (!result) return notFound(res, "Không tìm thấy đơn")
  if (result.error) return fail(res, result.error, result.status)
  ok(res, result)
}

export function reject(req, res) {
  if (!canManageRequests(req.user)) return fail(res, "Không có quyền từ chối đơn", 403)
  const result = svc.rejectRequest(req.params.id)
  if (!result) return notFound(res, "Không tìm thấy đơn")
  if (result.error) return fail(res, result.error, result.status)
  ok(res, result)
}

export function remove(req, res) {
  if (!canManageRequests(req.user)) return fail(res, "Không có quyền xóa đơn", 403)
  const deleted = svc.deleteRequest(req.params.id)
  if (!deleted) return notFound(res, "Không tìm thấy đơn")
  ok(res, { message: "Đã xóa đơn" })
}
