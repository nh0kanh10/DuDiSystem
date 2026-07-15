import React, { useState, useEffect } from "react";
import type { Employee, Announcement } from "../../types";
import { api, detectPublicIP, readStoredAuthUser, writeStoredAuthUser } from "@/lib/api";
import { useNotifications } from "../../hooks/useNotifications";
import { getStaffPortalModules, hasStaffModule, canShowStaffBlock } from "../../utils/staffModules";
import { useToast } from "../../hooks/useToast";
import { useEmployeeDirectory } from "../../hooks/useEmployeeDirectory";
import { removeVietnameseTones } from "../../utils";

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("GreetingMessageApp Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Import giao diện mới GreetingMessageApp
import GreetingMessageApp, { Background } from "./GreetingMessageApp";

// Backup simple component for testing
function SimpleGreetingApp({ employee, onNavigate, onLogout, dark, onToggleDark }: any) {
  return (
    <div style={{
      width: "100%",
      height: "100vh",
      background: dark ?
        "radial-gradient(ellipse 80% 60% at 50% 50%, #1A0810 0%, #0E0508 100%)" :
        "radial-gradient(ellipse 70% 55% at 50% 45%, #FFE4D8 0%, #FFF0E8 50%, #FFF8F4 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: dark ? "white" : "#241416"
    }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>
        Chào mừng {employee?.name || "User"}!
      </h1>
      <p style={{ fontSize: 16, marginBottom: 32 }}>
        Hệ thống DUDI đang hoạt động bình thường
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => onNavigate("leave")}
          style={{
            padding: "12px 24px",
            borderRadius: 12,
            background: "#E8231A",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          📅 Nghỉ phép
        </button>

        <button
          onClick={() => onNavigate("checkin")}
          style={{
            padding: "12px 24px",
            borderRadius: 12,
            background: "#FF8800",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          ✋ Chấm công
        </button>

        <button
          onClick={() => onNavigate("directory")}
          style={{
            padding: "12px 24px",
            borderRadius: 12,
            background: "#4F46E5",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          📱 Danh bạ
        </button>

        <button
          onClick={onToggleDark}
          style={{
            padding: "12px 24px",
            borderRadius: 12,
            background: dark ? "#F59E0B" : "#1F2937",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          {dark ? "☀️" : "🌙"} Theme
        </button>
      </div>

      <button
        onClick={onLogout}
        style={{
          marginTop: 32,
          padding: "8px 16px",
          borderRadius: 8,
          background: "transparent",
          color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
          border: `1px solid ${dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
          cursor: "pointer"
        }}
      >
        🚪 Đăng xuất
      </button>
    </div>
  );
}

// Import các component modal/panel cần thiết
import LeaveRequestPanel from "../nghi-phep/LeaveRequestPanel";
import UserChatWidget from "./UserChatWidget";
import { CrmStaffPage } from "../crm/CrmStaffPage";
import { X, Bell, CalendarDays, Zap, FileText, Eye, EyeOff, Trash2, CheckCircle2, User, Phone, Mail, FileDown, ArrowLeft, Palette, Sun, Moon, Copy } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { dudiLogo } from "../ui/BrandLogo";
import { Modal, ModalCancelButton } from "../ui/Modal";
import { EmployeeModal } from "../nhan-su/EmployeeManagement";
import { overlayLayer } from "../../utils/overlayLayers";

const BRAND = "#E8231A";
const CRIMSON = "#C01525";
const GOLD = "#FF8800";
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
  boxShadow: `0 0 24px rgba(232,35,26,0.28)`,
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

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-[800] tracking-[0.16em] uppercase text-[#8b5f64] dark:text-gray-400 mb-3.5">
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="text-[12px] font-[800] tracking-[0.04em] text-[#E8231A] dark:text-[#EF4444] dark:drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] mb-1.5">
      {children}
    </p>
  );
}

function FieldBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#fff5f5]/70 dark:bg-white/[0.06] border border-[#e8231a]/10 dark:border-white/10 rounded-[10px] py-2.5 px-3 text-[#241416] dark:text-gray-100 text-[14px] font-inherit w-full">
      {children}
    </div>
  );
}

// Import Panel cho Tasks và Checkin
import UserAttendance from "./UserAttendance";
import UserTasks from "./UserTasks";

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

function ModalWrapper({ children, onClose, title, subtitle }: { children: React.ReactNode; onClose: () => void; title: string; subtitle?: string; }) {
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

  return (
    <div
      className={`fixed inset-0 ${overlayLayer("staffModal")} flex items-center justify-center pb-[6vh] bg-black/60 dark:bg-black/40 backdrop-blur-md transition-opacity duration-[240ms] ease-out ${visible ? "opacity-100" : "opacity-0"}`}
      onClick={handleClose}
    >
      <div
        className={`w-[95%] sm:w-[90%] max-w-[850px] max-h-[85vh] bg-[#fdf2f2] dark:bg-white/[0.04] backdrop-blur-[36px] border border-[#efd7da] dark:border-white/10 rounded-[20px] shadow-[0_32px_80px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.7),inset_0_0_0_1px_rgba(255,255,255,0.03)] flex flex-col overflow-hidden transition-all duration-[240ms] ease-out ${visible ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-white/70 dark:bg-white/[0.04] border-b border-[#efd7da] dark:border-white/10 flex items-center justify-between">
          <div>
            <h2 className="m-0 text-[18px] sm:text-[22px] font-[800] text-[#111827] dark:text-white leading-none">
              {title}
            </h2>
            {subtitle && (
              <p className="m-0 mt-1.5 text-[13px] text-[#6B7280] dark:text-white/70 font-semibold">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full border border-[#efd7da] dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-100 hover:text-gray-900 dark:hover:border-red-500/50 dark:hover:text-white"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body with scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-6 custom-scrollbar-modal">
          {children}
        </div>
      </div>
    </div>
  );
    }

    // Panel cho Tasks, Checkin và CRM (full-page)
    function Panel({
      activePage,
      onClose,
      employee,
      canUseKpi = false,
      onOpenLead,
    }: {
      activePage: BubbleId;
      onClose: () => void;
      employee: Employee | null;
      canUseKpi?: boolean;
      onOpenLead?: (leadId: string) => void;
    }) {
      const isDark = document.documentElement.classList.contains("dark") || localStorage.getItem("dudi_theme_mode") === "dark";

      return (
    <div
      className={`fixed inset-0 ${overlayLayer("staffPanel")} overflow-y-auto flex flex-col`}
      style={{
        background: isDark
              ? "radial-gradient(ellipse 80% 60% at 50% 50%, #1A0810 0%, #0E0508 100%)"
          : "radial-gradient(ellipse 70% 55% at 50% 45%, #FFE4D8 0%, #FFF0E8 50%, #FFF8F4 100%)",
      }}
    >
          {/* Background layer absolute */}
          <Background dark={isDark} />

          {/* Content wrapper on top of background */}
          <div style={{ padding: "16px 24px", position: "relative", zIndex: 1, minHeight: "100%" }}>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/70 backdrop-blur-md border border-gray-200/50 text-gray-500 hover:text-[#E8231A] hover:border-red-200/50 hover:bg-red-50/70 hover:shadow-[0_8px_20px_rgba(232,35,26,0.15)] hover:-translate-y-0.5 transition-all outline-none"
              title="Quay lại"
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>

            <div style={{ marginTop: 24 }}>
              {activePage === "checkin" && <UserAttendance variant="default" />}
              {activePage === "tasks" && <UserTasks variant="portal" />}
              {activePage === "crm" && employee && (
                <CrmStaffContent employee={employee} canUseKpi={canUseKpi} onOpenLead={onOpenLead} />
              )}
            </div>
          </div>
        </div>
      );
    }

    // Directory with real API data
    function DirectoryContent() {
      const [search, setSearch] = useState("");
      const { employees, loading, error, reload } = useEmployeeDirectory();
      const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
      const [copied, setCopied] = useState(false);

      const handleCopy = (emp: any) => {
        const text = `Họ tên: ${emp.name}\nPhòng ban: ${emp.department}\nVị trí: ${emp.position}\nSĐT: ${emp.phone || "—"}\nEmail: ${emp.email || "—"}`;
        navigator.clipboard.writeText(text).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      const list = employees.filter((e) => {
        const q = removeVietnameseTones(search.trim().toLowerCase());
        if (!q) return true;
        const nameStr = removeVietnameseTones(e.name.toLowerCase());
        const deptStr = removeVietnameseTones(e.department.toLowerCase());
        const posStr = removeVietnameseTones(e.position.toLowerCase());
        const emailStr = (e.email || "").toLowerCase();
        return (
          nameStr.includes(q) ||
          deptStr.includes(q) ||
          posStr.includes(q) ||
          emailStr.includes(q)
        );
      });

      return (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2.5 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên nhân viên, phòng ban..."
                className="w-full bg-white dark:bg-white/[0.04] border border-[#efd7da] dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 outline-none focus:border-[#D4472A] text-sm font-medium transition-colors"
              />
            </div>
            <button
              onClick={reload}
              className="bg-white dark:bg-white/[0.04] border border-[#e8231a]/20 dark:border-white/10 text-[#7a1d22] dark:text-red-400 font-extrabold rounded-xl px-4 py-3 text-[13px] hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
            >
              Tải lại
            </button>
          </div>

          {error && <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>}

          {loading && (
            <div className="flex items-center justify-center p-6 text-[#7f5f63] dark:text-gray-400 text-[13px] font-medium">
              Đang tải...
            </div>
          )}

          {!loading && list.length === 0 && (
            <p className="text-[13px] text-[#7f5f63] dark:text-gray-400 text-center p-6 font-medium">
              Không tìm thấy nhân viên
            </p>
          )}

          <div className="flex flex-col gap-2.5">
            {list.map((emp) => {
              const isInactive = emp.status === "inactive"
              const isSuspended = emp.status === "suspended"
              const dimmed = isInactive || isSuspended
              return (
              <div
                key={emp.id}
                onClick={() => setSelectedEmp(emp)}
                className={`flex items-center gap-3.5 p-3.5 bg-white dark:bg-white/[0.04] border border-[#efd7da] dark:border-white/10 rounded-2xl shadow-[0_12px_30px_rgba(95,15,22,0.06)] dark:shadow-none cursor-pointer hover:border-[#D4472A]/50 transition-all ${dimmed ? "opacity-60" : ""}`}
              >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-black text-white shrink-0 shadow-[0_0_12px_rgba(212,71,42,0.4)]"
              style={{ background: dimmed ? "linear-gradient(135deg, #9ca3af, #6b7280)" : `linear-gradient(135deg, ${BRAND}, ${GOLD})` }}
            >
              {empInitials(emp.name)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-[15px] font-extrabold text-[#241416] dark:text-gray-100 truncate">
                    {emp.name}
                  </p>
                  {isInactive && (
                    <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-300">
                      Đã nghỉ
                    </span>
                  )}
                  {isSuspended && (
                    <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                      Tạm nghỉ
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-[#fff1f2] dark:bg-red-500/10 text-[#7a1d22] dark:text-red-400 shrink-0">
                  {emp.department}
                </span>
              </div>
              <p className="text-[13px] text-[#7f5f63] dark:text-gray-400 mt-0.5 font-medium">{emp.position}</p>

              <div className="flex gap-4 mt-2 flex-wrap">
                {emp.phone && (
                  <a
                    href={`tel:${emp.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-[#D4472A] no-underline hover:opacity-80"
                  >
                    Tel {emp.phone}
                  </a>
                )}
                {emp.email && (
                  <a
                    href={`mailto:${emp.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-[#6f565a] dark:text-gray-400 no-underline hover:opacity-80"
                  >
                    Email {emp.email}
                  </a>
                )}
              </div>
            </div>
          </div>
              )
            })}
      </div>

      {/* Detail Modal Overlay */}
      {selectedEmp && (
        <div
          className={`fixed inset-0 ${overlayLayer("nestedModal")} flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur-[12px] transition-opacity`}
          onClick={() => setSelectedEmp(null)}
        >
          <div
            className="w-[90%] max-w-[400px] bg-[#fdf2f2]/90 dark:bg-white/[0.04] backdrop-blur-[36px] border border-[#efd7da] dark:border-white/10 rounded-[24px] p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedEmp(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              <X size={16} strokeWidth={3} />
            </button>
            <div className="flex flex-col items-center mt-2">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-[22px] font-black text-white shadow-xl shadow-red-500/20 mb-4"
                style={{ background: `linear-gradient(135deg, ${BRAND}, ${GOLD})` }}
              >
                {empInitials(selectedEmp.name)}
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-1.5">{selectedEmp.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-3">{selectedEmp.position}</p>
              <span className="px-3 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-xs font-bold text-[#D4472A]">
                {selectedEmp.department}
              </span>
            </div>

            <div className="mt-6 space-y-3 bg-white/50 dark:bg-white/[0.04] p-4 rounded-[16px] border border-[#efd7da] dark:border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-gray-400">SĐT</span>
                <span className="text-sm font-black text-[#D4472A]">{selectedEmp.phone || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-gray-400">EMAIL</span>
                <span className="text-sm font-black text-gray-800 dark:text-gray-200">{selectedEmp.email || "—"}</span>
              </div>
            </div>

            <button
              onClick={() => handleCopy(selectedEmp)}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 bg-white/50 dark:bg-white/[0.04] backdrop-blur-md border border-[#efd7da] dark:border-white/10 text-[#D4472A] dark:text-gray-100 rounded-xl text-sm font-extrabold shadow-sm hover:bg-white/80 dark:hover:bg-white/10 transition-all"
            >
              {copied ? <CheckCircle2 size={18} className="text-green-500 dark:text-green-400" /> : <Copy size={18} />}
              {copied ? "Đã sao chép!" : "Sao chép thông tin"}
            </button>
          </div>
        </div>
      )}
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
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<any | null>(null);

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
      .catch(() => { })
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
      .catch(() => { })
      .finally(() => setLoadingAdminRequests(false));
  };

  useEffect(() => {
    api.orgNodes
      .list()
      .then(setOrgNodes)
      .catch(() => { });
  }, []);

  useEffect(() => {
    loadAdminRequests();
    loadAnnouncements();
  }, [employee?.id]);

  useEffect(() => {
    if (activeSubTab === "broadcast") {
      loadAnnouncements();
    } else if (activeSubTab === "admin_req") {
      loadAdminRequests();
    }
  }, [activeSubTab]);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="flex border-b border-gray-100 dark:border-white/10 mb-2">
        <button
          onClick={() => setActiveSubTab("inbox")}
          className={`flex-1 py-3 text-sm font-bold border-b-2 text-center transition-all ${activeSubTab === "inbox"
            ? "border-[#EF4444] text-[#EF4444] font-extrabold"
            : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
        >
          Thông báo cá nhân{" "}
          {unread > 0 && (
            <span className="ml-1 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {unread}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("admin_req")}
          className={`flex-1 py-3 text-sm font-bold border-b-2 text-center transition-all ${activeSubTab === "admin_req"
            ? "border-[#EF4444] text-[#EF4444] font-extrabold"
            : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
        >
          Yêu cầu từ Admin{" "}
          {adminRequests.length > 0 && (
            <span className="ml-1 bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {adminRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("broadcast")}
          className={`flex-1 py-3 text-sm font-bold border-b-2 text-center transition-all ${activeSubTab === "broadcast"
            ? "border-[#EF4444] text-[#EF4444] font-extrabold"
            : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
        >
          Thông báo hệ thống{" "}
          {announcements.length > 0 && (
            <span className="ml-1 bg-blue-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {announcements.length}
            </span>
          )}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={handleReload}
          className="px-4 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
        >
          Tải lại
        </button>
        {activeSubTab === "inbox" && unread > 0 && (
          <button
            onClick={markAllRead}
            className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition-colors"
          >
            Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {activeSubTab === "inbox" && (
          <>
            {loadingInbox && <p style={{ fontSize: 13, color: "#7f5f63", padding: 16, textAlign: "center" }}>Đang tải...</p>}
            {!loadingInbox && items.length === 0 && (
              <p style={{ fontSize: 13, color: "#7f5f63", textAlign: "center", padding: 16 }} className="dark:text-gray-400">
                Không có thông báo
              </p>
            )}
            {items.map((item) => {
              const clr = typeColor(item.type);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.read) markRead(item.id);
                    setDetailItem(item);
                    setDetailOpen(true);
                  }}
                  className="relative p-5 bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-white/20 transition-all flex gap-4 overflow-hidden cursor-pointer"
                  style={{
                    borderLeft: `5px solid ${clr}`,
                    opacity: item.read ? 0.85 : 1,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      color: clr,
                      background: `${clr}10`,
                    }}
                  >
                    <Bell size={18} />
                  </div>
                  <div className="flex-1 space-y-2 pr-12">
                    <div className="flex items-center gap-2">
                      {item.type && (
                        <span
                          className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
                          style={{
                            color: clr,
                            background: `${clr}15`,
                          }}
                        >
                          {item.type}
                        </span>
                      )}
                      {item.time && (
                        <span className="text-[11px] text-gray-400 dark:text-gray-300 font-semibold">
                          {item.time}
                        </span>
                      )}
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                      )}
                    </div>
                    <div className="space-y-1">
                      {item.title && (
                        <h5 className="text-sm font-bold text-gray-800 dark:text-white dark:drop-shadow-sm">
                          {item.title}
                        </h5>
                      )}
                      <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-200 line-clamp-2">
                        {item.message}
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(item.id);
                      }}
                      className="p-1.5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-400 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-all cursor-pointer flex items-center justify-center"
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
                  className="relative p-5 bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-white/20 transition-all flex gap-4 overflow-hidden cursor-pointer"
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
                        <span className="text-[11px] text-gray-400 dark:text-gray-300 font-semibold">
                          {r.createdAt}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-sm font-bold text-gray-800 dark:text-white dark:drop-shadow-sm">
                        {isRework
                          ? "Admin yêu cầu sửa đổi thông tin bổ sung"
                          : "Admin yêu cầu cập nhật hồ sơ nhân sự"}
                      </h5>
                      {isRework && r.reworkReason && (
                        <div className="bg-red-50/50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl p-3 mt-2">
                          <span className="text-[10px] text-red-500 dark:text-red-400 font-extrabold uppercase tracking-wider block mb-1">
                            Lý do yêu cầu sửa lại:
                          </span>
                          <p className="text-xs text-red-700 dark:text-red-300 font-medium leading-relaxed">
                            {r.reworkReason}
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
                      className="p-1.5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-400 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 rounded-xl transition-all cursor-pointer flex items-center justify-center"
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
                  className="relative p-5 bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-white/20 transition-all flex gap-4 overflow-hidden cursor-pointer"
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
                        <span className="text-[11px] text-gray-400 dark:text-gray-300 font-semibold">
                          {a.createdAt || a.startTime}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {a.title && (
                        <h5 className="text-sm font-bold text-gray-800 dark:text-white dark:drop-shadow-sm">
                          {a.title}
                        </h5>
                      )}
                      <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-200 line-clamp-2">
                        {a.content}
                      </p>
                    </div>
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
        bodyClassName="p-6 bg-gray-50/40 dark:bg-white/[0.02]"
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
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
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
              <div className="bg-white dark:bg-white/[0.04] rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm">
                <span className="text-[10px] text-red-500 dark:text-red-400 font-bold uppercase tracking-wider block mb-1.5">
                  Tiêu đề thông báo
                </span>
                <h4 className="text-sm font-black text-gray-800 dark:text-white leading-snug">
                  {detailItem.title}
                </h4>
              </div>
            )}
            <div className="bg-white dark:bg-white/[0.04] rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm">
              <span className="text-[10px] text-gray-400 dark:text-gray-400/80 font-bold uppercase tracking-wider block mb-2 border-b border-gray-50 dark:border-white/5 pb-1.5">
                Nội dung chi tiết
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
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




// Employee Profile Modal with 5 tabs - Light theme (white background)
function EmployeeProfileModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
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
  const photos = Array.isArray(employee.photos) ? employee.photos : [];
  const attachments = Array.isArray(employee.attachments) ? employee.attachments : [];
  const mergedHistory = history.length > 0
    ? history
    : [
      employee.joinDate
        ? {
          id: 1,
          type: "join",
          date: employee.joinDate,
          title: employee.position || "Nhận việc",
          snapshot: [employee.department, employee.contractType].filter(Boolean).join(" · "),
        }
        : null,
      employee.status === "inactive" && employee.resignDate
        ? {
          id: 2,
          type: "resign",
          date: employee.resignDate,
          title: "Nghỉ việc",
          snapshot: employee.department || employee.position || "",
        }
        : null,
    ].filter(Boolean) as any[];

  const EMP_STATUS_LABEL: Record<string, string> = {
    active: "Đang làm việc",
    inactive: "Đã nghỉ",
    intern: "Thực tập",
  };

  const InfoField = ({
    l,
    v,
  }: {
    l: string;
    v: React.ReactNode;
  }) => (
    <div>
      <FieldLabel>{l}</FieldLabel>
      <FieldBox>{v || "—"}</FieldBox>
    </div>
  );

  return (
    <ModalWrapper title="Hồ sơ nhân viên" onClose={onClose}>
      <div className="flex flex-col gap-4 bg-transparent w-full">
        {/* Header Card */}
        <div className="flex items-center gap-[18px] px-5 py-4 bg-white dark:bg-white/[0.04] border border-[#efd7da] dark:border-white/10 rounded-[18px] shadow-[0_14px_36px_rgba(95,15,22,0.07)] dark:shadow-none">
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div className="w-[68px] h-[68px] rounded-full overflow-hidden flex items-center justify-center text-[20px] font-black text-white bg-gradient-to-br from-[#E8231A] to-[#FF8800] dark:from-[#EF4444] dark:to-[#EF4444]/70 shadow-[0_0_24px_rgba(232,35,26,0.28)] dark:shadow-[0_0_20px_rgba(239,68,68,0.6)]">
              {employee.avatar ? (
                <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover" />
              ) : (
                empInitials(employee.name)
              )}
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
            <h2 className="text-[20px] font-extrabold text-[#241416] dark:text-white leading-[1.2] tracking-wide">
              {employee.name}
            </h2>
            <p className="text-[13px] text-[#7f5f63] dark:text-gray-300 mt-1">
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
              <span className="px-2.5 py-0.5 rounded-[100px] text-[11px] font-bold text-[#E8231A] dark:text-[#EF4444] bg-[#E8231A]/10 dark:bg-[#EF4444]/10 border-none">
                {employee.department}
              </span>
              <span className="font-mono text-[11px] text-[#8b6b70] dark:text-gray-400">
                #{employee.id}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-[rgba(36,20,22,0.1)] dark:border-white/10 mt-0.5">
          {["Thông tin chung", "Công việc", "Liên hệ", "Tài liệu & Hình ảnh"].map((t, i) => {
            const badges: Record<number, number> = { 3: photos.length + attachments.length };
            const badge = badges[i];
            const isActive = activeTab === i;
            return (
              <button
                key={t}
                onClick={() => setActiveTab(i)}
                className={`flex-1 py-3 bg-transparent border-none cursor-pointer text-[13px] font-bold transition-all relative outline-none border-b-2 ${isActive ? "text-[#E8231A] dark:text-[#EF4444] border-b-[#E8231A] dark:border-b-[#EF4444]" : "text-[#8b6b70] dark:text-gray-400 border-b-transparent hover:text-[#241416] dark:hover:text-gray-200"}`}
              >
                {t}
                {badge && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${isActive ? "bg-[#E8231A] text-white dark:bg-[#EF4444]" : "bg-[#e0e0e0] text-[#666] dark:bg-white/10 dark:text-gray-400"}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 0: Thông tin chung - 9 fields */}
        {activeTab === 0 && (
          <div className="p-[16px_18px] bg-white dark:bg-white/[0.04] border border-[#efd7da] dark:border-white/10 rounded-2xl">
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
            >
              <InfoField l="Mã NV" v={employee.id} />
              <InfoField l="Họ tên" v={employee.name} />
              <InfoField l="Ngày sinh" v={employee.dob} />
              <InfoField l="Giới tính" v={employee.gender} />
              <InfoField l="Số CCCD" v={employee.cccd} />
              <InfoField l="Nơi cấp" v={employee.cccdPlace} />
              <InfoField l="Ngân hàng" v={employee.bank} />
              <InfoField l="Số tài khoản" v={employee.bankAccount} />
              <div style={{ gridColumn: "span 2" }}>
                <InfoField l="Trường học" v={employee.university} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Công việc */}
        {activeTab === 1 && (
          <div className="space-y-4">
            <div className="p-[16px_18px] bg-white dark:bg-white/[0.04] border border-[#efd7da] dark:border-white/10 rounded-2xl">
              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
              >
                <InfoField l="Phòng ban" v={employee.department} />
                <InfoField l="Vị trí" v={employee.position} />
                <InfoField l="Loại hợp đồng" v={employee.contractType} />
                <InfoField l="Ngày bắt đầu" v={employee.joinDate} />
                <div style={{ gridColumn: "span 2" }}>
                  <InfoField
                    l="Trạng thái"
                    v={EMP_STATUS_LABEL[employee.status] ?? employee.status}
                  />
                </div>
              </div>
            </div>

            <div className="p-[16px_18px] bg-white dark:bg-white/[0.04] border border-[#efd7da] dark:border-white/10 rounded-2xl">
              <h4 className="text-[12px] font-black text-gray-400 uppercase tracking-wider mb-3">Lịch sử công tác & hợp đồng</h4>
              {mergedHistory.length === 0 ? (
                <p className="text-[13px] text-[#7f5f63] dark:text-gray-400">Chưa có dữ liệu lịch sử</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {mergedHistory.map((entry: any, idx: number) => (
                    <div key={entry.id || idx} className="flex items-start gap-2.5">
                      <div
                        className={`w-2 h-2 rounded-full mt-[5px] ${idx === 0 ? "bg-[#E8231A] dark:bg-red-400 shadow-[0_0_8px_#E8231A] dark:shadow-[0_0_8px_rgba(248,113,113,0.8)]" : "bg-[#e8231a]/30 dark:bg-white/20"}`}
                      />
                      <div>
                        <p className={`text-[13px] ${idx === 0 ? "font-[800] text-[#241416] dark:text-gray-100" : "font-[700] text-[#5f4246] dark:text-gray-400"}`}>
                          {entry.title}
                        </p>
                        <p className="text-[11px] text-[#7f5f63] dark:text-gray-500 mt-[2px]">
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
        )}

        {/* Tab 2: Liên hệ */}
        {activeTab === 2 && (
          <div className="p-[16px_18px] bg-white dark:bg-white/[0.04] border border-[#efd7da] dark:border-white/10 rounded-2xl">
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
            >
              <div style={{ gridColumn: "span 2" }}>
                <InfoField l="Email" v={employee.email} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <InfoField l="Số điện thoại" v={employee.phone} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <InfoField l="Quê quán" v={hometown} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <InfoField l="Địa chỉ hiện tại" v={address} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Tài liệu & Hình ảnh */}
        {activeTab === 3 && (
          <div className="p-[16px_18px] bg-white dark:bg-white/[0.04] border border-[#efd7da] dark:border-white/10 rounded-2xl">
            <div className="flex flex-col gap-4">
              <div>
                <SectionLabel>Hình ảnh hồ sơ</SectionLabel>
                {photos.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#e8231a]/15 dark:border-white/10 bg-[#fff5f5]/50 dark:bg-white/[0.03] px-4 py-6 text-center text-[13px] text-[#8b6b70] dark:text-gray-400">
                    Chưa có hình ảnh hồ sơ
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {photos.map((url, idx) => (
                      <a
                        key={`${url}-${idx}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block aspect-square overflow-hidden rounded-xl border border-[#e8231a]/10 dark:border-white/10 bg-[#fff5f5]/70 dark:bg-white/[0.04]"
                      >
                        <img src={url} alt={`Hồ sơ ${employee.name} ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2 text-[11px] font-semibold text-white">
                          Ảnh {idx + 1}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <SectionLabel>Tài liệu & liên kết</SectionLabel>
                {attachments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#e8231a]/15 dark:border-white/10 bg-[#fff5f5]/50 dark:bg-white/[0.03] px-4 py-6 text-center text-[13px] text-[#8b6b70] dark:text-gray-400">
                    Chưa có tài liệu đính kèm
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {attachments.map((file: any, idx: number) => (
                      <div
                        key={file.id || `${file.url}-${idx}`}
                        className="flex items-center justify-between gap-3 p-[12px_14px] bg-[#fff5f5]/70 dark:bg-white/[0.04] border border-[#e8231a]/10 dark:border-white/10 rounded-xl"
                      >
                        <div className="flex items-center gap-[10px] min-w-0">
                          <FileText size={20} className="text-[#E8231A] dark:text-red-400 shrink-0" />
                          <div className="min-w-0">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block truncate text-[14px] font-[600] text-[#241416] dark:text-gray-200 hover:underline"
                            >
                              {file.name || file.url}
                            </a>
                            <div className="text-[11px] text-[#8b6b70] dark:text-gray-400 mt-0.5">
                              {file.type === "link" ? "Liên kết" : "Tài liệu"}{file.uploadedAt ? ` · ${file.uploadedAt}` : ""}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-[#E8231A] dark:bg-red-500/20 text-white dark:text-red-300 border-none rounded-lg cursor-pointer text-[12px] font-[700]"
                          >
                            Xem
                          </a>
                          {file.type !== "link" && (
                            <a
                              href={file.url}
                              download={file.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-white dark:bg-transparent text-[#E8231A] dark:text-red-400 border border-[#E8231A] dark:border-red-400/50 rounded-lg cursor-pointer text-[12px] font-[700]"
                            >
                              Tải
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}

// Settings Content với change password và theme switch
function SettingsContent({
  onLogout,
  employee,
  dark,
  onToggleDark
}: {
  onLogout: () => void;
  employee: Employee | null;
  dark: boolean;
  onToggleDark: () => void;
}) {
  const [vals, setVals] = useState(["", "", ""]);
  const [shows, setShows] = useState([false, false, false]);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const labels = ["Mật khẩu cũ", "Mật khẩu mới", "Xác nhận mật khẩu mới"];

  const handleChangePassword = async () => {
    const oldPassword = vals[0].trim();
    const newPassword = vals[1].trim();
    const confirmPassword = vals[2].trim();

    setErrorMsg(null);
    setSaved(false);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMsg("Vui lòng điền đầy đủ các thông tin mật khẩu.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword === oldPassword) {
      setErrorMsg("Mật khẩu mới không được trùng với mật khẩu cũ.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      await api.auth.changePassword(oldPassword, newPassword);
      setSaved(true);
      setVals(["", "", ""]);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* THÔNG TIN TÀI KHOẢN */}
      <div className="space-y-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
          THÔNG TIN TÀI KHOẢN
        </span>
        <div className="bg-white dark:bg-white/[0.04] rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-white/10 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Mã nhân viên</span>
            <span className="text-sm font-black text-gray-800 dark:text-white">{employee?.id || "—"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Họ tên</span>
            <span className="text-sm font-bold text-[#D4472A]">{employee?.name || "—"}</span>
          </div>
        </div>
      </div>

      {/* GIAO DIỆN (THEME SWITCH) */}
      <div className="space-y-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
          GIAO DIỆN
        </span>
        <div className="bg-white dark:bg-[#1C1C21]/60 rounded-3xl p-5 border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-[#341C21] flex items-center justify-center flex-shrink-0">
              <Palette size={22} className="text-[#D4472A]" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-gray-800 dark:text-white mb-0.5">Chủ đề màu</h4>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400/80">Chọn giao diện ưa thích</p>
            </div>
          </div>

          <div className="flex items-center bg-gray-50 dark:bg-[#18181C] p-1.5 rounded-[20px] border border-gray-100 dark:border-white/5 relative">
            <button
              onClick={() => dark && onToggleDark()}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] text-sm font-bold transition-all relative z-10 ${!dark
                ? "bg-[#D4472A] text-white shadow-sm shadow-rose-300"
                : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transparent"
                }`}
            >
              <Sun size={18} /> Sáng
            </button>
            <button
              onClick={() => !dark && onToggleDark()}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] text-sm font-bold transition-all relative z-10 ${dark
                ? "bg-[#D4472A] text-white shadow-sm"
                : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transparent"
                }`}
            >
              <Moon size={18} /> Tối
            </button>
          </div>
        </div>
      </div>

      {/* ĐỔI MẬT KHẨU */}
      <div className="space-y-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
          BẢO MẬT
        </span>
        <div className="bg-white dark:bg-white/[0.04] rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-white/10 shadow-sm flex flex-col gap-4">
          {labels.map((label, i) => (
            <div key={label}>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 block">{label}</label>
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
                  className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#D4472A]"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShows((p) => p.map((v, idx) => (idx === i ? !v : v)))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {shows[i] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}

          {saved && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold">
              <CheckCircle2 size={16} /> Đổi mật khẩu thành công!
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold">
              <X size={16} /> {errorMsg}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="mt-2 w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#D4472A] hover:bg-[#C04025] text-white rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>
        </div>
      </div>

    </div>
  );
}

// CRM staff with optional KPI tab (logic from main)
function CrmStaffContent({ employee, canUseKpi, onOpenLead }: { employee: Employee | null; canUseKpi: boolean; onOpenLead?: (leadId: string) => void }) {
  const [activeTab, setActiveTab] = useState<"data" | "kpi">("data");
  return (
    <div style={{ width: "100%" }}>
      {canUseKpi && (
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid rgba(0,0,0,0.08)", marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setActiveTab("data")}
            style={{
              padding: "10px 20px",
              fontWeight: 700,
              fontSize: 13,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              borderBottom: activeTab === "data" ? "2px solid #C62828" : "2px solid transparent",
              color: activeTab === "data" ? "#C62828" : "#8b6b70",
            }}
          >
            Danh sách data
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("kpi")}
            style={{
              padding: "10px 20px",
              fontWeight: 700,
              fontSize: 13,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              borderBottom: activeTab === "kpi" ? "2px solid #C62828" : "2px solid transparent",
              color: activeTab === "kpi" ? "#C62828" : "#8b6b70",
            }}
          >
            Quản lý KPI
          </button>
        </div>
      )}
      <CrmStaffPage employee={employee} activeTab={canUseKpi ? activeTab : "data"} onOpenLead={onOpenLead} />
    </div>
  );
}

// Main Component - sử dụng GreetingMessageApp làm giao diện chính
export default function UserPortalApp({
  onLogout,
  modules = [],
  embed = false,
  onOpenLead,
}: {
  onLogout: () => void;
  modules?: string[];
  embed?: boolean;
  onOpenLead?: (leadId: string) => void;
}) {
  const { showToast } = useToast();
  const [activePage, setActivePage] = useState<BubbleId | null>(null);
  const [dark, setDark] = useState(() => {
    const savedTheme = localStorage.getItem("dudi_theme_mode");
    if (savedTheme === "dark") return true;
    if (savedTheme === "light") return false;
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });
  const [employee, setEmployee] = useState<Employee | null>(null);
  const { unread: notifUnread } = useNotifications();
  const [adminReqCount, setAdminReqCount] = useState(0);
  const [checkingIP, setCheckingIP] = useState(false);
  const [attendanceHome, setAttendanceHome] = useState<{ checkedIn: boolean; checkInTime: string | null }>({
    checkedIn: false,
    checkInTime: null,
  });
  const canUseKpi = hasStaffModule(modules, "user-kpi");

  // Đồng bộ class dark lên document.documentElement
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    return () => {
      // Dọn dẹp class dark khi component bị unmount
      document.documentElement.classList.remove("dark");
    };
  }, [dark]);

  const handleToggleDark = () => {
    const newDark = !dark;
    setDark(newDark);
    localStorage.setItem("dudi_theme_mode", newDark ? "dark" : "light");
  };

  // Load admin request count
  useEffect(() => {
    if (!employee?.id) return;
    api.profileUpdates.list({ employeeId: employee.id })
      .then((data: any) => {
        const filtered = (data || []).filter((r: any) =>
          ["sent", "rework_requested"].includes(r.status)
        );
        setAdminReqCount(filtered.length);
      })
      .catch(() => { });
  }, [employee?.id, activePage]);

  const totalUnread = notifUnread + adminReqCount;

  useEffect(() => {
    if (!employee?.id) return;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const iso = `${yyyy}-${mm}-${dd}`;

    let cancelled = false;
    api.attendance
      .list({ employeeId: employee.id, date: iso })
      .then((rows: any) => {
        if (cancelled) return;
        const rec = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
        const checkInTime =
          rec?.checkIn && rec.checkIn !== "--"
            ? rec.checkIn
            : rec?.checkInAm && rec.checkInAm !== "--"
              ? rec.checkInAm
              : rec?.checkInPm && rec.checkInPm !== "--"
                ? rec.checkInPm
                : null;
        setAttendanceHome({
          checkedIn: Boolean(checkInTime),
          checkInTime,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setAttendanceHome({ checkedIn: false, checkInTime: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [employee?.id, activePage]);

  // Load employee data — đọc cả localStorage và sessionStorage (đăng nhập không "ghi nhớ")
  useEffect(() => {
    const loadEmployee = async () => {
      let userObj: any = readStoredAuthUser();
      try {
        if (!userObj) {
          userObj = await api.auth.me();
          if (userObj) writeStoredAuthUser(userObj);
        }
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
          id: userObj.employeeId || userObj.id || "admin",
          name: userObj.name || "Quản trị viên",
          email: userObj.email || "admin@dudi.vn",
          phone: userObj.phone || "—",
          department: userObj.department || "Ban Giám Đốc",
          position: userObj.roleName || userObj.position || "Quản trị viên",
          joinDate: userObj.joinDate || new Date().toLocaleDateString("vi-VN"),
          status: "active",
          contractType: userObj.contractType || "staff",
          workHistory: [],
        } as any;
        setEmployee(fallback);
      }
    };
    loadEmployee();
  }, []);

  const handleNavigate = async (id: BubbleId) => {
    if (!canShowStaffBlock(modules, id)) {
      showToast("Bạn không có quyền truy cập module này", "error");
      return;
    }
    if (id === "checkin") {
      if (checkingIP) {
        showToast("Đang kiểm tra wifi/IP, vui lòng đứng ngoài chờ một chút", "error");
        return;
      }
      const rawUser = localStorage.getItem("dudi_user") || sessionStorage.getItem("dudi_user");
      const parsedUser = rawUser ? JSON.parse(rawUser) : null;
      const isSuperAdmin = parsedUser?.roleId === "role-super-admin" || ["0000000000", "1111111111", "2222222222"].includes(parsedUser?.employeeId || parsedUser?.id || "");

      const dayOfWeek = new Date().getDay();
      if (!isSuperAdmin && (dayOfWeek === 0 || dayOfWeek === 6)) {
        showToast("Hệ thống không cho phép chấm công vào Thứ Bảy và Chủ Nhật!", "error");
        return;
      }
      setCheckingIP(true);
      try {
        const ip = await detectPublicIP();
        const ipStatus = await api.attendance.checkIP(ip);
        if (!ipStatus?.valid && !isSuperAdmin) {
          showToast(ipStatus?.message || "WiFi/IP hiện tại không hợp lệ, vui lòng đứng ngoài chờ", "error");
          return;
        }
      } catch (err) {
        console.warn("Failed to validate wifi/ip before opening attendance:", err);
        if (!isSuperAdmin) {
          showToast("Không kiểm tra được wifi/IP, vui lòng thử lại", "error");
          return;
        }
      } finally {
        setCheckingIP(false);
      }
      setActivePage(id);
      return;
    }
    setActivePage(id);
  };


  return (
    <div 
      className={dark ? "dark" : ""}
      style={{ width: "100%", height: embed ? "100%" : "100vh", overflow: "hidden", position: embed ? "absolute" : "relative", inset: embed ? 0 : undefined }}
    >



      {!employee ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #1A0810 0%, #0E0508 100%)",
          color: "white",
          gap: 20,
        }}>
          <div style={{ position: "relative", width: 64, height: 64 }}>
            <div style={{
              position: "absolute", inset: 0,
              borderRadius: "50%",
              border: "3px solid rgba(232,35,26,0.15)",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              borderRadius: "50%",
              border: "3px solid transparent",
              borderTopColor: "#E8231A",
              borderRightColor: "#FF8800",
              animation: "spin 0.9s linear infinite",
            }} />
            <div style={{
              position: "absolute", inset: 8,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #E8231A22, #FF880022)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 900, color: "#E8231A",
              letterSpacing: -1,
            }}>D</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 6 }}>
              Đang tải dữ liệu...
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
              Vui lòng đợi trong giây lát
            </div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          <ErrorBoundary fallback={
            <SimpleGreetingApp
              employee={employee}
              onNavigate={handleNavigate}
              onLogout={onLogout}
              dark={dark}
              onToggleDark={handleToggleDark}
            />
          }>
            <GreetingMessageApp
              employee={employee}
              onNavigate={handleNavigate}
              onLogout={onLogout}
              dark={dark}
              onToggleDark={handleToggleDark}
              checkingIP={checkingIP}
              attendanceCheckedIn={attendanceHome.checkedIn}
              attendanceCheckInTime={attendanceHome.checkInTime}
              modules={modules}
              compact={false}
              unreadCount={totalUnread}
            />
          </ErrorBoundary>
        </>
      )}

      {activePage === "employee" && employee && (
        <EmployeeProfileModal employee={employee} onClose={() => setActivePage(null)} />
      )}

      {activePage === "settings" && (
        <ModalWrapper title="Cài đặt tài khoản" onClose={() => setActivePage(null)}>
          <SettingsContent onLogout={onLogout} employee={employee} dark={dark} onToggleDark={handleToggleDark} />
        </ModalWrapper>
      )}

      {activePage === "leave" && employee && (
        <ModalWrapper title="Quản lý ngày nghỉ" subtitle="Phép & Time off" onClose={() => setActivePage(null)}>
          <LeaveRequestPanel employee={employee} variant="portal" />
        </ModalWrapper>
      )}

      {activePage === "directory" && (
        <ModalWrapper title="Danh bạ nội bộ" onClose={() => setActivePage(null)}>
          <DirectoryContent />
        </ModalWrapper>
      )}

      {activePage === "notifications" && (
        <ModalWrapper title="Thông báo hệ thống" onClose={() => setActivePage(null)}>
          <NotificationsContent employee={employee} />
        </ModalWrapper>
      )}

      {activePage === "workflow" && (
        <ModalWrapper title="Quy trình nội bộ" subtitle="Trình duyệt" onClose={() => setActivePage(null)}>
          <div style={{ padding: 24, color: "rgba(255,210,210,0.38)", textAlign: "center", fontSize: 14 }}>
            Tính năng đang phát triển
          </div>
        </ModalWrapper>
      )}

      {activePage === "chat" && (
        <ModalWrapper title="Chat nội bộ" subtitle="Tin nhắn" onClose={() => setActivePage(null)}>
          <div style={{ padding: 24, color: "rgba(255,210,210,0.38)", textAlign: "center", fontSize: 14 }}>
            Chat feature đang phát triển
          </div>
        </ModalWrapper>
      )}

      {(activePage === "tasks" || activePage === "checkin" || activePage === "crm") && employee && (
        <Panel
          activePage={activePage}
          onClose={() => setActivePage(null)}
          employee={employee}
          canUseKpi={canUseKpi}
          onOpenLead={onOpenLead}
        />
      )}

      <UserChatWidget embed={embed} />
    </div>
  );
}
