import { DUDI_PARTY_B, nextContractNumber } from "../data/contractDefaults.js"
import * as repo from "../repositories/leadDocument.repository.js"
import { normalizeScopeItems } from "../utils/scopeSections.js"

function formatVnd(n) {
  const num = Number(String(n ?? "").replace(/[^\d]/g, "")) || 0
  return num.toLocaleString("vi-VN")
}

function sumCosts(items = []) {
  return items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
}

function amountInWords(amount) {
  const n = Number(amount) || 0
  if (n === 0) return "không đồng"
  return `${formatVnd(n)} đồng` 
}

function phasesFromQuote(quote = {}) {
  let phases
  if (Array.isArray(quote.phases) && quote.phases.length) {
    phases = quote.phases.slice(0, 4).map((p, i) => ({
      label: p.name || p.label || `Giai đoạn ${i + 1}`,
      content: p.content ?? "",
      duration: p.duration ?? "",
    }))
  } else {
    phases = [1, 2, 3, 4].map((i) => ({
      label: `Giai đoạn ${i}`,
      content: quote[`phase${i}_content`] ?? "",
      duration: quote[`phase${i}_duration`] ?? "",
    }))
  }
  while (phases.length < 4) {
    phases.push({ label: `Giai đoạn ${phases.length + 1}`, content: "", duration: "" })
  }
  return phases
}

function flatPhaseFields(phases = []) {
  const fields = {}
  for (let i = 1; i <= 4; i++) {
    const row = phases[i - 1] ?? {}
    fields[`phase${i}_content`] = row.content ?? ""
    fields[`phase${i}_duration`] = row.duration ?? ""
  }
  return fields
}

/** I. Chi phí dịch vụ — copy đủ từ báo giá (có tiền từng hàng) */
function costItemsFromQuote(quote = {}) {
  return (quote.costItems ?? [])
    .map((row, idx) => {
      const amount = Number(row.amount) || 0
      const name = String(row.name ?? "").trim()
      const description = String(row.description ?? "").trim()
      return {
        stt: String(row.stt ?? idx + 1),
        name,
        description,
        amount: formatVnd(amount),
        text: description
          ? `${name} (${description}) — ${formatVnd(amount)} VNĐ`
          : `${name} — ${formatVnd(amount)} VNĐ`,
      }
    })
    .filter((r) => r.name)
}

/** Điều 1.1 dạng bullet — cùng dữ liệu, có kèm tiền trong text */
function implementationItemsFromQuote(quote = {}) {
  return costItemsFromQuote(quote).map(({ text, name, description, amount }) => ({
    text,
    name,
    detail: description,
    amount,
  }))
}

/** Câu mở Điều 1 — VD: website doanh nghiệp ngành in ấn & bao bì */
function serviceDescriptionFromQuote(quote = {}, lead = {}) {
  const intro = String(quote.overviewIntro ?? "").trim()
  if (intro) {
    const first = intro.split(/[.:\n]/)[0]?.trim()
    if (first.length > 10) return first.replace(/^xây dựng\s+/i, "").trim()
  }
  const project = String(quote.project || lead.name || "").trim()
  const kind = quote.deployKind === "hệ thống" ? "hệ thống" : "website"
  if (/^website\b/i.test(project)) return project.replace(/^website\s*/i, "website ").trim()
  if (/^hệ thống\b/i.test(project)) return project
  return project ? `${kind} ${project.replace(/^(website|hệ thống)\s*/i, "")}` : kind
}

function formatContractDateLong(date = new Date()) {
  const d = date instanceof Date ? date : new Date()
  if (Number.isNaN(d.getTime())) return ""
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `ngày ${day} tháng ${month} năm ${year}`
}

/**
 * Gộp báo giá đã duyệt + thông tin lead → payload hợp đồng (lưu DB + điền template).
 */
export function buildContractPayload({
  quotePayload = {},
  lead = {},
  partyA = {},
  contractMeta = {},
}) {
  const rawCostItems = quotePayload.costItems ?? []
  const scopeItems = normalizeScopeItems(quotePayload.scopeItems ?? [])
  const total = quotePayload.total != null
    ? Number(String(quotePayload.total).replace(/[^\d]/g, "")) || sumCosts(rawCostItems)
    : sumCosts(rawCostItems)
  const phases = phasesFromQuote(quotePayload)
  const payments = (quotePayload.payments ?? []).map((p) => ({
    label: p.label ?? "",
    percent: String(p.percent ?? 0),
    amount: formatVnd(
      p.amount != null ? p.amount : Math.round((total * (Number(p.percent) || 0)) / 100),
    ),
    timing: p.timing ?? "",
  }))

  const deployKind = quotePayload.deployKind === "hệ thống" ? "hệ thống" : "website"
  const projectName = quotePayload.project || lead.name || ""
  const serviceDescription = serviceDescriptionFromQuote(quotePayload, lead)

  const now = new Date()
  const contractDate = contractMeta.contractDate
    || now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
  const contractDateLong = contractMeta.contractDateLong || formatContractDateLong(now)
  const contractPlace = contractMeta.contractPlace || "TP.HCM"
  const version = repo.nextVersion(String(lead.id || "0"), "contract")

  const implementationItems = implementationItemsFromQuote(quotePayload)
  const costItems = costItemsFromQuote(quotePayload)

  const payload = {
    sourceType: "quote",
    sourceQuotePayload: quotePayload,

    contractNo: contractMeta.contractNo || nextContractNumber(version, now.getFullYear()),
    contractDate,
    contractDateLong,
    contractPlace,

    projectName,
    serviceDescription,
    deployKind,

    partyA: {
      companyName: partyA.companyName || lead.companyName || (lead.customerType === "individual" ? "" : lead.contactName) || "",
      taxId: partyA.taxId || lead.taxId || "",
      address: partyA.address || lead.address || "",
      representative: partyA.representative || lead.contactName || "",
      position: partyA.position || "Giám đốc",
    },

    partyB: { ...DUDI_PARTY_B },

    /** Điều 1.1 — I. Chi phí (bảng đủ cột, có tiền) */
    costItems,
    implementationItems,

    /** Điều 1.2 — II. Phạm vi */
    scopeItems,

    timelineTotal: quotePayload.timelineDays || "",

    phases,

    total: formatVnd(total),
    totalRaw: total,
    totalWords: amountInWords(total),

    payments,
    bank: {
      account: DUDI_PARTY_B.bankAccount,
      name: DUDI_PARTY_B.bankName,
      holder: DUDI_PARTY_B.bankHolder,
    },
  }

  return payload
}

/** Dữ liệu phẳng cho docxtemplater */
export function buildContractTemplateData(contractPayload = {}) {
  const p = contractPayload
  const a = p.partyA ?? {}
  const b = p.partyB ?? DUDI_PARTY_B
  const phases = (p.phases ?? []).map((row, i) => ({
    label: row.label ?? `Giai đoạn ${i + 1}`,
    content: row.content ?? "",
    duration: row.duration ?? "",
  }))
  const timeline = p.timelineTotal ?? ""

  return {
    contractNo: p.contractNo ?? "",
    contractDate: p.contractDate ?? "",
    contractDateLong: p.contractDateLong ?? "",
    contractPlace: p.contractPlace ?? "",
    projectName: p.projectName ?? "",
    serviceDescription: p.serviceDescription ?? p.projectName ?? "",
    deployKind: p.deployKind ?? "website",

    partyA_companyName: a.companyName ?? "",
    partyA_taxId: a.taxId ?? "",
    partyA_address: a.address ?? "",
    partyA_representative: a.representative ?? "",
    partyA_position: a.position ?? "",

    partyB_companyName: b.companyName ?? "",
    partyB_taxId: b.taxId ?? "",
    partyB_address: b.address ?? "",
    partyB_representative: b.representative ?? "",
    partyB_position: b.position ?? "",
    partyB_phone: b.phone ?? "",
    partyB_email: b.email ?? "",

    timelineTotal: timeline,
    timelineDays: timeline,
    total: p.total ?? "",
    totalWords: p.totalWords ?? "",

    /** Điều 1.1 — bảng: {{#costItems}}{{stt}} {{name}} {{description}} {{amount}}{{/costItems}} */
    costItems: p.costItems ?? [],
    /** bullet: {{#implementationItems}}- {{text}}{{/implementationItems}} */
    implementationItems: p.implementationItems ?? [],

    /** Điều 1.2 — {{#scopeItems}}{{group}} {{item}} {{scope}}{{/scopeItems}} */
    scopeItems: p.scopeItems ?? [],

    phases,
    ...flatPhaseFields(phases),

    payments: p.payments ?? [],

    bank_account: p.bank?.account ?? b.bankAccount ?? "",
    bank_name: p.bank?.name ?? b.bankName ?? "",
    bank_holder: p.bank?.holder ?? b.bankHolder ?? "",

    isAppendix: Boolean(p.isAppendix),
    parentContractNo: p.parentContractNo ?? "",
    appendixNo: p.appendixNo ?? "",
    appendixTitle: p.appendixTitle ?? "",
    appendixContent: p.appendixContent ?? "",
  }
}

export function createContractFromQuote(leadId, quoteDoc, { partyA = {}, contractMeta = {} } = {}) {
  if (!quoteDoc?.payload) throw new Error("Báo giá nguồn không có dữ liệu")
  const payload = buildContractPayload({
    quotePayload: quoteDoc.payload,
    lead: { id: leadId, name: quoteDoc.payload.project },
    partyA,
    contractMeta,
  })
  payload.sourceDocumentId = quoteDoc.id
  payload.sourceDocumentLabel = quoteDoc.label
  return payload
}

/** Phụ lục hợp đồng — kế thừa Bên A/B và tham chiếu HĐ gốc */
export function buildAppendixPayload({ parentPayload = {}, parentDoc = {}, appendixMeta = {} }) {
  const parent = parentPayload
  const appendixNo = String(appendixMeta.appendixNo || appendixMeta.version || "01").padStart(2, "0")
  const parentNo = parent.contractNo || parentDoc.label || "HĐ"
  const title = String(appendixMeta.title || "").trim() || `Phụ lục ${appendixNo}`
  const content = String(appendixMeta.content || appendixMeta.serviceDescription || "").trim()

  return {
    ...parent,
    documentKind: "contract_appendix",
    isAppendix: true,
    parentContractNo: parentNo,
    parentDocumentId: parentDoc.id,
    parentDocumentLabel: parentDoc.label,
    appendixNo,
    appendixTitle: title,
    appendixContent: content,
    contractNo: `${parentNo}/PL${appendixNo}`,
    contractDate: appendixMeta.contractDate || parent.contractDate,
    contractDateLong: appendixMeta.contractDateLong || parent.contractDateLong,
    contractPlace: appendixMeta.contractPlace || parent.contractPlace,
    projectName: appendixMeta.projectName || parent.projectName,
    serviceDescription: content || title,
    sourceDocumentId: parentDoc.id,
    sourceDocumentLabel: parentDoc.label,
  }
}
