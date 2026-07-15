import express from "express"
import * as kpiController from "../controllers/kpi.controller.js"
import { protect, authorize } from "../middlewares/auth.js"

const router = express.Router()

router.use(protect)

router.get("/targets", kpiController.getTargets)
router.post("/targets", authorize("admin", "manager"), kpiController.saveTarget)
router.delete("/targets/:id", authorize("admin", "manager"), kpiController.deleteTarget)

router.get("/entries", kpiController.getEntries)
router.post("/entries", kpiController.saveEntry) 

export default router
