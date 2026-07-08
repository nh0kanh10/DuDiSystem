import { createNotification } from "../services/notification.service.js"

function getNowFormatted() {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, "0")
  const mm = String(now.getMinutes()).padStart(2, "0")
  const dd = String(now.getDate()).padStart(2, "0")
  const mth = String(now.getMonth() + 1).padStart(2, "0")
  const yyyy = now.getFullYear()
  return `${hh}:${mm} ${dd}/${mth}/${yyyy}`
}

export function formatRequestSummary(req) {
  if (!req) return ""
  switch (req.scope) {
    case "full_day":
      return req.startDate || ""
    case "date_range":
      return `${req.startDate} → ${req.endDate || req.startDate}`
    case "half_session":
      return `${req.startDate} · ${req.session === "sang" ? "Sáng" : "Chiều"}`
    case "multi_session":
      return `${req.sessions?.length || 0} buổi · từ ${req.startDate || ""}`
    default:
      return req.startDate || ""
  }
}

function sendLeaveNotification(employeeId, title, message) {
  if (!employeeId) return
  createNotification({
    recipientId: employeeId,
    type: "Nghỉ phép",
    title,
    message,
    time: getNowFormatted(),
  })
}

export function notifyRequestApproved(req) {
  sendLeaveNotification(
    req.employeeId,
    "Đơn nghỉ phép đã duyệt",
    `Đơn ${req.id} đã được phê duyệt. Thời gian: ${formatRequestSummary(req)}. Lý do: ${req.reason || "—"}`,
  )
}

export function notifyRequestRejected(req) {
  sendLeaveNotification(
    req.employeeId,
    "Đơn nghỉ phép bị từ chối",
    `Đơn ${req.id} đã bị từ chối. Thời gian: ${formatRequestSummary(req)}.`,
  )
}

export function notifyRequestUpdated(req, before) {
  const changes = []
  if (before.startDate !== req.startDate || before.endDate !== req.endDate || before.session !== req.session) {
    changes.push(`Thời gian: ${formatRequestSummary(before)} → ${formatRequestSummary(req)}`)
  }
  if (before.reason !== req.reason) {
    changes.push(`Lý do: ${before.reason || "—"} → ${req.reason || "—"}`)
  }
  const detail = changes.length > 0 ? changes.join(". ") : formatRequestSummary(req)
  sendLeaveNotification(
    req.employeeId,
    "Admin cập nhật đơn nghỉ phép",
    `Đơn ${req.id} đã được admin chỉnh sửa. ${detail}`,
  )
}
