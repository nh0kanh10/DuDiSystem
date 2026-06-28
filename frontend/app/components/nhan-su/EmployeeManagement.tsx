import React, { useState, useMemo, useEffect } from "react"
import { 
  Plus, Search, Edit2, Trash2, X, AlertCircle, Check, 
  Briefcase, Mail, Phone, Calendar, Shield, CreditCard, 
  MapPin, GraduationCap, FileText, Settings, Upload, Camera, Building2,
  Download, MoreHorizontal, Eye, Users
} from "lucide-react"
import { Employee, EmpExtForm } from "../../types"
import { api } from "@/lib/api"
import { AvatarCircle } from "../ui/AvatarCircle"
import { Badge } from "../ui/Badge"
import { initials } from "../../utils"
import UserProfile from "../nhan-vien/UserProfile"

export function EmployeeManagement({
  employees, setEmployees, orgNodes = [], selectedBranch = "all", onBranchChange
}: {
  employees: Employee[]
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>
  orgNodes?: { id: string; name: string; type?: string }[]
  selectedBranch?: string
  onBranchChange?: (b: string) => void
}) {
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDept, setFilterDept] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [viewEmp, setViewEmp] = useState<Employee | null>(null)
  const [editEmp, setEditEmp] = useState<Employee | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [form, setForm] = useState<EmpExtForm>({
    name: "", email: "", phone: "", department: "", position: "",
    joinDate: "", status: "active", contractType: "Chính thức",
    cccd: "", cccdDate: "", cccdPlace: "", bankAccount: "", bank: "",
    dob: "", gender: "Nam",
    curProvince: "", curDistrict: "", curWard: "", curStreet: "",
    homeProvince: "", homeDistrict: "", homeWard: "", homeStreet: "",
    workHistory: [{ id: 1, fromDate: "", toDate: "", title: "" }],
    internEndDate: "", university: "", notes: "", resignDate: "",
  })

  const branches = orgNodes.filter(n => n.type === "branch")

  const filtered = employees.filter(e => {
    const q = search.toLowerCase()
    const matchQ = e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
    const matchS = filterStatus === "all" || e.status === filterStatus
    const matchD = filterDept === "all" || e.department === filterDept
    const matchB = selectedBranch === "all" || (e as any).branchId === selectedBranch
    return matchQ && matchS && matchD && matchB
  })

  const todayStr = (() => {
    const d = new Date()
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
  })()

  const blankForm = (): EmpExtForm => ({
    name: "", email: "", phone: "", department: "", position: "",
    joinDate: todayStr, status: "active", contractType: "Chính thức",
    cccd: "", cccdDate: "", cccdPlace: "", bankAccount: "", bank: "",
    dob: "", gender: "Nam",
    curProvince: "", curDistrict: "", curWard: "", curStreet: "",
    homeProvince: "", homeDistrict: "", homeWard: "", homeStreet: "",
    workHistory: [{ id: Date.now(), fromDate: "", toDate: "", title: "" }],
    internEndDate: "", university: "", notes: "", resignDate: "",
  })

  const openAdd = () => { setEditEmp(null); setForm(blankForm()); setShowModal(true) }
  const openEdit = (emp: Employee) => {
    setEditEmp(emp)
    setForm({ ...blankForm(), ...emp })
    setShowModal(true)
  }
  const handleSave = () => {
    const base = { name: form.name, email: form.email, phone: form.phone, department: form.department, position: form.position, joinDate: form.joinDate, status: form.status, contractType: form.contractType }
    if (editEmp) {
      setEmployees(prev => prev.map(e => e.id === editEmp.id ? { ...e, ...base } : e))
    } else {
      const newId = `NV${String(employees.length + 1).padStart(3, "0")}`
      setEmployees(prev => [...prev, { id: newId, ...base }])
    }
    setShowModal(false)
  }
  const sf = (k: keyof EmpExtForm, v: string) => setForm(p => ({ ...p, [k]: v }))
  const addWorkRow = () => setForm(p => ({ ...p, workHistory: [...p.workHistory, { id: Date.now(), fromDate: "", toDate: "", title: "" }] }))
  const removeWorkRow = (id: number) => setForm(p => ({ ...p, workHistory: p.workHistory.filter(r => r.id !== id) }))
  const updateWorkRow = (id: number, k: "fromDate" | "toDate" | "title", v: string) =>
    setForm(p => ({ ...p, workHistory: p.workHistory.map(r => r.id === id ? { ...r, [k]: v } : r) }))
  const handleDelete = (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa nhân viên này?")) {
      setEmployees(prev => prev.filter(e => e.id !== id))
    }
  }

  const depts = ["all", ...Array.from(new Set(employees.map(e => e.department)))]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý nhân sự</h2>
          <p className="text-sm text-gray-400 mt-0.5">Tổng {employees.length} nhân viên · {employees.filter(e => e.status === "active").length} đang làm</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download size={15} /> Xuất Excel
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-sm font-bold transition-colors shadow-sm shadow-[#C62828]/20">
            <Plus size={15} /> Thêm nhân viên
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/[0.06] flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên, ID, email..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 focus:ring-1 focus:ring-[#C62828]/10 transition-all" />
        </div>
        {branches.length > 0 && (
          <select
            value={selectedBranch}
            onChange={e => onBranchChange?.(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 text-gray-600 font-medium">
            <option value="all">Tất cả chi nhánh</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 text-gray-600">
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang làm</option>
          <option value="inactive">Nghỉ việc</option>
          <option value="intern">Thực tập</option>
        </select>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 text-gray-600">
          <option value="all">Tất cả phòng ban</option>
          {depts.filter(d => d !== "all").map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-gray-400 text-xs border-b border-gray-100">
                <th className="px-4 py-3.5 text-left font-semibold w-10">STT</th>
                <th className="px-4 py-3.5 text-left font-semibold">Mã NV</th>
                <th className="px-4 py-3.5 text-left font-semibold">Họ và tên</th>
                <th className="px-4 py-3.5 text-left font-semibold">Phòng ban</th>
                <th className="px-4 py-3.5 text-left font-semibold">Chức vụ</th>
                <th className="px-4 py-3.5 text-left font-semibold">Ngày vào làm</th>
                <th className="px-4 py-3.5 text-left font-semibold">Hợp đồng</th>
                <th className="px-4 py-3.5 text-left font-semibold">Trạng thái</th>
                <th className="px-4 py-3.5 text-left font-semibold sticky right-0 bg-gray-50/80">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((emp, idx) => (
                <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-4 text-xs text-gray-400 font-semibold">{idx + 1}</td>
                  <td className="px-4 py-4 font-mono text-xs text-gray-400 font-medium whitespace-nowrap">{emp.id}</td>
                  <td className="px-4 py-4 min-w-[180px]">
                    <div className="flex items-center gap-3">
                      <AvatarCircle name={emp.name} />
                      <div>
                        <p className="font-semibold text-gray-700 text-sm whitespace-nowrap">{emp.name}</p>
                        <p className="text-xs text-gray-400">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600 text-xs font-medium whitespace-nowrap">{emp.department}</td>
                  <td className="px-4 py-4 text-gray-500 text-xs whitespace-nowrap">{emp.position}</td>
                  <td className="px-4 py-4 text-gray-400 text-xs font-mono whitespace-nowrap">{emp.joinDate}</td>
                  <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">{emp.contractType}</td>
                  <td className="px-4 py-4"><Badge status={emp.status} /></td>
                  <td className={`px-4 py-4 sticky right-0 bg-white ${openMenu === emp.id ? "z-50" : "z-0"}`}>
                    <div className="relative" onMouseLeave={() => setOpenMenu(null)}>
                      <button onClick={() => setOpenMenu(openMenu === emp.id ? null : emp.id)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl text-gray-500 transition-colors transition-transform active:scale-95" title="Thao tác">
                        <MoreHorizontal size={16} />
                      </button>
                      {openMenu === emp.id && (
                        <div className="absolute right-0 top-full pt-1 z-50">
                          <div className="w-44 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-black/5 overflow-hidden" style={{ animation: "popup 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                            <button onClick={() => { setViewEmp(emp); setOpenMenu(null) }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                              <Eye size={15} className="text-gray-400" /> Xem chi tiết
                            </button>
                            <button onClick={() => { openEdit(emp); setOpenMenu(null) }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                              <Edit2 size={15} className="text-gray-400" /> Sửa hồ sơ
                            </button>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button onClick={() => { handleDelete(emp.id); setOpenMenu(null) }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-sm text-red-600 font-medium transition-colors">
                              <Trash2 size={15} className="text-red-400" /> Xóa
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Không tìm thấy nhân viên</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal — full-detail form */}
      {showModal && (() => {
        const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/50 focus:ring-1 focus:ring-[#C62828]/10 transition-all text-gray-700"
        const sel = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/50 text-gray-700 bg-white"
        const lbl = "block text-xs font-semibold text-gray-500 mb-1.5"
        const sec = "bg-white border border-gray-100 rounded-2xl p-5 space-y-4"
        const newId = `NV${String(employees.length + 1).padStart(3, "0")}`
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
            <div className="bg-[#F5F1EF] rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[95vh]">

              {/* Header */}
              <div className="bg-gradient-to-r from-[#C62828] to-[#E64A19] px-6 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
                <h3 className="text-white font-bold text-lg">{editEmp ? "Sửa nhân viên" : "Thêm nhân viên mới"}</h3>
                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition-colors"><X size={20} /></button>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 p-5 space-y-4">

                {/* ── SECTION 1: Avatar + Personal info ── */}
                <div className={sec}>
                  <div className="flex gap-6">
                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white text-2xl font-black">
                        {form.name ? initials(form.name) : "?"}
                      </div>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors">
                        <Upload size={12} /> Tải ảnh đại diện
                      </button>
                      <p className="text-[10px] text-gray-400">Hỗ trợ: JPG, PNG, GIF</p>
                    </div>

                    {/* Fields grid */}
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Mã nhân viên</label>
                        <div className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 font-mono">
                          {editEmp ? editEmp.id : newId}
                          {!editEmp && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-sans font-semibold">Tự động</span>}
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Họ và tên *</label>
                        <input value={form.name} onChange={e => sf("name", e.target.value)} placeholder="Nguyễn Văn A" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Số CCCD *</label>
                        <input value={form.cccd} onChange={e => sf("cccd", e.target.value)} placeholder="012345678901" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Ngày cấp CCCD</label>
                        <input value={form.cccdDate} onChange={e => sf("cccdDate", e.target.value)} placeholder="dd/mm/yyyy" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Nơi cấp CCCD</label>
                        <input value={form.cccdPlace} onChange={e => sf("cccdPlace", e.target.value)} placeholder="Cục CSQLHC..." className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Số tài khoản</label>
                        <input value={form.bankAccount} onChange={e => sf("bankAccount", e.target.value)} placeholder="0123456789" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Ngân hàng</label>
                        <input value={form.bank} onChange={e => sf("bank", e.target.value)} placeholder="Vietcombank..." className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Ngày sinh</label>
                        <input value={form.dob} onChange={e => sf("dob", e.target.value)} placeholder="dd/mm/yyyy" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Giới tính</label>
                        <select value={form.gender} onChange={e => sf("gender", e.target.value)} className={sel}>
                          <option>Nam</option><option>Nữ</option><option>Khác</option>
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Số điện thoại</label>
                        <input value={form.phone} onChange={e => sf("phone", e.target.value)} placeholder="09xx xxx xxx" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Email</label>
                        <input value={form.email} onChange={e => sf("email", e.target.value)} placeholder="email@dudi.vn" className={inp} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SECTION 2: Thư viện ảnh ── */}
                <div className={sec}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600 font-bold text-sm">
                      <Camera size={16} /> Thư viện ảnh
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-400 text-blue-500 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors">
                      + Thêm ảnh
                    </button>
                  </div>
                  <div className="py-6 text-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">Chưa có ảnh nào</div>
                </div>

                {/* ── SECTION 3: Địa chỉ hiện tại ── */}
                <div className={sec}>
                  <p className="font-bold text-gray-700 text-sm">Địa chỉ hiện tại</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className={lbl}>Tỉnh / Thành phố</label>
                      <select value={form.curProvince} onChange={e => sf("curProvince", e.target.value)} className={sel}>
                        <option value="">Chọn tỉnh/TP</option>
                        {["Thành phố Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Bình Dương", "Long An"].map(v => <option key={v}>{v}</option>)}
                      </select></div>
                    <div><label className={lbl}>Quận / Huyện</label>
                      <input value={form.curDistrict} onChange={e => sf("curDistrict", e.target.value)} placeholder="Quận/Huyện" className={inp} /></div>
                    <div><label className={lbl}>Phường / Xã</label>
                      <input value={form.curWard} onChange={e => sf("curWard", e.target.value)} placeholder="Phường/Xã" className={inp} /></div>
                  </div>
                  <div><label className={lbl}>Số nhà, tên đường</label>
                    <input value={form.curStreet} onChange={e => sf("curStreet", e.target.value)} placeholder="VD: 60/3 Đường số 5" className={inp} /></div>
                </div>

                {/* ── SECTION 4: Quê quán ── */}
                <div className={sec}>
                  <p className="font-bold text-gray-700 text-sm">Quê quán</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className={lbl}>Tỉnh / Thành phố</label>
                      <select value={form.homeProvince} onChange={e => sf("homeProvince", e.target.value)} className={sel}>
                        <option value="">Chọn tỉnh/TP</option>
                        {["Thành phố Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Long An", "Tiền Giang", "Đồng Tháp", "An Giang"].map(v => <option key={v}>{v}</option>)}
                      </select></div>
                    <div><label className={lbl}>Quận / Huyện</label>
                      <input value={form.homeDistrict} onChange={e => sf("homeDistrict", e.target.value)} placeholder="Huyện/Quận" className={inp} /></div>
                    <div><label className={lbl}>Xã / Phường</label>
                      <input value={form.homeWard} onChange={e => sf("homeWard", e.target.value)} placeholder="Xã/Phường" className={inp} /></div>
                  </div>
                  <div><label className={lbl}>Địa chỉ cụ thể</label>
                    <input value={form.homeStreet} onChange={e => sf("homeStreet", e.target.value)} placeholder="Ấp, xóm..." className={inp} /></div>
                </div>

                {/* ── SECTION 5: Quá trình công tác ── */}
                <div className={sec}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700 font-bold text-sm">
                      <Briefcase size={15} /> Quá trình công tác
                    </div>
                    <button onClick={addWorkRow} className="flex items-center gap-1 px-3 py-1.5 border border-[#C62828] text-[#C62828] rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors">
                      + Thêm dòng
                    </button>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 rounded-lg text-xs text-gray-500">
                        <th className="px-3 py-2 text-left font-semibold rounded-l-lg">Từ ngày</th>
                        <th className="px-3 py-2 text-left font-semibold">Đến ngày</th>
                        <th className="px-3 py-2 text-left font-semibold rounded-r-lg">Chức vụ</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.workHistory.map(row => (
                        <tr key={row.id}>
                          <td className="py-1.5 pr-2"><input value={row.fromDate} onChange={e => updateWorkRow(row.id, "fromDate", e.target.value)} placeholder="dd/mm/yyyy" className={inp} /></td>
                          <td className="py-1.5 pr-2"><input value={row.toDate} onChange={e => updateWorkRow(row.id, "toDate", e.target.value)} placeholder="dd/mm/yyyy" className={inp} /></td>
                          <td className="py-1.5 pr-2"><input value={row.title} onChange={e => updateWorkRow(row.id, "title", e.target.value)} placeholder="Chức vụ" className={inp} /></td>
                          <td className="py-1.5">
                            <button onClick={() => removeWorkRow(row.id)} className="w-7 h-7 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors">
                              <X size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── SECTION 6: Thông tin làm việc ── */}
                <div className={sec}>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lbl}>Vị trí công việc</label>
                      <input value={form.position} onChange={e => sf("position", e.target.value)} placeholder="Intern / Developer..." className={inp} /></div>
                    <div><label className={lbl}>Phòng ban</label>
                      <select value={form.department} onChange={e => sf("department", e.target.value)} className={sel}>
                        <option value="">Chọn phòng ban</option>
                        {["Frontend", "Backend", "Design", "PM", "HR", "DevOps", "QA", "Kỹ thuật", "Kinh doanh", "Marketing"].map(d => <option key={d}>{d}</option>)}
                      </select></div>
                    <div><label className={lbl}>Ngày bắt đầu làm việc</label>
                      <input value={form.joinDate} onChange={e => sf("joinDate", e.target.value)} placeholder="dd/mm/yyyy" className={inp} /></div>
                    <div><label className={lbl}>Ngày kết thúc thực tập</label>
                      <input value={form.internEndDate} onChange={e => sf("internEndDate", e.target.value)} placeholder="dd/mm/yyyy" className={inp} /></div>
                    <div className="col-span-2"><label className={lbl}>Trường đại học</label>
                      <input value={form.university} onChange={e => sf("university", e.target.value)} placeholder="Tên trường..." className={inp} /></div>
                    <div className="col-span-2"><label className={lbl}>Ghi chú</label>
                      <textarea value={form.notes} onChange={e => sf("notes", e.target.value)} rows={2} placeholder="Ghi chú thêm..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/50 resize-none text-gray-700" /></div>
                    <div><label className={lbl}>Loại hợp đồng</label>
                      <select value={form.contractType} onChange={e => sf("contractType", e.target.value)} className={sel}>
                        {["Chính thức", "Thực tập", "Part-time", "CTV"].map(t => <option key={t}>{t}</option>)}
                      </select></div>
                    <div><label className={lbl}>Trạng thái</label>
                      <select value={form.status} onChange={e => sf("status", e.target.value as Employee["status"])} className={sel}>
                        <option value="active">Đang làm</option>
                        <option value="inactive">Nghỉ việc</option>
                        <option value="intern">Thực tập</option>
                      </select></div>
                    {form.status === "inactive" && (
                      <div className="col-span-2"><label className={lbl}>Ngày nghỉ việc</label>
                        <input value={form.resignDate} onChange={e => sf("resignDate", e.target.value)} placeholder="dd/mm/yyyy" className={inp} /></div>
                    )}
                  </div>
                </div>

              </div>{/* end scroll body */}

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-white rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-xl text-sm font-bold transition-colors">Hủy</button>
                <button onClick={handleSave} className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
                  {editEmp ? "Lưu" : "Thêm"}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* View Detail Modal */}
      {viewEmp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setViewEmp(null) }}>
          <div className="relative w-full max-w-5xl animate-in zoom-in duration-200">
            {/* Unified User profile component rendered here */}
            <div className="mb-2">
              <UserProfile emp={viewEmp} onEdit={() => { setViewEmp(null); openEdit(viewEmp) }} onClose={() => setViewEmp(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ATTENDANCE MANAGEMENT ────────────────────────────────────────────────────
