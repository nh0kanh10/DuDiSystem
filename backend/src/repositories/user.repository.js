import { findOne, findAll, insertOne, updateById, deleteById } from "../db/index.js"

const COL = "users"

export function getAll() {
  return findAll(COL)
}

export function getByEmail(email) {
  return findOne(COL, { email })
}

export function getByEmployeeId(employeeId) {
  return findOne(COL, { employeeId })
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
