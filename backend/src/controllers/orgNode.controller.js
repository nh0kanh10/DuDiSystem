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
  created(res, svc.createOrgNode(req.body))
}

export function update(req, res) {
  const node = svc.updateOrgNode(req.params.id, req.body)
  if (!node) return notFound(res, "Không tìm thấy đơn vị")
  ok(res, node)
}

export function changeStatus(req, res) {
  const { status } = req.body
  if (!["active", "inactive"].includes(status)) {
    return fail(res, "Trạng thái không hợp lệ")
  }
  ok(res, svc.changeStatus(req.params.id, status))
}

export function remove(req, res) {
  ok(res, svc.deleteOrgNode(req.params.id))
}

export function members(req, res) {
  const node = svc.getOrgNode(req.params.id)
  if (!node) return notFound(res, "Không tìm thấy đơn vị")
  ok(res, svc.getMembersOfNode(req.params.id))
}
