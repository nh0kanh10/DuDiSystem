import { findOne, findAll } from "../db/index.js"

const COL = "users"

export function getByEmail(email) {
  return findOne(COL, { email })
}

export function getById(id) {
  return findOne(COL, { id })
}
