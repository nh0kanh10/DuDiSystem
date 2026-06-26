import { Router } from "express"
import { loginHandler } from "../controllers/auth.controller.js"
import { requireFields } from "../middlewares/validate.js"

const router = Router()

router.post("/login", requireFields("email", "password"), loginHandler)

export default router
