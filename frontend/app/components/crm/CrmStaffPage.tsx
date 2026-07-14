import React, { useState, useEffect } from "react"
import * as XLSX from "xlsx"
import { api } from "@/lib/api"
import { Modal, ModalCancelButton, ModalSubmitButton } from "../ui/Modal"
import { useToast } from "@/app/hooks/useToast"
import { CustomSelect } from "../ui/CustomSelect"
import { CrmLeadCell } from "./CrmLeadCell"
import { UserKpiPanel } from "../nhan-vien/UserKpiPanel"
import { Employee } from "../../types"
import {
  Search, RefreshCw, Phone, Globe, MapPin, Copy,
  Loader2, Briefcase, Clock, Activity, CheckCircle, Info,
  Download
} from "lucide-react"

const STATUSES = ["Chưa xử lý", "Chặn người lạ", "Đã gửi tin nhắn", "Không có Zalo", "Trả lời"]

function statusColor(s: string) {
  switch (s) {
    case "Chưa xử lý": return "bg-slate-100 text-slate-700 border border-slate-200"
    case "Chặn người lạ": return "bg-amber-50 text-amber-700 border border-amber-200"
    case "Đã gửi tin nhắn": return "bg-blue-50 text-blue-700 border border-blue-200"
    case "Không có Zalo": return "bg-red-50 text-red-700 border border-red-200 font-bold"
    case "Trả lời": return "bg-emerald-50 text-emerald-700 border border-emerald-200"
    default: return "bg-slate-100 text-slate-700 border border-slate-200"
  }
}

export function CrmStaffPage({ employee = null, activeTab = "data", onOpenLead }: { employee?: Employee | null; activeTab?: "data" | "kpi"; onOpenLead?: (leadId: string) => void }) {
  const [stats, setStats] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [pageSize, setPageSize] = useState<number | "all">(50)
  const { showToast: notify } = useToast()
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [tempNote, setTempNote] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const [convertModalRecord, setConvertModalRecord] = useState<any>(null)
  const [convertLeadName, setConvertLeadName] = useState("")

  const handleExportExcel = () => {
    if (!records.length) {
      notify("Không có dữ liệu để xuất!", "error")
      return
    }

    const esc = (val: any) => {
      if (val === null || val === undefined) return ""
      return String(val)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
    }

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`
    html += `<head>`
    html += `<meta charset="utf-8"/>`
    html += `<!--[if gte mso 9]>`
    html += `<xml>`
    html += `  <x:ExcelWorkbook>`
    html += `    <x:ExcelWorksheets>`
    html += `      <x:ExcelWorksheet>`
    html += `        <x:Name>CRM Staff Data</x:Name>`
    html += `        <x:WorksheetOptions>`
    html += `          <x:DisplayGridlines/>`
    html += `        </x:WorksheetOptions>`
    html += `      </x:ExcelWorksheet>`
    html += `    </x:ExcelWorksheets>`
    html += `  </x:ExcelWorkbook>`
    html += `</xml>`
    html += `<![endif]-->`
    html += `<style>`
    html += `  table { border-collapse: collapse; }`
    html += `  th, td { border: 0.5pt solid #888888; padding: 8px 12px; text-align: left; vertical-align: middle; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; }`
    html += `  th { background-color: #d9d9d9; font-weight: bold; text-align: center; }`
    html += `  .text-center { text-align: center; }`
    html += `  .nowrap { white-space: nowrap; }`
    html += `  .phone-num { mso-number-format: "\\@"; }`
    html += `</style>`
    html += `</head>`
    html += `<body>`
    html += `<table>`
    html += `  <thead>`
    html += `    <tr>`
    html += `      <th class="text-center nowrap">ID</th>`
    html += `      <th class="nowrap">Tên doanh nghiệp</th>`
    html += `      <th class="nowrap">Loại hình</th>`
    html += `      <th>Địa chỉ</th>`
    html += `      <th class="nowrap">Khu vực</th>`
    html += `      <th class="nowrap">SĐT</th>`
    html += `      <th class="nowrap">Website</th>`
    html += `      <th class="nowrap">Maps</th>`
    html += `      <th class="nowrap">Trạng thái</th>`
    html += `      <th>Ghi chú</th>`
    html += `    </tr>`
    html += `  </thead>`
    html += `  <tbody>`
    
    records.forEach(r => {
      const cleanId = (r.id || "").replace("crm-", "")
      const website = r.website ? r.website : ""
      const maps = r.googleMapUrl ? r.googleMapUrl : ""
      
      html += `    <tr>`
      html += `      <td class="text-center nowrap font-bold">${esc(cleanId)}</td>`
      html += `      <td class="nowrap">${esc(r.businessName)}</td>`
      html += `      <td class="nowrap">${esc(r.businessType)}</td>`
      html += `      <td>${esc(r.address)}</td>`
      html += `      <td class="nowrap">${esc(r.area)}</td>`
      html += `      <td class="nowrap phone-num">${esc(r.phone)}</td>`
      html += `      <td class="nowrap">${esc(website)}</td>`
      html += `      <td class="nowrap">${esc(maps)}</td>`
      html += `      <td class="nowrap">${esc(r.status || "Chưa xử lý")}</td>`
      html += `      <td>${esc(r.note)}</td>`
      html += `    </tr>`
    })

    html += `  </tbody>`
    html += `</table>`
    html += `</body>`
    html += `</html>`

    const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `CRM_Staff_${employee?.name ? employee.name.replace(/\s+/g, "_") : "Data"}_${new Date().toISOString().slice(0, 10)}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    notify("Xuất Excel thành công!")
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
  useEffect(() => { if (activeTab === "data") refresh() }, [statusFilter, search, pageSize, activeTab])

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

  const handleConvertToLead = (record: { id: string; convertedLeadId?: string; businessName?: string }) => {
    setConvertModalRecord(record)
    setConvertLeadName(record.businessName ? `${record.businessName} — deal mới` : "")
  }

  const submitConvertToLead = async () => {
    if (!convertModalRecord) return
    const leadName = convertLeadName.trim()
    if (!leadName) {
      notify("Vui lòng nhập tên lead (cơ hội)", "error")
      return
    }
    setConvertingId(convertModalRecord.id)
    try {
      const result = await api.crm.convertToLeadEmployee(convertModalRecord.id, {
        leadName,
        forceNew: Boolean(convertModalRecord.convertedLeadId),
      })
      setRecords((p) => p.map((x) => x.id === convertModalRecord.id ? { ...x, ...result.record } : x))
      notify(result.alreadyExists ? `Lead ${result.lead.code} đã tồn tại` : `Đã tạo Lead ${result.lead.code}`)
      setConvertModalRecord(null)
      setConvertLeadName("")
      onOpenLead?.(result.lead.id)
    } catch (e) {
      notify(e instanceof Error ? e.message : "Không chuyển được sang Lead", "error")
    } finally {
      setConvertingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {activeTab === "kpi" ? (
        <UserKpiPanel employee={employee} />
      ) : (
        <>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#241416] dark:text-[#FFE8EC]">Không gian làm việc</h1>
          <p className="text-sm text-[#7f5f63] dark:text-white/40 mt-0.5">Xem và cập nhật tiến độ xử lý data được giao</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-[#efd7da] dark:border-white/5 text-xs font-bold text-[#7a1d22] dark:text-[#FFE8EC] rounded-xl hover:bg-[#fff1f2] dark:hover:bg-white/10 transition active:scale-95 shadow-sm">
            <Download size={15} /> Xuất Excel
          </button>
          <button onClick={refresh} className="p-2.5 bg-white dark:bg-white/[0.03] border border-[#efd7da] dark:border-white/5 rounded-xl hover:bg-[#fff1f2] dark:hover:bg-white/10 transition active:scale-95 shadow-sm">
            <RefreshCw size={16} className="text-[#7a1d22] dark:text-[#FFE8EC]" />
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-white/[0.03] backdrop-blur rounded-3xl p-5 border border-[#efd7da] dark:border-white/5 shadow-sm dark:shadow-inner flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-[#8b6b70] dark:text-white/40 uppercase tracking-wider mb-1">Được giao</p>
              <h4 className="text-2xl font-black text-[#241416] dark:text-white">{stats.totalAssigned}</h4>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Briefcase size={20} className="text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-white/[0.03] backdrop-blur rounded-3xl p-5 border border-[#efd7da] dark:border-white/5 shadow-sm dark:shadow-inner flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-[#8b6b70] dark:text-white/40 uppercase tracking-wider mb-1">Chưa xử lý</p>
              <h4 className="text-2xl font-black text-[#241416] dark:text-white">{stats.untreatedCount}</h4>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
              <Clock size={20} className="text-slate-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-white/[0.03] backdrop-blur rounded-3xl p-5 border border-[#efd7da] dark:border-white/5 shadow-sm dark:shadow-inner flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-[#8b6b70] dark:text-white/40 uppercase tracking-wider mb-1">Đã gửi</p>
              <h4 className="text-2xl font-black text-[#241416] dark:text-white">{stats.processingCount}</h4>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Activity size={20} className="text-[#E8231A]" />
            </div>
          </div>

          <div className="bg-white dark:bg-white/[0.03] backdrop-blur rounded-3xl p-5 border border-[#efd7da] dark:border-white/5 shadow-sm dark:shadow-inner flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-[#8b6b70] dark:text-white/40 uppercase tracking-wider mb-1">Trả lời</p>
              <h4 className="text-2xl font-black text-[#241416] dark:text-white">{stats.completedCount}</h4>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={20} className="text-emerald-500" />
            </div>
          </div>
        </div>
      )}

      {/* Progress detail */}
      {stats?.statusCounts && (
        <div className="bg-white dark:bg-white/[0.03] backdrop-blur p-5 rounded-3xl border border-[#efd7da] dark:border-white/5 shadow-sm">
          <p className="text-xs font-black text-[#8b6b70] dark:text-white/40 uppercase tracking-wider mb-4">Tiến độ chi tiết</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(stats.statusCounts as Record<string, number>).map(([s, count]) => {
              const pct = stats.totalAssigned > 0 ? +((count / stats.totalAssigned) * 100).toFixed(1) : 0
              return (
                <div key={s}>
                  <div className="flex justify-between text-xs font-semibold text-[#5f4246] dark:text-gray-300 mb-1.5">
                    <span>{s}</span><span>{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#f3eeee] dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s === "Chưa xử lý" ? "bg-slate-400" : s === "Chặn người lạ" ? "bg-amber-400" : s === "Đã gửi tin nhắn" ? "bg-blue-400" : s === "Không có Zalo" ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-white/[0.03] backdrop-blur p-4 rounded-2xl border border-[#efd7da] dark:border-white/5 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b6b70]" />
          <input type="text" placeholder="Tìm tên doanh nghiệp, địa chỉ, SĐT..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#efd7da] dark:border-white/10 rounded-xl bg-[#fffafa] dark:bg-white/[0.03] text-sm text-[#241416] dark:text-white placeholder-[#9a7a7f] dark:placeholder:text-white/30 focus:outline-none focus:border-[#E8231A]/50 focus:ring-1 focus:ring-[#E8231A]/20 transition" />
        </div>
        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "", label: "Tất cả trạng thái" },
            ...STATUSES.map(s => ({ value: s, label: s }))
          ]}
          className="w-full sm:w-52"
          heightClass="h-[42px]"
        />
        <CustomSelect
          value={String(pageSize)}
          onChange={val => setPageSize(val === "all" ? "all" : +val)}
          options={[
            ...[50, 100, 200].map(n => ({ value: String(n), label: `${n} dòng` })),
            { value: "all", label: "Tất cả" }
          ]}
          className="w-full sm:w-36"
          heightClass="h-[42px]"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-white/[0.03] backdrop-blur rounded-3xl border border-[#efd7da] dark:border-white/5 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#7f5f63]">
            <Loader2 size={28} className="animate-spin text-[#E8231A] mb-3" />
            <span className="text-sm font-semibold">Đang tải dữ liệu của bạn...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#7f5f63]">
            <Briefcase size={40} className="mb-3 stroke-1" />
            <p className="text-sm font-semibold">Chưa có data được giao</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-xs">
              <thead>
                <tr className="bg-[#fff1f2] dark:bg-white/5 border-b border-[#efd7da] dark:border-white/5">
                  {["ID", "Tên doanh nghiệp","Loại hình","Địa chỉ","Khu vực","SĐT","Website","Maps","Trạng thái","Lead","Ghi chú"].map(h => (
                    <th key={h} className="py-3 px-3 text-[10px] font-bold text-[#8b6b70] dark:text-white/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0dadd] dark:divide-white/5">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-[#fffafa] dark:hover:bg-white/5 transition">
                    <td className="py-2.5 px-3 font-mono text-[10px] text-[#8b6b70] dark:text-white/50 font-bold whitespace-nowrap">{(r.id || "").replace("crm-", "")}</td>
                    <td className="py-2.5 px-3 font-bold text-[#241416] dark:text-white max-w-[160px] break-words">{r.businessName}</td>
                    <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 bg-[#fff1f2] dark:bg-white/5 text-[#7a1d22] dark:text-white rounded text-[10px] font-semibold border border-[#efd7da] dark:border-white/10">{r.businessType || "—"}</span></td>
                    <td className="py-2.5 px-3 text-[#5f4246] dark:text-gray-200 max-w-[180px] break-words">{r.address}</td>
                    <td className="py-2.5 px-3 text-[#6f565a] dark:text-gray-300">{r.area}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <a href={`tel:${r.phone}`} className="text-[#241416] dark:text-[#FFE8EC] font-bold hover:text-[#E8231A] flex items-center"><Phone size={11} className="mr-1 text-[#8b6b70] dark:text-white/40" />{r.phone}</a>
                        <button onClick={() => navigator.clipboard.writeText(r.phone).then(() => notify("Đã copy SĐT!"))} className="p-0.5 text-[#8b6b70] dark:text-white/40 hover:text-[#E8231A] rounded hover:bg-[#fff1f2] dark:hover:bg-white/5 transition"><Copy size={11}/></button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">{r.website ? <a href={r.website} target="_blank" rel="noreferrer" className="inline-flex items-center text-[#E8231A] hover:text-[#B91C1C] font-semibold"><Globe size={11} className="mr-1" />Web</a> : <span className="text-[#b59da1] italic dark:text-white/30">—</span>}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">{r.googleMapUrl ? <a href={r.googleMapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-[#E8231A] hover:text-[#B91C1C] font-semibold"><MapPin size={11} className="mr-1" />Maps</a> : <span className="text-[#b59da1] italic dark:text-white/30">—</span>}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <CustomSelect
                        value={r.status ?? "Chưa xử lý"}
                        disabled={updatingId === r.id}
                        onChange={val => handleStatusChange(r.id, val)}
                        options={STATUSES.map(s => ({ value: s, label: s }))}
                        className={`min-w-[130px] rounded-full overflow-hidden text-[10px] font-bold ${statusColor(r.status)}`}
                        heightClass="h-[28px]"
                        menuClassName="text-left"
                      />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <CrmLeadCell
                        record={r}
                        converting={convertingId === r.id}
                        onOpenLead={onOpenLead}
                        onCreateNew={() => handleConvertToLead(r)}
                        fetchLeads={async (crmId) => {
                          const res = await api.crm.listLeadsForCrm(crmId)
                          return res.leads
                        }}
                        variant="staff"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      {editingNoteId === r.id
                        ? <input autoFocus type="text" value={tempNote} onChange={e => setTempNote(e.target.value)}
                            onBlur={() => handleSaveNote(r.id)}
                            onKeyDown={e => { if (e.key === "Enter") handleSaveNote(r.id); if (e.key === "Escape") setEditingNoteId(null) }}
                            className="w-full min-w-[90px] px-1.5 py-0.5 bg-white dark:bg-[#1C1C21] text-[#241416] dark:text-white border border-[#efd7da] dark:border-white/10 rounded text-xs focus:outline-none focus:border-[#E8231A]/50" />
                        : <div onClick={() => { setEditingNoteId(r.id); setTempNote(r.note ?? "") }} className="cursor-pointer hover:bg-[#fff1f2] dark:hover:bg-white/5 px-1 py-0.5 rounded min-h-[18px] min-w-[80px] max-w-[140px] break-words text-[#6f565a] dark:text-gray-300 font-medium">
                            {r.note || <span className="text-[#b59da1] italic text-[10px] dark:text-white/30">Thêm ghi chú...</span>}
                          </div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && records.length > 0 && (
          <div className="px-6 py-3 border-t border-[#efd7da] dark:border-white/5 bg-[#fffafa] dark:bg-white/5 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8b6b70] dark:text-white/40">Hiển thị <strong className="text-[#241416] dark:text-white">{records.length}</strong> / {total} data được giao</span>
            {total > records.length && <button onClick={() => setPageSize("all")} className="text-xs font-bold text-[#E8231A] hover:underline">Xem tất cả {total} →</button>}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(convertModalRecord)}
        onClose={() => { setConvertModalRecord(null); setConvertLeadName("") }}
        title="Tạo Lead từ CRM"
        footer={
          <>
            <ModalCancelButton onClick={() => { setConvertModalRecord(null); setConvertLeadName("") }} />
            <ModalSubmitButton onClick={() => void submitConvertToLead()} loading={Boolean(convertingId)} label="Tạo Lead" />
          </>
        }
      >
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500">Tên lead = tên cơ hội/deal. Khách hàng tự gom theo SĐT/công ty.</p>
          {convertModalRecord?.businessName && (
            <div className="rounded-xl bg-gray-50 border px-3 py-2 text-sm font-semibold text-gray-700">{convertModalRecord.businessName}</div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Tên lead (cơ hội) *</label>
            <input
              type="text"
              value={convertLeadName}
              onChange={(e) => setConvertLeadName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
              placeholder="VD: Website landing page chiến dịch hè"
              autoFocus
            />
          </div>
        </div>
      </Modal>
      </>
      )}
    </div>
  )
}
