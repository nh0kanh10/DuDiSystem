import { Router } from "express"
import * as ctrl from "../controllers/timeOffSlot.controller.js"
import { authenticate } from "../middlewares/auth.js"
import { requireAdminOrModule } from "../middlewares/authorize.js"

const router = Router()

router.use(authenticate)

router.get("/", ctrl.list)
router.post("/", ctrl.create)
router.patch("/:id/approve", requireAdminOrModule("duyet-don"), ctrl.approve)
router.patch("/:id/reject", requireAdminOrModule("duyet-don"), ctrl.reject)
router.post("/approve-all", requireAdminOrModule("duyet-don"), ctrl.approveAll)

export default router
