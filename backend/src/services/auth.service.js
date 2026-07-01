import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getByEmail, getByEmployeeId } from "../repositories/user.repository.js"
import { JWT_SECRET } from "../config/index.js"
import { resolveBranchId, enrichUserProfile } from "./user.service.js"
import { getSystemConfig } from "./systemConfig.service.js"

export async function login(loginKey, password) {
  let user = getByEmployeeId(loginKey)
  if (!user) user = getByEmail(loginKey)
  if (!user) return { error: "Mã đăng nhập hoặc mật khẩu không đúng", status: 401 }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return { error: "Mã đăng nhập hoặc mật khẩu không đúng", status: 401 }

  if (user.status !== "active") return { error: "Tài khoản đã bị vô hiệu hóa", status: 403 }

  const branchId = resolveBranchId(user.id)

  const config = getSystemConfig()
  const timeoutMinutes = config.sessionTimeoutMinutes || 30

  const token = jwt.sign(
    { id: user.id, employeeId: user.employeeId, roleId: user.roleId, branchId, permissions: user.permissions || null },
    JWT_SECRET,
    { expiresIn: `${timeoutMinutes}m` }
  )

  return { token, user: enrichUserProfile(user) }
}
