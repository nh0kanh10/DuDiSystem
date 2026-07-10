import * as repo from "../repositories/crm.repository.js"
import * as empRepo from "../repositories/employee.repository.js"
import * as customerRepo from "../repositories/customer.repository.js"
import * as leadSvc from "./lead.service.js"
import * as customerSvc from "./customer.service.js"
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

export function listRecords({ status, assignedTo, area, department, search, branchId, page = 0, size = 20 } = {}) {
  let records = repo.getAll()

  if (branchId?.trim() && branchId !== "all") {
    const branchStaffs = empRepo.getAll({ branchId })
    const staffIds = branchStaffs.map(e => e.id)
    records = records.filter(r => !r.assignedTo || staffIds.includes(r.assignedTo))
  }

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

  let newId = body.id
  if (newId) {
    newId = String(newId).replace("crm-", "")
  } else {
    const records = repo.getAll()
    let maxId = 0
    for (const r of records) {
      const idStr = String(r.id || "").replace("crm-", "")
      const num = parseInt(idStr, 10)
      if (!isNaN(num) && num > maxId) {
        maxId = num
      }
    }
    newId = String(maxId > 0 ? maxId + 1 : 1)
  }

  return repo.create({
    id: newId,
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
  const record = repo.getById(id)
  if (!record) throw new Error("Không tìm thấy dữ liệu")
  const { leads } = listLeadsForCrmRecord(id)
  if (leads.length > 0) {
    const codes = leads.map(l => l.code).join(", ")
    throw new Error(`Không thể xóa khách "${record.businessName}" vì đã được tạo cơ hội (Lead: ${codes}). Vui lòng xóa cơ hội trước!`)
  }
  return repo.remove(id)
}

export function deleteRecordsBulk(ids) {
  if (!Array.isArray(ids) || ids.length === 0) throw new Error("Danh sách ID không hợp lệ")
  
  const cannotDelete = []
  ids.forEach(id => {
    const record = repo.getById(id)
    if (record) {
      const { leads } = listLeadsForCrmRecord(id)
      if (leads.length > 0) {
        cannotDelete.push(`"${record.businessName}" (Lead: ${leads.map(l => l.code).join(", ")})`)
      }
    }
  })

  if (cannotDelete.length > 0) {
    throw new Error(`Không thể xóa các dữ liệu CRM sau vì đã được tạo cơ hội:\n${cannotDelete.map(s => `- ${s}`).join("\n")}\nVui lòng xóa cơ hội trước!`)
  }

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

  const currentAssigned = repo.getAll().filter(r => r.assignedTo);
  const employeeStats = resolved.map(e => ({
    id: e.id,
    name: e.name,
    count: currentAssigned.filter(r => r.assignedTo === e.id).length,
    newAssigned: 0
  }));

  unassigned.forEach((record) => {
    employeeStats.sort((a, b) => a.count - b.count);
    const target = employeeStats[0];

    repo.update(record.id, { assignedTo: target.id, assignedToName: target.name, updatedAt: now() })
    target.count++;
    target.newAssigned++;
  })

  return {
    totalUnassigned: unassigned.length,
    assignedCount: unassigned.length,
    result: employeeStats.map(e => ({ employeeId: e.id, employeeName: e.name, assignedCount: e.newAssigned }))
  }
}

export function assignSpecific(employeeId, quantity) {
  const emp = getEmployee(employeeId)
  if (!emp) throw new Error(`Không tìm thấy nhân viên: ${employeeId}`)
  if (emp.status !== "active") throw new Error(`Nhân viên ${emp.name} không còn hoạt động.`)

  let unassigned = repo.getAll().filter(r => !r.assignedTo)
  if (quantity > 0) {
    unassigned = unassigned.slice(0, quantity)
  }

  unassigned.forEach(record => {
    repo.update(record.id, { assignedTo: emp.id, assignedToName: emp.name, updatedAt: now() })
  })

  return {
    assignedCount: unassigned.length,
    employeeId: emp.id,
    employeeName: emp.name
  }
}

export function getAdminDashboard({ branchId } = {}) {
  let all = repo.getAll()
  if (branchId?.trim() && branchId !== "all") {
    const branchStaffs = empRepo.getAll({ branchId })
    const staffIds = branchStaffs.map(e => e.id)
    all = all.filter(r => !r.assignedTo || staffIds.includes(r.assignedTo))
  }
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

function assertCanConvertCrm(record, user) {
  const isAdmin = ["role-admin", "role-super-admin"].includes(user?.roleId)
  if (isAdmin) return
  if (record.assignedTo && record.assignedTo === user?.employeeId) return
  const err = new Error("Bạn chỉ được chuyển data do mình quản lý")
  err.status = 403
  throw err
}

/** CRM data → Lead; cùng CRM có thể có nhiều lead (forceNew) */
export function listLeadsForCrmRecord(crmId) {
  const record = repo.getById(crmId)
  if (!record) throw new Error("Không tìm thấy dữ liệu")

  const map = new Map()
  const add = (lead) => {
    if (!lead?.id) return
    map.set(lead.id, { id: lead.id, code: lead.code, name: lead.name, status: lead.status })
  }

  for (const lead of leadSvc.listLeadsBySourceCrmId(crmId)) add(lead)

  const phone = String(record.phone ?? "").trim()
  if (phone) {
    const customer = customerRepo.findByPhone(phone)
    if (customer?.id) {
      for (const lead of leadSvc.listLeadsByCustomerId(customer.id)) add(lead)
    }
  }

  if (record.convertedLeadId) add(leadSvc.getLead(record.convertedLeadId))

  const ids = Array.isArray(record.convertedLeadIds) ? record.convertedLeadIds : []
  for (const id of ids) add(leadSvc.getLead(id))

  const leads = Array.from(map.values()).sort((a, b) => String(b.code).localeCompare(String(a.code)))
  return { leads }
}

/** CRM data → Lead (customer có thể trùng; 1 CRM có thể có nhiều lead) */
export function convertToLead(crmId, user = {}, options = {}) {
  const record = repo.getById(crmId)
  if (!record) throw new Error("Không tìm thấy dữ liệu")
  assertCanConvertCrm(record, user)

  const leadName = String(options.leadName || "").trim()
  if (!leadName) throw new Error("Tên lead (cơ hội) là bắt buộc")

  const forceNew = options.forceNew === true

  if (!forceNew) {
    if (record.convertedLeadId) {
      const existing = leadSvc.getLead(record.convertedLeadId)
      if (existing) {
        return { lead: existing, record, alreadyExists: true }
      }
    }

    const bySource = leadSvc.findLeadBySourceCrmId(crmId)
    if (bySource) {
      const updated = repo.update(crmId, {
        convertedLeadId: bySource.id,
        convertedLeadCode: bySource.code,
        updatedAt: now(),
      })
      return { lead: bySource, record: updated, alreadyExists: true }
    }
  }

  const customer = customerSvc.findOrCreateFromCrm(record)
  customerSvc.linkCrmRecord(customer.id, crmId)

  const noteParts = [
    record.note,
    record.address,
    record.area,
    record.website,
    record.businessType,
  ].filter(Boolean)

  const lead = leadSvc.createLead({
    name: leadName,
    customerId: customer.id,
    customerType: "company",
    companyName: record.businessName,
    contactName: "",
    contactPhone: record.phone || "",
    industry: record.businessType || "",
    address: record.address || "",
    roughNotes: noteParts.join(" · "),
    assignedToId: record.assignedTo || user.employeeId || "",
    sourceCrmId: crmId,
    status: "contacted",
    formStatus: "not_sent",
    formType: "landing_page",
  })

  const leadIds = Array.isArray(record.convertedLeadIds) ? [...record.convertedLeadIds] : []
  if (record.convertedLeadId && !leadIds.includes(record.convertedLeadId)) {
    leadIds.unshift(record.convertedLeadId)
  }
  if (!leadIds.includes(lead.id)) leadIds.push(lead.id)

  const updated = repo.update(crmId, {
    convertedLeadId: lead.id,
    convertedLeadCode: lead.code,
    convertedLeadIds: leadIds,
    updatedAt: now(),
  })

  return { lead, record: updated, customer, alreadyExists: false }
}
