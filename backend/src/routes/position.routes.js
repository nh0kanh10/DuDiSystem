import { Router } from "express"
import * as ctrl from "../controllers/position.controller.js"
import { authenticate } from "../middlewares/auth.js"
import { requireAdminOrModule } from "../middlewares/authorize.js"

const router = Router()

router.use(authenticate)
router.use(requireAdminOrModule("nhan-su", "co-cau"))

router.get("/", ctrl.list)
router.get("/:id", ctrl.getOne)
router.post("/", ctrl.create)
router.put("/:id", ctrl.update)
router.delete("/:id", ctrl.remove)

export default router
