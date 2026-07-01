import { Router } from "express"
import * as ctrl from "../controllers/allowedIP.controller.js"
import { authenticate } from "../middlewares/auth.js"
import { requireFields } from "../middlewares/validate.js"

const router = Router()

router.use(authenticate)

router.get("/", ctrl.list)
router.get("/:id", ctrl.getOne)
router.post("/", requireFields("ip"), ctrl.create)
router.put("/:id", ctrl.update)
router.post("/:id/toggle", ctrl.toggle)
router.delete("/:id", ctrl.remove)

export default router
