import * as repo from "../repositories/role.repository.js"
import * as userRepo from "../repositories/user.repository.js"
import * as empRepo from "../repositories/employee.repository.js"
import { bumpPermissionsVersionForRole } from "../utils/access.js"

function applyOrgNodeRoleBulkUpdate(roleId, orgNodeId) {
  if (!orgNodeId) return
  const employeesInNode = empRepo.getAll().filter(e => e.orgNodeId === orgNodeId)
  const empIds = new Set(employeesInNode.map(e => e.id))
  
  const allUsers = userRepo.getAll()
  for (const user of allUsers) {
    if (user.employeeId && empIds.has(user.employeeId)) {
      if (user.permissions && user.permissions.length > 0) continue
      if (user.roleId !== roleId) {
        userRepo.update(user.id, { roleId })
      }
    }
  }
}

export function listRoles() {
  return repo.getAll()
}

export function getRole(id) {
  return repo.getById(id)
}

export function createRole(data) {
  if (data.linkedOrgNodeId) {
    const existing = repo.getAll().find(r => r.linkedOrgNodeId === data.linkedOrgNodeId)
    if (existing) throw new Error(`Đơn vị này đã được liên kết với vai trò: ${existing.name}`)
  }
  const id = data.id || `role-${Math.random().toString(36).substring(2, 9)}`
  const created = repo.create({ id, ...data, isSystem: false })
  
  if (created.linkedOrgNodeId) {
    applyOrgNodeRoleBulkUpdate(created.id, created.linkedOrgNodeId)
  }
  return created
}

export function updateRole(id, data) {
  const current = repo.getById(id)
  if (!current) return null
  const patch = { ...data }
  delete patch.isSystem
  delete patch.id

  if (patch.linkedOrgNodeId !== undefined && patch.linkedOrgNodeId !== current.linkedOrgNodeId) {
    if (patch.linkedOrgNodeId) {
      const existing = repo.getAll().find(r => r.id !== id && r.linkedOrgNodeId === patch.linkedOrgNodeId)
      if (existing) throw new Error(`Đơn vị này đã được liên kết với vai trò: ${existing.name}`)
    }
    
    if (current.linkedOrgNodeId) {
      const oldEmps = empRepo.getAll().filter(e => e.orgNodeId === current.linkedOrgNodeId)
      const oldEmpIds = new Set(oldEmps.map(e => e.id))
      for (const u of userRepo.getAll()) {
        if (u.employeeId && oldEmpIds.has(u.employeeId) && u.roleId === id) {
           if (!u.permissions || u.permissions.length === 0) {
             userRepo.update(u.id, { roleId: "role-user" })
           }
        }
      }
    }
  }

  const updated = repo.update(id, patch)
  
  if (updated && patch.modules && JSON.stringify(patch.modules) !== JSON.stringify(current.modules)) {
    bumpPermissionsVersionForRole(id)
  }
  
  if (updated && patch.linkedOrgNodeId !== undefined && patch.linkedOrgNodeId !== current.linkedOrgNodeId) {
    if (patch.linkedOrgNodeId) {
      applyOrgNodeRoleBulkUpdate(id, patch.linkedOrgNodeId)
    }
  }
  
  return updated
}

export function deleteRole(id) {
  const current = repo.getById(id)
  if (!current || current.isSystem) return false
  
  if (current.linkedOrgNodeId) {
    const oldEmps = empRepo.getAll().filter(e => e.orgNodeId === current.linkedOrgNodeId)
    const oldEmpIds = new Set(oldEmps.map(e => e.id))
    for (const u of userRepo.getAll()) {
      if (u.employeeId && oldEmpIds.has(u.employeeId) && u.roleId === id) {
         if (!u.permissions || u.permissions.length === 0) {
           userRepo.update(u.id, { roleId: "role-user" })
         }
      }
    }
  }
  
  return repo.remove(id)
}
