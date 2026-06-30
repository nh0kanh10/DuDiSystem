import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
  Search, Download, Edit2, UserCheck, Clock, UserX, CalendarDays,
  BarChart3, X, Check, ChevronLeft, ChevronRight, Plus, Loader2,
  FileText, TrendingUp, AlertTriangle, RefreshCw, Calendar, Save
} from "lucide-react"
import { api } from "@/lib/api"
import { AttendanceRecord } from "../../types"

// ─── Hằng màu sắc trạng thái ───────────────────────────────────────────────
const STATUS_MAP = {
  "on-time": { label: "Đúng giờ",   bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500",  hex: "#16a34a" },
  "late":    { label: "Đi trễ",     bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500", hex: "#ea580c" },
  "absent":  { label: "Vắng mặt",   bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500",    hex: "#dc2626" },
  "leave":   { label: "Nghỉ phép",  bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500", hex: "#7c3aed" },
} as const

type AttStatus = keyof typeof STATUS_MAP

// ─── Helper: tính số phút làm ──────────────────────────────────────────────
function calcHours(ci: string, co: string): string {
  if (!ci || !co || ci === "--" || co === "--") return "--"
  const [h1, m1] = ci.split(":").map(Number)
  const [h2, m2] = co.split(":").map(Number)
  const total = (h2 * 60 + m2) - (h1 * 60 + m1)
  if (total <= 0) return "--"
  const h = Math.floor(total / 60)
  const m = total % 60
  return m > 0 ? `${h}g${m}p` : `${h}g`
}

// ─── Helper: format ngày yyyy-mm-dd → dd/mm/yyyy ───────────────────────────
function fmtDate(iso: string) {
  if (!iso) return "--"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

// ─── Helper: xuất CSV ──────────────────────────────────────────────────────
function exportCSV(rows: AttendanceRecord[], dateLabel: string) {
  const header = ["Mã NV", "Họ tên", "Phòng ban", "Ngày", "Check-in", "Check-out", "Tổng giờ", "Trạng thái", "Ghi chú"]
  const lines = rows.map(r => [
    r.employeeId, r.employeeName, r.department, fmtDate(r.date),
    r.checkIn, r.checkOut, calcHours(r.checkIn, r.checkOut),
    STATUS_MAP[r.status as AttStatus]?.label ?? r.status, r.note
  ].join(","))
  const csv = [header.join(","), ...lines].join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = `chamcong_${dateLabel}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// ─── StatusBadge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status as AttStatus] ?? { label: status, bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

// ─── Toast đơn giản ──────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [])
  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-sm animate-in slide-in-from-right duration-300 ${type === "success" ? "bg-gray-900/95 border-white/10 text-white" : "bg-red-900/95 border-red-500/20 text-white"}`}>
      <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${type === "success" ? "bg-emerald-400" : "bg-red-400"}`} />
      <span className="text-sm font-semibold">{msg}</span>
    </div>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="py-3.5 px-4"><div className="h-3.5 bg-gray-100 rounded-full" style={{ width: `${60 + i * 8}%` }} /></td>
      ))}
    </tr>
  )
}

// ─── Edit Modal ──────────────────────────────────────────────────────────
function EditModal({
  record, onClose, onSave
}: {
  record: AttendanceRecord
  onClose: () => void
  onSave: (id: string, data: Partial<AttendanceRecord>) => Promise<void>
}) {
  const [form, setForm] = useState({
    checkIn: record.checkIn === "--" ? "" : record.checkIn,
    checkOut: record.checkOut === "--" ? "" : record.checkOut,
    status: record.status,
    note: record.note ?? ""
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(record.id, {
      checkIn: form.checkIn || "--",
      checkOut: form.checkOut || "--",
      status: form.status as AttStatus,
      note: form.note
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#C62828] px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-black text-base">{record.employeeName}</p>
            <p className="text-white/70 text-xs mt-0.5">{record.employeeId} · {fmtDate(record.date)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Giờ Check-in</label>
              <input type="time" value={form.checkIn} onChange={e => setForm(p => ({ ...p, checkIn: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-gray-800 focus:outline-none focus:border-[#C62828]/50 focus:ring-2 focus:ring-[#C62828]/10 transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Giờ Check-out</label>
              <input type="time" value={form.checkOut} onChange={e => setForm(p => ({ ...p, checkOut: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-gray-800 focus:outline-none focus:border-[#C62828]/50 focus:ring-2 focus:ring-[#C62828]/10 transition-all" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Trạng thái</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <button key={k} onClick={() => setForm(p => ({ ...p, status: k as AttStatus }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${form.status === k ? `border-current ${v.bg} ${v.text}` : "border-gray-100 text-gray-500 hover:border-gray-200 bg-gray-50"}`}>
                  <span className={`w-2 h-2 rounded-full ${v.dot}`} />
                  {v.label}
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

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            Hủy
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Record Modal ─────────────────────────────────────────────────────
function AddModal({
  date, employees, onClose, onSave
}: {
  date: string
  employees: any[]
  onClose: () => void
  onSave: (data: any) => Promise<void>
}) {
  const [form, setForm] = useState({ employeeId: "", checkIn: "08:00", checkOut: "17:00", status: "on-time" as AttStatus, note: "" })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.employeeId) return
    setSaving(true)
    await onSave({ ...form, date })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
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
            <select value={form.employeeId} onChange={e => setForm(p => ({ ...p, employeeId: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#C62828]/50 focus:ring-2 focus:ring-[#C62828]/10">
              <option value="">-- Chọn nhân viên --</option>
              {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Check-in</label>
              <input type="time" value={form.checkIn} onChange={e => setForm(p => ({ ...p, checkIn: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-[#C62828]/50 focus:ring-2 focus:ring-[#C62828]/10" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Check-out</label>
              <input type="time" value={form.checkOut} onChange={e => setForm(p => ({ ...p, checkOut: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-[#C62828]/50 focus:ring-2 focus:ring-[#C62828]/10" />
            </div>
          </div>
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

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Chấm công theo ngày
// ══════════════════════════════════════════════════════════════════════════════
function DailyTab() {
  // Hôm nay theo ISO (yyyy-mm-dd)
  const todayISO = new Date().toISOString().split("T")[0]
  const [selectedDate, setSelectedDate] = useState(todayISO)
  const [search, setSearch] = useState("")
  const [filterDept, setFilterDept] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState({ onTime: 0, late: 0, absent: 0, leave: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)

  // Tải danh sách nhân viên (dùng cho modal thêm)
  useEffect(() => {
    api.employees.list().then(d => setEmployees(d as any[]))
  }, [])

  // Tải chấm công theo ngày
  const loadDay = useCallback(async (date: string) => {
    setLoading(true)
    try {
      const [data, statsData] = await Promise.all([
        api.attendance.list({ date }),
        api.attendance.stats(date)
      ])
      setRecords(data as AttendanceRecord[])
      setStats(statsData)
    } catch {
      setToast({ msg: "Lỗi tải dữ liệu", type: "error" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDay(selectedDate) }, [selectedDate])

  // Chuyển ngày
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    setSelectedDate(d.toISOString().split("T")[0])
  }

  // Lưu edit
  const handleSaveEdit = async (id: string, data: Partial<AttendanceRecord>) => {
    try {
      await api.attendance.update(id, data)
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
      // Cập nhật stats
      const updated = records.map(r => r.id === id ? { ...r, ...data } : r)
      const onTime = updated.filter(r => r.status === "on-time").length
      const late = updated.filter(r => r.status === "late").length
      const absent = updated.filter(r => r.status === "absent").length
      const leave = updated.filter(r => r.status === "leave").length
      setStats({ onTime, late, absent, leave, total: updated.length })
      setToast({ msg: "Cập nhật thành công", type: "success" })
    } catch {
      setToast({ msg: "Lỗi cập nhật", type: "error" })
    }
  }

  // Thêm bản ghi
  const handleAdd = async (data: any) => {
    try {
      const created = await api.attendance.create(data) as AttendanceRecord
      setRecords(prev => [...prev, created])
      setToast({ msg: "Thêm bản ghi thành công", type: "success" })
      await loadDay(selectedDate)
    } catch (e: any) {
      setToast({ msg: e.message || "Lỗi thêm bản ghi", type: "error" })
    }
  }

  // Filter client-side
  const filtered = useMemo(() => records.filter(r => {
    const q = search.toLowerCase()
    const matchQ = !q || r.employeeName.toLowerCase().includes(q) || r.employeeId.toLowerCase().includes(q)
    const matchDept = filterDept === "all" || r.department === filterDept
    const matchStatus = filterStatus === "all" || r.status === filterStatus
    return matchQ && matchDept && matchStatus
  }), [records, search, filterDept, filterStatus])

  const departments = useMemo(() => Array.from(new Set(records.map(r => r.department).filter(Boolean))), [records])

  const isToday = selectedDate === todayISO

  return (
    <div className="space-y-5">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {editRecord && <EditModal record={editRecord} onClose={() => setEditRecord(null)} onSave={handleSaveEdit} />}
      {showAdd && <AddModal date={selectedDate} employees={employees} onClose={() => setShowAdd(false)} onSave={handleAdd} />}

      {/* Date Navigator */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftDate(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
            <ChevronLeft size={15} />
          </button>
          <div className="relative">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:border-[#C62828]/40 cursor-pointer bg-white" />
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={() => shiftDate(1)} disabled={isToday}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors disabled:opacity-30">
            <ChevronRight size={15} />
          </button>
          {!isToday && (
            <button onClick={() => setSelectedDate(todayISO)} className="px-3 py-1.5 text-xs font-bold text-[#C62828] border border-[#C62828]/30 rounded-xl hover:bg-red-50 transition-colors">
              Hôm nay
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadDay(selectedDate)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw size={13} /> Làm mới
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[#C62828] text-white rounded-xl text-xs font-bold hover:bg-[#B71C1C] transition-colors">
            <Plus size={13} /> Thêm bản ghi
          </button>
          <button onClick={() => exportCSV(filtered, selectedDate)} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors">
            <Download size={13} /> Xuất CSV
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Đúng giờ",  value: stats.onTime,  icon: UserCheck,     clr: "text-green-600",  bg: "bg-green-50",   border: "border-green-100" },
          { label: "Đi trễ",    value: stats.late,    icon: Clock,         clr: "text-orange-600", bg: "bg-orange-50",  border: "border-orange-100" },
          { label: "Vắng mặt",  value: stats.absent,  icon: UserX,         clr: "text-red-600",    bg: "bg-red-50",     border: "border-red-100" },
          { label: "Nghỉ phép", value: stats.leave,   icon: CalendarDays,  clr: "text-violet-600", bg: "bg-violet-50",  border: "border-violet-100" },
        ].map(({ label, value, icon: Icon, clr, bg, border }) => (
          <div key={label} className={`bg-white rounded-2xl p-4 border ${border} shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow`}>
            <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0 border ${border}`}>
              <Icon size={20} className={clr} />
            </div>
            <div>
              <div className={`text-2xl font-black ${clr}`}>{loading ? <div className="w-8 h-6 bg-gray-100 rounded animate-pulse" /> : value}</div>
              <div className="text-xs text-gray-400 font-medium mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-gray-50 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm tên hoặc mã NV..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:border-[#C62828]/40 text-gray-700" />
          </div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 bg-white cursor-pointer min-w-[140px]">
            <option value="all">Tất cả phòng ban</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 bg-white cursor-pointer min-w-[140px]">
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {(search || filterDept !== "all" || filterStatus !== "all") && (
            <button onClick={() => { setSearch(""); setFilterDept("all"); setFilterStatus("all") }}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <X size={12} /> Xóa lọc
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400 font-medium">{filtered.length} / {records.length} bản ghi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-400 font-semibold text-xs border-b border-gray-100">
                {["Mã NV", "Họ và tên", "Phòng ban", "Check-in", "Check-out", "Tổng giờ", "Trạng thái", "Ghi chú", ""].map(h => (
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
                      <td colSpan={9} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <FileText size={32} className="opacity-30" />
                          <p className="text-sm font-medium">Không có bản ghi chấm công</p>
                          <p className="text-xs">Thử thay đổi bộ lọc hoặc thêm bản ghi mới</p>
                        </div>
                      </td>
                    </tr>
                  )
                  : filtered.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/40 transition-colors group">
                      <td className="py-3 px-4 font-mono text-xs text-gray-500">{r.employeeId}</td>
                      <td className="py-3 px-4 font-bold text-gray-800 whitespace-nowrap">{r.employeeName}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{r.department}</td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-800">
                        <span className={r.status === "late" ? "text-orange-600" : ""}>{r.checkIn}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-400">{r.checkOut}</td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-700">{calcHours(r.checkIn, r.checkOut)}</td>
                      <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                      <td className="py-3 px-4 text-xs text-gray-400 max-w-[120px] truncate" title={r.note}>{r.note || "--"}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => setEditRecord(r)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[#C62828] transition-all">
                          <Edit2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Lịch sử tháng (Heatmap)
// ══════════════════════════════════════════════════════════════════════════════

// Màu ô heatmap theo trạng thái
const HEAT_COLOR: Record<AttStatus, string> = {
  "on-time": "#bbf7d0",
  "late":    "#fed7aa",
  "absent":  "#fecaca",
  "leave":   "#ddd6fe",
}
const HEAT_TEXT: Record<AttStatus, string> = {
  "on-time": "#15803d",
  "late":    "#c2410c",
  "absent":  "#b91c1c",
  "leave":   "#6d28d9",
}

function MonthlyTab() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-12
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDept, setFilterDept] = useState("all")
  const [hoverCell, setHoverCell] = useState<{ empId: string; date: string } | null>(null)
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)

  // Số ngày trong tháng
  const daysInMonth = new Date(year, month, 0).getDate()
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Load dữ liệu tháng — gọi từng ngày không hiệu quả, ta load tất cả rồi filter client
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // Load tất cả records rồi filter theo tháng/năm client-side
        const data = await api.attendance.list()
        const monthStr = String(month).padStart(2, "0")
        const filtered = (data as AttendanceRecord[]).filter(r => {
          if (!r.date) return false
          const [y, m] = r.date.split("-")
          return y === String(year) && m === monthStr
        })
        setRecords(filtered)
      } catch {
        setToast({ msg: "Lỗi tải dữ liệu tháng", type: "error" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [year, month])

  // Nhóm records theo nhân viên
  const employees = useMemo(() => {
    const map = new Map<string, { id: string; name: string; dept: string }>()
    records.forEach(r => {
      if (!map.has(r.employeeId)) map.set(r.employeeId, { id: r.employeeId, name: r.employeeName, dept: r.department })
    })
    return Array.from(map.values()).filter(e => filterDept === "all" || e.dept === filterDept)
  }, [records, filterDept])

  const departments = useMemo(() => Array.from(new Set(records.map(r => r.department).filter(Boolean))), [records])

  // Lookup nhanh: employeeId + date → record
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

  return (
    <div className="space-y-5">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {editRecord && <EditModal record={editRecord} onClose={() => setEditRecord(null)} onSave={handleSaveEdit} />}

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500">
            <ChevronLeft size={15} />
          </button>
          <span className="font-black text-gray-800 text-base min-w-[130px] text-center">
            Tháng {month}/{year}
          </span>
          <button onClick={() => shiftMonth(1)} disabled={year === now.getFullYear() && month >= now.getMonth() + 1}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 disabled:opacity-30">
            <ChevronRight size={15} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 bg-white">
            <option value="all">Tất cả phòng ban</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={() => exportCSV(records, `${year}-${month}`)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50">
            <Download size={13} /> Xuất CSV
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(STATUS_MAP).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-4 h-4 rounded" style={{ background: HEAT_COLOR[k as AttStatus] }} />
            <span>{v.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <div className="w-4 h-4 rounded bg-gray-50 border border-gray-200" />
          <span>Không có dữ liệu</span>
        </div>
      </div>

      {/* Heatmap Table */}
      <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Đang tải...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <CalendarDays size={32} className="opacity-30" />
            <p className="text-sm">Không có dữ liệu chấm công tháng này</p>
          </div>
        ) : (
          <div className="overflow-auto" style={{ maxHeight: "60vh" }}>
            <table className="text-xs border-collapse" style={{ minWidth: `${120 + daysInMonth * 44}px` }}>
              <thead className="sticky top-0 z-10 bg-white shadow-sm">
                <tr>
                  {/* Frozen employee column header */}
                  <th className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-100 py-3 px-4 text-left text-gray-500 font-bold min-w-[140px]">
                    Nhân viên
                  </th>
                  {dayNumbers.map(d => {
                    const dateObj = new Date(year, month - 1, d)
                    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6
                    const isToday = dateObj.toISOString().split("T")[0] === new Date().toISOString().split("T")[0]
                    return (
                      <th key={d} className={`border-b border-gray-100 py-2 text-center font-bold ${isWeekend ? "bg-gray-50/80 text-gray-300" : isToday ? "bg-red-50 text-[#C62828]" : "text-gray-500"}`}
                        style={{ width: 44 }}>
                        <div>{d}</div>
                        <div className="text-[9px] font-medium opacity-60">
                          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"][dateObj.getDay()]}
                        </div>
                      </th>
                    )
                  })}
                  <th className="border-b border-gray-100 py-3 px-3 text-gray-500 font-bold text-center min-w-[80px]">Tổng</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  // Thống kê tổng tháng cho nhân viên này
                  const empRecords = dayNumbers.map(d => {
                    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
                    return lookup.get(`${emp.id}_${dateStr}`)
                  })
                  const present = empRecords.filter(r => r && (r.status === "on-time" || r.status === "late")).length
                  const late = empRecords.filter(r => r && r.status === "late").length
                  const absent = empRecords.filter(r => r && r.status === "absent").length

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50/30 transition-colors border-b border-gray-50 last:border-0">
                      {/* Employee name — sticky */}
                      <td className="sticky left-0 z-10 bg-white border-r border-gray-100 py-2 px-4">
                        <div className="font-bold text-gray-800 whitespace-nowrap">{emp.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{emp.id}</div>
                      </td>

                      {/* Day cells */}
                      {dayNumbers.map(d => {
                        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
                        const rec = lookup.get(`${emp.id}_${dateStr}`)
                        const dateObj = new Date(year, month - 1, d)
                        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6
                        const isHov = hoverCell?.empId === emp.id && hoverCell?.date === dateStr

                        return (
                          <td key={d} className={`border-r border-gray-50 text-center ${isWeekend ? "bg-gray-50/60" : ""}`}
                            style={{ width: 44, padding: "3px 2px" }}>
                            {rec ? (
                              <div
                                title={`${rec.checkIn} → ${rec.checkOut}${rec.note ? " · " + rec.note : ""}`}
                                onClick={() => setEditRecord(rec)}
                                onMouseEnter={() => setHoverCell({ empId: emp.id, date: dateStr })}
                                onMouseLeave={() => setHoverCell(null)}
                                className="mx-auto rounded-lg cursor-pointer transition-all select-none"
                                style={{
                                  width: 36, height: 36,
                    // ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Thống kê (không biểu đồ, thuần bảng + progress bar)
// ══════════════════════════════════════════════════════════════════════════════
function StatsTab() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.attendance.list().then(d => {
      setRecords(d as AttendanceRecord[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Tổng hợp toàn bộ
  const totals = useMemo(() => ({
    onTime: records.filter(r => r.status === "on-time").length,
    late:   records.filter(r => r.status === "late").length,
    absent: records.filter(r => r.status === "absent").length,
    leave:  records.filter(r => r.status === "leave").length,
    total:  records.length
  }), [records])

  // Thống kê theo phòng ban
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

  // Top nhân viên đi trễ
  const lateRanking = useMemo(() => {
    const map = new Map<string, { name: string; dept: string; count: number }>()
    records.filter(r => r.status === "late").forEach(r => {
      const e = map.get(r.employeeId) ?? { name: r.employeeName, dept: r.department, count: 0 }
      e.count++
      map.set(r.employeeId, e)
    })
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 10)
  }, [records])

  // Thống kê theo ngày (10 ngày gần nhất)
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
    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10)
  }, [records])

  const pct = (v: number) => totals.total > 0 ? Math.round(v / totals.total * 100) : 0
  const maxLate = lateRanking[0]?.count || 1
  const maxTotal = Math.max(...deptStats.map(d => d.total), 1)

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
      <Loader2 size={24} className="animate-spin" />
      <span>Dang tải thống kê...</span>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Tổng bản ghi", value: totals.total,  clr: "text-gray-800",    bg: "bg-gray-50",    bar: "bg-gray-400" },
          { label: "Đúng giờ",    value: totals.onTime, clr: "text-green-700",  bg: "bg-green-50",   bar: "bg-green-500" },
          { label: "Đi trễ",      value: totals.late,   clr: "text-orange-700", bg: "bg-orange-50",  bar: "bg-orange-500" },
          { label: "Vắng mặt",    value: totals.absent, clr: "text-red-700",    bg: "bg-red-50",     bar: "bg-red-500" },
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

        {/* Thống kê theo phòng ban */}
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
                  {/* Stacked progress bar */}
                  <div className="h-2 rounded-full overflow-hidden flex bg-gray-100">
                    <div className="bg-green-500 transition-all" style={{ width: `${d.total > 0 ? d.onTime/d.total*100 : 0}%` }} />
                    <div className="bg-orange-400 transition-all" style={{ width: `${d.total > 0 ? d.late/d.total*100 : 0}%` }} />
                    <div className="bg-red-500 transition-all" style={{ width: `${d.total > 0 ? d.absent/d.total*100 : 0}%` }} />
                    <div className="bg-violet-400 transition-all" style={{ width: `${d.total > 0 ? d.leave/d.total*100 : 0}%` }} />
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

        {/* Top vi phạm đi trễ */}
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
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0
                    ${idx === 0 ? "bg-orange-100 text-orange-700" : idx === 1 ? "bg-amber-100 text-amber-700" : idx === 2 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
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

      {/* Bảng lịch sử 10 ngày gần nhất */}
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
}OLORS.late} />
                <Bar dataKey="absent" name="Vắng mặt" stackId="a" fill={CHART_COLORS.absent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top vi phạm đi trễ */}
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-orange-500" />
            <h3 className="font-black text-gray-800 text-sm">Top nhân viên đi trễ nhiều nhất</h3>
          </div>
          {lateRanking.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Check size={32} className="text-green-400 mx-auto mb-2" />
                <p className="text-sm">Tuyệt vời! Không có vi phạm</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {lateRanking.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${idx === 0 ? "bg-orange-100 text-orange-700" : idx === 1 ? "bg-amber-100 text-amber-700" : idx === 2 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-800 truncate">{item.name}</span>
                      <span className="text-xs font-black text-orange-600 flex-shrink-0 ml-2">{item.count} lần</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all"
                        style={{ width: `${(item.count / lateRanking[0].count) * 100}%` }} />
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{item.dept}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export function AttendanceManagement() {
  const [tab, setTab] = useState<"daily" | "monthly" | "stats">("daily")

  const TABS = [
    { id: "daily" as const, label: "Hôm nay", icon: CalendarDays },
    { id: "monthly" as const, label: "Lịch sử tháng", icon: Calendar },
    { id: "stats" as const, label: "Thống kê", icon: BarChart3 },
  ]

  return (
    <div className="space-y-5">
      {/* Page Header */}
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

      {/* Tab Bar */}
      <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm p-1 gap-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === id
              ? "bg-[#C62828] text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "daily" && <DailyTab />}
      {tab === "monthly" && <MonthlyTab />}
      {tab === "stats" && <StatsTab />}
    </div>
  )
}
