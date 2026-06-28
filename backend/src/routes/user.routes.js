import { Router } from "express"
import { getUsers, createUser, updateUser, toggleUserStatus, resetUserPassword, deleteUser } from "../controllers/user.controller.js"

const router = Router()

router.get("/", getUsers)
router.post("/", createUser)
router.patch("/:id", updateUser)
router.post("/:id/toggle-status", toggleUserStatus)
router.post("/:id/reset-password", resetUserPassword)
router.delete("/:id", deleteUser)

export default router
