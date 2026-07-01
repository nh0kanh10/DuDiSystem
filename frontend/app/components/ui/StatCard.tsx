import React from "react"

export function StatCard({ title, value, sub, iconBg, iconColor, numColor, icon: Icon }: {
  title: string; value: string | number; sub?: string
  iconBg: string; iconColor: string; numColor?: string
  icon: React.ElementType
}) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-black/5 shadow-xs flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <h4 className={`text-2xl font-black ${numColor || "text-gray-800"}`}>{value}</h4>
        {sub && <p className="text-[10px] text-gray-400 font-medium mt-1">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <Icon size={20} className={iconColor} />
      </div>
    </div>
  )
}
