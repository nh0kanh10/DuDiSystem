import { FormType, Lead, RequirementForm, RequirementFormSubmission } from "../../types"
import { FORM_TYPE_LABELS } from "../du-an/projectRequirementMock"

function mapPayloadFields(payload: Record<string, unknown>): Partial<RequirementForm> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "boolean" || (typeof value === "string" && value !== "")) {
      out[key] = value
    }
  }
  return out as Partial<RequirementForm>
}

function submissionToForm(lead: Lead, sub: RequirementFormSubmission): RequirementForm {
  const formType = (sub.formType || "landing_page") as FormType
  const typeLabel = FORM_TYPE_LABELS[formType] || formType
  return toRequirementForm(lead, sub.payload, {
    id: sub.id,
    formType,
    code: sub.code || `${lead.code.replace(/^LD-/, "YC-")}-arch`,
    title: sub.kind === "internal"
      ? `[Nội bộ] ${sub.title || `Phiếu yêu cầu — ${typeLabel}`}`
      : (sub.title || `Phiếu yêu cầu — ${typeLabel}`),
    createdAt: sub.sentAt || sub.completedAt,
    lockedAt: sub.completedAt,
  })
}

function toRequirementForm(
  lead: Lead,
  payload: Record<string, unknown>,
  opts: { id: string; formType: FormType; code: string; title?: string; createdAt: string; lockedAt: string },
): RequirementForm {
  const typeLabel = FORM_TYPE_LABELS[opts.formType] || opts.formType
  return {
    id: opts.id,
    leadId: lead.id,
    code: opts.code,
    title: opts.title || `Phiếu yêu cầu — ${typeLabel}`,
    projectType: opts.formType,
    isLocked: true,
    createdAt: opts.createdAt,
    lockedAt: opts.lockedAt,
    ...mapPayloadFields(payload),
  }
}

export function buildRequirementFormsFromLead(lead: Lead): RequirementForm[] {
  const forms: RequirementForm[] = []

  for (const sub of lead.requirementFormSubmissions ?? []) {
    if (sub.payload && typeof sub.payload === "object") {
      forms.push(submissionToForm(lead, sub))
    }
  }

  const payload = lead.requirementFormPayload
  if (payload && typeof payload === "object" && Object.keys(payload).length > 0) {
    const formType = (lead.formType || "landing_page") as FormType
    forms.push(toRequirementForm(lead, payload, {
      id: `RF-${lead.id}`,
      formType,
      code: lead.code.replace(/^LD-/, "YC-"),
      title: lead.activeRequirementTitle,
      createdAt: lead.formSentAt || lead.createdAt,
      lockedAt: lead.formCompletedAt || lead.lastFormCompletedAt || lead.updatedAt,
    }))
  }

  return forms.sort((a, b) => new Date(b.lockedAt || b.createdAt).getTime() - new Date(a.lockedAt || a.createdAt).getTime())
}

export function isWaitingForFormSubmit(lead: Lead | null): boolean {
  if (!lead) return false
  return lead.formStatus === "sent" || lead.formStatus === "opened" || lead.formStatus === "in_progress"
}

export function leadHasRequirement(lead: Lead): boolean {
  return buildRequirementFormsFromLead(lead).length > 0
}
