import * as roleRepo from "../repositories/role.repository.js"
import * as raRepo from "../repositories/roleAssignment.repository.js"
import * as empRepo from "../repositories/employee.repository.js"
import * as userRepo from "../repositories/user.repository.js"

const ADMIN_ROLES = new Set(["role-admin", "role-super-admin"])
const MANAGER_ROLES = new Set(["role-admin", "role-super-admin", "role-manager"])

const STAFF_MODULE_SET = new Set([
  "user-profile", "user-attendance", "user-timeoff", "user-directory",
  "user-chat", "user-workflow", "user-settings", "user-crm", "crm-employee-data",
  "cong-viec", "thong-bao",
])

const ADMIN_MODULE_SET = new Set([
  "nhan-su", "co-cau", "cham-cong", "duyet-don",
  "tai-khoan", "phan-quyen", "ip", "thong-ke", "du-an", "tien-ich", "crm",
])

export function isAdminUser(user) {
  return ADMIN_ROLES.has(user?.roleId)
}

export function isManagerOrAdmin(user) {
  return MANAGER_ROLES.has(user?.roleId)
}

export function isStaffUser(user) {
  if (!user) return false
  if (user.roleId === "role-user") return true
  const role = roleRepo.getById(user.roleId)
  if (!role) return false
  if (role.id === "role-user" || role.scopeType === "self") return true
  return role.roleType === "staff"
}

/** Raw effective permissions: user override or role.modules */
export function resolveEffectivePermissions(user) {
  if (!user) return []
  if (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
    if (user.permissions.includes("all")) return ["all"]
    return [...user.permissions]
  }
  const role = roleRepo.getById(user.roleId)
  return role?.modules ? [...role.modules] : []
}

function capStaffModulesByRole(permissions, roleModules) {
  const roleSet = new Set(roleModules)
  return permissions.filter(p => {
    if (p === "staff-portal") return true
    if (!STAFF_MODULE_SET.has(p)) return true
    return roleSet.has(p)
  })
}

/** Permissions shaped for client UI (staff cap + strip admin modules for staff roles) */
export function resolveClientPermissions(user) {
  let perms = resolveEffectivePermissions(user)
  if (perms.includes("all")) return perms

  const role = roleRepo.getById(user?.roleId)
  if (isStaffUser(user) && role) {
    perms = capStaffModulesByRole(perms, role.modules ?? [])
    perms = perms.filter(p => !ADMIN_MODULE_SET.has(p))
    const hasStaff = perms.some(p => STAFF_MODULE_SET.has(p))
    if (hasStaff && !perms.includes("staff-portal")) {
      perms = [...perms, "staff-portal"]
    }
  } else if (!perms.includes("staff-portal")) {
    const hasStaff = perms.some(p => STAFF_MODULE_SET.has(p))
    if (hasStaff) perms = [...perms, "staff-portal"]
  }

  return perms
}

export function hasModule(user, moduleKey) {
  if (isAdminUser(user)) return true
  const perms = resolveEffectivePermissions(user)
  if (perms.includes("all")) return true
  if (moduleKey === "user-crm") {
    return perms.includes("user-crm") || perms.includes("crm-employee-data")
  }
  if (moduleKey === "crm-employee-data") {
    return perms.includes("crm-employee-data") || perms.includes("user-crm")
  }
  return perms.includes(moduleKey)
}

export function hasAnyModule(user, moduleKeys) {
  return moduleKeys.some(k => hasModule(user, k))
}

export function canManageRequests(user) {
  if (isManagerOrAdmin(user)) return true
  return hasAnyModule(user, ["duyet-don"])
}

export function canViewAllAttendance(user) {
  if (isManagerOrAdmin(user)) return true
  return hasAnyModule(user, ["cham-cong"])
}

export function canManageEmployees(user) {
  if (isManagerOrAdmin(user)) return true
  return hasAnyModule(user, ["nhan-su"])
}

export function canManageTasks(user) {
  if (isManagerOrAdmin(user)) return true
  return hasAnyModule(user, ["cong-viec"])
}

export function canManageCrmAdmin(user) {
  if (isAdminUser(user)) return true
  return hasAnyModule(user, ["crm"])
}

export function canAccessEmployeeCrm(user) {
  if (isAdminUser(user)) return true
  return hasAnyModule(user, ["user-crm", "crm-employee-data"])
}

export function assertOwnEmployee(user, employeeId) {
  if (!user?.employeeId || user.employeeId !== employeeId) {
    return { error: "Không có quyền truy cập dữ liệu này", status: 403 }
  }
  return null
}

/** Data scope from role assignment + role definition */
export function getUserScope(user) {
  if (!user?.id) return { type: "self", branchId: null }

  if (isAdminUser(user)) {
    return { type: "company", branchId: "all" }
  }

  const primary = raRepo.getPrimary(user.id)
  const role = roleRepo.getById(user.roleId)

  if (primary?.scopeType === "company" || role?.scopeType === "company") {
    return { type: "company", branchId: "all" }
  }

  if (primary?.scopeType === "self" || role?.scopeType === "self" || isStaffUser(user)) {
    return { type: "self", branchId: user.branchId || null }
  }

  const branchId = primary?.scopeId || user.branchId || null
  return { type: "branch", branchId }
}

/** Apply branch constraint to list query (branch managers) */
export function enforceBranchQuery(user, query = {}) {
  const scope = getUserScope(user)
  if (scope.type === "company") return { ...query }
  if (scope.type === "branch" && scope.branchId) {
    return { ...query, branchId: scope.branchId }
  }
  return { ...query }
}

export function filterRowsByBranch(rows, branchId, employeeIdField = "employeeId") {
  if (!branchId || branchId === "all") return rows
  const employees = empRepo.getAll({ branchId })
  const allowed = new Set(employees.map(e => e.id))
  return rows.filter(row => allowed.has(row[employeeIdField]))
}

export function assertEmployeeInScope(user, employeeId) {
  if (!employeeId) return { error: "Thiếu mã nhân viên", status: 400 }
  const scope = getUserScope(user)
  if (scope.type === "company") return null
  if (scope.type === "self") {
    if (employeeId !== user.employeeId) {
      return { error: "Không có quyền truy cập dữ liệu nhân viên này", status: 403 }
    }
    return null
  }
  const emp = empRepo.getById(employeeId)
  if (!emp || emp.branchId !== scope.branchId) {
    return { error: "Nhân viên không thuộc phạm vi chi nhánh của bạn", status: 403 }
  }
  return null
}

export function bumpPermissionsVersion(userId) {
  const user = userRepo.getById(userId)
  if (!user) return
  userRepo.update(userId, { permissionsVersion: (user.permissionsVersion ?? 0) + 1 })
}

export function bumpPermissionsVersionForRole(roleId) {
  userRepo.getAll()
    .filter(u => u.roleId === roleId && (!u.permissions || u.permissions.length === 0))
    .forEach(u => bumpPermissionsVersion(u.id))
}
