import React, { useState, useEffect, useMemo } from "react"
import { api } from "@/lib/api"
import { Modal, ModalCancelButton, ModalSubmitButton } from "../ui/Modal"
import ConfirmModal from "../ui/ConfirmModal"
import { useToast } from "@/app/hooks/useToast"
import { CustomSelect } from "../ui/CustomSelect"
import { CrmLeadCell } from "./CrmLeadCell"
import { getChatSocket } from "@/lib/chatSocket"
import { StatCard } from "../ui/StatCard"
import { CustomCombobox } from "../ui/CustomCombobox"
import { AvatarCircle } from "../ui/AvatarCircle"
import {
  Search, Plus, Trash2, Edit3, UserPlus, Phone, Globe, MapPin,
  Loader2, RefreshCw, Database, UserCheck, UserMinus, Send,
  MessageSquare, FileSpreadsheet, Download, Users, Copy,
  CheckSquare, Square, SlidersHorizontal, BarChart3, Table2, X
} from "lucide-react"

const STATUSES_VN = ["Chua xu ly", "Chan nguoi la", "Da gui tin nhan", "Khong co Zalo", "Tra loi"]
const STATUSES_VN_DISPLAY = ["Chưa xử lý", "Chặn người lạ", "Đã gửi tin nhắn", "Không có Zalo", "Trả lời"]

function CrmBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Chưa xử lý": "bg-slate-100 text-slate-600 border border-slate-200",
    "Chặn người lạ": "bg-amber-100 text-amber-800 border border-amber-200",
    "Đã gửi tin nhắn": "bg-blue-100 text-blue-800 border border-blue-200",
    "Không có Zalo": "bg-red-600 text-white border border-red-700",
    "Trả lời": "bg-emerald-100 text-emerald-800 border border-emerald-200",
  }
  return (
    <span className={"inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold " + (map[status] ?? "bg-slate-100 text-slate-600")}>
      {status}
    </span>
  )
}

const emptyForm = {
  businessName: "",
  address: "",
  area: "",
  phone: "",
  website: "",
  businessType: "",
  googleMapUrl: "",
  status: "Chưa xử lý",
  note: ""
}

type TabType = "dashboard" | "data"

export function CrmAdminPage({ selectedBranch = "all", onOpenLead }: { selectedBranch?: string; onOpenLead?: (leadId: string) => void }) {
  const [tab, setTab] = useState<TabType>("dashboard")
  const [stats, setStats] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [dashboardPeriod, setDashboardPeriod] = useState<"all" | "today" | "week" | "month">("all")
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null)
  const [expandedStatusMap, setExpandedStatusMap] = useState<Record<string, string | null>>({})
  const [employees, setEmployees] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [assignedFilter, setAssignedFilter] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [pageSize, setPageSize] = useState<number | "all">(50)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [current, setCurrent] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [formErrors, setFormErrors] = useState<any>({})
  const [selectedEmpId, setSelectedEmpId] = useState("")
  const [autoAssignLoading, setAutoAssignLoading] = useState(false)
  const [autoAssignOpen, setAutoAssignOpen] = useState(false)
  const [autoAssignTab, setAutoAssignTab] = useState<"department" | "specific">("department")
  const [autoAssignDept, setAutoAssignDept] = useState("")
  const [autoAssignSpecificEmp, setAutoAssignSpecificEmp] = useState("")
  const [autoAssignQuantity, setAutoAssignQuantity] = useState("")
  const [autoAssignSelectedEmpIds, setAutoAssignSelectedEmpIds] = useState<string[]>([])
  const [reassignWarnOpen, setReassignWarnOpen] = useState(false)
  const [reassignWarnMsg, setReassignWarnMsg] = useState("")
  const [reassignAction, setReassignAction] = useState<{ onConfirm: () => void } | null>(null)
  const [importConfirmOpen, setImportConfirmOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [deleteBulkOpen, setDeleteBulkOpen] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [tempNote, setTempNote] = useState("")
  const [inlineAssignId, setInlineAssignId] = useState<string | null>(null)
  const [inlineAssignEmpId, setInlineAssignEmpId] = useState("")
  const [inlineAssignLoading, setInlineAssignLoading] = useState(false)
  const [confirmInlineOpen, setConfirmInlineOpen] = useState(false)
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const [deleteBulkLoading, setDeleteBulkLoading] = useState(false)
  const { showToast: notify } = useToast()
  const [convertModalRecord, setConvertModalRecord] = useState<any>(null)
  const [convertLeadName, setConvertLeadName] = useState("")

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
      const result = await api.crm.convertToLead(convertModalRecord.id, {
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

  const fetchStats = async () => {
    setStatsLoading(true)
    try { setStats(await api.crm.adminDashboard({ branchId: selectedBranch, period: dashboardPeriod })) } catch { } finally { setStatsLoading(false) }
  }

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const size = pageSize === "all" ? 100000 : pageSize
      const data = await api.crm.listData({ status: statusFilter, assignedTo: assignedFilter, search, page: 0, size, branchId: selectedBranch })
      setRecords(data?.content ?? [])
      setTotal(data?.totalElements ?? 0)
    } catch { } finally { setLoading(false) }
  }

  const fetchEmployees = async () => {
    try { setEmployees((await api.employees.list()) as any[]) } catch { }
  }

  const refresh = () => { fetchStats(); fetchRecords(); fetchEmployees() }
  useEffect(() => { refresh() }, [statusFilter, assignedFilter, search, pageSize, selectedBranch, dashboardPeriod])

  const refreshRef = React.useRef(refresh)
  useEffect(() => {
    refreshRef.current = refresh
  }, [refresh])

  useEffect(() => {
    let boundSocket: any = null

    const handleCrmChanged = () => {
      refreshRef.current()
    }

    const tryBind = () => {
      const socket = getChatSocket()
      if (socket) {
        if (boundSocket && boundSocket !== socket) {
          boundSocket.off("crm:changed", handleCrmChanged)
        }
        boundSocket = socket
        socket.on("crm:changed", handleCrmChanged)
      }
    }

    tryBind()
    window.addEventListener("dudi:chat-socket-connect", tryBind)

    return () => {
      if (boundSocket) {
        boundSocket.off("crm:changed", handleCrmChanged)
      }
      window.removeEventListener("dudi:chat-socket-connect", tryBind)
    }
  }, [])

  useEffect(() => {
    if (!autoAssignOpen) {
      setAutoAssignDept("")
      setAutoAssignSelectedEmpIds([])
      setAutoAssignSpecificEmp("")
      setAutoAssignQuantity("")
    }
  }, [autoAssignOpen])

  const validate = () => {
    const errs: any = {}
    if (!form.businessName.trim()) errs.businessName = "Không được để trống"
    if (!form.phone.trim()) errs.phone = "Không được để trống"
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
    if (selectedIds.length > 0) {
      const selectedRecords = records.filter(r => selectedIds.includes(r.id))
      const cannotReassign = selectedRecords.filter(r => r.status && r.status !== "Chưa xử lý")
      if (cannotReassign.length > 0) {
        notify(`Có ${cannotReassign.length} khách đã có trạng thái khác ngoài 'Chưa xử lý'. Không thể chia lại!`, "error")
        return
      }
    } else if (current) {
      if (current.status && current.status !== "Chưa xử lý") {
        notify("Khách đã có trạng thái khác ngoài 'Chưa xử lý'. Không thể chia lại!", "error")
        return
      }
    }
    try {
      if (selectedIds.length > 0) await api.crm.assignBulk(selectedIds, selectedEmpId)
      else if (current) await api.crm.assignOne(current.id, selectedEmpId)
      notify("Chia data thành công!"); setAssignOpen(false); setSelectedIds([]); refresh()
    } catch { notify("Lỗi khi chia data", "error") }
  }

  const handleDelete = async () => {
    if (!current) return
    try {
      await api.crm.deleteData(current.id)
      notify("Đã xóa!")
      refresh()
    } catch (err: any) {
      notify(err.message || "Không thể xóa", "error")
    }
  }

  const handleDeleteBulk = async () => {
    try {
      await api.crm.deleteBulk(selectedIds)
      notify("Đã xóa " + selectedIds.length + " mục")
      setSelectedIds([])
      refresh()
    } catch (err: any) {
      notify(err.message || "Lỗi xóa hàng loạt", "error")
    }
  }

  const submitAutoAssign = async () => {
    if (autoAssignTab === "department") {
      if (!autoAssignDept) { notify("Vui lòng chọn phòng ban", "error"); return }
      if (!autoAssignSelectedEmpIds.length) { notify("Vui lòng chọn ít nhất một nhân viên để chia data", "error"); return }
      
      setAutoAssignLoading(true)
      try {
        const r = await api.crm.autoAssign(autoAssignSelectedEmpIds)
        notify("Đã chia tự động " + (r?.assignedCount ?? 0) + " data cho phòng ban!")
        setAutoAssignOpen(false); refresh()
      } catch (err: any) { notify(err.message || "Lỗi chia tự động", "error") }
      finally { setAutoAssignLoading(false) }
    } else {
      if (!autoAssignSpecificEmp) { notify("Vui lòng chọn nhân viên", "error"); return }
      const q = parseInt(autoAssignQuantity, 10)
      if (isNaN(q) || q <= 0) { notify("Vui lòng nhập số lượng hợp lệ", "error"); return }
      
      setAutoAssignLoading(true)
      try {
        const r = await api.crm.assignSpecific(autoAssignSpecificEmp, q)
        notify("Đã giao " + (r?.assignedCount ?? 0) + " data cho nhân viên!")
        setAutoAssignOpen(false); refresh()
      } catch (err: any) { notify(err.message || "Lỗi giao data số lượng", "error") }
      finally { setAutoAssignLoading(false) }
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (!file) return
    setImportFile(file)
    setImportConfirmOpen(true)
    e.target.value = ""
  }

  const submitImport = async () => {
    if (!importFile) return
    setImportLoading(true)
    try {
      const r = await api.crm.importCsv(importFile)
      notify("Import " + (r?.successCount ?? 0) + " dòng thành công!")
      refresh()
    } catch { notify("Lỗi import file", "error") }
    finally { setImportLoading(false); setImportFile(null) }
  }

  const handleExport = () => {
    if (!records.length) { notify("Không có dữ liệu", "error"); return }
    let csv = "\uFEFFTên,Địa chỉ,Khu vực,SĐT,Website,Loại hình,Maps,Trạng thái,Nhân viên,Ghi chú\n"
    records.forEach(r => {
      csv += [r.businessName, r.address, r.area, r.phone, r.website, r.businessType, r.googleMapUrl, r.status, r.assignedToName ?? "", r.note ?? ""]
        .map(v => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(",") + "\n"
    })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
    a.download = "CRM_" + new Date().toISOString().slice(0, 10) + ".csv"
    a.click()
    notify("Xuất Excel thành công!")
  }

  const handleInlineAssignConfirm = async () => {
    if (!inlineAssignId) return
    const target = records.find(r => r.id === inlineAssignId)
    if (target && target.status && target.status !== "Chưa xử lý") {
      notify("Khách đã có trạng thái khác ngoài 'Chưa xử lý'. Không thể chia lại!", "error")
      setInlineAssignId(null)
      setInlineAssignEmpId("")
      return
    }
    setInlineAssignLoading(true)
    try {
      if (inlineAssignEmpId === "") {
        await api.crm.assignOne(inlineAssignId, "")
      } else {
        await api.crm.assignOne(inlineAssignId, inlineAssignEmpId)
      }
      notify("Phân công thành công!")
      setInlineAssignId(null)
      setInlineAssignEmpId("")
      refresh()
    } catch { notify("Lỗi phân công", "error") }
    finally { setInlineAssignLoading(false) }
  }

  const openAdd = () => { setCurrent(null); setForm({ ...emptyForm }); setFormErrors({}); setFormOpen(true) }
  const openEdit = (r: any) => {
    setCurrent(r)
    setForm({ businessName: r.businessName ?? "", address: r.address ?? "", area: r.area ?? "", phone: r.phone ?? "", website: r.website ?? "", businessType: r.businessType ?? "", googleMapUrl: r.googleMapUrl ?? "", status: r.status ?? "Chưa xử lý", note: r.note ?? "" })
    setFormErrors({})
    setFormOpen(true)
  }
  const openAssign = (r?: any) => {
    if (r) {
      if (r.status && r.status !== "Chưa xử lý") {
        notify("Khách đã có trạng thái khác ngoài 'Chưa xử lý'. Không thể chia lại!", "error")
        return
      }
      if (r.assignedTo) {
        setReassignWarnMsg(`Khách hàng "${r.businessName}" đã có người phụ trách. Bạn vẫn muốn chia lại chứ?`)
        setReassignAction({
          onConfirm: () => {
            setCurrent(r)
            setSelectedEmpId("")
            setAssignOpen(true)
          }
        })
        setReassignWarnOpen(true)
        return
      }
      setCurrent(r)
    } else {
      if (selectedIds.length > 0) {
        const selectedRecords = records.filter(rec => selectedIds.includes(rec.id))
        const cannotReassign = selectedRecords.filter(rec => rec.status && rec.status !== "Chưa xử lý")
        if (cannotReassign.length > 0) {
          notify(`Có ${cannotReassign.length} khách đã có trạng thái khác ngoài 'Chưa xử lý'. Không thể chia lại!`, "error")
          return
        }
        const alreadyAssigned = selectedRecords.filter(rec => rec.assignedTo)
        if (alreadyAssigned.length > 0) {
          setReassignWarnMsg(`Có ${alreadyAssigned.length} khách đã có người phụ trách. Bạn vẫn muốn chia lại chứ?`)
          setReassignAction({
            onConfirm: () => {
              setCurrent(null)
              setSelectedEmpId("")
              setAssignOpen(true)
            }
          })
          setReassignWarnOpen(true)
          return
        }
      }
      setCurrent(null)
    }
    setSelectedEmpId("")
    setAssignOpen(true)
  }
  const toggleAll = () => setSelectedIds(p => p.length === records.length ? [] : records.map(r => r.id))
  const toggleOne = (id: string) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const activeEmployees = useMemo(
    () => employees.filter(
      (e: any) => e.status === "active" && (selectedBranch === "all" || e.branchId === selectedBranch)
    ),
    [employees, selectedBranch]
  )

  const deptEmployees = useMemo(() => {
    if (!autoAssignDept) return []
    return activeEmployees.filter((e: any) => e.department === autoAssignDept)
  }, [activeEmployees, autoAssignDept])

  useEffect(() => {
    setAutoAssignSelectedEmpIds(deptEmployees.map((e: any) => e.id))
  }, [deptEmployees])

  const allEmployeesInBranch = employees.filter(
    (e: any) => selectedBranch === "all" || e.branchId === selectedBranch
  )

  const empOptions = activeEmployees.map((e: any) => ({ value: e.id, label: e.name }))
  const deptOptions = Array.from(new Set(activeEmployees.map((e: any) => e.department).filter(Boolean))).map(d => ({ value: d as string, label: d as string }))
  const inlineEmpOptions = [{ value: "", label: "Bỏ giao (để trống)" }, ...empOptions]
  const assignedFilterOptions = [
    { value: "", label: "Tất cả nhân viên" },
    { value: "unassigned", label: "Chưa giao" },
    ...allEmployeesInBranch.map((e: any) => ({ value: e.id, label: e.name }))
  ]
  const statusFilterOptions = [
    { value: "", label: "Tất cả trạng thái" },
    ...STATUSES_VN_DISPLAY.map(s => ({ value: s, label: s }))
  ]
  const pageSizeOptions = [
    { value: "50", label: "50 dòng" },
    { value: "100", label: "100 dòng" },
    { value: "200", label: "200 dòng" },
    { value: "all", label: "Tất cả" },
  ]

  const inlineAssignTarget = inlineAssignId ? records.find(r => r.id === inlineAssignId) : null
  const inlineAssignEmpName = inlineAssignEmpId
    ? (employees.find((e: any) => e.id === inlineAssignEmpId)?.name ?? "")
    : ""
  const confirmInlineMsg = inlineAssignEmpId
    ? ("Phân công data \"" + (inlineAssignTarget?.businessName ?? "") + "\" cho nhân viên \"" + inlineAssignEmpName + "\"?")
    : ("Bỏ giao data \"" + (inlineAssignTarget?.businessName ?? "") + "\"?")

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
            <h2 className="text-xl font-black tracking-tight text-white">Quản lý Lead</h2>
            <p className="text-xs text-white/80 mt-1">Quản lý data Lead và phân công nhân viên</p>
          </div>
        </div>
        <button onClick={refresh} className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition">
          <RefreshCw size={16} className="text-white" />
        </button>
      </div>

      <div className="flex w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-1 gap-1">
        <button
          onClick={() => setTab("dashboard")}
          className={tab === "dashboard" ? "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl bg-[#C62828] text-white shadow-sm transition" : "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl text-gray-500 hover:bg-gray-50 transition"}
        >
          <BarChart3 size={14} /> Dashboard
        </button>
        <button
          onClick={() => setTab("data")}
          className={tab === "data" ? "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl bg-[#C62828] text-white shadow-sm transition" : "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl text-gray-500 hover:bg-gray-50 transition"}
        >
          <Table2 size={14} /> Dữ liệu
        </button>
      </div>

      {stats && (
        <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3 text-xs font-bold text-amber-800 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${(stats.unassignedData ?? 0) > 0 ? "bg-amber-500" : "bg-emerald-500"}`}></span>
            <span>Còn {stats.unassignedData ?? 0} data chưa chia</span>
          </div>
          {tab !== "data" && (
            <button
              onClick={() => setTab("data")}
              className="text-[10px] uppercase tracking-wider text-amber-700 hover:text-amber-900 underline cursor-pointer"
            >
              Xem ngay
            </button>
          )}
        </div>
      )}


      {tab === "dashboard" && (
        <div className="space-y-5">
          {statsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-[#C62828]" />
            </div>
          ) : stats && (
            <div>
              {/* Period Filter Selector */}
              <div className="flex bg-gray-100/80 p-1 rounded-2xl border border-gray-200/50 mb-5 max-w-xs">
                {[
                  { value: "all", label: "Tất cả" },
                  { value: "today", label: "Hôm nay" },
                  { value: "week", label: "Tuần này" },
                  { value: "month", label: "Tháng này" }
                ].map(p => (
                  <button
                    key={p.value}
                    onClick={() => setDashboardPeriod(p.value as any)}
                    className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      dashboardPeriod === p.value
                        ? "bg-[#C62828] text-white shadow-xs"
                        : "text-gray-500 hover:text-[#C62828]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
                <StatCard title="Tổng data" value={stats.totalData} icon={Database} iconBg="bg-slate-100" iconColor="text-slate-500" />
                <StatCard title="Đã chia" value={stats.assignedData} icon={UserCheck} iconBg="bg-blue-50" iconColor="text-blue-500" />
                <StatCard title="Chưa chia" value={stats.unassignedData} icon={UserMinus} iconBg="bg-amber-50" iconColor="text-amber-500" />
                <StatCard title={dashboardPeriod !== "all" ? "Đã gửi (Kỳ)" : "Đã gửi"} value={dashboardPeriod !== "all" ? (stats.statusCounts?.["Đã gửi tin nhắn"] ?? 0) : (stats.totalData - (stats.statusCounts?.["Chưa xử lý"] ?? 0))} icon={Send} iconBg="bg-purple-50" iconColor="text-purple-500" />
                <StatCard title={dashboardPeriod !== "all" ? "Trả lời (Kỳ)" : "Trả lời"} value={stats.statusCounts?.["Trả lời"] ?? 0} icon={MessageSquare} iconBg="bg-emerald-50" iconColor="text-emerald-500" />
              </div>
              <div className="space-y-5">
                <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs space-y-4">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Trạng thái xử lý</p>
                  {(() => {
                    const totalForPct = dashboardPeriod === "all"
                      ? stats.totalData
                      : (stats.statusCounts?.["Chặn người lạ"] ?? 0) +
                        (stats.statusCounts?.["Đã gửi tin nhắn"] ?? 0) +
                        (stats.statusCounts?.["Không có Zalo"] ?? 0) +
                        (stats.statusCounts?.["Trả lời"] ?? 0)
                    
                    const displayStatuses = dashboardPeriod === "all"
                      ? STATUSES_VN_DISPLAY
                      : STATUSES_VN_DISPLAY.filter(s => s !== "Chưa xử lý")

                    return displayStatuses.map(s => {
                      const count = stats.statusCounts?.[s] ?? 0
                      const pct = totalForPct > 0 ? +((count / totalForPct) * 100).toFixed(1) : 0
                      return (
                        <div key={s}>
                          <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                            <span>{s}</span><span>{count} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={s === "Chưa xử lý" ? "h-full rounded-full bg-slate-300" : s === "Chặn người lạ" ? "h-full rounded-full bg-amber-400" : s === "Đã gửi tin nhắn" ? "h-full rounded-full bg-blue-400" : s === "Không có Zalo" ? "h-full rounded-full bg-red-500" : "h-full rounded-full bg-emerald-500"}
                              style={{ width: pct + "%" }}
                            />
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>

                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-4">
                  <div className="border-b border-gray-100 pb-3">
                    <p className="text-xs font-black text-gray-600 uppercase tracking-wider">Tiến độ nhân viên</p>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">Bấm vào từng nhân viên để xem chi tiết trạng thái và danh sách khách hàng</p>
                  </div>
                  {!stats.employeeProgress?.length ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <Users size={32} className="mb-2 stroke-1" />
                      <p className="text-sm">Chưa có dữ liệu</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto border border-gray-200 rounded-xl">
                        <table className="w-full min-w-[640px] text-sm border-collapse">
                          <thead>
                            <tr className="bg-gray-50 text-gray-600">
                              <th className="border border-gray-200 px-4 py-2.5 text-left text-xs font-bold whitespace-nowrap">Nhân viên</th>
                              <th className="border border-gray-200 px-3 py-2.5 text-center text-xs font-bold whitespace-nowrap">Tổng</th>
                              <th className="border border-gray-200 px-3 py-2.5 text-center text-xs font-bold whitespace-nowrap">Đã gửi</th>
                              <th className="border border-gray-200 px-3 py-2.5 text-center text-xs font-bold whitespace-nowrap">Chặn</th>
                              {!stats.employeeProgress.some((e: any) => e.isTimeBound) && (
                                <th className="border border-gray-200 px-3 py-2.5 text-center text-xs font-bold whitespace-nowrap">Chưa xử lý</th>
                              )}
                              <th className="border border-gray-200 px-3 py-2.5 text-center text-xs font-bold whitespace-nowrap">Trả lời</th>
                              <th className="border border-gray-200 px-3 py-2.5 text-center text-xs font-bold whitespace-nowrap">Ko Zalo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.employeeProgress.map((emp: any) => {
                              const isExpanded = expandedEmpId === emp.employeeId
                              const showUntreated = !emp.isTimeBound
                              const colSpan = showUntreated ? 7 : 6

                              return (
                                <React.Fragment key={emp.employeeId}>
                                  <tr
                                    onClick={() => {
                                      setExpandedEmpId(isExpanded ? null : emp.employeeId)
                                      setExpandedStatusMap(prev => ({ ...prev, [emp.employeeId]: null }))
                                    }}
                                    className={`cursor-pointer transition-colors ${isExpanded ? "bg-red-50/60" : "hover:bg-gray-50/80"}`}
                                  >
                                    <td className="border border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-900 whitespace-nowrap">
                                      {emp.employeeName}
                                      <span className="block text-[10px] font-mono text-gray-400 mt-0.5">{emp.employeeId}</span>
                                    </td>
                                    <td className="border border-gray-200 px-3 py-2.5 text-center font-bold text-gray-900 tabular-nums">{emp.totalAssigned}</td>
                                    <td className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-blue-700 tabular-nums">{emp.processingCount || ""}</td>
                                    <td className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-amber-700 tabular-nums">{emp.blockedCount || ""}</td>
                                    {showUntreated && (
                                      <td className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-gray-500 tabular-nums">{emp.untreatedCount || ""}</td>
                                    )}
                                    <td className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-emerald-700 tabular-nums">{emp.completedCount || ""}</td>
                                    <td className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-red-600 tabular-nums">{emp.noZaloCount || ""}</td>
                                  </tr>
                                  {isExpanded && (
                                    <tr>
                                      <td colSpan={colSpan} className="border border-gray-200 bg-gray-50/50 p-4">
                                        <div className="space-y-3">
                                          <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Chọn trạng thái để xem danh sách khách:</p>
                                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                            {STATUSES_VN_DISPLAY.filter(status => !emp.isTimeBound || status !== "Chưa xử lý").map(status => {
                                              const list = emp.details?.[status] ?? []
                                              const count = list.length
                                              const isSelected = expandedStatusMap[emp.employeeId] === status

                                              return (
                                                <button
                                                  key={status}
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (count === 0) return
                                                    setExpandedStatusMap(prev => ({
                                                      ...prev,
                                                      [emp.employeeId]: isSelected ? null : status
                                                    }))
                                                  }}
                                                  disabled={count === 0}
                                                  className={`p-2.5 rounded-xl border text-left transition ${
                                                    count === 0
                                                      ? "bg-gray-50/70 border-gray-100 opacity-50 cursor-not-allowed text-gray-400"
                                                      : isSelected
                                                        ? "bg-red-50 border-[#C62828] text-[#C62828] ring-1 ring-[#C62828]/30 shadow-xs"
                                                        : "bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700 cursor-pointer"
                                                  }`}
                                                >
                                                  <div className={`text-[10px] font-black uppercase tracking-wide ${count === 0 ? "text-gray-400" : isSelected ? "text-[#C62828]" : "text-gray-600"}`}>
                                                    {status}
                                                  </div>
                                                  <div className={`text-xs font-black mt-0.5 ${count === 0 ? "text-gray-400" : isSelected ? "text-[#C62828]" : "text-gray-900"}`}>
                                                    {count} khách
                                                  </div>
                                                </button>
                                              )
                                            })}
                                          </div>

                                          {(() => {
                                            const activeStatus = expandedStatusMap[emp.employeeId]
                                            if (!activeStatus) return null
                                            const list = emp.details?.[activeStatus] ?? []
                                            if (list.length === 0) return null

                                            return (
                                              <div className="mt-3 bg-white rounded-2xl p-4 border border-gray-200 space-y-3">
                                                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                                  <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
                                                    Danh sách khách — {activeStatus} ({list.length})
                                                  </span>
                                                </div>
                                                <div className="max-h-60 overflow-y-auto overflow-x-hidden">
                                                  <table className="w-full text-xs text-left">
                                                    <thead>
                                                      <tr className="text-gray-600 font-extrabold border-b border-gray-200 text-[11px] uppercase tracking-wider">
                                                        <th className="py-2.5 px-3">Doanh nghiệp / Khách</th>
                                                        <th className="py-2.5 px-3">SĐT</th>
                                                        <th className="py-2.5 px-3">Thời gian cập nhật</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 text-gray-700 font-medium">
                                                      {list.map((item: any) => {
                                                        const dateObj = new Date(item.updatedAt)
                                                        let timeStr = "--:--"
                                                        let dateStr = ""
                                                        if (!isNaN(dateObj.getTime())) {
                                                          const hours = String(dateObj.getHours()).padStart(2, "0")
                                                          const minutes = String(dateObj.getMinutes()).padStart(2, "0")
                                                          const day = String(dateObj.getDate()).padStart(2, "0")
                                                          const month = String(dateObj.getMonth() + 1).padStart(2, "0")
                                                          const year = dateObj.getFullYear()
                                                          timeStr = `${hours}:${minutes}`
                                                          dateStr = `${day}/${month}/${year}`
                                                        }
                                                        return (
                                                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="py-2.5 px-3 font-bold text-gray-900">{item.businessName || "Không có tên"}</td>
                                                            <td className="py-2.5 px-3 font-mono text-gray-800">
                                                              {item.phone ? (
                                                                <div className="flex items-center gap-1.5">
                                                                  <span>{item.phone}</span>
                                                                  <button
                                                                    onClick={(e) => {
                                                                      e.stopPropagation()
                                                                      navigator.clipboard.writeText(item.phone)
                                                                      notify("Đã sao chép số điện thoại!")
                                                                    }}
                                                                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 cursor-pointer"
                                                                    title="Sao chép SĐT"
                                                                  >
                                                                    <Copy size={11} />
                                                                  </button>
                                                                </div>
                                                              ) : "--"}
                                                            </td>
                                                            <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                                                              <span className="font-extrabold text-gray-900">{timeStr}</span>
                                                              <span className="text-gray-400 mx-2">|</span>
                                                              <span className="text-gray-700">{dateStr}</span>
                                                            </td>
                                                          </tr>
                                                        )
                                                      })}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              </div>
                                            )
                                          })()}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              )
                            })}
                            <tr className="bg-gray-50 font-bold text-gray-800">
                              <td className="border border-gray-200 px-4 py-2.5 text-left text-xs uppercase tracking-wide">Tổng cộng</td>
                              <td className="border border-gray-200 px-3 py-2.5 text-center tabular-nums">
                                {stats.employeeProgress.reduce((s: number, e: any) => s + e.totalAssigned, 0)}
                              </td>
                              <td className="border border-gray-200 px-3 py-2.5 text-center text-blue-700 tabular-nums">
                                {stats.employeeProgress.reduce((s: number, e: any) => s + (e.processingCount || 0), 0) || ""}
                              </td>
                              <td className="border border-gray-200 px-3 py-2.5 text-center text-amber-700 tabular-nums">
                                {stats.employeeProgress.reduce((s: number, e: any) => s + (e.blockedCount || 0), 0) || ""}
                              </td>
                              {!stats.employeeProgress.some((e: any) => e.isTimeBound) && (
                                <td className="border border-gray-200 px-3 py-2.5 text-center text-gray-500 tabular-nums">
                                  {stats.employeeProgress.reduce((s: number, e: any) => s + (e.untreatedCount || 0), 0) || ""}
                                </td>
                              )}
                              <td className="border border-gray-200 px-3 py-2.5 text-center text-emerald-700 tabular-nums">
                                {stats.employeeProgress.reduce((s: number, e: any) => s + (e.completedCount || 0), 0) || ""}
                              </td>
                              <td className="border border-gray-200 px-3 py-2.5 text-center text-red-600 tabular-nums">
                                {stats.employeeProgress.reduce((s: number, e: any) => s + (e.noZaloCount || 0), 0) || ""}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "data" && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 justify-between">
            <div className="relative flex-1 max-w-lg">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm tên doanh nghiệp, địa chỉ, SĐT..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]/50 transition"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedIds.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openAssign()}
                    className="flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition"
                  >
                    <UserPlus size={14} className="mr-1.5" /> {"Chia (" + selectedIds.length + ")"}
                  </button>
                  <button
                    onClick={() => setDeleteBulkOpen(true)}
                    className="flex items-center px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition"
                  >
                    <Trash2 size={14} className="mr-1.5" /> {"Xóa (" + selectedIds.length + ")"}
                  </button>
                </div>
              )}
              <button
                onClick={() => setAutoAssignOpen(true)}
                disabled={autoAssignLoading}
                className="flex items-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-60"
              >
                {autoAssignLoading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <UserPlus size={14} className="mr-1.5" />}
                Chia tự động
              </button>
              <button
                onClick={openAdd}
                className="flex items-center px-4 py-2.5 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-sm font-bold transition shadow-sm shadow-red-600/20"
              >
                <Plus size={14} className="mr-1.5" /> Thêm mới
              </button>
              <label className={"flex items-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-xl text-sm font-bold transition cursor-pointer " + (importLoading ? "opacity-60 pointer-events-none" : "")}>
                {importLoading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <FileSpreadsheet size={14} className="mr-1.5 text-[#C62828]" />}
                Import CSV
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImport} />
              </label>
              <button
                onClick={handleExport}
                className="flex items-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-xl text-sm font-bold transition"
              >
                <Download size={14} className="mr-1.5" /> Xuất Excel
              </button>
              <button
                onClick={() => setShowFilters(v => !v)}
                className={"flex items-center px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold transition " + (showFilters ? "bg-gray-100 text-gray-800" : "bg-white text-gray-600 hover:bg-gray-50")}
              >
                <SlidersHorizontal size={14} className="mr-1.5" /> Bộ lọc
              </button>
            </div>
          </div>



          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-gray-200">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trạng thái</label>
                <CustomCombobox
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={statusFilterOptions}
                  placeholder="Tất cả trạng thái"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nhân viên</label>
                <CustomCombobox
                  value={assignedFilter}
                  onChange={setAssignedFilter}
                  options={assignedFilterOptions}
                  placeholder="Tất cả nhân viên"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số dòng</label>
                <CustomCombobox
                  value={String(pageSize)}
                  onChange={v => setPageSize(v === "all" ? "all" : +v)}
                  options={pageSizeOptions}
                  placeholder="Số dòng"
                />
              </div>
            </div>
          )}

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
                <table className="w-full min-w-[1100px] text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="py-3 px-3 w-8">
                        <button onClick={toggleAll}>
                          {selectedIds.length === records.length
                            ? <CheckSquare size={15} className="text-[#C62828]" />
                            : <Square size={15} className="text-gray-400" />}
                        </button>
                      </th>
                      {["ID", "Tên doanh nghiệp", "Loại hình", "Địa chỉ", "Khu vực", "SĐT", "Website", "Maps", "Trạng thái", "Nhân viên", "Lead", "Ghi chú", ""].map(h => (
                        <th key={h} className="py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map(r => (
                      <tr key={r.id} className={"group hover:bg-gray-50/60 transition " + (selectedIds.includes(r.id) ? "bg-red-50/20" : "")}>
                        <td className="py-2 px-3">
                          <button onClick={() => toggleOne(r.id)}>
                            {selectedIds.includes(r.id)
                              ? <CheckSquare size={15} className="text-[#C62828]" />
                              : <Square size={15} className="text-gray-400" />}
                          </button>
                        </td>
                        <td className="py-2 px-2 font-mono text-[10px] text-gray-400 font-bold whitespace-nowrap">{(r.id || "").replace("crm-", "")}</td>
                        <td className="py-2 px-2 font-bold text-gray-800 max-w-[160px] break-words">{r.businessName}</td>
                        <td className="py-2 px-2">
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold border border-gray-200">
                            {r.businessType || "-"}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-gray-700 max-w-[180px] break-words">{r.address}</td>
                        <td className="py-2 px-2 text-gray-600">{r.area}</td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <a href={"tel:" + r.phone} className="text-gray-700 font-bold hover:text-[#C62828] flex items-center">
                              <Phone size={11} className="mr-1 text-gray-400" />{r.phone}
                            </a>
                            <button
                              onClick={() => navigator.clipboard.writeText(r.phone).then(() => notify("Đã copy SĐT!"))}
                              className="p-0.5 text-gray-400 hover:text-[#C62828] rounded hover:bg-gray-100 transition"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          {r.website
                            ? <a href={r.website} target="_blank" rel="noreferrer" className="inline-flex items-center text-blue-500 hover:underline font-semibold"><Globe size={11} className="mr-1" />Web</a>
                            : <span className="text-gray-300 italic">-</span>}
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          {r.googleMapUrl
                            ? <a href={r.googleMapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-blue-500 hover:underline font-semibold"><MapPin size={11} className="mr-1" />Maps</a>
                            : <span className="text-gray-300 italic">-</span>}
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          <CrmBadge status={r.status ?? "Chưa xử lý"} />
                        </td>

                        <td className="py-2 px-2 whitespace-nowrap min-w-[180px]">
                          {inlineAssignId === r.id ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 min-w-[120px]">
                                <CustomCombobox
                                  value={inlineAssignEmpId}
                                  onChange={setInlineAssignEmpId}
                                  options={inlineEmpOptions}
                                  placeholder="Chọn nhân viên"
                                  heightClass="h-[30px]"
                                />
                              </div>
                              <button
                                onClick={() => setConfirmInlineOpen(true)}
                                disabled={inlineAssignLoading}
                                className="p-1.5 bg-[#C62828] text-white rounded-lg hover:bg-[#B71C1C] transition disabled:opacity-60"
                              >
                                {inlineAssignLoading ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                              </button>
                              <button
                                onClick={() => { setInlineAssignId(null); setInlineAssignEmpId("") }}
                                className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : r.assignedToName ? (
                            <div
                              className="flex items-center gap-1.5 cursor-pointer group/cell"
                              onClick={() => {
                                if (r.status && r.status !== "Chưa xử lý") {
                                  notify("Khách đã có trạng thái khác ngoài 'Chưa xử lý'. Không thể chia lại!", "error")
                                  return
                                }
                                setReassignWarnMsg(`Khách hàng "${r.businessName}" đã có người phụ trách. Bạn vẫn muốn chia lại chứ?`)
                                setReassignAction({
                                  onConfirm: () => {
                                    setInlineAssignId(r.id)
                                    setInlineAssignEmpId(r.assignedTo ?? "")
                                  }
                                })
                                setReassignWarnOpen(true)
                              }}
                            >
                              <AvatarCircle name={r.assignedToName} avatar={employees.find(e => e.id === r.assignedTo)?.avatar} size="sm" />
                              <span className="text-xs font-semibold text-gray-700">{r.assignedToName}</span>
                              <Edit3 size={11} className="text-gray-300 opacity-0 group-hover/cell:opacity-100 transition ml-0.5" />
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (r.status && r.status !== "Chưa xử lý") {
                                  notify("Khách đã có trạng thái khác ngoài 'Chưa xử lý'. Không thể chia lại!", "error")
                                  return
                                }
                                setInlineAssignId(r.id)
                                setInlineAssignEmpId("")
                              }}
                              className="flex items-center gap-1 px-2 py-1 border border-dashed border-gray-300 rounded-lg text-[10px] font-semibold text-gray-400 hover:border-[#C62828] hover:text-[#C62828] transition"
                            >
                              <UserPlus size={11} /> Chưa giao
                            </button>
                          )}
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          <CrmLeadCell
                            record={r}
                            converting={convertingId === r.id}
                            onOpenLead={onOpenLead}
                            onCreateNew={() => handleConvertToLead(r)}
                            fetchLeads={async (crmId) => {
                              const res = await api.crm.listLeadsForCrm(crmId)
                              return res.leads
                            }}
                          />
                        </td>
                        <td className="py-2 px-2">
                          {editingNoteId === r.id ? (
                            <input
                              autoFocus
                              type="text"
                              value={tempNote}
                              onChange={e => setTempNote(e.target.value)}
                              onBlur={async () => {
                                try {
                                  await api.crm.updateNote(r.id, tempNote)
                                  setRecords(p => p.map(x => x.id === r.id ? { ...x, note: tempNote } : x))
                                  notify("Đã lưu ghi chú!")
                                } catch { } finally { setEditingNoteId(null) }
                              }}
                              onKeyDown={e => { if (e.key === "Escape") setEditingNoteId(null) }}
                              className="w-full min-w-[90px] px-1.5 py-0.5 border border-[#C62828]/50 rounded text-xs focus:outline-none"
                            />
                          ) : (
                            <div
                              onClick={() => { setEditingNoteId(r.id); setTempNote(r.note ?? "") }}
                              className="cursor-pointer hover:bg-gray-100/80 px-1 py-0.5 rounded min-h-[18px] min-w-[80px] max-w-[140px] break-words text-gray-600 font-medium"
                            >
                              {r.note || <span className="text-gray-300 italic text-[10px]">Thêm ghi chú...</span>}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                              <Edit3 size={13} />
                            </button>
                            <button onClick={() => openAssign(r)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition">
                              <UserPlus size={13} />
                            </button>
                            <button onClick={() => { setCurrent(r); setDeleteOpen(true) }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                              <Trash2 size={13} />
                            </button>
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
                <span className="text-xs font-semibold text-gray-400">
                  Hiển thị <strong className="text-gray-600">{records.length}</strong> / {total}
                </span>
                {total > records.length && (
                  <button onClick={() => setPageSize("all")} className="text-xs font-bold text-[#C62828] hover:underline">
                    {"Xem tất cả " + total + " ->"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmInlineOpen}
        onClose={() => setConfirmInlineOpen(false)}
        onConfirm={() => {
          setConfirmInlineOpen(false)
          handleInlineAssignConfirm()
        }}
        title="Xác nhận phân công"
        message={confirmInlineMsg}
        confirmText="Xác nhận"
        type="info"
      />

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { setDeleteOpen(false); handleDelete() }}
        title="Xác nhận xóa"
        message={"Bạn chắc chắn muốn xóa data \"" + (current?.businessName ?? "") + "\"? Hành động này không thể hoàn tác."}
        confirmText="Xóa"
        type="danger"
      />

      <ConfirmModal
        isOpen={reassignWarnOpen}
        onClose={() => {
          setReassignWarnOpen(false)
          setReassignAction(null)
        }}
        onConfirm={() => {
          setReassignWarnOpen(false)
          reassignAction?.onConfirm()
          setReassignAction(null)
        }}
        title="Cảnh báo chia lại data"
        message={reassignWarnMsg}
        confirmText="Xác nhận"
        type="warning"
      />

      <ConfirmModal
        isOpen={importConfirmOpen}
        onClose={() => {
          setImportConfirmOpen(false)
          setImportFile(null)
        }}
        onConfirm={() => {
          setImportConfirmOpen(false)
          submitImport()
        }}
        title="Xác nhận import file"
        message={importFile ? `Bạn có chắc chắn muốn import file "${importFile.name}"?` : ""}
        confirmText="Xác nhận"
        type="info"
      />

      <ConfirmModal
        isOpen={deleteBulkOpen}
        onClose={() => setDeleteBulkOpen(false)}
        onConfirm={() => {
          setDeleteBulkOpen(false)
          handleDeleteBulk()
        }}
        title="Xác nhận xóa hàng loạt"
        message={`Bạn chắc chắn muốn xoá ${selectedIds.length} mục đã chọn? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        type="danger"
      />

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={selectedIds.length > 0 ? ("Chia data cho " + selectedIds.length + " mục") : "Phân công nhân viên"}
        icon={UserPlus}
        width="sm"
        footer={
          <div className="flex gap-3">
            <ModalCancelButton onClick={() => setAssignOpen(false)} />
            <ModalSubmitButton onClick={handleAssign} label="Phân công" disabled={!selectedEmpId} />
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Chọn nhân viên</p>
          <CustomCombobox
            value={selectedEmpId}
            onChange={setSelectedEmpId}
            options={empOptions}
            placeholder="Tìm và chọn nhân viên..."
            showSearchIcon
          />
        </div>
      </Modal>

      <Modal
        open={autoAssignOpen}
        onClose={() => setAutoAssignOpen(false)}
        title="Chia Data Tự Động"
        icon={UserPlus}
        width="md"
        footer={
          <div className="flex gap-3">
            <ModalCancelButton onClick={() => setAutoAssignOpen(false)} />
            <ModalSubmitButton onClick={submitAutoAssign} label="Xác nhận chia" disabled={autoAssignLoading} />
          </div>
        }
      >
        <div className="p-6 space-y-5">
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setAutoAssignTab("department")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${autoAssignTab === "department" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:bg-gray-200"}`}
            >
              Theo phòng ban
            </button>
            <button
              onClick={() => setAutoAssignTab("specific")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${autoAssignTab === "specific" ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:bg-gray-200"}`}
            >
              Theo nhân viên
            </button>
          </div>

          {autoAssignTab === "department" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-xs font-medium border border-blue-100">
                Data sẽ được ưu tiên chia đều cho các nhân sự thuộc phòng ban được chọn (ưu tiên người đang có ít data hơn).
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chọn phòng ban</label>
                <CustomCombobox
                  value={autoAssignDept}
                  onChange={setAutoAssignDept}
                  options={deptOptions}
                  placeholder="Chọn một phòng ban..."
                  showSearchIcon
                />
              </div>

              {autoAssignDept && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-500 uppercase">
                      Nhân sự nhận data ({autoAssignSelectedEmpIds.length}/{deptEmployees.length})
                    </label>
                    {deptEmployees.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (autoAssignSelectedEmpIds.length === deptEmployees.length) {
                            setAutoAssignSelectedEmpIds([])
                          } else {
                            setAutoAssignSelectedEmpIds(deptEmployees.map((e: any) => e.id))
                          }
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                      >
                        {autoAssignSelectedEmpIds.length === deptEmployees.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                      </button>
                    )}
                  </div>

                  {deptEmployees.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Không có nhân viên hoạt động trong phòng ban này.</p>
                  ) : (
                    <div className="border border-gray-100 rounded-xl bg-gray-50/50 max-h-48 overflow-y-auto divide-y divide-gray-50 p-2 space-y-1">
                      {deptEmployees.map((emp: any) => {
                        const isChecked = autoAssignSelectedEmpIds.includes(emp.id)
                        return (
                          <div
                            key={emp.id}
                            onClick={() => {
                              if (isChecked) {
                                setAutoAssignSelectedEmpIds(p => p.filter(id => id !== emp.id))
                              } else {
                                setAutoAssignSelectedEmpIds(p => [...p, emp.id])
                              }
                            }}
                            className="flex items-center gap-3 px-3 py-1.5 hover:bg-gray-100/50 rounded-lg cursor-pointer transition animate-in fade-in duration-100"
                          >
                            <span className="shrink-0 text-gray-400 hover:text-[#C62828] transition">
                              {isChecked ? (
                                <CheckSquare size={16} className="text-[#C62828]" />
                              ) : (
                                <Square size={16} />
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              <AvatarCircle name={emp.name} avatar={emp.avatar} size="sm" />
                              <div className="text-xs">
                                <p className="font-bold text-gray-800">{emp.name}</p>
                                <p className="text-[10px] text-gray-400 font-mono">{emp.id}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {autoAssignTab === "specific" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3 bg-purple-50 text-purple-800 rounded-xl text-xs font-medium border border-purple-100">
                Bốc đích danh số lượng khách trống để giao cho một nhân viên cụ thể.
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chọn nhân viên</label>
                <CustomCombobox
                  value={autoAssignSpecificEmp}
                  onChange={setAutoAssignSpecificEmp}
                  options={empOptions}
                  placeholder="Chọn một nhân viên..."
                  showSearchIcon
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số lượng Data muốn giao</label>
                <input
                  type="number"
                  value={autoAssignQuantity}
                  onChange={e => setAutoAssignQuantity(e.target.value)}
                  placeholder="Ví dụ: 10"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={current ? "Sửa thông tin Data" : "Thêm Data mới"}
        icon={Database}
        width="xl"
        footer={
          <div className="flex gap-3">
            <ModalCancelButton onClick={() => setFormOpen(false)} />
            <ModalSubmitButton onClick={handleFormSubmit} label={current ? "Cập nhật" : "Thêm mới"} />
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên doanh nghiệp *</label>
              <input
                type="text"
                value={form.businessName}
                onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                className={"w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 " + (formErrors.businessName ? "border-red-400" : "border-gray-200")}
                placeholder="Ví dụ: Công ty ABC"
              />
              {formErrors.businessName && <p className="text-red-500 text-xs mt-1">{formErrors.businessName}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số điện thoại *</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={"w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 " + (formErrors.phone ? "border-red-400" : "border-gray-200")}
                placeholder="0901234567"
              />
              {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Địa chỉ</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none"
                placeholder="86 Đường ABC"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Khu vực</label>
              <input
                type="text"
                value={form.area}
                onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none"
                placeholder="TP. Ho Chi Minh"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Loại hình</label>
              <input
                type="text"
                value={form.businessType}
                onChange={e => setForm(f => ({ ...f, businessType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none"
                placeholder="Công nghệ, Ăn uống..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Website</label>
              <input
                type="text"
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Google Maps URL</label>
              <input
                type="text"
                value={form.googleMapUrl}
                onChange={e => setForm(f => ({ ...f, googleMapUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none"
                placeholder="https://maps.google.com/..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trạng thái</label>
              <CustomSelect
                value={form.status}
                onChange={val => setForm(f => ({ ...f, status: val }))}
                options={STATUSES_VN_DISPLAY.map(s => ({ value: s, label: s }))}
                className="w-full"
                heightClass="h-[42px]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ghi chú</label>
            <textarea
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none resize-none"
              placeholder="Ghi chú thêm..."
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(convertModalRecord)}
        onClose={() => { setConvertModalRecord(null); setConvertLeadName("") }}
        title="Tạo Lead từ CRM"
        footer={
          <>
            <ModalCancelButton onClick={() => { setConvertModalRecord(null); setConvertLeadName("") }} />
            <ModalSubmitButton
              onClick={() => void submitConvertToLead()}
              loading={Boolean(convertingId)}
              label="Tạo Lead"
            />
          </>
        }
      >
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong>Khách hàng</strong> lưu theo SĐT/tên công ty. <strong>Tên lead</strong> (VD: Website bán hàng Q2/2026).
          </p>
          {convertModalRecord?.businessName && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 text-sm text-gray-700">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Doanh nghiệp CRM</span>
              <p className="font-semibold mt-0.5">{convertModalRecord.businessName}</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Tên lead *</label>
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
    </div>
  )
}
