import { findAll, findById, findOne, insertOne, updateById, deleteById } from "../db/index.js"

const COL = "kpiTargets"

export function getAll(query = {}) {
  let data = findAll(COL)
  if (query.employeeId) {
    data = data.filter(d => d.employeeId === query.employeeId)
  }
  if (query.month) {
    data = data.filter(d => d.month === query.month)
  }
  return data
}
export function getById(id) { return findById(COL, id) }
export function create(data) { return insertOne(COL, data) }
export function update(id, patch) { return updateById(COL, id, patch) }
export function remove(id) { return deleteById(COL, id) }
