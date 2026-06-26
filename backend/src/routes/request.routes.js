import { Router } from "express"
import * as ctrl from "../controllers/request.controller.js"
import { authenticate } from "../middlewares/auth.js"
import { requireFields } from "../middlewares/validate.js"

const router = Router()

router.use(authenticate)

router.get("/", ctrl.list)
router.get("/:id", ctrl.getOne)
router.post("/", requireFields("employeeId", "leaveType", "startDate"), ctrl.create)
router.patch("/:id/approve", ctrl.approve)
router.patch("/:id/reject", ctrl.reject)
router.delete("/:id", ctrl.remove)

export default router
