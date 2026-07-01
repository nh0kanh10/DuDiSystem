import * as svc from "../services/attendance.service.js"
import { ok, created, notFound, fail } from "../utils/response.js"
import { canViewAllAttendance } from "../utils/access.js"

function assertRecordAccess(user, record) {
  if (!record) return null
  if (canViewAllAttendance(user)) return null
  if (record.employeeId !== user.employeeId) {
    return { error: "Không có quyền truy cập bản ghi chấm công", status: 403 }
  }
  return null
}

function employeeIdFromRecordId(id, record) {
  if (id.startsWith("TEMP_")) return id.split("_")[1]
  return record?.employeeId
}

export function list(req, res) {
  const filter = { ...req.query }
  if (!canViewAllAttendance(req.user)) {
    filter.employeeId = req.user.employeeId
  }
  ok(res, svc.listAttendance(filter))
}

export function stats(req, res) {
  const filter = { ...req.query }
  if (!canViewAllAttendance(req.user)) {
    filter.employeeId = req.user.employeeId
  }
  ok(res, svc.getAttendanceStats(filter))
}

export function getOne(req, res) {
  const record = svc.getAttendance(req.params.id)
  if (!record) return notFound(res, "Không tìm thấy bản ghi")
  const denied = assertRecordAccess(req.user, record)
  if (denied) return fail(res, denied.error, denied.status)
  ok(res, record)
}

export function checkIP(req, res) {
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip;
  const ipToCheck = req.query.ip || clientIP;

  const validation = svc.validateClientIP(req.user.employeeId, ipToCheck, req.user);
  if (!validation.valid) {
    return fail(res, validation.error, 403);
  }

  ok(res, {
    valid: true,
    ip: ipToCheck,
    message: `Địa chỉ IP (${ipToCheck}) hợp lệ để chấm công.`
  });
}

export function create(req, res) {
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip;
  const ip = req.body.ip || clientIP;
  const body = { ...req.body, ip, reqUser: req.user }
  if (!canViewAllAttendance(req.user)) {
    body.employeeId = req.user.employeeId
  }

  const result = svc.createAttendance(body)
  if (result?.error) return fail(res, result.error, result.status)
  created(res, result)
}

export function update(req, res) {
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip;
  const ip = req.body.ip || clientIP;
  const existing = svc.getAttendance(req.params.id)
  const empId = employeeIdFromRecordId(req.params.id, existing)
  if (!canViewAllAttendance(req.user) && empId !== req.user.employeeId) {
    return fail(res, "Không có quyền chấm công cho nhân viên khác", 403)
  }

  const result = svc.updateAttendance(req.params.id, {
    ...req.body,
    ip,
    reqUser: req.user
  })
  if (!result) return notFound(res, "Không tìm thấy bản ghi")
  if (result?.error) return fail(res, result.error, result.status)
  ok(res, result)
}

export function remove(req, res) {
  if (!canViewAllAttendance(req.user)) return fail(res, "Không có quyền xóa bản ghi chấm công", 403)
  const deleted = svc.deleteAttendance(req.params.id)
  if (!deleted) return notFound(res, "Không tìm thấy bản ghi")
  ok(res, { message: "Đã xóa bản ghi chấm công" })
}
