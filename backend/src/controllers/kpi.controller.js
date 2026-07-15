import * as kpiService from "../services/kpi.service.js"
import { ok, serverError } from "../utils/response.js"

export function getTargets(req, res) {
  try {
    const { month, employeeId } = req.query
    const query = {}
    if (month) query.month = month
    if (employeeId) query.employeeId = employeeId
    
    const targets = kpiService.getTargets(query)
    ok(res, targets)
  } catch (error) {
    serverError(res, error)
  }
}

export function saveTarget(req, res) {
  try {
    const target = kpiService.saveTarget(req.body)
    ok(res, target)
  } catch (error) {
    serverError(res, error)
  }
}

export function deleteTarget(req, res) {
  try {
    kpiService.deleteTarget(req.params.id)
    ok(res, null)
  } catch (error) {
    serverError(res, error)
  }
}

export function getEntries(req, res) {
  try {
    const { date, month, startDate, endDate, employeeId } = req.query
    const query = {}
    if (date) query.date = date
    if (month) query.month = month
    if (startDate) query.startDate = startDate
    if (endDate) query.endDate = endDate
    if (employeeId) query.employeeId = employeeId
    
    const entries = kpiService.getEntries(query)
    ok(res, entries)
  } catch (error) {
    serverError(res, error)
  }
}

export function saveEntry(req, res) {
  try {
    const entry = kpiService.saveEntry(req.body)
    ok(res, entry)
  } catch (error) {
    serverError(res, error)
  }
}
