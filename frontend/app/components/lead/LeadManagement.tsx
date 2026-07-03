import React, { useState, useEffect } from "react"
import { Plus, Search, Eye, Edit, Trash2, User, DollarSign, CheckCircle2, Clock, XCircle, ArrowRight, Copy, Send, ExternalLink } from "lucide-react"
import { Lead, LeadStatus, Employee, FormStatus, LeadNote, FormType } from "../../types"
import { Modal, ModalCancelButton, ModalSubmitButton } from "../ui/Modal"
import { CustomCombobox } from "../ui/CustomCombobox"
import ConfirmModal from "../ui/ConfirmModal"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"

// Trạng thái lead đơn giản
const STATUS_CONFIG: Record<LeadStatus, { label: string; cls: string; icon: React.ElementType }> = {
  new: { label: "Mới", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  contacted: { label: "Đã liên hệ", cls: "bg-purple-50 text-purple-700 border-purple-200", icon: User },
  "requirement-gathering": { label: "Thu thập yêu cầu", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Send },
  "requirement-done": { label: "Đủ yêu cầu", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  converted: { label: "Đã thành dự án", cls: "bg-green-50 text-green-700 border-green-200", icon: ArrowRight },
  lost: { label: "Đã mất", cls: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
}

// Trạng thái form
const FORM_STATUS_CONFIG: Record<FormStatus, { label: string; cls: string; icon: React.ElementType }> = {
  "not_sent": { label: "Chưa gửi form", cls: "bg-gray-100 text-gray-600 border-gray-200", icon: Clock },
  "sent": { label: "Đã gửi form", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: Send },
  "opened": { label: "Khách đã mở", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: ExternalLink },
  "in_progress": { label: "Đang điền", cls: "bg-purple-50 text-purple-700 border-purple-200", icon: Edit },
  "completed": { label: "Đã hoàn thành", cls: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
}

// Dữ liệu mẫu đơn giản
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

  // State cho form tạo/sửa lead
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Lead | null>(null)
  const [form, setForm] = useState({ ...EMPTY_LEAD_FORM })
  const [saving, setSaving] = useState(false)

  // State cho chi tiết lead
  const [showDetail, setShowDetail] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Lead | null>(null)

  // Load dữ liệu mẫu
  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = () => {
    setLoading(true)
    setTimeout(() => {
      const mockLeads: Lead[] = [
        {
          id: "1",
          code: "LD-2025-001",
          name: "Website bán hàng ABC",
          status: "requirement-gathering",
          contactName: "Nguyễn Văn A",
          contactPhone: "0901234567",
          budgetEstimate: "50-70 triệu",
          assignedToId: currentUserId,
          assignedToName: "Trần Văn Quy",
          formType: "ecommerce",
          formStatus: "sent",
          formSentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          code: "LD-2025-002",
          name: "Landing page dịch vụ",
          status: "new",
          contactName: "Lê Thị B",
          contactEmail: "b@example.com",
          formType: "landing_page",
          formStatus: "not_sent",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "3",
          code: "LD-2025-003",
          name: "Website giới thiệu công ty",
          status: "converted",
          contactName: "Phạm Văn C",
          convertedProjectId: "P-001",
          formType: "company_profile",
          formStatus: "completed",
          formCompletedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      setLeads(mockLeads)
      setLoading(false)
    }, 500)
  }

  // Lọc lead
  const filteredLeads = leads.filter(lead => {
    const matchSearch = !search || lead.name.toLowerCase().includes(search.toLowerCase()) || lead.code.toLowerCase().includes(search.toLowerCase()) || (lead.contactName?.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = filterStatus === "all" || lead.status === filterStatus
    const matchMyOnly = !myOnly || !currentUserId || lead.assignedToId === currentUserId
    return matchSearch && matchStatus && matchMyOnly
  })

  const openCreate = () => {
    setEditTarget(null)
    setForm({ ...EMPTY_LEAD_FORM })
    setShowForm(true)
  }

  const openEdit = (lead: Lead) => {
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
    setShowForm(true)
  }

  const openDetail = (lead: Lead) => {
    setSelectedLead(lead)
    setShowDetail(true)
  }

  const handleSave = async () => {
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
          formStatus: "not_sent" as FormStatus,
          notes: [],
        }
        setLeads([newLead, ...leads])
      }
      setShowForm(false)
      setSaving(false)
    }, 500)
  }

  const handleDelete = (lead: Lead) => {
    setLeads(leads.filter(l => l.id !== lead.id))
    setShowDeleteConfirm(null)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px] p-5 rounded-2xl text-white flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 items-center mr-4 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white/30 animate-pulse"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white/60 animate-pulse delay-75"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse delay-150"></span>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Quản lý Lead</h2>
            <p className="text-xs text-white/80 mt-1">Theo dõi khách hàng tiềm năng từ đầu đến khi thành dự án</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-sm font-black transition-colors flex-shrink-0">
          <Plus size={15} /> Thêm Lead mới
        </button>
      </div>

      {/* Filter và search */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên, mã lead, khách hàng..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
          />
        </div>
        <CustomCombobox
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Trạng thái"
          options={[
            { value: "all", label: "Tất cả trạng thái" },
            ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label })),
          ]}
        />
        {currentUserId && (
          <button
            onClick={() => setMyOnly(p => !p)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-black transition-all border ${myOnly ? "bg-[#C62828]/8 text-[#C62828] border-[#C62828]/20" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"}`}
          >
            <User size={14} /> Lead của tôi
          </button>
        )}
      </div>

      {/* Danh sách lead */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full bg-[#C62828]/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></span>
            ))}
          </div>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <User size={24} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">Không có lead nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map(lead => {
            const statusConfig = STATUS_CONFIG[lead.status]
            const Icon = statusConfig.icon
            return (
              <div key={lead.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#C62828]/20 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 font-mono">{lead.code}</span>
                    <h3 className="font-bold text-gray-800 text-sm mt-1">{lead.name}</h3>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.cls}`}>
                    <Icon size={10} /> {statusConfig.label}
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

      {/* Form tạo/sửa lead */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editTarget ? "Sửa Lead" : "Thêm Lead mới"}
        icon={User}
        width="lg"
        footer={
          <div className="flex gap-3">
            <ModalCancelButton onClick={() => setShowForm(false)} />
            <ModalSubmitButton onClick={handleSave} loading={saving} label={editTarget ? "Lưu thay đổi" : "Tạo mới"} />
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-gray-600 mb-1.5">Tên Lead *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
                placeholder="Ví dụ: Website bán thời trang"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-600 mb-1.5">Tên khách hàng</label>
              <input
                type="text"
                value={form.contactName}
                onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-600 mb-1.5">Số điện thoại</label>
              <input
                type="text"
                value={form.contactPhone}
                onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-600 mb-1.5">Ngân sách ước tính</label>
              <input
                type="text"
                value={form.budgetEstimate}
                onChange={e => setForm(f => ({ ...f, budgetEstimate: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
                placeholder="50-70 triệu"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-600 mb-1.5">Trạng thái</label>
              <CustomCombobox
                value={form.status}
                onChange={v => setForm(f => ({ ...f, status: v as LeadStatus }))}
                options={Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-600 mb-1.5">Giao cho</label>
              <CustomCombobox
                value={form.assignedToId}
                onChange={v => setForm(f => ({ ...f, assignedToId: v }))}
                placeholder="Chọn nhân viên"
                options={(employees || []).map(e => ({ value: e.id, label: e.name, desc: e.department }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-600 mb-1.5">Ghi chú sơ bộ</label>
            <textarea
              value={form.roughNotes}
              onChange={e => setForm(f => ({ ...f, roughNotes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Chi tiết lead */}
      {showDetail && selectedLead && (
        <LeadDetail lead={selectedLead} onClose={() => setShowDetail(false)} setLeads={setLeads} leads={leads} />
      )}

      {/* Xác nhận xóa */}
      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => handleDelete(showDeleteConfirm)}
          title="Xóa Lead?"
          message={`Bạn chắc chắn muốn xóa lead "${showDeleteConfirm.name}"?`}
          confirmText="Xóa"
          type="danger"
        />
      )}
    </div>
  )
}

// Component chi tiết Lead đơn giản
function LeadDetail({
  lead,
  onClose,
  setLeads,
  leads,
}: {
  lead: Lead
  onClose: () => void
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>
  leads: Lead[]
}) {
  const [activeTab, setActiveTab] = useState<"info" | "form" | "notes">("info")
  const [newNote, setNewNote] = useState("")
  const [copied, setCopied] = useState(false)
  const [selectedFormType, setSelectedFormType] = useState<FormType>(lead.formType || "landing_page")
  const statusConfig = STATUS_CONFIG[lead.status]
  const StatusIcon = statusConfig.icon
  const formConfig = lead.formStatus ? FORM_STATUS_CONFIG[lead.formStatus] : null
  const FormIcon = formConfig?.icon

  const formLink = `${window.location.origin}/form/${lead.id}`

  const formTypeOptions = [
    { value: "landing_page", label: "Landing Page" },
    { value: "ecommerce", label: "Website Bán Hàng (E-commerce)" },
    { value: "company_profile", label: "Website Giới Thiệu Công Ty" }
  ]

  const handleSendForm = () => {
    setLeads(leads.map(l => l.id === lead.id ? {
      ...l,
      formType: selectedFormType,
      formStatus: "sent",
      formSentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } : l))
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return
    const note: LeadNote = {
      id: Date.now().toString(),
      content: newNote.trim(),
      createdAt: new Date().toISOString()
    }
    setLeads(leads.map(l => l.id === lead.id ? {
      ...l,
      notes: [...(l.notes || []), note],
      updatedAt: new Date().toISOString()
    } : l))
    setNewNote("")
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(formLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`${lead.code} - ${lead.name}`}
      width="3xl"
      noFooter
    >
      <div className="p-6 space-y-5">
        {/* Top info */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border ${statusConfig.cls}`}>
              <StatusIcon size={11} /> {statusConfig.label}
            </span>
            {lead.assignedToName && <span className="text-[11px] text-gray-500 font-semibold">Sales phụ trách: {lead.assignedToName}</span>}
          </div>
          <button className="px-3.5 py-1.5 text-[11px] font-black bg-[#C62828] text-white rounded-xl hover:bg-[#B71C1C] transition-colors">
            Chuyển thành dự án
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 border-b border-gray-100 bg-gray-50 rounded-xl p-0.5 flex-wrap">
          {[
            { id: "info", label: "Thông tin" },
            { id: "form", label: "Form yêu cầu" },
            { id: "notes", label: "Ghi chú" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-[11px] font-black rounded-lg transition-all ${activeTab === tab.id ? "bg-white text-[#C62828] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab nội dung */}
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
                  <p className="text-[11px] text-gray-400 mb-1">Ngân sách</p>
                  <p className="text-sm text-gray-800 font-semibold flex items-center gap-1.5">
                    <DollarSign size={14} className="text-[#C62828]" />
                    {lead.budgetEstimate || "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Ghi chú ban đầu</h4>
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                {lead.roughNotes ? <p className="text-sm text-gray-700 leading-relaxed">{lead.roughNotes}</p> : <p className="text-sm text-gray-400 italic">Chưa có ghi chú</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === "form" && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-4">Chọn loại form</h4>
              <CustomCombobox
                value={selectedFormType}
                onChange={(val) => setSelectedFormType(val as FormType)}
                placeholder="Chọn loại website"
                options={formTypeOptions}
              />
            </div>
            
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Trạng thái form</span>
                {formConfig && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border ${formConfig.cls}`}>
                    {FormIcon && <FormIcon size={11} />} {formConfig.label}
                  </span>
                )}
              </div>
              {(!lead.formStatus || lead.formStatus === "not_sent") && (
                <Button onClick={handleSendForm} className="bg-[#C62828] hover:bg-[#B71C1C] text-white text-[11px] font-black px-4 py-2 rounded-xl">
                  Gửi form cho khách
                </Button>
              )}
            </div>

            {(lead.formStatus && lead.formStatus !== "not_sent") && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-[11px] font-black text-gray-600">Link form</h5>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 hover:text-[#C62828] transition-colors"
                  >
                    {copied ? <CheckCircle2 size={12} className="text-green-600" /> : <Copy size={12} />}
                    {copied ? "Đã sao chép" : "Sao chép link"}
                  </button>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <p className="text-xs text-gray-700 break-all font-mono">{formLink}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <h5 className="text-[11px] font-black text-gray-600 mb-3">Thêm ghi chú</h5>
              <div className="space-y-3">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Nhập nội dung ghi chú..."
                  className="resize-none bg-gray-50"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddNote}
                    className="bg-[#C62828] hover:bg-[#B71C1C] text-white text-[11px] font-black px-4 py-2 rounded-xl"
                    disabled={!newNote.trim()}
                  >
                    Thêm ghi chú
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {(lead.notes || []).length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-sm font-medium">Chưa có ghi chú nào</p>
                </div>
              ) : (
                (lead.notes || []).map(note => (
                  <div key={note.id} className="bg-white border border-gray-100 rounded-2xl p-4">
                    <p className="text-sm text-gray-800">{note.content}</p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      {new Date(note.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
