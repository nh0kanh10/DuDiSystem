import { Router } from "express"
import multer from "multer"
import { getFileStorage } from "../storage/index.js"
import { authenticate } from "../middlewares/auth.js"
import { decodeUploadFilename } from "../utils/uploadFilename.util.js"

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

function getMimeType(key) {
  const ext = String(key).split(".").pop()?.toLowerCase()
  const map = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }
  return map[ext] || "application/octet-stream"
}

router.post("/upload", authenticate, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "Không tìm thấy file tải lên" })
    }
    const originalName = decodeUploadFilename(req.file.originalname)
    const fileKey = `employees/${Date.now()}_${originalName}`
    const storage = getFileStorage()
    
    await storage.put(fileKey, req.file.buffer)

    const downloadUrl = `/api/storage/download?key=${encodeURIComponent(fileKey)}`
    
    res.json({
      success: true,
      data: {
        key: fileKey,
        url: downloadUrl,
        name: originalName
      }
    })
  } catch (err) {
    next(err)
  }
})

router.get("/download", async (req, res, next) => {
  try {
    const key = req.query.key
    if (!key) {
      return res.status(400).send("Thiếu tham số key")
    }
    const storage = getFileStorage()
    const buffer = await storage.get(key)
    if (!buffer) {
      return res.status(404).send("Không tìm thấy file")
    }
    
    res.setHeader("Content-Type", getMimeType(key))
    res.send(buffer)
  } catch (err) {
    next(err)
  }
})

export default router
