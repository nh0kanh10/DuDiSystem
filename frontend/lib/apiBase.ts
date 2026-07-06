const RENDER_API = "https://dudisystem.onrender.com/api"
const DEV_API = "http://localhost:3001/api"

function defaultApiBase() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname
    if (host.includes("vercel.app") || host === "dudisystem.vercel.app") {
      return RENDER_API
    }
  }
  if (import.meta.env.MODE === "production") return RENDER_API
  return DEV_API
}

export function resolveApiBase() {
  const raw = (import.meta.env.VITE_API_URL ?? "").trim()
  const base = raw || defaultApiBase()
  const trimmed = base.replace(/\/$/, "")
  if (!/^https?:\/\//i.test(trimmed)) {
    return defaultApiBase()
  }
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`
}

/** Socket.IO host — không có suffix `/api`. */
export function resolveSocketBase() {
  return resolveApiBase().replace(/\/api\/?$/, "")
}
