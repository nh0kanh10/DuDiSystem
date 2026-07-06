import * as leadSvc from "../services/lead.service.js"
import * as docSvc from "../services/leadDocument.service.js"
import * as formSvc from "../services/leadForm.service.js"
import { contentDispositionAttachment, mimeFromFilename } from "../utils/contentDisposition.util.js"
import { ok, created, notFound, fail } from "../utils/response.js"

export function list(req, res) {
  try {
    ok(res, leadSvc.listLeads(req.query))
  } catch (err) {
    fail(res, err.message)
  }
}

export function getOne(req, res) {
  try {
    const lead = leadSvc.getLead(req.params.leadId)
    if (!lead) return notFound(res, "Không tìm thấy lead")
    ok(res, lead)
  } catch (err) {
    fail(res, err.message)
  }
}

export function create(req, res) {
  try {
    created(res, leadSvc.createLead(req.body))
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export function update(req, res) {
  try {
    const lead = leadSvc.updateLead(req.params.leadId, req.body)
    if (!lead) return notFound(res, "Không tìm thấy lead")
    ok(res, lead)
  } catch (err) {
    fail(res, err.message)
  }
}

export function remove(req, res) {
  try {
    const deleted = leadSvc.deleteLead(req.params.leadId)
    if (!deleted) return notFound(res, "Không tìm thấy lead")
    ok(res, { message: "Đã xóa lead" })
  } catch (err) {
    fail(res, err.message)
  }
}

export function addNote(req, res) {
  try {
    const lead = leadSvc.addLeadNote(req.params.leadId, req.body?.content, req.user)
    if (!lead) return notFound(res, "Không tìm thấy lead")
    ok(res, lead)
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export function updateNote(req, res) {
  try {
    const lead = leadSvc.updateLeadNote(req.params.leadId, req.params.noteId, req.body?.content, req.user)
    if (!lead) return notFound(res, "Không tìm thấy lead")
    ok(res, lead)
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export function removeNote(req, res) {
  try {
    const lead = leadSvc.deleteLeadNote(req.params.leadId, req.params.noteId)
    if (!lead) return notFound(res, "Không tìm thấy lead")
    ok(res, lead)
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export function listDocuments(req, res) {
  try {
    const { leadId } = req.params
    if (!leadSvc.getLead(leadId)) return notFound(res, "Không tìm thấy lead")
    ok(res, docSvc.listDocuments(leadId, req.query.type || undefined))
  } catch (err) {
    fail(res, err.message)
  }
}

export function getLatestDocument(req, res) {
  try {
    const { leadId } = req.params
    if (!leadSvc.getLead(leadId)) return notFound(res, "Không tìm thấy lead")
    ok(res, docSvc.getLatestDocument(leadId, req.query.type || "quote"))
  } catch (err) {
    fail(res, err.message)
  }
}

export function getDocument(req, res) {
  try {
    const { leadId, docId } = req.params
    const data = docSvc.getDocument(leadId, docId)
    if (!data) return notFound(res, "Không tìm thấy tài liệu")
    ok(res, data)
  } catch (err) {
    fail(res, err.message)
  }
}

export async function createDocument(req, res) {
  try {
    const { leadId } = req.params
    if (!leadSvc.getLead(leadId)) return notFound(res, "Không tìm thấy lead")
    const { type, payload, label } = req.body ?? {}
    const data = await docSvc.saveDocument(leadId, { type, payload, label }, req.user)
    created(res, data)
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export async function updateDocument(req, res) {
  try {
    const { leadId, docId } = req.params
    if (!leadSvc.getLead(leadId)) return notFound(res, "Không tìm thấy lead")
    const { payload, label } = req.body ?? {}
    if (!payload) return fail(res, "Thiếu payload")
    const data = await docSvc.updateDocument(leadId, docId, { payload, label }, req.user)
    ok(res, data)
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export async function removeDocument(req, res) {
  try {
    const { leadId, docId } = req.params
    if (!leadSvc.getLead(leadId)) return notFound(res, "Không tìm thấy lead")
    await docSvc.deleteDocument(leadId, docId)
    ok(res, { message: "Đã xóa tài liệu" })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export async function createContractFromQuote(req, res) {
  try {
    const { leadId } = req.params
    if (!leadSvc.getLead(leadId)) return notFound(res, "Không tìm thấy lead")
    const { quoteDocId, partyA, contractMeta, label } = req.body ?? {}
    if (!quoteDocId) return fail(res, "Thiếu quoteDocId")
    const data = await docSvc.createContractFromApprovedQuote(
      leadId,
      quoteDocId,
      { partyA, contractMeta, label },
      req.user,
    )
    created(res, data)
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export async function downloadDocument(req, res) {
  try {
    const { leadId, docId } = req.params
    const file = await docSvc.getDocumentFile(leadId, docId)
    if (!file) return notFound(res, "Không tìm thấy file")
    const filename = file.filename
    res.setHeader("Content-Type", mimeFromFilename(filename))
    res.setHeader("Content-Disposition", contentDispositionAttachment(filename))
    res.send(file.buffer)
  } catch (err) {
    fail(res, err.message)
  }
}

export function convertToProject(req, res) {
  try {
    const result = leadSvc.convertLeadToProject(req.params.leadId, req.body ?? {}, req.user)
    res.status(result.alreadyExists ? 200 : 201).json({ success: true, data: result })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export function issueFormLink(req, res) {
  try {
    const formType = req.body?.formType
    const result = formSvc.issueFormLink(req.params.leadId, formType)
    ok(res, result)
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export function revokeFormLink(req, res) {
  try {
    const lead = formSvc.revokeFormLink(req.params.leadId)
    ok(res, lead)
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export function addRequirementRound(req, res) {
  try {
    const { title, notes, formType } = req.body ?? {}
    const result = formSvc.addInternalRequirement(req.params.leadId, { title, notes, formType })
    ok(res, result)
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export async function createContractAppendix(req, res) {
  try {
    const { leadId, docId } = req.params
    if (!leadSvc.getLead(leadId)) return notFound(res, "Không tìm thấy lead")
    if (!req.file?.buffer?.length) {
      return res.status(400).json({ success: false, error: "Vui lòng tải lên file Word (.docx)" })
    }
    const data = await docSvc.createContractAppendix(leadId, docId, {
      fileBuffer: req.file.buffer,
      originalFilename: req.file.originalname,
      label: req.body?.label || req.body?.title,
    }, req.user)
    ok(res, data)
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export async function uploadDocument(req, res) {
  try {
    const { leadId } = req.params
    const type = req.query.type || req.body.type || "solution"
    if (!leadSvc.getLead(leadId)) return notFound(res, "Không tìm thấy lead")
    if (!req.file?.buffer?.length) {
      return res.status(400).json({ success: false, error: "Vui lòng chọn file tải lên" })
    }
    const data = await docSvc.uploadDirectDocument(leadId, type, {
      fileBuffer: req.file.buffer,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      label: req.body?.label,
    }, req.user)
    ok(res, data)
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}
