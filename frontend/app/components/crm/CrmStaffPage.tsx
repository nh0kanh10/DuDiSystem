import React, { useState, useEffect } from "react"
import { api } from "@/lib/api"
import {
  Search, RefreshCw, Phone, Globe, MapPin, Copy,
  Loader2, Briefcase, Clock, Activity, CheckCircle, Info
} from "lucide-react"

const STATUSES = ["Chưa xử lý", "Chặn người lạ", "Đã gửi tin nhắn", "Không có Zalo", "Trả lời"]

function statusColor(s: string) {
  switch (s) {
    case "Chưa xử lý": return "bg-slate-500/15 text-slate-400 border border-slate-500/30"
    case "Chặn người lạ": return "bg-amber-500/15 text-amber-400 border border-amber-500/30"
    case "Đã gửi tin nhắn": return "bg-blue-500/15 text-blue-400 border border-blue-500/30"
    case "Không có Zalo": return "bg-red-500/20 text-red-300 border border-red-500/40 font-bold"
    case "Trả lời": return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
    default: return "bg-slate-500/15 text-slate-400 border border-slate-500/30"
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
        <div className={`fixed bottom-5 right-5 z-[9999] flex items-center px-4 py-3 rounded-2xl shadow-2xl border text-sm font-semibold backdrop-blur-md animate-in slide-in-from-bottom duration-300 ${toast.type === "error" ? "bg-red-950/95 text-red-200 border-red-500/35" : "bg-emerald-950/95 text-emerald-200 border-emerald-500/35"}`}>
          <div className={`w-1.5 h-1.5 rounded-full mr-2.5 animate-pulse ${toast.type === "error" ? "bg-red-400" : "bg-emerald-400"}`} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#FFE8EC]">Không gian làm việc</h1>
          <p className="text-sm text-white/40 mt-0.5">Xem và cập nhật tiến độ xử lý data được giao</p>
        </div>
        <button onClick={refresh} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition active:scale-95">
          <RefreshCw size={16} className="text-white/60" />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/[0.03] backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-inner flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-wider mb-1">Được giao</p>
              <h4 className="text-2xl font-black text-white">{stats.totalAssigned}</h4>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Briefcase size={20} className="text-blue-400" />
            </div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-inner flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-wider mb-1">Chưa xử lý</p>
              <h4 className="text-2xl font-black text-white">{stats.untreatedCount}</h4>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0">
              <Clock size={20} className="text-white/55" />
            </div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-inner flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-wider mb-1">Đã gửi</p>
              <h4 className="text-2xl font-black text-white">{stats.processingCount}</h4>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Activity size={20} className="text-purple-400" />
            </div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-inner flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-wider mb-1">Trả lời</p>
              <h4 className="text-2xl font-black text-white">{stats.completedCount}</h4>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={20} className="text-emerald-400" />
            </div>
          </div>
        </div>
      )}

      {/* Progress detail */}
      {stats?.statusCounts && (
        <div className="bg-white/[0.02] backdrop-blur-md p-5 rounded-3xl border border-white/5 shadow-inner">
          <p className="text-xs font-black text-white/40 uppercase tracking-wider mb-4">Tiến độ chi tiết</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(stats.statusCounts as Record<string, number>).map(([s, count]) => {
              const pct = stats.totalAssigned > 0 ? +((count / stats.totalAssigned) * 100).toFixed(1) : 0
              return (
                <div key={s}>
                  <div className="flex justify-between text-xs font-semibold text-white/70 mb-1.5">
                    <span>{s}</span><span>{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s === "Chưa xử lý" ? "bg-slate-400" : s === "Chặn người lạ" ? "bg-amber-400" : s === "Đã gửi tin nhắn" ? "bg-blue-400" : s === "Không có Zalo" ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/[0.03] backdrop-blur-md p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" placeholder="Tìm tên doanh nghiệp, địa chỉ, SĐT..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-white/10 rounded-xl bg-white/[0.04] text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C62828]/50 focus:ring-1 focus:ring-[#C62828]/20 transition" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 border border-white/10 rounded-xl bg-white/[0.04] text-white/80 text-sm focus:outline-none focus:border-[#C62828]/50 w-full sm:w-52 cursor-pointer">
          <option value="" className="bg-[#180306] text-white">Tất cả trạng thái</option>
          {STATUSES.map(s => <option key={s} value={s} className="bg-[#180306] text-white">{s}</option>)}
        </select>
        <select value={pageSize} onChange={e => setPageSize(e.target.value === "all" ? "all" : +e.target.value)} className="px-3 py-2.5 border border-white/10 rounded-xl bg-white/[0.04] text-white/80 text-sm font-semibold focus:outline-none focus:border-[#C62828]/50 w-full sm:w-36 cursor-pointer">
          {[50, 100, 200].map(n => <option key={n} value={n} className="bg-[#180306] text-white">{n} dòng</option>)}
          <option value="all" className="bg-[#180306] text-white">Tất cả</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/5 shadow-inner overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <Loader2 size={28} className="animate-spin text-[#C62828] mb-3" />
            <span className="text-sm font-semibold">Đang tải dữ liệu của bạn...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <Briefcase size={40} className="mb-3 stroke-1" />
            <p className="text-sm font-semibold">Chưa có data được giao</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-xs">
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/5">
                  {["Tên doanh nghiệp","Loại hình","Địa chỉ","Khu vực","SĐT","Website","Maps","Trạng thái","Ghi chú"].map(h => (
                    <th key={h} className="py-3 px-3 text-[10px] font-bold text-white/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-2.5 px-3 font-bold text-[#FFE8EC] max-w-[160px] break-words">{r.businessName}</td>
                    <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 bg-white/5 text-white/60 rounded text-[10px] font-semibold border border-white/10">{r.businessType || "—"}</span></td>
                    <td className="py-2.5 px-3 text-white/70 max-w-[180px] break-words">{r.address}</td>
                    <td className="py-2.5 px-3 text-white/60">{r.area}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <a href={`tel:${r.phone}`} className="text-white/80 font-bold hover:text-[#C62828] flex items-center"><Phone size={11} className="mr-1 text-white/40" />{r.phone}</a>
                        <button onClick={() => navigator.clipboard.writeText(r.phone).then(() => notify("Đã copy SĐT!"))} className="p-0.5 text-white/40 hover:text-[#C62828] rounded hover:bg-white/5 transition"><Copy size={11}/></button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">{r.website ? <a href={r.website} target="_blank" rel="noreferrer" className="inline-flex items-center text-blue-400 hover:text-blue-300 font-semibold"><Globe size={11} className="mr-1" />Web</a> : <span className="text-white/20 italic">—</span>}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">{r.googleMapUrl ? <a href={r.googleMapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-blue-400 hover:text-blue-300 font-semibold"><MapPin size={11} className="mr-1" />Maps</a> : <span className="text-white/20 italic">—</span>}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <select value={r.status ?? "Chưa xử lý"} disabled={updatingId === r.id}
                        onChange={e => handleStatusChange(r.id, e.target.value)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border focus:outline-none cursor-pointer appearance-none transition ${statusColor(r.status)}`}>
                        {STATUSES.map(s => <option key={s} value={s} className="bg-[#180306] text-white font-normal">{s}</option>)}
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      {editingNoteId === r.id
                        ? <input autoFocus type="text" value={tempNote} onChange={e => setTempNote(e.target.value)}
                            onBlur={() => handleSaveNote(r.id)}
                            onKeyDown={e => { if (e.key === "Enter") handleSaveNote(r.id); if (e.key === "Escape") setEditingNoteId(null) }}
                            className="w-full min-w-[90px] px-1.5 py-0.5 bg-[#180306] text-white border border-white/20 rounded text-xs focus:outline-none" />
                        : <div onClick={() => { setEditingNoteId(r.id); setTempNote(r.note ?? "") }} className="cursor-pointer hover:bg-white/5 px-1 py-0.5 rounded min-h-[18px] min-w-[80px] max-w-[140px] break-words text-white/60 font-medium">
                            {r.note || <span className="text-white/20 italic text-[10px]">Thêm ghi chú...</span>}
                          </div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && records.length > 0 && (
          <div className="px-6 py-3 border-t border-white/5 bg-white/[0.03] flex items-center justify-between">
            <span className="text-xs font-semibold text-white/40">Hiển thị <strong className="text-white/70">{records.length}</strong> / {total} data được giao</span>
            {total > records.length && <button onClick={() => setPageSize("all")} className="text-xs font-bold text-[#C62828] hover:underline">Xem tất cả {total} →</button>}
          </div>
        )}
      </div>
    </div>
  )
}
