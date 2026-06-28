import React, { useState } from "react"
import { CheckSquare, Plus, User, Calendar } from "lucide-react"
import { TaskItem } from "../../types"
import { Badge } from "../ui/Badge"
import { INIT_TASKS } from "../../constants"

export function TaskManagement() {
  const [tasks, setTasks] = useState<TaskItem[]>(INIT_TASKS)
  const todo = tasks.filter(t => t.status === "todo").length
  const progress = tasks.filter(t => t.status === "in-progress").length
  const done = tasks.filter(t => t.status === "done").length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Quản lý công việc</h2>
          <p className="text-sm text-gray-400 mt-1">Phân công, giám sát trạng thái và tiến độ dự án nội bộ</p>
        </div>
        <button onClick={() => alert("Thêm công việc mới")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
          <Plus size={15} /> Thêm công việc
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[["bg-gray-100 text-gray-600", "Cần làm", todo], ["bg-orange-50 text-orange-600", "Đang tiến hành", progress], ["bg-green-50 text-green-700", "Hoàn thành", done]].map(([c, l, v]) => (
          <div key={l} className="bg-white rounded-2xl p-5 border border-black/5 shadow-xs flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 font-bold">{l}</p>
              <h4 className="text-2xl font-black text-gray-700 mt-1">{v}</h4>
            </div>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${c}`}>{v}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(["todo", "in-progress", "done"] as const).map(col => {
            const list = tasks.filter(t => t.status === col)
            const title = col === "todo" ? "Cần làm" : col === "in-progress" ? "Đang làm" : "Đã hoàn thành"
            const border = col === "todo" ? "border-t-4 border-t-gray-400" : col === "in-progress" ? "border-t-4 border-t-orange-400" : "border-t-4 border-t-green-400"
            return (
              <div key={col} className={`bg-gray-50/50 rounded-2xl p-4 space-y-3 ${border}`}>
                <div className="flex justify-between items-center pb-2">
                  <span className="font-bold text-gray-700 text-xs uppercase">{title}</span>
                  <span className="bg-gray-200/50 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold">{list.length}</span>
                </div>
                <div className="space-y-3 max-h-[480px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                  {list.map(t => (
                    <div key={t.id} className="bg-white rounded-xl p-3.5 border border-black/[0.03] shadow-xs hover:shadow-sm transition-all space-y-3.5">
                      <div className="flex justify-between items-start gap-3">
                        <p className="text-xs font-bold text-gray-700 line-clamp-2 leading-relaxed">{t.title}</p>
                        <Badge status={t.priority} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold border-t border-gray-50 pt-2.5">
                        <span className="flex items-center gap-1"><User size={11} /> {t.assignee}</span>
                        <span className="flex items-center gap-1"><Calendar size={11} /> {t.dueDate}</span>
                      </div>
                    </div>
                  ))}
                  {list.length === 0 && (
                    <div className="text-center py-8 text-gray-300 text-xs">Trống</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
