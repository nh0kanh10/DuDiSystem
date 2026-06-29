import * as repo from "../repositories/position.repository.js"
import { getAll as getAllEmployees } from "../repositories/employee.repository.js"

function withCount(position) {
  const employees = getAllEmployees()
  const currentCount = employees.filter(e => e.positionId === position.id).length
  return { ...position, currentCount }
}

export function listPositions(filter = {}) {
  let rows = repo.getAll()
  if (filter.status && filter.status !== "all") rows = rows.filter(p => p.status === filter.status)
  if (filter.q) {
    const q = filter.q.toLowerCase()
    rows = rows.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
  }
  return rows.map(withCount)
}

export function getPosition(id) {
  const p = repo.getById(id)
  return p ? withCount(p) : null
}

export function createPosition(data) {
  return withCount(repo.create(data))
}

export function updatePosition(id, data) {
  const updated = repo.update(id, data)
  return updated ? withCount(updated) : null
}

export function deletePosition(id) {
  return repo.remove(id)
}
