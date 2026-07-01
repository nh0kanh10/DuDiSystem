import { useState, useEffect } from "react";
import {
  Fingerprint, User, CalendarDays, ClipboardList, Settings,
  X, CheckCircle2, Lock, Eye, EyeOff, Plus, ArrowLeft,
  Bell, CheckSquare, Search, MessageCircle, Users, Phone, Mail,
  FileDown, Zap, FileText, Download, Send, Paperclip, Loader2, RefreshCw
} from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import dudiLogo from "../../../imports/avatar.jpg";
import { useEmployeeAttendance } from "../../hooks/useEmployeeAttendance";
import { useMyTasks } from "../../hooks/useMyTasks";
import { useNotifications } from "../../hooks/useNotifications";
import { hasStaffModule, LIVE_STAFF_BUBBLES } from "../../utils/staffModules";
import { fmtIsoDate, weekdayFromIso, formatAttendanceTimes, ATT_STATUS_LABEL } from "../cham-cong/attendanceDisplay";
import { EMPLOYEE_KIND, internSessionRange } from "../cham-cong/attendanceModel";
import { todayISO } from "../../hooks/useEmployeeAttendance";
import LeaveRequestPanel from "../nghi-phep/LeaveRequestPanel";
import type { Employee, WorkHistoryEntry } from "../../types";
import { api } from "@/lib/api"
import { CrmStaffPage } from "../crm/CrmStaffPage";

const BRAND = "#E8231A";          // exact DUDI red
const CRIMSON = "#C01525";          // deeper variant for depth
const GOLD = "#FF8800";          // ember gold complement
const BG = "#2a0a0f";          // even brighter warm ruby
const GR = "rgba(232,35,26,0.28)";   // red glow
const GG = "rgba(255,136,0,0.14)";   // gold glow

const PANEL_BG: React.CSSProperties = {
  background: "rgba(32,8,12,0.94)",
  backdropFilter: "blur(36px)",
  WebkitBackdropFilter: "blur(36px)",
  border: `1px solid rgba(255,255,255,0.08)`,
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

function empInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function fmtAddr(...parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(", ") || "—";
}

const EMP_STATUS_LABEL: Record<string, string> = {
  active: "Đang làm việc",
  inactive: "Đã nghỉ",
  intern: "Thực tập",
};

const TASK_STATUS_LABEL: Record<string, string> = {
  todo: "Chưa làm",
  "in-progress": "Đang làm",
  done: "Đã xong",
};

const TASK_STATUS_COLOR: Record<string, { c: string; bg: string }> = {
  todo: { c: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.06)" },
  "in-progress": { c: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  done: { c: "#22c55e", bg: "rgba(34,197,94,0.08)" },
};

type BubbleId = "checkin" | "employee" | "leave" | "tasks" | "settings" | "chat" | "workflow" | "notifications" | "crm";

const BUBBLES: {
  id: BubbleId; label: string; sub: string; emoji: string | React.ReactNode;
  lx: string; ty: string; size: number; dur: number; delay: number; isCenter?: boolean;
}[] = [
    { id: "checkin", label: "Check-in", sub: "Chấm công", emoji: "⚡", lx: "50%", ty: "48%", size: 200, dur: 8.8, delay: 0, isCenter: true },
    {
      id: "employee", label: "Hồ sơ", sub: "Cá nhân",
      emoji: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="36" height="36" color="#FF8800" style={{ filter: "drop-shadow(0 0 8px rgba(255,136,0,0.4))" }}>
          <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
        </svg>
      ),
      lx: "22%", ty: "28%", size: 140, dur: 9.3, delay: 0.6
    },
    {
      id: "leave", label: "Xin nghỉ", sub: "Tạo đơn · Lịch sử",
      emoji: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="36" height="36" color="#FF8800" style={{ filter: "drop-shadow(0 0 8px rgba(255,136,0,0.4))" }}>
          <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd" />
        </svg>
      ),
      lx: "78%", ty: "28%", size: 140, dur: 8.9, delay: 1.1
    },
    {
      id: "workflow", label: "Quy trình", sub: "Trình duyệt",
      emoji: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="36" height="36" color="#FF8800" style={{ filter: "drop-shadow(0 0 8px rgba(255,136,0,0.4))" }}>
          <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
          <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
        </svg>
      ),
      lx: "88%", ty: "55%", size: 136, dur: 9.8, delay: 1.5
    },
    {
      id: "tasks", label: "Công việc", sub: "Quản lý task",
      emoji: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="36" height="36" color="#FF8800" style={{ filter: "drop-shadow(0 0 8px rgba(255,136,0,0.4))" }}>
          <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 0 1 8.75 1h2.5A2.75 2.75 0 0 1 14 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 0 1 6 4.193V3.75Zm6.5 0v.325a41.622 41.622 0 0 0-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25ZM10 10a1 1 0 0 0-1 1v.01a1 1 0 0 0 1 1h.01a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1H10Z" clipRule="evenodd" />
          <path d="M3 15.055v-.684c.126.053.255.1.39.142 2.092.642 4.313.987 6.61.987 2.297 0 4.518-.345 6.61-.987.135-.041.264-.089.39-.142v.684c0 1.347-.985 2.53-2.363 2.686a41.454 41.454 0 0 1-9.274 0C3.985 17.585 3 16.402 3 15.055Z" />
        </svg>
      ),
      lx: "12%", ty: "55%", size: 136, dur: 9.6, delay: 0.4
    },
    {
      id: "chat", label: "Tin nhắn", sub: "Chat nội bộ",
      emoji: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="36" height="36" color="#FF8800" style={{ filter: "drop-shadow(0 0 8px rgba(255,136,0,0.4))" }}>
          <path fillRule="evenodd" d="M12 2.25c-2.429 0-4.817.178-7.152.521C2.87 3.061 1.5 4.795 1.5 6.741v6.018c0 1.946 1.37 3.68 3.348 3.97.877.129 1.761.234 2.652.316V21a.75.75 0 0 0 1.28.53l4.184-4.183a.39.39 0 0 1 .266-.112c2.006-.05 3.982-.22 5.922-.506 1.978-.29 3.348-2.023 3.348-3.97V6.741c0-1.947-1.37-3.68-3.348-3.97A49.145 49.145 0 0 0 12 2.25ZM8.25 8.625a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Zm2.625 1.125a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875-1.125a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z" clipRule="evenodd" />
        </svg>
      ),
      lx: "70%", ty: "80%", size: 128, dur: 9.2, delay: 1.2
    },
    {
      id: "settings", label: "Cài đặt", sub: "Tài khoản",
      emoji: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="36" height="36" color="#FF8800" style={{ filter: "drop-shadow(0 0 8px rgba(255,136,0,0.4))" }}>
          <path d="M13.024 9.25c.47 0 .827-.433.637-.863a4 4 0 0 0-4.094-2.364c-.468.05-.665.576-.43.984l1.08 1.868a.75.75 0 0 0 .649.375h2.158ZM7.84 7.758c-.236-.408-.79-.5-1.068-.12A3.982 3.982 0 0 0 6 10c0 .884.287 1.7.772 2.363.278.38.832.287 1.068-.12l1.078-1.868a.75.75 0 0 0 0-.75L7.839 7.758ZM9.138 12.993c-.235.408-.039.934.43.984a4 4 0 0 0 4.094-2.364c.19-.43-.168-.863-.638-.863h-2.158a.75.75 0 0 0-.65.375l-1.078 1.868Z" />
          <path fillRule="evenodd" d="m14.13 4.347.644-1.117a.75.75 0 0 0-1.299-.75l-.644 1.116a6.954 6.954 0 0 0-2.081-.556V1.75a.75.75 0 0 0-1.5 0v1.29a6.954 6.954 0 0 0-2.081.556L6.525 2.48a.75.75 0 1 0-1.3.75l.645 1.117A7.04 7.04 0 0 0 4.347 5.87L3.23 5.225a.75.75 0 1 0-.75 1.3l1.116.644A6.954 6.954 0 0 0 3.04 9.25H1.75a.75.75 0 0 0 0 1.5h1.29c.078.733.27 1.433.556 2.081l-1.116.645a.75.75 0 1 0 .75 1.298l1.117-.644a7.04 7.04 0 0 0 1.523 1.523l-.645 1.117a.75.75 0 1 0 1.3.75l.644-1.116a6.954 6.954 0 0 0 2.081.556v1.29a.75.75 0 0 0 1.5 0v-1.29a6.954 6.954 0 0 0 2.081-.556l.645 1.116a.75.75 0 0 0 1.299-.75l-.645-1.117a7.042 7.042 0 0 0 1.523-1.523l1.117.644a.75.75 0 0 0 .75-1.298l-1.116-.645a6.954 6.954 0 0 0 .556-2.081h1.29a.75.75 0 0 0 0-1.5h-1.29a6.954 6.954 0 0 0-.556-2.081l1.116-.644a.75.75 0 0 0-.75-1.3l-1.117.645a7.04 7.04 0 0 0-1.524-1.523ZM10 4.5a5.475 5.475 0 0 0-2.781.754A5.527 5.527 0 0 0 5.22 7.277 5.475 5.475 0 0 0 4.5 10a5.475 5.475 0 0 0 .752 2.777 5.527 5.527 0 0 0 2.028 2.004c.802.458 1.73.719 2.72.719a5.474 5.474 0 0 0 2.78-.753 5.527 5.527 0 0 0 2.001-2.027c.458-.802.719-1.73.719-2.72a5.475 5.475 0 0 0-.753-2.78 5.528 5.528 0 0 0-2.028-2.002A5.475 5.475 0 0 0 10 4.5Z" clipRule="evenodd" />
        </svg>
      ),
      lx: "30%", ty: "80%", size: 128, dur: 8.4, delay: 1.8
    },
    {
      id: "notifications", label: "Thông báo", sub: "Hệ thống",
      emoji: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="36" height="36" color="#FF8800" style={{ filter: "drop-shadow(0 0 8px rgba(255,136,0,0.4))" }}>
          <path d="M4.214 3.227a.75.75 0 0 0-1.156-.955 8.97 8.97 0 0 0-1.856 3.825.75.75 0 0 0 1.466.316 7.47 7.47 0 0 1 1.546-3.186ZM16.942 2.272a.75.75 0 0 0-1.157.955 7.47 7.47 0 0 1 1.547 3.186.75.75 0 0 0 1.466-.316 8.971 8.971 0 0 0-1.856-3.825Z" />
          <path fillRule="evenodd" d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.91 32.91 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.903 32.903 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.448 11.448 0 0 1 16 8a6 6 0 0 0-6-6Zm0 14.5a2 2 0 0 1-1.95-1.557 33.54 33.54 0 0 0 3.9 0A2 2 0 0 1 10 16.5Z" clipRule="evenodd" />
        </svg>
      ),
      lx: "50%", ty: "88%", size: 128, dur: 8.7, delay: 0.5
    },
    {
      id: "crm", label: "CRM", sub: "Khách hàng",
      emoji: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="36" height="36" color="#FF8800" style={{ filter: "drop-shadow(0 0 8px rgba(255,136,0,0.4))" }}>
          <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
        </svg>
      ),
      lx: "50%", ty: "15%", size: 128, dur: 9.1, delay: 0.9
    },
  ];

function SectionLabel({ children }: { children: string }) {
  return <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,232,236,0.65)", marginBottom: 14 }}>{children}</p>;
}

function FieldLabel({ children }: { children: string }) {
  return <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,232,236,0.65)", marginBottom: 6 }}>{children}</p>;
}

function FieldBox({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 12px", color: "#FFFFFF", fontSize: 13, fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit" }}>
      {children}
    </div>
  );
}

function AmbientBg() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {/* Large red glow bottom-left */}
      <div style={{ position: "absolute", bottom: "-10%", left: "-15%", width: "80vw", height: "80vw", borderRadius: "50%", background: `radial-gradient(circle, rgba(220,30,40,0.45) 0%, transparent 75%)` }} />
      {/* Gold glow top-right */}
      <div style={{ position: "absolute", top: "-15%", right: "-10%", width: "60vw", height: "60vw", borderRadius: "50%", background: `radial-gradient(circle, rgba(255,120,0,0.3) 0%, transparent 70%)` }} />
      {/* Massive Gold glow bottom-right to eliminate black spots */}
      <div style={{ position: "absolute", bottom: "-20%", right: "-15%", width: "75vw", height: "75vw", borderRadius: "50%", background: `radial-gradient(circle, rgba(255,140,0,0.25) 0%, transparent 75%)` }} />
      {/* Subtle center glow */}
      <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: "55vw", height: "55vw", borderRadius: "50%", background: `radial-gradient(circle, rgba(255,60,50,0.25) 0%, transparent 75%)` }} />
    </div>
  );
}

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

function Bubble({ b, hovId, setHovId, onClick, badge }: {
  b: typeof BUBBLES[0];
  hovId: BubbleId | null;
  setHovId: (id: BubbleId | null) => void;
  onClick: (id: BubbleId, e: React.MouseEvent) => void;
  badge?: number;
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
      {b.isCenter && (
        <>
          <div style={{ position: "absolute", inset: -16, borderRadius: "50%", border: `1.5px solid rgba(232,35,26,0.4)`, animation: "pulseRing 2.4s ease-out infinite", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: -32, borderRadius: "50%", border: `1px solid rgba(232,35,26,0.2)`, animation: "pulseRing 2.4s ease-out 0.8s infinite", pointerEvents: "none" }} />
        </>
      )}
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
              ? `radial-gradient(circle at 35% 30%, rgba(232,35,26,0.48), rgba(120,10,18,0.35))`
              : `radial-gradient(circle at 35% 30%, rgba(232,35,26,0.35), rgba(120,10,18,0.25))`
            : b.isCenter
              ? `radial-gradient(circle at 35% 30%, rgba(232,35,26,0.32), rgba(90,8,14,0.22))`
              : `radial-gradient(circle at 35% 30%, rgba(232,35,26,0.22), rgba(70,6,12,0.12))`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: isHov
            ? `1px solid rgba(240,100,90,0.55)`
            : b.isCenter
              ? `1px solid rgba(232,80,80,0.42)`
              : `1px solid rgba(220,60,55,0.3)`,
          boxShadow: isHov ? hovGlow : baseGlow,
        }}
      >
        <span style={{ fontSize: b.isCenter ? 36 : 28, lineHeight: 1, userSelect: "none" }}>
          {b.emoji}
          {b.id === "notifications" && badge != null && badge > 0 && (
            <div style={{ position: "absolute", top: 12, right: 12, width: 22, height: 22, borderRadius: "50%", background: "#ff5555", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff", border: "2px solid #0C0102", boxShadow: "0 0 10px rgba(255,85,85,0.8)" }}>{badge > 9 ? "9+" : badge}</div>
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

function Panel({ activePage, onClose, onLogout, employee }: {
  activePage: BubbleId;
  onClose: () => void;
  onLogout: () => void;
  employee: Employee | null;
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
    chat: "Chat nội bộ",
    workflow: "Quy trình nội bộ",
    notifications: "Thông báo hệ thống",
    crm: "Data khách hàng",
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
          maxWidth: activePage === "leave" ? 920 : 640,
          maxHeight: "86vh",
          overflowY: "auto",
          position: "relative",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.95) translateY(20px)",
          transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(232,35,26,0.18) transparent",
        }}
      >
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

        <div style={{ padding: "20px 24px 28px" }}>
          {activePage === "checkin" && <CheckinContent />}
          {activePage === "employee" && (
            employee
              ? <EmployeeContent employee={employee} />
              : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 0", color: "rgba(255,232,236,0.5)" }}>
                  <Loader2 size={20} className="animate-spin" />
                  <span style={{ fontSize: 13 }}>Đang tải hồ sơ...</span>
                </div>
              )
          )}
          {activePage === "leave" && (
            employee
              ? <LeaveContent employee={employee} />
              : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 0", color: "rgba(255,232,236,0.5)" }}>
                  <Loader2 size={20} className="animate-spin" />
                  <span style={{ fontSize: 13 }}>Đang tải hồ sơ...</span>
                </div>
              )
          )}
          {activePage === "tasks" && <TasksContent employeeId={employee?.id} />}
          {activePage === "chat" && <ChatContent />}
          {activePage === "workflow" && <WorkflowContent />}
          {activePage === "notifications" && <NotificationsContent />}
          {activePage === "settings" && <SettingsContent onLogout={onLogout} />}
          {activePage === "crm" && <CrmStaffContent />}
        </div>
      </div>
    </div>
  );
}

function CheckinContent() {
  const {
    isIntern, todayRecord, history, monthStats,
    loading, punching, error, punch, punchLabel, statusText, reload,
  } = useEmployeeAttendance();
  const [hms, setHms] = useState({ h: "00", m: "00", s: "00" });

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setHms({ h: String(n.getHours()).padStart(2, "0"), m: String(n.getMinutes()).padStart(2, "0"), s: String(n.getSeconds()).padStart(2, "0") });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const working = !punchLabel.done && statusText === "Đang làm việc";
  const todayKey = todayISO();
  const statusColor = (status: string) => {
    if (status === "on-time") return { c: "#22c55e", bg: "rgba(34,197,94,0.15)" };
    if (status === "late" || status === "early" || status === "late_early") return { c: "#f59e0b", bg: "rgba(245,158,11,0.15)" };
    if (status === "absent") return { c: "#ff5555", bg: "rgba(255,85,85,0.15)" };
    if (status === "leave") return { c: "#a78bfa", bg: "rgba(167,139,250,0.15)" };
    return { c: "rgba(255,232,236,0.6)", bg: "rgba(255,255,255,0.06)" };
  };
  const kpis = [
    { l: "Đúng giờ", v: monthStats.onTime, c: "#22c55e", g: "rgba(34,197,94,0.22)" },
    { l: "Trễ / sớm", v: monthStats.late, c: "#f59e0b", g: "rgba(245,158,11,0.22)" },
    { l: "Vắng / nghỉ", v: monthStats.absent + monthStats.leave, c: "#ff5555", g: "rgba(255,85,85,0.22)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      {error && (
        <p style={{ fontSize: 12, color: "#ff8888", textAlign: "center", maxWidth: 320 }}>{error}</p>
      )}
      <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,232,236,0.45)", letterSpacing: "0.08em" }}>
        {isIntern ? `${EMPLOYEE_KIND.intern.label} · theo buổi` : `${EMPLOYEE_KIND.staff.label} · theo ngày`} · {statusText}
      </p>

      <div style={{ display: "flex", alignItems: "baseline", gap: "0.04em", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, lineHeight: 1 }}>
        <span style={{ fontSize: 48, color: BRAND, textShadow: `0 0 24px ${GR}` }}>{hms.h}</span>
        <span style={{ fontSize: 48, color: BRAND, opacity: 0.3, animation: "colon-blink 1s step-end infinite" }}>:</span>
        <span style={{ fontSize: 48, color: BRAND, textShadow: `0 0 24px ${GR}` }}>{hms.m}</span>
        <span style={{ fontSize: 16, color: "rgba(232,35,26,0.5)", marginLeft: 6, alignSelf: "flex-start", marginTop: 6 }}>{hms.s}</span>
      </div>

      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {!working && !punchLabel.done && (
          <>
            <div style={{ position: "absolute", width: 136, height: 136, borderRadius: "50%", border: `1.5px solid ${BRAND}`, animation: "pulseRing 2.2s ease-out infinite", pointerEvents: "none" }} />
            <div style={{ position: "absolute", width: 136, height: 136, borderRadius: "50%", border: `1px solid ${BRAND}`, animation: "pulseRing 2.2s ease-out 0.75s infinite", pointerEvents: "none" }} />
          </>
        )}
        <button
          onClick={punch}
          disabled={loading || punching || punchLabel.done}
          style={{
            width: 112, height: 112, borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
            border: "none", cursor: punchLabel.done ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 900, color: "#fff", opacity: punchLabel.done ? 0.5 : 1,
            background: working ? "linear-gradient(135deg, #22c55e, #16a34a)" : `linear-gradient(135deg, ${BRAND}, ${GOLD})`,
            boxShadow: working ? "0 0 30px rgba(34,197,94,0.55)" : `0 0 30px ${GR}, 0 0 60px rgba(232,35,26,0.12)`,
          }}
        >
          {punching ? <Loader2 size={34} className="animate-spin" /> : <Fingerprint size={34} strokeWidth={1.5} />}
          <span style={{ fontSize: 8, letterSpacing: "0.1em", textAlign: "center", padding: "0 6px" }}>{punchLabel.label.toUpperCase()}</span>
        </button>
      </div>

      {todayRecord && (
        <div style={{ fontSize: 11, color: "rgba(255,232,236,0.5)", textAlign: "center", fontFamily: "monospace", lineHeight: 1.6 }}>
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

      <p style={{ fontSize: 12, color: "rgba(255,232,236,0.25)" }}>
        {punchLabel.done ? "Đã hoàn thành chấm công hôm nay" : working ? "Bấm khi tan ca" : "Bấm khi bắt đầu làm"}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, width: "100%" }}>
        {kpis.map(({ l, v, c, g }) => (
          <div key={l} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "14px 12px", textAlign: "center", boxShadow: `0 0 16px ${g}` }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: c, lineHeight: 1 }}>{loading ? "—" : v}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,232,236,0.38)", marginTop: 5 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ width: "100%", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <SectionLabel>Lịch sử gần đây</SectionLabel>
          <button onClick={reload} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,232,236,0.35)" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.length === 0 && !loading && (
            <p style={{ fontSize: 12, color: "rgba(255,232,236,0.3)", textAlign: "center", padding: 12 }}>Chưa có lịch sử chấm công</p>
          )}
          {history.slice(0, 10).map((item) => {
            const t = formatAttendanceTimes(item);
            const isToday = item.date === todayKey;
            const st = statusColor(item.status);
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#FFE8EC" }}>{fmtIsoDate(item.date)}</p>
                    {isToday && (
                      <span style={{ fontSize: 9, fontWeight: 800, color: BRAND, padding: "2px 6px", background: "rgba(232,35,26,0.15)", borderRadius: 6 }}>HÔM NAY</span>
                    )}
                  </div>
                  <p style={{ fontSize: 10, color: "rgba(255,232,236,0.35)", marginTop: 2 }}>{weekdayFromIso(item.date)}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,232,236,0.45)", marginTop: 4, fontFamily: "monospace" }}>
                    {isIntern ? `${t.primary} | ${t.secondary}` : t.combined}
                  </p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: st.c, padding: "3px 8px", background: st.bg, borderRadius: 8 }}>
                  {ATT_STATUS_LABEL[item.status] ?? item.workingHours ?? item.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EmployeeContent({ employee }: { employee: Employee }) {
  const [activeTab, setActiveTab] = useState(0);
  const hometown = fmtAddr(employee.homeStreet, employee.homeWard, employee.homeDistrict, employee.homeProvince);
  const address = fmtAddr(employee.curStreet, employee.curWard, employee.curDistrict, employee.curProvince);
  const history = employee.workHistory ?? [];

  const FieldGroup = ({ l, v, span }: { l: string, v: React.ReactNode, span?: number }) => (
    <div style={span ? { gridColumn: `span ${span}` } : {}}>
      <FieldLabel>{l}</FieldLabel>
      <FieldBox>{v || "—"}</FieldBox>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: `linear-gradient(135deg, ${BRAND}, ${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff", boxShadow: `0 0 24px ${GR}` }}>
            {empInitials(employee.name)}
          </div>
          <div style={{ position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: "50%", background: employee.status === "inactive" ? "#6b7280" : "#22c55e", border: "2px solid #0C0102", boxShadow: "0 0 8px rgba(34,197,94,0.8)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#FFE8EC", lineHeight: 1.2 }}>{employee.name}</h2>
          <p style={{ fontSize: 12, color: "rgba(255,232,236,0.38)", marginTop: 3 }}>{employee.position}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, color: BRAND, background: "rgba(232,35,26,0.1)", border: `1px solid rgba(232,35,26,0.2)` }}>{employee.department}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.24)" }}>#{employee.id}</span>
          </div>
        </div>
        <div style={{ flexShrink: 0, opacity: 0.35 }}>
          <ImageWithFallback src={dudiLogo} alt="DUDI Software" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", marginTop: 4 }}>
        {["Thông tin chung", "Công việc", "Liên hệ"].map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            style={{
              flex: 1,
              padding: "12px 0",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              color: activeTab === i ? "#fff" : "rgba(255,232,236,0.4)",
              borderBottom: activeTab === i ? `2px solid ${BRAND}` : "2px solid transparent",
              transition: "all 0.2s"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div style={{ padding: "16px 18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FieldGroup l="Mã NV" v={employee.id} />
            <FieldGroup l="Họ tên" v={employee.name} />
            <FieldGroup l="Ngày sinh" v={employee.dob} />
            <FieldGroup l="Giới tính" v={employee.gender} />
            <FieldGroup l="Số CCCD" v={employee.cccd} />
            <FieldGroup l="Nơi cấp" v={employee.cccdPlace} />
            <FieldGroup l="Ngân hàng" v={employee.bank} />
            <FieldGroup l="Số tài khoản" v={employee.bankAccount} />
            <FieldGroup l="Trường học" v={employee.university} span={2} />
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div style={{ padding: "16px 18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FieldGroup l="Phòng ban" v={employee.department} />
            <FieldGroup l="Vị trí" v={employee.position} />
            <FieldGroup l="Loại hợp đồng" v={employee.contractType} />
            <FieldGroup l="Ngày bắt đầu" v={employee.joinDate} />
            <FieldGroup l="Trạng thái" v={EMP_STATUS_LABEL[employee.status] ?? employee.status} span={2} />
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div style={{ padding: "16px 18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FieldGroup l="Email" v={employee.email} span={2} />
            <FieldGroup l="Số điện thoại" v={employee.phone} span={2} />
            <FieldGroup l="Quê quán" v={hometown} span={2} />
            <FieldGroup l="Địa chỉ hiện tại" v={address} span={2} />
          </div>
        </div>
      )}

      <div style={{ padding: "16px 18px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16 }}>
        <SectionLabel>Quá trình công tác</SectionLabel>
        {history.length === 0 ? (
          <p style={{ fontSize: 12, color: "rgba(255,232,236,0.35)" }}>Chưa có dữ liệu</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.map((entry: WorkHistoryEntry, idx: number) => (
              <div key={entry.id} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: idx === 0 ? BRAND : "rgba(255,255,255,0.2)", marginTop: 5, boxShadow: idx === 0 ? `0 0 8px ${BRAND}` : "none" }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: idx === 0 ? 700 : 600, color: idx === 0 ? "#FFE8EC" : "rgba(255,232,236,0.7)" }}>{entry.title}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,232,236,0.4)", marginTop: 2 }}>
                    {[entry.snapshot, entry.date, entry.toDate ? `– ${entry.toDate}` : "– Hiện tại"].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LeaveContent({ employee }: { employee: Employee }) {
  return <LeaveRequestPanel employee={employee} variant="portal" />;
}

function TasksContent({ employeeId }: { employeeId?: string }) {
  const { tasks, loading, error, reload, stats } = useMyTasks(employeeId);
  const today = new Date().toLocaleDateString("vi-VN");
  const todayTasks = tasks.filter(t => t.dueDate === today || (!t.dueDate && (t.status === "todo" || !t.status)));
  const grouped = tasks.reduce<Record<string, typeof tasks>>((acc, t) => {
    const key = t.dueDate || "Không có hạn";
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});
  const groups = Object.entries(grouped).sort(([a], [b]) => {
    if (a === "Không có hạn") return 1;
    if (b === "Không có hạn") return -1;
    return b.localeCompare(a);
  });
  const kpis = [
    { l: "Chưa làm", v: stats.todo, c: "rgba(255,255,255,0.35)", g: "transparent" },
    { l: "Đang làm", v: stats.inProgress, c: "#f59e0b", g: "rgba(245,158,11,0.2)" },
    { l: "Đã xong", v: stats.done, c: "#22c55e", g: "rgba(34,197,94,0.2)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 12, color: "rgba(255,232,236,0.32)" }}>{today}</p>
        <button onClick={reload} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,232,236,0.35)" }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p style={{ fontSize: 12, color: "#ff8888" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {kpis.map(({ l, v, c, g }) => (
          <div key={l} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "14px", boxShadow: g !== "transparent" ? `0 0 16px ${g}` : "none" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: c, lineHeight: 1, textShadow: g !== "transparent" ? `0 0 12px ${g}` : "none" }}>{loading ? "—" : v}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,232,236,0.32)", marginTop: 5 }}>{l}</div>
          </div>
        ))}
      </div>

      {!loading && todayTasks.length === 0 && (
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "20px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#FFE8EC" }}>Hôm nay không có công việc</p>
          <p style={{ fontSize: 11, color: "rgba(255,232,236,0.3)", marginTop: 3 }}>{today}</p>
        </div>
      )}

      <div>
        <SectionLabel>Nhật ký công việc</SectionLabel>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 16, color: "rgba(255,232,236,0.4)" }}>
            <Loader2 size={16} className="animate-spin" />
            <span style={{ fontSize: 12 }}>Đang tải...</span>
          </div>
        )}
        {!loading && groups.length === 0 && (
          <p style={{ fontSize: 12, color: "rgba(255,232,236,0.35)", padding: "8px 0" }}>Chưa có công việc được giao</p>
        )}
        {groups.map(([date, items], idx) => (
          <div key={date} style={{ display: "flex", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: BRAND, boxShadow: `0 0 8px ${BRAND}`, marginTop: 2, flexShrink: 0 }} />
              {idx < groups.length - 1 && <div style={{ width: 1, flex: 1, background: "rgba(232,35,26,0.15)", marginTop: 4 }} />}
            </div>
            <div style={{ flex: 1, paddingBottom: idx < groups.length - 1 ? 18 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>{date}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {items.map(item => {
                  const st = item.status || "todo";
                  const colors = TASK_STATUS_COLOR[st] ?? TASK_STATUS_COLOR.todo;
                  return (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 11, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <CheckCircle2 size={13} style={{ color: st === "done" ? "#22c55e" : "rgba(255,255,255,0.25)", filter: st === "done" ? "drop-shadow(0 0 4px rgba(34,197,94,0.6))" : "none", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "#FFE8EC" }}>{item.title}</span>
                      </div>
                      <span style={{ padding: "3px 9px", borderRadius: 99, fontSize: 10, fontWeight: 700, color: colors.c, background: colors.bg, border: `1px solid ${colors.c}30`, flexShrink: 0, marginLeft: 8 }}>
                        {TASK_STATUS_LABEL[st] ?? st}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

function CrmStaffContent() {
  return (
    <div style={{ margin: "0 -24px -28px" }}>
      <CrmStaffPage />
    </div>
  );
}

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

function NotificationsContent() {
  const { items, loading, error, unread, markAllRead, markRead, reload } = useNotifications();
  const typeColor = (type?: string) => {
    if (type === "leave" || type === "nghỉ phép") return "#22c55e";
    if (type === "system" || type === "hệ thống") return "#f59e0b";
    if (type === "hr" || type === "nhân sự") return "#8b5cf6";
    return BRAND;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 12, color: "rgba(255,232,236,0.32)" }}>
          {unread > 0 ? `Bạn có ${unread} thông báo chưa đọc` : "Không có thông báo mới"}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={reload} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,232,236,0.35)" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ background: "none", border: "none", color: BRAND, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Đánh dấu đã đọc</button>
          )}
        </div>
      </div>

      {error && <p style={{ fontSize: 12, color: "#ff8888" }}>{error}</p>}

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 16, color: "rgba(255,232,236,0.4)" }}>
          <Loader2 size={16} className="animate-spin" />
          <span style={{ fontSize: 12 }}>Đang tải...</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!loading && items.length === 0 && (
          <p style={{ fontSize: 12, color: "rgba(255,232,236,0.35)", textAlign: "center", padding: 16 }}>Chưa có thông báo</p>
        )}
        {items.map((n) => {
          const clr = typeColor(n.type);
          const isUnread = !n.read;
          return (
            <div
              key={n.id}
              onClick={() => { if (isUnread) markRead(n.id); }}
              style={{ display: "flex", gap: 14, padding: "14px", background: isUnread ? "rgba(255,255,255,0.03)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: isUnread ? "pointer" : "default" }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: isUnread ? BRAND : "transparent", marginTop: 6, flexShrink: 0 }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  {n.type && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6, color: clr, background: `${clr}20` }}>{n.type}</span>
                  )}
                  {n.time && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{n.time}</span>}
                </div>
                <p style={{ fontSize: 13, color: isUnread ? "#FFE8EC" : "rgba(255,232,236,0.6)", fontWeight: isUnread ? 600 : 400 }}>{n.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettingsContent({ onLogout }: { onLogout: () => void }) {
  const [vals, setVals] = useState(["", "", ""]);
  const [shows, setShows] = useState([false, false, false]);
  const [saved, setSaved] = useState(false);
  const labels = ["Mật khẩu cũ", "Mật khẩu mới", "Xác nhận mật khẩu mới"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

const BUBBLE_MODULE_MAP: Record<BubbleId, string> = {
  checkin: "user-attendance",
  employee: "user-profile",
  leave: "user-timeoff",
  tasks: "cong-viec",
  settings: "user-settings",
  chat: "user-chat",
  workflow: "user-workflow",
  notifications: "thong-bao",
  crm: "user-crm",
};

export default function UserPortalApp({ onLogout, modules = [], embed = false }: { onLogout: () => void; modules?: string[]; embed?: boolean }) {
  const [activePage, setActivePage] = useState<BubbleId | null>(null);
  const [hovId, setHovId] = useState<BubbleId | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const { unread: notifUnread } = useNotifications();

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        const raw = localStorage.getItem("dudi_user");
        const user = raw ? JSON.parse(raw) : null;
        const empId = user?.employeeId;
        if (empId) {
          const found = await api.employees.getById(empId) as Employee;
          setEmployee(found);
          return;
        }
        const key = String(user?.email || "").toLowerCase();
        if (!key) return;
        const list = (await api.employees.list()) as Employee[];
        const found = list.find(e => (e.email || "").toLowerCase() === key);
        if (found) setEmployee(found);
      } catch {
      }
    };
    loadEmployee();
  }, []);

  const handleBubbleClick = (id: BubbleId) => setActivePage(id);

  const allowedBubbles = BUBBLES.filter(b => {
    if (!LIVE_STAFF_BUBBLES.has(b.id)) return false;
    const moduleKey = BUBBLE_MODULE_MAP[b.id];
    return hasStaffModule(modules, moduleKey);
  });

  // Individual float keyframe values per bubble for organic feel
  const floatKeyframes = allowedBubbles.map(b => `
    @keyframes floatBubble${b.id} {
      0%, 100% { transform: translateY(0px); }
      33%       { transform: translateY(-${4 + (b.delay * 1.5).toFixed(0)}px) rotate(${(b.delay * 0.2).toFixed(1)}deg); }
      66%       { transform: translateY(-${2 + (b.dur * 0.4).toFixed(0)}px) rotate(${(-b.delay * 0.1).toFixed(1)}deg); }
    }
  `).join("\n");

  return (
    <div
      style={{
        width: embed ? "100%" : "100vw",
        height: embed ? "100%" : "100vh",
        overflow: "hidden",
        background: `
          radial-gradient(ellipse at 10% 90%, rgba(220,20,35,0.4) 0%, transparent 55%),
          radial-gradient(ellipse at 90% 5%,  rgba(200,80,0,0.2) 0%, transparent 55%),
          radial-gradient(ellipse at 50% 55%, rgba(140,20,30,0.15)  0%, transparent 50%),
          linear-gradient(165deg, #2A040B 0%, #160205 60%, #0F0103 100%)`,
        fontFamily: "'Outfit', sans-serif",
        color: "#FFE8EC",
        position: embed ? "absolute" : "relative",
        inset: embed ? 0 : undefined,
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

      <div style={{ position: "relative", width: "100%", height: "100%", zIndex: 1, filter: activePage ? "blur(2px) brightness(0.5)" : "none", transition: "filter 0.4s ease", pointerEvents: activePage ? "none" : "auto" }}>
        <FloatingClock />

        <div style={{ position: "absolute", bottom: 24, right: 24, opacity: 0.12 }}>
          <ImageWithFallback src={dudiLogo} alt="DUDI Software" style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover" }} />
        </div>

        <div style={{ position: "absolute", inset: 0 }}>
          {allowedBubbles.map(b => (
            <Bubble key={b.id} b={b} hovId={hovId} setHovId={setHovId} onClick={handleBubbleClick} badge={b.id === "notifications" ? notifUnread : undefined} />
          ))}
        </div>


      </div>

      {activePage && (
        <Panel
          activePage={activePage}
          onClose={() => setActivePage(null)}
          onLogout={onLogout}
          employee={employee}
        />
      )}
    </div>
  );
}
