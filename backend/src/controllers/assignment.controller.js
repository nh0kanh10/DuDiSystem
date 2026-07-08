import * as svc from "../services/assignment.service.js"
import { ok, created, notFound, fail } from "../utils/response.js"

export function list(req, res) {
  ok(res, svc.listAssignments(req.query))
}

export function create(req, res) {
  try {
    created(res, svc.createAssignment(req.body))
  } catch (err) {
    fail(res, err.message || "Không thể tạo phân công")
  }
}

export function cancel(req, res) {
  const result = svc.cancelAssignment(req.params.id)
  if (!result) return notFound(res, "Không tìm thấy assignment")
  ok(res, result)
}
