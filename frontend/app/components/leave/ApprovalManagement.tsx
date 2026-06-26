import React, { useState, useEffect, useMemo } from "react"
import {
  Search, Check, X, Plus, Edit2, Trash2, FileText,
  Calendar, Clock, AlertCircle, TrendingUp, Users,
  Sun, Sunset, CheckCircle2, XCircle, Zap, Building2,
  Eye, ChevronRight, PenLine, LayoutGrid, ClipboardList
} from "lucide-react"
import { api } from "@/lib/api"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from "recharts"

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

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
}

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-blue-100 text-blue-600",
}

function initials(name: string): string {
  return name.split(" ").pop()?.charAt(0) ?? "?"
}

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[status] ?? "bg-gray-100 text-gray-500"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function AvatarCircle({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const s = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials(name)}
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
  const [tab, setTab] = useState<"leave" | "timeoff" | "balance" | "types" | "stats">("timeoff")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchEmp, setSearchEmp] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<TimeOffSlot | null>(null)
  const [adminNote, setAdminNote] = useState("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<"success" | "error">("success")

  const [bulkMode, setBulkMode] = useState(false)
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([])

  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedMonth, setSelectedMonth] = useState(6)
  const [weekFilter, setWeekFilter] = useState("W26")
  const [deptFilter, setDeptFilter] = useState("all")
  const [viewEmpId, setViewEmpId] = useState<string | null>(null)
  const [employees, setEmployees] = useState<{ id: string; name: string; department: string; position?: string; joinDate?: string }[]>([])
  const [showToday, setShowToday] = useState(false)

  const [leaveTypes, setLeaveTypes] = useState([
    { id: "LT1", name: "Nghỉ phép năm", code: "AL", color: "bg-green-100 border border-green-300 text-green-700", maxDays: 12, description: "Nghỉ hưởng lương định kỳ hàng năm", active: true },
    { id: "LT2", name: "Nghỉ ốm", code: "SL", color: "bg-red-100 border border-red-300 text-red-600", maxDays: 5, description: "Nghỉ do ốm đau, cần giấy khám sức khỏe", active: true },
    { id: "LT3", name: "Nghỉ không lương", code: "UL", color: "bg-gray-100 border border-gray-300 text-gray-700", maxDays: 0, description: "Nghỉ việc riêng không hưởng lương", active: true },
    { id: "LT4", name: "Nghỉ thai sản", code: "ML", color: "bg-purple-100 border border-purple-300 text-purple-700", maxDays: 180, description: "Chế độ thai sản cho nhân viên", active: true },
    { id: "LT5", name: "Nghỉ kết hôn", code: "ML2", color: "bg-pink-100 border border-pink-300 text-pink-700", maxDays: 3, description: "Nghỉ đám cưới cá nhân", active: true },
  ])
  const [showAddTypeModal, setShowAddTypeModal] = useState(false)
  const [newType, setNewType] = useState({ name: "", code: "", maxDays: 12, description: "" })

  const [leaveBalances, setLeaveBalances] = useState([
    { id: "LB1", empId: "NV001", name: "Trần Thị Bích Liên", department: "Frontend", total: 12, used: 2, remaining: 10 },
    { id: "LB2", empId: "NV002", name: "Nguyễn Văn Minh", department: "Backend", total: 12, used: 4, remaining: 8 },
    { id: "LB3", empId: "NV003", name: "Lê Thu Hương", department: "Design", total: 12, used: 1.5, remaining: 10.5 },
    { id: "LB4", empId: "NV004", name: "Phạm Đức Thành", department: "PM", total: 14, used: 3, remaining: 11 },
    { id: "LB5", empId: "NV005", name: "Hoàng Thị Mai", department: "HR", total: 12, used: 5, remaining: 7 },
    { id: "LB6", empId: "NV006", name: "Võ Minh Tuấn", department: "Backend", total: 12, used: 0, remaining: 12 },
    { id: "LB7", empId: "NV007", name: "Đinh Thị Lan Anh", department: "Frontend", total: 12, used: 1, remaining: 11 },
  ])
  const [editingBalanceId, setEditingBalanceId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<number>(12)

  const [quickAddSlot, setQuickAddSlot] = useState<{ empId: string; empName: string; day: number; session: "sang" | "chieu" } | null>(null)
  const [quickAddReason, setQuickAddReason] = useState("")
  const [quickAddType, setQuickAddType] = useState("Nghỉ phép năm")

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
      .then((d: any) => setSlots(d as TimeOffSlot[]))
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

  const handleBulkApprove = async () => {
    if (selectedSlotIds.length === 0) return
    addProcessing("bulk-select-approve")
    try {
      await Promise.all(selectedSlotIds.map(id => api.timeOffSlots.approve(id, "Duyệt hàng loạt đã chọn")))
      setSlots(p => p.map(s => selectedSlotIds.includes(s.id) ? { ...s, status: "approved" as const, adminNote: "Duyệt hàng loạt đã chọn", processedAt: new Date().toLocaleString("vi") } : s))
      showToast(`Đã duyệt hàng loạt thành công ${selectedSlotIds.length} đơn!`)
      setSelectedSlotIds([])
      setBulkMode(false)
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi duyệt hàng loạt", "error")
    } finally {
      removeProcessing("bulk-select-approve")
    }
  }

  const handleBulkReject = async () => {
    if (selectedSlotIds.length === 0) return
    addProcessing("bulk-select-reject")
    try {
      await Promise.all(selectedSlotIds.map(id => api.timeOffSlots.reject(id, "Từ chối hàng loạt đã chọn")))
      setSlots(p => p.map(s => selectedSlotIds.includes(s.id) ? { ...s, status: "rejected" as const, adminNote: "Từ chối hàng loạt đã chọn", processedAt: new Date().toLocaleString("vi") } : s))
      showToast(`Đã từ chối hàng loạt thành công ${selectedSlotIds.length} đơn!`, "error")
      setSelectedSlotIds([])
      setBulkMode(false)
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi từ chối hàng loạt", "error")
    } finally {
      removeProcessing("bulk-select-reject")
    }
  }

  const toggleSelectSlot = (id: string) => {
    setSelectedSlotIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSaveLeaveType = () => {
    if (!newType.name.trim() || !newType.code.trim()) {
      showToast("Vui lòng nhập đầy đủ thông tin loại phép!", "error")
      return
    }
    const colorClasses = [
      "bg-teal-100 border border-teal-300 text-teal-700",
      "bg-indigo-100 border border-indigo-300 text-indigo-700",
      "bg-rose-100 border border-rose-300 text-rose-700",
      "bg-amber-100 border border-amber-300 text-amber-700",
    ]
    const randomColor = colorClasses[Math.floor(Math.random() * colorClasses.length)]
    setLeaveTypes(p => [...p, {
      id: `LT${p.length + 1}`,
      name: newType.name,
      code: newType.code.toUpperCase(),
      color: randomColor,
      maxDays: Number(newType.maxDays),
      description: newType.description,
      active: true
    }])
    setNewType({ name: "", code: "", maxDays: 12, description: "" })
    setShowAddTypeModal(false)
    showToast("Đã thêm loại nghỉ phép mới thành công!")
  }

  const startEditingBalance = (id: string, currentTotal: number) => {
    setEditingBalanceId(id)
    setEditingValue(currentTotal)
  }

  const saveBalanceInline = (id: string) => {
    setLeaveBalances(prev => prev.map(b => {
      if (b.id === id) {
        const nextTotal = editingValue
        const nextRemaining = nextTotal - b.used
        return { ...b, total: nextTotal, remaining: nextRemaining >= 0 ? nextRemaining : 0 }
      }
      return b
    }))
    setEditingBalanceId(null)
    showToast("Cập nhật hạn mức ngày phép thành công!")
  }

  const handleCreateQuickSlot = async () => {
    if (!quickAddReason.trim()) {
      showToast("Vui lòng nhập lý do nghỉ phép!", "error")
      return
    }
    const emp = slots.find(s => s.empId === quickAddSlot?.empId)
    addProcessing("quick-create")
    try {
      const created = await api.timeOffSlots.create({
        empId: quickAddSlot!.empId,
        empName: quickAddSlot!.empName,
        empCode: emp?.empCode ?? "2026xxxx",
        department: emp?.department ?? "Phòng ban",
        day: quickAddSlot!.day,
        session: quickAddSlot!.session,
        reason: quickAddReason,
        status: "approved",
        week: weekFilter,
        registeredAt: new Date().toLocaleString("vi"),
        adminNote: "Đăng ký hộ & Duyệt ngay",
        processedAt: new Date().toLocaleString("vi")
      }) as TimeOffSlot
      setSlots(p => [...p, created])
      setQuickAddSlot(null)
      setQuickAddReason("")
      showToast(`Đã đăng ký và duyệt nghỉ cho ${quickAddSlot!.empName}!`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi tạo buổi nghỉ", "error")
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
    const DAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
    const week = weeksInMonth.find(w => w.value === weekFilter)
    if (!week) return DAY_LABELS.map((label, i) => ({ label, date: "—", day: i + 1 }))
    return DAY_LABELS.map((label, i) => {
      const d = new Date(week.startDate)
      d.setDate(d.getDate() + i)
      return { label, date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`, day: i + 1 }
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

  const slotStyle: Record<TOStatus, string> = {
    approved: "bg-green-50 border border-green-200 text-green-700",
    pending: "bg-amber-50 border border-amber-200 text-amber-700",
    rejected: "bg-red-50 border border-red-200 text-red-500 line-through",
  }

  const chartWeeklyData = [
    { day: "Thứ 2", "Đơn nghỉ": slots.filter(s => s.day === 1 && s.status === "approved").length },
    { day: "Thứ 3", "Đơn nghỉ": slots.filter(s => s.day === 2 && s.status === "approved").length },
    { day: "Thứ 4", "Đơn nghỉ": slots.filter(s => s.day === 3 && s.status === "approved").length },
    { day: "Thứ 5", "Đơn nghỉ": slots.filter(s => s.day === 4 && s.status === "approved").length },
    { day: "Thứ 6", "Đơn nghỉ": slots.filter(s => s.day === 5 && s.status === "approved").length },
    { day: "Thứ 7", "Đơn nghỉ": slots.filter(s => s.day === 6 && s.status === "approved").length },
  ]

  const pieData = [
    { name: "Phép năm", value: 18, color: "#16A34A" },
    { name: "Nghỉ ốm", value: 4, color: "#EA580C" },
    { name: "Việc riêng", value: 2, color: "#9CA3AF" },
    { name: "Thai sản", value: 1, color: "#7C3AED" },
  ]

  return (
    <div className="space-y-5">
      
      {toastMessage && (
        <div className="fixed bottom-8 right-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-50 border border-white/10 animate-bounce">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Duyệt đơn & Quản lý nghỉ phép</h2>
          <p className="text-sm text-gray-400 mt-0.5">Hệ thống theo dõi lịch vắng mặt và cấu hình phép định kỳ</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white rounded-xl px-4 py-2.5 shadow-sm border border-black/5 text-center min-w-[72px]">
            <p className="text-xl font-black text-[#C62828]">{pendingLeave}</p>
            <p className="text-xs text-gray-400">Đơn xin nghỉ</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-2.5 shadow-sm border border-black/5 text-center min-w-[72px]">
            <p className="text-xl font-black text-amber-500">{pendingTimeoff}</p>
            <p className="text-xs text-gray-400">Đơn Time off</p>
          </div>
        </div>
      </div>

      <div className="flex bg-white rounded-xl p-1 shadow-sm border border-black/[0.06] overflow-x-auto gap-1">
        {[
          ["timeoff", "⏱ Lịch nghỉ tuần (Grid)"],
          ["leave", "📋 Đơn xin nghỉ (List)"],
          ["balance", "📊 Hạn mức ngày phép"],
          ["types", "⚙️ Cấu hình loại phép"],
          ["stats", "📈 Thống kê nghỉ phép"],
        ].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v as any)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0
              ${tab === v ? "bg-[#C62828] text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "timeoff" && (
        <div className="space-y-4">
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/[0.06] flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-3 flex-wrap flex-1 items-center">
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Tuần:</span>
                <select value={weekFilter} onChange={e => setWeekFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 text-gray-600 bg-gray-50/50">
                  <option value="W26">Tuần 26 (Hiện tại: 23/06 - 28/06)</option>
                  <option value="W27">Tuần 27 (Tiếp theo: 30/06 - 05/07)</option>
                </select>
              </div>

              <div className="relative w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={searchEmp} onChange={e => setSearchEmp(e.target.value)}
                  placeholder="Tìm nhân viên, phòng ban..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 focus:ring-1 focus:ring-[#C62828]/10 transition-all" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              
              <button onClick={() => { setBulkMode(!bulkMode); setSelectedSlotIds([]) }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all border
                  ${bulkMode
                    ? "bg-amber-100 border-amber-300 text-amber-700"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {bulkMode ? "✓ Đang chọn nhiều" : "🖱️ Chọn nhiều ô"}
              </button>

              <button onClick={handleApproveAllPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm shadow-orange-500/10">
                ⚡ Duyệt nhanh tất cả đơn chờ
              </button>
            </div>
          </div>

          <div className="flex gap-4 px-1">
            {[["bg-green-100 border border-green-300", "Đã duyệt"], ["bg-amber-100 border border-amber-300", "Chờ duyệt"], ["bg-red-100 border border-red-300", "Từ chối"]].map(([cls, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 rounded-md ${cls}`} />
                <span className="text-xs text-gray-500 font-medium">{label}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-black/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-4 text-left font-semibold text-gray-500 w-48 sticky left-0 bg-gray-50 z-10 border-r border-gray-100">Nhân viên</th>
                    {DAYS.map(d => (
                      <th key={d.day} colSpan={2} className="text-center font-bold text-gray-600 border-l border-gray-100 py-3 min-w-[140px]">
                        <div>{d.label}</div>
                        <div className="text-gray-400 font-normal mt-0.5">{d.date}</div>
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px]">
                    <th className="sticky left-0 bg-gray-50/50 z-10 border-r border-gray-100" />
                    {DAYS.map(d => (
                      <React.Fragment key={d.day}>
                        <th className="py-2 text-center font-bold text-teal-600 border-l border-gray-100 w-16 bg-teal-50/20">SÁNG</th>
                        <th className="py-2 text-center font-bold text-blue-600 w-16 bg-blue-50/20">CHIỀU</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {empRows.map(emp => (
                    <tr key={emp.empId} className="hover:bg-gray-50/30 transition-colors">
                      
                      <td className="px-4 py-3.5 sticky left-0 bg-white z-10 border-r border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-2.5">
                          <AvatarCircle name={emp.empName} size="sm" />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-700 text-xs truncate max-w-[110px]">{emp.empName}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{emp.empCode}</p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[110px]">{emp.department}</p>
                          </div>
                        </div>
                      </td>

                      {DAYS.map(d => {
                        const sang = getSlot(emp.empId, d.day, "sang")
                        const chieu = getSlot(emp.empId, d.day, "chieu")
                        return (
                          <React.Fragment key={`${emp.empId}-${d.day}`}>
                            
                            <td className="px-1.5 py-2 border-l border-gray-100 text-center align-middle relative group/slot min-h-[48px]">
                              {sang ? (
                                <div className="relative">
                                  
                                  {bulkMode && (
                                    <input type="checkbox" checked={selectedSlotIds.includes(sang.id)}
                                      onChange={() => toggleSelectSlot(sang.id)}
                                      className="absolute -top-1 -left-1 z-20 w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer" />
                                  )}
                                  <button onClick={() => { if (!bulkMode) { setSelectedSlot(sang); setAdminNote(sang.adminNote) } else { toggleSelectSlot(sang.id) } }}
                                    disabled={processingIds.includes(sang.id)}
                                    className={`rounded-xl p-2 text-[10px] font-bold w-full leading-snug transition-all shadow-sm ${slotStyle[sang.status]}
                                      ${selectedSlotIds.includes(sang.id) ? "ring-2 ring-amber-500 ring-offset-1" : ""}
                                      ${processingIds.includes(sang.id) ? "opacity-50" : ""}`}>
                                    <div className="font-black">Sáng</div>
                                    <div className="opacity-75 truncate max-w-[64px] mx-auto mt-0.5 font-normal">{sang.reason}</div>
                                  </button>

                                  {!bulkMode && sang.status === "pending" && (
                                    <div className="absolute inset-0 bg-white/85 backdrop-blur-[1px] rounded-xl flex items-center justify-center gap-1.5 opacity-0 group-hover/slot:opacity-100 transition-all z-10 duration-200">
                                      {processingIds.includes(sang.id) ? (
                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-[#C62828] rounded-full animate-spin" />
                                      ) : (
                                        <>
                                          <button onClick={(e) => { e.stopPropagation(); handleQuickApprove(sang.id) }}
                                            className="w-6 h-6 rounded-lg bg-green-500 text-white flex items-center justify-center hover:bg-green-600 shadow-sm transition-transform active:scale-90" title="Duyệt nhanh">
                                            <Check size={11} className="stroke-[3px]" />
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); handleQuickReject(sang.id) }}
                                            className="w-6 h-6 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-sm transition-transform active:scale-90" title="Từ chối nhanh">
                                            <X size={11} className="stroke-[3px]" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                
                                <button onClick={() => setQuickAddSlot({ empId: emp.empId, empName: emp.empName, day: d.day, session: "sang" })}
                                  disabled={processingIds.includes("quick-create")}
                                  className="w-full h-8 rounded-lg border border-dashed border-gray-100 text-gray-300 hover:border-[#C62828]/30 hover:bg-red-50/30 hover:text-[#C62828] flex items-center justify-center transition-all opacity-0 group-hover/slot:opacity-100">
                                  <Plus size={12} />
                                </button>
                              )}
                            </td>

                            <td className="px-1.5 py-2 text-center align-middle relative group/slot min-h-[48px]">
                              {chieu ? (
                                <div className="relative">
                                  
                                  {bulkMode && (
                                    <input type="checkbox" checked={selectedSlotIds.includes(chieu.id)}
                                      onChange={() => toggleSelectSlot(chieu.id)}
                                      className="absolute -top-1 -left-1 z-20 w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer" />
                                  )}
                                  <button onClick={() => { if (!bulkMode) { setSelectedSlot(chieu); setAdminNote(chieu.adminNote) } else { toggleSelectSlot(chieu.id) } }}
                                    disabled={processingIds.includes(chieu.id)}
                                    className={`rounded-xl p-2 text-[10px] font-bold w-full leading-snug transition-all shadow-sm ${slotStyle[chieu.status]}
                                      ${selectedSlotIds.includes(chieu.id) ? "ring-2 ring-amber-500 ring-offset-1" : ""}
                                      ${processingIds.includes(chieu.id) ? "opacity-50" : ""}`}>
                                    <div className="font-black">Chiều</div>
                                    <div className="opacity-75 truncate max-w-[64px] mx-auto mt-0.5 font-normal">{chieu.reason}</div>
                                  </button>

                                  {!bulkMode && chieu.status === "pending" && (
                                    <div className="absolute inset-0 bg-white/85 backdrop-blur-[1px] rounded-xl flex items-center justify-center gap-1.5 opacity-0 group-hover/slot:opacity-100 transition-all z-10 duration-200">
                                      {processingIds.includes(chieu.id) ? (
                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-[#C62828] rounded-full animate-spin" />
                                      ) : (
                                        <>
                                          <button onClick={(e) => { e.stopPropagation(); handleQuickApprove(chieu.id) }}
                                            className="w-6 h-6 rounded-lg bg-green-500 text-white flex items-center justify-center hover:bg-green-600 shadow-sm transition-transform active:scale-90" title="Duyệt nhanh">
                                            <Check size={11} className="stroke-[3px]" />
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); handleQuickReject(chieu.id) }}
                                            className="w-6 h-6 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-sm transition-transform active:scale-90" title="Từ chối nhanh">
                                            <X size={11} className="stroke-[3px]" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                
                                <button onClick={() => setQuickAddSlot({ empId: emp.empId, empName: emp.empName, day: d.day, session: "chieu" })}
                                  className="w-full h-8 rounded-lg border border-dashed border-gray-100 text-gray-300 hover:border-[#C62828]/30 hover:bg-red-50/30 hover:text-[#C62828] flex items-center justify-center transition-all opacity-0 group-hover/slot:opacity-100">
                                  <Plus size={12} />
                                </button>
                              )}
                            </td>
                          </React.Fragment>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {empRows.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <Search size={36} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">Không tìm thấy nhân viên</p>
              </div>
            )}
          </div>

          {bulkMode && selectedSlotIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-40 border border-white/10 animate-slide-up">
              <span className="text-sm font-semibold">Đã chọn <strong className="text-amber-400 text-base">{selectedSlotIds.length}</strong> buổi nghỉ phép</span>
              <div className="flex gap-2">
                <button onClick={handleBulkApprove}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold transition-all shadow-md">
                  <Check size={14} className="stroke-[2.5px]" /> Duyệt hàng loạt
                </button>
                <button onClick={handleBulkReject}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-md">
                  <X size={14} className="stroke-[2.5px]" /> Từ chối hàng loạt
                </button>
                <button onClick={() => { setSelectedSlotIds([]); setBulkMode(false) }}
                  className="px-3.5 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-xs font-bold transition-all">
                  Hủy bỏ
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "leave" && (
        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.06] overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex gap-2 flex-wrap">
            {[["all", "Tất cả"], ["pending", "Chờ duyệt"], ["approved", "Đã duyệt"], ["rejected", "Từ chối"]].map(([v, l]) => (
              <button key={v} onClick={() => setStatusFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                  ${statusFilter === v ? "bg-[#C62828] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="divide-y divide-gray-50">
            {filteredReqs.map(req => (
              <div key={req.id} className="px-6 py-5 flex items-start justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex gap-4 flex-1 min-w-0">
                  <AvatarCircle name={req.employeeName} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-700 text-sm">{req.employeeName}</span>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-400">{req.department}</span>
                      <Badge status={req.status} />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-semibold text-gray-700">{req.leaveType}</span>
                      {" · "}
                      <span className="text-xs font-mono text-gray-500">{req.startDate === req.endDate ? req.startDate : `${req.startDate} → ${req.endDate}`}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Lý do: {req.reason}</p>
                    <p className="text-xs text-gray-300 mt-0.5 font-mono">Gửi ngày: {req.submittedAt}</p>
                  </div>
                </div>
                {req.status === "pending" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => approveReq(req.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold transition-colors">
                      <Check size={13} /> Duyệt
                    </button>
                    <button onClick={() => rejectReq(req.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors">
                      <X size={13} /> Từ chối
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {filteredReqs.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <FileText size={36} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">Không có đơn nào</p>
            </div>
          )}
        </div>
      )}

      {tab === "balance" && (
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-700 text-sm">Hạn mức ngày phép nhân viên</h3>
              <p className="text-xs text-gray-400 mt-0.5">Click vào biểu tượng sửa để điều chỉnh nhanh hạn mức ngày phép</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/70 text-gray-400 text-xs border-b border-gray-100">
                  <th className="px-6 py-3.5 text-left font-semibold">Nhân viên</th>
                  <th className="px-6 py-3.5 text-left font-semibold">Phòng ban</th>
                  <th className="px-6 py-3.5 text-center font-semibold">Tổng ngày phép</th>
                  <th className="px-6 py-3.5 text-center font-semibold">Đã nghỉ (ngày)</th>
                  <th className="px-6 py-3.5 text-center font-semibold">Còn lại (ngày)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leaveBalances.map(balance => (
                  <tr key={balance.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-700">{balance.name}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{balance.department}</td>

                    <td className="px-6 py-4 text-center align-middle font-bold text-gray-700">
                      {editingBalanceId === balance.id ? (
                        <div className="flex items-center justify-center gap-1.5 max-w-[120px] mx-auto">
                          <input type="number" value={editingValue} onChange={e => setEditingValue(Number(e.target.value))}
                            onKeyDown={e => e.key === "Enter" && saveBalanceInline(balance.id)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm font-semibold focus:outline-none focus:border-[#C62828]" />
                          <button onClick={() => saveBalanceInline(balance.id)}
                            className="p-1 bg-green-500 text-white rounded hover:bg-green-600">
                            <Check size={12} />
                          </button>
                          <button onClick={() => setEditingBalanceId(null)}
                            className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 group">
                          <span>{balance.total} ngày</span>
                          <button onClick={() => startEditingBalance(balance.id, balance.total)}
                            className="p-1 text-gray-400 hover:text-[#C62828] hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-500">{balance.used}</td>
                    <td className="px-6 py-4 text-center font-bold text-green-600 bg-green-50/30">{balance.remaining}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "types" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-700">Danh sách loại nghỉ phép cấu hình</h3>
            <button onClick={() => setShowAddTypeModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-xs font-bold transition-all shadow-sm">
              <Plus size={13} /> Thêm loại phép mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaveTypes.map(type => (
              <div key={type.id} className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Mã: {type.code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${type.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {type.active ? "Đang chạy" : "Vô hiệu"}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-gray-800 mb-1">{type.name}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">{type.description}</p>
                </div>
                <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Ngày cho phép: <strong className="text-[#C62828]">{type.maxDays || "—"}</strong></span>
                  <div className="flex gap-2">
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => { setLeaveTypes(p => p.filter(t => t.id !== type.id)); showToast("Đã xóa loại nghỉ phép!") }}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "stats" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
            <h3 className="font-bold text-gray-700 text-sm mb-4">Lịch sử nghỉ trong tuần (Đơn đã duyệt)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartWeeklyData} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <ChartTooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,.08)" }} />
                <Bar dataKey="Đơn nghỉ" fill="#C62828" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
            <h3 className="font-bold text-gray-700 text-sm mb-4">Tỷ lệ theo loại nghỉ phép (%)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                  {pieData.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                </Pie>
                <ChartTooltip formatter={(v: any) => [`${v} lượt`, ""]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,.08)" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {selectedSlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-[#C62828]">
                <FileText size={16} />
                <h3 className="font-bold text-base">Xử lý yêu cầu nghỉ phép</h3>
              </div>
              <button onClick={() => setSelectedSlot(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"><X size={16} /></button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm border border-gray-100">
                {[
                  ["Nhân viên", `${selectedSlot.empName} (${selectedSlot.empCode})`],
                  ["Phòng ban", selectedSlot.department],
                  ["Ngày nghỉ", `${["", "Thứ 2 (23/06)", "Thứ 3 (24/06)", "Thứ 4 (25/06)", "Thứ 5 (26/06)", "Thứ 6 (27/06)", "Thứ 7 (28/06)"][selectedSlot.day]}`],
                  ["Buổi nghỉ", selectedSlot.session === "sang" ? "Sáng" : "Chiều"],
                  ["Lý do nghỉ", selectedSlot.reason],
                  ["Tuần", selectedSlot.week],
                  ["Trạng thái", selectedSlot.status === "approved" ? "Đã duyệt" : selectedSlot.status === "pending" ? "Chờ duyệt" : "Từ chối"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="font-semibold text-gray-700 w-32 flex-shrink-0">{k}:</span>
                    <span className="text-gray-600">{v}</span>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ý kiến phản hồi của Admin:</label>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={2}
                  placeholder="Nhập ghi chú phản hồi..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 resize-none" />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-2">
              {selectedSlot.status === "pending" && (
                <>
                  <button onClick={() => { handleQuickApprove(selectedSlot.id); setSelectedSlot(null) }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-colors">
                    <Check size={15} /> Duyệt đơn
                  </button>
                  <button onClick={() => { handleQuickReject(selectedSlot.id); setSelectedSlot(null) }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors">
                    <X size={15} /> Từ chối
                  </button>
                </>
              )}
              <button onClick={() => setSelectedSlot(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold transition-colors flex-1 text-center">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddTypeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-base">Thêm loại nghỉ phép mới</h3>
              <button onClick={() => setShowAddTypeModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tên loại phép</label>
                <input type="text" value={newType.name} onChange={e => setNewType(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ví dụ: Nghỉ học quân sự, Thai sản..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mã viết tắt</label>
                  <input type="text" value={newType.code} onChange={e => setNewType(p => ({ ...p, code: e.target.value }))}
                    placeholder="AL, SL, UL..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Số ngày phép</label>
                  <input type="number" value={newType.maxDays} onChange={e => setNewType(p => ({ ...p, maxDays: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mô tả chi tiết</label>
                <textarea value={newType.description} onChange={e => setNewType(p => ({ ...p, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] resize-none" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-2">
              <button onClick={handleSaveLeaveType}
                className="flex-1 py-2.5 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                Lưu loại phép
              </button>
              <button onClick={() => setShowAddTypeModal(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold transition-all">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {quickAddSlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-base">Đăng ký nghỉ hộ nhân viên</h3>
              <button onClick={() => setQuickAddSlot(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1 text-xs text-gray-600">
                <p>👤 <strong>Nhân viên:</strong> {quickAddSlot.empName}</p>
                <p>📅 <strong>Ngày nghỉ:</strong> {["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][quickAddSlot.day]}</p>
                <p>⏱ <strong>Buổi nghỉ:</strong> {quickAddSlot.session === "sang" ? "Sáng" : "Chiều"}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Loại phép</label>
                <select value={quickAddType} onChange={e => setQuickAddType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] bg-white">
                  {leaveTypes.map(t => <option key={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Lý do nghỉ</label>
                <input type="text" value={quickAddReason} onChange={e => setQuickAddReason(e.target.value)}
                  placeholder="Ví dụ: Nghỉ khám răng, việc gia đình..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-2">
              <button onClick={handleCreateQuickSlot}
                className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                Đăng ký & Duyệt ngay
              </button>
              <button onClick={() => setQuickAddSlot(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold transition-all">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
