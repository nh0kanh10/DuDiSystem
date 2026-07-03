import { findAll, findById, findOne, insertOne, updateById } from "../db/index.js"

const COL = "chatConversations"

export function getAll() {
  return findAll(COL)
}

export function getById(id) {
  return findById(COL, id)
}

export function getByParticipantKey(participantKey) {
  return findOne(COL, { participantKey })
}

export function getForParticipant(employeeId) {
  return findAll(COL).filter(c => c.participantIds?.includes(employeeId))
}

export function create(data) {
  return insertOne(COL, data)
}

export function update(id, patch) {
  return updateById(COL, id, patch)
}
