import React, { useState, useEffect, useMemo } from "react"
import { X, Lock, Clock, Users, RefreshCw, Filter, Search, Check, Save, Edit, ArrowDown } from "lucide-react"
import { useToast } from "@/app/hooks/useToast"
import { api } from "@/lib/api"

// Helper function to format duration
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

export function AdminUtilitiesOverlay({ initialTab = "bxh", onClose }: { initialTab?: string, onClose: () => void }) {
    const [activeTab, setActiveTab] = useState(initialTab)

    return (
        <div className="fixed inset-0 z-[9999] bg-gray-50 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            {/* HEADER */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex gap-2 p-1 bg-gray-100/80 rounded-xl border border-gray-200/60">
                    <button
                        onClick={() => setActiveTab("admin")}
                        className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === "admin" ? "bg-white text-[#C62828] shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                            }`}
                    >
                        <Lock size={16} /> Quản lý Admin
                    </button>
                    <button
                        onClick={() => setActiveTab("attendance")}
                        className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === "attendance" ? "bg-white text-[#C62828] shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                            }`}
                    >
                        <Clock size={16} /> Điều chỉnh chấm công
                    </button>
                    <button
                        onClick={() => setActiveTab("bxh")}
                        className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === "bxh" ? "bg-white text-[#C62828] shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                            }`}
                    >
                        <Users size={16} /> BXH Gắn bó
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-[#C62828] transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-auto p-6 scroll-smooth">
                <div className="max-w-6xl mx-auto w-full">
                    {activeTab === "admin" && <AdminManagementTab />}
                    {activeTab === "attendance" && <AttendanceAdjustmentTab />}
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
        <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 mb-2">
                    <Lock className="text-[#C62828]" /> Quản lý tài khoản Admin
                </h2>
                <p className="text-sm text-gray-500 mb-6 bg-amber-50 rounded-xl p-3 border border-amber-100">
                    Chỉnh sửa mật khẩu của các tài khoản quản trị hệ thống gốc. Mã đăng nhập không thể thay đổi.
                </p>

                {isLoading ? (
                    <div className="py-20 text-center flex flex-col items-center text-gray-400">
                        <RefreshCw size={24} className="animate-spin mb-2" />
                        Đang tải dữ liệu...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {adminUsers.map(admin => {
                            const isEditing = editingAdmin?.id === admin.id;
                            return (
                                <div key={admin.id} className={`rounded-2xl p-5 border transition-all ${isEditing ? "border-[#C62828] bg-red-50/10 shadow-sm" : "border-gray-200 bg-gray-50/50"}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex gap-3 items-center">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-100 to-red-50 text-[#C62828] font-black flex items-center justify-center text-lg shadow-sm">
                                                {(admin.name || "A").charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-base">{admin.name || "Quản trị viên"}</h3>
                                                <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {admin.email}</p>
                                            </div>
                                        </div>
                                        {!isEditing && (
                                            <button onClick={() => { setEditingAdmin(admin); setEditPassword(""); setEditError(null); }} className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 bg-white hover:border-[#C62828] hover:text-[#C62828] text-xs font-bold transition-all flex items-center gap-1">
                                                <Edit size={14} /> Đổi mật khẩu
                                            </button>
                                        )}
                                    </div>
                                    {isEditing && (
                                        <div className="pt-4 border-t border-dashed border-gray-200 space-y-3">
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Mã đăng nhập (chỉ đọc)</label>
                                                <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono text-gray-500">{admin.email}</div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Mật khẩu mới *</label>
                                                <input
                                                    type="password"
                                                    autoFocus
                                                    value={editPassword}
                                                    onChange={e => setEditPassword(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 focus:border-[#C62828] rounded-lg text-sm outline-none transition-all"
                                                    placeholder="Nhập mật khẩu mới..."
                                                />
                                            </div>
                                            {editError && <p className="text-xs text-red-500 font-bold">{editError}</p>}
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={() => setEditingAdmin(null)} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200 transition-colors">Hủy</button>
                                                <button onClick={handleSaveAdmin} disabled={isSaving} className="flex-1 py-2 rounded-lg bg-[#C62828] text-white font-bold text-xs hover:bg-[#B71C1C] transition-colors flex justify-center items-center gap-2">
                                                    {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Lưu mật khẩu
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
        </div>
    )
}

function AttendanceAdjustmentTab() {
    return (
        <div className="bg-white rounded-3xl p-10 shadow-sm border border-black/5 text-center flex flex-col items-center justify-center min-h-[400px]">
            <Clock size={48} className="text-gray-300 mb-4" />
            <h2 className="text-xl font-black text-gray-800 mb-2">Điều chỉnh chấm công</h2>
            <p className="text-gray-500 text-sm max-w-md">Tính năng này đang trong quá trình nâng cấp để mang lại trải nghiệm quản trị tốt hơn. Vui lòng quay lại sau.</p>
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
            // Load all without status limit so we get inactive ones as well
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

    // Process data for UI
    const now = new Date()
    const processedData = useMemo(() => {
        let result = employees.map(emp => {
            const joinDate = new Date(emp.joinDate || Date.now())
            let endDate = now
            let isWorking = true

            // Assume inactive users have resignDate or not, otherwise just use now
            if (emp.status === "inactive" || emp.status === "suspended") {
                isWorking = false
                if (emp.resignDate) {
                    endDate = new Date(emp.resignDate)
                }
            }

            const diffTime = Math.max(0, endDate.getTime() - joinDate.getTime())
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
        <div className="space-y-6 animate-in fade-in duration-300">

            {/* Header section */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-[#C62828]">BXH Người Gắn Bó</h1>
                <div className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-emerald-600">Realtime Database</span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-gray-800">{stats.total}</div>
                        <div className="text-xs text-gray-500 font-semibold mt-1">Tổng số nhân viên</div>
                    </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                        <Check size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-gray-800">{stats.active}</div>
                        <div className="text-xs text-gray-500 font-semibold mt-1">Đang làm việc</div>
                    </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center relative">
                        <Users size={24} />
                        <X size={12} className="absolute -bottom-1 -right-1 bg-white rounded-full text-red-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-gray-800">{stats.inactive}</div>
                        <div className="text-xs text-gray-500 font-semibold mt-1">Đã nghỉ việc</div>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-3xl p-5 border border-cyan-100 border-l-4 border-l-cyan-400 shadow-sm flex flex-wrap lg:flex-nowrap items-end gap-4">
                <div className="flex-1 w-full relative">
                    <label className="block text-[11px] font-bold text-gray-500 mb-2">Lọc theo trạng thái</label>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:border-cyan-400 appearance-none"
                    >
                        <option value="all">Tất cả nhân viên</option>
                        <option value="active">Đang làm việc</option>
                        <option value="inactive">Đã nghỉ việc</option>
                    </select>
                    <ArrowDown size={14} className="absolute right-4 bottom-3.5 text-gray-400 pointer-events-none" />
                </div>

                <div className="flex-1 w-full relative">
                    <label className="block text-[11px] font-bold text-gray-500 mb-2">Sắp xếp theo thâm niên</label>
                    <select
                        value={filterSort}
                        onChange={e => setFilterSort(e.target.value)}
                        className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:border-cyan-400 appearance-none"
                    >
                        <option value="desc">Lâu nhất ➔ Mới nhất</option>
                        <option value="asc">Mới nhất ➔ Lâu nhất</option>
                    </select>
                    <ArrowDown size={14} className="absolute right-4 bottom-3.5 text-gray-400 pointer-events-none" />
                </div>

                <button
                    onClick={loadData}
                    className="h-11 px-6 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-all w-full lg:w-auto shrink-0 justify-center"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Làm mới
                </button>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-3xl border border-red-100 border-l-4 border-l-[#C62828] shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
                        🏆 Bảng xếp hạng thâm niên
                    </h3>
                    <div className="text-xs text-gray-500 font-bold flex items-center gap-2">
                        <Clock size={14} /> Ngày: {now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-16 text-center">#</th>
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Mã nhân viên</th>
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tên nhân viên</th>
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Ngày bắt đầu</th>
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Thời gian làm việc</th>
                                <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-gray-400">
                                        <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                                        Đang tải danh sách...
                                    </td>
                                </tr>
                            )}
                            {!loading && processedData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-gray-400 font-medium">Không tìm thấy nhân viên nào phù hợp</td>
                                </tr>
                            )}
                            {!loading && processedData.map((emp, index) => {

                                // Render rank badge based on sorting to ensure #1 is always #1 if desc
                                let rank = index + 1;

                                let rankColor = "text-gray-500 border-gray-200"
                                if (filterSort === "desc") {
                                    if (rank === 1) rankColor = "text-amber-500 border-amber-300 bg-amber-50"
                                    if (rank === 2) rankColor = "text-slate-500 border-slate-300 bg-slate-50"
                                    if (rank === 3) rankColor = "text-orange-500 border-orange-300 bg-orange-50"
                                }

                                return (
                                    <tr key={emp.id} className="border-b border-gray-50 hover:bg-red-50/20 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[11px] font-black mx-auto ${rankColor}`}>
                                                {rank}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-mono font-bold">
                                                {emp.id.replace('emp-', '')}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-sm text-gray-800">{emp.name}</div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="text-sm font-medium text-gray-600">
                                                {emp._joinDateObj.toLocaleDateString("en-GB")}
                                            </div>
                                            {!emp.isWorking && emp.resignDate && (
                                                <div className="text-[10px] text-red-400 mt-1">Nghỉ việc: {new Date(emp.resignDate).toLocaleDateString("en-GB")}</div>
                                            )}
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-emerald-600 text-sm">{emp.formattedDuration}</div>
                                            <div className="text-[10px] text-gray-400 mt-1">{emp.isWorking ? "Tính đến hiện tại: " : "Đã làm: "} {emp.totalDays} ngày</div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {emp.isWorking ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Đang làm việc
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex items-center justify-center text-[8px] text-white font-bold">×</span> Nghỉ việc
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
