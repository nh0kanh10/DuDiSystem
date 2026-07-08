export function leadDocumentKey(leadId, type, docId, originalFilename = "document.docx") {
  const name = String(originalFilename).split(/[/\\]/).pop() || "document.docx"
  const extMatch = name.match(/\.([^.]+)$/)
  const ext = extMatch ? extMatch[1].toLowerCase() : "docx"
  return `leads/${String(leadId)}/documents/${String(type)}/${String(docId)}/file.${ext}`
}

export function projectVaultFileKey(projectId, itemId, fileName = "file") {
  const name = String(fileName).split(/[/\\]/).pop() || "file"
  const extMatch = name.match(/\.([^.]+)$/)
  const ext = extMatch ? extMatch[1].toLowerCase() : "bin"
  return `projects/${String(projectId)}/vault/${String(itemId)}/file.${ext}`
}

export function templateOverrideKey(type) {
  return `templates/overrides/${String(type)}.docx`
}

export function templateMetaKey() {
  return "templates/overrides/meta.json"
}
