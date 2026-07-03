import * as repo from "../repositories/project.repository.js"
import * as empRepo from "../repositories/employee.repository.js"
import * as taskRepo from "../repositories/task.repository.js"

function todayVN() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

function withMeta(project) {
  const manager = empRepo.getById(project.managerId)
  const allTasks = taskRepo.getAll({ projectId: project.id })
  const parentIdsWithChildren = new Set(
    allTasks.filter(t => t.parentId).map(t => t.parentId),
  )
  const leafTasks = allTasks.filter(t => {
    if (t.parentId) return true
    return !parentIdsWithChildren.has(t.id)
  })
  const doneTasks = leafTasks.filter(t => t.status === "done").length
  const progress = leafTasks.length > 0 ? Math.round((doneTasks / leafTasks.length) * 100) : project.progress ?? 0
  const workCount = allTasks.filter(t => !t.parentId).length
  return {
    ...project,
    managerName: manager?.name ?? "—",
    taskCount: leafTasks.length,
    doneCount: doneTasks,
    workCount,
    progress,
  }
}

export function listProjects(filter) {
  return repo.getAll(filter).map(withMeta)
}

export function getProject(id) {
  const p = repo.getById(id)
  if (!p) return null
  return withMeta(p)
}

export function createProject(data) {
  const count = repo.count()
  const project = repo.create({
    id: `PRJ${String(count + 1).padStart(3, "0")}`,
    name: data.name,
    code: data.code || "",
    description: data.description || "",
    status: data.status || "planning",
    startDate: data.startDate || "",
    endDate: data.endDate || "",
    managerId: data.managerId || "",
    memberIds: data.memberIds || [],
    progress: 0,
    attachments: [],
    teams: [],
    createdAt: todayVN(),
  })
  return withMeta(project)
}

export function updateProject(id, patch) {
  const ALLOWED = ["name", "code", "description", "status", "startDate", "endDate", "managerId", "memberIds", "progress", "attachments", "teams"]
  const safe = Object.fromEntries(Object.entries(patch).filter(([k]) => ALLOWED.includes(k)))
  const p = repo.update(id, safe)
  if (!p) return null
  return withMeta(p)
}

export function deleteProject(id) {
  return repo.remove(id)
}

export function addAttachment(id, attachment) {
  const p = repo.getById(id)
  if (!p) return null
  const attachments = [...(p.attachments || []), {
    id: `A${Date.now()}`,
    ...attachment,
    uploadedAt: todayVN(),
  }]
  return withMeta(repo.update(id, { attachments }))
}

export function removeAttachment(id, attachmentId) {
  const p = repo.getById(id)
  if (!p) return null
  const attachments = (p.attachments || []).filter(a => a.id !== attachmentId)
  return withMeta(repo.update(id, { attachments }))
}

export function addTeam(id, data) {
  const p = repo.getById(id)
  if (!p) return null
  const teams = [...(p.teams || []), {
    id: `T${Date.now()}`,
    name: data.name || "Nhóm mới",
    leaderId: data.leaderId || "",
    memberIds: data.memberIds || [],
    description: data.description || "",
    createdAt: todayVN(),
  }]
  return withMeta(repo.update(id, { teams }))
}

export function updateTeam(id, teamId, data) {
  const p = repo.getById(id)
  if (!p) return null
  const teams = (p.teams || []).map(t =>
    t.id === teamId ? { ...t, ...data, id: t.id, createdAt: t.createdAt } : t
  )
  return withMeta(repo.update(id, { teams }))
}

export function removeTeam(id, teamId) {
  const p = repo.getById(id)
  if (!p) return null
  const teams = (p.teams || []).filter(t => t.id !== teamId)
  return withMeta(repo.update(id, { teams }))
}
