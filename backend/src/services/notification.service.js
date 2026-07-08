import * as repo from "../repositories/notification.repository.js"
import * as employeeRepo from "../repositories/employee.repository.js"
import { emitNotificationCreated, emitNotificationRead } from "../socket/chat.socket.js"

export function listNotifications(filter) {
  return repo.getAll(filter)
}

export function getNotificationById(id) {
  return repo.getById(id)
}

function countUnreadFor(recipientId) {
  return repo.getAll({ recipientId }).filter(n => !n.read).length
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

function publishCreated(created) {
  const list = Array.isArray(created) ? created : [created]
  for (const n of list) {
    if (n) emitNotificationCreated(n)
  }
}

export function createNotification(data) {
  let result

  const specificRecipients = Array.isArray(data.recipientIds)
    ? data.recipientIds.filter(Boolean)
    : []

  if (specificRecipients.length > 0) {
    result = specificRecipients.map(recipientId => createOneNotification(data, recipientId))
  } else if (data.recipientId) {
    result = createOneNotification(data, data.recipientId)
  } else if (data.toAll === true) {
    const recipients = employeeRepo.getAll({ status: "active" }).map(e => e.id)
    result = recipients.map(recipientId => createOneNotification(data, recipientId))
  } else {
    result = createOneNotification(data, null)
  }

  publishCreated(result)
  return result
}

export function markRead(id) {
  const before = repo.getById(id)
  const result = repo.markRead(id)
  if (!before) return result

  const recipientId = before.recipientId ?? null
  const unreadCount = countUnreadFor(recipientId)
  emitNotificationRead(recipientId, { id, unreadCount })
  return result
}

export function markAllRead(recipientId) {
  const count = repo.markAllReadForUser(recipientId)
  emitNotificationRead(recipientId, { all: true, unreadCount: 0 })
  return count
}

export function deleteNotification(id) {
  const before = repo.getById(id)
  const deleted = repo.remove(id)
  if (before && !before.read) {
    const recipientId = before.recipientId ?? null
    emitNotificationRead(recipientId, {
      id,
      deleted: true,
      unreadCount: countUnreadFor(recipientId),
    })
  }
  return deleted
}
