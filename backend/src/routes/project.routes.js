import { Router } from "express"
import { authenticate } from "../middlewares/auth.js"
import * as ctrl from "../controllers/project.controller.js"

const r = Router()

r.use(authenticate)

r.get("/",          ctrl.list)
r.get("/:id",       ctrl.getOne)
r.post("/",         ctrl.create)
r.put("/:id",       ctrl.update)
r.delete("/:id",    ctrl.remove)

r.post("/:id/attachments",                        ctrl.addAttachment)
r.delete("/:id/attachments/:attachmentId",        ctrl.removeAttachment)

r.post("/:id/teams",                              ctrl.addTeam)
r.put("/:id/teams/:teamId",                       ctrl.updateTeam)
r.delete("/:id/teams/:teamId",                    ctrl.removeTeam)

export default r
