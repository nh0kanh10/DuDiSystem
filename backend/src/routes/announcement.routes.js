import { Router } from "express"
import { authenticate } from "../middlewares/auth.js"
import { requireAdminOrModule } from "../middlewares/authorize.js"
import * as ctrl from "../controllers/announcement.controller.js"

const r = Router()
r.use(authenticate)
r.get("/",        ctrl.list)
r.get("/stats",   requireAdminOrModule("thong-bao"), ctrl.stats)
r.get("/:id",     ctrl.getOne)
r.post("/",       requireAdminOrModule("thong-bao"), ctrl.create)
r.put("/:id",     requireAdminOrModule("thong-bao"), ctrl.update)
r.delete("/:id",  requireAdminOrModule("thong-bao"), ctrl.remove)
export default r
