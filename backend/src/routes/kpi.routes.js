import express from "express"
import * as kpiController from "../controllers/kpi.controller.js"
import { authenticate } from "../middlewares/auth.js"
import { requireAdmin } from "../middlewares/authorize.js"

const router = express.Router()

router.use(authenticate)

router.get("/targets", kpiController.getTargets)
router.post("/targets", requireAdmin, kpiController.saveTarget)
router.delete("/targets/:id", requireAdmin, kpiController.deleteTarget)

router.get("/entries", kpiController.getEntries)
router.post("/entries", kpiController.saveEntry) 

export default router
