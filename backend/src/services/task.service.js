import * as repo from "../repositories/task.repository.js"
import * as empRepo from "../repositories/employee.repository.js"

function withEmployee(task) {
  const emp = empRepo.getById(task.assigneeId)
  return {
    ...task,
    assigneeName: emp?.name ?? "—",
    assigneeDept: emp?.department ?? "—",
  }
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
  const task = repo.create({
    id: `T${count + 1}`,
    title: data.title,
    description: data.description || "",
    assigneeId: data.assigneeId || "",
    dueDate: data.dueDate || "",
    priority: data.priority || "medium",
    status: data.status || "todo"
  })
  return withEmployee(task)
}

export function updateTask(id, patch) {
  const ALLOWED = ["title", "description", "assigneeId", "dueDate", "priority", "status"]
  const safe = Object.fromEntries(Object.entries(patch).filter(([k]) => ALLOWED.includes(k)))
  const task = repo.update(id, safe)
  if (!task) return null
  return withEmployee(task)
}

export function deleteTask(id) {
  return repo.remove(id)
}
