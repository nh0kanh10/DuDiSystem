/** scopeItems báo giá → hợp đồng (cùng cấu trúc) */

export function formatScopeLine(row = {}) {
  const item = String(row.item ?? "").trim()
  const scope = String(row.scope ?? "").trim()
  if (item && scope) return `${item}: ${scope}`
  return item || scope
}

export function normalizeScopeItems(items = []) {
  return (items ?? []).map((row) => ({
    group: row.group ?? "",
    item: row.item ?? "",
    scope: row.scope ?? "",
    line: formatScopeLine(row),
  }))
}
