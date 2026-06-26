import { useState } from "react"
import { ArrowLeft, Edit2, Plus, MoreVertical, Building2, Clipboard, Users2, Settings, Briefcase, UserPlus, Calendar, Clock } from "lucide-react"
import { OrgNode, OrgNodeType, Employee, Assignment } from "../../App"
import AssignMemberModal from "./AssignMemberModal"

const getDescendantNodeIds = (nodeId: string, nodes: OrgNode[]): string[] => {
  const ids: string[] = [nodeId]
  const queue = [nodeId]
  while (queue.length > 0) {
    const currentId = queue.shift()!
    const children = nodes.filter(n => n.parentId === currentId)
    children.forEach(child => {
      ids.push(child.id)
      queue.push(child.id)
    })
  }
  return ids
}

const isAssignmentActive = (as: Assignment): boolean => {
  if (as.status !== "active") return false
  const now = new Date()
  const start = new Date(as.startDate)
  const end = as.endDate ? new Date(as.endDate) : null
  now.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  if (end) {
    end.setHours(0, 0, 0, 0)
    return now >= start && now <= end
  }
  return now >= start
}

interface OrgDetailViewProps {
  node: OrgNode
  orgNodes: OrgNode[]
  employees: Employee[]
  assignments: Assignment[]
  onBack: () => void
  onEdit: () => void
  onAddChild: () => void
  onStatusChange: (nodeId: string, status: "active" | "inactive") => void
  onDeleteNode: (nodeId: string) => void
  onSelectNode: (nodeId: string) => void
  onAssignMember: (
    employeeId: string,
    type: "permanent" | "temporary",
    tempDates?: { startDate: string; endDate: string }
  ) => void
}

export default function OrgDetailView({
  node,
  orgNodes,
  employees,
  assignments,
  onBack,
  onEdit,
  onAddChild,
  onStatusChange,
  onDeleteNode,
  onSelectNode,
  onAssignMember
}: OrgDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"info" | "children" | "personnel" | "manager">("children")
  const [showMenu, setShowMenu] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)

  const childNodes = orgNodes.filter(n => n.parentId === node.id)
  const manager = employees.find(e => e.id === node.managerId)

  const descendantIds = getDescendantNodeIds(node.id, orgNodes)
  const activeTempAssignments = assignments.filter(isAssignmentActive)

  const officialEmployees = employees.filter(emp => {
    const isUnder = emp.orgNodeId && descendantIds.includes(emp.orgNodeId)
    const isCurrentlyTempOut = activeTempAssignments.some(as => as.employeeId === emp.id && as.type === "temporary")
    return isUnder && !isCurrentlyTempOut
  })

  const tempInEmployees = employees.filter(emp => {
    const activeAs = activeTempAssignments.find(as => as.employeeId === emp.id && as.type === "temporary")
    return activeAs && descendantIds.includes(activeAs.nodeId ?? "")
  })

  const tempOutEmployees = employees.filter(emp => {
    const isUnder = emp.orgNodeId && descendantIds.includes(emp.orgNodeId)
    const isCurrentlyTempOut = activeTempAssignments.some(as => as.employeeId === emp.id && as.type === "temporary" && !descendantIds.includes(as.nodeId ?? ""))
    return isUnder && isCurrentlyTempOut
  })

  const nodeLabel = {
    branch: "Chi nhánh",
    department: "Phòng ban",
    "sub-department": "Bộ phận",
    position: "Vị trí",
    team: "Nhóm"
  }[node.type]

  const childTypeLabel = {
    branch: "Phòng ban trực thuộc",
    department: "Bộ phận trực thuộc",
    "sub-department": "Vị trí trực thuộc",
    position: "Nhóm trực thuộc",
    team: "Thành viên"
  }[node.type]

  const getIcon = (type: OrgNodeType) => {
    switch (type) {
      case "branch": return <Building2 className="text-purple-600" size={20} />
      case "department": return <Clipboard className="text-orange-600" size={20} />
      case "sub-department": return <Settings className="text-green-600" size={20} />
      case "position": return <Briefcase className="text-blue-600" size={20} />
      case "team": return <Users2 className="text-pink-600" size={20} />
    }
  }

  const getBgColor = (type: OrgNodeType) => {
    switch (type) {
      case "branch": return "bg-purple-50 border-purple-200"
      case "department": return "bg-orange-50 border-orange-200"
      case "sub-department": return "bg-green-50 border-green-200"
      case "position": return "bg-blue-50 border-blue-200"
      case "team": return "bg-pink-50 border-pink-200"
    }
  }

  const getInitials = (name: string) => {
    return name.split(" ").pop()?.charAt(0) ?? "?"
  }

  const handleDeactivate = () => {
    onStatusChange(node.id, node.status === "active" ? "inactive" : "active")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium">
          <ArrowLeft size={16} /> Quay lại sơ đồ
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-black/[0.05] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${getBgColor(node.type)}`}>
            {getIcon(node.type)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-800">{node.name}</h2>
              <span className="text-xs text-gray-400 font-mono">[{node.code}]</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {nodeLabel} &middot; {manager ? `${node.managerTitle} - ${manager.name}` : "Chưa có quản lý"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 relative">
          <button onClick={onEdit} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors bg-white">
            <Edit2 size={14} /> Chỉnh sửa
          </button>
          {node.type !== "team" && (
            <button onClick={onAddChild} className="flex items-center gap-1.5 px-4 py-2 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-sm font-bold transition-colors shadow-sm shadow-[#C62828]/10">
              <Plus size={14} /> Thêm đơn vị con
            </button>
          )}
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors text-gray-500">
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 w-44 z-10">
              <button
                onClick={() => {
                  onDeleteNode(node.id)
                  setShowMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Xóa đơn vị này
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 bg-white rounded-3xl border border-black/[0.05] shadow-sm overflow-hidden w-full">
          <div className="px-6 pt-4 flex gap-2 border-b border-gray-100">
            <button
              onClick={() => setActiveTab("children")}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors relative -mb-px ${activeTab === "children" ? "border-[#C62828] text-[#C62828]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              {childTypeLabel}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === "children" ? "bg-[#C62828] text-white" : "bg-gray-100 text-gray-500"}`}>
                {childNodes.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("info")}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors relative -mb-px ${activeTab === "info" ? "border-[#C62828] text-[#C62828]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              Thông tin chung
            </button>
            <button
              onClick={() => setActiveTab("personnel")}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors relative -mb-px ${activeTab === "personnel" ? "border-[#C62828] text-[#C62828]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              Nhân sự
            </button>
            <button
              onClick={() => setActiveTab("manager")}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors relative -mb-px ${activeTab === "manager" ? "border-[#C62828] text-[#C62828]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              Quản lý
            </button>
          </div>

          <div className="p-6">
            {activeTab === "children" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/70 text-gray-400 text-xs border-b border-gray-100">
                      <th className="px-5 py-3 text-left font-semibold">Tên đơn vị</th>
                      <th className="px-5 py-3 text-left font-semibold">Mã đơn vị</th>
                      <th className="px-5 py-3 text-left font-semibold">Người phụ trách</th>
                      <th className="px-5 py-3 text-left font-semibold">Số nhân sự</th>
                      <th className="px-5 py-3 text-left font-semibold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {childNodes.map(child => {
                      const childManager = employees.find(e => e.id === child.managerId)
                      return (
                        <tr
                          key={child.id}
                          className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                          onClick={() => onSelectNode(child.id)}
                        >
                          <td className="px-5 py-3.5 font-semibold text-gray-800">{child.name}</td>
                          <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">{child.code}</td>
                          <td className="px-5 py-3.5 text-gray-600 text-xs">
                            {childManager ? childManager.name : "—"}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-gray-700">{child.memberCount}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${child.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {child.status === "active" ? "Hoạt động" : "Ngừng"}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    {childNodes.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">
                          Không có đơn vị trực thuộc
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "info" && (
              <div className="grid grid-cols-2 gap-6 max-w-lg">
                <div>
                  <p className="text-xs text-gray-400">Tên đơn vị</p>
                  <p className="text-sm font-semibold text-gray-700 mt-1">{node.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Mã đơn vị</p>
                  <p className="text-sm font-semibold text-gray-700 mt-1 font-mono">{node.code}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Cấp phân loại</p>
                  <p className="text-sm font-semibold text-gray-700 mt-1">{nodeLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Ngày thành lập</p>
                  <p className="text-sm font-semibold text-gray-700 mt-1">{node.createdDate || "—"}</p>
                </div>
              </div>
            )}

            {activeTab === "personnel" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-700 text-sm">Danh sách nhân sự trực thuộc</h3>
                  <button
                    onClick={() => setIsAssignOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-[#C62828]/10"
                  >
                    <UserPlus size={13} /> Gán nhân sự
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                    <div className="bg-gray-50/70 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="font-bold text-gray-700 text-xs">Nhân sự chính thức</span>
                      <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {officialEmployees.length}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50/30 text-gray-400 text-[10px] uppercase font-bold border-b border-gray-50">
                            <th className="px-5 py-3 text-left">Mã NV</th>
                            <th className="px-5 py-3 text-left">Họ và tên</th>
                            <th className="px-5 py-3 text-left">Chức vụ</th>
                            <th className="px-5 py-3 text-left">Email</th>
                            <th className="px-5 py-3 text-left">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {officialEmployees.map(emp => (
                            <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-5 py-3.5 font-mono text-gray-400">{emp.id}</td>
                              <td className="px-5 py-3.5 font-semibold text-gray-700">{emp.name}</td>
                              <td className="px-5 py-3.5 text-gray-500">{emp.position}</td>
                              <td className="px-5 py-3.5 text-gray-500">{emp.email}</td>
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${emp.status === "active" ? "bg-green-100 text-green-700" : emp.status === "intern" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>
                                  {emp.status === "active" ? "Đang làm" : emp.status === "intern" ? "Thực tập" : "Nghỉ việc"}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {officialEmployees.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-gray-400">
                                Chưa có nhân sự chính thức tại đơn vị này
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {tempInEmployees.length > 0 && (
                    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                      <div className="bg-orange-50/50 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                        <span className="font-bold text-orange-800 text-xs flex items-center gap-1.5">
                          <Clock size={13} className="text-orange-500" />
                          Nhân sự biệt phái đến
                        </span>
                        <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {tempInEmployees.length}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50/30 text-gray-400 text-[10px] uppercase font-bold border-b border-gray-50">
                              <th className="px-5 py-3 text-left">Mã NV</th>
                              <th className="px-5 py-3 text-left">Họ và tên</th>
                              <th className="px-5 py-3 text-left">Chức vụ</th>
                              <th className="px-5 py-3 text-left">Thời gian biệt phái</th>
                              <th className="px-5 py-3 text-left">Đơn vị gốc</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {tempInEmployees.map(emp => {
                              const activeAs = activeTempAssignments.find(as => as.employeeId === emp.id && as.type === "temporary")
                              const originalNode = orgNodes.find(n => n.id === emp.orgNodeId)
                              return (
                                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-5 py-3.5 font-mono text-gray-400">{emp.id}</td>
                                  <td className="px-5 py-3.5 font-semibold text-gray-700">{emp.name}</td>
                                  <td className="px-5 py-3.5 text-gray-500">{emp.position}</td>
                                  <td className="px-5 py-3.5 text-orange-600 font-medium">
                                    {activeAs ? `${activeAs.startDate} đến ${activeAs.endDate}` : "—"}
                                  </td>
                                  <td className="px-5 py-3.5 text-gray-500 font-medium">
                                    {originalNode ? originalNode.name : "—"}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {tempOutEmployees.length > 0 && (
                    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                      <div className="bg-blue-50/50 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                        <span className="font-bold text-blue-800 text-xs flex items-center gap-1.5">
                          <Calendar size={13} className="text-blue-500" />
                          Nhân sự biệt phái đi nơi khác
                        </span>
                        <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {tempOutEmployees.length}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50/30 text-gray-400 text-[10px] uppercase font-bold border-b border-gray-50">
                              <th className="px-5 py-3 text-left">Mã NV</th>
                              <th className="px-5 py-3 text-left">Họ và tên</th>
                              <th className="px-5 py-3 text-left">Chức vụ</th>
                              <th className="px-5 py-3 text-left">Thời gian biệt phái</th>
                              <th className="px-5 py-3 text-left">Đơn vị tiếp nhận</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {tempOutEmployees.map(emp => {
                              const activeAs = activeTempAssignments.find(as => as.employeeId === emp.id && as.type === "temporary")
                              const destinationNode = activeAs ? orgNodes.find(n => n.id === activeAs.nodeId) : null
                              return (
                                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-5 py-3.5 font-mono text-gray-400">{emp.id}</td>
                                  <td className="px-5 py-3.5 font-semibold text-gray-700">{emp.name}</td>
                                  <td className="px-5 py-3.5 text-gray-500">{emp.position}</td>
                                  <td className="px-5 py-3.5 text-blue-600 font-medium">
                                    {activeAs ? `${activeAs.startDate} đến ${activeAs.endDate}` : "—"}
                                  </td>
                                  <td className="px-5 py-3.5 text-gray-500 font-medium">
                                    {destinationNode ? destinationNode.name : "—"}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "manager" && (
              <div className="flex items-center gap-4">
                {manager ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white font-bold text-xl">
                      {getInitials(manager.name)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">{manager.name}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">{node.managerTitle}</p>
                      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-400">
                        <p>Email: <span className="text-gray-600 font-medium">{manager.email}</span></p>
                        <p>SĐT: <span className="text-gray-600 font-medium">{manager.phone}</span></p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400 py-6">Đơn vị này hiện chưa thiết lập người quản lý</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-80 bg-white rounded-3xl p-6 border border-black/[0.05] shadow-sm space-y-5">
          <h3 className="font-bold text-gray-700 text-sm">Thông tin {nodeLabel.toLowerCase()}</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400">Tên đơn vị</p>
              <p className="text-sm font-semibold text-gray-700 mt-1">{node.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Mã đơn vị</p>
              <p className="text-sm font-semibold text-gray-700 mt-1 font-mono">{node.code}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Quản lý trực thuộc</p>
              <div className="flex items-center gap-2.5 mt-1.5">
                <div className="w-8 h-8 rounded-full bg-[#C62828] flex items-center justify-center text-white text-xs font-bold">
                  {manager ? getInitials(manager.name) : "?"}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">{manager ? manager.name : "Chưa thiết lập"}</p>
                  <p className="text-[10px] text-gray-400">{node.managerTitle || "Quản lý"}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400">Ngày thành lập</p>
              <p className="text-sm font-semibold text-gray-700 mt-1">{node.createdDate || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Trạng thái</p>
              <div className="mt-1.5">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${node.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {node.status === "active" ? "Đang hoạt động" : "Ngừng hoạt động"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleDeactivate}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center border ${node.status === "active" ? "border-red-200 text-red-600 bg-red-50/10 hover:bg-red-50" : "border-green-200 text-green-600 bg-green-50/10 hover:bg-green-50"}`}
            >
              {node.status === "active" ? "Ngừng hoạt động" : "Kích hoạt lại"}
            </button>
          </div>
        </div>
      </div>
      <AssignMemberModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onAssign={onAssignMember}
        employees={employees}
        orgNodes={orgNodes}
        currentNode={node}
      />
    </div>
  )
}
