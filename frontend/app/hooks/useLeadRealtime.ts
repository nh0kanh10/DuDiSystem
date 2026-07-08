import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Lead } from "@/app/types"
import { isWaitingForFormSubmit } from "@/app/components/lead/leadRequirementForm"

const DEFAULT_POLL_MS = 3000

export function useLeadRealtime(
  leadId: string,
  options?: { enabled?: boolean; pollInterval?: number },
) {
  const enabled = options?.enabled !== false
  const pollInterval = options?.pollInterval ?? DEFAULT_POLL_MS
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState("")

  const refresh = useCallback(async (silent = false) => {
    if (!enabled) return null
    if (silent) setSyncing(true)
    else {
      setLoading(true)
      setError("")
    }
    try {
      const data = await api.leads.get(leadId)
      setLead(data)
      return data
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không tải được lead"
      if (!silent) setError(msg)
      return null
    } finally {
      if (silent) setSyncing(false)
      else setLoading(false)
    }
  }, [enabled, leadId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!enabled || !isWaitingForFormSubmit(lead)) return
    const timer = setInterval(() => void refresh(true), pollInterval)
    return () => clearInterval(timer)
  }, [enabled, lead?.formStatus, refresh, pollInterval])

  return { lead, setLead, loading, syncing, error, setError, refresh }
}
