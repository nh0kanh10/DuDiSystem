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
    if (!WORD_EXT.test(name)) throw new Error("Chỉ chấp nhận file Word (.doc, .docx)")
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

  const file = await persistDocumentFile(leadId, type, id, payload)
  const doc = {
    id,
    leadId: String(leadId),
    type,
    documentKind: documentKind || (isAppendix ? "contract_appendix" : type),
    version,
    label: String(label || defaultLabel).trim() || defaultLabel,
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
  return publicDoc(doc)
}

export async function updateDocument(leadId, docId, { payload, label }, user = {}) {
  const doc = repo.getById(docId)
  if (!doc || String(doc.leadId) !== String(leadId)) {
    throw new Error("Không tìm thấy tài liệu")
  }

  const file = await persistDocumentFile(leadId, doc.type, docId, payload)
  const updatedBy = user.employeeId ?? user.id ?? ""
  const patch = {
    payload,
    label: label != null ? String(label).trim() || doc.label : doc.label,
    downloadName: file.downloadName,
    storageKey: file.storageKey ?? doc.storageKey,
    fileSize: file.fileSize,
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
    throw new Error("Vui lòng tải lên file Word (.docx)")
  }

  const originalName = decodeUploadFilename(String(options.originalFilename || "phu-luc.docx").trim())
  if (!originalName.toLowerCase().endsWith(".docx")) {
    throw new Error("Chỉ chấp nhận file .docx")
  }

  const version = repo.nextAppendixVersion(leadId, parentDoc.id)
  const id = `LDOC-${uuidv4().slice(0, 8).toUpperCase()}`
  const createdAt = new Date().toISOString()
  const createdBy = user.employeeId ?? user.id ?? ""
  const baseLabel = String(options.label || options.title || "").trim()
    || originalName.replace(/\.docx$/i, "")
    || `Phụ lục #${version}`
  const label = `${baseLabel} — ${parentDoc.label}`
  const downloadName = originalName.toLowerCase().endsWith(".docx")
    ? originalName
    : `${originalName}.docx`

  const storageKey = leadDocumentKey(leadId, "contract", id, downloadName)
  await getFileStorage().put(storageKey, fileBuffer, {
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
  return publicDoc(doc)
}
