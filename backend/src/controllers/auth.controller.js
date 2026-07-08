import { login, refreshSession } from "../services/auth.service.js"
import { getUserDetails, changePassword as changePasswordService } from "../services/user.service.js"
import { ok, fail } from "../utils/response.js"

export async function loginHandler(req, res) {
  const { loginKey, email, password } = req.body
  const result = await login(loginKey ?? email, password)
  if (result.error) return fail(res, result.error, result.status)
  ok(res, result)
}

export function refreshHandler(req, res) {
  const result = refreshSession(req.user)
  if (result.error) return fail(res, result.error, result.status)
  ok(res, { token: result.token })
}

export async function getMeHandler(req, res) {
  try {
    const user = getUserDetails(req.user.id)
    if (!user) return fail(res, "Không tìm thấy tài khoản", 404)
    ok(res, user)
  } catch (err) {
    fail(res, err.message)
  }
}

export async function changePasswordHandler(req, res) {
  try {
    const { oldPassword, newPassword } = req.body
    await changePasswordService(req.user.id, oldPassword, newPassword)
    ok(res, { message: "Đổi mật khẩu thành công" })
  } catch (err) {
    fail(res, err.message)
  }
}
