import React, { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { StatCard } from "../ui/StatCard"
import {
  Search, RefreshCw, Phone, Globe, MapPin, Copy,
  Loader2, Briefcase, Clock, Activity, CheckCircle, Info
} from "lucide-react"

const STATUSES = ["Chưa xử lý", "Chặn người lạ", "Đã gửi tin nhắn", "Không có Zalo", "Trả lời"]

function statusColor(s: string) {
  switch (s) {
    case "Chưa xử lý": return "bg-slate-100 text-slate-600 border border-slate-200"
    case "Chặn người lạ": return "bg-amber-100 text-amber-800 border border-amber-200"
    case "Đã gửi tin nhắn": return "bg-blue-100 text-blue-800 border border-blue-200"
    case "Không có Zalo": return "bg-red-600 text-white border border-red-700 font-bold"
    case "Trả lời": return "bg-emerald-100 text-emerald-800 border border-emerald-200"
    default: return "bg-slate-100 text-slate-700 border border-slate-200"
  }
}

export function CrmStaffPage() {
  const [stats, setStats] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [pageSize, setPageSize] = useState<number | "all">(50)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [tempNote, setTempNote] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const notify = (msg: string, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  const fetchStats = async () => {
    try { setStats(await api.crm.employeeDashboard()) } catch { }
  }

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const size = pageSize === "all" ? 100000 : pageSize
      const data = await api.crm.listMyData({ status: statusFilter, search, page: 0, size })
      setRecords(data?.content ?? [])
      setTotal(data?.totalElements ?? 0)
    } catch { } finally { setLoading(false) }
  }

  const refresh = () => { fetchStats(); fetchRecords() }
  useEffect(() => { refresh() }, [statusFilter, search, pageSize])

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      await api.crm.updateMyStatus(id, status)
      setRecords(p => p.map(r => r.id === id ? { ...r, status } : r))
      fetchStats()
      notify("Cập nhật trạng thái thành công!")
    } catch { notify("Không thể cập nhật", "error") }
    finally { setUpdatingId(null) }
  }

  const handleSaveNote = async (id: string) => {
    try {
      await api.crm.updateNote(id, tempNote)
      setRecords(p => p.map(r => r.id === id ? { ...r, note: tempNote } : r))
      notify("Đã lưu ghi chú!")
    } catch { notify("Không thể lưu", "error") }
    finally { setEditingNoteId(null) }
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold animate-in slide-in-from-bottom duration-300 ${toast.type === "error" ? "bg-red-50 text-red-800 border-red-100" : "bg-emerald-50 text-emerald-800 border-emerald-100"}`}>
          <Info size={15} className="mr-2" />{toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Không gian làm việc</h1>
          <p className="text-sm text-gray-500 mt-0.5">Xem và cập nhật tiến độ xử lý data được giao</p>
        </div>
        <button onClick={refresh} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Được giao" value={stats.totalAssigned} icon={Briefcase} iconBg="bg-blue-50" iconColor="text-blue-500" />
          <StatCard title="Chưa xử lý" value={stats.untreatedCount} icon={Clock} iconBg="bg-slate-100" iconColor="text-slate-500" />
          <StatCard title="Đã gửi" value={stats.processingCount} icon={Activity} iconBg="bg-purple-50" iconColor="text-purple-500" />
          <StatCard title="Trả lời" value={stats.completedCount} icon={CheckCircle} iconBg="bg-emerald-50" iconColor="text-emerald-500" />
        </div>
      )}

      {/* Progress detail */}
      {stats?.statusCounts && (
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">Tiến độ chi tiết</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(stats.statusCounts as Record<string, number>).map(([s, count]) => {
              const pct = stats.totalAssigned > 0 ? +((count / stats.totalAssigned) * 100).toFixed(1) : 0
              return (
                <div key={s}>
                  <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>{s}</span><span>{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s === "Chưa xử lý" ? "bg-slate-300" : s === "Chặn người lạ" ? "bg-amber-400" : s === "Đã gửi tin nhắn" ? "bg-blue-400" : s === "Không có Zalo" ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Tìm tên doanh nghiệp, địa chỉ, SĐT..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 transition" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none w-full sm:w-52">
          <option value="">Tất cả trạng thái</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={pageSize} onChange={e => setPageSize(e.target.value === "all" ? "all" : +e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm font-semibold focus:outline-none w-full sm:w-36">
          {[50, 100, 200].map(n => <option key={n} value={n}>{n} dòng</option>)}
          <option value="all">Tất cả</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-black/5 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 size={28} className="animate-spin text-[#C62828] mb-3" />
            <span className="text-sm font-semibold">Đang tải dữ liệu của bạn...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Briefcase size={40} className="mb-3 stroke-1" />
            <p className="text-sm font-semibold">Chưa có data được giao</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Tên doanh nghiệp","Loại hình","Địa chỉ","Khu vực","SĐT","Website","Maps","Trạng thái","Ghi chú"].map(h => (
                    <th key={h} className="py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition">
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
                    <td className="py-2 px-2 whitespace-nowrap">
                      <select value={r.status ?? "Chưa xử lý"} disabled={updatingId === r.id}
                        onChange={e => handleStatusChange(r.id, e.target.value)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border focus:outline-none cursor-pointer appearance-none transition ${statusColor(r.status)}`}>
                        {STATUSES.map(s => <option key={s} value={s} className="bg-white text-gray-800 font-normal">{s}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      {editingNoteId === r.id
                        ? <input autoFocus type="text" value={tempNote} onChange={e => setTempNote(e.target.value)}
                            onBlur={() => handleSaveNote(r.id)}
                            onKeyDown={e => { if (e.key === "Enter") handleSaveNote(r.id); if (e.key === "Escape") setEditingNoteId(null) }}
                            className="w-full min-w-[90px] px-1.5 py-0.5 border border-[#C62828]/50 rounded text-xs focus:outline-none" />
                        : <div onClick={() => { setEditingNoteId(r.id); setTempNote(r.note ?? "") }} className="cursor-pointer hover:bg-gray-100/80 px-1 py-0.5 rounded min-h-[18px] min-w-[80px] max-w-[140px] break-words text-gray-600 font-medium">
                            {r.note || <span className="text-gray-300 italic text-[10px]">Thêm ghi chú...</span>}
                          </div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && records.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Hiển thị <strong className="text-gray-600">{records.length}</strong> / {total} data được giao</span>
            {total > records.length && <button onClick={() => setPageSize("all")} className="text-xs font-bold text-[#C62828] hover:underline">Xem tất cả {total} →</button>}
          </div>
        )}
      </div>
    </div>
  )
}
