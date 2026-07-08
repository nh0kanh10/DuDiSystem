import { Router } from "express"
import * as ctrl from "../controllers/orgNode.controller.js"
import { authenticate } from "../middlewares/auth.js"
import { requireAdminOrModule } from "../middlewares/authorize.js"
import { requireFields } from "../middlewares/validate.js"

const router = Router()

router.use(authenticate)

router.get("/", ctrl.list)
router.get("/:id", ctrl.getOne)
router.get("/:id/members", ctrl.members)
router.post("/", requireAdminOrModule("co-cau"), requireFields("name", "code", "type"), ctrl.create)
router.put("/:id", requireAdminOrModule("co-cau"), ctrl.update)
router.patch("/:id/status", requireAdminOrModule("co-cau"), requireFields("status"), ctrl.changeStatus)
router.delete("/:id", requireAdminOrModule("co-cau"), ctrl.remove)

export default router
