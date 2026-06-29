import * as repo from "../repositories/employee.repository.js"
import { createUser } from "./user.service.js"

function generateId(existing) {
  const d = new Date()
  const yy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  const baseId = `${yy}${mm}${dd}${min}`
  let candidate = baseId
  let count = 1
  while (existing.some(e => e.id === candidate)) {
    candidate = `${baseId}-${count}`
    count++
  }
  return candidate
}

function todayVN() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

export function listEmployees(filter = {}) {
  const includeCoreAdmins = filter.includeCoreAdmins === "true" || filter.includeCoreAdmins === true
  let rows = repo.getAll(filter)
  if (!includeCoreAdmins) {
    rows = rows.filter(e => !["0000000000", "1111111111", "2222222222"].includes(e.id))
  }
  return rows
}

export function getEmployee(id) {
  return repo.getById(id)
}

export async function createEmployee(data) {
  const existing = repo.getAll()
  const employee = repo.create({
    id: generateId(existing),
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    department: data.department || "",
    position: data.position || "",
    joinDate: data.joinDate || todayVN(),
    status: data.status || "active",
    contractType: data.contractType || "Chính thức",
    branchId: data.branchId || "",
    orgNodeId: data.orgNodeId || "",
    cccd: data.cccd || "",
    cccdDate: data.cccdDate || "",
    cccdPlace: data.cccdPlace || "",
    bankAccount: data.bankAccount || "",
    bank: data.bank || "",
    dob: data.dob || "",
    gender: data.gender || "Nam",
    curProvince: data.curProvince || "",
    curDistrict: data.curDistrict || "",
    curWard: data.curWard || "",
    curStreet: data.curStreet || "",
    homeProvince: data.homeProvince || "",
    homeDistrict: data.homeDistrict || "",
    homeWard: data.homeWard || "",
    homeStreet: data.homeStreet || "",
    photos: Array.isArray(data.photos) ? data.photos : [],
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
    workHistory: Array.isArray(data.workHistory) ? data.workHistory : [],
    internEndDate: data.internEndDate || "",
    university: data.university || "",
    notes: data.notes || "",
    resignDate: data.resignDate || "",
  })

  try {
    await createUser({
      email: employee.id,
      roleId: "role-user",
      employeeId: employee.id,
      status: "active"
    })
  } catch (err) {
    console.error("Lỗi tự động tạo tài khoản khi thêm nhân sự:", err)
  }

  return employee
}

export function updateEmployee(id, patch) {
  return repo.update(id, patch)
}

export function deleteEmployee(id) {
  return repo.remove(id)
}
