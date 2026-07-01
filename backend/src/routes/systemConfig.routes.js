import { Router } from "express"
import { getConfig, updateConfig } from "../controllers/systemConfig.controller.js"

const router = Router()

router.get("/", getConfig)
router.put("/", updateConfig)

export default router
