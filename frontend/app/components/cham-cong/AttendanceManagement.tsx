import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
  Search, Download, Edit2, UserCheck, Clock, UserX, CalendarDays,
  BarChart3, X, Check, ChevronLeft, ChevronRight, Plus, Loader2,
  FileText, TrendingUp, AlertTriangle, RefreshCw, Calendar, Save
} from "lucide-react"
import { api } from "@/lib/api"
import { AttendanceRecord, Employee } from "../../types"
import { CustomDatePicker } from "../ui/CustomDatePicker"
import { formatAttendanceTimes, formatAttendanceNote, formatDurationHms, formatCheckTime } from "./attendanceDisplay"
import {
  EMPLOYEE_KIND,
  createAddAttendanceForm,
  enrichAttendanceRecord,
  employeeKindMeta,
  emptyTimeFormValue,
  getPunchTime,
  internLegendText,
  isInternEmployee,
  isInternRecord,
  monthRowsForEmployee,
  sessionLabel,
  toApiTime,
  INTERN_SESSION,
  type MonthTimeRow,
} from "./attendanceModel"
import { CustomSelect } from "../ui/CustomSelect"

const STATUS_MAP = {
  "on-time": { label: "Đúng giờ",  bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500"  },
  "late":    { label: "Đi trễ",    bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  "early":   { label: "Về sớm",    bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-500"  },
  "late_early": { label: "Trễ & sớm", bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-600" },
  "absent":  { label: "Vắng mặt",  bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500"    },
  "leave":   { label: "Nghỉ phép", bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
} as const

type AttStatus = keyof typeof STATUS_MAP

const HEAT_COLOR: Record<AttStatus, string> = {
  "on-time": "#bbf7d0",
  late: "#fed7aa",
  early: "#fde68a",
  late_early: "#fdba74",
  absent: "#fecaca",
  leave: "#ddd6fe",
}
const HEAT_TEXT: Record<AttStatus, string> = {
  "on-time": "#15803d",
  late: "#c2410c",
  early: "#b45309",
  late_early: "#9a3412",
  absent: "#b91c1c",
  leave: "#6d28d9",
}

function heatForStatus(status: string) {
  const key = (status in STATUS_MAP ? status : "absent") as AttStatus
  return { bg: HEAT_COLOR[key], text: HEAT_TEXT[key] }
}

function shortClock(t?: string): string | null {
  if (!t || t === "--") return null
  const m = t.match(/^(\d{1,2}):(\d{2})/)
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : null
}

function monthRowTime(rec: AttendanceRecord, row: MonthTimeRow): string | null {
  return shortClock(getPunchTime(rec, row))
}

const MONTH_SUB_ROW_H = 52

function inBranch(emp: { branchId?: string }, branch: string) {
  return branch === "all" || emp.branchId === branch
}

function branchQuery(branch: string): { branchId?: string } {
  return branch !== "all" ? { branchId: branch } : {}
}

function calcHours(ci: string, co: string): string {
  if (!ci || !co || ci === "--" || co === "--") return "--"
  const parse = (t: string) => {
    const p = t.split(":").map(Number)
    return p[0] * 3600 + (p[1] ?? 0) * 60 + (p[2] ?? 0)
  }
  const diff = parse(co) - parse(ci)
  if (diff <= 0) return "--"
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  const raw = `${h > 0 ? `${h}g` : ""}${m}p${s > 0 ? `${s}s` : ""}`
  return formatDurationHms(raw)
}

function fmtDate(iso: string) {
  if (!iso) return "--"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function isoToVn(iso: string) {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function vnToIso(vn: string) {
  if (!vn) return ""
  const [d, m, y] = vn.split("/")
  return `${y}-${m}-${d}`
}

function exportCSV(rows: AttendanceRecord[], label: string) {
  const header = ["Mã NV", "Họ tên", "Phòng ban", "Loại", "Ngày", "Giờ công", "Tổng giờ", "Trạng thái", "Ghi chú"]
  const lines = rows.map(r => {
    const t = formatAttendanceTimes(r)
    const type = employeeKindMeta(r.employeeStatus).label
    return [
      r.employeeId, r.employeeName, r.department, type, fmtDate(r.date),
      t.combined, r.workingHours ?? calcHours(r.checkIn, r.checkOut),
      STATUS_MAP[r.status as AttStatus]?.label ?? r.status, r.note
    ].join(",")
  })
  const csv = [header.join(","), ...lines].join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = `chamcong_${label}.csv`; a.click()
  URL.revokeObjectURL(url)
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status as AttStatus] ?? { label: status, bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
    </span>
  )
}

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [])
  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-sm animate-in slide-in-from-right duration-300 ${type === "success" ? "bg-gray-900/95 border-white/10 text-white" : "bg-red-900/95 border-red-500/20 text-white"}`}>
      <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${type === "success" ? "bg-emerald-400" : "bg-red-400"}`} />
      <span className="text-sm font-semibold">{msg}</span>
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="py-3.5 px-4"><div className="h-3.5 bg-gray-100 rounded-full" style={{ width: `${60 + i * 8}%` }} /></td>
      ))}
    </tr>
  )
}

function EditModal({ record, onClose, onSave }: {
  record: AttendanceRecord
  onClose: () => void
  onSave: (id: string, data: Partial<AttendanceRecord>) => Promise<void>
}) {
  const isIntern = isInternRecord(record)
  const [form, setForm] = useState(isIntern ? {
    checkInAm: emptyTimeFormValue(record.checkInAm),
    checkOutAm: emptyTimeFormValue(record.checkOutAm),
    checkInPm: emptyTimeFormValue(record.checkInPm),
    checkOutPm: emptyTimeFormValue(record.checkOutPm),
    status: record.status,
    note: record.note ?? "",
  } : {
    checkIn: emptyTimeFormValue(record.checkIn),
    checkOut: emptyTimeFormValue(record.checkOut),
    status: record.status,
    note: record.note ?? "",
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    if (isIntern) {
      const f = form as { checkInAm: string; checkOutAm: string; checkInPm: string; checkOutPm: string; status: string; note: string }
      await onSave(record.id, {
        checkInAm: toApiTime(f.checkInAm),
        checkOutAm: toApiTime(f.checkOutAm),
        checkInPm: toApiTime(f.checkInPm),
        checkOutPm: toApiTime(f.checkOutPm),
        status: f.status as AttStatus,
        note: f.note,
      })
    } else {
      const f = form as { checkIn: string; checkOut: string; status: string; note: string }
      await onSave(record.id, {
        checkIn: toApiTime(f.checkIn),
        checkOut: toApiTime(f.checkOut),
        status: f.status as AttStatus,
        note: f.note,
      })
    }
    setSaving(false)
    onClose()
  }

  const timeInput = (label: string, key: string, value: string) => (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
      <input type="time" value={value} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-gray-800 focus:outline-none focus:border-[#C62828]/50 focus:ring-2 focus:ring-[#C62828]/10" />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="bg-[#C62828] px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-black text-base">{record.employeeName}</p>
            <p className="text-white/70 text-xs mt-0.5">
              {record.employeeId} · {fmtDate(record.date)} · {employeeKindMeta(record.employeeStatus).label}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {isIntern ? (
            <div className="grid grid-cols-2 gap-4">
              {timeInput("Vào sáng", "checkInAm", (form as any).checkInAm)}
              {timeInput("Ra sáng", "checkOutAm", (form as any).checkOutAm)}
              {timeInput("Vào chiều", "checkInPm", (form as any).checkInPm)}
              {timeInput("Ra chiều", "checkOutPm", (form as any).checkOutPm)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {timeInput("Giờ Check-in", "checkIn", (form as any).checkIn)}
              {timeInput("Giờ Check-out", "checkOut", (form as any).checkOut)}
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Trạng thái</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <button key={k} onClick={() => setForm(p => ({ ...p, status: k as AttStatus }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${form.status === k ? `border-current ${v.bg} ${v.text}` : "border-gray-100 text-gray-500 hover:border-gray-200 bg-gray-50"}`}>
                  <span className={`w-2 h-2 rounded-full ${v.dot}`} />{v.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Ghi chú</label>
            <textarea rows={2} value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="Lý do đi trễ, vắng mặt..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:border-[#C62828]/50 focus:ring-2 focus:ring-[#C62828]/10 transition-all" />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">Hủy</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  )
}

function AddModal({ date, employees, onClose, onSave }: {
  date: string
  employees: Employee[]
  onClose: () => void
  onSave: (data: any) => Promise<void>
}) {
  const [form, setForm] = useState(createAddAttendanceForm)
  const [saving, setSaving] = useState(false)

  const selectedEmp = useMemo(
    () => employees.find(e => e.id === form.employeeId),
    [employees, form.employeeId],
  )
  const isIntern = isInternEmployee(selectedEmp ?? { status: "active" })

  const handleSave = async () => {
    if (!form.employeeId) return
    setSaving(true)
    if (isIntern) {
      await onSave({
        employeeId: form.employeeId,
        date,
        checkInAm: form.checkInAm,
        checkOutAm: form.checkOutAm,
        checkInPm: form.checkInPm,
        checkOutPm: form.checkOutPm,
        status: form.status,
        note: form.note,
      })
    } else {
      await onSave({
        employeeId: form.employeeId,
        date,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        status: form.status,
        note: form.note,
      })
    }
    setSaving(false)
    onClose()
  }

  const empOptions = useMemo(() => [
    { value: "", label: "-- Chọn nhân viên --" },
    ...employees.map(e => ({
      value: e.id,
      label: `${e.name} (${e.id})${isInternEmployee(e) ? ` · ${EMPLOYEE_KIND.intern.badge}` : ""}`,
    })),
  ], [employees])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-[#C62828] px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-black text-base">Thêm bản ghi chấm công</p>
            <p className="text-white/70 text-xs mt-0.5">{fmtDate(date)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white"><X size={15} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nhân viên</label>
            <CustomSelect
              value={form.employeeId}
              onChange={val => setForm(p => ({ ...p, employeeId: val }))}
              options={empOptions}
              placeholder="Chọn nhân viên..."
              heightClass="h-10"
              searchable
            />
          </div>
          {isIntern ? (
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
                Thực tập — nhập giờ theo buổi sáng / chiều
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Vào sáng</label>
                  <input type="time" value={form.checkInAm} onChange={e => setForm(p => ({ ...p, checkInAm: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-[#C62828]/40 focus:ring-2 focus:ring-[#C62828]/10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Ra sáng</label>
                  <input type="time" value={form.checkOutAm} onChange={e => setForm(p => ({ ...p, checkOutAm: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-[#C62828]/40 focus:ring-2 focus:ring-[#C62828]/10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Vào chiều</label>
                  <input type="time" value={form.checkInPm} onChange={e => setForm(p => ({ ...p, checkInPm: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-[#C62828]/40 focus:ring-2 focus:ring-[#C62828]/10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Ra chiều</label>
                  <input type="time" value={form.checkOutPm} onChange={e => setForm(p => ({ ...p, checkOutPm: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-[#C62828]/40 focus:ring-2 focus:ring-[#C62828]/10" />
                </div>
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Check-in</label>
              <input type="time" value={form.checkIn} onChange={e => setForm(p => ({ ...p, checkIn: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-[#C62828]/40 focus:ring-2 focus:ring-[#C62828]/10" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Check-out</label>
              <input type="time" value={form.checkOut} onChange={e => setForm(p => ({ ...p, checkOut: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-[#C62828]/40 focus:ring-2 focus:ring-[#C62828]/10" />
            </div>
          </div>
          )}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Trạng thái</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <button key={k} onClick={() => setForm(p => ({ ...p, status: k as AttStatus }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${form.status === k ? `border-current ${v.bg} ${v.text}` : "border-gray-100 text-gray-400 hover:border-gray-200"}`}>
                  <span className={`w-2 h-2 rounded-full ${v.dot}`} />{v.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Ghi chú</label>
            <input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="Ghi chú..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C62828]/50 focus:ring-2 focus:ring-[#C62828]/10" />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Hủy</button>
          <button onClick={handleSave} disabled={saving || !form.employeeId}
            className="flex-1 py-2.5 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Thêm bản ghi
          </button>
        </div>
      </div>
    </div>
  )
}

function DailyTab({ selectedBranch }: { selectedBranch: string }) {
  const todayISO = new Date().toISOString().split("T")[0]
  const [selectedDate, setSelectedDate] = useState(todayISO)
  const [filterEmployee, setFilterEmployee] = useState("all")
  const [search, setSearch] = useState("")
  const [filterDept, setFilterDept] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState<"all" | "intern" | "staff">("all")
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState({ onTime: 0, late: 0, absent: 0, leave: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)

  useEffect(() => { api.employees.list().then(d => setEmployees(d as any[])) }, [])

  const loadData = useCallback(async (start: string, end: string, empId: string) => {
    setLoading(true)
    try {
      const queryParams = {
        startDate: start,
        endDate: end,
        ...branchQuery(selectedBranch),
        ...(empId !== "all" ? { employeeId: empId } : {}),
      }
      const [data, statsData] = await Promise.all([
        api.attendance.list(queryParams),
        api.attendance.stats(queryParams)
      ])
      setRecords(data as AttendanceRecord[])
      setStats(statsData)
    } catch {
      setToast({ msg: "Lỗi tải dữ liệu", type: "error" })
    } finally {
      setLoading(false)
    }
  }, [selectedBranch])

  useEffect(() => { loadData(selectedDate, selectedDate, filterEmployee) }, [selectedDate, filterEmployee, loadData])

  useEffect(() => {
    if (filterEmployee !== "all" && !employees.some((e: Employee) => e.id === filterEmployee && inBranch(e, selectedBranch))) {
      setFilterEmployee("all")
    }
  }, [selectedBranch, employees, filterEmployee])

  const branchEmployees = useMemo(
    () => (employees as Employee[]).filter(e => inBranch(e, selectedBranch)),
    [employees, selectedBranch],
  )

  const shiftDate = (days: number) => {
    const s = new Date(selectedDate)
    s.setDate(s.getDate() + days)
    setSelectedDate(s.toISOString().split("T")[0])
  }

  const handleSaveEdit = async (id: string, data: Partial<AttendanceRecord>) => {
    try {
      const updated = await api.attendance.update(id, data) as AttendanceRecord
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r))
      const statsData = await api.attendance.stats({
        startDate: selectedDate,
        endDate: selectedDate,
        employeeId: filterEmployee !== "all" ? filterEmployee : undefined,
        ...branchQuery(selectedBranch),
      })
      setStats(statsData)
      setToast({ msg: "Cập nhật thành công", type: "success" })
    } catch (e: unknown) {
      setToast({ msg: e instanceof Error ? e.message : "Lỗi cập nhật", type: "error" })
    }
  }

  const handleAdd = async (data: any) => {
    try {
      await api.attendance.create(data)
      setToast({ msg: "Thêm bản ghi thành công", type: "success" })
      await loadData(selectedDate, selectedDate, filterEmployee)
    } catch (e: any) {
      setToast({ msg: e.message || "Lỗi thêm bản ghi", type: "error" })
    }
  }

  const employeeById = useMemo(
    () => new Map(branchEmployees.map(e => [e.id, e])),
    [branchEmployees],
  )

  const enrichedRecords = useMemo(
    () => records.map(r => {
      const emp = employeeById.get(r.employeeId)
      return emp ? enrichAttendanceRecord(r, emp) : r
    }),
    [records, employeeById],
  )

  const filtered = useMemo(() => enrichedRecords.filter(r => {
    const q = search.toLowerCase()
    return (!q || r.employeeName.toLowerCase().includes(q) || r.employeeId.toLowerCase().includes(q))
      && (filterDept === "all" || r.department === filterDept)
      && (filterStatus === "all" || r.status === filterStatus)
      && (filterType === "all"
        || (filterType === "intern" ? isInternRecord(r) : !isInternRecord(r)))
  }), [enrichedRecords, search, filterDept, filterStatus, filterType])

  const departments = useMemo(
    () => Array.from(new Set(branchEmployees.map(e => e.department).filter(Boolean))),
    [branchEmployees],
  )
  const isToday = selectedDate === todayISO

  const empFilterOptions = useMemo(() => [
    { value: "all", label: "Tất cả nhân viên" },
    ...branchEmployees.map(e => ({
      value: e.id,
      label: `${e.name} (${e.id})${isInternEmployee(e) ? ` · ${EMPLOYEE_KIND.intern.badge}` : ""}`,
    })),
  ], [branchEmployees])

  const deptFilterOptions = useMemo(() => {
    return [
      { value: "all", label: "Tất cả phòng ban" },
      ...departments.map(d => ({ value: d, label: d }))
    ]
  }, [departments])

  const statusFilterOptions = useMemo(() => [
    { value: "all", label: "Tất cả trạng thái" },
    ...Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label })),
  ], [])

  const typeFilterOptions = useMemo(() => [
    { value: "all", label: "Tất cả loại" },
    { value: "staff", label: EMPLOYEE_KIND.staff.filterLabel },
    { value: "intern", label: EMPLOYEE_KIND.intern.filterLabel },
  ], [])

  return (
    <div className="space-y-5">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {editRecord && <EditModal record={editRecord} onClose={() => setEditRecord(null)} onSave={handleSaveEdit} />}
      {showAdd && <AddModal date={selectedDate} employees={branchEmployees} onClose={() => setShowAdd(false)} onSave={handleAdd} />}

      <div className="flex flex-wrap items-center justify-between gap-3 w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => shiftDate(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500">
            <ChevronLeft size={15} />
          </button>
          <CustomDatePicker
            value={isoToVn(selectedDate)}
            onChange={val => setSelectedDate(vnToIso(val))}
            className="w-36 text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#C62828]/40 cursor-pointer"
          />
          <button onClick={() => shiftDate(1)} disabled={selectedDate >= todayISO}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 disabled:opacity-30">
            <ChevronRight size={15} />
          </button>
          {!isToday && (
            <button onClick={() => setSelectedDate(todayISO)} className="px-3 py-1.5 text-xs font-bold text-[#C62828] border border-[#C62828]/30 rounded-xl hover:bg-red-50">
              Hôm nay
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          <button onClick={() => loadData(selectedDate, selectedDate, filterEmployee)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50">
            <RefreshCw size={13} /> Làm mới
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[#C62828] text-white rounded-xl text-xs font-bold hover:bg-[#B71C1C]">
            <Plus size={13} /> Thêm
          </button>
          <button onClick={() => exportCSV(filtered, selectedDate)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50">
            <Download size={13} /> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Đúng giờ",  value: stats.onTime,  icon: UserCheck,    clr: "text-green-600",  bg: "bg-green-50",   border: "border-green-100" },
          { label: "Đi trễ",    value: stats.late,    icon: Clock,        clr: "text-orange-600", bg: "bg-orange-50",  border: "border-orange-100" },
          { label: "Vắng mặt",  value: stats.absent,  icon: UserX,        clr: "text-red-600",    bg: "bg-red-50",     border: "border-red-100" },
          { label: "Nghỉ phép", value: stats.leave,   icon: CalendarDays, clr: "text-violet-600", bg: "bg-violet-50",  border: "border-violet-100" },
        ].map(({ label, value, icon: Icon, clr, bg, border }) => (
          <div key={label} className={`bg-white rounded-2xl p-4 border ${border} shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow`}>
            <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0 border ${border}`}>
              <Icon size={20} className={clr} />
            </div>
            <div>
              <div className={`text-2xl font-black ${clr}`}>
                {loading ? <div className="w-8 h-6 bg-gray-100 rounded animate-pulse" /> : value}
              </div>
              <div className="text-xs text-gray-400 font-medium mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-black/5 shadow-sm">
        <div className="p-3 border-b border-gray-100 grid grid-cols-1 xl:grid-cols-[minmax(180px,1fr)_minmax(120px,0.7fr)_minmax(130px,0.8fr)_minmax(130px,0.8fr)_minmax(130px,0.8fr)_auto] gap-2 items-center w-full">
          <div className="relative min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên hoặc mã NV..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:border-[#C62828]/40 text-gray-700 font-bold" />
          </div>
          <CustomSelect value={filterType} onChange={v => setFilterType(v as "all" | "intern" | "staff")} options={typeFilterOptions} placeholder="Loại NV" className="w-full" />
          <CustomSelect value={filterEmployee} onChange={setFilterEmployee} options={empFilterOptions} placeholder="Nhân viên" className="w-full" searchable />
          <CustomSelect value={filterDept} onChange={setFilterDept} options={deptFilterOptions} placeholder="Phòng ban" className="w-full" />
          <CustomSelect value={filterStatus} onChange={setFilterStatus} options={statusFilterOptions} placeholder="Trạng thái" className="w-full" />
          <div className="flex items-center justify-end gap-2 shrink-0">
            {(search || filterEmployee !== "all" || filterDept !== "all" || filterStatus !== "all" || filterType !== "all") && (
              <button onClick={() => { setSearch(""); setFilterEmployee("all"); setFilterDept("all"); setFilterStatus("all"); setFilterType("all") }}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 font-bold whitespace-nowrap">
                <X size={12} /> Xóa lọc
              </button>
            )}
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{filtered.length}/{records.length}</span>
          </div>
        </div>
        <div className="overflow-x-auto rounded-b-3xl">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-400 font-semibold text-xs border-b border-gray-100">
                {["Mã NV", "Họ và tên", "Phòng ban", "Loại", "Check-in", "Check-out", "Tổng giờ", "Trạng thái", "Ghi chú", ""].map(h => (
                  <th key={h} className="py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <FileText size={32} className="opacity-30" />
                          <p className="text-sm font-medium">Không có bản ghi chấm công</p>
                          <p className="text-xs">Thử thay đổi bộ lọc hoặc thêm bản ghi mới</p>
                        </div>
                      </td>
                    </tr>
                  )
                  : filtered.map(r => {
                    const kind = employeeKindMeta(r.employeeStatus)
                    return (
                    <tr key={r.id} className="hover:bg-gray-50/40 transition-colors group">
                      <td className="py-3 px-4 font-mono text-xs text-gray-500">{r.employeeId}</td>
                      <td className="py-3 px-4 font-bold text-gray-800 whitespace-nowrap">{r.employeeName}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{r.department}</td>
                      <td className="py-3 px-4 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${kind.badgeClass}`}>
                          {kind.badge}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-700">
                        {isInternRecord(r) ? (
                          <div className="space-y-0.5 text-[10px]">
                            <div><span className="text-gray-400">{INTERN_SESSION.am.short}:</span> {formatCheckTime(r.checkInAm)}</div>
                            <div><span className="text-gray-400">{INTERN_SESSION.pm.short}:</span> {formatCheckTime(r.checkInPm)}</div>
                          </div>
                        ) : (
                          <span className={r.status === "late" ? "text-orange-600 font-bold" : "font-bold"}>{formatCheckTime(r.checkIn)}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-500">
                        {isInternRecord(r) ? (
                          <div className="space-y-0.5 text-[10px]">
                            <div><span className="text-gray-400">{INTERN_SESSION.am.short}:</span> {formatCheckTime(r.checkOutAm)}</div>
                            <div><span className="text-gray-400">{INTERN_SESSION.pm.short}:</span> {formatCheckTime(r.checkOutPm)}</div>
                          </div>
                        ) : (
                          formatCheckTime(r.checkOut)
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-gray-700">
                        {isInternRecord(r)
                          ? formatDurationHms(r.workingHours ?? "--")
                          : formatDurationHms(r.workingHours ?? calcHours(r.checkIn, r.checkOut))}
                      </td>
                      <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                      <td className="py-3 px-4 text-xs text-gray-500 max-w-[160px] truncate" title={r.note}>{formatAttendanceNote(r.note)}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => setEditRecord(r)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[#C62828] transition-all">
                          <Edit2 size={13} />
                        </button>
                      </td>
                    </tr>
                  )})
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MonthlyTab({ selectedBranch }: { selectedBranch: string }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDept, setFilterDept] = useState("all")
  const [hoverCell, setHoverCell] = useState<{ empId: string; date: string; rowId: string } | null>(null)
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)

  const daysInMonth = new Date(year, month, 0).getDate()
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [empData, attData] = await Promise.all([
          api.employees.list(),
          api.attendance.list(branchQuery(selectedBranch)),
        ])
        setAllEmployees(empData as Employee[])
        const monthStr = String(month).padStart(2, "0")
        const branchEmpIds = new Set(
          (empData as Employee[]).filter(e => inBranch(e, selectedBranch)).map(e => e.id),
        )
        const filtered = (attData as AttendanceRecord[]).filter(r => {
          if (!r.date) return false
          const [y, m] = r.date.split("-")
          if (y !== String(year) || m !== monthStr) return false
          return selectedBranch === "all" || branchEmpIds.has(r.employeeId)
        })
        setRecords(filtered)
      } catch {
        setToast({ msg: "Lỗi tải dữ liệu tháng", type: "error" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [year, month, selectedBranch])

  const employees = useMemo(() =>
    allEmployees
      .filter(e => inBranch(e, selectedBranch))
      .filter(e => filterDept === "all" || e.department === filterDept)
      .sort((a, b) => a.name.localeCompare(b.name, "vi")),
  [allEmployees, filterDept, selectedBranch])

  const departments = useMemo(() =>
    Array.from(new Set(
      allEmployees.filter(e => inBranch(e, selectedBranch)).map(e => e.department).filter(Boolean),
    )).sort((a, b) => a.localeCompare(b, "vi")),
  [allEmployees, selectedBranch])

  const lookup = useMemo(() => {
    const m = new Map<string, AttendanceRecord>()
    records.forEach(r => m.set(`${r.employeeId}_${r.date}`, r))
    return m
  }, [records])

  const shiftMonth = (d: number) => {
    let m = month + d, y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    setMonth(m); setYear(y)
  }

  const handleSaveEdit = async (id: string, data: Partial<AttendanceRecord>) => {
    try {
      await api.attendance.update(id, data)
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
      setToast({ msg: "Cập nhật thành công", type: "success" })
    } catch {
      setToast({ msg: "Lỗi cập nhật", type: "error" })
    }
  }

  const deptFilterOptions = useMemo(() => [
    { value: "all", label: "Tất cả phòng ban" },
    ...departments.map(d => ({ value: d, label: d })),
  ], [departments])

  const renderTimeCell = (
    emp: Employee,
    d: number,
    row: MonthTimeRow,
    rowBg: string,
  ) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    const raw = lookup.get(`${emp.id}_${dateStr}`)
    const rec = raw ? enrichAttendanceRecord(raw, emp) : undefined
    const dateObj = new Date(year, month - 1, d)
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6
    const isToday = dateObj.toDateString() === new Date().toDateString()
    const isHov = hoverCell?.empId === emp.id && hoverCell?.date === dateStr && hoverCell?.rowId === row.id
    const baseTd = `border-b border-r border-gray-100 p-0 min-w-[60px] ${isWeekend ? "bg-gray-100/50" : ""} ${isToday ? "ring-1 ring-inset ring-[#C62828]/20" : ""}`

    if (!rec) {
      return (
        <td key={`${d}-${row.id}`} className={baseTd} style={{ height: MONTH_SUB_ROW_H }}>
          <div className={`w-full h-full flex items-center justify-center ${rowBg}`}>
            <span className="text-gray-200 text-sm select-none">·</span>
          </div>
        </td>
      )
    }

    const heat = heatForStatus(rec.status)
    const time = monthRowTime(rec, row)
    const tipSession = sessionLabel(row.session)
    const kindLabel = row.kind === "in" ? "Vào" : "Ra"
    const label = STATUS_MAP[rec.status as AttStatus]?.label ?? rec.status
    const tip = [
      tipSession && `${tipSession} · ${kindLabel}`,
      !tipSession && kindLabel,
      time || label,
      rec.note && formatAttendanceNote(rec.note),
    ].filter(Boolean).join(" · ")

    const inStyle = { borderColor: "#10b981", bg: "#ecfdf5", text: "#047857" }
    const outStyle = { borderColor: "#64748b", bg: "#f8fafc", text: "#475569" }
    const style = row.kind === "in" ? inStyle : outStyle

    return (
      <td key={`${d}-${row.id}`} className={baseTd} style={{ height: MONTH_SUB_ROW_H }}>
        <button
          type="button"
          title={tip}
          onClick={() => setEditRecord(rec)}
          onMouseEnter={() => setHoverCell({ empId: emp.id, date: dateStr, rowId: row.id })}
          onMouseLeave={() => setHoverCell(null)}
          className={`w-full h-full flex items-center justify-center transition-all cursor-pointer select-none border-l-[3px] ${isHov ? "ring-2 ring-inset ring-[#C62828]/30 z-[1] relative" : ""}`}
          style={{
            borderLeftColor: time ? style.borderColor : heat.text,
            background: time ? style.bg : heat.bg + "35",
          }}>
          {time ? (
            <span className="text-xs font-bold tabular-nums px-1" style={{ color: style.text }}>{time}</span>
          ) : row.kind === "in" && !row.session && rec.status === "absent" ? (
            <span className="text-[10px] font-bold text-red-500">Vắng</span>
          ) : row.kind === "in" && !row.session && rec.status === "leave" ? (
            <span className="text-[10px] font-bold text-violet-600">Phép</span>
          ) : row.kind === "in" && row.session === "am" && (rec.statusAm === "absent" || rec.status === "absent") ? (
            <span className="text-[10px] font-bold text-red-400">Vắng</span>
          ) : row.kind === "in" && row.session === "pm" && (rec.statusPm === "absent" || rec.status === "absent") ? (
            <span className="text-[10px] font-bold text-red-400">Vắng</span>
          ) : (
            <span className="text-gray-300 text-sm">—</span>
          )}
        </button>
      </td>
    )
  }

  return (
    <div className="space-y-5">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {editRecord && <EditModal record={editRecord} onClose={() => setEditRecord(null)} onSave={handleSaveEdit} />}

      <div className="flex items-center justify-between flex-wrap gap-3 w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500">
            <ChevronLeft size={15} />
          </button>
          <span className="font-black text-[#C62828] text-base min-w-[140px] text-center">Tháng {month}/{year}</span>
          <button onClick={() => shiftMonth(1)} disabled={year === now.getFullYear() && month >= now.getMonth() + 1}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 disabled:opacity-30">
            <ChevronRight size={15} />
          </button>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end min-w-[200px]">
          <CustomSelect value={filterDept} onChange={setFilterDept} options={deptFilterOptions} placeholder="Phòng ban" className="w-full max-w-[200px]" />
          <button onClick={() => exportCSV(records, `${year}-${month}`)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 whitespace-nowrap">
            <Download size={13} /> CSV
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap w-full">
        {Object.entries(STATUS_MAP).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 bg-white border border-gray-100 rounded-full px-2.5 py-1">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: HEAT_COLOR[k as AttStatus] }} />
            {v.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1 font-semibold">Vào</span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 font-semibold">Ra</span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-purple-700 bg-purple-50 border border-purple-100 rounded-full px-2.5 py-1 font-semibold">
          {EMPLOYEE_KIND.intern.badge}: {internLegendText()}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Đang tải...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <CalendarDays size={32} className="opacity-30" />
            <p className="text-sm">Không có nhân viên phù hợp bộ lọc</p>
          </div>
        ) : (
          <div className="overflow-auto w-full" style={{ maxHeight: "70vh" }}>
            <table className="w-full min-w-max border-collapse text-xs">
              <thead className="sticky top-0 z-40">
                <tr className="bg-[#C62828] text-white">
                  <th className="sticky left-0 z-30 bg-[#C62828] border-b border-r border-white/15 py-3 px-4 text-left font-bold min-w-[160px] shadow-[4px_0_8px_-2px_rgba(0,0,0,0.12)]">
                    Nhân viên
                  </th>
                  <th className="bg-[#C62828] border-b border-r border-white/15 py-3 px-2 text-center font-bold min-w-[56px]">
                    Loại
                  </th>
                  {dayNumbers.map(d => {
                    const dateObj = new Date(year, month - 1, d)
                    const dow = dateObj.getDay()
                    const isWeekend = dow === 0 || dow === 6
                    const isToday = dateObj.toDateString() === new Date().toDateString()
                    return (
                      <th key={d}
                        className={`border-b border-white/15 py-2 px-0.5 text-center font-semibold min-w-[60px] ${isToday ? "bg-white/15" : ""}`}>
                        <div className={`text-sm leading-none ${isToday ? "font-black" : ""}`}>{d}</div>
                        <div className={`text-[10px] mt-0.5 font-medium ${isWeekend ? "text-white/50" : "text-white/80"}`}>
                          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"][dow]}
                        </div>
                      </th>
                    )
                  })}
                  <th className="sticky right-0 z-20 bg-[#C62828] border-b border-l border-white/15 py-3 px-3 font-bold text-center min-w-[80px] shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.12)]">
                    Tổng
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, empIdx) => {
                  const timeRows = monthRowsForEmployee(emp)
                  const empRecords = dayNumbers.map(d => {
                    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
                    return lookup.get(`${emp.id}_${dateStr}`)
                  })
                  const present = empRecords.filter(r => r && ["on-time", "late", "early", "late_early"].includes(r.status)).length
                  const late    = empRecords.filter(r => r && ["late", "late_early"].includes(r.status)).length
                  const absent  = empRecords.filter(r => r && r.status === "absent").length
                  const rowBg = empIdx % 2 === 0 ? "bg-white" : "bg-[#fafafa]"
                  const stickyBg = empIdx % 2 === 0 ? "bg-white" : "bg-[#fafafa]"
                  const blockH = MONTH_SUB_ROW_H * timeRows.length
                  const kindMeta = employeeKindMeta(emp.status)
                  const isIntern = isInternEmployee(emp)

                  return (
                    <React.Fragment key={emp.id}>
                      {timeRows.map((timeRow, rowIdx) => (
                        <tr key={`${emp.id}-${timeRow.id}`} className={`group ${rowBg}`}>
                          {rowIdx === 0 && (
                            <td rowSpan={timeRows.length}
                              className={`sticky left-0 z-10 border-b border-r border-gray-100 px-4 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)] group-hover:bg-red-50/40 align-middle ${stickyBg}`}
                              style={{ minWidth: 160, height: blockH }}>
                              <div className="flex items-start gap-2 py-2">
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-gray-800 whitespace-nowrap text-sm leading-tight">{emp.name}</div>
                                  <div className="text-[11px] text-gray-400 font-mono">{emp.id}</div>
                                  {emp.department && <div className="text-[10px] text-gray-400 mt-1 truncate max-w-[120px]">{emp.department}</div>}
                                </div>
                                <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-black ${kindMeta.badgeClass}`}>
                                  {kindMeta.badge}
                                </span>
                              </div>
                            </td>
                          )}
                          <td className={`border-b border-r border-gray-100 px-1 text-center ${stickyBg} ${timeRow.kind === "in" ? "group-hover:bg-emerald-50/60" : "group-hover:bg-slate-50"}`}
                            style={{ height: MONTH_SUB_ROW_H }}>
                            <span className={`inline-flex items-center justify-center w-full h-full text-[10px] font-black rounded-md mx-0.5 ${timeRow.labelClass}`}>
                              {timeRow.label}
                            </span>
                          </td>
                          {dayNumbers.map(d => renderTimeCell(emp, d, timeRow, rowBg))}
                          {rowIdx === 0 && (
                            <td rowSpan={timeRows.length}
                              className={`sticky right-0 z-10 border-b border-l border-gray-100 py-3 px-3 text-center shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] group-hover:bg-red-50/40 align-middle ${stickyBg}`}
                              style={{ height: blockH }}>
                              <div className="text-sm font-bold text-emerald-700 tabular-nums">{present}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">{isIntern ? "buổi/ngày" : "ngày công"}</div>
                              <div className="flex flex-col items-center gap-0.5 mt-2">
                                {late > 0 && <span className="text-[10px] font-semibold text-orange-600">{late} trễ</span>}
                                {absent > 0 && <span className="text-[10px] font-semibold text-red-500">{absent} vắng</span>}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatsTab({ selectedBranch }: { selectedBranch: string }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.attendance.list(branchQuery(selectedBranch)).then(d => {
      setRecords(d as AttendanceRecord[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [selectedBranch])

  const totals = useMemo(() => ({
    onTime: records.filter(r => r.status === "on-time").length,
    late:   records.filter(r => r.status === "late").length,
    absent: records.filter(r => r.status === "absent").length,
    leave:  records.filter(r => r.status === "leave").length,
    total:  records.length
  }), [records])

  const deptStats = useMemo(() => {
    const map = new Map<string, { dept: string; onTime: number; late: number; absent: number; leave: number; total: number }>()
    records.forEach(r => {
      if (!r.department) return
      const e = map.get(r.department) ?? { dept: r.department, onTime: 0, late: 0, absent: 0, leave: 0, total: 0 }
      e.total++
      if (r.status === "on-time") e.onTime++
      if (r.status === "late")    e.late++
      if (r.status === "absent")  e.absent++
      if (r.status === "leave")   e.leave++
      map.set(r.department, e)
    })
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [records])

  const lateRanking = useMemo(() => {
    const map = new Map<string, { name: string; dept: string; count: number }>()
    records.filter(r => r.status === "late").forEach(r => {
      const e = map.get(r.employeeId) ?? { name: r.employeeName, dept: r.department, count: 0 }
      e.count++
      map.set(r.employeeId, e)
    })
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 10)
  }, [records])

  const dailyTrend = useMemo(() => {
    const map = new Map<string, { date: string; onTime: number; late: number; absent: number; total: number }>()
    records.forEach(r => {
      if (!r.date) return
      const e = map.get(r.date) ?? { date: r.date, onTime: 0, late: 0, absent: 0, total: 0 }
      e.total++
      if (r.status === "on-time") e.onTime++
      if (r.status === "late")    e.late++
      if (r.status === "absent")  e.absent++
      map.set(r.date, e)
    })
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-10)
  }, [records])

  const pct = (v: number) => totals.total > 0 ? Math.round(v / totals.total * 100) : 0
  const maxLate = lateRanking[0]?.count || 1

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
      <Loader2 size={24} className="animate-spin" />
      <span>Đang tải thống kê...</span>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Tổng bản ghi", value: totals.total,  clr: "text-gray-800",    bg: "bg-gray-50",   bar: "bg-gray-400" },
          { label: "Đúng giờ",    value: totals.onTime, clr: "text-green-700",  bg: "bg-green-50",  bar: "bg-green-500" },
          { label: "Đi trễ",      value: totals.late,   clr: "text-orange-700", bg: "bg-orange-50", bar: "bg-orange-500" },
          { label: "Vắng mặt",    value: totals.absent, clr: "text-red-700",    bg: "bg-red-50",    bar: "bg-red-500" },
        ].map(({ label, value, clr, bg, bar }) => (
          <div key={label} className={`${bg} rounded-2xl p-5 border border-black/5`}>
            <div className={`text-3xl font-black ${clr}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-1 font-semibold">{label}</div>
            <div className="mt-3 h-1.5 bg-white/60 rounded-full overflow-hidden">
              <div className={`h-full ${bar} rounded-full transition-all`} style={{ width: `${pct(value)}%` }} />
            </div>
            <div className="text-[10px] text-gray-400 mt-1">{pct(value)}%</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <BarChart3 size={15} className="text-[#C62828]" />
            <h3 className="font-black text-gray-800 text-sm">Theo phòng ban</h3>
          </div>
          {deptStats.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">Chưa có dữ liệu</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {deptStats.map(d => (
                <div key={d.dept} className="px-5 py-3.5 hover:bg-gray-50/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-800">{d.dept}</span>
                    <span className="text-xs text-gray-400 font-mono">{d.total} người</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden flex bg-gray-100">
                    <div className="bg-green-500 transition-all" style={{ width: `${d.total > 0 ? d.onTime / d.total * 100 : 0}%` }} />
                    <div className="bg-orange-400 transition-all" style={{ width: `${d.total > 0 ? d.late / d.total * 100 : 0}%` }} />
                    <div className="bg-red-500 transition-all"    style={{ width: `${d.total > 0 ? d.absent / d.total * 100 : 0}%` }} />
                    <div className="bg-violet-400 transition-all" style={{ width: `${d.total > 0 ? d.leave / d.total * 100 : 0}%` }} />
                  </div>
                  <div className="flex gap-3 mt-1.5 text-[10px] font-semibold">
                    <span className="text-green-700">✓ {d.onTime}</span>
                    <span className="text-orange-600">⚠ {d.late}</span>
                    <span className="text-red-600">✗ {d.absent}</span>
                    <span className="text-violet-600">● {d.leave}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <AlertTriangle size={15} className="text-orange-500" />
            <h3 className="font-black text-gray-800 text-sm">Top nhân viên đi trễ nhiều nhất</h3>
          </div>
          {lateRanking.length === 0 ? (
            <div className="p-10 text-center">
              <Check size={32} className="text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Tuyệt vời! Không có vi phạm</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {lateRanking.map((item, idx) => (
                <div key={item.name} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/40 transition-colors">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${idx === 0 ? "bg-orange-100 text-orange-700" : idx === 1 ? "bg-amber-100 text-amber-700" : idx === 2 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-800 truncate">{item.name}</span>
                      <span className="text-xs font-black text-orange-600 ml-2 flex-shrink-0">{item.count} lần</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all"
                        style={{ width: `${(item.count / maxLate) * 100}%` }} />
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{item.dept}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <TrendingUp size={15} className="text-[#C62828]" />
          <h3 className="font-black text-gray-800 text-sm">Nhật ký 10 ngày gần nhất</h3>
        </div>
        {dailyTrend.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chưa có dữ liệu</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-xs font-semibold text-gray-400 border-b border-gray-100">
                  <th className="py-3 px-5">Ngày</th>
                  <th className="py-3 px-4 text-center">Đúng giờ</th>
                  <th className="py-3 px-4 text-center">Đi trễ</th>
                  <th className="py-3 px-4 text-center">Vắng mặt</th>
                  <th className="py-3 px-4 text-center">Tổng</th>
                  <th className="py-3 px-5">Tỷ lệ đúng giờ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dailyTrend.map(d => {
                  const rate = d.total > 0 ? Math.round(d.onTime / d.total * 100) : 0
                  return (
                    <tr key={d.date} className="hover:bg-gray-50/40 transition-colors">
                      <td className="py-3 px-5 font-mono font-bold text-gray-700 text-xs">{fmtDate(d.date)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-6 bg-green-100 text-green-700 rounded-lg text-xs font-black">{d.onTime}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-6 bg-orange-100 text-orange-700 rounded-lg text-xs font-black">{d.late}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-6 bg-red-100 text-red-700 rounded-lg text-xs font-black">{d.absent}</span>
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-bold text-gray-600">{d.total}</td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${rate}%` }} />
                          </div>
                          <span className={`text-xs font-black w-10 text-right ${rate >= 80 ? "text-green-600" : rate >= 60 ? "text-orange-600" : "text-red-600"}`}>
                            {rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export function AttendanceManagement({ selectedBranch = "all" }: { selectedBranch?: string }) {
  const [tab, setTab] = useState<"daily" | "monthly" | "stats">("daily")

  const TABS = [
    { id: "daily"   as const, label: "Hôm nay",       icon: CalendarDays },
    { id: "monthly" as const, label: "Lịch sử tháng", icon: Calendar },
    { id: "stats"   as const, label: "Thống kê",      icon: BarChart3 },
  ]

  return (
    <div className="space-y-5">
      <div className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px] p-5 rounded-2xl text-white flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div className="flex items-center">
          <div className="flex gap-1.5 items-center mr-4 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white/30 animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/60 animate-pulse delay-75" />
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse delay-150" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Quản lý chấm công</h2>
            <p className="text-xs text-white/75 mt-0.5">Theo dõi và quản lý chấm công nhân sự toàn công ty</p>
          </div>
        </div>
      </div>

      <div className="flex w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-1 gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === id ? "bg-[#C62828] text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {tab === "daily"   && <DailyTab selectedBranch={selectedBranch} />}
      {tab === "monthly" && <MonthlyTab selectedBranch={selectedBranch} />}
      {tab === "stats"   && <StatsTab selectedBranch={selectedBranch} />}
    </div>
  )
}
