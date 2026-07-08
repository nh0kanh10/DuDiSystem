import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { api } from "../../../lib/api"
import { Plus, Search, Edit2, Trash2, X, Check, Users, Briefcase, AlertCircle, CheckCircle2 } from "lucide-react"
import type { OrgNode } from "../../types"
import { CustomSelect } from "../ui/CustomSelect"
import { Input } from "../ui/input"
import { useToast } from "@/app/hooks/useToast"

interface Position {
  id: string
  code: string
  name: string
  description: string
  status: "active" | "inactive"
  level: number
  currentCount?: number
}

const LEVELS = [
  { value: 1, label: "Fresher",  dot: "bg-slate-400",  badge: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: 2, label: "Junior",   dot: "bg-sky-400",    badge: "bg-sky-50 text-sky-700 border-sky-200" },
  { value: 3, label: "Senior",   dot: "bg-violet-500", badge: "bg-violet-50 text-violet-700 border-violet-200" },
  { value: 4, label: "Lead",     dot: "bg-amber-400",  badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: 5, label: "Manager",  dot: "bg-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: 6, label: "Director", dot: "bg-[#C62828]",  badge: "bg-red-50 text-[#C62828] border-red-200" },
]

function LevelBadge({ level }: { level?: number }) {
  const l = LEVELS.find(x => x.value === level)
  if (!l) return null
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${l.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${l.dot} flex-shrink-0`} />
      {l.label}
    </span>
  )
}

const EMPTY_FORM: Omit<Position, "id" | "currentCount"> = {
  code: "", name: "", description: "", status: "active", level: 3,
}

export default function PositionManagement() {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const { showToast } = useToast()

  async function load() {
    try {
      const data = await api.positions.list(statusFilter !== "all" ? { status: statusFilter } : undefined)
      setPositions(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  function openCreate() {
    setEditId(null); setForm({ ...EMPTY_FORM }); setErrors({}); setShowForm(true)
  }

  function openEdit(p: Position) {
    setEditId(p.id)
    setForm({ code: p.code, name: p.name, description: p.description, status: p.status, level: p.level ?? 3 })
    setErrors({}); setShowForm(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.code.trim()) e.code = "Bắt buộc"
    if (!form.name.trim()) e.name = "Bắt buộc"
    return e
  }

  async function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      if (editId) {
        await api.positions.update(editId, form)
        showToast("Đã cập nhật chức danh thành công!", "success")
      } else {
        await api.positions.create(form)
        showToast("Đã thêm mới chức danh thành công!", "success")
      }
      setShowForm(false); await load()
    } catch (err: any) { setErrors({ _: err.message }) }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    try {
      await api.positions.delete(id)
      setDeleteConfirm(null)
      await load()
      showToast("Đã xóa chức danh thành công!", "success")
    } catch (err: any) {
      showToast(err.message || "Xóa chức danh thất bại", "error")
    }
  }

  async function toggleStatus(p: Position) {
    try {
      await api.positions.update(p.id, { status: p.status === "active" ? "inactive" : "active" })
      await load()
      showToast("Đã cập nhật trạng thái thành công!", "success")
    } catch (err: any) {
      showToast(err.message || "Cập nhật trạng thái thất bại", "error")
    }
  }

  const filtered = positions.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
  })

  const activeCount = positions.filter(p => p.status === "active").length
  const totalCount = positions.reduce((s, p) => s + (p.currentCount ?? 0), 0)

  const F = (label: string, node: React.ReactNode, required?: boolean) => (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {node}
    </div>
  )

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Danh mục</p>
          <h2 className="text-lg font-black text-gray-800">Danh mục Chức danh</h2>
          <p className="text-xs text-gray-400 mt-0.5">{activeCount} vị trí đang dùng · {totalCount} nhân viên được gán</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 bg-[#C62828] hover:bg-[#B71C1C] text-white px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm transition">
          <Plus className="w-4 h-4" /> Thêm chức danh
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên, mã, phòng ban..."
            className="w-full pl-8 pr-3 py-1.5 border rounded-xl text-sm focus:ring-2 focus:ring-red-200 outline-none" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[["all", "Tất cả"], ["active", "Đang dùng"], ["inactive", "Tạm dừng"]].map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${statusFilter === v ? "bg-white text-[#C62828] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Briefcase className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">Không có chức danh nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide w-28">Mã</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Tên vị trí</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">Cấp bậc</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide w-16">NV</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide w-28">Trạng thái</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-red-50 text-[#C62828] px-2 py-0.5 rounded font-bold">{p.code}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-800">{p.name}</p>
                    {p.description && <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{p.description}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell"><LevelBadge level={p.level} /></td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-gray-600 text-sm font-bold">
                      <Users className="w-3.5 h-3.5 text-gray-400" />{p.currentCount ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleStatus(p)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition
                        ${p.status === "active" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                      {p.status === "active" ? "Đang dùng" : "Tạm dừng"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-[#C62828] hover:bg-red-50 rounded-lg transition">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="font-bold text-gray-800">{editId ? "Sửa chức danh" : "Thêm chức danh mới"}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Danh mục chức danh toàn công ty</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {errors._ && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{errors._}</p>}
              <div className="grid grid-cols-2 gap-4">
                {F("Mã vị trí", (
                  <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="VD: DEV, PM, HR-MGR"
                    className={`font-mono ${errors.code ? "border-red-400" : ""}`} />
                ), true)}
                {F("Trạng thái", (
                  <CustomSelect
                    value={form.status}
                    onChange={v => setForm(f => ({ ...f, status: v as any }))}
                    options={[{ value: "active", label: "Đang dùng" }, { value: "inactive", label: "Tạm dừng" }]}
                  />
                ))}
              </div>
              {F("Tên vị trí", (
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Lead Developer"
                  className={errors.name ? "border-red-400" : ""} />
              ), true)}
              <div className="grid grid-cols-2 gap-4">
                {F("Cấp bậc", (
                  <CustomSelect
                    value={String(form.level)}
                    onChange={v => setForm(f => ({ ...f, level: Number(v) }))}
                    options={LEVELS.map(l => ({ value: String(l.value), label: `${l.value} — ${l.label}` }))}
                  />
                ))}
              </div>
              {F("Mô tả", (
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Mô tả ngắn về vị trí này..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-red-200 outline-none resize-none" />
              ))}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">Hủy</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 bg-[#C62828] hover:bg-[#B71C1C] text-white px-4 py-2 rounded-xl text-sm font-bold transition disabled:opacity-50 shadow-sm">
                <Check className="w-4 h-4" />{saving ? "Đang lưu..." : editId ? "Cập nhật" : "Tạo vị trí"}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {deleteConfirm && createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Xóa vị trí?</h3>
            <p className="text-sm text-gray-500 mb-1">
              Vị trí "<strong>{positions.find(p => p.id === deleteConfirm)?.name}</strong>" sẽ bị xóa vĩnh viễn.
            </p>
            {(positions.find(p => p.id === deleteConfirm)?.currentCount ?? 0) > 0 && (
              <p className="text-xs text-amber-600 font-bold mb-4">
                ⚠ Có {positions.find(p => p.id === deleteConfirm)?.currentCount} nhân viên đang dùng vị trí này.
              </p>
            )}
            <div className="flex gap-3 justify-center mt-5">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm border rounded-xl text-gray-600 hover:bg-gray-50">Hủy</button>
              <button onClick={() => handleDelete(deleteConfirm!)}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition">Xóa</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}
