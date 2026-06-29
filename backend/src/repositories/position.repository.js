import { findAll, findOne, insertOne, updateById, deleteById } from "../db/index.js"

const C = "positions"

export function getAll() {
  return findAll(C)
}

export function getById(id) {
  return findOne(C, { id }) ?? null
}

export function create(data) {
  const rows = findAll(C)
  const newItem = { id: `POS${String(rows.length + 1).padStart(3, "0")}`, ...data, status: data.status ?? "active" }
  insertOne(C, newItem)
  return newItem
}

export function update(id, data) {
  return updateById(C, id, data)
}

export function remove(id) {
  const item = findOne(C, { id })
  if (!item) return null
  deleteById(C, id)
  return item
}
