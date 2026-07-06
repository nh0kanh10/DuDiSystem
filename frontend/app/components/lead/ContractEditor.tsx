import React, { useMemo, useState } from "react"
import {
  Clock, Download, Eye, FileSignature, Loader2, Pencil, RefreshCw, Save, Wallet, X,
} from "lucide-react"
import {
  api, ContractCostItem, ContractPayload, ContractPayment, ContractPhase, QuoteScopeItem,
} from "../../../lib/api"
import { contractDownloadName } from "../../utils/filename"
import { Button } from "../ui/button"
import { ContractDocxPreview } from "./ContractDocxPreview"
import { TemplateOverridePanel } from "./TemplateOverridePanel"

const inputCls =
  "w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]"

function parseAmount(v: string | number | undefined) {
  return Number(String(v ?? "").replace(/[^\d]/g, "")) || 0
}

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN")
}

function ensureFourPhases(phases?: ContractPhase[]): ContractPhase[] {
  const list = [...(phases ?? [])]
  while (list.length < 4) {
    list.push({ label: `Giai đoạn ${list.length + 1}`, content: "", duration: "" })
  }
  return list.slice(0, 4)
}

function normalizeForSave(data: ContractPayload): ContractPayload {
  const costItems = (data.costItems ?? []).map((row, idx) => {
    const amount = parseAmount(row.amount)
    const name = String(row.name ?? "").trim()
    const description = String(row.description ?? "").trim()
    const amountStr = formatVnd(amount)
    return {
      stt: String(row.stt ?? idx + 1),
      name,
      description,
      amount: amountStr,
      text: description ? `${name} (${description}) — ${amountStr} VNĐ` : `${name} — ${amountStr} VNĐ`,
    }
  }).filter((r) => r.name)

  const totalRaw = costItems.reduce((s, i) => s + parseAmount(i.amount), 0)
  const payments = (data.payments ?? []).map((p) => ({
    label: p.label ?? "",
    percent: String(p.percent ?? 0),
    amount: formatVnd(Math.round((totalRaw * (Number(p.percent) || 0)) / 100)),
    timing: p.timing ?? "",
  }))

  const phases = ensureFourPhases(data.phases)

  return {
    ...data,
    costItems,
    implementationItems: costItems.map(({ text, name, description, amount }) => ({
      text, name, detail: description, amount,
    })),
    scopeItems: data.scopeItems ?? [],
    phases,
    timelineTotal: data.timelineTotal ?? "",
    timelineDays: data.timelineTotal ?? "",
    total: formatVnd(totalRaw),
    totalRaw,
    totalWords: data.totalWords ?? `${formatVnd(totalRaw)} đồng`,
    payments,
    phase1_content: phases[0]?.content ?? "",
    phase1_duration: phases[0]?.duration ?? "",
    phase2_content: phases[1]?.content ?? "",
    phase2_duration: phases[1]?.duration ?? "",
    phase3_content: phases[2]?.content ?? "",
    phase3_duration: phases[2]?.duration ?? "",
    phase4_content: phases[3]?.content ?? "",
    phase4_duration: phases[3]?.duration ?? "",
  } as ContractPayload
}

export function ContractEditor({
  leadId,
  docId,
  docLabel,
  initialPayload,
  onSaved,
  onCancel,
}: {
  leadId: string
  docId: string
  docLabel?: string
  initialPayload: ContractPayload
  onSaved?: () => void
  onCancel?: () => void
}) {
  const [data, setData] = useState<ContractPayload>(() => ({
    ...initialPayload,
    partyA: { ...initialPayload.partyA },
    phases: ensureFourPhases(initialPayload.phases),
  }))
  const [view, setView] = useState<"edit" | "preview">("edit")
  const [previewKey, setPreviewKey] = useState(0)
  const [templateKey, setTemplateKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")
  const [error, setError] = useState("")

  const partyA = data.partyA ?? {}
  const phases = useMemo(() => ensureFourPhases(data.phases), [data.phases])
  const total = useMemo(
    () => (data.costItems ?? []).reduce((s, i) => s + parseAmount(i.amount), 0),
    [data.costItems],
  )
  const previewPayload = useMemo(() => normalizeForSave(data), [data])

  const updatePartyA = (patch: Partial<typeof partyA>) => {
    setData((d) => ({ ...d, partyA: { ...d.partyA, ...patch } }))
  }

  const updateCostItem = (index: number, patch: Partial<ContractCostItem>) => {
    const costItems = [...(data.costItems ?? [])]
    costItems[index] = { ...costItems[index], ...patch }
    setData({ ...data, costItems })
  }

  const updateScopeItem = (index: number, patch: Partial<QuoteScopeItem>) => {
    const scopeItems = [...(data.scopeItems ?? [])]
    scopeItems[index] = { ...scopeItems[index], ...patch }
    setData({ ...data, scopeItems })
  }

  const updatePhase = (index: number, patch: Partial<ContractPhase>) => {
    const next = ensureFourPhases(data.phases)
    next[index] = { ...next[index], ...patch }
    setData({ ...data, phases: next })
  }

  const updatePayment = (index: number, patch: Partial<ContractPayment>) => {
    const payments = [...(data.payments ?? [])]
    payments[index] = { ...payments[index], ...patch }
    setData({ ...data, payments })
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setSaveMsg("")
    try {
      const payload = normalizeForSave(data)
      await api.leadDocuments.update(leadId, docId, { payload, label: docLabel })
      setSaveMsg("Đã cập nhật hợp đồng")
      setPreviewKey((k) => k + 1)
      onSaved?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu hợp đồng thất bại")
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async () => {
    try {
      const blob = await api.contracts.generateDocxBlob(previewPayload)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = contractDownloadName(data.projectName || data.project)
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tải file thất bại")
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-black text-gray-800 flex items-center gap-1.5">
            <FileSignature size={16} className="text-[#C62828]" />
            {docLabel ?? "Chỉnh sửa hợp đồng"}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Cập nhật sẽ ghi đè phiên bản này và tạo lại file Word</p>
        </div>
        {onCancel && (
          <Button type="button" variant="outline" size="sm" className="text-xs font-bold h-8" onClick={onCancel}>
            <X size={13} className="mr-1" /> Đóng
          </Button>
        )}
      </div>

      <TemplateOverridePanel type="contract" compact onChanged={() => setTemplateKey((k) => k + 1)} />

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
            onClick={() => { setPreviewKey((k) => k + 1); setView("preview") }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
              view === "preview" ? "bg-white text-[#C62828] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Eye size={13} /> Xem trước Word
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="text-xs font-bold h-8" onClick={handleDownload}>
            <Download size={13} className="mr-1" /> Tải
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-[#C62828] hover:bg-[#B71C1C] text-white text-xs font-black h-8"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? <Loader2 size={13} className="mr-1 animate-spin" /> : <Save size={13} className="mr-1" />}
            Lưu thay đổi
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
      {saveMsg && <p className="text-sm text-green-700 font-semibold">{saveMsg}</p>}

      {view === "preview" ? (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs font-bold h-8"
            onClick={() => setPreviewKey((k) => k + 1)}
          >
            <RefreshCw size={13} className="mr-1" /> Làm mới preview
          </Button>
          <ContractDocxPreview payload={previewPayload} refreshKey={previewKey + templateKey} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Đầu hợp đồng</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block">Số hợp đồng</label>
                <input className={inputCls} value={data.contractNo ?? ""} onChange={(e) => setData({ ...data, contractNo: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block">Ngày ký</label>
                <input className={inputCls} value={data.contractDate ?? ""} onChange={(e) => setData({ ...data, contractDate: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block">Địa điểm</label>
                <input className={inputCls} value={data.contractPlace ?? ""} onChange={(e) => setData({ ...data, contractPlace: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Bên A</p>
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
                    value={partyA[f.key as keyof typeof partyA] ?? ""}
                    onChange={(e) => updatePartyA({ [f.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">I. Chi phí</p>
              <span className="text-sm font-black text-[#C62828]">{formatVnd(total)} VNĐ</span>
            </div>
            <div className="overflow-auto rounded-xl border border-gray-200 bg-white max-h-[280px]">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left font-bold text-gray-500">Hạng mục</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500">Mô tả</th>
                    <th className="px-2 py-2 text-right font-bold text-gray-500 w-28">Chi phí</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.costItems ?? []).map((row, i) => (
                    <tr key={i} className="border-t border-gray-100 align-top">
                      <td className="px-2 py-1.5">
                        <input className={inputCls} value={row.name} onChange={(e) => updateCostItem(i, { name: e.target.value })} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className={inputCls} value={row.description ?? ""} onChange={(e) => updateCostItem(i, { description: e.target.value })} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          className={`${inputCls} text-right`}
                          value={parseAmount(row.amount) || ""}
                          onChange={(e) => updateCostItem(i, { amount: Number(e.target.value) || 0 })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">II. Phạm vi</p>
            <div className="overflow-auto rounded-xl border border-gray-200 bg-white max-h-[240px]">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 w-[22%]">Nhóm</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 w-[22%]">Hạng mục</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500">Phạm vi</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.scopeItems ?? []).map((row, i) => (
                    <tr key={i} className="border-t border-gray-100 align-top">
                      <td className="px-2 py-1.5">
                        <input className={inputCls} value={row.group} onChange={(e) => updateScopeItem(i, { group: e.target.value })} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className={inputCls} value={row.item} onChange={(e) => updateScopeItem(i, { item: e.target.value })} />
                      </td>
                      <td className="px-2 py-1.5">
                        <textarea className={`${inputCls} min-h-[44px] resize-y`} rows={2} value={row.scope} onChange={(e) => updateScopeItem(i, { scope: e.target.value })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Clock size={13} /> III. Thời gian
              </p>
              <input
                className={`${inputCls} max-w-xs`}
                placeholder="VD: 10 – 14 ngày"
                value={data.timelineTotal ?? ""}
                onChange={(e) => setData({ ...data, timelineTotal: e.target.value })}
              />
            </div>
            <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 w-24">Giai đoạn</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500">Nội dung</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 w-32">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {phases.map((row, i) => (
                    <tr key={i} className="border-t border-gray-100 align-top">
                      <td className="px-2 py-2 text-gray-600 font-semibold">Giai đoạn {i + 1}</td>
                      <td className="px-2 py-1.5">
                        <textarea className={`${inputCls} min-h-[44px] resize-y`} rows={2} value={row.content} onChange={(e) => updatePhase(i, { content: e.target.value })} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className={inputCls} value={row.duration} onChange={(e) => updatePhase(i, { duration: e.target.value })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Wallet size={13} /> IV. Thanh toán
            </p>
            <div className="space-y-2">
              {(data.payments ?? []).map((row, i) => (
                <div key={i} className="grid sm:grid-cols-4 gap-2 bg-white border border-gray-100 rounded-xl p-2">
                  <input className={inputCls} value={row.label} placeholder="Đợt" onChange={(e) => updatePayment(i, { label: e.target.value })} />
                  <input type="number" className={inputCls} value={row.percent ?? ""} placeholder="%" onChange={(e) => updatePayment(i, { percent: e.target.value })} />
                  <input className={inputCls} value={row.timing} placeholder="Thời điểm" onChange={(e) => updatePayment(i, { timing: e.target.value })} />
                  <p className="text-xs font-semibold text-gray-600 self-center px-1">
                    {formatVnd(Math.round((total * (Number(row.percent) || 0)) / 100))} VNĐ
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
