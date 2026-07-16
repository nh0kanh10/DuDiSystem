import * as repo from "../repositories/task.repository.js"
import * as empRepo from "../repositories/employee.repository.js"
import { emitTaskChanged } from "../socket/chat.socket.js"

function todayVn() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

function withEmployee(task) {
  const emp = empRepo.getById(task.assigneeId)
  return {
    ...task,
    assigneeName: emp?.name ?? "—",
    assigneeDept: emp?.department ?? "—",
  }
}

function deriveParentStatus(children) {
  if (!children.length) return "todo"
  if (children.every(c => c.status === "done")) return "done"
  if (children.some(c => c.status === "in-progress" || c.status === "done")) return "in-progress"
  return "todo"
}

function syncParentStatus(parentId) {
  if (!parentId) return
  const children = repo.getAll({ parentId })
  if (!children.length) return
  const parent = repo.update(parentId, { status: deriveParentStatus(children) })
  if (parent) emitTaskChanged("updated", withEmployee(parent))
}

function publishTask(action, task) {
  if (!task) return
  emitTaskChanged(action, withEmployee(task))
}

export function listTasks(filter) {
  return repo.getAll(filter).map(withEmployee)
}

export function getTask(id) {
  const task = repo.getById(id)
  if (!task) return null
  return withEmployee(task)
}

export function createTask(data) {
  const count = repo.count()
  const createdAt = data.createdAt || todayVn()
  const assignedAt = data.assignedAt || createdAt
  const task = repo.create({
    id: `T${count + 1}`,
    title: data.title,
    taskDetail: data.taskDetail || "",
    description: data.description || "",
    assigneeId: data.assigneeId || "",
    startDate: data.startDate || "",
    dueDate: data.dueDate || "",
    resourceUrl: data.resourceUrl || "",
    notes: data.notes || "",
    category: data.category || "",
    priority: data.priority || "medium",
    status: data.status || "todo",
    projectId: data.projectId || "",
    parentId: data.parentId || "",
    createdAt,
    assignedAt,
  })
  publishTask("created", task)
  if (task.parentId) syncParentStatus(task.parentId)
  return withEmployee(task)
}

export function updateTask(id, patch) {
  const ALLOWED = [
    "title", "taskDetail", "description", "assigneeId", "startDate", "dueDate",
    "resourceUrl", "notes", "category", "priority", "status", "projectId", "parentId", "createdAt", "assignedAt",
  ]
  const safe = Object.fromEntries(Object.entries(patch).filter(([k]) => ALLOWED.includes(k)))
  const before = repo.getById(id)
  if (before?.assigneeId && safe.assigneeId && safe.assigneeId !== before.assigneeId && !safe.assignedAt) {
    safe.assignedAt = todayVn()
  }
  const task = repo.update(id, safe)
  if (!task) return null
  if (before?.assigneeId && before.assigneeId !== task.assigneeId) {
    publishTask("deleted", before)
  }
  publishTask("updated", task)
  const parentId = task.parentId || before?.parentId
  if (parentId) syncParentStatus(parentId)
  return withEmployee(task)
}

export function deleteTask(id) {
  const children = repo.getAll({ parentId: id })
  const task = repo.getById(id)
  for (const child of children) {
    repo.remove(child.id)
    publishTask("deleted", child)
  }
  const removed = repo.remove(id)
  if (task) publishTask("deleted", task)
  if (task?.parentId) syncParentStatus(task.parentId)
  return removed
}
