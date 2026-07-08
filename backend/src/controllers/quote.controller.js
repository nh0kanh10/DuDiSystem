import * as svc from "../services/quote.service.js"
import { contentDispositionAttachment } from "../utils/contentDisposition.util.js"
import { fail } from "../utils/response.js"
import { quoteDownloadName } from "../utils/filename.util.js"
export function getSample(req, res) {
  try {
    const template = req.query.template || "toeic"
    const data = svc.getSampleQuote(template)
    res.json({ success: true, data })
  } catch (err) {
    fail(res, err.message)
  }
}

export function parseInput(req, res) {
  try {
    const text = req.body?.text ?? req.body?.json ?? ""
    const data = svc.parseQuoteInput(text)
    res.json({ success: true, data })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export async function generateDocx(req, res) {
  try {
    const buffer = await svc.generateQuoteDocx(req.body ?? {})
    const filename = quoteDownloadName(req.body?.project)
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    res.setHeader("Content-Disposition", contentDispositionAttachment(filename))
    res.send(buffer)
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}
