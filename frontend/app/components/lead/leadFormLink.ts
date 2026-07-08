import { FormType } from "../../types"

export function buildPublicFormLink(leadId: string, token: string, formType: FormType): string {
  const params = new URLSearchParams({ token, type: formType })
  return `${window.location.origin}/form/${leadId}?${params.toString()}`
}
