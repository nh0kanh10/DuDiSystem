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
  const email = (data.email || "").trim()
  if (!email) {
    throw new Error("Email không được để trống")
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error("Email không đúng định dạng")
  }
  const existingEmail = repo.getByEmail(email)
  if (existingEmail) {
    throw new Error(`Email "${email}" đã tồn tại trong hệ thống`)
  }

  const phone = (data.phone || "").trim()
  if (phone) {
    const phoneRegex = /^[0-9]+$/
    if (!phoneRegex.test(phone)) {
      throw new Error("Số điện thoại chỉ được chứa ký số")
    }
    if (phone.length < 10 || phone.length > 11) {
      throw new Error("Số điện thoại phải từ 10 đến 11 ký số")
    }
  }

  const cccd = (data.cccd || "").trim()
  if (cccd) {
    const cccdRegex = /^[0-9]+$/
    if (!cccdRegex.test(cccd)) {
      throw new Error("Số CCCD chỉ được chứa ký số")
    }
    if (cccd.length !== 9 && cccd.length !== 12) {
      throw new Error("Số CCCD phải có độ dài là 9 hoặc 12 ký số")
    }
    const existingCccd = repo.getAll().find(e => e.cccd && e.cccd.trim() === cccd)
    if (existingCccd) {
      throw new Error(`Số CCCD "${cccd}" đã tồn tại trong hệ thống`)
    }
  }

  const bankAccount = (data.bankAccount || "").trim()
  if (bankAccount) {
    const bankAccRegex = /^[0-9]+$/
    if (!bankAccRegex.test(bankAccount)) {
      throw new Error("Số tài khoản ngân hàng chỉ được chứa ký số")
    }
  }

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
    avatar: data.avatar || "",
    photos: Array.isArray(data.photos) ? data.photos : [],
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
    workHistory: Array.isArray(data.workHistory) ? data.workHistory : [],
    internEndDate: data.internEndDate || "",
    university: data.university || "",
    notes: data.notes || "",
    resignDate: data.resignDate || "",
    contractHistory: [
      {
        contractType: data.contractType || "staff",
        startDate: data.joinDate || todayVN(),
        endDate: ""
      }
    ]
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
  if (patch.email !== undefined) {
    const email = (patch.email || "").trim()
    if (!email) {
      throw new Error("Email không được để trống")
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error("Email không đúng định dạng")
    }
    const existingEmail = repo.getByEmail(email)
    if (existingEmail && existingEmail.id !== id) {
      throw new Error(`Email "${email}" đã tồn tại trong hệ thống`)
    }
    patch.email = email
  }

  if (patch.phone !== undefined) {
    const phone = (patch.phone || "").trim()
    if (phone) {
      const phoneRegex = /^[0-9]+$/
      if (!phoneRegex.test(phone)) {
        throw new Error("Số điện thoại chỉ được chứa ký số")
      }
      if (phone.length < 10 || phone.length > 11) {
        throw new Error("Số điện thoại phải từ 10 đến 11 ký số")
      }
    }
  }

  if (patch.cccd !== undefined) {
    const cccd = (patch.cccd || "").trim()
    if (cccd) {
      const cccdRegex = /^[0-9]+$/
      if (!cccdRegex.test(cccd)) {
        throw new Error("Số CCCD chỉ được chứa ký số")
      }
      if (cccd.length !== 9 && cccd.length !== 12) {
        throw new Error("Số CCCD phải có độ dài là 9 hoặc 12 ký số")
      }
      const existingCccd = repo.getAll().find(e => e.cccd && e.cccd.trim() === cccd)
      if (existingCccd && existingCccd.id !== id) {
        throw new Error(`Số CCCD "${cccd}" đã tồn tại trong hệ thống`)
      }
    }
  }

  if (patch.bankAccount !== undefined) {
    const bankAccount = (patch.bankAccount || "").trim()
    if (bankAccount) {
      const bankAccRegex = /^[0-9]+$/
      if (!bankAccRegex.test(bankAccount)) {
        throw new Error("Số tài khoản ngân hàng chỉ được chứa ký số")
      }
    }
  }

  let safe = { ...patch }
  if (safe.orgNodeId !== undefined) {
    safe = applyOrgSync(safe)
  }

  const oldEmp = repo.getById(id)
  if (oldEmp && patch.contractType !== undefined && patch.contractType !== oldEmp.contractType) {
    const history = oldEmp.contractHistory && oldEmp.contractHistory.length > 0
      ? oldEmp.contractHistory
      : [{ contractType: oldEmp.contractType || "staff", startDate: oldEmp.joinDate || todayVN(), endDate: "" }]
    
    const today = todayVN()
    const updatedHistory = history.map((item, index) => {
      if (index === history.length - 1) {
        return { ...item, endDate: today }
      }
      return item
    })
    
    updatedHistory.push({
      contractType: patch.contractType,
      startDate: today,
      endDate: ""
    })
    
    safe.contractHistory = updatedHistory
  }

  const updatedEmp = repo.update(id, safe)

  if (patch.status !== undefined) {
    const user = userRepo.getByEmployeeId(id)
    if (user) {
      const newUserStatus = patch.status === "inactive" ? "locked" : "active"
      const updatePayload = { status: newUserStatus }
      if (newUserStatus === "locked") {
        updatePayload.lockReason = "Bạn đã nghỉ việc, hệ thống tự động khóa. Nếu sai lầm vui lòng liên hệ admin"
      } else {
        updatePayload.lockReason = null
      }
      userRepo.update(user.id, updatePayload)
    }
  }

  return updatedEmp
}

export function deleteEmployee(id) {
  const user = userRepo.getByEmployeeId(id)
  if (user) {
    userRepo.remove(user.id)
  }
  return repo.remove(id)
}
