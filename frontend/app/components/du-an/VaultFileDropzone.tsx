import React, { useRef, useState } from "react"
import { FileText, Upload, X } from "lucide-react"
import { VaultFileAttachment } from "../../types"

const MAX_BYTES = 15 * 1024 * 1024

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function VaultFileDropzone({
  file,
  existingFile,
  onFile,
  label = "Tệp đính kèm",
  hint = "Kéo thả file vào đây hoặc bấm để chọn · Tối đa 15MB",
}: {
  file: File | null
  existingFile?: { name: string; size: number } | null
  onFile: (file: File | null) => void
  label?: string
  hint?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState("")

  const display = file
    ? { name: file.name, size: file.size, isNew: true }
    : existingFile
      ? { name: existingFile.name, size: existingFile.size, isNew: false }
      : null

  const processFile = (f: File) => {
    setError("")
    if (f.size > MAX_BYTES) {
      setError("File tối đa 15MB")
      return
    }
    onFile(f)
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-600">{label}</label>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click() }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f) processFile(f)
        }}
        onClick={() => { if (!display) inputRef.current?.click() }}
        className={`rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
          dragOver
            ? "border-[#C62828] bg-red-50/60"
            : display
              ? "border-emerald-200 bg-emerald-50/40"
              : "border-gray-200 bg-gray-50/80 hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
        }`}
      >
        {display ? (
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-lg bg-white border border-emerald-100 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-800 truncate">{display.name}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {formatSize(display.size)}
                {!display.isNew ? " · File đã lưu trên server" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onFile(null)
                if (inputRef.current) inputRef.current.value = ""
              }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors shrink-0"
              title="Gỡ file"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <Upload size={22} className={dragOver ? "text-[#C62828]" : "text-gray-400"} />
            <p className="text-xs font-semibold text-gray-600">{hint}</p>
            <p className="text-[10px] text-gray-400">Word, PDF, Excel, ảnh, zip...</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) processFile(f)
        }}
      />
      {error ? <p className="text-[11px] text-red-600 font-semibold">{error}</p> : null}
      {!display ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-[11px] font-bold text-[#C62828] hover:underline"
        >
          Chọn file từ máy
        </button>
      ) : null}
    </div>
  )
}

export function downloadVaultAttachment(file: VaultFileAttachment) {
  if (!file.dataUrl) return
  const a = document.createElement("a")
  a.href = file.dataUrl
  a.download = file.name
  a.click()
}

export function previewVaultAttachment(file: VaultFileAttachment) {
  if (!file.dataUrl) return
  window.open(file.dataUrl, "_blank", "noopener,noreferrer")
}
