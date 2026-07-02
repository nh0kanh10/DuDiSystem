import * as repo from "../repositories/notification.repository.js"
import * as employeeRepo from "../repositories/employee.repository.js"

export function listNotifications(filter) {
  return repo.getAll(filter)
}

export function getNotificationById(id) {
  return repo.getById(id)
}

function createOneNotification(data, recipientId) {
  return repo.create({
    id: `N${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    recipientId: recipientId || null,
    type: data.type,
    title: data.title || "",
    message: data.message,
    time: data.time || new Date().toLocaleDateString("vi-VN"),
    read: false,
  })
}

export function createNotification(data) {
  const specificRecipients = Array.isArray(data.recipientIds)
    ? data.recipientIds.filter(Boolean)
    : []

  if (specificRecipients.length > 0) {
    return specificRecipients.map(recipientId => createOneNotification(data, recipientId))
  }

  if (data.recipientId) {
    return createOneNotification(data, data.recipientId)
  }

  if (data.toAll === true) {
    const recipients = employeeRepo.getAll({ status: "active" }).map(e => e.id)
    return recipients.map(recipientId => createOneNotification(data, recipientId))
  }

  // Legacy fallback: notification chung (broadcast)
  return createOneNotification(data, null)
}

export function markRead(id) {
  return repo.markRead(id)
}

export function markAllRead(recipientId) {
  return repo.markAllReadForUser(recipientId)
}

export function deleteNotification(id) {
  return repo.remove(id)
}
