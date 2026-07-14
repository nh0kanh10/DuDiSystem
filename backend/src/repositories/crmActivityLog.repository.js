import { findAll, findById, findOne, insertOne, updateById, deleteById } from "../db/index.js"

const COL = "crmActivityLogs"

export function getAll() { return findAll(COL) }
export function create(data) { return insertOne(COL, data) }
