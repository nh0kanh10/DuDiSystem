import React, { useState, useEffect, useMemo } from "react"
import { Clock, TrendingUp, AlertCircle, Users, Download, Search, Award, Calendar, RefreshCw, User, Briefcase, X, ChevronDown, UserX, LogOut, LogIn, CheckCircle2, Timer } from "lucide-react"
import { api } from "@/lib/api"
import { CustomSelect } from "../ui/CustomSelect"
import { CustomCombobox } from "../ui/CustomCombobox"
import { Modal } from "../ui/Modal"
import { CustomDatePicker } from "../ui/CustomDatePicker"

const getDayOfWeekVN = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  const day = dt.getDay()
  switch (day) {
    case 0: return "Chủ Nhật"
    case 1: return "Thứ Hai"
    case 2: return "Thứ Ba"
    case 3: return "Thứ Tư"
    case 4: return "Thứ Năm"
    case 5: return "Thứ Sáu"
    case 6: return "Thứ Bảy"
    default: return ""
  }
}

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  department: string
  position: string
  joinDate: string
  status: "active" | "inactive" | "intern"
  contractType: string
  branchId?: string
  orgNodeId?: string
}

interface AttendanceRecord {
  id: string
  employeeId: string
  checkIn: string
  checkOut: string
  date: string
  status: "on-time" | "late" | "absent" | "leave"
  note: string
  employeeName?: string
  department?: string
}

export default function StatisticsPage({ selectedBranch = "all", currentUserEmail = "", currentUserRole = "user" }: { selectedBranch?: string; currentUserEmail?: string; currentUserRole?: string }) {
  const now = useMemo(() => new Date(), [])
  const currentYearStr = useMemo(() => String(now.getFullYear()), [now])
  const currentMonthStr = useMemo(() => String(now.getMonth() + 1).padStart(2, "0"), [now])

  const [activeTab, setActiveTab] = useState<"official" | "intern" | "personal" | "violation">("official")
  const [filterType, setFilterType] = useState<"week" | "month" | "range">("month")
  const [rangeStart, setRangeStart] = useState<string>("")
  const [rangeEnd, setRangeEnd] = useState<string>("")
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr)
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr)
  const [selectedWeekId, setSelectedWeekId] = useState<string>("w1")
  const [personalDept, setPersonalDept] = useState<string>("all")
  const [personalEmployeeId, setPersonalEmployeeId] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [exporting, setExporting] = useState<boolean>(false)
  const [activeRankDetail, setActiveRankDetail] = useState<{
    title: string
    countLabel: string
    employees: {
      id: string
      name: string
      department: string
      late: number
      leave: number
      total: number
      onTimeRate: number
    }[]
  } | null>(null)
  const [showFullRank, setShowFullRank] = useState<"late" | "leave" | null>(null)
  const [systemConfig, setSystemConfig] = useState<{
    morningStart: string
    morningEnd: string
    afternoonStart: string
    afternoonEnd: string
  }>({
    morningStart: "09:00",
    morningEnd: "12:00",
    afternoonStart: "13:30",
    afternoonEnd: "17:00"
  })

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [empData, attData, configData] = await Promise.all([
          api.employees.list(),
          api.attendance.list(),
          api.systemConfig.get().catch(() => null)
        ])
        const filteredEmps = (empData as Employee[] || []).filter(e => !["0000000000", "1111111111", "2222222222"].includes(e.id))
        setEmployees(filteredEmps)
        setAttendance(attData as AttendanceRecord[])
        if (configData) {
          setSystemConfig(configData)
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu thống kê:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedBranch])

  const currentEmployeeId = useMemo(() => {
    if (!currentUserEmail) return null
    const matched = employees.find(e => e.id.toLowerCase() === currentUserEmail.toLowerCase() || e.email.toLowerCase() === currentUserEmail.toLowerCase())
    return matched ? matched.id : null
  }, [employees, currentUserEmail])

  useEffect(() => {
    if (currentEmployeeId) {
      setPersonalEmployeeId(currentEmployeeId)
    }
  }, [currentEmployeeId])

  useEffect(() => {
    if (personalDept !== "all" && personalEmployeeId) {
      const emp = employees.find(e => e.id === personalEmployeeId)
      if (emp && emp.department !== personalDept) {
        setPersonalEmployeeId("")
      }
    }
  }, [personalDept, employees, personalEmployeeId])

  const selectedPersonalEmp = useMemo(() => {
    return employees.find(e => e.id === personalEmployeeId)
  }, [employees, personalEmployeeId])




  const detailSuggestionsList = useMemo(() => {
    const baseList = employees.filter(e => {
      const matchesType = activeTab === "official" ? e.contractType === "Chính thức" : e.contractType === "Thực tập"
      if (!matchesType) return false
      const matchesBranch = selectedBranch === "all" || e.branchId === selectedBranch
      return matchesBranch
    })
    
    const query = searchQuery.trim().toLowerCase()
    if (!query) return baseList
    
    const exactMatch = baseList.some(e => e.name.toLowerCase() === query || e.id.toLowerCase() === query)
    if (exactMatch) return baseList
    
    return baseList.filter(e => e.name.toLowerCase().includes(query) || e.id.toLowerCase().includes(query))
  }, [employees, activeTab, selectedBranch, searchQuery])

  const handleYearChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 4)
    setSelectedYear(clean)
  }

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const m = String(i + 1).padStart(2, "0")
      return { value: m, label: `Tháng ${i + 1}` }
    })
  }, [])

  const weeksOptions = useMemo(() => {
    const year = selectedYear.length === 4 ? parseInt(selectedYear) : parseInt(currentYearStr)
    const month = parseInt(selectedMonth)
    if (isNaN(year) || isNaN(month)) return []
    
    const options: { id: string; label: string; startDate: string; endDate: string }[] = []
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    
    let currentStart = new Date(firstDay)
    let weekNum = 1
    
    while (currentStart <= lastDay) {
      const startStr = `${year}-${String(month).padStart(2, "0")}-${String(currentStart.getDate()).padStart(2, "0")}`
      
      const currentEnd = new Date(currentStart)
      const daysToSunday = 7 - (currentStart.getDay() === 0 ? 7 : currentStart.getDay())
      currentEnd.setDate(currentStart.getDate() + daysToSunday)
      
      const actualEnd = currentEnd > lastDay ? lastDay : currentEnd
      const endStr = `${year}-${String(month).padStart(2, "0")}-${String(actualEnd.getDate()).padStart(2, "0")}`
      
      const formattedStart = `${String(currentStart.getDate()).padStart(2, "0")}/${String(month).padStart(2, "0")}`
      const formattedEnd = `${String(actualEnd.getDate()).padStart(2, "0")}/${String(month).padStart(2, "0")}`
      
      options.push({
        id: `w${weekNum}`,
        label: `Tuần ${weekNum} (${formattedStart} - ${formattedEnd})`,
        startDate: startStr,
        endDate: endStr
      })
      
      currentStart = new Date(actualEnd)
      currentStart.setDate(currentStart.getDate() + 1)
      weekNum++
    }
    return options
  }, [selectedYear, selectedMonth, currentYearStr])

  useEffect(() => {
    if (filterType === "week" && weeksOptions.length > 0) {
      const defaultWeek = selectedYear === "2026" && selectedMonth === "06" ? "w4" : "w1"
      if (!weeksOptions.find(w => w.id === selectedWeekId)) {
        setSelectedWeekId(defaultWeek)
      }
    }
  }, [filterType, weeksOptions, selectedYear, selectedMonth, selectedWeekId])

  const parseVNtoISO = (vnDate: string) => {
    if (!vnDate) return ""
    const [d, m, y] = vnDate.split("/")
    if (!d || !m || !y) return ""
    return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`
  }

  const dateRange = useMemo(() => {
    const year = selectedYear.length === 4 ? parseInt(selectedYear) : parseInt(currentYearStr)
    const month = parseInt(selectedMonth)

    if (filterType === "range") {
      const start = parseVNtoISO(rangeStart)
      const end = parseVNtoISO(rangeEnd)
      if (start && end) return { start, end }
      if (start) return { start, end: start }
      return { start: `${year}-${String(month).padStart(2,"0")}-01`, end: `${year}-${String(month).padStart(2,"0")}-01` }
    }

    if (filterType === "week") {
      const matched = weeksOptions.find(w => w.id === selectedWeekId) ?? weeksOptions[0]
      if (matched) return { start: matched.startDate, end: matched.endDate }
    }

    const lastDay = new Date(year, month, 0).getDate()
    return {
      start: `${year}-${String(month).padStart(2, "0")}-01`,
      end: `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
    }
  }, [filterType, selectedYear, selectedMonth, selectedWeekId, weeksOptions, currentYearStr, rangeStart, rangeEnd])

  const maxNotches = useMemo(() => {
    if (filterType === "week") return 5
    const year = selectedYear.length === 4 ? parseInt(selectedYear) : parseInt(currentYearStr)
    const month = parseInt(selectedMonth)
    let count = 0
    const lastDay = new Date(year, month, 0).getDate()
    for (let d = 1; d <= lastDay; d++) {
      const dt = new Date(year, month - 1, d)
      const day = dt.getDay()
      if (day >= 1 && day <= 5) count++
    }
    return count
  }, [filterType, selectedYear, selectedMonth, currentYearStr])

  const filteredAttendance = useMemo(() => {
    return attendance.filter(r => {
      return r.date >= dateRange.start && r.date <= dateRange.end
    })
  }, [attendance, dateRange])

  const dateRangeText = useMemo(() => {
    const formatVN = (str: string) => {
      const [y, m, d] = str.split("-")
      return `${d}/${m}/${y}`
    }
    return `Từ ngày ${formatVN(dateRange.start)} đến ngày ${formatVN(dateRange.end)}`
  }, [dateRange])

  const statsMap = useMemo(() => {
    const map: Record<string, { late: number; leave: number; absent: number; total: number; onTime: number }> = {}
    
    const daysList: string[] = []
    if (dateRange.start && dateRange.end) {
      const [sy, sm, sd] = dateRange.start.split("-").map(Number)
      const [ey, em, ed] = dateRange.end.split("-").map(Number)
      let current = new Date(sy, sm - 1, sd)
      const end = new Date(ey, em - 1, ed)
      const todayStr = new Date().toISOString().split("T")[0]

      while (current <= end) {
        const yStr = current.getFullYear()
        const mStr = String(current.getMonth() + 1).padStart(2, "0")
        const dStr = String(current.getDate()).padStart(2, "0")
        const dayStr = `${yStr}-${mStr}-${dStr}`
        
        const dt = new Date(yStr, current.getMonth(), current.getDate())
        const isWeekend = dt.getDay() === 0 || dt.getDay() === 6
        
        if (!isWeekend && dayStr <= todayStr) {
          daysList.push(dayStr)
        }
        current.setDate(current.getDate() + 1)
      }
    }

    employees.forEach(e => {
      map[e.id] = { late: 0, leave: 0, absent: 0, total: 0, onTime: 0 }
      
      daysList.forEach(day => {
        const matched = attendance.find(r => r.employeeId === e.id && r.date === day)
        if (matched) {
          if (matched.status === "late" || matched.status === "late_early") {
            map[e.id].late += 1
            map[e.id].total += 1
          } else if (matched.status === "leave") {
            map[e.id].leave += 1
          } else if (matched.status === "absent") {
            map[e.id].absent += 1
          } else if (matched.status === "on-time" || matched.status === "early") {
            map[e.id].onTime += 1
            map[e.id].total += 1
          }
        } else {
          map[e.id].absent += 1
        }
      })
    })

    return map
  }, [employees, attendance, dateRange])

  const allEmployeesList = useMemo(() => {
    return employees.filter(e => {
      const matchesBranch = selectedBranch === "all" || e.branchId === selectedBranch
      if (!matchesBranch) return false
      const matchesDept = personalDept === "all" || e.department === personalDept
      if (!matchesDept) return false
      const matchesType = activeTab === "official" ? e.contractType === "Chính thức" : e.contractType === "Thực tập"
      return matchesType
    })
  }, [employees, selectedBranch, personalDept, activeTab])

  const rankAllData = useMemo(() => {
    const list = allEmployeesList.map(e => {
      const stats = statsMap[e.id] || { late: 0, leave: 0, absent: 0, total: 0, onTime: 0 }
      return {
        id: e.id,
        name: e.name,
        department: e.department,
        contractType: e.contractType,
        late: stats.late,
        leave: stats.leave,
        absent: stats.absent,
        total: stats.total,
        onTimeRate: stats.total > 0 ? Math.round((stats.onTime / stats.total) * 100) : 100
      }
    })

    const lateRanked = [...list].sort((a, b) => b.late - a.late || b.leave - a.leave || b.absent - a.absent || a.name.localeCompare(b.name))
    const leaveRanked = [...list].sort((a, b) => b.leave - a.leave || b.absent - a.absent || b.late - a.late || a.name.localeCompare(b.name))

    return { lateRanked, leaveRanked }
  }, [allEmployeesList, statsMap])

  const filteredEmployeesList = useMemo(() => {
    const res = employees.filter(e => {
      const matchesType = activeTab === "official" ? e.contractType === "Chính thức" : e.contractType === "Thực tập"
      if (!matchesType) return false
      const matchesBranch = selectedBranch === "all" || e.branchId === selectedBranch
      if (!matchesBranch) return false
      const matchesDept = personalDept === "all" || e.department === personalDept
      if (!matchesDept) return false
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return e.name.toLowerCase().includes(query) || e.id.toLowerCase().includes(query)
    })
    return res
  }, [employees, activeTab, searchQuery, selectedBranch, personalDept])

  const rankData = useMemo(() => {
    const list = filteredEmployeesList.map(e => {
      const stats = statsMap[e.id] || { late: 0, leave: 0, absent: 0, total: 0, onTime: 0 }
      return {
        id: e.id,
        name: e.name,
        department: e.department,
        late: stats.late,
        leave: stats.leave,
        absent: stats.absent,
        total: stats.total,
        onTimeRate: stats.total > 0 ? Math.round((stats.onTime / stats.total) * 100) : 100
      }
    }).sort((a, b) => b.late - a.late || b.leave - a.leave || b.absent - a.absent || a.name.localeCompare(b.name))

    const lateEmployees = list.filter(item => item.late > 0)
    const lateGroupsMap: Record<number, typeof list> = {}
    lateEmployees.forEach(emp => {
      if (!lateGroupsMap[emp.late]) lateGroupsMap[emp.late] = []
      lateGroupsMap[emp.late].push(emp)
    })
    const sortedLateCounts = Object.keys(lateGroupsMap)
      .map(Number)
      .sort((a, b) => b - a)
      .slice(0, 3)
    const topLateGroups = sortedLateCounts.map((count, index) => ({
      rank: index + 1,
      count,
      employees: lateGroupsMap[count].sort((a, b) => a.name.localeCompare(b.name))
    }))

    const leaveEmployees = list.filter(item => item.leave > 0)
    const leaveGroupsMap: Record<number, typeof list> = {}
    leaveEmployees.forEach(emp => {
      if (!leaveGroupsMap[emp.leave]) leaveGroupsMap[emp.leave] = []
      leaveGroupsMap[emp.leave].push(emp)
    })
    const sortedLeaveCounts = Object.keys(leaveGroupsMap)
      .map(Number)
      .sort((a, b) => b - a)
      .slice(0, 3)
    const topLeaveGroups = sortedLeaveCounts.map((count, index) => ({
      rank: index + 1,
      count,
      employees: leaveGroupsMap[count].sort((a, b) => a.name.localeCompare(b.name))
    }))

    return { list, topLateGroups, topLeaveGroups }
  }, [filteredEmployeesList, statsMap])

  const departmentOptions = useMemo(() => {
    const depts = new Set<string>()
    employees.forEach(e => {
      if (e.branchId === selectedBranch || selectedBranch === "all") {
        if (e.department) depts.add(e.department)
      }
    })
    return Array.from(depts).sort()
  }, [employees, selectedBranch])

  const selectableEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchesBranch = selectedBranch === "all" || e.branchId === selectedBranch
      if (!matchesBranch) return false
      const matchesDept = personalDept === "all" || e.department === personalDept
      return matchesDept
    })
  }, [employees, personalDept, selectedBranch])



  const personalStats = useMemo(() => {
    const isManagerOrAdmin = currentUserRole === "role-admin" || currentUserRole === "role-super-admin" || currentUserRole === "role-manager"
    const empId = isManagerOrAdmin ? personalEmployeeId : (personalEmployeeId || currentEmployeeId)
    if (!empId) return null
    const emp = employees.find(e => e.id === empId)
    if (!emp) return null

    const daysList: string[] = []
    const [sy, sm, sd] = dateRange.start.split("-").map(Number)
    const [ey, em, ed] = dateRange.end.split("-").map(Number)
    let current = new Date(sy, sm - 1, sd)
    const end = new Date(ey, em - 1, ed)
    while (current <= end) {
      const yStr = current.getFullYear()
      const mStr = String(current.getMonth() + 1).padStart(2, "0")
      const dStr = String(current.getDate()).padStart(2, "0")
      daysList.push(`${yStr}-${mStr}-${dStr}`)
      current.setDate(current.getDate() + 1)
    }

    const logs = daysList.map(day => {
      const matched = attendance.find(r => r.employeeId === empId && r.date === day)
      const [y, m, d] = day.split("-").map(Number)
      const dt = new Date(y, m - 1, d)
      const isWeekend = dt.getDay() === 0 || dt.getDay() === 6
      
      if (isWeekend) {
        return {
          id: `weekend-${day}`,
          date: day,
          checkIn: "",
          checkOut: "",
          status: "weekend" as const,
          note: "Lịch nghỉ cuối tuần"
        }
      }

      if (matched) {
        let calculatedStatus = matched.status as any
        if (matched.status === "on-time" && matched.checkOut && matched.checkOut !== "--" && matched.checkOut !== "") {
          const parts = matched.checkOut.split(":")
          if (parts.length === 2) {
            const h = parseInt(parts[0])
            const m = parseInt(parts[1])
            if (!isNaN(h) && !isNaN(m)) {
              if (h < 17 || (h === 17 && m < 30)) {
                calculatedStatus = "early"
              }
            }
          }
        }
        return {
          id: matched.id,
          date: day,
          checkIn: matched.checkIn,
          checkOut: matched.checkOut,
          status: calculatedStatus,
          note: matched.note
        }
      }

      return {
        id: `absent-${day}`,
        date: day,
        checkIn: "",
        checkOut: "",
        status: "absent" as const,
        note: "Không có dữ liệu chấm công"
      }
    })

    let onTime = 0
    let late = 0
    let leave = 0
    logs.forEach(r => {
      if (r.status === "on-time") onTime += 1
      else if (r.status === "late") late += 1
      else if (r.status === "leave" || r.status === "absent") leave += 1
    })

    const total = logs.filter(r => r.status !== "weekend").length
    const onTimeRate = total > 0 ? Math.round((onTime / total) * 100) : 100

    return { emp, logs, onTime, late, leave, total, onTimeRate }
  }, [employees, attendance, currentEmployeeId, personalEmployeeId, dateRange])

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => {
      try {
        let headers: string[] = []
        let rows: (string | number)[][] = []
        let filename = "bao-cao-thong-ke.csv"

        if (activeTab === "official" || activeTab === "intern") {
          headers = ["STT", "Mã nhân viên", "Họ và tên", "Phòng ban", "Số ngày đi trễ", "Nghỉ phép", "Vắng mặt"]
          rows = rankData.list.map((emp, index) => [
            index + 1,
            emp.id,
            emp.name,
            emp.department,
            emp.late,
            emp.leave,
            emp.absent
          ])
          filename = activeTab === "official" 
            ? `thong-ke-nhan-vien-chinh-thuc-${selectedMonth}-${selectedYear}.csv`
            : `thong-ke-thuc-tap-sinh-${selectedMonth}-${selectedYear}.csv`
        } else if (activeTab === "personal" && personalStats) {
          headers = ["STT", "Thứ", "Ngày", "Giờ vào", "Giờ ra", "Trạng thái", "Ghi chú"]
          rows = personalStats.logs.map((log, index) => {
            const dayName = getDayOfWeekVN(log.date)
            const dateVN = log.date.split("-").reverse().join("/")
            if (log.status === "weekend") {
              return [
                index + 1,
                dayName,
                dateVN,
                "-",
                "-",
                "Lịch nghỉ",
                "Lịch nghỉ cuối tuần"
              ]
            }
            return [
              index + 1,
              dayName,
              dateVN,
              log.checkIn || "-",
              log.checkOut || "-",
              formatStatus(log.status).label,
              log.note || ""
            ]
          })
          filename = `nhat-ky-cham-cong-${personalStats.emp.id}-${personalStats.emp.name}-${selectedMonth}-${selectedYear}.csv`
        }

        const csvContent = "\uFEFF" + [headers, ...rows]
          .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
          .join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (err) {
        console.error("Lỗi xuất file:", err)
      } finally {
        setExporting(false)
      }
    }, 600)
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case "on-time": return { label: "Đúng giờ", class: "bg-emerald-50 text-emerald-700 border border-emerald-100" }
      case "late": return { label: "Đi trễ", class: "bg-amber-50 text-amber-700 border border-amber-100" }
      case "leave": return { label: "Nghỉ phép", class: "bg-purple-50 text-purple-700 border border-purple-100" }
      case "absent": return { label: "Vắng mặt", class: "bg-rose-50 text-rose-700 border border-rose-100" }
      case "early": return { label: "Về sớm", class: "bg-blue-50 text-blue-700 border border-blue-100" }
      case "weekend": return { label: "Lịch nghỉ", class: "bg-emerald-50 text-emerald-700 border border-emerald-100" }
      default: return { label: "Không xác định", class: "bg-gray-50 text-gray-700 border border-gray-100" }
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px] p-5 rounded-2xl text-white flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div className="flex items-center">
          <div className="flex gap-1.5 items-center mr-4 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white/30 animate-pulse"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white/60 animate-pulse delay-75"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse delay-150"></span>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Thống kê chấm công</h2>
            <p className="text-xs text-white/80 mt-1">Báo cáo trực quan hiệu suất làm việc và vi phạm kỷ luật</p>
          </div>
        </div>
        {(activeTab !== "personal" || personalStats) && (
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#C62828] hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer">
            {exporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />} 
            {exporting ? "Đang xuất..." : "Xuất báo cáo"}
          </button>
        )}
      </div>

      <div className="bg-[#FAF9F9] rounded-3xl p-4 border border-black/5 shadow-xs flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5 min-w-[130px] flex-1 lg:flex-none">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Loại bộ lọc</span>
          <CustomSelect
            value={filterType}
            onChange={val => setFilterType(val as any)}
            options={[
              { value: "week", label: "Theo tuần" },
              { value: "month", label: "Theo tháng" },
              { value: "range", label: "Khoảng thời gian" }
            ]}
          />
        </div>

        {filterType !== "range" && (
          <div className="flex flex-col gap-1.5 min-w-[100px] flex-1 lg:flex-none">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Chọn năm</span>
            <input type="text" value={selectedYear} onChange={e => handleYearChange(e.target.value)} maxLength={4}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C62828]/40 text-gray-700 bg-white font-bold text-center h-[34px]" />
          </div>
        )}

        {filterType !== "range" && (
          <div className="flex flex-col gap-1.5 min-w-[100px] flex-1 lg:flex-none">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Chọn tháng</span>
            <CustomSelect
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={monthOptions}
            />
          </div>
        )}

        {filterType === "range" && (
          <>
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Từ ngày</span>
              <CustomDatePicker
                value={rangeStart}
                onChange={v => { setRangeStart(v); if (rangeEnd && v > rangeEnd) setRangeEnd("") }}
                placeholder="Chọn ngày bắt đầu"
                className="w-full px-3 border border-gray-200 rounded-xl text-xs bg-white font-bold h-[34px] focus:outline-none focus:border-[#C62828]/40"
              />
            </div>
            <span className="text-gray-300 font-black text-sm leading-[34px]">→</span>
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Đến ngày</span>
                {rangeStart && rangeEnd && (() => {
                  const s = parseVNtoISO(rangeStart), e = parseVNtoISO(rangeEnd)
                  const days = Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1
                  return days > 0 ? <span className="text-[10px] font-black text-[#C62828] bg-[#C62828]/8 px-1.5 py-0.5 rounded-full">{days} ngày</span> : null
                })()}
              </div>
              <CustomDatePicker
                value={rangeEnd}
                onChange={setRangeEnd}
                placeholder="Chọn ngày kết thúc"
                className="w-full px-3 border border-gray-200 rounded-xl text-xs bg-white font-bold h-[34px] focus:outline-none focus:border-[#C62828]/40"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap self-end">
              {[
                { label: "7 ngày", days: 7 },
                { label: "30 ngày", days: 30 },
                { label: "Tháng này", days: 0, type: "thisMonth" },
                { label: "Quý này", days: 0, type: "thisQuarter" },
              ].map(preset => (
                <button key={preset.label} type="button"
                  onClick={() => {
                    const today = new Date()
                    const fmt = (d: Date) => `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`
                    if (preset.type === "thisMonth") {
                      setRangeStart(fmt(new Date(today.getFullYear(), today.getMonth(), 1)))
                      setRangeEnd(fmt(new Date(today.getFullYear(), today.getMonth()+1, 0)))
                    } else if (preset.type === "thisQuarter") {
                      const q = Math.floor(today.getMonth() / 3)
                      setRangeStart(fmt(new Date(today.getFullYear(), q*3, 1)))
                      setRangeEnd(fmt(new Date(today.getFullYear(), q*3+3, 0)))
                    } else {
                      const end = new Date(today)
                      const start = new Date(today)
                      start.setDate(today.getDate() - preset.days + 1)
                      setRangeStart(fmt(start))
                      setRangeEnd(fmt(end))
                    }
                  }}
                  className="h-[34px] px-3 rounded-xl text-[10px] font-black text-gray-500 bg-white border border-gray-200 hover:border-[#C62828]/40 hover:text-[#C62828] transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </>
        )}

        {filterType === "week" && (
          <div className="flex flex-col gap-1.5 min-w-[130px] flex-1 lg:flex-none">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Chọn tuần</span>
            <CustomSelect
              value={selectedWeekId}
              onChange={setSelectedWeekId}
              options={weeksOptions.map(w => ({ value: w.id, label: w.label }))}
            />
          </div>
        )}

        {(currentUserRole === "role-admin" || currentUserRole === "role-super-admin" || currentUserRole === "role-manager") && (
          <div className="flex flex-col gap-1.5 min-w-[150px] flex-1 lg:flex-none">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Phòng ban</span>
            <CustomSelect
              value={personalDept}
              onChange={setPersonalDept}
              options={[
                { value: "all", label: "Tất cả phòng ban" },
                ...departmentOptions.map(dept => ({ value: dept, label: dept }))
              ]}
            />
          </div>
        )}

        {activeTab === "personal" && (currentUserRole === "role-admin" || currentUserRole === "role-super-admin" || currentUserRole === "role-manager") && (
          <div className="flex flex-col gap-1.5 min-w-[250px] flex-1 lg:flex-none">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Chọn nhân sự</span>
            <CustomCombobox
              value={personalEmployeeId}
              onChange={setPersonalEmployeeId}
              placeholder="Nhập tên hoặc mã nhân sự..."
              options={selectableEmployees.map(emp => ({
                value: emp.id,
                label: `${emp.id} - ${emp.name}`,
                desc: emp.department
              }))}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5 ml-auto self-end w-full lg:w-auto">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold border border-gray-150 shadow-2xs h-[34px] justify-center lg:justify-start">
            <Calendar size={13} className="text-gray-400" />
            {dateRangeText}
          </div>
        </div>
      </div>

      <div className="flex justify-center w-full border-b border-gray-200/60 pb-px">
        <div className="flex gap-10">
          <button onClick={() => { setActiveTab("official"); setSearchQuery("") }}
            className={`py-3 text-sm font-black transition-all border-b-[3px] px-2 ${activeTab === "official" ? "border-[#C62828] text-[#C62828]" : "border-transparent text-gray-400 hover:text-gray-700"}`}>
            Nhân viên chính thức
          </button>
          <button onClick={() => { setActiveTab("intern"); setSearchQuery("") }}
            className={`py-3 text-sm font-black transition-all border-b-[3px] px-2 ${activeTab === "intern" ? "border-[#C62828] text-[#C62828]" : "border-transparent text-gray-400 hover:text-gray-700"}`}>
            Thực tập sinh
          </button>
          <button onClick={() => { setActiveTab("personal"); setSearchQuery("") }}
            className={`py-3 text-sm font-black transition-all border-b-[3px] px-2 ${activeTab === "personal" ? "border-[#C62828] text-[#C62828]" : "border-transparent text-gray-400 hover:text-gray-700"}`}>
            Cá nhân
          </button>
          <button onClick={() => { setActiveTab("violation"); setSearchQuery("") }}
            className={`py-3 text-sm font-black transition-all border-b-[3px] px-2 ${activeTab === "violation" ? "border-[#C62828] text-[#C62828]" : "border-transparent text-gray-400 hover:text-gray-700"}`}>
            Vi phạm
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400 text-sm font-medium flex flex-col items-center justify-center gap-2">
          <RefreshCw size={24} className="animate-spin text-gray-300" />
          Đang tính toán dữ liệu thống kê...
        </div>
      ) : activeTab === "personal" ? (
        personalStats ? (
          <div className="space-y-6">

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-gray-100 border-l-4 border-l-blue-500 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-800">Tổng ngày công</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center"><Clock size={16} className="text-blue-500" /></div>
                </div>
                <div className="text-2xl font-black text-blue-600">{personalStats.total - personalStats.leave}</div>
                <div className="text-[10px] text-gray-400 font-medium mt-1">Lượt chấm công hợp lệ</div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-gray-100 border-l-4 border-l-amber-500 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-800">Đi trễ</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center"><AlertCircle size={16} className="text-amber-500" /></div>
                </div>
                <div className="text-2xl font-black text-amber-600">{personalStats.late}</div>
                <div className="text-[10px] text-gray-400 font-medium mt-1">Số ngày đi làm muộn</div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-gray-100 border-l-4 border-l-rose-500 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-800">Nghỉ phép / Vắng</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center"><User size={16} className="text-rose-500" /></div>
                </div>
                <div className="text-2xl font-black text-rose-600">{personalStats.leave}</div>
                <div className="text-[10px] text-gray-400 font-medium mt-1">Nghỉ phép & không phép</div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-gray-100 border-l-4 border-l-emerald-500 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-800">Số ngày đúng giờ</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center"><TrendingUp size={16} className="text-emerald-500" /></div>
                </div>
                <div className="text-2xl font-black text-emerald-600">{personalStats.onTime}</div>
                <div className="text-[10px] text-gray-400 font-medium mt-1">Lượt đi làm đúng giờ</div>
              </div>
            </div>

            <div className="bg-[#FAF9F9] rounded-3xl border border-black/5 shadow-sm overflow-hidden">
              <div className="bg-[#C62828] text-white px-6 py-4 flex items-center justify-between">
                <h3 className="font-black text-sm text-white">Nhật ký chấm công cá nhân</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-400 text-xs border-b border-gray-100 uppercase tracking-wider font-bold">
                      <th className="px-6 py-3.5">Thứ</th>
                      <th className="px-6 py-3.5">Ngày</th>
                      <th className="px-6 py-3.5">Giờ vào</th>
                      <th className="px-6 py-3.5">Giờ ra</th>
                      <th className="px-6 py-3.5">Trạng thái</th>
                      <th className="px-6 py-3.5">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {personalStats.logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm font-medium">Không tìm thấy bản ghi chấm công nào</td>
                      </tr>
                    ) : (
                      personalStats.logs.map(log => {
                        const isWeekend = log.status === "weekend"
                        const dayName = getDayOfWeekVN(log.date)
                        const dateVN = log.date.split("-").reverse().join("/")
                        const state = formatStatus(log.status)

                        if (isWeekend) {
                          return (
                            <tr key={log.id} className="bg-emerald-50/20 hover:bg-emerald-50/40 text-gray-700 transition-colors font-semibold border-b border-gray-100">
                              <td className="px-6 py-4 font-bold text-gray-900">{dayName}</td>
                              <td className="px-6 py-4">{dateVN}</td>
                              <td colSpan={4} className="px-6 py-4 text-center text-xs font-black tracking-wider text-emerald-700 bg-emerald-50/30 rounded-lg">
                                LỊCH NGHỈ CUỐI TUẦN
                              </td>
                            </tr>
                          )
                        }

                        let rowBgClass = "hover:bg-gray-50/50 transition-colors font-semibold text-gray-700 border-b border-gray-100"
                        if (log.status === "on-time") {
                          rowBgClass = "bg-emerald-50/80 hover:bg-emerald-100/45 transition-colors font-semibold text-gray-700 border-b border-gray-100"
                        } else if (log.status === "late") {
                          rowBgClass = "bg-amber-50/90 hover:bg-amber-100/55 transition-colors font-semibold text-gray-700 border-b border-gray-100"
                        } else if (log.status === "early") {
                          rowBgClass = "bg-blue-50/85 hover:bg-blue-100/50 transition-colors font-semibold text-gray-700 border-b border-gray-100"
                        } else if (log.status === "leave") {
                          rowBgClass = "bg-purple-50/80 hover:bg-purple-100/45 transition-colors font-semibold text-gray-700 border-b border-gray-100"
                        } else if (log.status === "absent") {
                          rowBgClass = "bg-rose-50/80 hover:bg-rose-100/45 transition-colors font-semibold text-gray-700 border-b border-gray-100"
                        }

                        return (
                          <tr key={log.id} className={rowBgClass}>
                            <td className="px-6 py-4 font-bold text-gray-900">{dayName}</td>
                            <td className="px-6 py-4">{dateVN}</td>
                            <td className="px-6 py-4 font-mono">{log.checkIn || "—"}</td>
                            <td className="px-6 py-4 font-mono">{log.checkOut || "—"}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${state.class}`}>
                                {state.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-400 text-xs font-medium">{log.note || "—"}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 bg-white rounded-3xl border border-gray-150 text-center text-gray-400 text-sm font-medium">
            {currentUserRole === "role-admin" || currentUserRole === "role-super-admin" || currentUserRole === "role-manager"
              ? "Vui lòng chọn nhân sự để xem báo cáo chi tiết."
              : "Không tìm thấy thông tin tài khoản nhân sự kết nối với email của bạn."}
          </div>
        )
      ) : activeTab === "violation" ? (
        <ViolationTab employees={employees} attendance={attendance} selectedBranch={selectedBranch} systemConfig={systemConfig} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#FAF9F9] rounded-3xl border border-black/5 shadow-sm overflow-hidden">
              <div className="bg-[#C62828] text-white px-6 py-4 flex items-center justify-between gap-2">
                <h3 className="font-black text-sm flex items-center gap-2 text-white">
                  <Award size={16} className="text-white/90" />
                  Top đi trễ nhiều nhất
                </h3>
                <button
                  onClick={() => setShowFullRank("late")}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[10px] font-black text-white transition-all cursor-pointer select-none active:scale-95"
                >
                  Chi tiết
                </button>
              </div>
              <div className="p-6 space-y-3.5">
                {rankData.topLateGroups.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs font-semibold">Ghi nhận 0 lượt đi trễ trong kỳ này</div>
                ) : (
                  rankData.topLateGroups.map((group) => {
                    const displayedEmps = group.employees.slice(0, 2)
                    const remainingCount = group.employees.length - 2

                    return (
                      <div key={group.rank} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0
                          ${group.rank === 1 ? "bg-amber-100 text-amber-700 border border-amber-200" 
                            : group.rank === 2 ? "bg-slate-100 text-slate-700 border border-slate-200" 
                            : "bg-orange-100 text-orange-700 border border-orange-200"}`}>
                          {group.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <div className="min-w-0 flex-1">
                              {group.employees.length === 1 ? (
                                <>
                                  <span className="text-sm font-bold text-gray-800 block leading-tight truncate">
                                    {group.employees[0].name}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-semibold truncate block">
                                    {group.employees[0].id} — {group.employees[0].department}
                                  </span>
                                </>
                              ) : (
                                <div className="cursor-pointer" onClick={() => setActiveRankDetail({
                                  title: `Top đi trễ - Hạng ${group.rank} (${group.count} ngày muộn)`,
                                  countLabel: `${group.count} ngày muộn`,
                                  employees: group.employees
                                })}>
                                  <span className="text-sm font-bold text-gray-800 block leading-tight truncate hover:text-[#C62828] transition-colors">
                                    {displayedEmps.map(e => e.name).join(", ")}
                                    {remainingCount > 0 && ` và ${remainingCount} người khác...`}
                                  </span>
                                  <span className="text-[10px] text-[#C62828] font-black hover:underline mt-0.5 flex items-center gap-1">
                                    <AlertCircle size={11} className="flex-shrink-0" />
                                    Đồng hạng — Bấm để xem chi tiết ({group.employees.length} nhân sự)
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-bold text-[#C62828] bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg h-fit flex-shrink-0">
                              {group.count} ngày muộn
                            </span>
                          </div>
                          <div className={`flex h-1.5 mt-2 ${maxNotches === 5 ? "gap-1" : "gap-[2px]"}`}>
                            {Array.from({ length: maxNotches }).map((_, idx) => {
                              const isFilled = idx < group.count
                              const colorClass = group.rank === 1 ? "bg-[#C62828]" : group.rank === 2 ? "bg-[#EA580C]" : "bg-[#F59E0B]"
                              return (
                                <div key={idx} className={`flex-1 h-full rounded-xs transition-colors duration-300 ${isFilled ? colorClass : "bg-gray-100"}`} />
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="bg-[#FAF9F9] rounded-3xl border border-black/5 shadow-sm overflow-hidden">
              <div className="bg-[#C62828] text-white px-6 py-4 flex items-center justify-between gap-2">
                <h3 className="font-black text-sm flex items-center gap-2 text-white">
                  <Users size={16} className="text-white/90" />
                  Top nghỉ phép nhiều nhất
                </h3>
                <button
                  onClick={() => setShowFullRank("leave")}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[10px] font-black text-white transition-all cursor-pointer select-none active:scale-95"
                >
                  Chi tiết
                </button>
              </div>
              <div className="p-6 space-y-3.5">
                {rankData.topLeaveGroups.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs font-semibold">Ghi nhận 0 lượt nghỉ/vắng trong kỳ này</div>
                ) : (
                  rankData.topLeaveGroups.map((group) => {
                    const displayedEmps = group.employees.slice(0, 2)
                    const remainingCount = group.employees.length - 2

                    return (
                      <div key={group.rank} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0
                          ${group.rank === 1 ? "bg-amber-100 text-amber-700 border border-amber-200" 
                            : group.rank === 2 ? "bg-slate-100 text-slate-700 border border-slate-200" 
                            : "bg-orange-100 text-orange-700 border border-orange-200"}`}>
                          {group.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <div className="min-w-0 flex-1">
                              {group.employees.length === 1 ? (
                                <>
                                  <span className="text-sm font-bold text-gray-800 block leading-tight truncate">
                                    {group.employees[0].name}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-semibold truncate block">
                                    {group.employees[0].id} — {group.employees[0].department}
                                  </span>
                                </>
                              ) : (
                                <div className="cursor-pointer" onClick={() => setActiveRankDetail({
                                  title: `Top nghỉ phép - Hạng ${group.rank} (${group.count} ngày nghỉ)`,
                                  countLabel: `${group.count} ngày nghỉ`,
                                  employees: group.employees
                                })}>
                                  <span className="text-sm font-bold text-gray-800 block leading-tight truncate hover:text-blue-600 transition-colors">
                                    {displayedEmps.map(e => e.name).join(", ")}
                                    {remainingCount > 0 && ` và ${remainingCount} người khác...`}
                                  </span>
                                  <span className="text-[10px] text-blue-500 font-black hover:underline mt-0.5 flex items-center gap-1">
                                    <AlertCircle size={11} className="flex-shrink-0" />
                                    Đồng hạng — Bấm để xem chi tiết ({group.employees.length} nhân sự)
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg h-fit flex-shrink-0">
                              {group.count} ngày nghỉ
                            </span>
                          </div>
                          <div className={`flex h-1.5 mt-2 ${maxNotches === 5 ? "gap-1" : "gap-[2px]"}`}>
                            {Array.from({ length: maxNotches }).map((_, idx) => {
                              const isFilled = idx < group.count
                              const colorClass = group.rank === 1 ? "bg-blue-600" : group.rank === 2 ? "bg-blue-500" : "bg-blue-400"
                              return (
                                <div key={idx} className={`flex-1 h-full rounded-xs transition-colors duration-300 ${isFilled ? colorClass : "bg-gray-100"}`} />
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#FAF9F9] rounded-3xl border border-black/5 shadow-sm overflow-hidden min-h-[550px]">
            <div className="bg-[#C62828] text-white px-6 py-4 flex items-center justify-between flex-wrap gap-4">
              <h3 className="font-black text-sm text-white">Bảng thống kê chi tiết</h3>
              <CustomCombobox
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Tìm tên hoặc mã nhân sự..."
                className="max-w-xs text-gray-800"
                heightClass="h-[30px] rounded-2xl"
                showSearchIcon={true}
                options={detailSuggestionsList.map(emp => ({
                  value: emp.name,
                  label: emp.name,
                  desc: `${emp.id} - ${emp.department}`
                }))}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-400 text-xs border-b border-gray-100 uppercase tracking-wider font-bold">
                    <th className="px-6 py-3.5">STT</th>
                    <th className="px-6 py-3.5">Mã NV</th>
                    <th className="px-6 py-3.5">Họ tên</th>
                    <th className="px-6 py-3.5">Đơn vị</th>
                    <th className="px-6 py-3.5">Số ngày đi trễ</th>
                    <th className="px-6 py-3.5">Nghỉ phép</th>
                    <th className="px-6 py-3.5">Vắng mặt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rankData.list.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400 text-sm font-medium">Không tìm thấy nhân sự nào khớp bộ lọc</td>
                    </tr>
                  ) : (
                    rankData.list.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors font-medium text-black border-b border-gray-150">
                        <td className="px-6 py-4 text-black text-xs">{idx + 1}</td>
                        <td className="px-6 py-4 text-black text-xs font-medium">{item.id}</td>
                        <td className="px-6 py-4 text-black font-semibold">{item.name}</td>
                        <td className="px-6 py-4 text-xs font-medium text-black">{item.department}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${item.late > 0 ? "bg-amber-100 text-amber-900 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
                            {item.late}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${item.leave > 0 ? "bg-purple-100 text-purple-900 border-purple-200" : "bg-gray-100 text-gray-700 border-gray-200"}`}>
                            {item.leave}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${item.absent > 0 ? "bg-rose-100 text-rose-900 border-rose-200" : "bg-gray-100 text-gray-700 border-gray-200"}`}>
                            {item.absent}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <Modal
        open={!!activeRankDetail}
        onClose={() => setActiveRankDetail(null)}
        title={activeRankDetail?.title || ""}
        icon={Award}
        width="lg"
        footer={
          <button 
            onClick={() => setActiveRankDetail(null)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        }
      >
        <div className="p-6 overflow-y-auto space-y-3 max-h-[60vh]" style={{ scrollbarWidth: "thin" }}>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Danh sách nhân sự đồng hạng:</p>
          <div className="divide-y divide-gray-100">
            {activeRankDetail?.employees.map((emp) => (
              <div key={emp.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{emp.name}</p>
                  <p className="text-[11px] text-gray-400 font-semibold">{emp.id} — {emp.department}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                  activeRankDetail.countLabel.includes("muộn") 
                    ? "text-[#C62828] bg-rose-50 border-rose-100" 
                    : "text-blue-600 bg-blue-50 border-blue-100"
                }`}>
                  {activeRankDetail.countLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        open={!!showFullRank}
        onClose={() => setShowFullRank(null)}
        title={showFullRank === "late" ? "Bảng xếp hạng đi trễ (Toàn bộ nhân sự)" : "Bảng xếp hạng nghỉ phép (Toàn bộ nhân sự)"}
        icon={showFullRank === "late" ? Award : Users}
        width="xl"
        footer={
          <button 
            onClick={() => setShowFullRank(null)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        }
      >
        <div className="p-6 overflow-y-auto max-h-[65vh]" style={{ scrollbarWidth: "thin" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs border-b border-gray-150 uppercase tracking-wider font-bold">
                  <th className="px-4 py-3 text-center w-12">Hạng</th>
                  <th className="px-4 py-3">Mã NV</th>
                  <th className="px-4 py-3">Họ tên</th>
                  <th className="px-4 py-3">Đơn vị</th>
                  <th className="px-4 py-3">Loại hợp đồng</th>
                  <th className="px-4 py-3 text-right">
                    {showFullRank === "late" ? "Số ngày đi trễ" : "Số ngày nghỉ"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(() => {
                  const list = showFullRank === "late" ? rankAllData.lateRanked : rankAllData.leaveRanked
                  if (list.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-sm font-medium">
                          Không có dữ liệu nhân sự
                        </td>
                      </tr>
                    )
                  }
                  
                  let currentRank = 0
                  let previousCount = -1

                  return list.map((item, idx) => {
                    const countVal = showFullRank === "late" ? item.late : item.leave
                    if (countVal !== previousCount) {
                      currentRank = currentRank + 1
                      previousCount = countVal
                    }
                    const pillClass = showFullRank === "late"
                      ? (countVal > 0 ? "bg-amber-100 text-amber-900 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-100")
                      : (countVal > 0 ? "bg-purple-100 text-purple-900 border-purple-200" : "bg-gray-100 text-gray-700 border-gray-200")
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors font-medium text-black border-b border-gray-150">
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-black
                            ${currentRank === 1 ? "bg-amber-100 text-amber-700 border border-amber-200" 
                              : currentRank === 2 ? "bg-slate-100 text-slate-700 border border-slate-200" 
                              : currentRank === 3 ? "bg-orange-100 text-orange-700 border border-orange-200"
                              : "text-gray-500"}`}>
                            {currentRank}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono font-medium text-black">{item.id}</td>
                        <td className="px-4 py-3 text-black font-semibold">{item.name}</td>
                        <td className="px-4 py-3 text-xs font-medium text-black">{item.department}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            item.contractType === "Chính thức" 
                              ? "bg-blue-50 text-blue-700 border border-blue-100" 
                              : "bg-orange-50 text-orange-700 border border-orange-100"
                          }`}>
                            {item.contractType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${pillClass}`}>
                            {countVal} {showFullRank === "late" ? "ngày" : "ngày"}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ViolationTab({ employees, attendance, selectedBranch, systemConfig }: {
  employees: { id: string; name: string; department: string; status: string; contractType: string; branchId?: string }[]
  attendance: { employeeId: string; date: string; status: string; checkIn?: string; checkOut?: string; note?: string }[]
  selectedBranch: string
  systemConfig: { morningStart: string; morningEnd: string; afternoonStart: string; afternoonEnd: string }
}) {
  const [filterType, setFilterType] = useState<"all" | "late" | "early_checkout" | "forgot_checkout" | "forgot_checkin" | "absent" | "approved_leave">("all")
  const [selectedEmpId, setSelectedEmpId] = useState<string>("all")

  const branchEmployees = employees.filter(e =>
    selectedBranch === "all" || (e as any).branchId === selectedBranch
  )

  const classifyRecord = (a: typeof attendance[0]) => {
    if (a.status === "leave") return "approved_leave"
    if (a.status === "absent") return "absent"

    const cIn = a.checkIn
    const cOut = a.checkOut

    const hasIn = cIn && cIn !== "--" && cIn !== "-"
    const hasOut = cOut && cOut !== "--" && cOut !== "-"

    if (!hasIn && !hasOut) return "absent"
    if (!hasIn) return "forgot_checkin"
    if (!hasOut) return "forgot_checkout"

    const [inH, inM] = (cIn ?? "").split(":").map(Number)
    const [startH, startM] = systemConfig.morningStart.split(":").map(Number)
    const inMins = inH * 60 + inM
    const startMins = startH * 60 + startM
    if (inMins > startMins) return "late"

    const [outH, outM] = (cOut ?? "").split(":").map(Number)
    const [endH, endM] = systemConfig.afternoonEnd.split(":").map(Number)
    const outMins = outH * 60 + outM
    const endMins = endH * 60 + endM
    if (outMins < endMins) return "early_checkout"

    return null
  }

  const getCheckInDisplay = (a: typeof attendance[0]) => {
    const recType = classifyRecord(a)
    if (recType === "approved_leave" || recType === "absent") {
      return <span className="text-gray-400">—</span>
    }
    const val = a.checkIn
    if (!val || val === "--" || val === "-") {
      return <span className="text-red-400 font-bold">Chưa CI</span>
    }
    const [inH, inM] = val.split(":").map(Number)
    const [startH, startM] = systemConfig.morningStart.split(":").map(Number)
    const diff = (inH * 60 + inM) - (startH * 60 + startM)
    if (diff > 0) {
      return (
        <span className="text-amber-600 font-mono font-bold flex items-center gap-1">
          <span>{val}</span>
          <span className="text-[9px] px-1 py-0.5 bg-amber-50 text-amber-600 border border-amber-200/50 rounded font-black">+{diff}p</span>
        </span>
      )
    }
    return <span className="text-gray-700 font-mono font-semibold">{val}</span>
  }

  const getCheckOutDisplay = (a: typeof attendance[0]) => {
    const recType = classifyRecord(a)
    if (recType === "approved_leave" || recType === "absent") {
      return <span className="text-gray-400">—</span>
    }
    const val = a.checkOut
    if (!val || val === "--" || val === "-") {
      return <span className="text-red-400 font-bold">Chưa CO</span>
    }
    const [outH, outM] = val.split(":").map(Number)
    const [endH, endM] = systemConfig.afternoonEnd.split(":").map(Number)
    const diff = (endH * 60 + endM) - (outH * 60 + outM)
    if (diff > 0) {
      return (
        <span className="text-orange-600 font-mono font-bold flex items-center gap-1">
          <span>{val}</span>
          <span className="text-[9px] px-1 py-0.5 bg-orange-50 text-orange-600 border border-orange-200/50 rounded font-black">-{diff}p</span>
        </span>
      )
    }
    return <span className="text-gray-700 font-mono font-semibold">{val}</span>
  }

  const empViolations = useMemo(() => {
    return branchEmployees.map(emp => {
      const empAtt = attendance.filter(a => a.employeeId === emp.id)
      const lateList = empAtt.filter(a => classifyRecord(a) === "late")
      const earlyList = empAtt.filter(a => classifyRecord(a) === "early_checkout")
      const forgotOut = empAtt.filter(a => classifyRecord(a) === "forgot_checkout")
      const forgotIn = empAtt.filter(a => classifyRecord(a) === "forgot_checkin")
      const absentList = empAtt.filter(a => classifyRecord(a) === "absent")
      const leaveList = empAtt.filter(a => classifyRecord(a) === "approved_leave")
      const violations = lateList.length + earlyList.length + forgotOut.length + forgotIn.length + absentList.length
      return { ...emp, lateList, earlyList, forgotOut, forgotIn, absentList, leaveList, violations }
    })
  }, [branchEmployees, attendance, systemConfig])

  const totals = useMemo(() => {
    return {
      late: empViolations.reduce((s, v) => s + v.lateList.length, 0),
      early: empViolations.reduce((s, v) => s + v.earlyList.length, 0),
      forgotOut: empViolations.reduce((s, v) => s + v.forgotOut.length, 0),
      forgotIn: empViolations.reduce((s, v) => s + v.forgotIn.length, 0),
      absent: empViolations.reduce((s, v) => s + v.absentList.length, 0),
      leave: empViolations.reduce((s, v) => s + v.leaveList.length, 0),
    }
  }, [empViolations])

  const displayed = useMemo(() => {
    return empViolations
      .filter(v => {
        if (filterType === "all") return true 
        if (filterType === "late") return v.lateList.length > 0
        if (filterType === "early_checkout") return v.earlyList.length > 0
        if (filterType === "forgot_checkout") return v.forgotOut.length > 0
        if (filterType === "forgot_checkin") return v.forgotIn.length > 0
        if (filterType === "absent") return v.absentList.length > 0
        if (filterType === "approved_leave") return v.leaveList.length > 0
        return true
      })
      .filter(v => selectedEmpId === "all" || v.id === selectedEmpId)
      .sort((a, b) => {
        const severityScore = (v: typeof empViolations[0]) => {
          if (v.absentList.length > 0) return 4
          if (v.leaveList.length > 0) return 3
          if (v.violations > 0) return 2
          return 1
        }
        const sA = severityScore(a)
        const sB = severityScore(b)
        if (sB !== sA) return sB - sA
        const totalA = a.absentList.length + a.leaveList.length + a.violations
        const totalB = b.absentList.length + b.leaveList.length + b.violations
        return totalB - totalA
      })
  }, [empViolations, filterType, selectedEmpId, employees])

  const empOptions = useMemo(() => {
    return [
      { value: "all", label: "Tất cả nhân viên" },
      ...empViolations.map(v => ({
        value: v.id,
        label: `${v.id} - ${v.name}`,
        desc: v.department
      }))
    ]
  }, [empViolations])

  const typeOptions = [
    { value: "all", label: "Tất cả loại vi phạm" },
    { value: "late", label: "Đi trễ" },
    { value: "early_checkout", label: "Check-out sớm" },
    { value: "forgot_checkout", label: "Quên check-out" },
    { value: "forgot_checkin", label: "Quên check-in" },
    { value: "absent", label: "Nghỉ không phép" },
    { value: "approved_leave", label: "Nghỉ có phép" }
  ]

  const statCards = [
    { key: "late", label: "Đi trễ", count: totals.late, icon: Clock, color: "amber", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
    { key: "early_checkout", label: "Check-out sớm", count: totals.early, icon: LogOut, color: "orange", bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
    { key: "forgot_checkout", label: "Quên check-out", count: totals.forgotOut, icon: Timer, color: "purple", bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
    { key: "forgot_checkin", label: "Quên check-in", count: totals.forgotIn, icon: LogIn, color: "blue", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    { key: "absent", label: "Nghỉ không phép", count: totals.absent, icon: UserX, color: "red", bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
    { key: "approved_leave", label: "Nghỉ có phép", count: totals.leave, icon: CheckCircle2, color: "emerald", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  ] as const

  const typeConfig = {
    late: { label: "Đi trễ", icon: Clock, cls: "text-amber-500" },
    early_checkout: { label: "Check-out sớm", icon: LogOut, cls: "text-orange-500" },
    forgot_checkout: { label: "Quên check-out", icon: Timer, cls: "text-purple-500" },
    forgot_checkin: { label: "Quên check-in", icon: LogIn, cls: "text-blue-500" },
    absent: { label: "Nghỉ không phép", icon: UserX, cls: "text-red-500" },
    approved_leave: { label: "Nghỉ có phép", icon: CheckCircle2, cls: "text-emerald-500" },
  } as const

  return (
    <div className="space-y-5 pt-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(s => {
          const Icon = s.icon
          const isActive = filterType === s.key
          const solidBg: Record<string, string> = {
            amber: isActive ? "bg-amber-500" : "bg-amber-100",
            orange: isActive ? "bg-orange-500" : "bg-orange-100",
            purple: isActive ? "bg-purple-500" : "bg-purple-100",
            blue: isActive ? "bg-blue-500" : "bg-blue-100",
            red: isActive ? "bg-red-500" : "bg-red-100",
            emerald: isActive ? "bg-emerald-500" : "bg-emerald-100",
          }
          const cardBg = isActive ? solidBg[s.color] : "bg-white"
          const numColor = isActive ? "text-white" : s.text
          const labelColor = isActive ? "text-white/80" : "text-gray-400"
          const iconBg = isActive ? "bg-white/20" : s.bg
          const iconColor = isActive ? "text-white" : s.text
          const leftBorderColor: Record<string, string> = {
            amber: "border-l-amber-500",
            orange: "border-l-orange-500",
            purple: "border-l-purple-500",
            blue: "border-l-blue-500",
            red: "border-l-red-500",
            emerald: "border-l-emerald-500",
          }
          return (
            <button key={s.key}
              onClick={() => setFilterType(isActive ? "all" : s.key as typeof filterType)}
              className={`relative ${cardBg} rounded-2xl p-4 border transition-all text-left hover:shadow-lg active:scale-[0.97] ${
                isActive ? `border-transparent shadow-lg` : `border-gray-100 shadow-sm hover:border-gray-200 border-l-4 ${leftBorderColor[s.color]}`
              }`}>
              <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-2.5`}>
                <Icon size={17} className={iconColor} />
              </div>
              <p className={`text-3xl font-black ${numColor} leading-none`}>{s.count}</p>
              <p className={`text-[11px] ${labelColor} font-medium mt-1 leading-tight`}>{s.label}</p>
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex flex-col gap-1 min-w-[240px] flex-1 lg:flex-none">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Tìm & chọn nhân viên</span>
          <CustomCombobox
            value={selectedEmpId}
            onChange={setSelectedEmpId}
            placeholder="Tìm kiếm nhân viên..."
            options={empOptions}
            showSearchIcon={true}
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[180px] flex-1 lg:flex-none">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Loại vi phạm</span>
          <CustomSelect
            value={filterType}
            onChange={val => setFilterType(val as any)}
            options={typeOptions}
          />
        </div>

        <div className="ml-auto flex items-center gap-2 self-end h-[34px] px-3.5 bg-gray-50 rounded-xl border border-gray-100">
          <span className="text-xs font-bold text-gray-400">Kết quả:</span>
          <span className="text-xs font-black text-[#C62828]">{displayed.length} nhân viên</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[280px_140px_180px_140px_140px_1fr] bg-[#C62828] text-white text-xs font-bold uppercase tracking-wider">
          <div className="px-5 py-3.5 border-r border-dotted border-white/20">Nhân viên</div>
          <div className="px-5 py-3.5 border-r border-dotted border-white/20">Ngày</div>
          <div className="px-5 py-3.5 border-r border-dotted border-white/20">Loại vi phạm</div>
          <div className="px-5 py-3.5 border-r border-dotted border-white/20">Check-in</div>
          <div className="px-5 py-3.5 border-r border-dotted border-white/20">Check-out</div>
          <div className="px-5 py-3.5">Lý do / Ghi chú</div>
        </div>

        {displayed.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm font-medium">Không có vi phạm nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayed.map((v, rowIdx) => {
              const allLogs = [
                ...v.lateList.map(a => ({ ...a, _type: "late" as const })),
                ...v.earlyList.map(a => ({ ...a, _type: "early_checkout" as const })),
                ...v.forgotOut.map(a => ({ ...a, _type: "forgot_checkout" as const })),
                ...v.forgotIn.map(a => ({ ...a, _type: "forgot_checkin" as const })),
                ...v.absentList.map(a => ({ ...a, _type: "absent" as const })),
                ...v.leaveList.map(a => ({ ...a, _type: "approved_leave" as const })),
              ].sort((a, b) => a.date.localeCompare(b.date))

              const bgClass = rowIdx % 2 === 0 
                ? "bg-[#E0F2FE]/12 hover:bg-[#E0F2FE]/30" 
                : "bg-[#DCFCE7]/12 hover:bg-[#DCFCE7]/30"




              return (
                <div key={v.id} className={`grid grid-cols-[280px_1fr] ${bgClass} transition-colors border-b-2 border-gray-300 last:border-0`}>
                  <div className="px-5 py-4 border-r border-dotted border-gray-300 flex flex-col justify-center">
                    <p className="font-bold text-gray-800 text-sm leading-tight">{v.name}</p>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">{v.id}</p>
                    <div className="flex gap-1 flex-wrap mt-2.5">
                      {v.lateList.length > 0 && <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded border border-amber-200"><Clock size={9} />{v.lateList.length} trễ</span>}
                      {v.earlyList.length > 0 && <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded border border-orange-200"><LogOut size={9} />{v.earlyList.length} CO sớm</span>}
                      {v.forgotOut.length > 0 && <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded border border-purple-200"><Timer size={9} />{v.forgotOut.length} quên CO</span>}
                      {v.forgotIn.length > 0 && <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded border border-blue-200"><LogIn size={9} />{v.forgotIn.length} quên CI</span>}
                      {v.absentList.length > 0 && <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded border border-red-300"><UserX size={9} />{v.absentList.length} nghỉ KP</span>}
                      {v.leaveList.length > 0 && <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200"><CheckCircle2 size={9} />{v.leaveList.length} có phép</span>}
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100/50 h-full flex flex-col justify-center">
                    {allLogs.length === 0 ? (
                      <div className="px-5 py-4 text-emerald-700 text-xs font-semibold italic flex items-center justify-center gap-1.5 bg-white/30 h-full">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Không ghi nhận bất kỳ vi phạm hay nghỉ phép nào trong kỳ
                      </div>
                    ) : (
                      allLogs.map((a, i) => {
                        const cfg = typeConfig[a._type]
                        const Icon = cfg.icon
                        return (
                          <div key={i} className="grid grid-cols-[140px_180px_140px_140px_1fr] items-center text-[12px] h-11 border-b border-gray-100 last:border-b-0">
                            <span className="px-5 py-2.5 border-r border-dotted border-gray-300/80 text-gray-500 font-mono font-medium h-full flex items-center">{a.date.split("-").reverse().join("/")}</span>
                            <span className={`px-5 py-2.5 border-r border-dotted border-gray-300/80 flex items-center gap-1 font-bold ${cfg.cls} text-[11px] h-full`}>
                              <Icon size={11} className="flex-shrink-0" />
                              {cfg.label}
                            </span>
                            <span className="px-5 py-2.5 border-r border-dotted border-gray-300/80 h-full flex items-center">{getCheckInDisplay(a)}</span>
                            <span className="px-5 py-2.5 border-r border-dotted border-gray-300/80 h-full flex items-center">{getCheckOutDisplay(a)}</span>
                            <span className="px-5 py-2.5 text-gray-600 font-medium truncate h-full flex items-center">{a.note || "—"}</span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
