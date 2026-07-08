import * as repo from "../repositories/orgNode.repository.js"
import * as empRepo from "../repositories/employee.repository.js"
import * as asgRepo from "../repositories/assignment.repository.js"
import {
  validateOrgNodePayload,
  syncEmployeeOrgFields,
  getNodeById,
  getDescendantIdSet,
} from "../utils/orgUtils.js"

function buildNodeSet(nodeId) {
  return getDescendantIdSet(nodeId, repo.getAll())
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

function findRehomeTarget(orgNodeId, deleteSet, nodes) {
  let current = getNodeById(nodes, orgNodeId)
  while (current) {
    if (!deleteSet.has(current.id)) return current.id
    current = current.parentId ? getNodeById(nodes, current.parentId) : null
  }
  return ""
}

function rehomeEmployeesFromDeletedNodes(deleteSet) {
  const allNodes = repo.getAll()
  const employees = empRepo.getAll()
  employees.forEach(emp => {
    if (!emp.orgNodeId || !deleteSet.has(emp.orgNodeId)) return
    const rehomeId = findRehomeTarget(emp.orgNodeId, deleteSet, allNodes)
    if (rehomeId) {
      empRepo.update(emp.id, syncEmployeeOrgFields({ orgNodeId: rehomeId }, rehomeId, allNodes))
    } else {
      empRepo.update(emp.id, { orgNodeId: "", branchId: "", department: "", position: "" })
    }
  })

  asgRepo.getAll().forEach(asg => {
    if (asg.status === "active" && deleteSet.has(asg.nodeId)) {
      asgRepo.update(asg.id, {
        status: "completed",
        endDate: new Date().toISOString().split("T")[0],
      })
    }
  })
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
  const nodes = repo.getAll()
  const err = validateOrgNodePayload(data, nodes)
  if (err) throw new Error(err)

  if (data.managerId && !empRepo.getById(data.managerId)) {
    throw new Error("Quản lý được chọn không tồn tại")
  }

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
  const existing = repo.getById(id)
  if (!existing) return null

  const ALLOWED = ["name", "code", "type", "managerId", "managerTitle", "parentId", "status"]
  const safe = Object.fromEntries(Object.entries(patch).filter(([k]) => ALLOWED.includes(k)))
  const merged = { ...existing, ...safe }
  const nodes = repo.getAll()
  const err = validateOrgNodePayload(merged, nodes, id)
  if (err) throw new Error(err)

  if (merged.managerId && !empRepo.getById(merged.managerId)) {
    throw new Error("Quản lý được chọn không tồn tại")
  }

  const node = repo.update(id, safe)
  if (!node) return null
  return withComputed(node, empRepo.getAll())
}

export function changeStatus(id, status) {
  const node = repo.getById(id)
  if (!node) return null
  const ids = [id, ...repo.getDescendantIds(id)]
  ids.forEach(i => repo.update(i, { status }))
  return { affected: ids.length }
}

export function deleteOrgNode(id) {
  const node = repo.getById(id)
  if (!node) return null

  const ids = [id, ...repo.getDescendantIds(id)]
  const deleteSet = new Set(ids)
  rehomeEmployeesFromDeletedNodes(deleteSet)
  ids.forEach(i => repo.remove(i))
  return { deleted: ids.length }
}

export function getMembersOfNode(nodeId) {
  const nodeSet = buildNodeSet(nodeId)
  return empRepo.getAll().filter(e => nodeSet.has(e.orgNodeId))
}
