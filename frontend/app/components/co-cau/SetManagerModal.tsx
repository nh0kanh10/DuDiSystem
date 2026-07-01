import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Award, ShieldAlert } from "lucide-react"
import { Employee, OrgNode } from "../../types"
import { CustomSelect } from "../ui/CustomSelect"

interface SetManagerModalProps {
  isOpen: boolean
  onClose: () => void
  employees: Employee[]
  currentNode: OrgNode
  currentManagerId?: string
  currentManagerTitle?: string
  onSave: (employeeId: string, title: string) => void
}

export default function SetManagerModal({
  isOpen,
  onClose,
  employees,
  currentNode,
  currentManagerId = "",
  currentManagerTitle = "",
  onSave
}: SetManagerModalProps) {
  const [empId, setEmpId] = useState(currentManagerId)
  const [title, setTitle] = useState(currentManagerTitle)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      setEmpId(currentManagerId)
      setTitle(currentManagerTitle)
      setError("")
    }
  }, [isOpen, currentManagerId, currentManagerTitle])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!empId) {
      setError("Vui lòng chọn nhân viên để bổ nhiệm")
      return
    }
    if (!title.trim()) {
      setError("Vui lòng nhập chức danh quản lý (ví dụ: Trưởng phòng, Trưởng nhóm...)")
      return
    }
    onSave(empId, title)
    onClose()
  }

  const empOptions = employees.map(emp => ({
    value: emp.id,
    label: `${emp.name} (${emp.id}) - ${emp.position}`
  }))

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-black/[0.05] flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#C62828]">
              <Award size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Thiết lập người quản lý</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Bổ nhiệm quản lý cho đơn vị &quot;{currentNode.name}&quot;</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs font-semibold border border-red-100 flex items-center gap-2">
              <ShieldAlert size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Chọn nhân sự quản lý</label>
            <CustomSelect
              value={empId}
              onChange={setEmpId}
              options={empOptions}
              placeholder="Chọn nhân viên bổ nhiệm..."
              searchable={true}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Chức danh quản lý</label>
            <input
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); setError("") }}
              placeholder="Ví dụ: Trưởng phòng, Trưởng bộ phận, Tổ trưởng..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 bg-white text-gray-800"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors bg-white"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Xác nhận bổ nhiệm
            </button>
          </div>
        </form>
      </div>
    </div>
  , document.body)
}
