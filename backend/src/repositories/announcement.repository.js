import { findAll, findById, insertOne, updateById, deleteById } from "../db/index.js"
const COL = "announcements"
export function getAll() { return findAll(COL) }
export function getById(id) { return findById(COL, id) }
export function create(data) { return insertOne(COL, data) }
export function update(id, patch) { return updateById(COL, id, patch) }
export function remove(id) { return deleteById(COL, id) }
export function count() { return findAll(COL).length }
