import * as svc from "../services/employee.service.js"
import { ok, created, notFound, fail } from "../utils/response.js"
import { canManageEmployees } from "../utils/access.js"

const DIRECTORY_FIELDS = ["id", "name", "email", "phone", "department", "position", "status", "photos", "orgNodeId", "branchId"]

function toDirectory(emp) {
  return Object.fromEntries(DIRECTORY_FIELDS.filter(k => emp[k] !== undefined).map(k => [k, emp[k]]))
}

export function list(req, res) {
  const rows = svc.listEmployees(req.query)
  if (canManageEmployees(req.user)) {
    ok(res, rows)
    return
  }
  ok(res, rows
    .filter(e => e.status === "active" || e.status === "intern")
    .map(toDirectory))
}

export function getOne(req, res) {
  const emp = svc.getEmployee(req.params.id)
  if (!emp) return notFound(res, "Không tìm thấy nhân viên")
  if (!canManageEmployees(req.user) && req.params.id !== req.user.employeeId) {
    return fail(res, "Không có quyền xem hồ sơ này", 403)
  }
  ok(res, emp)
}

export async function create(req, res, next) {
  if (!canManageEmployees(req.user)) return fail(res, "Không có quyền tạo nhân viên", 403)
  try {
    const emp = await svc.createEmployee(req.body)
    created(res, emp)
  } catch (err) {
    next(err)
  }
}

export function update(req, res) {
  if (!canManageEmployees(req.user)) return fail(res, "Không có quyền cập nhật nhân viên", 403)
  const emp = svc.updateEmployee(req.params.id, req.body)
  if (!emp) return notFound(res, "Không tìm thấy nhân viên")
  ok(res, emp)
}

export function remove(req, res) {
  if (!canManageEmployees(req.user)) return fail(res, "Không có quyền xóa nhân viên", 403)
  const deleted = svc.deleteEmployee(req.params.id)
  if (!deleted) return notFound(res, "Không tìm thấy nhân viên")
  ok(res, { message: "Đã xóa nhân viên" })
}
