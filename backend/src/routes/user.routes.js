import { Router } from "express"
import { getUsers, createUser, updateUser, toggleUserStatus, resetUserPassword, deleteUser, updateAdmin } from "../controllers/user.controller.js"
import { authenticate } from "../middlewares/auth.js"
import { requireAdminOrModule, requireAdmin } from "../middlewares/authorize.js"

const router = Router()

router.use(authenticate)
router.use(requireAdminOrModule("tai-khoan"))

router.get("/", getUsers)
router.post("/", createUser)
router.patch("/:id", updateUser)
router.patch("/admin/:id", requireAdmin, updateAdmin)
router.post("/:id/toggle-status", toggleUserStatus)
router.post("/:id/reset-password", resetUserPassword)
router.delete("/:id", deleteUser)

export default router
