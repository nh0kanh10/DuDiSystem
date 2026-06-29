import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Building2, Clipboard, Settings, Briefcase } from "lucide-react"
import { OrgNode, OrgNodeType, Employee } from "../../types"

interface AddUnitModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (node: Omit<OrgNode, "id"> & { id?: string }) => void
  employees: Employee[]
  orgNodes: OrgNode[]
  editNode?: OrgNode | null
  parentId?: string
}

export default function AddUnitModal({
  isOpen,
  onClose,
  onSave,
  employees,
  orgNodes,
  editNode,
  parentId
}: AddUnitModalProps) {
  const [step, setStep] = useState(1)
  const [type, setType] = useState<OrgNodeType>("branch")
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [selectedParentId, setSelectedParentId] = useState("")
  const [managerId, setManagerId] = useState("")
  const [managerTitle, setManagerTitle] = useState("")
  const [memberCount, setMemberCount] = useState(0)
  const [createdDate, setCreatedDate] = useState("")
  const [status, setStatus] = useState<"active" | "inactive">("active")

  useEffect(() => {
    if (editNode) {
      setType(editNode.type)
      setName(editNode.name)
      setCode(editNode.code ?? "")
      setSelectedParentId(editNode.parentId || "")
      setManagerId(editNode.managerId || "")
      setManagerTitle(editNode.managerTitle || "")
      setMemberCount(editNode.memberCount ?? 0)
      setCreatedDate(editNode.createdDate ?? "")
      setStatus(editNode.status as "active" | "inactive")
      setStep(2)
    } else if (parentId) {
      const parentNode = orgNodes.find(n => n.id === parentId)
      if (parentNode) {
        if (parentNode.type === "branch") setType("department")
        else if (parentNode.type === "department") setType("sub-department")
        else if (parentNode.type === "sub-department") setType("position")
      }
      setName("")
      setCode("")
      setSelectedParentId(parentId)
      setManagerId("")
      setManagerTitle("")
      setMemberCount(0)
      const d = new Date()
      setCreatedDate(`${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`)
      setStatus("active")
      setStep(2)
    } else {
      setType("branch")
      setName("")
      setCode("")
      setSelectedParentId(parentId || "")
      setManagerId("")
      setManagerTitle("")
      setMemberCount(0)
      const d = new Date()
      setCreatedDate(`${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`)
      setStatus("active")
      setStep(1)
    }
  }, [editNode, parentId, isOpen, orgNodes])

  if (!isOpen) return null

  const isStartStep = step === 1 || (!!(editNode || parentId) && step === 2)

  const parentOptions = orgNodes.filter(n => {
    if (type === "branch") return false
    if (type === "department") return n.type === "branch"
    if (type === "sub-department") return n.type === "department"
    if (type === "position") return n.type === "sub-department"
    return false
  })

  const handleNext = () => {
    if (step === 2 && (type === "position")) {
      onSave({
        name,
        code,
        type,
        managerId: undefined,
        managerTitle: "",
        memberCount,
        parentId: selectedParentId || undefined,
        status,
        createdDate
      })
      onClose()
      return
    }

    if (step < 3) {
      setStep(step + 1)
    } else {
      onSave({
        name,
        code,
        type,
        managerId: managerId || undefined,
        managerTitle,
        memberCount,
        parentId: type === "branch" ? undefined : selectedParentId || undefined,
        status,
        createdDate
      })
      onClose()
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-lg">
            {editNode ? "Chỉnh sửa đơn vị" : "Thêm đơn vị"}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="px-8 py-5 border-b border-gray-50 flex justify-between items-center max-w-md mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-[#C62828] text-white" : "bg-gray-100 text-gray-400"}`}>1</span>
            <span className={`text-xs font-semibold ${step >= 1 ? "text-[#C62828]" : "text-gray-400"}`}>Loại đơn vị</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-100 mx-2"></div>
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-[#C62828] text-white" : "bg-gray-100 text-gray-400"}`}>2</span>
            <span className={`text-xs font-semibold ${step >= 2 ? "text-[#C62828]" : "text-gray-400"}`}>Thông tin chung</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-100 mx-2"></div>
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? "bg-[#C62828] text-white" : "bg-gray-100 text-gray-400"}`}>3</span>
            <span className={`text-xs font-semibold ${step >= 3 ? "text-[#C62828]" : "text-gray-400"}`}>Thiết lập quản lý</span>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto min-h-[300px]">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h4 className="font-bold text-gray-800 text-lg">Chọn loại đơn vị</h4>
                <p className="text-sm text-gray-400 mt-1">Vui lòng chọn loại đơn vị bạn muốn tạo</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: "branch", label: "Chi nhánh", desc: "Đơn vị cấp cao nhất đại diện khu vực", color: "border-purple-200 hover:border-purple-500", iconBg: "bg-purple-50", iconCol: "text-purple-600", icon: Building2 },
                  { key: "department", label: "Phòng ban", desc: "Đơn vị trực thuộc chi nhánh", color: "border-orange-200 hover:border-orange-500", iconBg: "bg-orange-50", iconCol: "text-orange-600", icon: Clipboard },
                  { key: "sub-department", label: "Bộ phận", desc: "Đơn vị trực thuộc phòng ban chuyên môn", color: "border-green-200 hover:border-green-500", iconBg: "bg-green-50", iconCol: "text-green-600", icon: Settings },
                  { key: "position", label: "Vị trí", desc: "Vị trí chuyên môn thuộc bộ phận", color: "border-blue-200 hover:border-blue-500", iconBg: "bg-blue-50", iconCol: "text-blue-600", icon: Briefcase },
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setType(opt.key as OrgNodeType)}
                    className={`flex flex-col items-center text-center p-5 rounded-2xl border-2 transition-all gap-3 ${type === opt.key ? "border-[#C62828] bg-red-50/10 shadow-sm" : "border-gray-100 bg-white hover:bg-gray-50"}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${opt.iconBg}`}>
                      <opt.icon className={opt.iconCol} size={22} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{opt.label}</p>
                      <p className="text-xs text-gray-400 mt-1">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tên đơn vị *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="VD: Bộ phận Phát triển phần mềm"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/10 transition-all text-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mã đơn vị *</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="VD: ACC-SUB"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/10 transition-all text-gray-800 font-mono"
                />
              </div>
              {type !== "branch" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cấp cha trực thuộc *</label>
                  <select
                    value={selectedParentId}
                    onChange={e => setSelectedParentId(e.target.value)}
                    disabled={!!editNode || !!parentId}
                    className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] text-gray-800 ${
                      (editNode || parentId) ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""
                    }`}
                  >
                    <option value="">Chọn đơn vị cha</option>
                    {parentOptions.map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Người quản lý</label>
                <select
                  value={managerId}
                  onChange={e => setManagerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] text-gray-800"
                >
                  <option value="">Chọn quản lý phụ trách</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.position})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Chức danh quản lý</label>
                <input
                  type="text"
                  value={managerTitle}
                  onChange={e => setManagerTitle(e.target.value)}
                  placeholder="VD: Trưởng phòng, Team Leader..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/10 transition-all text-gray-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Số lượng nhân sự</label>
                  <input
                    type="number"
                    value={memberCount}
                    onChange={e => setMemberCount(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/10 transition-all text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ngày thành lập</label>
                  <input
                    type="text"
                    value={createdDate}
                    onChange={e => setCreatedDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/10 transition-all text-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Trạng thái hoạt động</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as "active" | "inactive")}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] text-gray-800"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-between bg-gray-50/50">
          <button
            type="button"
            onClick={isStartStep ? onClose : handleBack}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors text-gray-600 bg-white"
          >
            {isStartStep ? "Hủy" : "Quay lại"}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={step === 2 && (!name.trim() || !code.trim() || (type !== "branch" && !selectedParentId))}
            className="px-5 py-2 bg-[#C62828] hover:bg-[#B71C1C] disabled:bg-gray-300 text-white rounded-xl text-sm font-bold transition-colors shadow-sm shadow-[#C62828]/10 flex items-center gap-1.5"
          >
            {(step === 3 || (step === 2 && (type === "position"))) ? (editNode ? "Lưu thay đổi" : "Hoàn tất") : "Tiếp tục"}
          </button>
        </div>
      </div>
    </div>
  , document.body)
}
