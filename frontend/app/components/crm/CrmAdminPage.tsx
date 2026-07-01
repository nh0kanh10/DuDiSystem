import React, { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Modal, ModalCancelButton, ModalSubmitButton } from "../ui/Modal"
import ConfirmModal from "../ui/ConfirmModal"
import { StatCard } from "../ui/StatCard"
import {
  Search, Plus, Trash2, Edit3, UserPlus, Phone, Globe, MapPin,
  Loader2, RefreshCw, Database, UserCheck, UserMinus, Send,
  MessageSquare, FileSpreadsheet, Download, Users, Copy,
  CheckSquare, Square, MoreHorizontal, SlidersHorizontal
} from "lucide-react"

const STATUSES = ["Chưa xử lý", "Chặn người lạ", "Đã gửi tin nhắn", "Không có Zalo", "Trả lời"]

function CrmBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Chưa xử lý": "bg-slate-100 text-slate-600 border border-slate-200",
    "Chặn người lạ": "bg-amber-100 text-amber-800 border border-amber-200",
    "Đã gửi tin nhắn": "bg-blue-100 text-blue-800 border border-blue-200",
    "Không có Zalo": "bg-red-600 text-white border border-red-700 font-bold",
    "Trả lời": "bg-emerald-100 text-emerald-800 border border-emerald-200",
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>
}

const emptyForm = { businessName: "", address: "", area: "", phone: "", website: "", businessType: "", googleMapUrl: "", status: "Chưa xử lý", note: "" }

type TabType = "dashboard" | "data"

export function CrmAdminPage() {
  const [tab, setTab] = useState<TabType>("dashboard")
  const [stats, setStats] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [employees, setEmployees] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [assignedFilter, setAssignedFilter] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [pageSize, setPageSize] = useState<number | "all">(50)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [current, setCurrent] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [formErrors, setFormErrors] = useState<any>({})
  const [selectedEmpId, setSelectedEmpId] = useState("")
  const [autoAssignLoading, setAutoAssignLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [tempNote, setTempNote] = useState("")

  const notify = (msg: string, type = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchStats = async () => {
    setStatsLoading(true)
    try { setStats(await api.crm.adminDashboard()) } catch { } finally { setStatsLoading(false) }
  }

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const size = pageSize === "all" ? 100000 : pageSize
      const data = await api.crm.listData({ status: statusFilter, assignedTo: assignedFilter, search, page: 0, size })
      setRecords(data?.content ?? [])
      setTotal(data?.totalElements ?? 0)
    } catch { } finally { setLoading(false) }
  }

  const fetchEmployees = async () => {
    try { setEmployees((await api.employees.list()) as any[]) } catch { }
  }

  const refresh = () => { fetchStats(); fetchRecords(); fetchEmployees() }
  useEffect(() => { refresh() }, [statusFilter, assignedFilter, search, pageSize])

  const validate = () => {
    const errs: any = {}
    if (!form.businessName.trim()) errs.businessName = "Không được để trống"
    if (!form.phone.trim()) errs.phone = "Không được để trống"
    else if (!/^(\+84|0)(\s*\d){9,11}$/.test(form.phone.trim())) errs.phone = "SĐT không hợp lệ"
    setFormErrors(errs)
    return !Object.keys(errs).length
  }

  const handleFormSubmit = async () => {
    if (!validate()) return
    try {
      if (current) { await api.crm.updateData(current.id, form); notify("Cập nhật thành công!") }
      else { await api.crm.createData(form); notify("Thêm mới thành công!") }
      setFormOpen(false); refresh()
    } catch { notify("Có lỗi xảy ra", "error") }
  }

  const handleAssign = async () => {
    if (!selectedEmpId) return
    try {
      if (selectedIds.length > 0) await api.crm.assignBulk(selectedIds, selectedEmpId)
      else if (current) await api.crm.assignOne(current.id, selectedEmpId)
      notify("Chia data thành công!"); setAssignOpen(false); setSelectedIds([]); refresh()
    } catch { notify("Lỗi khi chia data", "error") }
  }

  const handleDelete = async () => {
    if (!current) return
    try { await api.crm.deleteData(current.id); notify("Đã xóa!"); refresh() }
    catch { notify("Không thể xóa", "error") }
  }

  const handleAutoAssign = async () => {
    const active = employees.filter((e: any) => e.status === "active")
    if (!active.length) { notify("Không có nhân viên active", "error"); return }
    setAutoAssignLoading(true)
    try {
      const r = await api.crm.autoAssign(active.map((e: any) => e.id))
      notify(`Đã chia tự động ${r?.assignedCount ?? 0} data!`); refresh()
    } catch { notify("Lỗi chia tự động", "error") }
    finally { setAutoAssignLoading(false) }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setImportLoading(true)
    try { const r = await api.crm.importCsv(file); notify(`Import ${r?.successCount ?? 0} dòng thành công!`); refresh() }
    catch { notify("Lỗi import file", "error") }
    finally { setImportLoading(false); e.target.value = "" }
  }

  const handleExport = () => {
    if (!records.length) { notify("Không có dữ liệu", "error"); return }
    let csv = "\uFEFFTên,Địa chỉ,Khu vực,SĐT,Website,Loại hình,Maps,Trạng thái,Nhân viên,Ghi chú\n"
    records.forEach(r => {
      csv += [r.businessName, r.address, r.area, r.phone, r.website, r.businessType, r.googleMapUrl, r.status, r.assignedToName ?? "", r.note ?? ""]
        .map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",") + "\n"
    })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
    a.download = `CRM_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    notify("Xuất Excel thành công!")
  }

  const openAdd = () => { setCurrent(null); setForm({ ...emptyForm }); setFormErrors({}); setFormOpen(true) }
  const openEdit = (r: any) => { setCurrent(r); setForm({ businessName: r.businessName ?? "", address: r.address ?? "", area: r.area ?? "", phone: r.phone ?? "", website: r.website ?? "", businessType: r.businessType ?? "", googleMapUrl: r.googleMapUrl ?? "", status: r.status ?? "Chưa xử lý", note: r.note ?? "" }); setFormErrors({}); setFormOpen(true) }
  const openAssign = (r?: any) => { if (r) setCurrent(r); else setCurrent(null); setSelectedEmpId(""); setAssignOpen(true) }
  const toggleAll = () => setSelectedIds(p => p.length === records.length ? [] : records.map(r => r.id))
  const toggleOne = (id: string) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const activeEmps = employees.filter((e: any) => e.status === "active")

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold animate-in slide-in-from-bottom duration-300 ${toast.type === "error" ? "bg-red-50 text-red-800 border-red-100" : "bg-emerald-50 text-emerald-800 border-emerald-100"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Quản lý CRM</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý data khách hàng và phân công nhân viên</p>
        </div>
        <button onClick={refresh} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
        {(["dashboard", "data"] as TabType[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-bold rounded-xl transition ${tab === t ? "bg-white text-[#C62828] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "dashboard" ? "📊 Dashboard" : "🗂 Dữ liệu"}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD TAB ── */}
      {tab === "dashboard" && (
        <div className="space-y-5">
          {statsLoading ? (
            <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-[#C62828]" /></div>
          ) : stats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard title="Tổng data" value={stats.totalData} icon={Database} iconBg="bg-slate-100" iconColor="text-slate-500" />
                <StatCard title="Đã chia" value={stats.assignedData} icon={UserCheck} iconBg="bg-blue-50" iconColor="text-blue-500" />
                <StatCard title="Chưa chia" value={stats.unassignedData} icon={UserMinus} iconBg="bg-amber-50" iconColor="text-amber-500" />
                <StatCard title="Đã gửi" value={stats.totalData - (stats.statusCounts?.["Chưa xử lý"] ?? 0)} icon={Send} iconBg="bg-purple-50" iconColor="text-purple-500" />
                <StatCard title="Trả lời" value={stats.statusCounts?.["Trả lời"] ?? 0} icon={MessageSquare} iconBg="bg-emerald-50" iconColor="text-emerald-500" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Status chart */}
                <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs space-y-4">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Trạng thái xử lý</p>
                  {STATUSES.map(s => {
                    const count = stats.statusCounts?.[s] ?? 0
                    const pct = stats.totalData > 0 ? +((count / stats.totalData) * 100).toFixed(1) : 0
                    return (
                      <div key={s}>
                        <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                          <span>{s}</span><span>{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s === "Chưa xử lý" ? "bg-slate-300" : s === "Chặn người lạ" ? "bg-amber-400" : s === "Đã gửi tin nhắn" ? "bg-blue-400" : s === "Không có Zalo" ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Employee progress */}
                <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs space-y-4">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Tiến độ nhân viên</p>
                  {!stats.employeeProgress?.length ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <Users size={32} className="mb-2 stroke-1" /><p className="text-sm">Chưa có dữ liệu</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                      {stats.employeeProgress.map((emp: any) => {
                        const cPct = emp.totalAssigned > 0 ? +((emp.completedCount / emp.totalAssigned) * 100).toFixed(0) : 0
                        const pPct = emp.totalAssigned > 0 ? +((emp.processingCount / emp.totalAssigned) * 100).toFixed(0) : 0
                        return (
                          <div key={emp.employeeId} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                            <div className="flex justify-between items-center mb-1.5">
                              <div>
                                <p className="text-sm font-bold text-gray-800">{emp.employeeName}</p>
                                <p className="text-xs text-gray-400">Được giao: {emp.totalAssigned}</p>
                              </div>
                              <div className="flex gap-1.5">
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-600 text-white">Trả lời: {emp.completedCount}</span>
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">Gửi: {emp.processingCount}</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
                              <div className="bg-emerald-500 h-full transition-all" style={{ width: `${cPct}%` }} />
                              <div className="bg-blue-400 h-full transition-all" style={{ width: `${pPct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── DATA TAB ── */}
      {tab === "data" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 justify-between">
            <div className="relative flex-1 max-w-lg">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Tìm tên doanh nghiệp, địa chỉ, SĐT..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]/50 transition" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedIds.length > 0 && (
                <>
                  <button onClick={() => openAssign()} className="flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition">
                    <UserPlus size={14} className="mr-1.5" /> Chia ({selectedIds.length})
                  </button>
                  <button onClick={async () => { try { await api.crm.deleteBulk(selectedIds); notify(`Đã xóa ${selectedIds.length} mục`); setSelectedIds([]); refresh() } catch { notify("Lỗi xóa hàng loạt", "error") } }}
                    className="flex items-center px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition">
                    <Trash2 size={14} className="mr-1.5" /> Xóa ({selectedIds.length})
                  </button>
                </>
              )}
              <button onClick={handleAutoAssign} disabled={autoAssignLoading}
                className="flex items-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-60">
                {autoAssignLoading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <UserPlus size={14} className="mr-1.5" />} Chia tự động
              </button>
              <button onClick={openAdd} className="flex items-center px-4 py-2.5 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-sm font-bold transition shadow-sm shadow-red-600/20">
                <Plus size={14} className="mr-1.5" /> Thêm mới
              </button>
              <label className={`flex items-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-xl text-sm font-bold transition cursor-pointer ${importLoading ? "opacity-60 pointer-events-none" : ""}`}>
                {importLoading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <FileSpreadsheet size={14} className="mr-1.5 text-[#C62828]" />} Import CSV
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImport} />
              </label>
              <button onClick={handleExport} className="flex items-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-xl text-sm font-bold transition">
                <Download size={14} className="mr-1.5" /> Xuất Excel
              </button>
              <button onClick={() => setShowFilters(v => !v)} className={`flex items-center px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold transition ${showFilters ? "bg-gray-100 text-gray-800" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                <SlidersHorizontal size={14} className="mr-1.5" /> Bộ lọc
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-gray-200">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trạng thái</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none">
                  <option value="">Tất cả</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nhân viên</label>
                <select value={assignedFilter} onChange={e => setAssignedFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none">
                  <option value="">Tất cả nhân viên</option>
                  <option value="unassigned">Chưa giao</option>
                  {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số dòng</label>
                <select value={pageSize} onChange={e => setPageSize(e.target.value === "all" ? "all" : +e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm font-semibold focus:outline-none">
                  {[50, 100, 200].map(n => <option key={n} value={n}>{n} dòng</option>)}
                  <option value="all">Tất cả</option>
                </select>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-3xl border border-black/5 shadow-xs overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 size={28} className="animate-spin text-[#C62828] mb-3" />
                <span className="text-sm font-semibold">Đang tải dữ liệu...</span>
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Database size={40} className="mb-3 stroke-1" />
                <p className="text-sm font-semibold">Không có dữ liệu</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="py-3 px-3 w-8"><button onClick={toggleAll}>{selectedIds.length === records.length ? <CheckSquare size={15} className="text-[#C62828]" /> : <Square size={15} className="text-gray-400" />}</button></th>
                      {["Tên doanh nghiệp","Loại hình","Địa chỉ","Khu vực","SĐT","Website","Maps","Trạng thái","Nhân viên","Ghi chú",""].map(h => (
                        <th key={h} className="py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map(r => (
                      <tr key={r.id} className={`hover:bg-gray-50/60 transition ${selectedIds.includes(r.id) ? "bg-red-50/20" : ""}`}>
                        <td className="py-2 px-3"><button onClick={() => toggleOne(r.id)}>{selectedIds.includes(r.id) ? <CheckSquare size={15} className="text-[#C62828]" /> : <Square size={15} className="text-gray-400" />}</button></td>
                        <td className="py-2 px-2 font-bold text-gray-800 max-w-[160px] break-words">{r.businessName}</td>
                        <td className="py-2 px-2"><span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold border border-gray-200">{r.businessType || "—"}</span></td>
                        <td className="py-2 px-2 text-gray-700 max-w-[180px] break-words">{r.address}</td>
                        <td className="py-2 px-2 text-gray-600">{r.area}</td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <a href={`tel:${r.phone}`} className="text-gray-700 font-bold hover:text-[#C62828] flex items-center"><Phone size={11} className="mr-1 text-gray-400" />{r.phone}</a>
                            <button onClick={() => navigator.clipboard.writeText(r.phone).then(() => notify("Đã copy SĐT!"))} className="p-0.5 text-gray-400 hover:text-[#C62828] rounded hover:bg-gray-100 transition"><Copy size={11} /></button>
                          </div>
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">{r.website ? <a href={r.website} target="_blank" rel="noreferrer" className="inline-flex items-center text-blue-500 hover:underline font-semibold"><Globe size={11} className="mr-1" />Web</a> : <span className="text-gray-300 italic">—</span>}</td>
                        <td className="py-2 px-2 whitespace-nowrap">{r.googleMapUrl ? <a href={r.googleMapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-blue-500 hover:underline font-semibold"><MapPin size={11} className="mr-1" />Maps</a> : <span className="text-gray-300 italic">—</span>}</td>
                        <td className="py-2 px-2 whitespace-nowrap"><CrmBadge status={r.status ?? "Chưa xử lý"} /></td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          {r.assignedToName
                            ? <div className="flex items-center text-xs font-semibold text-gray-700"><div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-1.5 text-[10px] text-gray-500 border border-gray-200">{r.assignedToName.charAt(0)}</div>{r.assignedToName}</div>
                            : <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-50 text-gray-400 border border-dashed border-gray-200">Chưa giao</span>}
                        </td>
                        <td className="py-2 px-2">
                          {editingNoteId === r.id
                            ? <input autoFocus type="text" value={tempNote} onChange={e => setTempNote(e.target.value)}
                                onBlur={async () => { try { await api.crm.updateNote(r.id, tempNote); setRecords(p => p.map(x => x.id === r.id ? { ...x, note: tempNote } : x)); notify("Đã lưu ghi chú!") } catch { } finally { setEditingNoteId(null) } }}
                                onKeyDown={e => { if (e.key === "Escape") setEditingNoteId(null) }}
                                className="w-full min-w-[90px] px-1.5 py-0.5 border border-[#C62828]/50 rounded text-xs focus:outline-none" />
                            : <div onClick={() => { setEditingNoteId(r.id); setTempNote(r.note ?? "") }} className="cursor-pointer hover:bg-gray-100/80 px-1 py-0.5 rounded min-h-[18px] min-w-[80px] max-w-[140px] break-words text-gray-600 font-medium">
                                {r.note || <span className="text-gray-300 italic text-[10px]">Thêm ghi chú...</span>}
                              </div>}
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit3 size={13} /></button>
                            <button onClick={() => openAssign(r)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"><UserPlus size={13} /></button>
                            <button onClick={() => { setCurrent(r); setDeleteOpen(true) }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && records.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Hiển thị <strong className="text-gray-600">{records.length}</strong> / {total}</span>
                {total > records.length && <button onClick={() => setPageSize("all")} className="text-xs font-bold text-[#C62828] hover:underline">Xem tất cả {total} →</button>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FORM MODAL ── */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={current ? "Sửa thông tin Data" : "Thêm Data mới"} icon={Database} width="xl"
        footer={<><ModalCancelButton onClick={() => setFormOpen(false)} /><ModalSubmitButton onClick={handleFormSubmit} label={current ? "Cập nhật" : "Thêm mới"} /></>}>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên doanh nghiệp *</label>
              <input type="text" value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 ${formErrors.businessName ? "border-red-400" : "border-gray-200"}`} placeholder="Ví dụ: Công ty ABC" />
              {formErrors.businessName && <p className="text-red-500 text-xs mt-1">{formErrors.businessName}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số điện thoại *</label>
              <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 ${formErrors.phone ? "border-red-400" : "border-gray-200"}`} placeholder="0901234567" />
              {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Địa chỉ</label>
              <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none" placeholder="86 Đường ABC" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Khu vực</label>
              <input type="text" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none" placeholder="TP. Hồ Chí Minh" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Loại hình</label>
              <input type="text" value={form.businessType} onChange={e => setForm(f => ({ ...f, businessType: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none" placeholder="Công nghệ, Ăn uống..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trạng thái</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Website</label>
              <input type="text" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Google Maps URL</label>
              <input type="text" value={form.googleMapUrl} onChange={e => setForm(f => ({ ...f, googleMapUrl: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none" placeholder="https://maps.google.com/..." />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ghi chú</label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none resize-none" placeholder="Ghi chú thêm..." />
          </div>
        </div>
      </Modal>

      {/* ── ASSIGN MODAL ── */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title={selectedIds.length > 0 ? `Chia data hàng loạt (${selectedIds.length})` : "Chia data cho nhân viên"} icon={UserPlus} width="sm"
        footer={<><ModalCancelButton onClick={() => setAssignOpen(false)} /><ModalSubmitButton onClick={handleAssign} label="Chia data" disabled={!selectedEmpId} /></>}>
        <div className="p-6 space-y-3">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chọn nhân viên</label>
          <select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20">
            <option value="">-- Chọn nhân viên --</option>
            {activeEmps.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          {!activeEmps.length && <p className="text-xs text-amber-600 font-semibold">Không có nhân viên đang hoạt động</p>}
        </div>
      </Modal>

      {/* ── DELETE CONFIRM ── */}
      <ConfirmModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete}
        title="Xóa dữ liệu?" message={`Bạn có chắc muốn xóa "${current?.businessName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa" type="danger" />
    </div>
  )
}
