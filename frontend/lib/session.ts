import { resolveApiBase } from "./apiBase"

const BASE = resolveApiBase()

let lastRefreshAt = 0
const REFRESH_EVERY_MS = 4 * 60 * 1000

export function touchSession() {
  const token = localStorage.getItem("dudi_token")
  if (!token) return

  const now = Date.now()
  if (now - lastRefreshAt < REFRESH_EVERY_MS) return
  lastRefreshAt = now

  fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then(async res => {
      if (!res.ok) return
      const json = await res.json()
      if (json.data?.token) {
        localStorage.setItem("dudi_token", json.data.token)
      }
    })
    .catch(() => {})
}

export function resetSessionTouchClock() {
  lastRefreshAt = 0
}
