/** Bỏ dấu tiếng Việt để tên file tải về đọc được trên Windows */
export function deaccentVietnamese(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
}

export function slugifyFilename(text = "", maxLen = 55) {
  const slug = deaccentVietnamese(text)
    .trim()
    .replace(/[^\w\s.\-]+/g, " ")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
  return slug || "tai-lieu"
}

export function quoteDownloadName(project) {
  return `Bao-gia-${slugifyFilename(project, 50)}.docx`
}

export function contractDownloadName(projectName) {
  return `Hop-dong-${slugifyFilename(projectName, 50)}.docx`
}

export function labelDownloadName(label) {
  const slug = slugifyFilename(label, 60)
  return slug.endsWith(".docx") ? slug : `${slug}.docx`
}

export function resolveDocumentDownloadName(doc = {}) {
  if (doc.payload?.uploadedFile && doc.downloadName) {
    return doc.downloadName
  }
  if (doc.type === "quote" && doc.payload?.project) {
    return quoteDownloadName(doc.payload.project)
  }
  if (doc.type === "contract" && doc.payload && !doc.parentDocumentId && !doc.payload?.isAppendix) {
    return contractDownloadName(doc.payload.projectName || doc.payload.project)
  }
  if (doc.downloadName && !looksLikeBrokenSlug(doc.downloadName)) {
    return doc.downloadName
  }
  if (doc.label) return labelDownloadName(doc.label)
  return `${doc.id || "tai-lieu"}.docx`
}

/** Tên kiểu Website-b-n-v-h-i (vowels bị tách) từ regex cũ */
function looksLikeBrokenSlug(name = "") {
  return /-[bcdfghjklmnpqrstvwxyz]-[bcdfghjklmnpqrstvwxyz]-/i.test(name)
    || /-b-n-|-v-h-|-c-n-/i.test(name)
}
