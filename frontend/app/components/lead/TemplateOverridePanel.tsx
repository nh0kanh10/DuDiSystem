import React, { useCallback, useEffect, useRef, useState } from "react"
import { Download, FileUp, Loader2, RotateCcw } from "lucide-react"
import { api, TemplateInfo, TemplateType } from "../../../lib/api"
import { Button } from "../ui/button"
import ConfirmModal from "../ui/ConfirmModal"

function formatSize(bytes: number) {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("vi-VN")
}

export function TemplateOverridePanel({
  type,
  compact = false,
  onChanged,
}: {
  type: TemplateType
  compact?: boolean
  onChanged?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [info, setInfo] = useState<TemplateInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await api.templates.get(type)
      setInfo(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được thông tin template")
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    load()
  }, [load])

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return
    if (!/\.docx$/i.test(file.name)) {
      setError("Chỉ chấp nhận file .docx")
      return
    }
    setUploading(true)
    setError("")
    setSuccess("")
    try {
      const updated = await api.templates.upload(type, file)
      setInfo(updated)
      setSuccess("Đã cập nhật template. Xuất file mới sẽ dùng bản này.")
      onChanged?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload thất bại")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleReset = () => {
    if (!info?.hasOverride) return
    setShowResetConfirm(true)
  }

  const handleResetConfirm = async () => {
    setUploading(true)
    setError("")
    setSuccess("")
    try {
      const updated = await api.templates.reset(type)
      setInfo(updated)
      setSuccess("Đã khôi phục template mặc định.")
      onChanged?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Khôi phục thất bại")
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async () => {
    setError("")
    try {
      await api.templates.download(type)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tải template thất bại")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
        <Loader2 size={14} className="animate-spin" /> Đang tải template…
      </div>
    )
  }

  if (!isExpanded) {
    return (
      <div className={`rounded-xl border border-gray-100 bg-gray-50/80 ${compact ? "p-3" : "p-4"}`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Template Word</p>
            <p className="text-xs font-bold text-gray-800 mt-0.5 flex items-center gap-2">
              {info?.label ?? (type === "quote" ? "Báo giá" : "Hợp đồng")}
              <span
                className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                  info?.source === "override"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {info?.source === "override" ? "Bản tùy chỉnh" : "Mặc định"}
              </span>
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-8 text-gray-500"
            onClick={() => setIsExpanded(true)}
          >
            Tuỳ chỉnh template
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-gray-100 bg-gray-50/80 ${compact ? "p-3" : "p-4"} space-y-3`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Template Word</p>
          <p className="text-sm font-bold text-gray-800 mt-0.5">
            {info?.label ?? (type === "quote" ? "Báo giá" : "Hợp đồng")}
            <span
              className={`ml-2 text-[10px] font-black px-2 py-0.5 rounded-full ${
                info?.source === "override"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {info?.source === "override" ? "Bản tùy chỉnh" : "Mặc định"}
            </span>
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            {info?.originalName ? `${info.originalName} · ` : ""}
            Cập nhật: {formatDate(info?.updatedAt ?? null)} · {formatSize(info?.size ?? 0)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={handleDownload}
            disabled={!info?.exists}
          >
            <Download size={13} className="mr-1" /> Tải mẫu
          </Button>
          {info?.hasOverride && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={handleReset}
              disabled={uploading}
            >
              <RotateCcw size={13} className="mr-1" /> Mặc định
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs h-8 text-gray-400 hover:text-gray-600"
            onClick={() => setIsExpanded(false)}
          >
            Đóng
          </Button>
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click() }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed px-4 py-5 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-[#C62828] bg-red-50/50"
            : "border-gray-200 bg-white hover:border-[#C62828]/40 hover:bg-red-50/20"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" /> Đang tải lên…
          </div>
        ) : (
          <>
            <FileUp size={22} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-bold text-gray-700">
              Kéo thả file .docx hoặc bấm để chọn
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Ghi đè template hiện tại — giữ nguyên placeholder <code className="text-[9px]">{"{{...}}"}</code>
            </p>
          </>
        )}
      </div>

      {!compact && (
        <p className="text-[10px] text-gray-400 leading-relaxed">
          Sửa màu chữ, font, logo… trong Word rồi upload lại. Hệ thống lưu bản tùy chỉnh riêng, không sửa file gốc trong repo.
        </p>
      )}

      {success && <p className="text-xs text-green-700 font-semibold">{success}</p>}
      {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetConfirm}
        title="Khôi phục template mặc định?"
        message="Hành động này sẽ xóa template tùy chỉnh hiện tại và khôi phục về bản mặc định của hệ thống."
        confirmText="Khôi phục"
        type="warning"
      />
    </div>
  )
}
