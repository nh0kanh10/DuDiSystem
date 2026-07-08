import { findAll, findById, insertOne, updateById, deleteById, updateMany } from "../db/index.js"

const COL = "timeOffSlots"

export function getAll(filter = {}) {
  let rows = findAll(COL)
  if (filter.week) {
    rows = rows.filter(r => r.week === filter.week)
  }
  if (filter.empId) {
    rows = rows.filter(r => r.empId === filter.empId)
  }
  return rows
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

export function updateStatusMany(query, patch) {
  return updateMany(COL, query, patch)
}
