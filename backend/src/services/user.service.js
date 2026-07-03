import * as repo from "../repositories/user.repository.js"
import * as empRepo from "../repositories/employee.repository.js"
import * as raRepo from "../repositories/roleAssignment.repository.js"
import * as orgRepo from "../repositories/orgNode.repository.js"
import * as roleRepo from "../repositories/role.repository.js"
import bcrypt from "bcryptjs"
import { resolveClientPermissions, bumpPermissionsVersion } from "../utils/access.js"

export function resolveBranchId(userId) {
  if (!userId) return "all"
  const primary = raRepo.getPrimary(userId)
  if (!primary) return "all"
  if (primary.scopeType === "company") return "all"
  if (primary.scopeType === "branch") return primary.scopeId
  return null
}

export function getAssignmentsForUser(userId) {
  return raRepo.getByUserId(userId)
}

export function getBranchName(branchId) {
  if (!branchId || branchId === "all") return "Tất cả chi nhánh"
  const node = orgRepo.getById(branchId)
  return node ? node.name : "Tất cả chi nhánh"
}

export function listUsers(query = {}) {
  let users = repo.getAll()
  if (!query.includeCoreAdmins) {
    users = users.filter(user => !["0000000000", "1111111111", "2222222222"].includes(user.email))
  }
  const employees = empRepo.getAll()
  return users.map(user => {
    const emp = user.employeeId ? employees.find(e => e.id === user.employeeId) : null
    const assignments = raRepo.getByUserId(user.id)
    const primary = assignments.find(a => a.isPrimary) ?? assignments[0] ?? null
    const branchId = primary
      ? (primary.scopeType === "company" ? "all" : primary.scopeId)
      : "all"
    const branchName = getBranchName(branchId)
    const { password: _, ...safeUser } = user
    return { ...safeUser, name: emp ? emp.name : "—", branchId, branchName, assignments }
  })
}

function resolveScopeFromEmployee(employeeId) {
  const emp = empRepo.getById(employeeId)
  return emp?.branchId ?? null
}

export async function createUser(data) {
  const loginId = data.loginId ?? data.email
  const { roleId, employeeId, status, scopeId } = data
  if (roleId === "role-super-admin") {
    throw new Error("Không thể gán vai trò ẩn hệ thống")
  }
  if (!loginId) throw new Error("Mã đăng nhập là bắt buộc")

  if (repo.getByEmail(loginId)) throw new Error("Mã đăng nhập đã tồn tại")
  if (employeeId && repo.getByEmployeeId(employeeId)) {
    throw new Error("Nhân viên này đã có tài khoản")
  }

  let rawPassword = "123456"
  if (employeeId) {
    const emp = empRepo.getById(employeeId)
    if (emp) {
      if (emp.phone) rawPassword = emp.phone.replace(/\s+/g, "")
      else if (emp.dob) rawPassword = emp.dob.replace(/\D/g, "")
    }
  }

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(rawPassword, salt)

  const user = repo.create({
    id: `U-${Date.now()}`,
    email: loginId,
    password: hashedPassword,
    roleId: roleId || "role-user",
    employeeId: employeeId || null,
    status: status || "active",
    permissions: data.permissions || null
  })

  const roleObj = roleRepo.getById(roleId)
  const scopeType = roleObj?.scopeType || "self"
  raRepo.create({
    id: `ra-${Date.now()}`,
    userId: user.id,
    scopeType,
    scopeId: scopeType === "branch" ? (scopeId || null) : null,
    isPrimary: true
  })

  const { password: _, ...safeUser } = user
  return { ...safeUser, rawPassword }
}

export function updateUser(id, patch) {
  const user = repo.getById(id)
  if (user && ["0000000000", "1111111111", "2222222222"].includes(user.email)) {
    throw new Error("Không thể chỉnh sửa thông tin của tài khoản Quản trị viên")
  }

  if (patch.roleId === "role-super-admin") {
    throw new Error("Không thể gán vai trò ẩn hệ thống")
  }

  const ALLOWED = ["email", "roleId", "employeeId", "status", "permissions"]
  const safePatch = Object.fromEntries(Object.entries(patch).filter(([k]) => ALLOWED.includes(k)))

  if (safePatch.email) {
    const existing = repo.getByEmail(safePatch.email)
    if (existing && existing.id !== id) throw new Error("Email đã tồn tại")
  }

  const updated = repo.update(id, safePatch)
  if (!updated) throw new Error("Không tìm thấy tài khoản")

  if ("permissions" in safePatch || "roleId" in safePatch || patch.scopeId !== undefined) {
    bumpPermissionsVersion(id)
  }

  if (safePatch.roleId || patch.scopeId !== undefined) {
    const roleId = safePatch.roleId || updated.roleId
    const roleObj = roleRepo.getById(roleId)
    const scopeType = roleObj?.scopeType || "self"
    const primary = raRepo.getPrimary(id)
    if (primary) {
      raRepo.update(primary.id, {
        scopeType,
        scopeId: scopeType === "branch" ? (patch.scopeId || primary.scopeId) : null
      })
    }
  }

  const { password: _, ...safeUser } = updated
  return safeUser
}

export function toggleStatus(id) {
  const user = repo.getById(id)
  if (!user) throw new Error("Không tìm thấy tài khoản")
  if (["0000000000", "1111111111", "2222222222"].includes(user.email)) {
    throw new Error("Không thể thao tác tài khoản Quản trị viên")
  }
  const newStatus = user.status === "active" ? "locked" : "active"
  const updated = repo.update(id, { status: newStatus })
  const { password: _, ...safeUser } = updated
  return safeUser
}

export async function resetPassword(id) {
  const user = repo.getById(id)
  if (!user) throw new Error("Không tìm thấy tài khoản")
  if (["0000000000", "1111111111", "2222222222"].includes(user.email)) {
    throw new Error("Không thể thao tác tài khoản Quản trị viên")
  }

  let rawPassword = "123456"
  if (user.employeeId) {
    const emp = empRepo.getById(user.employeeId)
    if (emp) {
      if (emp.phone) rawPassword = emp.phone.replace(/\s+/g, "")
      else if (emp.dob) rawPassword = emp.dob.replace(/\D/g, "")
    }
  }

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(rawPassword, salt)
  repo.update(id, { password: hashedPassword })
  return { rawPassword }
}

export function deleteUser(id) {
  const user = repo.getById(id)
  if (user && ["0000000000", "1111111111", "2222222222"].includes(user.email)) {
    throw new Error("Không thể xóa tài khoản Quản trị viên")
  }

  const deleted = repo.remove(id)
  if (!deleted) throw new Error("Không tìm thấy tài khoản")
  raRepo.removeByUserId(id)
  return true
}

export function enrichUserProfile(user) {
  if (!user) return null
  const emp = user.employeeId ? empRepo.getById(user.employeeId) : null
  const assignments = raRepo.getByUserId(user.id)
  const primary = assignments.find(a => a.isPrimary) ?? assignments[0] ?? null
  const branchId = primary
    ? (primary.scopeType === "company" ? "all" : primary.scopeId)
    : "all"
  const branchName = getBranchName(branchId)
  const { password: _, ...safeUser } = user
  return {
    ...safeUser,
    name: emp?.name ?? "—",
    department: emp?.department ?? "—",
    position: emp?.position ?? "—",
    employeeStatus: emp?.status ?? "active",
    branchId,
    branchName,
    assignments,
    effectivePermissions: resolveClientPermissions(user),
  }
}

export function getUserDetails(id) {
  const user = repo.getById(id)
  return enrichUserProfile(user)
}

export async function updateAdminAccount(id, data) {
  const user = repo.getById(id)
  if (!user || user.roleId !== "role-super-admin") {
    throw new Error("Tài khoản không phải là Quản trị viên")
  }

  const { newPassword } = data
  if (!newPassword || newPassword.trim() === "") {
    throw new Error("Mật khẩu mới không được để trống")
  }

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(newPassword, salt)

  repo.update(id, {
    password: hashedPassword
  })

  return true
}
