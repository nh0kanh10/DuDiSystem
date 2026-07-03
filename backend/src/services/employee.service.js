import * as repo from "../repositories/employee.repository.js"
import * as userRepo from "../repositories/user.repository.js"
import * as orgNodeRepo from "../repositories/orgNode.repository.js"
import { createUser } from "./user.service.js"
import { syncEmployeeOrgFields } from "../utils/orgUtils.js"
import { generateEmployeeId, collectTakenEmployeeIds } from "../utils/employeeId.js"

function todayVN() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

function applyOrgSync(patch) {
  if (!patch.orgNodeId) return patch
  const nodes = orgNodeRepo.getAll()
  const node = nodes.find(n => n.id === patch.orgNodeId)
  if (!node) throw new Error("Đơn vị tổ chức không tồn tại")
  return syncEmployeeOrgFields(patch, patch.orgNodeId, nodes)
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
  const takenIds = collectTakenEmployeeIds(repo, userRepo)
  let fields = {
    id: generateEmployeeId(takenIds),
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    department: data.department || "",
    position: data.position || "",
    positionId: data.positionId || "",
    joinDate: data.joinDate || todayVN(),
    status: data.status || "active",
    contractType: data.contractType || "staff",
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
  }

  if (fields.orgNodeId) {
    fields = applyOrgSync(fields)
  }

  const employee = repo.create(fields)

  try {
    await createUser({
      loginId: employee.id,
      roleId: "role-user",
      employeeId: employee.id,
      status: "active",
    })
  } catch (err) {
    console.error("Lỗi tự động tạo tài khoản khi thêm nhân sự:", err)
  }

  return employee
}

export function updateEmployee(id, patch) {
  let safe = { ...patch }
  if (safe.orgNodeId !== undefined) {
    safe = applyOrgSync(safe)
  }
  return repo.update(id, safe)
}

export function deleteEmployee(id) {
  return repo.remove(id)
}
