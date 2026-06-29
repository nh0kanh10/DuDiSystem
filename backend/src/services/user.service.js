import * as repo from "../repositories/user.repository.js"
import * as empRepo from "../repositories/employee.repository.js"
import * as raRepo from "../repositories/roleAssignment.repository.js"
import * as orgRepo from "../repositories/orgNode.repository.js"
import * as roleRepo from "../repositories/role.repository.js"
import bcrypt from "bcryptjs"

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

export function listUsers() {
  const users = repo.getAll()
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
  const { email, roleId, employeeId, status, scopeId } = data
  if (!email) throw new Error("Email là bắt buộc")

  const existing = repo.getByEmail(email)
  if (existing) throw new Error("Email đã tồn tại")

  let rawPassword = "password"
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
    email,
    password: hashedPassword,
    roleId: roleId || "role-user",
    employeeId: employeeId || null,
    status: status || "active"
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
  const ALLOWED = ["email", "roleId", "employeeId", "status"]
  const safePatch = Object.fromEntries(Object.entries(patch).filter(([k]) => ALLOWED.includes(k)))

  if (safePatch.email) {
    const existing = repo.getByEmail(safePatch.email)
    if (existing && existing.id !== id) throw new Error("Email đã tồn tại")
  }

  const updated = repo.update(id, safePatch)
  if (!updated) throw new Error("Không tìm thấy tài khoản")

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
  const newStatus = user.status === "active" ? "locked" : "active"
  const updated = repo.update(id, { status: newStatus })
  const { password: _, ...safeUser } = updated
  return safeUser
}

export async function resetPassword(id) {
  const user = repo.getById(id)
  if (!user) throw new Error("Không tìm thấy tài khoản")

  let rawPassword = "password"
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
  const deleted = repo.remove(id)
  if (!deleted) throw new Error("Không tìm thấy tài khoản")
  raRepo.removeByUserId(id)
  return true
}
