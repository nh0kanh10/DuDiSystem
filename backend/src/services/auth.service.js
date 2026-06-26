import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getByEmail } from "../repositories/user.repository.js"
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/index.js"

export async function login(email, password) {
  const user = getByEmail(email)
  if (!user) return { error: "Email hoặc mật khẩu không đúng", status: 401 }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return { error: "Email hoặc mật khẩu không đúng", status: 401 }

  if (user.status !== "active") return { error: "Tài khoản đã bị vô hiệu hóa", status: 403 }

  const token = jwt.sign(
    { id: user.id, employeeId: user.employeeId, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )

  const { password: _, ...safeUser } = user
  return { token, user: safeUser }
}
