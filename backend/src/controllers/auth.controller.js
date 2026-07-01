import { login } from "../services/auth.service.js"
import { getUserDetails } from "../services/user.service.js"
import { ok, fail } from "../utils/response.js"

export async function loginHandler(req, res) {
  const { loginKey, email, password } = req.body
  const result = await login(loginKey ?? email, password)
  if (result.error) return fail(res, result.error, result.status)
  ok(res, result)
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
