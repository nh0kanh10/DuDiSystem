import * as svc from "../services/task.service.js"
import { ok, created, notFound, fail } from "../utils/response.js"
import { canManageTasks } from "../utils/access.js"

export function list(req, res) {
  const filter = { ...req.query }
  if (!canManageTasks(req.user)) {
    filter.assigneeId = req.user.employeeId
  }
  ok(res, svc.listTasks(filter))
}

export function getOne(req, res) {
  const task = svc.getTask(req.params.id)
  if (!task) return notFound(res, "Không tìm thấy công việc")
  if (!canManageTasks(req.user) && task.assigneeId !== req.user.employeeId) {
    return fail(res, "Không có quyền xem công việc này", 403)
  }
  ok(res, task)
}

export function create(req, res) {
  if (canManageTasks(req.user)) {
    created(res, svc.createTask(req.body))
    return
  }
  const assigneeId = req.user?.employeeId || req.user?.id
  if (!assigneeId) return fail(res, "Không xác định được nhân viên thực hiện", 400)
  const payload = {
    ...req.body,
    assigneeId,
    status: "todo",
  }
  created(res, svc.createTask(payload))
}

export function update(req, res) {
  const task = svc.getTask(req.params.id)
  if (!task) return notFound(res, "Không tìm thấy công việc")
  if (!canManageTasks(req.user) && task.assigneeId !== req.user.employeeId) {
    return fail(res, "Không có quyền cập nhật công việc này", 403)
  }
  const updated = svc.updateTask(req.params.id, req.body)
  ok(res, updated)
}

export function remove(req, res) {
  if (!canManageTasks(req.user)) return fail(res, "Không có quyền xóa công việc", 403)
  const deleted = svc.deleteTask(req.params.id)
  if (!deleted) return notFound(res, "Không tìm thấy công việc")
  ok(res, { message: "Đã xóa công việc" })
}
