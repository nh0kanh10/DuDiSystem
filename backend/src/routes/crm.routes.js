import { Router } from "express"
import multer from "multer"
import { authenticate } from "../middlewares/auth.js"
import { requireCrmAdmin, requireEmployeeCrm } from "../middlewares/authorize.js"
import * as ctrl from "../controllers/crm.controller.js"

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.use(authenticate)

router.get("/data",              requireCrmAdmin, ctrl.listData)
router.post("/data",             requireCrmAdmin, ctrl.createData)
router.put("/data/:id",          requireCrmAdmin, ctrl.updateData)
router.delete("/data/:id",       requireCrmAdmin, ctrl.deleteData)
router.post("/data/delete-bulk", requireCrmAdmin, ctrl.deleteBulkData)
router.post("/data/import-csv",  requireCrmAdmin, upload.single("file"), ctrl.importCsv)
router.post("/data/auto-assign", requireCrmAdmin, ctrl.autoAssign)
router.post("/data/:id/convert-to-lead", requireEmployeeCrm, ctrl.convertToLead)
router.get("/data/:id/leads", requireEmployeeCrm, ctrl.listCrmLeads)

router.post("/assignments/assign",      requireCrmAdmin, ctrl.assignOne)
router.post("/assignments/assign-bulk", requireCrmAdmin, ctrl.assignBulk)
router.patch("/assignments/reassign",   requireCrmAdmin, ctrl.reassign)

router.get("/dashboard/admin", requireCrmAdmin, ctrl.adminDashboard)

router.patch("/data/:id/note", requireEmployeeCrm, ctrl.updateNote)

router.get("/employee/data",              requireEmployeeCrm, ctrl.listMyData)
router.patch("/employee/data/:id/status", requireEmployeeCrm, ctrl.updateMyStatus)
router.post("/employee/data/:id/convert-to-lead", requireEmployeeCrm, ctrl.convertToLead)
router.get("/dashboard/employee",         requireEmployeeCrm, ctrl.employeeDashboard)

export default router
