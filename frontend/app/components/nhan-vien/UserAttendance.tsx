import React, { useEffect, useState } from "react"
import { Fingerprint, CheckCircle, Clock, AlertCircle, Calendar, Loader2, RefreshCw, Wifi, XCircle, ChevronRight, ChevronLeft, BarChart3, CornerDownRight, CornerUpLeft } from "lucide-react"
import { useEmployeeAttendance, todayISO } from "../../hooks/useEmployeeAttendance"
import { fmtIsoDate, weekdayFromIso, formatAttendanceTimes, ATT_STATUS_LABEL, ATT_STATUS_STYLE } from "../cham-cong/attendanceDisplay"
import { EMPLOYEE_KIND, INTERN_SESSION, internSessionRange } from "../cham-cong/attendanceModel"
import { Modal, ModalCancelButton, ModalSubmitButton } from "../ui/Modal"

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  "on-time": { label: "Đúng giờ", color: "text-[#10B981]", bg: "bg-[#F0FDF4] border border-[#BBF7D0]" },
  late: { label: "Đi trễ", color: "text-[#F59E0B]", bg: "bg-[#FFFCEB] border border-[#FDE68A]" },
  early: { label: "Về sớm", color: "text-[#F59E0B]", bg: "bg-[#FFFCEB] border border-[#FDE68A]" },
  late_early: { label: "Vào trễ, ra sớm", color: "text-[#F59E0B]", bg: "bg-[#FFFCEB] border border-[#FDE68A]" },
  absent: { label: "Vắng mặt", color: "text-[#EF4444]", bg: "bg-[#FEF2F2] border border-[#FECACA]" },
  leave: { label: "Nghỉ phép", color: "text-[#10B981]", bg: "bg-[#F0FDF4] border border-[#BBF7D0]" },
}

const PORTAL_BRAND = "#E8231A"
const PORTAL_GOLD = "#FF8800"
const PORTAL_GR = "rgba(232,35,26,0.18)"

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { label: ATT_STATUS_LABEL[status] ?? status, color: "text-gray-600", bg: "bg-gray-100" }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.color}`}>
      {s.label}
    </span>
  )
}

function InternSessionStatusBadges({ statusAm, statusPm }: { statusAm?: string; statusPm?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {([["S", statusAm], ["C", statusPm]] as const).map(([label, status]) => {
        const s = ATT_STATUS_STYLE[status ?? "absent"] ?? ATT_STATUS_STYLE.absent
        return (
          <span key={label} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${s.bg} ${s.text}`}>
            <span className="text-gray-500 font-black">{label}:</span>
            {s.label}
          </span>
        )
      })}
    </div>
  )
}

function PortalSectionLabel({ children }: { children: string }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 850, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8b5f64", marginBottom: 14 }}>
      {children}
    </p>
  )
}

function WifiStatusBanner({ ipStatus, checking }: { ipStatus: { valid: boolean; ip: string; message: string } | null; checking?: boolean }) {
  if (checking && !ipStatus) {
    return (
      <p style={{ fontSize: 12, color: "#7f5f63", textAlign: "center" }}>Đang kiểm tra WiFi...</p>
    )
  }
  if (!ipStatus) return null
  if (ipStatus.valid) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "10px 14px", borderRadius: 12, width: "100%", maxWidth: 360,
        background: "#f0fdf4", border: "1px solid #bbf7d0",
        color: "#166534", fontSize: 13, fontWeight: 750,
      }}>
        <span>Đúng WiFi công ty</span>
      </div>
    )
  }
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 8,
      padding: "10px 14px", borderRadius: 12, width: "100%", maxWidth: 360,
      background: "#fef2f2", border: "1px solid #fecaca",
      color: "#b91c1c", fontSize: 13, fontWeight: 750, textAlign: "center",
    }}>
      <span>Vui lòng kết nối wifi công ty để chấm công.</span>
    </div>
  )
}

function WifiStatusBannerLight({ ipStatus, checking }: { ipStatus: { valid: boolean; ip: string; message: string } | null; checking?: boolean }) {
  if (checking && !ipStatus) {
    return <p className="text-xs text-gray-400 text-center">Đang kiểm tra WiFi...</p>
  }
  if (!ipStatus) return null
  if (ipStatus.valid) {
    return (
      <div className="flex items-center justify-center gap-2 mb-1">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-[#10B981] text-xs font-bold border border-green-100 shadow-sm">
          <Wifi size={13} className="shrink-0" />
          <span>Đúng WiFi công ty</span>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center gap-2 mb-1">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-[#EF4444] text-xs font-bold border border-red-100 shadow-sm">
        <Wifi size={13} className="shrink-0" />
        <span>Vui lòng kết nối wifi công ty để chấm công</span>
      </div>
    </div>
  )
}

function PortalAttendanceView() {
  const {
    isIntern, todayRecord, history, monthStats,
    loading, punching, error, ipStatus, verifyWifi, punch, punchLabel, statusText, reload,
  } = useEmployeeAttendance()
  const [hms, setHms] = useState({ h: "00", m: "00", s: "00" })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isSuperAdmin = React.useMemo(() => {
    try {
      const raw = localStorage.getItem("dudi_user")
      const u = raw ? JSON.parse(raw) : null
      return u?.roleId === "role-super-admin" || ["0000000000", "1111111111", "2222222222"].includes(u?.employeeId)
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    const tick = () => {
      const n = new Date()
      setHms({ h: String(n.getHours()).padStart(2, "0"), m: String(n.getMinutes()).padStart(2, "0"), s: String(n.getSeconds()).padStart(2, "0") })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const working = !punchLabel.done && statusText === "Đang làm việc"
  const todayKey = todayISO()
  const statusColor = (status: string) => {
    if (status === "on-time") return { c: "#22c55e", bg: "rgba(34,197,94,0.15)" }
    if (status === "late" || status === "early" || status === "late_early") return { c: "#f59e0b", bg: "rgba(245,158,11,0.15)" }
    if (status === "absent") return { c: "#ff5555", bg: "rgba(255,85,85,0.15)" }
    if (status === "leave") return { c: "#a78bfa", bg: "rgba(167,139,250,0.15)" }
    return { c: "#6f565a", bg: "#f3eeee" }
  }
  const kpis = [
    { l: "Đúng giờ", v: monthStats.onTime, c: "#22c55e", g: "rgba(34,197,94,0.22)" },
    { l: "Trễ / sớm", v: monthStats.late, c: "#f59e0b", g: "rgba(245,158,11,0.22)" },
    { l: "Vắng / nghỉ", v: monthStats.absent + monthStats.leave, c: "#ff5555", g: "rgba(255,85,85,0.22)" },
  ]

  const handlePunchWithConfirm = () => setConfirmOpen(true)

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      {error && (
        <p style={{ fontSize: 12, color: "#ff8888", textAlign: "center", maxWidth: 320 }}>{error}</p>
      )}
      {isSuperAdmin ? (
        <div style={{
          padding: "10px 14px", borderRadius: 12, width: "100%", maxWidth: 360,
          background: "#ffffff", border: "1px solid #efd7da",
          color: "#6f565a", fontSize: 13, fontWeight: 750, textAlign: "center",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6
        }}>
          <span>Tài khoản Quản trị hệ thống không cần chấm công</span>
        </div>
      ) : (
        <WifiStatusBanner ipStatus={ipStatus} checking={loading && !ipStatus} />
      )}
      <p style={{ fontSize: 13, fontWeight: 750, color: "#7f5f63", letterSpacing: "0.04em" }}>
        {isIntern ? `${EMPLOYEE_KIND.intern.label} · theo buổi` : `${EMPLOYEE_KIND.staff.label} · theo ngày`} · {isSuperAdmin ? "Miễn chấm công" : statusText}
      </p>

      <div style={{ display: "flex", alignItems: "baseline", gap: "0.04em", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, lineHeight: 1 }}>
        <span style={{ fontSize: 56, color: PORTAL_BRAND, textShadow: `0 8px 22px ${PORTAL_GR}` }}>{hms.h}</span>
        <span style={{ fontSize: 48, color: PORTAL_BRAND, opacity: 0.3, animation: "colon-blink 1s step-end infinite" }}>:</span>
        <span style={{ fontSize: 56, color: PORTAL_BRAND, textShadow: `0 8px 22px ${PORTAL_GR}` }}>{hms.m}</span>
        <span style={{ fontSize: 18, color: "#8b6b70", marginLeft: 6, alignSelf: "flex-start", marginTop: 6 }}>{hms.s}</span>
      </div>

      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {!working && !punchLabel.done && !isSuperAdmin && (
          <>
            <div style={{ position: "absolute", width: 136, height: 136, borderRadius: "50%", border: `1.5px solid ${PORTAL_BRAND}`, animation: "pulseRing 2.2s ease-out infinite", pointerEvents: "none" }} />
            <div style={{ position: "absolute", width: 136, height: 136, borderRadius: "50%", border: `1px solid ${PORTAL_BRAND}`, animation: "pulseRing 2.2s ease-out 0.75s infinite", pointerEvents: "none" }} />
          </>
        )}
        <button
          onClick={isSuperAdmin ? undefined : handlePunchWithConfirm}
          disabled={loading || punching || punchLabel.done || isSuperAdmin || (!!ipStatus && !ipStatus.valid)}
          style={{
            width: 112, height: 112, borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
            border: "none", cursor: (punchLabel.done || isSuperAdmin) ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 900, color: "#fff", opacity: (punchLabel.done || isSuperAdmin) ? 0.5 : 1,
            background: isSuperAdmin ? "#d6c6c9" : working ? "linear-gradient(135deg, #22c55e, #16a34a)" : `linear-gradient(135deg, ${PORTAL_BRAND}, #B91C1C)`,
            boxShadow: isSuperAdmin ? "none" : working ? "0 18px 36px rgba(34,197,94,0.22)" : `0 18px 42px ${PORTAL_GR}`,
          }}
        >
          <span style={{ fontSize: 13, letterSpacing: "0.08em", textAlign: "center", padding: "0 10px", color: isSuperAdmin ? "#7f5f63" : undefined }}>
            {punching ? "ĐANG GHI" : isSuperAdmin ? "KHÓA" : punchLabel.label.toUpperCase()}
          </span>
        </button>
      </div>

      {todayRecord && (
        <div style={{ fontSize: 12, color: "#6f565a", textAlign: "center", fontFamily: "monospace", lineHeight: 1.6 }}>
          {isIntern ? (
            <>
              <div>{internSessionRange(todayRecord, "am")}</div>
              <div>{internSessionRange(todayRecord, "pm")}</div>
              {todayRecord.autoFilled && <div style={{ color: "#fbbf24", marginTop: 4 }}>Làm cả ngày — tự ghi giờ trưa</div>}
            </>
          ) : (
            <div>{todayRecord.checkIn ?? "--"} → {todayRecord.checkOut ?? "--"} · {todayRecord.workingHours ?? "--"}</div>
          )}
        </div>
      )}

      <p style={{ fontSize: 13, color: "#7f5f63" }}>
        {punchLabel.done ? "Đã hoàn thành chấm công hôm nay" : working ? "Bấm khi tan ca" : "Bấm khi bắt đầu làm"}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, width: "100%" }}>
        {kpis.map(({ l, v, c, g }) => (
          <div key={l} style={{ background: "#ffffff", border: "1px solid #efd7da", borderRadius: 16, padding: "14px 12px", textAlign: "center", boxShadow: `0 12px 28px ${g}` }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: c, lineHeight: 1 }}>{loading ? "—" : v}</div>
            <div style={{ fontSize: 12, fontWeight: 750, color: "#7f5f63", marginTop: 5 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ width: "100%", background: "#ffffff", border: "1px solid #efd7da", borderRadius: 16, padding: "14px 16px", boxShadow: "0 14px 36px rgba(95,15,22,0.07)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <PortalSectionLabel>Lịch sử gần đây</PortalSectionLabel>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={verifyWifi} style={{ background: "none", border: "none", cursor: "pointer", color: "#7a1d22", fontSize: 12, fontWeight: 850 }} title="Kiểm tra WiFi">
              WiFi
            </button>
            <button onClick={reload} style={{ background: "none", border: "none", cursor: "pointer", color: "#7a1d22", fontSize: 12, fontWeight: 850 }}>
              Tải lại
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.length === 0 && !loading && (
            <p style={{ fontSize: 13, color: "#7f5f63", textAlign: "center", padding: 12 }}>Chưa có lịch sử chấm công</p>
          )}
          {history.slice(0, 10).map((item) => {
            const t = formatAttendanceTimes(item)
            const isToday = item.date === todayKey
            const st = statusColor(item.status)
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid rgba(36,20,22,0.08)" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#241416" }}>{fmtIsoDate(item.date)}</p>
                    {isToday && (
                      <span style={{ fontSize: 9, fontWeight: 800, color: PORTAL_BRAND, padding: "2px 6px", background: "rgba(232,35,26,0.15)", borderRadius: 6 }}>HÔM NAY</span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: "#8b6b70", marginTop: 2 }}>{weekdayFromIso(item.date)}</p>
                  <p style={{ fontSize: 12, color: "#6f565a", marginTop: 4, fontFamily: "monospace" }}>
                    {isIntern ? `${t.primary} | ${t.secondary}` : t.combined}
                  </p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: st.c, padding: "3px 8px", background: st.bg, borderRadius: 8 }}>
                  {ATT_STATUS_LABEL[item.status] ?? item.workingHours ?? item.status}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận chấm công"
        icon={AlertCircle}
        width="sm"
        bodyClassName="px-6 py-5"
        footer={
          <>
            <ModalCancelButton onClick={() => setConfirmOpen(false)} />
            <ModalSubmitButton
              onClick={() => {
                setConfirmOpen(false)
                punch()
              }}
              label="Xác nhận"
            />
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Bạn có chắc muốn thực hiện <span className="font-bold text-[#C62828]">{punchLabel.label}</span> không?
        </p>
      </Modal>
    </div>
  )
}

export default function UserAttendance({ variant = "default" }: { variant?: "default" | "portal" }) {
  if (variant === "portal") return <PortalAttendanceView />

  const {
    isIntern,
    todayRecord,
    history,
    monthStats,
    loading,
    punching,
    error,
    ipStatus,
    verifyWifi,
    punch,
    punchLabel,
    statusText,
    reload,
  } = useEmployeeAttendance()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [clock, setClock] = useState({ date: "", h: "00", m: "00", s: "00" })

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setClock({
        date: String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear(),
        h: String(d.getHours()).padStart(2, "0"),
        m: String(d.getMinutes()).padStart(2, "0"),
        s: String(d.getSeconds()).padStart(2, "0")
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  let profileUser: any = {}
  try {
    profileUser = JSON.parse(localStorage.getItem("dudi_user") || "{}")
  } catch { }

  const handlePunchWithConfirm = () => setConfirmOpen(true)

  const working = !punchLabel.done && statusText === "Đang làm việc"
  const monthLabel = new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" })
  const times = todayRecord ? formatAttendanceTimes(todayRecord) : null

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto md:px-4 pb-8">
      {error && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-950/95 border border-red-500/30 text-red-200 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-1.5 h-6 rounded-full bg-red-500 flex-shrink-0" />
          <span className="text-xs font-semibold tracking-wide">{error}</span>
          <button
            onClick={reload}
            className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-bold text-red-400 transition-colors whitespace-nowrap"
          >
            Thử lại
          </button>
        </div>
      )}

      <WifiStatusBannerLight ipStatus={ipStatus} checking={loading && !ipStatus} />

      <div className={`rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-xl transition-all duration-500 border ${punchLabel.done
        ? "bg-[#F9FAFB]/90 dark:bg-white/[0.02] border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
        : working
          ? "bg-[#F9FAFB]/90 dark:bg-white/[0.03] border-gray-100 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_0_30px_rgba(16,185,129,0.05)] dark:hover:shadow-[0_0_40px_rgba(16,185,129,0.12)]"
          : "bg-white/90 dark:bg-white/[0.03] border-gray-100 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_0_30px_rgba(239,68,68,0.05)] dark:hover:shadow-[0_0_40px_rgba(239,68,68,0.12)]"
        }`}>
        <div className="flex-1 min-w-0 w-full">
          <div className="mb-6">
            <h3 className={`text-3xl font-black mb-1 tracking-tight ${punchLabel.done ? "text-[#111827] dark:text-gray-100 dark:drop-shadow-sm opacity-90" : "text-[#111827] dark:text-white dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"}`}>
              {loading ? "Đang tải..." : statusText}
            </h3>
            <p className="text-[#6B7280] dark:text-gray-300 text-sm font-medium uppercase tracking-wider">
              {isIntern ? `${EMPLOYEE_KIND.intern.label} · chấm theo buổi` : `${EMPLOYEE_KIND.staff.label} · chấm theo ngày`}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-sm p-2">
            <div>
              <span className="text-[#EF4444] dark:text-[#EF4444] dark:drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] block text-[11px] uppercase tracking-wider font-bold mb-1">Mã NV</span>
              <span className="font-black text-base text-[#111827] dark:text-white dark:drop-shadow-sm">{profileUser.employeeId || profileUser.id || "--"}</span>
            </div>
            <div className="col-span-2 md:col-span-1">
              <span className="text-[#EF4444] dark:text-[#EF4444] dark:drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] block text-[11px] uppercase tracking-wider font-bold mb-1">Họ và tên</span>
              <span className="font-black text-base truncate block text-[#111827] dark:text-white dark:drop-shadow-sm">{profileUser.name || "--"}</span>
            </div>
            <div>
              <span className="text-[#EF4444] dark:text-[#EF4444] dark:drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] block text-[11px] uppercase tracking-wider font-bold mb-1">Chức vụ</span>
              <span className="font-black text-base text-[#111827] dark:text-white dark:drop-shadow-sm">{profileUser.position || "--"}</span>
            </div>
            <div className="col-span-2 md:col-span-1">
              <span className="text-[#EF4444] dark:text-[#EF4444] dark:drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] block text-[11px] uppercase tracking-wider font-bold mb-1">Phòng ban</span>
              <span className="font-black text-base text-[#111827] dark:text-white dark:drop-shadow-sm">{profileUser.department || "--"}</span>
            </div>
          </div>

          <div className={`mt-6 flex items-center gap-3 text-sm rounded-2xl py-3 px-6 shadow-sm border w-fit ${punchLabel.done
            ? "text-gray-500 bg-gray-50/80 dark:bg-white/10 border-gray-200 dark:border-white/10 dark:text-gray-300"
            : working
              ? "text-[#10B981] bg-green-50/80 dark:bg-green-500/10 border-[#10B981]/30"
              : "text-[#EF4444] bg-red-50/80 dark:bg-red-500/10 border-[#EF4444]/30"
            }`}>
            <div className="flex items-center gap-2">
              <Calendar size={18} strokeWidth={2.5} />
              <span className={`font-bold ${punchLabel.done ? "dark:text-white" : ""}`}>Ngày: {clock.date}</span>
            </div>
            <span className="mx-2 opacity-30">|</span>
            <div className="flex items-center gap-2">
              <Clock size={18} strokeWidth={2.5} />
              <span className={`font-black font-mono tracking-wider ml-0.5 text-[15px] ${!punchLabel.done
                ? (working ? "dark:text-emerald-400 dark:drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" : "dark:text-rose-400 dark:drop-shadow-[0_0_10px_rgba(251,113,133,0.8)]")
                : "dark:text-white"
                }`}>
                Giờ: {clock.h}:{clock.m}:{clock.s}
              </span>
            </div>
          </div>

          {todayRecord && (
            <div className="text-[#6B7280] dark:text-white text-sm mt-5 font-mono space-y-1 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 p-3 rounded-xl w-fit drop-shadow-sm">
              {isIntern ? (
                <>
                  <p className="font-bold">{internSessionRange(todayRecord, "am")}</p>
                  <p className="font-bold">{internSessionRange(todayRecord, "pm")}</p>
                  {todayRecord.autoFilled && (
                    <p className="text-[#F59E0B] text-xs mt-1">Làm cả ngày — hệ thống tự ghi giờ nghỉ trưa</p>
                  )}
                </>
              ) : (
                <p className="font-bold tracking-wide">Vào: {todayRecord.checkIn ?? "--"}{todayRecord.checkOut && todayRecord.checkOut !== "--" ? ` · Ra: ${todayRecord.checkOut}` : ""}</p>
              )}
            </div>
          )}
        </div>

        <div className="relative group shrink-0 w-[180px] h-[180px] flex items-center justify-center">
          {!punchLabel.done && (
            <div className={`absolute inset-4 rounded-full opacity-20 blur-2xl animate-pulse transition-all duration-1000 ${working ? "bg-[#10B981]" : "bg-[#EF4444]"}`}></div>
          )}
          <button
            onClick={handlePunchWithConfirm}
            disabled={loading || punching || punchLabel.done || (!!ipStatus && !ipStatus.valid)}
            className={`relative flex flex-col items-center justify-center gap-4 transition-transform duration-300 outline-none
              ${punchLabel.done ? "opacity-60 cursor-not-allowed text-gray-400 dark:text-gray-500" :
                working ? "text-[#10B981] hover:scale-105 active:scale-95 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" :
                  "text-[#EF4444] hover:scale-105 active:scale-95 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]"} `}
          >
            {punching ? <Loader2 size={80} className="animate-spin" /> : (
              <Fingerprint strokeWidth={1.2} size={110} />
            )}
            <span className={`text-[12px] font-bold tracking-[0.15em] text-center uppercase ${punchLabel.done
              ? "text-gray-500 dark:text-gray-400"
              : working
                ? "text-[#10B981] dark:text-emerald-400 dark:drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]"
                : "text-[#EF4444] dark:text-rose-400 dark:drop-shadow-[0_0_12px_rgba(251,113,133,0.9)]"
              }`}>
              {punchLabel.done ? punchLabel.label : (punchLabel.label === "Check-in" || punchLabel.label === "Check-in Sáng" || punchLabel.label === "Check-in Chiều" ? "CHẠM ĐỂ ĐIỂM DANH" : punchLabel.label)}
            </span>
          </button>
        </div>
      </div >

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Đúng giờ", value: monthStats.onTime, icon: CheckCircle, color: "text-[#10B981] dark:text-emerald-400", hover: "group-hover:text-[#10B981] dark:group-hover:text-emerald-400", glow: "dark:drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]", boxGlow: "dark:shadow-[0_0_15px_rgba(16,185,129,0.05)] dark:hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]" },
          { label: "Đi trễ", value: monthStats.late, icon: AlertCircle, color: "text-[#F59E0B] dark:text-amber-400", hover: "group-hover:text-[#F59E0B] dark:group-hover:text-amber-400", glow: "dark:drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]", boxGlow: "dark:shadow-[0_0_15px_rgba(245,158,11,0.05)] dark:hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]" },
          { label: "Vắng", value: monthStats.absent, icon: Clock, color: "text-[#EF4444] dark:text-rose-400", hover: "group-hover:text-[#EF4444] dark:group-hover:text-rose-400", glow: "dark:drop-shadow-[0_0_10px_rgba(251,113,133,0.8)]", boxGlow: "dark:shadow-[0_0_15px_rgba(239,68,68,0.05)] dark:hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]" },
          { label: "Nghỉ phép", value: monthStats.leave, icon: Calendar, color: "text-[#10B981] dark:text-emerald-400", hover: "group-hover:text-[#10B981] dark:group-hover:text-emerald-400", glow: "dark:drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]", boxGlow: "dark:shadow-[0_0_15px_rgba(16,185,129,0.05)] dark:hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]" },
        ].map(s => (
          <div key={s.label} className={`group bg-white dark:bg-white/[0.03] rounded-[1rem] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 cursor-default border border-gray-50 dark:border-white/10 ${s.boxGlow}`}>
            <p className={`text-4xl justify-between items-end flex font-black ${s.color} ${s.glow}`}>
              {loading ? "—" : s.value}
              <s.icon size={22} className={`opacity-40 transition-opacity ${s.hover} group-hover:opacity-100 mb-1`} />
            </p>
            <p className="text-sm font-bold text-[#6B7280] dark:text-gray-300 mt-2 dark:group-hover:text-white transition-colors dark:group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden mt-6">
        <div className="px-8 py-6 border-b border-gray-100/60 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-transparent">
          <h3 className="font-bold text-[#111827] dark:text-gray-100 text-lg">Lịch sử chấm công</h3>
          <div className="flex items-center gap-3 text-sm text-[#6B7280] dark:text-gray-400 font-medium bg-white/50 dark:bg-white/10 px-3 py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-white/5">
            <Calendar size={14} />
            <span className="capitalize">{monthLabel}</span>
            <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/20 mx-1" />
            <button onClick={verifyWifi} className="p-1 hover:text-[#EF4444] dark:hover:text-red-400 transition-colors" title="Kiểm tra WiFi">
              <Wifi size={14} />
            </button>
            <button onClick={reload} className="p-1 hover:text-[#10B981] transition-colors" title="Tải lại">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        <div className="p-6">
          {/* Removed Mini Bar Chart Tracker */}

          {/* Vertical Timeline Feed */}
          <div className="relative pl-3 md:pl-6 space-y-6 before:absolute before:inset-0 before:ml-[25px] md:before:ml-[37px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200/40 dark:before:from-white/10 before:via-gray-200 dark:before:via-white/20 before:to-transparent">
            {loading ? (
              <div className="py-12 text-center text-gray-400">Đang tải...</div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-gray-400">Chưa có lịch sử trong tháng</div>
            ) : history.map((r, i) => {
              const t = formatAttendanceTimes(r)
              const isAbsent = r.status === "absent"
              const isLate = r.status === "late" || r.status === "early" || r.status === "late_early"
              const isOnTime = r.status === "on-time" || r.status === "leave"

              const iconBg = isAbsent ? "bg-red-100 text-red-500 ring-4 ring-white dark:bg-red-900/40 dark:ring-[#0E0508]" : isLate ? "bg-orange-100 text-[#F59E0B] ring-4 ring-white dark:bg-orange-900/40 dark:ring-[#0E0508]" : "bg-green-100 text-[#10B981] ring-4 ring-white dark:bg-green-900/40 dark:ring-[#0E0508]"
              const cleanTime = (time: string | null | undefined) => time ? time.replace(/\s*\d+s/g, '').trim() : "--"

              return (
                <div key={r.id} className="relative flex items-start gap-4 md:gap-6 group">
                  <div className={`mt-0.5 z-10 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full shrink-0 shadow-sm ${iconBg}`}>
                    {isOnTime ? <CheckCircle size={16} /> : isAbsent ? <XCircle size={16} /> : <AlertCircle size={16} />}
                  </div>

                  <div className="flex-1 bg-white/70 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] border border-gray-100/80 dark:border-white/5 rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-none transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                      <div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-100 text-[15px]">{fmtIsoDate(r.date)} <span className="text-[#9CA3AF] dark:text-gray-500 font-medium ml-2 text-xs">{weekdayFromIso(r.date)}</span></h4>
                      </div>
                      <div className="shrink-0">
                        {isIntern
                          ? <InternSessionStatusBadges statusAm={r.statusAm} statusPm={r.statusPm} />
                          : <StatusBadge status={r.status} />}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#4B5563] dark:text-gray-400 font-medium bg-gray-50/50 dark:bg-white/5 p-2.5 rounded-xl border border-gray-100/50 dark:border-white/5">
                      {isIntern ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> {cleanTime(t.primary)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" /> {cleanTime(t.secondary)}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <CornerDownRight size={15} className="text-[#10B981]" />
                            <span>Vào: <span className="text-gray-900 dark:text-gray-200 font-bold">{cleanTime(r.checkIn)}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CornerUpLeft size={15} className="text-[#F59E0B]" />
                            <span>Ra: <span className="text-gray-900 dark:text-gray-200 font-bold">{cleanTime(r.checkOut)}</span></span>
                          </div>
                          <div className="flex items-center gap-2 ml-auto">
                            <Clock size={15} className="text-gray-400 dark:text-gray-500" />
                            <span className="font-mono">{cleanTime(r.workingHours)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận chấm công"
        icon={AlertCircle}
        width="sm"
        bodyClassName="px-6 py-5"
        footer={
          <>
            <ModalCancelButton onClick={() => setConfirmOpen(false)} />
            <ModalSubmitButton
              onClick={() => {
                setConfirmOpen(false)
                punch()
              }}
              label="Xác nhận"
            />
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Bạn có chắc muốn thực hiện <span className="font-bold text-[#C62828]">{punchLabel.label}</span> không?
        </p>
      </Modal>
    </div >
  )
}
