import express from "express"
import * as ProfileUpdateRequestController from "../controllers/profileUpdateRequest.controller.js"

const router = express.Router()

router.get("/", ProfileUpdateRequestController.getRequests)
router.post("/request", ProfileUpdateRequestController.createRequest)
router.put("/:id/submit", ProfileUpdateRequestController.submitDraft)
router.put("/:id/approve", ProfileUpdateRequestController.approveRequest)
router.put("/:id/reject", ProfileUpdateRequestController.rejectRequest)

export default router
