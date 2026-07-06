import { Router } from "express"
import * as svc from "../services/leadForm.service.js"

const router = Router()

router.get("/:leadId", (req, res) => {
  try {
    const formType = req.query.type || undefined
    const token = req.query.token || ""
    const data = svc.getPublicFormContext(req.params.leadId, formType, token)
    const lead = svc.markFormOpened(req.params.leadId, token)
    if (lead?.formStatus) {
      data.lead.formStatus = lead.formStatus
    }
    res.json({ success: true, data })
  } catch (err) {
    res.status(404).json({ success: false, error: err.message })
  }
})

router.post("/:leadId/submit", (req, res) => {
  try {
    const token = req.query.token || req.body?.token || ""
    const lead = svc.submitPublicForm(req.params.leadId, token, req.body ?? {})
    res.json({ success: true, data: { id: lead.id, formStatus: lead.formStatus } })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})

export default router
