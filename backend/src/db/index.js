import { getModel } from "./models.js"
import { COLLECTIONS } from "./collections.js"

const cache = new Map()

function stripMongoMeta(doc) {
  if (!doc) return doc
  const { _id, __v, ...rest } = doc
  return rest
}

function clone(obj) {
  if (!obj) return obj
  return JSON.parse(JSON.stringify(obj))
}

function read(collection) {
  if (!cache.has(collection)) cache.set(collection, [])
  return cache.get(collection)
}

function write(collection, data) {
  cache.set(collection, data)
}

function logPersistError(op, collection, err) {
  console.error(`[db] ${op} ${collection}:`, err.message)
}

export async function loadCache() {
  cache.clear()
  for (const collection of COLLECTIONS) {
    const Model = getModel(collection)
    const docs = await Model.find({}).lean()
    cache.set(collection, docs.map(stripMongoMeta))
  }
  const total = [...cache.values()].reduce((n, docs) => n + docs.length, 0)
  console.log(`DB cache loaded: ${total} documents across ${COLLECTIONS.length} collections`)
}

export function findAll(collection, query = {}) {
  const docs = read(collection)
  const matched = docs.filter(doc =>
    Object.entries(query).every(([k, v]) => doc[k] === v)
  )
  return clone(matched)
}

export function findOne(collection, query) {
  return findAll(collection, query)[0] ?? null
}

export function findById(collection, id) {
  return findOne(collection, { id })
}

export function insertOne(collection, doc) {
  const docs = read(collection)
  const cloned = clone(doc)
  docs.push(cloned)
  write(collection, docs)
  void getModel(collection).create(clone(doc)).catch(err => logPersistError("insertOne", collection, err))
  return clone(cloned)
}

export function updateById(collection, id, patch) {
  const docs = read(collection)
  let updated = null
  const next = docs.map(doc => {
    if (doc.id === id) {
      updated = clone({ ...doc, ...patch })
      return updated
    }
    return doc
  })
  if (!updated) return null
  write(collection, next)
  void getModel(collection)
    .updateOne({ id }, { $set: clone(patch) })
    .catch(err => logPersistError("updateById", collection, err))
  return clone(updated)
}

export function deleteById(collection, id) {
  const docs = read(collection)
  const idx = docs.findIndex(d => d.id === id)
  if (idx === -1) return false
  docs.splice(idx, 1)
  write(collection, docs)
  void getModel(collection)
    .deleteOne({ id })
    .catch(err => logPersistError("deleteById", collection, err))
  return true
}

export function deleteMany(collection, query) {
  const docs = read(collection)
  const next = docs.filter(doc =>
    !Object.entries(query).every(([k, v]) => doc[k] === v)
  )
  const removed = docs.length - next.length
  write(collection, next)
  void getModel(collection)
    .deleteMany(query)
    .catch(err => logPersistError("deleteMany", collection, err))
  return removed
}

export function updateMany(collection, query, patch) {
  const docs = read(collection)
  const next = docs.map(doc => {
    if (Object.entries(query).every(([k, v]) => doc[k] === v)) {
      return clone({ ...doc, ...patch })
    }
    return doc
  })
  write(collection, next)
  void getModel(collection)
    .updateMany(query, { $set: clone(patch) })
    .catch(err => logPersistError("updateMany", collection, err))
  return next.filter(doc => Object.entries(query).every(([k, v]) => doc[k] === v)).length
}
