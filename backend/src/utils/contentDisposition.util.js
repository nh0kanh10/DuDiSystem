import { deaccentVietnamese } from "./filename.util.js"

export function mimeFromFilename(filename = "") {
  const ext = (String(filename).match(/\.([^.]+)$/) || [])[1]?.toLowerCase()
  const map = {
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain; charset=utf-8",
  }
  return map[ext] || "application/octet-stream"
}

/** RFC 5987 — hỗ trợ tên file tiếng Việt khi tải xuống */
export function contentDispositionAttachment(filename = "download") {
  const safe = String(filename).replace(/[\r\n"]/g, "_")
  const asciiFallback = deaccentVietnamese(safe)
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/_+/g, "_")
    || "download"
  const encoded = encodeURIComponent(safe)
    .replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`
}
