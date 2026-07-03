import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import {
  ArrowLeft, Edit2, Plus, MoreVertical,
  Building2, FolderOpen, Layers, Briefcase, Users,
  UserPlus, Clock, Calendar, ChevronRight, User, X
} from "lucide-react"
import { OrgNode, OrgNodeType, Employee, Assignment } from "../../types"
import AssignMemberModal from "./AssignMemberModal"
import SetManagerModal from "./SetManagerModal"

// ─── Utils ────────────────────────────────────────────────────────────────────

function collectDescendantIds(nodeId: string, nodes: OrgNode[]): string[] {
  const ids = [nodeId]
  const q = [nodeId]
  while (q.length) {
    const cur = q.shift()!
    nodes.filter(n => n.parentId === cur).forEach(c => { ids.push(c.id); q.push(c.id) })
  }
  return ids
}

function isActiveAssignment(a: Assignment): boolean {
  if (a.status !== "active") return false
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const s = new Date(a.startDate); s.setHours(0, 0, 0, 0)
  const e = a.endDate ? (() => { const d = new Date(a.endDate!); d.setHours(0, 0, 0, 0); return d })() : null
  return now >= s && (!e || now <= e)
}

function initials(name: string) {
  return name.split(" ").pop()?.charAt(0) ?? "?"
}

function getAncestors(nodeId: string, allNodes: OrgNode[]): OrgNode[] {
  const result: OrgNode[] = []
  let cur = allNodes.find(n => n.id === nodeId)
  while (cur?.parentId) {
    const parent = allNodes.find(n => n.id === cur!.parentId)
    if (!parent) break
    result.unshift(parent)
    cur = parent
  }
  return result
}

// ─── Level theme ──────────────────────────────────────────────────────────────

type LevelTheme = {
  label: string
  barGradient: string
  lightBg: string
  border: string
  textColor: string
  Icon: React.ComponentType<{ size?: number; className?: string }>
}

const THEME: Record<OrgNodeType, LevelTheme> = {
  branch: {
    label: "Chi nhánh",
    barGradient: "from-[#C62828] to-[#B71C1C]",
    lightBg: "bg-red-50",
    border: "border-red-200",
    textColor: "text-[#C62828]",
    Icon: Building2,
  },
  department: {
    label: "Phòng ban",
    barGradient: "from-amber-500 to-amber-600",
    lightBg: "bg-amber-50",
    border: "border-amber-200",
    textColor: "text-amber-700",
    Icon: FolderOpen,
  },
  "sub-department": {
    label: "Bộ phận",
    barGradient: "from-emerald-600 to-emerald-700",
    lightBg: "bg-emerald-50",
    border: "border-emerald-200",
    textColor: "text-emerald-700",
    Icon: Layers,
  },
  position: {
    label: "Vị trí",
    barGradient: "from-blue-600 to-blue-700",
    lightBg: "bg-blue-50",
    border: "border-blue-200",
    textColor: "text-blue-700",
    Icon: Briefcase,
  },
  team: {
    label: "Nhóm",
    barGradient: "from-pink-600 to-pink-700",
    lightBg: "bg-pink-50",
    border: "border-pink-200",
    textColor: "text-pink-700",
    Icon: Users,
  },
}

// ─── Tabs per level ───────────────────────────────────────────────────────────

type TabId = "children" | "personnel" | "temp" | "info" | "manager"

const LEVEL_TABS: Record<OrgNodeType, { id: TabId; label: string }[]> = {
  branch: [
    { id: "children", label: "Phòng ban" },
    { id: "personnel", label: "Nhân sự" },
    { id: "manager", label: "Quản lý" },
    { id: "info", label: "Thông tin" },
  ],
  department: [
    { id: "children", label: "Bộ phận" },
    { id: "personnel", label: "Nhân sự" },
    { id: "manager", label: "Trưởng phòng" },
    { id: "info", label: "Thông tin" },
  ],
  "sub-department": [
    { id: "children", label: "Vị trí & Nhóm" },
    { id: "personnel", label: "Nhân sự" },
    { id: "temp", label: "Biệt phái" },
    { id: "manager", label: "Trưởng bộ phận" },
    { id: "info", label: "Thông tin" },
  ],
  position: [
    { id: "personnel", label: "Nhân sự" },
    { id: "info", label: "Thông tin" },
  ],
  team: [
    { id: "personnel", label: "Nhân sự" },
    { id: "manager", label: "Trưởng nhóm" },
    { id: "info", label: "Thông tin" },
  ],
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface OrgDetailViewProps {
  node: OrgNode
  orgNodes: OrgNode[]
  employees: Employee[]
  branchScopedEmployees?: Employee[]
  assignments: Assignment[]
  isSuperAdmin?: boolean
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
  onAssignManager: (nodeId: string, employeeId: string, managerTitle: string) => void
}


export default function OrgDetailView({
  node, orgNodes, employees, branchScopedEmployees, assignments,
  isSuperAdmin = false,
  onBack, onEdit, onAddChild, onStatusChange, onDeleteNode,
  onSelectNode, onAssignMember, onAssignManager
}: OrgDetailViewProps) {
  const scopedEmployees = branchScopedEmployees ?? employees
  const theme = THEME[node.type]
  const tabs = LEVEL_TABS[node.type]
  const defaultTab: TabId = node.type === "position" ? "personnel" : "children"

  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)
  const [showMenu, setShowMenu] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [isSetManagerOpen, setIsSetManagerOpen] = useState(false)

  useEffect(() => {
    setActiveTab(defaultTab)
  }, [node.id, node.type])


  const ancestors = useMemo(() => getAncestors(node.id, orgNodes), [node.id, orgNodes])
  const childNodes = useMemo(() => orgNodes.filter(n => n.parentId === node.id), [orgNodes, node.id])
  const manager = useMemo(() => employees.find(e => e.id === node.managerId), [employees, node.managerId])
  const descIds = useMemo(() => collectDescendantIds(node.id, orgNodes), [node.id, orgNodes])
  const activeAsgn = useMemo(() => assignments.filter(isActiveAssignment), [assignments])

  const officialEmps = useMemo(() => employees.filter(emp => {
    const isUnder = emp.orgNodeId && descIds.includes(emp.orgNodeId)
    const isTempOut = activeAsgn.some(a => a.employeeId === emp.id && a.type === "temporary")
    return isUnder && !isTempOut
  }), [employees, descIds, activeAsgn])

  const tempInEmps = useMemo(() => employees.filter(emp => {
    const a = activeAsgn.find(a => a.employeeId === emp.id && a.type === "temporary")
    return a && descIds.includes(a.nodeId ?? "")
  }), [employees, descIds, activeAsgn])

  const tempOutEmps = useMemo(() => employees.filter(emp => {
    const isUnder = emp.orgNodeId && descIds.includes(emp.orgNodeId)
    const isTempOut = activeAsgn.some(a =>
      a.employeeId === emp.id && a.type === "temporary" && !descIds.includes(a.nodeId ?? "")
    )
    return isUnder && isTempOut
  }), [employees, descIds, activeAsgn])

  // Stats chips
  const statsChips = useMemo(() => {
    const positions = childNodes.filter(n => n.type === "position").length
    const teams = childNodes.filter(n => n.type === "team").length
    const total = officialEmps.length + tempInEmps.length
    switch (node.type) {
      case "branch":
        return [
          { label: "phòng ban", count: childNodes.filter(n => n.type === "department").length },
          { label: "nhân sự", count: total },
        ]
      case "department":
        return [
          { label: "bộ phận", count: childNodes.filter(n => n.type === "sub-department").length },
          { label: "nhân sự", count: total },
        ]
      case "sub-department":
        return [
          { label: "vị trí", count: positions },
          { label: "nhóm", count: teams },
          { label: "nhân sự", count: total },
        ]
      case "position":
        return [
          { label: "nhóm", count: teams },
          { label: "nhân sự", count: total },
        ]
      case "team":
        return [
          { label: "nhân sự", count: total },
        ]
      default:
        return [
          { label: "nhân sự", count: total },
        ]
    }
  }, [node.type, childNodes, officialEmps, tempInEmps])


  const renderChildren = () => {
    if (childNodes.length === 0) return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <theme.Icon size={36} className="opacity-25 mb-3" />
        <p className="text-sm">Chưa có đơn vị con</p>
        <button onClick={onAddChild} className="mt-3 text-[#C62828] text-xs font-bold hover:underline flex items-center gap-1">
            <Plus size={12} /> Thêm ngay
          </button>
      </div>
    )

    // Branch → department cards
    if (node.type === "branch") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {childNodes.map(child => {
            const ct = THEME[child.type]
            const childMgr = employees.find(e => e.id === child.managerId)
            const childDescIds = collectDescendantIds(child.id, orgNodes)
            const empCount = employees.filter(e => e.orgNodeId && childDescIds.includes(e.orgNodeId)).length
            const subCount = orgNodes.filter(n => n.parentId === child.id).length
            return (
              <div key={child.id} onClick={() => onSelectNode(child.id)}
                className="group cursor-pointer bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-[#C62828]/20 transition-all duration-150">
                <div className={`h-1 rounded-full bg-gradient-to-r ${ct.barGradient} mb-3`} />
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${ct.lightBg}`}>
                      <ct.Icon size={16} className={ct.textColor} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm group-hover:text-[#C62828] transition-colors">{child.name}</p>
                      <p className="text-[10px] font-mono text-gray-400">{child.code}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-[#C62828] mt-1 transition-colors" />
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                  <span>{childMgr ? childMgr.name : "Chưa có QL"}</span>
                  <span className="text-gray-200">|</span>
                  <span>{subCount} đơn vị con</span>
                  <span className="text-gray-200">|</span>
                  <span className="font-bold text-gray-700">{empCount} nhân sự</span>
                </div>
                <div className="mt-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${child.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {child.status === "active" ? "Hoạt động" : "Ngừng"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    if (node.type === "department") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {childNodes.map(child => {
            const ct = THEME[child.type]
            const childMgr = employees.find(e => e.id === child.managerId)
            const childDescIds = collectDescendantIds(child.id, orgNodes)
            const empCount = employees.filter(e => e.orgNodeId && childDescIds.includes(e.orgNodeId)).length
            const posCount = orgNodes.filter(n => n.parentId === child.id && n.type === "position").length
            return (
              <div key={child.id} onClick={() => onSelectNode(child.id)}
                className="group cursor-pointer bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-[#C62828]/20 transition-all flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ct.lightBg} ${ct.border} border`}>
                  <ct.Icon size={17} className={ct.textColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <p className="font-bold text-gray-800 text-sm group-hover:text-[#C62828] transition-colors truncate">{child.name}</p>
                    <ChevronRight size={13} className="text-gray-300 group-hover:text-[#C62828] flex-shrink-0 mt-0.5" />
                  </div>
                  <p className="text-[10px] font-mono text-gray-400 mb-1.5">{child.code}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                    <span>{childMgr?.name ?? "Chưa có QL"}</span>
                    {posCount > 0 && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">{posCount} vị trí</span>}
                    <span className="font-bold text-gray-700">{empCount} nhân sự</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    if (node.type === "sub-department") {
      const positions = childNodes.filter(n => n.type === "position")
      const teams = childNodes.filter(n => n.type === "team")
      return (
        <div className="space-y-5">
          {positions.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-0.5">
                Vị trí ({positions.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {positions.map(pos => {
                  const empCount = employees.filter(e => {
                    const posDescIds = collectDescendantIds(pos.id, orgNodes)
                    return e.orgNodeId && posDescIds.includes(e.orgNodeId)
                  }).length
                  const teamCount = orgNodes.filter(n => n.parentId === pos.id && n.type === "team").length
                  return (
                    <div key={pos.id} onClick={() => onSelectNode(pos.id)}
                      className="group cursor-pointer bg-blue-50 border border-blue-100 rounded-xl p-3 hover:border-blue-300 hover:bg-blue-100/60 transition-all">
                      <p className="font-bold text-blue-800 text-xs truncate group-hover:text-blue-600">{pos.name}</p>
                      <p className="text-[10px] font-mono text-blue-400 mt-0.5">{pos.code}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-semibold text-blue-700">{empCount} nhân sự{teamCount > 0 ? ` · ${teamCount} nhóm` : ""}</span>
                        <ChevronRight size={11} className="text-blue-300 group-hover:text-blue-500" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {teams.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-0.5">
                Nhóm ({teams.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {teams.map(team => {
                  const empCount = employees.filter(e => e.orgNodeId === team.id).length
                  return (
                    <div key={team.id} onClick={() => onSelectNode(team.id)}
                      className="group cursor-pointer bg-pink-50 border border-pink-100 rounded-xl p-3 hover:border-pink-300 hover:bg-pink-100/60 transition-all">
                      <p className="font-bold text-pink-800 text-xs truncate group-hover:text-pink-600">{team.name}</p>
                      <p className="text-[10px] font-mono text-pink-400 mt-0.5">{team.code}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-semibold text-pink-700">{empCount} nhân sự</span>
                        <ChevronRight size={11} className="text-pink-300 group-hover:text-pink-500" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )
    }

    if (node.type === "position") {
      const teams = childNodes.filter(n => n.type === "team")
      if (teams.length === 0) return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Users size={36} className="opacity-25 mb-3" />
          <p className="text-sm">Chưa có nhóm trực thuộc vị trí này</p>
          <button onClick={onAddChild} className="mt-3 text-[#C62828] text-xs font-bold hover:underline flex items-center gap-1">
            <Plus size={12} /> Thêm nhóm
          </button>
        </div>
      )
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {teams.map(team => {
            const empCount = employees.filter(e => e.orgNodeId === team.id).length
            return (
              <div key={team.id} onClick={() => onSelectNode(team.id)}
                className="group cursor-pointer bg-pink-50 border border-pink-100 rounded-xl p-3 hover:border-pink-300 transition-all">
                <p className="font-bold text-pink-800 text-xs truncate">{team.name}</p>
                <p className="text-[10px] font-mono text-pink-400">{team.code}</p>
                <p className="text-xs font-semibold text-pink-700 mt-2">{empCount} nhân sự</p>
              </div>
            )
          })}
        </div>
      )
    }

    return null
  }


  const EmpAvatar = ({ emp, size = "sm" }: { emp: Employee; size?: "sm" | "md" | "lg" }) => {
    const szMap = { sm: "w-7 h-7 rounded-lg text-[10px]", md: "w-10 h-10 rounded-xl text-xs", lg: "w-16 h-16 rounded-2xl text-xl" }
    const s = szMap[size]
    return emp.photos?.[0]
      ? <img src={emp.photos[0]} alt={emp.name} className={`${s} object-cover flex-shrink-0`} />
      : <div className={`${s} bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white font-bold flex-shrink-0`}>{initials(emp.name)}</div>
  }

  const renderPersonnel = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="font-bold text-gray-700 text-sm">
          Nhân sự trực thuộc ({officialEmps.length})
        </p>
        <button onClick={() => setIsAssignOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-xs font-bold transition-colors shadow-sm">
          <UserPlus size={12} /> Gán nhân sự
        </button>
      </div>

      <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold border-b border-gray-100">
                <th className="px-4 py-3 text-left">Mã NV</th>
                <th className="px-4 py-3 text-left">Họ và tên</th>
                <th className="px-4 py-3 text-left">Chức vụ</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {officialEmps.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-400">{emp.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <EmpAvatar emp={emp} size="sm" />
                      <span className="font-semibold text-gray-700">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{emp.position}</td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{emp.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold
                      ${emp.status === "active" ? "bg-green-100 text-green-700" : emp.status === "suspended" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                      {emp.status === "active" ? "Đang làm" : emp.status === "suspended" ? "Tạm nghỉ" : "Nghỉ việc"}
                      {emp.contractType === "intern" && <span className="ml-1 text-purple-500">(TT)</span>}
                    </span>
                  </td>
                </tr>
              ))}
              {officialEmps.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400">Chưa có nhân sự tại đây</td></tr>
              )}
            </tbody>
          </table>
        </div>
    </div>
  )


  const renderTemp = () => (
    <div className="space-y-5">
      {tempInEmps.length > 0 && (
        <div className="border border-amber-100 rounded-2xl overflow-hidden">
          <div className="bg-amber-50 px-5 py-3 border-b border-amber-100 flex items-center justify-between">
            <span className="font-bold text-amber-800 text-xs flex items-center gap-1.5">
              <Clock size={13} className="text-amber-500" />Nhân sự biệt phái đến ({tempInEmps.length})
            </span>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold border-b">
              <th className="px-4 py-3 text-left">Nhân viên</th>
              <th className="px-4 py-3 text-left">Thời gian</th>
              <th className="px-4 py-3 text-left">Đơn vị gốc</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {tempInEmps.map(emp => {
                const a = activeAsgn.find(a => a.employeeId === emp.id && a.type === "temporary")
                const origin = orgNodes.find(n => n.id === emp.orgNodeId)
                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-700">{emp.name}</td>
                    <td className="px-4 py-3 text-amber-600 font-medium">{a ? `${a.startDate} → ${a.endDate}` : "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{origin?.name ?? "—"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {tempOutEmps.length > 0 && (
        <div className="border border-blue-100 rounded-2xl overflow-hidden">
          <div className="bg-blue-50 px-5 py-3 border-b border-blue-100 flex items-center justify-between">
            <span className="font-bold text-blue-800 text-xs flex items-center gap-1.5">
              <Calendar size={13} className="text-blue-500" />Nhân sự biệt phái đi ({tempOutEmps.length})
            </span>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold border-b">
              <th className="px-4 py-3 text-left">Nhân viên</th>
              <th className="px-4 py-3 text-left">Thời gian</th>
              <th className="px-4 py-3 text-left">Đơn vị tiếp nhận</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {tempOutEmps.map(emp => {
                const a = activeAsgn.find(a => a.employeeId === emp.id && a.type === "temporary")
                const dest = a ? orgNodes.find(n => n.id === a.nodeId) : null
                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-700">{emp.name}</td>
                    <td className="px-4 py-3 text-blue-600 font-medium">{a ? `${a.startDate} → ${a.endDate}` : "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{dest?.name ?? "—"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {tempInEmps.length === 0 && tempOutEmps.length === 0 && (
        <div className="py-12 text-center text-gray-400 text-sm">Không có biệt phái nào</div>
      )}
    </div>
  )


  const renderManager = () => (
    manager ? (
      <div className="flex items-start gap-5 p-1">
        {manager.photos?.[0]
          ? <img src={manager.photos[0]} alt={manager.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
          : <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">{initials(manager.name)}</div>
        }
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h4 className="font-black text-gray-800 text-lg">{manager.name}</h4>
            <span className="bg-red-100 text-[#C62828] text-xs font-bold px-2.5 py-0.5 rounded-full">{node.managerTitle || "Quản lý"}</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">{manager.id} · {manager.department}</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
            {[
              { label: "Email", value: manager.email },
              { label: "Điện thoại", value: manager.phone },
              { label: "Chức vụ", value: manager.position },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-gray-400">{label}</p>
                <p className="text-gray-700 font-semibold mt-0.5">{value || "—"}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setIsSetManagerOpen(true)}
            className="mt-4 flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold transition-colors">
            Thay đổi quản lý
          </button>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
          <User size={24} className="text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm font-bold mb-1">Chưa có quản lý</p>
        <p className="text-xs text-gray-400 mb-4">Đơn vị này chưa được giao quản lý</p>
        <button onClick={() => setIsSetManagerOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-xs font-bold transition-colors">
          <Plus size={13} /> Thiết lập quản lý
        </button>
      </div>
    )
  )


  const renderInfo = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-lg">
      {[
        { label: "Tên đơn vị", value: node.name },
        { label: "Mã đơn vị", value: node.code, mono: true },
        { label: "Phân cấp", value: theme.label },
        { label: "Ngày thành lập", value: node.createdDate || "—" },
        { label: "Người quản lý", value: manager?.name || "Chưa thiết lập" },
        { label: "Chức danh QL", value: node.managerTitle || "—" },
        { label: "Trạng thái", value: node.status === "active" ? "Đang hoạt động" : "Ngừng hoạt động" },
      ].map(({ label, value, mono }) => (
        <div key={label}>
          <p className="text-xs text-gray-400 mb-0.5">{label}</p>
          <p className={`text-sm font-semibold text-gray-700 ${mono ? "font-mono" : ""}`}>{value}</p>
        </div>
      ))}
      <div className="col-span-full pt-3 border-t border-gray-100">
        <button
          onClick={() => onStatusChange(node.id, node.status === "active" ? "inactive" : "active")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border
            ${node.status === "active" ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "border-green-200 text-green-700 hover:bg-green-50"}`}
        >
          {node.status === "active" ? "Tạm ngưng hoạt động" : "Kích hoạt lại"}
        </button>
      </div>
    </div>
  )


  const tabBadge = (id: TabId): number | null => {
    if (id === "children") return childNodes.length
    if (id === "personnel") return officialEmps.length
    if (id === "temp") {
      const n = tempInEmps.length + tempOutEmps.length
      return n > 0 ? n : null
    }
    return null
  }


  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-1 font-medium hover:text-[#C62828] transition-colors whitespace-nowrap">
          <ArrowLeft size={14} /> Cơ cấu
        </button>
        {ancestors.map(a => (
          <span key={a.id} className="flex items-center gap-1.5">
            <ChevronRight size={12} className="text-gray-300" />
            <button onClick={() => onSelectNode(a.id)} className="hover:text-[#C62828] transition-colors truncate max-w-[100px]">{a.name}</button>
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <ChevronRight size={12} className="text-gray-300" />
          <span className="font-bold text-gray-800 truncate max-w-[180px]">{node.name}</span>
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-black/[0.05] shadow-sm overflow-hidden">
        <div className={`h-1.5 bg-gradient-to-r ${theme.barGradient}`} />
        <div className="px-6 py-5 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border flex-shrink-0 ${theme.lightBg} ${theme.border}`}>
              <theme.Icon size={22} className={theme.textColor} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <h2 className="text-xl font-black text-gray-800">{node.name}</h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${theme.lightBg} ${theme.textColor}`}>{theme.label}</span>
                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{node.code}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${node.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {node.status === "active" ? "Hoạt động" : "Ngừng"}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-sm text-gray-500">
                <span>{manager ? `${node.managerTitle || "Quản lý"}: ${manager.name}` : "Chưa có quản lý"}</span>
                {statsChips.map((s, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs text-gray-400">
                    <span className="text-gray-300">·</span>
                    <span className="font-bold text-gray-700">{s.count}</span> {s.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 relative">
            <button onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
              <Edit2 size={13} /> Chỉnh sửa
            </button>
            {node.type !== "team" && (
              <button onClick={onAddChild}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-[#C62828]/20">
                <Plus size={13} /> Thêm con
              </button>
            )}
            <button onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors">
              <MoreVertical size={15} />
            </button>

            {showMenu && createPortal(
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-9 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 w-52 z-20">
                  <button
                    onClick={() => { onStatusChange(node.id, node.status === "active" ? "inactive" : "active"); setShowMenu(false) }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${node.status === "active" ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"}`}
                  >
                    {node.status === "active" ? "Tạm ngưng hoạt động" : "Kích hoạt lại"}
                  </button>
                  {(node.type !== "branch" || isSuperAdmin) && (
                  <button
                    onClick={() => { onDeleteNode(node.id); setShowMenu(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Xóa đơn vị này
                  </button>
                  )}
                </div>
              </>,
              document.body
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-0 border-t border-gray-100 overflow-x-auto">
          {tabs.map(t => {
            const badge = tabBadge(t.id)
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all whitespace-nowrap -mb-px
                  ${activeTab === t.id ? "border-[#C62828] text-[#C62828]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
              >
                {t.label}
                {badge !== null && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full
                    ${t.id === "temp" ? "bg-amber-100 text-amber-700" : activeTab === t.id ? "bg-[#C62828] text-white" : "bg-gray-100 text-gray-500"}`}>
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-3xl border border-black/[0.05] shadow-sm p-6">
        {activeTab === "children" && renderChildren()}
        {activeTab === "personnel" && renderPersonnel()}
        {activeTab === "temp" && renderTemp()}
        {activeTab === "manager" && renderManager()}
        {activeTab === "info" && renderInfo()}
      </div>

      <AssignMemberModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onAssign={onAssignMember}
        employees={scopedEmployees}
        orgNodes={orgNodes}
        currentNode={node}
      />
      <SetManagerModal
        isOpen={isSetManagerOpen}
        onClose={() => setIsSetManagerOpen(false)}
        employees={scopedEmployees}
        currentNode={node}
        currentManagerId={node.managerId}
        currentManagerTitle={node.managerTitle}
        onSave={(empId, title) => onAssignManager(node.id, empId, title)}
      />
    </div>
  )
}
