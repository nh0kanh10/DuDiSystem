import { QuotePayload, QuotePhase } from "../../../lib/api"
import { Lead } from "../../types"
import { leadCustomerLabel } from "./leadCustomer"

export const TOEIC_SAMPLE_PROJECT = "Hệ thống Website luyện thi TOEIC trực tuyến"

export function todayVN() {
  return new Date().toLocaleDateString("vi-VN")
}

export { leadCustomerLabel }

export function quoteTitleFromProject(project?: string) {
  const p = String(project ?? "").trim()
  if (!p) return ""
  let raw = p
  while (/^báo\s*giá\s*(phát\s*triển\s*)?/i.test(raw)) {
    raw = raw.replace(/^báo\s*giá\s*(phát\s*triển\s*)?/i, "").trim()
  }
  return raw
}

export function resolveProject(lead?: Lead, base?: QuotePayload | null) {
  const fromBase = String(base?.project ?? "").trim()
  if (fromBase && fromBase !== TOEIC_SAMPLE_PROJECT) return fromBase
  return lead?.name?.trim() || fromBase || ""
}

export function ensureFourPhases(phases?: QuotePhase[]): QuotePhase[] {
  const list = [...(phases ?? [])]
  while (list.length < 4) {
    list.push({ name: `Giai đoạn ${list.length + 1}`, content: "", duration: "" })
  }
  return list.slice(0, 4)
}

export function createEmptyQuote(): QuotePayload {
  return {
    overviewBullets: [],
    costItems: [],
    scopeItems: [],
    deployKind: "website",
    phases: ensureFourPhases([]),
    payments: [
      { label: "Đợt 1", percent: 50, timing: "" },
      { label: "Đợt 2", percent: 50, timing: "" },
    ],
  }
}

/** Đồng bộ header từ lead — dùng chung tab Báo giá và xem trước tab Tài liệu */
export function buildAutoHeader(
  lead?: Lead,
  base?: QuotePayload | null,
  opts?: { preserveDate?: boolean },
): QuotePayload {
  const project = resolveProject(lead, base)
  return {
    ...(base ?? {}),
    customer: leadCustomerLabel(lead),
    project,
    title: quoteTitleFromProject(project),
    date: opts?.preserveDate ? (base?.date || todayVN()) : todayVN(),
    owner: lead?.assignedToName || base?.owner || "",
    phases: ensureFourPhases(base?.phases),
  }
}

/** Payload đã lưu trong DB → chuẩn hóa trước khi render Word */
export function enrichSavedQuotePayload(lead: Lead | undefined, saved: QuotePayload): QuotePayload {
  return buildAutoHeader(lead, saved, { preserveDate: true })
}
