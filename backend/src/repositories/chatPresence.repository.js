import { findAll, findOne, insertOne, updateById } from "../db/index.js"

const COL = "chatPresence"

export function getAll() {
  return findAll(COL)
}

export function getByEmployeeId(employeeId) {
  return findOne(COL, { employeeId })
}

export function upsert(employeeId, patch) {
  const existing = getByEmployeeId(employeeId)
  if (existing) {
    return updateById(COL, existing.id, patch)
  }
  return insertOne(COL, {
    id: `PRES${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    employeeId,
    status: "online",
    lastSeenAt: new Date().toISOString(),
    ...patch,
  })
}
