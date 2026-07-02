import * as repo from "../repositories/announcement.repository.js"

function todayVN() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`
}

function parseVNDateTime(s) {
  if (!s) return null
  const normalized = String(s).trim().replace(",", "").replace(/\s+/g, " ")

  if (normalized.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(normalized)) {
    const d = new Date(normalized)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const [datePart, timePart = "00:00"] = normalized.split(" ")
  if (!datePart) return null
  const [dd, mm, yyyy] = datePart.split("/").map(Number)
  if (!dd || !mm || !yyyy) return null

  const [h, m] = timePart.split(":").map(Number)
  const hh = Number.isFinite(h) ? h : 0
  const min = Number.isFinite(m) ? m : 0

  const utcMs = Date.UTC(yyyy, mm - 1, dd, hh - 7, min, 0)
  return new Date(utcMs)
}

function computeStatus(a) {
  const nowMs = Date.now()
  const start = parseVNDateTime(a.startTime)
  const end = parseVNDateTime(a.endTime)
  if (end && nowMs > end.getTime()) return "expired"
  if (start && nowMs < start.getTime()) return "scheduled"
  return "active"
}

function withStatus(a) {
  return { ...a, status: computeStatus(a) }
}

export function listAnnouncements() {
  return repo.getAll().map(withStatus)
}

export function getAnnouncement(id) {
  const a = repo.getById(id)
  return a ? withStatus(a) : null
}

export function createAnnouncement(data) {
  const count = repo.count()
  const a = repo.create({
    id: `ANN${String(count + 1).padStart(3, "0")}`,
    title: data.title || "",
    type: data.type || "info",
    content: data.content || "",
    priority: data.priority || "medium",
    startTime: data.startTime || "",
    endTime: data.endTime || "",
    status: "active",
    createdAt: todayVN(),
  })
  return withStatus(a)
}

export function updateAnnouncement(id, data) {
  const ALLOWED = ["title", "type", "content", "priority", "startTime", "endTime"]
  const safe = Object.fromEntries(Object.entries(data).filter(([k]) => ALLOWED.includes(k)))
  const a = repo.update(id, safe)
  return a ? withStatus(a) : null
}

export function deleteAnnouncement(id) {
  return repo.remove(id)
}

export function getStats() {
  const all = repo.getAll().map(withStatus)
  return {
    total: all.length,
    active: all.filter(a => a.status === "active").length,
    scheduled: all.filter(a => a.status === "scheduled").length,
    expired: all.filter(a => a.status === "expired").length,
  }
}
