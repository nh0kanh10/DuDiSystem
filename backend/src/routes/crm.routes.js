import { Router } from "express"
import multer from "multer"
import { authenticate } from "../middlewares/auth.js"
import * as ctrl from "../controllers/crm.controller.js"

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.use(authenticate)

function requireAdmin(req, res, next) {
  const role = req.user?.roleId
  if (role === "role-admin" || role === "role-super-admin") return next()
  res.status(403).json({ success: false, error: "Bạn không có quyền thực hiện thao tác này" })
}

router.get("/data",              requireAdmin, ctrl.listData)
router.post("/data",             requireAdmin, ctrl.createData)
router.put("/data/:id",          requireAdmin, ctrl.updateData)
router.delete("/data/:id",       requireAdmin, ctrl.deleteData)
router.post("/data/delete-bulk", requireAdmin, ctrl.deleteBulkData)
router.post("/data/import-csv",  requireAdmin, upload.single("file"), ctrl.importCsv)
router.post("/data/auto-assign", requireAdmin, ctrl.autoAssign)

router.post("/assignments/assign",      requireAdmin, ctrl.assignOne)
router.post("/assignments/assign-bulk", requireAdmin, ctrl.assignBulk)
router.patch("/assignments/reassign",   requireAdmin, ctrl.reassign)

router.get("/dashboard/admin", requireAdmin, ctrl.adminDashboard)

router.patch("/data/:id/note", ctrl.updateNote)

router.get("/employee/data",              ctrl.listMyData)
router.patch("/employee/data/:id/status", ctrl.updateMyStatus)
router.get("/dashboard/employee",         ctrl.employeeDashboard)

export default router
