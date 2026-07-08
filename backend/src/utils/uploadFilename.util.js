const VIETNAMESE = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i
const MOJIBAKE = /Ã[\u0080-\u00BF]|á»|Ä['']|Æ°|áº|Â[\u0080-\u00BF]/i

/**
 * Sửa tên file tiếng Việt từ multipart upload.
 * Trình duyệt gửi UTF-8 nhưng busboy thường decode thành latin1 → mojibake.
 */
export function decodeUploadFilename(name = "") {
  if (!name) return ""
  const trimmed = String(name).trim()
  const fixed = Buffer.from(trimmed, "latin1").toString("utf8")
  if (fixed === trimmed || fixed.includes("\uFFFD")) return trimmed
  if (MOJIBAKE.test(trimmed) && VIETNAMESE.test(fixed)) return fixed
  if (VIETNAMESE.test(fixed) && !VIETNAMESE.test(trimmed)) return fixed
  return trimmed
}

export function sanitizeBasename(name = "") {
  const base = String(name).split(/[/\\]/).pop() || ""
  return decodeUploadFilename(base)
}
