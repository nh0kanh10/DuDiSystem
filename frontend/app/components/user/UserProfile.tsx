import React, { useState } from "react"
import { User, Mail, Phone, Building2, Briefcase, Calendar, FileText, Clock, ChevronRight } from "lucide-react"
import { ME } from "./types"

const WORK_HISTORY = [
    { from: "05/2026", to: "Nay", title: "Senior Developer - DUDI Software (Frontend Team)" },
    { from: "08/2023", to: "04/2026", title: "Developer - TechViet Solutions (Web Department)" },
    { from: "06/2022", to: "07/2023", title: "Junior Developer - StartUp ABC" },
]

const CONTRACT_INFO = {
    type: "Hợp đồng lao động không xác định thời hạn",
    signDate: "28/05/2026",
    salary: "Thỏa thuận",
    probation: "Đã qua thử việc",
    insurance: "Đã tham gia BHXH, BHYT, BHTN",
}

export default function UserProfile() {
    const [tab, setTab] = useState<"info" | "contact" | "hr" | "contract" | "history">("info")

    const TABS = [
        { k: "info", l: "Cá nhân" },
        { k: "contact", l: "Liên hệ" },
        { k: "hr", l: "Nhân sự" },
        { k: "contract", l: "Hợp đồng" },
        { k: "history", l: "Công tác" },
    ] as const

    return (
        <div className="space-y-5 max-w-3xl mx-auto">
            {/* Profile hero */}
            <div className="bg-gradient-to-br from-[#C62828] to-[#E64A19] rounded-2xl p-6 text-white flex items-center gap-5 shadow-lg shadow-red-900/20">
                <div className="w-20 h-20 rounded-2xl bg-white/15 border-2 border-white/20 flex items-center justify-center text-4xl font-black flex-shrink-0">
                    {ME.name.split(" ").pop()?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold">{ME.name}</h2>
                    <p className="text-white/75 mt-0.5">{ME.position} · {ME.department}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <span className="bg-white/15 text-white/90 text-xs font-bold px-3 py-1 rounded-full">{ME.id}</span>
                        <span className="bg-white/15 text-white/90 text-xs font-bold px-3 py-1 rounded-full">
                            {ME.status === "active" ? "✓ Đang làm việc" : ME.status === "intern" ? "Thực tập" : "Nghỉ việc"}
                        </span>
                        <span className="bg-white/15 text-white/90 text-xs font-bold px-3 py-1 rounded-full">{ME.contractType}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                <div className="flex border-b border-gray-100 overflow-x-auto">
                    {TABS.map(t => (
                        <button key={t.k} onClick={() => setTab(t.k as typeof tab)}
                            className={`flex-1 min-w-max px-4 py-3 text-sm font-semibold transition-all ${tab === t.k
                                    ? "text-[#C62828] border-b-2 border-[#C62828] bg-red-50/50"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                }`}>
                            {t.l}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {tab === "info" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {[
                                ["Họ và tên", ME.name],
                                ["Ngày sinh", "15/08/2000"],
                                ["Giới tính", "Nữ"],
                                ["Số CCCD", "012345678901"],
                                ["Ngày cấp CCCD", "20/08/2020"],
                                ["Nơi cấp CCCD", "Cục CS ĐKQL cư trú và DLQG về dân cư"],
                            ].map(([k, v]) => (
                                <InfoRow key={k} label={k} value={v} />
                            ))}
                        </div>
                    )}

                    {tab === "contact" && (
                        <div className="space-y-4">
                            {[
                                ["Email công ty", ME.email, <Mail size={16} className="text-[#C62828]" />],
                                ["Số điện thoại", ME.phone, <Phone size={16} className="text-[#C62828]" />],
                                ["Địa chỉ hiện tại", "123 Đường ABC, Quận 1, TP.HCM", <Building2 size={16} className="text-[#C62828]" />],
                                ["Địa chỉ thường trú", "456 Đường XYZ, Quận Bình Thạnh, TP.HCM", <Building2 size={16} className="text-[#C62828]" />],
                            ].map(([k, v, icon]) => (
                                <div key={k as string} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">{icon}</div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium mb-0.5">{k as string}</p>
                                        <p className="text-sm font-semibold text-gray-700">{v as string}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === "hr" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {[
                                ["Phòng ban", ME.department],
                                ["Chức vụ", ME.position],
                                ["Ngày vào làm", ME.joinDate],
                                ["Loại hợp đồng", ME.contractType],
                                ["Tài khoản ngân hàng", "0123456789"],
                                ["Ngân hàng", "Vietcombank (VCB)"],
                                ["Số bảo hiểm XH", "0100123456789"],
                            ].map(([k, v]) => (
                                <InfoRow key={k} label={k} value={v} />
                            ))}
                        </div>
                    )}

                    {tab === "contract" && (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3">
                                <FileText size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-green-800 text-sm">{CONTRACT_INFO.type}</p>
                                    <p className="text-green-600 text-xs mt-1">Ký ngày: {CONTRACT_INFO.signDate}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    ["Mức lương", CONTRACT_INFO.salary],
                                    ["Thử việc", CONTRACT_INFO.probation],
                                    ["Bảo hiểm", CONTRACT_INFO.insurance],
                                    ["Lịch làm việc", "Thứ 2 - Thứ 6, 08:00 - 17:00"],
                                ].map(([k, v]) => (
                                    <InfoRow key={k} label={k} value={v} />
                                ))}
                            </div>
                        </div>
                    )}

                    {tab === "history" && (
                        <div className="relative pl-5">
                            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-100" />
                            {WORK_HISTORY.map((w, i) => (
                                <div key={i} className="relative mb-6 last:mb-0">
                                    <div className="absolute -left-3.5 top-1 w-3 h-3 rounded-full bg-[#C62828] border-2 border-white" />
                                    <div className="bg-gray-50 rounded-xl p-4 ml-2">
                                        <p className="font-bold text-gray-800 text-sm">{w.title}</p>
                                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400 font-medium">
                                            <Clock size={11} />
                                            <span>{w.from} → {w.to}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-medium mb-1">{label}</span>
            <span className="text-sm font-semibold text-gray-700">{value}</span>
        </div>
    )
}
