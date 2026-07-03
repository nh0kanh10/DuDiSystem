import { TaskCategory } from "../../types"

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  CODE: "Lập trình",
  CONTENT: "Nội dung",
  OPS: "Vận hành",
  DESIGN: "Thiết kế",
  TEST: "Kiểm thử",
  ADMIN: "Hành chính",
}

export const TASK_CATEGORY_OPTIONS = (Object.keys(TASK_CATEGORY_LABELS) as TaskCategory[]).map(k => ({
  value: k,
  label: TASK_CATEGORY_LABELS[k],
}))

export const TASK_STATUS_LABELS = {
  todo: "Chờ xử lý",
  "in-progress": "Đang làm",
  done: "Hoàn thành",
} as const

export const TEST_TYPE_OPTIONS = [
  { value: "smoke", label: "Smoke test" },
  { value: "regression", label: "Regression" },
  { value: "uat", label: "UAT" },
  { value: "integration", label: "Tích hợp" },
  { value: "performance", label: "Hiệu năng" },
  { value: "security", label: "Bảo mật" },
]

export const BUG_HANDLING_STATUS_OPTIONS = [
  { value: "pending", label: "Chờ xử lý" },
  { value: "in-progress", label: "Đang xử lý" },
  { value: "resolved", label: "Đã xử lý xong" },
  { value: "closed", label: "Đã đóng" },
]

export function testTypeLabel(value?: string) {
  return TEST_TYPE_OPTIONS.find(o => o.value === value)?.label ?? value ?? "—"
}

export function handlingStatusLabel(value?: string) {
  return BUG_HANDLING_STATUS_OPTIONS.find(o => o.value === value)?.label ?? value ?? "—"
}

export type TaskStatus = "todo" | "in-progress" | "done"

export type ProjectTaskRow = {
  id: string
  title: string
  taskDetail?: string
  description?: string
  assigneeId?: string
  assigneeName?: string
  startDate?: string
  dueDate?: string
  resourceUrl?: string
  notes?: string
  status: TaskStatus
  category?: string
  priority?: string
  projectId?: string
  parentId?: string
}

export function deriveParentStatus(children: ProjectTaskRow[]): TaskStatus {
  if (children.length === 0) return "todo"
  if (children.every(c => c.status === "done")) return "done"
  if (children.some(c => c.status === "in-progress" || c.status === "done")) return "in-progress"
  return "todo"
}

export function groupProjectTasks(tasks: ProjectTaskRow[]) {
  const parents = tasks.filter(t => !t.parentId)
  const childrenByParent = new Map<string, ProjectTaskRow[]>()
  for (const t of tasks) {
    if (!t.parentId) continue
    const list = childrenByParent.get(t.parentId) || []
    list.push(t)
    childrenByParent.set(t.parentId, list)
  }
  return parents.map(parent => ({
    parent,
    children: childrenByParent.get(parent.id) || [],
  }))
}

export function flattenTaskTable(groups: ReturnType<typeof groupProjectTasks>) {
  const rows: {
    stt: number
    parent: ProjectTaskRow
    child: ProjectTaskRow | null
    isFirstInGroup: boolean
    groupSize: number
  }[] = []
  let stt = 0
  for (const { parent, children } of groups) {
    if (children.length === 0) {
      stt += 1
      rows.push({ stt, parent, child: null, isFirstInGroup: true, groupSize: 1 })
      continue
    }
    children.forEach((child, idx) => {
      stt += 1
      rows.push({
        stt,
        parent,
        child,
        isFirstInGroup: idx === 0,
        groupSize: children.length,
      })
    })
  }
  return rows
}

export function countLeafTasks(tasks: ProjectTaskRow[]) {
  const parentIdsWithChildren = new Set(
    tasks.filter(t => t.parentId).map(t => t.parentId as string),
  )
  return tasks.filter(t => {
    if (t.parentId) return true
    return !parentIdsWithChildren.has(t.id)
  })
}
