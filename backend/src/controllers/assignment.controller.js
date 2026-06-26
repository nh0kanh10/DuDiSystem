import * as svc from "../services/assignment.service.js"
import { ok, created, notFound } from "../utils/response.js"

export function list(req, res) {
  ok(res, svc.listAssignments(req.query))
}

export function create(req, res) {
  created(res, svc.createAssignment(req.body))
}

export function cancel(req, res) {
  const result = svc.cancelAssignment(req.params.id)
  if (!result) return notFound(res, "Không tìm thấy assignment")
  ok(res, result)
}
