import { serverError } from "../utils/response.js"

export function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ${err.stack}`)
  serverError(res)
}

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} không tồn tại` })
}
