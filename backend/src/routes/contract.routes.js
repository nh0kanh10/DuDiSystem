import { Router } from "express"
import { authenticate } from "../middlewares/auth.js"
import * as ctrl from "../controllers/contract.controller.js"

const router = Router()

router.use(authenticate)
router.post("/generate", ctrl.generateDocx)

export default router
