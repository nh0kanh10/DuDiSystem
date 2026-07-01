import * as repo from "../repositories/orgNode.repository.js"
import * as empRepo from "../repositories/employee.repository.js"

function buildNodeSet(nodeId) {
  return new Set([nodeId, ...repo.getDescendantIds(nodeId)])
}

function computeMemberCount(nodeId, allEmployees) {
  const nodeSet = buildNodeSet(nodeId)
  return allEmployees.filter(e => nodeSet.has(e.orgNodeId)).length
}

function withComputed(node, allEmployees) {
  const manager = node.managerId ? empRepo.getById(node.managerId) : null
  return {
    ...node,
    managerName: manager?.name ?? null,
    memberCount: computeMemberCount(node.id, allEmployees),
  }
}

export function listOrgNodes(filter) {
  const nodes = repo.getAll(filter)
  const allEmployees = empRepo.getAll()
  return nodes.map(n => withComputed(n, allEmployees))
}

export function getOrgNode(id) {
  const node = repo.getById(id)
  if (!node) return null
  const allEmployees = empRepo.getAll()
  return withComputed(node, allEmployees)
}

export function createOrgNode(data) {
  const node = repo.create({
    id: `node-${Date.now()}`,
    name: data.name,
    code: data.code,
    type: data.type,
    managerId: data.managerId || undefined,
    managerTitle: data.managerTitle || undefined,
    parentId: data.parentId || undefined,
    status: data.status || "active",
    createdDate: new Date().toLocaleDateString("vi-VN"),
  })
  return withComputed(node, empRepo.getAll())
}

export function updateOrgNode(id, patch) {
  const ALLOWED = ["name", "code", "type", "managerId", "managerTitle", "parentId", "status"]
  const safe = Object.fromEntries(Object.entries(patch).filter(([k]) => ALLOWED.includes(k)))
  const node = repo.update(id, safe)
  if (!node) return null
  return withComputed(node, empRepo.getAll())
}

export function changeStatus(id, status) {
  const ids = [id, ...repo.getDescendantIds(id)]
  ids.forEach(i => repo.update(i, { status }))
  return { affected: ids.length }
}

export function deleteOrgNode(id) {
  const ids = [id, ...repo.getDescendantIds(id)]
  ids.forEach(i => repo.remove(i))
  return { deleted: ids.length }
}

export function getMembersOfNode(nodeId) {
  const nodeSet = buildNodeSet(nodeId)
  return empRepo.getAll().filter(e => nodeSet.has(e.orgNodeId))
}
