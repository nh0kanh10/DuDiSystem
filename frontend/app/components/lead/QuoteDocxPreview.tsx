import React, { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { renderAsync } from "docx-preview"
import { api, QuotePayload } from "../../../lib/api"
import { DOCX_PREVIEW_MODAL_CLASS, DOCX_PREVIEW_RENDER_OPTIONS, DOCX_PREVIEW_WRAPPER_CLASS } from "./docxPreviewOptions"

export function QuoteDocxPreview({
  payload,
  refreshKey,
  variant = "inline",
}: {
  payload: QuotePayload
  refreshKey: number
  variant?: "inline" | "modal"
}) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const styleRef = useRef<HTMLDivElement>(null)
  const payloadRef = useRef(payload)
  payloadRef.current = payload
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const bodyEl = bodyRef.current
      if (!bodyEl) return
      setLoading(true)
      setError("")
      bodyEl.innerHTML = ""
      if (styleRef.current) styleRef.current.innerHTML = ""
      try {
        const blob = await api.quotes.generateDocxBlob(payloadRef.current)
        if (cancelled) return
        await renderAsync(blob, bodyEl, styleRef.current ?? bodyEl, DOCX_PREVIEW_RENDER_OPTIONS)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Không hiển thị được xem trước")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => { cancelled = true }
  }, [refreshKey])

  return (
    <div className={variant === "modal" ? "relative w-full" : "relative rounded-2xl border border-gray-200 overflow-hidden"}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white/80 text-gray-700 text-sm font-semibold">
          <Loader2 size={18} className="animate-spin" />
          Đang tạo xem trước…
        </div>
      )}
      {error && (
        <p className="absolute top-3 left-3 right-3 z-20 text-sm text-red-100 font-semibold bg-red-900/80 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div ref={styleRef} aria-hidden className="hidden" />
      <div
        ref={bodyRef}
        className={variant === "modal" ? DOCX_PREVIEW_MODAL_CLASS : DOCX_PREVIEW_WRAPPER_CLASS}
      />
    </div>
  )
}
