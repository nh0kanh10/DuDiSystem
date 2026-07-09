import React, { useState, useMemo } from "react"
import {
  Users, Clock, AlertCircle, TrendingUp, Award, Calendar,
  ChevronRight, ArrowRight, UserCheck, UserX, FileText, Bell
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from "recharts"
import { Employee, AttendanceRecord, LeaveRequest, Page } from "../../types"
import { Badge } from "../ui/badge"
import { AvatarCircle } from "../ui/AvatarCircle"
import { StatCard } from "../ui/StatCard"
import { CalendarWidget } from "../ui/CalendarWidget"
import { DigitalClock } from "../ui/DigitalClock"
import { calcHours } from "../../utils"
import {
  WEEKLY_STATS, MONTHLY_STATS, PIE_DATA, VIOLATIONS,
  NOTIFICATIONS, ATTENDANCE, INIT_TASKS
} from "../../constants"

export function AdminDashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [timeTab, setTimeTab] = useState<"week" | "month">("week")

  const summary = useMemo(() => {
    const present = ATTENDANCE.filter(r => r.status === "on-time" || r.status === "late").length
    const absent = ATTENDANCE.filter(r => r.status === "absent").length
    const leave = ATTENDANCE.filter(r => r.status === "leave").length
    return { present, absent, leave, total: ATTENDANCE.length }
  }, [])

  return (
    <div className="space-y-6 select-none">
      {/* Top Banner widgets */}
      <div className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:10px_10px] rounded-3xl p-6 text-white relative overflow-hidden shadow-md shadow-red-900/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Xin chào, Quản trị viên!</h2>
            <p className="text-xs text-white/50 mt-1 max-w-md leading-relaxed">
              Hệ thống ghi nhận mọi hoạt động chấm công ổn định. Hiện có {summary.present}/{summary.total} nhân sự đang làm việc trực tiếp tại văn phòng.
            </p>
          </div>
          <DigitalClock />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Tổng nhân sự" value={summary.total} sub="Đang hoạt động trong hệ thống" iconBg="bg-blue-50/50" iconColor="text-blue-600" icon={Users} />
        <StatCard title="Đúng giờ / Trễ" value={`${ATTENDANCE.filter(r => r.status === "on-time").length} / ${ATTENDANCE.filter(r => r.status === "late").length}`} sub="Tỉ lệ đi trễ: 12%" iconBg="bg-green-50/50" iconColor="text-green-600" icon={UserCheck} />
        <StatCard title="Vắng mặt" value={summary.absent} sub="Nghỉ không phép hôm nay" iconBg="bg-red-50/50" iconColor="text-red-600" icon={UserX} />
        <StatCard title="Nghỉ phép" value={summary.leave} sub="Đăng ký nghỉ có phép hôm nay" iconBg="bg-purple-50/50" iconColor="text-purple-600" icon={Clock} />
      </div>

      {/* Main Charts & Side Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Thống kê chuyên cần</h3>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">Biểu đồ tổng hợp dữ liệu đi làm của nhân sự</p>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner border border-gray-200">
              <button onClick={() => setTimeTab("week")} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${timeTab === "week" ? "bg-white text-gray-800 shadow-xs" : "text-gray-400 hover:text-gray-700"}`}>Tuần này</button>
              <button onClick={() => setTimeTab("month")} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${timeTab === "month" ? "bg-white text-gray-800 shadow-xs" : "text-gray-400 hover:text-gray-700"}`}>Tháng này</button>
            </div>
          </div>

          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeTab === "week" ? WEEKLY_STATS : MONTHLY_STATS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey={timeTab === "week" ? "day" : "month"} stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold", color: "#6b7280", paddingTop: "15px" }} />
                <Bar dataKey="Đúng giờ" fill="#16A34A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Đi trễ" fill="#EA580C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Vắng mặt" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Calendar Widget */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col justify-between">
          <CalendarWidget />
        </div>
      </div>

      {/* Bottom Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Recent Violations */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
          <h3 className="font-bold text-gray-800 text-sm mb-4">Nhân viên đi muộn nhiều</h3>
          <div className="space-y-4">
            {VIOLATIONS.map((v, i) => (
              <div key={v.name} className="flex items-center justify-between pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-red-50 text-red-600 rounded-lg flex items-center justify-center text-xs font-bold">{i + 1}</div>
                  <span className="text-xs font-semibold text-gray-700">{v.name}</span>
                </div>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{v.count} lần</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Attendance Activity Log */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 text-sm">Nhật ký chấm công gần đây</h3>
            <button onClick={() => onNavigate("cham-cong")} className="text-xs font-bold text-[#C62828] hover:underline flex items-center gap-1">
              Xem tất cả <ChevronRight size={13} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 font-bold border-b border-gray-50">
                  <th className="py-2.5 px-3">Nhân viên</th>
                  <th className="py-2.5 px-3">Bộ phận</th>
                  <th className="py-2.5 px-3">Check In</th>
                  <th className="py-2.5 px-3">Check Out</th>
                  <th className="py-2.5 px-3">Tổng giờ</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-600">
                {ATTENDANCE.slice(0, 5).map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-gray-800">{r.employeeName}</td>
                    <td className="py-2.5 px-3">{r.department}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-700">{r.checkIn}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-400">{r.checkOut}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-700">{calcHours(r.checkIn, r.checkOut)}</td>
                    <td className="py-2.5 px-3"><Badge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
