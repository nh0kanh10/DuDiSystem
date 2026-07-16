import React, { useState, useEffect, useMemo } from "react"
import {
  Users, Clock, AlertCircle, ChevronRight,
  UserCheck, UserX, Bell, Loader2, Calendar,
  Gift, FileText, CalendarDays
} from "lucide-react"
import { Page } from "../../types"
import { Badge } from "../ui/badge"
import { StatCard } from "../ui/StatCard"
import { DigitalClock } from "../ui/DigitalClock"
import { api } from "@/lib/api"
import { isInternContractType } from "../cham-cong/attendanceModel"

const formatDate = (d: string) => {
  if (!d) return "--"
  const [y, m, day] = d.split("-")
  return `${day}/${m}/${y}`
}

interface NotificationItem {
  type: "birthday" | "intern" | "leave" | "profile_update"
  title: string
  text: string
  accent: string
  icon: React.ComponentType<any>
}

export function AdminDashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [stats, setStats] = useState<any>(null)
  const [attendanceList, setAttendanceList] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [profileUpdates, setProfileUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dashboardTab, setDashboardTab] = useState<"all" | "staff" | "intern">("all")

  const fetchDashboardData = () => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())

    Promise.all([
      api.dashboard.stats(),
      api.attendance.list({ date: today }),
      api.employees.list(),
      api.requests.list({ status: "pending" }),
      api.profileUpdates.list()
    ]).then(([statsRes, attendanceRes, employeesRes, requestsRes, profileUpdatesRes]) => {
      setStats(statsRes)
      setAttendanceList(attendanceRes as any[])
      setEmployees(employeesRes as any[])
      setRequests(requestsRes as any[])
      setProfileUpdates(profileUpdatesRes as any[])
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const parseVnDate = (dateStr: string) => {
    if (!dateStr) return null
    const [day, month, year] = dateStr.split("/").map(Number)
    return new Date(year, month - 1, day)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "--"
    const parts = dateStr.split("-")
    if (parts.length !== 3) return dateStr
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }

  const computedNotifications = useMemo((): NotificationItem[] => {
    const list: NotificationItem[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    employees.forEach(emp => {
      if (!emp.dob || emp.status !== "active") return
      const dobParts = emp.dob.split("/")
      if (dobParts.length !== 3) return
      const bDay = parseInt(dobParts[0], 10)
      const bMonth = parseInt(dobParts[1], 10) - 1

      let bDate = new Date(today.getFullYear(), bMonth, bDay)
      if (bDate.getTime() < today.getTime()) {
        bDate = new Date(today.getFullYear() + 1, bMonth, bDay)
      }

      const diffTime = bDate.getTime() - today.getTime()
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        list.push({
          type: "birthday",
          title: "Sinh nhật nhân viên",
          text: `Hôm nay là sinh nhật của ${emp.name}`,
          accent: "border-rose-100/70 bg-gradient-to-br from-rose-50/50 to-amber-50/20 border-l-rose-500 text-rose-600",
          icon: Gift
        })
      } else if (diffDays >= 1 && diffDays <= 3) {
        list.push({
          type: "birthday",
          title: "Sinh nhật nhân viên",
          text: `Sinh nhật ${emp.name} sau ${diffDays} ngày`,
          accent: "border-rose-100/40 bg-gradient-to-br from-rose-50/20 to-amber-50/10 border-l-rose-400 text-rose-500",
          icon: Gift
        })
      }
    })

    employees.forEach(emp => {
      if (emp.contractType !== "intern" || !emp.internEndDate || emp.status !== "active") return
      const endDate = parseVnDate(emp.internEndDate)
      if (!endDate) return
      endDate.setHours(0, 0, 0, 0)

      const diffTime = endDate.getTime() - today.getTime()
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        list.push({
          type: "intern",
          title: "Kết thúc thực tập",
          text: `Hôm nay là ngày cuối. Hôm nay kết thúc thực tập của ${emp.name}`,
          accent: "border-amber-100/70 bg-gradient-to-br from-amber-50/50 to-orange-50/20 border-l-amber-500 text-amber-600",
          icon: CalendarDays
        })
      } else if (diffDays === 1) {
        list.push({
          type: "intern",
          title: "Kết thúc thực tập",
          text: `${emp.name} kết thúc thực tập sau 1 ngày`,
          accent: "border-amber-100/40 bg-gradient-to-br from-amber-50/20 to-orange-50/10 border-l-amber-400 text-amber-500",
          icon: CalendarDays
        })
      } else if (diffDays === 2 || diffDays === 3) {
        list.push({
          type: "intern",
          title: "Kết thúc thực tập",
          text: `${emp.name} kết thúc thực tập sau ${diffDays} ngày`,
          accent: "border-amber-100/40 bg-gradient-to-br from-amber-50/20 to-orange-50/10 border-l-amber-400 text-amber-500",
          icon: CalendarDays
        })
      }
    })

    const pendingLeaveCount = requests.filter(req => req.status === "pending").length
    if (pendingLeaveCount > 0) {
      list.push({
        type: "leave",
        title: "Đơn xin nghỉ phép",
        text: `Còn ${pendingLeaveCount} đơn xin phép chưa duyệt`,
        accent: "border-blue-100/70 bg-blue-50/30 border-l-blue-500 text-blue-600",
        icon: FileText
      })
    }

    profileUpdates.forEach(req => {
      if (req.status !== "pending_approval") return
      const reqEmp = employees.find(e => e.id === req.employeeId)
      const empName = reqEmp?.name || req.employeeId

      list.push({
        type: "profile_update",
        title: "Duyệt hồ sơ cập nhật",
        text: `Hồ sơ cập nhật của ${empName} đang chờ duyệt`,
        accent: "border-indigo-100/70 bg-indigo-50/30 border-l-indigo-500 text-indigo-600",
        icon: UserCheck
      })
    })

    return list
  }, [employees, requests, profileUpdates])

  const filteredList = useMemo(() => {
    if (dashboardTab === "all") return attendanceList
    return attendanceList.filter(r => {
      const emp = employees.find((e: { id: string; contractType?: string }) => e.id === r.employeeId)
      // Phân loại theo loại hợp đồng, không theo employeeStatus trên bản ghi chấm công
      if (emp) {
        const isIntern = isInternContractType(emp.contractType)
        return dashboardTab === "intern" ? isIntern : !isIntern
      }
      return r.employeeStatus === dashboardTab
    })
  }, [attendanceList, dashboardTab, employees])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-gray-400">
        <Loader2 size={36} className="animate-spin text-[#C62828] mb-4" />
        <span className="text-sm font-semibold">Đang tải dữ liệu dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 select-none">
      <div className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px] p-5 rounded-2xl text-white flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div className="flex items-center">
          <div className="flex gap-1.5 items-center mr-4 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white/30 animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/60 animate-pulse delay-75" />
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse delay-150" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Tổng quan hệ thống</h2>
            <p className="text-xs text-white/80 mt-1">Ghi nhận hoạt động chấm công, nghỉ phép và thông báo quan trọng</p>
          </div>
        </div>
        <DigitalClock />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Tổng nhân sự" value={stats?.activeEmployees || 0} sub="Đang làm việc" iconBg="bg-blue-50/50" iconColor="text-blue-600" icon={Users} />
        <StatCard
          title="Đúng giờ / Trễ"
          value={(() => {
            const sOnTime = stats?.attendance?.staff?.onTime || 0
            const sLate = stats?.attendance?.staff?.late || 0
            const iOnTime = stats?.attendance?.intern?.onTime || 0
            const iLate = stats?.attendance?.intern?.late || 0
            if (dashboardTab === "all") return `${sOnTime + iOnTime} / ${sLate + iLate} người`
            if (dashboardTab === "staff") return `${sOnTime} / ${sLate} người`
            return `${iOnTime} / ${iLate} người`
          })()}
          sub={dashboardTab === "all" ? "Toàn bộ — hôm nay" : dashboardTab === "staff" ? "Chính thức — hôm nay" : "Thực tập — hôm nay"}
          iconBg="bg-green-50/50"
          iconColor="text-green-600"
          icon={UserCheck}
        />
        <StatCard
          title="Vắng mặt"
          value={`${dashboardTab === "all"
            ? (stats?.attendance?.staff?.absent || 0) + (stats?.attendance?.intern?.absent || 0)
            : dashboardTab === "staff"
              ? stats?.attendance?.staff?.absent || 0
              : stats?.attendance?.intern?.absent || 0
            } người`}
          sub={dashboardTab === "all" ? "Toàn bộ — hôm nay" : dashboardTab === "staff" ? "Chính thức — hôm nay" : "Thực tập — hôm nay"}
          iconBg="bg-red-50/50"
          iconColor="text-red-600"
          icon={UserX}
        />
        <StatCard
          title="Nghỉ phép"
          value={`${dashboardTab === "all"
            ? (stats?.attendance?.staff?.leave || 0) + (stats?.attendance?.intern?.leave || 0)
            : dashboardTab === "staff"
              ? stats?.attendance?.staff?.leave || 0
              : stats?.attendance?.intern?.leave || 0
            } người`}
          sub={dashboardTab === "all" ? "Toàn bộ — hôm nay" : dashboardTab === "staff" ? "Chính thức — hôm nay" : "Thực tập — hôm nay"}
          iconBg="bg-purple-50/50"
          iconColor="text-purple-600"
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col min-h-[450px]">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-4">
            <Bell size={18} className="text-[#C62828]" />
            <h3 className="font-bold text-gray-800 text-sm">Bảng thông báo</h3>
          </div>

          {computedNotifications.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10">
              <AlertCircle size={32} className="mb-2 stroke-1" />
              <span className="text-xs font-semibold">Không có thông báo mới</span>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] pr-1 scrollbar-thin">
              {computedNotifications.map((notif, index) => {
                const IconComponent = notif.icon
                const isClickable = notif.type === "leave" || notif.type === "profile_update"

                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (notif.type === "leave") onNavigate("duyet-don")
                      else if (notif.type === "profile_update") onNavigate("nhan-su")
                    }}
                    className={`p-4 rounded-2xl border-l-4 border shadow-[0_2px_8px_-3px_rgba(0,0,0,0.02)] transition-all flex gap-3.5 items-start ${notif.accent} ${isClickable ? "cursor-pointer hover:scale-[1.01] hover:shadow-xs" : ""
                      }`}
                  >
                    <div className="p-1.5 rounded-xl bg-white shadow-2xs flex-shrink-0 flex items-center justify-center">
                      <IconComponent size={14} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[11px] font-extrabold uppercase tracking-wider mb-1 flex items-center justify-between text-gray-800">
                        <span>{notif.title}</span>
                        {isClickable && (
                          <span className="text-[9px] font-black px-2 py-0.5 bg-white shadow-2xs border border-gray-100 rounded-full flex items-center gap-0.5 text-gray-600">
                            Duyệt ngay <ChevronRight size={10} />
                          </span>
                        )}
                      </h4>
                      <p className="text-xs font-bold text-gray-600 leading-relaxed">{notif.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col min-h-[450px]">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <h3 className="font-bold text-gray-800 text-sm">Nhật ký chấm công gần đây</h3>
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setDashboardTab("all")}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${dashboardTab === "all" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setDashboardTab("staff")}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${dashboardTab === "staff" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  Chính thức
                </button>
                <button
                  onClick={() => setDashboardTab("intern")}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${dashboardTab === "intern" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  Thực tập
                </button>
              </div>
              <button onClick={() => onNavigate("cham-cong")} className="text-xs font-bold text-[#C62828] hover:underline flex items-center gap-1">
                Xem tất cả <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {filteredList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10">
              <Users size={32} className="mb-2 stroke-1" />
              <span className="text-xs font-semibold">Chưa có lượt chấm công nào hôm nay</span>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs text-left">
                <thead>
                  {dashboardTab === "all" ? (
                    <tr className="bg-gray-50/50 text-gray-400 font-bold border-b border-gray-100">
                      <th className="py-2.5 px-3">Ngày</th>
                      <th className="py-2.5 px-3">Nhân viên</th>
                      <th className="py-2.5 px-3">Bộ phận</th>
                      <th className="py-2.5 px-3">Loại</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                    </tr>
                  ) : dashboardTab === "staff" ? (
                    <tr className="bg-gray-50/50 text-gray-400 font-bold border-b border-gray-100">
                      <th className="py-2.5 px-3">Ngày</th>
                      <th className="py-2.5 px-3">Nhân viên</th>
                      <th className="py-2.5 px-3">Bộ phận</th>
                      <th className="py-2.5 px-3">Check In</th>
                      <th className="py-2.5 px-3">Check Out</th>
                      <th className="py-2.5 px-3">Tổng giờ</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                    </tr>
                  ) : (
                    <tr className="bg-gray-50/50 text-gray-400 font-bold border-b border-gray-100">
                      <th className="py-2.5 px-3">Ngày</th>
                      <th className="py-2.5 px-3">Nhân viên</th>
                      <th className="py-2.5 px-3">Bộ phận</th>
                      <th className="py-2.5 px-3">Ca Sáng</th>
                      <th className="py-2.5 px-3">Ca Chiều</th>
                      <th className="py-2.5 px-3">Tổng giờ</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600">
                  {filteredList.slice(0, 10).map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 px-3 text-gray-500 font-medium whitespace-nowrap">{formatDate(r.date)}</td>
                      <td className="py-2.5 px-3 font-semibold text-gray-800">{r.employeeName}</td>
                      <td className="py-2.5 px-3 text-gray-500">{r.department}</td>
                      {dashboardTab === "all" ? (
                        <>
                          <td className="py-2.5 px-3">
                            {(() => {
                              const emp = employees.find((e: { id: string; contractType?: string }) => e.id === r.employeeId)
                              const isIntern = emp
                                ? isInternContractType(emp.contractType)
                                : r.employeeStatus === "intern"
                              return (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${isIntern
                                  ? "bg-violet-50 text-violet-600 border border-violet-100"
                                  : "bg-blue-50 text-blue-600 border border-blue-100"
                                  }`}>
                                  {isIntern ? "Thực tập" : "Chính thức"}
                                </span>
                              )
                            })()}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap"><Badge status={r.status} /></td>
                        </>
                      ) : dashboardTab === "staff" ? (
                        <>
                          <td className="py-2.5 px-3 font-mono font-bold text-gray-700">{r.checkIn || "--"}</td>
                          <td className="py-2.5 px-3 font-mono text-gray-400">{r.checkOut || "--"}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-gray-700">{r.workingHours || "--"}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap"><Badge status={r.status} /></td>
                        </>
                      ) : (
                        <>
                          <td className="py-2.5 px-3 font-mono text-gray-700">
                            {r.checkInAm && r.checkInAm !== "--" ? `${r.checkInAm} - ${r.checkOutAm || "--"}` : "--"}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-gray-700">
                            {r.checkInPm && r.checkInPm !== "--" ? `${r.checkInPm} - ${r.checkOutPm || "--"}` : "--"}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-gray-700">{r.workingHours || "--"}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap"><Badge status={r.status} /></td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
