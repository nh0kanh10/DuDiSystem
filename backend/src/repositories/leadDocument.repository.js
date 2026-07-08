import { findAll, findById, insertOne, updateById as updateByIdDb, deleteById as deleteByIdDb } from "../db/index.js"

const COL = "leadDocuments"

export function listByLead(leadId, type) {
  let rows = findAll(COL, { leadId: String(leadId) })
  if (type) rows = rows.filter((r) => r.type === type)
  return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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

export function nextVersion(leadId, type) {
  const rows = listByLead(leadId, type).filter((r) => !r.parentDocumentId)
  if (rows.length === 0) return 1
  return Math.max(...rows.map((r) => Number(r.version) || 0)) + 1
}

export function nextAppendixVersion(leadId, parentDocumentId) {
  const rows = listByLead(leadId, "contract").filter((r) => r.parentDocumentId === parentDocumentId)
  if (rows.length === 0) return 1
  return Math.max(...rows.map((r) => Number(r.version) || 0)) + 1
}
