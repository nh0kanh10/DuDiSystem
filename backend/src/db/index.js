import { readFileSync, writeFileSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dir, "data")

function filePath(collection) {
  return join(DATA_DIR, `${collection}.json`)
}

function read(collection) {
  const fp = filePath(collection)
  if (!existsSync(fp)) return []
  return JSON.parse(readFileSync(fp, "utf-8"))
}

function write(collection, data) {
  writeFileSync(filePath(collection), JSON.stringify(data, null, 2), "utf-8")
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
  return updated
}

export function deleteById(collection, id) {
  const docs = read(collection)
  const idx = docs.findIndex(d => d.id === id)
  if (idx === -1) return false
  docs.splice(idx, 1)
  write(collection, docs)
  return true
}

export function deleteMany(collection, query) {
  const docs = read(collection)
  const next = docs.filter(doc =>
    !Object.entries(query).every(([k, v]) => doc[k] === v)
  )
  write(collection, next)
  return docs.length - next.length
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
  return count
}
