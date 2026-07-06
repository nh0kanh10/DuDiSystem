import { decodeUploadFilename } from "../utils/uploadFilename.util.js"

/** Chạy ngay sau multer — sửa originalname tiếng Việt */
export function fixUploadFilename(req, res, next) {
  if (req.file?.originalname) {
    req.file.originalname = decodeUploadFilename(req.file.originalname)
  }
  if (Array.isArray(req.files)) {
    for (const file of req.files) {
      if (file?.originalname) file.originalname = decodeUploadFilename(file.originalname)
    }
  } else if (req.files && typeof req.files === "object") {
    for (const list of Object.values(req.files)) {
      for (const file of list) {
        if (file?.originalname) file.originalname = decodeUploadFilename(file.originalname)
      }
    }
  }
  next()
}
