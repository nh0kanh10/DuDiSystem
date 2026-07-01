import { findAll, findOne, insertOne, updateById, deleteById, deleteMany, updateMany } from "../db/index.js"

const COL = "roleAssignments"

export function getAll() {
  return findAll(COL)
}

export function getById(id) {
  return findOne(COL, { id })
}

// Lấy tất cả assignments của một user (bao gồm kiêm nhiệm nhiều scope)
export function getByUserId(userId) {
  return findAll(COL, { userId })
}

// Lấy assignment mặc định khi login (isPrimary = true)
export function getPrimary(userId) {
  return findOne(COL, { userId, isPrimary: true })
}

export function create(doc) {
  // Nếu isPrimary = true → hạ primary cũ của user này xuống false trước
  if (doc.isPrimary) {
    updateMany(COL, { userId: doc.userId, isPrimary: true }, { isPrimary: false })
  }
  return insertOne(COL, doc)
}

export function update(id, patch) {
  const current = getById(id)
  if (!current) return null
  // Nếu set isPrimary = true → hạ primary cũ của cùng user xuống false
  if (patch.isPrimary === true) {
    updateMany(COL, { userId: current.userId, isPrimary: true }, { isPrimary: false })
  }
  return updateById(COL, id, patch)
}

export function remove(id) {
  return deleteById(COL, id)
}

// Xoá toàn bộ assignments của một user (dùng khi xoá tài khoản)
export function removeByUserId(userId) {
  return deleteMany(COL, { userId })
}
