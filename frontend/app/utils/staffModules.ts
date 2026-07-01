export const STAFF_PORTAL_MODULES = [
  "user-profile",
  "user-attendance",
  "user-timeoff",
  "user-directory",
  "user-chat",
  "user-workflow",
  "user-settings",
  "user-crm",
  "crm-employee-data",
  "cong-viec",
  "thong-bao",
] as const

const MODULE_ALIASES: Record<string, string[]> = {
  "user-crm": ["user-crm", "crm-employee-data"],
  "crm-employee-data": ["user-crm", "crm-employee-data"],
}

export function hasStaffModule(permissions: string[], moduleKey: string): boolean {
  if (permissions.length === 0) return true
  if (permissions.includes("all")) return true
  const keys = MODULE_ALIASES[moduleKey] ?? [moduleKey]
  return keys.some(k => permissions.includes(k))
}

export function getStaffPortalModules(permissions: string[]): string[] {
  return STAFF_PORTAL_MODULES.filter(m => hasStaffModule(permissions, m))
}

export function canOpenStaffPortal(permissions: string[]): boolean {
  return getStaffPortalModules(permissions).length > 0
}

export const LIVE_STAFF_BUBBLES = new Set([
  "checkin",
  "employee",
  "leave",
  "directory",
  "tasks",
  "notifications",
  "settings",
  "crm",
])
