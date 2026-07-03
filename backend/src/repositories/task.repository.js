import { findAll, findById, insertOne, updateById, deleteById } from "../db/index.js"

const COL = "tasks"

export function getAll(filter = {}) {
  let rows = findAll(COL)
  if (filter.status) rows = rows.filter(t => t.status === filter.status)
  if (filter.priority) rows = rows.filter(t => t.priority === filter.priority)
  if (filter.assigneeId) rows = rows.filter(t => t.assigneeId === filter.assigneeId)
  if (filter.projectId) rows = rows.filter(t => t.projectId === filter.projectId)
  if (filter.parentId) rows = rows.filter(t => t.parentId === filter.parentId)
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

export function count() {
  return findAll(COL).length
}
