import { findAll, findById, insertOne, updateById as updateByIdDb, deleteById as deleteByIdDb } from "../db/index.js"

const COL = "projectVaultItems"

export function listByProject(projectId) {
  return findAll(COL, { projectId: String(projectId) })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getById(id) {
  return findById(COL, id)
}

export function create(doc) {
  return insertOne(COL, doc)
}

export function updateById(id, patch) {
  return updateByIdDb(COL, id, patch)
}

export function deleteById(id) {
  return deleteByIdDb(COL, id)
}
