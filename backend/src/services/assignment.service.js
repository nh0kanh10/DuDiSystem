import * as repo from "../repositories/assignment.repository.js"
import * as orgNodeRepo from "../repositories/orgNode.repository.js"
import * as employeeRepo from "../repositories/employee.repository.js"

export function listAssignments(filter) {
  return repo.getAll(filter)
}

export function createAssignment(data) {
  const { employeeId, nodeId, type, startDate, endDate } = data

  if (type === "permanent") {
    repo.completeActiveByEmployee(employeeId)

    const node = orgNodeRepo.getById(nodeId)
    if (node) {
      const patch = { orgNodeId: nodeId }
      if (node.type === "department") patch.department = node.name
      if (node.type === "position") patch.position = node.name
      employeeRepo.update(employeeId, patch)
    }
  }

  return repo.create({
    id: `as-${Date.now()}`,
    employeeId,
    nodeId,
    type,
    startDate,
    endDate: endDate || undefined,
    status: "active"
  })
}

export function cancelAssignment(id) {
  const assignment = repo.getById(id)
  if (!assignment) return null
  return repo.update(id, { status: "cancelled" })
}
