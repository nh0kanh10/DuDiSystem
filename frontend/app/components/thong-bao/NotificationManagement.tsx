import React from "react"
import { Bell, FileText, Award, Layers, User } from "lucide-react"
import { NOTIFICATIONS } from "../../constants"

function NotifItem({ n }: { n: typeof NOTIFICATIONS[0] }) {
  const isBday = n.type === "birthday"
  const isReq = n.type === "request"
  const isSystem = n.type === "system"
  const icon = isBday ? <Award size={18} className="text-purple-600" /> : isReq ? <FileText size={18} className="text-orange-600" /> : <Layers size={18} className="text-blue-600" />
  const bg = isBday ? "bg-purple-50" : isReq ? "bg-orange-50" : "bg-blue-50"
  return (
    <div className={`p-4 rounded-2xl border border-black/[0.02] shadow-xs flex items-start gap-3 bg-white hover:bg-gray-50/50 transition-colors ${!n.read ? "border-l-4 border-l-[#C62828]" : ""}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs ${!n.read ? "text-gray-800 font-bold" : "text-gray-600"}`}>{n.message}</p>
        <span className="text-[10px] text-gray-400 font-semibold mt-1 block">{n.time}</span>
      </div>
    </div>
  )
}

export function NotificationManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Hộp thư thông báo</h2>
        <p className="text-sm text-gray-400 mt-1">Cập nhật tin tức sinh nhật, phê duyệt đơn từ, và thông báo hệ thống</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs max-w-3xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-sm">Gần đây</h3>
          <button className="text-xs font-bold text-[#C62828] hover:underline">Đánh dấu đọc tất cả</button>
        </div>
        <div className="space-y-3">
          {NOTIFICATIONS.map(n => (
            <NotifItem key={n.id} n={n} />
          ))}
        </div>
      </div>
    </div>
  )
}
