import { useState, useEffect, useRef } from "react";
import {
  User,
  CalendarDays,
  ClipboardList,
  Settings,
  X,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Home,
  Bell,
  CheckSquare,
  Search,
  Users,
  Phone,
  Mail,
  FileDown,
  Zap,
  FileText,
  Download,
  Send,
  Paperclip,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import dudiLogo from "../../../imports/avatar.jpg";
import { useMyTasks } from "../../hooks/useMyTasks";
import {
  useNotifications,
  type StaffNotification,
} from "../../hooks/useNotifications";
import { useEmployeeDirectory } from "../../hooks/useEmployeeDirectory";
import {
  hasStaffModule,
  LIVE_STAFF_BUBBLES,
  getStaffPortalModules,
} from "../../utils/staffModules";
import UserAttendance from "./UserAttendance";
import UserTasks from "./UserTasks";
import UserChatWidget from "./UserChatWidget";
import LeaveRequestPanel from "../nghi-phep/LeaveRequestPanel";
import type { Announcement, Employee, WorkHistoryEntry } from "../../types";
import { api } from "@/lib/api";
import { CrmStaffPage } from "../crm/CrmStaffPage";
import { Modal, ModalCancelButton } from "../ui/Modal";
import { EmployeeModal } from "../nhan-su/EmployeeManagement";
const BRAND = "#E8231A"; 
const CRIMSON = "#C01525"; 
const GOLD = "#FF8800"; 
const BG = "#2a0a0f"; 
const GR = "rgba(232,35,26,0.28)"; 
const GG = "rgba(255,136,0,0.14)"; 
const INPUT_S: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid rgba(36,20,22,0.12)",
  borderRadius: 12,
  color: "#241416",
  fontSize: 14,
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
  if (parts.length >= 2)
    return (
      parts[parts.length - 2][0] + parts[parts.length - 1][0]
    ).toUpperCase();
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
  todo: { c: "#6f565a", bg: "#f3eeee" },
  "in-progress": { c: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  done: { c: "#22c55e", bg: "rgba(34,197,94,0.08)" },
};
type BubbleId =
  | "checkin"
  | "employee"
  | "leave"
  | "directory"
  | "tasks"
  | "settings"
  | "chat"
  | "workflow"
  | "notifications"
  | "crm";
const BUBBLES: {
  id: BubbleId;
  label: string;
  sub: string;
  emoji: string | React.ReactNode;
  lx: string;
  ty: string;
  size: number;
  dur: number;
  delay: number;
  isCenter?: boolean;
}[] = [
  {
    id: "checkin",
    label: "Check-in",
    sub: "Chấm công",
    emoji: "⚡",
    lx: "50%",
    ty: "48%",
    size: 200,
    dur: 8.8,
    delay: 0,
    isCenter: true,
  },
  {
    id: "employee",
    label: "Hồ sơ",
    sub: "Cá nhân",
    emoji: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        width="36"
        height="36"
        color="#FF8800"
        style={{ filter: "drop-shadow(0 0 8px rgba(255,136,0,0.4))" }}
      >
        <path
          fillRule="evenodd"
          d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
          clipRule="evenodd"
        />
      </svg>
    ),
    lx: "22%",
    ty: "28%",
    size: 140,
    dur: 9.3,
    delay: 0.6,
  },
  {
    id: "leave",
    label: "Xin nghỉ",
    sub: "Tạo đơn · Lịch sử",
    emoji: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        width="36"
        height="36"
        color="#FF8800"
        style={{ filter: "drop-shadow(0 0 8px rgba(255,136,0,0.4))" }}
      >
        <path
          fillRule="evenodd"
          d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z"
          clipRule="evenodd"
        />
      </svg>
    ),
    lx: "78%",
    ty: "28%",
    size: 140,
    dur: 8.9,
    delay: 1.1,
  },
  {
    id: "directory",
    label: "Danh bạ",
    sub: "Nội bộ",
    emoji: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        width="36"
        height="36"
        color="#FF8800"
        style={{ filter: "drop-shadow(0 0 8px rgba(255,136,0,0.4))" }}
      >
        <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
      </svg>
    ),
    lx: "88%",
    ty: "55%",
    size: 136,
    dur: 9.8,
    delay: 1.5,
  },
  {
    id: "workflow",
    label: "Quy trình",
    sub: "Trình duyệt",
    emoji: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        width="36"
        height="36"
        color="#FF8800"
        style={{ filter: "drop-shadow(0 0 8px rgba(255,136,0,0.4))" }}
      >
        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
        <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
      </svg>
    ),
    lx: "88%",
    ty: "55%",
    size: 136,
    dur: 9.8,
    delay: 1.5,
  },
  {
    id: "tasks",
    label: "Công việc",
    sub: "Quản lý task",
    emoji: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        width="36"
        height="36"
        color="#FF8800"
        style={{ filter: "drop-shadow(0 0 8px rgba(255,136,0,0.4))" }}
      >
        <path
          fillRule="evenodd"
          d="M6 3.75A2.75 2.75 0 0 1 8.75 1h2.5A2.75 2.75 0 0 1 14 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 0 1 6 4.193V3.75Zm6.5 0v.325a41.622 41.622 0 0 0-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25ZM10 10a1 1 0 0 0-1 1v.01a1 1 0 0 0 1 1h.01a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1H10Z"
          clipRule="evenodd"
        />
        <path d="M3 15.055v-.684c.126.053.255.1.39.142 2.092.642 4.313.987 6.61.987 2.297 0 4.518-.345 6.61-.987.135-.041.264-.089.39-.142v.684c0 1.347-.985 2.53-2.363 2.686a41.454 41.454 0 0 1-9.274 0C3.985 17.585 3 16.402 3 15.055Z" />
      </svg>
    ),
    lx: "12%",
    ty: "55%",
    size: 136,
    dur: 9.6,
    delay: 0.4,
  },
  {
    id: "chat",
    label: "Tin nhắn",
    sub: "Chat nội bộ",
    emoji: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        width="36"
        height="36"
        color="#FF8800"
        style={{ filter: "drop-shadow(0 0 8px rgba(255,136,0,0.4))" }}
      >
        <path
          fillRule="evenodd"
          d="M12 2.25c-2.429 0-4.817.178-7.152.521C2.87 3.061 1.5 4.795 1.5 6.741v6.018c0 1.946 1.37 3.68 3.348 3.97.877.129 1.761.234 2.652.316V21a.75.75 0 0 0 1.28.53l4.184-4.183a.39.39 0 0 1 .266-.112c2.006-.05 3.982-.22 5.922-.506 1.978-.29 3.348-2.023 3.348-3.97V6.741c0-1.947-1.37-3.68-3.348-3.97A49.145 49.145 0 0 0 12 2.25ZM8.25 8.625a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Zm2.625 1.125a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875-1.125a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z"
          clipRule="evenodd"
        />
      </svg>
    ),
    lx: "70%",
    ty: "80%",
    size: 128,
    dur: 9.2,
    delay: 1.2,
  },
  {
    id: "settings",
    label: "Cài đặt",
    sub: "Tài khoản",
    emoji: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        width="36"
        height="36"
        color="#FF8800"
        style={{ filter: "drop-shadow(0 0 8px rgba(255,136,0,0.4))" }}
      >
        <path d="M13.024 9.25c.47 0 .827-.433.637-.863a4 4 0 0 0-4.094-2.364c-.468.05-.665.576-.43.984l1.08 1.868a.75.75 0 0 0 .649.375h2.158ZM7.84 7.758c-.236-.408-.79-.5-1.068-.12A3.982 3.982 0 0 0 6 10c0 .884.287 1.7.772 2.363.278.38.832.287 1.068-.12l1.078-1.868a.75.75 0 0 0 0-.75L7.839 7.758ZM9.138 12.993c-.235.408-.039.934.43.984a4 4 0 0 0 4.094-2.364c.19-.43-.168-.863-.638-.863h-2.158a.75.75 0 0 0-.65.375l-1.078 1.868Z" />
        <path
          fillRule="evenodd"
          d="m14.13 4.347.644-1.117a.75.75 0 0 0-1.299-.75l-.644 1.116a6.954 6.954 0 0 0-2.081-.556V1.75a.75.75 0 0 0-1.5 0v1.29a6.954 6.954 0 0 0-2.081.556L6.525 2.48a.75.75 0 1 0-1.3.75l.645 1.117A7.04 7.04 0 0 0 4.347 5.87L3.23 5.225a.75.75 0 1 0-.75 1.3l1.116.644A6.954 6.954 0 0 0 3.04 9.25H1.75a.75.75 0 0 0 0 1.5h1.29c.078.733.27 1.433.556 2.081l-1.116.645a.75.75 0 1 0 .75 1.298l1.117-.644a7.04 7.04 0 0 0 1.523 1.523l-.645 1.117a.75.75 0 1 0 1.3.75l.644-1.116a6.954 6.954 0 0 0 2.081.556v1.29a.75.75 0 0 0 1.5 0v-1.29a6.954 6.954 0 0 0 2.081-.556l.645 1.116a.75.75 0 0 0 1.299-.75l-.645-1.117a7.042 7.042 0 0 0 1.523-1.523l1.117.644a.75.75 0 0 0 .75-1.298l-1.116-.645a6.954 6.954 0 0 0 .556-2.081h1.29a.75.75 0 0 0 0-1.5h-1.29a6.954 6.954 0 0 0-.556-2.081l1.116-.644a.75.75 0 0 0-.75-1.3l-1.117.645a7.04 7.04 0 0 0-1.524-1.523ZM10 4.5a5.475 5.475 0 0 0-2.781.754A5.527 5.527 0 0 0 5.22 7.277 5.475 5.475 0 0 0 4.5 10a5.475 5.475 0 0 0 .752 2.777 5.527 5.527 0 0 0 2.028 2.004c.802.458 1.73.719 2.72.719a5.474 5.474 0 0 0 2.78-.753 5.527 5.527 0 0 0 2.001-2.027c.458-.802.719-1.73.719-2.72a5.475 5.475 0 0 0-.753-2.78 5.528 5.528 0 0 0-2.028-2.002A5.475 5.475 0 0 0 10 4.5Z"
          clipRule="evenodd"
        />
      </svg>
    ),
    lx: "30%",
    ty: "80%",
    size: 128,
    dur: 8.4,
    delay: 1.8,
  },
  {
    id: "notifications",
    label: "Thông báo",
    sub: "Hệ thống",
    emoji: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        width="36"
        height="36"
        color="#FF8800"
        style={{ filter: "drop-shadow(0 0 8px rgba(255,136,0,0.4))" }}
      >
        <path d="M4.214 3.227a.75.75 0 0 0-1.156-.955 8.97 8.97 0 0 0-1.856 3.825.75.75 0 0 0 1.466.316 7.47 7.47 0 0 1 1.546-3.186ZM16.942 2.272a.75.75 0 0 0-1.157.955 7.47 7.47 0 0 1 1.547 3.186.75.75 0 0 0 1.466-.316 8.971 8.971 0 0 0-1.856-3.825Z" />
        <path
          fillRule="evenodd"
          d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.91 32.91 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.903 32.903 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.448 11.448 0 0 1 16 8a6 6 0 0 0-6-6Zm0 14.5a2 2 0 0 1-1.95-1.557 33.54 33.54 0 0 0 3.9 0A2 2 0 0 1 10 16.5Z"
          clipRule="evenodd"
        />
      </svg>
    ),
    lx: "50%",
    ty: "88%",
    size: 128,
    dur: 8.7,
    delay: 0.5,
  },
  {
    id: "crm",
    label: "Quản lý KH",
    sub: "Khách hàng",
    emoji: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        width="36"
        height="36"
        color="#FF8800"
        style={{ filter: "drop-shadow(0 0 8px rgba(255,136,0,0.4))" }}
      >
        <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
      </svg>
    ),
    lx: "50%",
    ty: "15%",
    size: 128,
    dur: 9.1,
    delay: 0.9,
  },
];
function SectionLabel({ children }: { children: string }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "#8b5f64",
        marginBottom: 14,
      }}
    >
      {children}
    </p>
  );
}
function FieldLabel({ children }: { children: string }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#8b5f64",
        marginBottom: 6,
      }}
    >
      {children}
    </p>
  );
}
function FieldBox({
  children,
  mono,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(36,20,22,0.12)",
        borderRadius: 12,
        padding: "10px 12px",
        color: "#241416",
        fontSize: 14,
        fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
      }}
    >
      {children}
    </div>
  );
}
function AmbientBg() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-22%",
          left: "-10%",
          width: "56vw",
          height: "56vw",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(232,35,26,0.12) 0%, rgba(232,35,26,0.045) 38%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "-20%",
          bottom: "-28%",
          width: "68vw",
          height: "68vw",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(232,35,26,0.08) 0%, rgba(255,255,255,0) 68%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,242,242,0.42) 45%, rgba(255,255,255,0.9))",
        }}
      />
    </div>
  );
}
function FloatingClock() {
  const [hms, setHms] = useState({ h: "00", m: "00", s: "00" });
  const [dateLine, setDateLine] = useState("");
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setHms({
        h: String(n.getHours()).padStart(2, "0"),
        m: String(n.getMinutes()).padStart(2, "0"),
        s: String(n.getSeconds()).padStart(2, "0"),
      });
      setDateLine(
        n.toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      style={{
        textAlign: "center",
        paddingTop: 0,
        position: "relative",
        zIndex: 1,
        width: "100%",
      }}
    >
      <p
        style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#7f5f63",
          marginBottom: 12,
        }}
      >
        {dateLine}
      </p>
      <div
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          justifyContent: "center",
          gap: "0.04em",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: "clamp(56px, 7vw, 82px)", color: BRAND }}>
          {hms.h}
        </span>
        <span
          style={{
            fontSize: "clamp(56px, 7vw, 82px)",
            color: BRAND,
            opacity: 0.34,
            animation: "colon-blink 1s step-end infinite",
          }}
        >
          :
        </span>
        <span style={{ fontSize: "clamp(56px, 7vw, 82px)", color: BRAND }}>
          {hms.m}
        </span>
        <span
          style={{
            fontSize: "clamp(18px, 2vw, 26px)",
            color: "#8f6f73",
            marginLeft: "0.25em",
            alignSelf: "flex-start",
            marginTop: "0.3em",
          }}
        >
          {hms.s}
        </span>
      </div>
    </div>
  );
}
function Bubble({
  b,
  hovId,
  setHovId,
  onClick,
  badge,
}: {
  b: (typeof BUBBLES)[0];
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
          <div
            style={{
              position: "absolute",
              inset: -16,
              borderRadius: "50%",
              border: `1.5px solid rgba(232,35,26,0.4)`,
              animation: "pulseRing 2.4s ease-out infinite",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: -32,
              borderRadius: "50%",
              border: `1px solid rgba(232,35,26,0.2)`,
              animation: "pulseRing 2.4s ease-out 0.8s infinite",
              pointerEvents: "none",
            }}
          />
        </>
      )}
      <div
        onClick={(e) => onClick(b.id, e)}
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
          transition:
            "box-shadow 0.35s ease, border-color 0.35s ease, background 0.35s ease",
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
        <span
          style={{
            fontSize: b.isCenter ? 36 : 28,
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {b.emoji}
          {b.id === "notifications" && badge != null && badge > 0 && (
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#ff5555",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 900,
                color: "#fff",
                border: "2px solid #0C0102",
                boxShadow: "0 0 10px rgba(255,85,85,0.8)",
              }}
            >
              {badge > 9 ? "9+" : badge}
            </div>
          )}
        </span>
        <span
          style={{
            fontSize: b.isCenter ? 12 : 11,
            fontWeight: 800,
            color: isHov ? "#FFE8EC" : "rgba(255,232,236,0.78)",
            textAlign: "center",
            lineHeight: 1.3,
            letterSpacing: "0.02em",
            padding: "0 8px",
          }}
        >
          {b.label}
        </span>
        {isHov && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: "rgba(255,232,236,0.45)",
              textAlign: "center",
              lineHeight: 1.3,
              padding: "0 8px",
            }}
          >
            {b.sub}
          </span>
        )}
      </div>
    </div>
  );
}
function Panel({
  activePage,
  onClose,
  onLogout,
  employee,
  embed = false,
}: {
  activePage: BubbleId;
  onClose: () => void;
  onLogout: () => void;
  employee: Employee | null;
  embed?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setVisible(true)),
    );
    return () => cancelAnimationFrame(id);
  }, []);
  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 240);
  };
  const bubble = BUBBLES.find((b) => b.id === activePage)!;
  const title: Record<BubbleId, string> = {
    checkin: "Tổng quan & Chấm công",
    employee: "Thông tin nhân viên",
    leave: "Quản lý ngày nghỉ",
    directory: "Danh bạ nội bộ",
    tasks: "Quản lý công việc",
    settings: "Cài đặt tài khoản",
    chat: "Chat nội bộ",
    workflow: "Quy trình nội bộ",
    notifications: "Thông báo hệ thống",
    crm: "Quản lý khách hàng",
  };
  return (
    <div
      className="portal-panel-root"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        overflowY: "auto",
        padding: 0,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(18px)",
        transition: "opacity 0.24s ease, transform 0.24s ease",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(232,35,26,0.18) transparent",
      }}
    >
      <div
        className="portal-panel-surface"
        style={{
          width: "100%",
          minHeight: "100vh",
          position: "relative",
        }}
      >
        <div
          className="portal-panel-header"
          style={{
            padding: "24px clamp(112px, 12vw, 220px) 20px",
            position: "sticky",
            top: 0,
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            zIndex: 2,
            borderBottom: "1px solid rgba(36,20,22,0.1)",
            boxShadow: "0 10px 30px rgba(95,15,22,0.06)",
          }}
        >
          <div
            className="portal-panel-header-inner"
            style={{
              width: "100%",
              maxWidth: 1280,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "auto minmax(0, 1fr) auto",
              alignItems: "center",
              gap: 16,
            }}
          >
            <button
              className="portal-home-button"
              onClick={handleClose}
              style={{
                height: 42,
                borderRadius: 12,
                border: "1px solid rgba(232,35,26,0.18)",
                background: "#FFFFFF",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: "#7a1d22",
                flexShrink: 0,
                transition: "all 0.2s",
                padding: "0 15px",
                fontSize: 14,
                fontWeight: 800,
                fontFamily: "inherit",
                boxShadow: "0 8px 20px rgba(95,15,22,0.06)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = BRAND;
                (e.currentTarget as HTMLElement).style.color = BRAND;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(232,35,26,0.18)";
                (e.currentTarget as HTMLElement).style.color = "#7a1d22";
              }}
            >
              <Home size={16} />
              <span>Trang chủ</span>
            </button>
            <div style={{ minWidth: 0, textAlign: "center" }}>
              <p
                style={{
                  fontSize: "clamp(26px, 3.2vw, 38px)",
                  fontWeight: 800,
                  color: "#241416",
                  lineHeight: 1.05,
                  letterSpacing: 0,
                }}
              >
                {title[activePage]}
              </p>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 650,
                  color: "#7f5f63",
                  marginTop: 6,
                }}
              >
                {bubble.sub}
              </p>
            </div>
            <div
              className="portal-header-spacer"
              aria-hidden="true"
              style={{ width: 126 }}
            />
          </div>
        </div>
        <div
          className="portal-panel-content"
          style={{
            padding: "40px clamp(112px, 12vw, 220px) 56px",
            minHeight: "calc(100vh - 112px)",
            background:
              "linear-gradient(135deg, #fff5f5 0%, #fbf6f6 50%, #fff9f9 100%)",
            borderTop: "1px solid rgba(36,20,22,0.04)",
          }}
        >
          <div
            className="portal-panel-inner"
            style={{ width: "100%", maxWidth: 1280, margin: "0 auto" }}
          >
            {activePage === "checkin" && <UserAttendance variant="portal" />}
            {activePage === "employee" &&
              (employee ? (
                <EmployeeContent employee={employee} />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: "40px 0",
                    color: "#7f5f63",
                  }}
                >
                  <span style={{ fontSize: 13 }}>Đang tải hồ sơ...</span>
                </div>
              ))}
            {activePage === "leave" &&
              (employee ? (
                <LeaveContent employee={employee} />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: "40px 0",
                    color: "#7f5f63",
                  }}
                >
                  <span style={{ fontSize: 13 }}>Đang tải hồ sơ...</span>
                </div>
              ))}
            {activePage === "tasks" && <UserTasks variant="portal" />}
            {activePage === "directory" && <DirectoryContent />}
            {activePage === "notifications" && (
              <NotificationsContent employee={employee} />
            )}
            {activePage === "settings" && (
              <SettingsContent onLogout={onLogout} embed={embed} />
            )}
            {activePage === "crm" && <CrmStaffContent />}
          </div>
        </div>
      </div>
    </div>
  );
}
function DirectoryContent() {
  const [search, setSearch] = useState("");
  const { employees, loading, error, reload } = useEmployeeDirectory();
  const list = employees.filter((e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      e.name.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.position.toLowerCase().includes(q) ||
      (e.email || "").toLowerCase().includes(q)
    );
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên nhân viên, phòng ban..."
            style={{ ...INPUT_S, paddingLeft: 14 }}
          />
        </div>
        <button
          onClick={reload}
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(232,35,26,0.18)",
            borderRadius: 10,
            cursor: "pointer",
            color: "#7a1d22",
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 900,
          }}
        >
          Tải lại
        </button>
      </div>
      {error && <p style={{ fontSize: 13, color: "#b91c1c" }}>{error}</p>}
      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: 24,
            color: "#7f5f63",
          }}
        >
          <span style={{ fontSize: 13 }}>Đang tải...</span>
        </div>
      )}
      {!loading && list.length === 0 && (
        <p
          style={{
            fontSize: 13,
            color: "#7f5f63",
            textAlign: "center",
            padding: 24,
          }}
        >
          Không tìm thấy nhân viên
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map((emp) => (
          <div
            key={emp.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px",
              background: "#FFFFFF",
              border: "1px solid #efd7da",
              borderRadius: 14,
              boxShadow: "0 12px 30px rgba(95,15,22,0.06)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${BRAND}, ${GOLD})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 900,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {empInitials(emp.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#241416",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {emp.name}
                </p>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    background: "#fff1f2",
                    borderRadius: 99,
                    color: "#7a1d22",
                    flexShrink: 0,
                    fontWeight: 750,
                  }}
                >
                  {emp.department}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#7f5f63", marginTop: 2 }}>
                {emp.position}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 8,
                  flexWrap: "wrap",
                }}
              >
                {emp.phone && (
                  <a
                    href={`tel:${emp.phone}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11,
                      color: BRAND,
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    Tel {emp.phone}
                  </a>
                )}
                {emp.email && (
                  <a
                    href={`mailto:${emp.email}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 12,
                      color: "#6f565a",
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    Email {emp.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function EmployeeContent({ employee }: { employee: Employee }) {
  const [activeTab, setActiveTab] = useState(0);
  const hometown = fmtAddr(
    employee.homeStreet,
    employee.homeWard,
    employee.homeDistrict,
    employee.homeProvince,
  );
  const address = fmtAddr(
    employee.curStreet,
    employee.curWard,
    employee.curDistrict,
    employee.curProvince,
  );
  const history = employee.workHistory ?? [];
  const FieldGroup = ({
    l,
    v,
    span,
  }: {
    l: string;
    v: React.ReactNode;
    span?: number;
  }) => (
    <div style={span ? { gridColumn: `span ${span}` } : {}}>
      <FieldLabel>{l}</FieldLabel>
      <FieldBox>{v || "—"}</FieldBox>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "18px 20px",
          background: "#FFFFFF",
          border: "1px solid #efd7da",
          borderRadius: 18,
          boxShadow: "0 14px 36px rgba(95,15,22,0.07)",
        }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${BRAND}, ${GOLD})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 900,
              color: "#fff",
              boxShadow: `0 0 24px ${GR}`,
            }}
          >
            {empInitials(employee.name)}
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 2,
              right: 2,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background:
                employee.status === "inactive" ? "#6b7280" : "#22c55e",
              border: "2px solid #FFFFFF",
              boxShadow: "0 0 8px rgba(34,197,94,0.35)",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#241416",
              lineHeight: 1.2,
            }}
          >
            {employee.name}
          </h2>
          <p style={{ fontSize: 13, color: "#7f5f63", marginTop: 3 }}>
            {employee.position}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 10,
            }}
          >
            <span
              style={{
                padding: "3px 10px",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                color: BRAND,
                background: "rgba(232,35,26,0.1)",
                border: `1px solid rgba(232,35,26,0.2)`,
              }}
            >
              {employee.department}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "#8b6b70",
              }}
            >
              #{employee.id}
            </span>
          </div>
        </div>
        <div style={{ flexShrink: 0, opacity: 0.35 }}>
          <ImageWithFallback
            src={dudiLogo}
            alt="DUDI Software"
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              objectFit: "cover",
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid rgba(36,20,22,0.1)",
          marginTop: 4,
        }}
      >
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
              color: activeTab === i ? "#241416" : "#8b6b70",
              borderBottom:
                activeTab === i
                  ? `2px solid ${BRAND}`
                  : "2px solid transparent",
              transition: "all 0.2s",
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {activeTab === 0 && (
        <div
          style={{
            padding: "16px 18px",
            background: "#FFFFFF",
            border: "1px solid #efd7da",
            borderRadius: 16,
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
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
        <div
          style={{
            padding: "16px 18px",
            background: "#FFFFFF",
            border: "1px solid #efd7da",
            borderRadius: 16,
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <FieldGroup l="Phòng ban" v={employee.department} />
            <FieldGroup l="Vị trí" v={employee.position} />
            <FieldGroup l="Loại hợp đồng" v={employee.contractType} />
            <FieldGroup l="Ngày bắt đầu" v={employee.joinDate} />
            <FieldGroup
              l="Trạng thái"
              v={EMP_STATUS_LABEL[employee.status] ?? employee.status}
              span={2}
            />
          </div>
        </div>
      )}
      {activeTab === 2 && (
        <div
          style={{
            padding: "16px 18px",
            background: "#FFFFFF",
            border: "1px solid #efd7da",
            borderRadius: 16,
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <FieldGroup l="Email" v={employee.email} span={2} />
            <FieldGroup l="Số điện thoại" v={employee.phone} span={2} />
            <FieldGroup l="Quê quán" v={hometown} span={2} />
            <FieldGroup l="Địa chỉ hiện tại" v={address} span={2} />
          </div>
        </div>
      )}
      <div
        style={{
          padding: "16px 18px",
          background: "#FFFFFF",
          border: "1px solid #efd7da",
          borderRadius: 16,
        }}
      >
        <SectionLabel>Quá trình công tác</SectionLabel>
        {history.length === 0 ? (
          <p style={{ fontSize: 13, color: "#7f5f63" }}>Chưa có dữ liệu</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.map((entry: WorkHistoryEntry, idx: number) => (
              <div
                key={entry.id}
                style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: idx === 0 ? BRAND : "rgba(255,255,255,0.2)",
                    marginTop: 5,
                    boxShadow: idx === 0 ? `0 0 8px ${BRAND}` : "none",
                  }}
                />
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: idx === 0 ? 800 : 700,
                      color: idx === 0 ? "#241416" : "#5f4246",
                    }}
                  >
                    {entry.title}
                  </p>
                  <p style={{ fontSize: 12, color: "#7f5f63", marginTop: 2 }}>
                    {[
                      entry.snapshot,
                      entry.date,
                      entry.toDate ? `– ${entry.toDate}` : "– Hiện tại",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
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
  const todayTasks = tasks.filter(
    (t) =>
      t.dueDate === today || (!t.dueDate && (t.status === "todo" || !t.status)),
  );
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
    { l: "Chưa làm", v: stats.todo, c: "#6f565a", g: "transparent" },
    {
      l: "Đang làm",
      v: stats.inProgress,
      c: "#f59e0b",
      g: "rgba(245,158,11,0.2)",
    },
    { l: "Đã xong", v: stats.done, c: "#22c55e", g: "rgba(34,197,94,0.2)" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <p style={{ fontSize: 13, color: "#7f5f63", fontWeight: 700 }}>
          {today}
        </p>
        <button
          onClick={reload}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#7a1d22",
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      {error && <p style={{ fontSize: 13, color: "#b91c1c" }}>{error}</p>}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 10,
        }}
      >
        {kpis.map(({ l, v, c, g }) => (
          <div
            key={l}
            style={{
              background: "#FFFFFF",
              border: "1px solid #efd7da",
              borderRadius: 14,
              padding: "14px",
              boxShadow:
                g !== "transparent"
                  ? `0 12px 28px ${g}`
                  : "0 12px 28px rgba(95,15,22,0.05)",
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 28,
                fontWeight: 700,
                color: c,
                lineHeight: 1,
                textShadow: g !== "transparent" ? `0 0 12px ${g}` : "none",
              }}
            >
              {loading ? "—" : v}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 750,
                color: "#7f5f63",
                marginTop: 5,
              }}
            >
              {l}
            </div>
          </div>
        ))}
      </div>
      {!loading && todayTasks.length === 0 && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #efd7da",
            borderRadius: 14,
            padding: "20px 16px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 800, color: "#241416" }}>
            Hôm nay không có công việc
          </p>
          <p style={{ fontSize: 12, color: "#7f5f63", marginTop: 3 }}>
            {today}
          </p>
        </div>
      )}
      <div>
        <SectionLabel>Nhật ký công việc</SectionLabel>
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 16,
              color: "#7f5f63",
            }}
          >
            <Loader2 size={16} className="animate-spin" />
            <span style={{ fontSize: 12 }}>Đang tải...</span>
          </div>
        )}
        {!loading && groups.length === 0 && (
          <p style={{ fontSize: 13, color: "#7f5f63", padding: "8px 0" }}>
            Chưa có công việc được giao
          </p>
        )}
        {groups.map(([date, items], idx) => (
          <div key={date} style={{ display: "flex", gap: 14 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: BRAND,
                  boxShadow: `0 0 8px ${BRAND}`,
                  marginTop: 2,
                  flexShrink: 0,
                }}
              />
              {idx < groups.length - 1 && (
                <div
                  style={{
                    width: 1,
                    flex: 1,
                    background: "rgba(232,35,26,0.15)",
                    marginTop: 4,
                  }}
                />
              )}
            </div>
            <div
              style={{
                flex: 1,
                paddingBottom: idx < groups.length - 1 ? 18 : 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{ fontSize: 12, fontWeight: 800, color: "#7f5f63" }}
                >
                  {date}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {items.map((item) => {
                  const st = item.status || "todo";
                  const colors =
                    TASK_STATUS_COLOR[st] ?? TASK_STATUS_COLOR.todo;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "9px 12px",
                        borderRadius: 11,
                        background: "#FFFFFF",
                        border: "1px solid #efd7da",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                        }}
                      >
                        <CheckCircle2
                          size={13}
                          style={{
                            color: st === "done" ? "#22c55e" : "#8b6b70",
                            filter:
                              st === "done"
                                ? "drop-shadow(0 0 4px rgba(34,197,94,0.35))"
                                : "none",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 14,
                            color: "#241416",
                            fontWeight: 700,
                          }}
                        >
                          {item.title}
                        </span>
                      </div>
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: 99,
                          fontSize: 10,
                          fontWeight: 700,
                          color: colors.c,
                          background: colors.bg,
                          border: `1px solid ${colors.c}30`,
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                      >
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
function CrmStaffContent() {
  return (
    <div style={{ width: "100%" }}>
      <CrmStaffPage />
    </div>
  );
}
function NotificationsContent({ employee }: { employee: Employee | null }) {
  const {
    items,
    loading: loadingInbox,
    error: errorInbox,
    unread,
    markAllRead,
    markRead,
    deleteItem,
    reload: reloadInbox,
  } = useNotifications();
  const [activeSubTab, setActiveSubTab] = useState<
    "inbox" | "admin_req" | "broadcast"
  >("inbox");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [adminRequests, setAdminRequests] = useState<any[]>([]);
  const [loadingAdminRequests, setLoadingAdminRequests] = useState(false);
  const [orgNodes, setOrgNodes] = useState<any[]>([]);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const loadAnnouncements = () => {
    setLoadingAnnouncements(true);
    api.announcements
      .list()
      .then((data: any) => {
        const active = (data || []).filter(
          (item: any) => item.status === "active",
        );
        setAnnouncements(active);
      })
      .catch(() => {})
      .finally(() => setLoadingAnnouncements(false));
  };
  const loadAdminRequests = () => {
    if (!employee?.id) return;
    setLoadingAdminRequests(true);
    api.profileUpdates
      .list({ employeeId: employee.id })
      .then((data: any) => {
        const filtered = (data || []).filter((r: any) =>
          ["sent", "rework_requested"].includes(r.status),
        );
        setAdminRequests(filtered);
      })
      .catch(() => {})
      .finally(() => setLoadingAdminRequests(false));
  };
  useEffect(() => {
    api.orgNodes
      .list()
      .then(setOrgNodes)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (activeSubTab === "broadcast") {
      loadAnnouncements();
    } else if (activeSubTab === "admin_req") {
      loadAdminRequests();
    }
  }, [activeSubTab, employee?.id]);
  const handleReload = () => {
    if (activeSubTab === "inbox") {
      reloadInbox();
    } else if (activeSubTab === "admin_req") {
      loadAdminRequests();
    } else {
      loadAnnouncements();
    }
  };
  const typeColor = (type?: string) => {
    const t = (type || "").toLowerCase();
    if (t === "leave" || t === "nghỉ phép" || t === "event" || t === "sự kiện")
      return "#8b5cf6";
    if (
      t === "system" ||
      t === "hệ thống" ||
      t === "warning" ||
      t === "cảnh báo"
    )
      return "#f59e0b";
    if (t === "hr" || t === "nhân sự" || t === "urgent" || t === "khẩn cấp")
      return "#ef4444";
    if (t === "info" || t === "thông tin") return "#3b82f6";
    return BRAND;
  };
  const handleSaveProfile = async (form: any) => {
    if (!selectedReq) return;
    try {
      await api.profileUpdates.submitDraft(selectedReq.id, form);
      setSuccessMsg("Đã gửi hồ sơ cập nhật thành công cho Admin xét duyệt!");
      setShowEditModal(false);
      setSelectedReq(null);
      loadAdminRequests();
    } catch (err: any) {
      setErrorMsg("Lỗi gửi hồ sơ: " + err.message);
    }
  };
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<any | null>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="flex border-b border-gray-100 mb-2">
        <button
          onClick={() => setActiveSubTab("inbox")}
          className={`flex-1 py-3 text-sm font-bold border-b-2 text-center transition-all ${
            activeSubTab === "inbox"
              ? "border-red-500 text-red-600 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Tin nhắn cá nhân{" "}
          {unread > 0 && (
            <span className="ml-1 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {unread}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("admin_req")}
          className={`flex-1 py-3 text-sm font-bold border-b-2 text-center transition-all ${
            activeSubTab === "admin_req"
              ? "border-red-500 text-red-600 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Yêu cầu từ Admin{" "}
          {adminRequests.length > 0 && (
            <span className="ml-1 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {adminRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("broadcast")}
          className={`flex-1 py-3 text-sm font-bold border-b-2 text-center transition-all ${
            activeSubTab === "broadcast"
              ? "border-red-500 text-red-600 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Thông báo hệ thống
        </button>
      </div>
      <div className="flex items-center justify-between w-full">
        <p className="text-xs text-[#6f565a] font-bold">
          {activeSubTab === "inbox" &&
            (unread > 0
              ? `Bạn có ${unread} thông báo chưa đọc`
              : "Không có thông báo mới")}
          {activeSubTab === "admin_req" &&
            (adminRequests.length > 0
              ? `Bạn có ${adminRequests.length} yêu cầu chỉnh sửa thông tin cần xử lý`
              : "Không có yêu cầu nào từ Admin")}
          {activeSubTab === "broadcast" &&
            `Có ${announcements.length} thông báo hệ thống đang hoạt động`}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReload}
            className="text-xs font-bold text-[#7a1d22] hover:opacity-80 bg-transparent border-none cursor-pointer"
          >
            Tải lại
          </button>
          {activeSubTab === "inbox" && unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-bold text-[#E8231A] hover:opacity-80 bg-transparent border-none cursor-pointer"
            >
              Đọc tất cả
            </button>
          )}
        </div>
      </div>
      {activeSubTab === "inbox" && errorInbox && (
        <p style={{ fontSize: 13, color: "#b91c1c" }}>{errorInbox}</p>
      )}
      {(activeSubTab === "inbox"
        ? loadingInbox
        : activeSubTab === "admin_req"
          ? loadingAdminRequests
          : loadingAnnouncements) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: 16,
            color: "#7f5f63",
          }}
        >
          <span style={{ fontSize: 13 }}>Đang tải...</span>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {activeSubTab === "inbox" && (
          <>
            {!loadingInbox && items.length === 0 && (
              <p
                style={{
                  fontSize: 13,
                  color: "#7f5f63",
                  textAlign: "center",
                  padding: 16,
                }}
              >
                Chưa có thông báo
              </p>
            )}
            {items.map((n) => {
              const clr = typeColor(n.type);
              const isUnread = !n.read;
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (isUnread) markRead(n.id);
                    setDetailItem(n);
                    setDetailOpen(true);
                  }}
                  className="relative p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all flex gap-4 overflow-hidden cursor-pointer"
                  style={{
                    borderLeft: `4px solid ${clr}`,
                  }}
                >
                  {isUnread && (
                    <span className="absolute top-4 right-16 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      color: clr,
                      background: `${clr}10`,
                    }}
                  >
                    {(() => {
                      const IconComp = (() => {
                        const t = (n.type || "").toLowerCase();
                        if (t === "leave" || t === "nghỉ phép")
                          return CalendarDays;
                        if (t === "system" || t === "hệ thống") return Zap;
                        if (t === "hr" || t === "nhân sự") return Users;
                        return Bell;
                      })();
                      return <IconComp size={18} />;
                    })()}
                  </div>
                  <div className="flex-1 space-y-2 pr-16">
                    <div className="flex items-center gap-2">
                      {n.type && (
                        <span
                          className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
                          style={{
                            color: clr,
                            background: `${clr}15`,
                          }}
                        >
                          {n.type}
                        </span>
                      )}
                      {n.time && (
                        <span className="text-[11px] text-gray-400 font-semibold">
                          {n.time}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {n.title && (
                        <h5
                          className={`text-sm ${isUnread ? "font-black text-gray-900" : "font-bold text-gray-800"}`}
                        >
                          {n.title}
                        </h5>
                      )}
                      <p
                        className={`text-xs leading-relaxed ${isUnread ? "text-gray-700 font-medium" : "text-gray-500"} line-clamp-2`}
                      >
                        {n.message}
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isUnread) markRead(n.id);
                        setDetailItem(n);
                        setDetailOpen(true);
                      }}
                      className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-blue-500 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      title="Xem chi tiết"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(n.id);
                      }}
                      className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      title="Xóa"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
        {activeSubTab === "admin_req" && (
          <>
            {!loadingAdminRequests && adminRequests.length === 0 && (
              <p
                style={{
                  fontSize: 13,
                  color: "#7f5f63",
                  textAlign: "center",
                  padding: 16,
                }}
              >
                Không có yêu cầu chỉnh sửa hồ sơ
              </p>
            )}
            {adminRequests.map((r) => {
              const isRework = r.status === "rework_requested";
              const clr = isRework ? "#ef4444" : "#f59e0b";
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedReq(r);
                    setShowEditModal(true);
                  }}
                  className="relative p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all flex gap-4 overflow-hidden cursor-pointer"
                  style={{
                    borderLeft: `4px solid ${clr}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      color: clr,
                      background: `${clr}10`,
                    }}
                  >
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 space-y-2 pr-12">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{
                          color: clr,
                          background: `${clr}15`,
                        }}
                      >
                        {isRework
                          ? "Yêu cầu chỉnh sửa lại"
                          : "Yêu cầu cập nhật hồ sơ"}
                      </span>
                      {r.createdAt && (
                        <span className="text-[11px] text-gray-400 font-semibold">
                          {r.createdAt}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-sm font-bold text-gray-800">
                        {isRework
                          ? "Admin yêu cầu sửa đổi thông tin bổ sung"
                          : "Admin yêu cầu cập nhật hồ sơ nhân sự"}
                      </h5>
                      {isRework && r.reworkReason && (
                        <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 mt-2">
                          <span className="text-[10px] text-red-500 font-extrabold uppercase tracking-wider block mb-1">
                            Lý do yêu cầu sửa lại:
                          </span>
                          <p className="text-xs text-red-700 font-medium leading-relaxed">
                            {r.reworkReason}
                          </p>
                        </div>
                      )}
                      {!isRework && r.note && (
                        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 mt-2">
                          <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider block mb-1">
                            Ghi chú từ Admin:
                          </span>
                          <p className="text-xs text-amber-800 font-medium leading-relaxed">
                            {r.note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReq(r);
                        setShowEditModal(true);
                      }}
                      className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-blue-500 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      title="Chỉnh sửa hồ sơ"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
        {activeSubTab === "broadcast" && (
          <>
            {!loadingAnnouncements && announcements.length === 0 && (
              <p
                style={{
                  fontSize: 13,
                  color: "#7f5f63",
                  textAlign: "center",
                  padding: 16,
                }}
              >
                Không có thông báo hệ thống hoạt động
              </p>
            )}
            {announcements.map((a) => {
              const clr = typeColor(a.type);
              return (
                <div
                  key={a.id}
                  onClick={() => {
                    setDetailItem({
                      id: a.id,
                      type: a.type,
                      title: a.title,
                      message: a.content,
                      time: a.createdAt || a.startTime,
                    });
                    setDetailOpen(true);
                  }}
                  className="relative p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all flex gap-4 overflow-hidden cursor-pointer"
                  style={{
                    borderLeft: `4px solid ${clr}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      color: clr,
                      background: `${clr}10`,
                    }}
                  >
                    {(() => {
                      const IconComp = (() => {
                        const t = (a.type || "").toLowerCase();
                        if (t === "event" || t === "sự kiện")
                          return CalendarDays;
                        if (
                          t === "urgent" ||
                          t === "khẩn cấp" ||
                          t === "warning" ||
                          t === "cảnh báo"
                        )
                          return Zap;
                        return Bell;
                      })();
                      return <IconComp size={18} />;
                    })()}
                  </div>
                  <div className="flex-1 space-y-2 pr-12">
                    <div className="flex items-center gap-2">
                      {a.type && (
                        <span
                          className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
                          style={{
                            color: clr,
                            background: `${clr}15`,
                          }}
                        >
                          {a.type}
                        </span>
                      )}
                      {(a.createdAt || a.startTime) && (
                        <span className="text-[11px] text-gray-400 font-semibold">
                          {a.createdAt || a.startTime}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {a.title && (
                        <h5 className="text-sm font-bold text-gray-800">
                          {a.title}
                        </h5>
                      )}
                      <p className="text-xs leading-relaxed text-gray-500 line-clamp-2">
                        {a.content}
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailItem({
                          id: a.id,
                          type: a.type,
                          title: a.title,
                          message: a.content,
                          time: a.createdAt || a.startTime,
                        });
                        setDetailOpen(true);
                      }}
                      className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-blue-500 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      title="Xem chi tiết"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
      <Modal
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailItem(null);
        }}
        title="Chi tiết thông báo"
        icon={Bell}
        width="xl"
        bodyClassName="p-6 bg-gray-50/40"
        footer={
          <ModalCancelButton
            onClick={() => {
              setDetailOpen(false);
              setDetailItem(null);
            }}
            label="Đóng"
          />
        }
      >
        {detailItem ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                {detailItem.type && (
                  <span
                    className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg"
                    style={{
                      color: typeColor(detailItem.type),
                      background: `${typeColor(detailItem.type)}15`,
                      border: `1px solid ${typeColor(detailItem.type)}25`,
                    }}
                  >
                    {detailItem.type}
                  </span>
                )}
                {detailItem.time && (
                  <span className="text-xs text-gray-400 font-medium">
                    {detailItem.time}
                  </span>
                )}
              </div>
            </div>
            {detailItem.title && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider block mb-1.5">
                  Tiêu đề thông báo
                </span>
                <h4 className="text-sm font-black text-gray-800 leading-snug">
                  {detailItem.title}
                </h4>
              </div>
            )}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2 border-b border-gray-50 pb-1.5">
                Nội dung chi tiết
              </span>
              <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                {detailItem.message}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
      {showEditModal && selectedReq && (
        <EmployeeModal
          editEmp={
            employee
              ? { ...employee, ...(selectedReq.pendingData || {}) }
              : null
          }
          employees={[]}
          orgNodes={orgNodes}
          onClose={() => {
            setShowEditModal(false);
            setSelectedReq(null);
          }}
          onSave={handleSaveProfile}
        />
      )}
      {successMsg && (
        <Modal
          open={!!successMsg}
          onClose={() => setSuccessMsg(null)}
          title="Thành công"
          icon={CheckCircle2}
          width="sm"
          bodyClassName="p-6"
          footer={
            <button
              onClick={() => setSuccessMsg(null)}
              className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Đồng ý
            </button>
          }
        >
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500">
              <CheckCircle2 size={28} />
            </div>
            <p className="text-sm text-gray-600 text-center font-medium leading-relaxed">
              {successMsg}
            </p>
          </div>
        </Modal>
      )}
      {errorMsg && (
        <Modal
          open={!!errorMsg}
          onClose={() => setErrorMsg(null)}
          title="Thông báo lỗi"
          icon={X}
          width="sm"
          bodyClassName="p-6"
          footer={
            <button
              onClick={() => setErrorMsg(null)}
              className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Đóng
            </button>
          }
        >
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <X size={28} />
            </div>
            <p className="text-sm text-gray-600 text-center font-medium leading-relaxed">
              {errorMsg}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
function SettingsContent({
  onLogout,
  embed = false,
}: {
  onLogout: () => void;
  embed?: boolean;
}) {
  const [vals, setVals] = useState(["", "", ""]);
  const [shows, setShows] = useState([false, false, false]);
  const [saved, setSaved] = useState(false);
  const labels = ["Mật khẩu cũ", "Mật khẩu mới", "Xác nhận mật khẩu mới"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${BRAND}, ${GOLD})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 900,
            color: "#fff",
          }}
        >
          TL
        </div>
        <button
          style={{
            ...BTN_S,
            width: "auto",
            padding: "8px 16px",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#FFFFFF",
            border: "1px solid #efd7da",
            color: "#7a1d22",
            boxShadow: "0 10px 24px rgba(95,15,22,0.06)",
          }}
        >
          Thay ảnh đại diện
        </button>
      </div>
      <div style={{ height: 1, background: "rgba(36,20,22,0.1)" }} />
      <SectionLabel>Đổi mật khẩu</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {labels.map((label, i) => (
          <div key={label}>
            <FieldLabel>{label}</FieldLabel>
            <div style={{ position: "relative" }}>
              <input
                type={shows[i] ? "text" : "password"}
                value={vals[i]}
                onChange={(e) =>
                  setVals((p) =>
                    p.map((v, idx) => (idx === i ? e.target.value : v)),
                  )
                }
                placeholder="••••••••"
                style={{ ...INPUT_S, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() =>
                  setShows((p) => p.map((v, idx) => (idx === i ? !v : v)))
                }
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#7a1d22",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 750,
                }}
              >
                {shows[i] ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>
        ))}
        {saved && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 12,
              background: "rgba(34,197,94,0.09)",
              border: "1px solid rgba(34,197,94,0.2)",
              color: "#22c55e",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Đổi mật khẩu thành công!
          </div>
        )}
        <button
          onClick={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          }}
          style={BTN_S}
        >
          Cập nhật mật khẩu
        </button>
      </div>
      <div
        style={{ height: 1, background: "rgba(36,20,22,0.1)", margin: "8px 0" }}
      />
      <SectionLabel>Quản lý phiên đăng nhập</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px",
            background: "#FFFFFF",
            borderRadius: 12,
            border: "1px solid #efd7da",
          }}
        >
          <div>
            <p style={{ fontSize: 14, color: "#241416", fontWeight: 800 }}>
              Windows • Chrome
            </p>
            <p style={{ fontSize: 12, color: "#7f5f63", marginTop: 2 }}>
              Đang hoạt động (Hiện tại)
            </p>
          </div>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 8px rgba(34,197,94,0.6)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px",
            background: "#FFFFFF",
            borderRadius: 12,
            border: "1px solid #efd7da",
          }}
        >
          <div>
            <p style={{ fontSize: 14, color: "#5f4246", fontWeight: 750 }}>
              iPhone 14 Pro • Safari
            </p>
            <p style={{ fontSize: 12, color: "#8b6b70", marginTop: 2 }}>
              Đăng nhập 2 ngày trước
            </p>
          </div>
          <button
            style={{
              border: "none",
              color: "#ff5555",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              padding: "4px 8px",
              background: "rgba(255,85,85,0.1)",
              borderRadius: 6,
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <button
          onClick={onLogout}
          style={{
            ...BTN_S,
            background: "rgba(232,35,26,0.1)",
            color: "#FF5555",
            boxShadow: "none",
          }}
        >
          Đăng xuất khỏi hệ thống
        </button>
      </div>
    </div>
  );
}
const BUBBLE_MODULE_MAP: Record<BubbleId, string> = {
  checkin: "user-attendance",
  employee: "user-profile",
  leave: "user-timeoff",
  directory: "user-directory",
  tasks: "cong-viec",
  settings: "user-settings",
  chat: "user-chat",
  workflow: "user-workflow",
  notifications: "thong-bao",
  crm: "user-crm",
};
export default function UserPortalApp({
  onLogout,
  modules = [],
  embed = false,
}: {
  onLogout: () => void;
  modules?: string[];
  embed?: boolean;
}) {
  const [activePage, setActivePage] = useState<BubbleId | null>(null);
  const [hovId, setHovId] = useState<BubbleId | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeAnnouncements, setActiveAnnouncements] = useState<
    Announcement[]
  >([]);
  const [defaultAnnouncement, setDefaultAnnouncement] = useState("");
  const { unread: notifUnread } = useNotifications();
  useEffect(() => {
    const loadEmployee = async () => {
      let userObj: any = null;
      try {
        const raw = localStorage.getItem("dudi_user");
        userObj = raw ? JSON.parse(raw) : null;
        const empId = userObj?.employeeId;
        if (empId) {
          const found = (await api.employees.getById(empId)) as Employee;
          if (found) {
            setEmployee(found);
            return;
          }
        }
        const key = String(userObj?.email || "").toLowerCase();
        if (key) {
          const list = (await api.employees.list()) as Employee[];
          const found = list.find((e) => (e.email || "").toLowerCase() === key);
          if (found) {
            setEmployee(found);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch employee record, using fallback:", err);
      }
      if (userObj) {
        const fallback: Employee = {
          id: userObj.id || userObj.employeeId || "admin",
          name: userObj.name || "Quản trị viên",
          email: userObj.email || "admin@dudi.vn",
          phone: userObj.phone || "—",
          department: userObj.department || "Ban Giám Đốc",
          position: userObj.roleName || "Quản trị viên",
          joinDate: userObj.joinDate || new Date().toLocaleDateString("vi-VN"),
          status: "active",
          contractType: "Chính thức",
          workHistory: [],
        } as any;
        setEmployee(fallback);
      }
    };
    loadEmployee();
  }, []);
  useEffect(() => {
    let alive = true;
    const loadActiveAnnouncement = async () => {
      try {
        const [data, config] = await Promise.all([
          api.announcements.list() as Promise<Announcement[]>,
          api.systemConfig.get(),
        ]);
        if (!alive) return;
        const active = data
          .filter((item) => item.status === "active")
          .sort((a, b) => {
            const priorityRank = { high: 3, medium: 2, low: 1 } as Record<
              string,
              number
            >;
            const diff =
              (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0);
            if (diff !== 0) return diff;
            return (
              new Date(b.createdAt || b.startTime).getTime() -
              new Date(a.createdAt || a.startTime).getTime()
            );
          });
        setActiveAnnouncements(active);
        setDefaultAnnouncement(
          config?.defaultAnnouncementEnabled === false
            ? ""
            : String(config?.defaultAnnouncementContent || ""),
        );
      } catch (err) {
        if (alive) {
          setActiveAnnouncements([]);
          setDefaultAnnouncement("");
        }
      }
    };
    loadActiveAnnouncement();
    const timer = setInterval(loadActiveAnnouncement, 30000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);
  const handleBubbleClick = (id: BubbleId) => setActivePage(id);
  const staffModules = getStaffPortalModules(modules);
  const allowedBubbles = BUBBLES.filter((b) => {
    if (!LIVE_STAFF_BUBBLES.has(b.id)) return false;
    const moduleKey = BUBBLE_MODULE_MAP[b.id];
    return hasStaffModule(staffModules, moduleKey);
  });
  const floatKeyframes = allowedBubbles
    .map(
      (b) => `
    @keyframes floatBubble${b.id} {
      0%, 100% { transform: translateY(0px); }
      33%       { transform: translateY(-${4 + (b.delay * 1.5).toFixed(0)}px) rotate(${(b.delay * 0.2).toFixed(1)}deg); }
      66%       { transform: translateY(-${2 + (b.dur * 0.4).toFixed(0)}px) rotate(${(-b.delay * 0.1).toFixed(1)}deg); }
    }
  `,
    )
    .join("\n");
  return (
    <div
      className="user-portal-shell"
      style={{
        width: embed ? "100%" : "100vw",
        height: embed ? "100%" : "100vh",
        overflow: "hidden",
        background: `
          radial-gradient(ellipse at 14% 8%, rgba(232,35,26,0.12) 0%, transparent 42%),
          radial-gradient(ellipse at 92% 84%, rgba(232,35,26,0.08) 0%, transparent 48%),
          linear-gradient(135deg, #fff8f8 0%, #f7f1f1 48%, #ffffff 100%)`,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
        color: "#241416",
        position: embed ? "absolute" : "relative",
        inset: embed ? 0 : undefined,
      }}
    >
      <style>{`
        ${floatKeyframes}
        .user-portal-shell {
          font-synthesis-weight: none;
          text-rendering: geometricPrecision;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);    opacity: 0.65; }
          100% { transform: scale(1.65); opacity: 0;    }
        }
        @keyframes colon-blink {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.07; }
        }
        ::placeholder { color: rgba(36,20,22,0.38); }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(232,35,26,0.35); border-radius: 99px; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5) sepia(1) hue-rotate(310deg); }
        select option { background: #FFFFFF; color: #241416; }
        @keyframes portalTileIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes portalTileFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes orbitRingDrift {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes orbitRingDriftReverse {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(-360deg); }
        }
        @keyframes orbitRingBreathe {
          0%, 100% {
            opacity: var(--ring-opacity, 0.34);
            box-shadow: 0 0 0 rgba(232,35,26,0);
          }
          50% {
            opacity: calc(var(--ring-opacity, 0.34) + 0.22);
            box-shadow: 0 0 32px rgba(232,35,26,0.12);
          }
        }
        @keyframes orbitHaloBreathe {
          0%, 100% {
            opacity: 0.42;
            filter: blur(12px);
            transform: translate(-50%, -50%) scale(0.96);
          }
          50% {
            opacity: 0.82;
            filter: blur(17px);
            transform: translate(-50%, -50%) scale(1.05);
          }
        }
        @keyframes orbitStarTwinkle {
          0%, 100% {
            opacity: 0.32;
            transform: translate(-50%, -50%) scale(0.78);
          }
          48% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.08);
          }
        }
        @keyframes checkinSolarGlow {
          0%, 100% {
            box-shadow: 0 26px 70px rgba(232,35,26,0.24), 0 0 0 0 rgba(232,35,26,0.18);
          }
          50% {
            box-shadow: 0 30px 86px rgba(232,35,26,0.34), 0 0 0 16px rgba(232,35,26,0.05);
          }
        }
        @keyframes portalNoticeMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .portal-notice-track {
          animation: portalNoticeMarquee var(--notice-duration, 30s) linear infinite;
        }
        .portal-notice-bar:hover .portal-notice-track {
          animation-play-state: paused;
        }
        .portal-orbit-canvas {
          position: absolute;
          inset: -12%;
          width: 124%;
          height: 124%;
          pointer-events: none;
          opacity: 0.96;
        }
        .portal-main-column {
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-height: calc(100vh - 158px);
        }
        .portal-orbit-wrap {
          flex: 1;
          min-height: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 1024px) {
          .user-portal-shell {
            height: auto !important;
            min-height: 100dvh !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
          .portal-dashboard {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto !important;
            gap: 22px !important;
            padding: 24px 22px 34px !important;
            min-height: 100dvh !important;
          }
          .portal-dashboard-aside {
            min-height: auto !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(36,20,22,0.12);
            padding-right: 0 !important;
            padding-bottom: 22px;
          }
          .portal-dashboard-aside h1 {
            margin-top: 10px !important;
            max-width: 760px !important;
          }
          .portal-dashboard-aside p {
            max-width: 720px !important;
          }
          .portal-aside-hero {
            text-align: center !important;
            align-items: center !important;
            margin: 0 auto !important;
          }
          .portal-aside-clock {
            min-height: 220px !important;
          }
          .portal-logout-button {
            align-self: center !important;
          }
          .portal-main-column {
            min-height: auto !important;
            gap: 16px !important;
          }
          .portal-orbit-wrap {
            min-height: 480px !important;
          }
          .portal-module-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .portal-module-orbit {
            width: min(680px, 100%) !important;
            height: 480px !important;
          }
          .portal-panel-root {
            position: relative !important;
            min-height: 100dvh !important;
            overflow-x: hidden !important;
          }
          .portal-panel-header {
            padding: 20px 64px 18px !important;
          }
          .portal-panel-header-inner {
            max-width: 100% !important;
            grid-template-columns: auto minmax(0, 1fr) auto !important;
          }
          .portal-panel-content {
            padding: 32px 64px 46px !important;
            min-height: calc(100dvh - 96px) !important;
          }
          .portal-panel-inner {
            max-width: 100% !important;
          }
        }
        @media (max-width: 820px) {
          .portal-dashboard {
            padding: 20px 18px 30px !important;
          }
          .portal-notice-bar {
            gap: 14px !important;
            padding: 9px 14px !important;
            border-radius: 16px !important;
          }
          .portal-notice-bar img {
            width: 42px !important;
            height: 42px !important;
            border-radius: 12px !important;
          }
          .portal-notice-track {
            gap: 56px !important;
          }
          .portal-notice-track span {
            font-size: 14px !important;
          }
          .portal-orbit-wrap {
            min-height: 430px !important;
          }
          .portal-module-orbit {
            width: min(600px, 100%) !important;
            height: 420px !important;
          }
          .portal-module-tile {
            width: 110px !important;
            height: 110px !important;
            min-height: 110px !important;
          }
          .portal-module-tile p {
            font-size: 16px !important;
          }
          .portal-module-tile[aria-label="Check-in"] {
            width: 142px !important;
            height: 142px !important;
            min-height: 142px !important;
          }
          .portal-module-tile[aria-label="Check-in"] p {
            font-size: 22px !important;
          }
          .portal-panel-header {
            gap: 12px !important;
            padding: 18px 36px !important;
          }
          .portal-panel-header-inner {
            max-width: 100% !important;
            gap: 12px !important;
            grid-template-columns: auto minmax(0, 1fr) auto !important;
          }
          .portal-panel-header-inner > div:last-child {
            min-width: 0 !important;
          }
          .portal-panel-header p:first-child {
            font-size: 28px !important;
            line-height: 1.08 !important;
            white-space: normal !important;
          }
          .portal-panel-header p:last-child {
            font-size: 14px !important;
          }
          .portal-panel-content {
            padding: 24px 36px 36px !important;
          }
        }
        @media (max-width: 640px) {
          .portal-dashboard {
            padding: 14px 14px 24px !important;
            gap: 18px !important;
          }
          .portal-notice-bar {
            grid-template-columns: auto minmax(0, 1fr) !important;
            min-height: 52px !important;
            padding: 8px 12px !important;
            text-align: left;
          }
          .portal-notice-bar > span {
            display: none !important;
          }
          .portal-dashboard-aside {
            padding-bottom: 18px !important;
          }
          .portal-aside-hero {
            padding: 0 4px !important;
          }
          .portal-dashboard-aside h1 {
            font-size: 40px !important;
            line-height: 0.98 !important;
          }
          .portal-dashboard-aside p {
            margin-top: 16px !important;
            font-size: 16px !important;
            line-height: 1.55 !important;
          }
          .portal-dashboard-aside button {
            width: 100% !important;
            justify-content: center !important;
          }
          .portal-orbit-wrap {
            align-items: center !important;
            min-height: 430px !important;
            overflow: visible !important;
          }
          .portal-module-grid {
            grid-template-columns: 1fr !important;
          }
          .portal-module-orbit {
            display: block !important;
            width: min(100%, 390px) !important;
            height: 410px !important;
            min-height: 410px !important;
            margin: 0 auto !important;
          }
          .portal-orbit-ring {
            display: block !important;
          }
          .portal-orbit-canvas {
            display: block !important;
            inset: -8% !important;
            width: 116% !important;
            height: 116% !important;
            opacity: 0.82 !important;
          }
          .portal-module-tile {
            grid-column: auto !important;
            position: absolute !important;
            width: 82px !important;
            height: 82px !important;
            min-height: 82px !important;
            border-radius: 50% !important;
            transform: translate(-50%, -50%) !important;
            padding: 10px !important;
          }
          .portal-module-tile[aria-label="Check-in"] {
            grid-column: auto !important;
            width: 118px !important;
            height: 118px !important;
            min-height: 118px !important;
            border-radius: 50% !important;
          }
          .portal-module-tile > div {
            inset: 10px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
          }
          .portal-module-tile p {
            font-size: 13px !important;
            line-height: 1.05 !important;
          }
          .portal-module-tile[aria-label="Check-in"] p {
            font-size: 20px !important;
          }
          .portal-panel-header {
            align-items: flex-start !important;
            padding: 14px !important;
            gap: 10px !important;
          }
          .portal-panel-header-inner {
            gap: 10px !important;
            grid-template-columns: auto minmax(0, 1fr) auto !important;
          }
          .portal-header-spacer {
            width: 112px !important;
          }
          .portal-panel-header button {
            height: 38px !important;
            padding: 0 12px !important;
            border-radius: 11px !important;
          }
          .portal-panel-header p:first-child {
            font-size: 23px !important;
          }
          .portal-panel-header p:last-child {
            margin-top: 3px !important;
            font-size: 13px !important;
          }
          .portal-panel-content {
            padding: 16px 14px 26px !important;
            min-height: calc(100dvh - 76px) !important;
          }
          .portal-panel-content input,
          .portal-panel-content select,
          .portal-panel-content textarea,
          .portal-panel-content button {
            max-width: 100% !important;
          }
        }
        @media (max-width: 420px) {
          .portal-dashboard {
            padding: 12px 10px 22px !important;
          }
          .portal-dashboard-aside h1 {
            font-size: 34px !important;
          }
          .portal-dashboard-aside p {
            font-size: 15px !important;
          }
          .portal-orbit-wrap {
            min-height: 390px !important;
          }
          .portal-module-orbit {
            width: min(100%, 350px) !important;
            height: 370px !important;
            min-height: 370px !important;
          }
          .portal-module-tile {
            width: 72px !important;
            height: 72px !important;
            min-height: 72px !important;
          }
          .portal-module-tile[aria-label="Check-in"] {
            width: 106px !important;
            height: 106px !important;
            min-height: 106px !important;
          }
          .portal-module-tile p {
            font-size: 12px !important;
          }
          .portal-module-tile[aria-label="Check-in"] p {
            font-size: 18px !important;
          }
          .portal-panel-header {
            display: block !important;
          }
          .portal-panel-header-inner {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }
          .portal-panel-header-inner button {
            justify-self: start !important;
          }
          .portal-panel-header-inner > div:nth-child(2) {
            text-align: left !important;
          }
          .portal-header-spacer {
            display: none !important;
          }
        }
      `}</style>
      <AmbientBg />
      {activePage ? (
        <Panel
          activePage={activePage}
          onClose={() => setActivePage(null)}
          onLogout={onLogout}
          employee={employee}
          embed={embed}
        />
      ) : (
        <PortalDashboard
          allowedBubbles={allowedBubbles}
          onNavigate={handleBubbleClick}
          notifUnread={notifUnread}
          activeAnnouncements={activeAnnouncements}
          defaultAnnouncement={defaultAnnouncement}
          onLogout={onLogout}
        />
      )}
      <UserChatWidget embed={embed} />
    </div>
  );
}
function ModuleTile(props: {
  b: (typeof BUBBLES)[0];
  index: number;
  onClick: (id: BubbleId) => void;
  badge?: number;
  orbitStyle?: React.CSSProperties;
}) {
  const { b, index, onClick, badge, orbitStyle } = props;
  const featured = b.id === "checkin";
  const positioned = Boolean(orbitStyle);
  const baseTransform = positioned ? "translate(-50%, -50%)" : "none";
  return (
    <button
      className="portal-module-tile"
      type="button"
      onClick={() => onClick(b.id)}
      style={{
        width: positioned ? (featured ? 156 : 124) : undefined,
        height: positioned ? (featured ? 156 : 124) : undefined,
        minHeight: positioned ? (featured ? 156 : 124) : featured ? 184 : 132,
        gridColumn: positioned ? undefined : featured ? "span 2" : undefined,
        borderRadius: positioned ? "50%" : featured ? 22 : 16,
        border: featured
          ? "1px solid rgba(232,35,26,0.28)"
          : "1px solid rgba(36,20,22,0.1)",
        background: featured
          ? "linear-gradient(135deg, #E8231A 0%, #B91C1C 100%)"
          : "rgba(255,255,255,0.9)",
        color: featured ? "#fff7f7" : "#241416",
        padding: positioned ? "18px" : featured ? "28px" : "24px",
        textAlign: "left",
        fontFamily: "inherit",
        cursor: "pointer",
        position: positioned ? "absolute" : "relative",
        overflow: "hidden",
        boxShadow: featured
          ? "0 24px 70px rgba(232,35,26,0.18)"
          : "0 16px 44px rgba(95,15,22,0.08)",
        transition:
          "transform 0.22s ease, border-color 0.22s ease, background 0.22s ease, filter 0.22s ease",
        animation: positioned
          ? featured
            ? `portalTileFade 420ms ease ${index * 45}ms both, checkinSolarGlow 5.8s ease-in-out ${index * 45 + 420}ms infinite`
            : `portalTileFade 420ms ease ${index * 45}ms both`
          : `portalTileIn 420ms ease ${index * 45}ms both`,
        transform: baseTransform,
        ...orbitStyle,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = `${baseTransform} translateY(-3px)`;
        e.currentTarget.style.borderColor = featured
          ? "rgba(232,35,26,0.5)"
          : "rgba(232,35,26,0.32)";
        e.currentTarget.style.filter = featured ? "brightness(1.04)" : "none";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = baseTransform;
        e.currentTarget.style.borderColor = featured
          ? "rgba(232,35,26,0.28)"
          : "rgba(36,20,22,0.1)";
        e.currentTarget.style.filter = "none";
      }}
    >
      {b.id === "notifications" && badge != null && badge > 0 && (
        <span
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            minWidth: 28,
            height: 28,
            padding: "0 8px",
            borderRadius: 999,
            background: BRAND,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      )}
      <div
        style={{
          position: "absolute",
          left: positioned ? 14 : featured ? 28 : 24,
          right: positioned ? 14 : 24,
          top: positioned ? 14 : "auto",
          bottom: positioned ? 14 : featured ? 28 : 24,
          display: positioned ? "flex" : "block",
          alignItems: "center",
          justifyContent: "center",
          textAlign: positioned ? "center" : "left",
        }}
      >
        <p
          style={{
            fontSize: positioned ? (featured ? 24 : 17) : featured ? 34 : 24,
            lineHeight: 1.08,
            fontWeight: 800,
            color: featured ? "#fff7f7" : "#241416",
            margin: 0,
            letterSpacing: 0,
            whiteSpace: "normal",
            overflowWrap: "break-word",
          }}
        >
          {b.label}
        </p>
      </div>
    </button>
  );
}
function SolarOrbitCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    const rings = [
      {
        rx: 0.39,
        ry: 0.3,
        speed: 0.16,
        color: "232,35,26",
        alpha: 0.24,
        dots: 3,
        phase: 0.2,
      },
      {
        rx: 0.32,
        ry: 0.24,
        speed: -0.21,
        color: "255,122,122",
        alpha: 0.2,
        dots: 2,
        phase: 1.4,
      },
      {
        rx: 0.25,
        ry: 0.18,
        speed: 0.28,
        color: "122,29,34",
        alpha: 0.16,
        dots: 2,
        phase: 2.2,
      },
      {
        rx: 0.47,
        ry: 0.36,
        speed: -0.11,
        color: "232,35,26",
        alpha: 0.14,
        dots: 4,
        phase: 3.1,
      },
    ];
    const stars = Array.from({ length: 34 }, (_, i) => {
      const angle = i * 2.399963 + 0.4;
      const radius = 0.12 + (((i * 37) % 100) / 100) * 0.42;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.74,
        size: 0.8 + ((i * 19) % 7) * 0.18,
        phase: i * 0.63,
      };
    });
    const draw = (timeMs: number) => {
      const time = timeMs / 1000;
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height);
      const glow = ctx.createRadialGradient(
        cx,
        cy,
        scale * 0.08,
        cx,
        cy,
        scale * 0.34,
      );
      glow.addColorStop(0, "rgba(232,35,26,0.16)");
      glow.addColorStop(0.42, "rgba(232,35,26,0.06)");
      glow.addColorStop(1, "rgba(232,35,26,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.translate(cx, cy);
      stars.forEach((star) => {
        const twinkle =
          0.34 +
          Math.pow((Math.sin(time * 1.7 + star.phase) + 1) / 2, 2) * 0.48;
        ctx.beginPath();
        ctx.fillStyle = `rgba(232,35,26,${twinkle * 0.24})`;
        ctx.arc(star.x * scale, star.y * scale, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      rings.forEach((ring, ringIndex) => {
        const rx = ring.rx * width;
        const ry = ring.ry * height;
        const pulse = 0.72 + Math.sin(time * 0.75 + ring.phase) * 0.18;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${ring.color},${ring.alpha * pulse})`;
        ctx.lineWidth = ringIndex === 0 ? 1.15 : 0.85;
        ctx.shadowBlur = 14;
        ctx.shadowColor = `rgba(${ring.color},0.12)`;
        ctx.stroke();
        ctx.shadowBlur = 0;
        for (let i = 0; i < ring.dots; i += 1) {
          const angle =
            time * ring.speed + ring.phase + ((Math.PI * 2) / ring.dots) * i;
          const depth = (Math.sin(angle) + 1) / 2;
          const x = Math.cos(angle) * rx;
          const y = Math.sin(angle) * ry;
          const dotSize = 2.2 + depth * 4.2 + (ringIndex === 0 ? 1.2 : 0);
          const alpha = 0.45 + depth * 0.45;
          ctx.beginPath();
          ctx.fillStyle = `rgba(${ring.color},${alpha})`;
          ctx.shadowBlur = 18 + depth * 12;
          ctx.shadowColor = `rgba(${ring.color},0.52)`;
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${ring.color},${0.1 + depth * 0.1})`;
          ctx.lineWidth = 1;
          ctx.arc(x, y, dotSize + 6 + depth * 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="portal-orbit-canvas"
      aria-hidden="true"
    />
  );
}
function PortalModuleOrbit({
  allowedBubbles,
  onNavigate,
  notifUnread,
}: {
  allowedBubbles: typeof BUBBLES;
  onNavigate: (id: BubbleId) => void;
  notifUnread: number;
}) {
  const [orbitSize, setOrbitSize] = useState<
    "desktop" | "tablet" | "mobile" | "small"
  >("desktop");
  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      setOrbitSize(
        width <= 420
          ? "small"
          : width <= 640
            ? "mobile"
            : width <= 820
              ? "tablet"
              : "desktop",
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const center = allowedBubbles.find((b) => b.id === "checkin");
  const orbitItems = allowedBubbles.filter((b) => b.id !== "checkin");
  const radiusBySize = {
    desktop: { x: 42, y: 39 },
    tablet: { x: 40, y: 37 },
    mobile: { x: 35, y: 34 },
    small: { x: 33, y: 32 },
  }[orbitSize];
  const radiusX = radiusBySize.x;
  const radiusY = radiusBySize.y;
  return (
    <div
      className="portal-module-orbit"
      style={{
        position: "relative",
        width: 720,
        height: 520,
        maxWidth: "100%",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "visible",
        }}
      >
        <SolarOrbitCanvas />
        <div
          className="portal-orbit-ring"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "56%",
            height: "56%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(232,35,26,0.12) 0%, rgba(232,35,26,0.05) 34%, transparent 68%)",
            transform: "translate(-50%, -50%)",
            animation: "orbitHaloBreathe 7.5s ease-in-out infinite",
          }}
        />
      </div>
      {center && (
        <ModuleTile
          b={center}
          index={0}
          onClick={onNavigate}
          orbitStyle={{ left: "50%", top: "50%" }}
        />
      )}
      {orbitItems.map((b, index) => {
        const angle =
          ((-90 + (360 / Math.max(orbitItems.length, 1)) * index) * Math.PI) /
          180;
        const left = 50 + Math.cos(angle) * radiusX;
        const top = 50 + Math.sin(angle) * radiusY;
        return (
          <ModuleTile
            key={b.id}
            b={b}
            index={index + 1}
            onClick={onNavigate}
            badge={b.id === "notifications" ? notifUnread : undefined}
            orbitStyle={{ left: `${left}%`, top: `${top}%` }}
          />
        );
      })}
    </div>
  );
}
function PortalNoticeBar({
  unread,
  announcements,
  defaultAnnouncement,
}: {
  unread: number;
  announcements: Announcement[];
  defaultAnnouncement: string;
}) {
  const notices =
    announcements.length > 0
      ? announcements.map((item) => ({
          id: item.id,
          text: `${item.title}${item.content ? ` - ${item.content}` : ""}`,
          priority: item.priority,
        }))
      : defaultAnnouncement
        ? [
            {
              id: "default",
              text: defaultAnnouncement,
              priority: "low" as const,
            },
          ]
        : [];
  const repeatedNotices = notices.length > 0 ? [...notices, ...notices] : [];
  const duration = Math.max(
    24,
    notices.reduce((sum, item) => sum + item.text.length, 0) * 0.28,
  );
  return (
    <div
      className="portal-notice-bar"
      style={{
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr) auto",
        alignItems: "center",
        gap: 18,
        minHeight: 58,
        padding: "4px 0",
        background: "transparent",
        border: "none",
        boxShadow: "none",
      }}
    >
      <ImageWithFallback
        src={dudiLogo}
        alt="DUDI Software"
        style={{ width: 48, height: 48, borderRadius: 14, objectFit: "cover" }}
      />
      <div style={{ minWidth: 0, overflow: "hidden", position: "relative" }}>
        {repeatedNotices.length > 0 && (
          <div
            className="portal-notice-track"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 72,
              whiteSpace: "nowrap",
              minWidth: "max-content",
              ["--notice-duration" as any]: `${duration}s`,
            }}
          >
            {repeatedNotices.map((notice, index) => (
              <div
                key={`${notice.id}-${index}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 28,
                }}
              >
                <span
                  style={{
                    color: "#241416",
                    fontSize: 15,
                    fontWeight: 800,
                    lineHeight: "20px",
                  }}
                >
                  {notice.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <span
        style={{
          minWidth: 42,
          height: 34,
          padding: "0 12px",
          borderRadius: 999,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: announcements.length > 0 ? BRAND : "#fff1f2",
          color: announcements.length > 0 ? "#FFFFFF" : "#7a1d22",
          fontSize: 13,
          fontWeight: 900,
        }}
      >
        {announcements.length > 0
          ? announcements.length
          : unread > 9
            ? "9+"
            : unread}
      </span>
    </div>
  );
}
function PortalDashboard({
  allowedBubbles,
  onNavigate,
  notifUnread,
  activeAnnouncements,
  defaultAnnouncement,
  onLogout,
}: {
  allowedBubbles: typeof BUBBLES;
  onNavigate: (id: BubbleId) => void;
  notifUnread: number;
  activeAnnouncements: Announcement[];
  defaultAnnouncement: string;
  onLogout: () => void;
}) {
  return (
    <div
      className="portal-dashboard"
      style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100%",
        display: "grid",
        gridTemplateColumns: "minmax(320px, 0.72fr) minmax(520px, 1.28fr)",
        gridTemplateRows: "auto minmax(0, 1fr)",
        gap: "28px 34px",
        padding: "28px 52px 44px",
        alignItems: "stretch",
      }}
    >
      <div style={{ gridColumn: "1 / -1" }}>
        <PortalNoticeBar
          unread={notifUnread}
          announcements={activeAnnouncements}
          defaultAnnouncement={defaultAnnouncement}
        />
      </div>
      <div
        className="portal-dashboard-aside"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: "calc(100vh - 158px)",
          borderRight: "1px solid rgba(36,20,22,0.1)",
          paddingRight: 34,
        }}
      >
        <div
          className="portal-aside-hero"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: 560,
            margin: "20px auto 0",
          }}
        >
          <div
            style={{
              width: 54,
              height: 3,
              borderRadius: 99,
              background: BRAND,
              marginBottom: 24,
              boxShadow: "0 10px 26px rgba(232,35,26,0.18)",
            }}
          />
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(40px, 5.2vw, 64px)",
              lineHeight: 1,
              fontWeight: 800,
              color: "#241416",
              letterSpacing: 0,
              maxWidth: 520,
            }}
          >
            Không gian làm việc
          </h1>
          <p
            style={{
              marginTop: 22,
              maxWidth: 500,
              fontSize: 18,
              lineHeight: 1.72,
              color: "#6f565a",
              fontWeight: 650,
            }}
          >
            Truy cập nhanh chấm công, hồ sơ, công việc, nghỉ phép và các thông
            báo nội bộ.
          </p>
        </div>
        <div
          className="portal-aside-clock"
          style={{
            flex: "0 1 auto",
            minHeight: 260,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "28px 0",
          }}
        >
          <FloatingClock />
        </div>
        <div
          className="portal-aside-actions"
          style={{
            display: "flex",
            justifyContent: "center",
            paddingBottom: 8,
          }}
        >
          <button
            className="portal-logout-button"
            type="button"
            onClick={onLogout}
            style={{
              alignSelf: "center",
              border: "1px solid rgba(232,35,26,0.18)",
              background: "#FFFFFF",
              color: "#7a1d22",
              borderRadius: 999,
              padding: "12px 22px",
              fontSize: 14,
              fontWeight: 800,
              fontFamily: "inherit",
              cursor: "pointer",
              boxShadow: "0 12px 28px rgba(95,15,22,0.07)",
              transition:
                "border-color 0.2s ease, color 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = BRAND;
              e.currentTarget.style.color = BRAND;
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(232,35,26,0.18)";
              e.currentTarget.style.color = "#7a1d22";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>
      <div
        className="portal-main-column"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          minHeight: "calc(100vh - 158px)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 24,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.12em",
                color: "#9a6a6f",
                margin: 0,
              }}
            >
              CHỨC NĂNG
            </p>
          </div>
        </div>
        <div
          className="portal-orbit-wrap"
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PortalModuleOrbit
            allowedBubbles={allowedBubbles}
            onNavigate={onNavigate}
            notifUnread={notifUnread}
          />
        </div>
      </div>
    </div>
  );
}
