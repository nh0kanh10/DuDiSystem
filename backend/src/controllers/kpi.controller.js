import * as kpiService from "../services/kpi.service.js"
import { sendResponse, sendError } from "../utils/response.js"

export function getTargets(req, res) {
  try {
    const { month, employeeId } = req.query
    const query = {}
    if (month) query.month = month
    if (employeeId) query.employeeId = employeeId
    
    const targets = kpiService.getTargets(query)
    sendResponse(res, targets)
  } catch (error) {
    sendError(res, error)
  }
}

export function saveTarget(req, res) {
  try {
    const target = kpiService.saveTarget(req.body)
    sendResponse(res, target, "Đã lưu mục tiêu KPI")
  } catch (error) {
    sendError(res, error)
  }
}

export function deleteTarget(req, res) {
  try {
    kpiService.deleteTarget(req.params.id)
    sendResponse(res, null, "Đã xoá mục tiêu KPI")
  } catch (error) {
    sendError(res, error)
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
    sendResponse(res, entries)
  } catch (error) {
    sendError(res, error)
  }
}

export function saveEntry(req, res) {
  try {
    const entry = kpiService.saveEntry(req.body)
    sendResponse(res, entry, "Đã cập nhật số liệu KPI")
  } catch (error) {
    sendError(res, error)
  }
}
