import Docxtemplater from "docxtemplater"
import { TOEIC_QUOTE_SAMPLE } from "../data/quoteSamples/toeic.js"
import { loadTemplateZip } from "./template.service.js"
import { normalizeScopeItems } from "../utils/scopeSections.js"

function formatVnd(amount) {
  const n = Number(String(amount ?? "").replace(/[^\d]/g, "")) || 0
  return n.toLocaleString("vi-VN")
}

function sumCosts(items = []) {
  return items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
}

/** Template Word đã có "BÁO GIÁ PHÁT TRIỂN" — {{title}} chỉ phần tên dự án */
export function normalizeQuoteTitle(title, project) {
  let raw = String(title || project || "").trim()
  if (!raw) return ""
  while (/^báo\s*giá\s*(phát\s*triển\s*)?/i.test(raw)) {
    raw = raw.replace(/^báo\s*giá\s*(phát\s*triển\s*)?/i, "").trim()
  }
  return raw
}

const TOEIC_SAMPLE_PROJECT = "Hệ thống Website luyện thi TOEIC trực tuyến"

/** Bỏ project/title mẫu TOEIC còn sót trong payload cũ */
export function resolveQuoteProject(input = {}, { useSampleDefaults = false } = {}) {
  const sampleProject = useSampleDefaults ? TOEIC_QUOTE_SAMPLE.project : ""
  let project = String(input.project ?? sampleProject ?? "").trim()
  if (!useSampleDefaults && project === TOEIC_SAMPLE_PROJECT) project = ""
  return project
}

function phasesFromInput(input = {}) {
  if (Array.isArray(input.phases) && input.phases.length) {
    return input.phases.slice(0, 4)
  }
  const phases = []
  for (let i = 1; i <= 4; i++) {
    phases.push({
      name: input[`phase${i}_name`] ?? `Giai đoạn ${i}`,
      content: input[`phase${i}_content`] ?? "",
      duration: input[`phase${i}_duration`] ?? "",
    })
  }
  return phases
}

export function normalizePayload(input = {}, { useSampleDefaults = true } = {}) {
  const sample = useSampleDefaults ? TOEIC_QUOTE_SAMPLE : {}
  const costItems = (input.costItems ?? []).map((row, idx) => ({
    stt: row.stt ?? idx + 1,
    name: row.name ?? "",
    description: row.description ?? "",
    amount: Number(row.amount) || 0,
  }))
  const total = input.total != null
    ? Number(String(input.total).replace(/[^\d]/g, "")) || sumCosts(costItems)
    : sumCosts(costItems)

  const defaultPayments = (useSampleDefaults ? TOEIC_QUOTE_SAMPLE.payments : [
    { label: "Đợt 1", percent: 50, timing: "" },
    { label: "Đợt 2", percent: 50, timing: "" },
  ]).map((p) => ({
    ...p,
    amount: Math.round((total * p.percent) / 100),
  }))
  const payments = (input.payments ?? defaultPayments).map((p) => ({
    label: p.label ?? "",
    percent: Number(p.percent) || 0,
    amount: p.amount != null
      ? Number(String(p.amount).replace(/[^\d]/g, "")) || 0
      : Math.round((total * (Number(p.percent) || 0)) / 100),
    timing: p.timing ?? "",
  }))

  const phases = phasesFromInput(input)
  while (phases.length < 4) {
    phases.push({ name: `Giai đoạn ${phases.length + 1}`, content: "", duration: "" })
  }

  const project = resolveQuoteProject(input, { useSampleDefaults })
  const leadName = String(input._leadName ?? "").trim()
  const resolvedProject = project || (leadName && leadName !== TOEIC_SAMPLE_PROJECT ? leadName : project)

  return {
    title: normalizeQuoteTitle("", resolvedProject),
    customer: input.customer ?? "",
    project: resolvedProject,
    date: input.date ?? new Date().toLocaleDateString("vi-VN"),
    owner: input.owner ?? "",
    overviewIntro: input.overviewIntro ?? sample.overviewIntro ?? "",
    overviewBullets: input.overviewBullets ?? sample.overviewBullets ?? [],
    costItems,
    total,
    scopeItems: normalizeScopeItems(input.scopeItems ?? sample.scopeItems ?? []),
    deployKind: input.deployKind === "hệ thống" ? "hệ thống" : "website",
    timelineDays: input.timelineDays ?? sample.timelineDays ?? "",
    phases,
    payments,
    bank: { ...TOEIC_QUOTE_SAMPLE.bank, ...(input.bank ?? {}) },
    template: input.template ?? "toeic",
  }
}

/** Dữ liệu khớp placeholder trong Template.docx */
export function buildTemplateData(rawInput = {}, options = {}) {
  const data = normalizePayload(rawInput, options)
  const phases = data.phases

  const scopeItems = data.scopeItems

  const templateData = {
    title: normalizeQuoteTitle(data.title, data.project),
    customer: data.customer,
    project: data.project,
    date: data.date,
    owner: data.owner,
    overviewIntro: data.overviewIntro ?? "",
    timelineDays: data.timelineDays,
    total: formatVnd(data.total),
    overviewBullets: data.overviewBullets,
    costItems: data.costItems.map((row) => ({
      stt: String(row.stt),
      name: row.name,
      description: row.description,
      amount: formatVnd(row.amount),
    })),
    scopeItems: scopeItems.map((row) => ({
      group: row.group ?? "",
      item: row.item ?? "",
      scope: row.scope ?? "",
    })),
    deployKind: data.deployKind,
    payments: data.payments.map((p) => ({
      label: p.label,
      percent: String(p.percent),
      amount: formatVnd(p.amount),
      timing: p.timing,
    })),
    phase1_content: phases[0]?.content ?? "",
    phase1_duration: phases[0]?.duration ?? "",
    phase2_content: phases[1]?.content ?? "",
    phase2_duration: phases[1]?.duration ?? "",
    phase3_content: phases[2]?.content ?? "",
    phase3_duration: phases[2]?.duration ?? "",
    phase4_content: phases[3]?.content ?? "",
    phase4_duration: phases[3]?.duration ?? "",
    bank_account: data.bank?.account ?? "",
    bank_name: data.bank?.name ?? "",
    bank_holder: data.bank?.holder ?? "",
  }

  return { data, templateData }
}

export function getSampleQuote(template = "toeic") {
  if (template === "toeic") {
    const { data } = buildTemplateData(TOEIC_QUOTE_SAMPLE, { useSampleDefaults: true })
    return data
  }
  throw new Error("Không tìm thấy mẫu báo giá")
}

export function parseQuoteInput(text) {
  let raw = String(text ?? "").trim()
  if (!raw) throw new Error("Nội dung JSON trống")
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
  let json
  try {
    json = JSON.parse(raw)
  } catch {
    throw new Error("JSON không hợp lệ. Hãy dán đúng khối JSON từ AI.")
  }
  delete json.title
  delete json.project
  delete json.customer
  delete json.date
  delete json.owner
  const { data } = buildTemplateData(json, { useSampleDefaults: false })
  return data
}

export async function generateQuoteDocx(rawInput) {
  const { templateData } = buildTemplateData(rawInput, { useSampleDefaults: false })
  const zip = await loadTemplateZip("quote")
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
  })

  try {
    doc.render(templateData)
  } catch (err) {
    const msg = err.properties?.errors
      ?.map((e) => e.properties?.explanation || e.message)
      .filter(Boolean)
      .join("; ")
    throw new Error(msg || err.message || "Lỗi điền template Word")
  }

  return doc.getZip().generate({ type: "nodebuffer" })
}
