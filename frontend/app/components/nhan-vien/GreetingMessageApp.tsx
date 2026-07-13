import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import {
  User, Calendar, Clock, Plane, BookOpen, FileText,
  Bell, Settings, LogOut, Sun, Moon, Check,
  ChevronRight, Building2, Shield, Palette, Fingerprint,
} from "lucide-react";

export function Background({ dark }: { dark: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let raf: number;

    if (dark) {
      type Star = { x: number; y: number; r: number; phase: number; freq: number; hue: number; shoot?: boolean };
      const stars: Star[] = Array.from({ length: 420 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.pow(Math.random(), 2.5) * 2.2 + 0.2,
        phase: Math.random() * Math.PI * 2,
        freq: Math.random() * 0.8 + 0.3,
        hue: Math.random() > 0.88 ? 340 : Math.random() > 0.82 ? 220 : 0,
      }));

      // Nebula blobs (static, drawn once per frame as gradient)
      const nebulae = [
        { x: 0.25, y: 0.35, rx: 320, ry: 220, color: "rgba(212,71,42," },
        { x: 0.75, y: 0.6, rx: 280, ry: 180, color: "rgba(100,60,140," },
        { x: 0.5, y: 0.8, rx: 240, ry: 160, color: "rgba(40,20,80," },
      ];

      // Shooting star state
      let shooter = { x: -1, y: -1, vx: 0, vy: 0, life: 0, maxLife: 0 };
      let nextShoot = 3000 + Math.random() * 5000;
      let lastTime = performance.now();

      const draw = (now: number) => {
        const dt = now - lastTime;
        lastTime = now;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const t = now * 0.001;

        // Nebula
        nebulae.forEach(n => {
          const grd = ctx.createRadialGradient(
            n.x * canvas.width, n.y * canvas.height, 0,
            n.x * canvas.width, n.y * canvas.height, Math.max(n.rx, n.ry)
          );
          grd.addColorStop(0, n.color + "0.07)");
          grd.addColorStop(1, n.color + "0)");
          ctx.save();
          ctx.scale(1, n.ry / n.rx);
          ctx.beginPath();
          ctx.arc(n.x * canvas.width, (n.y * canvas.height) * (n.rx / n.ry), n.rx, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
          ctx.restore();
        });

        // Stars
        stars.forEach(s => {
          const alpha = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.freq + s.phase));
          const color = s.hue === 340 ? `hsla(340,80%,80%,${alpha})`
            : s.hue === 220 ? `hsla(220,80%,85%,${alpha})`
              : `hsla(0,0%,100%,${alpha})`;
          // Glow for bright stars
          if (s.r > 1.3) {
            const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
            g.addColorStop(0, color);
            g.addColorStop(1, "transparent");
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        });

        // Shooting star
        nextShoot -= dt;
        if (nextShoot <= 0 && shooter.life <= 0) {
          const side = Math.random() > 0.5;
          shooter = {
            x: side ? 0 : canvas.width,
            y: Math.random() * canvas.height * 0.5,
            vx: side ? 4 + Math.random() * 3 : -(4 + Math.random() * 3),
            vy: 1.5 + Math.random() * 2,
            life: 1,
            maxLife: 1,
          };
          nextShoot = 4000 + Math.random() * 7000;
        }
        if (shooter.life > 0) {
          shooter.x += shooter.vx * dt * 0.1;
          shooter.y += shooter.vy * dt * 0.1;
          shooter.life -= dt * 0.001;
          const tail = 80;
          const g = ctx.createLinearGradient(
            shooter.x - shooter.vx * tail * 0.1, shooter.y - shooter.vy * tail * 0.1,
            shooter.x, shooter.y
          );
          g.addColorStop(0, "rgba(255,255,255,0)");
          g.addColorStop(1, `rgba(255,210,190,${Math.min(shooter.life, 0.9)})`);
          ctx.beginPath();
          ctx.moveTo(shooter.x - shooter.vx * tail * 0.1, shooter.y - shooter.vy * tail * 0.1);
          ctx.lineTo(shooter.x, shooter.y);
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);

    } else {
      /* ── Light: dreamy tech particles ── */
      type Particle = { x: number; y: number; r: number; vx: number; vy: number; alpha: number; shape: "circle" | "diamond" | "cross" };
      const W = () => window.innerWidth;
      const H = () => window.innerHeight;
      const particles: Particle[] = Array.from({ length: 55 }, () => ({
        x: Math.random() * W(),
        y: Math.random() * H(),
        r: Math.random() * 3.5 + 0.8,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(Math.random() * 0.35 + 0.08),
        alpha: Math.random() * 0.35 + 0.08,
        shape: (["circle", "circle", "circle", "diamond", "cross"] as const)[Math.floor(Math.random() * 5)],
      }));

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Soft glow orbs
        [[0.2, 0.3, 300], [0.8, 0.7, 260], [0.5, 0.15, 200]].forEach(([rx, ry, sz]) => {
          const g = ctx.createRadialGradient(rx * canvas.width, ry * canvas.height, 0, rx * canvas.width, ry * canvas.height, sz as number);
          g.addColorStop(0, "rgba(212,71,42,0.06)");
          g.addColorStop(1, "rgba(212,71,42,0)");
          ctx.beginPath();
          ctx.arc(rx * canvas.width, ry * canvas.height, sz as number, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        });

        // Floating particles
        particles.forEach(p => {
          p.x += p.vx; p.y += p.vy;
          if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
          if (p.x < -10) p.x = canvas.width + 10;
          if (p.x > canvas.width + 10) p.x = -10;

          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = "rgba(212,71,42,1)";
          ctx.strokeStyle = "rgba(212,71,42,1)";

          if (p.shape === "circle") {
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
          } else if (p.shape === "diamond") {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - p.r * 1.4);
            ctx.lineTo(p.x + p.r, p.y);
            ctx.lineTo(p.x, p.y + p.r * 1.4);
            ctx.lineTo(p.x - p.r, p.y);
            ctx.closePath(); ctx.fill();
          } else {
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(p.x - p.r, p.y); ctx.lineTo(p.x + p.r, p.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(p.x, p.y - p.r); ctx.lineTo(p.x, p.y + p.r); ctx.stroke();
          }
          ctx.globalAlpha = 1;
        });

        raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);
    }

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [dark]);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

/* ─── Ticker data ────────────────────────────────────────── */
const TICKER_TEXT = "Welcome to DUDI SOFTWARE TECHNOLOGY CO., LTD";

/* ─── Block definitions ──────────────────────────────────── */
interface Block {
  id?: string;
  label: string;
  sub: string;
  icon: React.ElementType;
  color: string;
  lightBg: string;
  darkBg: string;
}

const LEFT_BLOCKS: Block[] = [
  { id: "employee", label: "Hồ sơ", sub: "Thông tin cá nhân", icon: User, color: "#D4472A", lightBg: "#FFE8DC", darkBg: "#3A1810" },
  { id: "checkin", label: "Chấm công", sub: "Lịch sử & báo cáo", icon: Clock, color: "#D4472A", lightBg: "#FFE8DC", darkBg: "#3A1810" },
  { id: "crm", label: "Quản lý KH", sub: "Khách hàng & hợp đồng", icon: Building2, color: "#D4472A", lightBg: "#FFE8DC", darkBg: "#3A1810" },
  { id: "notifications", label: "Thông báo", sub: "Tin tức nội bộ", icon: Bell, color: "#D4472A", lightBg: "#FFE8DC", darkBg: "#3A1810" },
];

const RIGHT_BLOCKS: Block[] = [
  { id: "tasks", label: "Lịch làm việc", sub: "Ca & lịch trực", icon: Calendar, color: "#D4472A", lightBg: "#FFE8DC", darkBg: "#3A1810" },
  { id: "leave", label: "Xin nghỉ", sub: "Đơn & phê duyệt", icon: Plane, color: "#D4472A", lightBg: "#FFE8DC", darkBg: "#3A1810" },
  { id: "directory", label: "Danh bạ", sub: "Liên hệ nhân sự", icon: FileText, color: "#D4472A", lightBg: "#FFE8DC", darkBg: "#3A1810" },
  { id: "settings", label: "Cài đặt", sub: "Tùy chỉnh hệ thống", icon: Settings, color: "#D4472A", lightBg: "#FFE8DC", darkBg: "#3A1810" },
];

// Cascade: longest at top, narrowest at bottom — min kept wide enough to show text
const WIDTHS = ["100%", "80%", "62%", "46%"];

/* ─── Ticker ─────────────────────────────────────────────── */
function Ticker({ dark }: { dark: boolean }) {
  const [tickerText, setTickerText] = useState(TICKER_TEXT);

  useEffect(() => {
    async function loadData() {
      try {
        const [announcements, cfg] = await Promise.all([
          api.announcements.list().catch(() => []),
          api.systemConfig.get().catch(() => null)
        ])
        
        const active = (announcements as any[]).filter(a => a.status === "active");
        if (active.length > 0) {
          const text = active.map(a => `[${a.title}] ${a.content}`).join("  •  ");
          setTickerText(text);
        } else {
          if (cfg && cfg.defaultAnnouncementEnabled === false) {
             setTickerText("");
          } else {
             setTickerText(cfg?.defaultAnnouncementContent || TICKER_TEXT);
          }
        }
      } catch (err) {
        console.error("Failed to load ticker data", err)
      }
    }
    loadData();
    const timer = setInterval(loadData, 60000);
    return () => clearInterval(timer);
  }, []);

  if (!tickerText) return <div className="h-10 shrink-0"></div>;

  return (
    <div
      className="h-10 flex items-center shrink-0"
      style={{ background: "transparent" }}
    >
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      {/* Bell icon — fixed left */}
      <div className="shrink-0 pl-5 pr-3">
        <Bell size={12} strokeWidth={2.5} style={{ color: dark ? "rgba(240,200,210,0.55)" : "#7A5A50" }} />
      </div>

      {/* Marquee track — clips text, fills remaining width */}
      <div className="flex-1 overflow-hidden relative" style={{ height: "100%" }}>
        <span
          className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[12px] font-semibold"
          style={{
            animation: "marquee 28s linear infinite",
            color: dark ? "rgba(240,220,230,0.50)" : "#6B4A40",
            letterSpacing: "0.02em",
          }}
        >
          {tickerText}
        </span>
      </div>
    </div>
  );
}

/* ─── Function block card ────────────────────────────────── */
function BlockCard({
  block, dark, side, onClick, compact = false,
}: {
  block: Block; dark: boolean; side: "left" | "right"; onClick?: () => void; compact?: boolean;
}) {
  const Icon = block.icon;
  const flip = side === "right";

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3.5 rounded-2xl transition-all duration-200
        hover:scale-[1.025] hover:-translate-y-0.5 active:scale-[0.98]
        ${flip ? "flex-row-reverse" : ""}
        ${compact ? "px-3.5 py-3" : "px-5"}
      `}
      style={{
        width: compact ? "100%" : 242,
        height: compact ? 60 : 62,
        background: dark
          ? "rgba(255,255,255,0.06)"
          : "rgba(255,255,255,0.38)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Icon */}
      <Icon
        className="shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{ width: compact ? 22 : 24, height: compact ? 22 : 24, color: block.color }}
      />

      {/* Text */}
      <div className={`font-semibold leading-tight ${compact ? "text-[15px]" : "text-[17px]"} ${dark ? "text-[#F0DCE2]" : "text-[#1A0810]"}`}>
        {block.label}
      </div>
    </button>
  );
}



/* ─── App ────────────────────────────────────────────────── */
export default function GreetingMessageApp({
  employee,
  onNavigate,
  onLogout,
  dark,
  onToggleDark,
  checkingIP = false,
  attendanceCheckedIn = false,
  attendanceCheckInTime = null,
}: any) {

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");
  const ss = now.getSeconds().toString().padStart(2, "0");
  const DAYS = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
  const dayLabel = DAYS[now.getDay()];
  const dateLabel = `${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

  return (
    <div
      className={`${dark ? "dark" : ""} h-full w-full min-h-0 flex flex-col overflow-hidden relative`}
      style={{
        fontFamily: "'Be Vietnam Pro','Inter',sans-serif",
        background: dark
          ? "radial-gradient(ellipse 80% 60% at 50% 50%, #1A0810 0%, #0E0508 100%)"
          : "radial-gradient(ellipse 70% 55% at 50% 45%, #FFE4D8 0%, #FFF0E8 50%, #FFF8F4 100%)",
      }}
    >
      <Background dark={dark} />

      {/* ── Ticker ── */}
      <div className="relative z-10"><Ticker dark={dark} /></div>

      {/* ── Header ── */}
      <header className="px-4 md:px-8 pt-4 pb-2 shrink-0 relative z-10">
        <div className="absolute top-3 right-3 md:right-8 flex items-center gap-2 sm:gap-3">
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shadow shrink-0"
            style={{ background: "linear-gradient(135deg,#E05038,#D4472A)" }}
          >NV</div>
          <div className="hidden sm:flex flex-col gap-1 items-start min-w-0 max-w-[150px] md:max-w-none">
            <div className={`text-[11px] sm:text-xs font-semibold leading-none truncate max-w-[110px] sm:max-w-none ${dark ? "text-[#F0DCE2]" : "text-[#1A0810]"}`}>{employee?.name || "Nguyễn Văn A"}</div>
            <div className={`text-[9px] sm:text-[10px] leading-tight line-clamp-2 sm:line-clamp-1 max-w-[110px] sm:max-w-none ${dark ? "text-[#7A5060]" : "text-[#D4472A]/70"}`}>{employee?.position} · {employee?.department}</div>
          </div>
        </div>

        <div className="hidden md:flex items-start">
        {/* Left spacer */}
        <div className="flex-1" />

        {/* CENTER: workspace -> time -> date */}
        <div className="flex flex-col items-center justify-center gap-1 mt-1" style={{ minWidth: 280 }}>
          {/* Tag "Không gian làm việc" mờ ảo */}
          <div className={`text-[9px] uppercase font-bold tracking-[0.4em] ${dark ? "text-white/20" : "text-[#D4472A]/40"}`}>
            Không gian làm việc
          </div>

          {/* Clock - mỏng, thanh thoát, xám lông chuột, có giây */}
          <div
            className={`tabular-nums font-light leading-none ${dark ? "text-white/90" : "text-[#4A4A4A]"}`}
            style={{ fontSize: "clamp(52px, 6.2vw, 78px)", letterSpacing: "-0.02em" }}
          >
            {hh}<span className="opacity-30 mx-0.5">:</span>{mm}
            <span className={`font-light ml-1.5 ${dark ? "text-white/30" : "text-[#4A4A4A]/40"}`}
              style={{ fontSize: "clamp(20px, 2.2vw, 28px)" }}>
              {ss}
            </span>
          </div>

          {/* Date - giảm Spotlight */}
          <div className={`text-[12px] font-medium tracking-wider mt-0.5 ${dark ? "text-white/30" : "text-[#4A4A4A]/50"}`}>
            {dayLabel} · {dateLabel}
          </div>
        </div>

        <div className="flex-1" />
        </div>
        <div className="md:hidden flex flex-col items-center justify-center gap-1 mt-2">
          <div className={`text-[8px] uppercase font-bold tracking-[0.32em] ${dark ? "text-white/20" : "text-[#D4472A]/40"}`}>
            Không gian làm việc
          </div>
          <div
            className={`tabular-nums font-light leading-none ${dark ? "text-white/90" : "text-[#4A4A4A]"}`}
            style={{ fontSize: "clamp(42px, 14vw, 58px)", letterSpacing: "-0.02em" }}
          >
            {hh}<span className="opacity-30 mx-0.5">:</span>{mm}
            <span className={`font-light ml-1.5 ${dark ? "text-white/30" : "text-[#4A4A4A]/40"}`}
              style={{ fontSize: "clamp(16px, 5vw, 22px)" }}>
              {ss}
            </span>
          </div>
          <div className={`text-[10px] font-medium tracking-wide text-center ${dark ? "text-white/30" : "text-[#4A4A4A]/50"}`}>
            {dayLabel} · {dateLabel}
          </div>
        </div>
      </header>

      {/* ── Main: 3-col, vertically centered ── */}
      <main className="relative z-10 hidden md:flex flex-1 overflow-hidden items-center justify-center px-4">
        <div className="w-full max-w-[1320px] grid grid-cols-[1fr_auto_1fr] items-center gap-4 lg:gap-8">
          {/* LEFT blocks */}
          <div className="flex flex-col pl-2 pr-2 gap-3 justify-center items-end">
            {LEFT_BLOCKS.map((block, i) => (
              <div key={block.label} className="flex justify-start" style={{ width: WIDTHS[i] }}>
                <BlockCard block={block} dark={dark} side="left" onClick={() => block.id && onNavigate(block.id)} />
              </div>
            ))}
          </div>

          {/* CENTER — fingerprint + status only */}
          <div className="flex flex-col items-center justify-center gap-4 px-8" style={{ minWidth: 300 }}>

          {/* Fingerprint */}
          <div className={`relative flex items-center justify-center group mt-2 ${checkingIP ? "cursor-wait opacity-80" : "cursor-pointer"}`} onClick={() => !checkingIP && onNavigate("checkin")}>
            <div className="absolute pointer-events-none" style={{
              inset: -20, borderRadius: "50%", animation: "pr1 2.6s ease-in-out infinite",
              background: attendanceCheckedIn
                ? "radial-gradient(circle, rgba(52,211,153,0.14) 0%, transparent 65%)"
                : "radial-gradient(circle, rgba(212,71,42,0.13) 0%, transparent 65%)",
            }} />
            <div className="absolute pointer-events-none" style={{
              inset: -40, borderRadius: "50%", animation: "pr1 2.6s ease-in-out infinite 1s",
              background: attendanceCheckedIn
                ? "radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 65%)"
                : "radial-gradient(circle, rgba(212,71,42,0.06) 0%, transparent 65%)",
            }} />
            <div
              className="relative transition-all duration-300 group-hover:scale-110 active:scale-95"
              style={{
                filter: attendanceCheckedIn
                  ? "drop-shadow(0 0 18px rgba(52,211,153,0.65))"
                  : "drop-shadow(0 0 22px rgba(212,71,42,0.60)) drop-shadow(0 0 6px rgba(212,71,42,0.30))",
              }}
            >
              {attendanceCheckedIn
                ? <Check strokeWidth={1.5} style={{ width: 176, height: 176, color: "#79B791" }} />
                : <Fingerprint strokeWidth={1.2} style={{ width: 176, height: 176, color: "#D4472A" }} />
              }
            </div>
          </div>

          {/* Status */}
          <div className={`text-[12px] font-medium tracking-widest uppercase -mt-1 ${attendanceCheckedIn
            ? (dark ? "text-emerald-400" : "text-emerald-600")
            : (dark ? "text-white/30" : "text-[#D4472A]/45")}`}
          >
            {checkingIP ? "Đang kiểm tra wifi..." : attendanceCheckedIn ? `✓ Đã điểm danh · ${attendanceCheckInTime}` : "Chạm để điểm danh"}
          </div>
          </div>

          {/* RIGHT blocks */}
          <div className="flex flex-col pr-2 pl-2 gap-3 justify-center items-start">
            {RIGHT_BLOCKS.map((block, i) => (
              <div key={block.label} className="flex justify-end" style={{ width: WIDTHS[i] }}>
                <BlockCard
                  block={block} dark={dark} side="right"
                  onClick={() => block.id && onNavigate(block.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      <main className="relative z-10 md:hidden flex-1 overflow-y-auto overflow-x-hidden px-3 pt-2 pb-20">
        <div className="min-h-full flex flex-col items-center justify-start">
          <div className="shrink-0 flex flex-col items-center justify-center pt-2 pb-4">
            <div className="relative flex items-center justify-center cursor-pointer group" onClick={() => onNavigate("checkin")}>
              <div className="absolute pointer-events-none" style={{
                inset: -14, borderRadius: "50%", animation: "pr1 2.6s ease-in-out infinite",
                background: attendanceCheckedIn
                  ? "radial-gradient(circle, rgba(52,211,153,0.14) 0%, transparent 65%)"
                  : "radial-gradient(circle, rgba(212,71,42,0.13) 0%, transparent 65%)",
              }} />
              <div
                className="relative transition-all duration-300 group-hover:scale-110 active:scale-95"
                style={{
                  filter: attendanceCheckedIn
                    ? "drop-shadow(0 0 18px rgba(52,211,153,0.65))"
                    : "drop-shadow(0 0 18px rgba(212,71,42,0.55)) drop-shadow(0 0 6px rgba(212,71,42,0.24))",
                }}
              >
                {attendanceCheckedIn
                  ? <Check strokeWidth={1.5} style={{ width: 112, height: 112, color: "#79B791" }} />
                  : <Fingerprint strokeWidth={1.2} style={{ width: 112, height: 112, color: "#D4472A" }} />
                }
              </div>
            </div>
            <div className={`text-[10px] font-medium tracking-widest uppercase text-center mt-2 ${attendanceCheckedIn
              ? (dark ? "text-emerald-400" : "text-emerald-600")
              : (dark ? "text-white/30" : "text-[#D4472A]/45")}`}
            >
              {checkingIP ? "Đang kiểm tra wifi..." : attendanceCheckedIn ? `✓ Đã điểm danh · ${attendanceCheckInTime}` : "Chạm để điểm danh"}
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-x-3 gap-y-3 items-start">
            <div className="flex flex-col gap-3 items-stretch">
              {LEFT_BLOCKS.map((block) => (
                <BlockCard
                  key={block.label}
                  block={block}
                  dark={dark}
                  side="left"
                  compact
                  onClick={() => block.id && onNavigate(block.id)}
                />
              ))}
            </div>

            <div className="flex flex-col gap-3 items-stretch">
              {RIGHT_BLOCKS.map((block) => (
                <BlockCard
                  key={block.label}
                  block={block}
                  dark={dark}
                  side="right"
                  compact
                  onClick={() => block.id && onNavigate(block.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ── Logout button — bottom left ── */}
      <button onClick={onLogout}
        className="fixed bottom-5 left-5 z-20 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 group"
        style={{
          background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.35)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          color: "#D4472A",
        }}
      >
        <LogOut className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Đăng xuất
      </button>

      <style>{`
        @keyframes pr1 {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:0.4;transform:scale(1.12)}
        }
      `}</style>
    </div>
  );
}
