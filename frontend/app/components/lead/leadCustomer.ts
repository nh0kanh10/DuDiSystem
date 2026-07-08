import { Lead } from "../../types"

export type CustomerType = "individual" | "company"

export function resolveCustomerType(lead?: Pick<Lead, "customerType" | "companyName" | "sourceCrmId">): CustomerType {
  if (lead?.customerType === "company" || lead?.customerType === "individual") return lead.customerType
  if (lead?.companyName?.trim() || lead?.sourceCrmId) return "company"
  return "individual"
}

export function leadCustomerLabel(lead?: Lead): string {
  if (!lead) return "—"
  const type = resolveCustomerType(lead)
  const phone = lead.contactPhone?.trim()
  const email = lead.contactEmail?.trim()

  if (type === "company") {
    const company = lead.companyName?.trim() || lead.name?.trim()
    const rep = lead.contactName?.trim()
    const main = rep ? `${company} — ${rep}` : company
    const parts = [main, phone, email].filter(Boolean)
    return parts.length ? parts.join(" · ") : "—"
  }

  const parts = [lead.contactName, phone, email].filter(Boolean)
  return parts.length ? parts.join(" · ") : "—"
}

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  individual: "Cá nhân",
  company: "Công ty",
}

export function normalizeCustomerDisplay(lead?: Lead) {
  const type = resolveCustomerType(lead)
  let companyName = String(lead?.companyName ?? "").trim()
  let contactName = String(lead?.contactName ?? "").trim()
  if (type === "company") {
    if (!companyName && contactName) companyName = contactName
    if (companyName && contactName === companyName) contactName = ""
  }
  return {
    type,
    companyName: companyName || lead?.name || "",
    contactName,
  }
}
