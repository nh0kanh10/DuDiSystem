import React, { useState, useMemo } from "react"
import { Search, Calendar, FileText, Download, Edit2, UserCheck, Clock, UserX } from "lucide-react"
import { AttendanceRecord } from "../../types"
import { Badge } from "../ui/Badge"
import { StatCard } from "../ui/StatCard"
import { ATTENDANCE } from "../../constants"
import { calcHours } from "../../utils"

export function AttendanceManagement() {
  const [search, setSearch] = useState("")
  const [filterDept, setFilterDept] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const stats = useMemo(() => {
    const present = ATTENDANCE.filter(r => r.status === "on-time" || r.status === "late").length
    const late = ATTENDANCE.filter(r => r.status === "late").length
    const absent = ATTENDANCE.filter(r => r.status === "absent").length
    return { present, late, absent }
  }, [])

  const filtered = useMemo(() => {
    return ATTENDANCE.filter(r => {
      const matchSearch = r.employeeName.toLowerCase().includes(search.toLowerCase()) || r.employeeId.toLowerCase().includes(search.toLowerCase())
      const matchDept = filterDept === "all" || r.department.toLowerCase() === filterDept.toLowerCase()
      const matchStatus = filterStatus === "all" || r.status === filterStatus
      return matchSearch && matchDept && matchStatus
    })
  }, [search, filterDept, filterStatus])

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
            <h2 className="text-xl font-black tracking-tight text-white">Quản lý chấm công</h2>
            <p className="text-xs text-white/80 mt-1">Nhật ký chấm công nhân sự và trạng thái hiện diện hàng ngày</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer">
          <Download size={14} /> Xuất file excel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Hiện diện" value={stats.present} sub="Nhân sự đi làm hôm nay" iconBg="bg-green-50/50" iconColor="text-green-600" icon={UserCheck} />
        <StatCard title="Đi muộn" value={stats.late} sub="Nhân viên đi muộn trong ngày" iconBg="bg-orange-50/50" iconColor="text-orange-600" icon={Clock} />
        <StatCard title="Vắng mặt" value={stats.absent} sub="Không có mặt tại văn phòng" iconBg="bg-red-50/50" iconColor="text-red-600" icon={UserX} />
      </div>

      <div className="bg-white rounded-3xl p-5 border border-black/5 shadow-xs space-y-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[260px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nhân sự theo tên hoặc ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 text-gray-700 bg-gray-50/30" />
          </div>
          <div className="flex gap-2">
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 bg-white cursor-pointer">
              <option value="all">Tất cả phòng ban</option>
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="Design">Design</option>
              <option value="PM">PM</option>
              <option value="HR">HR</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 bg-white cursor-pointer">
              <option value="all">Tất cả trạng thái</option>
              <option value="on-time">Đúng giờ</option>
              <option value="late">Đi trễ</option>
              <option value="leave">Nghỉ phép</option>
              <option value="absent">Vắng mặt</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 text-gray-400 font-semibold border-b border-gray-100 text-xs">
                <th className="py-3.5 px-4">Mã NV</th>
                <th className="py-3.5 px-4">Họ và tên</th>
                <th className="py-3.5 px-4">Phòng ban</th>
                <th className="py-3.5 px-4">Giờ Check-in</th>
                <th className="py-3.5 px-4">Giờ Check-out</th>
                <th className="py-3.5 px-4">Tổng giờ</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs">{r.employeeId}</td>
                  <td className="py-3.5 px-4 font-bold text-gray-800">{r.employeeName}</td>
                  <td className="py-3.5 px-4">{r.department}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-700">{r.checkIn}</td>
                  <td className="py-3.5 px-4 font-mono text-gray-400">{r.checkOut}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-700">{calcHours(r.checkIn, r.checkOut)}</td>
                  <td className="py-3.5 px-4"><Badge status={r.status} /></td>
                  <td className="py-3.5 px-4 text-center">
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                      <Edit2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">Không tìm thấy bản ghi chấm công nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
