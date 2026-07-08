import { getChatSocket } from "./chatSocket"
import type { Socket } from "socket.io-client"

export type TaskSocketRecord = {
  id: string
  title?: string
  description?: string
  assigneeId?: string
  assigneeName?: string
  assigneeDept?: string
  dueDate?: string
  startDate?: string
  priority?: string
  status?: string
  projectId?: string
  parentId?: string
  category?: string
  resourceUrl?: string
  notes?: string
}

export type TaskChangePayload = {
  action: "created" | "updated" | "deleted"
  task: TaskSocketRecord
}

type TaskHandlers = {
  onChange?: (payload: TaskChangePayload) => void
}

const handlers = new Set<TaskHandlers>()
let boundSocket: Socket | null = null

function onTaskChanged(payload: TaskChangePayload) {
  if (!payload?.task?.id) return
  handlers.forEach(h => h.onChange?.(payload))
}

function bindSocket(socket: Socket) {
  if (boundSocket === socket) return
  if (boundSocket) {
    boundSocket.off("task:changed", onTaskChanged)
  }
  boundSocket = socket
  socket.on("task:changed", onTaskChanged)
  socket.on("disconnect", () => {
    boundSocket = null
  })
}

export function subscribeTaskSocket(h: TaskHandlers) {
  handlers.add(h)
  const tryBind = () => {
    const socket = getChatSocket()
    if (socket) bindSocket(socket)
  }
  tryBind()
  window.addEventListener("dudi:chat-socket-connect", tryBind)
  return () => {
    handlers.delete(h)
    window.removeEventListener("dudi:chat-socket-connect", tryBind)
  }
}

export function mergeTaskList<T extends TaskSocketRecord>(
  list: T[],
  payload: TaskChangePayload,
  filter?: (task: TaskSocketRecord) => boolean,
): T[] {
  const { action, task } = payload
  if (filter && !filter(task)) {
    if (action === "deleted") {
      return list.filter(t => t.id !== task.id && t.parentId !== task.id)
    }
    return list
  }
  if (action === "deleted") {
    return list.filter(t => t.id !== task.id && t.parentId !== task.id)
  }
  if (action === "created") {
    if (list.some(t => t.id === task.id)) {
      return list.map(t => t.id === task.id ? { ...t, ...task } as T : t)
    }
    return [task as T, ...list]
  }
  if (list.some(t => t.id === task.id)) {
    return list.map(t => t.id === task.id ? { ...t, ...task } as T : t)
  }
  return [task as T, ...list]
}
