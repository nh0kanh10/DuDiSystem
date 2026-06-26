import * as svc from "../services/employee.service.js"
import { ok, created, notFound } from "../utils/response.js"

export function list(req, res) {
  ok(res, svc.listEmployees(req.query))
}

export function getOne(req, res) {
  const emp = svc.getEmployee(req.params.id)
  if (!emp) return notFound(res, "Không tìm thấy nhân viên")
  ok(res, emp)
}

export function create(req, res) {
  created(res, svc.createEmployee(req.body))
}

export function update(req, res) {
  const emp = svc.updateEmployee(req.params.id, req.body)
  if (!emp) return notFound(res, "Không tìm thấy nhân viên")
  ok(res, emp)
}

export function remove(req, res) {
  const deleted = svc.deleteEmployee(req.params.id)
  if (!deleted) return notFound(res, "Không tìm thấy nhân viên")
  ok(res, { message: "Đã xóa nhân viên" })
}
