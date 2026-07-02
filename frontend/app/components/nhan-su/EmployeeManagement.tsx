import React, { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  Plus, Search, Edit2, Trash2, X, Download, MoreHorizontal, Eye, Users,
  Building2, Paperclip, Briefcase, ExternalLink, FileText, Image as ImageIcon,
  File, Link2, AlertCircle, UserPlus, UserMinus, ArrowRightLeft,
  TrendingUp, RefreshCw, ChevronLeft, ChevronRight, Maximize2,
  User, Camera, ClipboardList, Upload, Calendar
} from "lucide-react"
import { Employee, EmpExtForm, WorkHistoryEntry, WorkHistoryType, Attachment, OrgNode } from "../../types"
import { api } from "@/lib/api"
import { Badge } from "../ui/badge"
import { initials } from "../../utils"
import UserProfile from "../nhan-vien/UserProfile"
import { CustomDatePicker as DateInput } from "../ui/CustomDatePicker"
import { VNAddressSelect } from "../ui/VNAddressSelect"
import { CustomSelect } from "../ui/CustomSelect"
import ConfirmModal from "../ui/ConfirmModal"

type EditTab = "personal" | "work" | "files" | "history"

const CONTRACT_TYPES = ["Chính thức", "Thực tập", "Part-time", "CTV", "Cộng tác viên"]

const WH_CONFIG: Record<WorkHistoryType, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  join:      { label: "Bắt đầu làm việc", color: "#22c55e", bg: "#f0fdf4", Icon: UserPlus },
  rehire:    { label: "Tái tuyển dụng",   color: "#f59e0b", bg: "#fffbeb", Icon: RefreshCw },
  resign:    { label: "Nghỉ việc",        color: "#ef4444", bg: "#fef2f2", Icon: UserMinus },
  transfer:  { label: "Điều chuyển",      color: "#3b82f6", bg: "#eff6ff", Icon: ArrowRightLeft },
  promotion: { label: "Thăng chức",       color: "#8b5cf6", bg: "#f5f3ff", Icon: TrendingUp },
}

function parseVNDate(s: string): Date | null {
  if (!s) return null
  const parts = s.split("/").map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return null
  return new Date(parts[2], parts[1] - 1, parts[0])
}

function calcGap(d1: string, d2: string): string {
  const a = parseVNDate(d1), b = parseVNDate(d2)
  if (!a || !b) return ""
  const days = Math.max(0, Math.floor((b.getTime() - a.getTime()) / 86400000))
  const m = Math.floor(days / 30), r = days % 30
  if (m > 0 && r > 0) return `${m} tháng ${r} ngày`
  if (m > 0) return `${m} tháng`
  return `${days} ngày`
}

function todayVN(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

function addMonthsToVNDate(dateStr: string, months: number): string {
  const d = parseVNDate(dateStr)
  if (!d) return ""
  d.setMonth(d.getMonth() + months)
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}



function isPDF(url: string) {
  return url.toLowerCase().includes(".pdf")
}

function Lightbox({ photos, startIndex, onClose }: { photos: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex)
  const stripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") setIdx(i => (i - 1 + photos.length) % photos.length)
      if (e.key === "ArrowRight") setIdx(i => (i + 1) % photos.length)
    }
    window.addEventListener("keydown", handle)
    return () => window.removeEventListener("keydown", handle)
  }, [photos.length, onClose])

  useEffect(() => {
    const el = stripRef.current?.children[idx] as HTMLElement
    el?.scrollIntoView({ behavior: "smooth", inline: "center" })
  }, [idx])

  return (
    <div className="fixed inset-0 z-[200] bg-black/96 flex flex-col" onClick={onClose}>
      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10">
        <X size={20} />
      </button>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm font-mono">
        {idx + 1} / {photos.length}
      </div>

      <div className="flex-1 flex items-center justify-center gap-4 px-16" onClick={e => e.stopPropagation()}>
        <button onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
          className="w-12 h-12 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-all flex-shrink-0">
          <ChevronLeft size={22} />
        </button>

        {isPDF(photos[idx]) ? (
          <div className="flex flex-col items-center gap-5 text-white">
            <FileText size={80} className="text-white/30" />
            <p className="text-lg font-semibold">Tài liệu PDF</p>
            <a href={photos[idx]} target="_blank" rel="noopener noreferrer"
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
              <ExternalLink size={15} /> Mở PDF
            </a>
          </div>
        ) : (
          <img src={photos[idx]} alt="" draggable={false}
            className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-2xl select-none" />
        )}

        <button onClick={() => setIdx(i => (i + 1) % photos.length)}
          className="w-12 h-12 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-all flex-shrink-0">
          <ChevronRight size={22} />
        </button>
      </div>

      <div ref={stripRef} className="flex gap-2 px-4 py-4 overflow-x-auto justify-center"
        style={{ scrollbarWidth: "none" }} onClick={e => e.stopPropagation()}>
        {photos.map((url, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${i === idx ? "border-white scale-110 shadow-lg" : "border-white/20 hover:border-white/50"}`}>
            {isPDF(url)
              ? <div className="w-full h-full bg-gray-700 flex items-center justify-center"><FileText size={18} className="text-white/60" /></div>
              : <img src={url} alt="" className="w-full h-full object-cover" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function FilesTab({
  photos,
  onChangePhotos,
  attachments,
  onChangeAttachments
}: {
  photos: string[]
  onChangePhotos: (p: string[]) => void
  attachments: Attachment[]
  onChangeAttachments: (a: Attachment[]) => void
}) {
  const [url, setUrl] = useState("")
  const [name, setName] = useState("")
  const [showAddLink, setShowAddLink] = useState(false)
  const [err, setErr] = useState("")
  const [lightbox, setLightbox] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    const newPhotos = [...photos]
    const newAttachments = [...attachments]

    Array.from(files).forEach(file => {
      const isImg = file.type.startsWith("image/")
      if (isImg) {
        const mockImgUrl = `https://picsum.photos/seed/${encodeURIComponent(file.name)}/800/800`
        newPhotos.push(mockImgUrl)
      } else {
        const mockDocUrl = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
          ? "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
          : `https://example.com/docs/${encodeURIComponent(file.name)}`
        newAttachments.push({
          id: Date.now() + Math.random(),
          name: file.name,
          url: mockDocUrl,
          type: "file",
          uploadedAt: todayVN()
        })
      }
    })
    
    onChangePhotos(newPhotos)
    onChangeAttachments(newAttachments)
  }

  const addLink = () => {
    const vName = name.trim()
    const vUrl = url.trim()
    if (!vName || !vUrl) return
    onChangeAttachments([...attachments, {
      id: Date.now(),
      name: vName,
      url: vUrl,
      type: "link",
      uploadedAt: todayVN()
    }])
    setName("")
    setUrl("")
    setShowAddLink(false)
  }

  const getIcon = (a: Attachment) => {
    if (a.type === "link") return <Link2 size={16} className="text-blue-500" />
    if (a.url.toLowerCase().includes(".pdf")) return <FileText size={16} className="text-red-500" />
    return <File size={16} className="text-gray-400" />
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 flex flex-col md:flex-row gap-3 items-center">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
        <button onClick={() => fileInputRef.current?.click()}
          className="w-full md:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 border-2 border-dashed border-[#C62828] text-[#C62828] bg-white hover:bg-red-50/50 rounded-xl text-sm font-black transition-all cursor-pointer">
          <Upload size={15} />
          <span>Chọn ảnh/tài liệu từ máy tính</span>
        </button>
        <button onClick={() => setShowAddLink(!showAddLink)}
          className="w-full md:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-xl text-sm font-black transition-all cursor-pointer">
          <Link2 size={15} />
          <span>Thêm link liên kết (URL)</span>
        </button>
      </div>

      {showAddLink && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200 animate-in fade-in duration-150">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên liên kết (ví dụ: Portfolio)..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/45 bg-white" />
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Nhập đường dẫn liên kết (http://...)..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/45 bg-white" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAddLink(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-200 rounded-lg transition-colors">Hủy</button>
            <button onClick={addLink} disabled={!name.trim() || !url.trim()} className="px-4 py-1.5 bg-[#C62828] disabled:opacity-50 text-white text-xs font-bold rounded-lg hover:bg-[#B71C1C] transition-colors">Lưu</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon size={14} className="text-gray-400" /> Hình ảnh hồ sơ ({photos.length})
        </h4>
        {photos.length === 0 ? (
          <div className="py-8 text-center text-gray-300 border border-dashed border-gray-200 rounded-2xl bg-white">
            <p className="text-xs">Chưa có hình ảnh nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-white border border-black/5 rounded-2xl p-4">
            {photos.map((src, i) => (
              <div key={i} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 cursor-pointer"
                onClick={() => setLightbox(i)}>
                <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Maximize2 size={16} className="text-white" />
                </div>
                <button onClick={e => { e.stopPropagation(); onChangePhotos(photos.filter((_, j) => j !== i)) }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all shadow opacity-0 group-hover:opacity-100">
                  <X size={12} />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 bg-[#C62828] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Đại diện</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
          <Paperclip size={14} className="text-gray-400" /> Tài liệu & Liên kết ({attachments.length})
        </h4>
        {attachments.length === 0 ? (
          <div className="py-8 text-center text-gray-300 border border-dashed border-gray-200 rounded-2xl bg-white">
            <p className="text-xs">Chưa có tài liệu đính kèm nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3.5 bg-white border border-black/5 rounded-2xl hover:border-gray-300 transition-all group">
                <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">{getIcon(a)}</div>
                <div className="flex-1 min-w-0">
                  <a href={a.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-bold text-gray-700 hover:text-[#C62828] hover:underline block truncate cursor-pointer">
                    {a.name}
                  </a>
                  <p className="text-[10px] text-gray-400 mt-0.5">{a.url} · {a.uploadedAt}</p>
                </div>
                <button onClick={() => onChangeAttachments(attachments.filter(x => x.id !== a.id))}
                  className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightbox !== null && <Lightbox photos={photos} startIndex={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

function WorkHistoryTab({ history, onChange, orgNodes }: {
  history: WorkHistoryEntry[]
  onChange: (h: WorkHistoryEntry[]) => void
  orgNodes: { id: string; name: string; type?: string }[]
}) {
  const [show, setShow] = useState(false)
  const [entry, setEntry] = useState<Partial<WorkHistoryEntry>>({ type: "join", date: todayVN() })

  const sorted = useMemo(() =>
    [...history].sort((a, b) => (parseVNDate(a.date)?.getTime() ?? 0) - (parseVNDate(b.date)?.getTime() ?? 0)),
    [history]
  )

  const add = () => {
    if (!entry.date || !entry.type) return
    onChange([...history, { id: Date.now(), title: "", ...entry } as WorkHistoryEntry])
    setEntry({ type: "join", date: todayVN() })
    setShow(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShow(p => !p)}
          className="flex items-center gap-1.5 px-3 py-2 border border-[#C62828] text-[#C62828] rounded-xl text-xs font-bold hover:bg-red-50 transition-colors">
          + Thêm sự kiện
        </button>
      </div>

      {show && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Loại sự kiện</label>
              <select value={entry.type}
                onChange={e => setEntry(p => ({ ...p, type: e.target.value as WorkHistoryType }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white text-gray-700">
                {(Object.entries(WH_CONFIG) as [WorkHistoryType, typeof WH_CONFIG[WorkHistoryType]][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ngày</label>
              <DateInput value={entry.date || ""} onChange={val => setEntry(p => ({ ...p, date: val }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white text-gray-700" />
            </div>
            {entry.type !== "resign" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Chức vụ</label>
                  <select value={entry.title || ""} onChange={e => setEntry(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white text-gray-700">
                    <option value="">Chọn chức vụ</option>
                    {orgNodes.filter(n => n.type === "position").map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Đơn vị</label>
                  <select value={entry.orgNodeId || ""} onChange={e => setEntry(p => ({ ...p, orgNodeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white text-gray-700">
                    <option value="">Chọn đơn vị</option>
                    {orgNodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>
              </>
            )}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ghi chú</label>
              <input value={entry.note || ""} onChange={e => setEntry(p => ({ ...p, note: e.target.value }))}
                placeholder="Ghi chú..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShow(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-200 rounded-lg transition-colors">Hủy</button>
            <button onClick={add} className="px-3 py-1.5 bg-[#C62828] text-white text-xs font-bold rounded-lg hover:bg-[#B71C1C] transition-colors">Lưu</button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="py-10 text-center text-gray-300 border-2 border-dashed border-gray-200 rounded-xl">
          <Briefcase size={36} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">Chưa có lịch sử công tác</p>
        </div>
      ) : (
        <div className="relative pl-10">
          <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-gradient-to-b from-gray-200 via-gray-200 to-transparent" />
          {sorted.map((ev, i) => {
            const cfg = WH_CONFIG[ev.type] ?? WH_CONFIG.join
            const Icon = cfg.Icon
            const next = sorted[i + 1]
            const gap = ev.type === "resign" && next && (next.type === "rehire" || next.type === "join")
              ? calcGap(ev.date, next.date) : null

            return (
              <React.Fragment key={ev.id}>
                <div className="relative flex gap-4 pb-5 group">
                  <div className="absolute -left-10 top-1 w-10 h-10 rounded-full flex items-center justify-center z-10 shadow-sm"
                    style={{ background: cfg.bg, border: `2px solid ${cfg.color}` }}>
                    <Icon size={16} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 bg-white border border-gray-100 rounded-xl p-3.5 hover:border-gray-200 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        {ev.title && <p className="mt-1.5 text-sm font-bold text-gray-800">{ev.title}</p>}
                        {ev.snapshot && <p className="text-xs text-gray-500 mt-0.5 truncate">{ev.snapshot}</p>}
                        {ev.note && <p className="text-xs text-gray-400 mt-1 italic">"{ev.note}"</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-mono text-gray-400">{ev.date}</span>
                        <button onClick={() => onChange(history.filter(h => h.id !== ev.id))}
                          className="w-6 h-6 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {gap && (
                  <div className="relative flex gap-4 pb-5">
                    <div className="absolute -left-7 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-300 z-10" />
                    <div className="flex-1 border border-dashed border-amber-300 bg-amber-50/60 rounded-xl px-4 py-2.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                        <Calendar size={13} />
                        Khoảng nghỉ việc
                      </span>
                      <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{gap}</span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PersonalTab({ form, sf, inp, sel, lbl }: {
  form: EmpExtForm
  sf: (k: keyof EmpExtForm, v: any) => void
  inp: string; sel: string; lbl: string
}) {
  const sectionLabel = "text-[10px] font-bold text-[#C62828] uppercase tracking-[0.15em] mb-3"

  return (
    <div className="space-y-6">
      <div>
        <p className={sectionLabel}>Định danh cá nhân</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lbl}>Họ và tên *</label><input value={form.name} onChange={e => sf("name", e.target.value)} placeholder="Nguyễn Văn A" className={inp} /></div>
          <div><label className={lbl}>Ngày sinh</label><DateInput value={form.dob} onChange={val => sf("dob", val)} className={inp} /></div>
          <div><label className={lbl}>Giới tính</label>
            <CustomSelect
              value={form.gender}
              onChange={val => sf("gender", val)}
              options={[
                { value: "Nam", label: "Nam" },
                { value: "Nữ", label: "Nữ" },
                { value: "Khác", label: "Khác" }
              ]}
              className="w-full"
              heightClass="h-[42px]"
            />
          </div>
          <div><label className={lbl}>Số điện thoại</label><input value={form.phone} onChange={e => sf("phone", e.target.value)} placeholder="09xx xxx xxx" className={inp} /></div>
          <div className="col-span-2"><label className={lbl}>Email</label><input value={form.email} onChange={e => sf("email", e.target.value)} placeholder="email@dudi.vn" className={inp} /></div>
        </div>
      </div>

      <div>
        <p className={sectionLabel}>CCCD / CMND</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lbl}>Số CCCD</label><input value={form.cccd} onChange={e => sf("cccd", e.target.value)} placeholder="012345678901" className={inp} /></div>
          <div><label className={lbl}>Ngày cấp</label><DateInput value={form.cccdDate} onChange={val => sf("cccdDate", val)} className={inp} /></div>
          <div className="col-span-2"><label className={lbl}>Nơi cấp</label><input value={form.cccdPlace} onChange={e => sf("cccdPlace", e.target.value)} placeholder="Cục CSQLHC về TTXH..." className={inp} /></div>
        </div>
      </div>

      <div>
        <p className={sectionLabel}>Tài khoản ngân hàng</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lbl}>Số tài khoản</label><input value={form.bankAccount} onChange={e => sf("bankAccount", e.target.value)} placeholder="0123456789" className={inp} /></div>
          <div><label className={lbl}>Ngân hàng</label><input value={form.bank} onChange={e => sf("bank", e.target.value)} placeholder="Vietcombank..." className={inp} /></div>
        </div>
      </div>

      <div>
        <p className={sectionLabel}>Địa chỉ hiện tại</p>
        <div className="grid grid-cols-3 gap-3">
          <VNAddressSelect
            province={form.curProvince}
            district={form.curDistrict}
            ward={form.curWard}
            onChange={addr => {
              sf("curProvince", addr.province)
              sf("curDistrict", addr.district)
              sf("curWard", addr.ward)
            }}
            lblClass={lbl}
            selClass={sel}
            inpClass={inp}
          />
          <div className="col-span-3"><label className={lbl}>Số nhà, tên đường</label><input value={form.curStreet} onChange={e => sf("curStreet", e.target.value)} placeholder="45 Đường Nguyễn Thị Thập..." className={inp} /></div>
        </div>
      </div>

      <div>
        <p className={sectionLabel}>Quê quán</p>
        <div className="grid grid-cols-3 gap-3">
          <VNAddressSelect
            province={form.homeProvince}
            district={form.homeDistrict}
            ward={form.homeWard}
            onChange={addr => {
              sf("homeProvince", addr.province)
              sf("homeDistrict", addr.district)
              sf("homeWard", addr.ward)
            }}
            lblClass={lbl}
            selClass={sel}
            inpClass={inp}
          />
          <div className="col-span-3"><label className={lbl}>Địa chỉ cụ thể</label><input value={form.homeStreet} onChange={e => sf("homeStreet", e.target.value)} placeholder="Ấp, xóm, số nhà..." className={inp} /></div>
        </div>
      </div>

      <div>
        <p className={sectionLabel}>Học vấn & Ghi chú</p>
        <div className="grid grid-cols-1 gap-3">
          <div><label className={lbl}>Trường đại học / cao đẳng</label><input value={form.university} onChange={e => sf("university", e.target.value)} placeholder="Tên trường..." className={inp} /></div>
          <div><label className={lbl}>Ghi chú</label>
            <textarea value={form.notes} onChange={e => sf("notes", e.target.value)} rows={2} placeholder="Ghi chú thêm..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/50 resize-none text-gray-700 bg-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkTab({ form, sf, inp, sel, lbl, orgNodes, branches }: {
  form: EmpExtForm
  sf: (k: keyof EmpExtForm, v: any) => void
  inp: string; sel: string; lbl: string
  orgNodes: { id: string; name: string; type?: string; parentId?: string }[]
  branches: { id: string; name: string }[]
}) {
  const sectionLabel = "text-[10px] font-bold text-[#C62828] uppercase tracking-[0.15em] mb-3"
  const [catalogPositions, setCatalogPositions] = useState<{id:string,name:string,code:string}[]>([])
  useEffect(() => {
    api.positions.list({ status: "active" }).then(setCatalogPositions).catch(() => {})
  }, [])

  const activeHierarchy = useMemo(() => {
    const result = {
      branchId: form.branchId || "",
      departmentId: "",
      subDepartmentId: "",
      teamId: "",
      positionId: ""
    }

    let currentNode = orgNodes.find(n => n.id === form.orgNodeId)
    while (currentNode) {
      if (currentNode.type === "position") {
        result.positionId = currentNode.id
      } else if (currentNode.type === "team") {
        result.teamId = currentNode.id
      } else if (currentNode.type === "sub-department") {
        result.subDepartmentId = currentNode.id
      } else if (currentNode.type === "department") {
        result.departmentId = currentNode.id
      } else if (currentNode.type === "branch") {
        result.branchId = currentNode.id
      }
      const parentId = currentNode.parentId
      currentNode = parentId ? orgNodes.find(n => n.id === parentId) : undefined
    }
    return result
  }, [form.orgNodeId, form.branchId, orgNodes])

  const deptList = useMemo(() => {
    if (!activeHierarchy.branchId) return []
    return orgNodes.filter(n => n.type === "department" && n.parentId === activeHierarchy.branchId)
  }, [orgNodes, activeHierarchy.branchId])

  const subDeptList = useMemo(() => {
    if (!activeHierarchy.departmentId) return []
    return orgNodes.filter(n => n.type === "sub-department" && n.parentId === activeHierarchy.departmentId)
  }, [orgNodes, activeHierarchy.departmentId])

  const posList = useMemo(() => {
    if (!activeHierarchy.subDepartmentId) return []
    return orgNodes.filter(n => n.type === "position" && n.parentId === activeHierarchy.subDepartmentId)
  }, [orgNodes, activeHierarchy.subDepartmentId])

  const teamList = useMemo(() => {
    if (!activeHierarchy.positionId) return []
    return orgNodes.filter(n => n.type === "team" && n.parentId === activeHierarchy.positionId)
  }, [orgNodes, activeHierarchy.positionId])

  return (
    <div className="space-y-6">
      <div>
        <p className={sectionLabel}>Đơn vị tổ chức</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lbl}>Chi nhánh *</label>
            <CustomSelect
              value={activeHierarchy.branchId}
              onChange={bId => {
                sf("branchId", bId)
                sf("orgNodeId", bId)
              }}
              options={branches.map(b => ({ value: b.id, label: b.name }))}
              className="w-full"
              heightClass="h-[42px]"
            />
          </div>

          <div><label className={lbl}>Phòng ban</label>
            <CustomSelect
              value={activeHierarchy.departmentId}
              onChange={dId => {
                const node = orgNodes.find(n => n.id === dId)
                sf("department", node ? node.name : "")
                sf("orgNodeId", dId || activeHierarchy.branchId)
              }}
              options={deptList.map(d => ({ value: d.id, label: d.name }))}
              disabled={!activeHierarchy.branchId}
              className="w-full"
              heightClass="h-[42px]"
            />
          </div>

          <div><label className={lbl}>Bộ phận</label>
            <CustomSelect
              value={activeHierarchy.subDepartmentId}
              onChange={sdId => {
                sf("orgNodeId", sdId || activeHierarchy.departmentId || activeHierarchy.branchId)
              }}
              options={subDeptList.map(sd => ({ value: sd.id, label: sd.name }))}
              disabled={!activeHierarchy.departmentId}
              className="w-full"
              heightClass="h-[42px]"
            />
          </div>

          <div><label className={lbl}>Vị trí / Chức vụ</label>
            <CustomSelect
              value={activeHierarchy.positionId}
              onChange={pId => {
                const node = orgNodes.find(n => n.id === pId)
                sf("position", node ? node.name : "")
                sf("orgNodeId", pId || activeHierarchy.subDepartmentId || activeHierarchy.departmentId || activeHierarchy.branchId)
              }}
              options={posList.map(p => ({ value: p.id, label: p.name }))}
              disabled={!activeHierarchy.subDepartmentId && !activeHierarchy.departmentId}
              className="w-full"
              heightClass="h-[42px]"
            />
          </div>

          <div className="col-span-2"><label className={lbl}>Nhóm</label>
            <CustomSelect
              value={activeHierarchy.teamId}
              onChange={tId => {
                sf("orgNodeId", tId || activeHierarchy.positionId || activeHierarchy.subDepartmentId || activeHierarchy.departmentId || activeHierarchy.branchId)
              }}
              options={teamList.map(t => ({ value: t.id, label: t.name }))}
              disabled={!activeHierarchy.positionId}
              className="w-full"
              heightClass="h-[42px]"
            />
          </div>
        </div>
      </div>

      {catalogPositions.length > 0 && (
        <div>
          <p className={sectionLabel}>Chức danh</p>
          <div><label className={lbl}>Chức danh (danh mục)</label>
            <CustomSelect
              value={form.positionId ?? ""}
              onChange={val => sf("positionId", val)}
              options={[{ value: "", label: "— Chọn chức danh —" }, ...catalogPositions.map(p => ({ value: p.id, label: `${p.name} (${p.code})` }))]}
              className="w-full"
              heightClass="h-[42px]"
            />
          </div>
        </div>
      )}

      <div>
        <p className={sectionLabel}>Hợp đồng & Trạng thái</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lbl}>Loại hợp đồng</label>
            <CustomSelect
              value={form.contractType}
              onChange={val => sf("contractType", val)}
              options={CONTRACT_TYPES.map(t => ({ value: t, label: t }))}
              className="w-full"
              heightClass="h-[42px]"
            />
          </div>
          <div><label className={lbl}>Trạng thái</label>
            <CustomSelect
              value={form.status}
              onChange={val => sf("status", val)}
              options={[
                { value: "active", label: "Đang làm" },
                { value: "intern", label: "Thực tập" },
                { value: "inactive", label: "Nghỉ việc" }
              ]}
              className="w-full"
              heightClass="h-[42px]"
            />
          </div>
          <div><label className={lbl}>Ngày bắt đầu làm việc</label><DateInput value={form.joinDate} onChange={val => sf("joinDate", val)} className={inp} /></div>
          {form.status === "intern" && (
            <div><label className={lbl}>Ngày kết thúc thực tập</label><DateInput value={form.internEndDate} onChange={val => sf("internEndDate", val)} className={inp} /></div>
          )}
          {form.status === "inactive" && (
            <div><label className={lbl}>Ngày nghỉ việc</label><DateInput value={form.resignDate} onChange={val => sf("resignDate", val)} className={inp} /></div>
          )}
        </div>
      </div>
    </div>
  )
}

export function EmployeeModal({ editEmp, employees, orgNodes, onClose, onSave }: {
  editEmp: Employee | null
  employees: Employee[]
  orgNodes: { id: string; name: string; type?: string; parentId?: string }[]
  onClose: () => void
  onSave: (form: EmpExtForm) => void
}) {
  const [tab, setTab] = useState<EditTab>("personal")
  const branches = orgNodes.filter(n => n.type === "branch")

  const blank = (): EmpExtForm => ({
    name: "", email: "", phone: "", department: "", position: "", positionId: "",
    joinDate: todayVN(), status: "active", contractType: "Chính thức",
    branchId: "", orgNodeId: "",
    cccd: "", cccdDate: "", cccdPlace: "", bankAccount: "", bank: "",
    dob: "", gender: "Nam",
    curProvince: "", curDistrict: "", curWard: "", curStreet: "",
    homeProvince: "", homeDistrict: "", homeWard: "", homeStreet: "",
    photos: [], attachments: [], workHistory: [],
    internEndDate: "", university: "", notes: "", resignDate: "",
  })

  const [form, setForm] = useState<EmpExtForm>(() => editEmp ? { ...blank(), ...editEmp } : blank())
  const sf = useCallback((k: keyof EmpExtForm, v: any) => setForm(p => ({ ...p, [k]: v })), [])
  const [internshipMonths, setInternshipMonths] = useState(2)

  useEffect(() => {
    api.systemConfig.get()
      .then(res => {
        if (res && res.internshipMonths !== undefined) {
          setInternshipMonths(Number(res.internshipMonths))
        }
      })
      .catch(err => console.error("Lỗi lấy cấu hình thực tập:", err))
  }, [])

  useEffect(() => {
    if (form.status === "intern" && !form.internEndDate && form.joinDate) {
      sf("internEndDate", addMonthsToVNDate(form.joinDate, internshipMonths))
    }
  }, [form.status, form.joinDate, internshipMonths, form.internEndDate, sf])

  const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/50 focus:ring-1 focus:ring-[#C62828]/10 transition-all text-gray-700 bg-white"
  const sel = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/50 text-gray-700 bg-white"
  const lbl = "block text-xs font-semibold text-gray-500 mb-1.5"

  const TABS: { key: EditTab; label: string; Icon: React.ElementType; badge?: number }[] = [
    { key: "personal",    label: "Cá nhân",      Icon: User },
    { key: "work",        label: "Công việc",     Icon: Briefcase },
    { key: "files",       label: "Tài liệu & Hình ảnh", Icon: Paperclip, badge: (form.photos.length + form.attachments.length) || undefined },
    { key: "history",     label: "Lịch sử",       Icon: ClipboardList, badge: form.workHistory.length || undefined },
  ]

  const newId = useMemo(() => {
    const d = new Date()
    const yy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    const min = String(d.getMinutes()).padStart(2, "0")
    const baseId = `${yy}${mm}${dd}${min}`
    let candidate = baseId
    let count = 1
    while (employees.some(e => e.id === candidate)) {
      candidate = `${baseId}-${count}`
      count++
    }
    return candidate
  }, [employees])

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="bg-[#F5F1EF] rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh]">

        <div className="bg-gradient-to-r from-[#C62828] to-[#E64A19] px-6 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-white font-bold text-lg">{editEmp ? `Sửa hồ sơ — ${editEmp.name}` : "Thêm nhân viên mới"}</h3>
            <p className="text-white/60 text-xs mt-0.5">ID: {editEmp ? editEmp.id : newId}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="bg-white border-b border-gray-100 px-4 flex gap-0.5 flex-shrink-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold transition-colors whitespace-nowrap ${tab === t.key ? "text-[#C62828]" : "text-gray-400 hover:text-gray-600"}`}>
              <t.Icon size={15} />
              <span>{t.label}</span>
              {t.badge ? (
                <span className="w-4 h-4 bg-[#C62828] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{t.badge}</span>
              ) : null}
              {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C62828] rounded-full" />}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5" style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e7eb transparent" }}>
          {tab === "personal"    && <PersonalTab form={form} sf={sf} inp={inp} sel={sel} lbl={lbl} />}
          {tab === "work"        && <WorkTab form={form} sf={sf} inp={inp} sel={sel} lbl={lbl} orgNodes={orgNodes} branches={branches} />}
          {tab === "files"       && <FilesTab photos={form.photos} onChangePhotos={p => sf("photos", p)} attachments={form.attachments} onChangeAttachments={a => sf("attachments", a)} />}
          {tab === "history"     && <WorkHistoryTab history={form.workHistory} onChange={h => sf("workHistory", h)} orgNodes={orgNodes} />}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-white rounded-b-2xl flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-gray-400">
            {tab === "personal" && "Thông tin cá nhân · Địa chỉ · Học vấn"}
            {tab === "work" && "Đơn vị · Hợp đồng · Trạng thái"}
            {tab === "files" && "Hình ảnh hồ sơ và tài liệu đính kèm"}
            {tab === "history" && "Lịch sử và quá trình công tác"}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors">
              Hủy
            </button>
            <button onClick={() => onSave(form)}
              className="px-6 py-2.5 bg-gradient-to-r from-[#C62828] to-[#E64A19] hover:opacity-90 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-[#C62828]/20">
              {editEmp ? "Lưu thay đổi" : "Thêm nhân viên"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function EmployeeManagement({ employees, setEmployees, orgNodes = [], selectedBranch = "all", onBranchChange }: {
  employees: Employee[]
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>
  orgNodes?: { id: string; name: string; type?: string; parentId?: string }[]
  selectedBranch?: string
  onBranchChange?: (b: string) => void
}) {
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDept, setFilterDept] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [viewEmp, setViewEmp] = useState<Employee | null>(null)
  const [editEmp, setEditEmp] = useState<Employee | null>(null)
  const [historyConfirm, setHistoryConfirm] = useState<{
    detectedType: "transfer" | "promotion" | "resign" | "rehire"
    defaultNote: string
    customNote: string
    pendingForm: EmpExtForm
  } | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const [deleteEmpId, setDeleteEmpId] = useState<string | null>(null)
  const [profileUpdates, setProfileUpdates] = useState<any[]>([])
  const [previewReq, setPreviewReq] = useState<any | null>(null)

  useEffect(() => {
    api.profileUpdates.list().then(setProfileUpdates).catch(() => {})
  }, [])

  const handleRequestUpdate = async (empId: string) => {
    try {
      const res = await api.profileUpdates.request(empId)
      setProfileUpdates(prev => [...prev, res])
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleApproveUpdate = async (id: string) => {
    try {
      await api.profileUpdates.approve(id)
      setProfileUpdates(prev => prev.map(p => p.id === id ? { ...p, status: "approved" } : p))
      if (previewReq) {
        setEmployees(prev => prev.map(e => e.id === previewReq.employeeId ? { ...e, ...previewReq.pendingData } : e))
      }
      setPreviewReq(null)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleRejectUpdate = async (id: string, reason: string) => {
    try {
      await api.profileUpdates.reject(id, reason)
      setProfileUpdates(prev => prev.map(p => p.id === id ? { ...p, status: "rework_requested", reworkReason: reason } : p))
      setPreviewReq(null)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const branches = useMemo(() => orgNodes.filter(n => n.type === "branch"), [orgNodes])

  const branchCount = useMemo(() => {
    const m: Record<string, number> = {}
    employees.forEach(e => { const b = (e as any).branchId || ""; m[b] = (m[b] || 0) + 1 })
    return m
  }, [employees])

  const depts = useMemo(() => Array.from(new Set(employees.map(e => e.department))), [employees])

  const filtered = useMemo(() => employees.filter(e => {
    if (["0000000000", "1111111111", "2222222222"].includes(e.id)) return false
    const q = search.toLowerCase()
    const matchQ = !q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
    const matchS = filterStatus === "all" || e.status === filterStatus
    const matchD = filterDept === "all" || e.department === filterDept
    const matchB = selectedBranch === "all" || (e as any).branchId === selectedBranch
    return matchQ && matchS && matchD && matchB
  }), [employees, search, filterStatus, filterDept, selectedBranch])

  const saveEmployeeData = async (finalForm: EmpExtForm) => {
    try {
      if (editEmp) {
        const updated = await api.employees.update(editEmp.id, finalForm) as Employee
        setEmployees(prev => prev.map(e => e.id === editEmp.id ? { ...e, ...updated } : e))
      } else {
        const created = await api.employees.create(finalForm) as Employee
        setEmployees(prev => [...prev, created])
      }
    } catch {
      if (editEmp) {
        setEmployees(prev => prev.map(e => e.id === editEmp.id ? { ...e, ...finalForm } : e))
      } else {
        const d = new Date()
        const yy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, "0")
        const dd = String(d.getDate()).padStart(2, "0")
        const min = String(d.getMinutes()).padStart(2, "0")
        const baseId = `${yy}${mm}${dd}${min}`
        let candidate = baseId
        let count = 1
        while (employees.some(e => e.id === candidate)) {
          candidate = `${baseId}-${count}`
          count++
        }
        setEmployees(prev => [...prev, { id: candidate, ...finalForm } as Employee])
      }
    }
    setShowModal(false)
    setEditEmp(null)
  }

  const handleConfirmHistory = async (writeHistory: boolean) => {
    if (!historyConfirm) return
    let finalForm = { ...historyConfirm.pendingForm }

    if (writeHistory) {
      const path = []
      let curr = orgNodes.find(n => n.id === finalForm.orgNodeId)
      while (curr) {
        path.push(curr.name)
        const pId = curr.parentId
        curr = pId ? orgNodes.find(n => n.id === pId) : undefined
      }
      const snapshot = path.reverse().join(" · ")

      const newHistoryEntry = {
        id: finalForm.workHistory.length + 1,
        type: historyConfirm.detectedType,
        date: todayVN(),
        toDate: "",
        title: finalForm.position || "Nhân viên",
        orgNodeId: finalForm.orgNodeId,
        snapshot: snapshot,
        note: historyConfirm.customNote || historyConfirm.defaultNote
      }
      finalForm.workHistory = [...finalForm.workHistory, newHistoryEntry]
    }

    setHistoryConfirm(null)
    await saveEmployeeData(finalForm)
  }

  const handleSave = async (form: EmpExtForm) => {
    let finalForm = { ...form }
    
    if (editEmp) {
      const isDeptChanged = form.department !== editEmp.department
      const isPosChanged = form.position !== editEmp.position
      const isStatusChanged = form.status !== editEmp.status

      let detectedType: "transfer" | "promotion" | "resign" | "rehire" | null = null
      let defaultNote = ""

      if (isStatusChanged) {
        if (editEmp.status === "inactive" && (form.status === "active" || form.status === "intern")) {
          detectedType = "rehire"
          defaultNote = "Tái tuyển dụng"
        } else if ((editEmp.status === "active" || editEmp.status === "intern") && form.status === "inactive") {
          detectedType = "resign"
          defaultNote = "Nghỉ việc"
        } else if (editEmp.status === "intern" && form.status === "active") {
          detectedType = "promotion"
          defaultNote = "Chuyển chính thức"
        }
      }

      if (!detectedType && (isDeptChanged || isPosChanged)) {
        detectedType = "transfer"
        defaultNote = "Thuyên chuyển công tác"
      }

      if (detectedType) {
        setHistoryConfirm({
          detectedType,
          defaultNote,
          customNote: defaultNote,
          pendingForm: form
        })
        return
      }
    } else {
      const path = []
      let curr = orgNodes.find(n => n.id === form.orgNodeId)
      while (curr) {
        path.push(curr.name)
        const pId = curr.parentId
        curr = pId ? orgNodes.find(n => n.id === pId) : undefined
      }
      const snapshot = path.reverse().join(" · ")

      const joinEntry = {
        id: 1,
        type: "join" as const,
        date: form.joinDate || todayVN(),
        toDate: "",
        title: form.position || "Nhân viên",
        orgNodeId: form.orgNodeId,
        snapshot: snapshot,
        note: "Tiếp nhận nhân sự mới"
      }
      finalForm.workHistory = [joinEntry]
    }

    await saveEmployeeData(finalForm)
  }

  const handleDelete = async (id: string) => {
    setDeleteEmpId(id)
  }

  const confirmDelete = async () => {
    if (!deleteEmpId) return
    try { await api.employees.delete(deleteEmpId) } catch {}
    setEmployees(prev => prev.filter(e => e.id !== deleteEmpId))
    setDeleteEmpId(null)
  }

  const openEdit = (emp: Employee) => { setEditEmp(emp); setShowModal(true) }
  const openAdd = () => { setEditEmp(null); setShowModal(true) }

  const stats = useMemo(() => ({
    active: employees.filter(e => e.status === "active").length,
    intern: employees.filter(e => e.status === "intern").length,
    inactive: employees.filter(e => e.status === "inactive").length,
  }), [employees])

  return (
    <div className="space-y-5">
      <div className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px] p-5 rounded-2xl text-white flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div className="flex items-center">
          <div className="flex gap-1.5 items-center mr-4 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white/30 animate-pulse"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white/60 animate-pulse delay-75"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse delay-150"></span>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Quản lý nhân sự</h2>
            <p className="text-xs text-white/80 mt-1">
              {employees.length} nhân viên · {stats.active} đang làm · {stats.intern} thực tập · {stats.inactive} nghỉ việc
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer">
            <Download size={14} /> Xuất Excel
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#C62828] hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer">
            <Plus size={14} /> Thêm nhân viên
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/[0.06] space-y-3">
        {/* Removed local branch filters to avoid conflict with global header */}

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên, ID, email, SĐT..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 focus:ring-1 focus:ring-[#C62828]/10 transition-all" />
          </div>
          <div className="w-[160px]">
            <CustomSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                { value: "active", label: "Đang làm" },
                { value: "intern", label: "Thực tập" },
                { value: "inactive", label: "Nghỉ việc" },
              ]}
            />
          </div>
          <div className="w-[180px]">
            <CustomSelect
              value={filterDept}
              onChange={setFilterDept}
              options={[
                { value: "all", label: "Tất cả phòng ban" },
                ...depts.map(d => ({ value: d, label: d }))
              ]}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
        <div className="overflow-x-auto min-h-[220px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-gray-400 text-xs border-b border-gray-100">
                <th className="px-4 py-3.5 text-left font-semibold w-10">#</th>
                <th className="px-4 py-3.5 text-left font-semibold">Nhân viên</th>
                <th className="px-4 py-3.5 text-left font-semibold">Chi nhánh</th>
                <th className="px-4 py-3.5 text-left font-semibold">Phòng ban · Chức vụ</th>
                <th className="px-4 py-3.5 text-left font-semibold">Hợp đồng</th>
                <th className="px-4 py-3.5 text-left font-semibold">Ngày vào</th>
                <th className="px-4 py-3.5 text-left font-semibold">Trạng thái</th>
                <th className="px-4 py-3.5 sticky right-0 bg-gray-50/80 text-left font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((emp, idx) => {
                const avatar = (emp as any).photos?.[0]
                const branchName = branches.find(b => b.id === (emp as any).branchId)?.name || ""
                const isBottomRow = idx >= filtered.length - 2 && filtered.length >= 2
                return (
                  <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-4 text-xs text-gray-400 font-semibold">{idx + 1}</td>
                    <td className="px-4 py-4 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-black/5 cursor-pointer hover:opacity-85 transition-all duration-200"
                          onClick={() => setViewEmp(emp)}>
                          {avatar
                            ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white text-xs font-bold">{initials(emp.name)}</div>}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700 text-sm whitespace-nowrap hover:text-[#C62828] hover:underline cursor-pointer transition-all duration-200"
                            onClick={() => setViewEmp(emp)}>
                            {emp.name}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">{emp.id} · {emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {branchName && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg font-medium whitespace-nowrap">{branchName}</span>}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-semibold text-gray-700 whitespace-nowrap">{emp.department}</p>
                      <p className="text-[11px] text-gray-400">{emp.position}</p>
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">{emp.contractType}</td>
                    <td className="px-4 py-4 text-gray-400 text-xs font-mono whitespace-nowrap">{emp.joinDate}</td>
                    <td className="px-4 py-4"><Badge status={emp.status} /></td>
                    <td className="px-4 py-4 sticky right-0 bg-white z-10">
                      <div className="relative">
                        <button onClick={(e) => {
                          e.stopPropagation()
                          if (openMenu === emp.id) {
                            setOpenMenu(null)
                            setMenuPos(null)
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const dropdownHeight = 120
                            const spaceBelow = window.innerHeight - rect.bottom
                            const showUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight

                            setMenuPos({
                              top: showUp ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
                              left: rect.right - 176
                            })
                            setOpenMenu(emp.id)
                          }
                        }}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Không tìm thấy nhân viên</p>
            <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}
      </div>

      {showModal && (
        <EmployeeModal
          editEmp={editEmp}
          employees={employees}
          orgNodes={orgNodes}
          onClose={() => { setShowModal(false); setEditEmp(null) }}
          onSave={handleSave}
        />
      )}

      {historyConfirm && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
          <div className="bg-[#F5F1EF] rounded-3xl w-full max-w-md shadow-2xl p-6 border border-black/5 animate-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3 text-[#C62828] mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <ClipboardList size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Ghi nhận lịch sử công tác?</h4>
                <p className="text-[11px] text-gray-400">Hệ thống phát hiện thông tin thay đổi</p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 space-y-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Loại thay đổi</p>
              {historyConfirm.detectedType === "transfer" || historyConfirm.detectedType === "promotion" ? (
                <div className="flex gap-6 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="radio"
                      name="detectedType"
                      value="transfer"
                      checked={historyConfirm.detectedType === "transfer"}
                      onChange={() => setHistoryConfirm(prev => prev ? { ...prev, detectedType: "transfer" } : null)}
                      className="text-[#C62828] focus:ring-[#C62828]"
                    />
                    Thuyên chuyển
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="radio"
                      name="detectedType"
                      value="promotion"
                      checked={historyConfirm.detectedType === "promotion"}
                      onChange={() => setHistoryConfirm(prev => prev ? { ...prev, detectedType: "promotion" } : null)}
                      className="text-[#C62828] focus:ring-[#C62828]"
                    />
                    Thăng chức
                  </label>
                </div>
              ) : (
                <p className="text-sm text-gray-800 font-extrabold">
                  {historyConfirm.detectedType === "resign" && "Nghỉ việc"}
                  {historyConfirm.detectedType === "rehire" && "Tái tuyển dụng"}
                </p>
              )}
            </div>

            <div className="space-y-1.5 mb-5">
              <label className="block text-xs font-semibold text-gray-500">Nội dung ghi chú trong lịch sử</label>
              <input
                type="text"
                value={historyConfirm.customNote}
                onChange={e => setHistoryConfirm(prev => prev ? { ...prev, customNote: e.target.value } : null)}
                placeholder="Nhập ghi chú thêm..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 bg-white text-gray-800"
              />
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleConfirmHistory(true)}
                className="w-full py-2.5 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#C62828]/10"
              >
                Đồng ý & ghi nhận lịch sử
              </button>
              <button
                onClick={() => handleConfirmHistory(false)}
                className="w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all"
              >
                Chỉ lưu thông tin (không ghi lịch sử)
              </button>
              <button
                onClick={() => setHistoryConfirm(null)}
                className="w-full py-2.5 hover:bg-gray-100 text-gray-400 rounded-xl text-xs font-bold transition-all mt-1"
              >
                Quay lại chỉnh sửa
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {viewEmp && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setViewEmp(null) }}>
          <div className="relative w-full max-w-5xl">
            <UserProfile emp={viewEmp} onEdit={() => { setViewEmp(null); openEdit(viewEmp) }} onClose={() => setViewEmp(null)} />
          </div>
        </div>,
        document.body
      )}

      {openMenu && menuPos && createPortal(
        <div className="fixed inset-0 z-50 pointer-events-auto" onClick={() => { setOpenMenu(null); setMenuPos(null) }}>
          <div
            style={{ top: menuPos.top, left: menuPos.left }}
            className="fixed w-44 bg-white rounded-xl shadow-xl border border-black/5 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100"
            onClick={e => e.stopPropagation()}
          >
            {(() => {
              const emp = filtered.find(e => e.id === openMenu)
              if (!emp) return null
              const updateReq = profileUpdates.find(p => p.employeeId === emp.id && ["sent", "pending_approval", "rework_requested"].includes(p.status))
              return (
                <>
                  <button onClick={() => { setViewEmp(emp); setOpenMenu(null); setMenuPos(null) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition-colors text-left">
                    <Eye size={15} className="text-gray-400" /> Xem hồ sơ
                  </button>
                  <button onClick={() => { openEdit(emp); setOpenMenu(null); setMenuPos(null) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition-colors text-left">
                    <Edit2 size={15} className="text-gray-400" /> Sửa hồ sơ
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  
                  {/* Profile Update Action */}
                  {!updateReq && (
                    <button onClick={() => { handleRequestUpdate(emp.id); setOpenMenu(null); setMenuPos(null) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-sm text-blue-600 transition-colors text-left">
                      <ClipboardList size={15} className="text-blue-400" /> Yêu cầu cập nhật
                    </button>
                  )}
                  {(updateReq?.status === "sent" || updateReq?.status === "rework_requested") && (
                    <button disabled
                      className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-50 text-sm text-gray-400 transition-colors text-left cursor-not-allowed">
                      <ClipboardList size={15} /> Đã gửi yêu cầu
                    </button>
                  )}
                  {updateReq?.status === "pending_approval" && (
                    <button onClick={() => { setPreviewReq(updateReq); setOpenMenu(null); setMenuPos(null) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 text-sm text-orange-600 font-bold transition-colors text-left">
                      <ClipboardList size={15} className="text-orange-400" /> Chờ duyệt hồ sơ
                    </button>
                  )}
                  <div className="h-px bg-gray-100 my-1" />

                  <button onClick={() => { handleDelete(emp.id); setOpenMenu(null); setMenuPos(null) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-sm text-red-600 font-medium transition-colors text-left">
                    <Trash2 size={15} className="text-red-400" /> Xóa
                  </button>
                </>
              )
            })()}
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal
        isOpen={deleteEmpId !== null}
        onClose={() => setDeleteEmpId(null)}
        onConfirm={confirmDelete}
        title="Xóa nhân viên"
        message="Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống? Hành động này không thể hoàn tác."
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        type="danger"
      />

      {/* Preview Modal for Profile Update */}
      {previewReq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <ClipboardList className="text-orange-500" size={20} />
                Duyệt hồ sơ cập nhật
              </h3>
              <button onClick={() => setPreviewReq(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider">Thông tin hiện tại</h4>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm opacity-70">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                      {JSON.stringify(employees.find(e => e.id === previewReq.employeeId) || {}, null, 2)}
                    </pre>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-orange-600 mb-4 text-sm uppercase tracking-wider">Thông tin cập nhật</h4>
                  <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                      {JSON.stringify(previewReq.pendingData, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
              <button onClick={() => handleRejectUpdate(previewReq.id, prompt("Nhập lý do cần sửa lại:") || "Cần sửa lại")}
                className="px-6 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl text-sm transition-colors">
                Yêu cầu sửa lại
              </button>
              <button onClick={() => handleApproveUpdate(previewReq.id)}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity shadow-sm">
                Duyệt & Lưu hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
