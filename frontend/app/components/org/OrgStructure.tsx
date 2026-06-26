import { useState } from "react"
import { Download, Plus, Search, Edit2, Trash2, ChevronRight, ChevronDown, Circle } from "lucide-react"
import { OrgNode, OrgNodeType, Employee } from "../../App"
import OrgTreeView from "./OrgTreeView"
import OrgDetailView from "./OrgDetailView"
import AddUnitModal from "./AddUnitModal"
import DeleteConfirmModal from "./DeleteConfirmModal"

import { Assignment } from "../../App"

interface OrgStructureProps {
  employees: Employee[]
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>
  assignments: Assignment[]
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>
  orgNodes: OrgNode[]
  setOrgNodes: React.Dispatch<React.SetStateAction<OrgNode[]>>
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
}

export default function OrgStructure({
  employees,
  setEmployees,
  assignments,
  setAssignments,
  orgNodes,
  setOrgNodes,
  selectedNodeId,
  setSelectedNodeId
}: OrgStructureProps) {
  const [viewMode, setViewMode] = useState<"diagram" | "list">("diagram")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editNode, setEditNode] = useState<OrgNode | null>(null)
  const [modalParentId, setModalParentId] = useState<string | undefined>(undefined)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<OrgNode | null>(null)
  const [expandedListIds, setExpandedListIds] = useState<string[]>(["branch-hcm", "dept-tech"])

  const getDescendants = (nodeId: string, nodes: OrgNode[]): OrgNode[] => {
    const descendants: OrgNode[] = []
    const queue = [nodeId]
    while (queue.length > 0) {
      const currentId = queue.shift()!
      const children = nodes.filter(n => n.parentId === currentId)
      children.forEach(child => {
        descendants.push(child)
        queue.push(child.id)
      })
    }
    return descendants
  }

  const flattenTree = (nodes: OrgNode[], parentId?: string): OrgNode[] => {
    const result: OrgNode[] = []
    const roots = nodes.filter(n => parentId ? n.parentId === parentId : !n.parentId)
    roots.forEach(root => {
      result.push(root)
      const children = flattenTree(nodes, root.id)
      result.push(...children)
    })
    return result
  }

  const isAncestorsExpanded = (node: OrgNode, nodes: OrgNode[], expandedIds: string[]): boolean => {
    let current = node
    while (current.parentId) {
      const parent = nodes.find(n => n.id === current.parentId)
      if (!parent) break
      if (!expandedIds.includes(parent.id)) {
        return false
      }
      current = parent
    }
    return true
  }

  const getNodeLevel = (node: OrgNode, nodes: OrgNode[]): number => {
    let level = 0
    let current = node
    while (current.parentId) {
      const parent = nodes.find(n => n.id === current.parentId)
      if (!parent) break
      level += 1
      current = parent
    }
    return level
  }

  const activeNodes = orgNodes.filter(n => n.status === "active")
  
  const stats = {
    totalEmployees: orgNodes.find(n => !n.parentId)?.memberCount || 150,
    branches: activeNodes.filter(n => n.type === "branch").length,
    departments: activeNodes.filter(n => n.type === "department").length,
    positions: activeNodes.filter(n => n.type === "sub-department" || n.type === "position").length,
    teams: activeNodes.filter(n => n.type === "team").length
  }

  const selectedNode = orgNodes.find(n => n.id === selectedNodeId)

  const handleOpenAdd = () => {
    setEditNode(null)
    setModalParentId(undefined)
    setIsModalOpen(true)
  }

  const handleOpenAddChild = (parentId: string) => {
    setEditNode(null)
    setModalParentId(parentId)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (node: OrgNode) => {
    setEditNode(node)
    setModalParentId(node.parentId)
    setIsModalOpen(true)
  }

  const handleSaveNode = (nodeData: Omit<OrgNode, "id"> & { id?: string }) => {
    if (editNode) {
      setOrgNodes(prev =>
        prev.map(n => (n.id === editNode.id ? { ...n, ...nodeData } : n))
      )
    } else {
      const newId = `node-${Date.now()}`
      setOrgNodes(prev => [...prev, { id: newId, ...nodeData }])
    }
  }

  const handleDeleteNode = (id: string) => {
    const descendants = getDescendants(id, orgNodes)
    const descendantIds = descendants.map(d => d.id)
    const idsToDelete = [id, ...descendantIds]
    setOrgNodes(prev => prev.filter(n => !idsToDelete.includes(n.id)))
    if (selectedNodeId === id || (selectedNodeId && descendantIds.includes(selectedNodeId))) {
      setSelectedNodeId(null)
    }
  }

  const requestDeleteNode = (id: string) => {
    const node = orgNodes.find(n => n.id === id)
    if (node) {
      setNodeToDelete(node)
      setIsDeleteOpen(true)
    }
  }

  const handleStatusChange = (id: string, status: "active" | "inactive") => {
    setOrgNodes(prev =>
      prev.map(n => (n.id === id || n.parentId === id ? { ...n, status } : n))
    )
  }

  const handleAssignMember = (
    employeeId: string,
    type: "permanent" | "temporary",
    tempDates?: { startDate: string; endDate: string }
  ) => {
    const targetNode = orgNodes.find(n => n.id === selectedNodeId)
    if (!targetNode) return

    if (type === "permanent") {
      setEmployees(prev =>
        prev.map(emp => {
          if (emp.id === employeeId) {
            return {
              ...emp,
              orgNodeId: targetNode.id,
              department: targetNode.type === "department" ? targetNode.name : emp.department,
              position: targetNode.type === "position" ? targetNode.name : emp.position
            }
          }
          return emp
        })
      )

      setAssignments(prev => {
        const completedOld = prev.map(as => {
          if (as.employeeId === employeeId && as.status === "active") {
            return {
              ...as,
              status: "completed" as const,
              endDate: new Date().toISOString().split("T")[0]
            }
          }
          return as
        })
        const newAs: Assignment = {
          id: `as-${Date.now()}`,
          employeeId,
          nodeId: targetNode.id,
          type: "permanent",
          startDate: new Date().toISOString().split("T")[0],
          status: "active"
        }
        return [...completedOld, newAs]
      })
    } else if (type === "temporary" && tempDates) {
      const newAs: Assignment = {
        id: `as-${Date.now()}`,
        employeeId,
        nodeId: targetNode.id,
        type: "temporary",
        startDate: tempDates.startDate,
        endDate: tempDates.endDate,
        status: "active"
      }
      setAssignments(prev => [...prev, newAs])
    }
  }

  const handleExport = () => {
    const headers = "ID,Tên đơn vị,Mã đơn vị,Phân cấp,Quản lý,Chức danh,Số nhân sự,Trạng thái\n"
    const rows = orgNodes
      .map(n => {
        const mgr = employees.find(e => e.id === n.managerId)
        return `${n.id},"${n.name}",${n.code},${n.type},"${mgr ? mgr.name : ""}","${n.managerTitle}",${n.memberCount},${n.status}`
      })
      .join("\n")
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "co-cau-to-chuc.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredNodes = orgNodes.filter(n => {
    const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) || (n.code ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || n.type === filterType
    return matchesSearch && matchesType
  })

  const getManagerName = (managerId?: string) => {
    if (!managerId) return "—"
    const emp = employees.find(e => e.id === managerId)
    return emp ? emp.name : "—"
  }

  const typeLabels: Record<OrgNodeType, string> = {
    branch: "Chi nhánh",
    department: "Phòng ban",
    "sub-department": "Bộ phận",
    position: "Vị trí",
    team: "Nhóm"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Cơ cấu tổ chức</h2>
          <p className="text-sm text-gray-400 mt-1">Quản lý và thiết lập cơ cấu tổ chức trong doanh nghiệp</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors bg-white shadow-sm"
          >
            <Download size={15} /> Xuất sơ đồ
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-sm font-bold transition-colors shadow-sm shadow-[#C62828]/25"
          >
            <Plus size={15} /> Thêm đơn vị
          </button>
          <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner border border-gray-200">
            <button
              onClick={() => {
                setSelectedNodeId(null)
                setViewMode("diagram")
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "diagram" && !selectedNodeId ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
            >
              Sơ đồ
            </button>
            <button
              onClick={() => {
                setSelectedNodeId(null)
                setViewMode("list")
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "list" && !selectedNodeId ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
            >
              Danh sách
            </button>
          </div>
        </div>
      </div>

      {!selectedNodeId && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Tổng nhân sự", value: stats.totalEmployees, sub: "+12% so với tháng trước", color: "text-[#C62828]", bg: "bg-red-50/50" },
            { label: "Chi nhánh", value: stats.branches, sub: "Đang hoạt động", color: "text-purple-600", bg: "bg-purple-50/30" },
            { label: "Phòng ban", value: stats.departments, sub: "Đơn vị trực thuộc", color: "text-orange-600", bg: "bg-orange-50/30" },
            { label: "Bộ phận / Vị trí", value: stats.positions, sub: "Cơ cấu chuyên môn", color: "text-green-600", bg: "bg-green-50/30" },
            { label: "Nhóm", value: stats.teams, sub: "Team triển khai", color: "text-pink-600", bg: "bg-pink-50/30" }
          ].map(card => (
            <div key={card.label} className={`rounded-2xl p-5 border border-black/[0.04] bg-white flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group`}>
              <div className={`absolute top-0 left-0 w-1.5 h-full ${card.color.replace("text-", "bg-")}`} />
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
                <p className={`text-3xl font-black mt-2 tracking-tight ${card.color}`}>{card.value}</p>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 font-medium">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {selectedNodeId && selectedNode ? (
        <OrgDetailView
          node={selectedNode}
          orgNodes={orgNodes}
          employees={employees}
          assignments={assignments}
          onBack={() => setSelectedNodeId(null)}
          onEdit={() => handleOpenEdit(selectedNode)}
          onAddChild={() => handleOpenAddChild(selectedNode.id)}
          onStatusChange={handleStatusChange}
          onDeleteNode={requestDeleteNode}
          onSelectNode={setSelectedNodeId}
          onAssignMember={handleAssignMember}
        />
      ) : viewMode === "diagram" ? (
        <OrgTreeView
          orgNodes={orgNodes}
          employees={employees}
          onSelectNode={setSelectedNodeId}
          onAddChild={handleOpenAddChild}
          onEditNode={handleOpenEdit}
          onDeleteNode={requestDeleteNode}
        />
      ) : (() => {
        const isSearching = searchQuery.trim() !== "" || filterType !== "all"
        const listNodes = isSearching
          ? filteredNodes
          : flattenTree(orgNodes).filter(n => {
              if (!n.parentId) return true
              return isAncestorsExpanded(n, orgNodes, expandedListIds)
            })

        const dotColors: Record<OrgNodeType, string> = {
          branch: "bg-purple-500",
          department: "bg-orange-500",
          "sub-department": "bg-green-500",
          position: "bg-blue-500",
          team: "bg-pink-500"
        }

        const toggleExpandList = (id: string) => {
          setExpandedListIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
          )
        }

        return (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/[0.05] flex gap-3 flex-wrap items-center justify-between">
              <div className="relative flex-1 min-w-[260px]">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên đơn vị, mã đơn vị..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 focus:ring-2 focus:ring-[#C62828]/10 transition-all text-gray-800"
                />
              </div>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 text-gray-600 bg-white"
              >
                <option value="all">Tất cả phân cấp</option>
                <option value="branch">Chi nhánh</option>
                <option value="department">Phòng ban</option>
                <option value="sub-department">Bộ phận</option>
                <option value="position">Vị trí</option>
                <option value="team">Nhóm</option>
              </select>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-black/[0.05] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/70 text-gray-400 text-xs border-b border-gray-100">
                      <th className="px-6 py-3.5 text-left font-semibold">Tên đơn vị</th>
                      <th className="px-6 py-3.5 text-left font-semibold">Phân cấp</th>
                      <th className="px-6 py-3.5 text-left font-semibold">Mã đơn vị</th>
                      <th className="px-6 py-3.5 text-left font-semibold">Người phụ trách</th>
                      <th className="px-6 py-3.5 text-left font-semibold">Chức danh</th>
                      <th className="px-6 py-3.5 text-left font-semibold">Nhân sự</th>
                      <th className="px-6 py-3.5 text-left font-semibold">Trạng thái</th>
                      <th className="px-6 py-3.5 text-center font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {listNodes.map(node => {
                      const level = isSearching ? 0 : getNodeLevel(node, orgNodes)
                      const hasChildren = orgNodes.some(n => n.parentId === node.id)
                      const isExpanded = expandedListIds.includes(node.id)

                      return (
                        <tr key={node.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-bold text-gray-800">
                            <div className="flex items-center gap-1.5" style={{ paddingLeft: `${isSearching ? 0 : level * 20}px` }}>
                              {!isSearching && hasChildren ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpandList(node.id)}
                                  className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                              ) : !isSearching ? (
                                <div className="w-6 h-6 flex items-center justify-center">
                                  <Circle size={4} className="text-gray-300 fill-gray-300" />
                                </div>
                              ) : null}
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColors[node.type]}`} />
                              <span
                                className="cursor-pointer hover:text-[#C62828] transition-colors truncate"
                                onClick={() => setSelectedNodeId(node.id)}
                              >
                                {node.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-gray-500 text-xs">
                            {typeLabels[node.type]}
                          </td>
                          <td className="px-6 py-3.5 text-gray-400 font-mono text-xs">
                            {node.code}
                          </td>
                          <td className="px-6 py-3.5 text-gray-600">
                            {getManagerName(node.managerId)}
                          </td>
                          <td className="px-6 py-3.5 text-gray-500 text-xs">
                            {node.managerTitle || "—"}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-gray-700">
                            {node.memberCount}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${node.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {node.status === "active" ? "Hoạt động" : "Ngừng"}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenEdit(node)}
                                className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 hover:text-blue-700 transition-colors"
                                title="Sửa"
                              >
                                <Edit2 size={13} />
                              </button>
                              {!node.parentId ? null : (
                                <button
                                  onClick={() => requestDeleteNode(node.id)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {listNodes.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-gray-400">
                          Không tìm thấy đơn vị nào phù hợp
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      })()}

      <AddUnitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNode}
        employees={employees}
        orgNodes={orgNodes}
        editNode={editNode}
        parentId={modalParentId}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => handleDeleteNode(nodeToDelete?.id || "")}
        nodeName={nodeToDelete?.name || ""}
        childCount={nodeToDelete ? getDescendants(nodeToDelete.id, orgNodes).length : 0}
      />
    </div>
  )
}
