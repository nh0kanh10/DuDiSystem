import { findAll, findOne, insertOne, updateById } from "../db/index.js"

const COL = "chatReadStates"

export function getForConversation(conversationId, employeeId) {
  return findOne(COL, { conversationId, employeeId })
}

export function getAllForEmployee(employeeId) {
  return findAll(COL).filter(r => r.employeeId === employeeId)
}

export function upsert(conversationId, employeeId, patch) {
  const existing = getForConversation(conversationId, employeeId)
  if (existing) {
    return updateById(COL, existing.id, patch)
  }
  return insertOne(COL, {
    id: `READ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    conversationId,
    employeeId,
    lastReadMessageId: null,
    lastReadAt: null,
    ...patch,
  })
}
