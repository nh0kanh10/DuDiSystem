import * as kpiTargetRepo from "../repositories/kpiTarget.repository.js"
import * as kpiEntryRepo from "../repositories/kpiEntry.repository.js"
import { getModel } from "../db/models.js"

const KPI_POINTS_WEIGHT = {
  zalo: 1,
  fb: 1,
  comment: 1,
  post: 5,
  clientReply: 3,
  khachChuDongIB: 5,
  followUp: 5,
  quote: 15,
  deal: 50,
  revenue: 0.00001,
}

export function getTargets(query = {}) {
  return kpiTargetRepo.getAll(query)
}

export async function saveTarget(data) {
  const { id, employeeId, month, metrics } = data
  if (!employeeId || !month) throw new Error("Thiếu employeeId hoặc month")
  
  if (id) {
    const existing = kpiTargetRepo.getById(id)
    if (!existing) throw new Error("Không tìm thấy chỉ tiêu cần cập nhật")
    
    const duplicate = kpiTargetRepo.getAll({ employeeId, month }).find(d => d.id !== id)
    if (duplicate) {
      throw new Error(`Chỉ tiêu KPI cho nhân viên này trong tháng ${month} đã tồn tại ở một bản ghi khác.`)
    }
    
    await getModel("kpiTargets").updateOne({ id }, { $set: { metrics } })
    return kpiTargetRepo.update(id, { metrics })
  } else {
    const existing = kpiTargetRepo.getAll({ employeeId, month })[0]
    if (existing) {
      throw new Error(`Chỉ tiêu KPI cho nhân viên này trong tháng ${month} đã tồn tại. Vui lòng chỉnh sửa chỉ tiêu cũ thay vì tạo mới.`)
    }
    
    const newTarget = {
      id: "kpi-tgt-" + Math.random().toString(36).substring(2, 9) + "-" + Date.now(),
      employeeId,
      month,
      metrics: metrics || {
        zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, 
        khachChuDongIB: 0, followUp: 0, quote: 0, deal: 0, revenue: 0
      }
    }
    
    await getModel("kpiTargets").create(JSON.parse(JSON.stringify(newTarget)))
    return kpiTargetRepo.create(newTarget)
  }
}

export function deleteTarget(id) {
  return kpiTargetRepo.remove(id)
}

export function getEntries(query = {}) {
  return kpiEntryRepo.getAll(query)
}

export async function saveEntry(data) {
  const { id, employeeId, date, metrics, notes } = data
  if (!employeeId || !date) throw new Error("Thiếu employeeId hoặc date")
  
  if (id) {
    const existing = kpiEntryRepo.getById(id)
    if (!existing) throw new Error("Không tìm thấy báo cáo KPI cần cập nhật")
    
    const duplicate = kpiEntryRepo.getAll({ employeeId, date }).find(d => d.id !== id)
    if (duplicate) {
      throw new Error(`Báo cáo KPI cho ngày ${date} đã tồn tại ở một bản ghi khác.`)
    }
    
    await getModel("kpiEntries").updateOne({ id }, { $set: { metrics, notes } })
    return kpiEntryRepo.update(id, { metrics, notes })
  } else {
    const existing = kpiEntryRepo.getAll({ employeeId, date })[0]
    if (existing) {
      throw new Error(`Báo cáo KPI cho ngày ${date} đã tồn tại. Vui lòng chỉnh sửa báo cáo cũ thay vì tạo mới.`)
    }
    
    const newEntry = {
      id: "kpi-ent-" + Math.random().toString(36).substring(2, 9) + "-" + Date.now(),
      employeeId,
      date,
      metrics: metrics || {
        zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, 
        khachChuDongIB: 0, followUp: 0, quote: 0, deal: 0, revenue: 0
      },
      notes: notes || ""
    }
    
    await getModel("kpiEntries").create(JSON.parse(JSON.stringify(newEntry)))
    return kpiEntryRepo.create(newEntry)
  }
}

export function calculatePoints(metrics) {
  if (!metrics) return 0
  let points = 0
  for (const [key, val] of Object.entries(metrics)) {
    if (KPI_POINTS_WEIGHT[key]) {
      points += (val || 0) * KPI_POINTS_WEIGHT[key]
    }
  }
  return Math.round(points)
}
