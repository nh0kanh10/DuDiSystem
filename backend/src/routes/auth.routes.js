import { Router } from "express"
import { loginHandler } from "../controllers/auth.controller.js"
import { fail } from "../utils/response.js"

const router = Router()

router.post("/login", (req, res, next) => {
  const key = req.body.loginKey ?? req.body.email
  if (!key || !req.body.password) return fail(res, "Thiếu mã đăng nhập hoặc mật khẩu")
  next()
}, loginHandler)

export default router
