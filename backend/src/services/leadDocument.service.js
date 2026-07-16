import fs from "fs"
import { v4 as uuidv4 } from "uuid"
import Docxtemplater from "docxtemplater"
import * as repo from "../repositories/leadDocument.repository.js"
import * as quoteSvc from "./quote.service.js"
import * as contractSvc from "./contract.service.js"
import * as leadSvc from "./lead.service.js"
import { loadTemplateZip } from "./template.service.js"
import { getFileStorage, leadDocumentKey } from "../storage/index.js"
import { FILE_STORAGE_PROVIDER } from "../config/index.js"
import { getById as getEmployeeById } from "../repositories/employee.repository.js"
import {
  contractDownloadName,
  quoteDownloadName,
  resolveDocumentDownloadName,
} from "../utils/filename.util.js"
import { decodeUploadFilename } from "../utils/uploadFilename.util.js"

function displayName(employeeId) {
  if (!employeeId) return ""
  return getEmployeeById(employeeId)?.name ?? employeeId
}

const SOLUTION_EXT = /\.(pdf|doc|docx|ppt|pptx|png|jpe?g)$/i
const WORD_EXT = /\.(doc|docx)$/i

function assertAllowedUpload(type, filename) {
  const name = String(filename || "").toLowerCase()
  if (type === "solution") {
    if (!SOLUTION_EXT.test(name)) {
      throw new Error(
        "Giải pháp: chấp nhận PDF, Word, PowerPoint, ảnh (.pdf, .doc, .docx, .ppt, .pptx, .png, .jpg)",
      )
    }
    return
  }
  if (type === "quote" || type === "contract") {
    const isDoc = WORD_EXT.test(name)
    const isPdf = /\.pdf$/i.test(name)
    if (!isDoc && !isPdf) {
      throw new Error("Chỉ chấp nhận file Word (.doc, .docx) hoặc PDF (.pdf)")
    }
    return
  }
  throw new Error("Loại tài liệu không hợp lệ")
}

function quoteFilename(payload = {}) {
  return quoteDownloadName(payload.project)
}

function contractFilename(payload = {}) {
  return contractDownloadName(payload.projectName || payload.project)
}

async function generateContractDocx(contractPayload) {
  try {
    const templateData = contractSvc.buildContractTemplateData(contractPayload)
    const zip = await loadTemplateZip("contract")
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
    })
    doc.render(templateData)
    return doc.getZip().generate({ type: "nodebuffer" })
  } catch (err) {
    if (err.message?.includes("Chưa có template")) return null
    throw err
  }
}

export async function generateContractDocxBuffer(contractPayload) {
  const buffer = await generateContractDocx(contractPayload)
  if (!buffer) throw new Error("Chưa có template hợp đồng")
  return buffer
}

async function persistDocumentFile(leadId, type, docId, payload) {
  if (type === "quote") {
    const buffer = await quoteSvc.generateQuoteDocx(payload)
    const storageKey = leadDocumentKey(leadId, type, docId, "document.docx")
    await getFileStorage().put(storageKey, buffer)
    return {
      storageKey,
      fileSize: buffer.length,
      downloadName: quoteFilename(payload),
    }
  }
  if (type === "contract") {
    const buffer = await generateContractDocx(payload)
    if (!buffer) {
      return { storageKey: null, fileSize: 0, downloadName: contractFilename(payload) }
    }
    const storageKey = leadDocumentKey(leadId, type, docId, "document.docx")
    await getFileStorage().put(storageKey, buffer)
    return {
      storageKey,
      fileSize: buffer.length,
      downloadName: contractFilename(payload),
    }
  }
  throw new Error("Loại tài liệu không hợp lệ")
}

function publicDoc(doc) {
  return {
    ...doc,
    payload: undefined,
    downloadName: resolveDocumentDownloadName(doc),
    hasFile: Boolean(doc.fileSize && (doc.storageKey || doc.filePath)),
    isAppendix: Boolean(doc.parentDocumentId || doc.documentKind === "contract_appendix" || doc.payload?.isAppendix),
    uploadedFile: Boolean(doc.payload?.uploadedFile),
  }
}

async function readStoredFile(doc) {
  const storage = getFileStorage()
  if (doc.storageKey) {
    return storage.get(doc.storageKey)
  }
  if (doc.filePath && fs.existsSync(doc.filePath)) {
    return fs.readFileSync(doc.filePath)
  }
  return null
}

export function listDocuments(leadId, type) {
  return repo.listByLead(leadId, type).map(publicDoc)
}

export function getLatestDocument(leadId, type = "quote") {
  const [latest] = repo.listByLead(leadId, type)
  return latest ?? null
}

export async function saveDocument(leadId, { type = "quote", payload = {}, label, parentDocumentId, documentKind }, user = {}) {
  if (!leadId) throw new Error("Thiếu leadId")
  if (!["quote", "contract"].includes(type)) throw new Error("Loại tài liệu không hợp lệ")

  const isAppendix = Boolean(parentDocumentId || documentKind === "contract_appendix" || payload.isAppendix)
  const version = isAppendix && parentDocumentId
    ? repo.nextAppendixVersion(leadId, parentDocumentId)
    : repo.nextVersion(leadId, type)
  const id = `LDOC-${uuidv4().slice(0, 8).toUpperCase()}`
  const createdAt = new Date().toISOString()
  const createdBy = user.employeeId ?? user.id ?? ""
  const defaultLabel = type === "quote"
    ? `Báo giá #${version}`
    : isAppendix
      ? `Phụ lục #${version}`
      : `Hợp đồng #${version}`

  const finalLabel = String(label || defaultLabel).trim() || defaultLabel
  if (type === "contract" && !isAppendix) {
    const list = repo.listByLead(leadId, "contract").filter(d => !d.parentDocumentId)
    if (list.some(d => d.label.toLowerCase() === finalLabel.toLowerCase())) {
      throw new Error("Tên hợp đồng gốc đã tồn tại, vui lòng đặt tên khác.")
    }
  }

  const file = await persistDocumentFile(leadId, type, id, payload)
  const doc = {
    id,
    leadId: String(leadId),
    type,
    documentKind: documentKind || (isAppendix ? "contract_appendix" : type),
    version,
    label: finalLabel,
    downloadName: file.downloadName,
    storageProvider: FILE_STORAGE_PROVIDER,
    storageKey: file.storageKey,
    filePath: null,
    fileSize: file.fileSize,
    payload,
    sourceDocumentId: payload.sourceDocumentId ?? parentDocumentId ?? null,
    parentDocumentId: parentDocumentId || payload.parentDocumentId || null,
    createdAt,
    createdBy,
    createdByName: displayName(createdBy),
  }

  repo.create(doc)
  const lead = leadSvc.getLead(leadId)
  if (lead) {
    if (type === "contract") {
      if (["new", "contacted", "requirement-gathering", "requirement-done", "quoted"].includes(lead.status)) {
        leadSvc.updateLead(leadId, { status: "contracted" })
      }
    } else if (type === "quote") {
      if (["new", "contacted", "requirement-gathering", "requirement-done"].includes(lead.status)) {
        leadSvc.updateLead(leadId, { status: "quoted" })
      }
    }
  }
  return publicDoc(doc)
}

export async function updateDocument(leadId, docId, { payload, label, parentDocumentId }, user = {}) {
  const doc = repo.getById(docId)
  if (!doc || String(doc.leadId) !== String(leadId)) {
    throw new Error("Không tìm thấy tài liệu")
  }

  if (label != null) {
    const finalLabel = String(label).trim()
    if (doc.parentDocumentId || doc.documentKind === "contract_appendix") {
      const baseLabel = finalLabel.split(" — ")[0]
      const list = repo.listByLead(leadId, "contract").filter(d => d.parentDocumentId)
      const isDuplicate = list.some(d => {
        if (d.id === docId) return false
        return d.label.split(" — ")[0].toLowerCase() === baseLabel.toLowerCase()
      })
      if (isDuplicate) {
        throw new Error("Tên phụ lục đã tồn tại, vui lòng chọn tên khác.")
      }
    } else if (doc.type === "contract") {
      const list = repo.listByLead(leadId, "contract").filter(d => !d.parentDocumentId)
      const isDuplicate = list.some(d => d.id !== docId && d.label.toLowerCase() === finalLabel.toLowerCase())
      if (isDuplicate) {
        throw new Error("Tên hợp đồng gốc đã tồn tại, vui lòng đặt tên khác.")
      }
    }
  }

  const isUploaded = doc.payload?.uploadedFile || doc.uploadedFile || doc.documentKind === "contract_appendix" || doc.documentKind === "uploaded_doc"
  let file = { downloadName: doc.downloadName, storageKey: doc.storageKey, fileSize: doc.fileSize }
  if (!isUploaded && (doc.type === "quote" || doc.type === "contract")) {
    file = await persistDocumentFile(leadId, doc.type, docId, payload || doc.payload)
  }

  console.log(`[leadDocument] updateDocument docId=${docId} parentDocumentId=${parentDocumentId} currentParent=${doc.parentDocumentId}`)
  const updatedBy = user.employeeId ?? user.id ?? ""
  let finalLabel = label != null ? String(label).trim() || doc.label : doc.label
  let finalParentDocId = parentDocumentId !== undefined ? parentDocumentId : doc.parentDocumentId
  let finalPayload = {
    ...(doc.payload || {}),
    ...(payload || {}),
    parentDocumentId: finalParentDocId || null,
  }

  if (parentDocumentId !== undefined && parentDocumentId !== doc.parentDocumentId) {
    const parentDoc = repo.getById(parentDocumentId)
    if (parentDoc) {
      finalPayload.parentContractLabel = parentDoc.label
      const baseLabel = finalLabel.split(" — ")[0]
      finalLabel = `${baseLabel} — ${parentDoc.label}`
    } else {
      finalPayload.parentContractLabel = ""
      finalLabel = finalLabel.split(" — ")[0]
    }
  }

  const patch = {
    payload: finalPayload,
    label: finalLabel,
    downloadName: file.downloadName,
    storageKey: file.storageKey ?? doc.storageKey,
    fileSize: file.fileSize,
    parentDocumentId: finalParentDocId || null,
    sourceDocumentId: finalParentDocId || null,
    updatedAt: new Date().toISOString(),
    updatedBy,
    updatedByName: displayName(updatedBy),
  }

  const updated = repo.updateById(docId, patch)
  return publicDoc(updated)
}

export async function deleteDocument(leadId, docId) {
  const doc = repo.getById(docId)
  if (!doc || String(doc.leadId) !== String(leadId)) {
    throw new Error("Không tìm thấy tài liệu")
  }
  if (doc.storageKey) {
    try {
      await getFileStorage().remove(doc.storageKey)
    } catch {
    }
  }
  repo.deleteById(docId)
  return { id: docId }
}

export async function createContractFromApprovedQuote(leadId, quoteDocId, options = {}, user = {}) {
  const quoteDoc = repo.getById(quoteDocId)
  if (!quoteDoc || String(quoteDoc.leadId) !== String(leadId)) {
    throw new Error("Không tìm thấy báo giá nguồn")
  }
  if (quoteDoc.type !== "quote") throw new Error("Tài liệu nguồn phải là báo giá")

  const lead = leadSvc.getLead(leadId)
  const contractPayload = contractSvc.buildContractPayload({
    quotePayload: quoteDoc.payload,
    lead: lead ?? { id: leadId, name: quoteDoc.payload?.project },
    partyA: options.partyA ?? {},
    contractMeta: options.contractMeta ?? {},
  })
  contractPayload.sourceDocumentId = quoteDoc.id
  contractPayload.sourceDocumentLabel = quoteDoc.label
  const label = options.label || `Hợp đồng từ ${quoteDoc.label}`

  return saveDocument(leadId, { type: "contract", payload: contractPayload, label }, user)
}

export async function createContractAppendix(leadId, parentDocId, options = {}, user = {}) {
  const parentDoc = repo.getById(parentDocId)
  if (!parentDoc || String(parentDoc.leadId) !== String(leadId)) {
    throw new Error("Không tìm thấy hợp đồng gốc")
  }
  if (parentDoc.type !== "contract" || parentDoc.parentDocumentId) {
    throw new Error("Chỉ thêm phụ lục cho hợp đồng chính")
  }

  const fileBuffer = options.fileBuffer
  if (!fileBuffer?.length) {
    throw new Error("Vui lòng tải lên file Word (.docx) hoặc PDF (.pdf)")
  }

  const originalName = decodeUploadFilename(String(options.originalFilename || "phu-luc.docx").trim())
  const isDoc = originalName.toLowerCase().endsWith(".docx")
  const isPdf = originalName.toLowerCase().endsWith(".pdf")
  if (!isDoc && !isPdf) {
    throw new Error("Chỉ chấp nhận file .docx hoặc .pdf")
  }

  const version = repo.nextAppendixVersion(leadId, parentDoc.id)
  const id = `LDOC-${uuidv4().slice(0, 8).toUpperCase()}`
  const createdAt = new Date().toISOString()
  const createdBy = user.employeeId ?? user.id ?? ""
  const baseLabel = String(options.label || options.title || "").trim()
    || originalName.replace(/\.(docx|pdf)$/i, "")
    || `Phụ lục #${version}`

  const list = repo.listByLead(leadId, "contract").filter(d => d.parentDocumentId)
  if (list.some(d => d.label.split(" — ")[0].toLowerCase() === baseLabel.toLowerCase())) {
    throw new Error(`Tên phụ lục "${baseLabel}" đã tồn tại trên hệ thống.`)
  }

  const label = `${baseLabel} — ${parentDoc.label}`
  const downloadName = originalName

  const storageKey = leadDocumentKey(leadId, "contract", id, downloadName)
  await getFileStorage().put(storageKey, fileBuffer, {
    contentType: isPdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })

  const payload = {
    documentKind: "contract_appendix",
    isAppendix: true,
    uploadedFile: true,
    parentDocumentId: parentDoc.id,
    parentContractLabel: parentDoc.label,
    originalFilename: downloadName,
    appendixNo: String(version).padStart(2, "0"),
    appendixTitle: baseLabel,
  }

  const doc = {
    id,
    leadId: String(leadId),
    type: "contract",
    documentKind: "contract_appendix",
    version,
    label,
    downloadName,
    storageProvider: FILE_STORAGE_PROVIDER,
    storageKey,
    filePath: null,
    fileSize: fileBuffer.length,
    payload,
    sourceDocumentId: parentDoc.id,
    parentDocumentId: parentDoc.id,
    createdAt,
    createdBy,
    createdByName: displayName(createdBy),
  }

  repo.create(doc)
  return publicDoc(doc)
}

export function getDocument(leadId, docId) {
  const doc = repo.getById(docId)
  if (!doc || String(doc.leadId) !== String(leadId)) return null
  return doc
}

export async function getDocumentFile(leadId, docId) {
  const doc = repo.getById(docId)
  if (!doc || String(doc.leadId) !== String(leadId)) return null
  if (!doc.storageKey && !doc.filePath) return null
  const buffer = await readStoredFile(doc)
  if (!buffer) return null
  return { buffer, filename: resolveDocumentDownloadName(doc), doc }
}

export async function uploadDirectDocument(leadId, type, options = {}, user = {}) {
  const fileBuffer = options.fileBuffer
  if (!fileBuffer?.length) {
    throw new Error("Vui lòng tải lên file đính kèm")
  }

  const originalName = decodeUploadFilename(String(options.originalFilename || "tai-lieu.docx").trim())
  assertAllowedUpload(type, originalName)
  const version = repo.nextVersion(leadId, type)
  const id = `LDOC-${uuidv4().slice(0, 8).toUpperCase()}`
  const createdAt = new Date().toISOString()
  const createdBy = user.employeeId ?? user.id ?? ""

  const baseLabel = String(options.label || "").trim() || originalName.replace(/\.[^/.]+$/, "")
  const label = baseLabel
  if (type === "contract") {
    const list = repo.listByLead(leadId, "contract").filter(d => !d.parentDocumentId)
    if (list.some(d => d.label.toLowerCase() === label.toLowerCase())) {
      throw new Error("Tên hợp đồng gốc đã tồn tại, vui lòng đặt tên khác.")
    }
  }
  const downloadName = originalName

  const storageKey = leadDocumentKey(leadId, type, id, downloadName)
  await getFileStorage().put(storageKey, fileBuffer, {
    contentType: options.mimeType || undefined,
  })

  const payload = {
    documentKind: "uploaded_doc",
    uploadedFile: true,
    originalName,
  }

  const doc = {
    id,
    leadId: String(leadId),
    type,
    version,
    label,
    downloadName,
    storageProvider: FILE_STORAGE_PROVIDER,
    storageKey,
    filePath: null,
    fileSize: fileBuffer.length,
    payload,
    createdAt,
    createdBy,
    createdByName: displayName(createdBy),
  }

  repo.create(doc)
  const lead = leadSvc.getLead(leadId)
  if (lead) {
    if (type === "contract") {
      if (["new", "contacted", "requirement-gathering", "requirement-done", "quoted"].includes(lead.status)) {
        leadSvc.updateLead(leadId, { status: "contracted" })
      }
    } else if (type === "quote") {
      if (["new", "contacted", "requirement-gathering", "requirement-done"].includes(lead.status)) {
        leadSvc.updateLead(leadId, { status: "quoted" })
      }
    }
  }
  return publicDoc(doc)
}
