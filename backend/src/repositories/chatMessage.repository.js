import { findAll, findById, insertOne } from "../db/index.js"

const COL = "chatMessages"

export function getByConversation(conversationId) {
  return findAll(COL)
    .filter(m => m.conversationId === conversationId && !m.deletedAt)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}

export function getById(id) {
  return findById(COL, id)
}

export function create(data) {
  return insertOne(COL, data)
}

export function countUnreadFor(conversationId, employeeId, lastReadAt) {
  return findAll(COL).filter(m => {
    if (m.conversationId !== conversationId || m.deletedAt) return false
    if (m.senderId === employeeId) return false
    if (!lastReadAt) return true
    return new Date(m.createdAt) > new Date(lastReadAt)
  }).length
}
