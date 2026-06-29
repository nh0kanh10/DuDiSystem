import * as repo from "../repositories/employee.repository.js"

function generateId(existing) {
  const max = existing.reduce((m, e) => {
    const n = parseInt(e.id.replace(/\D/g, ""), 10)
    return isNaN(n) ? m : Math.max(m, n)
  }, 0)
  return `NV${String(max + 1).padStart(3, "0")}`
}

function todayVN() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

export function listEmployees(filter) {
  return repo.getAll(filter)
}

export function getEmployee(id) {
  return repo.getById(id)
}

export function createEmployee(data) {
  const existing = repo.getAll()
  return repo.create({
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
}

export function updateEmployee(id, patch) {
  return repo.update(id, patch)
}

export function deleteEmployee(id) {
  return repo.remove(id)
}
