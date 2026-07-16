import React, { useState, useEffect, useMemo } from "react"
import { Lock, Clock, Users, RefreshCw, X, Check, Edit, Save, ArrowDown } from "lucide-react"
import { useToast } from "@/app/hooks/useToast"
import { api } from "@/lib/api"

function formatDuration(days: number) {
  if (days <= 0) return "0 ngày"
  const y = Math.floor(days / 365)
  const m = Math.floor((days % 365) / 30)
  const d = Math.floor((days % 365) % 30)
  const parts = []
  if (y > 0) parts.push(`${y} năm`)
  if (m > 0) parts.push(`${m} tháng`)
  if (d > 0 || parts.length === 0) parts.push(`${d} ngày`)
  return parts.join(" ")
}

export function SystemConfigPage() {
  const [activeTab, setActiveTab] = useState("admin") // "admin" | "attendance" | "bxh"

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      {/* Page Header */}
      <div className="bg-[#C62828] text-white rounded-3xl p-8 mb-6 relative overflow-hidden shadow-lg border border-red-800/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
        <div className="relative z-10 flex items-start gap-4">
          <div className="mt-1 flex gap-1 items-center bg-black/20 p-2 rounded-xl backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-white/40"></span>
            <span className="w-2 h-2 rounded-full bg-white/70"></span>
            <span className="w-2 h-2 rounded-full bg-white"></span>
          </div>
          <div>
            <h1 className="text-2xl font-black mb-1.5 tracking-tight shadow-sm drop-shadow-sm">Tiện ích hệ thống</h1>
            <p className="text-red-100 text-sm font-medium opacity-90 tracking-wide">
              Quản lý và điều chỉnh các thiết lập dùng chung trên toàn hệ thống.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
        <div className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${activeTab === "admin"
              ? "bg-white text-[#C62828] shadow-sm border border-gray-200/50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
          >
            <Lock size={16} /> Quản lý Admin
          </button>

          <button
            onClick={() => setActiveTab("bxh")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${activeTab === "bxh"
              ? "bg-white text-[#C62828] shadow-sm border border-gray-200/50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
          >
            <Users size={16} /> BXH Gắn bó
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === "admin" && <AdminManagementTab />}

          {activeTab === "bxh" && <LoyaltyBoardTab />}
        </div>
      </div>
    </div>
  )
}

function AdminManagementTab() {
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null)
  const [editPassword, setEditPassword] = useState("")
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { showToast } = useToast()

  const loadData = async () => {
    setIsLoading(true)
    try {
      const res = await api.users.list({ includeCoreAdmins: true })
      setAdminUsers((res || []).filter((u: any) => ["0000000000", "1111111111", "2222222222"].includes(u.email)))
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveAdmin = async () => {
    if (!editPassword.trim()) return setEditError("Mật khẩu mới không được để trống")
    setIsSaving(true); setEditError(null)
    try {
      await api.users.updateAdmin(editingAdmin.id, { newPassword: editPassword })
      showToast("Cập nhật mật khẩu tài khoản quản trị thành công!", "success")
      setEditingAdmin(null)
      loadData()
    } catch (err: any) {
      setEditError(err.message || "Đã xảy ra lỗi khi cập nhật")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-5xl animate-in fade-in duration-300">
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 mb-2">
          Quản lý tài khoản Admin
        </h2>
        <p className="text-sm text-gray-500 bg-amber-50 rounded-xl p-3 border border-amber-100 inline-block">
          ⚠️ Chỉnh sửa mật khẩu của các tài khoản quản trị hệ thống gốc. Mã đăng nhập không thể thay đổi.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center text-gray-400">
          <RefreshCw size={24} className="animate-spin mb-2" />
          Đang tải dữ liệu...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {adminUsers.map(admin => {
            const isEditing = editingAdmin?.id === admin.id;
            return (
              <div key={admin.id} className={`rounded-2xl p-6 border transition-all ${isEditing ? "border-[#C62828] bg-red-50/10 shadow-sm" : "border-gray-200 bg-gray-50/50"}`}>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 text-[#C62828] font-black flex items-center justify-center text-xl shadow-sm">
                      {(admin.name || "A").charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{admin.name || "Quản trị viên"}</h3>
                      <p className="text-sm text-gray-500 font-mono mt-0.5">ID: {admin.email}</p>
                    </div>
                  </div>
                  {!isEditing && (
                    <button onClick={() => { setEditingAdmin(admin); setEditPassword(""); setEditError(null); }} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 bg-white hover:border-[#C62828] hover:text-[#C62828] text-sm font-bold transition-all flex items-center gap-1.5 shadow-sm">
                      <Edit size={16} /> Đổi mật khẩu
                    </button>
                  )}
                </div>
                {isEditing && (
                  <div className="pt-5 border-t border-dashed border-gray-200 space-y-4">
                    <div>
                      <label className="block text-xs uppercase font-bold text-gray-400 mb-1.5">Mã đăng nhập (chỉ đọc)</label>
                      <div className="px-4 py-3 bg-gray-100 rounded-xl text-sm font-mono text-gray-500">{admin.email}</div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-bold text-gray-400 mb-1.5">Mật khẩu mới *</label>
                      <input
                        type="password"
                        autoFocus
                        value={editPassword}
                        onChange={e => setEditPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#C62828] rounded-xl text-sm outline-none transition-all"
                        placeholder="Nhập mật khẩu mới..."
                      />
                    </div>
                    {editError && <p className="text-sm text-red-500 font-bold">{editError}</p>}
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => setEditingAdmin(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors">Hủy</button>
                      <button onClick={handleSaveAdmin} disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-[#C62828] text-white font-bold text-sm hover:bg-[#B71C1C] transition-colors flex justify-center items-center gap-2 shadow-md">
                        {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} Lưu mật khẩu
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


function LoyaltyBoardTab() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all") // "all" | "active" | "inactive" 
  const [filterSort, setFilterSort] = useState("desc") // "desc" (longest first) | "asc" (shortest first)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.employees.list()
      setEmployees(res || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const now = new Date()
  const processedData = useMemo(() => {
    let result = employees.map(emp => {
      let joinDate = new Date(emp.joinDate)
      if (isNaN(joinDate.getTime())) {
        joinDate = new Date() // Fallback if missing or invalid
      }

      let endDate = now
      let isWorking = true

      if (emp.status === "inactive" || emp.status === "suspended") {
        isWorking = false
        if (emp.resignDate) {
          const resign = new Date(emp.resignDate)
          if (!isNaN(resign.getTime())) {
            endDate = resign
          }
        }
      }

      let diffTime = endDate.getTime() - joinDate.getTime()
      if (isNaN(diffTime) || diffTime < 0) diffTime = 0

      const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      return {
        ...emp,
        isWorking,
        totalDays,
        formattedDuration: formatDuration(totalDays),
        _joinDateObj: joinDate
      }
    })

    if (filterStatus === "active") result = result.filter(e => e.isWorking)
    if (filterStatus === "inactive") result = result.filter(e => !e.isWorking)

    result.sort((a, b) => {
      if (filterSort === "desc") return b.totalDays - a.totalDays
      return a.totalDays - b.totalDays
    })

    // Assign ranking with ties
    result.forEach((item, index) => {
      if (index === 0) {
        item._calculatedRank = 1;
      } else {
        const prevItem = result[index - 1];
        if (item.totalDays === prevItem.totalDays) {
          item._calculatedRank = prevItem._calculatedRank; // Tied rank
        } else {
          item._calculatedRank = index + 1; // Standard competition ranking
        }
      }
    })

    return result
  }, [employees, filterStatus, filterSort])

  const stats = useMemo(() => {
    return {
      total: employees.length,
      active: employees.filter(e => e.status !== "inactive" && e.status !== "suspended").length,
      inactive: employees.filter(e => e.status === "inactive" || e.status === "suspended").length
    }
  }, [employees])

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl">

      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#C62828]">BXH Người Gắn Bó</h1>
        <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-emerald-600 tracking-wide uppercase">Realtime Database</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <Users size={28} />
          </div>
          <div>
            <div className="text-3xl font-black text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-500 font-semibold mt-1">Tổng số nhân viên</div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <Check size={28} />
          </div>
          <div>
            <div className="text-3xl font-black text-gray-800">{stats.active}</div>
            <div className="text-sm text-gray-500 font-semibold mt-1">Đang làm việc</div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center relative">
            <Users size={28} />
            <X size={14} className="absolute -bottom-1 -right-1 bg-white rounded-full text-red-600" />
          </div>
          <div>
            <div className="text-3xl font-black text-gray-800">{stats.inactive}</div>
            <div className="text-sm text-gray-500 font-semibold mt-1">Đã nghỉ việc</div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-6 border border-cyan-100 border-l-4 border-l-cyan-400 shadow-sm flex flex-wrap lg:flex-nowrap items-end gap-5">
        <div className="flex-1 w-full relative">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Lọc theo trạng thái</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full h-12 px-5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:border-cyan-400 appearance-none shadow-sm transition-all"
          >
            <option value="all">Tất cả nhân viên</option>
            <option value="active">Đang làm việc</option>
            <option value="inactive">Đã nghỉ việc</option>
          </select>
          <ArrowDown size={16} className="absolute right-4 bottom-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="flex-1 w-full relative">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Sắp xếp theo thâm niên</label>
          <select
            value={filterSort}
            onChange={e => setFilterSort(e.target.value)}
            className="w-full h-12 px-5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:border-cyan-400 appearance-none shadow-sm transition-all"
          >
            <option value="desc">Lâu nhất ➔ Mới nhất</option>
            <option value="asc">Mới nhất ➔ Lâu nhất</option>
          </select>
          <ArrowDown size={16} className="absolute right-4 bottom-4 text-gray-400 pointer-events-none" />
        </div>

        <button
          onClick={loadData}
          className="h-12 px-8 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all w-full lg:w-auto shrink-0 justify-center shadow-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Làm mới
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-red-100 border-l-4 border-l-[#C62828] shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <h3 className="text-lg font-black text-gray-800 flex items-center gap-2.5">
            🏆 Bảng xếp hạng thâm niên
          </h3>
          <div className="text-sm text-gray-500 font-bold flex items-center gap-2">
            <Clock size={16} /> Ngày: {now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100">
                <th className="py-5 px-8 text-xs font-black text-gray-400 uppercase tracking-wider w-20 text-center">#</th>
                <th className="py-5 px-5 text-xs font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Mã nhân viên</th>
                <th className="py-5 px-5 text-xs font-black text-gray-400 uppercase tracking-wider">Tên nhân viên</th>
                <th className="py-5 px-5 text-xs font-black text-gray-400 uppercase tracking-wider">Ngày bắt đầu</th>
                <th className="py-5 px-5 text-xs font-black text-gray-400 uppercase tracking-wider">Thời gian làm việc</th>
                <th className="py-5 px-8 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-400">
                    <RefreshCw size={28} className="animate-spin mx-auto mb-3" />
                    Đang tải danh sách...
                  </td>
                </tr>
              )}
              {!loading && processedData.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-400 font-medium text-lg">Không tìm thấy nhân viên nào phù hợp</td>
                </tr>
              )}
              {!loading && processedData.map((emp, index) => {
                let rank = emp._calculatedRank || (index + 1);

                let rankColor = "text-gray-500 border-gray-200"
                if (filterSort === "desc") {
                  if (rank === 1) rankColor = "text-amber-500 border-amber-300 bg-amber-50"
                  if (rank === 2) rankColor = "text-slate-500 border-slate-300 bg-slate-50"
                  if (rank === 3) rankColor = "text-orange-500 border-orange-300 bg-orange-50"
                }

                return (
                  <tr key={emp.id} className="border-b border-gray-50/50 hover:bg-red-50/20 transition-colors group">
                    <td className="py-4 px-8">
                      <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-black mx-auto ${rankColor}`}>
                        {rank}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-mono font-bold">
                        {emp.id.replace('emp-', '')}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-base text-gray-800">{emp.name}</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-sm font-medium text-gray-600">
                        {emp._joinDateObj.toLocaleDateString("en-GB")}
                      </div>
                      {!emp.isWorking && emp.resignDate && (
                        <div className="text-xs text-red-400 mt-1 font-semibold">Nghỉ việc: {new Date(emp.resignDate).toLocaleDateString("en-GB")}</div>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-emerald-600 text-sm">{emp.formattedDuration}</div>
                      <div className="text-xs text-gray-400 mt-1 font-medium">{emp.isWorking ? "Tính đến hiện tại: " : "Đã làm: "} {emp.totalDays} ngày</div>
                    </td>
                    <td className="py-4 px-8 text-right">
                      {emp.isWorking ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Đang làm việc
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100">
                          <span className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white font-black leading-none pb-0.5">×</span> Nghỉ việc
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
