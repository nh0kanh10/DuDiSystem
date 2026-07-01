import React, { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import {
  Search, Check, X, Plus, FileText,
  Calendar, Clock, TrendingUp,
  LayoutGrid, ClipboardList,
  User, Zap, Sun, Sunset,
  CheckCircle2, XCircle, AlertCircle, Building2,
  Eye, ChevronRight, ChevronLeft, PenLine, PartyPopper,
  CalendarDays, ArrowRight, Moon, CalendarRange, RotateCcw,
} from "lucide-react"
import { api } from "@/lib/api"
import { CustomSelect } from "../ui/CustomSelect"
import { CustomCombobox } from "../ui/CustomCombobox"
import { CustomDatePicker } from "../ui/CustomDatePicker"
import { Employee } from "../../types"

export type TOStatus = "approved" | "pending" | "rejected" | "cancelled"

export interface TimeOffSlot {
  id: string
  empId: string
  empName: string
  empCode: string
  department: string
  day: number
  session: "sang" | "chieu"
  sessionMode?: "sang" | "chieu" | "all"
  isMultiDay?: boolean
  reason: string
  status: TOStatus
  week: string
  registeredAt: string
  adminNote: string
  processedAt: string
}

export type RequestRecord = {
  id: string
  employeeId: string
  employeeName: string
  department: string
  category: "leave" | "timeoff"
  startDate: string
  endDate: string
  reason: string
  status: "pending" | "approved" | "rejected" | "cancelled"
  submittedAt: string
  session?: "sang" | "chieu" | "all"
}

function initials(name: string): string {
  return name.split(" ").pop()?.charAt(0) ?? "?"
}

function AvatarCircle({ name, photo, size = "md" }: { name: string; photo?: string; size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-10 h-10 text-sm"
  const colors = [
    "from-[#C62828] to-[#E64A19]",
    "from-[#1565C0] to-[#0288D1]",
    "from-[#2E7D32] to-[#388E3C]",
    "from-[#6A1B9A] to-[#8E24AA]",
    "from-[#E65100] to-[#F57C00]",
  ]
  const colorIdx = name.charCodeAt(0) % colors.length
  if (photo) {
    return <img src={photo} alt={name} className={`${s} rounded-full object-cover flex-shrink-0 shadow-sm border border-white/20`} />
  }
  return (
    <div className={`${s} rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white font-black flex-shrink-0 shadow-sm`}>
      {initials(name)}
    </div>
  )
}

function StatusPill({ status }: { status: TOStatus }) {
  const cfg = {
    approved:  { icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Đã duyệt" },
    pending:   { icon: AlertCircle,   cls: "bg-amber-50  text-amber-700  border-amber-200",   label: "Chờ duyệt" },
    rejected:  { icon: XCircle,       cls: "bg-red-50    text-red-700    border-red-200",      label: "Từ chối" },
    cancelled: { icon: XCircle,       cls: "bg-gray-100  text-gray-500   border-gray-200",     label: "Đã hủy" },
  }[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${cfg.cls}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

function SessionPill({ session, isMultiDay }: { session?: string; isMultiDay?: boolean }) {
  if (isMultiDay) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
        Nhiều ngày
      </span>
    )
  }
  switch (session) {
    case "sang":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
          Ca sáng
        </span>
      )
    case "chieu":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
          Ca chiều
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-600 border border-sky-100">
          Cả ngày
        </span>
      )
  }
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/[0.06] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-200 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-gray-300 rounded w-28" />
          <div className="h-2.5 bg-gray-300/70 rounded w-44" />
        </div>
      </div>
      <div className="grid grid-cols-5 divide-x divide-gray-50 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-2 space-y-1.5">
            <div className="flex flex-col items-center gap-1 mb-1.5">
              <div className="h-2.5 bg-gray-100 rounded w-9" />
              <div className="h-2 bg-gray-100 rounded w-7" />
            </div>
            <div className="h-14 bg-gray-100 rounded-xl" />
            <div className="h-14 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

function SessionBlock({
  slot, session, empId, empName, day,
  onApprove, onReject, onClick, onQuickAdd, disabled,
}: {
  slot: TimeOffSlot | undefined
  session: "sang" | "chieu"
  empId: string
  empName: string
  day: number
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onClick: (slot: TimeOffSlot) => void
  onQuickAdd: (info: { empId: string; empName: string; day: number; session: "sang" | "chieu" }) => void
  disabled?: boolean
}) {
  const isMorning = session === "sang"
  const sessionLabel = isMorning ? "Sáng" : "Chiều"
  const SessionIcon = isMorning ? Sun : Sunset

  if (!slot) {
    return (
      <div className="relative group/cell">
        <button
          onClick={() => onQuickAdd({ empId, empName, day, session })}
          className="group w-full h-14 rounded-xl border-2 border-dashed border-gray-100 hover:border-[#C62828]/30 hover:bg-red-50/30 flex items-center justify-center"
          title={`Thêm nghỉ ${sessionLabel}`}
        >
          <Plus size={14} className="text-gray-200 group-hover:text-[#C62828]/50 transition-colors" />
        </button>
      </div>
    )
  }

  const statusStyles: Record<TOStatus, string> = {
    approved:  "bg-emerald-50 border-emerald-300 text-emerald-900",
    pending:   "bg-amber-50  border-amber-300  text-amber-900",
    rejected:  "bg-red-50    border-red-300    text-red-900",
    cancelled: "bg-gray-50   border-gray-300   text-gray-500",
  }
  const sessionAccent: Record<"sang" | "chieu", string> = {
    sang:  "text-teal-600",
    chieu: "text-orange-500",
  }

  return (
    <div className="relative group/cell">
      <button
        onClick={() => onClick(slot)}
        className={`w-full h-14 rounded-xl border-2 px-2 py-1.5 text-left flex flex-col justify-between overflow-hidden ${statusStyles[slot.status]} hover:brightness-[0.98]`}
      >
        <div className="flex items-center gap-1 flex-shrink-0">
          <SessionIcon size={10} className={sessionAccent[session]} />
          <span className="text-[10px] font-black tracking-wide">{sessionLabel}</span>
        </div>
        <p className="text-[10px] font-semibold leading-tight w-full overflow-hidden whitespace-nowrap text-ellipsis">{slot.reason}</p>
      </button>

      {slot.status === "pending" && (
        <div className="absolute inset-0 bg-white/95 rounded-xl flex items-center justify-center gap-1.5 opacity-0 group-hover/cell:opacity-100 z-10">
          {disabled ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#C62828] rounded-full animate-spin" />
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onApprove(slot.id) }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black active:scale-95 shadow-sm"
              >
                <Check size={10} className="stroke-[3px]" /> Duyệt
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReject(slot.id) }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-black active:scale-95 shadow-sm"
              >
                <X size={10} className="stroke-[3px]" /> Từ chối
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const STATUS_STYLES: Record<TOStatus, { card: string; badge: string; dot: string }> = {
  approved:  { card: "bg-emerald-50 border-emerald-300", badge: "bg-emerald-500", dot: "bg-emerald-400" },
  pending:   { card: "bg-amber-50 border-amber-300",   badge: "bg-amber-500",  dot: "bg-amber-400"  },
  rejected:  { card: "bg-red-50 border-red-300",     badge: "bg-red-500",    dot: "bg-red-400"    },
  cancelled: { card: "bg-gray-50 border-gray-300",     badge: "bg-gray-400",   dot: "bg-gray-400"   },
}
const STATUS_TEXT: Record<TOStatus, string> = {
  approved:  "text-emerald-900",
  pending:   "text-amber-900",
  rejected:  "text-red-900",
  cancelled: "text-gray-500",
}

function FullDayBlock({
  slot,
  onClick,
  onApprove,
  onReject,
  disabled,
}: {
  slot: TimeOffSlot
  onClick: (slot: TimeOffSlot) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  disabled?: boolean
}) {
  const s = STATUS_STYLES[slot.status]
  const t = STATUS_TEXT[slot.status]
  return (
    <div className="relative group/cell col-span-1">
      <button
        onClick={() => onClick(slot)}
        className={`w-full rounded-xl border-2 px-2.5 py-2 text-left overflow-hidden ${s.card} ${t} hover:brightness-[0.98]`}
        style={{ height: "calc(7rem + 0.375rem)" }}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black text-white ${s.badge}`}>
            <Moon size={8} /> Cả ngày
          </span>
        </div>
        <p className="text-[10px] font-semibold leading-snug line-clamp-2">{slot.reason}</p>
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          <span className="text-[9px] font-bold opacity-70">
            {slot.status === "approved" ? "Duyệt" : slot.status === "rejected" ? "Từ chối" : slot.status === "cancelled" ? "Đã hủy" : "Chờ"}
          </span>
        </div>
      </button>
      {slot.status === "pending" && (
        <div className="absolute inset-0 bg-white/95 rounded-xl flex items-center justify-center gap-1.5 opacity-0 group-hover/cell:opacity-100 z-10">
          {disabled ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#C62828] rounded-full animate-spin" />
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onApprove(slot.id) }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black active:scale-95 shadow-sm"
              >
                <Check size={10} className="stroke-[3px]" /> Duyệt
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReject(slot.id) }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-black active:scale-95 shadow-sm"
              >
                <X size={10} className="stroke-[3px]" /> Từ chối
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MultiDayFullBlock({
  slot,
  colSpan,
  onClick,
  onApprove,
  onReject,
  disabled,
  isLeftCont = false,
  isRightCont = false,
}: {
  slot: TimeOffSlot
  colSpan: number
  onClick: (slot: TimeOffSlot) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  disabled?: boolean
  isLeftCont?: boolean
  isRightCont?: boolean
}) {
  const s = STATUS_STYLES[slot.status]
  const t = STATUS_TEXT[slot.status]

  const sessionIcon = slot.sessionMode === "sang"
    ? <Sun size={12} className="opacity-70 flex-shrink-0" />
    : slot.sessionMode === "chieu"
    ? <Sunset size={12} className="opacity-70 flex-shrink-0" />
    : <Moon size={12} className="opacity-70 flex-shrink-0" />
  const sessionLabel = slot.sessionMode === "sang" ? "Buổi sáng" : slot.sessionMode === "chieu" ? "Buổi chiều" : "Cả ngày"

  return (
    <div className="relative group/cell h-full">
      <button
        onClick={() => onClick(slot)}
        className={`relative w-full h-full min-h-[6.875rem] border-2 p-3 text-left flex flex-col gap-2 overflow-hidden ${s.card} ${t} hover:brightness-[0.98] ${
          isLeftCont ? "rounded-l-none border-l-dashed" : "rounded-l-xl"
        } ${isRightCont ? "rounded-r-none border-r-dashed" : "rounded-r-xl"}`}
      >
        {colSpan > 1 && (
          <div className="absolute inset-0 pointer-events-none flex z-0">
            {Array.from({ length: colSpan }).map((_, idx) => {
              if (idx === colSpan - 1) return null
              return (
                <div
                  key={idx}
                  className="h-full border-r border-dashed border-current/[0.08]"
                  style={{ width: `${100 / colSpan}%` }}
                />
              )
            })}
          </div>
        )}
        <div className="relative z-10 flex flex-col gap-2 h-full w-full">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isLeftCont && (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/5 text-[8px] font-black text-black/50 uppercase">
                <ChevronLeft size={8} /> Trước
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black text-white ${s.badge}`}>
              <CalendarRange size={9} /> {colSpan} ngày
            </span>
            {isRightCont && (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/5 text-[8px] font-black text-black/50 uppercase">
                Sau <ChevronRight size={8} />
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold opacity-60">
              {sessionIcon} {sessionLabel}
            </span>
          </div>
          <p className="text-[11px] font-black leading-snug flex-1 line-clamp-3">{slot.reason}</p>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
            <span className="text-[9px] font-bold opacity-60">
              {slot.status === "approved" ? "✓ Đã duyệt" : slot.status === "rejected" ? "✗ Từ chối" : slot.status === "cancelled" ? "✗ Đã hủy" : "● Chờ duyệt"}
            </span>
          </div>
        </div>
      </button>
      {slot.status === "pending" && (
        <div className="absolute inset-0 bg-white/95 rounded-xl flex items-center justify-center gap-1.5 opacity-0 group-hover/cell:opacity-100 z-10">
          {disabled ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#C62828] rounded-full animate-spin" />
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onApprove(slot.id) }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black active:scale-95 shadow-sm"
              >
                <Check size={10} className="stroke-[3px]" /> Duyệt
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReject(slot.id) }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-black active:scale-95 shadow-sm"
              >
                <X size={10} className="stroke-[3px]" /> Từ chối
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}



function getISOWeek(d: Date): number {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  dt.setUTCDate(dt.getUTCDate() + 4 - (dt.getUTCDay() || 7))
  const y = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1))
  return Math.ceil((((dt.getTime() - y.getTime()) / 86400000) + 1) / 7)
}

function computeWeeksInMonth(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay  = new Date(year, month, 0)
  const dow = firstDay.getDay() === 0 ? 7 : firstDay.getDay()
  const cursor = new Date(firstDay)
  cursor.setDate(cursor.getDate() - (dow - 1))
  const fmt = (dt: Date) =>
    `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}`
  const result: { value: string; label: string; startDate: Date }[] = []
  while (cursor <= lastDay) {
    const mon = new Date(cursor)
    const sun = new Date(cursor); sun.setDate(sun.getDate() + 6)
    result.push({ value: `W${getISOWeek(mon)}`, label: `Tuần ${getISOWeek(mon)} · ${fmt(mon)} — ${fmt(sun)}`, startDate: new Date(mon) })
    cursor.setDate(cursor.getDate() + 7)
  }
  return result
}

function parseVnDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split("/").map(Number)
  return new Date(year, month - 1, day)
}

function isSameDate(d1: Date, d2: Date): boolean {
  return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
}

function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
}

function getDateRange(startStr: string, endStr: string): Date[] {
  const start = parseVnDate(startStr)
  const end = parseVnDate(endStr)
  const dates: Date[] = []
  const current = new Date(start)
  while (current <= end) {
    if (!isWeekend(current)) {
      dates.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }
  return dates
}

function getRequestForSlot(
  empId: string,
  dayDate: Date,
  employees: any[],
  requests: RequestRecord[]
): RequestRecord | null {
  const emp = employees.find(e => e.id === empId)
  if (!emp) return null
  return requests.find(req => {
    if (req.employeeId !== emp.id) return false
    const dates = getDateRange(req.startDate, req.endDate)
    return dates.some(d => isSameDate(d, dayDate))
  }) || null
}

function isRequestExpired(req: RequestRecord): boolean {
  if (req.status !== "pending") return false
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = parseVnDate(req.startDate)
    start.setHours(0, 0, 0, 0)
    return start < today
  } catch {
    return false
  }
}

function isSlotExpired(slot: TimeOffSlot, requests: RequestRecord[]): boolean {
  if (slot.status !== "pending") return false
  const reqId = slot.id.includes("-") ? slot.id.split("-")[0] : slot.id
  const req = requests.find(r => r.id === reqId)
  return req ? isRequestExpired(req) : false
}

export default function ApprovalManagement({ 
  selectedBranch = "all",
  onRequestsUpdated
}: { 
  selectedBranch?: string
  onRequestsUpdated?: () => void
}) {
  const COLUMN_COLORS: Record<number, string> = {
    1: "bg-white",
    2: "bg-slate-50/70",
    3: "bg-white",
    4: "bg-slate-50/70",
    5: "bg-white",
  }
  const [requests, setRequests] = useState<RequestRecord[]>([])

  useEffect(() => {
    onRequestsUpdated?.()
  }, [requests, onRequestsUpdated])
  const [tab, setTab] = useState<"leave" | "timeoff" | "stats">("timeoff")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchEmp, setSearchEmp] = useState("")
  const [leaveDeptFilter, setLeaveDeptFilter] = useState("all")
  const [leaveDateFilter, setLeaveDateFilter] = useState("")
  const [leaveSearchFilter, setLeaveSearchFilter] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<TimeOffSlot | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<RequestRecord | null>(null)
  const [adminNote, setAdminNote] = useState("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<"success" | "error">("success")
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1)
  const [weekFilter, setWeekFilter] = useState(() => `W${getISOWeek(new Date())}`)
  const [deptFilter, setDeptFilter] = useState("all")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showToday, setShowToday] = useState(false)
  const [quickAddSlot, setQuickAddSlot] = useState<{ empId: string; empName: string; day: number; session: "sang" | "chieu" } | null>(null)
  const [quickAddReason, setQuickAddReason] = useState("")
  const [quickAddStartDate, setQuickAddStartDate] = useState("")
  const [quickAddEndDate, setQuickAddEndDate] = useState("")
  const [quickAddSessionMode, setQuickAddSessionMode] = useState<"sang" | "chieu" | "all">("all")
  const [confirmAction, setConfirmAction] = useState<{ label: string; count: number; variant: "approve" | "reject"; onConfirm: () => void } | null>(null)
  const [loadingInit, setLoadingInit] = useState(true)
  const [processingIds, setProcessingIds] = useState<string[]>([])
  const [initError, setInitError] = useState(false)
  const [viewEmpId, setViewEmpId] = useState<string | null>(null)
  const [orgNodes, setOrgNodes] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      api.requests.list().then(d => setRequests(d as RequestRecord[])),
      api.employees.list().then(d => setEmployees(d as Employee[])),
      api.orgNodes.list().then(d => setOrgNodes(d as any[])),
    ])
      .catch(() => setInitError(true))
      .finally(() => setLoadingInit(false))
  }, [])

  useEffect(() => {
    if (weekFilter === "all") return
    const weeks = computeWeeksInMonth(selectedYear, selectedMonth)
    if (weeks.length > 0 && !weeks.find(w => w.value === weekFilter)) {
      setWeekFilter(weeks[0].value)
    }
  }, [selectedYear, selectedMonth, weekFilter])

  useEffect(() => {
    if (tab !== "leave" && weekFilter === "all") {
      const now = new Date()
      setWeekFilter(`W${getISOWeek(now)}`)
    }
  }, [tab, weekFilter])

  const findBranchForNode = (nodeId: string, nodes: any[]): string => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return "all"
    if (node.type === "branch") return node.id
    if (node.parentId) {
      return findBranchForNode(node.parentId, nodes)
    }
    return "all"
  }

  const isEmployeeInBranch = (empId: string, branchId: string) => {
    if (branchId === "all") return true
    const emp = employees.find(e => e.id === empId)
    if (!emp || !emp.orgNodeId) return false
    
    let currentNodeId: string | undefined = emp.orgNodeId
    const visited = new Set<string>()
    
    while (currentNodeId && !visited.has(currentNodeId)) {
      visited.add(currentNodeId)
      if (currentNodeId === branchId) return true
      const node = orgNodes.find(n => n.id === currentNodeId)
      currentNodeId = node?.parentId
    }
    return false
  }

  const slots = useMemo(() => {
    const list: TimeOffSlot[] = []
    requests.forEach(req => {
      try {
        const dates = getDateRange(req.startDate, req.endDate)
        const isMultiDay = req.startDate !== req.endDate
        let sessionMode: "sang" | "chieu" | "all" = "all"
        if (req.session) {
          sessionMode = req.session
        }
        dates.forEach(date => {
          const weekVal = `W${getISOWeek(date)}`
          if (weekVal !== weekFilter) return
          const day = date.getDay() === 0 ? 7 : date.getDay()
          const emp = employees.find(e => e.id === req.employeeId)
          if (!emp) return
          if (selectedBranch !== "all" && !isEmployeeInBranch(req.employeeId, selectedBranch)) return
          const baseSlot = {
            empId: req.employeeId,
            empName: req.employeeName,
            empCode: emp.id || "2026xxxx",
            department: req.department,
            day: day,
            sessionMode,
            isMultiDay,
            reason: req.reason,
            status: req.status as TOStatus,
            week: weekVal,
            registeredAt: req.submittedAt,
            adminNote: "",
            processedAt: "",
          }
          if (sessionMode === "sang" || sessionMode === "all") {
            list.push({ id: `${req.id}-sang-${day}`, session: "sang", ...baseSlot } as TimeOffSlot)
          }
          if (sessionMode === "chieu" || sessionMode === "all") {
            list.push({ id: `${req.id}-chieu-${day}`, session: "chieu", ...baseSlot } as TimeOffSlot)
          }
        })
      } catch { }
    })
    return list
  }, [requests, weekFilter, employees, selectedBranch, orgNodes])

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg); setToastType(type)
    setTimeout(() => setToastMessage(null), 2800)
  }
  const addProcessing    = (id: string) => setProcessingIds(p => [...p, id])
  const removeProcessing = (id: string) => setProcessingIds(p => p.filter(x => x !== id))

  const statsFilteredReqs = useMemo(() => {
    return requests.filter(r => {
      if (selectedBranch !== "all" && !isEmployeeInBranch(r.employeeId, selectedBranch)) {
        return false
      }
      if (tab === "leave") {
        if (statusFilter !== "all") {
          if (statusFilter === "expired") {
            if (!((r.status === "pending" && isRequestExpired(r)) || r.status === "cancelled")) return false
          } else if (statusFilter === "pending") {
            if (!(r.status === "pending" && !isRequestExpired(r))) return false
          } else {
            if (r.status !== statusFilter) return false
          }
        }
        if (leaveDeptFilter !== "all" && r.department !== leaveDeptFilter) {
          return false
        }
        if (leaveSearchFilter.trim() !== "" && !r.employeeName.toLowerCase().includes(leaveSearchFilter.toLowerCase())) {
          return false
        }
        if (leaveDateFilter !== "") {
          try {
            const filterDate = parseVnDate(leaveDateFilter)
            filterDate.setHours(0, 0, 0, 0)
            const start = parseVnDate(r.startDate)
            start.setHours(0, 0, 0, 0)
            const end = parseVnDate(r.endDate)
            end.setHours(0, 0, 0, 0)
            if (filterDate < start || filterDate > end) return false
          } catch {
            return false
          }
        }
        if (weekFilter !== "all") {
          try {
            const dates = getDateRange(r.startDate, r.endDate)
            const isInWeek = dates.some(d => `W${getISOWeek(d)}` === weekFilter)
            if (!isInWeek) return false
          } catch {
            return false
          }
        }
      } else if (tab === "timeoff") {
        // Lịch tuần -> Lọc theo tuần được chọn
        if (weekFilter !== "all") {
          try {
            const dates = getDateRange(r.startDate, r.endDate)
            const isInWeek = dates.some(d => `W${getISOWeek(d)}` === weekFilter)
            if (!isInWeek) return false
          } catch {
            return false
          }
        }
        if (deptFilter !== "all" && r.department !== deptFilter) {
          return false
        }
        if (searchEmp.trim() !== "" && !r.employeeName.toLowerCase().includes(searchEmp.toLowerCase())) {
          return false
        }
      } else if (tab === "stats") {
        // Tab thống kê: Lọc theo tuần (hoặc hôm nay nếu showToday được bật)
        if (showToday) {
          try {
            const todayDate = new Date()
            todayDate.setHours(0, 0, 0, 0)
            const start = parseVnDate(r.startDate)
            start.setHours(0, 0, 0, 0)
            const end = parseVnDate(r.endDate)
            end.setHours(0, 0, 0, 0)
            const isToday = todayDate >= start && todayDate <= end
            if (!isToday) return false
          } catch {
            return false
          }
        } else if (weekFilter !== "all") {
          try {
            const dates = getDateRange(r.startDate, r.endDate)
            const isInWeek = dates.some(d => `W${getISOWeek(d)}` === weekFilter)
            if (!isInWeek) return false
          } catch {
            return false
          }
        }
      }
      return true
    })
  }, [requests, selectedBranch, tab, statusFilter, leaveDeptFilter, leaveSearchFilter, leaveDateFilter, deptFilter, searchEmp, weekFilter, showToday, orgNodes, employees])

  const totalLeave = statsFilteredReqs.length

  const pendingLeave = statsFilteredReqs.filter(r => {
    return r.status === "pending" && !isRequestExpired(r)
  }).length

  const approvedLeave = statsFilteredReqs.filter(r => {
    return r.status === "approved"
  }).length

  const rejectedLeave = statsFilteredReqs.filter(r => {
    return r.status === "rejected"
  }).length

  const expiredLeave = statsFilteredReqs.filter(r => {
    const isExpired = r.status === "pending" && isRequestExpired(r)
    return r.status === "cancelled" || isExpired
  }).length
  const pendingTimeoff = slots.filter(s => s.status === "pending").length
  const pendingSlotCount = slots.filter(s => s.status === "pending").length
  const approvedSlotCount = slots.filter(s => s.status === "approved").length
  const rejectedSlotCount = slots.filter(s => s.status === "rejected").length

  const todayRequests = useMemo(() => {
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    return requests.filter(req => {
      if (selectedBranch !== "all" && !isEmployeeInBranch(req.employeeId, selectedBranch)) return false
      try {
        const start = parseVnDate(req.startDate)
        start.setHours(0, 0, 0, 0)
        const end = parseVnDate(req.endDate)
        end.setHours(0, 0, 0, 0)
        return todayDate >= start && todayDate <= end
      } catch {
        return false
      }
    })
  }, [requests, selectedBranch, orgNodes, employees])

  const requestsInWeek = useMemo(() => {
    return requests.filter(req => {
      if (selectedBranch !== "all" && !isEmployeeInBranch(req.employeeId, selectedBranch)) return false
      try {
        const dates = getDateRange(req.startDate, req.endDate)
        return dates.some(d => `W${getISOWeek(d)}` === weekFilter)
      } catch { return false }
    })
  }, [requests, weekFilter, selectedBranch, orgNodes, employees])

  const pendingRequestsInWeek = useMemo(() => {
    const list = showToday ? todayRequests : requestsInWeek
    return list.filter(req => req.status === "pending" && !isRequestExpired(req))
  }, [showToday, todayRequests, requestsInWeek])

  const allPendingRequestsInWeek = useMemo(() => {
    const list = showToday ? todayRequests : requestsInWeek
    return list.filter(req => req.status === "pending")
  }, [showToday, todayRequests, requestsInWeek])

  const approvedRequestsInWeek = useMemo(() => {
    const list = showToday ? todayRequests : requestsInWeek
    return list.filter(req => req.status === "approved")
  }, [showToday, todayRequests, requestsInWeek])

  const rejectedRequestsInWeek = useMemo(() => {
    const list = showToday ? todayRequests : requestsInWeek
    return list.filter(req => req.status === "rejected")
  }, [showToday, todayRequests, requestsInWeek])

  const approveReq = async (id: string) => {
    addProcessing(id)
    try {
      await api.requests.approve(id)
      setRequests(p => p.map(r => r.id === id ? { ...r, status: "approved" as const } : r))
      showToast("Đã duyệt đơn xin nghỉ!")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi duyệt đơn", "error")
    } finally {
      removeProcessing(id)
    }
  }
  const rejectReq = async (id: string) => {
    addProcessing(id)
    try {
      await api.requests.reject(id)
      setRequests(p => p.map(r => r.id === id ? { ...r, status: "rejected" as const } : r))
      showToast("Đã từ chối đơn xin nghỉ!", "error")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi từ chối đơn", "error")
    } finally {
      removeProcessing(id)
    }
  }

  const approveAllReqs = async () => {
    const pendingActive = filteredReqs.filter(r => r.status === "pending" && !isRequestExpired(r))
    if (pendingActive.length === 0) return
    addProcessing("bulk-req")
    try {
      await Promise.all(pendingActive.map(r => api.requests.approve(r.id)))
      setRequests(p => p.map(r => (r.status === "pending" && !isRequestExpired(r) && pendingActive.some(x => x.id === r.id)) ? { ...r, status: "approved" as const } : r))
      showToast(`Đã duyệt ${pendingActive.length} đơn xin nghỉ còn hạn!`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi duyệt hàng loạt", "error")
    } finally {
      removeProcessing("bulk-req")
    }
  }

  const rejectAllReqs = async () => {
    const pending = filteredReqs.filter(r => r.status === "pending")
    if (pending.length === 0) return
    addProcessing("bulk-req-reject")
    try {
      await Promise.all(pending.map(r => api.requests.reject(r.id)))
      setRequests(p => p.map(r => (r.status === "pending" && pending.some(x => x.id === r.id)) ? { ...r, status: "rejected" as const } : r))
      showToast(`Đã từ chối ${pending.length} đơn xin nghỉ!`, "error")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi từ chối hàng loạt", "error")
    } finally {
      removeProcessing("bulk-req-reject")
    }
  }

  const handleQuickApprove = async (id: string) => {
    const reqId = id.includes("-") ? id.split("-")[0] : id
    addProcessing(reqId)
    try {
      await api.requests.approve(reqId)
      setRequests(p => p.map(r => r.id === reqId ? { ...r, status: "approved" as const } : r))
      showToast("Đã duyệt đơn nghỉ phép!")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi duyệt đơn", "error")
    } finally {
      removeProcessing(reqId)
    }
  }
  const handleQuickReject = async (id: string) => {
    const reqId = id.includes("-") ? id.split("-")[0] : id
    addProcessing(reqId)
    try {
      await api.requests.reject(reqId)
      setRequests(p => p.map(r => r.id === reqId ? { ...r, status: "rejected" as const } : r))
      showToast("Đã từ chối đơn nghỉ phép!", "error")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi từ chối đơn", "error")
    } finally {
      removeProcessing(reqId)
    }
  }

  const handleApproveAllPending = async () => {
    const pendingActiveInWeek = requests.filter(req => {
      if (req.status !== "pending") return false
      if (isRequestExpired(req)) return false
      try {
        const dates = getDateRange(req.startDate, req.endDate)
        return dates.some(d => `W${getISOWeek(d)}` === weekFilter)
      } catch { return false }
    })
    if (pendingActiveInWeek.length === 0) { showToast("Không có đơn nào còn hạn chờ duyệt trong tuần này!", "error"); return }
    addProcessing("bulk-slots")
    try {
      await Promise.all(pendingActiveInWeek.map(req => api.requests.approve(req.id)))
      setRequests(p => p.map(r => pendingActiveInWeek.some(x => x.id === r.id) ? { ...r, status: "approved" as const } : r))
      showToast(`Đã duyệt tất cả ${pendingActiveInWeek.length} đơn chờ duyệt còn hạn!`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi duyệt hàng loạt", "error")
    } finally {
      removeProcessing("bulk-slots")
    }
  }

  const handleRejectAllPending = async () => {
    const pendingInWeek = requests.filter(req => {
      if (req.status !== "pending") return false
      try {
        const dates = getDateRange(req.startDate, req.endDate)
        return dates.some(d => `W${getISOWeek(d)}` === weekFilter)
      } catch { return false }
    })
    if (pendingInWeek.length === 0) { showToast("Không có đơn nào chờ duyệt trong tuần này!", "error"); return }
    addProcessing("bulk-slots-reject")
    try {
      await Promise.all(pendingInWeek.map(req => api.requests.reject(req.id)))
      setRequests(p => p.map(r => pendingInWeek.some(x => x.id === r.id) ? { ...r, status: "rejected" as const } : r))
      showToast(`Đã từ chối tất cả ${pendingInWeek.length} đơn chờ duyệt!`, "error")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi từ chối hàng loạt", "error")
    } finally {
      removeProcessing("bulk-slots-reject")
    }
  }

  const handleCreateQuickSlot = async () => {
    if (!quickAddReason.trim()) { showToast("Vui lòng nhập lý do nghỉ!", "error"); return }
    if (!quickAddStartDate || !quickAddEndDate) { showToast("Vui lòng chọn đầy đủ khoảng thời gian!", "error"); return }
    if (quickAddStartDate > quickAddEndDate) { showToast("Ngày kết thúc không thể trước ngày bắt đầu!", "error"); return }

    const toVnDate = (s: string) => {
      const p = s.split("-")
      return `${p[2]}/${p[1]}/${p[0]}`
    }
    const startVn = toVnDate(quickAddStartDate)
    const endVn = toVnDate(quickAddEndDate)

    addProcessing("quick-create")
    try {
      const created = await api.requests.create({
        employeeId: quickAddSlot!.empId,
        category: "timeoff",
        startDate: startVn,
        endDate: endVn,
        reason: quickAddReason,
        session: quickAddSessionMode,
      }) as any

      await api.requests.approve(created.id)
      
      setRequests(p => [...p, { ...created, status: "approved" }])
      setQuickAddSlot(null)
      setQuickAddReason("")
      showToast(`Đã đăng ký & duyệt nghỉ thành công cho ${quickAddSlot!.empName}!`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi tạo ca nghỉ", "error")
    } finally {
      removeProcessing("quick-create")
    }
  }

  const handleOpenQuickAdd = (s: { empId: string; empName: string; day: number; session: "sang" | "chieu" }) => {
    setQuickAddSlot(s)
    setQuickAddSessionMode(s.session)
  }

  const filteredReqs = useMemo(() => {
    return requests.filter(r => {
      if (statusFilter !== "all") {
        if (statusFilter === "expired") {
          if (!((r.status === "pending" && isRequestExpired(r)) || r.status === "cancelled")) return false
        } else if (statusFilter === "pending") {
          if (!(r.status === "pending" && !isRequestExpired(r))) return false
        } else {
          if (r.status !== statusFilter) return false
        }
      }
      if (leaveDeptFilter !== "all" && r.department !== leaveDeptFilter) {
        return false
      }
      if (leaveSearchFilter.trim() !== "" && !r.employeeName.toLowerCase().includes(leaveSearchFilter.toLowerCase())) {
        return false
      }
      if (leaveDateFilter !== "") {
        try {
          const filterDate = parseVnDate(leaveDateFilter)
          filterDate.setHours(0, 0, 0, 0)
          const start = parseVnDate(r.startDate)
          start.setHours(0, 0, 0, 0)
          const end = parseVnDate(r.endDate)
          end.setHours(0, 0, 0, 0)
          if (filterDate < start || filterDate > end) return false
        } catch {
          return false
        }
      }
      if (weekFilter !== "all" && tab === "leave") {
        try {
          const dates = getDateRange(r.startDate, r.endDate)
          const isInWeek = dates.some(d => `W${getISOWeek(d)}` === weekFilter)
          if (!isInWeek) return false
        } catch {
          return false
        }
      }
      const matchBranch = selectedBranch === "all" || isEmployeeInBranch(r.employeeId, selectedBranch)
      return matchBranch
    })
  }, [requests, statusFilter, leaveDeptFilter, leaveSearchFilter, leaveDateFilter, weekFilter, tab, selectedBranch, orgNodes, employees])

  const weeksInMonth = useMemo(
    () => computeWeeksInMonth(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  )

  const DAYS = useMemo(() => {
    const DAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"]
    const week = weeksInMonth.find(w => w.value === weekFilter)
    if (!week) return DAY_LABELS.map((label, i) => ({ label, date: "—", day: i + 1, dateObj: new Date(0) }))
    return DAY_LABELS.map((label, i) => {
      const d = new Date(week.startDate)
      d.setDate(d.getDate() + i)
      return { label, date: `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`, day: i + 1, dateObj: new Date(d) }
    })
  }, [weeksInMonth, weekFilter])

  const departments = useMemo(() => {
    const deptNodes = orgNodes.filter(n => n.type === "department" && (selectedBranch === "all" || findBranchForNode(n.id, orgNodes) === selectedBranch))
    const names = deptNodes.map(n => n.name)

    const filteredEmployees = selectedBranch === "all"
      ? employees
      : employees.filter(e => isEmployeeInBranch(e.id, selectedBranch))
    filteredEmployees.forEach(e => {
      if (e.department) names.push(e.department)
    })

    const depts = new Set(names.filter(Boolean))
    return Array.from(depts).sort()
  }, [employees, selectedBranch, orgNodes])

  const empRows = useMemo(() => {
    const parseVnDate = (s?: string) => {
      if (!s) return 0
      const p = s.split("/")
      return p.length === 3 ? new Date(+p[2], +p[1] - 1, +p[0]).getTime() : 0
    }
    return employees
      .filter(e => {
        const matchSearch = e.name.toLowerCase().includes(searchEmp.toLowerCase()) ||
          (e.department ?? "").toLowerCase().includes(searchEmp.toLowerCase())
        const matchDept = deptFilter === "all" || e.department === deptFilter
        const matchBranch = selectedBranch === "all" || isEmployeeInBranch(e.id, selectedBranch)
        return matchSearch && matchDept && matchBranch
      })
      .sort((a, b) => parseVnDate(a.joinDate) - parseVnDate(b.joinDate))
      .map(e => ({ empId: e.id, empName: e.name, empCode: e.id, department: e.department ?? "", position: e.position ?? "", empPhoto: e.photos?.[0] }))
  }, [employees, searchEmp, deptFilter, selectedBranch, orgNodes])

  const slotsLookup = useMemo(() => {
    const map = new Map<string, TimeOffSlot>()
    slots.forEach(s => {
      if (s.week === weekFilter) {
        map.set(`${s.empId}-${s.day}-${s.session}`, s)
      }
    })
    return map
  }, [slots, weekFilter])

  const empMultiDayMap = useMemo(() => {
    const map = new Map<string, {
      req: RequestRecord
      colStart: number
      colSpan: number
      isLeftCont: boolean
      isRightCont: boolean
      repSlot: TimeOffSlot
    }[]>()

    if (!DAYS[0] || DAYS[0].dateObj.getTime() === 0) return map

    employees.forEach(emp => {
      const empMultiReqs = requests.filter(r => r.employeeId === emp.id && r.startDate !== r.endDate)
      const list: any[] = []

      empMultiReqs.forEach(req => {
        const repSlot = slots.find(s => s.empId === emp.id && s.id.startsWith(req.id + "-"))
        if (!repSlot) return

        let colStart = -1
        let colEnd = -1
        try {
          const dates = getDateRange(req.startDate, req.endDate)
          DAYS.forEach((d, idx) => {
            if (dates.some(rd => isSameDate(rd, d.dateObj))) {
              if (colStart === -1) colStart = idx + 1
              colEnd = idx + 1
            }
          })
        } catch { }

        if (colStart === -1) return

        const colSpan = colEnd - colStart + 1
        const reqStart = parseVnDate(req.startDate)
        const reqEnd = parseVnDate(req.endDate)
        const isLeftCont = reqStart.getTime() < DAYS[0].dateObj.getTime()
        const isRightCont = reqEnd.getTime() > DAYS[4].dateObj.getTime()

        list.push({ req, colStart, colSpan, isLeftCont, isRightCont, repSlot })
      })

      map.set(emp.id, list)
    })

    return map
  }, [requests, slots, employees, DAYS])

  const getSlot = (empId: string, day: number, session: "sang" | "chieu") =>
    slotsLookup.get(`${empId}-${day}-${session}`)

  const _now             = new Date()
  const _todayDow        = _now.getDay()
  const _isWeekend       = _todayDow === 0 || _todayDow === 6
  const _todayStr        = `${String(_now.getDate()).padStart(2,"0")}/${String(_now.getMonth()+1).padStart(2,"0")}`
  const _todayDayEntry   = DAYS.find(d => d.date === _todayStr)
  const _todayInThisWeek = !!_todayDayEntry
  const _todayDayNum     = _todayDayEntry?.day ?? -1
  const _todaySlots      = _todayInThisWeek
    ? slots.filter(s => s.day === _todayDayNum)
    : []

  const activeStatsSlots = useMemo(() => {
    return showToday ? _todaySlots : slots
  }, [showToday, _todaySlots, slots])

  const activeStatsRequests = useMemo(() => {
    return showToday ? todayRequests : requestsInWeek
  }, [showToday, todayRequests, requestsInWeek])

  const statByEmp = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {}
    activeStatsSlots.forEach(s => {
      if (s.status === "rejected") return
      if (!map[s.empId]) {
        map[s.empId] = { name: s.empName, count: 0 }
      }
      map[s.empId].count += 1
    })
    return Object.values(map).sort((a, b) => b.count - a.count)
  }, [activeStatsSlots])

  const statByDept = useMemo(() => {
    const map: Record<string, { dept: string; approved: number; pending: number; rejected: number }> = {}
    activeStatsRequests.forEach(r => {
      if (!map[r.department]) {
        map[r.department] = { dept: r.department, approved: 0, pending: 0, rejected: 0 }
      }
      if (r.status === "approved") map[r.department].approved += 1
      else if (r.status === "pending") map[r.department].pending += 1
      else if (r.status === "rejected") map[r.department].rejected += 1
    })
    return Object.values(map)
  }, [activeStatsRequests])

  return (
    <div className="space-y-4 pb-24">
      {quickAddSlot && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h3 className="font-black text-lg">Đăng ký nghỉ hộ {quickAddSlot.empName}</h3>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500">Khoảng thời gian</label>
              <div className="flex gap-2">
                <input type="date" value={quickAddStartDate} onChange={e => setQuickAddStartDate(e.target.value)} className="flex-1 border rounded-lg p-2 text-sm" />
                <input type="date" value={quickAddEndDate} onChange={e => setQuickAddEndDate(e.target.value)} className="flex-1 border rounded-lg p-2 text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500">Lý do</label>
              <textarea value={quickAddReason} onChange={e => setQuickAddReason(e.target.value)} className="w-full border rounded-lg p-2 text-sm" rows={2} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setQuickAddSlot(null)} className="flex-1 px-4 py-2 rounded-xl bg-gray-100 font-bold text-sm">Hủy</button>
              <button onClick={handleCreateQuickSlot} disabled={processingIds.includes("quick-create")} className="flex-1 px-4 py-2 rounded-xl bg-[#C62828] text-white font-bold text-sm">Duyệt</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {toastMessage && createPortal(
        <div className={`fixed bottom-6 right-6 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-[9999] border backdrop-blur-sm animate-in slide-in-from-right duration-300
          ${toastType === "success"
            ? "bg-gray-900/95 text-white border-white/10"
            : "bg-red-900/95 text-white border-red-500/20"}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${toastType === "success" ? "bg-emerald-400" : "bg-red-400"} animate-pulse`} />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>,
        document.body
      )}

      <div className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px] p-5 rounded-2xl text-white flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div className="flex items-center">
          <div className="flex gap-1.5 items-center mr-4 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white/30 animate-pulse"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white/60 animate-pulse delay-75"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse delay-150"></span>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Quản lý nghỉ phép</h2>
            <p className="text-xs text-white/80 mt-1">Theo dõi & xử lý đơn nghỉ phép nhân viên</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="rounded-xl px-3 py-1.5 bg-white/10 border border-white/10 text-center min-w-[70px] backdrop-blur-xs flex flex-col justify-center">
            <p className="text-sm font-black text-white leading-none">{totalLeave}</p>
            <p className="text-[9px] text-white/70 font-bold mt-1 uppercase tracking-wider">Tổng đơn</p>
          </div>
          <div className="rounded-xl px-3 py-1.5 bg-white/10 border border-white/10 text-center min-w-[70px] backdrop-blur-xs flex flex-col justify-center">
            <p className="text-sm font-black text-amber-300 leading-none">{pendingLeave}</p>
            <p className="text-[9px] text-white/70 font-bold mt-1 uppercase tracking-wider">Chờ duyệt</p>
          </div>
          <div className="rounded-xl px-3 py-1.5 bg-white/10 border border-white/10 text-center min-w-[70px] backdrop-blur-xs flex flex-col justify-center">
            <p className="text-sm font-black text-emerald-300 leading-none">{approvedLeave}</p>
            <p className="text-[9px] text-white/70 font-bold mt-1 uppercase tracking-wider">Đã duyệt</p>
          </div>
          <div className="rounded-xl px-3 py-1.5 bg-white/10 border border-white/10 text-center min-w-[70px] backdrop-blur-xs flex flex-col justify-center">
            <p className="text-sm font-black text-rose-300 leading-none">{rejectedLeave}</p>
            <p className="text-[9px] text-white/70 font-bold mt-1 uppercase tracking-wider">Từ chối</p>
          </div>
          <div className="rounded-xl px-3 py-1.5 bg-white/10 border border-white/10 text-center min-w-[70px] backdrop-blur-xs flex flex-col justify-center">
            <p className="text-sm font-black text-white/60 leading-none">{expiredLeave}</p>
            <p className="text-[9px] text-white/50 font-bold mt-1 uppercase tracking-wider">Hủy/Hạn</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-black/[0.06] overflow-x-auto gap-1">
          {([
            ["timeoff", "Lịch tuần",    LayoutGrid],
            ["leave",   "Đơn xin nghỉ", ClipboardList],
            ["stats",   "Thống kê",     TrendingUp],
          ] as [string, string, React.ElementType][]).map(([v, l, Icon]) => (
            <button key={v} onClick={() => setTab(v as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0
                ${tab === v ? "bg-[#C62828] text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
              <Icon size={14} />
              {l}
            </button>
          ))}
        </div>

        {/* Global Date & Week Selector */}
        <div className="flex items-center gap-1.5 bg-white rounded-2xl px-3 py-2 border border-black/[0.06] shadow-sm flex-shrink-0 animate-in fade-in duration-200">
          <input
            type="text" inputMode="numeric" value={selectedYear}
            onChange={e => {
              if (/^\d{0,4}$/.test(e.target.value)) {
                setSelectedYear(Number(e.target.value))
                setShowToday(false)
                if (tab === "leave") setLeaveDateFilter("")
              }
            }}
            onBlur={e => { const v = Number(e.target.value); setSelectedYear(v < 2020 ? 2020 : v > 2035 ? 2035 : v) }}
            className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none w-12 text-center cursor-text hover:text-[#C62828] focus:text-[#C62828] transition-colors"
          />
          <span className="text-gray-300">/</span>
          <input
            type="text" inputMode="numeric" value={selectedMonth}
            onChange={e => {
              if (/^\d{0,2}$/.test(e.target.value)) {
                setSelectedMonth(Number(e.target.value))
                setShowToday(false)
                if (tab === "leave") setLeaveDateFilter("")
              }
            }}
            onBlur={e => { const v = Number(e.target.value); setSelectedMonth(v < 1 ? 1 : v > 12 ? 12 : v) }}
            className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none w-7 text-center cursor-text hover:text-[#C62828] focus:text-[#C62828] transition-colors"
          />
          <span className="text-gray-300">›</span>
          <CustomSelect
            value={weekFilter}
            onChange={val => {
              setWeekFilter(val)
              setShowToday(false)
              if (val !== "all" && tab === "leave") {
                setLeaveDateFilter("")
              }
            }}
            heightClass="h-[28px]"
            className="w-[240px]"
            options={
              tab === "leave"
                ? [
                    { value: "all", label: "Tất cả các tuần" },
                    ...weeksInMonth.map(w => ({ value: w.value, label: w.label }))
                  ]
                : weeksInMonth.map(w => ({ value: w.value, label: w.label }))
            }
          />
          <span className="w-px h-4 bg-gray-200 mx-0.5" />
          <button
            onClick={() => {
              const now = new Date()
              setSelectedYear(now.getFullYear())
              setSelectedMonth(now.getMonth() + 1)
              const w = `W${getISOWeek(now)}`
              setWeekFilter(w)
              if (tab === "leave") {
                setLeaveDateFilter("")
              } else {
                setShowToday(false)
              }
            }}
            className="text-xs font-bold text-gray-500 hover:text-[#C62828] transition-colors whitespace-nowrap active:scale-95"
          >
            Tuần này
          </button>
          <span className="w-px h-4 bg-gray-200 mx-0.5" />
          <button
            onClick={() => {
              const now = new Date()
              setSelectedYear(now.getFullYear())
              setSelectedMonth(now.getMonth() + 1)
              const w = `W${getISOWeek(now)}`
              if (tab === "leave") {
                setWeekFilter("all")
                const formattedToday = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`
                setLeaveDateFilter(formattedToday)
              } else {
                setWeekFilter(w)
                setShowToday(true)
              }
            }}
            className={`text-xs font-bold transition-colors whitespace-nowrap active:scale-95 ${
              tab === "leave"
                ? leaveDateFilter !== "" ? "text-[#C62828] font-extrabold" : "text-gray-500 hover:text-[#C62828]"
                : showToday ? "text-[#C62828] font-extrabold" : "text-gray-500 hover:text-[#C62828]"
            }`}
          >
            Hôm nay
          </button>
        </div>
      </div>

      {tab === "timeoff" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/[0.06] flex items-center gap-3 flex-wrap">

            <CustomSelect
              value={deptFilter}
              onChange={setDeptFilter}
              heightClass="h-[38px]"
              className="w-56"
              options={[
                { value: "all", label: "Tất cả phòng ban" },
                ...departments.map(d => ({ value: d, label: d }))
              ]}
            />

            <CustomCombobox
              value={searchEmp}
              onChange={setSearchEmp}
              placeholder="Tìm nhân viên..."
              heightClass="h-[38px]"
              className="flex-1 min-w-[160px]"
              showSearchIcon={true}
              options={employees.map(e => ({ value: e.name, label: e.name, desc: e.id }))}
            />

            <div className="flex gap-2 ml-auto">
              {[
                ["bg-emerald-100 border-emerald-300", "Đã duyệt"],
                ["bg-amber-100 border-amber-300", "Chờ duyệt"],
                ["bg-red-100 border-red-300", "Từ chối"],
              ].map(([cls, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-md border ${cls}`} />
                  <span className="text-[11px] text-gray-500 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {loadingInit ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            ) : initError ? (
              <div className="bg-white rounded-2xl py-16 text-center border border-black/[0.06] shadow-sm">
                <AlertCircle size={40} className="mx-auto mb-3 text-red-300" />
                <p className="text-gray-600 font-bold">Không thể kết nối máy chủ</p>
                <p className="text-xs text-gray-400 mt-1">Đảm bảo backend đang chạy tại <span className="font-mono">localhost:3001</span></p>
                <button
                  onClick={() => { setInitError(false); setLoadingInit(true); Promise.all([api.requests.list().then(d => setRequests(d as RequestRecord[])), api.employees.list().then(d => setEmployees(d as any[]))]).catch(() => setInitError(true)).finally(() => setLoadingInit(false)) }}
                  className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-600 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            ) : empRows.length === 0 ? (
              <div className="bg-white rounded-2xl py-16 text-center border border-black/[0.06] shadow-sm">
                <Search size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 font-medium">Không tìm thấy nhân viên</p>
                <p className="text-xs text-gray-300 mt-1">Thử tìm kiếm khác</p>
              </div>
            ) : (
              <>
                <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 overflow-hidden grid divide-x divide-gray-200 shadow-sm animate-in fade-in duration-200" style={{ gridTemplateColumns: "repeat(5, 20%)" }}>
                  {DAYS.map(d => {
                    const isToday = showToday && d.date === _todayStr
                    return (
                      <div key={d.day} className={`text-center py-2.5 relative transition-all duration-200 ${COLUMN_COLORS[d.day] || ""}`}>
                        <p className={`text-xs font-black ${isToday ? "text-[#C62828]" : "text-gray-700"}`}>{d.label}</p>
                        <p className={`text-[10px] font-mono font-bold ${isToday ? "text-[#C62828]" : "text-gray-500"}`}>{d.date}</p>
                      </div>
                    )
                  })}
                </div>
                {empRows.map(emp => {
                const spanStartMap = new Map<number, { slot: TimeOffSlot; colSpan: number; isLeftCont: boolean; isRightCont: boolean }>()
                const coveredCols = new Set<number>()

                const empMultiList = empMultiDayMap.get(emp.empId) || []
                empMultiList.forEach(item => {
                  if (!coveredCols.has(item.colStart) && !spanStartMap.has(item.colStart)) {
                    spanStartMap.set(item.colStart, { slot: item.repSlot, colSpan: item.colSpan, isLeftCont: item.isLeftCont, isRightCont: item.isRightCont })
                    for (let c = item.colStart + 1; c <= item.colStart + item.colSpan - 1; c++) {
                      coveredCols.add(c)
                    }
                  }
                })

                return (
                  <div key={emp.empId} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 bg-[#C62828]">
                      <AvatarCircle name={emp.empName} photo={emp.empPhoto} size="sm" />
                      <div className="min-w-0 flex-1 flex items-center gap-2 overflow-hidden">
                        <p className="font-black text-white text-sm truncate leading-tight flex-shrink-0 max-w-[55%]">{emp.empName}</p>
                        {(emp.position || emp.department) && (
                          <p className="text-[11px] text-white/70 truncate">
                            {emp.position}{emp.position && emp.department ? " · " : ""}{emp.department}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setViewEmpId(emp.empId)}
                        className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all flex-shrink-0"
                        title="Xem lịch cá nhân"
                      >
                        <Eye size={14} />
                      </button>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {(["approved", "pending", "rejected"] as TOStatus[]).map(st => {
                          const count = requests.filter(req => {
                            if (req.employeeId !== emp.empId) return false
                            if (req.status !== st) return false
                            try {
                              const dates = getDateRange(req.startDate, req.endDate)
                              return dates.some(d => `W${getISOWeek(d)}` === weekFilter)
                            } catch { return false }
                          }).length
                          if (count === 0) return null
                          const colors = { approved: "bg-emerald-100 text-emerald-700", pending: "bg-amber-100 text-amber-700", rejected: "bg-red-100 text-red-600", cancelled: "bg-gray-100 text-gray-500" }
                          return (
                            <span key={st} className={`text-[10px] font-black px-2 py-0.5 rounded-full ${colors[st]}`}>
                              {count}
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    <div className="grid divide-x divide-gray-200" style={{ gridTemplateColumns: "repeat(5, 20%)" }}>
                      {DAYS.map((d, idx) => {
                        const colNum = idx + 1
                        if (coveredCols.has(colNum)) return null
                        const spanEntry = spanStartMap.get(colNum)
                        const sang = getSlot(emp.empId, d.day, "sang")
                        const chieu = getSlot(emp.empId, d.day, "chieu")
                        const isSingleFullDay = !!sang && sang.sessionMode === "all" && !sang.isMultiDay

                        return (
                          <div
                            key={d.day}
                            className={`p-2 space-y-1.5 ${spanEntry ? "" : COLUMN_COLORS[d.day] || ""}`}
                            style={{ gridColumn: spanEntry ? `${colNum} / span ${spanEntry.colSpan}` : `${colNum} / span 1` }}
                          >
                            {spanEntry ? (
                              <MultiDayFullBlock
                                slot={spanEntry.slot}
                                colSpan={spanEntry.colSpan}
                                isLeftCont={spanEntry.isLeftCont}
                                isRightCont={spanEntry.isRightCont}
                                onClick={s => { setSelectedSlot(s); setAdminNote(s.adminNote) }}
                                onApprove={handleQuickApprove}
                                onReject={handleQuickReject}
                                disabled={processingIds.includes(spanEntry.slot.id.split("-")[0])}
                              />
                            ) : isSingleFullDay ? (
                              <FullDayBlock
                                slot={sang!}
                                onClick={s => { setSelectedSlot(s); setAdminNote(s.adminNote) }}
                                onApprove={handleQuickApprove}
                                onReject={handleQuickReject}
                                disabled={processingIds.includes(sang!.id.split("-")[0])}
                              />
                            ) : (
                              <>
                                <SessionBlock
                                  slot={sang} session="sang"
                                  empId={emp.empId} empName={emp.empName} day={d.day}
                                  onApprove={handleQuickApprove} onReject={handleQuickReject}
                                  onClick={s => { setSelectedSlot(s); setAdminNote(s.adminNote) }}
                                  onQuickAdd={handleOpenQuickAdd}
                                  disabled={!!sang && processingIds.includes(sang.id)}
                                />
                                <SessionBlock
                                  slot={chieu} session="chieu"
                                  empId={emp.empId} empName={emp.empName} day={d.day}
                                  onApprove={handleQuickApprove} onReject={handleQuickReject}
                                  onClick={s => { setSelectedSlot(s); setAdminNote(s.adminNote) }}
                                  onQuickAdd={setQuickAddSlot}
                                  disabled={!!chieu && processingIds.includes(chieu.id)}
                                />
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
                })
              }
              </>
            )}
          </div>
        </div>
      )}

      {tab === "leave" && (
        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.06] overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-gray-50/50 border-b border-gray-100">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-500">Trạng thái</label>
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                heightClass="h-[38px]"
                options={[
                  { value: "all", label: "Tất cả" },
                  { value: "pending", label: "Chờ duyệt" },
                  { value: "approved", label: "Đã duyệt" },
                  { value: "rejected", label: "Từ chối" },
                  { value: "expired", label: "Đã hết hạn" }
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-500">Phòng ban</label>
              <CustomSelect
                value={leaveDeptFilter}
                onChange={setLeaveDeptFilter}
                heightClass="h-[38px]"
                options={[
                  { value: "all", label: "Tất cả" },
                  ...departments.map(d => ({ value: d, label: d }))
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-500">Ngày nghỉ cụ thể</label>
              <CustomDatePicker
                value={leaveDateFilter}
                onChange={val => {
                  setLeaveDateFilter(val)
                  if (val !== "") {
                    setWeekFilter("all")
                  }
                }}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 focus:ring-2 focus:ring-[#C62828]/10 bg-white font-semibold text-gray-700 animate-in fade-in duration-100"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-gray-500">Tìm kiếm</label>
              </div>
              <div className="flex gap-2">
                <CustomCombobox
                  value={leaveSearchFilter}
                  onChange={setLeaveSearchFilter}
                  placeholder="Tên nhân viên..."
                  heightClass="h-[38px]"
                  className="flex-1"
                  showSearchIcon={true}
                  options={employees.map(e => ({ value: e.name, label: e.name, desc: e.id }))}
                />
                {(statusFilter !== "all" || leaveDeptFilter !== "all" || weekFilter !== "all" || leaveDateFilter !== "" || leaveSearchFilter.trim() !== "") && (
                  <button
                    onClick={() => {
                      setStatusFilter("all")
                      setLeaveDeptFilter("all")
                      setWeekFilter("all")
                      setLeaveDateFilter("")
                      setLeaveSearchFilter("")
                    }}
                    className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:text-[#C62828] hover:border-[#C62828]/30 hover:bg-red-50/50 transition-all flex items-center justify-center flex-shrink-0 active:scale-95 shadow-sm"
                    title="Trả lại mặc định"
                  >
                    <RotateCcw size={15} className="stroke-[2.5px]" />
                  </button>
                )}
              </div>
            </div>
          </div>
          {filteredReqs.filter(r => r.status === "pending").length > 0 && (
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-2 bg-white flex-wrap">
              <div className="text-xs font-bold text-gray-500">
                Danh sách chờ duyệt: <span className="text-[#C62828] font-black">{filteredReqs.filter(r => r.status === "pending").length}</span> đơn
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmAction({ label: "Từ chối tất cả đơn xin nghỉ?", count: filteredReqs.filter(r => r.status === "pending").length, variant: "reject", onConfirm: rejectAllReqs })}
                  disabled={processingIds.includes("bulk-req-reject") || processingIds.includes("bulk-req")}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 rounded-xl text-xs font-black transition-all border border-gray-200 hover:border-red-200 active:scale-95">
                  {processingIds.includes("bulk-req-reject")
                    ? <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
                    : <X size={11} className="stroke-[3px]" />}
                  Từ chối tất cả ({filteredReqs.filter(r => r.status === "pending").length})
                </button>
                <button
                  onClick={() => setConfirmAction({ label: "Duyệt các đơn xin nghỉ còn hạn?", count: filteredReqs.filter(r => r.status === "pending" && !isRequestExpired(r)).length, variant: "approve", onConfirm: approveAllReqs })}
                  disabled={processingIds.includes("bulk-req") || processingIds.includes("bulk-req-reject") || filteredReqs.filter(r => r.status === "pending" && !isRequestExpired(r)).length === 0}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#C62828] to-[#E64A19] hover:from-[#B71C1C] hover:to-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black transition-all shadow-sm active:scale-95">
                  {processingIds.includes("bulk-req")
                    ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <Zap size={11} fill="currentColor" />}
                  Duyệt nhanh còn hạn ({filteredReqs.filter(r => r.status === "pending" && !isRequestExpired(r)).length})
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-black text-gray-700 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Nhân viên</th>
                  <th className="px-6 py-3.5">Phòng ban</th>
                  <th className="px-6 py-3.5">Ca nghỉ</th>
                  <th className="px-6 py-3.5">Thời gian</th>
                  <th className="px-6 py-3.5">Thời gian gửi</th>
                  <th className="px-6 py-3.5">Lý do</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredReqs.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <AvatarCircle name={req.employeeName} photo={employees.find(e => e.id === req.employeeId)?.photos?.[0]} size="sm" />
                        <span className="font-bold text-gray-900 text-sm">{req.employeeName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 font-bold">
                      {req.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-gray-700">
                      <SessionPill session={req.session} isMultiDay={req.startDate !== req.endDate} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-gray-900">
                      {req.startDate === req.endDate ? req.startDate : `${req.startDate} → ${req.endDate}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-gray-900">
                      {req.submittedAt}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-900 font-semibold max-w-[240px] truncate" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <StatusPill status={req.status as TOStatus} />
                        {req.status === "pending" && isRequestExpired(req) && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold border bg-red-50 text-red-500 border-red-100 animate-pulse">
                            <AlertCircle size={8} /> Quá hạn
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex gap-1.5 justify-end items-center">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="p-2 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded-xl text-xs font-bold transition-all border border-gray-200 hover:border-gray-300 active:scale-95"
                          title="Chi tiết"
                        >
                          <Eye size={17} className="stroke-[2.5px]" />
                        </button>
                        {req.status === "pending" && !isRequestExpired(req) && (
                          <>
                            <button
                              onClick={() => rejectReq(req.id)}
                              disabled={processingIds.includes(req.id)}
                              className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border border-gray-200 hover:border-red-200 transition-all active:scale-95"
                              title="Từ chối"
                            >
                              <X size={17} className="stroke-[3px]" />
                            </button>
                            <button
                              onClick={() => approveReq(req.id)}
                              disabled={processingIds.includes(req.id)}
                              className="p-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all active:scale-95 shadow-sm"
                              title="Duyệt"
                            >
                              {processingIds.includes(req.id) ? (
                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Check size={17} className="stroke-[3px]" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredReqs.length === 0 && (
            <div className="py-16 text-center">
              <FileText size={36} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-400 font-medium">Không có đơn nào</p>
            </div>
          )}
        </div>
      )}

      {tab === "stats" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-bold text-gray-500">Đang xem: </span>
              <span className="text-xs font-black text-gray-800">{weeksInMonth.find(w => w.value === weekFilter)?.label ?? weekFilter}</span>
            </div>
            {/* Week selector is managed globally at the top of the page */}
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: showToday ? "NV nghỉ hôm nay" : "Nhân viên nghỉ", value: new Set(activeStatsRequests.filter(r => r.status !== "rejected").map(s => s.employeeId)).size, cls: "text-gray-900", bg: "bg-white border-gray-200" },
              { label: showToday ? "Đã duyệt hôm nay" : "Đã duyệt",   value: activeStatsRequests.filter(r => r.status === "approved").length, cls: "text-blue-700",  bg: "bg-blue-50 border-blue-100"  },
              { label: showToday ? "Chờ duyệt hôm nay" : "Chờ duyệt", value: activeStatsRequests.filter(r => r.status === "pending").length,  cls: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
              { label: showToday ? "Từ chối hôm nay" : "Từ chối",     value: activeStatsRequests.filter(r => r.status === "rejected").length, cls: "text-red-700",   bg: "bg-red-50 border-red-100"    },
            ].map(k => (
              <div key={k.label} className={`rounded-2xl p-4 text-center border shadow-sm ${k.bg}`}>
                <p className={`text-3xl font-black ${k.cls}`}>{k.value}</p>
                <p className="text-[11px] text-gray-500 mt-1 font-medium">{k.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/[0.06]">
            <div className="mb-4">
              <h3 className="font-black text-gray-800 text-sm">Vắng mặt theo buổi</h3>
            </div>
            {_isWeekend ? (
              <div className="py-8 text-center">
                <PartyPopper size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-bold text-gray-500">Hôm nay là {_todayDow === 6 ? "Thứ 7" : "Chủ nhật"} — không có đi làm</p>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-3">
                {DAYS.map(d => {
                  const sang  = slots.filter(s => s.day === d.day && s.session === "sang"  && s.status !== "rejected").length
                  const chieu = slots.filter(s => s.day === d.day && s.session === "chieu" && s.status !== "rejected").length
                  const cellCls = (n: number) =>
                    n === 0 ? "bg-gray-50 text-gray-300"
                    : n <= 2 ? "bg-amber-50 text-amber-600"
                    : "bg-red-50 text-red-600"
                  const isToday = showToday && _todayInThisWeek && d.date === _todayStr
                  return (
                    <div key={d.day} className={isToday ? "ring-2 ring-[#C62828]/40 rounded-xl p-1 -m-1" : ""}>
                      <p className={`text-[11px] font-black text-center ${isToday ? "text-[#C62828]" : "text-gray-600"}`}>{d.label}</p>
                      <p className={`text-[10px] text-center mb-2 font-mono font-semibold ${isToday ? "text-[#C62828]/60" : "text-gray-400"}`}>{d.date}</p>
                      <div className="space-y-1.5">
                        {([{ label: "Sáng", count: sang }, { label: "Chiều", count: chieu }]).map(s => (
                          <div key={s.label} className={`rounded-xl py-2.5 text-center ${cellCls(s.count)}`}>
                            <p className="text-xl font-black leading-none">{s.count}</p>
                            <p className="text-[9px] mt-0.5 opacity-60">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/[0.06]">
              <h3 className="font-black text-gray-800 text-sm mb-1">Nghỉ nhiều nhất</h3>
              <p className="text-xs text-gray-400 mb-4">{showToday ? `Hôm nay · ${_todayStr}` : `Cả tuần ${weekFilter}`}</p>
              {statByEmp.length === 0 ? (
                <p className="text-center text-gray-300 py-6 text-xs">Chưa có dữ liệu</p>
              ) : statByEmp.slice(0, 6).map((row, i) => (
                <div key={i} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
                  <span className={`text-xs font-black w-4 flex-shrink-0 ${i === 0 ? "text-amber-400" : i === 1 ? "text-gray-400" : "text-gray-200"}`}>{i + 1}</span>
                  <span className="text-xs text-gray-700 flex-1 truncate">{row.name}</span>
                  <span className="text-xs font-black text-gray-800 flex-shrink-0">{row.count} <span className="text-gray-400 font-normal">buổi</span></span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/[0.06]">
              <h3 className="font-black text-gray-800 text-sm mb-1">Theo phòng ban</h3>
              <p className="text-xs text-gray-400 mb-4">{showToday ? `Hôm nay · ${_todayStr}` : `Tổng hợp ${weekFilter}`}</p>
              {statByDept.length === 0 ? (
                <p className="text-center text-gray-300 py-6 text-xs">Chưa có dữ liệu</p>
              ) : statByDept.sort((a, b) => (b.approved + b.pending) - (a.approved + a.pending)).map((row, i) => (
                <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-700 flex-1 truncate font-medium">{row.dept}</span>
                  <div className="flex gap-1 flex-shrink-0">
                    {row.approved > 0 && <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700">{row.approved}</span>}
                    {row.pending  > 0 && <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700">{row.pending}</span>}
                    {row.rejected > 0 && <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-red-50 text-red-600">{row.rejected}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "timeoff" && (
        <div className="sticky bottom-0 -mx-0 mt-2 z-30 px-5 py-3 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-[0_-2px_20px_rgba(0,0,0,0.07)] flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">
              {showToday ? "Hôm nay:" : `Tuần ${weekFilter}:`}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
              <AlertCircle size={11} /> {allPendingRequestsInWeek.length} chờ duyệt
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <CheckCircle2 size={11} /> {approvedRequestsInWeek.length} đã duyệt
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-200">
              <XCircle size={11} /> {rejectedRequestsInWeek.length} từ chối
            </span>
          </div>

          <div className="flex gap-2 ml-auto flex-wrap">
            {allPendingRequestsInWeek.length > 0 && (
              <>
                <button
                  onClick={() => setConfirmAction({ label: showToday ? "Từ chối tất cả đơn xin nghỉ chờ duyệt hôm nay?" : "Từ chối tất cả đơn xin nghỉ chờ duyệt tuần này?", count: allPendingRequestsInWeek.length, variant: "reject", onConfirm: handleRejectAllPending })}
                  disabled={processingIds.includes("bulk-slots-reject") || processingIds.includes("bulk-slots")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 rounded-xl text-xs font-black transition-all border border-gray-200 hover:border-red-200 active:scale-95">
                  {processingIds.includes("bulk-slots-reject")
                    ? <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
                    : <X size={13} className="stroke-[3px]" />} Từ chối tất cả ({allPendingRequestsInWeek.length})
                </button>
                <button
                  onClick={() => setConfirmAction({ label: showToday ? "Duyệt tất cả đơn xin nghỉ chờ duyệt còn hạn hôm nay?" : "Duyệt tất cả đơn xin nghỉ chờ duyệt còn hạn tuần này?", count: pendingRequestsInWeek.length, variant: "approve", onConfirm: handleApproveAllPending })}
                  disabled={processingIds.includes("bulk-slots") || processingIds.includes("bulk-slots-reject") || pendingRequestsInWeek.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-[#C62828] to-[#E64A19] hover:from-[#B71C1C] hover:to-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black transition-all shadow-sm shadow-red-500/20 active:scale-95">
                  {processingIds.includes("bulk-slots")
                    ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <Zap size={13} fill="currentColor" />} Duyệt nhanh còn hạn ({pendingRequestsInWeek.length})
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {confirmAction && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className={`px-6 pt-6 pb-4 flex gap-4 items-start`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${confirmAction.variant === "approve" ? "bg-emerald-50" : "bg-red-50"}`}>
                {confirmAction.variant === "approve"
                  ? <Check size={18} className="text-emerald-600 stroke-[3px]" />
                  : <X size={18} className="text-red-500 stroke-[3px]" />}
              </div>
              <div>
                <p className="font-black text-gray-800 text-base">{confirmAction.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {confirmAction.count} đơn sẽ được xử lý. Không thể hoàn tác.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-2">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold transition-all">
                Hủy
              </button>
              <button
                onClick={() => { confirmAction.onConfirm(); setConfirmAction(null) }}
                className={`flex-1 py-2.5 text-white rounded-xl text-sm font-black transition-all active:scale-95 ${confirmAction.variant === "approve" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedSlot && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedSlot(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                  <FileText size={16} className="text-[#C62828]" />
                </div>
                <div>
                  <h3 className="font-black text-gray-800 text-base">Xử lý yêu cầu nghỉ</h3>
                  <p className="text-xs text-gray-400">{selectedSlot.empName}</p>
                </div>
              </div>
              <button onClick={() => setSelectedSlot(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"><X size={16} /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
                {[
                  ["Nhân viên", `${selectedSlot.empName} · ${selectedSlot.empCode}`],
                  ["Phòng ban", selectedSlot.department],
                  ["Ngày nghỉ", (() => { const d = DAYS.find(x => x.day === selectedSlot.day); return d ? `${d.label} (${d.date})` : `Ngày ${selectedSlot.day}` })()],
                  ["Buổi nghỉ", selectedSlot.session === "sang" ? "Sáng" : "Chiều"],
                  ["Lý do nghỉ", selectedSlot.reason],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-3 text-sm">
                    <span className="font-semibold text-gray-500 w-24 flex-shrink-0">{k}</span>
                    <span className="text-gray-800 font-medium">{v}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-200">
                  <StatusPill status={selectedSlot.status} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ghi chú phản hồi</label>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={2}
                  placeholder="Nhập ghi chú phản hồi cho nhân viên..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 focus:ring-2 focus:ring-[#C62828]/10 resize-none transition-all" />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-2">
              {selectedSlot.status === "pending" && (
                <>
                  <button onClick={() => { handleQuickApprove(selectedSlot.id); setSelectedSlot(null) }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-black transition-all active:scale-95">
                    <Check size={16} className="stroke-[3px]" /> Phê duyệt
                  </button>
                  <button onClick={() => { handleQuickReject(selectedSlot.id); setSelectedSlot(null) }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-black transition-all active:scale-95">
                    <X size={16} className="stroke-[3px]" /> Từ chối
                  </button>
                </>
              )}
              <button onClick={() => setSelectedSlot(null)}
                className={`py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-sm font-semibold transition-all ${selectedSlot.status === "pending" ? "px-4" : "flex-1"}`}>
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {viewEmpId && (() => {
        const empData = employees.find(e => e.id === viewEmpId)
        const emp = empData ? { empName: empData.name, empCode: viewEmpId, department: empData.department ?? "" } : null
        const empSlots = slots.filter(s => s.empId === viewEmpId)
        const empReqs = requests.filter(r => emp && r.employeeName === emp.empName)
        return createPortal(
          <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setViewEmpId(null)}>
            <div
              className="w-[400px] h-full bg-white shadow-2xl flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {emp && <AvatarCircle name={emp.empName} photo={empData?.photos?.[0]} size="md" />}
                  <div>
                    <p className="font-black text-gray-800 text-sm">{emp?.empName ?? "—"}</p>
                    <p className="text-xs text-gray-400">{emp?.department} · <span className="font-mono">{emp?.empCode}</span></p>
                  </div>
                </div>
                <button onClick={() => setViewEmpId(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Lịch tuần {weekFilter}</p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {DAYS.map(d => {
                      const sang = empSlots.find(s => s.day === d.day && s.session === "sang")
                      const chieu = empSlots.find(s => s.day === d.day && s.session === "chieu")
                      return (
                        <div key={d.day} className="text-center space-y-1">
                          <p className="text-[9px] font-bold text-gray-400">{d.label}</p>
                          <p className="text-[8px] text-gray-300 font-mono">{d.date}</p>
                          {[sang, chieu].map((sl, si) => (
                            <div key={si} className={`h-6 rounded-lg flex items-center justify-center text-[8px] font-black border ${
                              !sl ? "border-dashed border-gray-100 text-gray-200" :
                              sl.status === "approved" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                              sl.status === "pending"  ? "bg-amber-50 border-amber-200 text-amber-700" :
                              "bg-red-50 border-red-200 text-red-500"
                            }`}>
                              {!sl ? "—" : si === 0 ? "S" : "C"}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex gap-3 mt-3">
                    {[
                      ["bg-emerald-50 border-emerald-200 text-emerald-700", "Duyệt"],
                      ["bg-amber-50 border-amber-200 text-amber-700", "Chờ"],
                      ["bg-red-50 border-red-200 text-red-500", "Từ chối"],
                      ["border-dashed border-gray-100 text-gray-200", "Nghỉ làm"],
                    ].map(([cls, lbl]) => (
                      <span key={lbl} className="flex items-center gap-1 text-[10px] text-gray-400">
                        <span className={`w-4 h-4 rounded-md border text-[8px] flex items-center justify-center font-black ${cls}`}>S</span>
                        {lbl}
                      </span>
                    ))}
                  </div>
                </div>

                {empSlots.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Chi tiết buổi nghỉ</p>
                    <div className="space-y-2">
                      {empSlots.map(s => (
                        <div key={s.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                          <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${
                            s.status === "approved" ? "bg-emerald-500" :
                            s.status === "pending"  ? "bg-amber-400" : "bg-red-400"}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-700">
                              {["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][s.day]} · {s.session === "sang" ? "Sáng" : "Chiều"}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">{s.reason}</p>
                          </div>
                          <StatusPill status={s.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {empReqs.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Đơn xin nghỉ gần đây</p>
                    <div className="space-y-2">
                      {empReqs.slice(0, 3).map(r => (
                        <div key={r.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-700">
                              {r.startDate === r.endDate
                                ? (r.session === "sang" ? "Nghỉ ca sáng" : r.session === "chieu" ? "Nghỉ ca chiều" : "Nghỉ cả ngày")
                                : "Nghỉ nhiều ngày"}
                            </p>
                            <p className="text-[11px] text-gray-400 font-mono">{r.startDate === r.endDate ? r.startDate : `${r.startDate} → ${r.endDate}`}</p>
                          </div>
                          <StatusPill status={r.status as TOStatus} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-gray-100">
                <button
                  onClick={() => { setViewEmpId(null); setTab("leave"); setStatusFilter("all") }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all"
                >
                  Xem tất cả đơn <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      })()}

      {quickAddSlot && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setQuickAddSlot(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="font-black text-gray-800 text-base">Đăng ký nghỉ hộ</h3>
              <button onClick={() => setQuickAddSlot(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-r from-[#C62828]/5 to-[#C62828]/10 p-4 rounded-2xl border border-[#C62828]/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C62828]/10 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-[#C62828]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Nhân viên</p>
                  <p className="font-black text-gray-800 text-sm">{quickAddSlot.empName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Từ ngày</label>
                  <input type="date" value={quickAddStartDate} onChange={e => setQuickAddStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Đến ngày</label>
                  <input type="date" value={quickAddEndDate} onChange={e => setQuickAddEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Buổi nghỉ</label>
                <div className="grid grid-cols-3 gap-2">
                  {([["sang", "☀️", "Sáng"], ["chieu", "🌤", "Chiều"], ["all", "🌙", "Cả ngày"]] as const).map(([val, icon, label]) => (
                    <button key={val} type="button"
                      onClick={() => setQuickAddSessionMode(val)}
                      className={`py-2.5 rounded-xl text-sm font-bold border transition-all flex flex-col items-center gap-0.5 ${quickAddSessionMode === val ? "bg-[#C62828] text-white border-[#C62828] shadow-sm" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#C62828]/40"}`}>
                      <span className="text-base leading-none">{icon}</span>
                      <span className="text-[11px]">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Lý do nghỉ</label>
                <input type="text" value={quickAddReason} onChange={e => setQuickAddReason(e.target.value)}
                  placeholder="Ví dụ: Nghỉ khám răng, việc gia đình..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] transition-colors" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-2">
              <button onClick={handleCreateQuickSlot} disabled={processingIds.includes("quick-create")}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#C62828] to-[#E64A19] hover:from-[#B71C1C] hover:to-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-black transition-all active:scale-95 shadow-sm">
                {processingIds.includes("quick-create") && (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                Đăng ký & Duyệt ngay
              </button>
              <button onClick={() => setQuickAddSlot(null)}
                className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-sm font-semibold transition-all">
                Hủy
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedRequest && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C62828]/5 flex items-center justify-center">
                  <FileText size={16} className="text-[#C62828]" />
                </div>
                <div>
                  <h3 className="font-black text-gray-800 text-base">Chi tiết đơn xin nghỉ</h3>
                  <p className="text-xs text-gray-400">Mã đơn: <span className="font-mono font-bold text-gray-600">{selectedRequest.id}</span></p>
                </div>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-2xl p-5 space-y-3.5 border border-gray-100">
                <div className="flex items-start gap-3">
                  <AvatarCircle name={selectedRequest.employeeName} photo={employees.find(e => e.id === selectedRequest.employeeId)?.photos?.[0]} size="md" />
                  <div>
                    <p className="font-black text-gray-800 text-sm">{selectedRequest.employeeName}</p>
                    <p className="text-xs text-gray-400">{selectedRequest.department}</p>
                  </div>
                </div>

                <div className="h-px bg-gray-200/60 my-2" />

                {[
                  ["Phân loại", selectedRequest.category === "timeoff" ? "Time off" : "Nghỉ phép"],
                  ["Ca nghỉ", selectedRequest.startDate !== selectedRequest.endDate 
                    ? "Nhiều ngày" 
                    : (selectedRequest.session === "sang" ? "Ca sáng" : selectedRequest.session === "chieu" ? "Ca chiều" : "Cả ngày")],
                  ["Thời gian", selectedRequest.startDate === selectedRequest.endDate 
                    ? selectedRequest.startDate 
                    : `${selectedRequest.startDate} → ${selectedRequest.endDate}`],
                  ["Thời gian gửi", selectedRequest.submittedAt],
                  ["Lý do", selectedRequest.reason || "Không có lý do"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-3 text-sm">
                    <span className="font-bold text-gray-400 w-32 flex-shrink-0 uppercase text-[10px] tracking-wider pt-0.5">{k}</span>
                    <span className="text-gray-700 font-semibold">{v}</span>
                  </div>
                ))}

                <div className="pt-2 flex items-center gap-2">
                  <span className="font-bold text-gray-400 w-32 flex-shrink-0 uppercase text-[10px] tracking-wider">Trạng thái</span>
                  <StatusPill status={selectedRequest.status as TOStatus} />
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-2">
              {selectedRequest.status === "pending" && !isRequestExpired(selectedRequest) && (
                <>
                  <button onClick={() => { approveReq(selectedRequest.id); setSelectedRequest(null) }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-black transition-all active:scale-95 shadow-sm">
                    <Check size={16} className="stroke-[3px]" /> Phê duyệt
                  </button>
                  <button onClick={() => { rejectReq(selectedRequest.id); setSelectedRequest(null) }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-black transition-all active:scale-95 shadow-sm">
                    <X size={16} className="stroke-[3px]" /> Từ chối
                  </button>
                </>
              )}
              <button onClick={() => setSelectedRequest(null)}
                className={`py-3 bg-gray-150 hover:bg-gray-200 text-gray-700 rounded-2xl text-sm font-bold transition-all ${selectedRequest.status === "pending" && !isRequestExpired(selectedRequest) ? "px-5" : "flex-1"}`}>
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
