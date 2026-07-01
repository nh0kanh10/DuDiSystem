import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config/index.js"
import { unauthorized } from "../utils/response.js"

export function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) return unauthorized(res)
  const token = header.slice(7)
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    unauthorized(res, "Token không hợp lệ hoặc đã hết hạn")
  }
}
