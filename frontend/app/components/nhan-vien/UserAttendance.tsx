import React, { useState } from "react"
import { Fingerprint, CheckCircle, Clock, AlertCircle, TrendingUp, Calendar } from "lucide-react"

const ATTENDANCE_HISTORY = [
    { date: "26/06/2026", day: "Thứ Năm", checkIn: "08:02", checkOut: "17:35", hours: "9h33", status: "on-time" },
    { date: "25/06/2026", day: "Thứ Tư", checkIn: "08:45", checkOut: "18:10", hours: "9h25", status: "late" },
    { date: "24/06/2026", day: "Thứ Ba", checkIn: "07:55", checkOut: "17:00", hours: "9h05", status: "on-time" },
    { date: "23/06/2026", day: "Thứ Hai", checkIn: "--", checkOut: "--", hours: "--", status: "leave" },
    { date: "20/06/2026", day: "Thứ Sáu", checkIn: "09:15", checkOut: "18:30", hours: "9h15", status: "late" },
    { date: "19/06/2026", day: "Thứ Năm", checkIn: "08:00", checkOut: "17:00", hours: "9h00", status: "on-time" },
    { date: "18/06/2026", day: "Thứ Tư", checkIn: "08:05", checkOut: "17:10", hours: "9h05", status: "on-time" },
    { date: "17/06/2026", day: "Thứ Ba", checkIn: "--", checkOut: "--", hours: "--", status: "absent" },
    { date: "16/06/2026", day: "Thứ Hai", checkIn: "07:58", checkOut: "17:05", hours: "9h07", status: "on-time" },
]

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    "on-time": { label: "Đúng giờ", color: "text-green-700", bg: "bg-green-100" },
    "late": { label: "Đi trễ", color: "text-orange-700", bg: "bg-orange-100" },
    "absent": { label: "Vắng mặt", color: "text-red-700", bg: "bg-red-100" },
    "leave": { label: "Nghỉ phép", color: "text-purple-700", bg: "bg-purple-100" },
}

export default function UserAttendance() {
    const [checkedIn, setCheckedIn] = useState(false)
    const [checkInTime, setCheckInTime] = useState<string | null>(null)
    const [checkOutTime, setCheckOutTime] = useState<string | null>(null)

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")

    const handleAction = () => {
        const t = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
        if (!checkedIn) { setCheckInTime(t); setCheckedIn(true) }
        else { setCheckOutTime(t); setCheckedIn(false) }
    }

    const stats = {
        total: ATTENDANCE_HISTORY.length,
        onTime: ATTENDANCE_HISTORY.filter(r => r.status === "on-time").length,
        late: ATTENDANCE_HISTORY.filter(r => r.status === "late").length,
        absent: ATTENDANCE_HISTORY.filter(r => r.status === "absent").length,
    }

    return (
        <div className="space-y-5 max-w-3xl mx-auto">
            {/* Check-in card */}
            <div className="bg-gradient-to-br from-[#160606] to-[#2a0808] rounded-2xl p-6 text-white flex items-center justify-between shadow-lg">
                <div>
                    <p className="text-white/50 text-sm mb-1">Trạng thái hôm nay</p>
                    <h3 className="text-xl font-bold">
                        {checkedIn ? "Đang làm việc" : checkInTime && checkOutTime ? "Đã kết thúc ca" : "Chưa chấm công"}
                    </h3>
                    {checkInTime && (
                        <p className="text-white/60 text-sm mt-1.5 font-mono">
                            Vào: {checkInTime}
                            {checkOutTime && ` · Ra: ${checkOutTime}`}
                        </p>
                    )}
                </div>
                <button
                    onClick={handleAction}
                    className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 border-2
            ${checkedIn
                            ? "bg-green-600/20 border-green-500/50 shadow-green-900/30"
                            : "bg-[#C62828]/20 border-[#C62828]/50 shadow-red-900/30"
                        } shadow-xl`}
                >
                    <Fingerprint size={30} className={checkedIn ? "text-green-400" : "text-[#FF8A50]"} />
                    <span className="text-xs font-bold text-white">{checkedIn ? "Check-out" : "Check-in"}</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: "Ngày đi làm", value: stats.total, icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Đúng giờ", value: stats.onTime, icon: Clock, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Đi muộn", value: stats.late, icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-50" },
                    { label: "Vắng mặt", value: stats.absent, icon: TrendingUp, color: "text-red-500", bg: "bg-red-50" },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-black/[0.04]`}>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-xs font-semibold text-gray-600 mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* History table */}
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">Lịch sử chấm công</h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <Calendar size={13} />
                        <span>Tháng 6/2026</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50/70 text-gray-400 text-xs">
                                {["Ngày", "Thứ", "Giờ vào", "Giờ ra", "Số giờ", "Trạng thái"].map(h => (
                                    <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {ATTENDANCE_HISTORY.map(r => {
                                const s = STATUS_MAP[r.status]
                                return (
                                    <tr key={r.date} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3.5 font-semibold text-gray-700 font-mono text-xs">{r.date}</td>
                                        <td className="px-5 py-3.5 text-gray-500 text-xs">{r.day}</td>
                                        <td className="px-5 py-3.5 font-mono text-gray-600 text-xs">{r.checkIn}</td>
                                        <td className="px-5 py-3.5 font-mono text-gray-600 text-xs">{r.checkOut}</td>
                                        <td className="px-5 py-3.5 font-mono text-gray-700 text-xs font-medium">{r.hours}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.color}`}>
                                                {s.label}
                                            </span>
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
