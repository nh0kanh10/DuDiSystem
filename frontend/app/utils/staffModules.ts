export const STAFF_PORTAL_MODULES = [
  "user-profile",
  "user-attendance",
  "user-timeoff",
  "user-directory",
  "user-chat",
  "user-workflow",
  "user-settings",
  "user-crm",
  "user-kpi",
  "crm-employee-data",
  "user-tasks",
  "user-notifications",
] as const

const STAFF_MODULE_SET = new Set<string>(STAFF_PORTAL_MODULES)

const MODULE_ALIASES: Record<string, string[]> = {
  "user-crm": ["user-crm", "crm-employee-data"],
  "crm-employee-data": ["user-crm", "crm-employee-data"],
}

export function isStaffTypeRole(role: {
  id?: string
  scopeType?: string
  roleType?: string
} | null | undefined): boolean {
  if (!role) return false
  if (role.id === "role-user") return true
  if (role.scopeType === "self") return true
  return role.roleType === "staff"
}

export function capStaffPermissions(permissions: string[], roleModules: string[]): string[] {
  const roleSet = new Set(roleModules)
  return permissions.filter(p => {
    if (p === "staff-portal") return true
    if (!STAFF_MODULE_SET.has(p)) return true
    return roleSet.has(p)
  })
}

export function hasStaffModule(permissions: string[], moduleKey: string): boolean {
  if (permissions.length === 0) return false
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

export function hasPageAccess(permissions: string[], page: string): boolean {
  if (permissions.includes("all")) return true
  if (page === "dashboard") return permissions.includes("dashboard")
  if (page === "staff-portal") return canOpenStaffPortal(permissions)
  if (page === "kpi-stats" || page === "kpi-compare") return permissions.includes("kpi")
  if (page === "thong-ke") return permissions.includes("thong-ke") || permissions.includes("cham-cong")
  return permissions.includes(page)
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
  "kpi",
])

export const STAFF_BLOCK_MODULES: Record<string, string> = {
  employee: "user-profile",
  checkin: "user-attendance",
  leave: "user-timeoff",
  directory: "user-directory",
  tasks: "user-tasks",
  notifications: "user-notifications",
  settings: "user-settings",
  crm: "user-crm",
  kpi: "user-kpi",
}

export function canShowStaffBlock(permissions: string[], blockId: string): boolean {
  const moduleKey = STAFF_BLOCK_MODULES[blockId]
  if (!moduleKey) return true
  if (permissions.length === 0) return false
  return hasStaffModule(permissions, moduleKey)
}
