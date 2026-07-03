import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, ArrowLeft, Send, Search } from "lucide-react";

const BRAND = "#E8231A";
const GOLD = "#FF8800";
const GR = "rgba(232,35,26,0.28)";

interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
}

interface OnlineEmployee {
  id: string;
  name: string;
  department: string;
  position: string;
  online: boolean;
  unread: number;
  lastMessage: string;
  lastTime: string;
}

function empInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ==== DATA MẪU (thay bằng API sau này: GET /api/staff-chat/online, GET /api/staff-chat/thread/:id) ====
const MOCK_EMPLOYEES: OnlineEmployee[] = [
  { id: "nv001", name: "Nguyễn Văn An", department: "Kỹ thuật", position: "Lập trình viên", online: true, unread: 2, lastMessage: "Anh check giúp em PR mới nhé", lastTime: "09:41" },
  { id: "nv002", name: "Trần Thị Bích", department: "Nhân sự", position: "Chuyên viên nhân sự", online: true, unread: 0, lastMessage: "Ok em cảm ơn ạ", lastTime: "09:15" },
  { id: "nv003", name: "Lê Hoàng Cường", department: "Kinh doanh", position: "Trưởng nhóm KD", online: true, unread: 1, lastMessage: "Deal khách A xong chưa?", lastTime: "08:58" },
  { id: "nv004", name: "Phạm Minh Đức", department: "Kỹ thuật", position: "Tester", online: false, unread: 0, lastMessage: "Để em test lại bug này", lastTime: "Hôm qua" },
  { id: "nv005", name: "Hoàng Thu Hà", department: "Kế toán", position: "Kế toán viên", online: true, unread: 0, lastMessage: "Đã gửi hóa đơn qua mail", lastTime: "08:20" },
  { id: "nv006", name: "Vũ Thị Lan", department: "Marketing", position: "Content Creator", online: false, unread: 0, lastMessage: "Bài viết tuần này em gửi rồi ạ", lastTime: "2 ngày trước" },
  { id: "nv007", name: "Đặng Quốc Bảo", department: "Kỹ thuật", position: "DevOps", online: true, unread: 0, lastMessage: "Server đã deploy xong", lastTime: "07:50" },
  { id: "nv008", name: "Ngô Thị Kim Chi", department: "Kinh doanh", position: "Nhân viên KD", online: false, unread: 0, lastMessage: "Em gửi báo giá rồi ạ", lastTime: "Hôm qua" },
  { id: "nv009", name: "Bùi Văn Được", department: "Kế toán", position: "Trưởng phòng KT", online: true, unread: 3, lastMessage: "Anh duyệt phiếu chi giúp em", lastTime: "10:02" },
  { id: "nv010", name: "Phan Thị Giang", department: "Nhân sự", position: "Trưởng phòng NS", online: false, unread: 0, lastMessage: "Đã cập nhật chính sách mới", lastTime: "3 ngày trước" },
];

const MOCK_THREADS: Record<string, ChatMessage[]> = {
  nv001: [
    { id: "m1", from: "them", text: "Chào anh, em vừa tạo PR sửa lỗi chấm công rồi ạ", time: "09:30" },
    { id: "m2", from: "me", text: "Ok để anh xem qua", time: "09:35" },
    { id: "m3", from: "them", text: "Anh check giúp em PR mới nhé", time: "09:41" },
  ],
  nv002: [
    { id: "m1", from: "them", text: "Anh ơi hồ sơ nhân viên mới em đã cập nhật xong", time: "09:10" },
    { id: "m2", from: "me", text: "Cảm ơn em nhé", time: "09:12" },
    { id: "m3", from: "them", text: "Ok em cảm ơn ạ", time: "09:15" },
  ],
  nv003: [{ id: "m1", from: "them", text: "Deal khách A xong chưa?", time: "08:58" }],
  nv004: [{ id: "m1", from: "them", text: "Để em test lại bug này", time: "Hôm qua" }],
  nv005: [{ id: "m1", from: "them", text: "Đã gửi hóa đơn qua mail", time: "08:20" }],
  nv006: [{ id: "m1", from: "them", text: "Bài viết tuần này em gửi rồi ạ", time: "2 ngày trước" }],
  nv007: [{ id: "m1", from: "them", text: "Server đã deploy xong", time: "07:50" }],
  nv008: [{ id: "m1", from: "them", text: "Em gửi báo giá rồi ạ", time: "Hôm qua" }],
  nv009: [{ id: "m1", from: "them", text: "Anh duyệt phiếu chi giúp em", time: "10:02" }],
  nv010: [{ id: "m1", from: "them", text: "Đã cập nhật chính sách mới", time: "3 ngày trước" }],
};

const AUTO_REPLIES = [
  "Ok em nhận được rồi ạ",
  "Dạ để em kiểm tra lại",
  "Vâng anh/chị, em sẽ phản hồi sớm",
  "Em cảm ơn ạ",
];
// ==== HẾT DATA MẪU ====

export default function UserChatWidget({ embed = false }: { embed?: boolean }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [employees, setEmployees] = useState(MOCK_EMPLOYEES);
  const [threads, setThreads] = useState(MOCK_THREADS);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const bubbleRef = useRef<HTMLButtonElement | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalUnread = employees.reduce((sum, e) => sum + e.unread, 0);
  const active = employees.find(e => e.id === activeId) || null;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeId, threads]);

  // Bấm ra ngoài khung -> đóng khung tin nhắn nội bộ
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (bubbleRef.current?.contains(target)) return;
      setOpen(false);
      setActiveId(null);
      setShowSuggest(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Danh sách cố định để duyệt (không đổi theo ô tìm kiếm), online lên trước
  const rosterList = [...employees].sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0) || b.unread - a.unread);

  // Gợi ý dropdown: fetch toàn bộ nhân viên, lọc dần theo chữ đang gõ
  const suggestList = employees
    .filter(e => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q) || e.position.toLowerCase().includes(q);
    })
    .sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));

  const handleOpenChat = (id: string) => {
    setActiveId(id);
    setEmployees(prev => prev.map(e => (e.id === id ? { ...e, unread: 0 } : e)));
    setShowSuggest(false);
    setSearch("");
  };

  const handleInputBlur = () => {
    // Trễ 150ms để onClick trong dropdown kịp bắn trước khi input mất focus đóng dropdown
    blurTimer.current = setTimeout(() => setShowSuggest(false), 150);
  };

  const handleInputFocus = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setShowSuggest(true);
  };

  const handleSend = () => {
    if (!draft.trim() || !active) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const myMsg: ChatMessage = { id: `m${Date.now()}`, from: "me", text: draft.trim(), time };
    setThreads(prev => ({ ...prev, [active.id]: [...(prev[active.id] || []), myMsg] }));
    setEmployees(prev => prev.map(e => (e.id === active.id ? { ...e, lastMessage: draft.trim(), lastTime: time } : e)));
    setDraft("");

    // Giả lập nhân viên trả lời (chỉ để demo UI khi chưa có API)
    if (active.online) {
      setTimeout(() => {
        const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
        const rNow = new Date();
        const rt = `${String(rNow.getHours()).padStart(2, "0")}:${String(rNow.getMinutes()).padStart(2, "0")}`;
        const theirMsg: ChatMessage = { id: `m${Date.now() + 1}`, from: "them", text: reply, time: rt };
        setThreads(prev => ({ ...prev, [active.id]: [...(prev[active.id] || []), theirMsg] }));
        setEmployees(prev => prev.map(e => (e.id === active.id ? { ...e, lastMessage: reply, lastTime: rt } : e)));
      }, 1200 + Math.random() * 900);
    }
  };

  return (
    <>
      {/* Bong bóng chat nổi góc phải màn hình */}
      <button
        ref={bubbleRef}
        onClick={() => { setOpen(o => !o); if (open) { setActiveId(null); setShowSuggest(false); } }}
        style={{
          position: embed ? "absolute" : "fixed",
          right: 24,
          bottom: 24,
          width: 58,
          height: 58,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: `linear-gradient(135deg, ${BRAND}, ${GOLD})`,
          boxShadow: `0 12px 32px ${GR}, 0 4px 14px rgba(0,0,0,0.18)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 60,
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.06)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
        aria-label="Mở chat nội bộ"
      >
        {open ? <X size={24} color="#fff" /> : <MessageCircle size={24} color="#fff" />}
        {!open && totalUnread > 0 && (
          <span
            style={{
              position: "absolute", top: -4, right: -4, minWidth: 20, height: 20, padding: "0 5px",
              borderRadius: 999, background: "#ff5555", color: "#fff", fontSize: 11, fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff",
              boxShadow: "0 0 8px rgba(255,85,85,0.7)",
            }}
          >
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {/* Panel chat: danh sách online -> cửa sổ chat */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: embed ? "absolute" : "fixed",
            right: 24,
            bottom: 96,
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            // Chiều cao panel LUÔN cố định, không phình ra dù danh sách nhân viên dài bao nhiêu
            height: 520,
            maxHeight: "calc(100vh - 140px)",
            background: "#FFFFFF",
            borderRadius: 20,
            border: "1px solid rgba(36,20,22,0.1)",
            boxShadow: "0 24px 60px rgba(95,15,22,0.22)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 59,
            fontFamily: "inherit",
          }}
        >
          {!active ? (
            <>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(36,20,22,0.08)", flexShrink: 0, position: "relative", overflow: "visible" }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#241416" }}>Tin nhắn nội bộ</p>
                <p style={{ fontSize: 12, color: "#7f5f63", marginTop: 2 }}>
                  {employees.filter(e => e.online).length} nhân viên đang online
                </p>

                {/* Ô tìm kiếm + dropdown gợi ý (chỉ để gợi ý nhanh, không thay danh sách chính bên dưới) */}
                <div ref={searchWrapRef} style={{ position: "relative", marginTop: 10 }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#a98488" }} />
                  <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setShowSuggest(true); }}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="Tìm nhân viên..."
                    style={{
                      width: "100%", padding: "8px 10px 8px 30px", borderRadius: 10,
                      border: "1px solid rgba(36,20,22,0.12)", fontSize: 13, outline: "none",
                      fontFamily: "inherit", color: "#241416",
                    }}
                  />

                  {showSuggest && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        left: 0,
                        right: 0,
                        maxHeight: 240,
                        overflowY: "auto",
                        background: "#FFFFFF",
                        border: "1px solid rgba(36,20,22,0.1)",
                        borderRadius: 14,
                        boxShadow: "0 18px 40px rgba(95,15,22,0.18)",
                        zIndex: 80,
                        padding: 6,
                      }}
                    >
                      {suggestList.length === 0 && (
                        <p style={{ fontSize: 12, color: "#7f5f63", textAlign: "center", padding: "12px 0" }}>Không tìm thấy nhân viên phù hợp</p>
                      )}
                      {suggestList.map(emp => (
                        <div
                          key={emp.id}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => handleOpenChat(emp.id)}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px", borderRadius: 10, cursor: "pointer" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fff5f5"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        >
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <div
                              style={{
                                width: 32, height: 32, borderRadius: "50%",
                                background: `linear-gradient(135deg, ${BRAND}, ${GOLD})`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 11, fontWeight: 900, color: "#fff",
                              }}
                            >
                              {empInitials(emp.name)}
                            </div>
                            <span
                              style={{
                                position: "absolute", bottom: -1, right: -1, width: 9, height: 9,
                                borderRadius: "50%", background: emp.online ? "#22c55e" : "#a1a1aa",
                                border: "2px solid #fff",
                              }}
                            />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 750, color: "#241416", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{emp.name}</p>
                            <p style={{ fontSize: 11, color: "#8b6b70" }}>{emp.department} · {emp.position}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Danh sách nhân viên chính: luôn cuộn trong khung, không đẩy panel dài ra */}
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "6px 8px" }}>
                {rosterList.map(emp => (
                  <div
                    key={emp.id}
                    onClick={() => handleOpenChat(emp.id)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 10px", borderRadius: 14, cursor: "pointer", transition: "background 0.15s ease" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fff5f5"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div
                        style={{
                          width: 42, height: 42, borderRadius: "50%",
                          background: `linear-gradient(135deg, ${BRAND}, ${GOLD})`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 900, color: "#fff",
                        }}
                      >
                        {empInitials(emp.name)}
                      </div>
                      <span
                        style={{
                          position: "absolute", bottom: -1, right: -1, width: 11, height: 11,
                          borderRadius: "50%", background: emp.online ? "#22c55e" : "#a1a1aa",
                          border: "2px solid #fff",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 750, color: "#241416", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{emp.name}</p>
                        <span style={{ fontSize: 11, color: "#a98488", flexShrink: 0 }}>{emp.lastTime}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <p style={{ fontSize: 12, color: "#8b6b70", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{emp.lastMessage}</p>
                        {emp.unread > 0 && (
                          <span
                            style={{
                              minWidth: 18, height: 18, borderRadius: 999, background: BRAND, color: "#fff",
                              fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0, padding: "0 5px",
                            }}
                          >
                            {emp.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid rgba(36,20,22,0.08)", flexShrink: 0 }}>
                <button onClick={() => setActiveId(null)} style={{ border: "none", background: "none", cursor: "pointer", color: "#7a1d22", padding: 4 }}>
                  <ArrowLeft size={18} />
                </button>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${BRAND}, ${GOLD})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 900, color: "#fff",
                    }}
                  >
                    {empInitials(active.name)}
                  </div>
                  <span
                    style={{
                      position: "absolute", bottom: -1, right: -1, width: 10, height: 10,
                      borderRadius: "50%", background: active.online ? "#22c55e" : "#a1a1aa",
                      border: "2px solid #fff",
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#241416" }}>{active.name}</p>
                  <p style={{ fontSize: 11, color: "#7f5f63" }}>
                    {active.online ? "Đang hoạt động" : "Ngoại tuyến"} · {active.position}
                  </p>
                </div>
              </div>

              {/* Khung tin nhắn: cuộn riêng, header/footer luôn cố định */}
              <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 14px", display: "flex", flexDirection: "column", gap: 8, background: "#fffafa" }}>
                {(threads[active.id] || []).map(msg => (
                  <div key={msg.id} style={{ display: "flex", justifyContent: msg.from === "me" ? "flex-end" : "flex-start" }}>
                    <div
                      style={{
                        maxWidth: "78%",
                        padding: "8px 12px",
                        borderRadius: msg.from === "me" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        background: msg.from === "me" ? `linear-gradient(135deg, ${BRAND}, ${GOLD})` : "#FFFFFF",
                        color: msg.from === "me" ? "#fff" : "#241416",
                        border: msg.from === "me" ? "none" : "1px solid #efd7da",
                        fontSize: 13.5,
                        lineHeight: 1.4,
                      }}
                    >
                      {msg.text}
                      <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7, textAlign: "right" }}>{msg.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderTop: "1px solid rgba(36,20,22,0.08)", flexShrink: 0 }}>
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
                  placeholder="Nhập tin nhắn..."
                  style={{
                    flex: 1, padding: "9px 12px", borderRadius: 999,
                    border: "1px solid rgba(36,20,22,0.12)", fontSize: 13, outline: "none",
                    fontFamily: "inherit", color: "#241416",
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  style={{
                    width: 36, height: 36, borderRadius: "50%", border: "none",
                    background: draft.trim() ? `linear-gradient(135deg, ${BRAND}, ${GOLD})` : "#eee",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: draft.trim() ? "pointer" : "default", flexShrink: 0,
                  }}
                >
                  <Send size={15} color={draft.trim() ? "#fff" : "#a98488"} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}