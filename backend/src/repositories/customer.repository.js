import { findAll, findById, insertOne, updateById } from "../db/index.js"

const COL = "customers"

export function getAll() {
  return findAll(COL).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
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

export function count() {
  return findAll(COL).length
}

function normPhone(phone) {
  return String(phone || "").replace(/\D/g, "")
}

export function findByPhone(phone) {
  const p = normPhone(phone)
  if (!p) return null
  return findAll(COL).find((c) => normPhone(c.contactPhone) === p) ?? null
}

export function findByCompanyName(companyName) {
  const name = String(companyName || "").trim().toLowerCase()
  if (!name) return null
  return findAll(COL).find((c) => String(c.companyName || "").trim().toLowerCase() === name) ?? null
}
