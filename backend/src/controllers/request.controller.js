import * as svc from "../services/request.service.js"
import { ok, created, notFound, fail } from "../utils/response.js"
import { canManageRequests, enforceBranchQuery, assertEmployeeInScope, isAdminUser } from "../utils/access.js"

export function list(req, res) {
  let filter = { ...req.query }
  if (!canManageRequests(req.user)) {
    filter.employeeId = req.user.employeeId
  } else {
    filter = enforceBranchQuery(req.user, filter)
  }
  ok(res, svc.listRequests(filter))
}

export function getOne(req, res) {
  const req_ = svc.getRequest(req.params.id)
  if (!req_) return notFound(res, "Không tìm thấy đơn")
  if (!canManageRequests(req.user)) {
    if (req_.employeeId !== req.user.employeeId) {
      return fail(res, "Không có quyền xem đơn này", 403)
    }
  } else {
    const denied = assertEmployeeInScope(req.user, req_.employeeId)
    if (denied) return fail(res, denied.error, denied.status)
  }
  ok(res, req_)
}

export function create(req, res) {
  const body = { ...req.body }
  if (!canManageRequests(req.user)) {
    body.employeeId = req.user.employeeId
  } else if (body.employeeId) {
    const denied = assertEmployeeInScope(req.user, body.employeeId)
    if (denied) return fail(res, denied.error, denied.status)
  }
  const result = svc.createRequest(body, { isAdmin: isAdminUser(req.user) })
  if (result?.error) return fail(res, result.error, result.status)
  created(res, result)
}

export function cancel(req, res) {
  const req_ = svc.getRequest(req.params.id)
  if (!req_) return notFound(res, "Không tìm thấy đơn")
  
  let employeeId = req.user.employeeId
  if (canManageRequests(req.user)) {
    const denied = assertEmployeeInScope(req.user, req_.employeeId)
    if (denied) return fail(res, denied.error, denied.status)
    employeeId = undefined 
  }

  const result = svc.cancelRequest(req.params.id, employeeId)
  if (!result) return notFound(res, "Không tìm thấy đơn")
  if (result.error) return fail(res, result.error, result.status)
  ok(res, result)
}

export function approve(req, res) {
  if (!canManageRequests(req.user)) return fail(res, "Không có quyền duyệt đơn", 403)
  const req_ = svc.getRequest(req.params.id)
  if (!req_) return notFound(res, "Không tìm thấy đơn")
  const denied = assertEmployeeInScope(req.user, req_.employeeId)
  if (denied) return fail(res, denied.error, denied.status)
  const result = svc.approveRequest(req.params.id)
  if (!result) return notFound(res, "Không tìm thấy đơn")
  if (result.error) return fail(res, result.error, result.status)
  ok(res, result)
}

export function reject(req, res) {
  if (!canManageRequests(req.user)) return fail(res, "Không có quyền từ chối đơn", 403)
  const req_ = svc.getRequest(req.params.id)
  if (!req_) return notFound(res, "Không tìm thấy đơn")
  const denied = assertEmployeeInScope(req.user, req_.employeeId)
  if (denied) return fail(res, denied.error, denied.status)
  const result = svc.rejectRequest(req.params.id)
  if (!result) return notFound(res, "Không tìm thấy đơn")
  if (result.error) return fail(res, result.error, result.status)
  ok(res, result)
}

export function update(req, res) {
  const req_ = svc.getRequest(req.params.id)
  if (!req_) return notFound(res, "Không tìm thấy đơn")
  
  let isAdminEdit = false
  if (!canManageRequests(req.user)) {
    if (req_.employeeId !== req.user.employeeId) {
      return fail(res, "Không có quyền sửa đơn này", 403)
    }
  } else {
    const denied = assertEmployeeInScope(req.user, req_.employeeId)
    if (denied) return fail(res, denied.error, denied.status)
    isAdminEdit = true
  }

  const result = svc.updateRequest(req.params.id, req.body, { adminEdit: isAdminEdit })
  if (!result) return notFound(res, "Không tìm thấy đơn")
  if (result.error) return fail(res, result.error, result.status)
  ok(res, result)
}

export function approveBulk(req, res) {
  if (!canManageRequests(req.user)) return fail(res, "Không có quyền duyệt đơn", 403)
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : []
  
  const validIds = []
  const failed = []
  for (const id of ids) {
    const req_ = svc.getRequest(id)
    if (!req_) {
      failed.push({ id, error: "Không tìm thấy đơn" })
      continue
    }
    const denied = assertEmployeeInScope(req.user, req_.employeeId)
    if (denied) {
      failed.push({ id, error: denied.error })
      continue
    }
    validIds.push(id)
  }

  let result = { approved: [], failed: [], count: 0 }
  if (validIds.length > 0) {
    result = svc.approveRequestsBulk(validIds)
    if (result.error) return fail(res, result.error, result.status)
  }
  
  result.failed = [...failed, ...(result.failed || [])]
  ok(res, result)
}

export function remove(req, res) {
  if (!canManageRequests(req.user)) return fail(res, "Không có quyền xóa đơn", 403)
  const req_ = svc.getRequest(req.params.id)
  if (!req_) return notFound(res, "Không tìm thấy đơn")
  const denied = assertEmployeeInScope(req.user, req_.employeeId)
  if (denied) return fail(res, denied.error, denied.status)

  const deleted = svc.deleteRequest(req.params.id)
  if (deleted?.error) return fail(res, deleted.error, deleted.status)
  if (!deleted) return notFound(res, "Không tìm thấy đơn")
  ok(res, { message: "Đã xóa đơn" })
}
