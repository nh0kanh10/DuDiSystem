import React, { useMemo, useState } from "react"
import { getStoredUser } from "./types"
import { useMyTasks } from "../../hooks/useMyTasks"
import { api } from "@/lib/api"
import { CustomSelect } from "../ui/CustomSelect"

type Priority = "high" | "medium" | "low"
type Status = "todo" | "in-progress" | "done"

const PRIORITY_MAP = {
    high: { label: "Cao", color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-500/10", dot: "bg-red-500" },
    medium: { label: "Trung bình", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/10", dot: "bg-amber-500" },
    low: { label: "Thấp", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/10", dot: "bg-blue-400" },
}

const STATUS_MAP = {
    todo: { label: "Cần làm", color: "text-gray-500 dark:text-gray-300", bg: "bg-gray-100 dark:bg-white/10" },
    "in-progress": { label: "Đang làm", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/10" },
    done: { label: "Hoàn thành", color: "text-green-700 dark:text-emerald-400", bg: "bg-green-100 dark:bg-emerald-500/10" },
}

function parseVnDate(value?: string) {
    if (!value) return null
    const parts = value.split("/").map(Number)
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null
    return new Date(parts[2], parts[1] - 1, parts[0])
}

export default function UserTasks({ variant = "default" }: { variant?: "default" | "portal" }) {
    const portal = variant === "portal"
    const me = getStoredUser()
    const { tasks, loading, error, reload, stats } = useMyTasks(me.id)
    const [filter, setFilter] = useState<Status | "all">("all")
    const [query, setQuery] = useState("")
    const [showAdd, setShowAdd] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newDescription, setNewDescription] = useState("")
    const [newDate, setNewDate] = useState("")
    const [noDeadline, setNoDeadline] = useState(false)
    const [newPriority, setNewPriority] = useState<Priority>("medium")
    const [actionLoading, setActionLoading] = useState(false)
    const getTodayVn = () => {
        const d = new Date()
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
    }

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return tasks
            .filter(t => filter === "all" ? true : (t.status || "todo") === filter)
            .filter(t => {
                if (!q) return true
                return `${t.title || ""} ${t.description || ""}`.toLowerCase().includes(q)
            })
            .sort((a, b) => {
                const aDone = (a.status || "todo") === "done"
                const bDone = (b.status || "todo") === "done"
                if (aDone !== bDone) return aDone ? 1 : -1
                const aDate = parseVnDate(a.dueDate)
                const bDate = parseVnDate(b.dueDate)
                if (aDate && bDate) return aDate.getTime() - bDate.getTime()
                if (aDate) return -1
                if (bDate) return 1
                return (a.title || "").localeCompare(b.title || "")
            })
    }, [tasks, filter, query])

    const todayStr = useMemo(() => {
        const d = new Date()
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
    }, [])

    const todayFocus = useMemo(
        () => filtered.filter(t => (t.status || "todo") !== "done" && t.dueDate === todayStr),
        [filtered, todayStr]
    )

    const overdueCount = useMemo(() => {
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        return tasks.filter(t => {
            if ((t.status || "todo") === "done") return false
            const due = parseVnDate(t.dueDate)
            return !!due && due.getTime() < now.getTime()
        }).length
    }, [tasks])

    const surface = portal ? "bg-white dark:bg-white/[0.04] border-[#efd7da] dark:border-white/10 text-[#241416] dark:text-gray-100" : "bg-white border-black/5 text-gray-800"
    const muted = portal ? "text-[#7f5f63] dark:text-gray-400" : "text-gray-600"

    const setTaskStatus = async (id: string, nextStatus: Status) => {
        setActionLoading(true)
        try {
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
                description: newDescription.trim(),
                dueDate: noDeadline ? "" : (newDate ? newDate.split("-").reverse().join("/") : getTodayVn()),
                priority: newPriority,
                status: "todo",
                assigneeId: me.id,
                assigneeName: me.name
            })
            setNewTitle(""); setNewDescription(""); setNewDate(""); setNewPriority("medium"); setNoDeadline(false); setShowAdd(false)
            await reload()
        } catch (e) {
            alert(e instanceof Error ? e.message : "Không thể thêm công việc")
        } finally {
            setActionLoading(false)
        }
    }

    const totalCount = tasks.length

    return (
        <div className={`space-y-5 ${portal ? "w-full" : "max-w-3xl mx-auto"}`}>
            {error && (
                <div className={`p-3 rounded-xl text-sm font-medium ${portal ? "bg-red-50 border border-red-200 text-red-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                    {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { l: "Tổng cộng", v: totalCount, c: portal ? "text-[#241416] dark:text-white" : "text-gray-800", bg: portal ? "bg-white dark:bg-white/[0.06] border border-[#efd7da] dark:border-white/10 shadow-sm dark:shadow-none" : "bg-white border border-black/5" },
                    { l: "Đang làm", v: stats.inProgress, c: portal ? "text-[#d97706] dark:text-orange-400" : "text-orange-600", bg: portal ? "bg-white dark:bg-orange-500/10 border border-[#efd7da] dark:border-orange-500/20 shadow-sm dark:shadow-none" : "bg-orange-50" },
                    { l: "Cần làm", v: stats.todo, c: portal ? "text-[#E8231A] dark:text-blue-400" : "text-blue-600", bg: portal ? "bg-white dark:bg-blue-500/10 border border-[#efd7da] dark:border-blue-500/20 shadow-sm dark:shadow-none" : "bg-blue-50" },
                    { l: "Hoàn thành", v: stats.done, c: portal ? "text-emerald-600 dark:text-emerald-400" : "text-green-600", bg: portal ? "bg-white dark:bg-emerald-500/10 border border-[#efd7da] dark:border-emerald-500/20 shadow-sm dark:shadow-none" : "bg-green-50" },
                ].map(s => (
                    <div key={s.l} className={`${s.bg} rounded-2xl p-4`}>
                        <p className={`text-2xl font-black ${s.c}`}>{loading ? "—" : s.v}</p>
                        <p className={`text-xs font-semibold mt-1 ${muted}`}>{s.l}</p>
                    </div>
                ))}
            </div>

            <div className={`${surface} rounded-2xl p-4 border shadow-sm flex flex-wrap items-center justify-between gap-3`}>
                <div>
                    <p className={`text-sm font-black ${portal ? "text-[#241416] dark:text-white" : "text-gray-800"}`}>Kế hoạch hôm nay</p>
                    <p className={`text-xs ${muted} mt-1`}>
                        {todayFocus.length > 0
                            ? `Bạn có ${todayFocus.length} việc đến hạn hôm nay.`
                            : "Không có việc đến hạn hôm nay."}
                        {overdueCount > 0 ? ` Có ${overdueCount} việc đang trễ hạn.` : ""}
                    </p>
                </div>
                <button onClick={reload}
                    disabled={actionLoading || loading}
                    className={`px-4 py-2 border rounded-xl text-xs font-black transition-all disabled:opacity-50 ${portal ? "bg-white dark:bg-white/5 border-[#e7c8cc] dark:border-white/20 text-[#7a1d22] dark:text-white hover:bg-[#fff1f2] dark:hover:bg-white/10" : "bg-white text-gray-800 hover:bg-gray-50"}`}>
                    Làm mới danh sách
                </button>
            </div>

            {/* Actions row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className={`flex gap-1 rounded-xl p-1 ${portal ? "bg-[#fff1f2] dark:bg-black/20 border border-[#efd7da] dark:border-white/10" : "bg-gray-100"}`}>
                    {([["all", "Tất cả"], ["todo", "Cần làm"], ["in-progress", "Đang làm"], ["done", "Hoàn thành"]] as const).map(([k, l]) => (
                        <button key={k} onClick={() => setFilter(k)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                ${filter === k ? portal ? "bg-[#E8231A] text-white shadow-sm" : "bg-white shadow text-gray-800" : portal ? "text-[#7f5f63] dark:text-gray-400 hover:text-[#241416] dark:hover:text-white" : "text-gray-500 hover:text-gray-700"}`}>
                            {l}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Tìm việc theo tiêu đề..."
                        className={`w-56 px-3 py-2 border rounded-xl text-sm focus:outline-none ${portal ? "bg-white dark:bg-white/[0.03] border-[#e7c8cc] dark:border-white/10 text-[#241416] dark:text-white placeholder:text-[#8b6b70] dark:placeholder:text-white/40 focus:border-[#E8231A] dark:focus:border-red-500/50" : "border-gray-200 focus:border-[#C62828]/40"}`}
                    />
                    <button onClick={() => setShowAdd(true)}
                        disabled={actionLoading || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50">
                        Thêm việc
                    </button>
                </div>
            </div>

            {/* Add task form */}
            {showAdd && (
                <div className={`${surface} rounded-2xl p-5 border shadow-sm space-y-3`}>
                    <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-bold ${portal ? "text-[#241416] dark:text-white" : "text-gray-700"}`}>Thêm công việc mới</h4>
                        <button onClick={() => setShowAdd(false)} className={`px-2 py-1 text-xs font-bold rounded-lg ${portal ? "text-[#7f5f63] dark:text-gray-400 hover:bg-[#fff1f2] dark:hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}>Đóng</button>
                    </div>
                    <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                        placeholder="Tên công việc..."
                        disabled={actionLoading}
                        className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none ${portal ? "bg-white dark:bg-white/[0.03] border-[#e7c8cc] dark:border-white/10 text-[#241416] dark:text-white placeholder:text-[#8b6b70] dark:placeholder:text-white/40 focus:border-[#E8231A] dark:focus:border-red-500/50" : "border-gray-200 focus:border-[#C62828]/40"}`} />
                    <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)}
                        placeholder="Mô tả ngắn mục tiêu cần làm..."
                        rows={2}
                        disabled={actionLoading}
                        className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none resize-none ${portal ? "bg-white dark:bg-white/[0.03] border-[#e7c8cc] dark:border-white/10 text-[#241416] dark:text-white placeholder:text-[#8b6b70] dark:placeholder:text-white/40 focus:border-[#E8231A] dark:focus:border-red-500/50" : "border-gray-200 focus:border-[#C62828]/40"}`} />
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={`text-xs font-bold mb-1 block ${muted}`}>Hạn chót</label>
                            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                                disabled={actionLoading || noDeadline}
                                className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none ${portal ? "bg-white dark:bg-white/[0.03] border-[#e7c8cc] dark:border-white/10 text-[#241416] dark:text-white focus:border-[#E8231A] dark:focus:border-red-500/50" : "border-gray-200 focus:border-[#C62828]/40"}`} />
                            <label className={`mt-2 inline-flex items-center gap-2 text-xs font-semibold ${muted}`}>
                                <input
                                    type="checkbox"
                                    checked={noDeadline}
                                    onChange={e => setNoDeadline(e.target.checked)}
                                    className="w-4 h-4 accent-[#C62828]"
                                />
                                Không đặt deadline
                            </label>
                        </div>
                        <div>
                            <label className={`text-xs font-bold mb-1 block ${muted}`}>Ưu tiên</label>
                            <CustomSelect
                                value={newPriority}
                                onChange={val => setNewPriority(val as Priority)}
                                disabled={actionLoading}
                                options={[
                                    { value: "high", label: "Cao - làm trước" },
                                    { value: "medium", label: "Trung bình" },
                                    { value: "low", label: "Thấp - làm sau" }
                                ]}
                                className="w-full"
                                heightClass="h-[38px]"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button onClick={() => setShowAdd(false)}
                            disabled={actionLoading}
                            className={`flex-1 py-2.5 border rounded-xl text-sm font-semibold transition-all ${portal ? "border-[#e7c8cc] dark:border-white/20 text-[#7f5f63] dark:text-gray-300 hover:bg-[#fff1f2] dark:hover:bg-white/10" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                            Hủy
                        </button>
                        <button onClick={addTask}
                            disabled={actionLoading}
                            className="flex-1 py-2.5 bg-[#C62828] text-white rounded-xl text-sm font-bold hover:bg-[#B71C1C] flex items-center justify-center gap-1.5">
                            {actionLoading ? "Đang thêm..." : "Thêm"}
                        </button>
                    </div>
                </div>
            )}

            {/* Task list */}
            <div className="space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <span className="text-xs font-medium">Đang tải danh sách công việc...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={`${surface} rounded-2xl p-10 text-center shadow-sm`}>
                        <p className="text-sm font-bold">Không có công việc nào</p>
                    </div>
                ) : (
                    filtered.map(task => {
                        const priorityKey = (task.priority || "medium") as Priority
                        const statusKey = (task.status || "todo") as Status
                        const p = PRIORITY_MAP[priorityKey] ?? PRIORITY_MAP.medium
                        const s = STATUS_MAP[statusKey] ?? STATUS_MAP.todo
                        const due = parseVnDate(task.dueDate)
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const isOverdue = !!due && statusKey !== "done" && due.getTime() < today.getTime()
                        const isToday = task.dueDate === todayStr
                        return (
                            <div key={task.id}
                                className={`${surface} rounded-2xl p-5 border shadow-sm flex items-start gap-4 transition-all
                    ${statusKey === "done" ? portal ? "opacity-75 dark:opacity-60" : "border-green-100 opacity-70" : portal ? "hover:border-[#E8231A]/30 dark:hover:border-red-500/40" : "border-black/5 hover:border-[#C62828]/20"}`}>
                                <div className="flex-shrink-0 mt-0.5">
                                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-black transition-all ${statusKey === "done" ? (portal ? "border-green-400 dark:border-emerald-500/30 bg-green-50 dark:bg-emerald-500/10 text-green-600 dark:text-emerald-400" : "border-green-400 bg-green-50 text-green-600") : statusKey === "in-progress" ? (portal ? "border-orange-300 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400" : "border-orange-300 bg-orange-50 text-orange-600") : (portal ? "border-gray-300 dark:border-white/20 dark:bg-white/5 text-gray-400 dark:text-gray-300" : "border-gray-300 text-gray-400")}`}>
                                        {statusKey === "done" ? "OK" : statusKey === "in-progress" ? "▶" : "•"}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-semibold text-sm ${statusKey === "done" ? portal ? "line-through text-[#8b6b70] dark:text-white/60" : "line-through text-gray-400" : portal ? "text-[#241416] dark:text-white" : "text-gray-800"}`}>
                                        {task.title}
                                    </p>
                                    {task.description && <p className={`text-xs mt-0.5 italic ${portal ? "text-[#7f5f63]" : "text-gray-400"}`}>{task.description}</p>}
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${s.bg} ${s.color}`}>
                                            {s.label}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${p.bg} ${p.color}`}>
                                            {p.label}
                                        </span>
                                        {task.dueDate && task.dueDate !== "–" && (
                                            <span className={`flex items-center gap-1 text-xs ${portal ? "text-[#7f5f63] dark:text-gray-400" : "text-gray-400"}`}>
                                                {task.dueDate}
                                            </span>
                                        )}
                                        {!task.dueDate && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${portal ? "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                                                Không deadline
                                            </span>
                                        )}
                                        {isToday && statusKey !== "done" && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${portal ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20" : "bg-blue-50 text-blue-600 border-blue-100"}`}>
                                                Hôm nay
                                            </span>
                                        )}
                                        {isOverdue && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${portal ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20" : "bg-red-50 text-red-600 border-red-100"}`}>
                                                Trễ hạn
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {statusKey === "todo" && (
                                        <button
                                            onClick={() => setTaskStatus(task.id, "in-progress")}
                                            disabled={actionLoading}
                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all disabled:opacity-50 ${portal ? "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20 hover:bg-orange-100 dark:hover:bg-orange-500/20" : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"}`}
                                        >
                                            Bắt đầu
                                        </button>
                                    )}
                                    {statusKey !== "done" && (
                                        <button
                                            onClick={() => setTaskStatus(task.id, "done")}
                                            disabled={actionLoading}
                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all disabled:opacity-50 ${portal ? "bg-green-50 dark:bg-emerald-500/10 text-green-700 dark:text-emerald-400 border-green-200 dark:border-emerald-500/20 hover:bg-green-100 dark:hover:bg-emerald-500/20" : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"}`}
                                        >
                                            Hoàn thành
                                        </button>
                                    )}
                                    {statusKey === "done" && (
                                        <button
                                            onClick={() => setTaskStatus(task.id, "todo")}
                                            disabled={actionLoading}
                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all disabled:opacity-50 ${portal ? "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}
                                        >
                                            Mở lại
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
