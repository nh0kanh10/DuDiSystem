import { useState } from "react"
import { ZoomIn, ZoomOut, Maximize2, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Users, Building2, Clipboard, Settings, Briefcase, Users2 } from "lucide-react"
import { OrgNode, OrgNodeType, Employee } from "../../App"

interface OrgTreeViewProps {
  orgNodes: OrgNode[]
  employees: Employee[]
  onSelectNode: (nodeId: string) => void
  onAddChild: (parentId: string) => void
  onEditNode: (node: OrgNode) => void
  onDeleteNode: (nodeId: string) => void
}

export default function OrgTreeView({
  orgNodes,
  employees,
  onSelectNode,
  onAddChild,
  onEditNode,
  onDeleteNode
}: OrgTreeViewProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [expandedIds, setExpandedIds] = useState<string[]>(["branch-hcm", "dept-tech", "sub-dev", "dept-finance", "dept-sales", "dept-hr"])

  const rootNode = orgNodes.find(n => !n.parentId) || orgNodes[0]

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".node-card") || (e.target as HTMLElement).closest("button")) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5))
  const handleZoomReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleExpandAll = () => {
    setExpandedIds(orgNodes.map(n => n.id))
  }

  const handleCollapseToDepts = () => {
    const branchIds = orgNodes
      .filter(n => n.type === "branch")
      .map(n => n.id)
    setExpandedIds(branchIds)
  }

  const getManagerName = (managerId?: string) => {
    if (!managerId) return ""
    const emp = employees.find(e => e.id === managerId)
    return emp ? emp.name : ""
  }

  const getNodeStyles = (type: OrgNodeType) => {
    switch (type) {
      case "branch":
        return {
          border: "border-purple-400 hover:border-purple-600 shadow-sm hover:shadow-purple-100/50",
          iconBg: "bg-purple-100 text-purple-700",
          dot: "bg-purple-500",
          icon: <Building2 size={16} />
        }
      case "department":
        return {
          border: "border-orange-400 hover:border-orange-600 shadow-sm hover:shadow-orange-100/50",
          iconBg: "bg-orange-100 text-orange-700",
          dot: "bg-orange-500",
          icon: <Clipboard size={16} />
        }
      case "sub-department":
        return {
          border: "border-green-400 hover:border-green-600 shadow-sm hover:shadow-green-100/50",
          iconBg: "bg-green-100 text-green-700",
          dot: "bg-green-500",
          icon: <Settings size={16} />
        }
      case "position":
        return {
          border: "border-blue-400 hover:border-blue-600 shadow-sm hover:shadow-blue-100/50",
          iconBg: "bg-blue-100 text-blue-700",
          dot: "bg-blue-500",
          icon: <Briefcase size={16} />
        }
      case "team":
        return {
          border: "border-pink-400 hover:border-pink-600 shadow-sm hover:shadow-pink-100/50",
          iconBg: "bg-pink-100 text-pink-700",
          dot: "bg-pink-500",
          icon: <Users2 size={16} />
        }
    }
  }

  const renderCard = (node: OrgNode) => {
    if (!node) return null
    const isRoot = !node.parentId
    const managerName = getManagerName(node.managerId)
    const hasChildren = orgNodes.some(n => n.parentId === node.id)
    const isExpanded = expandedIds.includes(node.id)
    const styles = getNodeStyles(node.type) ?? {
      border: "border-gray-300", iconBg: "bg-gray-100 text-gray-600",
      dot: "bg-gray-400", icon: <Building2 size={16} />
    }

    if (isRoot) {
      return (
        <div className="flex flex-col items-center">
          <div className="node-card relative group bg-white border border-purple-400 rounded-2xl shadow-sm p-4 w-72 transition-all hover:border-purple-600 hover:shadow-md hover:scale-[1.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 size={20} />
              </div>
              <div className="flex-1 min-w-0 text-left cursor-pointer" onClick={() => onSelectNode(node.id)}>
                <p className="font-black text-gray-800 text-sm truncate">{node.name}</p>
                <p className="text-[9px] font-bold text-red-700/80 mt-1 uppercase tracking-wider leading-none">CEO</p>
                <p className="text-xs font-semibold text-gray-500 mt-0.5 truncate">{managerName || "Trần Quang Huy"}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-xs font-bold text-gray-600">
                {node.memberCount}
              </div>
            </div>

            <div className="absolute -top-3 right-4 bg-white border border-gray-200 shadow-sm rounded-lg py-1 px-2 hidden group-hover:flex items-center gap-1.5 z-20">
              <button
                type="button"
                onClick={() => onAddChild(node.id)}
                className="p-1 hover:bg-gray-100 rounded text-green-600"
                title="Thêm cấp con"
              >
                <Plus size={14} />
              </button>
              <button
                type="button"
                onClick={() => onEditNode(node)}
                className="p-1 hover:bg-gray-100 rounded text-blue-600"
                title="Chỉnh sửa"
              >
                <Edit2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )
    }

    const showCompact = node.type === "position" || node.type === "team"

    return (
      <div className="flex flex-col items-center">
        <div className={`node-card relative group bg-white border ${styles.border} rounded-2xl shadow-sm transition-all hover:shadow-md hover:scale-[1.02] ${showCompact ? "p-3 w-44" : "p-4 w-64"}`}>
          {showCompact ? (
            <div className="text-center cursor-pointer" onClick={() => onSelectNode(node.id)}>
              <p className="font-bold text-gray-800 text-xs truncate">{node.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                {node.type === "position" ? "Vị trí" : "Nhóm"}
              </p>
              <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-50 rounded-lg py-1">
                <Users size={11} /> {node.memberCount}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}>
                {styles.icon}
              </div>
              <div className="flex-1 min-w-0 text-left cursor-pointer" onClick={() => onSelectNode(node.id)}>
                <p className="font-black text-gray-800 text-xs truncate">{node.name}</p>
                {node.managerTitle ? (
                  <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider leading-none">{node.managerTitle}</p>
                ) : (
                  <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider leading-none">Quản lý</p>
                )}
                <p className="text-[10px] font-semibold text-gray-500 mt-0.5 truncate">{managerName || "Võ Bá Thành Nhân"}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-lg px-1.5 py-0.5 text-[10px] font-bold text-gray-600">
                {node.memberCount}
              </div>
            </div>
          )}

          <div className="absolute -top-3 right-4 bg-white border border-gray-200 shadow-sm rounded-lg py-1 px-2 hidden group-hover:flex items-center gap-1.5 z-20">
            {node.type !== "team" && (
              <button
                type="button"
                onClick={() => onAddChild(node.id)}
                className="p-1 hover:bg-gray-100 rounded text-green-600"
                title="Thêm cấp con"
              >
                <Plus size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onEditNode(node)}
              className="p-1 hover:bg-gray-100 rounded text-blue-600"
              title="Chỉnh sửa"
            >
              <Edit2 size={12} />
            </button>
            <button
              type="button"
              onClick={() => onDeleteNode(node.id)}
              className="p-1 hover:bg-gray-100 rounded text-red-600"
              title="Xóa"
            >
              <Trash2 size={12} />
            </button>
          </div>

          {hasChildren && (
            <button
              onClick={() => toggleExpand(node.id)}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-gray-600 transition-colors z-20"
            >
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderTree = (node: OrgNode): React.ReactNode => {
    const isExpanded = expandedIds.includes(node.id)
    const children = orgNodes.filter(n => n.parentId === node.id)
    const hasVisibleChildren = children.length > 0 && isExpanded

    return (
      <div className="flex flex-col items-center">
        {renderCard(node)}
        {hasVisibleChildren && (
          <div className="flex flex-col items-center w-full mt-6">
            <div className="w-0.5 h-6 bg-gray-200 -mt-6"></div>
            <div className="flex w-full">
              {children.map((child, index) => {
                const isFirst = index === 0
                const isLast = index === children.length - 1
                return (
                  <div key={child.id} className="flex-1 flex flex-col items-center relative px-6">
                    <div
                      className="absolute top-0 left-0 right-0 h-0.5 bg-gray-200"
                      style={{
                        left: isFirst ? "50%" : "0%",
                        right: isLast ? "50%" : "0%"
                      }}
                    />
                    <div className="w-0.5 h-6 bg-gray-200 z-10"></div>
                    <div className="pt-2 w-full flex justify-center">
                      {renderTree(child)}
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

  return (
    <div className="relative border border-black/[0.05] rounded-3xl bg-white h-[650px] overflow-hidden select-none shadow-inner">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50/50"></div>

      <div
        className={`absolute inset-0 cursor-grab flex items-center justify-center p-20 ${isDragging ? "cursor-grabbing" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.15s ease-out"
          }}
          className="flex flex-col items-center origin-center"
        >
          {rootNode ? renderTree(rootNode) : (
            <div className="text-gray-400 text-sm">Đang tải dữ liệu...</div>
          )}
        </div>
      </div>

      <div className="absolute right-6 top-6 flex gap-2 z-30">
        <button
          onClick={handleCollapseToDepts}
          className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-md text-xs font-bold text-gray-700 transition-all active:scale-95 flex items-center"
        >
          Thu gọn phòng ban
        </button>
        <button
          onClick={handleExpandAll}
          className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-md text-xs font-bold text-gray-700 transition-all active:scale-95 flex items-center"
        >
          Bung tất cả
        </button>
      </div>

      <div className="absolute left-6 top-6 bg-white rounded-2xl shadow-md border border-gray-100 p-1.5 flex flex-col gap-1 z-30">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-500"
          title="Phóng to"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-500"
          title="Thu nhỏ"
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={handleZoomReset}
          className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-500 border-t border-gray-50"
          title="Thu nhỏ vừa khung hình"
        >
          <Maximize2 size={18} />
        </button>
      </div>

      <div className="absolute left-6 bottom-6 bg-white rounded-2xl shadow-md border border-gray-100 px-4 py-3 flex gap-4 text-xs font-semibold text-gray-600 z-30">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>Chi nhánh</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span>Phòng ban</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span>Bộ phận</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Vị trí</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
          <span>Nhóm</span>
        </div>
      </div>
    </div>
  )
}
