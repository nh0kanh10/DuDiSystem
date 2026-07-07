import { v4 as uuidv4 } from "uuid"
import * as repo from "../repositories/lead.repository.js"
import * as projectSvc from "./project.service.js"
import * as customerSvc from "./customer.service.js"
import { getById as getEmployeeById } from "../repositories/employee.repository.js"
import { listByLead } from "../repositories/leadDocument.repository.js"

const SEED_LEADS = [
  {
    id: "1",
    code: "LD-2025-001",
    name: "Website bán hàng ABC",
    status: "requirement-gathering",
    contactName: "Nguyễn Văn A",
    customerType: "individual",
    contactPhone: "0901234567",
    budgetEstimate: "50-70 triệu",
    assignedToId: "NV001",
    assignedToName: "Trần Văn Quy",
    formType: "ecommerce",
    formStatus: "completed",
    formSentAt: "2026-06-01T08:00:00.000Z",
    formCompletedAt: "2026-06-20T14:00:00.000Z",
    notes: [],
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-20T14:00:00.000Z",
  },
  {
    id: "2",
    code: "LD-2025-002",
    name: "Landing page dịch vụ",
    status: "new",
    contactName: "Lê Thị B",
    contactEmail: "b@example.com",
    formType: "landing_page",
    formStatus: "not_sent",
    notes: [],
    createdAt: "2026-06-10T08:00:00.000Z",
    updatedAt: "2026-06-10T08:00:00.000Z",
  },
  {
    id: "3",
    code: "LD-2025-003",
    name: "Website giới thiệu công ty",
    status: "converted",
    contactName: "Phạm Văn C",
    convertedProjectId: "PRJ001",
    formType: "company_profile",
    formStatus: "completed",
    formCompletedAt: "2026-05-15T10:00:00.000Z",
    notes: [],
    createdAt: "2026-05-01T08:00:00.000Z",
    updatedAt: "2026-05-20T10:00:00.000Z",
  },
]

let seeded = false

function ensureSeed() {
  if (seeded || repo.count() > 0) {
    seeded = true
    return
  }
  for (const lead of SEED_LEADS) {
    repo.create({ ...lead })
  }
  seeded = true
}

function enrichLead(lead) {
  if (!lead) return lead
  let out = { ...lead }
  if (lead.assignedToId && !lead.assignedToName) {
    const emp = getEmployeeById(lead.assignedToId)
    if (emp) out = { ...out, assignedToName: emp.name }
  }
  const projectIds = Array.isArray(out.projectIds) ? [...out.projectIds] : []
  if (out.convertedProjectId && !projectIds.includes(out.convertedProjectId)) {
    projectIds.unshift(out.convertedProjectId)
  }
  if (projectIds.length) out.projectIds = projectIds
  if (out.customerId) {
    const customer = customerSvc.getCustomer(out.customerId)
    if (customer) {
      out.customerCode = customer.code
      out.customerDisplayName = customer.displayName
    }
  }
  if (out.status !== "converted" && !out.convertedProjectId) {
    const hasDoc = listByLead(out.id).some((d) => d.type === "quote" || d.type === "contract")
    if (hasDoc && ["new", "contacted", "requirement-gathering"].includes(out.status)) {
      out.status = "requirement-done"
    }
  }
  return out
}

function nextCode() {
  const year = new Date().getFullYear()
  const n = repo.count() + 1
  return `LD-${year}-${String(n).padStart(3, "0")}`
}

export function listLeads(query = {}) {
  ensureSeed()
  return repo.getAll(query).map(enrichLead)
}

export function getLead(id) {
  ensureSeed()
  return enrichLead(repo.getById(id))
}

export function createLead(body = {}) {
  ensureSeed()
  const now = new Date().toISOString()
  const id = body.id || uuidv4()
  const assigned = body.assignedToId ? getEmployeeById(body.assignedToId) : null
  const companyName = String(body.companyName ?? "").trim()
  let customerType = body.customerType
  if (customerType !== "individual" && customerType !== "company") {
    customerType = companyName || body.sourceCrmId ? "company" : "individual"
  }
  const lead = {
    id,
    code: body.code || nextCode(),
    name: String(body.name || "").trim(),
    customerId: body.customerId || "",
    status: body.status || "new",
    contactName: body.contactName || "",
    contactPhone: body.contactPhone || "",
    contactEmail: body.contactEmail || "",
    customerType,
    companyName,
    industry: body.industry || "",
    address: body.address || "",
    taxId: body.taxId || "",
    budgetEstimate: body.budgetEstimate || "",
    roughNotes: body.roughNotes || "",
    assignedToId: body.assignedToId || "",
    assignedToName: assigned?.name || body.assignedToName || "",
    sourceCrmId: body.sourceCrmId || "",
    formType: body.formType || "landing_page",
    formStatus: body.formStatus || "not_sent",
    notes: body.notes || [],
    createdAt: now,
    updatedAt: now,
  }
  if (!lead.name) throw new Error("Tên lead là bắt buộc")
  repo.create(lead)

  let customerId = body.customerId || ""
  if (!customerId) {
    const customer = customerSvc.findOrCreateFromContact({
      customerType,
      companyName,
      contactName: body.contactName,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
      address: body.address,
      taxId: body.taxId,
      industry: body.industry,
    })
    customerId = customer.id
    repo.update(id, { customerId })
    lead.customerId = customerId
  }
  customerSvc.linkLead(customerId, id)

  return enrichLead(lead)
}

const ALLOWED_PATCH = [
  "name", "status", "contactName", "contactPhone", "contactEmail",
  "customerType", "companyName", "industry", "address", "taxId",
  "budgetEstimate", "roughNotes", "assignedToId", "formType", "formStatus",
  "formSentAt", "formOpenedAt", "formCompletedAt", "convertedProjectId", "sourceCrmId",
  "requirementFormPayload", "requirementFormSubmissions", "lastFormCompletedAt", "activeRequirementTitle",
  "projectIds", "customerId",
  "formToken", "formLinkIssuedAt", "formLinkRevokedAt",
]

export function updateLead(id, body = {}) {
  ensureSeed()
  const existing = repo.getById(id)
  if (!existing) return null
  const patch = {}
  for (const key of ALLOWED_PATCH) {
    if (body[key] !== undefined) patch[key] = body[key]
  }
  if (patch.assignedToId) {
    const emp = getEmployeeById(patch.assignedToId)
    patch.assignedToName = emp?.name || ""
  }
  patch.updatedAt = new Date().toISOString()
  return enrichLead(repo.update(id, patch))
}

export function deleteLead(id) {
  ensureSeed()
  return repo.remove(id)
}

export function findLeadBySourceCrmId(sourceCrmId) {
  ensureSeed()
  return enrichLead(repo.findBySourceCrmId(sourceCrmId))
}

export function listLeadsBySourceCrmId(sourceCrmId) {
  ensureSeed()
  return repo.findAllBySourceCrmId(sourceCrmId).map(enrichLead)
}

export function listLeadsByCustomerId(customerId) {
  ensureSeed()
  return repo.findAllByCustomerId(customerId).map(enrichLead)
}

export function convertLeadToProject(leadId, body = {}, user = {}) {
  ensureSeed()
  const lead = repo.getById(leadId)
  if (!lead) throw new Error("Không tìm thấy lead")

  const projectName = String(body.name || "").trim()
  if (!projectName) throw new Error("Tên dự án là bắt buộc")

  if (lead.convertedProjectId) {
    const existing = projectSvc.getProject(lead.convertedProjectId)
    if (existing) {
      return { lead: enrichLead(lead), project: existing, alreadyExists: true }
    }
  }

  const project = projectSvc.createProject({
    name: projectName,
    code: body.code || lead.code || "",
    description: String(body.description || lead.name || "").trim(),
    managerId: body.managerId || lead.assignedToId || user.employeeId || "",
    leadId: lead.id,
    customerId: lead.customerId || "",
    status: "planning",
  })

  const updatedLead = enrichLead(repo.update(leadId, {
    convertedProjectId: project.id,
    projectIds: [project.id],
    status: "converted",
    updatedAt: new Date().toISOString(),
  }))

  return { lead: updatedLead, project, alreadyExists: false }
}

export function addLeadNote(id, content, user = {}) {
  ensureSeed()
  const lead = repo.getById(id)
  if (!lead) return null
  const note = {
    id: `LN-${Date.now()}`,
    content: String(content || "").trim(),
    createdAt: new Date().toISOString(),
    createdBy: user.employeeId ?? user.id ?? "",
  }
  if (!note.content) throw new Error("Nội dung ghi chú trống")
  const notes = [...(lead.notes || []), note]
  return enrichLead(repo.update(id, { notes, updatedAt: note.createdAt }))
}

export function updateLeadNote(id, noteId, content, user = {}) {
  ensureSeed()
  const lead = repo.getById(id)
  if (!lead) return null
  const notes = [...(lead.notes || [])]
  const noteIndex = notes.findIndex(n => n.id === noteId)
  if (noteIndex === -1) throw new Error("Không tìm thấy ghi chú")
  
  const updatedContent = String(content || "").trim()
  if (!updatedContent) throw new Error("Nội dung ghi chú trống")
  
  notes[noteIndex] = {
    ...notes[noteIndex],
    content: updatedContent,
    updatedAt: new Date().toISOString(),
    updatedBy: user.employeeId ?? user.id ?? "",
  }
  return enrichLead(repo.update(id, { notes }))
}

export function deleteLeadNote(id, noteId) {
  ensureSeed()
  const lead = repo.getById(id)
  if (!lead) return null
  const notes = (lead.notes || []).filter(n => n.id !== noteId)
  return enrichLead(repo.update(id, { notes }))
}
