import { v4 as uuidv4 } from "uuid"
import * as repo from "../repositories/customer.repository.js"

function nextCode() {
  const year = new Date().getFullYear()
  const n = repo.count() + 1
  return `KH-${year}-${String(n).padStart(3, "0")}`
}

function displayName(data = {}) {
  if (data.customerType === "company" && data.companyName?.trim()) return data.companyName.trim()
  if (data.contactName?.trim()) return data.contactName.trim()
  if (data.companyName?.trim()) return data.companyName.trim()
  return "Khách hàng"
}

function mergeCustomer(existing, incoming) {
  const patch = {}
  const fields = ["companyName", "contactName", "contactPhone", "contactEmail", "address", "taxId", "industry"]
  for (const key of fields) {
    const val = String(incoming[key] ?? "").trim()
    if (val && !String(existing[key] ?? "").trim()) patch[key] = val
  }
  if (incoming.customerType && !existing.customerType) patch.customerType = incoming.customerType
  if (Object.keys(patch).length === 0) return existing
  patch.updatedAt = new Date().toISOString()
  return repo.update(existing.id, patch)
}

export function getCustomer(id) {
  if (!id) return null
  return repo.getById(id)
}

export function listCustomers(query = {}) {
  let rows = repo.getAll()
  if (query.q) {
    const q = String(query.q).toLowerCase()
    rows = rows.filter((c) =>
      c.displayName?.toLowerCase().includes(q)
      || c.code?.toLowerCase().includes(q)
      || c.companyName?.toLowerCase().includes(q)
      || c.contactPhone?.includes(q),
    )
  }
  return rows
}

export function findOrCreateFromContact(data = {}) {
  const companyName = String(data.companyName ?? "").trim()
  const contactPhone = String(data.contactPhone ?? "").trim()
  let customerType = data.customerType
  if (customerType !== "individual" && customerType !== "company") {
    customerType = companyName ? "company" : "individual"
  }

  let existing = contactPhone ? repo.findByPhone(contactPhone) : null
  if (!existing && companyName) existing = repo.findByCompanyName(companyName)

  const incoming = {
    customerType,
    companyName,
    contactName: String(data.contactName ?? "").trim(),
    contactPhone,
    contactEmail: String(data.contactEmail ?? "").trim(),
    address: String(data.address ?? "").trim(),
    taxId: String(data.taxId ?? "").trim(),
    industry: String(data.industry ?? "").trim(),
  }

  if (existing) return mergeCustomer(existing, incoming)

  const now = new Date().toISOString()
  const customer = {
    id: uuidv4(),
    code: nextCode(),
    displayName: displayName(incoming),
    ...incoming,
    leadIds: [],
    sourceCrmIds: [],
    createdAt: now,
    updatedAt: now,
  }
  repo.create(customer)
  return customer
}

export function findOrCreateFromCrm(record = {}) {
  return findOrCreateFromContact({
    customerType: "company",
    companyName: record.businessName,
    contactPhone: record.phone,
    address: record.address,
    industry: record.businessType,
  })
}

export function linkLead(customerId, leadId) {
  const customer = repo.getById(customerId)
  if (!customer || !leadId) return customer
  const leadIds = Array.isArray(customer.leadIds) ? [...customer.leadIds] : []
  if (!leadIds.includes(leadId)) leadIds.push(leadId)
  return repo.update(customerId, { leadIds, updatedAt: new Date().toISOString() })
}

export function linkCrmRecord(customerId, crmId) {
  const customer = repo.getById(customerId)
  if (!customer || !crmId) return customer
  const sourceCrmIds = Array.isArray(customer.sourceCrmIds) ? [...customer.sourceCrmIds] : []
  if (!sourceCrmIds.includes(crmId)) sourceCrmIds.push(crmId)
  return repo.update(customerId, { sourceCrmIds, updatedAt: new Date().toISOString() })
}
