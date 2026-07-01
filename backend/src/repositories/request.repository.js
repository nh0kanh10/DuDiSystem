import { findAll, findById, insertOne, updateById, deleteById } from "../db/index.js"

const COL = "requests"

export function getAll(filter = {}) {
  let rows = findAll(COL)
  if (filter.status) rows = rows.filter(r => r.status === filter.status)
  if (filter.category) rows = rows.filter(r => r.category === filter.category)
  if (filter.employeeId) rows = rows.filter(r => r.employeeId === filter.employeeId)
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

export function remove(id) {
  return deleteById(COL, id)
}

export function countByPrefix(prefix) {
  return findAll(COL).filter(r => r.id.startsWith(prefix)).length
}
