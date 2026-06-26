import { useState, useEffect } from "react";
import {
  Fingerprint, User, CalendarDays, ClipboardList, Settings,
  X, CheckCircle2, Lock, Eye, EyeOff, Plus, ArrowLeft,
  Bell, CheckSquare, Search, MessageCircle, Users, Phone, Mail,
  FileDown, Zap, FileText, Download, Send, Paperclip
} from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import dudiLogo from "../../../imports/avatar.jpg";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const BRAND = "#E8231A";          // exact DUDI red
const CRIMSON = "#C01525";          // deeper variant for depth
const GOLD = "#FF8800";          // ember gold complement
const BG = "#0C0102";          // near-black warm
const GR = "rgba(232,35,26,0.28)";   // red glow
const GG = "rgba(255,136,0,0.14)";   // gold glow

// ─── Shared styles ────────────────────────────────────────────────────────────
const PANEL_BG: React.CSSProperties = {
  background: "rgba(12,2,4,0.88)",
  backdropFilter: "blur(36px)",
  WebkitBackdropFilter: "blur(36px)",
  border: `1px solid rgba(232,35,26,0.16)`,
  borderRadius: 24,
};

const INPUT_S: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  color: "#FFE8EC",
  fontSize: 13,
  padding: "10px 12px",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

const BTN_S: React.CSSProperties = {
  width: "100%",
  padding: "13px",
  borderRadius: 14,
  fontWeight: 800,
  fontSize: 14,
  border: "none",
  cursor: "pointer",
  color: "#fff",
  background: `linear-gradient(135deg, ${BRAND}, ${GOLD})`,
  boxShadow: `0 0 24px ${GR}`,
  fontFamily: "inherit",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
type LeaveStatus = "pending" | "approved" | "cancelled";

const EMP = {
  name: "Trần Thị Bích Liên",
  id: "2026052831",
  dept: "Kỹ thuật",
  role: "Kỹ sư phần mềm",
  email: "bich.lien@dudisoftware.com",
  phone: "0901 234 567",
  joinDate: "01/05/2026",
  dob: "15/03/1998",
  address: "123 Nguyễn Huệ, Q.1, TP.HCM",
};

const WEEK = [
  { day: "T2", date: 22, s: "present" as const },
  { day: "T3", date: 23, s: "present" as const },
  { day: "T4", date: 24, s: "today" as const },
  { day: "T5", date: 25, s: "future" as const },
  { day: "T6", date: 26, s: "future" as const },
  { day: "T7", date: 27, s: "weekend" as const },
  { day: "CN", date: 28, s: "weekend" as const },
];

const TASKS_LIST = [
  {
    date: "05/06/2026", day: "Thứ Sáu", items: [
      { id: 1, t: "Viết section cho danh mục web" },
      { id: 2, t: "Thiết kế lại trang web" },
    ]
  },
  { date: "09/06/2026", day: "Thứ Ba", items: [{ id: 3, t: "Viết lại web" }] },
  { date: "12/06/2026", day: "Thứ Sáu", items: [{ id: 4, t: "Làm web" }] },
];

const LEAVES: { id: number; date: string; type: string; reason: string; status: LeaveStatus }[] = [
  { id: 1, date: "10/06/2026", type: "Nghỉ phép", reason: "Việc cá nhân", status: "approved" },
  { id: 2, date: "15/06/2026", type: "Nghỉ ốm", reason: "Không khỏe", status: "approved" },
  { id: 3, date: "20/06/2026", type: "Nghỉ phép", reason: "Du lịch gia đình", status: "cancelled" },
];

// ─── Bubble definitions ────────────────────────────────────────────────────────
// ─── Bubble definitions ────────────────────────────────────────────────────────
type BubbleId = "checkin" | "employee" | "leave" | "tasks" | "settings" | "directory" | "chat" | "workflow" | "notifications";

const BUBBLES: {
  id: BubbleId; label: string; sub: string; emoji: string;
  lx: string; ty: string; size: number; dur: number; delay: number; isCenter?: boolean;
}[] = [
    { id: "checkin", label: "Check-in", sub: "Chấm công", emoji: "⚡", lx: "50%", ty: "48%", size: 184, dur: 8.8, delay: 0, isCenter: true },
    { id: "employee", label: "Hồ sơ", sub: "Cá nhân", emoji: "👤", lx: "22%", ty: "24%", size: 128, dur: 9.3, delay: 0.6 },
    { id: "leave", label: "Ngày nghỉ", sub: "Phép & Time off", emoji: "🏖️", lx: "78%", ty: "24%", size: 128, dur: 8.9, delay: 1.1 },
    { id: "directory", label: "Danh bạ", sub: "Nhân viên", emoji: "📖", lx: "12%", ty: "50%", size: 110, dur: 10.1, delay: 0.9 },
    { id: "workflow", label: "Quy trình", sub: "Trình duyệt", emoji: "🔄", lx: "88%", ty: "50%", size: 116, dur: 9.8, delay: 1.5 },
    { id: "tasks", label: "Công việc", sub: "Quản lý task", emoji: "📋", lx: "24%", ty: "74%", size: 120, dur: 9.6, delay: 0.4 },
    { id: "chat", label: "Tin nhắn", sub: "Chat nội bộ", emoji: "💬", lx: "76%", ty: "74%", size: 120, dur: 9.2, delay: 1.2 },
    { id: "settings", label: "Cài đặt", sub: "Tài khoản", emoji: "⚙️", lx: "38%", ty: "86%", size: 104, dur: 8.4, delay: 1.8 },
    { id: "notifications", label: "Thông báo", sub: "Hệ thống", emoji: "🔔", lx: "62%", ty: "86%", size: 104, dur: 8.7, delay: 0.5 },
  ];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function LeaveBadge({ status }: { status: LeaveStatus }) {
  const m = {
    pending: { l: "Đang chờ duyệt", c: "#f59e0b", a: "rgba(245,158,11,0.1)", b: "rgba(245,158,11,0.22)" },
    approved: { l: "Đã duyệt", c: "#22c55e", a: "rgba(34,197,94,0.1)", b: "rgba(34,197,94,0.22)" },
    cancelled: { l: "Đã huỷ", c: "#ff5555", a: "rgba(255,85,85,0.1)", b: "rgba(255,85,85,0.22)" },
  }[status];
  return <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, color: m.c, background: m.a, border: `1px solid ${m.b}` }}>{m.l}</span>;
}

function SectionLabel({ children }: { children: string }) {
  return <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,232,236,0.28)", marginBottom: 14 }}>{children}</p>;
}

function FieldLabel({ children }: { children: string }) {
  return <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,232,236,0.28)", marginBottom: 6 }}>{children}</p>;
}

function FieldBox({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 12px", color: "#FFE8EC", fontSize: 13, fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit" }}>
      {children}
    </div>
  );
}

// ─── Ambient background ────────────────────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {/* Large red glow bottom-left */}
      <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: "55vw", height: "55vw", borderRadius: "50%", background: `radial-gradient(circle, rgba(200,20,30,0.18) 0%, transparent 65%)` }} />
      {/* Gold glow top-right */}
      <div style={{ position: "absolute", top: "-8%", right: "-8%", width: "40vw", height: "40vw", borderRadius: "50%", background: `radial-gradient(circle, rgba(200,80,0,0.1) 0%, transparent 60%)` }} />
      {/* Subtle center glow */}
      <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: "30vw", height: "30vw", borderRadius: "50%", background: `radial-gradient(circle, rgba(180,10,25,0.08) 0%, transparent 70%)` }} />
    </div>
  );
}

// ─── Floating Clock ───────────────────────────────────────────────────────────
function FloatingClock() {
  const [hms, setHms] = useState({ h: "00", m: "00", s: "00" });
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setHms({ h: String(n.getHours()).padStart(2, "0"), m: String(n.getMinutes()).padStart(2, "0"), s: String(n.getSeconds()).padStart(2, "0") });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  return (
    <div style={{ textAlign: "center", paddingTop: "5vh", position: "relative", zIndex: 1 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,232,236,0.25)", marginBottom: 10 }}>
        Thứ Tư · 24 Tháng 6 · 2026
      </p>
      <div style={{ display: "inline-flex", alignItems: "baseline", gap: "0.04em", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, lineHeight: 1 }}>
        <span style={{ fontSize: "clamp(48px, 8vw, 80px)", color: BRAND, textShadow: `0 0 40px ${GR}, 0 0 80px rgba(232,35,26,0.1)` }}>{hms.h}</span>
        <span style={{ fontSize: "clamp(48px, 8vw, 80px)", color: BRAND, opacity: 0.3, animation: "colon-blink 1s step-end infinite" }}>:</span>
        <span style={{ fontSize: "clamp(48px, 8vw, 80px)", color: BRAND, textShadow: `0 0 40px ${GR}, 0 0 80px rgba(232,35,26,0.1)` }}>{hms.m}</span>
        <span style={{ fontSize: "clamp(16px, 2.6vw, 26px)", color: `rgba(232,35,26,0.5)`, marginLeft: "0.2em", alignSelf: "flex-start", marginTop: "0.3em" }}>{hms.s}</span>
      </div>
    </div>
  );
}

// ─── Single Bubble ────────────────────────────────────────────────────────────
function Bubble({ b, hovId, setHovId, onClick }: {
  b: typeof BUBBLES[0];
  hovId: BubbleId | null;
  setHovId: (id: BubbleId | null) => void;
  onClick: (id: BubbleId, e: React.MouseEvent) => void;
}) {
  const isHov = hovId === b.id;
  const floatName = `floatBubble${b.id}`;

  const baseGlow = b.isCenter
    ? `0 0 60px rgba(232,35,26,0.35), 0 0 100px rgba(232,35,26,0.12), 0 12px 40px rgba(0,0,0,0.6)`
    : `0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(232,35,26,0.08)`;

  const hovGlow = b.isCenter
    ? `0 0 80px rgba(232,35,26,0.55), 0 0 120px rgba(255,136,0,0.18), 0 12px 40px rgba(0,0,0,0.7)`
    : `0 0 50px rgba(232,35,26,0.28), 0 0 70px rgba(255,136,0,0.1), 0 12px 40px rgba(0,0,0,0.6)`;

  return (
    <div
      style={{
        position: "absolute",
        left: b.lx,
        top: b.ty,
        width: b.size,
        height: b.size,
        marginLeft: -b.size / 2,
        marginTop: -b.size / 2,
        animation: `${floatName} ${b.dur}s ease-in-out ${b.delay}s infinite`,
        zIndex: 2,
      }}
    >
      {/* Pulse rings for center bubble */}
      {b.isCenter && (
        <>
          <div style={{ position: "absolute", inset: -16, borderRadius: "50%", border: `1.5px solid rgba(232,35,26,0.4)`, animation: "pulseRing 2.4s ease-out infinite", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: -32, borderRadius: "50%", border: `1px solid rgba(232,35,26,0.2)`, animation: "pulseRing 2.4s ease-out 0.8s infinite", pointerEvents: "none" }} />
        </>
      )}
      {/* Bubble body */}
      <div
        onClick={e => onClick(b.id, e)}
        onMouseEnter={() => setHovId(b.id)}
        onMouseLeave={() => setHovId(null)}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: b.isCenter ? 8 : 6,
          cursor: "pointer",
          transition: "box-shadow 0.35s ease, border-color 0.35s ease, background 0.35s ease",
          background: isHov
            ? b.isCenter
              ? `radial-gradient(circle at 35% 30%, rgba(232,35,26,0.38), rgba(120,10,18,0.22))`
              : `radial-gradient(circle at 35% 30%, rgba(232,35,26,0.25), rgba(80,6,12,0.15))`
            : b.isCenter
              ? `radial-gradient(circle at 35% 30%, rgba(232,35,26,0.22), rgba(90,8,14,0.12))`
              : `radial-gradient(circle at 35% 30%, rgba(232,35,26,0.13), rgba(50,4,8,0.06))`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: isHov
            ? `1px solid rgba(240,100,90,0.45)`
            : b.isCenter
              ? `1px solid rgba(232,80,80,0.32)`
              : `1px solid rgba(200,60,55,0.2)`,
          boxShadow: isHov ? hovGlow : baseGlow,
        }}
      >
        <span style={{ fontSize: b.isCenter ? 36 : 28, lineHeight: 1, userSelect: "none" }}>
          {b.emoji}
          {b.id === "notifications" && (
            <div style={{ position: "absolute", top: 12, right: 12, width: 22, height: 22, borderRadius: "50%", background: "#ff5555", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff", border: "2px solid #0C0102", boxShadow: "0 0 10px rgba(255,85,85,0.8)" }}>2</div>
          )}
        </span>
        <span style={{ fontSize: b.isCenter ? 12 : 11, fontWeight: 800, color: isHov ? "#FFE8EC" : "rgba(255,232,236,0.78)", textAlign: "center", lineHeight: 1.3, letterSpacing: "0.02em", padding: "0 8px" }}>
          {b.label}
        </span>
        {isHov && (
          <span style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,232,236,0.45)", textAlign: "center", lineHeight: 1.3, padding: "0 8px" }}>
            {b.sub}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Panel wrapper ────────────────────────────────────────────────────────────
function Panel({ activePage, onClose, checkedIn, setCheckedIn, onLogout }: {
  activePage: BubbleId;
  onClose: () => void;
  checkedIn: boolean;
  setCheckedIn: (v: boolean) => void;
  onLogout: () => void;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true))); return () => cancelAnimationFrame(id); }, []);

  const handleClose = () => { setVisible(false); setTimeout(onClose, 400); };

  const bubble = BUBBLES.find(b => b.id === activePage)!;

  const title: Record<BubbleId, string> = {
    checkin: "Tổng quan & Chấm công",
    employee: "Thông tin nhân viên",
    leave: "Quản lý ngày nghỉ",
    tasks: "Quản lý công việc",
    settings: "Cài đặt tài khoản",
    directory: "Danh bạ công ty",
    chat: "Chat nội bộ",
    workflow: "Quy trình nội bộ",
    notifications: "Thông báo hệ thống",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "rgba(8,1,2,0.7)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        style={{
          ...PANEL_BG,
          width: "100%",
          maxWidth: 640,
          maxHeight: "86vh",
          overflowY: "auto",
          position: "relative",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.95) translateY(20px)",
          transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(232,35,26,0.18) transparent",
        }}
      >
        {/* Panel header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "sticky", top: 0, background: "rgba(12,1,4,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: "24px 24px 0 0", zIndex: 1 }}>
          <button
            onClick={handleClose}
            style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,232,236,0.5)", flexShrink: 0, transition: "all 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,35,26,0.4)"; (e.currentTarget as HTMLElement).style.color = "#FFE8EC"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,232,236,0.5)"; }}
          >
            <ArrowLeft size={16} />
          </button>
          <span style={{ fontSize: 20, userSelect: "none" }}>{bubble.emoji}</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#FFE8EC", lineHeight: 1.2 }}>{title[activePage]}</p>
            <p style={{ fontSize: 11, color: "rgba(255,232,236,0.38)", marginTop: 1 }}>{bubble.sub}</p>
          </div>
          <button
            onClick={handleClose}
            style={{ marginLeft: "auto", width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,232,236,0.4)", transition: "all 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(232,35,26,0.15)"; (e.currentTarget as HTMLElement).style.color = BRAND; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,232,236,0.4)"; }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Panel content */}
        <div style={{ padding: "20px 24px 28px" }}>
          {activePage === "checkin" && <CheckinContent checkedIn={checkedIn} setCheckedIn={setCheckedIn} />}
          {activePage === "employee" && <EmployeeContent />}
          {activePage === "leave" && <LeaveContent />}
          {activePage === "tasks" && <TasksContent />}
          {activePage === "directory" && <DirectoryContent />}
          {activePage === "chat" && <ChatContent />}
          {activePage === "workflow" && <WorkflowContent />}
          {activePage === "notifications" && <NotificationsContent />}
          {activePage === "settings" && <SettingsContent onLogout={onLogout} />}
        </div>
      </div>
    </div>
  );
}

// ─── Check-in content ─────────────────────────────────────────────────────────
function CheckinContent({ checkedIn, setCheckedIn }: { checkedIn: boolean; setCheckedIn: (v: boolean) => void }) {
  const [hms, setHms] = useState({ h: "00", m: "00", s: "00" });
  const [ciTime, setCiTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => { const n = new Date(); setHms({ h: String(n.getHours()).padStart(2, "0"), m: String(n.getMinutes()).padStart(2, "0"), s: String(n.getSeconds()).padStart(2, "0") }); };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  const toggle = () => { if (!checkedIn) setCiTime(`${hms.h}:${hms.m}`); setCheckedIn(!checkedIn); };

  const kpis = [
    { l: "Đi làm", v: 22, c: "#22c55e", g: "rgba(34,197,94,0.22)" },
    { l: "Đi trễ", v: 10, c: "#f59e0b", g: "rgba(245,158,11,0.22)" },
    { l: "Vắng mặt", v: 14, c: "#ff5555", g: "rgba(255,85,85,0.22)" },
  ];

  const wc: Record<string, string> = { present: "#22c55e", late: "#f59e0b", absent: "#ff5555", weekend: "rgba(255,255,255,0.05)", future: "rgba(255,255,255,0.03)", today: BRAND };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      {checkedIn && ciTime && <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#22c55e", textShadow: "0 0 10px rgba(34,197,94,0.6)" }}>✓ Check-in lúc {ciTime}</p>}

      {/* Live clock in panel */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.04em", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, lineHeight: 1 }}>
        <span style={{ fontSize: 48, color: BRAND, textShadow: `0 0 24px ${GR}` }}>{hms.h}</span>
        <span style={{ fontSize: 48, color: BRAND, opacity: 0.3, animation: "colon-blink 1s step-end infinite" }}>:</span>
        <span style={{ fontSize: 48, color: BRAND, textShadow: `0 0 24px ${GR}` }}>{hms.m}</span>
        <span style={{ fontSize: 16, color: "rgba(232,35,26,0.5)", marginLeft: 6, alignSelf: "flex-start", marginTop: 6 }}>{hms.s}</span>
      </div>

      {/* Check-in button */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {!checkedIn && (
          <>
            <div style={{ position: "absolute", width: 136, height: 136, borderRadius: "50%", border: `1.5px solid ${BRAND}`, animation: "pulseRing 2.2s ease-out infinite", pointerEvents: "none" }} />
            <div style={{ position: "absolute", width: 136, height: 136, borderRadius: "50%", border: `1px solid ${BRAND}`, animation: "pulseRing 2.2s ease-out 0.75s infinite", pointerEvents: "none" }} />
          </>
        )}
        <button
          onClick={toggle}
          style={{ width: 112, height: 112, borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 900, color: "#fff", background: checkedIn ? "linear-gradient(135deg, #22c55e, #16a34a)" : `linear-gradient(135deg, ${BRAND}, ${GOLD})`, boxShadow: checkedIn ? "0 0 30px rgba(34,197,94,0.55)" : `0 0 30px ${GR}, 0 0 60px rgba(232,35,26,0.12)`, transition: "transform 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Fingerprint size={34} strokeWidth={1.5} />
          <span style={{ fontSize: 9, letterSpacing: "0.16em" }}>{checkedIn ? "CHECK OUT" : "CHECK IN"}</span>
        </button>
      </div>
      <p style={{ fontSize: 12, color: "rgba(255,232,236,0.25)" }}>{checkedIn ? "Bấm để ghi nhận giờ kết thúc" : "Bấm để ghi nhận giờ vào làm"}</p>

      {/* KPIs row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, width: "100%" }}>
        {kpis.map(({ l, v, c, g }) => (
          <div key={l} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "14px 12px", textAlign: "center", boxShadow: `0 0 16px ${g}` }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: c, textShadow: `0 0 12px ${g}`, lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,232,236,0.38)", marginTop: 5 }}>{l} · T6</div>
          </div>
        ))}
      </div>

      {/* Weekly heatmap */}
      <div style={{ width: "100%", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "14px 16px" }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,232,236,0.25)", marginBottom: 10 }}>Tuần này</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
          {WEEK.map(({ day }) => <div key={day} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: "rgba(255,232,236,0.22)" }}>{day}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {WEEK.map(({ day, date, s }) => {
            const today = s === "today"; const dim = s === "weekend" || s === "future";
            return (
              <div key={day} style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: wc[s], border: today ? `1px solid ${BRAND}` : "1px solid transparent", boxShadow: today ? `0 0 10px ${GR}` : "none", fontSize: 11, fontWeight: today ? 800 : 600, color: today ? "#fff" : dim ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.8)" }}>
                {date}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tích hợp Lịch sử chấm công chi tiết */}
      <div style={{ width: "100%", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "14px 16px" }}>
        <SectionLabel>Lịch sử chấm công</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { d: "23/06/2026", in: "08:25", out: "17:35", status: "Đúng giờ", clr: "#22c55e" },
            { d: "22/06/2026", in: "08:45", out: "17:30", status: "Đi trễ", clr: "#f59e0b" },
            { d: "21/06/2026", in: "08:29", out: "18:15", status: "Đúng giờ (Tăng ca)", clr: "#3b82f6" },
          ].map((item, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 8, borderBottom: idx < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#FFE8EC" }}>{item.d}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,232,236,0.4)" }}>Vào: <span style={{ color: "rgba(255,232,236,0.8)" }}>{item.in}</span></span>
                  <span style={{ fontSize: 11, color: "rgba(255,232,236,0.4)" }}>Ra: <span style={{ color: "rgba(255,232,236,0.8)" }}>{item.out}</span></span>
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: item.clr, padding: "3px 8px", background: `${item.clr}20`, borderRadius: 8 }}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Employee content ─────────────────────────────────────────────────────────
function EmployeeContent() {
  const info = [
    { l: "Email", v: EMP.email },
    { l: "Số điện thoại", v: EMP.phone },
    { l: "Ngày sinh", v: EMP.dob },
    { l: "Ngày vào làm", v: EMP.joinDate },
    { l: "Địa chỉ", v: EMP.address },
  ];
  const locked = ["Mức lương (VNĐ)", "Loại hợp đồng", "Đánh giá hiệu suất"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Profile card */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 20px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: `linear-gradient(135deg, ${BRAND}, ${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff", boxShadow: `0 0 24px ${GR}` }}>
            TL
          </div>
          <div style={{ position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: "50%", background: "#22c55e", border: "2px solid #0C0102", boxShadow: "0 0 8px rgba(34,197,94,0.8)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#FFE8EC", lineHeight: 1.2 }}>{EMP.name}</h2>
          <p style={{ fontSize: 12, color: "rgba(255,232,236,0.38)", marginTop: 3 }}>{EMP.role}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, color: BRAND, background: "rgba(232,35,26,0.1)", border: `1px solid rgba(232,35,26,0.2)` }}>⚡ {EMP.dept}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.24)" }}>#{EMP.id}</span>
          </div>
        </div>
        {/* DUDI Logo */}
        <div style={{ flexShrink: 0, opacity: 0.35 }}>
          <ImageWithFallback src={dudiLogo} alt="DUDI Software" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
        </div>
      </div>

      {/* Info fields */}
      <div style={{ padding: "16px 18px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16 }}>
        <SectionLabel>Thông tin hợp đồng & Liên hệ</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {info.map(({ l, v }) => (
            <div key={l}>
              <FieldLabel>{l}</FieldLabel>
              <FieldBox>{v}</FieldBox>
            </div>
          ))}
        </div>
      </div>

      {/* Quá trình công tác */}
      <div style={{ padding: "16px 18px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16 }}>
        <SectionLabel>Quá trình công tác</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: BRAND, marginTop: 5, boxShadow: `0 0 8px ${BRAND}` }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#FFE8EC" }}>Kỹ sư phần mềm (Chính thức)</p>
              <p style={{ fontSize: 12, color: "rgba(255,232,236,0.4)", marginTop: 2 }}>Phòng Kỹ thuật • 01/05/2026 - Hiện tại</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.2)", marginTop: 5 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,232,236,0.7)" }}>Thực tập sinh Frontend</p>
              <p style={{ fontSize: 12, color: "rgba(255,232,236,0.3)", marginTop: 2 }}>Phòng Kỹ thuật • 01/03/2026 - 30/04/2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Locked fields */}
      <div style={{ padding: "16px 18px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Lock size={12} style={{ color: "#f59e0b" }} />
          <SectionLabel>Thông tin quản lý</SectionLabel>
          <span style={{ marginBottom: 14, padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)" }}>Chỉ sếp</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {locked.map(l => (
            <div key={l}>
              <FieldLabel>{l}</FieldLabel>
              <div style={{ ...{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 12px", color: "#FFE8EC", fontSize: 13 }, opacity: 0.35, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.24em" }}>••••••</span>
                <Lock size={10} style={{ color: "#f59e0b" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Leave content ────────────────────────────────────────────────────────────
function LeaveContent() {
  const [tab, setTab] = useState<"leave" | "timeoff">("leave");
  const [leaves, setLeaves] = useState(LEAVES);
  const [lType, setLType] = useState("Nghỉ phép");
  const [lDate, setLDate] = useState("");
  const [lReason, setLReason] = useState("");
  const [sent, setSent] = useState(false);
  const nw = [
    { l: "T2", d: "29/06" }, { l: "T3", d: "30/06" }, { l: "T4", d: "01/07" },
    { l: "T5", d: "02/07" }, { l: "T6", d: "03/07" },
    { l: "T7", d: "04/07", w: true }, { l: "CN", d: "05/07", w: true },
  ];
  const [slots, setSlots] = useState<Set<string>>(new Set());
  const toggleSlot = (k: string) => setSlots(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 13, color: "rgba(255,232,236,0.38)" }}>
          Phép còn lại: <span style={{ color: BRAND, fontWeight: 800 }}>8 ngày</span>
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 4 }}>
        {[{ id: "leave" as const, l: "Xin nghỉ phép" }, { id: "timeoff" as const, l: "Time Off tuần" }].map(({ id, l }) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", color: tab === id ? BRAND : "rgba(255,232,236,0.35)", background: tab === id ? "rgba(232,35,26,0.1)" : "transparent", boxShadow: tab === id ? `inset 0 0 0 1px rgba(232,35,26,0.22)` : "none" }}>
            {l}
          </button>
        ))}
      </div>

      {tab === "leave" && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><FieldLabel>Loại nghỉ</FieldLabel><select value={lType} onChange={e => setLType(e.target.value)} style={{ ...INPUT_S, appearance: "none" as const }}><option className="bg-gray-900">Nghỉ phép</option><option className="bg-gray-900">Nghỉ ốm</option><option className="bg-gray-900">Nghỉ không lương</option></select></div>
            <div><FieldLabel>Ngày nghỉ</FieldLabel><input type="date" value={lDate} onChange={e => setLDate(e.target.value)} style={{ ...INPUT_S, colorScheme: "dark" }} /></div>
            <div><FieldLabel>Lý do</FieldLabel><textarea rows={2} value={lReason} onChange={e => setLReason(e.target.value)} placeholder="Mô tả lý do..." style={{ ...INPUT_S, resize: "none" }} /></div>
            {sent && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, background: "rgba(34,197,94,0.09)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", fontSize: 13, fontWeight: 600 }}><CheckCircle2 size={14} /> Đã gửi thành công!</div>}
            <button onClick={() => {
              setSent(true);
              setTimeout(() => setSent(false), 3000);
              setLeaves([{ id: Date.now(), date: lDate || "24/06/2026", type: lType, reason: lReason || "Nghỉ phép", status: "pending" }, ...leaves]);
            }} style={BTN_S}>Gửi duyệt</button>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
            <SectionLabel>Lịch sử xin nghỉ</SectionLabel>
            {leaves.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#FFE8EC" }}>{item.type}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,232,236,0.32)", marginTop: 2 }}>{item.date} · {item.reason}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <LeaveBadge status={item.status} />
                  {item.status === "pending" && (
                    <button onClick={() => setLeaves(leaves.filter(l => l.id !== item.id))} style={{ background: "none", border: "none", color: "rgba(255,85,85,0.8)", cursor: "pointer", padding: 4 }} title="Hủy yêu cầu">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "timeoff" && (
        <>
          <p style={{ fontSize: 11, color: "rgba(255,232,236,0.3)" }}>Tuần tới: 29/06 – 05/07/2026 · Chọn buổi muốn nghỉ</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
            {nw.map(day => (
              <div key={day.d} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 9, fontWeight: 700, marginBottom: 3, color: day.w ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.38)" }}>{day.l}</p>
                <p style={{ fontSize: 9, marginBottom: 6, color: "rgba(255,255,255,0.2)" }}>{day.d}</p>
                {["Sáng", "Chiều"].map(slot => {
                  const k = `${day.d}-${slot}`; const sel = slots.has(k);
                  return day.w
                    ? <div key={slot} style={{ padding: "5px 0", borderRadius: 8, fontSize: 9, color: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", marginBottom: 4, textAlign: "center" }}>{slot}</div>
                    : <button key={slot} onClick={() => toggleSlot(k)} style={{ width: "100%", padding: "5px 0", borderRadius: 8, fontSize: 9, fontWeight: 700, marginBottom: 4, cursor: "pointer", border: "none", fontFamily: "inherit", transition: "all 0.15s", color: sel ? BRAND : "rgba(255,255,255,0.3)", background: sel ? "rgba(232,35,26,0.12)" : "rgba(255,255,255,0.03)", boxShadow: sel ? `inset 0 0 0 1px rgba(232,35,26,0.28)` : "inset 0 0 0 1px rgba(255,255,255,0.06)" }}>{slot}</button>;
                })}
              </div>
            ))}
          </div>
          <button style={BTN_S}>Gửi sếp phê duyệt</button>
        </>
      )}
    </div>
  );
}

// ─── Tasks content ────────────────────────────────────────────────────────────
function TasksContent() {
  const kpis = [
    { l: "Chưa làm", v: 0, c: "rgba(255,255,255,0.35)", g: "transparent" },
    { l: "Đang làm", v: 0, c: "#f59e0b", g: "rgba(245,158,11,0.2)" },
    { l: "Đã xong", v: 5, c: "#22c55e", g: "rgba(34,197,94,0.2)" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 12, color: "rgba(255,232,236,0.32)" }}>24/06/2026 · Thứ Tư</p>
        <button style={{ ...BTN_S, width: "auto", padding: "8px 16px", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}><Plus size={14} /> Thêm mới</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {kpis.map(({ l, v, c, g }) => (
          <div key={l} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "14px", boxShadow: g !== "transparent" ? `0 0 16px ${g}` : "none" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: c, lineHeight: 1, textShadow: g !== "transparent" ? `0 0 12px ${g}` : "none" }}>{v}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,232,236,0.32)", marginTop: 5 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "20px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>😴</div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#FFE8EC" }}>Hôm nay không có công việc</p>
        <p style={{ fontSize: 11, color: "rgba(255,232,236,0.3)", marginTop: 3 }}>24/06/2026 · Nghỉ ngơi chút nhé!</p>
      </div>

      <div>
        <SectionLabel>Nhật ký công việc</SectionLabel>
        {TASKS_LIST.map((g, idx) => (
          <div key={idx} style={{ display: "flex", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: BRAND, boxShadow: `0 0 8px ${BRAND}`, marginTop: 2, flexShrink: 0 }} />
              {idx < TASKS_LIST.length - 1 && <div style={{ width: 1, flex: 1, background: "rgba(232,35,26,0.15)", marginTop: 4 }} />}
            </div>
            <div style={{ flex: 1, paddingBottom: idx < TASKS_LIST.length - 1 ? 18 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>{g.date}</span>
                <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 10 }}>·</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>{g.day}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {g.items.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 11, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <CheckCircle2 size={13} style={{ color: "#22c55e", filter: "drop-shadow(0 0 4px rgba(34,197,94,0.6))", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#FFE8EC" }}>{item.t}</span>
                    </div>
                    <span style={{ padding: "3px 9px", borderRadius: 99, fontSize: 10, fontWeight: 700, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)", flexShrink: 0, marginLeft: 8 }}>Đã xong</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Directory content ─────────────────────────────────────────────────────────
function DirectoryContent() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ position: "relative" }}>
        <input type="text" placeholder="Tìm tên nhân viên, phòng ban..." style={{ ...INPUT_S, paddingLeft: 40 }} />
        <Search size={16} style={{ position: "absolute", left: 14, top: 11, color: "rgba(255,255,255,0.3)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${BRAND}, ${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff" }}>NV</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#FFE8EC" }}>Nguyễn Văn A</p>
                <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(255,255,255,0.05)", borderRadius: 99, color: "rgba(255,255,255,0.4)" }}>Marketing</span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,232,236,0.4)", marginTop: 2 }}>Trưởng phòng Marketing</p>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <a href="#" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: BRAND, textDecoration: "none", fontWeight: 600 }}><Phone size={12} /> 0901 234 567</a>
                <a href="#" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,232,236,0.5)", textDecoration: "none", fontWeight: 600 }}><Mail size={12} /> a.nguyen@dudi.vn</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chat content ─────────────────────────────────────────────────────────────
function ChatContent() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 5 }}>
        {["Tất cả", "Nhóm", "Chưa đọc"].map((t, i) => (
          <button key={t} style={{ padding: "6px 14px", borderRadius: 99, border: "none", fontSize: 12, fontWeight: 700, background: i === 0 ? "rgba(232,35,26,0.15)" : "rgba(255,255,255,0.03)", color: i === 0 ? BRAND : "rgba(255,255,255,0.4)", cursor: "pointer", whiteSpace: "nowrap" }}>{t}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 14, cursor: "pointer" }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><Users size={20} color="rgba(255,255,255,0.4)" /></div>
              {i === 1 && <div style={{ position: "absolute", top: -2, right: -2, width: 12, height: 12, borderRadius: "50%", background: BRAND, border: "2px solid #0C0102" }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#FFE8EC" }}>Nhóm Dự án Dudi</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>10:42</p>
              </div>
              <p style={{ fontSize: 12, color: i === 1 ? "#FFE8EC" : "rgba(255,232,236,0.4)", fontWeight: i === 1 ? 600 : 400 }}>Sếp: Mai họp lúc 9h nhé mọi người ơi!</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
        <input type="text" placeholder="Nhập tin nhắn..." style={{ ...INPUT_S, flex: 1 }} />
        <button style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Paperclip size={18} /></button>
        <button style={{ width: 40, height: 40, borderRadius: 12, background: BRAND, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px ${GR}` }}><Send size={18} /></button>
      </div>
    </div>
  );
}

// ─── Workflow content ─────────────────────────────────────────────────────────
function WorkflowContent() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 12, color: "rgba(255,232,236,0.32)" }}>Quản lý các quy trình trình duyệt, thanh toán, hợp đồng</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button style={{ ...BTN_S, background: "rgba(255,255,255,0.03)", color: "#FFE8EC", boxShadow: "none", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
          <Plus size={16} color={BRAND} /> Tạo quy trình
        </button>
        <button style={{ ...BTN_S, background: "rgba(255,255,255,0.03)", color: "#FFE8EC", boxShadow: "none", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
          <Download size={16} color="#f59e0b" /> Tải biểu mẫu
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
        <SectionLabel>Quy trình đang chờ</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileDown size={16} color="#3b82f6" />
              <p style={{ fontSize: 14, fontWeight: 700, color: "#FFE8EC" }}>Đề nghị thanh toán</p>
            </div>
            <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.1)" }}>Chờ Kế toán</span>
          </div>
          <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: "66%", height: "100%", background: "#3b82f6" }} />
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,232,236,0.3)" }}>Bước 2/3 · Cập nhật 2 giờ trước</p>
        </div>
      </div>
    </div>
  );
}

// ─── Notifications content ────────────────────────────────────────────────────
function NotificationsContent() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 12, color: "rgba(255,232,236,0.32)" }}>Bạn có 2 thông báo chưa đọc</p>
        <button style={{ background: "none", border: "none", color: BRAND, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Đánh dấu đã đọc</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { t: "Nhân sự", txt: "Chúc mừng sinh nhật tháng 6!", clr: "#8b5cf6" },
          { t: "Hệ thống", txt: "Hệ thống sẽ bảo trì vào 12:00 Chủ Nhật", clr: "#f59e0b" },
          { t: "Nghỉ phép", txt: "Đơn xin nghỉ phép của bạn đã được duyệt", clr: "#22c55e" },
        ].map((n, i) => (
          <div key={i} style={{ display: "flex", gap: 14, padding: "14px", background: i < 2 ? "rgba(255,255,255,0.03)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: i < 2 ? BRAND : "transparent", marginTop: 6, flexShrink: 0 }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6, color: n.clr, background: `${n.clr}20` }}>{n.t}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Hôm qua</span>
              </div>
              <p style={{ fontSize: 13, color: i < 2 ? "#FFE8EC" : "rgba(255,232,236,0.6)", fontWeight: i < 2 ? 600 : 400 }}>{n.txt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings content ─────────────────────────────────────────────────────────
function SettingsContent({ onLogout }: { onLogout: () => void }) {
  const [vals, setVals] = useState(["", "", ""]);
  const [shows, setShows] = useState([false, false, false]);
  const [saved, setSaved] = useState(false);
  const labels = ["Mật khẩu cũ", "Mật khẩu mới", "Xác nhận mật khẩu mới"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Avatar Update */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: `linear-gradient(135deg, ${BRAND}, ${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff" }}>TL</div>
        <button style={{ ...BTN_S, width: "auto", padding: "8px 16px", fontSize: 12, display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFE8EC", boxShadow: "none" }}><Plus size={14} /> Thay ảnh đại diện</button>
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

      <SectionLabel>Đổi mật khẩu</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {labels.map((label, i) => (
          <div key={label}>
            <FieldLabel>{label}</FieldLabel>
            <div style={{ position: "relative" }}>
              <input type={shows[i] ? "text" : "password"} value={vals[i]} onChange={e => setVals(p => p.map((v, idx) => idx === i ? e.target.value : v))} placeholder="••••••••" style={{ ...INPUT_S, paddingRight: 40 }} />
              <button type="button" onClick={() => setShows(p => p.map((v, idx) => idx === i ? !v : v))} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer" }}>
                {shows[i] ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        ))}
        {saved && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, background: "rgba(34,197,94,0.09)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", fontSize: 13, fontWeight: 600 }}><CheckCircle2 size={14} /> Đổi mật khẩu thành công!</div>}
        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }} style={BTN_S}>Cập nhật mật khẩu</button>
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 0" }} />

      <SectionLabel>Quản lý phiên đăng nhập</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
          <div>
            <p style={{ fontSize: 13, color: "#FFE8EC", fontWeight: 700 }}>Windows • Chrome</p>
            <p style={{ fontSize: 11, color: "rgba(255,232,236,0.4)", marginTop: 2 }}>Đang hoạt động (Hiện tại)</p>
          </div>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.6)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "transparent", borderRadius: 12, border: "1px solid rgba(255,255,255,0.02)" }}>
          <div>
            <p style={{ fontSize: 13, color: "rgba(255,232,236,0.6)", fontWeight: 600 }}>iPhone 14 Pro • Safari</p>
            <p style={{ fontSize: 11, color: "rgba(255,232,236,0.3)", marginTop: 2 }}>Đăng nhập 2 ngày trước</p>
          </div>
          <button style={{ border: "none", color: "#ff5555", fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "4px 8px", background: "rgba(255,85,85,0.1)", borderRadius: 6 }}>Đăng xuất</button>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={onLogout} style={{ ...BTN_S, background: "rgba(232,35,26,0.1)", color: "#FF5555", boxShadow: "none" }}>Đăng xuất khỏi hệ thống</button>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function UserPortalApp({ onLogout }: { onLogout: () => void }) {
  const [activePage, setActivePage] = useState<BubbleId | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [hovId, setHovId] = useState<BubbleId | null>(null);

  const handleBubbleClick = (id: BubbleId) => setActivePage(id);

  // Individual float keyframe values per bubble for organic feel
  const floatKeyframes = BUBBLES.map(b => `
    @keyframes floatBubble${b.id} {
      0%, 100% { transform: translateY(0px); }
      33%       { transform: translateY(-${4 + (b.delay * 1.5).toFixed(0)}px) rotate(${(b.delay * 0.2).toFixed(1)}deg); }
      66%       { transform: translateY(-${2 + (b.dur * 0.4).toFixed(0)}px) rotate(${(-b.delay * 0.1).toFixed(1)}deg); }
    }
  `).join("\n");

  return (
    <div
      style={{
        width: "100vw", height: "100vh", overflow: "hidden",
        background: `
          radial-gradient(ellipse at 10% 90%, rgba(220,20,35,0.4) 0%, transparent 55%),
          radial-gradient(ellipse at 90% 5%,  rgba(200,80,0,0.2) 0%, transparent 55%),
          radial-gradient(ellipse at 50% 55%, rgba(140,20,30,0.15)  0%, transparent 50%),
          linear-gradient(165deg, #2A040B 0%, #160205 60%, #0F0103 100%)`,
        fontFamily: "'Outfit', sans-serif",
        color: "#FFE8EC",
        position: "relative",
      }}
    >
      <style>{`
        ${floatKeyframes}
        @keyframes pulseRing {
          0%   { transform: scale(1);    opacity: 0.65; }
          100% { transform: scale(1.65); opacity: 0;    }
        }
        @keyframes colon-blink {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.07; }
        }
        ::placeholder { color: rgba(255,232,236,0.2); }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(232,35,26,0.2); border-radius: 99px; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5) sepia(1) hue-rotate(310deg); }
        select option { background: #180306; color: #FFE8EC; }
      `}</style>

      <AmbientBg />

      {/* Home view — always rendered below any panel */}
      <div style={{ position: "relative", width: "100%", height: "100%", zIndex: 1, filter: activePage ? "blur(2px) brightness(0.5)" : "none", transition: "filter 0.4s ease", pointerEvents: activePage ? "none" : "auto" }}>
        <FloatingClock />

        {/* Logo watermark */}
        <div style={{ position: "absolute", bottom: 24, right: 24, opacity: 0.12 }}>
          <ImageWithFallback src={dudiLogo} alt="DUDI Software" style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover" }} />
        </div>

        {/* Bubbles layer */}
        <div style={{ position: "absolute", inset: 0 }}>
          {BUBBLES.map(b => (
            <Bubble key={b.id} b={b} hovId={hovId} setHovId={setHovId} onClick={handleBubbleClick} />
          ))}
        </div>

        {/* Hint text */}
        {!hovId && !activePage && (
          <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 600, color: "rgba(255,232,236,0.18)", letterSpacing: "0.16em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
            Nhấp vào bong bóng để mở
          </div>
        )}
      </div>

      {/* Panel overlay */}
      {activePage && (
        <Panel
          activePage={activePage}
          onClose={() => setActivePage(null)}
          checkedIn={checkedIn}
          setCheckedIn={setCheckedIn}
          onLogout={onLogout}
        />
      )}
    </div>
  );
}
