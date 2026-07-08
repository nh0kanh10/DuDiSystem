import { Router } from "express"
import multer from "multer"
import { authenticate } from "../middlewares/auth.js"
import { fixUploadFilename } from "../middlewares/fixUploadFilename.js"
import * as ctrl from "../controllers/template.controller.js"

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
})

router.use(authenticate)

router.get("/", ctrl.list)
router.get("/:type", ctrl.getInfo)
router.get("/:type/file", ctrl.download)
router.post("/:type", upload.single("file"), fixUploadFilename, ctrl.upload)
router.delete("/:type", ctrl.reset)

export default router
