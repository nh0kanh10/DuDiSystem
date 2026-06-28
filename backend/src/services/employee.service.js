import * as repo from "../repositories/employee.repository.js"

export function listEmployees(filter) {
  return repo.getAll(filter)
}

export function getEmployee(id) {
  return repo.getById(id)
}

export function createEmployee(data) {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const minute = String(now.getMinutes()).padStart(2, "0")
  const newId = `${year}${month}${day}${minute}`
  return repo.create({
    id: newId,
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    department: data.department || "",
    position: data.position || "",
    joinDate: data.joinDate || new Date().toLocaleDateString("vi-VN"),
    status: data.status || "active",
    contractType: data.contractType || "Chính thức",
    orgNodeId: data.orgNodeId || "branch-hcm"
  })
}

export function updateEmployee(id, patch) {
  const ALLOWED = ["name", "email", "phone", "department", "position", "joinDate", "status", "contractType", "orgNodeId"]
  const safe = Object.fromEntries(Object.entries(patch).filter(([k]) => ALLOWED.includes(k)))
  return repo.update(id, safe)
}

export function deleteEmployee(id) {
  return repo.remove(id)
}
