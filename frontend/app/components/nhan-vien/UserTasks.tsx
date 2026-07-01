import React, { useState } from "react"
import { CheckSquare, Circle, Clock, Flag, Plus, X, Loader2 } from "lucide-react"
import { getStoredUser } from "./types"
import { useMyTasks } from "../../hooks/useMyTasks"
import { api } from "@/lib/api"

type Priority = "high" | "medium" | "low"
type Status = "todo" | "in-progress" | "done"

const PRIORITY_MAP = {
    high: { label: "Cao", color: "text-red-600", bg: "bg-red-100", dot: "bg-red-500" },
    medium: { label: "Trung bình", color: "text-amber-700", bg: "bg-amber-100", dot: "bg-amber-500" },
    low: { label: "Thấp", color: "text-blue-600", bg: "bg-blue-100", dot: "bg-blue-400" },
}

const STATUS_MAP = {
    todo: { label: "Cần làm", color: "text-gray-500", bg: "bg-gray-100" },
    "in-progress": { label: "Đang làm", color: "text-orange-700", bg: "bg-orange-100" },
    done: { label: "Hoàn thành", color: "text-green-700", bg: "bg-green-100" },
}

export default function UserTasks() {
    const me = getStoredUser()
    const { tasks, loading, error, reload, stats } = useMyTasks(me.id)
    const [filter, setFilter] = useState<Status | "all">("all")
    const [showAdd, setShowAdd] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newDate, setNewDate] = useState("")
    const [newPriority, setNewPriority] = useState<Priority>("medium")
    const [actionLoading, setActionLoading] = useState(false)

    const filtered = filter === "all" ? tasks : tasks.filter(t => (t.status || "todo") === filter)

    const toggleDone = async (id: string, currentStatus?: string) => {
        setActionLoading(true)
        try {
            const nextStatus = currentStatus === "done" ? "todo" : "done"
            await api.tasks.update(id, { status: nextStatus })
            await reload()
        } catch (e) {
            alert(e instanceof Error ? e.message : "Thao tác thất bại")
        } finally {
            setActionLoading(false)
        }
    }

    const addTask = async () => {
        if (!newTitle.trim()) return
        setActionLoading(true)
        try {
            await api.tasks.create({
                title: newTitle,
                dueDate: newDate ? newDate.split("-").reverse().join("/") : "–",
                priority: newPriority,
                status: "todo",
                assigneeId: me.id,
                assigneeName: me.name
            })
            setNewTitle(""); setNewDate(""); setNewPriority("medium"); setShowAdd(false)
            await reload()
        } catch (e) {
            alert(e instanceof Error ? e.message : "Không thể thêm công việc")
        } finally {
            setActionLoading(false)
        }
    }

    const totalCount = tasks.length

    return (
        <div className="space-y-5 max-w-3xl mx-auto">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                    {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { l: "Tổng cộng", v: totalCount, c: "text-gray-800", bg: "bg-white border border-black/5" },
                    { l: "Đang làm", v: stats.inProgress, c: "text-orange-600", bg: "bg-orange-50" },
                    { l: "Cần làm", v: stats.todo, c: "text-blue-600", bg: "bg-blue-50" },
                    { l: "Hoàn thành", v: stats.done, c: "text-green-600", bg: "bg-green-50" },
                ].map(s => (
                    <div key={s.l} className={`${s.bg} rounded-2xl p-4`}>
                        <p className={`text-2xl font-black ${s.c}`}>{loading ? "—" : s.v}</p>
                        <p className="text-xs font-semibold text-gray-600 mt-1">{s.l}</p>
                    </div>
                ))}
            </div>

            {/* Actions row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                    {([["all", "Tất cả"], ["todo", "Cần làm"], ["in-progress", "Đang làm"], ["done", "Hoàn thành"]] as const).map(([k, l]) => (
                        <button key={k} onClick={() => setFilter(k)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                ${filter === k ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
                            {l}
                        </button>
                    ))}
                </div>
                <button onClick={() => setShowAdd(true)}
                    disabled={actionLoading || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50">
                    <Plus size={15} /> Thêm việc
                </button>
            </div>

            {/* Add task form */}
            {showAdd && (
                <div className="bg-white rounded-2xl p-5 border border-[#C62828]/20 shadow-sm space-y-3">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-gray-700">Thêm công việc mới</h4>
                        <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
                    </div>
                    <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                        placeholder="Tên công việc..."
                        disabled={actionLoading}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40" />
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Hạn chót</label>
                            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                                disabled={actionLoading}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Ưu tiên</label>
                            <select value={newPriority} onChange={e => setNewPriority(e.target.value as Priority)}
                                disabled={actionLoading}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
                                <option value="high">🔴 Cao</option>
                                <option value="medium">🟡 Trung bình</option>
                                <option value="low">🔵 Thấp</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button onClick={() => setShowAdd(false)}
                            disabled={actionLoading}
                            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                            Hủy
                        </button>
                        <button onClick={addTask}
                            disabled={actionLoading}
                            className="flex-1 py-2.5 bg-[#C62828] text-white rounded-xl text-sm font-bold hover:bg-[#B71C1C] flex items-center justify-center gap-1.5">
                            {actionLoading && <Loader2 size={14} className="animate-spin" />}
                            Thêm
                        </button>
                    </div>
                </div>
            )}

            {/* Task list */}
            <div className="space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Loader2 size={24} className="animate-spin text-[#C62828] mb-2" />
                        <span className="text-xs font-medium">Đang tải danh sách công việc...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center text-gray-400 border border-black/5 shadow-sm">
                        <CheckSquare size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Không có công việc nào</p>
                    </div>
                ) : (
                    filtered.map(task => {
                        const priorityKey = (task.priority || "medium") as Priority
                        const statusKey = (task.status || "todo") as Status
                        const p = PRIORITY_MAP[priorityKey] ?? PRIORITY_MAP.medium
                        const s = STATUS_MAP[statusKey] ?? STATUS_MAP.todo
                        return (
                            <div key={task.id}
                                className={`bg-white rounded-2xl p-5 border shadow-sm flex items-start gap-4 transition-all
                    ${statusKey === "done" ? "border-green-100 opacity-70" : "border-black/5 hover:border-[#C62828]/20"}`}>
                                <button onClick={() => toggleDone(task.id, statusKey)} disabled={actionLoading} className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110 disabled:opacity-50">
                                    {statusKey === "done"
                                        ? <CheckSquare size={22} className="text-green-500" />
                                        : <Circle size={22} className="text-gray-300 hover:text-[#C62828] transition-colors" />
                                    }
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-semibold text-sm ${statusKey === "done" ? "line-through text-gray-400" : "text-gray-800"}`}>
                                        {task.title}
                                    </p>
                                    {task.description && <p className="text-xs text-gray-400 mt-0.5 italic">{task.description}</p>}
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${s.bg} ${s.color}`}>
                                            {s.label}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${p.bg} ${p.color}`}>
                                            <Flag size={10} /> {p.label}
                                        </span>
                                        {task.dueDate && task.dueDate !== "–" && (
                                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                                <Clock size={11} /> {task.dueDate}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
