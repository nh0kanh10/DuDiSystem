
export function vaultMetaToLegacy(item = {}) {
  const m = item.meta ?? {}
  const urlKeys = [
    "panelUrl", "loginUrl", "docUrl", "quoteUrl", "reqUrl", "contractUrl",
    "handoverUrl", "checklistUrl", "storageUrl", "link", "fileUrl",
  ]
  const secretKeys = ["password", "licenseKey"]
  const url = item.url || urlKeys.map((k) => m[k]).find(Boolean) || ""
  const value = item.value
    || secretKeys.map((k) => m[k]).find(Boolean)
    || m.info
    || m.quoteNo
    || m.contractNo
    || ""
  return { url: url || undefined, value: value || undefined }
}
