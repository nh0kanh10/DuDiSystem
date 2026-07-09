import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, ArrowLeft, Send, Search, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useStaffChat } from "@/app/hooks/useStaffChat";

const BRAND = "#E8231A";
const GOLD = "#FF8800";
const GR = "rgba(232,35,26,0.28)";

function branchLabel(branchId: string) {
  if (!branchId) return "";
  return branchId.replace("branch-", "").toUpperCase();
}

function empInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function UserChatWidget({ embed = false }: { embed?: boolean }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [draft, setDraft] = useState("");
  const [showOnlinePanel, setShowOnlinePanel] = useState(false);

  const {
    employees,
    searchResults,
    searching,
    rosterScope,
    onlineCount,
    onlineEmployees,
    totalUnread,
    threads,
    loading,
    error,
    sending,
    socketConnected,
    peerTyping,
    threadHasMore,
    loadingMore,
    loadRoster,
    searchRoster,
    openChat,
    sendMessage,
    retryMessage,
    loadMoreMessages,
    setActivePeer,
    notifyTyping,
    clearError,
  } = useStaffChat({ panelOpen: open });

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const bubbleRef = useRef<HTMLButtonElement | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stickBottomRef = useRef(true);
  const loadingMoreRef = useRef(false);

  const active = employees.find(e => e.id === activeId)
    || searchResults.find(e => e.id === activeId)
    || (() => {
      const o = onlineEmployees.find(e => e.id === activeId);
      if (!o) return null;
      return {
        id: o.id,
        name: o.name,
        department: o.department,
        position: o.position,
        photos: [] as string[],
        online: true,
        unread: 0,
        lastMessage: "",
        lastTime: "",
      };
    })();

  const searchPlaceholder = rosterScope === "company"
    ? "Tìm nhân viên (mọi chi nhánh)..."
    : "Tìm nhân viên trong chi nhánh...";

  useEffect(() => {
    stickBottomRef.current = true;
  }, [activeId]);

  useEffect(() => {
    if (stickBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeId, threads, active?.id]);

  const handleThreadScroll = useCallback(async () => {
    const el = scrollRef.current;
    if (!el || !activeId) return;
    stickBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (el.scrollTop > 48 || loadingMoreRef.current || !threadHasMore[activeId]) return;

    loadingMoreRef.current = true;
    const prevHeight = el.scrollHeight;
    await loadMoreMessages(activeId);
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight;
      }
      loadingMoreRef.current = false;
    });
  }, [activeId, threadHasMore, loadMoreMessages]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (bubbleRef.current?.contains(target)) return;
      setOpen(false);
      setActiveId(null);
      setActivePeer(null);
      setShowSuggest(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setActivePeer]);

  useEffect(() => {
    if (!open) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      searchRoster(search.trim());
    }, search.trim() ? 300 : 0);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, open, searchRoster]);

  const rosterList = employees;

  const suggestList = searchResults;

  const handleOpenChat = useCallback(async (id: string) => {
    setActiveId(id);
    setActivePeer(id);
    setShowSuggest(false);
    setSearch("");
    await openChat(id);
  }, [openChat, setActivePeer]);

  const handleInputBlur = () => {
    blurTimer.current = setTimeout(() => setShowSuggest(false), 150);
  };

  const handleInputFocus = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setShowSuggest(true);
  };

  const handleSend = async () => {
    if (!draft.trim() || !active || sending) return;
    const text = draft.trim();
    setDraft("");
    const ok = await sendMessage(active.id, text);
    if (!ok) setDraft(text);
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (activeId && value.trim()) notifyTyping(activeId);
  };

  const handleToggleOpen = () => {
    setOpen(o => {
      if (o) {
        setActiveId(null);
        setActivePeer(null);
        setShowSuggest(false);
      }
      return !o;
    });
  };

  return (
    <>
      <button
        ref={bubbleRef}
        onClick={handleToggleOpen}
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

      {open && (
        <div
          ref={panelRef}
          style={{
            position: embed ? "absolute" : "fixed",
            right: 24,
            bottom: 96,
            width: 360,
            maxWidth: "calc(100vw - 32px)",
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
          {error && (
            <div style={{
              padding: "8px 14px", background: "#fff0f0", borderBottom: "1px solid #f5d0d0",
              fontSize: 12, color: "#b42318", display: "flex", justifyContent: "space-between", gap: 8,
            }}>
              <span>{error}</span>
              <button onClick={clearError} style={{ border: "none", background: "none", cursor: "pointer", color: "#b42318", fontWeight: 700 }}>✕</button>
            </div>
          )}

          {!active ? (
            <>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(36,20,22,0.08)", flexShrink: 0, position: "relative", overflow: "visible" }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#241416" }}>Tin nhắn nội bộ</p>
                {rosterScope === "company" ? (
                  <button
                    type="button"
                    onClick={() => setShowOnlinePanel(v => !v)}
                    style={{
                      display: "flex", alignItems: "center", gap: 4, marginTop: 2,
                      border: "none", background: "none", padding: 0, cursor: "pointer",
                      fontSize: 12, color: "#7f5f63", fontFamily: "inherit", textAlign: "left",
                    }}
                  >
                    <span>
                      {onlineCount} nhân viên đang online
                      {socketConnected && (
                        <span style={{ marginLeft: 6, color: "#16a34a", fontWeight: 600 }}>· Live</span>
                      )}
                    </span>
                    {showOnlinePanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                ) : (
                  <p style={{ fontSize: 12, color: "#7f5f63", marginTop: 2 }}>
                    {onlineCount} nhân viên đang online
                    {socketConnected && (
                      <span style={{ marginLeft: 6, color: "#16a34a", fontWeight: 600 }}>· Live</span>
                    )}
                  </p>
                )}

                {rosterScope === "company" && showOnlinePanel && (
                  <div
                    style={{
                      marginTop: 8, maxHeight: 140, overflowY: "auto",
                      border: "1px solid rgba(36,20,22,0.08)", borderRadius: 12,
                      background: "#fffafa", padding: "4px 6px",
                    }}
                  >
                    {onlineEmployees.length === 0 ? (
                      <p style={{ fontSize: 12, color: "#a98488", textAlign: "center", padding: "10px 4px" }}>
                        Không có ai online
                      </p>
                    ) : onlineEmployees.map(emp => (
                      <div
                        key={emp.id}
                        onClick={() => { setShowOnlinePanel(false); handleOpenChat(emp.id); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "7px 6px",
                          borderRadius: 8, cursor: "pointer",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fff0f0"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: `linear-gradient(135deg, ${BRAND}, ${GOLD})`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, fontWeight: 900, color: "#fff",
                          }}>
                            {empInitials(emp.name)}
                          </div>
                          <span style={{
                            position: "absolute", bottom: -1, right: -1, width: 8, height: 8,
                            borderRadius: "50%", background: "#22c55e", border: "2px solid #fff",
                          }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#241416", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {emp.name}
                          </p>
                          <p style={{ fontSize: 10, color: "#8b6b70" }}>{emp.department}</p>
                        </div>
                        <span style={{
                          fontSize: 9, fontWeight: 800, color: "#7a1d22", background: "#fde8e8",
                          padding: "2px 6px", borderRadius: 999, flexShrink: 0,
                        }}>
                          {branchLabel(emp.branchId)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div ref={searchWrapRef} style={{ position: "relative", marginTop: 10 }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#a98488" }} />
                  <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setShowSuggest(true); }}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder={searchPlaceholder}
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
                      {!search.trim() && !searching && suggestList.length === 0 && (
                        <p style={{ fontSize: 12, color: "#7f5f63", textAlign: "center", padding: "12px 8px" }}>
                          {rosterScope === "company"
                            ? "Không có nhân viên khả dụng"
                            : "Không có nhân viên cùng chi nhánh"}
                        </p>
                      )}
                      {!search.trim() && suggestList.length > 0 && (
                        <p style={{ fontSize: 11, color: "#a98488", padding: "4px 8px 6px", fontWeight: 600 }}>
                          {rosterScope === "company" ? "Nhân viên toàn công ty" : "Nhân viên cùng chi nhánh"}
                        </p>
                      )}
                      {search.trim() && searching && (
                        <div style={{ display: "flex", justifyContent: "center", padding: 12 }}>
                          <Loader2 size={16} className="animate-spin" color="#a98488" />
                        </div>
                      )}
                      {search.trim() && !searching && suggestList.length === 0 && (
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

              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "6px 8px" }}>
                {loading && rosterList.length === 0 ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 32, color: "#a98488" }}>
                    <Loader2 size={22} className="animate-spin" />
                  </div>
                ) : rosterList.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#7f5f63", textAlign: "center", padding: "24px 12px", lineHeight: 1.5 }}>
                    Chưa có hội thoại nào.<br />
                    <span style={{ fontSize: 12 }}>Dùng ô tìm kiếm phía trên để nhắn nhân viên mới.</span>
                  </p>
                ) : rosterList.map(emp => (
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
                        <p style={{ fontSize: 12, color: "#8b6b70", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {emp.lastMessage || "Chưa có tin nhắn"}
                        </p>
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
                <button
                  onClick={() => { setActiveId(null); setActivePeer(null); }}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#7a1d22", padding: 4 }}
                >
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
                    {peerTyping === active.id
                      ? "Đang nhập..."
                      : `${active.online ? "Đang hoạt động" : "Ngoại tuyến"} · ${active.position}`}
                  </p>
                </div>
              </div>

              <div
                ref={scrollRef}
                onScroll={handleThreadScroll}
                style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 14px", display: "flex", flexDirection: "column", gap: 8, background: "#fffafa" }}
              >
                {loadingMore && (
                  <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 8px" }}>
                    <Loader2 size={16} className="animate-spin" color="#a98488" />
                  </div>
                )}
                {threadHasMore[active.id] && !loadingMore && (threads[active.id]?.length ?? 0) > 0 && (
                  <p style={{ fontSize: 11, color: "#a98488", textAlign: "center", marginBottom: 4 }}>Cuộn lên để xem tin cũ hơn</p>
                )}
                {(threads[active.id] || []).length === 0 && !loading && (
                  <p style={{ fontSize: 12, color: "#a98488", textAlign: "center", marginTop: 24 }}>Bắt đầu cuộc trò chuyện</p>
                )}
                {(threads[active.id] || []).map(msg => (
                  <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.from === "me" ? "flex-end" : "flex-start", gap: 4 }}>
                    <div
                      style={{
                        maxWidth: "78%",
                        padding: "8px 12px",
                        borderRadius: msg.from === "me" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        background: msg.failed
                          ? "#fee2e2"
                          : msg.from === "me"
                            ? `linear-gradient(135deg, ${BRAND}, ${GOLD})`
                            : "#FFFFFF",
                        color: msg.failed ? "#b42318" : msg.from === "me" ? "#fff" : "#241416",
                        border: msg.failed ? "1px solid #fecaca" : msg.from === "me" ? "none" : "1px solid #efd7da",
                        fontSize: 13.5,
                        lineHeight: 1.4,
                      }}
                    >
                      {msg.text}
                      <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7, textAlign: "right" }}>{msg.time}</div>
                    </div>
                    {msg.failed && (
                      <button
                        type="button"
                        onClick={() => retryMessage(active.id, msg.id, msg.text)}
                        disabled={sending}
                        style={{
                          fontSize: 11, color: BRAND, background: "none", border: "none",
                          cursor: sending ? "default" : "pointer", fontWeight: 700, padding: "0 4px",
                        }}
                      >
                        Gửi lại
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderTop: "1px solid rgba(36,20,22,0.08)", flexShrink: 0 }}>
                <input
                  value={draft}
                  onChange={e => handleDraftChange(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Nhập tin nhắn..."
                  disabled={sending}
                  style={{
                    flex: 1, padding: "9px 12px", borderRadius: 999,
                    border: "1px solid rgba(36,20,22,0.12)", fontSize: 13, outline: "none",
                    fontFamily: "inherit", color: "#241416",
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || sending}
                  style={{
                    width: 36, height: 36, borderRadius: "50%", border: "none",
                    background: draft.trim() && !sending ? `linear-gradient(135deg, ${BRAND}, ${GOLD})` : "#eee",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: draft.trim() && !sending ? "pointer" : "default", flexShrink: 0,
                  }}
                >
                  {sending ? <Loader2 size={15} className="animate-spin" color="#a98488" /> : <Send size={15} color={draft.trim() ? "#fff" : "#a98488"} />}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
