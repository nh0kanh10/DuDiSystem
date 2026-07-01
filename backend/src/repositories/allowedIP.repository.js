import { findAll, findById, insertOne, updateById, deleteById, findOne } from "../db/index.js"

const COL = "allowedIPs"

export function getAll(filter = {}) {
  let rows = findAll(COL)
  if (filter.status) {
    rows = rows.filter(r => r.status === filter.status)
  }
  if (filter.orgNodeId && filter.orgNodeId !== "all") {
    rows = rows.filter(r => r.orgNodeId === filter.orgNodeId)
  }
  return rows
}

export function getById(id) {
  return findById(COL, id)
}

export function findByIP(ip) {
  return findOne(COL, { ip }) ?? null
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
