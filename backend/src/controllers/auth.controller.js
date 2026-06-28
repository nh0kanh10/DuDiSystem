import { login } from "../services/auth.service.js"
import { ok, fail } from "../utils/response.js"

export async function loginHandler(req, res) {
  const { loginKey, email, password } = req.body
  const result = await login(loginKey ?? email, password)
  if (result.error) return fail(res, result.error, result.status)
  ok(res, result)
}
