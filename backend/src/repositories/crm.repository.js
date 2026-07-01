import { findAll, findById, findOne, insertOne, updateById, deleteById } from "../db/index.js"

const COL = "crmDataRecords"

export function getAll() { return findAll(COL) }
export function getById(id) { return findById(COL, id) }
export function getByPhone(phone) { return findOne(COL, { phone }) }
export function create(data) { return insertOne(COL, data) }
export function update(id, patch) { return updateById(COL, id, patch) }
export function remove(id) { return deleteById(COL, id) }
export function count() { return findAll(COL).length }
