import React, { useState } from "react"
import { Calendar, Clock, CheckSquare, Award, Fingerprint, User, Bell } from "lucide-react"
import { Page } from "../../types"
import { INIT_EMPLOYEES } from "../../constants"

const ME = INIT_EMPLOYEES[0]

export function UserHome({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [checkedIn, setCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState("")

  const handleCheckIn = () => {
    const now = new Date()
    const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    if (!checkedIn) { setCheckInTime(t); setCheckedIn(true) }
    else { setCheckInTime(""); setCheckedIn(false) }
  }

  return (
    <div className="space-y-6">
      {/* Hero row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-[#C62828] via-[#D63020] to-[#E64A19] rounded-2xl p-7 text-white overflow-hidden relative shadow-md shadow-[#C62828]/20">
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-white/55 text-sm font-medium mb-1">Xin chào,</p>
              <h2 className="text-2xl font-bold">{ME.name}</h2>
              <p className="text-white/70 text-sm mt-1">{ME.position} · {ME.department}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/5 flex flex-col items-center justify-center">
          <button onClick={handleCheckIn}
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center gap-1 shadow-xl transition-all duration-300 active:scale-95
              ${checkedIn ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30" : "bg-gradient-to-br from-[#C62828] to-[#E64A19] shadow-[#C62828]/30"}`}>
            <Fingerprint size={36} className="text-white" />
            <span className="text-white text-xs font-bold">{checkedIn ? "Check-out" : "Check-in"}</span>
          </button>
          {checkInTime && <p className="text-xs text-gray-400 mt-4 font-medium">Bắt đầu ca: {checkInTime}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[{ k: "Thông tin cá nhân", v: ME.id, sub: "Hồ sơ của bạn", ic: User, bg: "bg-blue-50 text-blue-500", p: "user-profile" },
        { k: "Nghỉ phép", v: "12", sub: "Ngày phép còn lại", ic: Calendar, bg: "bg-violet-50 text-violet-500", p: "user-timeoff" },
        { k: "Công việc", v: "3", sub: "Đang thực hiện", ic: CheckSquare, bg: "bg-amber-50 text-amber-500", p: "cong-viec" },
        { k: "Thông báo", v: "2", sub: "Chưa đọc", ic: Bell, bg: "bg-rose-50 text-rose-500", p: "thong-bao" }
        ].map(i => (
          <div key={i.k} onClick={() => onNavigate(i.p as Page)} className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm cursor-pointer hover:shadow-md transition-shadow flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${i.bg}`}>
              <i.ic size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-gray-800 leading-none">{i.v}</p>
              <p className="text-sm font-semibold text-gray-600 mt-1">{i.k}</p>
              <p className="text-xs text-gray-400">{i.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
