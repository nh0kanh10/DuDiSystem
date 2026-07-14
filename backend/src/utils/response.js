export function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data })
}

export function created(res, data) {
  return ok(res, data, 201)
}

export function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, message })
}

export function notFound(res, message = "Không tìm thấy") {
  return fail(res, message, 404)
}

export function unauthorized(res, message = "Unauthorized") {
  return fail(res, message, 401)
}

export function conflict(res, message) {
  return fail(res, message, 409)
}

export function serverError(res, message = "Lỗi server nội bộ") {
  return fail(res, message, 500)
}
