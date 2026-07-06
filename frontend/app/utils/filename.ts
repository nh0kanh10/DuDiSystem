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

export function quoteDownloadName(project?: string) {
  return `Bao-gia-${slugifyFilename(project || "bao-gia", 50)}.docx`
}

export function contractDownloadName(projectName?: string) {
  return `Hop-dong-${slugifyFilename(projectName || "hop-dong", 50)}.docx`
}

export function labelDownloadName(label?: string) {
  const slug = slugifyFilename(label || "tai-lieu", 60)
  return slug.endsWith(".docx") ? slug : `${slug}.docx`
}
