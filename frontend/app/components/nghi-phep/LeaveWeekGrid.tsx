import React, { useMemo, useState } from "react"
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
  pending?: LeaveSessionSlot[]
  variant?: "default" | "portal"
}

export default function LeaveWeekGrid({ selected, onChange, blocked = [], pending = [], variant = "default" }: Props) {
  const portal = variant === "portal"
  const [weekOffset, setWeekOffset] = useState(0)
  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  // Fix: Tính toán tuần hiện tại và tuần sau một cách chính xác
  const currentWeekStart = useMemo(() => mondayOfWeek(new Date(), 0), [])
  const currentWeekEnd = useMemo(() => {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() + 4) // Thứ 6
    return d
  }, [currentWeekStart])

  const nextWeekStart = useMemo(() => mondayOfWeek(new Date(), 1), [])
  const nextWeekEnd = useMemo(() => {
    const d = new Date(nextWeekStart)
    d.setDate(d.getDate() + 4) // Thứ 6
    return d
  }, [nextWeekStart])

  // Fix: Tính toán đúng các ngày trong tuần được chọn
  const weekDays = useMemo(() => {
    console.log(`Calculating week days for offset: ${weekOffset}`)
    const start = mondayOfWeek(new Date(), weekOffset)
    const days = Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
    console.log(`Week days:`, days.map(d => formatVnDate(d)))
    return days
  }, [weekOffset])

  const selectedKeys = useMemo(
    () => new Set(selected.map(s => `${isoKey(parseVnDate(s.date))}-${s.session}`)),
    [selected],
  )

  const blockedKeys = useMemo(
    () => new Set(blocked.map(s => `${isoKey(parseVnDate(s.date))}-${s.session}`)),
    [blocked],
  )

  const pendingKeys = useMemo(
    () => new Set(pending.map(s => `${isoKey(parseVnDate(s.date))}-${s.session}`)),
    [pending],
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

  const toggleFullDay = (date: Date) => {
    if (date < today) return
    const dateStr = formatVnDate(date)
    const sangKey = `${isoKey(date)}-sang`
    const chieuKey = `${isoKey(date)}-chieu`
    const sangBlocked = blockedKeys.has(sangKey)
    const chieuBlocked = blockedKeys.has(chieuKey)
    const sangSelected = selectedKeys.has(sangKey)
    const chieuSelected = selectedKeys.has(chieuKey)

    // Both already selected -> deselect both
    if (sangSelected && chieuSelected) {
      onChange(selected.filter(s => s.date !== dateStr))
      return
    }

    // Otherwise, add both if not blocked (pending slots are allowed)
    const toAdd: LeaveSessionSlot[] = []
    const keep = selected.filter(s => s.date !== dateStr)
    if (!sangBlocked) toAdd.push({ date: dateStr, session: "sang" })
    if (!chieuBlocked) toAdd.push({ date: dateStr, session: "chieu" })
    onChange([...keep, ...toAdd])
  }

  const selectAllVisible = () => {
    const newSelected = [...selected]
    weekDays.forEach(d => {
      if (d >= today) {
        ; (["sang", "chieu"] as const).forEach(session => {
          const key = `${isoKey(d)}-${session}`
          // Only skip if blocked (approved), not if pending
          if (!blockedKeys.has(key) && !selectedKeys.has(key)) {
            newSelected.push({ date: formatVnDate(d), session })
          }
        })
      }
    })
    onChange(newSelected)
  }

  const clearVisible = () => {
    onChange([])
  }

  // Fix: Hiển thị label tuần chính xác
  const weekLabel = useMemo(() => {
    if (weekDays.length > 0) {
      return `${formatVnDate(weekDays[0])} – ${formatVnDate(weekDays[4])}`
    }
    return ""
  }, [weekDays])

  return (
    <div className={`rounded-2xl overflow-hidden border ${portal ? "border-[#efd7da] dark:border-white/10" : "border-gray-200"}`}>
      <div className={`flex items-center justify-between gap-3 px-4 py-3 border-b flex-wrap ${portal ? "bg-white/50 dark:bg-white/[0.03] border-[#efd7da] dark:border-white/[0.06]" : "bg-gray-50 border-gray-100"}`}>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${portal ? "text-[#241416] dark:text-[#FFE8EC]" : "text-gray-700"}`}>Chọn tuần:</span>
          <select
            value={weekOffset}
            onChange={(e) => {
              const newOffset = Number(e.target.value)
              console.log(`Changing week offset from ${weekOffset} to ${newOffset}`)
              setWeekOffset(newOffset)
            }}
            className={`px-3 py-2 rounded-lg text-sm font-bold border outline-none cursor-pointer ${portal ? "bg-white dark:bg-white/[0.04] border-[#efd7da] dark:border-white/10 text-[#241416] dark:text-white focus:border-[#E8231A]" : "bg-white border-gray-200 text-gray-800 focus:border-[#C62828]"}`}
          >
            <option value={0} className="dark:bg-[#1A1A1E]">
              Tuần này ({formatVnDate(currentWeekStart).slice(0, 5)} - {formatVnDate(currentWeekEnd).slice(0, 5)})
            </option>
            <option value={1} className="dark:bg-[#1A1A1E]">
              Tuần sau ({formatVnDate(nextWeekStart).slice(0, 5)} - {formatVnDate(nextWeekEnd).slice(0, 5)})
            </option>
          </select>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${portal ? "text-[#FF8800] bg-[#E8231A]/15" : "text-[#C62828] bg-[#C62828]/10"}`}>
          Đã chọn: {selected.length} buổi ({(selected.length / 2).toFixed(1)} ngày)
        </span>
      </div>

      <div className={`px-4 py-2 flex gap-2 border-b ${portal ? "bg-black/[0.02] dark:bg-white/[0.015] border-[#efd7da] dark:border-white/[0.06]" : "bg-gray-50 border-gray-100"}`}>
        <button type="button" onClick={selectAllVisible} className={`text-[11px] font-black px-3 py-1.5 rounded-lg border transition-all ${portal ? "text-gray-700 dark:text-white bg-black/5 dark:bg-white/10 hover:bg-[#E8231A] dark:hover:bg-[#E8231A] hover:text-white hover:border-[#E8231A] border-black/10 dark:border-white/20" : "text-gray-700 bg-white hover:bg-[#C62828] hover:text-white border-gray-200"}`}>
          Chọn toàn bộ tuần
        </button>
        <button type="button" onClick={clearVisible} className={`text-[11px] font-black px-3 py-1.5 rounded-lg border transition-all ${portal ? "text-gray-500 dark:text-[#8b6b70] bg-transparent hover:bg-black/5 dark:hover:bg-white/5 border-transparent" : "text-gray-500 bg-transparent hover:bg-gray-100 border-transparent"}`}>
          Xóa chọn nhanh
        </button>
        <div className={`text-[10px] font-bold px-2 py-1.5 rounded ${portal ? "text-[#8b6b70] bg-black/5" : "text-gray-500 bg-gray-100"}`}>
          {weekLabel}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[640px]">
          <thead>
            <tr className={portal ? "bg-black/[0.02] dark:bg-white/[0.02]" : "bg-gray-50/80"}>
              {weekDays.map((d, i) => {
                const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
                const dayName = dayNames[d.getDay()]
                return (
                  <th key={i} colSpan={2} className={`p-2 border-b border-r text-center ${portal ? "border-[#efd7da] dark:border-white/10" : "border-gray-200"}`}>
                    <span className={`block text-sm font-bold ${portal ? "text-[#241416] dark:text-[#FFE8EC]" : "text-gray-800"}`}>{dayName}</span>
                    <span className={`block text-xs ${portal ? "text-gray-500 dark:text-white/70" : "text-gray-500"}`}>{formatVnDate(d)}</span>
                  </th>
                )
              })}
            </tr>

          </thead>
          <tbody>
            {/* Row: Cả ngày */}
            <tr>
              {weekDays.map((d, i) => {
                const isPast = d < today
                const sangKey = `${isoKey(d)}-sang`
                const chieuKey = `${isoKey(d)}-chieu`
                const sangSel = selectedKeys.has(sangKey)
                const chieuSel = selectedKeys.has(chieuKey)
                const allDay = sangSel && chieuSel
                const sangBlk = blockedKeys.has(sangKey)
                const chieuBlk = blockedKeys.has(chieuKey)
                const sangPend = pendingKeys.has(sangKey)
                const chieuPend = pendingKeys.has(chieuKey)
                const fullyBlocked = sangBlk && chieuBlk
                const hasPending = sangPend || chieuPend

                const fdCls = fullyBlocked
                  ? portal ? "bg-black/5 dark:bg-white/5 text-gray-400 dark:text-white/40 border-black/10 dark:border-white/10 cursor-not-allowed opacity-70" : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-70"
                  : isPast
                    ? portal ? "bg-black/[0.02] text-gray-400 dark:text-white/40 border-transparent cursor-not-allowed" : "bg-gray-50 text-gray-300 border-transparent cursor-not-allowed"
                    : allDay
                      ? portal ? "bg-[#E8231A]/10 border-[#E8231A]/40 text-[#E8231A] dark:text-red-400 font-black" : "bg-red-50 border-red-400 text-red-700 font-black"
                      : hasPending && !allDay
                        ? portal ? "bg-amber-50/80 dark:bg-amber-900/30 border-amber-300/50 dark:border-amber-700/40 text-amber-700 dark:text-amber-300 hover:border-amber-400" : "bg-amber-50/80 border-amber-300/50 text-amber-700 hover:border-amber-400"
                        : portal ? "bg-amber-50/60 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-300 hover:border-amber-400" : "bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-400"
                return (
                  <td key={i} colSpan={2} className={`p-1 border-r ${portal ? "border-[#efd7da] dark:border-white/10" : "border-gray-200"}`}>
                    <button
                      type="button"
                      disabled={isPast || fullyBlocked}
                      onClick={() => toggleFullDay(d)}
                      className={`w-full py-1.5 rounded-lg border text-[11px] font-black transition-all ${fdCls}`}
                    >
                      {allDay ? "✓ Cả ngày" : hasPending && !allDay ? "Có chờ duyệt" : "Cả ngày"}
                    </button>
                  </td>
                )
              })}
            </tr>

            {/* Row: Sáng / Chiều */}
            <tr>
              {weekDays.map((d, i) => {
                const isPast = d < today
                const renderCell = (session: LeaveSession, borderRight: boolean) => {
                  const key = `${isoKey(d)}-${session}`
                  const isSelected = selectedKeys.has(key)
                  const isBlocked = blockedKeys.has(key)
                  const isPending = pendingKeys.has(key)
                  const label = LEAVE_SESSION[session].short
                  const cellCls = isBlocked
                    ? portal ? "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-400 dark:text-white/50 cursor-not-allowed opacity-70" : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-70"
                    : isPast
                      ? portal ? "bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 text-gray-300 dark:text-white/40 cursor-not-allowed" : "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                      : isSelected
                        ? portal ? "bg-[#E8231A]/15 border-[#E8231A]/50 text-[#E8231A] dark:text-red-400 shadow-inner" : "bg-red-50 border-red-500 text-red-700"
                        : isPending
                          ? portal ? "bg-amber-50/80 dark:bg-amber-900/30 border-amber-300/50 dark:border-amber-700/40 text-amber-700 dark:text-amber-300 hover:border-amber-400" : "bg-amber-50/80 border-amber-300/50 text-amber-700 hover:border-amber-400"
                          : portal ? "bg-white dark:bg-white/[0.03] border-transparent dark:border-white/10 text-gray-600 dark:text-white/75 hover:border-[#E8231A]/40 dark:hover:border-[#E8231A]/30 hover:bg-red-50 dark:hover:bg-white/[0.06]" : "bg-white border-transparent text-gray-400 hover:border-gray-200 hover:bg-gray-50"
                  return (
                    <td key={session} className={`p-1 border-r ${borderRight ? portal ? "border-[#efd7da] dark:border-white/10" : "border-gray-200" : portal ? "border-[#efd7da]/50 dark:border-white/5" : "border-gray-100"}`}>
                      <button
                        type="button"
                        disabled={isPast || isBlocked}
                        onClick={() => toggle(d, session)}
                        className={`w-full min-h-[64px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-xs font-bold ${cellCls}`}
                      >
                        {label}
                        {isSelected && <span className="text-[10px] font-black underline">Đã chọn</span>}
                        {isBlocked && <span className="text-[9px] font-medium opacity-60">Đã duyệt</span>}
                        {isPending && !isSelected && !isBlocked && <span className="text-[9px] font-medium opacity-70">Chờ duyệt</span>}
                        {isPast && !isBlocked && !isPending && <span className="text-[9px] opacity-40">Đã qua</span>}
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

    </div>
  )
}
