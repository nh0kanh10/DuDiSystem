import * as repo from "../repositories/crm.repository.js"
import * as empRepo from "../repositories/employee.repository.js"
import { v4 as uuidv4 } from "uuid"

export const CRM_STATUSES = [
  "Chưa xử lý", "Chặn người lạ", "Đã gửi tin nhắn", "Không có Zalo", "Trả lời"
]

function now() {
  return new Date().toISOString()
}

function getEmployee(employeeId) {
  return empRepo.getById(employeeId) || null
}

function resolveAssignee(employeeId) {
  const emp = getEmployee(employeeId)
  if (!emp) throw new Error(`Không tìm thấy nhân viên: ${employeeId}`)
  if (emp.status !== "active") throw new Error(`Nhân viên ${emp.name} (${employeeId}) không còn hoạt động`)
  return { assignedTo: emp.id, assignedToName: emp.name }
}

export function listRecords({ status, assignedTo, area, department, search, page = 0, size = 20 } = {}) {
  let records = repo.getAll()

  if (status?.trim()) records = records.filter(r => r.status === status)
  if (assignedTo?.trim()) {
    records = assignedTo === "unassigned"
      ? records.filter(r => !r.assignedTo)
      : records.filter(r => r.assignedTo === assignedTo)
  }
  if (area?.trim()) records = records.filter(r => r.area?.toLowerCase().includes(area.toLowerCase()))
  
  if (department?.trim()) {
    const departmentStaffs = empRepo.getAll({ department })
    const staffIds = departmentStaffs.map(e => e.id)
    records = records.filter(r => r.assignedTo && staffIds.includes(r.assignedTo))
  }

  if (search?.trim()) {
    const q = search.toLowerCase()
    records = records.filter(r =>
      r.businessName?.toLowerCase().includes(q) ||
      r.address?.toLowerCase().includes(q) ||
      r.phone?.includes(q)
    )
  }

  records.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  const total = records.length
  return {
    content: records.slice(page * size, page * size + size),
    totalElements: total,
    totalPages: Math.ceil(total / size),
    number: page,
    size
  }
}

export function getRecordById(id) {
  return repo.getById(id)
}

export function createRecord(body, createdBy) {
  const { businessName, address = "", area = "", phone = "", website = "", businessType = "", googleMapUrl = "", note = "", status = "Chưa xử lý" } = body
  if (!businessName?.trim()) throw new Error("Tên doanh nghiệp không được để trống")
  return repo.create({
    id: `crm-${uuidv4().slice(0, 8)}`,
    businessName: businessName.trim(),
    address, area, phone, website, businessType, googleMapUrl,
    status, assignedTo: null, assignedToName: null,
    createdBy, note,
    createdAt: now(), updatedAt: now()
  })
}

export function updateRecord(id, body) {
  if (!repo.getById(id)) throw new Error("Không tìm thấy dữ liệu")
  const patch = {}
  ;["businessName", "address", "area", "phone", "website", "businessType", "googleMapUrl", "status", "note"]
    .forEach(k => { if (body[k] !== undefined) patch[k] = body[k] })
  patch.updatedAt = now()
  return repo.update(id, patch)
}

export function deleteRecord(id) {
  if (!repo.getById(id)) throw new Error("Không tìm thấy dữ liệu")
  return repo.remove(id)
}

export function deleteRecordsBulk(ids) {
  if (!Array.isArray(ids) || ids.length === 0) throw new Error("Danh sách ID không hợp lệ")
  let count = 0
  ids.forEach(id => { if (repo.remove(id)) count++ })
  return { deletedCount: count }
}

export function updateNote(id, note, currentUser) {
  const record = repo.getById(id)
  if (!record) throw new Error("Không tìm thấy dữ liệu")
  const isAdmin = ["role-admin", "role-super-admin"].includes(currentUser.roleId)
  if (!isAdmin && record.assignedTo !== currentUser.employeeId) {
    const err = new Error("Bạn chỉ được cập nhật ghi chú cho khách hàng do mình quản lý")
    err.status = 403
    throw err
  }
  return repo.update(id, { note, updatedAt: now() })
}

export function updateStatusByEmployee(id, status, currentUser) {
  const record = repo.getById(id)
  if (!record) throw new Error("Không tìm thấy dữ liệu")
  if (record.assignedTo !== currentUser.employeeId) {
    const err = new Error("Bạn chỉ được cập nhật trạng thái khách hàng do mình quản lý")
    err.status = 403
    throw err
  }
  if (!CRM_STATUSES.includes(status)) throw new Error("Trạng thái không hợp lệ")
  return repo.update(id, { status, updatedAt: now() })
}

export function assignOne(dataId, employeeId) {
  if (!repo.getById(dataId)) throw new Error("Không tìm thấy dữ liệu")
  if (!employeeId || employeeId === "unassigned") {
    return repo.update(dataId, { assignedTo: null, assignedToName: null, updatedAt: now() })
  }
  const { assignedTo, assignedToName } = resolveAssignee(employeeId)
  return repo.update(dataId, { assignedTo, assignedToName, updatedAt: now() })
}

export function assignBulk(dataIds, employeeId) {
  let assignedTo = null
  let assignedToName = null
  if (employeeId && employeeId !== "unassigned") {
    const resolved = resolveAssignee(employeeId)
    assignedTo = resolved.assignedTo
    assignedToName = resolved.assignedToName
  }
  let count = 0
  dataIds.forEach(id => {
    if (repo.getById(id)) {
      repo.update(id, { assignedTo, assignedToName, updatedAt: now() })
      count++
    }
  })
  return { assignedCount: count }
}

export function reassign(fromEmployeeId, toEmployeeId) {
  const { assignedTo, assignedToName } = resolveAssignee(toEmployeeId)
  const records = repo.getAll().filter(r => r.assignedTo === fromEmployeeId)
  records.forEach(r => repo.update(r.id, { assignedTo, assignedToName, updatedAt: now() }))
  return { movedCount: records.length }
}

export function autoAssign(employeeIds) {
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
    throw new Error("Danh sách nhân viên không được để trống")
  }

  const resolved = employeeIds.map(id => {
    const emp = getEmployee(id)
    if (!emp) throw new Error(`Không tìm thấy nhân viên: ${id}`)
    if (emp.status !== "active") throw new Error(`Nhân viên ${emp.name} (${id}) không còn hoạt động. Vui lòng bỏ ra khỏi danh sách.`)
    return emp
  })

  const unassigned = repo.getAll().filter(r => !r.assignedTo)
  if (unassigned.length === 0) return { totalUnassigned: 0, assignedCount: 0, result: [] }

  const countsMap = {}
  resolved.forEach(e => { countsMap[e.id] = 0 })

  unassigned.forEach((record, i) => {
    const emp = resolved[i % resolved.length]
    repo.update(record.id, { assignedTo: emp.id, assignedToName: emp.name, updatedAt: now() })
    countsMap[emp.id]++
  })

  return {
    totalUnassigned: unassigned.length,
    assignedCount: unassigned.length,
    result: resolved.map(e => ({ employeeId: e.id, employeeName: e.name, assignedCount: countsMap[e.id] }))
  }
}

export function getAdminDashboard() {
  const all = repo.getAll()
  const assigned = all.filter(r => r.assignedTo).length
  const statusBreakdown = {}
  CRM_STATUSES.forEach(s => { statusBreakdown[s] = 0 })
  all.forEach(r => { if (statusBreakdown[r.status] !== undefined) statusBreakdown[r.status]++ })

  const empMap = {}
  all.filter(r => r.assignedTo).forEach(r => {
    if (!empMap[r.assignedTo]) {
      empMap[r.assignedTo] = { employeeId: r.assignedTo, employeeName: r.assignedToName, total: 0, converted: 0 }
    }
    empMap[r.assignedTo].total++
    if (["Trả lời"].includes(r.status)) empMap[r.assignedTo].converted++
  })

  const employeeStats = Object.values(empMap).sort((a, b) => b.total - a.total)
  const employeeProgress = employeeStats.map(emp => ({
    employeeId: emp.employeeId,
    employeeName: emp.employeeName,
    // Frontend expects: totalAssigned / completedCount / processingCount
    totalAssigned: emp.total,
    completedCount: emp.converted,
    processingCount: Math.max(emp.total - emp.converted, 0),
  }))

  return {
    totalData: all.length,
    // Old keys (kept for backward compatibility)
    assigned,
    unassigned: all.length - assigned,
    statusBreakdown,
    employeeStats,

    // Client contract (CrmAdminPage)
    assignedData: assigned,
    unassignedData: all.length - assigned,
    statusCounts: statusBreakdown,
    employeeProgress,
  }
}

export function getEmployeeDashboard(employeeId) {
  const myRecords = repo.getAll().filter(r => r.assignedTo === employeeId)
  const statusBreakdown = {}
  CRM_STATUSES.forEach(s => { statusBreakdown[s] = 0 })
  myRecords.forEach(r => { if (statusBreakdown[r.status] !== undefined) statusBreakdown[r.status]++ })
  const totalAssigned = myRecords.length
  const untreatedCount = statusBreakdown["Chưa xử lý"] ?? 0
  const completedCount = statusBreakdown["Trả lời"] ?? 0
  // "Đã gửi" here means: processed but not replied yet.
  const processingCount = Math.max(totalAssigned - untreatedCount - completedCount, 0)

  return {
    // Old keys (kept for backward compatibility)
    total: totalAssigned,
    statusBreakdown,

    // Client contract (CrmStaffPage)
    totalAssigned,
    untreatedCount,
    processingCount,
    completedCount,
    statusCounts: statusBreakdown,
  }
}

export function listMyRecords(employeeId, { status, search, page = 0, size = 20 } = {}) {
  let records = repo.getAll().filter(r => r.assignedTo === employeeId)
  if (status?.trim()) records = records.filter(r => r.status === status)
  if (search?.trim()) {
    const q = search.toLowerCase()
    records = records.filter(r => r.businessName?.toLowerCase().includes(q) || r.phone?.includes(q))
  }
  records.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  const total = records.length
  return {
    content: records.slice(page * size, page * size + size),
    totalElements: total,
    totalPages: Math.ceil(total / size),
    number: page,
    size
  }
}
