import React, { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { renderAsync } from "docx-preview"
import { DOCX_PREVIEW_RENDER_OPTIONS, DOCX_PREVIEW_WRAPPER_CLASS } from "./docxPreviewOptions"

export function DocxFilePreview({
  loadBlob,
  refreshKey,
  docId,
  downloadName,
}: {
  loadBlob: () => Promise<Blob>
  refreshKey: number
  docId?: string
  downloadName?: string
}) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const styleRef = useRef<HTMLDivElement>(null)
  const loadBlobRef = useRef(loadBlob)
  loadBlobRef.current = loadBlob
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [objectUrl, setObjectUrl] = useState("")

  const ext = (downloadName || "").toLowerCase().split(".").pop() || ""
  const isPdf = ext === "pdf"
  const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext)
  const isDocx = ["docx", "doc"].includes(ext) || ext === ""

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [objectUrl])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const bodyEl = bodyRef.current
      setLoading(true)
      setError("")
      setObjectUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return ""
      })
      if (bodyEl) {
        bodyEl.innerHTML = ""
      }
      if (styleRef.current) {
        styleRef.current.innerHTML = ""
      }

      try {
        const blob = await loadBlobRef.current()
        if (cancelled) return

        if (isPdf || isImage) {
          const url = URL.createObjectURL(blob)
          setObjectUrl(url)
        } else if (isDocx) {
          if (!bodyEl) return
          await renderAsync(blob, bodyEl, styleRef.current ?? bodyEl, DOCX_PREVIEW_RENDER_OPTIONS)
        } else {
          setError("Không hỗ trợ xem trước định dạng này")
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Không hiển thị được xem trước")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [refreshKey, docId, isPdf, isImage, isDocx])

  return (
    <div className="relative rounded-2xl border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-[60vh] h-full w-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white/80 text-gray-700 text-sm font-semibold">
          <Loader2 size={18} className="animate-spin" />
          Đang tải xem trước…
        </div>
      )}
      {error && (
        <p className="absolute top-3 left-3 right-3 z-20 text-sm text-red-100 font-semibold bg-red-900/80 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div ref={styleRef} aria-hidden className="hidden" />
      {isPdf && objectUrl && (
        <iframe
          src={`${objectUrl}#view=FitH`}
          className="flex-1 w-full h-full border-0"
        />
      )}
      {isImage && objectUrl && (
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-50 overflow-auto">
          <img src={objectUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
        </div>
      )}
      <div
        ref={bodyRef}
        className={`${DOCX_PREVIEW_WRAPPER_CLASS} flex-1 min-h-0 ${(!isDocx || error || loading) ? "hidden" : ""}`}
      />
    </div>
  )
}
