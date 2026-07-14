import React, { useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Search, Loader2, RefreshCw } from "lucide-react"
import { Employee } from "../../types"
import { AvatarCircle } from "../ui/AvatarCircle"
import UserProfile from "./UserProfile"
import { useEmployeeDirectory } from "../../hooks/useEmployeeDirectory"

export function UserDirectory() {
  const [search, setSearch] = useState("")
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)
  const { employees, loading, error, reload } = useEmployeeDirectory()

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return employees
    return employees.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.position.toLowerCase().includes(q) ||
      (e.email || "").toLowerCase().includes(q)
    )
  }, [employees, search])

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h2 className="text-xl font-bold text-gray-800">Danh bạ nội bộ</h2>
        <div className="flex items-center gap-2">
          <button onClick={reload} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <div className="relative w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nhân viên..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-[#C62828] focus:outline-none" />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Đang tải danh bạ...</span>
        </div>
      )}

      {!loading && list.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-16">Không tìm thấy nhân viên</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(emp => (
          <div key={emp.id} onClick={() => setSelectedEmp(emp)} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4 cursor-pointer hover:shadow-md transition-all active:scale-95 group">
            <div className="group-hover:scale-105 transition-transform"><AvatarCircle name={emp.name} /></div>
            <div className="min-w-0">
              <p className="font-bold text-gray-800 text-sm truncate">{emp.name}</p>
              <p className="text-xs text-gray-500 my-0.5">{emp.position} · {emp.department}</p>
              <span className="text-[#C62828] text-xs font-semibold block truncate opacity-70">{emp.email}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedEmp && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setSelectedEmp(null) }}>
          <div className="relative w-full max-w-5xl animate-in zoom-in duration-200">
            <div className="rounded-2xl pb-2">
              <UserProfile emp={selectedEmp} onClose={() => setSelectedEmp(null)} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
