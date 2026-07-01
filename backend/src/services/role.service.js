import * as repo from "../repositories/role.repository.js"

export function listRoles() {
  return repo.getAll()
}

export function getRole(id) {
  return repo.getById(id)
}

export function createRole(data) {
  const id = data.id || `role-${Math.random().toString(36).substring(2, 9)}`
  return repo.create({ id, ...data, isSystem: false })
}

export function updateRole(id, data) {
  const current = repo.getById(id)
  if (!current) return null
  const patch = { ...data }
  delete patch.isSystem
  delete patch.id
  return repo.update(id, patch)
}

export function deleteRole(id) {
  const current = repo.getById(id)
  if (!current || current.isSystem) return false
  return repo.remove(id)
}
