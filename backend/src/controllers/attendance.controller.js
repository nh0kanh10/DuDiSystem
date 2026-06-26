import * as svc from "../services/attendance.service.js"
import { ok, created, notFound, fail } from "../utils/response.js"

export function list(req, res) {
  ok(res, svc.listAttendance(req.query))
}

export function stats(req, res) {
  ok(res, svc.getAttendanceStats(req.query.date))
}

export function getOne(req, res) {
  const record = svc.getAttendance(req.params.id)
  if (!record) return notFound(res, "Không tìm thấy bản ghi")
  ok(res, record)
}

export function create(req, res) {
  const result = svc.createAttendance(req.body)
  if (result?.error) return fail(res, result.error, result.status)
  created(res, result)
}

export function update(req, res) {
  const record = svc.updateAttendance(req.params.id, req.body)
  if (!record) return notFound(res, "Không tìm thấy bản ghi")
  ok(res, record)
}

export function remove(req, res) {
  const deleted = svc.deleteAttendance(req.params.id)
  if (!deleted) return notFound(res, "Không tìm thấy bản ghi")
  ok(res, { message: "Đã xóa bản ghi chấm công" })
}
