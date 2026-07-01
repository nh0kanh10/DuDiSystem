import mongoose from "mongoose"

const modelCache = new Map()

export function getModel(collection) {
  if (modelCache.has(collection)) return modelCache.get(collection)

  const schema = new mongoose.Schema(
    { id: { type: String, index: true } },
    { strict: false, collection, versionKey: false }
  )

  const model = mongoose.models[collection] ?? mongoose.model(collection, schema, collection)
  modelCache.set(collection, model)
  return model
}
