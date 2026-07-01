import { findAll, findById, insertOne, updateById, deleteById, findOne } from "../db/index.js"

const COL = "attendance"

export function getAll(filter = {}) {
  let rows = findAll(COL)
  if (filter.date) rows = rows.filter(r => r.date === filter.date)
  if (filter.startDate) rows = rows.filter(r => r.date >= filter.startDate)
  if (filter.endDate) rows = rows.filter(r => r.date <= filter.endDate)
  if (filter.employeeId) rows = rows.filter(r => r.employeeId === filter.employeeId)
  if (filter.status) rows = rows.filter(r => r.status === filter.status)
  return rows
}

export function getById(id) {
  return findById(COL, id)
}

export function findByEmployeeAndDate(employeeId, date) {
  return findOne(COL, { employeeId, date }) ?? null
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
