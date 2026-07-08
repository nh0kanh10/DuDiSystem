import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config/index.js"
import { unauthorized } from "../utils/response.js"
import { getById } from "../repositories/user.repository.js"

export function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) return unauthorized(res)
  const token = header.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const dbUser = getById(decoded.id)
    if (!dbUser || dbUser.status !== "active") {
      return unauthorized(res, "Tài khoản không hợp lệ hoặc đã bị khóa")
    }
    const dbVersion = dbUser.permissionsVersion ?? 0
    const tokenVersion = decoded.permissionsVersion ?? 0
    if (dbVersion !== tokenVersion) {
      return unauthorized(res, "Phiên đăng nhập đã hết hạn do thay đổi quyền. Vui lòng đăng nhập lại.")
    }
    req.user = { ...decoded, permissionsVersion: dbVersion }
    next()
  } catch {
    unauthorized(res, "Token không hợp lệ hoặc đã hết hạn")
  }
}
