import React, { useState, useRef } from "react"
import {
  Plus, FileText, Globe, Server, Shield, Folder,
  Eye, EyeOff, Edit, Trash2, Lock, Users, Building2,
  Receipt, ClipboardList, Handshake, Key, BookOpen, BadgeCheck,
  Link2, File, ExternalLink, ChevronDown, ChevronRight, LayoutList, Download, RefreshCw,
} from "lucide-react"
import { ProjectVaultItem, ProjectAttachment, ProjectVaultAudience, ProjectVaultCategory } from "../../types"
import { Modal, ModalCancelButton, ModalSubmitButton } from "../ui/Modal"
import ConfirmModal from "../ui/ConfirmModal"
import { tabPrimaryBtn, tabDashedAddBtn } from "./ProjectDetailTabShell"
import { VAULT_CATEGORY_FIELDS, vaultMetaToLegacy, type VaultFieldDef } from "./vaultCategoryFields"
import { VaultFileDropzone } from "./VaultFileDropzone"

const CLIENT_CATEGORIES: Record<string, { label: string; icon: React.ElementType; color: string; dot: string }> = {
  quotation:         { label: "Báo giá",            icon: Receipt,       color: "text-emerald-600 bg-emerald-50 border-emerald-200", dot: "bg-emerald-400" },
  requirement:       { label: "Yêu cầu / SRS",      icon: ClipboardList, color: "text-blue-600 bg-blue-50 border-blue-200",          dot: "bg-blue-400" },
  contract:          { label: "Hợp đồng",            icon: Handshake,     color: "text-violet-600 bg-violet-50 border-violet-200",    dot: "bg-violet-400" },
  "client-handover": { label: "Bàn giao khách",     icon: BadgeCheck,    color: "text-amber-600 bg-amber-50 border-amber-200",       dot: "bg-amber-400" },
  "client-account":  { label: "Tài khoản bàn giao", icon: Key,           color: "text-orange-600 bg-orange-50 border-orange-200",    dot: "bg-orange-400" },
  "client-file":     { label: "File gửi khách",     icon: FileText,      color: "text-gray-600 bg-gray-50 border-gray-200",          dot: "bg-gray-400" },
}

const INTERNAL_CATEGORIES: Record<string, { label: string; icon: React.ElementType; color: string; dot: string }> = {
  hosting:             { label: "Hosting / VPS",     icon: Server,    color: "text-purple-600 bg-purple-50 border-purple-200",  dot: "bg-purple-400" },
  domain:              { label: "Domain",             icon: Globe,     color: "text-emerald-600 bg-emerald-50 border-emerald-200", dot: "bg-emerald-400" },
  credentials:         { label: "Tài khoản nội bộ",  icon: Shield,    color: "text-red-600 bg-red-50 border-red-200",           dot: "bg-red-400" },
  "internal-handover": { label: "Bàn giao nội bộ",   icon: Building2, color: "text-blue-600 bg-blue-50 border-blue-200",        dot: "bg-blue-400" },
  "tech-doc":          { label: "Tài liệu kỹ thuật", icon: BookOpen,  color: "text-indigo-600 bg-indigo-50 border-indigo-200",  dot: "bg-indigo-400" },
  license:             { label: "License / Key",      icon: BadgeCheck,color: "text-teal-600 bg-teal-50 border-teal-200",        dot: "bg-teal-400" },
  assets:              { label: "Tài nguyên",         icon: Folder,    color: "text-pink-600 bg-pink-50 border-pink-200",        dot: "bg-pink-400" },
  other:               { label: "Khác",               icon: FileText,  color: "text-gray-600 bg-gray-50 border-gray-200",        dot: "bg-gray-400" },
}

function getCategoryConfig(audience: ProjectVaultAudience) {
  return audience === "client" ? CLIENT_CATEGORIES : INTERNAL_CATEGORIES
}

const EMPTY_FORM = {
  audience: "client" as ProjectVaultAudience,
  category: "quotation" as ProjectVaultCategory,
  name: "",
  value: "",
  url: "",
  description: "",
  meta: {} as Record<string, string>,
  pendingFile: null as File | null,
  existingFile: null as { name: string; size: number } | null,
}

function isVirtualVaultItem(id: string) {
  return id.startsWith("doc-") || id.startsWith("req-")
}

const inputCls =
  "w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"

function CategoryFormFields({
  category,
  meta,
  onChange,
  isInternal,
}: {
  category: ProjectVaultCategory
  meta: Record<string, string>
  onChange: (key: string, val: string) => void
  isInternal: boolean
}) {
  const fields = VAULT_CATEGORY_FIELDS[category] ?? VAULT_CATEGORY_FIELDS.other

  function renderField(field: VaultFieldDef) {
    const val = meta[field.key] ?? ""
    const common = {
      value: val,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        onChange(field.key, e.target.value),
      className: `${inputCls}${field.type === "password" ? " font-mono" : ""}`,
      placeholder: field.placeholder,
    }

    if (field.type === "textarea") {
      return <textarea {...common} rows={2} className={`${inputCls} resize-none`} />
    }
    if (field.type === "select" && field.options) {
      return (
        <select {...common} className={inputCls}>
          <option value="">— Chọn —</option>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )
    }
    if (field.type === "url") {
      return (
        <div className="space-y-1">
          <input type="url" {...common} placeholder={field.placeholder || "https://..."} />
          <p className="text-[10px] text-gray-400">Hoặc đính kèm file ở mục bên dưới</p>
        </div>
      )
    }
    return (
      <input
        type={field.type === "password" ? "password" : field.type === "date" ? "date" : "text"}
        {...common}
      />
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-3">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
        Thông tin {isInternal ? "nội bộ" : "khách hàng"} — {fields.length} trường
      </p>
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">
            {field.label}
            {field.type === "password" && isInternal ? (
              <span className="ml-1 text-[10px] font-semibold text-red-500">(ẩn khi xem)</span>
            ) : null}
          </label>
          {renderField(field)}
        </div>
      ))}
    </div>
  )
}

function AttachmentRow({ a, onRemove }: { a: ProjectAttachment; onRemove?: (id: string) => void }) {
  return (
    <div className="flex items-center gap-3 p-3.5 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm group transition-all">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${a.type === "link" ? "bg-blue-50" : "bg-gray-100"}`}>
        {a.type === "link" ? <Link2 size={16} className="text-blue-500" /> : <FileText size={16} className="text-gray-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-700 truncate">{a.name}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {(a as any).uploadedAt}{(a as any).size ? ` · ${(a as any).size}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {a.type === "link" && (
          <a href={a.url} target="_blank" rel="noreferrer"
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
            <ExternalLink size={13} />
          </a>
        )}
        {onRemove && (
          <button onClick={() => onRemove(String(a.id))}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

function VaultItemCard({
  item, catCfg, isInternal, onEdit, onDelete, onClick, onDownload, onPreview
}: {
  item: ProjectVaultItem
  catCfg: { label: string; icon: React.ElementType; color: string }
  isInternal: boolean
  onEdit: (item: ProjectVaultItem) => void
  onDelete: (id: string) => void
  onClick?: () => void
  onDownload?: (item: ProjectVaultItem) => void
  onPreview?: (item: ProjectVaultItem) => void
}) {
  const [showValue, setShowValue] = useState(false)
  const Icon = catCfg.icon

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 group shadow-xs hover:border-gray-200 hover:shadow-md transition-all cursor-pointer"
         onClick={onClick}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${catCfg.color}`}>
            <Icon size={14} />
          </div>
          <h5 className="text-sm font-bold text-gray-800 truncate">{item.name}</h5>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {onPreview && (
            <button onClick={(e) => { e.stopPropagation(); onPreview(item); }} title="Xem trước"
              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
              <Eye size={12} />
            </button>
          )}
          {onDownload && (
            <button onClick={(e) => { e.stopPropagation(); onDownload(item); }} title="Tải về"
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors">
              <Download size={12} />
            </button>
          )}
          {!isVirtualVaultItem(item.id) && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} title="Sửa"
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <Edit size={12} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} title="Xóa"
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>

      {item.description && (
        <p className="text-xs text-gray-500 mb-2 leading-relaxed">{item.description}</p>
      )}

      {item.meta && Object.keys(item.meta).length > 0 && (
        <div className="space-y-1 mb-2">
          {Object.entries(item.meta).filter(([, v]) => v?.trim()).map(([key, val]) => {
            const field = VAULT_CATEGORY_FIELDS[item.category]?.find((f) => f.key === key)
            const label = field?.label ?? key
            const isSecret = field?.type === "password"
            return (
              <div key={key} className="flex items-start gap-2 text-[11px]">
                <span className="text-gray-400 font-semibold shrink-0 min-w-[88px]">{label}:</span>
                <span className={`text-gray-700 break-all ${isSecret && isInternal ? "font-mono" : ""}`}>
                  {isSecret && isInternal && !showValue ? "••••••••" : val}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {item.fileAttachment && (
        <div className="flex items-center gap-2 mb-2 bg-emerald-50/80 border border-emerald-100 rounded-lg px-2.5 py-1.5">
          <FileText size={12} className="text-emerald-600 shrink-0" />
          <span className="text-[11px] font-semibold text-emerald-800 truncate flex-1">{item.fileAttachment.name}</span>
          <span className="text-[10px] text-emerald-600 shrink-0">
            {(item.fileAttachment.size / 1024).toFixed(0)} KB
          </span>
        </div>
      )}

      {(!item.meta || Object.keys(item.meta).length === 0) && isInternal && item.value && (
        <div className="flex items-center gap-2 mb-2 bg-gray-50 rounded-xl px-3 py-2">
          <span className="text-xs text-gray-400 font-semibold shrink-0">Giá trị:</span>
          <span className="text-xs font-mono text-gray-700 flex-1 truncate">
            {showValue ? item.value : "••••••••••"}
          </span>
          <button onClick={() => setShowValue(v => !v)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            {showValue ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
      )}

      {(!item.meta || Object.keys(item.meta).length === 0) && !isInternal && item.value && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400 font-semibold">Thông tin:</span>
          <span className="text-xs text-gray-700 font-mono bg-gray-50 px-2 py-0.5 rounded-lg">{item.value}</span>
        </div>
      )}

      {item.url && (
        <div className="flex items-center gap-2 mt-1">
          <Link2 size={11} className="text-gray-400 flex-shrink-0" />
          <a href={item.url} target="_blank" rel="noreferrer"
            className="text-xs text-[#C62828] hover:underline truncate">{item.url}</a>
        </div>
      )}
    </div>
  )
}

function DocVaultFormModal({
  open, editTarget, form, setForm, onClose, onSave, saving,
}: {
  open: boolean
  editTarget: ProjectVaultItem | null
  form: typeof EMPTY_FORM
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>
  onClose: () => void
  onSave: () => void
  saving?: boolean
}) {
  const catCfg = getCategoryConfig(form.audience)

  function switchAudience(a: ProjectVaultAudience) {
    const defaultCat = (a === "client" ? "quotation" : "hosting") as ProjectVaultCategory
    setForm(f => ({
      ...f,
      audience: a,
      category: defaultCat,
      meta: {},
      value: "",
      url: "",
      pendingFile: null,
      existingFile: null,
    }))
  }

  function onCategoryChange(category: ProjectVaultCategory) {
    setForm((f) => ({ ...f, category, meta: {}, value: "", url: "", pendingFile: null }))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editTarget ? "Sửa tài liệu" : "Thêm tài liệu / Vault"}
      icon={Folder}
      width="md"
      footer={
        <div className="flex gap-3">
          <ModalCancelButton onClick={onClose} />
          <ModalSubmitButton onClick={onSave} label={editTarget ? "Cập nhật" : "Thêm"} loading={saving} />
        </div>
      }
    >
      <div className="p-6 space-y-4">
        {!editTarget && (
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">Ngăn lưu trữ</label>
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {(["client", "internal"] as const).map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => switchAudience(a)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    form.audience === a
                      ? a === "client"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "bg-white text-[#C62828] shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {a === "client" ? <><Users size={13} /> Khách hàng</> : <><Lock size={13} /> Nội bộ</>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">Danh mục</label>
          <select
            value={form.category}
            onChange={e => onCategoryChange(e.target.value as ProjectVaultCategory)}
            className={inputCls}
          >
            {Object.entries(catCfg).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">Tên hiển thị <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className={inputCls}
            placeholder={
              form.category === "hosting" ? "VD: VPS production DuDi"
                : form.category === "domain" ? "VD: Domain chính example.com"
                : form.category === "contract" ? "VD: Hợp đồng triển khai website"
                : "Tên gợi nhớ trong vault..."
            }
          />
        </div>

        <CategoryFormFields
          category={form.category}
          meta={form.meta}
          isInternal={form.audience === "internal"}
          onChange={(key, val) => setForm((f) => ({ ...f, meta: { ...f.meta, [key]: val } }))}
        />

        <VaultFileDropzone
          file={form.pendingFile}
          existingFile={form.existingFile}
          onFile={(file) => setForm((f) => ({
            ...f,
            pendingFile: file,
            existingFile: file ? null : f.existingFile,
            name: !f.name.trim() && file ? file.name.replace(/\.[^.]+$/, "") : f.name,
          }))}
        />

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">Ghi chú thêm</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            className={`${inputCls} resize-none`}
            placeholder="Ghi chú nội bộ, không hiển thị trong form chính..."
          />
        </div>
      </div>
    </Modal>
  )
}

function AddAttachmentInline({
  onAdd, onCancel,
}: {
  onAdd: (data: { name: string; url: string; type: "file" | "link" }) => void
  onCancel: () => void
}) {
  const [type, setType] = useState<"file" | "link">("link")
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")

  function handleAdd() {
    if (!name.trim() || !url.trim()) return
    onAdd({ name: name.trim(), url: url.trim(), type })
    setName("")
    setUrl("")
  }

  return (
    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4 space-y-3">
      <p className="text-xs font-bold text-gray-500">Thêm file / link đính kèm</p>
      <div className="flex gap-2">
        {(["link", "file"] as const).map(t => (
          <button key={t} type="button" onClick={() => setType(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              type === t ? "bg-[#C62828] text-white" : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}>
            {t === "link" ? <Link2 size={12} /> : <File size={12} />}
            {t === "link" ? "Link" : "File"}
          </button>
        ))}
      </div>
      <input
        value={name} onChange={e => setName(e.target.value)}
        placeholder="Tên tài liệu..."
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
      />
      {type === "link" ? (
        <input
          value={url} onChange={e => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
        />
      ) : (
        <label className="flex items-center gap-2 w-full px-3 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-400 hover:border-[#C62828]/40 hover:text-[#C62828] cursor-pointer transition-colors">
          <File size={14} className="shrink-0" />
          <span className="truncate">{url || "Chọn file từ máy..."}</span>
          <input type="file" className="hidden" onChange={e => {
            const f = e.target.files?.[0]
            if (f) { setUrl(f.name); if (!name) setName(f.name) }
          }} />
        </label>
      )}
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel}
          className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-lg transition-colors">Hủy</button>
        <button onClick={handleAdd}
          className="px-4 py-1.5 text-xs font-bold bg-[#C62828] text-white rounded-lg hover:bg-[#B71C1C] transition-colors">Thêm</button>
      </div>
    </div>
  )
}

type TreeNodeId = `client` | `internal` | `attach` | `cat:${string}`

function TreeSidebar({
  clientGroups,
  internalGroups,
  attachCount,
  activeNode,
  onSelect,
  onAddItem,
}: {
  clientGroups: { catKey: string; catCfg: any; items: ProjectVaultItem[] }[]
  internalGroups: { catKey: string; catCfg: any; items: ProjectVaultItem[] }[]
  attachCount: number
  activeNode: TreeNodeId
  onSelect: (id: TreeNodeId) => void
  onAddItem: (audience: ProjectVaultAudience) => void
}) {
  const [clientOpen, setClientOpen] = useState(true)
  const [internalOpen, setInternalOpen] = useState(true)

  const clientTotal = clientGroups.reduce((s, g) => s + g.items.length, 0) + attachCount
  const internalTotal = internalGroups.reduce((s, g) => s + g.items.length, 0)

  function SectionHeader({
    id, label, icon: Icon, count, open, onToggle, color, addLabel, onAdd,
  }: {
    id: TreeNodeId; label: string; icon: React.ElementType; count: number
    open: boolean; onToggle: () => void; color: string; addLabel: string
    onAdd: () => void
  }) {
    const isActive = activeNode === id
    return (
      <div className={`group rounded-xl transition-colors ${isActive ? "bg-white shadow-sm" : "hover:bg-white/60"}`}>
        <div className="flex items-center gap-2 px-2 py-2">
          <button onClick={onToggle} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            {open
              ? <ChevronDown size={13} />
              : <ChevronRight size={13} />
            }
          </button>
          <button onClick={() => onSelect(id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={12} />
            </div>
            <span className={`text-xs font-bold truncate ${isActive ? "text-gray-800" : "text-gray-600"}`}>{label}</span>
            {count > 0 && (
              <span className="ml-auto text-[10px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                {count}
              </span>
            )}
          </button>
          <button
            onClick={onAdd}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-all flex-shrink-0"
            title={addLabel}
          >
            <Plus size={11} />
          </button>
        </div>
      </div>
    )
  }

  function CatLeaf({ catKey, catCfg, count }: { catKey: string; catCfg: any; count: number }) {
    const id = `cat:${catKey}` as TreeNodeId
    const isActive = activeNode === id
    const Icon = catCfg.icon
    return (
      <button
        onClick={() => onSelect(id)}
        className={`w-full flex items-center gap-2 pl-8 pr-2 py-1.5 rounded-lg text-left transition-colors ${
          isActive ? "bg-white shadow-sm" : "hover:bg-white/60"
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${catCfg.dot}`} />
        <span className={`text-xs truncate flex-1 ${isActive ? "font-bold text-gray-800" : "font-medium text-gray-500"}`}>
          {catCfg.label}
        </span>
        {count > 0 && (
          <span className="text-[10px] font-black text-gray-400 flex-shrink-0">{count}</span>
        )}
      </button>
    )
  }

  return (
    <div className="w-full flex flex-col gap-1 overflow-x-hidden">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-2 mb-1 mt-1 flex items-center gap-1.5">
        <LayoutList size={11} /> Điều hướng
      </p>

      <SectionHeader
        id="client"
        label="Khách hàng"
        icon={Users}
        count={clientTotal}
        open={clientOpen}
        onToggle={() => setClientOpen(o => !o)}
        color="text-emerald-600 bg-emerald-50"
        addLabel="Thêm tài liệu khách"
        onAdd={() => onAddItem("client")}
      />

      {clientOpen && (
        <div className="space-y-0.5">
          {clientGroups.map(({ catKey, catCfg, items }) => (
            <CatLeaf key={catKey} catKey={catKey} catCfg={catCfg} count={items.length} />
          ))}
          {attachCount > 0 && (
            <button
              onClick={() => onSelect("attach")}
              className={`w-full flex items-center gap-2 pl-8 pr-2 py-1.5 rounded-lg text-left transition-colors ${
                activeNode === "attach" ? "bg-white shadow-sm" : "hover:bg-white/60"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-gray-400" />
              <span className={`text-xs truncate flex-1 ${activeNode === "attach" ? "font-bold text-gray-800" : "font-medium text-gray-500"}`}>
                File đính kèm
              </span>
              <span className="text-[10px] font-black text-gray-400 flex-shrink-0">{attachCount}</span>
            </button>
          )}
          {clientGroups.length === 0 && attachCount === 0 && (
            <p className="pl-8 text-[11px] text-gray-300 py-1 italic">Chưa có tài liệu</p>
          )}
        </div>
      )}

      <div className="my-1 border-t border-gray-100" />

      <SectionHeader
        id="internal"
        label="Nội bộ"
        icon={Lock}
        count={internalTotal}
        open={internalOpen}
        onToggle={() => setInternalOpen(o => !o)}
        color="text-[#C62828] bg-[#C62828]/10"
        addLabel="Thêm vào Vault"
        onAdd={() => onAddItem("internal")}
      />

      {internalOpen && (
        <div className="space-y-0.5">
          {internalGroups.map(({ catKey, catCfg, items }) => (
            <CatLeaf key={catKey} catKey={catKey} catCfg={catCfg} count={items.length} />
          ))}
          {internalGroups.length === 0 && (
            <p className="pl-8 text-[11px] text-gray-300 py-1 italic">Vault trống</p>
          )}
        </div>
      )}
    </div>
  )
}

function ContentPane({
  activeNode,
  clientGroups,
  internalGroups,
  legacyAttachments,
  showAddAttach,
  setShowAddAttach,
  onAddAttachment,
  onRemoveAttachment,
  openEdit,
  setDeleteTarget,
  openAdd,
  tabPrimaryBtn,
  tabDashedAddBtn,
  onDownload,
  onPreview,
  expandedParents,
  setExpandedParents,
}: {
  activeNode: TreeNodeId
  clientGroups: { catKey: string; catCfg: any; items: ProjectVaultItem[] }[]
  internalGroups: { catKey: string; catCfg: any; items: ProjectVaultItem[] }[]
  legacyAttachments: ProjectAttachment[]
  showAddAttach: boolean
  setShowAddAttach: (v: boolean) => void
  onAddAttachment?: (data: { name: string; url: string; type: "file" | "link" }) => void
  onRemoveAttachment?: (id: string) => void
  openEdit: (item: ProjectVaultItem) => void
  setDeleteTarget: (id: string) => void
  openAdd: (audience: ProjectVaultAudience) => void
  tabPrimaryBtn: string
  tabDashedAddBtn: string
  onDownload?: (item: ProjectVaultItem) => void
  onPreview?: (item: ProjectVaultItem) => void
  expandedParents: Record<string, boolean>
  setExpandedParents: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}) {
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  React.useEffect(() => {
    const key = activeNode.startsWith("cat:") ? activeNode.slice(4) : activeNode
    const el = sectionRefs.current[activeNode] || sectionRefs.current[key]
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [activeNode])

  function SectionBlock({
    id, catKey, catCfg, items, isInternal,
  }: {
    id: string; catKey: string; catCfg: any; items: ProjectVaultItem[]; isInternal: boolean
  }) {
    const nodeId = `cat:${catKey}` as TreeNodeId
    const isActive = activeNode === nodeId
    const Icon = catCfg.icon

    // Phân loại item cha và con (phụ lục)
    const topLevelItems = items.filter(i => !i.parentId && !i.isAppendix)
    const childItemsByParentId = items.reduce((acc, i) => {
      if (i.parentId) {
        if (!acc[i.parentId]) acc[i.parentId] = []
        acc[i.parentId].push(i)
      } else if (i.isAppendix) {
        if (!acc['orphan']) acc['orphan'] = []
        acc['orphan'].push(i)
      }
      return acc
    }, {} as Record<string, ProjectVaultItem[]>)

    return (
      <div
        ref={el => { sectionRefs.current[nodeId] = el }}
        className={`scroll-mt-4 rounded-2xl transition-all duration-300 ${isActive ? "ring-2 ring-[#C62828]/20 bg-[#C62828]/[0.01]" : ""}`}
      >
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${catCfg.color}`}>
            <Icon size={13} />
          </div>
          <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex-1">{catCfg.label}</h4>
          <span className="text-[10px] font-black text-gray-300">{items.length}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topLevelItems.map(parentItem => {
            const children = childItemsByParentId[parentItem.id] || []
            const isExpanded = !!expandedParents[parentItem.id]
            return (
              <div key={parentItem.id} className={`flex flex-col gap-2 ${children.length > 0 ? "bg-gray-50/50 p-2.5 rounded-2xl border border-dashed border-gray-200" : ""}`}>
                <div className="relative">
                  <VaultItemCard
                    item={parentItem}
                    catCfg={catCfg}
                    isInternal={isInternal}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                    onDownload={onDownload}
                    onPreview={onPreview}
                    onClick={() => {
                      if (children.length > 0) {
                        setExpandedParents(prev => ({ ...prev, [parentItem.id]: !prev[parentItem.id] }))
                      }
                    }}
                  />
                  {children.length > 0 && (
                    <div className="absolute top-4 right-4 text-gray-400 pointer-events-none">
                       {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  )}
                </div>
                {isExpanded && children.map(child => (
                  <div key={child.id} className="ml-8 relative">
                    <div className="absolute -left-5 top-1/2 -mt-[1px] w-4 h-[2px] bg-gray-200 rounded-r-full"></div>
                    <div className="absolute -left-5 top-0 bottom-1/2 w-[2px] bg-gray-200"></div>
                    <VaultItemCard
                      item={child}
                      catCfg={{ ...catCfg, label: "Phụ lục", icon: FileText, color: "text-gray-500 bg-gray-50 border-gray-200" }}
                      isInternal={isInternal}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      onDownload={onDownload}
                      onPreview={onPreview}
                    />
                  </div>
                ))}
              </div>
            )
          })}
          {(childItemsByParentId['orphan'] || []).map(child => (
            <div key={child.id}>
              <VaultItemCard
                item={child}
                catCfg={{ ...catCfg, label: "Phụ lục", icon: FileText }}
                isInternal={isInternal}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onDownload={onDownload}
                onPreview={onPreview}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const showClient = activeNode === "client" || activeNode === "attach" || activeNode.startsWith("cat:")
  const showInternal = activeNode === "internal" || activeNode.startsWith("cat:")

  const clientVisible = activeNode === "client"
    ? clientGroups
    : activeNode.startsWith("cat:")
      ? clientGroups.filter(g => `cat:${g.catKey}` === activeNode)
      : []

  const internalVisible = activeNode === "internal"
    ? internalGroups
    : activeNode.startsWith("cat:")
      ? internalGroups.filter(g => `cat:${g.catKey}` === activeNode)
      : []

  const isClientCat = activeNode === "client" || (activeNode.startsWith("cat:") && CLIENT_CATEGORIES[activeNode.slice(4)])
  const isInternalCat = activeNode === "internal" || (activeNode.startsWith("cat:") && INTERNAL_CATEGORIES[activeNode.slice(4)])
  const isAttach = activeNode === "attach"

  return (
    <div className="flex-1 min-w-0 space-y-6 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {(isClientCat || isInternalCat) && clientVisible.length === 0 && internalVisible.length === 0 && !isAttach && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
            <Folder size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-bold text-gray-400">Chưa có tài liệu</p>
          <p className="text-xs text-gray-300 mt-1 mb-4">Nhấn + để thêm vào mục này</p>
          <button onClick={() => openAdd(isInternalCat ? "internal" : "client")} className={tabPrimaryBtn}>
            <Plus size={14} /> Thêm tài liệu
          </button>
        </div>
      )}

      {isClientCat && clientVisible.length > 0 && (
        <div className="space-y-6">
          {clientVisible.map(({ catKey, catCfg, items }) => (
            <SectionBlock key={catKey} id={catKey} catKey={catKey} catCfg={catCfg} items={items} isInternal={false} />
          ))}
        </div>
      )}

      {isInternalCat && internalVisible.length > 0 && (
        <div className="space-y-6">
          {activeNode === "internal" && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#C62828]/5 border border-[#C62828]/10 rounded-xl">
              <Lock size={13} className="text-[#C62828]" />
              <p className="text-xs text-[#C62828] font-bold">
                Khu vực nội bộ — Thông tin nhạy cảm được ẩn theo mặc định
              </p>
            </div>
          )}
          {internalVisible.map(({ catKey, catCfg, items }) => (
            <SectionBlock key={catKey} id={catKey} catKey={catKey} catCfg={catCfg} items={items} isInternal={true} />
          ))}
        </div>
      )}

      {isAttach && (
        <div
          ref={el => { sectionRefs.current["attach"] = el }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 px-1 mb-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center border text-gray-600 bg-gray-50 border-gray-200">
              <FileText size={13} />
            </div>
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex-1">File đính kèm</h4>
            <span className="text-[10px] font-black text-gray-300">{legacyAttachments.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {legacyAttachments.map(a => (
              <AttachmentRow key={a.id} a={a} onRemove={onRemoveAttachment} />
            ))}
          </div>
          {!showAddAttach && onAddAttachment && (
            <button type="button" onClick={() => setShowAddAttach(true)} className={tabDashedAddBtn}>
              <Plus size={14} /> Đính kèm file / link
            </button>
          )}
          {showAddAttach && (
            <AddAttachmentInline
              onAdd={data => { onAddAttachment?.(data); setShowAddAttach(false) }}
              onCancel={() => setShowAddAttach(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

export function ProjectDocVaultTab({
  vaultItems = [],
  legacyAttachments = [],
  onAddItem,
  onEditItem,
  onDeleteItem,
  onAddAttachment,
  onRemoveAttachment,
  onDownload,
  onPreview,
}: {
  vaultItems?: ProjectVaultItem[]
  legacyAttachments?: ProjectAttachment[]
  onAddItem?: (item: Omit<ProjectVaultItem, "projectId" | "id" | "createdAt" | "updatedAt">, file?: File | null) => void | Promise<void>
  onEditItem?: (id: string, patch: Partial<ProjectVaultItem>, file?: File | null) => void | Promise<void>
  onDeleteItem?: (id: string) => void | Promise<void>
  onAddAttachment?: (data: { name: string; url: string; type: "file" | "link" }) => void
  onRemoveAttachment?: (id: string) => void
  onDownload?: (item: ProjectVaultItem) => void
  onPreview?: (item: ProjectVaultItem) => void
}) {
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({})
  const [activeNode, setActiveNode] = useState<TreeNodeId>("client")
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<ProjectVaultItem | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showAddAttach, setShowAddAttach] = useState(false)
  const [saving, setSaving] = useState(false)

  const clientItems = vaultItems.filter(i => i.audience === "client")
  const internalItems = vaultItems.filter(i => i.audience === "internal")

  function groupByCategory(items: ProjectVaultItem[], catMap: Record<string, any>) {
    return Object.entries(catMap)
      .map(([key, cfg]) => ({ catKey: key, catCfg: cfg, items: items.filter(i => i.category === key) }))
      .filter(g => g.items.length > 0)
  }

  const clientGroups = groupByCategory(clientItems, CLIENT_CATEGORIES)
  const internalGroups = groupByCategory(internalItems, INTERNAL_CATEGORIES)

  const totalDocs = vaultItems.length + legacyAttachments.length

  function openAdd(audience: ProjectVaultAudience) {
    setEditTarget(null)
    setForm({
      ...EMPTY_FORM,
      audience,
      category: (audience === "client" ? "quotation" : "hosting") as ProjectVaultCategory,
    })
    setShowForm(true)
  }

  function openEdit(item: ProjectVaultItem) {
    setEditTarget(item)
    setForm({
      audience: item.audience,
      category: item.category,
      name: item.name,
      value: item.value ?? "",
      url: item.url ?? "",
      description: item.description ?? "",
      meta: item.meta ? { ...item.meta } : {},
      pendingFile: null,
      existingFile: item.fileAttachment?.hasFile
        ? { name: item.fileAttachment.name, size: item.fileAttachment.size }
        : null,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim() || saving) return
    const legacy = vaultMetaToLegacy({ category: form.category, meta: form.meta })
    const payload = {
      audience: form.audience,
      category: form.category,
      name: form.name.trim(),
      meta: { ...form.meta },
      value: legacy.value,
      url: legacy.url,
      description: form.description.trim() || undefined,
    }
    setSaving(true)
    try {
      if (editTarget) {
        await onEditItem?.(editTarget.id, payload, form.pendingFile)
      } else {
        await onAddItem?.(payload, form.pendingFile)
      }
      setShowForm(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lưu tài liệu thất bại")
    } finally {
      setSaving(false)
    }
  }

  function handleSelectNode(id: TreeNodeId) {
    setActiveNode(id)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 flex items-center justify-center">
            <Folder size={17} className="text-gray-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-800">Tài liệu & Vault</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {totalDocs > 0 ? `${totalDocs} tài liệu` : "Quản lý tài liệu & thông tin bảo mật"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openAdd(activeNode === "internal" ? "internal" : "client")}
          className={tabPrimaryBtn}
        >
          <Plus size={14} /> Thêm
        </button>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-56 flex-shrink-0 overflow-y-auto overflow-x-hidden p-3 bg-gray-50/50 border-r border-gray-100" style={{ scrollbarWidth: "thin" }}>
          <TreeSidebar
            clientGroups={clientGroups}
            internalGroups={internalGroups}
            attachCount={legacyAttachments.length}
            activeNode={activeNode}
            onSelect={handleSelectNode}
            onAddItem={openAdd}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: "thin" }}>
          <ContentPane
            activeNode={activeNode}
            clientGroups={clientGroups}
            internalGroups={internalGroups}
            legacyAttachments={legacyAttachments}
            showAddAttach={showAddAttach}
            setShowAddAttach={setShowAddAttach}
            onAddAttachment={onAddAttachment}
            onRemoveAttachment={onRemoveAttachment}
            openEdit={openEdit}
            setDeleteTarget={setDeleteTarget}
            openAdd={(audience) => {
              setForm(prev => ({ ...prev, audience, category: audience === "client" ? "quotation" : "hosting" }))
              setShowForm(true)
            }}
            tabPrimaryBtn={tabPrimaryBtn}
            tabDashedAddBtn={tabDashedAddBtn}
            onDownload={onDownload}
            onPreview={onPreview}
            expandedParents={expandedParents}
            setExpandedParents={setExpandedParents}
          />
        </div>
      </div>

      <DocVaultFormModal
        open={showForm}
        editTarget={editTarget}
        form={form}
        setForm={setForm}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        saving={saving}
      />

      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { onDeleteItem?.(deleteTarget); setDeleteTarget(null) }}
          title="Xóa tài liệu?"
          message="Bạn chắc chắn muốn xóa tài liệu này?"
          confirmText="Xóa"
          type="danger"
        />
      )}
    </div>
  )
}
