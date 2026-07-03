import React, { useMemo, useState } from "react"
import {
  CheckSquare, Plus, Edit2, Trash2, ExternalLink,
  CircleDot, PlayCircle, CheckCircle2,
} from "lucide-react"
import { Employee, TaskCategory } from "../../types"
import { api } from "@/lib/api"
import { CustomCombobox } from "../ui/CustomCombobox"
import { CustomSelect } from "../ui/CustomSelect"
import { CustomDatePicker as DateInput } from "../ui/CustomDatePicker"
import { Modal, ModalCancelButton, ModalSubmitButton } from "../ui/Modal"
import ConfirmModal from "../ui/ConfirmModal"
import {
  ProjectDetailTabShell, ProjectTabEmptyState, ProjectTabSection, tabDashedAddBtn, tabPrimaryBtn,
} from "./ProjectDetailTabShell"
import {
  TASK_CATEGORY_LABELS, TASK_CATEGORY_OPTIONS, TASK_STATUS_LABELS,
  ProjectTaskRow, groupProjectTasks, flattenTaskTable, countLeafTasks, deriveParentStatus,
} from "./projectTaskUtils"

const STATUS_CFG = {
  todo: { label: "Chờ xử lý", cls: "bg-gray-100 text-gray-600 border-gray-200", icon: CircleDot },
  "in-progress": { label: "Đang làm", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: PlayCircle },
  done: { label: "Hoàn thành", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
} as const

const EMPTY_WORK = {
  title: "",
  assigneeId: "",
  startDate: "",
  dueDate: "",
}

const EMPTY_SUB = {
  title: "",
  description: "",
  category: "" as TaskCategory | "",
  resourceUrl: "",
  notes: "",
  status: "todo" as "todo" | "in-progress" | "done",
  assigneeId: "",
}

function StatusBadge({ status }: { status: keyof typeof STATUS_CFG }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.todo
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

export function ProjectTasksTab({
  projectId,
  tasks,
  loading,
  projectMembers,
  onTasksChange,
  onProjectRefresh,
}: {
  projectId: string
  projectMembers: Employee[]
  tasks: ProjectTaskRow[]
  loading: boolean
  onTasksChange: (tasks: ProjectTaskRow[]) => void
  onProjectRefresh: () => void
}) {
  const [showWorkForm, setShowWorkForm] = useState(false)
  const [editParentId, setEditParentId] = useState<string | null>(null)
  const [workForm, setWorkForm] = useState({ ...EMPTY_WORK })
  const [saving, setSaving] = useState(false)

  const [showSubForm, setShowSubForm] = useState(false)
  const [subParentId, setSubParentId] = useState<string | null>(null)
  const [editSubId, setEditSubId] = useState<string | null>(null)
  const [subForm, setSubForm] = useState({ ...EMPTY_SUB })

  const [deleteParentId, setDeleteParentId] = useState<string | null>(null)
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null)

  const groups = useMemo(() => groupProjectTasks(tasks), [tasks])
  const tableRows = useMemo(() => flattenTaskTable(groups), [tasks])
  const leafTasks = useMemo(() => countLeafTasks(tasks), [tasks])

  function openCreateWork() {
    setEditParentId(null)
    setWorkForm({ ...EMPTY_WORK })
    setShowWorkForm(true)
  }

  function openEditWork(parentId: string) {
    const parent = groups.find(g => g.parent.id === parentId)?.parent
    if (!parent) return
    setEditParentId(parent.id)
    setWorkForm({
      title: parent.title,
      assigneeId: parent.assigneeId || "",
      startDate: parent.startDate || "",
      dueDate: parent.dueDate || "",
    })
    setShowWorkForm(true)
  }

  function openAddSub(parentId: string) {
    const parent = groups.find(g => g.parent.id === parentId)?.parent
    setSubParentId(parentId)
    setEditSubId(null)
    setSubForm({ ...EMPTY_SUB, assigneeId: parent?.assigneeId || "" })
    setShowSubForm(true)
  }

  function openEditSub(child: ProjectTaskRow) {
    setSubParentId(child.parentId || null)
    setEditSubId(child.id)
    setSubForm({
      title: child.title,
      description: child.description || "",
      category: (child.category as TaskCategory) || "",
      resourceUrl: child.resourceUrl || "",
      notes: child.notes || "",
      status: child.status,
      assigneeId: child.assigneeId || "",
    })
    setShowSubForm(true)
  }

  async function reloadTasks() {
    const list = await api.tasks.list({ projectId }) as ProjectTaskRow[]
    onTasksChange(list)
    onProjectRefresh()
  }

  async function handleSaveWork() {
    if (!workForm.title.trim()) return
    setSaving(true)
    try {
      const payload = {
        title: workForm.title.trim(),
        assigneeId: workForm.assigneeId || undefined,
        startDate: workForm.startDate || undefined,
        dueDate: workForm.dueDate || undefined,
        projectId,
        status: "todo" as const,
        description: "",
        category: "",
      }
      if (editParentId) {
        const group = groups.find(g => g.parent.id === editParentId)
        await api.tasks.update(editParentId, {
          ...payload,
          status: deriveParentStatus(group?.children || []),
        })
      } else {
        await api.tasks.create(payload)
      }
      await reloadTasks()
      setShowWorkForm(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveSub() {
    if (!subForm.title.trim() || !subParentId) return
    const parent = groups.find(g => g.parent.id === subParentId)?.parent
    setSaving(true)
    try {
      const payload = {
        title: subForm.title.trim(),
        description: subForm.description.trim(),
        category: subForm.category || undefined,
        resourceUrl: subForm.resourceUrl.trim(),
        notes: subForm.notes.trim(),
        status: subForm.status,
        assigneeId: subForm.assigneeId || parent?.assigneeId || undefined,
        projectId,
        parentId: subParentId,
      }
      if (editSubId) {
        await api.tasks.update(editSubId, payload)
      } else {
        await api.tasks.create(payload)
      }
      await reloadTasks()
      setShowSubForm(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteParent(id: string) {
    await api.tasks.delete(id)
    setDeleteParentId(null)
    await reloadTasks()
  }

  async function handleDeleteSub(id: string) {
    await api.tasks.delete(id)
    setDeleteSubId(null)
    await reloadTasks()
  }

  async function cycleChildStatus(child: ProjectTaskRow) {
    const next = child.status === "todo" ? "in-progress" : child.status === "in-progress" ? "done" : "todo"
    await api.tasks.update(child.id, { status: next })
    await reloadTasks()
  }

  const thCls = "px-3 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50/90 border-b border-gray-100"
  const tdCls = "px-3 py-3 text-xs text-gray-700 border-t border-gray-100 align-top"

  return (
    <ProjectDetailTabShell
      icon={CheckSquare}
      title="Công việc dự án"
      description="Tạo công việc trước, sau đó thêm task chi tiết từ bảng — hoàn thành khi tất cả task con xong"
      action={
        tasks.length > 0 ? (
          <button type="button" onClick={openCreateWork} className={tabPrimaryBtn}>
            <Plus size={14} /> Thêm công việc
          </button>
        ) : undefined
      }
      stats={tasks.length > 0 ? [
        { label: "Công việc", value: groups.length },
        { label: "Task chi tiết", value: leafTasks.length },
        { label: "Hoàn thành", value: leafTasks.filter(t => t.status === "done").length, cls: "text-emerald-600" },
        { label: "Tiến độ", value: `${leafTasks.length ? Math.round(leafTasks.filter(t => t.status === "done").length / leafTasks.length * 100) : 0}%` },
      ] : undefined}
    >
      {loading ? (
        <div className="py-12 text-center flex items-center justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-2 h-2 rounded-full bg-[#C62828]/40 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <ProjectTabEmptyState
          icon={CheckSquare}
          title="Chưa có công việc"
          description='Tạo công việc (VD: "Làm nội dung"), sau đó bấm «Thêm task» để thêm từng task chi tiết'
          action={
            <button type="button" onClick={openCreateWork} className={tabDashedAddBtn}>
              <Plus size={15} /> Thêm công việc
            </button>
          }
        />
      ) : (
        <ProjectTabSection>
          <div className="overflow-x-auto -mx-1 rounded-xl border border-gray-100">
            <table className="w-full min-w-[1180px] text-sm border-collapse">
              <thead>
                <tr>
                  <th className={`${thCls} w-10`}>STT</th>
                  <th className={`${thCls} min-w-[130px]`}>Tên công việc</th>
                  <th className={`${thCls} min-w-[140px]`}>Task chi tiết</th>
                  <th className={`${thCls} min-w-[120px]`}>Mô tả</th>
                  <th className={thCls}>Loại</th>
                  <th className={thCls}>Người phụ trách</th>
                  <th className={thCls}>Ngày</th>
                  <th className={thCls}>Deadline</th>
                  <th className={thCls}>Tài liệu / Link</th>
                  <th className={thCls}>Trạng thái</th>
                  <th className={`${thCls} min-w-[100px]`}>Ghi chú</th>
                  <th className={`${thCls} w-14`} />
                </tr>
              </thead>
              <tbody>
                {tableRows.map(row => {
                  const item = row.child || row.parent
                  const isChild = !!row.child
                  const children = groups.find(g => g.parent.id === row.parent.id)?.children || []
                  const parentStatus = children.length > 0 ? deriveParentStatus(children) : row.parent.status
                  const displayStatus = isChild ? item.status : parentStatus
                  return (
                    <tr key={`${row.parent.id}-${item.id}`} className="hover:bg-gray-50/60 transition-colors group">
                      <td className={`${tdCls} text-center text-gray-400 font-mono`}>{row.stt}</td>
                      {row.isFirstInGroup && (
                        <td className={`${tdCls} font-black text-gray-800 bg-[#C62828]/[0.03] border-r border-gray-100`}
                          rowSpan={row.groupSize}>
                          <div className="space-y-2">
                            <p className="leading-snug">{row.parent.title}</p>
                            {children.length > 0 && (
                              <p className="text-[10px] font-bold text-gray-400">
                                {children.length} task · <StatusBadge status={parentStatus as keyof typeof STATUS_CFG} />
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => openEditWork(row.parent.id)}
                                className="text-[10px] font-bold text-gray-500 hover:text-gray-800">
                                Sửa
                              </button>
                              <button type="button" onClick={() => openAddSub(row.parent.id)}
                                className="text-[10px] font-bold text-[#C62828] hover:underline">
                                + Thêm task
                              </button>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className={`${tdCls} ${isChild ? "font-semibold text-gray-800" : ""}`}>
                        {isChild ? item.title : (
                          <button type="button" onClick={() => openAddSub(row.parent.id)}
                            className="text-gray-400 italic hover:text-[#C62828] hover:not-italic text-left">
                            + Thêm task chi tiết
                          </button>
                        )}
                      </td>
                      <td className={`${tdCls} text-gray-500 max-w-[140px]`}>
                        {isChild ? (
                          <span className="line-clamp-3">{item.description || "—"}</span>
                        ) : "—"}
                      </td>
                      <td className={tdCls}>
                        {isChild && item.category ? (
                          <span className="inline-flex px-2 py-0.5 rounded-lg bg-gray-100 text-[10px] font-bold text-gray-600">
                            {TASK_CATEGORY_LABELS[item.category as TaskCategory]}
                          </span>
                        ) : "—"}
                      </td>
                      <td className={`${tdCls} whitespace-nowrap`}>
                        {isChild ? (item.assigneeName || row.parent.assigneeName || "—") : "—"}
                      </td>
                      {row.isFirstInGroup && (
                        <td className={`${tdCls} whitespace-nowrap`} rowSpan={row.groupSize}>{row.parent.startDate || "—"}</td>
                      )}
                      {row.isFirstInGroup && (
                        <td className={`${tdCls} whitespace-nowrap font-semibold`} rowSpan={row.groupSize}>{row.parent.dueDate || "—"}</td>
                      )}
                      <td className={tdCls}>
                        {isChild && item.resourceUrl ? (
                          <a href={item.resourceUrl} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#C62828] hover:underline max-w-[110px]">
                            <ExternalLink size={11} className="shrink-0" />
                            <span className="truncate">{item.resourceUrl.replace(/^https?:\/\//, "").slice(0, 18)}</span>
                          </a>
                        ) : "—"}
                      </td>
                      <td className={tdCls}>
                        {isChild ? (
                          <button type="button" onClick={() => cycleChildStatus(item)}
                            title="Click để đổi trạng thái"
                            className="hover:opacity-80 transition-opacity">
                            <StatusBadge status={displayStatus as keyof typeof STATUS_CFG} />
                          </button>
                        ) : (
                          <StatusBadge status={displayStatus as keyof typeof STATUS_CFG} />
                        )}
                      </td>
                      <td className={tdCls}>
                        <span className="line-clamp-2 text-gray-500">{isChild ? (item.notes || "—") : "—"}</span>
                      </td>
                      <td className={tdCls}>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isChild ? (
                            <>
                              <button type="button" onClick={() => openEditSub(item)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                                <Edit2 size={13} />
                              </button>
                              <button type="button" onClick={() => setDeleteSubId(item.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                                <Trash2 size={13} />
                              </button>
                            </>
                          ) : row.isFirstInGroup ? (
                            <button type="button" onClick={() => setDeleteParentId(row.parent.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500">
                              <Trash2 size={13} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </ProjectTabSection>
      )}

      <Modal
        open={showWorkForm}
        onClose={() => setShowWorkForm(false)}
        title={editParentId ? "Chỉnh sửa công việc" : "Thêm công việc mới"}
        icon={CheckSquare}
        width="lg"
        footer={
          <>
            <ModalCancelButton onClick={() => setShowWorkForm(false)} />
            <ModalSubmitButton onClick={handleSaveWork} loading={saving} disabled={!workForm.title.trim()}
              label={editParentId ? "Lưu thay đổi" : "Tạo công việc"} />
          </>
        }
      >
        <div className="p-6 space-y-4">
          {!editParentId && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
              Sau khi tạo, bấm <strong>+ Thêm task</strong> trên bảng để thêm task chi tiết.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Tên công việc *</label>
              <input value={workForm.title} onChange={e => setWorkForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
                placeholder='VD: Làm nội dung, Thiết kế giao diện...' />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Người phụ trách (mặc định)</label>
              <CustomCombobox value={workForm.assigneeId} onChange={v => setWorkForm(f => ({ ...f, assigneeId: v }))}
                placeholder="Áp dụng cho task con..."
                options={projectMembers.map(e => ({ value: e.id, label: e.name, desc: e.position }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Ngày bắt đầu</label>
              <DateInput value={workForm.startDate} onChange={v => setWorkForm(f => ({ ...f, startDate: v }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Deadline</label>
              <DateInput value={workForm.dueDate} onChange={v => setWorkForm(f => ({ ...f, dueDate: v }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={showSubForm}
        onClose={() => setShowSubForm(false)}
        title={editSubId ? "Chỉnh sửa task chi tiết" : "Thêm task chi tiết"}
        icon={CheckSquare}
        width="lg"
        footer={
          <>
            <ModalCancelButton onClick={() => setShowSubForm(false)} />
            <ModalSubmitButton onClick={handleSaveSub} loading={saving} disabled={!subForm.title.trim()}
              label={editSubId ? "Lưu thay đổi" : "Thêm task"} />
          </>
        }
      >
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-600 block mb-1.5">Tên task chi tiết *</label>
            <input value={subForm.title} onChange={e => setSubForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
              placeholder="Chính sách bảo mật, Điều khoản sử dụng..." />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5">Loại công việc</label>
            <CustomSelect value={subForm.category} onChange={v => setSubForm(f => ({ ...f, category: v as TaskCategory }))}
              placeholder="Chọn loại..."
              options={[{ value: "", label: "— Chọn loại —" }, ...TASK_CATEGORY_OPTIONS]} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5">Người phụ trách</label>
            <CustomCombobox value={subForm.assigneeId} onChange={v => setSubForm(f => ({ ...f, assigneeId: v }))}
              placeholder="Kế thừa từ công việc nếu để trống"
              options={projectMembers.map(e => ({ value: e.id, label: e.name, desc: e.position }))} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5">Trạng thái</label>
            <CustomSelect value={subForm.status} onChange={v => setSubForm(f => ({ ...f, status: v as typeof f.status }))}
              options={Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({ value, label }))} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-600 block mb-1.5">Mô tả công việc</label>
            <textarea value={subForm.description} onChange={e => setSubForm(f => ({ ...f, description: e.target.value }))}
              rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
              placeholder="Mô tả chi tiết cho task này..." />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-600 block mb-1.5">Tài liệu / Link tham khảo</label>
            <input value={subForm.resourceUrl} onChange={e => setSubForm(f => ({ ...f, resourceUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
              placeholder="https://..." />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-600 block mb-1.5">Ghi chú</label>
            <textarea value={subForm.notes} onChange={e => setSubForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
              placeholder="Ghi chú cho task này..." />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteParentId !== null}
        onClose={() => setDeleteParentId(null)}
        onConfirm={() => deleteParentId && handleDeleteParent(deleteParentId)}
        title="Xóa công việc?"
        message="Toàn bộ task chi tiết trong nhóm cũng sẽ bị xóa."
        confirmText="Xóa"
        type="danger"
      />

      <ConfirmModal
        isOpen={deleteSubId !== null}
        onClose={() => setDeleteSubId(null)}
        onConfirm={() => deleteSubId && handleDeleteSub(deleteSubId)}
        title="Xóa task chi tiết?"
        message="Task sẽ bị xóa khỏi công việc."
        confirmText="Xóa"
        type="danger"
      />
    </ProjectDetailTabShell>
  )
}
