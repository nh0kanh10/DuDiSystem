import { Router } from "express"
import multer from "multer"
import { authenticate } from "../middlewares/auth.js"
import { fixUploadFilename } from "../middlewares/fixUploadFilename.js"
import * as ctrl from "../controllers/lead.controller.js"

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
})

router.use(authenticate)

router.get("/", ctrl.list)
router.post("/", ctrl.create)

router.get("/:leadId/documents/latest", ctrl.getLatestDocument)
router.get("/:leadId/documents/:docId/file", ctrl.downloadDocument)
router.get("/:leadId/documents/:docId", ctrl.getDocument)
router.put("/:leadId/documents/:docId", ctrl.updateDocument)
router.delete("/:leadId/documents/:docId", ctrl.removeDocument)
router.get("/:leadId/documents", ctrl.listDocuments)
router.post("/:leadId/documents", ctrl.createDocument)
router.post("/:leadId/documents/upload", upload.single("file"), fixUploadFilename, ctrl.uploadDocument)
router.post("/:leadId/contracts/from-quote", ctrl.createContractFromQuote)
router.post("/:leadId/contracts/:docId/appendix", upload.single("file"), fixUploadFilename, ctrl.createContractAppendix)

router.post("/:leadId/notes", ctrl.addNote)
router.put("/:leadId/notes/:noteId", ctrl.updateNote)
router.delete("/:leadId/notes/:noteId", ctrl.removeNote)
router.post("/:leadId/form-link/issue", ctrl.issueFormLink)
router.post("/:leadId/form-link/revoke", ctrl.revokeFormLink)
router.post("/:leadId/requirement-forms/new", ctrl.addRequirementRound)
router.post("/:leadId/convert-to-project", ctrl.convertToProject)
router.get("/:leadId", ctrl.getOne)
router.put("/:leadId", ctrl.update)
router.delete("/:leadId", ctrl.remove)

export default router
