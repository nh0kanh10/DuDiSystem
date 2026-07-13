import React from "react"
import {
    Phone,
    Mail,
    Calendar,
    MapPin,
    Building2,
    User,
    CreditCard,
    GraduationCap,
    FileText,
    Clock,
    Printer,
    Pencil,
    X,
} from "lucide-react"
import { Employee } from "../../types"

function InfoField({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string;
    icon?: React.ElementType;
}) {
    return (
        <div className="py-3 border-b border-gray-100 last:border-0 group">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-gray-400 mb-0.5">
                {Icon && <Icon size={10} strokeWidth={2.5} />}
                {label}
            </span>
            <span
                className="text-sm font-medium text-gray-800"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
                {value}
            </span>
        </div>
    );
}

export default function UserProfile({ emp, onEdit, onClose }: { emp: Employee; onEdit?: () => void; onClose?: () => void }) {
    const safeStr = (v: any) => v || "---";

    return (
        <div className="w-full max-w-5xl relative mx-auto">
            <div
                className="rounded-3xl overflow-hidden shadow-2xl bg-white"
                style={{ boxShadow: "0 40px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(220,38,38,0.1)" }}
            >
                <div
                    className="h-1"
                    style={{
                        background: "linear-gradient(90deg, #dc2626 0%, #f87171 50%, #dc2626 100%)",
                    }}
                />

                <div className="flex flex-col sm:flex-row">
                    <div
                        className="sm:w-72 flex-shrink-0 flex flex-col items-center p-8 relative overflow-hidden"
                        style={{
                            background:
                                "linear-gradient(160deg, #dc2626 0%, #991b1b 40%, #7f1d1d 100%)",
                        }}
                    >
                        <div
                            className="absolute -top-12 -right-12 w-48 h-48 rounded-full"
                            style={{ background: "rgba(255,255,255,0.06)" }}
                        />
                        <div
                            className="absolute top-32 -left-10 w-32 h-32 rounded-full"
                            style={{ background: "rgba(255,255,255,0.04)" }}
                        />
                        <div
                            className="absolute -bottom-20 -right-8 w-56 h-56 rounded-full"
                            style={{ background: "rgba(0,0,0,0.15)" }}
                        />
                        <div
                            className="absolute inset-0 opacity-5"
                            style={{
                                backgroundImage:
                                    "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 11px)",
                            }}
                        />

                        <div className="self-start relative z-10 mb-6">
                            <span
                                className="text-[10px] font-bold tracking-[0.3em] uppercase text-red-200 opacity-80"
                                style={{ fontFamily: "'Oswald', sans-serif" }}
                            >
                                DUDI Corp
                            </span>
                        </div>

                        <div className="relative z-10 mb-5">
                            <div
                                className="w-28 h-28 rounded-2xl flex items-center justify-center overflow-hidden"
                                style={{
                                    background: "rgba(255,255,255,0.15)",
                                    border: "2px solid rgba(255,255,255,0.25)",
                                    backdropFilter: "blur(8px)",
                                }}
                            >
                                {emp.avatar ? (
                                    <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                                ) : emp.name ? (
                                    <span className="text-5xl font-bold text-white opacity-90">{emp.name.split(" ").pop()?.charAt(0)}</span>
                                ) : (
                                    <User size={52} strokeWidth={1.5} className="text-white opacity-80" />
                                )}
                            </div>
                            <div
                                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                                style={{
                                    background: "#22c55e",
                                    border: "2.5px solid #991b1b",
                                    boxShadow: "0 0 10px rgba(34,197,94,0.5)",
                                }}
                            >
                                <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            </div>
                        </div>

                        <h1
                            className="text-white text-xl font-bold text-center leading-snug relative z-10"
                            style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "0.02em" }}
                        >
                            {emp.name}
                        </h1>
                        <p className="text-red-200 text-sm mt-1 font-medium relative z-10 text-center">
                            {emp.position}
                        </p>

                        <div className="w-full h-px my-6 relative z-10" style={{ background: "rgba(255,255,255,0.2)" }} />

                        <div
                            className="w-full relative z-10 rounded-xl p-5"
                            style={{
                                background: "rgba(0,0,0,0.25)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                backdropFilter: "blur(8px)",
                            }}
                        >
                            <div className="text-center mb-4">
                                <span className="text-[10px] text-red-300 font-semibold tracking-[0.2em] uppercase">
                                    Mã Nhân Viên
                                </span>
                                <p
                                    className="text-white text-3xl font-bold tracking-widest mt-1"
                                    style={{ fontFamily: "'Oswald', sans-serif" }}
                                >
                                    {emp.id}
                                </p>
                            </div>

                            <div className="space-y-2.5">
                                {[
                                    { label: "Phòng ban", value: emp.department },
                                    { label: "Hợp đồng", value: emp.contractType },
                                    { label: "Ngày bắt đầu", value: safeStr(emp.joinDate) },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between items-center text-left gap-2 border-b border-white/5 pb-1 last:border-0 last:pb-0">
                                        <span className="text-[11px] text-red-300 font-medium whitespace-nowrap">{label}</span>
                                        <span className="text-[11px] text-white font-bold text-right truncate">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-5 relative z-10">
                            <span
                                className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full"
                                style={{
                                    background: "rgba(34,197,94,0.15)",
                                    border: "1px solid rgba(34,197,94,0.3)",
                                    color: "#86efac",
                                }}
                            >
                                <span className="w-2 h-2 rounded-full bg-green-400" />
                                {emp.status === "active" ? "Đang làm" : emp.status === "suspended" ? "Tạm nghỉ" : "Nghỉ việc"}
                                {emp.contractType === "intern" && <span className="ml-1 text-yellow-300">(TT)</span>}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col bg-white">
                        <div className="px-8 py-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-gray-100">
                            <div>
                                <h2
                                    className="text-2xl font-bold text-gray-900"
                                    style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "0.03em" }}
                                >
                                    Thông tin nhân sự
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5 font-medium tracking-wide">
                                    Hồ sơ nhân viên chi tiết · {emp.id}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100">
                                    <Printer size={13} />
                                    In hồ sơ
                                </button>
                                {onEdit && (
                                    <button
                                        onClick={onEdit}
                                        className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-95"
                                        style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)" }}
                                    >
                                        <Pencil size={13} />
                                        Chỉnh sửa
                                    </button>
                                )}
                                {onClose && (
                                    <button
                                        onClick={onClose}
                                        className="w-7 h-7 ml-1 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="px-8 py-5 flex-1 overflow-y-auto max-h-[70vh]">
                            <div className="mb-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: "#dc2626" }}>
                                        Thông tin cá nhân
                                    </span>
                                    <div className="flex-1 h-px bg-red-100" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
                                    <InfoField label="Ngày sinh" value={safeStr(emp.dob)} icon={Calendar} />
                                    <InfoField label="Số điện thoại" value={safeStr(emp.phone)} icon={Phone} />
                                    <InfoField label="Giới tính" value={safeStr(emp.gender)} icon={User} />
                                    <InfoField label="Email" value={safeStr(emp.email)} icon={Mail} />
                                    <InfoField label="Số CCCD" value={safeStr(emp.cccd)} icon={CreditCard} />
                                    <InfoField label="Trường ĐH" value={safeStr(emp.university)} icon={GraduationCap} />
                                    <InfoField label="Ngày cấp CCCD" value={safeStr(emp.cccdDate)} icon={Calendar} />
                                    <InfoField label="Ghi chú" value={safeStr(emp.notes)} icon={FileText} />
                                    <InfoField label="Nơi cấp CCCD" value={safeStr(emp.cccdPlace)} icon={MapPin} />
                                    <InfoField label="Số tài khoản" value={safeStr(emp.bankAccount)} icon={CreditCard} />
                                    <InfoField label="Ngân hàng" value={safeStr(emp.bank)} icon={Building2} />
                                </div>
                            </div>

                            <div className="mt-4 mb-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: "#dc2626" }}>
                                        Thông tin công việc
                                    </span>
                                    <div className="flex-1 h-px bg-red-100" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
                                    <InfoField label="Ngày kết thúc TT" value={safeStr(emp.internEndDate)} icon={Calendar} />
                                    <InfoField label="Loại hợp đồng" value={safeStr(emp.contractType)} icon={FileText} />
                                    <InfoField label="Ngày nghỉ việc" value={safeStr(emp.resignDate)} icon={Clock} />
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: "#dc2626" }}>
                                        Địa chỉ
                                    </span>
                                    <div className="flex-1 h-px bg-red-100" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
                                    <InfoField
                                        label="Địa chỉ hiện tại"
                                        value={emp.curStreet ? [emp.curStreet, emp.curWard, emp.curDistrict, emp.curProvince].filter(Boolean).join(", ") : "---"}
                                        icon={MapPin}
                                    />
                                    <InfoField
                                        label="Quê quán"
                                        value={emp.homeStreet ? [emp.homeStreet, emp.homeWard, emp.homeDistrict, emp.homeProvince].filter(Boolean).join(", ") : "---"}
                                        icon={MapPin}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: "#dc2626" }} />
                                <span className="text-[11px] text-gray-400 font-medium">
                                    Cập nhật lần cuối: {safeStr(emp.joinDate)}
                                </span>
                            </div>
                            <span className="text-[11px] text-gray-300 font-medium">
                                DUDI HR System · v2.4
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
