import * as repo from "../repositories/allowedIP.repository.js"

export function listAllowedIPs(filter = {}) {
  return repo.getAll(filter)
}

export function getAllowedIP(id) {
  return repo.getById(id)
}

export function createAllowedIP(data) {
  if (!data.ip) {
    return { error: "Vui lòng nhập địa chỉ IP", status: 400 }
  }

  const ipTrimmed = data.ip.trim()

  const existing = repo.findByIP(ipTrimmed)
  if (existing) {
    return { error: "Địa chỉ IP này đã tồn tại trong danh sách cấu hình", status: 400 }
  }

  const count = repo.count()
  const record = repo.create({
    id: `ip-${Date.now()}`,
    ip: ipTrimmed,
    description: data.description?.trim() || "",
    status: data.status || "active",
    orgNodeId: data.orgNodeId || undefined,
    createdAt: new Date().toISOString()
  })

  return record
}

export function updateAllowedIP(id, patch) {
  const existing = repo.getById(id)
  if (!existing) return null

  const ALLOWED = ["ip", "description", "status", "orgNodeId"]
  const safe = Object.fromEntries(
    Object.entries(patch).filter(([k]) => ALLOWED.includes(k))
  )

  if (safe.ip) {
    safe.ip = safe.ip.trim()
    const duplicate = repo.findByIP(safe.ip)
    if (duplicate && duplicate.id !== id) {
      return { error: "Địa chỉ IP này đã tồn tại ở bản ghi khác", status: 400 }
    }
  }

  if (safe.description !== undefined) {
    safe.description = safe.description.trim()
  }

  return repo.update(id, safe)
}

export function toggleAllowedIP(id) {
  const existing = repo.getById(id)
  if (!existing) return null

  const newStatus = existing.status === "active" ? "inactive" : "active"
  return repo.update(id, { status: newStatus })
}

export function deleteAllowedIP(id) {
  return repo.remove(id)
}
