import { fail } from "../utils/response.js"
import {
  isAdminUser,
  hasAnyModule,
  canManageCrmAdmin,
  canAccessEmployeeCrm,
} from "../utils/access.js"

export function requireAdmin(req, res, next) {
  if (isAdminUser(req.user)) return next()
  return fail(res, "Bạn không có quyền thực hiện thao tác này", 403)
}

export function requireAdminOrModule(...moduleKeys) {
  return (req, res, next) => {
    if (isAdminUser(req.user)) return next()
    if (hasAnyModule(req.user, moduleKeys)) return next()
    return fail(res, "Bạn không có quyền thực hiện thao tác này", 403)
  }
}

export function requireModule(...moduleKeys) {
  return requireAdminOrModule(...moduleKeys)
}

export function requireCrmAdmin(req, res, next) {
  if (canManageCrmAdmin(req.user)) return next()
  return fail(res, "Bạn không có quyền quản lý CRM", 403)
}

export function requireEmployeeCrm(req, res, next) {
  if (canAccessEmployeeCrm(req.user)) return next()
  return fail(res, "Bạn không có quyền truy cập CRM nhân viên", 403)
}
