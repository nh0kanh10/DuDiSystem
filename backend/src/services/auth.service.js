import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getByEmail, getByEmployeeId, getById } from "../repositories/user.repository.js"
import { JWT_SECRET } from "../config/index.js"
import { enrichUserProfile, resolveBranchId } from "./user.service.js"

const JWT_MAX_HOURS = 12

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${JWT_MAX_HOURS}h` })
}

function tokenPayload(user, branchId) {
  return {
    id: user.id,
    employeeId: user.employeeId,
    roleId: user.roleId,
    branchId,
    permissions: user.permissions || null,
  }
}

export function refreshSession(decoded) {
  const user = getById(decoded.id)
  if (!user || user.status !== "active") {
    return { error: "Tài khoản không hợp lệ", status: 401 }
  }
  const branchId = resolveBranchId(user.id)
  return { token: signToken(tokenPayload(user, branchId)) }
}

export async function login(loginKey, password) {
  let user = getByEmployeeId(loginKey)
  if (!user) user = getByEmail(loginKey)
  if (!user) return { error: "Mã đăng nhập hoặc mật khẩu không đúng", status: 401 }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return { error: "Mã đăng nhập hoặc mật khẩu không đúng", status: 401 }

  if (user.status !== "active") return { error: "Tài khoản đã bị vô hiệu hóa", status: 403 }

  const branchId = resolveBranchId(user.id)
  const token = signToken(tokenPayload(user, branchId))

  return { token, user: enrichUserProfile(user) }
}
