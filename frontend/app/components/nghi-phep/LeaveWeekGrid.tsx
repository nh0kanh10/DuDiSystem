import React, { useMemo, useState } from "react"
import { Check, RotateCcw, Sun, Sunset } from "lucide-react"
import {
  LEAVE_SESSION,
  formatVnDate,
  parseVnDate,
  type LeaveSession,
  type LeaveSessionSlot,
} from "./leaveRequestModel"

function mondayOfWeek(base: Date, weekOffset: number): Date {
  const d = new Date(base)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + weekOffset * 7
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function isoKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

interface Props {
  selected: LeaveSessionSlot[]
  onChange: (slots: LeaveSessionSlot[]) => void
  blocked?: LeaveSessionSlot[]
  variant?: "default" | "portal"
}

export default function LeaveWeekGrid({ selected, onChange, blocked = [], variant = "default" }: Props) {
  const portal = variant === "portal"
  const [weekOffset, setWeekOffset] = useState(0)
  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  const weekDays = useMemo(() => {
    const start = mondayOfWeek(new Date(), weekOffset)
    return Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekOffset])

  const selectedKeys = useMemo(
    () => new Set(selected.map(s => `${isoKey(parseVnDate(s.date))}-${s.session}`)),
    [selected],
  )

  const blockedKeys = useMemo(
    () => new Set(blocked.map(s => `${isoKey(parseVnDate(s.date))}-${s.session}`)),
    [blocked],
  )

  const toggle = (date: Date, session: LeaveSession) => {
    const dateStr = formatVnDate(date)
    const key = `${isoKey(date)}-${session}`
    if (blockedKeys.has(key)) return
    if (date < today) return
    if (selectedKeys.has(key)) {
      onChange(selected.filter(s => !(s.date === dateStr && s.session === session)))
    } else {
      onChange([...selected, { date: dateStr, session }])
    }
  }

  const weekLabel = `${formatVnDate(weekDays[0])} – ${formatVnDate(weekDays[4])}`

  return (
    <div className={`rounded-2xl overflow-hidden border ${portal ? "border-white/10" : "border-gray-200"}`}>
      <div className={`flex items-center justify-between gap-3 px-4 py-3 border-b flex-wrap ${portal ? "bg-white/[0.03] border-white/[0.06]" : "bg-gray-50 border-gray-100"}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset(w => w - 1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${portal ? "bg-white/5 border-white/10 text-white/70 hover:border-[#E8231A]/40" : "bg-white border-gray-200 hover:border-[#C62828]/30"}`}
          >
            ← Tuần trước
          </button>
          <span className={`text-sm font-bold ${portal ? "text-[#FFE8EC]" : "text-gray-700"}`}>{weekLabel}</span>
          <button
            type="button"
            onClick={() => setWeekOffset(w => w + 1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${portal ? "bg-white/5 border-white/10 text-white/70 hover:border-[#E8231A]/40" : "bg-white border-gray-200 hover:border-[#C62828]/30"}`}
          >
            Tuần sau →
          </button>
        </div>
        {weekOffset !== 0 && (
          <button type="button" onClick={() => setWeekOffset(0)} className={`text-xs font-bold hover:underline ${portal ? "text-[#FF8800]" : "text-[#C62828]"}`}>
            Về tuần này
          </button>
        )}
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${portal ? "text-[#FF8800] bg-[#E8231A]/15" : "text-[#C62828] bg-[#C62828]/10"}`}>
          Đã chọn: {selected.length} buổi
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[640px]">
          <thead>
            <tr className={portal ? "bg-white/[0.02]" : "bg-gray-50/80"}>
              {weekDays.map((d, i) => (
                <th key={i} colSpan={2} className={`p-2 border-b border-r text-center ${portal ? "border-white/10" : "border-gray-200"}`}>
                  <span className={`block text-sm font-bold ${portal ? "text-[#FFE8EC]" : "text-gray-800"}`}>Thứ {i + 2}</span>
                  <span className={`block text-xs ${portal ? "text-white/40" : "text-gray-500"}`}>{formatVnDate(d)}</span>
                </th>
              ))}
            </tr>
            <tr>
              {weekDays.map((_, i) => (
                <React.Fragment key={i}>
                  <th className={`p-1.5 border-b border-r text-[10px] font-bold text-emerald-600 ${portal ? "border-white/10" : "border-gray-100"}`}>Sáng</th>
                  <th className={`p-1.5 border-b border-r text-[10px] font-bold text-orange-600 ${portal ? "border-white/10" : "border-gray-200"}`}>Chiều</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {weekDays.map((d, i) => {
                const isPast = d < today
                const renderCell = (session: LeaveSession, borderRight: boolean) => {
                  const key = `${isoKey(d)}-${session}`
                  const isSelected = selectedKeys.has(key)
                  const isBlocked = blockedKeys.has(key)
                  const Icon = session === "sang" ? Sun : Sunset
                  const label = LEAVE_SESSION[session].short
                  const cellCls = isBlocked
                    ? portal ? "bg-white/5 border-white/10 text-white/30 cursor-not-allowed opacity-70" : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-70"
                    : isPast
                      ? portal ? "bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed" : "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                      : isSelected
                        ? portal ? "bg-emerald-500/15 border-emerald-400/50 text-emerald-300" : "bg-emerald-50 border-emerald-400 text-emerald-700"
                        : portal ? "bg-white/[0.03] border-white/10 text-white/45 hover:border-[#E8231A]/30 hover:bg-white/[0.06]" : "bg-white border-transparent text-gray-400 hover:border-gray-200 hover:bg-gray-50"
                  return (
                    <td key={session} className={`p-1 border-r ${borderRight ? portal ? "border-white/10" : "border-gray-200" : portal ? "border-white/5" : "border-gray-100"}`}>
                      <button
                        type="button"
                        disabled={isPast || isBlocked}
                        onClick={() => toggle(d, session)}
                        className={`w-full min-h-[72px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-xs font-bold ${cellCls}`}
                      >
                        <Icon size={14} />
                        {label}
                        {isSelected && <Check size={12} />}
                        {isBlocked && <span className="text-[9px] font-medium">Đã đăng ký</span>}
                      </button>
                    </td>
                  )
                }
                return (
                  <React.Fragment key={i}>
                    {renderCell("sang", false)}
                    {renderCell("chieu", true)}
                  </React.Fragment>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {selected.length > 0 && (
        <div className={`px-4 py-2 border-t flex justify-end ${portal ? "border-white/[0.06] bg-white/[0.02]" : "border-gray-100 bg-gray-50"}`}>
          <button
            type="button"
            onClick={() => onChange([])}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold ${portal ? "text-white/50 hover:text-[#FF8800]" : "text-gray-600 hover:text-[#C62828]"}`}
          >
            <RotateCcw size={12} /> Đặt lại
          </button>
        </div>
      )}
    </div>
  )
}
