import type { ProjectVaultItem } from "../types"

export function vaultFileName(item: ProjectVaultItem): string {
  return item.fileAttachment?.name || item.name || "file"
}

function fileExt(name: string): string {
  const m = String(name).toLowerCase().match(/\.([^.]+)$/)
  return m ? m[1] : ""
}

export function isInlinePreviewableName(name: string): boolean {
  const ext = fileExt(name)
  if (!ext) return true
  return ["docx", "doc", "pdf", "png", "jpg", "jpeg", "gif", "webp"].includes(ext)
}

export function vaultHasStoredFile(item: ProjectVaultItem): boolean {
  return Boolean(
    item.fileAttachment?.dataUrl
    || item.hasFile
    || item.fileAttachment?.hasFile,
  )
}

export function vaultIsLeadDocument(item: ProjectVaultItem): boolean {
  return item.id.startsWith("doc-")
}

export function vaultHasOpenableUrl(item: ProjectVaultItem): boolean {
  return Boolean(item.url?.trim())
}

/** Có thể xem trước trong modal (file hoặc tài liệu lead) */
export function canPreviewVaultItem(item: ProjectVaultItem): boolean {
  if (vaultHasStoredFile(item)) {
    return isInlinePreviewableName(vaultFileName(item))
  }
  if (vaultIsLeadDocument(item)) return true
  return false
}

/** Chỉ có link (phiếu yêu cầu, Drive…) — mở tab mới */
export function canOpenVaultUrl(item: ProjectVaultItem): boolean {
  return vaultHasOpenableUrl(item) && !vaultHasStoredFile(item) && !vaultIsLeadDocument(item)
}

/** Có file/link để tải về */
export function canDownloadVaultItem(item: ProjectVaultItem): boolean {
  return vaultHasStoredFile(item) || vaultIsLeadDocument(item)
}
