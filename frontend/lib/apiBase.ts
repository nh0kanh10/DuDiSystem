/** REST base — luôn kết thúc bằng `/api`. */
export function resolveApiBase() {
  const raw = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api"
  const trimmed = raw.replace(/\/$/, "")
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`
}

/** Socket.IO host — không có suffix `/api`. */
export function resolveSocketBase() {
  return resolveApiBase().replace(/\/api\/?$/, "")
}
