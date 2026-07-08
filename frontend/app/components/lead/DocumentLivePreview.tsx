import React, { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { api, ContractPayload, LeadDocumentRecord, QuotePayload } from "../../../lib/api"
import { Lead } from "../../types"
import { ContractDocxPreview } from "./ContractDocxPreview"
import { QuoteDocxPreview } from "./QuoteDocxPreview"
import { enrichSavedQuotePayload } from "./quotePayloadUtils"

export function DocumentLivePreview({
  leadId,
  lead,
  doc,
  refreshKey,
}: {
  leadId: string
  lead?: Lead
  doc: LeadDocumentRecord
  refreshKey: number
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [quotePayload, setQuotePayload] = useState<QuotePayload | null>(null)
  const [contractPayload, setContractPayload] = useState<ContractPayload | null>(null)
  const leadRef = useRef(lead)
  leadRef.current = lead

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError("")
      try {
        const detail = await api.leadDocuments.get(leadId, doc.id)
        if (cancelled) return
        if (!detail.payload) throw new Error("Không có dữ liệu để xem trước")
        if (doc.type === "quote") {
          setQuotePayload(enrichSavedQuotePayload(leadRef.current, detail.payload as QuotePayload))
          setContractPayload(null)
        } else {
          setContractPayload(detail.payload as ContractPayload)
          setQuotePayload(null)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Không tải được xem trước")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [leadId, doc.id, doc.type, refreshKey])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-gray-500 text-sm">
        <Loader2 size={18} className="animate-spin" />
        Đang tạo xem trước…
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-600 font-semibold py-8 text-center">{error}</p>
  }

  if (quotePayload) {
    return <QuoteDocxPreview payload={quotePayload} refreshKey={refreshKey} variant="modal" />
  }

  if (contractPayload) {
    return <ContractDocxPreview payload={contractPayload} refreshKey={refreshKey} variant="modal" />
  }

  return null
}
