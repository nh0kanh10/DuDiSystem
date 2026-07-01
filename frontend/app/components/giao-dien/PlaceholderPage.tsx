import React from "react"
import { LucideIcon } from "lucide-react"

export function PlaceholderPage({ title, desc, icon: Icon, items }: { title: string; desc: string; icon: React.ElementType; items?: string[] }) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      <div className="bg-white rounded-2xl p-10 shadow-sm border border-black/5 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={30} className="text-[#C62828] opacity-50" />
        </div>
        <h3 className="font-bold text-gray-600 mb-2">{title}</h3>
        <p className="text-sm text-gray-400 max-w-sm">{desc}</p>
        {items && (
          <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-sm">
            {items.map(item => (
              <div key={item} className="bg-gray-50 rounded-xl p-3 text-left border border-gray-100 cursor-pointer hover:bg-red-50 hover:border-[#C62828]/20 transition-colors">
                <p className="text-xs font-semibold text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TASK PANEL ───────────────────────────────────────────────────────────────
const TASK_HISTORY = [
  {
    date: "24/06/2026", dayName: "Thứ Tư",
    tasks: [
      { id: "h1", title: "Viết API endpoint chấm công", done: true },
      { id: "h2", title: "Review code module nhân sự", done: true },
    ]
  },
  {
    date: "23/06/2026", dayName: "Thứ Ba",
    tasks: [
      { id: "h3", title: "Thiết kế lại trang web", done: true },
      { id: "h4", title: "Viết section cho danh mục web", done: true },
    ]
  },
  {
    date: "20/06/2026", dayName: "Thứ Sáu",
    tasks: [
      { id: "h5", title: "Setup CI/CD pipeline", done: true },
      { id: "h6", title: "Báo cáo sprint Q2", done: true },
    ]
  },
]

