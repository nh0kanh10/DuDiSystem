import { findAll, findById, insertOne, updateById } from "../db/index.js"

const COL = "assignments"

export function getAll(filter = {}) {
  let rows = findAll(COL)
  if (filter.employeeId) rows = rows.filter(a => a.employeeId === filter.employeeId)
  if (filter.nodeId) rows = rows.filter(a => a.nodeId === filter.nodeId)
  if (filter.status) rows = rows.filter(a => a.status === filter.status)
  return rows
}

export function getById(id) {
  return findById(COL, id)
}

export function create(data) {
  return insertOne(COL, data)
}

export function update(id, patch) {
  return updateById(COL, id, patch)
}

export function completeActiveByEmployee(employeeId) {
  const active = findAll(COL).filter(a => a.employeeId === employeeId && a.status === "active")
  const endDate = new Date().toISOString().split("T")[0]
  active.forEach(a => updateById(COL, a.id, { status: "completed", endDate }))
  return active.length
}
