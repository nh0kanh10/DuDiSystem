import { Router } from "express"
import { stats } from "../controllers/dashboard.controller.js"
import { authenticate } from "../middlewares/auth.js"
import { requireAdminOrModule } from "../middlewares/authorize.js"

const router = Router()

router.use(authenticate)
router.get("/stats", requireAdminOrModule("dashboard"), stats)

export default router
