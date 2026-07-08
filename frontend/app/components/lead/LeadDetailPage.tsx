import React, { useEffect, useState } from "react"
import {
  ArrowLeft, CheckCircle2, Clock, Copy, DollarSign, FileText, Loader2, Send, ExternalLink, Mail, MessageCircle, Lock, RefreshCw, Plus, FolderKanban
} from "lucide-react"
import { Lead, FormType, Project, Employee } from "../../types"
import { CustomCombobox } from "../ui/CustomCombobox"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import ConfirmModal from "../ui/ConfirmModal"
import { Modal, ModalCancelButton, ModalSubmitButton } from "../ui/Modal"
import { QuoteGenerator } from "./QuoteGenerator"
import { ProjectRequirementsTab } from "../du-an/ProjectRequirementsTab"
import { LeadContractTab } from "./LeadContractTab"
import { LeadDocumentsTab } from "./LeadDocumentsTab"
import { LeadSolutionTab } from "./LeadSolutionTab"
import { FORM_STATUS_CONFIG, STATUS_CONFIG } from "./leadConstants"
import { CUSTOMER_TYPE_LABELS, normalizeCustomerDisplay } from "./leadCustomer"
import { buildPublicFormLink } from "./leadFormLink"
import { buildRequirementFormsFromLead, isWaitingForFormSubmit, leadHasRequirement } from "./leadRequirementForm"
import { api, QuotePayload, ContractPayload, LeadDocumentRecord } from "../../../lib/api"
import { useLeadRealtime } from "../../hooks/useLeadRealtime"

type DetailTab = "info" | "form" | "requirement" | "solution" | "quote" | "contract" | "documents"

export function LeadDetailPage({
  leadId,
  onBack,
  onNavigateToProject,
  selectedBranch,
}: {
  leadId: string
  onBack: () => void
  onNavigateToProject?: (projectId: string) => void
  selectedBranch?: string
}) {
  const { lead, setLead, loading, syncing, error, setError, refresh: refreshLead } = useLeadRealtime(leadId)
  const [activeTab, setActiveTab] = useState<DetailTab>("info")
  const [newNote, setNewNote] = useState("")
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteContent, setEditingNoteContent] = useState("")
  const [copied, setCopied] = useState(false)
  const [hasQuote, setHasQuote] = useState(false)
  const [hasContract, setHasContract] = useState(false)
  const [quoteRestore, setQuoteRestore] = useState<QuotePayload | null>(null)
  const [quoteRestoreDoc, setQuoteRestoreDoc] = useState<LeadDocumentRecord | null>(null)
  const [quoteRestoreToken, setQuoteRestoreToken] = useState(0)
  const [contractRestore, setContractRestore] = useState<ContractPayload | null>(null)
  const [contractRestoreDoc, setContractRestoreDoc] = useState<LeadDocumentRecord | null>(null)
  const [contractRestoreToken, setContractRestoreToken] = useState(0)
  const [documentsRefresh, setDocumentsRefresh] = useState(0)
  const [selectedFormType, setSelectedFormType] = useState<FormType>("landing_page")
  const [savingForm, setSavingForm] = useState(false)
  const [revokingForm, setRevokingForm] = useState(false)
  const [addingRequirement, setAddingRequirement] = useState(false)
  const [newRequirementTitle, setNewRequirementTitle] = useState("")
  const [newRequirementNotes, setNewRequirementNotes] = useState("")
  const [showRequirementModal, setShowRequirementModal] = useState(false)
  const [leadProjects, setLeadProjects] = useState<Project[]>([])
  const [converting, setConverting] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projectManagerId, setProjectManagerId] = useState("")
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    type?: "danger" | "warning" | "info"
    onConfirm: () => void
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  })

  useEffect(() => {
    if (lead?.formType) setSelectedFormType(lead.formType)
  }, [lead?.formType])

  useEffect(() => {
    api.employees.list().then(d => setEmployees(d as Employee[])).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    api.leadDocuments.list(leadId).then((docs) => {
      if (cancelled) return
      setHasQuote(docs.some((d) => d.type === "quote"))
      setHasContract(docs.some((d) => d.type === "contract"))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [leadId, documentsRefresh])

  useEffect(() => {
    let cancelled = false
    if (!lead?.convertedProjectId) {
      setLeadProjects([])
      return
    }
    api.projects.getById(lead.convertedProjectId).then((row) => {
      if (!cancelled && row) setLeadProjects([row as Project])
    }).catch(() => {})
    return () => { cancelled = true }
  }, [lead?.convertedProjectId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 gap-2">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm font-semibold">Đang tải lead…</span>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-red-600 font-semibold">{error || "Không tìm thấy lead"}</p>
        <Button variant="outline" onClick={onBack} className="text-xs font-bold">
          <ArrowLeft size={14} className="mr-1.5" /> Quay lại danh sách
        </Button>
      </div>
    )
  }

  const status = lead.convertedProjectId ? "converted" : hasContract ? "contracted" : hasQuote ? "quoted" : lead.status
  const statusConfig = STATUS_CONFIG[status]
  const StatusIcon = statusConfig.icon
  const formConfig = lead.formStatus ? FORM_STATUS_CONFIG[lead.formStatus] : null
  const FormIcon = formConfig?.icon
  const activeFormType = (lead.formType || selectedFormType) as FormType
  const formLink = lead.formToken ? buildPublicFormLink(lead.id, lead.formToken, activeFormType) : ""
  const formLinkRevoked = Boolean(lead.formLinkRevokedAt)
  const formLinkActive = Boolean(lead.formToken) && !formLinkRevoked && lead.formStatus !== "completed"
  const requirementForms = buildRequirementFormsFromLead(lead)
  const formCompleted = lead.formStatus === "completed"
  const hasRequirement = leadHasRequirement(lead)
  const canConvert = hasRequirement && hasContract

  const hasProject = Boolean(lead.convertedProjectId)
  const projectCount = hasProject ? 1 : 0
  const workflowSteps = [
    { key: "form", label: "Gửi form", done: !!lead.formStatus && lead.formStatus !== "not_sent" },
    { key: "requirement", label: "Phiếu yêu cầu", done: hasRequirement },
    { key: "quote", label: "Báo giá", done: hasQuote },
    { key: "contract", label: "Hợp đồng", done: hasContract },
    { key: "project", label: "Dự án", done: projectCount > 0 },
  ] as const

  const formTypeOptions = [
    { value: "landing_page", label: "Landing Page" },
    { value: "ecommerce", label: "Website Bán Hàng (E-commerce)" },
    { value: "company_profile", label: "Website Giới Thiệu Công Ty" },
  ]

  const handleSendForm = async () => {
    setSavingForm(true)
    setError("")
    try {
      const result = await api.leads.issueFormLink(lead.id, selectedFormType)
      setLead(result.lead)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gửi form thất bại")
    } finally {
      setSavingForm(false)
    }
  }

  const handleReissueForm = () => {
    const msg = formCompleted
      ? "Tạo link mới? Khách có thể điền lại form. Link cũ sẽ hết hiệu lực."
      : "Tạo link mới? Link hiện tại sẽ hết hiệu lực ngay."
      
    setConfirmConfig({
      isOpen: true,
      title: "Xác nhận tạo link mới",
      message: msg,
      type: "warning",
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        await handleSendForm()
      }
    })
  }

  const handleRevokeForm = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Xác nhận khóa link",
      message: "Khóa link hiện tại? Khách sẽ không mở được cho đến khi bạn tạo link mới.",
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        setRevokingForm(true)
        setError("")
        try {
          const updated = await api.leads.revokeFormLink(lead.id)
          setLead(updated)
        } catch (e) {
          setError(e instanceof Error ? e.message : "Khóa link thất bại")
        } finally {
          setRevokingForm(false)
        }
      }
    })
  }

  const handleAddRequirement = async () => {
    if (!newRequirementNotes.trim()) {
      setError("Vui lòng nhập nội dung yêu cầu bổ sung")
      return
    }
    setAddingRequirement(true)
    setError("")
    try {
      const result = await api.leads.addRequirementRound(lead.id, {
        title: newRequirementTitle.trim() || undefined,
        notes: newRequirementNotes.trim(),
      })
      setLead(result.lead)
      setNewRequirementTitle("")
      setNewRequirementNotes("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thêm yêu cầu thất bại")
    } finally {
      setAddingRequirement(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    try {
      const updated = await api.leads.addNote(lead.id, newNote.trim())
      setLead(updated)
      setNewNote("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thêm ghi chú thất bại")
    }
  }

  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteContent.trim()) return
    try {
      const updated = await api.leads.updateNote(lead.id, noteId, editingNoteContent.trim())
      setLead(updated)
      setEditingNoteId(null)
      setEditingNoteContent("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cập nhật ghi chú thất bại")
    }
  }

  const handleDeleteNote = (noteId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Xác nhận xóa ghi chú",
      message: "Bạn có chắc chắn muốn xóa ghi chú này không?",
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        try {
          const updated = await api.leads.deleteNote(lead.id, noteId)
          setLead(updated)
        } catch (e) {
          setError(e instanceof Error ? e.message : "Xóa ghi chú thất bại")
        }
      }
    })
  }

  const filteredEmployees = employees.filter(e => {
    if (!selectedBranch || selectedBranch === "all") return true
    return e.branchId === selectedBranch
  })

  const openProjectModal = () => {
    setProjectName(lead.name || "")
    setProjectManagerId(lead.assignedToId || "")
    setShowProjectModal(true)
  }

  const handleConvertToProject = async () => {
    const name = projectName.trim()
    if (!name) {
      setError("Vui lòng nhập tên dự án")
      return
    }
    if (!projectManagerId) {
      setError("Vui lòng chọn người quản lý dự án")
      return
    }
    if (!canConvert || converting) return
    setConverting(true)
    setError("")
    try {
      const result = await api.leads.convertToProject(lead.id, { name, managerId: projectManagerId })
      setLead(result.lead)
      setShowProjectModal(false)
      if (result.project?.id) {
        setLeadProjects([result.project])
        onNavigateToProject?.(result.project.id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chuyển dự án thất bại")
    } finally {
      setConverting(false)
    }
  }

  const handleCopyLink = async () => {
    if (!formLink) return
    try {
      await navigator.clipboard.writeText(formLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const tabs: { id: DetailTab; label: string }[] = [
    { id: "info", label: "Thông tin" },
    { id: "form", label: "Form yêu cầu" },
    { id: "requirement", label: "Phiếu yêu cầu" },
    { id: "solution", label: "Giải pháp" },
    { id: "quote", label: "Báo giá" },
    { id: "contract", label: "Hợp đồng" },
    { id: "documents", label: "Tài liệu" },
  ]

  return (
    <div className="space-y-5">
      <div className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px] p-5 rounded-2xl text-white shadow-md">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-black text-white/60 font-mono tracking-wider">{lead.code}</p>
            <h2 className="text-xl font-black tracking-tight mt-1">{lead.name}</h2>
            {lead.customerCode && (
              <p className="text-[10px] text-white/70 mt-1 font-mono">Khách: {lead.customerCode}{lead.customerDisplayName ? ` · ${lead.customerDisplayName}` : ""}</p>
            )}
            {lead.assignedToName && (
              <p className="text-xs text-white/75 mt-2">Sales phụ trách: {lead.assignedToName}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isWaitingForFormSubmit(lead) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-white/15 text-white border border-white/25">
                <RefreshCw size={10} className={syncing ? "animate-spin" : ""} />
                Đang chờ khách gửi form
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border bg-white/95 ${statusConfig.cls}`}>
              <StatusIcon size={11} /> {statusConfig.label}
            </span>
            {!hasProject && (
              <button
                type="button"
                disabled={converting || !canConvert}
                onClick={openProjectModal}
                title={!canConvert ? "Hoàn thiện hợp đồng để tạo dự án" : "1 lead = 1 dự án"}
                className={`px-3.5 py-1.5 text-[11px] font-black rounded-xl transition-colors inline-flex items-center gap-1.5 ${
                  canConvert
                    ? "bg-white text-[#C62828] hover:bg-white/90"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                }`}
              >
                {converting && <Loader2 size={12} className="animate-spin" />}
                {canConvert ? "Tạo dự án" : "Hoàn thiện hợp đồng để tạo dự án"}
              </button>
            )}
            {hasProject && lead.convertedProjectId && (
              <button
                type="button"
                onClick={() => onNavigateToProject?.(lead.convertedProjectId!)}
                className="px-3.5 py-1.5 text-[11px] font-black bg-white/90 text-emerald-800 rounded-xl hover:bg-white transition-colors inline-flex items-center gap-1"
              >
                <FolderKanban size={12} />
                Mở dự án
              </button>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-[#C62828] transition-colors"
      >
        <ArrowLeft size={16} /> Quay lại danh sách Lead
      </button>

      <div className="flex items-center gap-1 flex-wrap bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
        {workflowSteps.map((step, i) => (
          <React.Fragment key={step.key}>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${step.done ? "text-green-700" : "text-gray-400"}`}>
              {step.done ? <CheckCircle2 size={11} /> : <Clock size={11} />}
              {step.label}
            </span>
            {i < workflowSteps.length - 1 && <span className="text-gray-300 text-[10px]">→</span>}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-0.5 border-b border-gray-100 bg-gray-50 p-1 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-[11px] font-black rounded-lg transition-all ${
                activeTab === tab.id ? "bg-white text-[#C62828] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 md:p-6">
          {error && <p className="text-sm text-red-600 font-semibold mb-4">{error}</p>}

          {activeTab === "info" && (() => {
            const customer = normalizeCustomerDisplay(lead)
            return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Thông tin khách hàng</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                    {CUSTOMER_TYPE_LABELS[customer.type]}
                  </span>
                </div>
                <div className="space-y-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  {customer.type === "company" ? (
                    <>
                      <div>
                        <p className="text-[11px] text-gray-400 mb-1">Tên công ty</p>
                        <p className="text-sm text-gray-800 font-semibold">{customer.companyName || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 mb-1">Người đại diện / liên hệ</p>
                        <p className="text-sm text-gray-800 font-semibold">{customer.contactName || "—"}</p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">Họ tên</p>
                      <p className="text-sm text-gray-800 font-semibold">{customer.contactName || "—"}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1">Số điện thoại</p>
                    <p className="text-sm text-gray-800 font-semibold">{lead.contactPhone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1">Email</p>
                    <p className="text-sm text-gray-800 font-semibold">{lead.contactEmail || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1">Địa chỉ</p>
                    <p className="text-sm text-gray-800 font-semibold">{lead.address || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1">MST</p>
                    <p className="text-sm text-gray-800 font-semibold">{lead.taxId || "—"}</p>
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
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 min-h-[120px]">
                  {lead.roughNotes
                    ? <p className="text-sm text-gray-700 leading-relaxed">{lead.roughNotes}</p>
                    : <p className="text-sm text-gray-400 italic">Chưa có ghi chú</p>}
                </div>
              </div>
              <div className="md:col-span-2 space-y-4 mt-2">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Ghi chú nội bộ</h4>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                  <div className="space-y-3">
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Nhập nội dung ghi chú mới..."
                      className="resize-none bg-white"
                      rows={2}
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
                <div className="space-y-3 mt-4">
                  {(lead.notes || []).length === 0 ? (
                    <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-sm font-medium">Chưa có ghi chú nội bộ</p>
                    </div>
                  ) : (
                    (lead.notes || []).map((note) => (
                      <div key={note.id} className="bg-white border border-gray-100 rounded-2xl p-4 relative group">
                        {editingNoteId === note.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editingNoteContent}
                              onChange={(e) => setEditingNoteContent(e.target.value)}
                              className="resize-none bg-white text-sm"
                              rows={2}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() => {
                                  setEditingNoteId(null)
                                  setEditingNoteContent("")
                                }}
                                variant="outline"
                                className="text-[11px] font-bold px-3 py-1.5 h-auto rounded-xl"
                              >
                                Hủy
                              </Button>
                              <Button
                                onClick={() => handleUpdateNote(note.id)}
                                className="bg-[#C62828] hover:bg-[#B71C1C] text-white text-[11px] font-bold px-3 py-1.5 h-auto rounded-xl"
                                disabled={!editingNoteContent.trim() || editingNoteContent === note.content}
                              >
                                Lưu
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-[10px] text-gray-400">
                                {new Date(note.createdAt).toLocaleString("vi-VN")}
                                {note.updatedAt && note.updatedAt !== note.createdAt && " (Đã sửa)"}
                              </p>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingNoteId(note.id)
                                    setEditingNoteContent(note.content)
                                  }}
                                  className="text-[10px] font-bold text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                  Sửa
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-[10px] font-bold text-gray-500 hover:text-red-600 transition-colors"
                                >
                                  Xóa
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="md:col-span-2 space-y-3 mt-2">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Dự án (1 lead = 1 dự án)</h4>
                {hasProject && leadProjects[0] ? (
                  <button
                    type="button"
                    onClick={() => onNavigateToProject?.(leadProjects[0].id)}
                    className="text-left w-full rounded-xl border border-gray-100 bg-gray-50 hover:border-[#C62828]/30 hover:bg-red-50/30 p-3 transition-colors"
                  >
                    <p className="text-[10px] font-mono text-gray-400">{leadProjects[0].id}</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{leadProjects[0].name}</p>
                  </button>
                ) : (
                  <p className="text-sm text-gray-400 italic">Chưa có dự án — cần phiếu yêu cầu + hợp đồng, rồi bấm Tạo dự án.</p>
                )}
                {lead.customerCode && (
                  <p className="text-xs text-gray-500">Khách hàng <span className="font-mono font-bold">{lead.customerCode}</span> có thể có nhiều lead/deal khác.</p>
                )}
              </div>
            </div>
            )
          })()}

          {activeTab === "form" && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 leading-relaxed">
                <p className="font-black mb-1">Quy tắc link form</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-800">
                  <li>Mỗi lead chỉ có <strong>1 link đang hoạt động</strong> — tạo link mới thì link cũ hết hiệu lực.</li>
                  <li>Khách gửi xong → link tự khóa; dữ liệu vẫn lưu, không ảnh hưởng báo giá/lead.</li>
                  <li>Cần khách điền lại → bấm <strong>Tạo link mới</strong>.</li>
                  <li>Khóa thủ công → khách không mở được; tạo link mới khi cần gửi lại.</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-4">Chọn loại form</h4>
                <CustomCombobox
                  value={selectedFormType}
                  onChange={async (val) => {
                    const newType = val as FormType
                    setSelectedFormType(newType)
                    try {
                      const updated = await api.leads.update(lead.id, {
                        formType: newType,
                      })
                      setLead(updated)
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Cập nhật loại form thất bại")
                    }
                  }}
                  placeholder="Chọn loại website"
                  options={formTypeOptions}
                />
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 border border-gray-100 flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Trạng thái form</span>
                  {formConfig && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border ${formConfig.cls}`}>
                      {FormIcon && <FormIcon size={11} />} {formConfig.label}
                    </span>
                  )}
                  {formLinkRevoked && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border bg-red-50 text-red-700 border-red-200">
                      <Lock size={11} /> Link đã khóa
                    </span>
                  )}
                  {formCompleted && !formLinkRevoked && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border bg-amber-50 text-amber-800 border-amber-200">
                      <CheckCircle2 size={11} /> Đã gửi — link tự khóa
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                {(!lead.formStatus || lead.formStatus === "not_sent" || !lead.formToken) && (
                  <Button
                    onClick={handleSendForm}
                    disabled={savingForm}
                    className="bg-[#C62828] hover:bg-[#B71C1C] text-white text-[11px] font-black px-4 py-2 rounded-xl"
                  >
                    {savingForm ? <Loader2 size={13} className="mr-1 animate-spin" /> : <Send size={13} className="mr-1" />}
                    Gửi form cho khách
                  </Button>
                )}
                {lead.formToken && (formLinkRevoked || formCompleted) && (
                  <Button
                    onClick={handleReissueForm}
                    disabled={savingForm}
                    variant="outline"
                    className="text-[11px] font-black px-4 py-2 rounded-xl"
                  >
                    {savingForm ? <Loader2 size={13} className="mr-1 animate-spin" /> : <RefreshCw size={13} className="mr-1" />}
                    Tạo link mới
                  </Button>
                )}
                {formLinkActive && (
                  <Button
                    onClick={handleRevokeForm}
                    disabled={revokingForm}
                    variant="outline"
                    className="text-[11px] font-black px-4 py-2 rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                  >
                    {revokingForm ? <Loader2 size={13} className="mr-1 animate-spin" /> : <Lock size={13} className="mr-1" />}
                    Khóa link
                  </Button>
                )}
                </div>
              </div>
              {lead.formToken && lead.formStatus && lead.formStatus !== "not_sent" && formLink && (
                <div className="bg-white border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-[11px] font-black text-gray-600">Link form</h5>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => window.open(formLink, '_blank')}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 hover:text-[#C62828] transition-colors"
                      >
                        <ExternalLink size={12} />
                        Mở link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const phone = lead.contactPhone?.replace(/[^0-9]/g, '') || ''
                          window.open(`https://zalo.me/${phone}`, '_blank')
                        }}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <MessageCircle size={12} />
                        Zalo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const subject = encodeURIComponent("Yêu cầu cung cấp thông tin dự án")
                          const body = encodeURIComponent(`Chào ${lead.contactName || 'bạn'},\n\nVui lòng truy cập đường dẫn sau để điền thông tin yêu cầu dự án:\n${formLink}\n\nTrân trọng,`)
                          window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${lead.contactEmail || ''}&su=${subject}&body=${body}`, '_blank')
                        }}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Mail size={12} />
                        Gmail
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 hover:text-[#C62828] transition-colors"
                      >
                        {copied ? <CheckCircle2 size={12} className="text-green-600" /> : <Copy size={12} />}
                        {copied ? "Đã sao chép" : "Sao chép link"}
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-700 break-all font-mono">{formLink}</p>
                    {!formLinkActive && (
                      <p className="text-[11px] text-amber-700 mt-2">
                        Link này không còn dùng được. Tạo link mới để gửi cho khách.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "requirement" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-800">Danh sách yêu cầu bổ sung</p>
                <Button onClick={() => setShowRequirementModal(true)} size="sm" className="bg-[#C62828] hover:bg-[#B71C1C] text-[11px] font-bold">
                  <Plus size={14} className="mr-1" /> Thêm yêu cầu
                </Button>
              </div>

              <Modal
                open={showRequirementModal}
                onClose={() => setShowRequirementModal(false)}
                title="Thêm yêu cầu"
                icon={FileText}
                footer={
                  <>
                    <ModalCancelButton onClick={() => setShowRequirementModal(false)} />
                    <ModalSubmitButton 
                      onClick={() => {
                        void handleAddRequirement()
                        setShowRequirementModal(false)
                      }}
                      disabled={addingRequirement || !newRequirementNotes.trim()}
                      loading={addingRequirement}
                      label="Lưu yêu cầu"
                    />
                  </>
                }
              >
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Tiêu đề (tuỳ chọn)</label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
                      placeholder="VD: Bổ sung module CRM"
                      value={newRequirementTitle}
                      onChange={(e) => setNewRequirementTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Nội dung <span className="text-red-500">*</span></label>
                    <textarea
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
                      placeholder="Chi tiết yêu cầu bổ sung..."
                      value={newRequirementNotes}
                      onChange={(e) => setNewRequirementNotes(e.target.value)}
                    />
                  </div>
                </div>
              </Modal>

              <ProjectRequirementsTab requirementForms={requirementForms} />
            </div>
          )}

          {activeTab === "solution" && (
            <LeadSolutionTab leadId={lead.id} />
          )}

          {activeTab === "quote" && (
            <QuoteGenerator
              lead={lead}
              onSaved={() => {
                setQuoteRestoreDoc(null)
                setDocumentsRefresh((k) => k + 1)
              }}
              externalRestore={quoteRestore}
              restoreToken={quoteRestoreToken}
              editingDocId={quoteRestoreDoc?.id ?? null}
              editingDocLabel={quoteRestoreDoc?.label}
            />
          )}

          {activeTab === "contract" && (
            <LeadContractTab
              lead={lead}
              formCompleted={formCompleted}
              hasQuote={hasQuote}
              onCreated={() => setDocumentsRefresh((k) => k + 1)}
              externalRestore={contractRestore}
              restoreDoc={contractRestoreDoc}
              restoreToken={contractRestoreToken}
              onEditClose={() => {
                setContractRestore(null)
                setContractRestoreDoc(null)
              }}
            />
          )}

          {activeTab === "documents" && (
            <LeadDocumentsTab
              leadId={lead.id}
              lead={lead}
              onRestoreQuote={(payload, doc) => {
                setQuoteRestore(payload)
                setQuoteRestoreDoc(doc)
                setQuoteRestoreToken((k) => k + 1)
                setActiveTab("quote")
              }}
              onRestoreContract={(payload, doc) => {
                setContractRestore(payload)
                setContractRestoreDoc(doc)
                setContractRestoreToken((k) => k + 1)
                setActiveTab("contract")
              }}
              onDocumentsLoaded={(docs) => {
                setHasQuote(docs.some((d) => d.type === "quote"))
                setHasContract(docs.some((d) => d.type === "contract"))
              }}
            />
          )}


        </div>
      </div>

      <Modal
        open={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        title="Tạo dự án từ Lead"
        footer={
          <>
            <ModalCancelButton onClick={() => setShowProjectModal(false)} />
            <ModalSubmitButton onClick={() => void handleConvertToProject()} loading={converting} label="Tạo dự án" />
          </>
        }
      >
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500">Mỗi lead chỉ tạo <strong>1 dự án</strong>. Khách quay lại deal mới → tạo lead mới.</p>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Tên dự án *</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
              placeholder="VD: Website bán hàng ABC Shop"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Người quản lý dự án *</label>
            <CustomCombobox
              value={projectManagerId}
              onChange={(v) => setProjectManagerId(v)}
              placeholder="Chọn người quản lý dự án"
              options={filteredEmployees.map((e) => ({ value: e.id, label: e.name, desc: e.department }))}
            />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
