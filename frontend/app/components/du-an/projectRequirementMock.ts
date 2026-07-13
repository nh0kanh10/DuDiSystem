import { Project, RequirementForm } from "../../types"

/** Nhãn loại phiếu — dùng trong tab Yêu cầu (không dùng tiêu đề CAPS như form web) */
export const FORM_TYPE_LABELS: Record<string, string> = {
  ecommerce: "Website bán hàng",
  landing_page: "Landing page",
  company_profile: "Website giới thiệu",
}

const DEMO_FORMS: Record<string, RequirementForm[]> = {}

export function getDemoRequirementForms(projectId: string): RequirementForm[] {
  return DEMO_FORMS[projectId] ?? []
}

/** Phiếu yêu cầu khách đã gửi — gắn theo lead (demo) */
export function getRequirementFormsForLead(leadId: string): RequirementForm[] {
  const all = Object.values(DEMO_FORMS).flat()
  return all.filter((f) => f.leadId === leadId)
}

export function mergeProjectRequirementDemo(project: Project): Project {
  const forms = getDemoRequirementForms(project.id)
  if (forms.length === 0) return project
  return {
    ...project,
    requirementForms: forms,
    leadId: project.leadId ?? forms[0]?.leadId,
  }
}
