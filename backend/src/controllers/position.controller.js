import * as svc from "../services/position.service.js"
import { ok, created, notFound } from "../utils/response.js"

export function list(req, res) {
  ok(res, svc.listPositions(req.query))
}

export function getOne(req, res) {
  const p = svc.getPosition(req.params.id)
  if (!p) return notFound(res, "Không tìm thấy vị trí")
  ok(res, p)
}

export function create(req, res) {
  created(res, svc.createPosition(req.body))
}

export function update(req, res) {
  const p = svc.updatePosition(req.params.id, req.body)
  if (!p) return notFound(res, "Không tìm thấy vị trí")
  ok(res, p)
}

export function remove(req, res) {
  const deleted = svc.deletePosition(req.params.id)
  if (!deleted) return notFound(res, "Không tìm thấy vị trí")
  ok(res, { message: "Đã xóa vị trí" })
}
