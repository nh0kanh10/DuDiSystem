import React, { useEffect, useRef, useState } from "react"
import { ArrowRight, CheckCircle2, Clock, FileSignature, Loader2, Paperclip, Plus, Upload } from "lucide-react"
import { Lead } from "../../types"
import { Button } from "../ui/button"
import { TemplateOverridePanel } from "./TemplateOverridePanel"
import { ContractEditor } from "./ContractEditor"
import { api, ContractPayload, LeadDocumentRecord } from "../../../lib/api"
import { leadHasRequirement } from "./leadRequirementForm"
import { resolvePartyAFromLead } from "./leadContractParty"

const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]"

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
    if (!file.name.toLowerCase().endsWith(".docx") && !file.name.toLowerCase().endsWith(".doc")) {
      setError("Chỉ hỗ trợ file Word (.doc, .docx)")
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
      <TemplateOverridePanel type="contract" compact />

      <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-xs text-blue-900 leading-relaxed">
        Một lead có <strong>nhiều hợp đồng</strong> (từ các báo giá khác nhau).
        Mỗi hợp đồng có thể có <strong>nhiều phụ lục</strong> — tải file Word (.docx) gắn với HĐ đã chọn.
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
          <FileSignature size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-bold text-gray-600">Chưa có báo giá đã lưu</p>
          <p className="text-xs text-gray-400 mt-1">Lưu báo giá ở tab Báo giá trước khi tạo hợp đồng.</p>
        </div>
      ) : (
        <>
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
                          ? "Báo giá này được tải lên từ máy. Vui lòng tải lên file Word (.doc, .docx) hợp đồng do bạn tự soạn thảo."
                          : "Vui lòng tải lên file Word (.doc, .docx) hợp đồng do bạn tự soạn thảo."}
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
                        <input type="file" className="hidden" accept=".doc,.docx" onChange={handleUploadContractDirect} disabled={uploadingContract || !uploadContractLabel.trim()} />
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
        </>
      )}


      {mainContracts.length > 0 && (
        <div className="rounded-2xl border border-green-100 bg-green-50/30 p-4 space-y-4">
          <p className="text-[10px] font-black text-green-800 uppercase tracking-wider">
            Hợp đồng ({mainContracts.length}) · Phụ lục ({appendixCount})
          </p>
          <ul className="space-y-3">
            {mainContracts.map((c) => (
              <li key={c.id} className="rounded-xl bg-white/80 border border-green-100 p-3 space-y-1.5">
                <p className="text-xs text-green-900 font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> {c.label}
                </p>
                {(appendicesByParent[c.id] ?? []).map((pl) => (
                  <p key={pl.id} className="text-[11px] text-violet-800 ml-5 pl-2 border-l-2 border-violet-200 flex items-center gap-1.5">
                    <Paperclip size={11} className="shrink-0" />
                    <span className="truncate">{pl.label}</span>
                    <span className="text-[10px] text-violet-500 shrink-0">v{pl.version}</span>
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}

      {mainContracts.length > 0 && (
        <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 space-y-3">
          <p className="text-[10px] font-black text-violet-800 uppercase tracking-wider flex items-center gap-1.5">
            <Plus size={12} /> Thêm phụ lục (upload Word)
          </p>
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-500">Hợp đồng gốc</p>
            <select
              className={inputCls}
              value={selectedContractId}
              onChange={(e) => setSelectedContractId(e.target.value)}
            >
              {mainContracts.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 mb-1 block">Tên phụ lục (tuỳ chọn)</label>
            <input
              className={inputCls}
              placeholder="VD: Phụ lục bổ sung module CRM"
              value={appendixLabel}
              onChange={(e) => setAppendixLabel(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 mb-1 block">File Word (.docx)</label>
            <input
              ref={appendixInputRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => setAppendixFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => appendixInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-200 bg-white px-4 py-4 text-xs font-semibold text-violet-700 hover:border-violet-400 hover:bg-violet-50/50 transition"
            >
              <Upload size={16} />
              {appendixFile ? appendixFile.name : "Chọn file Word để gắn với hợp đồng"}
            </button>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={creatingAppendix || !selectedContractId || !appendixFile}
              onClick={() => void handleCreateAppendix()}
              className="bg-violet-700 hover:bg-violet-800 text-white text-xs font-black"
            >
              {creatingAppendix ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Paperclip size={14} className="mr-1.5" />}
              Tải phụ lục lên
            </Button>
          </div>
        </div>
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
    </div>
  )
}
