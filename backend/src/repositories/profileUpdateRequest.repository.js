import { findAll, findById, insertOne, updateById, deleteById } from "../db/index.js"

const COL = "profileUpdateRequests"

export function getAll(filter = {}) {
  let rows = findAll(COL)
  if (filter.employeeId) rows = rows.filter(r => r.employeeId === filter.employeeId)
  if (filter.status) rows = rows.filter(r => r.status === filter.status)
  return rows
}

export function getById(id) {
  return findById(COL, id)
}

export function create(data) {
  const id = `PUR${Date.now()}`
  const newReq = { id, ...data, requestedAt: new Date().toLocaleDateString("en-GB") }
  return insertOne(COL, newReq)
}

export function update(id, patch) {
  return updateById(COL, id, patch)
}

export function remove(id) {
  return deleteById(COL, id)
}
