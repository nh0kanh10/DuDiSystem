import * as repo from "../repositories/assignment.repository.js"
import * as orgNodeRepo from "../repositories/orgNode.repository.js"
import * as employeeRepo from "../repositories/employee.repository.js"
import { syncEmployeeOrgFields, getNodeById } from "../utils/orgUtils.js"

export function listAssignments(filter) {
  return repo.getAll(filter)
}

export function createAssignment(data) {
  const { employeeId, nodeId, type, startDate, endDate } = data

  if (!employeeId || !nodeId) {
    throw new Error("Thiếu mã nhân viên hoặc đơn vị")
  }
  if (!["permanent", "temporary"].includes(type)) {
    throw new Error("Loại phân công không hợp lệ")
  }

  const employee = employeeRepo.getById(employeeId)
  if (!employee) throw new Error("Nhân viên không tồn tại")

  const node = orgNodeRepo.getById(nodeId)
  if (!node) throw new Error("Đơn vị không tồn tại")

  if (type === "permanent") {
    repo.completeActiveByEmployee(employeeId)
    const nodes = orgNodeRepo.getAll()
    employeeRepo.update(employeeId, syncEmployeeOrgFields({ orgNodeId: nodeId }, nodeId, nodes))
  }

  return repo.create({
    id: `as-${Date.now()}`,
    employeeId,
    nodeId,
    type,
    startDate: startDate || new Date().toISOString().split("T")[0],
    endDate: endDate || undefined,
    status: "active",
  })
}

export function cancelAssignment(id) {
  const assignment = repo.getById(id)
  if (!assignment) return null
  return repo.update(id, { status: "cancelled" })
}
