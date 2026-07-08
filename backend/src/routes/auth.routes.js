import { Router } from "express"
import { loginHandler, getMeHandler, refreshHandler, changePasswordHandler } from "../controllers/auth.controller.js"
import { authenticate } from "../middlewares/auth.js"
import { fail } from "../utils/response.js"

const router = Router()

router.post("/login", (req, res, next) => {
  const key = req.body.loginKey ?? req.body.email
  if (!key || !req.body.password) return fail(res, "Thiếu mã đăng nhập hoặc mật khẩu")
  next()
}, loginHandler)

router.get("/me", authenticate, getMeHandler)
router.post("/refresh", authenticate, refreshHandler)
router.post("/change-password", authenticate, changePasswordHandler)

export default router
