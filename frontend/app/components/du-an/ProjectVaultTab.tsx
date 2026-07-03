import React, { useState } from "react"
import { Plus, Lock, FileText, Globe, Server, Shield, Folder, Eye, EyeOff, Edit, Trash2 } from "lucide-react"
import { ProjectVaultItem } from "../../types"
import { Modal, ModalCancelButton, ModalSubmitButton } from "../ui/Modal"
import ConfirmModal from "../ui/ConfirmModal"

const VAULT_CATEGORY_CONFIG: Record<ProjectVaultItem["category"], { label: string; icon: React.ElementType; color: string }> = {
  contract: { label: "Hợp đồng", icon: FileText, color: "text-blue-600 bg-blue-50 border-blue-200" },
  hosting: { label: "Hosting", icon: Server, color: "text-purple-600 bg-purple-50 border-purple-200" },
  domain: { label: "Domain", icon: Globe, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  credentials: { label: "Tài khoản", icon: Shield, color: "text-amber-600 bg-amber-50 border-amber-200" },
  assets: { label: "Tài nguyên", icon: Folder, color: "text-pink-600 bg-pink-50 border-pink-200" },
  other: { label: "Khác", icon: FileText, color: "text-gray-600 bg-gray-50 border-gray-200" },
}

const EMPTY_VAULT_FORM = {
  category: "other" as ProjectVaultItem["category"],
  name: "",
  value: "",
  url: "",
  description: "",
}

export function ProjectVaultTab({ vaultItems, onAddItem, onEditItem, onDeleteItem }: { vaultItems?: ProjectVaultItem[]; onAddItem?: (item: any) => void; onEditItem?: (id: string, item: any) => void; onDeleteItem?: (id: string) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<ProjectVaultItem | null>(null)
  const [form, setForm] = useState({ ...EMPTY_VAULT_FORM })
  const [showValue, setShowValue] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const itemsByCategory = (vaultItems || []).reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<ProjectVaultItem["category"], ProjectVaultItem[]>)

  function openAdd() {
    setEditTarget(null)
    setForm({ ...EMPTY_VAULT_FORM })
    setShowForm(true)
  }

  function openEdit(item: ProjectVaultItem) {
    setEditTarget(item)
    setForm({
      category: item.category,
      name: item.name,
      value: item.value || "",
      url: item.url || "",
      description: item.description || "",
    })
    setShowForm(true)
  }

  function handleSave() {
    if (!form.name.trim()) return
    if (editTarget && onEditItem) onEditItem(editTarget.id, form)
    else if (onAddItem) onAddItem({ ...form, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Lock size={16} className="text-[#C62828]" /> Vault - Kho tài liệu & thông tin bí mật
        </h3>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C62828] text-white text-xs font-bold rounded-lg hover:bg-[#B71C1C] transition">
          <Plus size={14} /> Thêm mục
        </button>
      </div>

      {!vaultItems || vaultItems.length === 0 ? (
        <div className="text-center py-12">
          <Lock size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">Vault trống. Thêm các thông tin quan trọng (hợp đồng, hosting, tài khoản) vào đây!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(VAULT_CATEGORY_CONFIG).map(([cat, cfg]) => {
            const items = itemsByCategory[cat as ProjectVaultItem["category"]]
            if (!items || items.length === 0) return null
            const Icon = cfg.icon
            return (
              <div key={cat} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${cfg.color}`}>
                    <Icon size={14} />
                  </div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{cfg.label}</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map(item => (
                    <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 group">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h5 className="text-sm font-bold text-gray-800">{item.name}</h5>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                            <Edit size={12} />
                          </button>
                          <button onClick={() => setDeleteTarget(item.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      {item.description && <p className="text-xs text-gray-500 mb-2">{item.description}</p>}
                      {item.value && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-400 font-semibold">Giá trị:</span>
                          <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                            {showValue ? item.value : "••••••••"}
                          </span>
                          <button onClick={() => setShowValue(!showValue)} className="p-1 text-gray-400 hover:text-gray-600">
                            {showValue ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        </div>
                      )}
                      {item.url && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-semibold">URL:</span>
                          <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-[#C62828] hover:underline truncate">{item.url}</a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editTarget ? "Sửa mục Vault" : "Thêm mục Vault"}
        icon={Folder}
        width="md"
        footer={
          <div className="flex gap-3">
            <ModalCancelButton onClick={() => setShowForm(false)} />
            <ModalSubmitButton onClick={handleSave} label={editTarget ? "Cập nhật" : "Thêm"} />
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Danh mục</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as ProjectVaultItem["category"] }))}
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
            >
              {Object.entries(VAULT_CATEGORY_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Tên *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
              placeholder="Ví dụ: Thông tin hosting"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Giá trị (mật khẩu, API key...)</label>
            <input
              type="text"
              value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">URL (nếu có)</label>
            <input
              type="text"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Mô tả</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 resize-none"
            />
          </div>
        </div>
      </Modal>

      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { onDeleteItem && onDeleteItem(deleteTarget); setDeleteTarget(null) }}
          title="Xóa mục?"
          message="Bạn chắc chắn muốn xóa mục này khỏi Vault?"
          confirmText="Xóa"
          type="danger"
        />
      )}
    </div>
  )
}
