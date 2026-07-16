import React, { useEffect, useRef, useState } from "react"
import { ArrowRight, CheckCircle2, Clock, FileSignature, Loader2, Paperclip, Plus, Upload, Eye, Trash2, Download, RefreshCw, Pencil } from "lucide-react"
import { Lead } from "../../types"
import { Button } from "../ui/button"
import { TemplateOverridePanel } from "./TemplateOverridePanel"
import { ContractEditor } from "./ContractEditor"
import { api, ContractPayload, LeadDocumentRecord } from "../../../lib/api"
import { leadHasRequirement } from "./leadRequirementForm"
import { resolvePartyAFromLead } from "./leadContractParty"
import { Modal } from "../ui/Modal"
import ConfirmModal from "../ui/ConfirmModal"
import { DocxFilePreview } from "./DocxFilePreview"
import { CustomSelect } from "../ui/CustomSelect"
import { formatDate, formatSize } from "./leadDocumentDisplay"

const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]"

function AppendixCard({
  doc,
  parentLabel,
  onDownload,
  onPreview,
  onEdit,
  onDelete,
}: {
  doc: LeadDocumentRecord
  parentLabel?: string
  onDownload: (doc: LeadDocumentRecord) => void
  onPreview?: (doc: LeadDocumentRecord) => void
  onEdit?: (doc: LeadDocumentRecord) => void
  onDelete?: (doc: LeadDocumentRecord) => void
}) {
  const baseLabel = doc.label.split(" — ")[0]

  return (
    <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3.5">
      <div className="space-y-2">
        <div className="flex items-start gap-2.5">
          <div className="rounded-xl bg-red-50 p-2.5 text-[#C62828] shrink-0">
            <Paperclip size={18} />
          </div>
          <div className="min-w-0">
            <h5 className="text-sm font-bold text-gray-800 line-clamp-2" title={doc.label}>
              {baseLabel}
            </h5>
            <p className="text-[10px] text-gray-400 mt-1">
              v{doc.version} · {formatSize(doc.fileSize)}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 border border-gray-100/60 p-2 flex flex-col gap-1 text-[10px] text-gray-500">
          <div className="flex justify-between gap-2">
            <span className="text-gray-400">HĐ gốc:</span>
            <span className="font-bold text-gray-700 truncate max-w-[150px]" title={parentLabel || "Chưa gắn"}>
              {parentLabel || "Chưa gắn"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Người tải:</span>
            <span className="font-medium text-gray-600">{doc.createdByName || "Admin"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Thời gian:</span>
            <span className="font-medium text-gray-600">{formatDate(doc.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 w-full">
        {onPreview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 text-[10px] font-bold h-7 px-1.5 hover:bg-red-50 hover:text-[#C62828] hover:border-red-200"
            onClick={() => onPreview(doc)}
          >
            Xem
          </Button>
        )}
        {onEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 text-[10px] font-bold h-7 px-1.5 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
            onClick={() => onEdit(doc)}
          >
            Sửa
          </Button>
        )}
        {doc.hasFile ?? doc.fileSize ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 text-[10px] font-bold h-7 px-1.5 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
            onClick={() => onDownload(doc)}
          >
            Tải
          </Button>
        ) : null}
        {onDelete && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 text-[10px] font-bold h-7 px-1.5 text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200"
            onClick={() => onDelete(doc)}
          >
            Xóa
          </Button>
        )}
      </div>
    </div>
  )
}

export function LeadContractTab({
  lead,
  hasQuote,
  formCompleted,
  onCreated,
  externalRestore,
  restoreDoc,
  restoreToken,
  onEditClose,
}: {
  lead: Lead
  hasQuote?: boolean
  formCompleted?: boolean
  onCreated?: () => void
  externalRestore?: ContractPayload | null
  restoreDoc?: LeadDocumentRecord | null
  restoreToken?: number
  onEditClose?: () => void
}) {
  const [quotes, setQuotes] = useState<LeadDocumentRecord[]>([])
  const [contracts, setContracts] = useState<LeadDocumentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [creatingAppendix, setCreatingAppendix] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [uploadingContract, setUploadingContract] = useState(false)
  const [selectedQuoteId, setSelectedQuoteId] = useState("")
  const [selectedContractId, setSelectedContractId] = useState("")
  const [contractLabel, setContractLabel] = useState("")
  const contractLabelTouched = useRef(false)
  const [appendixLabel, setAppendixLabel] = useState("")
  const [appendixFile, setAppendixFile] = useState<File | null>(null)
  const appendixInputRef = useRef<HTMLInputElement>(null)
  const [partyA, setPartyA] = useState(() => resolvePartyAFromLead(lead))
  const [uploadContractLabel, setUploadContractLabel] = useState("")
  const [activeTab, setActiveTab] = useState<"generate" | "upload">("generate")
  const [contractMode, setContractMode] = useState<"contract" | "appendix">("contract")
  const [previewDoc, setPreviewDoc] = useState<LeadDocumentRecord | null>(null)
  const [previewKey, setPreviewKey] = useState(0)
  const [deleteTargetDoc, setDeleteTargetDoc] = useState<LeadDocumentRecord | null>(null)
  const [isAddAppendixOpen, setIsAddAppendixOpen] = useState(false)
  const [appendixFiles, setAppendixFiles] = useState<File[]>([])
  const [appendixLabels, setAppendixLabels] = useState<string[]>([])
  const [editingAppendix, setEditingAppendix] = useState<LeadDocumentRecord | null>(null)
  const [editAppendixLabel, setEditAppendixLabel] = useState("")
  const [editAppendixParentId, setEditAppendixParentId] = useState("")
  const [filterContractId, setFilterContractId] = useState("all")
  const [savingAppendix, setSavingAppendix] = useState(false)

  useEffect(() => {
    setPartyA(resolvePartyAFromLead(lead))
  }, [lead.id, lead.companyName, lead.contactName, lead.customerType, lead.address, lead.taxId, lead.requirementFormPayload])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const all = await api.leadDocuments.list(lead.id)
        if (cancelled) return
        const q = all.filter((d) => d.type === "quote")
        const c = all.filter((d) => d.type === "contract")
        setQuotes(q)
        setContracts(c)
        setSelectedQuoteId(q[0]?.id ?? "")
        const mainContracts = c.filter((d) => !d.parentDocumentId && !d.isAppendix)
        setSelectedContractId(mainContracts[0]?.id ?? "")
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Không tải được báo giá")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [lead.id])

  const mainContracts = contracts.filter((c) => !c.parentDocumentId && !c.isAppendix)

  useEffect(() => {
    if (!selectedContractId && mainContracts.length > 0) {
      setSelectedContractId(mainContracts[0].id)
    }
  }, [mainContracts, selectedContractId])

  useEffect(() => {
    const quote = quotes.find((q) => q.id === selectedQuoteId)
    if (!quote || contractLabelTouched.current) return
    const sameQuoteContracts = mainContracts.filter(
      (c) => c.label.includes(quote.label) || c.label.includes("Báo giá"),
    )
    const n = sameQuoteContracts.length + 1
    const base = `Hợp đồng từ ${quote.label}`
    setContractLabel(n > 1 ? `${base} (${n})` : base)
  }, [selectedQuoteId, quotes, mainContracts])

  useEffect(() => {
    const quote = quotes.find((q) => q.id === selectedQuoteId)
    if (quote?.uploadedFile) {
      setActiveTab("upload")
    } else {
      setActiveTab("generate")
    }
  }, [selectedQuoteId, quotes])

  const handleCreate = async () => {
    if (!selectedQuoteId) return
    const label = contractLabel.trim()
    if (!label) {
      setError("Vui lòng nhập tên hợp đồng")
      return
    }
    const isDuplicate = mainContracts.some((c) => c.label.toLowerCase() === label.toLowerCase())
    if (isDuplicate) {
      setError("Tên hợp đồng gốc đã tồn tại, vui lòng đặt tên khác.")
      return
    }
    setCreating(true)
    setError("")
    setSuccess("")
    try {
      const saved = await api.leadDocuments.createFromQuote(lead.id, {
        quoteDocId: selectedQuoteId,
        partyA,
        contractMeta: { contractPlace: "TP.HCM" },
        label,
      })
      setSuccess(`Đã tạo ${saved.label}. Xem tab Tài liệu để tải file.`)
      contractLabelTouched.current = false
      onCreated?.()
      const all = await api.leadDocuments.list(lead.id)
      const nextContracts = all.filter((d) => d.type === "contract")
      setContracts(nextContracts)
      const quote = quotes.find((q) => q.id === selectedQuoteId)
      if (quote) {
        const n = nextContracts.filter((c) => !c.parentDocumentId && !c.isAppendix && c.label.includes(quote.label)).length + 1
        setContractLabel(`Hợp đồng từ ${quote.label} (${n})`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tạo hợp đồng thất bại")
    } finally {
      setCreating(false)
    }
  }

  const reloadContracts = async () => {
    const all = await api.leadDocuments.list(lead.id)
    setContracts(all.filter((d) => d.type === "contract"))
  }

  const handleUploadContractDirect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isDoc = file.name.toLowerCase().endsWith(".docx") || file.name.toLowerCase().endsWith(".doc")
    const isPdf = file.name.toLowerCase().endsWith(".pdf")
    if (!isDoc && !isPdf) {
      setError("Chỉ hỗ trợ file Word (.doc, .docx) hoặc PDF (.pdf)")
      return
    }
    const targetLabel = uploadContractLabel.trim() || file.name.replace(/\.[^/.]+$/, "")
    const isDuplicate = mainContracts.some((c) => c.label.toLowerCase() === targetLabel.toLowerCase())
    if (isDuplicate) {
      setError("Tên hợp đồng gốc đã tồn tại, vui lòng chọn tên khác.")
      return
    }

    setUploadingContract(true)
    setError("")
    setSuccess("")
    try {
      const saved = await api.leadDocuments.uploadFile(lead.id, "contract", file, {
        label: uploadContractLabel.trim() || file.name.replace(/\.[^/.]+$/, ""),
      })
      setSuccess(`Đã tải lên ${saved.label}. Xem tab Tài liệu để tải file.`)
      onCreated?.()
      await reloadContracts()
    } catch (err: any) {
      setError(err.message || "Tải lên thất bại")
    } finally {
      setUploadingContract(false)
      e.target.value = ""
      setUploadContractLabel("")
    }
  }

  const handleCreateAppendix = async () => {
    if (!selectedContractId || !appendixFile) return
    setCreatingAppendix(true)
    setError("")
    setSuccess("")
    try {
      const saved = await api.leadDocuments.createAppendix(
        lead.id,
        selectedContractId,
        appendixFile,
        { label: appendixLabel.trim() || undefined },
      )
      setSuccess(`Đã gắn ${saved.label}. Xem tab Tài liệu để tải / xem trước.`)
      setAppendixLabel("")
      setAppendixFile(null)
      if (appendixInputRef.current) appendixInputRef.current.value = ""
      onCreated?.()
      await reloadContracts()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tải phụ lục thất bại")
    } finally {
      setCreatingAppendix(false)
    }
  }

  const handleCreateMultipleAppendices = async () => {
    if (!selectedContractId || appendixFiles.length === 0) return
    const allAppendices = contracts.filter((c) => c.parentDocumentId || c.isAppendix)
    for (let i = 0; i < appendixFiles.length; i++) {
      const file = appendixFiles[i]
      const label = appendixLabels[i]?.trim() || file.name.replace(/\.[^/.]+$/, "")
      const isDuplicate = allAppendices.some((pl) => {
        const base = pl.label.split(" — ")[0]
        return base.toLowerCase() === label.toLowerCase()
      })
      if (isDuplicate) {
        setError(`Tên phụ lục "${label}" đã tồn tại trên hệ thống.`)
        return
      }
    }

    setCreatingAppendix(true)
    setError("")
    setSuccess("")
    try {
      let successCount = 0
      for (let i = 0; i < appendixFiles.length; i++) {
        const file = appendixFiles[i]
        const label = appendixLabels[i]?.trim() || file.name.replace(/\.[^/.]+$/, "")
        await api.leadDocuments.createAppendix(
          lead.id,
          selectedContractId,
          file,
          { label },
        )
        successCount++
      }
      setSuccess(`Đã tải lên thành công ${successCount} phụ lục.`)
      setAppendixFiles([])
      setAppendixLabels([])
      setIsAddAppendixOpen(false)
      onCreated?.()
      await reloadContracts()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tải phụ lục thất bại")
    } finally {
      setCreatingAppendix(false)
    }
  }

  const handleEditAppendixSave = async () => {
    if (!editingAppendix) return
    const allAppendices = contracts.filter((c) => c.parentDocumentId || c.isAppendix)
    const label = editAppendixLabel.trim()
    const isDuplicate = allAppendices.some((pl) => {
      if (pl.id === editingAppendix.id) return false
      const base = pl.label.split(" — ")[0]
      return base.toLowerCase() === label.toLowerCase()
    })
    if (isDuplicate) {
      setError("Tên phụ lục đã tồn tại, vui lòng chọn tên khác.")
      return
    }

    setSavingAppendix(true)
    setError("")
    setSuccess("")
    try {
      await api.leadDocuments.update(lead.id, editingAppendix.id, {
        label: editAppendixLabel.trim(),
        parentDocumentId: editAppendixParentId || undefined,
      })
      setSuccess(`Đã cập nhật phụ lục thành công.`)
      setEditingAppendix(null)
      await reloadContracts()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cập nhật phụ lục thất bại")
    } finally {
      setSavingAppendix(false)
    }
  }

  const handleEditAppendixClick = (pl: LeadDocumentRecord) => {
    setEditingAppendix(pl)
    const baseLabel = pl.label.split(" — ")[0]
    setEditAppendixLabel(baseLabel)
    setEditAppendixParentId(pl.parentDocumentId || "")
  }

  const handleDownloadDoc = async (doc: LeadDocumentRecord) => {
    try {
      await api.leadDocuments.downloadFile(
        lead.id,
        doc.id,
        doc.downloadName || `${doc.label}.docx`,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tải file thất bại")
    }
  }

  const handleDeleteDoc = (doc: LeadDocumentRecord) => {
    setDeleteTargetDoc(doc)
  }

  const handleDeleteDocConfirm = async () => {
    if (!deleteTargetDoc) return
    try {
      await api.leadDocuments.delete(lead.id, deleteTargetDoc.id)
      if (previewDoc?.id === deleteTargetDoc.id) setPreviewDoc(null)
      setSuccess(`Đã xóa ${deleteTargetDoc.label}`)
      setDeleteTargetDoc(null)
      await reloadContracts()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xóa thất bại")
    }
  }

  const appendixCount = contracts.filter((c) => c.parentDocumentId || c.isAppendix).length
  const hasRequirement = leadHasRequirement(lead)
  const appendicesByParent = contracts.reduce<Record<string, LeadDocumentRecord[]>>((acc, doc) => {
    if (doc.parentDocumentId || doc.isAppendix) {
      const pid = doc.parentDocumentId || ""
      if (!acc[pid]) acc[pid] = []
      acc[pid].push(doc)
    }
    return acc
  }, {})
  for (const pid of Object.keys(appendicesByParent)) {
    appendicesByParent[pid].sort((a, b) => (a.version || 0) - (b.version || 0))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 gap-2 text-sm">
        <Loader2 size={16} className="animate-spin" /> Đang tải…
      </div>
    )
  }

  if (externalRestore && restoreDoc && restoreToken) {
    return (
      <ContractEditor
        leadId={lead.id}
        docId={restoreDoc.id}
        docLabel={restoreDoc.label}
        initialPayload={externalRestore}
        onSaved={() => {
          onCreated?.()
          onEditClose?.()
        }}
        onCancel={onEditClose}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-full max-w-xs">
        <button
          type="button"
          onClick={() => setContractMode("contract")}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all ${
            contractMode === "contract"
              ? "bg-white text-[#C62828] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Hợp đồng gốc
        </button>
        <button
          type="button"
          onClick={() => setContractMode("appendix")}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all ${
            contractMode === "appendix"
              ? "bg-white text-[#C62828] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Phụ lục
        </button>
      </div>

      {contractMode === "contract" && (
        <>
          <TemplateOverridePanel type="contract" compact />
          {quotes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <FileSignature size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-600">Chưa có báo giá đã lưu</p>
              <p className="text-xs text-gray-400 mt-1">Lưu báo giá ở tab Báo giá trước khi tạo hợp đồng gốc.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Chọn báo giá đã duyệt</p>
                <div className="space-y-2">
                  {quotes.map((q) => (
                    <label
                      key={q.id}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                        selectedQuoteId === q.id ? "border-[#C62828] bg-red-50/50" : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="quoteSource"
                        checked={selectedQuoteId === q.id}
                        onChange={() => setSelectedQuoteId(q.id)}
                        className="accent-[#C62828]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-800">{q.label}</p>
                        <p className="text-[10px] text-gray-400">
                          v{q.version} · {new Date(q.createdAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {(() => {
                const selectedQuote = quotes.find(q => q.id === selectedQuoteId);
                const isQuoteUploaded = !!selectedQuote?.uploadedFile;
                
                return (
                  <div className="space-y-4">
                    {!isQuoteUploaded && (
                      <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
                        <button
                          type="button"
                          onClick={() => setActiveTab("generate")}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                            activeTab === "generate"
                              ? "bg-white text-[#C62828] shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          Tạo từ báo giá
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("upload")}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                            activeTab === "upload"
                              ? "bg-white text-[#C62828] shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          <Upload size={12} className="mr-1" />
                          Tải file hợp đồng lên
                        </button>
                      </div>
                    )}

                    {activeTab === "upload" ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 max-w-md mx-auto my-4">
                        <div className="text-center mb-6">
                          <Upload size={40} className="mx-auto text-gray-400 mb-3" />
                          <h3 className="text-base font-black text-gray-800">Tải lên file hợp đồng</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {isQuoteUploaded
                              ? "Báo giá này được tải lên từ máy. Vui lòng tải lên file Word (.doc, .docx) hoặc PDF (.pdf) hợp đồng do bạn tự soạn thảo."
                              : "Vui lòng tải lên file Word (.doc, .docx) hoặc PDF (.pdf) hợp đồng do bạn tự soạn thảo."}
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                              Tên file hợp đồng <span className="text-red-500">*</span>
                            </label>
                            <input
                              className={inputCls}
                              value={uploadContractLabel}
                              onChange={(e) => setUploadContractLabel(e.target.value)}
                              placeholder="VD: Hợp đồng triển khai website — bản ký chính thức"
                            />
                          </div>
                          
                          <label className={`flex items-center justify-center gap-2 w-full py-4 ${!uploadContractLabel.trim() || uploadingContract ? "bg-gray-300 cursor-not-allowed" : "bg-[#C62828] cursor-pointer hover:bg-[#B71C1C]"} text-white rounded-xl text-base font-bold transition-colors shadow-sm`}>
                            {uploadingContract ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                            Chọn file & Tải lên
                            <input type="file" className="hidden" accept=".doc,.docx,.pdf" onChange={handleUploadContractDirect} disabled={uploadingContract || !uploadContractLabel.trim()} />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3 mt-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Bên A — Khách hàng</p>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {[
                              { key: "companyName", label: "Tên doanh nghiệp", span: 2 },
                              { key: "taxId", label: "MST" },
                              { key: "representative", label: "Đại diện" },
                              { key: "position", label: "Chức vụ" },
                              { key: "address", label: "Địa chỉ", span: 2 },
                            ].map((f) => (
                              <div key={f.key} className={f.span === 2 ? "sm:col-span-2" : ""}>
                                <label className="text-[10px] font-bold text-gray-500 mb-1 block">{f.label}</label>
                                <input
                                  className={inputCls}
                                  value={partyA[f.key as keyof typeof partyA] || ""}
                                  onChange={(e) => setPartyA((p) => ({ ...p, [f.key]: e.target.value }))}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-1.5 mt-4">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Tên hợp đồng (bắt buộc)</label>
                          <input
                            className={inputCls}
                            value={contractLabel}
                            onChange={(e) => {
                              contractLabelTouched.current = true
                              setContractLabel(e.target.value)
                            }}
                            placeholder="VD: Hợp đồng triển khai website — bản ký chính thức"
                          />
                          <p className="text-[10px] text-gray-400">
                            Mỗi lần tạo = 1 hợp đồng mới — đặt tên khác nhau để phân biệt trong tab Tài liệu.
                          </p>
                        </div>

                        <div className="flex justify-end mt-4">
                          <Button
                            type="button"
                            disabled={creating || !selectedQuoteId || !contractLabel.trim()}
                            onClick={handleCreate}
                            className="bg-[#C62828] hover:bg-[#B71C1C] text-white text-xs font-black"
                          >
                            {creating ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <ArrowRight size={14} className="mr-1.5" />}
                            Tạo hợp đồng từ báo giá
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {mainContracts.length > 0 && (
            <div className="rounded-2xl border border-green-100 bg-green-50/30 p-4 space-y-4">
              <p className="text-[10px] font-black text-green-800 uppercase tracking-wider">
                Hợp đồng gốc đã lưu ({mainContracts.length})
              </p>
              <ul className="space-y-3">
                {mainContracts.map((c) => (
                  <li key={c.id} className="rounded-xl bg-white/80 border border-green-100 p-3 flex justify-between items-center">
                    <p className="text-xs text-green-900 font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> {c.label}
                    </p>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">v{c.version}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {contractMode === "appendix" && (
        <>
          {mainContracts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <Paperclip size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-600">Chưa có hợp đồng gốc</p>
              <p className="text-xs text-gray-400 mt-1">Vui lòng tạo ít nhất một hợp đồng gốc trước khi quản lý phụ lục.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 border border-gray-100 p-3.5 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider shrink-0">Lọc hợp đồng:</span>
                  <CustomSelect
                    value={filterContractId}
                    onChange={(val) => setFilterContractId(val)}
                    options={[
                      { value: "all", label: `Tất cả Hợp đồng gốc (${mainContracts.length})` },
                      ...mainContracts.map((c) => ({ value: c.id, label: c.label })),
                    ]}
                    className="min-w-[200px]"
                  />
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    setAppendixFiles([])
                    setAppendixLabels([])
                    setIsAddAppendixOpen(true)
                  }}
                  className="bg-[#C62828] hover:bg-[#B71C1C] text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={14} /> Thêm phụ lục
                </Button>
              </div>

              {(() => {
                const allAppendices = contracts.filter((c) => c.parentDocumentId || c.isAppendix)
                const filteredAppendices = filterContractId === "all"
                  ? allAppendices
                  : allAppendices.filter((pl) => pl.parentDocumentId === filterContractId)

                if (filteredAppendices.length === 0) {
                  return (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                      <Paperclip size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-bold text-gray-500">Chưa có phụ lục nào</p>
                      <p className="text-xs text-gray-400 mt-1">Bấm nút "Thêm phụ lục" ở trên để tải lên.</p>
                    </div>
                  )
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAppendices.map((pl) => {
                      const parent = mainContracts.find((c) => c.id === pl.parentDocumentId)
                      return (
                        <AppendixCard
                          key={pl.id}
                          doc={pl}
                          parentLabel={parent?.label || "Mồ côi / Chưa gắn"}
                          onDownload={handleDownloadDoc}
                          onPreview={(doc) => { setPreviewDoc(doc); setPreviewKey((k) => k + 1) }}
                          onEdit={handleEditAppendixClick}
                          onDelete={handleDeleteDoc}
                        />
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}
        </>
      )}

      {success && <p className="text-sm text-green-700 font-semibold">{success}</p>}
      {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-2">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Điều kiện</p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-xs text-gray-600">
            {hasRequirement ? <CheckCircle2 size={14} className="text-green-600 shrink-0" /> : <Clock size={14} className="text-amber-500 shrink-0" />}
            Đã có phiếu yêu cầu
          </li>
          <li className="flex items-center gap-2 text-xs text-gray-600">
            {hasQuote ? <CheckCircle2 size={14} className="text-green-600 shrink-0" /> : <Clock size={14} className="text-amber-500 shrink-0" />}
            Đã có báo giá lưu
          </li>
        </ul>
      </div>

      <Modal
        open={isAddAppendixOpen}
        onClose={() => !creatingAppendix && setIsAddAppendixOpen(false)}
        title="Thêm phụ lục mới"
        icon={Plus}
        width="xl"
      >
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Hợp đồng gốc liên kết</label>
            <CustomSelect
              value={selectedContractId}
              onChange={(val) => setSelectedContractId(val)}
              options={mainContracts.map((c) => ({ value: c.id, label: c.label }))}
              disabled={creatingAppendix}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Chọn File Word (.docx) hoặc PDF (.pdf)</label>
            <input
              type="file"
              multiple
              accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
              className="hidden"
              ref={appendixInputRef}
              disabled={creatingAppendix}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? [])
                if (files.length === 0) return
                setAppendixFiles(files)
                setAppendixLabels(files.map(f => f.name.replace(/\.(docx|pdf)$/i, "")))
              }}
            />
            <button
              type="button"
              onClick={() => appendixInputRef.current?.click()}
              disabled={creatingAppendix}
              className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-red-200 bg-red-50/20 px-4 py-6 text-xs font-semibold text-[#C62828] hover:border-red-400 hover:bg-red-50/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={22} className="text-[#C62828]" />
              <span>Nhấp để chọn một hoặc nhiều file Word (.docx) hoặc PDF (.pdf)</span>
            </button>
          </div>

          {appendixFiles.length > 0 && (
            <div className="space-y-3 border-t border-gray-100 pt-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                Danh sách file đã chọn ({appendixFiles.length})
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {appendixFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <Paperclip size={14} className="text-[#C62828] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-gray-400 block truncate">{file.name}</span>
                      <input
                        className="w-full mt-1 bg-white border border-gray-200 rounded px-2 py-1 text-[11px] font-bold text-gray-700 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                        value={appendixLabels[idx] || ""}
                        disabled={creatingAppendix}
                        onChange={(e) => {
                          const newLabels = [...appendixLabels]
                          newLabels[idx] = e.target.value
                          setAppendixLabels(newLabels)
                        }}
                        placeholder="Tên hiển thị của phụ lục này"
                      />
                    </div>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700 text-xs font-bold shrink-0 px-2 disabled:opacity-50"
                      disabled={creatingAppendix}
                      onClick={() => {
                        const newFiles = appendixFiles.filter((_, i) => i !== idx)
                        const newLabels = appendixLabels.filter((_, i) => i !== idx)
                        setAppendixFiles(newFiles)
                        setAppendixLabels(newLabels)
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={creatingAppendix}
              onClick={() => setIsAddAppendixOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={creatingAppendix || !selectedContractId || appendixFiles.length === 0}
              onClick={() => void handleCreateMultipleAppendices()}
              className="bg-[#C62828] hover:bg-[#B71C1C] text-white font-black text-xs"
            >
              {creatingAppendix ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Upload size={14} className="mr-1.5" />}
              Tải lên tất cả ({appendixFiles.length})
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={editingAppendix !== null}
        onClose={() => !savingAppendix && setEditingAppendix(null)}
        title="Chỉnh sửa thông tin phụ lục"
        icon={Pencil}
        width="lg"
      >
        <div className="space-y-4 p-4">
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">Tên phụ lục (gốc)</label>
            <input
              className={inputCls}
              value={editAppendixLabel}
              disabled={savingAppendix}
              onChange={(e) => setEditAppendixLabel(e.target.value)}
              placeholder="VD: Phụ lục bổ sung module CRM"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Hợp đồng gốc cha</label>
            <CustomSelect
              value={editAppendixParentId}
              onChange={(val) => setEditAppendixParentId(val)}
              options={mainContracts.map((c) => ({ value: c.id, label: c.label }))}
              disabled={savingAppendix}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={savingAppendix}
              onClick={() => setEditingAppendix(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={savingAppendix || !editAppendixLabel.trim() || !editAppendixParentId}
              onClick={() => void handleEditAppendixSave()}
              className="bg-[#C62828] hover:bg-[#B71C1C] text-white font-black text-xs"
            >
              {savingAppendix ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={previewDoc !== null}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.label || "Xem trước tài liệu"}
        icon={Eye}
        width="5xl"
        bodyClassName="p-4 flex flex-col h-[75vh]"
        footer={
          <Button type="button" variant="outline" size="sm" className="text-xs font-bold h-8" onClick={() => setPreviewKey((k) => k + 1)}>
            <RefreshCw size={13} className="mr-1" /> Làm mới
          </Button>
        }
      >
        {previewDoc && (
          <DocxFilePreview
            docId={previewDoc.id}
            downloadName={previewDoc.downloadName}
            refreshKey={previewKey}
            loadBlob={() => api.leadDocuments.fileBlob(lead.id, previewDoc.id)}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteTargetDoc !== null}
        onClose={() => setDeleteTargetDoc(null)}
        onConfirm={handleDeleteDocConfirm}
        title="Xóa tài liệu?"
        message={`Xóa "${deleteTargetDoc?.label}"? Hành động này không hoàn tác.`}
        confirmText="Xóa"
        type="danger"
      />
    </div>
  )
}
