import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getByEmail, getByEmployeeId } from "../repositories/user.repository.js"
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/index.js"
import { resolveBranchId } from "./user.service.js"

export async function login(loginKey, password) {
  let user = getByEmployeeId(loginKey)
  if (!user) user = getByEmail(loginKey)
  if (!user) return { error: "Mã đăng nhập hoặc mật khẩu không đúng", status: 401 }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return { error: "Mã đăng nhập hoặc mật khẩu không đúng", status: 401 }

  if (user.status !== "active") return { error: "Tài khoản đã bị vô hiệu hóa", status: 403 }

  const branchId = resolveBranchId(user.id)

  const token = jwt.sign(
    { id: user.id, employeeId: user.employeeId, roleId: user.roleId, branchId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )

  const { password: _, ...safeUser } = user
  return { token, user: { ...safeUser, branchId } }
}
