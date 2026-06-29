import { findAll, findById, findOne, insertOne, updateById, deleteById } from "../db/index.js"

const COL = "employees"

export function getAll(filter = {}) {
  let rows = findAll(COL)
  if (filter.branchId) rows = rows.filter(e => e.branchId === filter.branchId)
  if (filter.status) rows = rows.filter(e => e.status === filter.status)
  if (filter.department) rows = rows.filter(e => e.department === filter.department)
  if (filter.q) {
    const q = filter.q.toLowerCase()
    rows = rows.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.phone || "").includes(q)
    )
  }
  return rows
}

export function getById(id) { return findById(COL, id) }
export function getByEmail(email) { return findOne(COL, { email }) }
export function create(data) { return insertOne(COL, data) }
export function update(id, patch) { return updateById(COL, id, patch) }
export function remove(id) { return deleteById(COL, id) }
export function count() { return findAll(COL).length }
