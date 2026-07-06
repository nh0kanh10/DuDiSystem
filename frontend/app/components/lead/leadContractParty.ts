import { Lead } from "../../types"

function payloadStr(lead: Lead, ...keys: string[]): string {
  const p = lead.requirementFormPayload
  if (!p || typeof p !== "object") return ""
  for (const key of keys) {
    const v = p[key]
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  return ""
}

/** Bên A hợp đồng — ưu tiên lead, fallback phiếu yêu cầu khách đã gửi */
export function resolvePartyAFromLead(lead: Lead) {
  const isCompany = lead.customerType === "company" || Boolean(lead.companyName?.trim())
  const companyName = lead.companyName?.trim()
    || (isCompany ? lead.contactName : "")
    || ""
  const representative = lead.contactName?.trim() || ""

  const taxId = lead.taxId?.trim()
    || payloadStr(lead, "tax_id", "taxId", "mst")
  const address = lead.address?.trim()
    || payloadStr(lead, "address", "location")

  return {
    companyName: companyName || (lead.customerType === "individual" ? "" : representative) || "",
    taxId,
    address,
    representative,
    position: "Giám đốc",
  }
}
