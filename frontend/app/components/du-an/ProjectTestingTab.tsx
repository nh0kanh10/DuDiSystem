import React, { useState } from "react"
import { Bug, Plus, Search, Filter, AlertCircle, AlertTriangle, Info, CheckCircle2, XCircle, Clock, PlayCircle, User } from "lucide-react"
import { Bug as BugType, Employee } from "../../types"
import { Modal, ModalCancelButton, ModalSubmitButton } from "../ui/Modal"
import { CustomCombobox } from "../ui/CustomCombobox"
import ConfirmModal from "../ui/ConfirmModal"

const SEVERITY_CONFIG: Record<BugType["severity"], { label: string; cls: string; icon: React.ElementType }> = {
  critical: { label: "Nghiêm trọng", cls: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
  high: { label: "Cao", cls: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertTriangle },
  medium: { label: "Trung bình", cls: "bg-amber-100 text-amber-700 border-amber-200", icon: Info },
  low: { label: "Thấp", cls: "bg-blue-100 text-blue-700 border-blue-200", icon: Info },
}

const STATUS_CONFIG: Record<BugType["status"], { label: string; cls: string; icon: React.ElementType }> = {
  open: { label: "Mở", cls: "bg-gray-100 text-gray-700 border-gray-200", icon: Clock },
  "in-progress": { label: "Đang fix", cls: "bg-blue-100 text-blue-700 border-blue-200", icon: PlayCircle },
  fixed: { label: "Đã fix", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  verified: { label: "Đã xác nhận", cls: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  closed: { label: "Đóng", cls: "bg-gray-100 text-gray-500 border-gray-200", icon: XCircle },
}

const EMPTY_BUG_FORM = {
  title: "",
  description: "",
  severity: "medium" as BugType["severity"],
  status: "open" as BugType["status"],
  assignedToId: "",
}

export function ProjectTestingTab({ bugs, employees, onAddBug, onEditBug, onDeleteBug }: { bugs?: BugType[]; employees?: Employee[]; onAddBug?: (bug: any) => void; onEditBug?: (id: string, bug: any) => void; onDeleteBug?: (id: string) => void }) {
  const [search, setSearch] = useState("")
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<BugType | null>(null)
  const [form, setForm] = useState({ ...EMPTY_BUG_FORM })
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filteredBugs = (bugs || []).filter(bug => {
    const matchSearch = !search || bug.title.toLowerCase().includes(search.toLowerCase()) || (bug.description?.toLowerCase().includes(search.toLowerCase()))
    const matchSeverity = filterSeverity === "all" || bug.severity === filterSeverity
    const matchStatus = filterStatus === "all" || bug.status === filterStatus
    return matchSearch && matchSeverity && matchStatus
  })

  function openAdd() {
    setEditTarget(null)
    setForm({ ...EMPTY_BUG_FORM })
    setShowForm(true)
  }

  function openEdit(bug: BugType) {
    setEditTarget(bug)
    setForm({
      title: bug.title,
      description: bug.description || "",
      severity: bug.severity,
      status: bug.status,
      assignedToId: bug.assignedToId || "",
    })
    setShowForm(true)
  }

  function handleSave() {
    if (!form.title.trim()) return
    if (editTarget && onEditBug) onEditBug(editTarget.id, form)
    else if (onAddBug) onAddBug({ ...form, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    setShowForm(false)
  }

  function cycleStatus(bug: BugType) {
    const nextStatus: Record<BugType["status"], BugType["status"]> = {
      open: "in-progress",
      "in-progress": "fixed",
      fixed: "verified",
      verified: "closed",
      closed: "open",
    }
    if (onEditBug) onEditBug(bug.id, { ...bug, status: nextStatus[bug.status] })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Bug size={16} className="text-[#C62828]" /> Testing & Bug Tracking
        </h3>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C62828] text-white text-xs font-bold rounded-lg hover:bg-[#B71C1C] transition">
          <Plus size={14} /> Báo bug mới
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm bug..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
          />
        </div>
        <CustomCombobox
          value={filterSeverity}
          onChange={setFilterSeverity}
          placeholder="Mức độ"
          options={[
            { value: "all", label: "Tất cả mức độ" },
            ...Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))
          ]}
        />
        <CustomCombobox
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Trạng thái"
          options={[
            { value: "all", label: "Tất cả trạng thái" },
            ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))
          ]}
        />
      </div>

      {!bugs || bugs.length === 0 ? (
        <div className="text-center py-12">
          <Bug size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">Chưa có bug nào được báo cáo</p>
        </div>
      ) : filteredBugs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">Không tìm thấy bug nào khớp với bộ lọc</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBugs.map(bug => {
            const sevCfg = SEVERITY_CONFIG[bug.severity]
            const statusCfg = STATUS_CONFIG[bug.status]
            const SevIcon = sevCfg.icon
            const StatusIcon = statusCfg.icon
            return (
              <div key={bug.id} className="bg-white border border-gray-100 rounded-xl p-4 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sevCfg.cls}`}>
                        <SevIcon size={10} /> {sevCfg.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.cls}`}>
                        <StatusIcon size={10} /> {statusCfg.label}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-800">{bug.title}</h4>
                    {bug.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{bug.description}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      {bug.assignedToId && employees && (
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          <User size={12} /> {employees.find(e => e.id === bug.assignedToId)?.name || "—"}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400">Tạo: {new Date(bug.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => cycleStatus(bug)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700" title="Chuyển trạng thái">
                      <CheckCircle2 size={14} />
                    </button>
                    <button onClick={() => openEdit(bug)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                      <Info size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(bug.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editTarget ? "Sửa bug" : "Báo bug mới"}
        icon={Bug}
        width="lg"
        footer={
          <div className="flex gap-3">
            <ModalCancelButton onClick={() => setShowForm(false)} />
            <ModalSubmitButton onClick={handleSave} label={editTarget ? "Cập nhật" : "Tạo"} />
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Tiêu đề *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
              placeholder="Mô tả ngắn gọn về bug"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Mức độ</label>
              <CustomCombobox
                value={form.severity}
                onChange={v => setForm(f => ({ ...f, severity: v as BugType["severity"] }))}
                options={Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Trạng thái</label>
              <CustomCombobox
                value={form.status}
                onChange={v => setForm(f => ({ ...f, status: v as BugType["status"] }))}
                options={Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Giao cho</label>
              <CustomCombobox
                value={form.assignedToId}
                onChange={v => setForm(f => ({ ...f, assignedToId: v }))}
                placeholder="Chọn nhân viên"
                options={(employees || []).map(e => ({ value: e.id, label: e.name, desc: e.department }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Mô tả chi tiết</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 resize-none"
              placeholder="Mô tả các bước để reproduce bug, expected result, actual result..."
            />
          </div>
        </div>
      </Modal>

      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { onDeleteBug && onDeleteBug(deleteTarget); setDeleteTarget(null) }}
          title="Xóa bug?"
          message="Bạn chắc chắn muốn xóa bug này?"
          confirmText="Xóa"
          type="danger"
        />
      )}
    </div>
  )
}
