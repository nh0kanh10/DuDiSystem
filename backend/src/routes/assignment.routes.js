import { Router } from "express"
import * as ctrl from "../controllers/assignment.controller.js"
import { authenticate } from "../middlewares/auth.js"
import { requireAdminOrModule } from "../middlewares/authorize.js"
import { requireFields } from "../middlewares/validate.js"

const router = Router()

router.use(authenticate)
router.use(requireAdminOrModule("co-cau", "nhan-su"))

router.get("/", ctrl.list)
router.post("/", requireFields("employeeId", "nodeId", "type", "startDate"), ctrl.create)
router.patch("/:id/cancel", ctrl.cancel)

export default router
