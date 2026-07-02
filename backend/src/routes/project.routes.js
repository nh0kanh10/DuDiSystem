import { Router } from "express"
import { authenticate } from "../middlewares/auth.js"
import { requireAdminOrModule } from "../middlewares/authorize.js"
import * as ctrl from "../controllers/project.controller.js"

const r = Router()

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

export default r
