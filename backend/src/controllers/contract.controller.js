import * as docSvc from "../services/leadDocument.service.js"
import { contentDispositionAttachment } from "../utils/contentDisposition.util.js"
import { contractDownloadName } from "../utils/filename.util.js"
export async function generateDocx(req, res) {
  try {
    const buffer = await docSvc.generateContractDocxBuffer(req.body ?? {})
    const filename = contractDownloadName(req.body?.projectName || req.body?.project)
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    res.setHeader("Content-Disposition", contentDispositionAttachment(filename))
    res.send(buffer)
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}
