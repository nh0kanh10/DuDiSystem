import * as svc from "../services/orgNode.service.js"
import { ok, created, notFound, fail } from "../utils/response.js"

export function list(req, res) {
  ok(res, svc.listOrgNodes(req.query))
}

export function getOne(req, res) {
  const node = svc.getOrgNode(req.params.id)
  if (!node) return notFound(res, "Không tìm thấy đơn vị")
  ok(res, node)
}

export function create(req, res) {
  try {
    created(res, svc.createOrgNode(req.body))
  } catch (err) {
    fail(res, err.message || "Không thể tạo đơn vị")
  }
}

export function update(req, res) {
  try {
    const node = svc.updateOrgNode(req.params.id, req.body)
    if (!node) return notFound(res, "Không tìm thấy đơn vị")
    ok(res, node)
  } catch (err) {
    fail(res, err.message || "Không thể cập nhật đơn vị")
  }
}

export function changeStatus(req, res) {
  const { status } = req.body
  if (!["active", "inactive"].includes(status)) {
    return fail(res, "Trạng thái không hợp lệ")
  }
  const result = svc.changeStatus(req.params.id, status)
  if (!result) return notFound(res, "Không tìm thấy đơn vị")
  ok(res, result)
}

export function remove(req, res) {
  const result = svc.deleteOrgNode(req.params.id)
  if (!result) return notFound(res, "Không tìm thấy đơn vị")
  ok(res, result)
}

export function members(req, res) {
  const node = svc.getOrgNode(req.params.id)
  if (!node) return notFound(res, "Không tìm thấy đơn vị")
  ok(res, svc.getMembersOfNode(req.params.id))
}
