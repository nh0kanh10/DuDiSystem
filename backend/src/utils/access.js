const ADMIN_ROLES = new Set(["role-admin", "role-super-admin"])
const MANAGER_ROLES = new Set(["role-admin", "role-super-admin", "role-manager"])

export function isAdminUser(user) {
  return ADMIN_ROLES.has(user?.roleId)
}

export function isManagerOrAdmin(user) {
  return MANAGER_ROLES.has(user?.roleId)
}

export function canManageRequests(user) {
  if (isManagerOrAdmin(user)) return true
  const perms = user?.permissions
  return Array.isArray(perms) && (perms.includes("all") || perms.includes("duyet-don"))
}

export function canViewAllAttendance(user) {
  if (isManagerOrAdmin(user)) return true
  const perms = user?.permissions
  return Array.isArray(perms) && (perms.includes("all") || perms.includes("cham-cong"))
}

export function canManageEmployees(user) {
  return isManagerOrAdmin(user) || user?.permissions?.includes("nhan-su")
}

export function canManageTasks(user) {
  return isManagerOrAdmin(user) || user?.permissions?.includes("cong-viec")
}

export function assertOwnEmployee(user, employeeId) {
  if (!user?.employeeId || user.employeeId !== employeeId) {
    return { error: "Không có quyền truy cập dữ liệu này", status: 403 }
  }
  return null
}
