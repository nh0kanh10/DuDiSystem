import * as svc from "../services/role.service.js"
import { ok, created, notFound } from "../utils/response.js"

export function list(req, res) {
  ok(res, svc.listRoles())
}

export function getOne(req, res) {
  const r = svc.getRole(req.params.id)
  if (!r) return notFound(res, "Không tìm thấy vai trò")
  ok(res, r)
}

export function create(req, res) {
  created(res, svc.createRole(req.body))
}

export function update(req, res) {
  const r = svc.updateRole(req.params.id, req.body)
  if (!r) return notFound(res, "Không tìm thấy vai trò")
  ok(res, r)
}

export function remove(req, res) {
  const deleted = svc.deleteRole(req.params.id)
  if (!deleted) return notFound(res, "Không tìm thấy vai trò hoặc vai trò hệ thống không được phép xóa")
  ok(res, { message: "Đã xóa vai trò thành công" })
}
