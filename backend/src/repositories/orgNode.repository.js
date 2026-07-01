import { findAll, findById, insertOne, updateById, deleteById } from "../db/index.js"

const COL = "orgNodes"

export function getAll(filter = {}) {
  let rows = findAll(COL)
  if (filter.type) rows = rows.filter(n => n.type === filter.type)
  if (filter.status) rows = rows.filter(n => n.status === filter.status)
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

export function getChildren(parentId) {
  return findAll(COL).filter(n => n.parentId === parentId)
}

export function getDescendantIds(nodeId) {
  const all = findAll(COL)
  const ids = []
  const queue = [nodeId]
  while (queue.length) {
    const cur = queue.shift()
    const children = all.filter(n => n.parentId === cur)
    children.forEach(c => { ids.push(c.id); queue.push(c.id) })
  }
  return ids
}
