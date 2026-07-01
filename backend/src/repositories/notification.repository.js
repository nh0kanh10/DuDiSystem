import { findAll, findById, insertOne, updateById, updateMany, deleteById } from "../db/index.js"

const COL = "notifications"

export function getAll(filter = {}) {
  let rows = findAll(COL)
  if (filter.read !== undefined) rows = rows.filter(n => n.read === filter.read)
  return rows
}

export function getById(id) {
  return findById(COL, id)
}

export function create(data) {
  return insertOne(COL, data)
}

export function markRead(id) {
  return updateById(COL, id, { read: true })
}

export function markAllRead() {
  return updateMany(COL, { read: false }, { read: true })
}

export function remove(id) {
  return deleteById(COL, id)
}

export function count() {
  return findAll(COL).length
}
