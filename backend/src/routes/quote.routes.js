import { Router } from "express"
import { authenticate } from "../middlewares/auth.js"
import * as ctrl from "../controllers/quote.controller.js"

const router = Router()

router.use(authenticate)

router.get("/sample", ctrl.getSample)
router.post("/parse", ctrl.parseInput)
router.post("/generate", ctrl.generateDocx)

export default router
