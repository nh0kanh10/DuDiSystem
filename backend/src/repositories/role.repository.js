import { findOne, findAll, insertOne, updateById, deleteById } from "../db/index.js"

const COL = "roles"

export function getAll() {
  return findAll(COL)
}

export function getById(id) {
  return findOne(COL, { id })
}

export function create(doc) {
  return insertOne(COL, doc)
}

export function update(id, patch) {
  return updateById(COL, id, patch)
}

export function remove(id) {
  return deleteById(COL, id)
}
