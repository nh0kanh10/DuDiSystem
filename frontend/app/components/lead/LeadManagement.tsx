import React, { useState, useEffect, useCallback } from "react"
import { Plus, Search, Eye, Edit, Trash2, User, DollarSign, Loader2 } from "lucide-react"
import { Lead, LeadStatus, Employee, CustomerType } from "../../types"
import { Modal, ModalCancelButton, ModalSubmitButton } from "../ui/Modal"
import { CustomCombobox } from "../ui/CustomCombobox"
import ConfirmModal from "../ui/ConfirmModal"
import { LeadDetailPage } from "./LeadDetailPage"
import { STATUS_CONFIG } from "./leadConstants"
import { resolveCustomerType } from "./leadCustomer"
import { api } from "../../../lib/api"

const EMPTY_LEAD_FORM = {
  name: "",
  customerType: "individual" as CustomerType,
  companyName: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  address: "",
  taxId: "",
  budgetEstimate: "",
  roughNotes: "",
  status: "new" as LeadStatus,
  assignedToId: "",
}

export function LeadManagement({
  currentUserId,
  employees,
  leadId,
  onNavigateToLead,
  onNavigateToProject,
}: {
  currentUserId?: string
  employees?: Employee[]
  leadId?: string
  onNavigateToLead?: (id?: string) => void
  onNavigateToProject?: (projectId: string) => void
}) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [myOnly, setMyOnly] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Lead | null>(null)
  const [form, setForm] = useState({ ...EMPTY_LEAD_FORM })
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Lead | null>(null)
  const [listError, setListError] = useState("")

  const loadLeads = useCallback(async () => {
    setLoading(true)
    setListError("")
    try {
      const data = await api.leads.list()
      setLeads(data)
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Không tải được danh sách lead")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLeads()
  }, [loadLeads, leadId])

  if (leadId) {
    return (
      <LeadDetailPage
        leadId={leadId}
        onBack={() => onNavigateToLead?.()}
        onNavigateToProject={onNavigateToProject}
      />
    )
  }

  const filteredLeads = leads.filter((lead) => {
    const matchSearch = !search
      || lead.name.toLowerCase().includes(search.toLowerCase())
      || lead.code.toLowerCase().includes(search.toLowerCase())
      || (lead.contactName?.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = filterStatus === "all" || lead.status === filterStatus
    const matchMyOnly = !myOnly || !currentUserId || lead.assignedToId === currentUserId
    return matchSearch && matchStatus && matchMyOnly
  })

  const openCreate = () => {
    setEditTarget(null)
    setForm({ ...EMPTY_LEAD_FORM, assignedToId: currentUserId || "" })
    setShowForm(true)
  }

  const openEdit = (lead: Lead) => {
    setEditTarget(lead)
    setForm({
      name: lead.name,
      contactName: lead.contactName || "",
      customerType: lead.customerType || (lead.companyName || lead.sourceCrmId ? "company" : "individual"),
      companyName: lead.companyName || "",
      contactPhone: lead.contactPhone || "",
      contactEmail: lead.contactEmail || "",
      address: lead.address || "",
      taxId: lead.taxId || "",
      budgetEstimate: lead.budgetEstimate || "",
      roughNotes: lead.roughNotes || "",
      status: lead.status,
      assignedToId: lead.assignedToId || "",
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        companyName: form.customerType === "company" ? form.companyName : "",
      }
      if (editTarget) {
        await api.leads.update(editTarget.id, payload)
      } else {
        await api.leads.create(payload)
      }
      setShowForm(false)
      await loadLeads()
    } catch {
      /* keep modal open */
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (lead: Lead) => {
    try {
      await api.leads.delete(lead.id)
      setShowDeleteConfirm(null)
      await loadLeads()
    } catch { /* ignore */ }
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
            <h2 className="text-xl font-black tracking-tight">Quản lý Lead</h2>
            <p className="text-xs text-white/80 mt-1">Theo dõi khách hàng tiềm năng từ đầu đến khi thành dự án</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-sm font-black transition-colors shrink-0"
        >
          <Plus size={15} /> Thêm Lead mới
        </button>
      </div>

      {listError && <p className="text-sm text-red-600 font-semibold">{listError}</p>}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            type="button"
            onClick={() => setMyOnly((p) => !p)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-black transition-all border ${
              myOnly ? "bg-[#C62828]/8 text-[#C62828] border-[#C62828]/20" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            <User size={14} /> Lead của tôi
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 size={24} className="animate-spin mx-auto text-[#C62828]/50" />
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
          {filteredLeads.map((lead) => {
            const status = lead.convertedProjectId ? "converted" : lead.status
            const statusConfig = STATUS_CONFIG[status]
            const Icon = statusConfig.icon
            return (
              <div
                key={lead.id}
                role="button"
                tabIndex={0}
                onClick={() => onNavigateToLead?.(lead.id)}
                onKeyDown={(e) => e.key === "Enter" && onNavigateToLead?.(lead.id)}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#C62828]/20 hover:shadow-md transition-all group cursor-pointer text-left"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 font-mono">{lead.code}</span>
                    <h3 className="font-bold text-gray-800 text-sm mt-1">{lead.name}</h3>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.cls}`}>
                    <Icon size={10} /> {statusConfig.label}
                  </span>
                </div>
                {(lead.contactName || lead.companyName) && (
                  <p className="text-xs text-gray-500 mb-1">
                    <span className="font-semibold">Khách:</span>{" "}
                    {resolveCustomerType(lead) === "company"
                      ? [lead.companyName || lead.name, lead.contactName].filter(Boolean).join(" · ")
                      : lead.contactName}
                  </p>
                )}
                {lead.contactPhone && <p className="text-xs text-gray-500 mb-1"><span className="font-semibold">ĐT:</span> {lead.contactPhone}</p>}
                {lead.budgetEstimate && (
                  <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                    <DollarSign size={12} /> Ngân sách: {lead.budgetEstimate}
                  </p>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                  {lead.assignedToName && <span className="text-[11px] text-gray-400">{lead.assignedToName}</span>}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => onNavigateToLead?.(lead.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#C62828] transition-colors" title="Xem chi tiết">
                      <Eye size={13} />
                    </button>
                    <button type="button" onClick={() => openEdit(lead)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="Sửa">
                      <Edit size={13} />
                    </button>
                    <button type="button" onClick={() => setShowDeleteConfirm(lead)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Xóa">
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
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
                placeholder="Ví dụ: Website bán thời trang"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-600 mb-1.5">Loại khách hàng</label>
              <CustomCombobox
                value={form.customerType}
                onChange={(v) => setForm((f) => ({ ...f, customerType: v as CustomerType }))}
                options={[
                  { value: "individual", label: "Cá nhân" },
                  { value: "company", label: "Công ty" },
                ]}
              />
            </div>
            {form.customerType === "company" ? (
              <>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-600 mb-1.5">Tên công ty</label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
                    placeholder="Công ty TNHH ABC"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-600 mb-1.5">Người đại diện / liên hệ</label>
                  <input type="text" value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20" placeholder="Nguyễn Văn A" />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-black text-gray-600 mb-1.5">Họ tên khách hàng</label>
                <input type="text" value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20" />
              </div>
            )}
            <div>
              <label className="block text-xs font-black text-gray-600 mb-1.5">Số điện thoại</label>
              <input type="text" value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20" />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-600 mb-1.5">Email</label>
              <input type="email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20" />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-600 mb-1.5">Địa chỉ</label>
              <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20" placeholder="Tuỳ chọn" />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-600 mb-1.5">MST</label>
              <input type="text" value={form.taxId} onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20" placeholder="Tuỳ chọn" />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-600 mb-1.5">Ngân sách ước tính</label>
              <input type="text" value={form.budgetEstimate} onChange={(e) => setForm((f) => ({ ...f, budgetEstimate: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20" placeholder="50-70 triệu" />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-600 mb-1.5">Trạng thái</label>
              <CustomCombobox value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v as LeadStatus }))} options={Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))} />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-600 mb-1.5">Giao cho</label>
              <CustomCombobox value={form.assignedToId} onChange={(v) => setForm((f) => ({ ...f, assignedToId: v }))} placeholder="Chọn nhân viên" options={(employees || []).map((e) => ({ value: e.id, label: e.name, desc: e.department }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-600 mb-1.5">Ghi chú sơ bộ</label>
            <textarea value={form.roughNotes} onChange={(e) => setForm((f) => ({ ...f, roughNotes: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 resize-none" />
          </div>
        </div>
      </Modal>

      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => void handleDelete(showDeleteConfirm)}
          title="Xóa Lead?"
          message={`Bạn chắc chắn muốn xóa lead "${showDeleteConfirm.name}"?`}
          confirmText="Xóa"
          type="danger"
        />
      )}
    </div>
  )
}
