import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronRight, Download, Eye, FileSignature, FileText, Loader2, Paperclip, Pencil, RefreshCw, Trash2, Box } from "lucide-react"
import { api, ContractPayload, LeadDocumentRecord, QuotePayload } from "../../../lib/api"
import { Button } from "../ui/button"
import { DocxFilePreview } from "./DocxFilePreview"
import { Lead } from "../../types"
import { Modal } from "../ui/Modal"

import ConfirmModal from "../ui/ConfirmModal"

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN")
}

function formatSize(bytes?: number) {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DocRow({
  doc,
  indent,
  onDownload,
  onPreview,
  onEdit,
  onDelete,
}: {
  doc: LeadDocumentRecord
  indent?: boolean
  onDownload: (doc: LeadDocumentRecord) => void
  onPreview?: (doc: LeadDocumentRecord) => void
  onEdit?: (doc: LeadDocumentRecord) => void
  onDelete?: (doc: LeadDocumentRecord) => void
}) {
  const isAppendix = Boolean(doc.isAppendix || doc.parentDocumentId)
  return (
    <div
      className={`flex items-center justify-between gap-3 flex-wrap bg-white border rounded-xl px-3 py-2.5 ${
        indent
          ? "ml-6 border-violet-100 bg-violet-50/30"
          : "border-gray-100"
      }`}
    >
      <div className="min-w-0 flex items-start gap-1.5">
        {indent ? (
          <ChevronRight size={14} className="text-violet-400 shrink-0 mt-0.5" />
        ) : null}
        <div className="min-w-0">
          <p className={`text-sm font-bold truncate ${indent ? "text-violet-900" : "text-gray-800"}`}>
            {isAppendix && <Paperclip size={12} className="inline mr-1 text-violet-500" />}
            {doc.label}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {isAppendix ? "Phụ lục · " : ""}v{doc.version} · {formatDate(doc.createdAt)}
            {doc.createdByName ? ` · ${doc.createdByName}` : ""}
            {doc.fileSize ? ` · ${formatSize(doc.fileSize)}` : ""}
            {doc.updatedAt ? ` · Sửa ${formatDate(doc.updatedAt)}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
        {onEdit && !isAppendix && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-[10px] font-bold h-7 px-2"
            onClick={() => onEdit(doc)}
          >
            <Pencil size={12} className="mr-1" /> Sửa
          </Button>
        )}
        {onPreview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-[10px] font-bold h-7 px-2"
            onClick={() => onPreview(doc)}
          >
            <Eye size={12} className="mr-1" /> Xem trước
          </Button>
        )}
        {doc.hasFile ?? doc.fileSize ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-[10px] font-bold h-7 px-2"
            onClick={() => onDownload(doc)}
          >
            <Download size={12} className="mr-1" /> Tải
          </Button>
        ) : (
          <span className="text-[10px] text-gray-400 font-semibold px-2">Chưa có file</span>
        )}
        {onDelete && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-[10px] font-bold h-7 px-2 text-red-600 border-red-100 hover:bg-red-50"
            onClick={() => onDelete(doc)}
          >
            <Trash2 size={12} className="mr-1" /> Xóa
          </Button>
        )}
      </div>
    </div>
  )
}

function DocList({
  title,
  icon: Icon,
  items,
  loading,
  onDownload,
  onPreview,
  onEdit,
  onDelete,
  emptyText,
}: {
  title: string
  icon: React.ElementType
  items: LeadDocumentRecord[]
  loading: boolean
  onDownload: (doc: LeadDocumentRecord) => void
  onPreview?: (doc: LeadDocumentRecord) => void
  onEdit?: (doc: LeadDocumentRecord) => void
  onDelete?: (doc: LeadDocumentRecord) => void
  emptyText: string
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
      <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
        <Icon size={14} /> {title} ({items.length})
      </h4>
      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-400 gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" /> Đang tải…
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-4 text-center">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.map((doc) => (
            <DocRow
              key={doc.id}
              doc={doc}
              onDownload={onDownload}
              onPreview={onPreview}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ContractDocList({
  contracts,
  loading,
  onDownload,
  onPreview,
  onEdit,
  onDelete,
  emptyText,
}: {
  contracts: LeadDocumentRecord[]
  loading: boolean
  onDownload: (doc: LeadDocumentRecord) => void
  onPreview?: (doc: LeadDocumentRecord) => void
  onEdit?: (doc: LeadDocumentRecord) => void
  onDelete?: (doc: LeadDocumentRecord) => void
  emptyText: string
}) {
  const { mainContracts, appendicesByParent, appendixCount } = useMemo(() => {
    const main = contracts.filter((d) => !d.parentDocumentId && !d.isAppendix)
    const byParent: Record<string, LeadDocumentRecord[]> = {}
    let appendixTotal = 0
    for (const doc of contracts) {
      if (!doc.parentDocumentId && !doc.isAppendix) continue
      appendixTotal += 1
      const pid = doc.parentDocumentId || ""
      if (!byParent[pid]) byParent[pid] = []
      byParent[pid].push(doc)
    }
    for (const pid of Object.keys(byParent)) {
      byParent[pid].sort((a, b) => (a.version || 0) - (b.version || 0))
    }
    return { mainContracts: main, appendicesByParent: byParent, appendixCount: appendixTotal }
  }, [contracts])

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
      <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
        <FileSignature size={14} />
        Phiên bản hợp đồng ({mainContracts.length})
        {appendixCount > 0 ? <span className="text-violet-600 font-bold">· {appendixCount} phụ lục</span> : null}
      </h4>
      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-400 gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" /> Đang tải…
        </div>
      ) : mainContracts.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-4 text-center">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {mainContracts.map((contract) => (
            <div key={contract.id} className="space-y-1.5">
              <DocRow
                doc={contract}
                onDownload={onDownload}
                onPreview={onPreview}
                onEdit={onEdit}
                onDelete={onDelete}
              />
              {(appendicesByParent[contract.id] ?? []).map((pl) => (
                <DocRow
                  key={pl.id}
                  doc={pl}
                  indent
                  onDownload={onDownload}
                  onPreview={onPreview}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ))}
          {contracts
            .filter((d) => (d.parentDocumentId || d.isAppendix) && !mainContracts.some((m) => m.id === d.parentDocumentId))
            .map((pl) => (
              <DocRow
                key={pl.id}
                doc={pl}
                indent
                onDownload={onDownload}
                onPreview={onPreview}
                onDelete={onDelete}
              />
            ))}
        </div>
      )}
    </div>
  )
}

export function LeadDocumentsTab({
  leadId,
  lead,
  onRestoreQuote,
  onRestoreContract,
  onDocumentsLoaded,
}: {
  leadId: string
  lead?: Lead
  onRestoreQuote?: (payload: QuotePayload, doc: LeadDocumentRecord) => void
  onRestoreContract?: (payload: ContractPayload, doc: LeadDocumentRecord) => void
  onDocumentsLoaded?: (docs: LeadDocumentRecord[]) => void
}) {
  const [docs, setDocs] = useState<LeadDocumentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [previewDoc, setPreviewDoc] = useState<LeadDocumentRecord | null>(null)
  const [previewKey, setPreviewKey] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<LeadDocumentRecord | null>(null)
  const onDocumentsLoadedRef = useRef(onDocumentsLoaded)
  onDocumentsLoadedRef.current = onDocumentsLoaded

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    setError("")
    try {
      const data = await api.leadDocuments.list(leadId)
      setDocs(data)
      onDocumentsLoadedRef.current?.(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được tài liệu")
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    void load()
  }, [load])

  const quotes = docs.filter((d) => d.type === "quote")
  const contracts = docs.filter((d) => d.type === "contract")
  const solutions = docs.filter((d) => d.type === "solution")

  const handleDownload = async (doc: LeadDocumentRecord) => {
    try {
      await api.leadDocuments.downloadFile(
        leadId,
        doc.id,
        doc.downloadName || `${doc.label}.docx`,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tải file thất bại")
    }
  }

  const handleRestore = async (doc: LeadDocumentRecord) => {
    try {
      const detail = await api.leadDocuments.get(leadId, doc.id)
      if (!detail.payload) throw new Error("Không có dữ liệu")
      if (doc.type === "quote") {
        onRestoreQuote?.(detail.payload as QuotePayload, doc)
      } else {
        onRestoreContract?.(detail.payload as ContractPayload, doc)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không mở được bản soạn thảo")
    }
  }

  const handleDelete = (doc: LeadDocumentRecord) => {
    setDeleteTarget(doc)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await api.leadDocuments.delete(leadId, deleteTarget.id)
      if (previewDoc?.id === deleteTarget.id) setPreviewDoc(null)
      await load({ silent: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xóa thất bại")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-gray-500">
          Lưu tạo phiên bản mới; Sửa ghi đè phiên bản đã chọn. File Word lưu trên server.
        </p>
        <Button type="button" variant="outline" size="sm" className="text-xs font-bold h-8" onClick={() => void load({ silent: true })}>
          <RefreshCw size={13} className="mr-1" /> Làm mới
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

      <DocList
        title="Giải pháp"
        icon={Box}
        items={solutions}
        loading={loading && solutions.length === 0}
        onDownload={handleDownload}
        onPreview={(doc) => { setPreviewDoc(doc); setPreviewKey((k) => k + 1) }}
        onDelete={handleDelete}
        emptyText="Chưa có file giải pháp nào. Tải lên ở tab Giải pháp."
      />

      <DocList
        title="Phiên bản báo giá"
        icon={FileText}
        items={quotes}
        loading={loading && quotes.length === 0}
        onDownload={handleDownload}
        onPreview={(doc) => { setPreviewDoc(doc); setPreviewKey((k) => k + 1) }}
        onEdit={onRestoreQuote ? handleRestore : undefined}
        onDelete={handleDelete}
        emptyText="Chưa lưu báo giá nào. Dùng nút Lưu ở tab Báo giá."
      />

      <ContractDocList
        contracts={contracts}
        loading={loading && contracts.filter((d) => !d.parentDocumentId && !d.isAppendix).length === 0}
        onDownload={handleDownload}
        onPreview={(doc) => { setPreviewDoc(doc); setPreviewKey((k) => k + 1) }}
        onEdit={onRestoreContract ? handleRestore : undefined}
        onDelete={handleDelete}
        emptyText="Chưa có hợp đồng. Tạo ở tab Hợp đồng."
      />

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
            loadBlob={() => api.leadDocuments.fileBlob(leadId, previewDoc.id)}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa tài liệu?"
        message={`Xóa "${deleteTarget?.label}"? Hành động này không hoàn tác.`}
        confirmText="Xóa"
        type="danger"
      />
    </div>
  )
}
