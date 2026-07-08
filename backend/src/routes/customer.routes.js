import { Router } from "express"
import { authenticate } from "../middlewares/auth.js"
import * as ctrl from "../controllers/customer.controller.js"

const router = Router()

router.use(authenticate)

router.get("/", ctrl.list)
router.get("/:id", ctrl.getOne)

export default router
