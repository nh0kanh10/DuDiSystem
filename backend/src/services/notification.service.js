import * as repo from "../repositories/notification.repository.js"

export function listNotifications(filter) {
  return repo.getAll(filter)
}

export function createNotification(data) {
  const count = repo.count()
  return repo.create({
    id: `N${count + 1}`,
    type: data.type,
    message: data.message,
    time: data.time || new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    read: false
  })
}

export function markRead(id) {
  return repo.markRead(id)
}

export function markAllRead() {
  return repo.markAllRead()
}

export function deleteNotification(id) {
  return repo.remove(id)
}
