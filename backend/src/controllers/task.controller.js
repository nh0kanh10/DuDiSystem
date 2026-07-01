import * as svc from "../services/task.service.js"
import { ok, created, notFound } from "../utils/response.js"

export function list(req, res) {
  ok(res, svc.listTasks(req.query))
}

export function getOne(req, res) {
  const task = svc.getTask(req.params.id)
  if (!task) return notFound(res, "Không tìm thấy công việc")
  ok(res, task)
}

export function create(req, res) {
  created(res, svc.createTask(req.body))
}

export function update(req, res) {
  const task = svc.updateTask(req.params.id, req.body)
  if (!task) return notFound(res, "Không tìm thấy công việc")
  ok(res, task)
}

export function remove(req, res) {
  const deleted = svc.deleteTask(req.params.id)
  if (!deleted) return notFound(res, "Không tìm thấy công việc")
  ok(res, { message: "Đã xóa công việc" })
}
