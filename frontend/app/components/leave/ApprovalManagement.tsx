import React, { useState, useEffect, useMemo } from "react"
import {
  Search, Check, X, Plus, FileText,
  Calendar, Clock, TrendingUp,
  LayoutGrid, ClipboardList,
  User, Zap, Sun, Sunset,
  CheckCircle2, XCircle, AlertCircle, Building2,
  Eye, ChevronRight, PenLine,
} from "lucide-react"
import { api } from "@/lib/api"

export type TOStatus = "approved" | "pending" | "rejected"

export interface TimeOffSlot {
  id: string
  empId: string
  empName: string
  empCode: string
  department: string
  day: number
  session: "sang" | "chieu"
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
  leaveType: string
  category: "leave" | "timeoff"
  startDate: string
  endDate: string
  reason: string
  status: "pending" | "approved" | "rejected"
  submittedAt: string
}

function initials(name: string): string {
  return name.split(" ").pop()?.charAt(0) ?? "?"
}

function AvatarCircle({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-10 h-10 text-sm"
  const colors = [
    "from-[#C62828] to-[#E64A19]",
    "from-[#1565C0] to-[#0288D1]",
    "from-[#2E7D32] to-[#388E3C]",
    "from-[#6A1B9A] to-[#8E24AA]",
    "from-[#E65100] to-[#F57C00]",
  ]
  const colorIdx = name.charCodeAt(0) % colors.length
  return (
    <div className={`${s} rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white font-black flex-shrink-0 shadow-sm`}>
      {initials(name)}
    </div>
  )
}

function StatusPill({ status }: { status: TOStatus }) {
  const cfg = {
    approved: { icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Đã duyệt" },
    pending:  { icon: AlertCircle,   cls: "bg-amber-50  text-amber-700  border-amber-200",   label: "Chờ duyệt" },
    rejected: { icon: XCircle,       cls: "bg-red-50    text-red-700    border-red-200",      label: "Từ chối" },
  }[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${cfg.cls}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
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
      <button
        onClick={() => onQuickAdd({ empId, empName, day, session })}
        className="group w-full h-14 rounded-xl border-2 border-dashed border-gray-100 hover:border-[#C62828]/30 hover:bg-red-50/30 flex items-center justify-center transition-all duration-200"
        title={`Thêm nghỉ ${sessionLabel}`}
      >
        <Plus size={14} className="text-gray-200 group-hover:text-[#C62828]/50 transition-colors" />
      </button>
    )
  }

  const statusStyles: Record<TOStatus, string> = {
    approved: "bg-emerald-50 border-emerald-300 text-emerald-900",
    pending:  "bg-amber-50  border-amber-300  text-amber-900",
    rejected: "bg-red-50    border-red-300    text-red-900",
  }
  const sessionAccent: Record<"sang" | "chieu", string> = {
    sang:  "text-teal-600",
    chieu: "text-orange-500",
  }

  return (
    <div className="relative group/cell">
      <button
        onClick={() => onClick(slot)}
        className={`w-full h-14 rounded-xl border-2 px-2 py-1.5 text-left flex flex-col justify-between transition-all duration-150 hover:shadow-sm overflow-hidden ${statusStyles[slot.status]}`}
      >
        <div className="flex items-center gap-1 flex-shrink-0">
          <SessionIcon size={10} className={sessionAccent[session]} />
          <span className="text-[10px] font-black tracking-wide">{sessionLabel}</span>
        </div>
        <p className="text-[10px] font-semibold leading-tight w-full overflow-hidden whitespace-nowrap text-ellipsis">{slot.reason}</p>
      </button>

      {slot.status === "pending" && (
        <div className="absolute inset-0 bg-white/85 backdrop-blur-[2px] rounded-xl flex items-center justify-center gap-1.5 opacity-0 group-hover/cell:opacity-100 transition-all duration-150 z-10">
          {disabled ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#C62828] rounded-full animate-spin" />
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onApprove(slot.id) }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black transition-all active:scale-95 shadow-sm"
              >
                <Check size={10} className="stroke-[3px]" /> Duyệt
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReject(slot.id) }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-black transition-all active:scale-95 shadow-sm"
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

export default function ApprovalManagement() {
  const [requests, setRequests] = useState<RequestRecord[]>([])
  const [slots, setSlots] = useState<TimeOffSlot[]>([])
  const [tab, setTab] = useState<"leave" | "timeoff" | "stats">("timeoff")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchEmp, setSearchEmp] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<TimeOffSlot | null>(null)
  const [adminNote, setAdminNote] = useState("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<"success" | "error">("success")
  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedMonth, setSelectedMonth] = useState(6)
  const [weekFilter, setWeekFilter] = useState("W26")
  const [deptFilter, setDeptFilter] = useState("all")
  const [viewEmpId, setViewEmpId] = useState<string | null>(null)
  const [employees, setEmployees] = useState<{ id: string; name: string; department: string; position?: string; joinDate?: string }[]>([])

  const [showToday, setShowToday] = useState(false)
  const [quickAddSlot, setQuickAddSlot] = useState<{ empId: string; empName: string; day: number; session: "sang" | "chieu" } | null>(null)
  const [quickAddReason, setQuickAddReason] = useState("")
  const [quickAddType, setQuickAddType] = useState("Nghỉ phép năm")
  const [confirmAction, setConfirmAction] = useState<{ label: string; count: number; variant: "approve" | "reject"; onConfirm: () => void } | null>(null)
  const [loadingInit, setLoadingInit] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [processingIds, setProcessingIds] = useState<string[]>([])
  const [initError, setInitError] = useState(false)

  useEffect(() => {
    Promise.all([
      api.requests.list().then(d => setRequests(d as RequestRecord[])),
      api.employees.list().then(d => setEmployees(d as { id: string; name: string; department: string; position?: string; joinDate?: string }[])),
    ])
      .catch(() => setInitError(true))
      .finally(() => setLoadingInit(false))
  }, [])

  useEffect(() => {
    const weeks = computeWeeksInMonth(selectedYear, selectedMonth)
    if (weeks.length > 0 && !weeks.find(w => w.value === weekFilter)) {
      setWeekFilter(weeks[0].value)
    }
  }, [selectedYear, selectedMonth])

  useEffect(() => {
    setLoadingSlots(true)
    api.timeOffSlots.list({ week: weekFilter })
      .then(d => setSlots(d as TimeOffSlot[]))
      .catch(() => showToast("Lỗi tải lịch ca nghỉ", "error"))
      .finally(() => setLoadingSlots(false))
    setShowToday(false)
  }, [weekFilter])

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg); setToastType(type)
    setTimeout(() => setToastMessage(null), 2800)
  }
  const addProcessing    = (id: string) => setProcessingIds(p => [...p, id])
  const removeProcessing = (id: string) => setProcessingIds(p => p.filter(x => x !== id))

  const pendingLeave = requests.filter(r => r.status === "pending").length
  const pendingTimeoff = slots.filter(s => s.status === "pending").length

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
    const pending = requests.filter(r => r.status === "pending")
    if (pending.length === 0) return
    addProcessing("bulk-req")
    try {
      await Promise.all(pending.map(r => api.requests.approve(r.id)))
      setRequests(p => p.map(r => r.status === "pending" ? { ...r, status: "approved" as const } : r))
      showToast(`Đã duyệt ${pending.length} đơn xin nghỉ!`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi duyệt hàng loạt", "error")
    } finally {
      removeProcessing("bulk-req")
    }
  }

  const rejectAllReqs = async () => {
    const pending = requests.filter(r => r.status === "pending")
    if (pending.length === 0) return
    addProcessing("bulk-req-reject")
    try {
      await Promise.all(pending.map(r => api.requests.reject(r.id)))
      setRequests(p => p.map(r => r.status === "pending" ? { ...r, status: "rejected" as const } : r))
      showToast(`Đã từ chối ${pending.length} đơn xin nghỉ!`, "error")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi từ chối hàng loạt", "error")
    } finally {
      removeProcessing("bulk-req-reject")
    }
  }

  const handleQuickApprove = async (id: string) => {
    addProcessing(id)
    try {
      await api.timeOffSlots.approve(id, "Duyệt nhanh trực tiếp")
      setSlots(p => p.map(s => s.id === id ? { ...s, status: "approved" as const, adminNote: "Duyệt nhanh trực tiếp", processedAt: new Date().toLocaleString("vi") } : s))
      showToast("Đã duyệt buổi nghỉ phép!")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi duyệt buổi nghỉ", "error")
    } finally {
      removeProcessing(id)
    }
  }
  const handleQuickReject = async (id: string) => {
    addProcessing(id)
    try {
      await api.timeOffSlots.reject(id, "Từ chối nhanh trực tiếp")
      setSlots(p => p.map(s => s.id === id ? { ...s, status: "rejected" as const, adminNote: "Từ chối nhanh trực tiếp", processedAt: new Date().toLocaleString("vi") } : s))
      showToast("Đã từ chối buổi nghỉ phép!", "error")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi từ chối buổi nghỉ", "error")
    } finally {
      removeProcessing(id)
    }
  }

  const handleApproveAllPending = async () => {
    const pendingSlots = slots.filter(s => s.status === "pending" && s.week === weekFilter)
    if (pendingSlots.length === 0) { showToast("Không có đơn nào chờ duyệt!", "error"); return }
    addProcessing("bulk-slots")
    try {
      await api.timeOffSlots.approveAll(weekFilter)
      setSlots(p => p.map(s => (s.status === "pending" && s.week === weekFilter)
        ? { ...s, status: "approved" as const, adminNote: "Duyệt hàng loạt", processedAt: new Date().toLocaleString("vi") }
        : s))
      showToast(`Đã duyệt tất cả ${pendingSlots.length} đơn chờ duyệt!`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi duyệt hàng loạt", "error")
    } finally {
      removeProcessing("bulk-slots")
    }
  }

  const handleRejectAllPending = async () => {
    const pendingSlots = slots.filter(s => s.status === "pending" && s.week === weekFilter)
    if (pendingSlots.length === 0) { showToast("Không có đơn nào chờ duyệt!", "error"); return }
    addProcessing("bulk-slots-reject")
    try {
      await Promise.all(pendingSlots.map(s => api.timeOffSlots.reject(s.id, "Từ chối hàng loạt")))
      setSlots(p => p.map(s => (s.status === "pending" && s.week === weekFilter)
        ? { ...s, status: "rejected" as const, adminNote: "Từ chối hàng loạt", processedAt: new Date().toLocaleString("vi") }
        : s))
      showToast(`Đã từ chối ${pendingSlots.length} đơn chờ duyệt!`, "error")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi từ chối hàng loạt", "error")
    } finally {
      removeProcessing("bulk-slots-reject")
    }
  }

  const handleCreateQuickSlot = async () => {
    if (!quickAddReason.trim()) { showToast("Vui lòng nhập lý do nghỉ!", "error"); return }
    const emp = slots.find(s => s.empId === quickAddSlot?.empId)
    addProcessing("quick-create")
    try {
      const created = await api.timeOffSlots.create({
        empId: quickAddSlot!.empId, empName: quickAddSlot!.empName,
        empCode: emp?.empCode ?? "2026xxxx", department: emp?.department ?? "Phòng ban",
        day: quickAddSlot!.day, session: quickAddSlot!.session,
        reason: quickAddReason, status: "approved", week: weekFilter,
        registeredAt: new Date().toLocaleString("vi"),
        adminNote: "Đăng ký hộ & Duyệt ngay", processedAt: new Date().toLocaleString("vi"),
      }) as TimeOffSlot
      const empName = quickAddSlot!.empName
      setSlots(p => [...p, created])
      setQuickAddSlot(null); setQuickAddReason("")
      showToast(`Đã đăng ký & duyệt nghỉ cho ${empName}!`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi tạo ca nghỉ", "error")
    } finally {
      removeProcessing("quick-create")
    }
  }

  const filteredReqs = useMemo(
    () => requests.filter(r => statusFilter === "all" || r.status === statusFilter),
    [requests, statusFilter]
  )

  const weeksInMonth = useMemo(
    () => computeWeeksInMonth(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  )

  const DAYS = useMemo(() => {
    const DAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"]
    const week = weeksInMonth.find(w => w.value === weekFilter)
    if (!week) return DAY_LABELS.map((label, i) => ({ label, date: "—", day: i + 1 }))
    return DAY_LABELS.map((label, i) => {
      const d = new Date(week.startDate)
      d.setDate(d.getDate() + i)
      return { label, date: `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`, day: i + 1 }
    })
  }, [weeksInMonth, weekFilter])

  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.department).filter(Boolean))
    return Array.from(depts).sort()
  }, [employees])

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
        return matchSearch && matchDept
      })
      .sort((a, b) => parseVnDate(a.joinDate) - parseVnDate(b.joinDate))
      .map(e => ({ empId: e.id, empName: e.name, empCode: e.id, department: e.department ?? "", position: e.position ?? "" }))
  }, [employees, searchEmp, deptFilter])

  const getSlot = (empId: string, day: number, session: "sang" | "chieu") =>
    slots.find(s => s.empId === empId && s.day === day && s.session === session && s.week === weekFilter)



  const pendingSlotCount  = slots.filter(s => s.status === "pending"  && s.week === weekFilter).length
  const approvedSlotCount = slots.filter(s => s.status === "approved" && s.week === weekFilter).length
  const rejectedSlotCount = slots.filter(s => s.status === "rejected" && s.week === weekFilter).length

  const _now             = new Date()
  const _todayDow        = _now.getDay()
  const _isWeekend       = _todayDow === 0 || _todayDow === 6
  const _todayStr        = `${String(_now.getDate()).padStart(2,"0")}/${String(_now.getMonth()+1).padStart(2,"0")}`
  const _todayDayEntry   = DAYS.find(d => d.date === _todayStr)
  const _todayInThisWeek = !!_todayDayEntry
  const _todayDayNum     = _todayDayEntry?.day ?? -1
  const _todaySlots      = showToday && _todayInThisWeek
    ? slots.filter(s => s.day === _todayDayNum)
    : null

  const statByEmp = useMemo(() => {
    const src = _todaySlots ?? slots
    const map = new Map<string, number>()
    src.filter(s => s.status === "approved").forEach(s => {
      map.set(s.empName, (map.get(s.empName) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .map(([name, count]) => ({ name: name.split(" ").slice(-2).join(" "), count }))
      .sort((a, b) => b.count - a.count)
  }, [slots, showToday, _todayDayNum])

  const statByDept = useMemo(() => {
    const src = _todaySlots ?? slots
    const map = new Map<string, { approved: number; pending: number; rejected: number }>()
    src.forEach(s => {
      const cur = map.get(s.department) ?? { approved: 0, pending: 0, rejected: 0 }
      cur[s.status as TOStatus]++
      map.set(s.department, cur)
    })
    return Array.from(map.entries()).map(([dept, v]) => ({ dept, ...v }))
  }, [slots, showToday, _todayDayNum])


  return (
    <div className="space-y-4 pb-24">
      {}
      {toastMessage && (
        <div className={`fixed bottom-24 right-6 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-[60] border backdrop-blur-sm animate-in slide-in-from-right duration-300
          ${toastType === "success"
            ? "bg-gray-900/95 text-white border-white/10"
            : "bg-red-900/95 text-white border-red-500/20"}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${toastType === "success" ? "bg-emerald-400" : "bg-red-400"} animate-pulse`} />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-gray-800">Quản lý nghỉ phép</h2>
          <p className="text-sm text-gray-400 mt-0.5">Theo dõi & xử lý đơn nghỉ phép nhân viên</p>
        </div>
        <div className="flex gap-2">
          {[
            { count: pendingLeave, label: "Đơn xin nghỉ", color: "text-[#C62828]", bg: "bg-red-50 border-red-100" },
            { count: pendingTimeoff, label: "Time-off chờ", color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
          ].map(({ count, label, color, bg }) => (
            <div key={label} className={`rounded-2xl px-4 py-2.5 border text-center min-w-[80px] ${bg}`}>
              <p className={`text-2xl font-black ${color}`}>{count}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {}
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

      {}
      {tab === "timeoff" && (
        <div className="space-y-4">
          {}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/[0.06] flex items-center gap-3 flex-wrap">
            {}
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
              <input
                type="text" inputMode="numeric" value={selectedYear}
                onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setSelectedYear(Number(e.target.value)) }}
                onBlur={e => { const v = Number(e.target.value); setSelectedYear(v < 2020 ? 2020 : v > 2035 ? 2035 : v) }}
                className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none w-12 text-center cursor-text hover:text-[#C62828] focus:text-[#C62828] transition-colors"
              />
              <span className="text-gray-300">/</span>
              <input
                type="text" inputMode="numeric" value={selectedMonth}
                onChange={e => { if (/^\d{0,2}$/.test(e.target.value)) setSelectedMonth(Number(e.target.value)) }}
                onBlur={e => { const v = Number(e.target.value); setSelectedMonth(v < 1 ? 1 : v > 12 ? 12 : v) }}
                className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none w-7 text-center cursor-text hover:text-[#C62828] focus:text-[#C62828] transition-colors"
              />
              <span className="text-gray-300">›</span>
              <select value={weekFilter} onChange={e => setWeekFilter(e.target.value)}
                className="bg-transparent text-sm text-gray-600 focus:outline-none cursor-pointer">
                {weeksInMonth.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
              <span className="w-px h-4 bg-gray-200 mx-0.5" />
              <button
                onClick={() => {
                  const now = new Date()
                  setSelectedYear(now.getFullYear())
                  setSelectedMonth(now.getMonth() + 1)
                  setWeekFilter(`W${getISOWeek(now)}`)
                }}
                className="text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap"
              >
                Tuần này
              </button>
            </div>

            {}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
              <Building2 size={13} className="text-gray-400 flex-shrink-0" />
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                className="bg-transparent text-sm text-gray-700 focus:outline-none cursor-pointer">
                <option value="all">Tất cả phòng ban</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {}
            <div className="relative flex-1 min-w-[160px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchEmp} onChange={e => setSearchEmp(e.target.value)}
                placeholder="Tìm nhân viên..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 focus:ring-2 focus:ring-[#C62828]/10 transition-all" />
            </div>

            {}
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

          {}
          <div className="space-y-3">
            {loadingInit || loadingSlots ? (
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
              empRows.map(emp => (
                <div key={emp.empId} className="bg-white rounded-2xl shadow-sm border border-black/[0.06] overflow-hidden hover:shadow-md transition-shadow duration-200">
                  {}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 bg-[#C62828]">
                    <AvatarCircle name={emp.empName} size="sm" />
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
                        const count = DAYS.reduce((acc, d) => {
                          const s = getSlot(emp.empId, d.day, "sang")
                          const c = getSlot(emp.empId, d.day, "chieu")
                          return acc + (s?.status === st ? 1 : 0) + (c?.status === st ? 1 : 0)
                        }, 0)
                        if (count === 0) return null
                        const colors = { approved: "bg-emerald-100 text-emerald-700", pending: "bg-amber-100 text-amber-700", rejected: "bg-red-100 text-red-600" }
                        return (
                          <span key={st} className={`text-[10px] font-black px-2 py-0.5 rounded-full ${colors[st]}`}>
                            {count}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  {}
                  <div className="grid grid-cols-5 divide-x divide-gray-50">
                    {DAYS.map(d => {
                      const sang = getSlot(emp.empId, d.day, "sang")
                      const chieu = getSlot(emp.empId, d.day, "chieu")
                      return (
                        <div key={d.day} className="p-2 space-y-1.5">
                          <div className="text-center mb-1.5">
                            <p className="text-[11px] font-black text-gray-700">{d.label}</p>
                            <p className="text-[10px] font-mono font-semibold text-gray-500">{d.date}</p>
                          </div>
                          <SessionBlock
                            slot={sang} session="sang"
                            empId={emp.empId} empName={emp.empName} day={d.day}
                            onApprove={handleQuickApprove} onReject={handleQuickReject}
                            onClick={s => { setSelectedSlot(s); setAdminNote(s.adminNote) }}
                            onQuickAdd={setQuickAddSlot}
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
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {}
      {tab === "leave" && (
        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.06] overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 flex-wrap">
            {[["all", "Tất cả"], ["pending", "Chờ duyệt"], ["approved", "Đã duyệt"], ["rejected", "Từ chối"]].map(([v, l]) => (
              <button key={v} onClick={() => setStatusFilter(v)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors
                  ${statusFilter === v ? "bg-[#C62828] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {l}
              </button>
            ))}
            {requests.filter(r => r.status === "pending").length > 0 && (
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setConfirmAction({ label: "Từ chối tất cả đơn xin nghỉ?", count: requests.filter(r => r.status === "pending").length, variant: "reject", onConfirm: rejectAllReqs })}
                  disabled={processingIds.includes("bulk-req-reject") || processingIds.includes("bulk-req")}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 rounded-xl text-xs font-black transition-all border border-gray-200 hover:border-red-200 active:scale-95">
                  {processingIds.includes("bulk-req-reject")
                    ? <div className="w-3 h-3 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
                    : <X size={11} className="stroke-[3px]" />}
                  Từ chối tất cả ({requests.filter(r => r.status === "pending").length})
                </button>
                <button
                  onClick={() => setConfirmAction({ label: "Duyệt tất cả đơn xin nghỉ?", count: requests.filter(r => r.status === "pending").length, variant: "approve", onConfirm: approveAllReqs })}
                  disabled={processingIds.includes("bulk-req") || processingIds.includes("bulk-req-reject")}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#C62828] to-[#E64A19] hover:from-[#B71C1C] hover:to-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black transition-all shadow-sm active:scale-95">
                  {processingIds.includes("bulk-req")
                    ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <Zap size={11} fill="currentColor" />}
                  Duyệt nhanh tất cả ({requests.filter(r => r.status === "pending").length})
                </button>
              </div>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {filteredReqs.map(req => (
              <div key={req.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex gap-3 flex-1 min-w-0 items-center">
                  <AvatarCircle name={req.employeeName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 text-sm">{req.employeeName}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{req.department}</span>
                      <StatusPill status={req.status as TOStatus} />
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      <span className="font-semibold">{req.leaveType}</span>
                      <span className="text-gray-300"> · </span>
                      <span className="font-mono text-gray-400">{req.startDate === req.endDate ? req.startDate : `${req.startDate} → ${req.endDate}`}</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">Lý do: {req.reason}</p>
                  </div>
                </div>
                {req.status === "pending" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => approveReq(req.id)} disabled={processingIds.includes(req.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all active:scale-95">
                      {processingIds.includes(req.id)
                        ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : <Check size={12} className="stroke-[3px]" />} Duyệt
                    </button>
                    <button onClick={() => rejectReq(req.id)} disabled={processingIds.includes(req.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all active:scale-95">
                      <X size={12} className="stroke-[3px]" /> Từ chối
                    </button>
                  </div>
                )}
              </div>
            ))}
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
            <div className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-2 border border-gray-200 shadow-sm">
              <input
                type="text" inputMode="numeric" value={selectedYear}
                onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setSelectedYear(Number(e.target.value)) }}
                onBlur={e => { const v = Number(e.target.value); setSelectedYear(v < 2020 ? 2020 : v > 2035 ? 2035 : v) }}
                className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none w-12 text-center cursor-text hover:text-[#C62828] focus:text-[#C62828] transition-colors"
              />
              <span className="text-gray-300">/</span>
              <input
                type="text" inputMode="numeric" value={selectedMonth}
                onChange={e => { if (/^\d{0,2}$/.test(e.target.value)) setSelectedMonth(Number(e.target.value)) }}
                onBlur={e => { const v = Number(e.target.value); setSelectedMonth(v < 1 ? 1 : v > 12 ? 12 : v) }}
                className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none w-7 text-center cursor-text hover:text-[#C62828] focus:text-[#C62828] transition-colors"
              />
              <span className="text-gray-300">›</span>
              <select value={weekFilter} onChange={e => setWeekFilter(e.target.value)}
                className="bg-transparent text-sm text-gray-600 focus:outline-none cursor-pointer">
                {weeksInMonth.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
              <span className="w-px h-4 bg-gray-200 mx-0.5" />
              <button
                onClick={() => {
                  const now = new Date()
                  setSelectedYear(now.getFullYear())
                  setSelectedMonth(now.getMonth() + 1)
                  setWeekFilter(`W${getISOWeek(now)}`)
                  setShowToday(false)
                }}
                className="text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap"
              >
                Tuần này
              </button>
              <span className="w-px h-4 bg-gray-200 mx-0.5" />
              <button
                onClick={() => {
                  const now = new Date()
                  setSelectedYear(now.getFullYear())
                  setSelectedMonth(now.getMonth() + 1)
                  setWeekFilter(`W${getISOWeek(now)}`)
                  setShowToday(true)
                }}
                className={`text-xs font-bold transition-colors whitespace-nowrap ${showToday ? "text-[#C62828]" : "text-gray-500 hover:text-[#C62828]"}`}
              >
                Hôm nay
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {((_s) => ([
              { label: _s ? "NV nghỉ hôm nay" : "Nhân viên nghỉ", value: new Set(_s ? _s.filter(s => s.status !== "rejected").map(s => s.empId) : slots.filter(s => s.status !== "rejected").map(s => s.empId)).size, cls: "text-gray-900", bg: "bg-white border-gray-200" },
              { label: _s ? "Đã duyệt hôm nay" : "Đã duyệt",   value: (_s ?? slots).filter(s => s.status === "approved").length, cls: "text-blue-700",  bg: "bg-blue-50 border-blue-100"  },
              { label: _s ? "Chờ duyệt hôm nay" : "Chờ duyệt", value: (_s ?? slots).filter(s => s.status === "pending").length,  cls: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
              { label: _s ? "Từ chối hôm nay" : "Từ chối",     value: (_s ?? slots).filter(s => s.status === "rejected").length, cls: "text-red-700",   bg: "bg-red-50 border-red-100"    },
            ] as { label: string; value: number; cls: string; bg: string }[]))(_todaySlots).map(k => (
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
                <p className="text-2xl mb-2">🎉</p>
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

      {}
      {tab === "timeoff" && (
        <div className="sticky bottom-0 -mx-0 mt-2 z-30 px-5 py-3 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-[0_-2px_20px_rgba(0,0,0,0.07)] flex items-center gap-3 flex-wrap">
          {}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Tuần {weekFilter}:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
              <AlertCircle size={11} /> {pendingSlotCount} chờ duyệt
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <CheckCircle2 size={11} /> {approvedSlotCount} đã duyệt
            </span>
          </div>

          <div className="flex gap-2 ml-auto flex-wrap">
            {}
            {pendingSlotCount > 0 && (
              <>
                <button
                  onClick={() => setConfirmAction({ label: "Từ chối tất cả ca nghỉ chờ duyệt?", count: pendingSlotCount, variant: "reject", onConfirm: handleRejectAllPending })}
                  disabled={processingIds.includes("bulk-slots-reject") || processingIds.includes("bulk-slots")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 rounded-xl text-xs font-black transition-all border border-gray-200 hover:border-red-200 active:scale-95">
                  {processingIds.includes("bulk-slots-reject")
                    ? <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
                    : <X size={13} className="stroke-[3px]" />} Từ chối tất cả ({pendingSlotCount})
                </button>
                <button
                  onClick={() => setConfirmAction({ label: "Duyệt tất cả ca nghỉ chờ duyệt?", count: pendingSlotCount, variant: "approve", onConfirm: handleApproveAllPending })}
                  disabled={processingIds.includes("bulk-slots") || processingIds.includes("bulk-slots-reject")}
                  className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-[#C62828] to-[#E64A19] hover:from-[#B71C1C] hover:to-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black transition-all shadow-sm shadow-red-500/20 active:scale-95">
                  {processingIds.includes("bulk-slots")
                    ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <Zap size={13} fill="currentColor" />} Duyệt nhanh tất cả ({pendingSlotCount})
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {confirmAction && (
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
        </div>
      )}

      {}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedSlot(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {}
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

            {}
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
                {[
                  ["Nhân viên", `${selectedSlot.empName} · ${selectedSlot.empCode}`],
                  ["Phòng ban", selectedSlot.department],
                  ["Ngày nghỉ", (() => { const d = DAYS.find(x => x.day === selectedSlot.day); return d ? `${d.label} (${d.date})` : `Ngày ${selectedSlot.day}` })()],
                  ["Buổi nghỉ", selectedSlot.session === "sang" ? "☀️ Sáng" : "🌅 Chiều"],
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

            {}
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
        </div>
      )}

      {viewEmpId && (() => {
        const empData = employees.find(e => e.id === viewEmpId)
        const emp = empData ? { empName: empData.name, empCode: viewEmpId, department: empData.department ?? "" } : null
        const empSlots = slots.filter(s => s.empId === viewEmpId)
        const empReqs = requests.filter(r => emp && r.employeeName === emp.empName)
        return (
          <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setViewEmpId(null)}>
            <div
              className="w-[400px] h-full bg-white shadow-2xl flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {emp && <AvatarCircle name={emp.empName} size="md" />}
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
                            <p className="text-xs font-bold text-gray-700">{r.leaveType}</p>
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
          </div>
        )
      })()}

      {quickAddSlot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setQuickAddSlot(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="font-black text-gray-800 text-base">Đăng ký nghỉ hộ</h3>
              <button onClick={() => setQuickAddSlot(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2.5">
                {[
                  [User, "Nhân viên", quickAddSlot.empName],
                  [Calendar, "Ngày", ["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][quickAddSlot.day]],
                  [Clock, "Buổi", quickAddSlot.session === "sang" ? "☀️ Sáng" : "🌅 Chiều"],
                ].map(([Icon, label, value]) => (
                  <div key={label as string} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 flex-shrink-0">{React.createElement(Icon as any, { size: 13 })}</span>
                    <span className="font-semibold text-gray-500 w-20">{label as string}:</span>
                    <span className="text-gray-800 font-bold">{value as string}</span>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Loại phép</label>
                <input type="text" value={quickAddType} onChange={e => setQuickAddType(e.target.value)}
                  placeholder="Ví dụ: Nghỉ phép năm, Nghỉ ốm..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] transition-colors" />
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
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-black transition-all active:scale-95 shadow-sm">
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
        </div>
      )}
    </div>
  )
}
