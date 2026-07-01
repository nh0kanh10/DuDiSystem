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
}

export default function LeaveWeekGrid({ selected, onChange, blocked = [] }: Props) {
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
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset(w => w - 1)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-gray-200 hover:border-[#C62828]/30"
          >
            ← Tuần trước
          </button>
          <span className="text-sm font-bold text-gray-700">{weekLabel}</span>
          <button
            type="button"
            onClick={() => setWeekOffset(w => w + 1)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-gray-200 hover:border-[#C62828]/30"
          >
            Tuần sau →
          </button>
        </div>
        {weekOffset !== 0 && (
          <button type="button" onClick={() => setWeekOffset(0)} className="text-xs font-bold text-[#C62828] hover:underline">
            Về tuần này
          </button>
        )}
        <span className="text-xs font-bold text-[#C62828] bg-[#C62828]/10 px-3 py-1 rounded-full">
          Đã chọn: {selected.length} buổi
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[640px]">
          <thead>
            <tr className="bg-gray-50/80">
              {weekDays.map((d, i) => (
                <th key={i} colSpan={2} className="p-2 border-b border-r border-gray-200 text-center">
                  <span className="block text-sm font-bold text-gray-800">Thứ {i + 2}</span>
                  <span className="block text-xs text-gray-500">{formatVnDate(d)}</span>
                </th>
              ))}
            </tr>
            <tr>
              {weekDays.map((_, i) => (
                <React.Fragment key={i}>
                  <th className="p-1.5 border-b border-r border-gray-100 text-[10px] font-bold text-emerald-600">Sáng</th>
                  <th className="p-1.5 border-b border-r border-gray-200 text-[10px] font-bold text-orange-600">Chiều</th>
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
                  return (
                    <td key={session} className={`p-1 ${borderRight ? "border-r border-gray-200" : "border-r border-gray-100"}`}>
                      <button
                        type="button"
                        disabled={isPast || isBlocked}
                        onClick={() => toggle(d, session)}
                        className={`w-full min-h-[72px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-xs font-bold
                          ${isBlocked ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-70" :
                            isPast ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed" :
                            isSelected ? "bg-emerald-50 border-emerald-400 text-emerald-700" :
                            "bg-white border-transparent text-gray-400 hover:border-gray-200 hover:bg-gray-50"}`}
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
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={() => onChange([])}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-[#C62828]"
          >
            <RotateCcw size={12} /> Đặt lại
          </button>
        </div>
      )}
    </div>
  )
}
