import { findAll, findById, insertOne, updateById, deleteById } from "../db/index.js"

const COL = "leads"

export function getAll(filter = {}) {
  let rows = findAll(COL)
  if (filter.status) rows = rows.filter((l) => l.status === filter.status)
  if (filter.assignedToId) rows = rows.filter((l) => l.assignedToId === filter.assignedToId)
  if (filter.q) {
    const q = filter.q.toLowerCase()
    rows = rows.filter((l) =>
      l.name?.toLowerCase().includes(q)
      || l.code?.toLowerCase().includes(q)
      || l.contactName?.toLowerCase().includes(q),
    )
  }
  return rows.sort((a, b) => String(b.code || "").localeCompare(String(a.code || "")))
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

export function findBySourceCrmId(sourceCrmId) {
  if (!sourceCrmId) return null
  return findAll(COL).find((l) => l.sourceCrmId === sourceCrmId) ?? null
}

export function findAllBySourceCrmId(sourceCrmId) {
  if (!sourceCrmId) return []
  return findAll(COL).filter((l) => l.sourceCrmId === sourceCrmId)
}

export function findAllByCustomerId(customerId) {
  if (!customerId) return []
  return findAll(COL).filter((l) => l.customerId === customerId)
}
