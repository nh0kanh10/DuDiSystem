import { findAll, findOne, insertOne, updateById, deleteById, deleteMany, updateMany } from "../db/index.js"

const COL = "roleAssignments"

export function getAll() {
  return findAll(COL)
}

export function getById(id) {
  return findOne(COL, { id })
}

export function getByUserId(userId) {
  return findAll(COL, { userId })
}

export function getPrimary(userId) {
  const list = getByUserId(userId)
  return list.find(a => a.isPrimary === true || String(a.isPrimary) === "true") ?? list[0] ?? null
}

export function create(doc) {
  if (doc.isPrimary) {
    updateMany(COL, { userId: doc.userId, isPrimary: true }, { isPrimary: false })
  }
  return insertOne(COL, doc)
}

export function update(id, patch) {
  const current = getById(id)
  if (!current) return null
  if (patch.isPrimary === true) {
    updateMany(COL, { userId: current.userId, isPrimary: true }, { isPrimary: false })
  }
  return updateById(COL, id, patch)
}

export function remove(id) {
  return deleteById(COL, id)
}

export function removeByUserId(userId) {
  return deleteMany(COL, { userId })
}
