import React from "react"
import { Fingerprint, CheckCircle, Clock, AlertCircle, Calendar, Loader2, RefreshCw } from "lucide-react"
import { useEmployeeAttendance } from "../../hooks/useEmployeeAttendance"
import { fmtIsoDate, weekdayFromIso, formatAttendanceTimes, ATT_STATUS_LABEL } from "../cham-cong/attendanceDisplay"

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  "on-time": { label: "Đúng giờ", color: "text-green-700", bg: "bg-green-100" },
  late: { label: "Đi trễ", color: "text-orange-700", bg: "bg-orange-100" },
  early: { label: "Về sớm", color: "text-amber-700", bg: "bg-amber-100" },
  late_early: { label: "Trễ & sớm", color: "text-orange-800", bg: "bg-orange-100" },
  absent: { label: "Vắng mặt", color: "text-red-700", bg: "bg-red-100" },
  leave: { label: "Nghỉ phép", color: "text-purple-700", bg: "bg-purple-100" },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { label: ATT_STATUS_LABEL[status] ?? status, color: "text-gray-600", bg: "bg-gray-100" }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.color}`}>
      {s.label}
    </span>
  )
}

export default function UserAttendance() {
  const {
    isIntern,
    todayRecord,
    history,
    monthStats,
    loading,
    punching,
    error,
    punch,
    punchLabel,
    statusText,
    reload,
  } = useEmployeeAttendance()

  const working = !punchLabel.done && statusText === "Đang làm việc"
  const monthLabel = new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" })
  const times = todayRecord ? formatAttendanceTimes(todayRecord) : null

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={reload} className="text-xs font-bold underline">Thử lại</button>
        </div>
      )}

      <div className="bg-gradient-to-br from-[#160606] to-[#2a0808] rounded-2xl p-6 text-white flex items-center justify-between shadow-lg">
        <div className="flex-1 min-w-0">
          <p className="text-white/50 text-sm mb-1">
            {isIntern ? "Thực tập · chấm theo buổi" : "Nhân viên · chấm theo ngày"}
          </p>
          <h3 className="text-xl font-bold">{loading ? "Đang tải..." : statusText}</h3>
          {todayRecord && (
            <div className="text-white/60 text-sm mt-2 font-mono space-y-0.5">
              {isIntern ? (
                <>
                  <p>Sáng: {todayRecord.checkInAm ?? "--"} → {todayRecord.checkOutAm ?? "--"}</p>
                  <p>Chiều: {todayRecord.checkInPm ?? "--"} → {todayRecord.checkOutPm ?? "--"}</p>
                  {todayRecord.autoFilled && (
                    <p className="text-amber-300/90 text-xs mt-1">Làm cả ngày — hệ thống tự ghi giờ nghỉ trưa</p>
                  )}
                </>
              ) : (
                <p>Vào: {todayRecord.checkIn ?? "--"}{todayRecord.checkOut && todayRecord.checkOut !== "--" ? ` · Ra: ${todayRecord.checkOut}` : ""}</p>
              )}
            </div>
          )}
          {!isIntern && times && (
            <p className="text-white/40 text-xs mt-2">Giờ làm: {todayRecord?.workingHours ?? "--"}</p>
          )}
        </div>
        <button
          onClick={punch}
          disabled={loading || punching || punchLabel.done}
          className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300 border-2 shrink-0
            ${punchLabel.done ? "opacity-50 cursor-not-allowed bg-white/5 border-white/20" :
              working ? "bg-green-600/20 border-green-500/50 hover:scale-105 active:scale-95" :
              "bg-[#C62828]/20 border-[#C62828]/50 hover:scale-105 active:scale-95"} shadow-xl`}
        >
          {punching ? <Loader2 size={28} className="animate-spin text-white" /> : (
            <Fingerprint size={30} className={working ? "text-green-400" : "text-[#FF8A50]"} />
          )}
          <span className="text-[10px] font-bold text-white text-center leading-tight px-1">
            {punchLabel.label}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Đúng giờ", value: monthStats.onTime, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          { label: "Đi trễ / sớm", value: monthStats.late, icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Vắng", value: monthStats.absent, icon: Clock, color: "text-red-500", bg: "bg-red-50" },
          { label: "Nghỉ phép", value: monthStats.leave, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-black/[0.04]`}>
            <p className={`text-2xl font-black ${s.color}`}>{loading ? "—" : s.value}</p>
            <p className="text-xs font-semibold text-gray-600 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Lịch sử chấm công</h3>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <Calendar size={13} />
            <span>{monthLabel}</span>
            <button onClick={reload} className="p-1 hover:text-gray-600" title="Tải lại">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/70 text-gray-400 text-xs">
                {(isIntern
                  ? ["Ngày", "Thứ", "Ca sáng", "Ca chiều", "Giờ", "Trạng thái"]
                  : ["Ngày", "Thứ", "Giờ vào", "Giờ ra", "Số giờ", "Trạng thái"]
                ).map(h => (
                  <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Đang tải...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Chưa có lịch sử trong tháng</td></tr>
              ) : history.map(r => {
                const t = formatAttendanceTimes(r)
                return (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-700">{fmtIsoDate(r.date)}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{weekdayFromIso(r.date)}</td>
                    {isIntern ? (
                      <>
                        <td className="px-5 py-3.5 font-mono text-xs">{t.primary}</td>
                        <td className="px-5 py-3.5 font-mono text-xs">{t.secondary}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3.5 font-mono text-xs">{r.checkIn}</td>
                        <td className="px-5 py-3.5 font-mono text-xs">{r.checkOut}</td>
                      </>
                    )}
                    <td className="px-5 py-3.5 font-mono text-xs font-medium">{r.workingHours ?? "--"}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
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
