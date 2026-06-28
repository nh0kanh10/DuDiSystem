import { useState, useEffect } from "react"
import { X, Search, Calendar, RefreshCw, Clock, ArrowRight, UserPlus } from "lucide-react"
import { Employee, OrgNode } from "../../types"

interface AssignMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (
    employeeId: string,
    type: "permanent" | "temporary",
    tempDates?: { startDate: string; endDate: string }
  ) => void
  employees: Employee[]
  orgNodes: OrgNode[]
  currentNode: OrgNode
}

export default function AssignMemberModal({
  isOpen,
  onClose,
  onAssign,
  employees,
  orgNodes,
  currentNode
}: AssignMemberModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEmpId, setSelectedEmpId] = useState("")
  const [assignType, setAssignType] = useState<"permanent" | "temporary">("permanent")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("")
      setSelectedEmpId("")
      setAssignType("permanent")
      setStartDate("")
      setEndDate("")
      setErrorMsg("")
    }
  }, [isOpen])

  if (!isOpen) return null

  const selectedEmployee = employees.find(e => e.id === selectedEmpId)
  
  const getEmployeeCurrentNode = (emp: Employee) => {
    return orgNodes.find(n => n.id === emp.orgNodeId) || null
  }

  const isAlreadyInCurrentNode = selectedEmployee && selectedEmployee.orgNodeId === currentNode.id

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmpId) {
      setErrorMsg("Vui lòng chọn nhân viên muốn gán")
      return
    }

    if (assignType === "temporary") {
      if (!startDate || !endDate) {
        setErrorMsg("Vui lòng nhập đầy đủ ngày bắt đầu và kết thúc biệt phái")
        return
      }
      if (new Date(startDate) > new Date(endDate)) {
        setErrorMsg("Ngày bắt đầu không được lớn hơn ngày kết thúc biệt phái")
        return
      }
    }

    onAssign(
      selectedEmpId,
      assignType,
      assignType === "temporary" ? { startDate, endDate } : undefined
    )
    onClose()
  }

  const currentOrgNode = selectedEmployee ? getEmployeeCurrentNode(selectedEmployee) : null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-black/[0.05] flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#C62828]">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Gán nhân sự vào đơn vị</h3>
              <p className="text-xs text-gray-400 mt-0.5">Gán nhân viên vào &quot;{currentNode.name}&quot;</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-semibold border border-red-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Chọn nhân viên
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setErrorMsg("")
                }}
                placeholder="Tìm theo tên, mã NV, email..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 focus:ring-2 focus:ring-[#C62828]/10 transition-all text-gray-800 bg-white"
              />
            </div>

            <div className="border border-gray-100 rounded-2xl max-h-40 overflow-y-auto divide-y divide-gray-50 mt-2 bg-gray-50/50">
              {filteredEmployees.map(emp => {
                const isSelected = selectedEmpId === emp.id
                const currentUnit = getEmployeeCurrentNode(emp)
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      setSelectedEmpId(emp.id)
                      setErrorMsg("")
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors text-sm ${
                      isSelected ? "bg-[#C62828]/5 border-l-4 border-l-[#C62828]" : "hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-gray-800 flex items-center gap-2">
                        {emp.name}
                        <span className="text-xs font-mono text-gray-400 font-normal">({emp.id})</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{emp.email} &middot; {emp.position}</p>
                    </div>
                    {currentUnit && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                        {currentUnit.name}
                      </span>
                    )}
                  </button>
                )
              })}
              {filteredEmployees.length === 0 && (
                <p className="p-4 text-center text-xs text-gray-400">Không tìm thấy nhân sự phù hợp</p>
              )}
            </div>
          </div>

          {selectedEmployee && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              {isAlreadyInCurrentNode ? (
                <div className="bg-amber-50 text-amber-800 p-4 rounded-2xl text-xs border border-amber-100">
                  <span className="font-bold">Lưu ý:</span> Nhân sự này đã thuộc đơn vị này chính thức.
                </div>
              ) : currentOrgNode ? (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
                  <p className="text-xs text-blue-800 font-semibold">
                    Nhân viên đang thuộc đơn vị chính thức: &quot;{currentOrgNode.name}&quot;
                  </p>
                  <p className="text-xs text-blue-600 leading-relaxed">
                    Bạn có thể chọn chuyển hẳn công tác sang đơn vị mới hoặc biệt phái tạm thời có thời hạn.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setAssignType("permanent")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        assignType === "permanent"
                          ? "bg-white border-[#C62828] text-gray-800 shadow-sm"
                          : "border-gray-200 text-gray-400 hover:bg-white/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-xs font-bold text-gray-700">
                        <RefreshCw size={14} className={assignType === "permanent" ? "text-[#C62828]" : "text-gray-400"} />
                        Chuyển hẳn
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">
                        Cập nhật đơn vị chính thức thành đơn vị mới.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAssignType("temporary")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        assignType === "temporary"
                          ? "bg-white border-[#C62828] text-gray-800 shadow-sm"
                          : "border-gray-200 text-gray-400 hover:bg-white/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-xs font-bold text-gray-700">
                        <Clock size={14} className={assignType === "temporary" ? "text-[#C62828]" : "text-gray-400"} />
                        Biệt phái tạm thời
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">
                        Giữ nguyên đơn vị gốc, biệt phái trong một khoảng thời gian.
                      </p>
                    </button>
                  </div>
                </div>
              ) : null}

              {assignType === "temporary" && (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <Calendar size={14} className="text-gray-400" />
                    Thiết lập thời gian biệt phái
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase">
                        Ngày bắt đầu
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={e => {
                          setStartDate(e.target.value)
                          setErrorMsg("")
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C62828]/40 bg-white text-gray-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase">
                        Ngày kết thúc
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={e => {
                          setEndDate(e.target.value)
                          setErrorMsg("")
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C62828]/40 bg-white text-gray-800"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors bg-white"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedEmpId || isAlreadyInCurrentNode}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-colors flex items-center gap-1.5 ${
              !selectedEmpId || isAlreadyInCurrentNode
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[#C62828] hover:bg-[#B71C1C] shadow-sm shadow-[#C62828]/10"
            }`}
          >
            Xác nhận gán
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
