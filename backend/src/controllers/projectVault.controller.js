import * as projectSvc from "../services/project.service.js"
import * as vaultSvc from "../services/projectVault.service.js"
import { contentDispositionAttachment } from "../utils/contentDisposition.util.js"
import { ok, created, notFound, fail } from "../utils/response.js"

function parseBody(req) {
  if (req.body?.data) {
    try {
      return JSON.parse(req.body.data)
    } catch {
      throw new Error("Dữ liệu JSON không hợp lệ")
    }
  }
  return req.body ?? {}
}

function filePayload(req) {
  if (!req.file?.buffer?.length) return null
  return {
    buffer: req.file.buffer,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
  }
}

export function list(req, res) {
  try {
    if (!projectSvc.getProject(req.params.projectId)) {
      return notFound(res, "Không tìm thấy dự án")
    }
    ok(res, vaultSvc.listVaultItems(req.params.projectId))
  } catch (err) {
    fail(res, err.message)
  }
}

export async function create(req, res) {
  try {
    const body = parseBody(req)
    const data = await vaultSvc.createVaultItem(
      req.params.projectId,
      body,
      filePayload(req),
      req.user,
    )
    created(res, data)
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export async function update(req, res) {
  try {
    const body = parseBody(req)
    const data = await vaultSvc.updateVaultItem(
      req.params.projectId,
      req.params.itemId,
      body,
      filePayload(req),
      req.user,
    )
    ok(res, data)
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export async function remove(req, res) {
  try {
    await vaultSvc.deleteVaultItem(req.params.projectId, req.params.itemId)
    ok(res, { message: "Đã xóa" })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export async function downloadFile(req, res) {
  try {
    const file = await vaultSvc.getVaultItemFile(req.params.projectId, req.params.itemId)
    if (!file) return notFound(res, "Không tìm thấy file")
    res.setHeader("Content-Type", file.mimeType)
    res.setHeader("Content-Disposition", contentDispositionAttachment(file.filename))
    res.send(file.buffer)
  } catch (err) {
    fail(res, err.message)
  }
}
