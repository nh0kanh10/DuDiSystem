import * as kpiTargetRepo from "../repositories/kpiTarget.repository.js"
import * as kpiEntryRepo from "../repositories/kpiEntry.repository.js"

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

export function saveTarget(data) {
  const { employeeId, month, metrics } = data
  if (!employeeId || !month) throw new Error("Thiếu employeeId hoặc month")
  
  const existing = kpiTargetRepo.getAll({ employeeId, month })[0]
  if (existing) {
    return kpiTargetRepo.update(existing.id, { metrics })
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
  kpiTargetRepo.create(newTarget)
  return newTarget
}

export function deleteTarget(id) {
  return kpiTargetRepo.remove(id)
}

export function getEntries(query = {}) {
  return kpiEntryRepo.getAll(query)
}

export function saveEntry(data) {
  const { employeeId, date, metrics, notes } = data
  if (!employeeId || !date) throw new Error("Thiếu employeeId hoặc date")
  
  const existing = kpiEntryRepo.getAll({ employeeId, date })[0]
  if (existing) {
    return kpiEntryRepo.update(existing.id, { metrics, notes })
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
  kpiEntryRepo.create(newEntry)
  return newEntry
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
