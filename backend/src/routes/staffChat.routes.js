import { Router } from "express"
import * as ctrl from "../controllers/staffChat.controller.js"
import { authenticate } from "../middlewares/auth.js"
import { requireAdminOrModule } from "../middlewares/authorize.js"
import { requireFields } from "../middlewares/validate.js"

const router = Router()

router.use(authenticate)
router.use(requireAdminOrModule("user-chat"))

router.get("/conversations", ctrl.listConversations)
router.post("/conversations", requireFields("peerId"), ctrl.openConversation)

router.get("/thread/:peerId/messages", ctrl.getThread)
router.post("/thread/:peerId/messages", ctrl.sendMessage)
router.patch("/thread/:peerId/read", ctrl.markRead)

router.get("/roster", ctrl.roster)
router.get("/unread-count", ctrl.unreadCount)

router.post("/presence", ctrl.presenceHeartbeat)
router.get("/online", ctrl.online)

export default router
