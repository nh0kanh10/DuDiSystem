import { Router } from "express"
import * as ctrl from "../controllers/role.controller.js"
import { authenticate } from "../middlewares/auth.js"
import { requireAdminOrModule } from "../middlewares/authorize.js"

const router = Router()

router.use(authenticate)

router.get("/", ctrl.list)
router.get("/:id", ctrl.getOne)
router.post("/", requireAdminOrModule("phan-quyen"), ctrl.create)
router.put("/:id", requireAdminOrModule("phan-quyen"), ctrl.update)
router.delete("/:id", requireAdminOrModule("phan-quyen"), ctrl.remove)

export default router
