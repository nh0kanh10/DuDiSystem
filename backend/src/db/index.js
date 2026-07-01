import { getModel } from "./models.js"
import { COLLECTIONS } from "./collections.js"

const cache = new Map()

function stripMongoMeta(doc) {
  if (!doc) return doc
  const { _id, __v, ...rest } = doc
  return rest
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
  return docs.filter(doc =>
    Object.entries(query).every(([k, v]) => doc[k] === v)
  )
}

export function findOne(collection, query) {
  return findAll(collection, query)[0] ?? null
}

export function findById(collection, id) {
  return findOne(collection, { id })
}

export function insertOne(collection, doc) {
  const docs = read(collection)
  docs.push(doc)
  write(collection, docs)
  void getModel(collection).create(doc).catch(err => logPersistError("insertOne", collection, err))
  return doc
}

export function updateById(collection, id, patch) {
  const docs = read(collection)
  let updated = null
  const next = docs.map(doc => {
    if (doc.id === id) {
      updated = { ...doc, ...patch }
      return updated
    }
    return doc
  })
  if (!updated) return null
  write(collection, next)
  void getModel(collection)
    .updateOne({ id }, { $set: patch })
    .catch(err => logPersistError("updateById", collection, err))
  return updated
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
  let count = 0
  const next = docs.map(doc => {
    if (Object.entries(query).every(([k, v]) => doc[k] === v)) {
      count++
      return { ...doc, ...patch }
    }
    return doc
  })
  write(collection, next)
  void getModel(collection)
    .updateMany(query, { $set: patch })
    .catch(err => logPersistError("updateMany", collection, err))
  return count
}
