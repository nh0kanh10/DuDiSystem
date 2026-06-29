import * as svc from "../services/announcement.service.js"
import { ok, created, notFound } from "../utils/response.js"

export const list   = (req, res) => ok(res, svc.listAnnouncements())
export const stats  = (req, res) => ok(res, svc.getStats())
export const getOne = (req, res) => { const a = svc.getAnnouncement(req.params.id); a ? ok(res, a) : notFound(res, "Không tìm thấy thông báo") }
export const create = (req, res) => created(res, svc.createAnnouncement(req.body))
export const update = (req, res) => { const a = svc.updateAnnouncement(req.params.id, req.body); a ? ok(res, a) : notFound(res, "Không tìm thấy thông báo") }
export const remove = (req, res) => { const a = svc.deleteAnnouncement(req.params.id); a ? ok(res, { message: "Đã xóa" }) : notFound(res, "Không tìm thấy thông báo") }
