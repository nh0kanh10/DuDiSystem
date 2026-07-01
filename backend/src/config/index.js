const DEFAULT_ORIGINS = ["http://localhost:5173", "http://localhost:3000"]

function parseCorsOrigins() {
  const fromEnv = process.env.CORS_ORIGIN
  if (!fromEnv) return DEFAULT_ORIGINS
  const extra = fromEnv.split(",").map(s => s.trim()).filter(Boolean)
  return [...new Set([...DEFAULT_ORIGINS, ...extra])]
}

export const PORT = process.env.PORT || 3001
export const JWT_SECRET = process.env.JWT_SECRET || "dudi-secret-key-2026"
export const JWT_EXPIRES_IN = "8h"
export const CORS_ORIGINS = parseCorsOrigins()
