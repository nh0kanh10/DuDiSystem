import { findAll, findById, insertOne, updateById, deleteById } from "../db/index.js"

const COL = "projects"

export function getAll(filter = {}) {
  let rows = findAll(COL)
  if (filter.status) rows = rows.filter(p => p.status === filter.status)
  if (filter.managerId) rows = rows.filter(p => p.managerId === filter.managerId)
  if (filter.leadId) rows = rows.filter(p => String(p.leadId || "") === String(filter.leadId))
  if (filter.q) {
    const q = filter.q.toLowerCase()
    rows = rows.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
  }
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

export function count() {
  return findAll(COL).length
}
