import * as svc from "../services/attendance.service.js"
import { ok, created, notFound, fail } from "../utils/response.js"

export function list(req, res) {
  ok(res, svc.listAttendance(req.query))
}

export function stats(req, res) {
  ok(res, svc.getAttendanceStats(req.query))
}

export function getOne(req, res) {
  const record = svc.getAttendance(req.params.id)
  if (!record) return notFound(res, "Không tìm thấy bản ghi")
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

  const result = svc.createAttendance({
    ...req.body,
    ip,
    reqUser: req.user
  })
  if (result?.error) return fail(res, result.error, result.status)
  created(res, result)
}

export function update(req, res) {
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip;
  const ip = req.body.ip || clientIP;

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
  const deleted = svc.deleteAttendance(req.params.id)
  if (!deleted) return notFound(res, "Không tìm thấy bản ghi")
  ok(res, { message: "Đã xóa bản ghi chấm công" })
}
