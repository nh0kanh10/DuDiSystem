import React, { useState } from "react"
import { Calendar, Clock, Send, X, Check, Search, RotateCcw, ChevronRight } from "lucide-react"
import { ME } from "./types"

type TOStatus = "pending" | "approved" | "rejected"

interface TimeOffSession {
    date: string
    shift: "Sáng" | "Chiều"
    status?: "Đã duyệt" | "Chờ duyệt"
}

interface TimeOffRequest {
    id: string; type: string; category: "leave" | "timeoff"
    sessions: TimeOffSession[]
    reason: string; status: TOStatus; submittedAt: string
}

const INIT_REQUESTS: TimeOffRequest[] = [
    {
        id: "R001", type: "Time off bù tăng ca", category: "timeoff",
        sessions: [{ date: "02/07/2026", shift: "Chiều" }],
        reason: "Bù 8h tăng ca tháng 5", status: "pending", submittedAt: "25/06/2026"
    },
    {
        id: "R002", type: "Nghỉ ốm", category: "leave",
        sessions: [{ date: "20/06/2026", shift: "Sáng" }, { date: "20/06/2026", shift: "Chiều" }],
        reason: "Sức khỏe không tốt", status: "approved", submittedAt: "19/06/2026"
    },
]

const STATUS_MAP = {
    pending: { label: "Chờ duyệt", color: "text-amber-700", bg: "bg-amber-100", icon: Clock },
    approved: { label: "Đã duyệt", color: "text-green-700", bg: "bg-green-100", icon: Check },
    rejected: { label: "Từ chối", color: "text-red-700", bg: "bg-red-100", icon: X },
}

export default function UserTimeOff() {
    const [tab, setTab] = useState<"register" | "history">("register")
    const [requests, setRequests] = useState<TimeOffRequest[]>(INIT_REQUESTS)

    // Calendar state
    const [weekOffset, setWeekOffset] = useState(0) // 0 = this week, 1 = next week, etc.
    const [selectedSessions, setSelectedSessions] = useState<string[]>([]) // Format: "YYYY-MM-DD-Shift"

    // Helper: generate dates for the selected week
    const now = new Date()
    // adjust to Monday of requested week
    const day = now.getDay()
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1)
    const startOfWeek = new Date(now.setDate(diffToMonday))
    startOfWeek.setDate(startOfWeek.getDate() + (weekOffset * 7))

    const weekDays = Array.from({ length: 5 }).map((_, i) => {
        const d = new Date(startOfWeek)
        d.setDate(d.getDate() + i)
        return d
    })

    const formatDate = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
    const formatFullDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

    const toggleSession = (dateKey: string, shift: "Sáng" | "Chiều") => {
        const key = `${dateKey}-${shift}`
        setSelectedSessions(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        )
    }

    const resetSelection = () => setSelectedSessions([])

    const handleSubmit = () => {
        if (selectedSessions.length === 0) {
            alert("Vui lòng chọn ít nhất 1 buổi nghỉ trên lịch!")
            return
        }

        const sessions: TimeOffSession[] = selectedSessions.map(key => {
            const parts = key.split("-")
            const shift = parts.pop() as "Sáng" | "Chiều"
            const dateParts = parts.join("-").split("-") // YYYY-MM-DD
            return { date: `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`, shift }
        })

        const newReq: TimeOffRequest = {
            id: `R${String(requests.length + 1).padStart(3, "0")}`,
            type: "Nghỉ phép năm", // Default for now
            category: "leave",
            sessions,
            reason: "Đăng ký nghỉ phép (chọn từ lưới)",
            status: "pending",
            submittedAt: new Date().toLocaleDateString("vi-VN"),
        }
        setRequests(prev => [newReq, ...prev])
        setSelectedSessions([])
        setTab("history")
    }

    const handleCancel = (id: string) => {
        if (window.confirm("Hủy yêu cầu này?")) {
            setRequests(prev => prev.filter(r => r.id !== id))
        }
    }

    const daysLeft = 12.5

    return (
        <div className="space-y-5 max-w-5xl mx-auto">
            {/* Header toggle */}
            <div className="flex items-center justify-between">
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-xs">
                    {(["register", "history"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all
              ${tab === t ? "bg-white shadow text-[#C62828]" : "text-gray-500 hover:text-gray-800"}`}>
                            {t === "register" ? "Đăng ký Nghỉ phép" : "Lịch sử yêu cầu"}
                        </button>
                    ))}
                </div>
                {tab === "register" && (
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-black/5 text-sm font-bold text-gray-700">
                        Phép năm còn lại: <span className="text-[#C62828] text-lg">{daysLeft}</span> ngày
                    </div>
                )}
            </div>

            {tab === "register" && (
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                    {/* User and week selection header */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4 bg-white sticky top-0 z-10">
                        {/* Current User Info */}
                        <div className="flex items-center gap-3 pr-6 border-r border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-[#E53935] flex items-center justify-center text-white font-bold text-sm shadow-md">
                                {ME.name.split(" ").slice(-2).map(n => n[0]).join("")}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">{ME.name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Mã NV: {ME.id}</p>
                            </div>
                        </div>

                        {/* Week Selector */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-500 flex items-center gap-1.5"><Calendar size={15} /> Chọn tuần:</span>
                            <div className="relative">
                                <select
                                    value={weekOffset}
                                    onChange={(e) => setWeekOffset(Number(e.target.value))}
                                    className="appearance-none font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-[#C62828] text-sm hover:bg-gray-100 cursor-pointer"
                                >
                                    <option value={0}>
                                        Tuần này ({formatDate(new Date(now.setDate(now.getDate() - now.getDay() + 1)))} - {formatDate(new Date(now.setDate(now.getDate() - now.getDay() + 5)))})
                                    </option>
                                    {[1, 2, 3, 4].map(w => {
                                        const monday = new Date()
                                        monday.setDate(monday.getDate() - monday.getDay() + 1 + (w * 7))
                                        const friday = new Date(monday)
                                        friday.setDate(friday.getDate() + 4)
                                        return (
                                            <option key={w} value={w}>
                                                Tuần +{w} ({formatDate(monday)} - {formatDate(friday)})
                                            </option>
                                        )
                                    })}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>
                            {weekOffset > 0 && (
                                <button
                                    onClick={() => setWeekOffset(0)}
                                    className="text-xs text-[#C62828] font-bold hover:underline"
                                >
                                    Về tuần này
                                </button>
                            )}
                        </div>

                        {/* Selected counter */}
                        <div className="ml-auto">
                            <div className="bg-[#C62828] text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm">
                                Đã chọn: {selectedSessions.length} buổi
                            </div>
                        </div>
                    </div>

                    {/* The Grid */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="w-48 p-3 border-b border-r border-gray-200 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-white sticky left-0 z-10 shadow-[1px_0_0_0_#e5e7eb]">
                                        Nhân viên
                                    </th>
                                    {weekDays.map((d, i) => (
                                        <th key={i} colSpan={2} className="p-3 border-b border-r border-gray-200 text-center">
                                            <span className="block text-sm font-bold text-gray-800">Thứ {i + 2}</span>
                                            <span className="block text-xs font-medium text-gray-500 mt-0.5">{formatDate(d)}</span>
                                        </th>
                                    ))}
                                </tr>
                                <tr className="bg-white">
                                    <th className="border-b border-r border-gray-200 bg-white sticky left-0 z-10 shadow-[1px_0_0_0_#e5e7eb]"></th>
                                    {weekDays.map((_, i) => (
                                        <React.Fragment key={i}>
                                            <th className="p-2 border-b border-r border-gray-100 text-xs font-bold text-emerald-600 w-24">Sáng</th>
                                            <th className="p-2 border-b border-r border-gray-200 text-xs font-bold text-orange-600 w-24">Chiều</th>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="p-4 border-r border-gray-200 bg-white sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] align-top">
                                        <p className="font-bold text-gray-800 text-sm">{ME.name}</p>
                                        <p className="font-mono text-xs text-gray-400 mt-1">{ME.id}</p>
                                    </td>
                                    {weekDays.map((d, i) => {
                                        const dKey = formatFullDate(d)
                                        const isPast = d < new Date(now.setHours(0, 0, 0, 0))

                                        const renderCell = (shift: "Sáng" | "Chiều", isRightBorder: boolean) => {
                                            const key = `${dKey}-${shift}`
                                            const isSelected = selectedSessions.includes(key)
                                            // Mock existing approved requests
                                            const alreadyApproved = dKey === "2026-06-22" && shift === "Sáng"

                                            if (alreadyApproved) {
                                                return (
                                                    <td className={`p-2 border-gray-200 bg-gray-100 align-top ${isRightBorder ? "border-r" : "border-r border-gray-100"}`}>
                                                        <div className="h-full min-h-[80px] w-full p-2 bg-gray-200/50 rounded flex flex-col items-center justify-center opacity-70">
                                                            <span className="text-xs font-bold text-gray-500 mb-1">{shift}</span>
                                                            <span className="text-[10px] text-gray-500">Đã duyệt</span>
                                                        </div>
                                                    </td>
                                                )
                                            }

                                            return (
                                                <td className={`p-1 border-gray-200 align-top transition-colors ${isRightBorder ? "border-r" : "border-r border-gray-100"}`}>
                                                    <button
                                                        disabled={isPast}
                                                        onClick={() => toggleSession(dKey, shift)}
                                                        className={`w-full h-full min-h-[80px] p-2 rounded flex flex-col items-center justify-center transition-all duration-200 border
                                                            ${isPast ? "bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed" :
                                                                isSelected
                                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/20"
                                                                    : "bg-white border-transparent text-gray-400 hover:bg-gray-50 hover:border-gray-200 hover:text-gray-600"
                                                            }`}
                                                    >
                                                        <span className="text-xs font-bold mb-1">{shift}</span>
                                                        <span className="text-[10px] opacity-70">{formatDate(d)}</span>
                                                        {isSelected && <Check size={14} className="mt-1" />}
                                                    </button>
                                                </td>
                                            )
                                        }

                                        return (
                                            <React.Fragment key={i}>
                                                {renderCell("Sáng", false)}
                                                {renderCell("Chiều", true)}
                                            </React.Fragment>
                                        )
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Bottom Actions */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            * Vui lòng chỉ chọn các ca chưa diễn ra.
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={resetSelection}
                                disabled={selectedSessions.length === 0}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RotateCcw size={16} /> Đặt lại
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={selectedSessions.length === 0}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors text-white bg-[#C62828] hover:bg-[#B71C1C] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                <Send size={16} /> Gửi đăng ký
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {tab === "history" && (
                <div className="space-y-4">
                    {requests.length === 0 && (
                        <div className="bg-white rounded-2xl p-10 text-center text-gray-400 border border-black/5 shadow-sm">
                            <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Chưa có yêu cầu nào</p>
                        </div>
                    )}
                    {requests.map(r => {
                        const s = STATUS_MAP[r.status]
                        const SIcon = s.icon
                        return (
                            <div key={r.id} className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm hover:border-[#C62828]/20 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <p className="font-bold text-gray-800 text-sm">{r.type}</p>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${s.bg} ${s.color}`}>
                                                <SIcon size={12} /> {s.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 font-medium mb-3 flex-wrap">
                                            <span>Gửi lúc: {r.submittedAt}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span>Lý do: {r.reason}</span>
                                        </div>

                                        {/* Sessions List */}
                                        <div className="flex flex-wrap gap-2">
                                            {r.sessions.map((sess, idx) => (
                                                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-700">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    <span>{sess.date}</span>
                                                    <span className={sess.shift === "Sáng" ? "text-emerald-600" : "text-orange-600"}>
                                                        {sess.shift}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {r.status === "pending" && (
                                        <button onClick={() => handleCancel(r.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors flex-shrink-0">
                                            <X size={12} /> Hủy đơn
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
