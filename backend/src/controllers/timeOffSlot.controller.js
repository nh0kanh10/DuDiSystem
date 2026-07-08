import * as svc from "../services/timeOffSlot.service.js"
import * as slotRepo from "../repositories/timeOffSlot.repository.js"
import { fail } from "../utils/response.js"
import {
  canManageRequests,
  assertEmployeeInScope,
  filterRowsByBranch,
  getUserScope,
} from "../utils/access.js"

export function list(req, res) {
  try {
    let { week, empId } = req.query
    if (!canManageRequests(req.user)) {
      empId = req.user.employeeId
    }
    let result = svc.listSlots({ week, empId })
    if (canManageRequests(req.user) && !empId) {
      const scope = getUserScope(req.user)
      if (scope.type === "branch" && scope.branchId) {
        result = filterRowsByBranch(result, scope.branchId, "empId")
      }
    }
    res.json({ success: true, data: result })
  } catch (err) { fail(res, err.message) }
}

export function create(req, res) {
  try {
    const body = { ...req.body }
    if (!canManageRequests(req.user)) {
      body.empId = req.user.employeeId
    } else if (body.empId) {
      const denied = assertEmployeeInScope(req.user, body.empId)
      if (denied) return fail(res, denied.error, denied.status)
    }
    const result = svc.createSlot(body)
    res.status(201).json({ success: true, data: result })
  } catch (err) { fail(res, err.message) }
}

function assertSlotScope(req, res, id) {
  const slot = slotRepo.getById(id)
  if (!slot) {
    fail(res, "Không tìm thấy ca đăng ký nghỉ", 404)
    return null
  }
  const denied = assertEmployeeInScope(req.user, slot.empId)
  if (denied) {
    fail(res, denied.error, denied.status)
    return null
  }
  return slot
}

export function approve(req, res) {
  try {
    if (!assertSlotScope(req, res, req.params.id)) return
    const { note } = req.body
    const result = svc.approveSlot(req.params.id, note)
    res.json({ success: true, data: result })
  } catch (err) { fail(res, err.message) }
}

export function reject(req, res) {
  try {
    if (!assertSlotScope(req, res, req.params.id)) return
    const { note } = req.body
    const result = svc.rejectSlot(req.params.id, note)
    res.json({ success: true, data: result })
  } catch (err) { fail(res, err.message) }
}

export function approveAll(req, res) {
  try {
    const { week } = req.body
    const scope = getUserScope(req.user)
    if (scope.type === "branch" && scope.branchId) {
      const pending = svc.listSlots({ week }).filter(s => s.status === "pending")
      const inBranch = filterRowsByBranch(pending, scope.branchId, "empId")
      const results = inBranch.map(s => svc.approveSlot(s.id, "Đã duyệt"))
      res.json({ success: true, data: results })
      return
    }
    const result = svc.approveAllSlots(week)
    res.json({ success: true, data: result })
  } catch (err) { fail(res, err.message) }
}
