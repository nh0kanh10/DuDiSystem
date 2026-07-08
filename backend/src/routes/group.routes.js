import { Router } from "express"
import { authenticate } from "../middlewares/auth.js"
import { requireAdminOrModule } from "../middlewares/authorize.js"
import * as ctrl from "../controllers/group.controller.js"

const r = Router()
r.use(authenticate)
r.get("/",     requireAdminOrModule("co-cau"), ctrl.list)
r.get("/:id",  requireAdminOrModule("co-cau"), ctrl.getOne)
r.post("/",    requireAdminOrModule("co-cau"), ctrl.create)
r.put("/:id",  requireAdminOrModule("co-cau"), ctrl.update)
r.delete("/:id", requireAdminOrModule("co-cau"), ctrl.remove)
export default r
