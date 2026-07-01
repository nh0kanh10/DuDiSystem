import * as svc from "../services/project.service.js"
import { ok, created, notFound } from "../utils/response.js"

export function list(req, res) {
  ok(res, svc.listProjects(req.query))
}

export function getOne(req, res) {
  const p = svc.getProject(req.params.id)
  if (!p) return notFound(res, "Không tìm thấy dự án")
  ok(res, p)
}

export function create(req, res) {
  created(res, svc.createProject(req.body))
}

export function update(req, res) {
  const p = svc.updateProject(req.params.id, req.body)
  if (!p) return notFound(res, "Không tìm thấy dự án")
  ok(res, p)
}

export function remove(req, res) {
  const deleted = svc.deleteProject(req.params.id)
  if (!deleted) return notFound(res, "Không tìm thấy dự án")
  ok(res, { message: "Đã xóa dự án" })
}

export function addAttachment(req, res) {
  const p = svc.addAttachment(req.params.id, req.body)
  if (!p) return notFound(res, "Không tìm thấy dự án")
  ok(res, p)
}

export function removeAttachment(req, res) {
  const p = svc.removeAttachment(req.params.id, req.params.attachmentId)
  if (!p) return notFound(res, "Không tìm thấy dự án")
  ok(res, p)
}

export function addTeam(req, res) {
  const p = svc.addTeam(req.params.id, req.body)
  if (!p) return notFound(res, "Không tìm thấy dự án")
  ok(res, p)
}

export function updateTeam(req, res) {
  const p = svc.updateTeam(req.params.id, req.params.teamId, req.body)
  if (!p) return notFound(res, "Không tìm thấy dự án")
  ok(res, p)
}

export function removeTeam(req, res) {
  const p = svc.removeTeam(req.params.id, req.params.teamId)
  if (!p) return notFound(res, "Không tìm thấy dự án")
  ok(res, p)
}
