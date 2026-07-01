import * as repo from "../repositories/notification.repository.js"

export function listNotifications(filter) {
  return repo.getAll(filter)
}

export function createNotification(data) {
  const count = repo.count()
  return repo.create({
    id: `N${Date.now()}`,
    recipientId: data.recipientId || null,
    type: data.type,
    message: data.message,
    time: data.time || new Date().toLocaleDateString("vi-VN"),
    read: false
  })
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
