import * as svc from "../services/template.service.js"
import { contentDispositionAttachment } from "../utils/contentDisposition.util.js"
import { ok, fail } from "../utils/response.js"

export async function list(req, res) {
  try {
    ok(res, await svc.listTemplates())
  } catch (err) {
    fail(res, err.message)
  }
}

export async function getInfo(req, res) {
  try {
    ok(res, await svc.getTemplateInfo(req.params.type))
  } catch (err) {
    fail(res, err.message)
  }
}

export async function download(req, res) {
  try {
    const { buffer, filename } = await svc.readTemplateFile(req.params.type)
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    res.setHeader("Content-Disposition", contentDispositionAttachment(filename))
    res.send(buffer)
  } catch (err) {
    res.status(404).json({ success: false, error: err.message })
  }
}

export async function upload(req, res) {
  try {
    if (!req.file?.buffer?.length) return fail(res, "Thiếu file .docx")
    const originalName = req.file.originalname || "template.docx"
    if (!/\.docx$/i.test(originalName)) return fail(res, "Chỉ chấp nhận file .docx")

    const data = await svc.saveTemplateOverride(req.params.type, req.file.buffer, {
      originalName,
      updatedBy: req.user?.employeeId ?? req.user?.id ?? "",
    })
    ok(res, data)
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export async function reset(req, res) {
  try {
    ok(res, await svc.resetTemplateOverride(req.params.type))
  } catch (err) {
    fail(res, err.message)
  }
}
