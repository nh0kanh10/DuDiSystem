import React, { useEffect, useMemo, useRef, useState } from "react"
import { Braces, ClipboardList, Clock, Download, Eye, FileText, Import, Loader2, Pencil, Plus, RefreshCw, Save, Trash2, Wallet, X, UploadCloud } from "lucide-react"
import { api, QuoteCostItem, QuotePayload, QuotePayment, QuotePhase, QuoteScopeItem } from "../../../lib/api"
import { Lead, RequirementForm } from "../../types"
import { Button } from "../ui/button"
import { Modal } from "../ui/Modal"
import { QuoteDocxPreview } from "./QuoteDocxPreview"
import { TemplateOverridePanel } from "./TemplateOverridePanel"
import { buildRequirementFormsFromLead } from "./leadRequirementForm"
import { formatRequirementFormForAI } from "./requirementFormForAi"
import { buildQuoteAiPrompt, QUOTE_AI_FORMAT_PROMPT, type QuoteAiPromptMode } from "./quoteAiPrompt"
import { FORM_TYPE_LABELS } from "../du-an/projectRequirementMock"
import {
  buildAutoHeader,
  createEmptyQuote,
  ensureFourPhases,
} from "./quotePayloadUtils"

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN")
}

const inputCls =
  "w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]"

export function QuoteGenerator({
  lead,
  onSaved,
  externalRestore,
  restoreToken,
  editingDocId,
  editingDocLabel,
}: {
  lead?: Lead
  onSaved?: () => void
  externalRestore?: QuotePayload | null
  restoreToken?: number
  editingDocId?: string | null
  editingDocLabel?: string
}) {
  const [data, setData] = useState<QuotePayload | null>(() => buildAutoHeader(lead, createEmptyQuote()))
  const [downloading, setDownloading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")
  const [error, setError] = useState("")
  const [aiPaste, setAiPaste] = useState("")
  const [aiPromptMode, setAiPromptMode] = useState<QuoteAiPromptMode>("requirement")
  const [selectedRequirement, setSelectedRequirement] = useState<RequirementForm | null>(null)
  const [showRequirementPicker, setShowRequirementPicker] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [view, setView] = useState<"edit" | "preview" | "upload">("edit")
  const [previewKey, setPreviewKey] = useState(0)
  const [templateKey, setTemplateKey] = useState(0)
  const [saveLabel, setSaveLabel] = useState("")
  const [uploadingFile, setUploadingFile] = useState(false)
  const saveLabelTouched = useRef(false)

  useEffect(() => {
    if (!lead?.id || editingDocId) return
    let cancelled = false
    ;(async () => {
      try {
        const latest = await api.leadDocuments.latest(lead.id, "quote")
        if (cancelled) return
        setData(buildAutoHeader(lead, (latest?.payload as QuotePayload | undefined) ?? createEmptyQuote()))
      } catch {
        if (!cancelled) setData(buildAutoHeader(lead, createEmptyQuote()))
      }
    })()
    return () => { cancelled = true }
  }, [lead?.id, lead?.contactName, lead?.name, lead?.assignedToName, editingDocId])

  useEffect(() => {
    if (externalRestore && restoreToken) {
      setData(buildAutoHeader(lead, externalRestore))
      setPreviewKey((k) => k + 1)
      setView("edit")
    }
  }, [restoreToken, externalRestore, lead])

  const payload = useMemo(() => buildAutoHeader(lead, data), [lead, data])
  const requirementForms = useMemo(() => (lead ? buildRequirementFormsFromLead(lead) : []), [lead])

  useEffect(() => {
    if (aiPromptMode !== "requirement") return
    if (requirementForms.length === 0) {
      setSelectedRequirement(null)
      return
    }
    setSelectedRequirement((prev) => {
      if (prev && requirementForms.some((f) => f.id === prev.id)) return prev
      return requirementForms[0]
    })
  }, [requirementForms, aiPromptMode])

  useEffect(() => {
    if (editingDocId) {
      setSaveLabel(editingDocLabel || "")
      saveLabelTouched.current = true
      return
    }
    if (!lead?.id || saveLabelTouched.current) return
    let cancelled = false
    api.leadDocuments.list(lead.id, "quote").then((docs) => {
      if (cancelled) return
      const next = docs.length + 1
      const proj = payload.project?.trim()
      setSaveLabel(proj ? `Báo giá ${proj} #${next}` : `Báo giá #${next}`)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [lead?.id, editingDocId, editingDocLabel, payload.project])

  const total = useMemo(
    () => (data?.costItems ?? []).reduce((s, i) => s + (Number(i.amount) || 0), 0),
    [data?.costItems],
  )

  const phases = useMemo(() => ensureFourPhases(data?.phases), [data?.phases])

  const paymentPercentTotal = useMemo(
    () => (data?.payments ?? []).reduce((s, p) => s + (Number(p.percent) || 0), 0),
    [data?.payments],
  )

  const updateCostItem = (index: number, patch: Partial<QuoteCostItem>) => {
    if (!data) return
    const costItems = [...(data.costItems ?? [])]
    costItems[index] = { ...costItems[index], ...patch }
    setData({ ...data, costItems })
  }

  const addCostItem = () => {
    if (!data) return
    setData({
      ...data,
      costItems: [...(data.costItems ?? []), { name: "", description: "", amount: 0 }],
    })
  }

  const removeCostItem = (index: number) => {
    if (!data) return
    setData({
      ...data,
      costItems: (data.costItems ?? []).filter((_, i) => i !== index),
    })
  }

  const updateScopeItem = (index: number, patch: Partial<QuoteScopeItem>) => {
    if (!data) return
    const scopeItems = [...(data.scopeItems ?? [])]
    scopeItems[index] = { ...scopeItems[index], ...patch }
    setData({ ...data, scopeItems })
  }

  const addScopeItem = () => {
    if (!data) return
    setData({
      ...data,
      scopeItems: [...(data.scopeItems ?? []), { group: "", item: "", scope: "" }],
    })
  }

  const removeScopeItem = (index: number) => {
    if (!data) return
    setData({
      ...data,
      scopeItems: (data.scopeItems ?? []).filter((_, i) => i !== index),
    })
  }

  const updatePhase = (index: number, patch: Partial<QuotePhase>) => {
    if (!data) return
    const next = ensureFourPhases(data.phases)
    next[index] = { ...next[index], ...patch }
    setData({ ...data, phases: next })
  }

  const updatePayment = (index: number, patch: Partial<QuotePayment>) => {
    if (!data) return
    const payments = [...(data.payments ?? [])]
    const next = { ...payments[index], ...patch }
    payments[index] = next
    setData({ ...data, payments })
  }

  const addPayment = () => {
    if (!data) return
    const n = (data.payments?.length ?? 0) + 1
    setData({
      ...data,
      payments: [
        ...(data.payments ?? []),
        { label: `Đợt ${n}`, percent: 0, amount: 0, timing: "" },
      ],
    })
  }

  const removePayment = (index: number) => {
    if (!data) return
    setData({
      ...data,
      payments: (data.payments ?? []).filter((_, i) => i !== index),
    })
  }

  const handleParseAi = async () => {
    if (!aiPaste.trim()) return
    setParsing(true)
    setError("")
    try {
      const parsed = await api.quotes.parse(aiPaste)
      setData(buildAutoHeader(lead, parsed))
      setAiPaste("")
      setPreviewKey((k) => k + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không đọc được JSON từ AI")
    } finally {
      setParsing(false)
    }
  }

  const paymentAmount = (p: QuotePayment) =>
    Math.round((total * (Number(p.percent) || 0)) / 100)

  const copyAiPrompt = async () => {
    const text = buildQuoteAiPrompt(
      aiPromptMode,
      aiPromptMode === "requirement" ? selectedRequirement : null,
    )
    await navigator.clipboard.writeText(text)
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }

  const requirementContext =
    aiPromptMode === "requirement" && selectedRequirement
      ? formatRequirementFormForAI(selectedRequirement)
      : ""

  const handleDownload = async () => {
    if (!data) return
    setDownloading(true)
    setError("")
    try {
      await api.quotes.downloadDocx(payload)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xuất file thất bại")
    } finally {
      setDownloading(false)
    }
  }

  const handleUploadDirect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !lead?.id) return
    if (!file.name.toLowerCase().endsWith(".docx") && !file.name.toLowerCase().endsWith(".doc")) {
      setError("Chỉ hỗ trợ file Word (.doc, .docx)")
      return
    }

    setUploadingFile(true)
    setError("")
    setSaveMsg("")
    try {
      const saved = await api.leadDocuments.uploadFile(lead.id, "quote", file, {
        label: saveLabel.trim() || `Báo giá ${payload.project?.trim() || ""} tải lên`,
      })
      setSaveMsg(`Đã tải lên ${saved.label}`)
      onSaved?.()
    } catch (err: any) {
      setError(err.message || "Tải lên thất bại")
    } finally {
      setUploadingFile(false)
      e.target.value = ""
    }
  }

  const handleSave = async () => {
    if (!lead?.id || !data) return
    const label = saveLabel.trim()
    if (!label) {
      setError("Vui lòng nhập tên phiên bản báo giá")
      return
    }
    setSaving(true)
    setError("")
    setSaveMsg("")
    try {
      if (editingDocId) {
        const saved = await api.leadDocuments.update(lead.id, editingDocId, {
          payload,
          label,
        })
        setSaveMsg(`Đã cập nhật ${saved.label}`)
      } else {
        const saved = await api.leadDocuments.save(lead.id, { type: "quote", payload, label })
        setSaveMsg(`Đã lưu ${saved.label}`)
        saveLabelTouched.current = false
        const docs = await api.leadDocuments.list(lead.id, "quote")
        const next = docs.length + 1
        const proj = payload.project?.trim()
        setSaveLabel(proj ? `Báo giá ${proj} #${next}` : `Báo giá #${next}`)
      }
      onSaved?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu báo giá thất bại")
    } finally {
      setSaving(false)
    }
  }

  const openPreview = () => {
    setPreviewKey((k) => k + 1)
    setView("preview")
  }

  if (!data) {
    return <p className="text-sm text-red-600 py-8 text-center">{error || "Không có dữ liệu"}</p>
  }

  const headerFields = [
    { label: "Khách hàng", value: payload.customer ?? "—" },
    { label: "Dự án", value: payload.project ?? "—" },
    { label: "Ngày", value: payload.date ?? "—" },
    { label: "Phụ trách", value: payload.owner ?? "—" },
  ]

  return (
    <div className="space-y-5">
      <TemplateOverridePanel
        type="quote"
        compact
        onChanged={() => setTemplateKey((k) => k + 1)}
      />

      {editingDocId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          Đang sửa <strong>{editingDocLabel ?? editingDocId}</strong> — Lưu sẽ ghi đè phiên bản này (không tạo bản mới).
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setView("edit")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
              view === "edit" ? "bg-white text-[#C62828] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Pencil size={13} /> Soạn thảo
          </button>
          <button
            type="button"
            onClick={openPreview}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
              view === "preview" ? "bg-white text-[#C62828] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Eye size={13} /> Xem trước Word
          </button>
          
          <div className="w-px h-4 bg-gray-300 mx-1"></div>

          <button
            type="button"
            onClick={() => setView("upload")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
              view === "upload" ? "bg-white text-[#C62828] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {uploadingFile ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
            Tải file lên
          </button>
        </div>
        {view === "preview" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs font-bold h-8"
            onClick={() => setPreviewKey((k) => k + 1)}
          >
            <RefreshCw size={13} className="mr-1" /> Làm mới preview
          </Button>
        )}
      </div>

      {view === "preview" ? (
        <QuoteDocxPreview payload={payload} refreshKey={previewKey + templateKey} />
      ) : view === "upload" ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 max-w-md mx-auto my-8">
          <div className="text-center mb-6">
            <UploadCloud size={40} className="mx-auto text-gray-400 mb-3" />
            <h3 className="text-base font-black text-gray-800">Tải lên file báo giá</h3>
            <p className="text-xs text-gray-500 mt-1">
              Tải lên file Word (.doc, .docx) báo giá do bạn tự soạn thảo.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                Tên file báo giá <span className="text-red-500">*</span>
              </label>
              <input
                className={inputCls}
                value={saveLabel}
                onChange={(e) => {
                  saveLabelTouched.current = true
                  setSaveLabel(e.target.value)
                }}
                placeholder="VD: Báo giá website bản chính thức"
              />
            </div>
            
            <label className={`flex items-center justify-center gap-2 w-full py-4 ${!saveLabel.trim() || !!editingDocId || uploadingFile ? "bg-gray-300 cursor-not-allowed" : "bg-[#C62828] cursor-pointer hover:bg-[#B71C1C]"} text-white rounded-xl text-base font-bold transition-colors shadow-sm`}>
              {uploadingFile ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
              Chọn file & Tải lên
              <input type="file" className="hidden" accept=".doc,.docx" onChange={handleUploadDirect} disabled={uploadingFile || !!editingDocId || !saveLabel.trim()} />
            </label>
            
            {saveMsg && <p className="text-sm text-green-700 font-semibold text-center mt-2">{saveMsg}</p>}
            {error && <p className="text-sm text-red-600 font-semibold text-center mt-2">{error}</p>}
          </div>
        </div>
      ) : (
        <>
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-[11px] font-black text-violet-800 uppercase tracking-wider flex items-center gap-1.5">
                <Braces size={14} /> Dán JSON từ AI (chỉ nội dung báo giá)
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs font-bold h-8"
                  onClick={() => { void copyAiPrompt() }}
                >
                  {promptCopied
                    ? "Đã copy!"
                    : aiPromptMode === "requirement"
                      ? "Copy prompt + yêu cầu"
                      : "Copy prompt định dạng"}
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <p className="text-[10px] font-bold text-violet-700 shrink-0">Loại prompt:</p>
              <div className="flex bg-white/80 border border-violet-200 rounded-xl p-1 gap-1 flex-1">
                <button
                  type="button"
                  onClick={() => setAiPromptMode("requirement")}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    aiPromptMode === "requirement"
                      ? "bg-violet-700 text-white shadow-sm"
                      : "text-violet-600 hover:bg-violet-100/80"
                  }`}
                >
                  Theo phiếu yêu cầu
                </button>
                <button
                  type="button"
                  onClick={() => setAiPromptMode("format")}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    aiPromptMode === "format"
                      ? "bg-violet-700 text-white shadow-sm"
                      : "text-violet-600 hover:bg-violet-100/80"
                  }`}
                >
                  Chỉ định dạng & chỉ dẫn
                </button>
              </div>
            </div>

            <p className="text-[10px] text-violet-700/90 leading-relaxed">
              {aiPromptMode === "requirement"
                ? "Copy gửi AI kèm nội dung phiếu yêu cầu đã chọn."
                : "Copy chỉ schema JSON và quy tắc — bạn tự mô tả dự án trong ChatGPT."}
            </p>

            {aiPromptMode === "requirement" && (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold h-8"
                    disabled={requirementForms.length === 0}
                    onClick={() => setShowRequirementPicker(true)}
                    title={requirementForms.length === 0 ? "Chưa có phiếu yêu cầu" : "Chọn phiếu yêu cầu"}
                  >
                    <ClipboardList size={13} className="mr-1" />
                    Chọn yêu cầu
                  </Button>
                  {requirementForms.length === 0 && (
                    <span className="text-[10px] text-violet-700/80">
                      Chưa có phiếu — gửi form cho khách trước.
                    </span>
                  )}
                </div>

                {selectedRequirement && (
                  <div className="rounded-xl border border-violet-200 bg-white px-3 py-2.5 flex items-start gap-2">
                    <FileText size={14} className="text-violet-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-800 truncate">{selectedRequirement.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {FORM_TYPE_LABELS[selectedRequirement.projectType ?? ""] ?? selectedRequirement.projectType}
                        {selectedRequirement.code ? ` · ${selectedRequirement.code}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRequirement(null)}
                      className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                      title="Bỏ chọn"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {selectedRequirement && requirementContext && (
                  <details className="rounded-xl border border-violet-100 bg-violet-50/50 overflow-hidden">
                    <summary className="px-3 py-2 text-[11px] font-bold text-violet-700 cursor-pointer select-none">
                      Xem nội dung yêu cầu sẽ gửi cho AI
                    </summary>
                    <pre className="px-3 pb-3 text-[10px] leading-relaxed text-gray-700 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                      {requirementContext}
                    </pre>
                  </details>
                )}
              </>
            )}

            {aiPromptMode === "format" && (
              <details className="rounded-xl border border-violet-100 bg-white overflow-hidden">
                <summary className="px-3 py-2 text-[11px] font-bold text-violet-700 cursor-pointer select-none">
                  Xem prompt định dạng (schema + quy tắc)
                </summary>
                <pre className="px-3 pb-3 text-[10px] leading-relaxed text-gray-700 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                  {QUOTE_AI_FORMAT_PROMPT}
                </pre>
              </details>
            )}

            <textarea
              className="w-full min-h-[100px] rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="Dán JSON từ ChatGPT vào đây…"
              value={aiPaste}
              onChange={(e) => setAiPaste(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                className="bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold h-8"
                disabled={parsing || !aiPaste.trim()}
                onClick={handleParseAi}
              >
                {parsing ? <Loader2 size={13} className="mr-1 animate-spin" /> : <Import size={13} className="mr-1" />}
                Điền vào form
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 bg-gray-50 rounded-2xl border border-gray-100 p-4">
            {headerFields.map((f) => (
              <div key={f.label}>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{f.label}</p>
                <p className="mt-1 text-sm font-semibold text-gray-800">{f.value}</p>
              </div>
            ))}
            <p className="sm:col-span-2 text-[10px] text-gray-400">
              Tự lấy từ lead và ngày hiện tại — không cần AI điền
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} /> I. Chi phí dịch vụ ({data.costItems?.length ?? 0} hạng mục)
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[#C62828]">Tổng: {formatVnd(total)} VNĐ</span>
                <Button type="button" variant="outline" size="sm" className="text-xs font-bold h-8" onClick={addCostItem}>
                  <Plus size={13} className="mr-1" /> Thêm hàng
                </Button>
              </div>
            </div>
            <div className="overflow-auto rounded-xl border border-gray-200 bg-white max-h-[360px]">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 w-8">#</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 w-[22%]">Hạng mục</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500">Mô tả</th>
                    <th className="px-2 py-2 text-right font-bold text-gray-500 w-28">Chi phí</th>
                    <th className="px-2 py-2 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {(data.costItems ?? []).map((row, i) => (
                    <tr key={i} className="border-t border-gray-100 align-top">
                      <td className="px-2 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-2 py-1.5">
                        <input
                          className={inputCls}
                          value={row.name}
                          placeholder="Tên hạng mục"
                          onChange={(e) => updateCostItem(i, { name: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <textarea
                          className={`${inputCls} min-h-[52px] resize-y`}
                          value={row.description}
                          placeholder="Mô tả"
                          rows={2}
                          onChange={(e) => updateCostItem(i, { description: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min={0}
                          step={100000}
                          className={`${inputCls} text-right`}
                          value={row.amount || ""}
                          onChange={(e) => updateCostItem(i, { amount: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <button
                          type="button"
                          onClick={() => removeCostItem(i)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa hàng"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
                II. Phạm vi công việc ({data.scopeItems?.length ?? 0} dòng)
              </h4>
              <Button type="button" variant="outline" size="sm" className="text-xs font-bold h-8" onClick={addScopeItem}>
                <Plus size={13} className="mr-1" /> Thêm dòng
              </Button>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-bold text-gray-500">DUDI Software sẽ triển khai</span>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                {(["website", "hệ thống"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setData({ ...data, deployKind: kind })}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      (data.deployKind ?? "website") === kind
                        ? "bg-white text-[#C62828] shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {kind}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-gray-500">bao gồm các trang và chức năng sau</span>
            </div>
            <div className="overflow-auto rounded-xl border border-gray-200 bg-white max-h-[360px]">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 w-[22%]">Nhóm</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 w-[22%]">Hạng mục</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500">Phạm vi</th>
                    <th className="px-2 py-2 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {(data.scopeItems ?? []).map((row, i) => (
                    <tr key={i} className="border-t border-gray-100 align-top">
                      <td className="px-2 py-1.5">
                        <input
                          className={inputCls}
                          value={row.group}
                          placeholder="VD: Nhóm trang chính"
                          onChange={(e) => updateScopeItem(i, { group: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className={inputCls}
                          value={row.item}
                          placeholder="Hạng mục"
                          onChange={(e) => updateScopeItem(i, { item: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <textarea
                          className={`${inputCls} min-h-[52px] resize-y`}
                          value={row.scope}
                          placeholder="Phạm vi"
                          rows={2}
                          onChange={(e) => updateScopeItem(i, { scope: e.target.value })}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <button
                          type="button"
                          onClick={() => removeScopeItem(i)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa dòng"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
            <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} /> III. Thời gian thực hiện
            </h4>
            <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 w-24">Giai đoạn</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500">Nội dung thực hiện</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 w-32">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {phases.map((row, i) => (
                    <tr key={i} className="border-t border-gray-100 align-top">
                      <td className="px-2 py-2 text-gray-600 font-semibold whitespace-nowrap">
                        Giai đoạn {i + 1}
                      </td>
                      <td className="px-2 py-1.5">
                        <textarea
                          className={`${inputCls} min-h-[52px] resize-y`}
                          value={row.content}
                          placeholder="Nội dung thực hiện"
                          rows={2}
                          onChange={(e) => updatePhase(i, { content: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className={inputCls}
                          value={row.duration}
                          placeholder="VD: 07 - 10 ngày"
                          onChange={(e) => updatePhase(i, { duration: e.target.value })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet size={14} /> IV. Phương thức thanh toán ({data.payments?.length ?? 0} đợt)
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold ${paymentPercentTotal === 100 ? "text-green-600" : "text-amber-600"}`}>
                  Tổng tỷ lệ: {paymentPercentTotal}%
                </span>
                <Button type="button" variant="outline" size="sm" className="text-xs font-bold h-8" onClick={addPayment}>
                  <Plus size={13} className="mr-1" /> Thêm đợt
                </Button>
              </div>
            </div>
            <div className="overflow-auto rounded-xl border border-gray-200 bg-white max-h-[280px]">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 w-24">Đợt</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 w-20">Tỷ lệ %</th>
                    <th className="px-2 py-2 text-right font-bold text-gray-500 w-32">Số tiền</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500">Thời điểm thanh toán</th>
                    <th className="px-2 py-2 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {(data.payments ?? []).map((row, i) => (
                    <tr key={i} className="border-t border-gray-100 align-top">
                      <td className="px-2 py-1.5">
                        <input
                          className={inputCls}
                          value={row.label}
                          placeholder="Đợt 1"
                          onChange={(e) => updatePayment(i, { label: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className={`${inputCls} text-right`}
                          value={row.percent || ""}
                          onChange={(e) => updatePayment(i, { percent: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-2 py-2 text-right font-semibold text-gray-700 whitespace-nowrap">
                        {formatVnd(paymentAmount(row))} VNĐ
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className={inputCls}
                          value={row.timing}
                          placeholder="VD: Khi bắt đầu triển khai"
                          onChange={(e) => updatePayment(i, { timing: e.target.value })}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <button
                          type="button"
                          onClick={() => removePayment(i)}
                          disabled={(data.payments?.length ?? 0) <= 1}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          title="Xóa đợt"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {paymentPercentTotal !== 100 && (
              <p className="text-[10px] text-amber-600 font-semibold">
                Tổng tỷ lệ các đợt nên bằng 100%. Số tiền tự tính theo tổng chi phí dịch vụ.
              </p>
            )}
          </div>
        </>
      )}

      {view !== "upload" && (
        <>
          {saveMsg && <p className="text-sm text-green-700 font-semibold">{saveMsg}</p>}
          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-1.5">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
              Tên phiên bản {editingDocId ? "" : "(bắt buộc)"}
            </label>
            <input
              className={inputCls}
              value={saveLabel}
              onChange={(e) => {
                saveLabelTouched.current = true
                setSaveLabel(e.target.value)
              }}
              placeholder="VD: Báo giá website bản chính thức"
            />
            <p className="text-[10px] text-gray-400">
              {editingDocId
                ? "Đổi tên hiển thị trong tab Tài liệu."
                : "Mỗi lần Lưu phiên bản = 1 bản mới — đặt tên khác nhau để phân biệt."}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 flex-wrap">
            <Button
              variant="outline"
              className="text-xs font-bold"
              onClick={() => {
                setData(buildAutoHeader(lead, createEmptyQuote()))
                setPreviewKey((k) => k + 1)
                setSaveMsg("")
                saveLabelTouched.current = false
                setSaveLabel("")
              }}
            >
              <RefreshCw size={14} className="mr-1.5" /> Xóa & làm lại
            </Button>
            {view === "edit" && (
              <Button
                variant="outline"
                className="text-xs font-bold"
                onClick={openPreview}
              >
                <Eye size={14} className="mr-1.5" /> Xem trước
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={saving || !lead?.id}
              className="text-xs font-bold border-green-200 text-green-800 hover:bg-green-50"
            >
              {saving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
              {editingDocId ? "Lưu thay đổi" : "Lưu phiên bản"}
            </Button>
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="bg-[#C62828] hover:bg-[#B71C1C] text-white text-xs font-black px-5"
            >
              {downloading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Download size={14} className="mr-1.5" />}
              Tải file Word (.docx)
            </Button>
          </div>
        </>
      )}

      <Modal
        open={showRequirementPicker}
        onClose={() => setShowRequirementPicker(false)}
        title="Chọn phiếu yêu cầu"
        icon={ClipboardList}
        width="md"
      >
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-gray-500 mb-3">
            Toàn bộ nội dung phiếu sẽ được đưa vào prompt khi bạn copy gửi AI.
          </p>
          {requirementForms.map((form) => {
            const active = selectedRequirement?.id === form.id
            const typeLabel = FORM_TYPE_LABELS[form.projectType ?? ""] ?? form.projectType
            return (
              <button
                key={form.id}
                type="button"
                onClick={() => {
                  setSelectedRequirement(form)
                  setShowRequirementPicker(false)
                }}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                  active
                    ? "border-violet-300 bg-violet-50 shadow-sm"
                    : "border-gray-100 bg-white hover:border-violet-200 hover:bg-violet-50/40"
                }`}
              >
                <p className="text-sm font-bold text-gray-800">{form.title}</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  {typeLabel}
                  {form.code ? ` · ${form.code}` : ""}
                  {form.lockedAt || form.createdAt
                    ? ` · ${new Date(form.lockedAt || form.createdAt).toLocaleDateString("vi-VN")}`
                    : ""}
                </p>
              </button>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}
