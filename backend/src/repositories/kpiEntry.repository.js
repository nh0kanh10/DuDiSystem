import { findAll, findById, findOne, insertOne, updateById, deleteById } from "../db/index.js"

const COL = "kpiEntries"

export function getAll(query = {}) {
  let data = findAll(COL)
  if (query.employeeId) {
    data = data.filter(d => d.employeeId === query.employeeId)
  }
  if (query.date) {
    data = data.filter(d => d.date === query.date)
  }
  if (query.startDate && query.endDate) {
    data = data.filter(d => d.date >= query.startDate && d.date <= query.endDate)
  } else if (query.month) {
    data = data.filter(d => d.date.startsWith(query.month))
  }
  return data
}
export function getById(id) { return findById(COL, id) }
export function create(data) { return insertOne(COL, data) }
export function update(id, patch) { return updateById(COL, id, patch) }
export function remove(id) { return deleteById(COL, id) }
