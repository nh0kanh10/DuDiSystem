import React, { useState, useEffect } from "react"
import { User, Calendar, CheckSquare, Settings, Fingerprint, MessageCircle } from "lucide-react"
import type { UserPage } from "./types"
import { getStoredUser } from "./types"

interface Props {
    onNavigate: (p: UserPage) => void
    onLogout: () => void
}

function BubbleButton({
    label, onClick, size = 96, children, borderColor, bgGradient, style,
}: {
    label: string
    onClick: () => void
    size?: number
    children: React.ReactNode
    borderColor: string
    bgGradient: string
    style?: React.CSSProperties
}) {
    return (
        <button
            onClick={onClick}
            className="absolute flex flex-col items-center justify-center gap-[6px] rounded-full transition-all duration-300 hover:scale-110 active:scale-95 group"
            style={{
                width: size, height: size,
                background: bgGradient,
                border: `1.5px solid ${borderColor}`,
                boxShadow: `0 4px 24px ${borderColor}40, inset 0 1px 0 rgba(255,255,255,0.04)`,
                ...style,
            }}
        >
            {children}
            <span className="text-white/60 text-[11px] font-semibold group-hover:text-white/90 transition-colors leading-none">
                {label}
            </span>
        </button>
    )
}

export default function UserDashboard({ onNavigate, onLogout }: Props) {
    const me = getStoredUser()
    const [now, setNow] = useState(new Date())
    const [checkedIn, setCheckedIn] = useState(false)
    const [checkInTime, setCheckInTime] = useState<string | null>(null)
    const [pulse, setPulse] = useState(true)

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(t)
    }, [])

    useEffect(() => {
        const t = setInterval(() => setPulse(p => !p), 500)
        return () => clearInterval(t)
    }, [])

    const pad = (n: number) => String(n).padStart(2, "0")
    const DAYS = ["CHỦ NHẬT", "THỨ HAI", "THỨ BA", "THỨ TƯ", "THỨ NĂM", "THỨ SÁU", "THỨ BẢY"]

    const handleCheckIn = () => {
        if (!checkedIn) {
            setCheckInTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`)
            setCheckedIn(true)
        } else {
            setCheckInTime(null)
            setCheckedIn(false)
        }
    }

    return (
        <div
            className="fixed inset-0 flex flex-col items-center overflow-hidden select-none"
            style={{
                background: "radial-gradient(ellipse 80% 70% at 65% 45%, #4a0a0a 0%, #250202 35%, #0e0000 70%, #050000 100%)",
            }}
        >
            {/* Ambient light blobs */}
            <div className="absolute pointer-events-none" style={{
                top: "-10%", left: "-5%", width: "55%", height: "60%",
                background: "radial-gradient(ellipse, rgba(100,0,0,0.35) 0%, transparent 65%)",
                filter: "blur(40px)",
            }} />
            <div className="absolute pointer-events-none" style={{
                bottom: "-5%", right: "5%", width: "45%", height: "50%",
                background: "radial-gradient(ellipse, rgba(150,40,0,0.2) 0%, transparent 70%)",
                filter: "blur(60px)",
            }} />

            {/* ── Date + Clock ── */}
            <div className="relative z-10 flex flex-col items-center" style={{ marginTop: "clamp(40px, 10vh, 100px)" }}>
                <p className="text-white/40 text-xs tracking-[0.4em] uppercase font-medium mb-4">
                    {DAYS[now.getDay()]} · {now.getDate()} THÁNG {now.getMonth() + 1} · {now.getFullYear()}
                </p>

                {/* Clock */}
                <div className="flex items-baseline gap-2">
                    <span className="font-black tabular-nums text-[#E53935] leading-none"
                        style={{ fontSize: "clamp(100px, 18vw, 220px)" }}>
                        {pad(now.getHours())}
                    </span>
                    <span className="font-black text-[#E53935] leading-none transition-opacity duration-100"
                        style={{ fontSize: "clamp(80px, 14vw, 180px)", opacity: pulse ? 1 : 0.2 }}>
                        :
                    </span>
                    <span className="font-black tabular-nums text-[#E53935] leading-none"
                        style={{ fontSize: "clamp(100px, 18vw, 220px)" }}>
                        {pad(now.getMinutes())}
                    </span>
                    <span className="font-bold tabular-nums text-white/40 leading-none"
                        style={{ fontSize: "clamp(36px, 6vw, 70px)", marginBottom: "-8px" }}>
                        {pad(now.getSeconds())}
                    </span>
                </div>
            </div>

            {/* ── Bubble layout ── */}
            <div
                className="relative z-10 flex-shrink-0"
                style={{
                    width: "min(900px, 95vw)",
                    height: "clamp(350px, 45vh, 450px)",
                    marginTop: "clamp(40px, 8vh, 80px)",
                }}
            >
                {/* ── Center: Check-in ── */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    {/* Ripple rings */}
                    <div className="absolute rounded-full border border-[#E53935]/15 pointer-events-none"
                        style={{ inset: "-40px" }} />
                    <div className="absolute rounded-full border border-[#E53935]/10 pointer-events-none"
                        style={{ inset: "-80px" }} />

                    <button
                        onClick={handleCheckIn}
                        className="relative w-44 h-44 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
                        style={{
                            background: checkedIn
                                ? "radial-gradient(circle at 50% 35%, #1a4a2a, #0d2018)"
                                : "radial-gradient(circle at 50% 35%, #330808, #1a0202)",
                            border: checkedIn ? "2px solid rgba(74,222,128,0.35)" : "2px solid rgba(229,57,53,0.35)",
                            boxShadow: checkedIn
                                ? "0 0 40px rgba(74,222,128,0.2), 0 10px 40px rgba(0,0,0,0.6)"
                                : "0 0 40px rgba(229,57,53,0.25), 0 10px 40px rgba(0,0,0,0.6)",
                        }}
                    >
                        <Fingerprint size={52} className={checkedIn ? "text-green-400" : "text-[#FF8A50]"} />
                        <span className="text-white text-sm font-bold tracking-wider mt-1">
                            {checkedIn ? "Check-out" : "Check-in"}
                        </span>
                        {checkInTime && (
                            <span className="absolute -bottom-7 text-white/50 text-[11px] whitespace-nowrap font-medium">
                                Vào lúc {checkInTime}
                            </span>
                        )}
                    </button>
                </div>

                {/* ── Hồ sơ ── top-left */}
                <BubbleButton
                    label="Hồ sơ" size={110}
                    borderColor="rgba(147,51,234,0.5)" bgGradient="radial-gradient(circle at 50% 30%, #290f42, #140722)"
                    onClick={() => onNavigate("user-profile")}
                    style={{ left: "22%", top: "5%" }}
                >
                    <User size={30} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
                </BubbleButton>

                {/* ── Ngày nghỉ ── top-right */}
                <BubbleButton
                    label="Ngày nghỉ" size={110}
                    borderColor="rgba(234,88,12,0.5)" bgGradient="radial-gradient(circle at 50% 30%, #3a1100, #1c0800)"
                    onClick={() => onNavigate("user-timeoff")}
                    style={{ right: "22%", top: "5%" }}
                >
                    <span style={{ fontSize: 32, lineHeight: 1 }}>🏖️</span>
                </BubbleButton>

                <BubbleButton
                    label="Công việc" size={110}
                    borderColor="rgba(37,99,235,0.45)" bgGradient="radial-gradient(circle at 50% 30%, #09153d, #04091a)"
                    onClick={() => onNavigate("user-tasks")}
                    style={{ left: "22%", bottom: "5%" }}
                >
                    <CheckSquare size={30} className="text-blue-400/90 group-hover:text-blue-300 transition-colors" />
                </BubbleButton>

                <BubbleButton
                    label="Cài đặt" size={110}
                    borderColor="rgba(100,100,100,0.4)" bgGradient="radial-gradient(circle at 50% 30%, #1a1a1a, #0a0a0a)"
                    onClick={() => onNavigate("user-settings")}
                    style={{ right: "22%", bottom: "5%" }}
                >
                    <Settings size={30} className="text-gray-400/90 group-hover:text-gray-300 transition-colors" />
                </BubbleButton>

                <BubbleButton
                    label="Chat" size={90}
                    borderColor="rgba(16,185,129,0.4)" bgGradient="radial-gradient(circle at 50% 30%, #063825, #02140d)"
                    onClick={() => onNavigate("user-chat")}
                    style={{ right: "6%", top: "50%", transform: "translateY(-50%)" }}
                >
                    <MessageCircle size={24} className="text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                </BubbleButton>
            </div>

            {/* ── Bottom hint ── */}
            <p className="relative z-10 text-white/18 text-[10px] tracking-[0.4em] uppercase font-medium"
                style={{ marginTop: "clamp(16px, 3vh, 32px)" }}>
                Nhấp vào bong bóng để mở
            </p>

            {/* ── DUDI badge ── */}
            <div className="absolute bottom-4 right-4 z-20">
                <div className="w-10 h-10 bg-[#C62828] rounded-full flex flex-col items-center justify-center shadow-lg shadow-red-900/40">
                    <span className="text-white text-[9px] font-black leading-none">D</span>
                    <span className="text-white/50 text-[7px] font-bold">S</span>
                </div>
            </div>

            {/* ── User greeting (top-left) ── */}
            <div className="absolute top-3 left-4 z-20 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white text-xs font-black">
                    {me.name.split(" ").pop()?.charAt(0)}
                </div>
                <div>
                    <p className="text-white/80 text-xs font-semibold leading-none">{me.name.split(" ").slice(-2).join(" ")}</p>
                    <p className="text-white/35 text-[10px] font-mono mt-0.5">{me.id} · {me.position}</p>
                </div>
            </div>
        </div>
    )
}
