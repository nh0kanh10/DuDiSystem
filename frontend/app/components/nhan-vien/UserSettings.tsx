import React, { useState } from "react"
import { Camera, Lock, Shield, LogOut, Trash2, Check, Eye, EyeOff } from "lucide-react"
import { getStoredUser } from "./types"
import { api } from "@/lib/api"

interface Props { onLogout: () => void }

const LOGIN_HISTORY = [
    { time: "26/06/2026 11:09", ip: "192.168.1.101", device: "Chrome / Windows", status: "success" },
    { time: "25/06/2026 08:02", ip: "192.168.1.101", device: "Chrome / Windows", status: "success" },
    { time: "24/06/2026 07:55", ip: "192.168.1.55", device: "Safari / iPhone", status: "success" },
    { time: "23/06/2026 09:10", ip: "203.0.113.5", device: "Unknown Browser", status: "failed" },
]

const SESSIONS = [
    { device: "Chrome / Windows", ip: "192.168.1.101", time: "Hôm nay 11:09 (phiên hiện tại)", current: true },
    { device: "Safari / iPhone", ip: "192.168.1.55", time: "Hôm qua 18:30", current: false },
]

export default function UserSettings({ onLogout }: Props) {
    const me = getStoredUser()
    const [tab, setTab] = useState<"info" | "password" | "session">("info")
    const [oldPass, setOldPass] = useState("")
    const [newPass, setNewPass] = useState("")
    const [confirmPass, setConfirmPass] = useState("")
    const [showOld, setShowOld] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
    const [name, setName] = useState(me.name)
    const [phone, setPhone] = useState(me.phone)

    const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 focus:ring-1 focus:ring-[#C62828]/10"

    const handleChangePass = async () => {
        if (!oldPass || !newPass || !confirmPass) {
            setMsg({ type: "err", text: "Vui lòng điền đầy đủ thông tin." }); return
        }
        if (newPass.length < 6) {
            setMsg({ type: "err", text: "Mật khẩu mới phải ít nhất 6 ký tự." }); return
        }
        if (newPass === oldPass) {
            setMsg({ type: "err", text: "Mật khẩu mới không được trùng với mật khẩu cũ." }); return
        }
        if (newPass !== confirmPass) {
            setMsg({ type: "err", text: "Mật khẩu xác nhận không khớp." }); return
        }
        try {
            await api.auth.changePassword(oldPass, newPass)
            setMsg({ type: "ok", text: "Đổi mật khẩu thành công!" })
            setOldPass(""); setNewPass(""); setConfirmPass("")
            setTimeout(() => setMsg(null), 3000)
        } catch (err: any) {
            setMsg({ type: "err", text: err.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ." })
        }
    }

    const handleSaveInfo = () => {
        setMsg({ type: "ok", text: "Cập nhật thông tin thành công!" })
        setTimeout(() => setMsg(null), 3000)
    }

    return (
        <div className="space-y-5 max-w-2xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-xl font-bold text-gray-800">Cài đặt tài khoản</h2>
                <button onClick={onLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
                    <LogOut size={15} /> Đăng xuất
                </button>
            </div>

            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-sm">
                {([["info", "Thông tin"], ["password", "Mật khẩu"], ["session", "Phiên đăng nhập"]] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all
              ${tab === k ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
                        {l}
                    </button>
                ))}
            </div>
            {msg && (
                <div className={`p-3.5 rounded-xl text-sm font-bold flex items-center gap-2 border ${msg.type === "ok" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                    {msg.text}
                </div>
            )}

            {tab === "info" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 flex flex-col items-center gap-4">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white text-3xl font-black shadow-md shadow-red-900/20">
                            {me.name.split(" ").pop()?.charAt(0)}
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-gray-800">{me.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{me.id} · {me.position}</p>
                        </div>
                        <div className="flex gap-2 w-full">
                            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                <Camera size={13} /> Tải ảnh
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-red-100 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-50 transition-colors">
                                <Trash2 size={13} /> Xoá
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 text-center">JPG, PNG tối đa 2MB. Tỷ lệ 1:1 tốt nhất.</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 space-y-4">
                        <h3 className="font-bold text-gray-700">Cập nhật thông tin</h3>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Họ và tên</label>
                            <input value={name} onChange={e => setName(e.target.value)} className={inp} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Email công ty</label>
                            <input value={me.email} disabled className={`${inp} bg-gray-50 opacity-60`} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Số điện thoại</label>
                            <input value={phone} onChange={e => setPhone(e.target.value)} className={inp} />
                        </div>
                        <button onClick={handleSaveInfo}
                            className="w-full bg-[#C62828] text-white py-2.5 rounded-xl font-bold hover:bg-[#B71C1C] text-sm transition-colors flex items-center justify-center gap-2">
                            <Check size={15} /> Lưu thay đổi
                        </button>
                    </div>
                </div>
            )}

            {tab === "password" && (
                <div className="bg-white max-w-md rounded-2xl p-6 shadow-sm border border-black/5 space-y-4">
                    <h3 className="font-bold text-gray-700">Đổi mật khẩu</h3>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1.5 block">Mật khẩu hiện tại</label>
                        <div className="relative">
                            <input type={showOld ? "text" : "password"} value={oldPass} onChange={e => setOldPass(e.target.value)} placeholder="••••••••" className={`${inp} pr-10`} autoComplete="current-password" />
                            <button type="button" onClick={() => setShowOld(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1.5 block">Mật khẩu mới</label>
                        <div className="relative">
                            <input type={showNew ? "text" : "password"} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Ít nhất 6 ký tự" className={`${inp} pr-10`} autoComplete="new-password" />
                            <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1.5 block">Xác nhận mật khẩu mới</label>
                        <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="••••••••" className={inp} autoComplete="new-password" />
                    </div>
                    <button type="button" onClick={handleChangePass}
                        className="w-full bg-[#C62828] text-white py-3 rounded-xl font-bold hover:bg-[#B71C1C] text-sm transition-colors shadow-md shadow-red-900/20 flex items-center justify-center gap-2">
                        <Lock size={15} /> Đổi mật khẩu
                    </button>
                </div>
            )}

            {tab === "session" && (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 text-sm">Phiên đang hoạt động</h3>
                            <button className="text-xs text-red-500 font-bold hover:underline">Đăng xuất tất cả</button>
                        </div>
                        {SESSIONS.map((s, i) => (
                            <div key={i} className="px-6 py-4 flex items-center justify-between border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Shield size={18} className="text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">{s.device}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{s.ip} · {s.time}</p>
                                    </div>
                                    {s.current && (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Hiện tại</span>
                                    )}
                                </div>
                                {!s.current && (
                                    <button className="text-xs text-red-500 font-semibold hover:underline">Thu hồi</button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50"><h3 className="font-bold text-gray-700 text-sm">Lịch sử đăng nhập</h3></div>
                        {LOGIN_HISTORY.map((h, i) => (
                            <div key={i} className="px-6 py-3.5 flex items-center justify-between border-b border-gray-50 last:border-0">
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">{h.device}</p>
                                    <p className="text-xs text-gray-400">{h.ip} · {h.time}</p>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold
                  ${h.status === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                    {h.status === "success" ? "Thành công" : "Thất bại"}
                                </span>
                            </div>
                        ))}
                    </div>

                    <button onClick={onLogout}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-md text-sm">
                        <LogOut size={16} /> Đăng xuất khỏi hệ thống
                    </button>
                </div>
            )}
        </div>
    )
}
