import * as svc from "../services/request.service.js"
import { ok, created, notFound, fail } from "../utils/response.js"

export function list(req, res) {
  ok(res, svc.listRequests(req.query))
}

export function getOne(req, res) {
  const req_ = svc.getRequest(req.params.id)
  if (!req_) return notFound(res, "Không tìm thấy đơn")
  ok(res, req_)
}

export function create(req, res) {
  const result = svc.createRequest(req.body)
  if (result?.error) return fail(res, result.error, result.status)
  created(res, result)
}

export function cancel(req, res) {
  const result = svc.cancelRequest(req.params.id, req.body?.employeeId)
  if (!result) return notFound(res, "Không tìm thấy đơn")
  if (result.error) return fail(res, result.error, result.status)
  ok(res, result)
}

export function approve(req, res) {
  const result = svc.approveRequest(req.params.id)
  if (!result) return notFound(res, "Không tìm thấy đơn")
  if (result.error) return fail(res, result.error, result.status)
  ok(res, result)
}

export function reject(req, res) {
  const result = svc.rejectRequest(req.params.id)
  if (!result) return notFound(res, "Không tìm thấy đơn")
  if (result.error) return fail(res, result.error, result.status)
  ok(res, result)
}

export function remove(req, res) {
  const deleted = svc.deleteRequest(req.params.id)
  if (!deleted) return notFound(res, "Không tìm thấy đơn")
  ok(res, { message: "Đã xóa đơn" })
}
