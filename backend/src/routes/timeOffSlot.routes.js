import { Router } from "express"
import * as ctrl from "../controllers/timeOffSlot.controller.js"
import { authenticate } from "../middlewares/auth.js"

const router = Router()

router.use(authenticate)

router.get("/", ctrl.list)
router.post("/", ctrl.create)
router.patch("/:id/approve", ctrl.approve)
router.patch("/:id/reject", ctrl.reject)
router.post("/approve-all", ctrl.approveAll)

export default router
