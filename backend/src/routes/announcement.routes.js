import { Router } from "express"
import { authenticate } from "../middlewares/auth.js"
import * as ctrl from "../controllers/announcement.controller.js"

const r = Router()
r.use(authenticate)
r.get("/",        ctrl.list)
r.get("/stats",   ctrl.stats)
r.get("/:id",     ctrl.getOne)
r.post("/",       ctrl.create)
r.put("/:id",     ctrl.update)
r.delete("/:id",  ctrl.remove)
export default r
