import React, { useState } from "react"
import { ChevronLeft, User, Fingerprint, Calendar, CheckSquare, Settings, LogOut, Bell, MessageCircle } from "lucide-react"
import { getStoredUser } from "./types"
import type { UserPage } from "./types"
import UserDashboard from "./UserDashboard"
import UserProfile from "./UserProfile"
import UserAttendance from "./UserAttendance"
import UserTimeOff from "./UserTimeOff"
import UserTasks from "./UserTasks"
import UserSettings from "./UserSettings"

interface Props {
    activePage: UserPage
    onNavigate: (p: UserPage) => void
    onLogout: () => void
}

const PAGE_META: Record<Exclude<UserPage, "dashboard">, { title: string; icon: React.ElementType; color: string }> = {
    "user-profile": { title: "Thông tin nhân viên", icon: User, color: "#8B5CF6" },
    "user-attendance": { title: "Check-in / Check-out", icon: Fingerprint, color: "#C62828" },
    "user-timeoff": { title: "Ngày nghỉ & Time Off", icon: Calendar, color: "#EA580C" },
    "user-tasks": { title: "Công việc của tôi", icon: CheckSquare, color: "#2563EB" },
    "user-settings": { title: "Cài đặt tài khoản", icon: Settings, color: "#6B7280" },
    "user-chat": { title: "Trò chuyện nội bộ", icon: MessageCircle, color: "#10B981" },
}

export default function UserPortalLayout({ activePage, onNavigate, onLogout }: Props) {
    const me = getStoredUser()

    if (activePage === "dashboard") {
        return <UserDashboard onNavigate={onNavigate} onLogout={onLogout} />
    }

    const meta = PAGE_META[activePage as Exclude<UserPage, "dashboard">]
    const Icon = meta?.icon ?? User

    const renderPage = () => {
        switch (activePage) {
            case "user-profile": return <UserProfile emp={me} />
            case "user-attendance": return <UserAttendance />
            case "user-timeoff": return <UserTimeOff employee={me as any} />
            case "user-tasks": return <UserTasks />
            case "user-settings": return <UserSettings onLogout={onLogout} />
            case "user-chat": return <div className="bg-white rounded-2xl p-10 text-center text-gray-400 border border-black/5 shadow-sm">Trò chuyện nội bộ (Tính năng đang được phát triển)</div>
            default: return null
        }
    }

    return (
        <div className="min-h-screen bg-[#F5F1EF] flex flex-col">
            {/* ── Minimal portal header ── */}
            <header className="bg-white border-b border-black/5 px-5 py-3 flex items-center gap-4 flex-shrink-0">
                <button
                    onClick={() => onNavigate("dashboard")}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors group"
                >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-red-50 transition-colors">
                        <ChevronLeft size={18} className="group-hover:text-[#C62828] transition-colors" />
                    </div>
                    <span className="hidden sm:block">Trang chủ</span>
                </button>

                {/* Page title */}
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${meta?.color}18` }}>
                        <Icon size={16} style={{ color: meta?.color }} />
                    </div>
                    <h1 className="font-bold text-gray-800 text-sm">{meta?.title}</h1>
                </div>

                {/* Right: user info */}
                <div className="ml-auto flex items-center gap-3">
                    <button onClick={() => onNavigate("user-settings")}
                        className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
                        <Bell size={18} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C62828] rounded-full" />
                    </button>
                    <button
                        onClick={() => onNavigate("dashboard")}
                        className="flex items-center gap-2 pl-3 border-l border-gray-100 cursor-pointer"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white text-xs font-black">
                            {me.name.split(" ").pop()?.charAt(0)}
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-xs font-semibold text-gray-700 leading-none">
                                {me.name.split(" ").slice(-2).join(" ")}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{me.id}</p>
                        </div>
                    </button>
                    <button
                        onClick={onLogout}
                        className="ml-1 p-2.5 hover:bg-red-50 rounded-xl transition-colors text-gray-400 hover:text-red-500"
                        title="Đăng xuất"
                    >
                        <LogOut size={17} />
                    </button>
                </div>
            </header>

            {/* ── Tab navigation (quick-switch between modules) ── */}
            <div className="bg-white border-b border-gray-100 px-5 overflow-x-auto">
                <div className="flex gap-1 py-1.5">
                    {(Object.entries(PAGE_META) as [UserPage, typeof PAGE_META[keyof typeof PAGE_META]][]).map(([page, info]) => {
                        const PIcon = info.icon
                        const isActive = activePage === page
                        return (
                            <button
                                key={page}
                                onClick={() => onNavigate(page)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                  ${isActive
                                        ? "text-white shadow-sm"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                    }`}
                                style={isActive ? { backgroundColor: info.color } : {}}
                            >
                                <PIcon size={13} />
                                {info.title.split(" ")[0]}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── Page content ── */}
            <main className="flex-1 overflow-y-auto p-5"
                style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e7eb transparent" }}>
                {renderPage()}
            </main>
        </div>
    )
}
