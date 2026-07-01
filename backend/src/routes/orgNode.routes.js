import { Router } from "express"
import * as ctrl from "../controllers/orgNode.controller.js"
import { authenticate } from "../middlewares/auth.js"
import { requireFields } from "../middlewares/validate.js"

const router = Router()

router.use(authenticate)

router.get("/", ctrl.list)
router.get("/:id", ctrl.getOne)
router.get("/:id/members", ctrl.members)
router.post("/", requireFields("name", "code", "type"), ctrl.create)
router.put("/:id", ctrl.update)
router.patch("/:id/status", requireFields("status"), ctrl.changeStatus)
router.delete("/:id", ctrl.remove)

export default router
