import * as svc from "../services/group.service.js"
import { ok, created, notFound } from "../utils/response.js"

export const list   = (req, res) => ok(res, svc.listGroups())
export const getOne = (req, res) => { const g = svc.getGroup(req.params.id); g ? ok(res, g) : notFound(res, "Không tìm thấy nhóm") }
export const create = (req, res) => created(res, svc.createGroup(req.body))
export const update = (req, res) => { const g = svc.updateGroup(req.params.id, req.body); g ? ok(res, g) : notFound(res, "Không tìm thấy nhóm") }
export const remove = (req, res) => { const g = svc.deleteGroup(req.params.id); g ? ok(res, { message: "Đã xóa" }) : notFound(res, "Không tìm thấy nhóm") }
