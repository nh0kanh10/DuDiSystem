import { randomBytes } from "crypto"
import * as leadSvc from "./lead.service.js"

function resolveCustomerType(lead) {
  if (lead.customerType === "individual" || lead.customerType === "company") return lead.customerType
  if (lead.companyName?.trim() || lead.sourceCrmId) return "company"
  return "individual"
}

/** Sửa lead cũ: contactName trùng companyName */
function normalizeCustomerFields(lead) {
  const type = resolveCustomerType(lead)
  let companyName = String(lead.companyName ?? "").trim()
  let contactName = String(lead.contactName ?? "").trim()

  if (type === "company") {
    if (!companyName && contactName) companyName = contactName
    if (companyName && contactName === companyName) contactName = ""
  }

  return { type, companyName, contactName }
}

export function buildFormPrefill(lead) {
  const payload = lead.requirementFormPayload
  if (payload && typeof payload === "object" && lead.formStatus === "completed") {
    return {
      customer_name: payload.customer_name || "",
      customer_phone: payload.customer_phone || "",
      customer_email: payload.customer_email || "",
      company: payload.company || "",
      industry: payload.industry || "",
      budget: payload.budget || "",
      location: payload.location || payload.address || "",
      tax_id: payload.tax_id || payload.taxId || "",
      address: payload.address || payload.location || "",
    }
  }

  const { type, companyName, contactName } = normalizeCustomerFields(lead)
  const industry = String(lead.industry ?? "").trim()
    || (() => {
      const parts = String(lead.roughNotes ?? "").split("·").map((s) => s.trim()).filter(Boolean)
      return parts.length ? parts[parts.length - 1] : ""
    })()

  return {
    customer_name: contactName,
    customer_phone: lead.contactPhone || "",
    customer_email: lead.contactEmail || "",
    company: type === "company" ? companyName : "",
    industry,
    budget: lead.budgetEstimate || "",
    location: String(lead.address ?? "").trim()
      || String(lead.roughNotes ?? "").split("·").map((s) => s.trim()).find((p) => /^\d/.test(p) || p.includes("Quận") || p.includes("TP.")) || "",
    tax_id: String(lead.taxId ?? "").trim(),
    address: String(lead.address ?? "").trim(),
  }
}

function assertFormLinkAccess(lead, token) {
  if (!lead) throw new Error("Không tìm thấy phiếu yêu cầu hoặc link đã hết hạn")
  if (!lead.formToken) {
    throw new Error("Link chưa được kích hoạt. Vui lòng liên hệ sales để nhận link mới.")
  }
  if (!token || token !== lead.formToken) {
    throw new Error("Link không hợp lệ hoặc đã hết hạn (có thể đã có link mới).")
  }
  if (lead.formLinkRevokedAt) {
    throw new Error("Link đã bị khóa. Vui lòng liên hệ sales để nhận link mới.")
  }
  if (lead.formStatus === "not_sent") {
    throw new Error("Link form chưa được kích hoạt. Vui lòng liên hệ sales.")
  }
}

function archiveRequirementPayload(lead, extra = {}) {
  const existing = lead.requirementFormPayload
  if (!existing || typeof existing !== "object" || Object.keys(existing).length === 0) {
    return {}
  }
  const history = Array.isArray(lead.requirementFormSubmissions) ? [...lead.requirementFormSubmissions] : []
  const version = history.length + 1
  history.unshift({
    id: `RFS-${Date.now()}`,
    formType: lead.formType || "landing_page",
    title: extra.title || lead.activeRequirementTitle || `Phiếu yêu cầu #${version}`,
    payload: existing,
    completedAt: lead.formCompletedAt || lead.lastFormCompletedAt || new Date().toISOString(),
    sentAt: lead.formSentAt || "",
    code: `${String(lead.code || "").replace(/^LD-/, "YC-")}-v${version}`,
  })
  return {
    requirementFormSubmissions: history,
    requirementFormPayload: null,
    formCompletedAt: "",
    lastFormCompletedAt: lead.formCompletedAt || lead.lastFormCompletedAt || "",
  }
}

/** Tạo link mới — chỉ 1 link active; link cũ tự vô hiệu */
export function issueFormLink(leadId, formType) {
  const lead = leadSvc.getLead(leadId)
  if (!lead) throw new Error("Không tìm thấy lead")

  const allowed = ["landing_page", "ecommerce", "company_profile"]
  const type = allowed.includes(formType) ? formType : (lead.formType || "landing_page")
  const now = new Date().toISOString()
  const token = randomBytes(18).toString("base64url")

  const patch = {
    formToken: token,
    formType: type,
    formStatus: "sent",
    formSentAt: now,
    formLinkIssuedAt: now,
    formLinkRevokedAt: "",
    formOpenedAt: "",
    formCompletedAt: "",
  }
  // Giữ phiếu đã gửi — chỉ reset vòng link, không xóa requirementFormPayload
  if (lead.formCompletedAt) {
    patch.lastFormCompletedAt = lead.formCompletedAt
  }

  const updated = leadSvc.updateLead(leadId, patch)

  return {
    lead: updated,
    token,
    urlPath: `/form/${leadId}`,
    query: { token, type },
  }
}

export function addInternalRequirement(leadId, { title, notes, formType } = {}) {
  const lead = leadSvc.getLead(leadId)
  if (!lead) throw new Error("Không tìm thấy lead")

  const content = String(notes || "").trim()
  if (!content) throw new Error("Nội dung yêu cầu không được trống")

  const allowed = ["landing_page", "ecommerce", "company_profile"]
  const type = allowed.includes(formType) ? formType : (lead.formType || "landing_page")
  const history = Array.isArray(lead.requirementFormSubmissions) ? [...lead.requirementFormSubmissions] : []
  const version = history.length + 1
  const roundTitle = String(title || "").trim() || `Yêu cầu bổ sung #${version}`
  const now = new Date().toISOString()
  const { type: customerType, companyName, contactName } = normalizeCustomerFields(lead)

  history.unshift({
    id: `RFI-${Date.now()}`,
    formType: type,
    title: roundTitle,
    kind: "internal",
    payload: {
      source: "internal",
      notes: content,
      customer_name: contactName,
      customer_phone: lead.contactPhone || "",
      customer_email: lead.contactEmail || "",
      company: customerType === "company" ? companyName : "",
      industry: lead.industry || "",
      location: lead.address || "",
      tax_id: lead.taxId || "",
    },
    completedAt: now,
    sentAt: now,
    code: `${String(lead.code || "").replace(/^LD-/, "YC-")}-note-${version}`,
  })

  const updated = leadSvc.updateLead(leadId, { requirementFormSubmissions: history })
  return { lead: updated }
}

export function addRequirementRound(leadId, body = {}) {
  return addInternalRequirement(leadId, body)
}

export function revokeFormLink(leadId) {
  const lead = leadSvc.getLead(leadId)
  if (!lead) throw new Error("Không tìm thấy lead")
  if (!lead.formToken) throw new Error("Chưa có link để khóa")
  if (lead.formLinkRevokedAt) throw new Error("Link đã được khóa trước đó")

  return leadSvc.updateLead(leadId, {
    formLinkRevokedAt: new Date().toISOString(),
  })
}

export function getPublicFormContext(leadId, formType, token) {
  const lead = leadSvc.getLead(leadId)
  assertFormLinkAccess(lead, token)

  const type = formType || lead.formType || "landing_page"
  const allowed = ["landing_page", "ecommerce", "company_profile"]
  if (!allowed.includes(type)) throw new Error("Loại form không hợp lệ")

  const locked = lead.formStatus === "completed"
  const readOnly = locked

  return {
    lead: {
      id: lead.id,
      code: lead.code,
      name: lead.name,
      formType: type,
      formStatus: lead.formStatus,
      customerType: resolveCustomerType(lead),
    },
    prefill: buildFormPrefill(lead),
    formTitle: type,
    locked,
    readOnly,
    lockReason: locked ? "completed" : null,
  }
}

export function markFormOpened(leadId, token) {
  const lead = leadSvc.getLead(leadId)
  if (!lead) return null
  try {
    assertFormLinkAccess(lead, token)
  } catch {
    return null
  }
  if (lead.formStatus === "completed") return lead
  if (lead.formStatus === "opened" || lead.formStatus === "in_progress") return lead
  return leadSvc.updateLead(leadId, {
    formStatus: "opened",
    formOpenedAt: new Date().toISOString(),
  })
}

export function submitPublicForm(leadId, token, formPayload = {}) {
  const lead = leadSvc.getLead(leadId)
  assertFormLinkAccess(lead, token)

  if (lead.formStatus === "completed") {
    throw new Error("Phiếu đã được gửi. Link không còn chỉnh sửa được.")
  }

  const now = new Date().toISOString()
  const patch = {
    formStatus: "completed",
    formCompletedAt: now,
    lastFormCompletedAt: now,
    requirementFormPayload: formPayload,
    status: lead.status === "new" || lead.status === "contacted" ? "requirement-gathering" : lead.status,
    contactName: formPayload.customer_name || lead.contactName,
    contactPhone: formPayload.customer_phone || lead.contactPhone,
    contactEmail: formPayload.customer_email || lead.contactEmail,
    companyName: formPayload.company || lead.companyName,
    industry: formPayload.industry || lead.industry,
    budgetEstimate: formPayload.budget || lead.budgetEstimate,
    address: formPayload.address || formPayload.location || lead.address,
    taxId: formPayload.tax_id || formPayload.taxId || lead.taxId,
  }

  const existing = lead.requirementFormPayload
  if (existing && typeof existing === "object" && Object.keys(existing).length > 0) {
    const history = Array.isArray(lead.requirementFormSubmissions) ? [...lead.requirementFormSubmissions] : []
    const version = history.length + 1
    history.unshift({
      id: `RFS-${Date.now()}`,
      formType: lead.formType || "landing_page",
      title: lead.activeRequirementTitle || `Phiếu yêu cầu #${version}`,
      payload: existing,
      completedAt: lead.formCompletedAt || lead.lastFormCompletedAt || now,
      sentAt: lead.formSentAt || "",
      code: `${String(lead.code || "").replace(/^LD-/, "YC-")}-v${version}`,
    })
    patch.requirementFormSubmissions = history
  }

  return leadSvc.updateLead(leadId, patch)
}
