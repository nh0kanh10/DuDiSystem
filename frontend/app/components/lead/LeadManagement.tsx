import React, { useState, useEffect } from "react"
import { Plus, Search, Eye, Edit, Trash2, User, Calendar, DollarSign, FileText, CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react"
import { Lead, LeadStatus, Employee } from "../../types"
import { Modal, ModalCancelButton, ModalSubmitButton } from "../ui/Modal"
import { CustomCombobox } from "../ui/CustomCombobox"
import ConfirmModal from "../ui/ConfirmModal"

const STATUS_CONFIG: Record<LeadStatus, { label: string; cls: string; icon: React.ElementType }> = {
  new: { label: "Mới", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  contacted: { label: "Đã liên hệ", cls: "bg-purple-50 text-purple-700 border-purple-200", icon: User },
  "requirement-gathering": { label: "Thu thập yêu cầu", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: FileText },
  "requirement-done": { label: "Đủ yêu cầu", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  converted: { label: "Đã chuyển thành dự án", cls: "bg-green-50 text-green-700 border-green-200", icon: ArrowRight },
  lost: { label: "Đã mất", cls: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
}

const EMPTY_LEAD_FORM = {
  name: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  budgetEstimate: "",
  roughNotes: "",
  status: "new" as LeadStatus,
  assignedToId: "",
}

export function LeadManagement({
  currentUserId,
  employees,
}: {
  currentUserId?: string
  employees?: Employee[]
}) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [myOnly, setMyOnly] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Lead | null>(null)
  const [form, setForm] = useState({ ...EMPTY_LEAD_FORM })
  const [formErr, setFormErr] = useState<Partial<typeof EMPTY_LEAD_FORM>>({})
  const [saving, setSaving] = useState(false)

  const [showDetail, setShowDetail] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Lead | null>(null)

  useEffect(() => {
    loadLeads()
  }, [])

  async function loadLeads() {
    setLoading(true)
    setTimeout(() => {
      const mockLeads: Lead[] = [
        { id: "1", code: "LD-2025-001", name: "Website bán hàng ABC", status: "requirement-gathering", contactName: "Nguyễn Văn A", contactPhone: "0901234567", budgetEstimate: "50-70 triệu", assignedToId: currentUserId, assignedToName: "Trần Văn Quy", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "2", code: "LD-2025-002", name: "App quản lý kho", status: "new", contactName: "Lê Thị B", contactEmail: "b@example.com", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "3", code: "LD-2025-003", name: "CRM nội bộ", status: "converted", contactName: "Phạm Văn C", convertedProjectId: "P-001", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ]
      setLeads(mockLeads)
      setLoading(false)
    }, 500)
  }

  const filteredLeads = leads.filter(lead => {
    const matchSearch = !search || lead.name.toLowerCase().includes(search.toLowerCase()) || lead.code.toLowerCase().includes(search.toLowerCase()) || (lead.contactName?.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = filterStatus === "all" || lead.status === filterStatus
    const matchMyOnly = !myOnly || !currentUserId || lead.assignedToId === currentUserId
    return matchSearch && matchStatus && matchMyOnly
  })

  function openCreate() {
    setEditTarget(null)
    setForm({ ...EMPTY_LEAD_FORM })
    setFormErr({})
    setShowForm(true)
  }

  function openEdit(lead: Lead) {
    setEditTarget(lead)
    setForm({
      name: lead.name,
      contactName: lead.contactName || "",
      contactPhone: lead.contactPhone || "",
      contactEmail: lead.contactEmail || "",
      budgetEstimate: lead.budgetEstimate || "",
      roughNotes: lead.roughNotes || "",
      status: lead.status,
      assignedToId: lead.assignedToId || "",
    })
    setFormErr({})
    setShowForm(true)
  }

  function openDetail(lead: Lead) {
    setSelectedLead(lead)
    setShowDetail(true)
  }

  function validateForm() {
    const err: Partial<typeof EMPTY_LEAD_FORM> = {}
    if (!form.name.trim()) err.name = "Bắt buộc"
    setFormErr(err)
    return Object.keys(err).length === 0
  }

  async function handleSave() {
    if (!validateForm()) return
    setSaving(true)
    setTimeout(() => {
      if (editTarget) {
        setLeads(leads.map(l => l.id === editTarget.id ? { ...l, ...form, updatedAt: new Date().toISOString() } : l))
      } else {
        const newLead: Lead = {
          id: Date.now().toString(),
          code: `LD-${new Date().getFullYear()}-${String(leads.length + 1).padStart(3, "0")}`,
          ...form,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setLeads([newLead, ...leads])
      }
      setShowForm(false)
      setSaving(false)
    }, 500)
  }

  async function handleDelete(lead: Lead) {
    setLeads(leads.filter(l => l.id !== lead.id))
    setShowDeleteConfirm(null)
  }

  return (
    <div className="space-y-5">
      <div className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px] p-5 rounded-2xl text-white flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 items-center mr-4 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white/30 animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/60 animate-pulse delay-75" />
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse delay-150" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Quản lý Lead</h2>
            <p className="text-xs text-white/80 mt-1">Theo dõi cơ hội kinh doanh từ CRM đến Dự án</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl text-sm font-bold transition-colors flex-shrink-0">
          <Plus size={15} /> Tạo Lead mới
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên, mã Lead, khách hàng..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
          />
        </div>
        <CustomCombobox
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Trạng thái"
          options={[
            { value: "all", label: "Tất cả trạng thái" },
            ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))
          ]}
        />
        {currentUserId && (
          <button
            onClick={() => setMyOnly(p => !p)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all border ${myOnly ? "bg-[#C62828]/8 text-[#C62828] border-[#C62828]/20" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"}`}
          >
            <User size={14} /> Của tôi
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="flex justify-center gap-1.5">
            {[0,1,2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full bg-[#C62828]/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <User size={24} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">Không có Lead nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map(lead => {
            const cfg = STATUS_CONFIG[lead.status]
            const Icon = cfg.icon
            return (
              <div key={lead.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#C62828]/20 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 font-mono">{lead.code}</span>
                    <h3 className="font-bold text-gray-800 text-sm mt-1">{lead.name}</h3>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
                    <Icon size={10} /> {cfg.label}
                  </span>
                </div>
                {lead.contactName && <p className="text-xs text-gray-500 mb-1"><span className="font-semibold">Khách:</span> {lead.contactName}</p>}
                {lead.contactPhone && <p className="text-xs text-gray-500 mb-1"><span className="font-semibold">ĐT:</span> {lead.contactPhone}</p>}
                {lead.budgetEstimate && (
                  <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                    <DollarSign size={12} /> Ngân sách: {lead.budgetEstimate}
                  </p>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                  {lead.assignedToName && <span className="text-[11px] text-gray-400">{lead.assignedToName}</span>}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openDetail(lead)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#C62828] transition-colors">
                      <Eye size={13} />
                    </button>
                    <button onClick={() => openEdit(lead)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                      <Edit size={13} />
                    </button>
                    <button onClick={() => setShowDeleteConfirm(lead)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={13} />
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
        title={editTarget ? "Sửa Lead" : "Tạo Lead mới"}
        icon={User}
        width="lg"
        footer={
          <div className="flex gap-3">
            <ModalCancelButton onClick={() => setShowForm(false)} />
            <ModalSubmitButton onClick={handleSave} loading={saving} label={editTarget ? "Cập nhật" : "Tạo"} />
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Tên Lead *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 ${formErr.name ? "border-red-300" : "border-gray-200 bg-gray-50"}`}
                placeholder="Ví dụ: Website bán thời trang"
              />
              {formErr.name && <p className="text-xs text-red-500 mt-1">{formErr.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Tên khách hàng</label>
              <input
                type="text"
                value={form.contactName}
                onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Số điện thoại</label>
              <input
                type="text"
                value={form.contactPhone}
                onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Ngân sách ước tính</label>
              <input
                type="text"
                value={form.budgetEstimate}
                onChange={e => setForm(f => ({ ...f, budgetEstimate: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
                placeholder="50-70 triệu"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Trạng thái</label>
              <CustomCombobox
                value={form.status}
                onChange={v => setForm(f => ({ ...f, status: v as LeadStatus }))}
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
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Ghi chú sơ bộ</label>
            <textarea
              value={form.roughNotes}
              onChange={e => setForm(f => ({ ...f, roughNotes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 resize-none"
            />
          </div>
        </div>
      </Modal>

      {showDetail && selectedLead && <LeadDetail lead={selectedLead} onClose={() => setShowDetail(false)} employees={employees} />}

      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => handleDelete(showDeleteConfirm)}
          title="Xóa Lead?"
          message={`Bạn chắc chắn muốn xóa Lead "${showDeleteConfirm.name}"?`}
          confirmText="Xóa"
          type="danger"
        />
      )}
    </div>
  )
}

function LeadDetail({ lead, onClose, employees }: { lead: Lead; onClose: () => void; employees?: Employee[] }) {
  const [activeTab, setActiveTab] = useState<"info" | "history" | "activity">("info")
  const cfg = STATUS_CONFIG[lead.status]
  const Icon = cfg.icon

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`${lead.code} - ${lead.name}`}
      width="3xl"
      noFooter
    >
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border ${cfg.cls}`}>
              <Icon size={11} /> {cfg.label}
            </span>
            {lead.assignedToName && <span className="text-[11px] text-gray-500 font-semibold">Sales phụ trách: {lead.assignedToName}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3.5 py-1.5 text-[11px] font-black bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">Gửi form yêu cầu</button>
            <button className="px-3.5 py-1.5 text-[11px] font-black bg-[#C62828] text-white rounded-xl hover:bg-[#B71C1C] transition-colors">Chuyển thành dự án</button>
          </div>
        </div>

        <div className="flex items-center gap-0.5 border-b border-gray-100 bg-gray-50 rounded-xl p-0.5">
          {(["info", "history", "activity"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[11px] font-black rounded-lg transition-all ${activeTab === tab ? "bg-white text-[#C62828] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {tab === "info" ? "Thông tin" : tab === "history" ? "Lịch sử" : "Hoạt động"}
            </button>
          ))}
        </div>

        {activeTab === "info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Thông tin khách hàng</h4>
              <div className="space-y-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">Tên liên hệ</p>
                  <p className="text-sm text-gray-800 font-semibold">{lead.contactName || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">Số điện thoại</p>
                  <p className="text-sm text-gray-800 font-semibold">{lead.contactPhone || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">Email</p>
                  <p className="text-sm text-gray-800 font-semibold">{lead.contactEmail || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">Ngân sách ước tính</p>
                  <p className="text-sm text-gray-800 font-semibold flex items-center gap-1.5">
                    <DollarSign size={14} className="text-[#C62828]" />
                    {lead.budgetEstimate || "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Ghi chú & tài liệu</h4>
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <h5 className="text-[11px] font-black text-gray-600 mb-2">Ghi chú</h5>
                {lead.roughNotes ? <p className="text-sm text-gray-700 leading-relaxed">{lead.roughNotes}</p> : <p className="text-sm text-gray-400 italic">Chưa có ghi chú</p>}
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <h5 className="text-[11px] font-black text-gray-600 mb-3">Tập đính kèm</h5>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[#C62828]/30 transition-colors cursor-pointer">
                  <p className="text-[11px] text-gray-400 font-medium">Kéo thả file hoặc click để upload</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
            <Calendar size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm font-medium text-gray-500">Lịch sử thay đổi sẽ hiển thị ở đây</p>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
            <FileText size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm font-medium text-gray-500">Hoạt động (gọi, email, meeting) sẽ hiển thị ở đây</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
