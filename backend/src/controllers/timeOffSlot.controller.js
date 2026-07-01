import * as svc from "../services/timeOffSlot.service.js"
import { fail } from "../utils/response.js"

export function list(req, res) {
  try {
    const { week, empId } = req.query
    const result = svc.listSlots({ week, empId })
    res.json({ success: true, data: result })
  } catch (err) { fail(res, err.message) }
}

export function create(req, res) {
  try {
    const result = svc.createSlot(req.body)
    res.status(201).json({ success: true, data: result })
  } catch (err) { fail(res, err.message) }
}

export function approve(req, res) {
  try {
    const { note } = req.body
    const result = svc.approveSlot(req.params.id, note)
    res.json({ success: true, data: result })
  } catch (err) { fail(res, err.message) }
}

export function reject(req, res) {
  try {
    const { note } = req.body
    const result = svc.rejectSlot(req.params.id, note)
    res.json({ success: true, data: result })
  } catch (err) { fail(res, err.message) }
}

export function approveAll(req, res) {
  try {
    const { week } = req.body
    const result = svc.approveAllSlots(week)
    res.json({ success: true, data: result })
  } catch (err) { fail(res, err.message) }
}
