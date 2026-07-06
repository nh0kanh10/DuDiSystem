import { Router } from "express"
import multer from "multer"
import { authenticate } from "../middlewares/auth.js"
import { fixUploadFilename } from "../middlewares/fixUploadFilename.js"
import { requireAdminOrModule } from "../middlewares/authorize.js"
import * as ctrl from "../controllers/project.controller.js"
import * as vaultCtrl from "../controllers/projectVault.controller.js"

const r = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
})
r.use(authenticate)

r.get("/",          requireAdminOrModule("du-an"), ctrl.list)
r.get("/:id",       requireAdminOrModule("du-an"), ctrl.getOne)
r.post("/",         requireAdminOrModule("du-an"), ctrl.create)
r.put("/:id",       requireAdminOrModule("du-an"), ctrl.update)
r.delete("/:id",    requireAdminOrModule("du-an"), ctrl.remove)

r.post("/:id/attachments",                        requireAdminOrModule("du-an"), ctrl.addAttachment)
r.delete("/:id/attachments/:attachmentId",        requireAdminOrModule("du-an"), ctrl.removeAttachment)

r.post("/:id/teams",                              requireAdminOrModule("du-an"), ctrl.addTeam)
r.put("/:id/teams/:teamId",                       requireAdminOrModule("du-an"), ctrl.updateTeam)
r.delete("/:id/teams/:teamId",                    requireAdminOrModule("du-an"), ctrl.removeTeam)

r.get("/:projectId/vault",                              requireAdminOrModule("du-an"), vaultCtrl.list)
r.post("/:projectId/vault", upload.single("file"), fixUploadFilename,      requireAdminOrModule("du-an"), vaultCtrl.create)
r.put("/:projectId/vault/:itemId", upload.single("file"), fixUploadFilename, requireAdminOrModule("du-an"), vaultCtrl.update)
r.delete("/:projectId/vault/:itemId",                   requireAdminOrModule("du-an"), vaultCtrl.remove)
r.get("/:projectId/vault/:itemId/file",                 requireAdminOrModule("du-an"), vaultCtrl.downloadFile)

export default r
