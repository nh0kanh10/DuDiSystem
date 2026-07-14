import { useState, useMemo, useEffect } from "react"
import { createPortal } from "react-dom"
import * as XLSX from "xlsx"
import { Download, Plus, Search, Edit2, Trash2, ChevronRight, ChevronDown, Circle, User, Ban, CheckCircle, ClipboardList, UserPlus, Briefcase } from "lucide-react"
import { OrgNode, OrgNodeType, Employee, Assignment } from "../../types"
import OrgTreeView from "./OrgTreeView"
import OrgDetailView from "./OrgDetailView"
import AddUnitModal from "./AddUnitModal"
import DeleteConfirmModal from "./DeleteConfirmModal"
import ViewMembersModal from "./ViewMembersModal"
import PositionManagement from "../vi-tri/PositionManagement"
import { api } from "@/lib/api"
import { CustomSelect } from "../ui/CustomSelect"
import { applyOrgFieldsToEmployee, buildOrgSnapshot, findBranchForNode, deriveOrgFields } from "../../utils/orgUtils"
import { removeVietnameseTones } from "../../utils"
import { useToast } from "@/app/hooks/useToast"

type RowItem = 
  | { type: "node"; data: OrgNode }
  | { type: "employee"; data: Employee; parentId: string }

interface OrgStructureProps {
  employees: Employee[]
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>
  assignments: Assignment[]
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>
  orgNodes: OrgNode[]
  setOrgNodes: React.Dispatch<React.SetStateAction<OrgNode[]>>
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
  selectedBranch?: string
  currentUserEmail?: string
  currentUserRole?: string
  onAddEmployee?: () => void
}

export default function OrgStructure({
  employees: rawEmployees,
  setEmployees,
  assignments,
  setAssignments,
  orgNodes,
  setOrgNodes,
  selectedNodeId,
  setSelectedNodeId,
  selectedBranch = "all",
  currentUserEmail,
  currentUserRole,
  onAddEmployee
}: OrgStructureProps) {
  const employees = useMemo(() => {
    return rawEmployees.filter(e => !["0000000000", "1111111111", "2222222222"].includes(e.id))
  }, [rawEmployees])

  const isSuperAdmin = currentUserRole === "role-admin" || currentUserRole === "role-super-admin"
  const { showToast } = useToast()

  const branchScopedEmployees = useMemo(() => {
    if (!selectedBranch || selectedBranch === "all") return employees
    return employees.filter(e =>
      (e.branchId || findBranchForNode(e.orgNodeId || "", orgNodes)) === selectedBranch
    )
  }, [employees, selectedBranch, orgNodes])
  const [viewMode, setViewMode] = useState<"diagram" | "list" | "catalog">("diagram")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editNode, setEditNode] = useState<OrgNode | null>(null)
  const [modalParentId, setModalParentId] = useState<string | undefined>(undefined)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<OrgNode | null>(null)
  const [expandedListIds, setExpandedListIds] = useState<string[]>([])
  const [hasInitListExpanded, setHasInitListExpanded] = useState(false)

  useEffect(() => {
    if (orgNodes.length > 0 && !hasInitListExpanded) {
      setExpandedListIds(orgNodes.map(n => n.id))
      setHasInitListExpanded(true)
    }
  }, [orgNodes, hasInitListExpanded])
  const [viewingMembersNode, setViewingMembersNode] = useState<OrgNode | null>(null)
  const [historyConfirm, setHistoryConfirm] = useState<{
    employeeId: string
    type: "permanent" | "temporary"
    tempDates?: { startDate: string; endDate: string }
    targetNode: OrgNode
    defaultNote: string
    customNote: string
    isManagerAppoint?: boolean
    managerTitle?: string
    historyType?: "transfer" | "promotion"
  } | null>(null)

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

  const nodesInActiveBranch = useMemo(() => {
    if (!selectedBranch || selectedBranch === "all") return orgNodes
    const branch = orgNodes.find(n => n.id === selectedBranch)
    if (!branch) return orgNodes
    const descendants = getDescendants(selectedBranch, orgNodes)
    return [branch, ...descendants]
  }, [orgNodes, selectedBranch])

  const nodesToRender = useMemo(() => {
    let nodes = nodesInActiveBranch
    if (filterStatus !== "all") {
      nodes = nodes.filter(n => n.status === filterStatus)
    }
    return nodes.map(n => {
      const descendants = getDescendants(n.id, nodes)
      const descendantIds = [n.id, ...descendants.map(d => d.id)]
      const actualCount = employees.filter(e => {
        const empNodeIds = [
          e.orgNodeId,
          ...assignments.filter(as => as.employeeId === e.id && as.status === "active").map(as => as.nodeId)
        ].filter(Boolean)
        return empNodeIds.some(nodeId => descendantIds.includes(nodeId!))
      }).length
      return {
        ...n,
        memberCount: actualCount
      }
    })
  }, [nodesInActiveBranch, filterStatus, employees, assignments])

  const getDirectEmployees = (nodeId: string): Employee[] => {
    return employees.filter(e => {
      const isDirect = e.orgNodeId === nodeId
      const isAssigned = assignments.some(as => as.employeeId === e.id && as.nodeId === nodeId && as.status === "active")
      return isDirect || isAssigned
    })
  }

  const flattenTree = (nodes: OrgNode[], parentId?: string): RowItem[] => {
    const result: RowItem[] = []
    const roots = nodes.filter(n => parentId ? n.parentId === parentId : !n.parentId)
    roots.forEach(root => {
      result.push({ type: "node", data: root })
      
      const children = flattenTree(nodes, root.id)
      result.push(...children)
      
      const directEmps = getDirectEmployees(root.id)
      directEmps.forEach(emp => {
        result.push({ type: "employee", data: emp, parentId: root.id })
      })
    })
    return result
  }

  const isAncestorsExpanded = (item: RowItem, nodes: OrgNode[], expandedIds: string[]): boolean => {
    let parentId = item.type === "node" ? item.data.parentId : item.parentId
    while (parentId) {
      const parent = nodes.find(n => n.id === parentId)
      if (!parent) break
      if (!expandedIds.includes(parent.id)) {
        return false
      }
      parentId = parent.parentId
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

  const stats = useMemo(() => {
    const activeNodes = nodesInActiveBranch.filter(n => n.status === "active")
    const activeNodeIds = nodesInActiveBranch.map(n => n.id)
    
    const filteredEmployees = employees.filter(e => {
      const empNodeIds = [
        e.orgNodeId,
        ...assignments.filter(as => as.employeeId === e.id && as.status === "active").map(as => as.nodeId)
      ].filter(Boolean)
      return empNodeIds.some(nodeId => activeNodeIds.includes(nodeId!))
    })
    
    return {
      totalEmployees: filteredEmployees.length,
      branches: activeNodes.filter(n => n.type === "branch").length,
      departments: activeNodes.filter(n => n.type === "department").length,
      positions: activeNodes.filter(n => n.type === "sub-department" || n.type === "position").length
    }
  }, [nodesInActiveBranch, employees, assignments])

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null
    return nodesToRender.find(n => n.id === selectedNodeId) || orgNodes.find(n => n.id === selectedNodeId) || null
  }, [selectedNodeId, nodesToRender, orgNodes])

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
      const prevSnapshot = { ...editNode }
      setOrgNodes(prev =>
        prev.map(n => (n.id === editNode.id ? { ...n, ...nodeData } : n))
      )
      api.orgNodes.update(editNode.id, nodeData)
        .then(updated => {
          if (updated) {
            setOrgNodes(prev => prev.map(n => (n.id === editNode.id ? (updated as OrgNode) : n)))
            showToast("Đã cập nhật đơn vị")
          }
        })
        .catch((err: unknown) => {
          console.error("Lỗi cập nhật đơn vị:", err)
          setOrgNodes(prev => prev.map(n => (n.id === editNode.id ? prevSnapshot : n)))
          showToast(err instanceof Error ? err.message : "Không thể cập nhật đơn vị", "error")
        })
    } else {
      api.orgNodes.create(nodeData)
        .then(created => {
          if (created) {
            setOrgNodes(prev => [...prev, created as OrgNode])
            showToast("Đã thêm đơn vị mới")
          }
        })
        .catch((err: unknown) => {
          console.error("Lỗi tạo đơn vị:", err)
          showToast(err instanceof Error ? err.message : "Không thể tạo đơn vị", "error")
        })
    }
  }

  const handleDeleteNode = (id: string) => {
    const descendants = getDescendants(id, orgNodes)
    const descendantIds = descendants.map(d => d.id)
    const idsToDelete = [id, ...descendantIds]

    api.orgNodes.delete(id)
      .then(() => {
        setOrgNodes(prev => prev.filter(n => !idsToDelete.includes(n.id)))
        if (selectedNodeId === id || (selectedNodeId && descendantIds.includes(selectedNodeId))) {
          setSelectedNodeId(null)
        }
        showToast("Đã xóa đơn vị")
      })
      .catch((err: unknown) => {
        console.error("Lỗi xóa đơn vị:", err)
        showToast(err instanceof Error ? err.message : "Không thể xóa đơn vị", "error")
      })
  }

  const requestDeleteNode = (id: string) => {
    const node = orgNodes.find(n => n.id === id)
    if (node) {
      setNodeToDelete(node)
      setIsDeleteOpen(true)
    }
  }

  const handleStatusChange = (id: string, status: "active" | "inactive") => {
    const descendants = getDescendants(id, orgNodes)
    const descendantIds = descendants.map(d => d.id)
    const allAffectedIds = [id, ...descendantIds]

    setOrgNodes(prev =>
      prev.map(n => (allAffectedIds.includes(n.id) ? { ...n, status } : n))
    )

    api.orgNodes.changeStatus(id, status)
      .then(() => showToast("Đã cập nhật trạng thái đơn vị"))
      .catch((err: unknown) => {
        console.error("Lỗi cập nhật trạng thái đơn vị:", err)
        setOrgNodes(prev =>
          prev.map(n => (allAffectedIds.includes(n.id) ? { ...n, status: status === "active" ? "inactive" : "active" } : n))
        )
        showToast(err instanceof Error ? err.message : "Không thể cập nhật trạng thái", "error")
      })
  }

  const executeAssignMember = (
    employeeId: string,
    type: "permanent" | "temporary",
    tempDates?: { startDate: string; endDate: string },
    targetNode?: OrgNode,
    writeHistory: boolean = false,
    historyNote: string = "",
    historyType: "transfer" | "promotion" = "transfer"
  ) => {
    if (!targetNode) return

    if (type === "permanent") {
      const emp = employees.find(e => e.id === employeeId)
      if (emp) {
        let updatedWorkHistory = emp.workHistory || []

        if (writeHistory) {
          const snapshot = buildOrgSnapshot(targetNode.id, orgNodes)

          if (updatedWorkHistory.length === 0) {
            const joinEntry = {
              id: 1,
              type: "join" as const,
              date: emp.joinDate || new Date().toISOString().split("T")[0].split("-").reverse().join("/"),
              toDate: "",
              title: emp.position || "Nhân viên",
              orgNodeId: emp.orgNodeId || "",
              snapshot: "",
              note: "Bắt đầu công tác"
            }
            updatedWorkHistory.push(joinEntry)
          }

          const derived = deriveOrgFields(targetNode.id, orgNodes)
          const newHistoryEntry = {
            id: updatedWorkHistory.length + 1,
            type: historyType,
            date: new Date().toISOString().split("T")[0].split("-").reverse().join("/"),
            toDate: "",
            title: derived.position || targetNode.name || emp.position,
            orgNodeId: targetNode.id,
            snapshot: snapshot,
            note: historyNote || "Thuyên chuyển từ sơ đồ cơ cấu"
          }
          updatedWorkHistory = [...updatedWorkHistory, newHistoryEntry]
        }

        const updatedEmpData = applyOrgFieldsToEmployee(
          { ...emp, workHistory: updatedWorkHistory },
          targetNode.id,
          orgNodes
        )

        api.employees.update(employeeId, updatedEmpData)
          .then(updated => {
            if (updated) {
              setEmployees(prev => prev.map(e => e.id === employeeId ? (updated as Employee) : e))
              showToast("Đã cập nhật vị trí nhân sự")
            }
          })
          .catch(err => {
            console.error("Lỗi cập nhật nhân viên:", err)
            showToast(err instanceof Error ? err.message : "Không thể cập nhật nhân viên", "error")
          })

        const newAsPayload = {
          employeeId,
          nodeId: targetNode.id,
          type: "permanent" as const,
          startDate: new Date().toISOString().split("T")[0],
        }

        api.assignments.create(newAsPayload)
          .then(created => {
            if (created) {
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
                return [...completedOld, created as Assignment]
              })
            }
          })
          .catch(err => {
            console.error("Lỗi tạo assignment:", err)
            showToast(err instanceof Error ? err.message : "Không thể ghi nhận phân công", "error")
          })
      }
    } else if (type === "temporary" && tempDates) {
      const newAsPayload = {
        employeeId,
        nodeId: targetNode.id,
        type: "temporary" as const,
        startDate: tempDates.startDate,
        endDate: tempDates.endDate,
        status: "active" as const
      }

      api.assignments.create(newAsPayload)
        .then(created => {
          if (created) {
            setAssignments(prev => [...prev, created as Assignment])
            showToast("Đã ghi nhận biệt phái")
          }
        })
        .catch(err => {
          console.error("Lỗi tạo temporary assignment:", err)
          showToast(err instanceof Error ? err.message : "Không thể tạo biệt phái", "error")
        })
    }
  }

  const executeAssignManager = (
    employeeId: string,
    targetNode: OrgNode,
    managerTitle: string,
    writeHistory: boolean,
    historyNote: string,
    historyType: "transfer" | "promotion" = "promotion"
  ) => {
    const emp = employees.find(e => e.id === employeeId)
    if (emp) {
      let updatedWorkHistory = emp.workHistory || []

      if (writeHistory) {
        const path = []
        let curr = orgNodes.find(n => n.id === targetNode.id)
        while (curr) {
          path.push(curr.name)
          const pId = curr.parentId
          curr = pId ? orgNodes.find(n => n.id === pId) : undefined
        }
        const snapshot = path.reverse().join(" · ")

        if (updatedWorkHistory.length === 0) {
          const joinEntry = {
            id: 1,
            type: "join" as const,
            date: emp.joinDate || new Date().toISOString().split("T")[0].split("-").reverse().join("/"),
            toDate: "",
            title: emp.position || "Nhân viên",
            orgNodeId: emp.orgNodeId || "",
            snapshot: "",
            note: "Bắt đầu công tác"
          }
          updatedWorkHistory.push(joinEntry)
        }

        const newHistoryEntry = {
          id: updatedWorkHistory.length + 1,
          type: historyType,
          date: new Date().toISOString().split("T")[0].split("-").reverse().join("/"),
          toDate: "",
          title: managerTitle,
          orgNodeId: targetNode.id,
          snapshot: snapshot,
          note: historyNote || `Bổ nhiệm làm ${managerTitle} - ${targetNode.name}`
        }
        updatedWorkHistory = [...updatedWorkHistory, newHistoryEntry]
      }

      const updatedEmpData = {
        ...emp,
        position: managerTitle,
        workHistory: updatedWorkHistory
      }

      api.employees.update(employeeId, updatedEmpData)
        .then(updated => {
          if (updated) {
            setEmployees(prev => prev.map(e => e.id === employeeId ? (updated as Employee) : e))
          }
        })
        .catch(err => {
          console.error("Lỗi cập nhật nhân viên:", err)
          setEmployees(prev => prev.map(e => e.id === employeeId ? (updatedEmpData as Employee) : e))
        })

      const updatedNodeData = {
        ...targetNode,
        managerId: employeeId,
        managerTitle
      }

      api.orgNodes.update(targetNode.id, updatedNodeData)
        .then(updated => {
          if (updated) {
            setOrgNodes(prev => prev.map(n => n.id === targetNode.id ? (updated as OrgNode) : n))
          }
        })
        .catch(err => {
          console.error("Lỗi cập nhật đơn vị:", err)
          setOrgNodes(prev => prev.map(n => n.id === targetNode.id ? updatedNodeData : n))
        })
    }
  }

  const handleConfirmHistory = (writeHistory: boolean) => {
    if (!historyConfirm) return
    const { employeeId, type, tempDates, targetNode, customNote, defaultNote, isManagerAppoint, managerTitle, historyType } = historyConfirm
    setHistoryConfirm(null)

    const finalType = historyType || (isManagerAppoint ? "promotion" : "transfer")

    if (isManagerAppoint && managerTitle) {
      executeAssignManager(employeeId, targetNode, managerTitle, writeHistory, customNote || defaultNote, finalType)
    } else {
      executeAssignMember(employeeId, type, tempDates, targetNode, writeHistory, customNote || defaultNote, finalType)
    }
  }

  const handleAssignMember = (
    employeeId: string,
    type: "permanent" | "temporary",
    tempDates?: { startDate: string; endDate: string }
  ) => {
    const targetNode = orgNodes.find(n => n.id === selectedNodeId)
    if (!targetNode) return

    if (type === "permanent") {
      const emp = employees.find(e => e.id === employeeId)
      if (emp && emp.orgNodeId !== targetNode.id) {
        setHistoryConfirm({
          employeeId,
          type,
          tempDates,
          targetNode,
          defaultNote: "Thuyên chuyển từ sơ đồ cơ cấu",
          customNote: "Thuyên chuyển từ sơ đồ cơ cấu",
          historyType: "transfer"
        })
        return
      }
    }

    executeAssignMember(employeeId, type, tempDates, targetNode, false, "")
  }

  const handleAssignManager = (nodeId: string, employeeId: string, managerTitle: string) => {
    const targetNode = orgNodes.find(n => n.id === nodeId)
    const emp = employees.find(e => e.id === employeeId)
    if (!targetNode || !emp) return

    const defaultNote = `Bổ nhiệm làm ${managerTitle} tại ${targetNode.name}`
    setHistoryConfirm({
      employeeId,
      type: "permanent",
      targetNode,
      defaultNote,
      customNote: defaultNote,
      isManagerAppoint: true,
      managerTitle,
      historyType: "promotion"
    })
  }

  const handleExport = () => {
    const typeLabelsExport: Record<string, string> = {
      branch: "Chi nhánh",
      department: "Phòng ban",
      "sub-department": "Bộ phận",
      position: "Vị trí",
      team: "Nhóm",
    }
    const statusLabelsExport: Record<string, string> = {
      active: "Hoạt động",
      inactive: "Ngừng",
    }
    const rows = nodesToRender.map(n => {
      const mgr = employees.find(e => e.id === n.managerId)
      return {
        ID: n.id,
        "Tên đơn vị": n.name,
        "Mã đơn vị": n.code,
        "Phân cấp": typeLabelsExport[n.type] || n.type,
        "Trưởng phòng": mgr ? mgr.name : "",
        "Chức danh": n.managerTitle || "",
        "Số nhân sự": n.memberCount,
        "Trạng thái": statusLabelsExport[n.status] || n.status,
      }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Cơ cấu tổ chức")
    XLSX.writeFile(wb, "co-cau-to-chuc.xlsx")
  }

  const filteredNodes = useMemo<RowItem[]>(() => {
    const matchedItems: RowItem[] = []
    const sq = removeVietnameseTones(searchQuery.toLowerCase())
    nodesToRender.forEach(n => {
      const nameStr = removeVietnameseTones(n.name.toLowerCase())
      const codeStr = (n.code ?? "").toLowerCase()
      const matchesSearch = nameStr.includes(sq) || codeStr.includes(sq)
      const matchesType = filterType === "all" || n.type === filterType
      if (matchesSearch && matchesType) {
        matchedItems.push({ type: "node", data: n })
      }
    })
    
    if (filterType === "all") {
      employees.forEach(emp => {
        const empName = removeVietnameseTones(emp.name.toLowerCase())
        const empId = emp.id.toLowerCase()
        const matchesSearch = empName.includes(sq) || empId.includes(sq)
        if (matchesSearch) {
          const activeAs = assignments.find(as => as.employeeId === emp.id && as.status === "active")
          const nodeId = emp.orgNodeId || activeAs?.nodeId
          if (nodeId && nodesToRender.some(n => n.id === nodeId)) {
            matchedItems.push({ type: "employee", data: emp, parentId: nodeId })
          }
        }
      })
    }
    return matchedItems
  }, [nodesToRender, searchQuery, filterType, employees, assignments])

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
      <div className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px] p-5 rounded-2xl text-white flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div className="flex items-center">
          <div className="flex gap-1.5 items-center mr-4 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white/30 animate-pulse"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white/60 animate-pulse delay-75"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse delay-150"></span>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Cơ cấu tổ chức</h2>
            <p className="text-xs text-white/80 mt-1">Quản lý và thiết lập cơ cấu tổ chức trong doanh nghiệp</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <Download size={14} /> Xuất sơ đồ
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#C62828] hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={14} /> Thêm đơn vị
          </button>
        </div>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner border border-gray-200 w-fit">
        <button
          onClick={() => { setSelectedNodeId(null); setViewMode("diagram") }}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "diagram" && !selectedNodeId ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
        >
          Sơ đồ
        </button>
        <button
          onClick={() => { setSelectedNodeId(null); setViewMode("list") }}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "list" && !selectedNodeId ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
        >
          Danh sách
        </button>
        <button
          onClick={() => { setSelectedNodeId(null); setViewMode("catalog") }}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${viewMode === "catalog" ? "bg-white text-[#C62828] shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
        >
          <Briefcase size={11} />Chức danh
        </button>
      </div>

      {!selectedNodeId && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Tổng nhân sự", value: stats.totalEmployees, sub: "Trong phạm vi đang xem", color: "text-[#C62828]", bg: "bg-red-50/50" },
            { label: "Chi nhánh", value: stats.branches, sub: "Đang hoạt động", color: "text-purple-600", bg: "bg-purple-50/30" },
            { label: "Phòng ban", value: stats.departments, sub: "Đơn vị trực thuộc", color: "text-orange-600", bg: "bg-orange-50/30" },
            { label: "Bộ phận / Vị trí", value: stats.positions, sub: "Cơ cấu chuyên môn", color: "text-green-600", bg: "bg-green-50/30" }
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

      {viewMode === "catalog" && !selectedNodeId && (
        <div className="bg-white rounded-3xl border border-black/[0.05] shadow-sm p-6">
          <PositionManagement />
        </div>
      )}

      {viewMode !== "catalog" && selectedNodeId && selectedNode ? (
        <OrgDetailView
          node={selectedNode}
          orgNodes={nodesToRender}
          employees={employees}
          branchScopedEmployees={branchScopedEmployees}
          assignments={assignments}
          isSuperAdmin={isSuperAdmin}
          onBack={() => setSelectedNodeId(null)}
          onEdit={() => handleOpenEdit(selectedNode)}
          onAddChild={() => handleOpenAddChild(selectedNode.id)}
          onStatusChange={handleStatusChange}
          onDeleteNode={requestDeleteNode}
          onSelectNode={setSelectedNodeId}
          onAssignMember={handleAssignMember}
          onAssignManager={handleAssignManager}
        />
      ) : viewMode !== "catalog" ? (
        <>
          {!selectedNodeId && (
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
              <div className="flex gap-2.5">
                <CustomSelect
                  value={filterType}
                  onChange={setFilterType}
                  options={[
                    { value: "all", label: "Tất cả phân cấp" },
                    { value: "branch", label: "Chi nhánh" },
                    { value: "department", label: "Phòng ban" },
                    { value: "sub-department", label: "Bộ phận" },
                    { value: "position", label: "Vị trí" },
                    { value: "team", label: "Nhóm" }
                  ]}
                  className="w-44"
                />

                <CustomSelect
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={[
                    { value: "all", label: "Tất cả trạng thái" },
                    { value: "active", label: "Đang hoạt động" },
                    { value: "inactive", label: "Tạm ngưng hoạt động" }
                  ]}
                  className="w-44"
                />
              </div>
            </div>
          )}
          {viewMode === "diagram" ? (
            <OrgTreeView
              orgNodes={nodesToRender}
              employees={employees}
              onSelectNode={setSelectedNodeId}
              onAddChild={handleOpenAddChild}
              onEditNode={handleOpenEdit}
              onDeleteNode={requestDeleteNode}
              onViewMembers={setViewingMembersNode}
              onStatusChange={handleStatusChange}
              isSuperAdmin={isSuperAdmin}
            />
          ) : (() => {
            const isSearching = searchQuery.trim() !== "" || filterType !== "all" || filterStatus !== "all"
            const listNodes = isSearching
              ? filteredNodes
              : flattenTree(nodesToRender).filter(item => {
                  return isAncestorsExpanded(item, nodesToRender, expandedListIds)
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
                <div className="bg-white rounded-3xl shadow-sm border border-black/[0.05] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/70 text-gray-400 text-xs border-b border-gray-100">
                      <th className="px-6 py-3.5 text-left font-semibold">Tên đơn vị / Nhân sự</th>
                      <th className="px-6 py-3.5 text-left font-semibold">Phân cấp</th>
                      <th className="px-6 py-3.5 text-left font-semibold">Mã đơn vị / NV</th>
                      <th className="px-6 py-3.5 text-left font-semibold">Trưởng phòng</th>
                      <th className="px-6 py-3.5 text-left font-semibold">Chức danh</th>
                      <th className="px-6 py-3.5 text-left font-semibold">Nhân sự</th>
                      <th className="px-6 py-3.5 text-left font-semibold">Trạng thái</th>
                      <th className="px-6 py-3.5 text-center font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {listNodes.map(item => {
                      const isNode = item.type === "node"
                      if (isNode) {
                        const node = item.data
                        const level = isSearching ? 0 : getNodeLevel(node, orgNodes)
                        const hasChildren = orgNodes.some(n => n.parentId === node.id) || getDirectEmployees(node.id).length > 0
                        const isExpanded = expandedListIds.includes(node.id)

                        return (
                          <tr key={`node-${node.id}`} className="hover:bg-gray-50/50 transition-colors">
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
                                  onClick={() => handleStatusChange(node.id, node.status === "active" ? "inactive" : "active")}
                                  className={`p-1.5 rounded-lg transition-colors ${node.status === "active" ? "hover:bg-amber-50 text-amber-500 hover:text-amber-700" : "hover:bg-green-50 text-green-500 hover:text-green-700"}`}
                                  title={node.status === "active" ? "Tạm ngưng hoạt động" : "Mở hoạt động"}
                                >
                                  {node.status === "active" ? <Ban size={13} /> : <CheckCircle size={13} />}
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(node)}
                                  className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 hover:text-blue-700 transition-colors"
                                  title="Sửa"
                                >
                                  <Edit2 size={13} />
                                </button>
                                {node.type === "branch" && !isSuperAdmin ? null : (
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
                      } else {
                        const emp = item.data
                        const parentNode = nodesToRender.find(n => n.id === item.parentId)
                        const level = isSearching ? 0 : (parentNode ? getNodeLevel(parentNode, nodesToRender) + 1 : 1)

                        return (
                          <tr key={`emp-${item.parentId}-${emp.id}`} className="bg-gray-50/20 hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-3.5 font-medium text-gray-600">
                              <div className="flex items-center gap-1.5" style={{ paddingLeft: `${isSearching ? 0 : level * 20}px` }}>
                                <div className="w-6 h-6 flex items-center justify-center">
                                  <Circle size={4} className="text-gray-300 fill-gray-300" />
                                </div>
                                <User size={13} className="text-gray-400 flex-shrink-0" />
                                <span className="truncate">{emp.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3.5 text-gray-400 italic text-xs">
                              Nhân sự
                            </td>
                            <td className="px-6 py-3.5 text-gray-400 font-mono text-xs">
                              {emp.id}
                            </td>
                            <td className="px-6 py-3.5 text-gray-400">
                              —
                            </td>
                            <td className="px-6 py-3.5 text-gray-600 text-xs">
                              {emp.position}
                            </td>
                            <td className="px-6 py-3.5 text-gray-400">
                              —
                            </td>
                            <td className="px-6 py-3.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${emp.status === "active" ? "bg-green-100 text-green-700" : emp.status === "suspended" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                                {emp.status === "active" ? "Đang làm" : emp.status === "suspended" ? "Tạm nghỉ" : "Nghỉ việc"}
                                {emp.contractType === "intern" && <span className="ml-1 text-purple-500">(TT)</span>}
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-xs text-gray-300">—</span>
                              </div>
                            </td>
                          </tr>
                        )
                      }
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
        </>
      ) : null}

      <AddUnitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNode}
        employees={employees}
        orgNodes={nodesToRender}
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

      <ViewMembersModal
        isOpen={!!viewingMembersNode}
        onClose={() => setViewingMembersNode(null)}
        node={viewingMembersNode}
        orgNodes={orgNodes}
        employees={employees}
        assignments={assignments}
      />

      {historyConfirm && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
          <div className="bg-[#F5F1EF] rounded-3xl w-full max-w-md shadow-2xl p-6 border border-black/5 animate-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3 text-[#C62828] mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <ClipboardList size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Ghi nhận lịch sử công tác?</h4>
                <p className="text-[11px] text-gray-400">Hệ thống phát hiện thuyên chuyển bộ phận/chức danh</p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 space-y-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Đơn vị mới</p>
              <p className="text-sm text-gray-800 font-extrabold">{historyConfirm.targetNode.name}</p>
            </div>

            {historyConfirm.historyType && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 space-y-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Loại biến động</p>
                <div className="flex gap-6 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="radio"
                      name="historyType"
                      value="transfer"
                      checked={historyConfirm.historyType === "transfer"}
                      onChange={() => setHistoryConfirm(prev => prev ? { ...prev, historyType: "transfer" } : null)}
                      className="text-[#C62828] focus:ring-[#C62828]"
                    />
                    Thuyên chuyển
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="radio"
                      name="historyType"
                      value="promotion"
                      checked={historyConfirm.historyType === "promotion"}
                      onChange={() => setHistoryConfirm(prev => prev ? { ...prev, historyType: "promotion" } : null)}
                      className="text-[#C62828] focus:ring-[#C62828]"
                    />
                    Thăng chức
                  </label>
                </div>
              </div>
            )}

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
                Hủy lệnh thuyên chuyển
              </button>
            </div>
          </div>
        </div>
      , document.body)}

    </div>
  )
}
