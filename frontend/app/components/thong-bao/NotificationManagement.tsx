import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  Bell, Plus, Search, Edit2, Trash2, RefreshCw,
  Settings, Info, AlertTriangle, Calendar, Zap,
  CheckCircle2, Clock, XCircle, Eye, Users, User,
} from "lucide-react"
import { api } from "@/lib/api"
import { Announcement, AnnouncementType, AnnouncementPriority, AnnouncementStatus } from "../../types"
import { CustomSelect } from "../ui/CustomSelect"
import { CustomDateTimePicker } from "../ui/CustomDatePicker"
import { Modal, ModalCancelButton, ModalSubmitButton } from "../ui/Modal"


const TYPE_CFG: Record<AnnouncementType, { label: string; icon: React.ElementType; cls: string }> = {
  info:    { label: "Thông tin", icon: Info,          cls: "bg-blue-50 text-blue-600" },
  warning: { label: "Cảnh báo",  icon: AlertTriangle,  cls: "bg-amber-50 text-amber-600" },
  event:   { label: "Sự kiện",   icon: Calendar,       cls: "bg-purple-50 text-purple-600" },
  urgent:  { label: "Khẩn cấp", icon: Zap,            cls: "bg-red-50 text-red-600" },
}

const STATUS_CFG: Record<AnnouncementStatus, { label: string; cls: string; icon: React.ElementType }> = {
  active:    { label: "Đang hiển thị", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  scheduled: { label: "Đã lên lịch",  cls: "bg-blue-50 text-blue-700 border-blue-200",           icon: Clock },
  expired:   { label: "Đã hết hạn",   cls: "bg-gray-100 text-gray-500 border-gray-200",          icon: XCircle },
}

const PRIORITY_CFG: Record<AnnouncementPriority, { label: string; full: string; cls: string }> = {
  high:   { label: "Cao",      full: "Cao",        cls: "bg-red-50 text-red-600 border-red-200" },
  medium: { label: "Trung bình", full: "Trung bình", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  low:    { label: "Thấp",     full: "Thấp",       cls: "bg-gray-100 text-gray-500 border-gray-200" },
}

const INBOX_TYPE_CFG: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  system: { label: "Hệ thống", icon: Settings, cls: "bg-blue-50 text-blue-600" },
  hr:     { label: "Nhân sự",  icon: Users,    cls: "bg-purple-50 text-purple-600" },
  leave:  { label: "Nghỉ phép",icon: Calendar, cls: "bg-amber-50 text-amber-600" },
}

const EMPTY_FORM = {
  title: "", type: "info" as AnnouncementType, content: "",
  priority: "medium" as AnnouncementPriority, startTime: "", endTime: "",
}


function StatCard({ icon: Icon, value, label, highlight }: {
  icon: React.ElementType; value: number; label: string; highlight?: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 border flex items-center gap-4 ${highlight ? "border-[#C62828]/20" : "border-black/[0.05]"}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${highlight ? "bg-[#C62828]/10" : "bg-gray-100"}`}>
        <Icon size={20} className={highlight ? "text-[#C62828]" : "text-gray-500"} />
      </div>
      <div>
        <p className={`text-2xl font-black leading-none ${highlight ? "text-[#C62828]" : "text-gray-800"}`}>{value}</p>
        <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function TypeBadge({ type }: { type: AnnouncementType }) {
  const cfg = TYPE_CFG[type]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.cls}`}>
      <Icon size={10} />{cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status: AnnouncementStatus }) {
  const cfg = STATUS_CFG[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${cfg.cls}`}>
      <Icon size={10} />{cfg.label}
    </span>
  )
}


export function NotificationManagement() {
  const [items, setItems]     = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats]     = useState({ total: 0, active: 0, scheduled: 0, expired: 0 })
  const [employees, setEmployees] = useState<any[]>([])

  const [activeTab, setActiveTab] = useState<"announcements" | "sent_inbox">("announcements")
  const [sentInboxes, setSentInboxes] = useState<any[]>([])
  const [loadingSent, setLoadingSent] = useState(false)
  const [searchInbox, setSearchInbox] = useState("")
  const [filterInboxType, setFilterInboxType] = useState("all")
  const [filterInboxTarget, setFilterInboxTarget] = useState("all")
  const [deleteInboxConfirm, setDeleteInboxConfirm] = useState<any | null>(null)

  const [search, setSearch]             = useState("")
  const [filterType, setFilterType]     = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const [showForm, setShowForm]   = useState(false)
  const [editItem, setEditItem]   = useState<Announcement | null>(null)
  const [form, setForm]           = useState({ ...EMPTY_FORM })
  const [saving, setSaving]       = useState(false)
  const [formErr, setFormErr]     = useState<{ title?: string; content?: string }>({})

  const [showDefault, setShowDefault]       = useState(false)
  const [defaultEnabled, setDefaultEnabled] = useState(true)
  const [defaultContent, setDefaultContent] = useState("Chào mừng đến với hệ thống DuDi!")
  const [savingDefault, setSavingDefault]   = useState(false)

  useEffect(() => {
    if (showDefault) {
      api.systemConfig.get().then((cfg: any) => {
        if (cfg) {
          setDefaultEnabled(cfg.defaultAnnouncementEnabled ?? true)
          setDefaultContent(cfg.defaultAnnouncementContent ?? "Chào mừng đến với hệ thống DuDi!")
        }
      }).catch(() => {})
    }
  }, [showDefault])

  const [deleteConfirm, setDeleteConfirm] = useState<Announcement | null>(null)
  const [previewItem, setPreviewItem] = useState<Announcement | null>(null)
  const [showInboxForm, setShowInboxForm] = useState(false)
  const [sendingInbox, setSendingInbox] = useState(false)
  const [inboxForm, setInboxForm] = useState({
    title: "",
    type: "system",
    message: "",
    targetMode: "all",
    recipientId: "",
  })

  useEffect(() => {
    if (activeTab === "announcements") {
      loadAll()
    } else {
      loadSentInboxes()
    }
  }, [activeTab])

  useEffect(() => {
    api.employees.list({ status: "active" } as any)
      .then((rows: any) => setEmployees(Array.isArray(rows) ? rows : []))
      .catch(() => setEmployees([]))
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [data, s] = await Promise.all([
        api.announcements.list() as Promise<Announcement[]>,
        api.announcements.stats() as Promise<typeof stats>,
      ])
      setItems(data)
      setStats(s)
    } finally {
      setLoading(false)
    }
  }

  async function loadSentInboxes() {
    setLoadingSent(true)
    try {
      const data = await api.notifications.list({ view: "sent" })
      setSentInboxes(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingSent(false)
    }
  }

  async function handleDeleteInbox(id: string) {
    try {
      await api.notifications.delete(id)
      setSentInboxes(prev => prev.filter(x => x.id !== id))
      setDeleteInboxConfirm(null)
    } catch (e) {
      console.error(e)
    }
  }

  const filtered = items.filter(a => {
    if (filterType !== "all" && a.type !== filterType) return false
    if (filterStatus !== "all" && a.status !== filterStatus) return false
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) &&
        !a.content.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const filteredInboxes = sentInboxes.filter(n => {
    if (filterInboxType !== "all" && n.type !== filterInboxType) return false
    if (filterInboxTarget === "all_staff" && n.recipientId !== null) return false
    if (filterInboxTarget === "one_staff" && n.recipientId === null) return false

    if (searchInbox) {
      const s = searchInbox.toLowerCase()
      const titleMatch = (n.title || "").toLowerCase().includes(s)
      const messageMatch = (n.message || "").toLowerCase().includes(s)
      let empMatch = false
      if (n.recipientId) {
        const emp = employees.find(e => e.id === n.recipientId)
        empMatch = n.recipientId.toLowerCase().includes(s) || (emp && emp.name.toLowerCase().includes(s))
      }
      if (!titleMatch && !messageMatch && !empMatch) return false
    }
    return true
  })

  function openCreate() {
    setEditItem(null); setForm({ ...EMPTY_FORM }); setFormErr({}); setShowForm(true)
  }
  function openEdit(a: Announcement) {
    setEditItem(a)
    setForm({ title: a.title, type: a.type, content: a.content, priority: a.priority, startTime: a.startTime, endTime: a.endTime })
    setFormErr({}); setShowForm(true)
  }

  function validate() {
    const err: typeof formErr = {}
    if (!form.title.trim()) err.title = "Bắt buộc"
    if (!form.content.trim()) err.content = "Bắt buộc"
    setFormErr(err)
    return Object.keys(err).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      if (editItem) {
        const updated = await api.announcements.update(editItem.id, form) as Announcement
        setItems(prev => prev.map(a => a.id === updated.id ? updated : a))
      } else {
        const created = await api.announcements.create(form) as Announcement
        setItems(prev => [...prev, created])
        setStats(s => ({ ...s, total: s.total + 1, active: s.active + 1 }))
      }
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(a: Announcement) {
    await api.announcements.delete(a.id)
    setItems(prev => prev.filter(x => x.id !== a.id))
    setStats(s => ({ ...s, total: s.total - 1 }))
    setDeleteConfirm(null)
  }

  async function saveDefault() {
    setSavingDefault(true)
    try {
      await api.systemConfig.update({
        defaultAnnouncementEnabled: defaultEnabled,
        defaultAnnouncementContent: defaultContent,
      })
      setShowDefault(false)
    } finally {
      setSavingDefault(false)
    }
  }

  async function sendInboxNotification() {
    if (!inboxForm.message.trim()) return
    if (inboxForm.targetMode === "one" && !inboxForm.recipientId) return
    setSendingInbox(true)
    try {
      const payload: any = {
        type: inboxForm.type,
        title: inboxForm.title.trim(),
        message: inboxForm.message.trim(),
        time: new Date().toLocaleString("vi-VN"),
      }
      if (inboxForm.targetMode === "all") payload.toAll = true
      if (inboxForm.targetMode === "one") payload.recipientId = inboxForm.recipientId
      await api.notifications.create(payload)
      setShowInboxForm(false)
      setInboxForm({ title: "", type: "system", message: "", targetMode: "all", recipientId: "" })
      loadSentInboxes()
    } finally {
      setSendingInbox(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px] p-5 rounded-2xl text-white flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div className="flex items-center">
          <div className="flex gap-1.5 items-center mr-4 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white/30 animate-pulse"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white/60 animate-pulse delay-75"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse delay-150"></span>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Quản lý thông báo hệ thống</h2>
            <p className="text-xs text-white/80 mt-1">Tạo và lên lịch thông báo hiển thị tới toàn bộ nhân viên</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => activeTab === "announcements" ? loadAll() : loadSentInboxes()}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer">
            <RefreshCw size={14} />Làm mới
          </button>
          <button onClick={() => setShowDefault(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer">
            <Settings size={14} />Cài đặt mặc định
          </button>
          <button onClick={() => setShowInboxForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer">
            <Bell size={14} />Gửi inbox staff
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#C62828] hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer">
            <Plus size={14} />Tạo thông báo
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-black/[0.05] pb-px">
        <button
          onClick={() => setActiveTab("announcements")}
          className={`pb-2.5 px-4 text-xs font-black border-b-2 transition-all cursor-pointer ${
            activeTab === "announcements"
              ? "border-[#C62828] text-[#C62828]"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Thông báo hệ thống (Announcements)
        </button>
        <button
          onClick={() => setActiveTab("sent_inbox")}
          className={`pb-2.5 px-4 text-xs font-black border-b-2 transition-all cursor-pointer ${
            activeTab === "sent_inbox"
              ? "border-[#C62828] text-[#C62828]"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Thông báo Inbox Staff đã gửi
        </button>
      </div>

      {activeTab === "announcements" ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={CheckCircle2} value={stats.active}    label="Đang hiển thị" highlight />
            <StatCard icon={Clock}        value={stats.scheduled} label="Đã lên lịch" />
            <StatCard icon={Bell}         value={stats.total}     label="Tổng số" />
            <StatCard icon={XCircle}      value={stats.expired}   label="Đã hết hạn" />
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.05] p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm tiêu đề, nội dung..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 transition-all" />
            </div>
            <CustomSelect value={filterType} onChange={setFilterType} className="w-44"
              options={[
                { value: "all",     label: "Tất cả loại" },
                { value: "info",    label: "Thông tin" },
                { value: "warning", label: "Cảnh báo" },
                { value: "event",   label: "Sự kiện" },
                { value: "urgent",  label: "Khẩn cấp" },
              ]} />
            <CustomSelect value={filterStatus} onChange={setFilterStatus} className="w-48"
              options={[
                { value: "all",       label: "Tất cả trạng thái" },
                { value: "active",    label: "Đang hiển thị" },
                { value: "scheduled", label: "Đã lên lịch" },
                { value: "expired",   label: "Đã hết hạn" },
              ]} />
            <span className="text-xs text-gray-400 font-bold ml-auto">{filtered.length} thông báo</span>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-black/[0.05] p-16 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-[#C62828]/30 border-t-[#C62828] animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-black/[0.05] p-16 text-center">
              <Bell size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-bold text-gray-400">Chưa có thông báo nào</p>
              <p className="text-xs text-gray-300 mt-1">Nhấn «Tạo thông báo» để bắt đầu</p>
            </div>
          ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const tcfg = TYPE_CFG[a.type]
            const Icon = tcfg.icon
            const borderColor = a.status === "active" ? "border-l-emerald-400" : a.status === "scheduled" ? "border-l-blue-400" : "border-l-gray-200"
            return (
              <div key={a.id}
                className={`bg-white rounded-2xl border border-black/[0.05] border-l-4 ${borderColor} px-5 py-4 hover:shadow-md transition-all group`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tcfg.cls}`}>
                    <Icon size={16} />
                  </div>
                  <p className="font-black text-gray-800 text-sm flex-1 min-w-0 truncate">{a.title}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <TypeBadge type={a.type} />
                    <StatusBadge status={a.status} />
                    <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setPreviewItem(a)}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye size={13} />
                      </button>
                      <button onClick={() => openEdit(a)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDeleteConfirm(a)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2 pl-12">{a.content}</p>
                <div className="flex items-center gap-4 mt-1.5 pl-12 text-[11px] text-gray-400">
                  {a.startTime && (
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {a.startTime}{a.endTime ? ` → ${a.endTime}` : ""}
                    </span>
                  )}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${PRIORITY_CFG[a.priority].cls}`}>
                    {PRIORITY_CFG[a.priority].label}
                  </span>
                  <span className="ml-auto">Tạo: {a.createdAt}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      </>
      ) : (
        <>
          {/* Tab 2: Sent Inbox Staff */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon={Bell} value={sentInboxes.length} label="Tổng thông báo inbox đã gửi" highlight />
            <StatCard icon={Users} value={sentInboxes.filter(x => !x.recipientId).length} label="Gửi tới toàn bộ nhân viên" />
            <StatCard icon={User} value={sentInboxes.filter(x => x.recipientId).length} label="Gửi tới nhân viên cụ thể" />
          </div>

          {/* Filters Sent Inbox */}
          <div className="bg-white rounded-2xl border border-black/[0.05] p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchInbox} onChange={e => setSearchInbox(e.target.value)}
                placeholder="Tìm tiêu đề, nội dung, mã/tên staff..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 transition-all" />
            </div>
            <CustomSelect value={filterInboxType} onChange={setFilterInboxType} className="w-44"
              options={[
                { value: "all",     label: "Tất cả loại" },
                { value: "system",  label: "Hệ thống" },
                { value: "hr",      label: "Nhân sự" },
                { value: "leave",   label: "Nghỉ phép" },
              ]} />
            <CustomSelect value={filterInboxTarget} onChange={setFilterInboxTarget} className="w-48"
              options={[
                { value: "all",       label: "Tất cả đối tượng" },
                { value: "all_staff", label: "Toàn bộ nhân viên" },
                { value: "one_staff", label: "Nhân viên cụ thể" },
              ]} />
            <span className="text-xs text-gray-400 font-bold ml-auto">{filteredInboxes.length} thông báo</span>
          </div>

          {/* List Sent Inbox */}
          {loadingSent ? (
            <div className="bg-white rounded-2xl border border-black/[0.05] p-16 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-[#C62828]/30 border-t-[#C62828] animate-spin mx-auto" />
            </div>
          ) : filteredInboxes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-black/[0.05] p-16 text-center">
              <Bell size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-bold text-gray-400">Chưa có thông báo inbox nào được gửi</p>
              <p className="text-xs text-gray-300 mt-1">Nhấn «Gửi inbox staff» để bắt đầu gửi thông báo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInboxes.map(n => {
                const itype = INBOX_TYPE_CFG[n.type] || { label: "Hệ thống", icon: Settings, cls: "bg-blue-50 text-blue-600" }
                const Icon = itype.icon
                const emp = employees.find(e => e.id === n.recipientId)
                const recipientText = n.recipientId ? `${emp?.name || n.recipientId} (${n.recipientId})` : "Toàn bộ nhân viên"
                
                return (
                  <div key={n.id} className="bg-white rounded-2xl border border-black/[0.05] border-l-4 border-l-red-400 px-5 py-4 hover:shadow-md transition-all group flex items-start justify-between gap-4">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${itype.cls}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-gray-800 text-sm truncate">{n.title || "Không có tiêu đề"}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${itype.cls}`}>
                            {itype.label}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${n.recipientId ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-[#fff1f2] text-[#7a1d22] border-[#efd7da]"}`}>
                            Gửi tới: {recipientText}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed whitespace-pre-wrap">{n.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            Thời gian gửi: {n.time || "—"}
                          </span>
                          {n.recipientId && (
                            <span className={`font-bold text-[10px] ${n.read ? "text-emerald-600" : "text-amber-500"}`}>
                              {n.read ? "✓ Đã đọc" : "○ Chưa đọc"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button onClick={() => setDeleteInboxConfirm(n)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 mt-0.5">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editItem ? "Chỉnh sửa thông báo" : "Tạo thông báo mới"}
        icon={Bell} width="lg"
        footer={
          <>
            <ModalCancelButton onClick={() => setShowForm(false)} />
            <ModalSubmitButton onClick={handleSave} loading={saving} label={editItem ? "Lưu thay đổi" : "Tạo thông báo"} />
          </>
        }
      >
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Tiêu đề <span className="text-red-500">*</span></label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Nhập tiêu đề..."
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]/50 transition-all ${formErr.title ? "border-red-300" : "border-gray-200"}`} />
              {formErr.title && <p className="text-xs text-red-500 mt-1">{formErr.title}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Loại thông báo</label>
              <CustomSelect value={form.type} onChange={v => setForm(f => ({ ...f, type: v as AnnouncementType }))}
                heightClass="h-[42px]"
                options={[
                  { value: "info",    label: "Thông tin" },
                  { value: "warning", label: "Cảnh báo" },
                  { value: "event",   label: "Sự kiện" },
                  { value: "urgent",  label: "Khẩn cấp" },
                ]} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5">Nội dung <span className="text-red-500">*</span></label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={3} placeholder="Nhập nội dung thông báo..."
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]/50 transition-all ${formErr.content ? "border-red-300" : "border-gray-200"}`} />
            {formErr.content && <p className="text-xs text-red-500 mt-1">{formErr.content}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Thời gian bắt đầu</label>
              <CustomDateTimePicker
                value={form.startTime}
                onChange={v => setForm(f => ({ ...f, startTime: v }))}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Thời gian kết thúc</label>
              <CustomDateTimePicker
                value={form.endTime}
                onChange={v => setForm(f => ({ ...f, endTime: v }))}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5">Mức độ ưu tiên</label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as AnnouncementPriority[]).map(p => (
                <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${form.priority === p ? "bg-[#C62828] border-[#C62828] text-white" : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"}`}>
                  {PRIORITY_CFG[p].full}
                </button>
              ))}
            </div>
          </div>

          {(form.title || form.content) && (
            <div className="rounded-xl border border-dashed border-gray-200 p-4 bg-gray-50/80">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-2">Xem trước</p>
              <div className={`flex gap-3 p-3 rounded-xl ${TYPE_CFG[form.type].cls}`}>
                {React.createElement(TYPE_CFG[form.type].icon, { size: 16, className: "flex-shrink-0 mt-0.5" })}
                <div>
                  {form.title && <p className="text-sm font-black">{form.title}</p>}
                  {form.content && <p className="text-xs mt-0.5 opacity-80 leading-relaxed">{form.content}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title="Chi tiết thông báo"
        icon={Bell}
        width="lg"
        footer={<ModalCancelButton onClick={() => setPreviewItem(null)} label="Đóng" />}
      >
        {previewItem && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <TypeBadge type={previewItem.type} />
              <StatusBadge status={previewItem.status} />
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${PRIORITY_CFG[previewItem.priority].cls}`}>
                {PRIORITY_CFG[previewItem.priority].full}
              </span>
              <span className="text-xs text-gray-400 ml-auto">Tạo: {previewItem.createdAt}</span>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <p className="text-base font-black text-gray-800">{previewItem.title}</p>
              <p className="text-sm text-gray-600 leading-relaxed mt-2 whitespace-pre-wrap">
                {previewItem.content || "—"}
              </p>
            </div>
            {(previewItem.startTime || previewItem.endTime) && (
              <div className="text-xs text-gray-500">
                <span className="font-bold text-gray-600">Khung thời gian:</span>{" "}
                {previewItem.startTime || "—"}{previewItem.endTime ? ` → ${previewItem.endTime}` : ""}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={showInboxForm}
        onClose={() => setShowInboxForm(false)}
        title="Gửi thông báo inbox cho staff"
        icon={Bell}
        width="xl"
        bodyClassName="overflow-visible"
        footer={
          <>
            <ModalCancelButton onClick={() => setShowInboxForm(false)} />
            <ModalSubmitButton onClick={sendInboxNotification} loading={sendingInbox} label="Gửi thông báo" />
          </>
        }
      >
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Tiêu đề</label>
              <input
                value={inboxForm.title}
                onChange={e => setInboxForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ví dụ: Cập nhật hệ thống"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]/50 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Loại thông báo</label>
              <CustomSelect
                value={inboxForm.type}
                onChange={v => setInboxForm(f => ({ ...f, type: v }))}
                options={[
                  { value: "system", label: "Hệ thống" },
                  { value: "hr", label: "Nhân sự" },
                  { value: "leave", label: "Nghỉ phép" },
                ]}
                heightClass="h-[42px]"
              />
              <p className="text-[11px] text-gray-400 mt-1">Dùng để gắn nhãn và lọc trong inbox staff (không ảnh hưởng quyền nhận).</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5">Nội dung <span className="text-red-500">*</span></label>
            <textarea
              rows={4}
              value={inboxForm.message}
              onChange={e => setInboxForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Nhập nội dung thông báo gửi tới staff..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Đối tượng nhận</label>
              <CustomSelect
                value={inboxForm.targetMode}
                onChange={v => setInboxForm(f => ({ ...f, targetMode: v, recipientId: "" }))}
                options={[
                  { value: "all", label: "Toàn bộ nhân viên active" },
                  { value: "one", label: "Một nhân viên cụ thể" },
                ]}
                heightClass="h-[42px]"
                menuClassName="max-h-[360px]"
                portal
              />
            </div>
            {inboxForm.targetMode === "one" && (
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Nhân viên nhận</label>
                <CustomSelect
                  value={inboxForm.recipientId}
                  onChange={v => setInboxForm(f => ({ ...f, recipientId: v }))}
                  options={employees.map(e => ({ value: e.id, label: `${e.name} (${e.id})` }))}
                  heightClass="h-[42px]"
                  searchable
                  menuClassName="max-h-[420px]"
                  portal
                />
              </div>
            )}
          </div>
          {!inboxForm.message.trim() && (
            <p className="text-xs text-amber-600">Nội dung thông báo đang để trống.</p>
          )}
          {inboxForm.targetMode === "one" && !inboxForm.recipientId && (
            <p className="text-xs text-amber-600">Bạn chưa chọn nhân viên nhận thông báo.</p>
          )}
        </div>
      </Modal>

      <Modal open={showDefault} onClose={() => setShowDefault(false)}
        title="Thông báo mặc định" icon={Settings} width="md"
        footer={
          <>
            <ModalCancelButton onClick={() => setShowDefault(false)} />
            <ModalSubmitButton onClick={saveDefault} loading={savingDefault} label="Lưu cài đặt" />
          </>
        }
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-bold text-gray-700">Trạng thái</p>
              <p className="text-xs text-gray-400 mt-0.5">Hiển thị khi không có thông báo nào đang hoạt động</p>
            </div>
            <button type="button" onClick={() => setDefaultEnabled(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${defaultEnabled ? "bg-emerald-500" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${defaultEnabled ? "left-6" : "left-0.5"}`} />
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5">Nội dung thông báo mặc định</label>
            <textarea value={defaultContent} onChange={e => setDefaultContent(e.target.value)}
              rows={3} placeholder="Nội dung hiển thị khi không có thông báo..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]/50 transition-all" />
          </div>

          {defaultContent && (
            <div className="rounded-xl border border-dashed border-gray-200 p-4 bg-gray-50/80">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-2">Xem trước</p>
              <div className="flex gap-3 p-3 rounded-xl bg-blue-50 text-blue-600">
                <Info size={16} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{defaultContent}</p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-base font-black text-gray-800 text-center">Xóa thông báo?</h3>
            <p className="text-sm text-gray-500 text-center mt-1 mb-5 px-4">
              «{deleteConfirm.title}» sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                Hủy
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors">
                Xóa
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {deleteInboxConfirm && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteInboxConfirm(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-base font-black text-gray-800 text-center">Thu hồi thông báo inbox?</h3>
            <p className="text-sm text-gray-500 text-center mt-1 mb-5 px-4">
              Thông báo «{deleteInboxConfirm.title || "Không có tiêu đề"}» sẽ bị xóa khỏi inbox của nhân viên và không thể khôi phục.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteInboxConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                Hủy
              </button>
              <button onClick={() => handleDeleteInbox(deleteInboxConfirm.id)}
                className="flex-1 py-2.5 bg-[#C62828] hover:bg-[#b71c1c] text-white rounded-xl text-sm font-bold transition-colors">
                Xóa
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
