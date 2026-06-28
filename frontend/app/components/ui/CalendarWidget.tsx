import React, { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function CalendarWidget() {
  const [cur, setCur] = useState(new Date(2026, 5, 1))
  const months = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"]
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
  const y = cur.getFullYear(), m = cur.getMonth()
  const firstDay = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const dots: Record<number, string> = {
    2: "on-time", 3: "on-time", 4: "late", 5: "on-time", 6: "on-time",
    9: "on-time", 10: "late", 11: "absent", 12: "on-time", 13: "on-time",
    16: "on-time", 17: "leave", 18: "on-time", 19: "on-time", 20: "late",
    23: "on-time", 24: "on-time", 25: "on-time",
  }
  const dotColor: Record<string, string> = { "on-time": "bg-green-500", late: "bg-orange-500", absent: "bg-red-500", leave: "bg-purple-500" }
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-gray-700 text-sm">{months[m]}, {y}</span>
        <div className="flex gap-1">
          <button onClick={() => setCur(new Date(y, m - 1))} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft size={15} /></button>
          <button onClick={() => setCur(new Date(y, m + 1))} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight size={15} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => (
          <div key={i} className={`aspect-square flex flex-col items-center justify-center rounded-lg relative text-xs cursor-pointer
            ${d === 25 ? "bg-[#C62828] text-white font-bold" : d ? "hover:bg-red-50 text-gray-600" : ""}`}>
            {d && <span>{d}</span>}
            {d && dots[d] && (
              <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${d === 25 ? "bg-white" : dotColor[dots[d]]}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-3 flex-wrap">
        {[["bg-green-500", "Đúng giờ"], ["bg-orange-500", "Đi trễ"], ["bg-red-500", "Vắng"], ["bg-purple-500", "Nghỉ phép"]].map(([c, l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${c}`} />
            <span className="text-xs text-gray-400">{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
