import { X, Users, Mail, Phone, Briefcase, Award } from "lucide-react"
import { OrgNode, Employee, Assignment } from "../../types"

interface ViewMembersModalProps {
  isOpen: boolean
  onClose: () => void
  node: OrgNode | null
  orgNodes: OrgNode[]
  employees: Employee[]
  assignments: Assignment[]
}

export default function ViewMembersModal({
  isOpen,
  onClose,
  node,
  orgNodes,
  employees,
  assignments
}: ViewMembersModalProps) {
  if (!isOpen || !node) return null

  // Helper to get descendant IDs
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

  const descendants = getDescendants(node.id, orgNodes)
  const descendantIds = [node.id, ...descendants.map(d => d.id)]

  // Filter employees belonging to these nodes
  const members = employees.filter(e => {
    const empNodeIds = [
      e.orgNodeId,
      ...assignments.filter(as => as.employeeId === e.id && as.status === "active").map(as => as.nodeId)
    ].filter(Boolean)
    return empNodeIds.some(nodeId => descendantIds.includes(nodeId!))
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 text-[#C62828] rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <span>Nhân sự trực thuộc</span>
                <span className="bg-red-50 text-[#C62828] border border-red-100 text-xs px-2 py-0.5 rounded-full font-bold">
                  {members.length}
                </span>
              </h3>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">{node.name} &middot; [{node.code}]</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* List of members */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map(emp => {
                const isManager = node.managerId === emp.id
                return (
                  <div key={emp.id} className={`p-4 rounded-2xl border transition-all flex items-start gap-3 hover:shadow-sm ${isManager ? "border-red-200 bg-red-50/10 font-bold" : "border-gray-100 bg-white"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isManager ? "bg-[#C62828] text-white" : "bg-gray-100 text-gray-600"}`}>
                      {emp.name.split(" ").pop()?.charAt(0) ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-gray-800 text-sm truncate">{emp.name}</p>
                        {isManager && (
                          <span className="px-1.5 py-0.2 bg-red-100 text-[#C62828] rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                            <Award size={8} /> Quản lý
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-semibold mt-0.5 flex items-center gap-1">
                        <Briefcase size={11} className="flex-shrink-0 text-gray-400" />
                        <span className="truncate">{emp.position} &middot; {emp.department}</span>
                      </p>
                      <div className="mt-2.5 space-y-1 text-[11px] text-gray-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Mail size={11} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate">{emp.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone size={11} className="text-gray-400 flex-shrink-0" />
                          <span>{emp.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Users size={48} className="mx-auto text-gray-300 stroke-1 mb-3" />
              <p className="text-gray-400 text-sm font-semibold">Không có nhân sự trực thuộc tại đơn vị này</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm">
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
