import { Router } from "express"
import { stats } from "../controllers/dashboard.controller.js"
import { authenticate } from "../middlewares/auth.js"

const router = Router()

router.use(authenticate)

router.get("/stats", stats)

export default router
