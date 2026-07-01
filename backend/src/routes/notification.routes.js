import { Router } from "express"
import * as ctrl from "../controllers/notification.controller.js"
import { authenticate } from "../middlewares/auth.js"
import { requireFields } from "../middlewares/validate.js"

const router = Router()

router.use(authenticate)

router.get("/", ctrl.list)
router.post("/", requireFields("type", "message"), ctrl.create)
router.patch("/read-all", ctrl.markAllRead)
router.patch("/:id/read", ctrl.markRead)
router.delete("/:id", ctrl.remove)

export default router
