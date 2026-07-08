import React, { useEffect, useState } from "react"
import { Fingerprint, CheckCircle, Clock, AlertCircle, Calendar, Loader2, RefreshCw, Wifi } from "lucide-react"
import { useEmployeeAttendance, todayISO } from "../../hooks/useEmployeeAttendance"
import { fmtIsoDate, weekdayFromIso, formatAttendanceTimes, ATT_STATUS_LABEL, ATT_STATUS_STYLE } from "../cham-cong/attendanceDisplay"
import { EMPLOYEE_KIND, INTERN_SESSION, internSessionRange } from "../cham-cong/attendanceModel"

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  "on-time": { label: "Đúng giờ", color: "text-green-700", bg: "bg-green-100" },
  late: { label: "Đi trễ", color: "text-orange-700", bg: "bg-orange-100" },
  early: { label: "Về sớm", color: "text-amber-700", bg: "bg-amber-100" },
  late_early: { label: "Trễ & sớm", color: "text-orange-800", bg: "bg-orange-100" },
  absent: { label: "Vắng mặt", color: "text-red-700", bg: "bg-red-100" },
  leave: { label: "Nghỉ phép", color: "text-purple-700", bg: "bg-purple-100" },
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
      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
        <Wifi size={15} className="shrink-0" />
        <span>Đúng WiFi công ty</span>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
      <Wifi size={15} className="shrink-0 mt-0.5" />
      <span>Vui lòng kết nối wifi công ty để chấm công.</span>
    </div>
  )
}

function PortalAttendanceView() {
  const {
    isIntern, todayRecord, history, monthStats,
    loading, punching, error, ipStatus, verifyWifi, punch, punchLabel, statusText, reload,
  } = useEmployeeAttendance()
  const [hms, setHms] = useState({ h: "00", m: "00", s: "00" })
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

  const handlePunchWithConfirm = () => {
    if (window.confirm(`Xác nhận thực hiện ${punchLabel.label}?`)) {
      punch()
    }
  }

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

  const isSuperAdmin = React.useMemo(() => {
    try {
      const raw = localStorage.getItem("dudi_user")
      const u = raw ? JSON.parse(raw) : null
      return u?.roleId === "role-super-admin" || ["0000000000", "1111111111", "2222222222"].includes(u?.employeeId)
    } catch {
      return false
    }
  }, [])

  const handlePunchWithConfirm = () => {
    if (window.confirm(`Xác nhận thực hiện ${punchLabel.label}?`)) {
      punch()
    }
  }

  const working = !punchLabel.done && statusText === "Đang làm việc"
  const monthLabel = new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" })
  const times = todayRecord ? formatAttendanceTimes(todayRecord) : null

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
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

      <div className="bg-gradient-to-br from-[#160606] to-[#2a0808] rounded-2xl p-6 text-white flex items-center justify-between shadow-lg">
        <div className="flex-1 min-w-0">
          <p className="text-white/50 text-sm mb-1">
            {isIntern ? `${EMPLOYEE_KIND.intern.label} · chấm theo buổi` : `${EMPLOYEE_KIND.staff.label} · chấm theo ngày`}
          </p>
          <h3 className="text-xl font-bold">{loading ? "Đang tải..." : statusText}</h3>
          {todayRecord && (
            <div className="text-white/60 text-sm mt-2 font-mono space-y-0.5">
              {isIntern ? (
                <>
                  <p>{internSessionRange(todayRecord, "am")}</p>
                  <p>{internSessionRange(todayRecord, "pm")}</p>
                  {todayRecord.autoFilled && (
                    <p className="text-amber-300/90 text-xs mt-1">Làm cả ngày — hệ thống tự ghi giờ nghỉ trưa</p>
                  )}
                </>
              ) : (
                <p>Vào: {todayRecord.checkIn ?? "--"}{todayRecord.checkOut && todayRecord.checkOut !== "--" ? ` · Ra: ${todayRecord.checkOut}` : ""}</p>
              )}
            </div>
          )}
          {!isIntern && times && (
            <p className="text-white/40 text-xs mt-2">Giờ làm: {todayRecord?.workingHours ?? "--"}</p>
          )}
        </div>
        <button
          onClick={handlePunchWithConfirm}
          disabled={loading || punching || punchLabel.done || isSuperAdmin || (!!ipStatus && !ipStatus.valid)}
          className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300 border-2 shrink-0
            ${punchLabel.done ? "opacity-50 cursor-not-allowed bg-white/5 border-white/20" :
              working ? "bg-green-600/20 border-green-500/50 hover:scale-105 active:scale-95" :
              "bg-[#C62828]/20 border-[#C62828]/50 hover:scale-105 active:scale-95"} shadow-xl`}
        >
          {punching ? <Loader2 size={28} className="animate-spin text-white" /> : (
            <Fingerprint size={30} className={working ? "text-green-400" : "text-[#FF8A50]"} />
          )}
          <span className="text-[10px] font-bold text-white text-center leading-tight px-1">
            {punchLabel.label}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Đúng giờ", value: monthStats.onTime, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          { label: "Đi trễ / sớm", value: monthStats.late, icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Vắng", value: monthStats.absent, icon: Clock, color: "text-red-500", bg: "bg-red-50" },
          { label: "Nghỉ phép", value: monthStats.leave, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-black/[0.04]`}>
            <p className={`text-2xl font-black ${s.color}`}>{loading ? "—" : s.value}</p>
            <p className="text-xs font-semibold text-gray-600 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Lịch sử chấm công</h3>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <Calendar size={13} />
            <span>{monthLabel}</span>
            <button onClick={verifyWifi} className="p-1 hover:text-gray-600" title="Kiểm tra WiFi">
              <Wifi size={13} />
            </button>
            <button onClick={reload} className="p-1 hover:text-gray-600" title="Tải lại">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/70 text-gray-400 text-xs">
                {(isIntern
                  ? ["Ngày", "Thứ", `${INTERN_SESSION.am.label}`, `${INTERN_SESSION.pm.label}`, "Giờ", "Trạng thái"]
                  : ["Ngày", "Thứ", "Giờ vào", "Giờ ra", "Số giờ", "Trạng thái"]
                ).map(h => (
                  <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Đang tải...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Chưa có lịch sử trong tháng</td></tr>
              ) : history.map(r => {
                const t = formatAttendanceTimes(r)
                return (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-700">{fmtIsoDate(r.date)}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{weekdayFromIso(r.date)}</td>
                    {isIntern ? (
                      <>
                        <td className="px-5 py-3.5 font-mono text-xs">{t.primary}</td>
                        <td className="px-5 py-3.5 font-mono text-xs">{t.secondary}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3.5 font-mono text-xs">{r.checkIn}</td>
                        <td className="px-5 py-3.5 font-mono text-xs">{r.checkOut}</td>
                      </>
                    )}
                    <td className="px-5 py-3.5 font-mono text-xs font-medium">{r.workingHours ?? "--"}</td>
                    <td className="px-5 py-3.5">
                      {isIntern
                        ? <InternSessionStatusBadges statusAm={r.statusAm} statusPm={r.statusPm} />
                        : <StatusBadge status={r.status} />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
