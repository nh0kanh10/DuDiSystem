import { useMemo, useState } from "react"
import { ChevronDown, Loader2, Search, UserPlus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

export type CrmLeadOption = { id: string; code: string; name: string; status?: string }

const SEARCH_THRESHOLD = 4
const VISIBLE_MAX = 8

type CrmLeadCellProps = {
  record: { id: string; convertedLeadId?: string; convertedLeadCode?: string }
  converting: boolean
  onOpenLead?: (leadId: string) => void
  onCreateNew: () => void
  fetchLeads: (crmId: string) => Promise<CrmLeadOption[]>
  variant?: "admin" | "staff"
}

function LeadRow({
  lead,
  onOpen,
}: {
  lead: CrmLeadOption
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left rounded-md hover:bg-slate-50 active:bg-slate-100 transition-colors group"
    >
      <span className="shrink-0 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 group-hover:bg-emerald-100">
        {lead.code}
      </span>
      <span className="text-xs text-slate-600 truncate min-w-0" title={lead.name}>
        {lead.name || "—"}
      </span>
    </button>
  )
}

export function CrmLeadCell({
  record,
  converting,
  onOpenLead,
  onCreateNew,
  fetchLeads,
  variant = "admin",
}: CrmLeadCellProps) {
  const [leads, setLeads] = useState<CrmLeadOption[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const hasLead = Boolean(record.convertedLeadId)

  const btnIdle =
    variant === "staff"
      ? "inline-flex items-center gap-1 px-1.5 py-1 rounded-lg border border-[#efd7da] bg-white text-[#6f565a] hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50 transition"
      : "inline-flex items-center gap-1 px-1.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50 transition"

  const loadLeads = async () => {
    setLoading(true)
    setQuery("")
    try {
      const rows = await fetchLeads(record.id)
      setLeads(rows)
    } catch {
      setLeads(
        record.convertedLeadId
          ? [{ id: record.convertedLeadId, code: record.convertedLeadCode || "", name: "" }]
          : [],
      )
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return leads
    return leads.filter(
      (l) => l.code.toLowerCase().includes(q) || l.name.toLowerCase().includes(q),
    )
  }, [leads, query])

  if (!hasLead) {
    return (
      <button
        type="button"
        disabled={converting}
        onClick={onCreateNew}
        title="Tạo Lead từ data này"
        className={`p-1.5 rounded-lg transition disabled:opacity-50 ${
          variant === "staff"
            ? "text-[#8b6b70] hover:text-[#E8231A] hover:bg-[#fff1f2]"
            : "text-gray-400 hover:text-[#C62828] hover:bg-red-50"
        }`}
      >
        {converting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
      </button>
    )
  }

  const shortCode = record.convertedLeadCode?.replace(/^LD-\d+-/, "") || "···"

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) void loadLeads() }}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={record.convertedLeadCode ? `Lead ${record.convertedLeadCode}` : "Chọn lead"}
          className={`${btnIdle} disabled:opacity-50 text-[10px] font-semibold`}
        >
          <span className="font-mono text-emerald-700">{shortCode}</span>
          <ChevronDown size={11} className="opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[268px] p-0 z-[200] bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden"
      >
        <div className="px-3 py-2 border-b border-gray-100 bg-slate-50/80 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Lead{leads.length > 0 ? ` (${leads.length})` : ""}
          </span>
          {loading ? <Loader2 size={12} className="animate-spin text-slate-400" /> : null}
        </div>

        {!loading && leads.length > SEARCH_THRESHOLD ? (
          <div className="px-2 py-1.5 border-b border-gray-100">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Tìm mã hoặc tên..."
                className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
              />
            </div>
          </div>
        ) : null}

        <div
          className="py-1 overflow-y-auto overscroll-contain"
          style={{ maxHeight: `${VISIBLE_MAX * 36}px` }}
        >
          {loading ? (
            <p className="px-3 py-4 text-xs text-center text-slate-400">Đang tải...</p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-4 text-xs text-center text-slate-400">
              {query ? "Không tìm thấy lead" : "Chưa có lead"}
            </p>
          ) : (
            filtered.map((l) => (
              <LeadRow key={l.id} lead={l} onOpen={() => onOpenLead?.(l.id)} />
            ))
          )}
        </div>

        {leads.length > VISIBLE_MAX && !loading ? (
          <p className="px-3 py-1 text-[10px] text-center text-slate-400 border-t border-gray-50">
            Cuộn để xem thêm
          </p>
        ) : null}

        <div className="border-t border-gray-100 p-1 bg-slate-50/50">
          <DropdownMenuItem
            className="text-xs gap-2 cursor-pointer rounded-md text-[#C62828] focus:bg-white focus:text-[#C62828]"
            disabled={converting}
            onClick={onCreateNew}
          >
            {converting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            Tạo lead mới
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
