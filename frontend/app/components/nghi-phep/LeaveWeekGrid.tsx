import React, { useMemo, useState } from "react"
import { CustomSelect } from "../ui/CustomSelect"
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

export type WeekPick =
  | { kind: "full_day"; date: string }
  | { kind: "half_session"; date: string; session: LeaveSession }

interface Props {
  /** Buổi đã duyệt hoặc chờ duyệt — khóa */
  occupied?: LeaveSessionSlot[]
  /** Buổi đã có trong giỏ tạm — hiện “Đã thêm” */
  cartSlots?: LeaveSessionSlot[]
  onPick: (pick: WeekPick) => void
  variant?: "default" | "portal"
  isAdmin?: boolean
}

export default function LeaveWeekGrid({
  occupied = [],
  cartSlots = [],
  onPick,
  variant = "default",
  isAdmin = false,
}: Props) {
  const portal = variant === "portal"
  const [weekOffset, setWeekOffset] = useState(0)
  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  const currentWeekStart = useMemo(() => mondayOfWeek(new Date(), 0), [])
  const currentWeekEnd = useMemo(() => {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() + 4)
    return d
  }, [currentWeekStart])

  const nextWeekStart = useMemo(() => mondayOfWeek(new Date(), 1), [])
  const nextWeekEnd = useMemo(() => {
    const d = new Date(nextWeekStart)
    d.setDate(d.getDate() + 4)
    return d
  }, [nextWeekStart])

  const weekDays = useMemo(() => {
    const start = mondayOfWeek(new Date(), weekOffset)
    return Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekOffset])

  const occupiedKeys = useMemo(
    () => new Set(occupied.map(s => `${isoKey(parseVnDate(s.date))}-${s.session}`)),
    [occupied],
  )

  const cartKeys = useMemo(
    () => new Set(cartSlots.map(s => `${isoKey(parseVnDate(s.date))}-${s.session}`)),
    [cartSlots],
  )

  const weekLabel = useMemo(() => {
    if (weekDays.length > 0) {
      return `${formatVnDate(weekDays[0])} – ${formatVnDate(weekDays[4])}`
    }
    return ""
  }, [weekDays])

  const cellBase = (opts: {
    locked: boolean
    past: boolean
    inCart: boolean
    occupiedLabel?: string
  }) => {
    if (opts.locked) {
      return portal
        ? "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-400 dark:text-white/50 cursor-not-allowed opacity-70"
        : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-70"
    }
    if (opts.past) {
      return portal
        ? "bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 text-gray-300 dark:text-white/40 cursor-not-allowed"
        : "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
    }
    if (opts.inCart) {
      return portal
        ? "bg-[#E8231A]/15 border-[#E8231A]/50 text-[#E8231A] dark:text-red-400"
        : "bg-red-50 border-red-500 text-red-700"
    }
    return portal
      ? "bg-white dark:bg-white/[0.03] border-transparent dark:border-white/10 text-gray-600 dark:text-white/75 hover:border-[#E8231A]/40 hover:bg-red-50 dark:hover:bg-white/[0.06]"
      : "bg-white border-transparent text-gray-500 hover:border-gray-200 hover:bg-gray-50"
  }

  return (
    <div className={`rounded-2xl overflow-hidden border ${portal ? "border-[#efd7da] dark:border-white/10" : "border-gray-200"}`}>
      <div className={`flex items-center justify-between gap-3 px-4 py-3 border-b flex-wrap ${portal ? "bg-white/50 dark:bg-white/[0.03] border-[#efd7da] dark:border-white/[0.06]" : "bg-gray-50 border-gray-100"}`}>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${portal ? "text-[#241416] dark:text-[#FFE8EC]" : "text-gray-700"}`}>Chọn tuần:</span>
          <CustomSelect
            value={String(weekOffset)}
            onChange={val => setWeekOffset(Number(val))}
            options={[
              { value: "0", label: `Tuần này (${formatVnDate(currentWeekStart).slice(0, 5)} - ${formatVnDate(currentWeekEnd).slice(0, 5)})` },
              { value: "1", label: `Tuần sau (${formatVnDate(nextWeekStart).slice(0, 5)} - ${formatVnDate(nextWeekEnd).slice(0, 5)})` },
            ]}
            className="w-56"
            heightClass="h-[38px]"
          />
        </div>
        <span className={`text-[11px] font-bold ${portal ? "text-[#8b6b70]" : "text-gray-500"}`}>{weekLabel}</span>
      </div>

      <div className={`px-4 py-2.5 border-b flex flex-wrap gap-3 text-[10px] font-bold ${portal ? "bg-black/[0.02] border-[#efd7da] dark:border-white/[0.06] text-[#8b6b70]" : "bg-gray-50 border-gray-100 text-gray-500"}`}>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-400" /> Đã thêm giỏ</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-400" /> Chờ duyệt</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gray-200 border border-gray-300" /> Đã duyệt / khóa</span>
        <span className="ml-auto opacity-80">Bấm ô trống → nhập lý do → thêm vào giỏ</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[640px]">
          <thead>
            <tr className={portal ? "bg-black/[0.02] dark:bg-white/[0.02]" : "bg-gray-50/80"}>
              {weekDays.map((d, i) => {
                const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
                return (
                  <th key={i} colSpan={2} className={`p-2 border-b border-r text-center ${portal ? "border-[#efd7da] dark:border-white/10" : "border-gray-200"}`}>
                    <span className={`block text-sm font-bold ${portal ? "text-[#241416] dark:text-[#FFE8EC]" : "text-gray-800"}`}>{dayNames[d.getDay()]}</span>
                    <span className={`block text-xs ${portal ? "text-gray-500 dark:text-white/70" : "text-gray-500"}`}>{formatVnDate(d)}</span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              {weekDays.map((d, i) => {
                const isPast = d < today
                const dateStr = formatVnDate(d)
                const sangKey = `${isoKey(d)}-sang`
                const chieuKey = `${isoKey(d)}-chieu`
                const sangOcc = occupiedKeys.has(sangKey)
                const chieuOcc = occupiedKeys.has(chieuKey)
                const sangCart = cartKeys.has(sangKey)
                const chieuCart = cartKeys.has(chieuKey)
                const bothCart = sangCart && chieuCart
                const anyOcc = sangOcc || chieuOcc
                const bothOcc = sangOcc && chieuOcc
                const locked = (isPast && !isAdmin) || bothOcc || anyOcc || sangCart || chieuCart
                const fdCls = bothCart
                  ? cellBase({ locked: false, past: false, inCart: true })
                  : bothOcc
                    ? cellBase({ locked: true, past: false, inCart: false })
                    : anyOcc || sangCart || chieuCart
                      ? portal
                        ? "bg-amber-50/80 dark:bg-amber-900/20 border-amber-200 text-amber-700 cursor-not-allowed opacity-80"
                        : "bg-amber-50 border-amber-200 text-amber-700 cursor-not-allowed opacity-80"
                      : cellBase({ locked: isPast && !isAdmin, past: isPast && !isAdmin, inCart: false })

                return (
                  <td key={i} colSpan={2} className={`p-1 border-r ${portal ? "border-[#efd7da] dark:border-white/10" : "border-gray-200"}`}>
                    <button
                      type="button"
                      disabled={locked && !bothCart}
                      onClick={() => {
                        if (locked) return
                        onPick({ kind: "full_day", date: dateStr })
                      }}
                      className={`w-full py-1.5 rounded-lg border text-[11px] font-black transition-all ${fdCls}`}
                    >
                      {bothCart ? "✓ Cả ngày (giỏ)" : bothOcc ? "Đã xin cả ngày" : anyOcc || sangCart || chieuCart ? "Không chọn cả ngày" : "Cả ngày"}
                    </button>
                  </td>
                )
              })}
            </tr>

            <tr>
              {weekDays.map((d, i) => {
                const isPast = d < today
                const dateStr = formatVnDate(d)
                const renderCell = (session: LeaveSession, borderRight: boolean) => {
                  const key = `${isoKey(d)}-${session}`
                  const isOcc = occupiedKeys.has(key)
                  const isCart = cartKeys.has(key)
                  const label = LEAVE_SESSION[session].short
                  const cls = isOcc
                    ? (portal
                      ? "bg-amber-50/80 dark:bg-amber-900/30 border-amber-300/50 text-amber-700 cursor-not-allowed opacity-80"
                      : "bg-amber-50 border-amber-300 text-amber-700 cursor-not-allowed opacity-80")
                    : cellBase({ locked: false, past: isPast && !isAdmin, inCart: isCart })
                  return (
                    <td key={session} className={`p-1 border-r ${borderRight ? (portal ? "border-[#efd7da] dark:border-white/10" : "border-gray-200") : (portal ? "border-[#efd7da]/50 dark:border-white/5" : "border-gray-100")}`}>
                      <button
                        type="button"
                        disabled={(isPast && !isAdmin) || isOcc || isCart}
                        onClick={() => onPick({ kind: "half_session", date: dateStr, session })}
                        className={`w-full min-h-[64px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-xs font-bold ${cls}`}
                      >
                        {label}
                        {isCart && <span className="text-[10px] font-black underline">Đã thêm</span>}
                        {isOcc && <span className="text-[9px] font-medium opacity-70">Đã xin</span>}
                        {isPast && !isOcc && !isCart && <span className="text-[9px] opacity-40">Đã qua</span>}
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
