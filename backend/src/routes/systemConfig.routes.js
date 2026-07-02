import { Router } from "express"
import { getConfig, updateConfig } from "../controllers/systemConfig.controller.js"
import { authenticate } from "../middlewares/auth.js"
import { requireAdminOrModule } from "../middlewares/authorize.js"

const router = Router()

router.get("/", authenticate, getConfig)
router.put("/", authenticate, requireAdminOrModule("tien-ich"), updateConfig)

export default router
