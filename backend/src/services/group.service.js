import * as repo from "../repositories/group.repository.js"
import * as empRepo from "../repositories/employee.repository.js"

function todayVN() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`
}

function withMeta(g) {
  const leader = empRepo.getById(g.leaderId)
  return { ...g, leaderName: leader?.name ?? "—", memberCount: (g.memberIds || []).length }
}

export function listGroups() { return repo.getAll().map(withMeta) }
export function getGroup(id) { const g = repo.getById(id); return g ? withMeta(g) : null }

export function createGroup(data) {
  const count = repo.count()
  const g = repo.create({
    id: `GRP${String(count + 1).padStart(3, "0")}`,
    name: data.name || "",
    leaderId: data.leaderId || "",
    memberIds: data.memberIds || [],
    description: data.description || "",
    createdAt: todayVN(),
  })
  return withMeta(g)
}

export function updateGroup(id, data) {
  const ALLOWED = ["name", "leaderId", "memberIds", "description"]
  const safe = Object.fromEntries(Object.entries(data).filter(([k]) => ALLOWED.includes(k)))
  const g = repo.update(id, safe)
  return g ? withMeta(g) : null
}

export function deleteGroup(id) { return repo.remove(id) }
