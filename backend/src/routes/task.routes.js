import { Router } from "express"
import * as ctrl from "../controllers/task.controller.js"
import { authenticate } from "../middlewares/auth.js"
import { requireFields } from "../middlewares/validate.js"

const router = Router()

router.use(authenticate)

router.get("/", ctrl.list)
router.get("/:id", ctrl.getOne)
router.post("/", requireFields("title"), ctrl.create)
router.put("/:id", ctrl.update)
router.delete("/:id", ctrl.remove)

export default router
