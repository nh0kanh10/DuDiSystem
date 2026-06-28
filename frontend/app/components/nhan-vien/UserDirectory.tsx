import React, { useState } from "react"
import { Users, Phone, Mail, Search } from "lucide-react"
import { Employee } from "../../types"
import { INIT_EMPLOYEES } from "../../constants"
import { AvatarCircle } from "../ui/AvatarCircle"
import UserProfile from "./UserProfile"

export function UserDirectory() {
  const [search, setSearch] = useState("")
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)
  const list = INIT_EMPLOYEES.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Danh bạ nội bộ</h2>
        <div className="relative w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nhân viên..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-[#C62828] focus:outline-none" />
        </div>
      </div>
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

      {/* View Detail Modal for Directory */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setSelectedEmp(null) }}>
          <div className="relative w-full max-w-5xl animate-in zoom-in duration-200">
            {/* Unified User profile component rendered here */}
            <div className="rounded-2xl pb-2">
              <UserProfile emp={selectedEmp} onClose={() => setSelectedEmp(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
