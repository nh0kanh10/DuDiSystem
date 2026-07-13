import React, { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { 
  CheckSquare, Plus, Edit2, Trash2, RefreshCw, Briefcase, X
} from "lucide-react"
import { Employee, OrgNode } from "../../types"
import { api } from "@/lib/api"
import { mergeTaskList, subscribeTaskSocket } from "@/lib/taskSocket"
import { useToast } from "@/app/hooks/useToast"
import { CustomSelect } from "../ui/CustomSelect"
import { CustomDatePicker } from "../ui/CustomDatePicker"
import { Modal, ModalCancelButton, ModalSubmitButton } from "../ui/Modal"
import ConfirmModal from "../ui/ConfirmModal"

export function TaskManagement({ selectedBranch }: { selectedBranch: string }) {
  const [tasks, setTasks] = useState<any[]>([])
  const { showToast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [orgNodes, setOrgNodes] = useState<OrgNode[]>([])
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)

  const [selectedDept, setSelectedDept] = useState("all")
  const [selectedEmp, setSelectedEmp] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState<"all" | "todo" | "in-progress" | "done" | "no-deadline">("all")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  const getTodayVnStr = () => {
    const d = new Date()
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const getFutureVnStr = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const [viewMode, setViewMode] = useState<"all" | "day" | "range" | "month">("month")
  const [dateBasis, setDateBasis] = useState<"due" | "created" | "assigned">("created")
  const [selectedDate, setSelectedDate] = useState(getTodayVnStr())
  const [startDate, setStartDate] = useState(getTodayVnStr())
  const [endDate, setEndDate] = useState(getFutureVnStr(6))
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (viewMode === "month") {
      const firstDay = `01/${String(selectedMonth).padStart(2, '0')}/${selectedYear}`
      const lastDateObj = new Date(selectedYear, selectedMonth, 0)
      const lastDay = `${String(lastDateObj.getDate()).padStart(2, '0')}/${String(selectedMonth).padStart(2, '0')}/${selectedYear}`
      setStartDate(firstDay)
      setEndDate(lastDay)
    }
  }, [viewMode, selectedMonth, selectedYear])

  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<any | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigneeId: "",
    dueDate: "",
    priority: "medium" as "high" | "medium" | "low",
    status: "todo" as "todo" | "in-progress" | "done"
  })



  const getDatesInRange = (startStr: string, endStr: string) => {
    const start = parseVnDate(startStr)
    const end = parseVnDate(endStr)
    if (!start || !end) return []
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    const dates: string[] = []
    const current = new Date(start)
    let limit = 0
    while (current <= end && limit < 100) {
      const day = String(current.getDate()).padStart(2, '0')
      const month = String(current.getMonth() + 1).padStart(2, '0')
      const year = current.getFullYear()
      dates.push(`${day}/${month}/${year}`)
      current.setDate(current.getDate() + 1)
      limit++
    }
    return dates
  }

  const parseVnDate = (s: string) => {
    if (!s) return null
    const parts = s.split("/").map(Number)
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null
    return new Date(parts[2], parts[1] - 1, parts[0])
  }

  const compareVnDates = (a: string, b: string) => {
    try {
      const da = parseVnDate(a)
      const db = parseVnDate(b)
      if (!da && !db) return 0
      if (!da) return 1
      if (!db) return -1
      da.setHours(0, 0, 0, 0)
      db.setHours(0, 0, 0, 0)
      return da.getTime() - db.getTime()
    } catch {
      return 0
    }
  }

  const handleStartDateChange = (val: string) => {
    setStartDate(val)
    if (compareVnDates(val, endDate) > 0) {
      setEndDate(val)
    }
  }

  const handleEndDateChange = (val: string) => {
    setEndDate(val)
    if (compareVnDates(startDate, val) > 0) {
      setStartDate(val)
    }
  }

  const isDateBetween = (dateStr: string, startStr: string, endStr: string) => {
    try {
      const d = parseVnDate(dateStr)
      const start = parseVnDate(startStr)
      const end = parseVnDate(endStr)
      if (!d || !start || !end) return false
      d.setHours(0, 0, 0, 0)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      return d >= start && d <= end
    } catch {
      return false
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [tList, eList, nList] = await Promise.all([
        api.tasks.list(),
        api.employees.list(),
        api.orgNodes.list()
      ])
      setTasks(tList)
      setEmployees(eList as Employee[])
      setOrgNodes(nList as OrgNode[])
    } catch (err: any) {
      showToast(err.message || "Không thể tải dữ liệu", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const unsub = subscribeTaskSocket({
      onChange: ({ action, task }) => {
        setTasks(prev => mergeTaskList(prev, { action, task }))
      },
    })
    return () => { unsub() }
  }, [])

  const departments = useMemo(() => {
    const branchEmps = employees.filter(e => selectedBranch === "all" || e.branchId === selectedBranch)
    const set = new Set(branchEmps.map(e => e.department).filter(Boolean))
    return Array.from(set) as string[]
  }, [employees, selectedBranch])

  const filteredEmployeesList = useMemo(() => {
    return employees.filter(e => {
      // Bảng công việc lấy cả nhân viên chính thức + thực tập.
      // Chỉ ẩn nhân sự đã nghỉ việc khỏi danh sách thao tác.
      if (e.status === "inactive") return false
      if (selectedBranch !== "all" && e.branchId !== selectedBranch) return false
      if (selectedDept !== "all" && e.department !== selectedDept) return false
      return true
    })
  }, [employees, selectedDept, selectedBranch])

  const employeeOptions = useMemo(() => {
    const list = filteredEmployeesList.map(e => ({ value: e.id, label: `${e.id} — ${e.name}` }))
    return [{ value: "all", label: "-- Tất cả nhân viên --" }, ...list]
  }, [filteredEmployeesList])

  const departmentOptions = useMemo(() => {
    const list = departments.map(d => ({ value: d, label: d }))
    return [{ value: "all", label: "-- Tất cả phòng ban --" }, ...list]
  }, [departments])

  const displayEmployees = useMemo(() => {
    return employees.filter(e => {
      // Hiển thị cả staff và intern; chỉ loại nhân sự nghỉ việc.
      if (e.status === "inactive") return false
      if (selectedBranch !== "all" && e.branchId !== selectedBranch) return false
      if (selectedDept !== "all" && e.department !== selectedDept) return false
      if (selectedEmp !== "all" && e.id !== selectedEmp) return false
      return true
    })
  }, [employees, selectedDept, selectedEmp, selectedBranch])

  const handleReloadWithReset = async () => {
    setSelectedDept("all")
    setSelectedEmp("all")
    setSelectedStatus("all")
    if (viewMode === "day") {
      setSelectedDate(getTodayVnStr())
    } else if (viewMode === "month") {
      setSelectedMonth(new Date().getMonth() + 1)
      setSelectedYear(new Date().getFullYear())
    } else {
      setStartDate(getTodayVnStr())
      setEndDate(getFutureVnStr(6))
    }
    await loadData()
  }

  const handleClearFiltersToToday = async () => {
    setViewMode("day")
    setSelectedDept("all")
    setSelectedEmp("all")
    setSelectedStatus("all")
    setSelectedDate(getTodayVnStr())
    setStartDate(getTodayVnStr())
    setEndDate(getFutureVnStr(6))
    setSelectedMonth(new Date().getMonth() + 1)
    setSelectedYear(new Date().getFullYear())
    await loadData()
  }

  const handleViewAllTasks = () => {
    setViewMode("all")
    setSelectedDept("all")
    setSelectedEmp("all")
    setSelectedStatus("all")
  }

  const isPendingTask = (status?: string) => status === "todo" || status === "in-progress" || !status

  const getVnDayOfWeek = (dateStr: string) => {
    try {
      const d = parseVnDate(dateStr)
      if (!d) return ""
      const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]
      return days[d.getDay()]
    } catch {
      return ""
    }
  }

  const isoToVnDate = (raw?: string) => {
    if (!raw) return ""
    const str = String(raw)
    if (str.includes("/")) return str
    const d = new Date(str)
    if (Number.isNaN(d.getTime())) return ""
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
  }

  const getTaskDateByBasis = (t: any) => {
    if (dateBasis === "created") return isoToVnDate(t.createdAt)
    if (dateBasis === "assigned") return isoToVnDate(t.assignedAt || t.assignedDate || t.createdAt)
    return t.dueDate || ""
  }

  const dateBasisLabel = dateBasis === "due"
    ? "Hạn hoàn thành"
    : dateBasis === "created"
      ? "Ngày tạo"
      : "Ngày giao"

  const matchesDateFilter = (taskDate: string) => {
    if (viewMode === "all") return true
    if (viewMode === "day") return compareVnDates(taskDate, selectedDate) === 0
    return isDateBetween(taskDate, startDate, endDate)
  }

  const renderTaskCells = (t: any, tIdx: number, allTasks: any[], empId: string, bgClass: string) => {
    const isPlaceholder = t.isPlaceholder
    const isDone = t.status === "done"
    const isInProgress = t.status === "in-progress"
    const dueDate = !isPlaceholder && t.dueDate ? parseVnDate(t.dueDate) : null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isOverdue = !isPlaceholder && !!dueDate && !isDone && dueDate.getTime() < today.getTime()
    const isFirstOfGroup = tIdx === 0 || allTasks[tIdx - 1]._displayDate !== t._displayDate
    let dateGroupLength = 0
    if (isFirstOfGroup) {
      for (let i = tIdx; i < allTasks.length; i++) {
        if (allTasks[i]._displayDate === t._displayDate) {
          dateGroupLength++
        } else {
          break
        }
      }
    }
    
    return (
      <>
        {isFirstOfGroup && (
          <td rowSpan={dateGroupLength} className={`px-5 py-3 border-r border-gray-100 align-middle text-left ${bgClass}`}>
            <div className="flex flex-col text-xs font-bold gap-0.5">
              <span className="text-gray-800 font-mono tracking-tight">{t._displayDate || "—"}</span>
              {t._displayDate && <span className="text-gray-400 text-[10px]">{getVnDayOfWeek(t._displayDate)}</span>}
            </div>
          </td>
        )}

        <td className="px-5 py-3 border-r border-gray-100 align-middle">
          {isPlaceholder ? (
            <div className="flex items-center gap-1.5 text-gray-450 font-semibold text-xs h-[38px] italic">
              <Briefcase size={13} className="text-gray-300 shrink-0" />
              Không có công việc
            </div>
          ) : (
            <div
              className={`h-[38px] px-3 flex items-center border rounded-xl text-xs font-bold w-full truncate transition-all ${
                isOverdue ? "bg-red-50/60 hover:bg-red-50 border-red-200 text-red-800"
                : isDone ? "bg-emerald-50/25 hover:bg-emerald-50/45 border-emerald-200 text-emerald-800"
                : isInProgress ? "bg-orange-50/20 hover:bg-orange-50/40 border-orange-200 text-orange-850"
                : "bg-gray-50/45 hover:bg-gray-50/80 border-gray-200 text-gray-700"
              }`}
              title={t.description ? `${t.title} — ${t.description}` : t.title}
            >
              <span className="truncate flex-1">
                <span className="text-gray-800 font-bold">{t.title}</span>
                {t.description && <span className="text-gray-400 font-normal ml-1.5">— {t.description}</span>}
              </span>
              <span className={`ml-2 shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                t.priority === "high" ? "bg-red-50 text-red-650 border border-red-100"
                : t.priority === "medium" ? "bg-amber-50 text-amber-600 border border-amber-100"
                : "bg-blue-50 text-blue-600 border border-blue-100"
              }`}>
                {t.priority === "high" ? "Cao" : t.priority === "medium" ? "Trung" : "Thấp"}
              </span>
            </div>
          )}
        </td>

        <td className="px-5 py-3 border-r border-gray-100 align-middle text-left">
          {isPlaceholder ? (
            <span className="text-xs text-gray-300 font-bold h-[38px] flex items-center">—</span>
          ) : (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              isOverdue ? "bg-red-50 text-red-700 border-red-100"
              : isDone ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : isInProgress ? "bg-orange-50 text-orange-600 border-orange-100"
              : "bg-gray-150 text-gray-650 border-gray-200"
            }`}>
              {isOverdue ? "Quá hạn" : isDone ? "Đã xong" : isInProgress ? "Đang làm" : "Chưa làm"}
            </span>
          )}
        </td>

        <td className="px-5 py-3 text-center align-middle">
          {isPlaceholder ? (
            <div className="h-[38px] flex items-center justify-center">
              <button
                onClick={() => handleOpenCreate(empId, t._displayDate)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Plus size={13} className="stroke-[3px]" /> Thêm
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => handleOpenEdit(t)}
                className="w-8 h-8 flex items-center justify-center border border-[#C62828] text-[#C62828] hover:bg-red-50 rounded-xl transition-all active:scale-95 cursor-pointer"
                title="Sửa công việc"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={() => handleDeleteTask(t.id)}
                className="w-8 h-8 flex items-center justify-center border border-[#C62828] text-[#C62828] hover:bg-red-50 rounded-xl transition-all active:scale-95 cursor-pointer"
                title="Xóa công việc"
              >
                <Trash2 size={13} />
              </button>
              <button
                onClick={() => handleOpenCreate(empId, t._displayDate)}
                className="w-8 h-8 flex items-center justify-center bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl transition-all active:scale-95 cursor-pointer"
                title="Thêm công việc khác"
              >
                <Plus size={15} className="stroke-[3px]" />
              </button>
            </div>
          )}
        </td>
      </>
    )
  }

  const handleOpenCreate = (assigneeId: string, defaultDate?: string) => {
    setEditingTask(null)
    setForm({
      title: "",
      description: "",
      assigneeId: assigneeId,
      dueDate: defaultDate || (viewMode === "day" ? selectedDate : getTodayVnStr()),
      priority: "medium",
      status: "todo"
    })
    setShowModal(true)
  }

  const handleOpenEdit = (task: any) => {
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description || "",
      assigneeId: task.assigneeId,
      dueDate: task.dueDate,
      priority: task.priority || "medium",
      status: task.status || "todo"
    })
    setShowModal(true)
  }

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      showToast("Vui lòng nhập tiêu đề công việc", "error")
      return
    }
    if (!form.assigneeId) {
      showToast("Vui lòng chọn người thực hiện", "error")
      return
    }
    try {
      if (editingTask) {
        setProcessingId(editingTask.id)
        await api.tasks.update(editingTask.id, form)
        showToast("Đã cập nhật công việc")
      } else {
        setProcessingId("new")
        await api.tasks.create(form)
        showToast("Đã phân công công việc mới")
      }
      setShowModal(false)
      loadData()
    } catch (err: any) {
      showToast(err.message || "Lỗi lưu công việc", "error")
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteTask = async (id: string) => {
    setDeleteTaskId(id)
  }

  const confirmDeleteTask = async () => {
    if (!deleteTaskId) return
    try {
      setProcessingId(deleteTaskId)
      await api.tasks.delete(deleteTaskId)
      showToast("Đã xóa công việc")
      loadData()
    } catch (err: any) {
      showToast(err.message || "Lỗi xóa công việc", "error")
    } finally {
      setProcessingId(null)
      setDeleteTaskId(null)
    }
  }

  return (
    <div className="space-y-5">

      <div className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px] p-5 rounded-2xl text-white flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div className="flex items-center">
          <div className="flex gap-1.5 items-center mr-4 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white/30 animate-pulse"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white/60 animate-pulse delay-75"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse delay-150"></span>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">
              Quản lý công việc
            </h2>
            <p className="text-xs text-white/80 mt-1">Phân công công việc hàng ngày, giám sát và kiểm tra tiến độ hoạt động</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          {viewMode === "all" ? (
            <div className="lg:col-span-8 flex items-end gap-2">
              <div className="flex-1 h-[42px] px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 bg-gray-50 flex items-center">
                Đang hiển thị tất cả công việc (không lọc theo ngày)
              </div>
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className="h-[42px] px-3.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50 bg-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                title="Chuyển sang xem theo tháng"
              >
                Xem theo tháng
              </button>
              <button
                type="button"
                onClick={() => setViewMode("day")}
                className="h-[42px] px-3.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50 bg-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                title="Chuyển sang xem theo ngày cụ thể"
              >
                Theo ngày
              </button>
              <button
                type="button"
                onClick={() => setViewMode("range")}
                className="h-[42px] px-3.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50 bg-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                title="Chuyển sang xem theo khoảng ngày"
              >
                Khoảng ngày
              </button>
            </div>
          ) : viewMode === "day" ? (
            <div className="lg:col-span-8 flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs font-black text-gray-400 mb-1.5 block uppercase tracking-wider">{`Lọc theo ${dateBasisLabel.toLowerCase()}`}</label>
                <CustomDatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white h-[42px] focus:outline-none focus:border-[#C62828]/40 hover:bg-gray-50/50 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={handleViewAllTasks}
                className="h-[42px] px-3.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50 bg-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                title="Xem tất cả công việc"
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className="h-[42px] px-3.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50 bg-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                title="Chuyển sang xem theo tháng"
              >
                Xem theo tháng
              </button>
              <button
                type="button"
                onClick={() => setViewMode("range")}
                className="h-[42px] px-3.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50 bg-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                title="Chuyển sang xem theo khoảng ngày"
              >
                Xem khoảng ngày
              </button>
            </div>
          ) : viewMode === "month" ? (
            <div className="lg:col-span-8 flex items-end gap-2">
              <div className="w-[140px] shrink-0">
                <label className="text-xs font-black text-gray-400 mb-1.5 block uppercase tracking-wider">Chọn tháng</label>
                <CustomSelect
                  value={String(selectedMonth)}
                  onChange={val => setSelectedMonth(Number(val))}
                  options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Tháng ${i + 1}` }))}
                  heightClass="h-[42px]"
                />
              </div>
              <div className="w-[120px] shrink-0">
                <label className="text-xs font-black text-gray-400 mb-1.5 block uppercase tracking-wider">Chọn năm</label>
                <CustomSelect
                  value={String(selectedYear)}
                  onChange={val => setSelectedYear(Number(val))}
                  options={Array.from({ length: 5 }, (_, i) => {
                    const y = new Date().getFullYear() - 2 + i
                    return { value: String(y), label: String(y) }
                  })}
                  heightClass="h-[42px]"
                />
              </div>
              <button
                type="button"
                onClick={handleViewAllTasks}
                className="h-[42px] px-3.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50 bg-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                title="Xem tất cả công việc"
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setViewMode("day")}
                className="h-[42px] px-3.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50 bg-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                title="Xem theo ngày cụ thể"
              >
                Xem theo ngày
              </button>
              <button
                type="button"
                onClick={() => setViewMode("range")}
                className="h-[42px] px-3.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50 bg-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                title="Xem theo khoảng ngày"
              >
                Khoảng ngày
              </button>
            </div>
          ) : (
            <div className="lg:col-span-8 flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs font-black text-gray-400 mb-1.5 block uppercase tracking-wider">Từ ngày</label>
                <CustomDatePicker
                  value={startDate}
                  onChange={handleStartDateChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white h-[42px] focus:outline-none focus:border-[#C62828]/40 hover:bg-gray-50/50 transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-black text-gray-400 mb-1.5 block uppercase tracking-wider">Đến ngày</label>
                <CustomDatePicker
                  value={endDate}
                  onChange={handleEndDateChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white h-[42px] focus:outline-none focus:border-[#C62828]/40 hover:bg-gray-50/50 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={handleViewAllTasks}
                className="h-[42px] px-3.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50 bg-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                title="Xem tất cả công việc"
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className="h-[42px] px-3.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50 bg-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                title="Chuyển sang xem theo tháng"
              >
                Xem theo tháng
              </button>
              <button
                type="button"
                onClick={() => setViewMode("day")}
                className="h-[42px] px-3.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50 bg-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                title="Chuyển sang xem theo ngày cụ thể"
              >
                Xem theo ngày
              </button>
            </div>
          )}

          <div className="lg:col-span-4 flex items-center justify-end gap-2">
            <div className="w-[150px]">
              <CustomSelect
                value={dateBasis}
                onChange={(val) => setDateBasis(val as "due" | "created" | "assigned")}
                options={[
                  { value: "due", label: "Theo hạn hoàn thành" },
                  { value: "created", label: "Theo ngày tạo" },
                  { value: "assigned", label: "Theo ngày giao" },
                ]}
                heightClass="h-[42px]"
              />
            </div>
            <button
              onClick={() => setShowAdvancedFilters(v => !v)}
              className={`h-[42px] px-3.5 border rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                showAdvancedFilters
                  ? "border-[#C62828] bg-red-50 text-[#C62828]"
                  : "border-gray-200 bg-white text-gray-650 hover:bg-gray-50"
              }`}
              title="Mở/đóng bộ lọc nâng cao"
            >
              {showAdvancedFilters ? "Ẩn lọc nâng cao" : "Lọc nâng cao"}
            </button>
            <button
              onClick={handleClearFiltersToToday}
              disabled={loading}
              className="w-[42px] h-[42px] flex items-center justify-center border border-gray-200 hover:bg-gray-50 disabled:bg-gray-100 text-gray-600 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
              title="Xóa lọc, trở về hôm nay mặc định"
            >
              <X size={15} />
            </button>
            <button
              onClick={handleReloadWithReset}
              disabled={loading}
              className="w-[42px] h-[42px] flex items-center justify-center bg-[#C62828] hover:bg-[#B71C1C] disabled:bg-gray-200 text-white rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-black text-gray-400 mb-1.5 block uppercase tracking-wider">Lọc theo phòng ban</label>
              <CustomSelect
                value={selectedDept}
                onChange={(val) => {
                  setSelectedDept(val)
                  setSelectedEmp("all")
                }}
                options={departmentOptions}
                heightClass="h-[42px]"
              />
            </div>

            <div>
              <label className="text-xs font-black text-gray-400 mb-1.5 block uppercase tracking-wider">Chọn nhân viên</label>
              <CustomSelect
                value={selectedEmp}
                onChange={setSelectedEmp}
                options={employeeOptions}
                heightClass="h-[42px]"
                searchable={true}
              />
            </div>

            <div>
              <label className="text-xs font-black text-gray-400 mb-1.5 block uppercase tracking-wider">Lọc trạng thái</label>
              <CustomSelect
                value={selectedStatus}
                onChange={(val) => setSelectedStatus(val as any)}
                options={[
                  { value: "all", label: "-- Tất cả trạng thái --" },
                  { value: "todo", label: "Chưa làm" },
                  { value: "in-progress", label: "Đang làm" },
                  { value: "done", label: "Đã xong" },
                  { value: "no-deadline", label: "Không deadline" },
                ]}
                heightClass="h-[42px]"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px] border-b border-[#B71C1C] text-white text-xs uppercase tracking-wider font-bold">
                <th className="px-5 py-3.5 text-left font-black w-16">STT</th>
                <th className="px-5 py-3.5 text-left font-black w-28">Mã NV</th>
                <th className="px-5 py-3.5 text-left font-black w-48">Họ Tên</th>
                <th className="px-5 py-3.5 text-left font-black w-44">{dateBasisLabel}</th>
                <th className="px-5 py-3.5 text-left font-black">Công việc</th>
                <th className="px-5 py-3.5 text-left font-black w-40">Trạng thái</th>
                <th className="px-5 py-3.5 text-center font-black w-36">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400 font-medium">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-gray-300" />
                    Đang tải dữ liệu công việc...
                  </td>
                </tr>
              ) : displayEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400 font-medium">
                    Không tìm thấy nhân viên nào khớp bộ lọc
                  </td>
                </tr>
              ) : (
                displayEmployees.flatMap((emp, index) => {
                  const empBgClass = index % 2 === 0 ? "bg-white" : "bg-gray-50/45"
                  const isSingleEmployeeFilter = selectedEmp !== "all" && viewMode !== "all"

                  if (isSingleEmployeeFilter) {
                    const activeDates = viewMode === "day" ? [selectedDate] : getDatesInRange(startDate, endDate)
                    const baseEmpTasks = tasks.filter(t => {
                      if (t.assigneeId !== emp.id) return false
                      if (selectedStatus === "no-deadline") {
                        return !t.dueDate
                      }
                      if (selectedStatus !== "all" && (t.status || "todo") !== selectedStatus) return false
                      return true
                    })

                    const sortedTasks: any[] = []
                    activeDates.forEach(date => {
                      const tasksOnDate = baseEmpTasks.filter(t => getTaskDateByBasis(t) === date)
                      if (tasksOnDate.length === 0) {
                        sortedTasks.push({
                          id: `placeholder-${date}`,
                          title: "Không có công việc",
                          description: "",
                          assigneeId: emp.id,
                          dueDate: date,
                          status: "none",
                          isPlaceholder: true,
                          _displayDate: date
                        })
                      } else {
                        tasksOnDate.forEach(t => {
                          sortedTasks.push({
                            ...t,
                            _displayDate: date
                          })
                        })
                      }
                    })

                    return sortedTasks.map((t, tIdx) => {
                      const isLast = tIdx === sortedTasks.length - 1
                      return (
                        <tr 
                          key={`${emp.id}-${t.id}`} 
                          className={`hover:bg-gray-100/50 transition-colors ${isLast ? "border-b-2 border-gray-200" : ""} ${empBgClass}`}
                        >
                          {tIdx === 0 && (
                            <>
                              <td rowSpan={sortedTasks.length} className="px-5 py-4 font-bold text-gray-400 border-r border-gray-100 align-middle">{index + 1}</td>
                              <td rowSpan={sortedTasks.length} className="px-5 py-4 font-mono font-bold text-gray-700 border-r border-gray-100 align-middle">{emp.id}</td>
                              <td rowSpan={sortedTasks.length} className="px-5 py-4 font-bold text-gray-800 border-r border-gray-100 align-middle">{emp.name}</td>
                            </>
                          )}
                          {renderTaskCells(t, tIdx, sortedTasks, emp.id, empBgClass)}
                        </tr>
                      )
                    })
                  } else {
                    const empTasks = tasks.filter(t => {
                      if (t.assigneeId !== emp.id) return false
                      const taskDate = getTaskDateByBasis(t)

                      if (selectedStatus === "no-deadline") {
                        if (t.dueDate) return false
                        return viewMode === "all" ? true : matchesDateFilter(taskDate)
                      }
                      if (selectedStatus !== "all" && (t.status || "todo") !== selectedStatus) return false
                      return matchesDateFilter(taskDate)
                    })

                    if (empTasks.length === 0) {
                      return (
                        <tr key={emp.id} className={`hover:bg-gray-100/50 transition-colors border-b-2 border-gray-200 ${empBgClass}`}>
                          <td className="px-5 py-4 font-bold text-gray-400 border-r border-gray-100">{index + 1}</td>
                          <td className="px-5 py-4 font-mono font-bold text-gray-700 border-r border-gray-100">{emp.id}</td>
                          <td className="px-5 py-4 font-bold text-gray-800 border-r border-gray-100">{emp.name}</td>
                          <td className="px-5 py-4 text-gray-500 font-bold text-xs border-r border-gray-100">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-gray-800 font-mono">{viewMode === "all" ? "Tất cả" : (viewMode === "day" ? selectedDate : startDate)}</span>
                              {viewMode !== "all" && (
                                <span className="text-gray-400 text-[10px]">{getVnDayOfWeek(viewMode === "day" ? selectedDate : startDate)}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 border-r border-gray-100">
                            <div className="flex items-center gap-1.5 text-gray-450 font-semibold text-xs h-[38px] italic">
                              <Briefcase size={13} className="text-gray-300 shrink-0" />
                              Không có công việc
                            </div>
                          </td>
                          <td className="px-5 py-4 border-r border-gray-100">
                            <span className="text-xs text-gray-300 font-bold h-[38px] flex items-center">—</span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="h-[38px] flex items-center justify-center">
                              <button
                                onClick={() => handleOpenCreate(emp.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                              >
                                <Plus size={13} className="stroke-[3px]" /> Thêm
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    const sortedTasks = [...empTasks]
                      .map(t => ({ ...t, _displayDate: getTaskDateByBasis(t) }))
                      .sort((a, b) => compareVnDates(a._displayDate, b._displayDate))

                    return sortedTasks.map((t, tIdx) => {
                      const isLast = tIdx === sortedTasks.length - 1
                      return (
                        <tr 
                          key={`${emp.id}-${t.id}`} 
                          className={`hover:bg-gray-100/50 transition-colors ${isLast ? "border-b-2 border-gray-200" : ""} ${empBgClass}`}
                        >
                          {tIdx === 0 && (
                            <>
                              <td rowSpan={sortedTasks.length} className="px-5 py-4 font-bold text-gray-400 border-r border-gray-100 align-middle">{index + 1}</td>
                              <td rowSpan={sortedTasks.length} className="px-5 py-4 font-mono font-bold text-gray-700 border-r border-gray-100 align-middle">{emp.id}</td>
                              <td rowSpan={sortedTasks.length} className="px-5 py-4 font-bold text-gray-800 border-r border-gray-100 align-middle">{emp.name}</td>
                            </>
                          )}
                          {renderTaskCells(t, tIdx, sortedTasks, emp.id, empBgClass)}
                        </tr>
                      )
                    })
                  }
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingTask ? "Cập nhật công việc" : "Phân công công việc"}
        icon={CheckSquare}
        width="md"
        footer={<>
          <ModalCancelButton onClick={() => setShowModal(false)} />
          <ModalSubmitButton
            onClick={() => { const e = { preventDefault: () => {} } as any; handleSaveTask(e) }}
            loading={processingId === "new" || (editingTask && processingId === editingTask.id)}
            label="Lưu"
            loadingLabel="Đang lưu..."
          />
        </>}
      >
            <form onSubmit={handleSaveTask} className="space-y-4 p-6">
              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wider">Người thực hiện</label>
                <select 
                  value={form.assigneeId} 
                  onChange={e => setForm(p => ({ ...p, assigneeId: e.target.value }))}
                  disabled={true}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#C62828]/40 font-bold text-gray-500 bg-gray-50 cursor-not-allowed"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.id} — {e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wider">Hạn hoàn thành (deadline)</label>
                <CustomDatePicker
                  value={form.dueDate}
                  onChange={val => setForm(p => ({ ...p, dueDate: val }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-750 bg-white h-[42px] focus:outline-none focus:border-[#C62828]/40 hover:bg-gray-50/50 transition-all"
                />
                <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!form.dueDate}
                    onChange={e => setForm(p => ({ ...p, dueDate: e.target.checked ? "" : getTodayVnStr() }))}
                    className="w-4 h-4 accent-[#C62828]"
                  />
                  Không đặt deadline cho việc này
                </label>
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wider">Tiêu đề công việc</label>
                <input 
                  type="text"
                  value={form.title} 
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} 
                  required
                  placeholder="Nhập tiêu đề công việc..." 
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#C62828]/40 font-semibold text-gray-700 bg-white" 
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wider">Nội dung công việc</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} 
                  rows={3}
                  placeholder="Nhập nội dung mô tả công việc..." 
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#C62828]/40 font-semibold text-gray-700 bg-white" 
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wider">Mức độ ưu tiên</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "low", label: "Thấp", color: "border-blue-200 text-blue-600 bg-blue-50/10 active:bg-blue-100" },
                    { value: "medium", label: "Trung bình", color: "border-amber-200 text-amber-600 bg-amber-50/10 active:bg-amber-100" },
                    { value: "high", label: "Cao", color: "border-red-200 text-red-650 bg-red-50/10 active:bg-red-100" }
                  ] as const).map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, priority: p.value }))}
                      className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                        form.priority === p.value 
                          ? "bg-gray-900 border-gray-900 text-white shadow-sm scale-[1.02]" 
                          : `${p.color} border-gray-200`
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wider">Trạng thái công việc</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "todo", label: "Chưa làm", color: "border-gray-200 text-gray-600 bg-gray-50/30" },
                    { value: "in-progress", label: "Đang làm", color: "border-orange-200 text-orange-650 bg-orange-50/20" },
                    { value: "done", label: "Đã xong", color: "border-emerald-200 text-emerald-650 bg-emerald-50/20" }
                  ] as const).map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, status: s.value }))}
                      className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                        form.status === s.value 
                          ? "bg-gray-900 border-gray-900 text-white shadow-sm scale-[1.02]" 
                          : `${s.color} border-gray-200`
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

            </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteTaskId !== null}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={confirmDeleteTask}
        title="Xóa công việc"
        message="Bạn có chắc chắn muốn xóa công việc này không? Tiến độ dự án liên quan sẽ được tự động tính toán lại."
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  )
}
