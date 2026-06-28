import React, { useState, useEffect, useMemo, useRef } from "react"
import { Search, Lock, Unlock, KeyRound, UserX, UserCheck, X, Copy, Edit2, Trash2, Plus, RefreshCw, Shield, Briefcase, User } from "lucide-react"
import { api } from "../../../lib/api"
import { CustomSelect } from "../ui/CustomSelect"
import { CustomCombobox } from "../ui/CustomCombobox"

interface UserRecord {
  id: string
  employeeId: string | null
  email: string
  role: "admin" | "manager" | "user"
  status: "active" | "locked"
  name: string
  branchId: string
  branchName: string
}

export default function AccountManagement({ selectedBranch = "all", currentUserEmail = "", currentUserRole = "user" }: { selectedBranch?: string; currentUserEmail?: string; currentUserRole?: string }) {
  const [accounts, setAccounts] = useState<UserRecord[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [orgNodes, setOrgNodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [branchFilter, setBranchFilter] = useState(selectedBranch)
  const [deptFilter, setDeptFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")



  const [showModal, setShowModal] = useState(false)
  const [editingAcc, setEditingAcc] = useState<UserRecord | null>(null)
  const [form, setForm] = useState({
    email: "",
    role: "user" as "admin" | "manager" | "user",
    employeeId: "",
    scopeId: ""
  })

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [resetSuccess, setResetSuccess] = useState<{ email: string; rawPass: string } | null>(null)

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [uList, eList, nList] = await Promise.all([
        api.users.list(),
        api.employees.list(),
        api.orgNodes.list()
      ])
      setAccounts(uList)
      setEmployees(eList)
      setOrgNodes(nList)
    } catch (err: any) {
      showToast(err.message || "Lỗi tải dữ liệu", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedBranch !== "all") {
      setBranchFilter(selectedBranch)
    }
  }, [selectedBranch])



  const branchFilteredEmployees = useMemo(() => {
    return employees.filter(e => {
      if (branchFilter === "all") return true
      return e.branchId === branchFilter
    })
  }, [employees, branchFilter])

  const totalEmployeesCount = branchFilteredEmployees.length
  const activeEmployeesCount = branchFilteredEmployees.filter(e => e.status === "active" || e.status === "intern").length
  const resignedEmployeesCount = branchFilteredEmployees.filter(e => e.status === "inactive").length
  
  const lockedAccountsCount = useMemo(() => {
    return accounts.filter(a => {
      const matchBranch = branchFilter === "all" || a.branchId === branchFilter
      return matchBranch && a.status === "locked"
    }).length
  }, [accounts, branchFilter])

  const departments = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department).filter(Boolean))) as string[]
  }, [employees])

  const branches = useMemo(() => {
    return orgNodes.filter(n => n.type === "branch")
  }, [orgNodes])

  const filteredEmployees = useMemo(() => {
    return branchFilteredEmployees.filter(e => {
      if (deptFilter !== "all" && e.department !== deptFilter) {
        return false
      }
      if (search.trim() !== "") {
        const q = search.toLowerCase()
        if (!e.name.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) {
          return false
        }
      }
      if (statusFilter !== "all") {
        if (statusFilter === "active") {
          if (e.status !== "active" && e.status !== "intern") return false
        } else if (statusFilter === "inactive") {
          if (e.status !== "inactive") return false
        }
      }
      return true
    })
  }, [branchFilteredEmployees, deptFilter, search, statusFilter])

  const handleEmployeeChange = (empId: string) => {
    const emp = employees.find(e => e.id === empId)
    setForm(p => ({
      ...p,
      employeeId: empId,
      email: emp ? emp.email : p.email,
      role: emp 
        ? (emp.position?.toLowerCase().includes("trưởng") || emp.position?.toLowerCase().includes("quản lý") ? "manager" : "user")
        : p.role
    }))
  }

  const handleOpenCreate = () => {
    setEditingAcc(null)
    setForm({ email: "", role: "user", employeeId: "", scopeId: "" })
    setShowModal(true)
  }

  const handleOpenCreateForEmployee = (empId: string) => {
    setEditingAcc(null)
    const emp = employees.find(e => e.id === empId)
    const role = emp ? (emp.position?.toLowerCase().includes("trưởng") || emp.position?.toLowerCase().includes("quản lý") ? "manager" : "user") : "user"
    setForm({
      employeeId: empId,
      email: emp ? emp.email : "",
      role,
      scopeId: emp?.branchId ?? ""
    })
    setShowModal(true)
  }

  const handleOpenEdit = (acc: UserRecord) => {
    setEditingAcc(acc)
    setForm({
      email: acc.email,
      role: acc.role,
      employeeId: acc.employeeId || "",
      scopeId: (acc as any).branchId || ""
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const loginIdentifier = form.employeeId ? form.employeeId : form.email
    if (!loginIdentifier.trim()) {
      showToast("Tài khoản đăng nhập là bắt buộc", "error")
      return
    }
    try {
      if (editingAcc) {
        await api.users.update(editingAcc.id, {
          email: loginIdentifier,
          role: form.role,
          employeeId: form.employeeId || null,
          scopeId: form.role === "manager" ? form.scopeId : null
        })
        showToast("Cập nhật tài khoản thành công")
        loadData()
        setShowModal(false)
      } else {
        const res = await api.users.create({
          email: loginIdentifier,
          role: form.role,
          employeeId: form.employeeId || null,
          scopeId: form.role === "manager" ? form.scopeId : null
        })
        loadData()
        setShowModal(false)
        setResetSuccess({ email: res.email, rawPass: res.rawPassword })
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi xử lý", "error")
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      await api.users.toggleStatus(id)
      showToast("Thay đổi trạng thái tài khoản thành công")
      loadData()
    } catch (err: any) {
      showToast(err.message || "Lỗi xử lý", "error")
    }
  }

  const handleResetPassword = async (acc: UserRecord) => {
    try {
      const res = await api.users.resetPassword(acc.id)
      setResetSuccess({ email: acc.email, rawPass: res.rawPassword })
    } catch (err: any) {
      showToast(err.message || "Lỗi xử lý", "error")
    }
  }

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản này không?")) return
    try {
      await api.users.delete(id)
      showToast("Đã xóa tài khoản")
      loadData()
    } catch (err: any) {
      showToast(err.message || "Lỗi xóa tài khoản", "error")
    }
  }

  const handleCopyPass = () => {
    if (resetSuccess) {
      navigator.clipboard.writeText(resetSuccess.rawPass)
      showToast("Đã sao chép mật khẩu vào bộ nhớ tạm")
    }
  }

  const initials = (name: string) => {
    if (!name || name === "—") return "U"
    const words = name.trim().split(" ")
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }

  const assignedEmployeeIds = accounts.map(a => a.employeeId).filter(Boolean) as string[]

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed bottom-24 right-6 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-[60] border backdrop-blur-sm animate-in slide-in-from-right duration-300
          ${toast.type === "success" ? "bg-gray-900/95 text-white border-white/10" : "bg-red-900/95 text-white border-red-500/20"}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${toast.type === "success" ? "bg-emerald-400" : "bg-red-400"} animate-pulse`} />
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {resetSuccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4 border border-emerald-100">
              <Lock size={20} />
            </div>
            <h3 className="text-lg font-black text-gray-800">Đặt lại mật khẩu</h3>
            <p className="text-xs text-gray-400 mt-1">Đã cấu hình mật khẩu mặc định cho</p>
            <p className="text-sm font-black text-[#C62828] mt-0.5">{resetSuccess.email}</p>
            
            <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-3">
              <span className="text-xs text-gray-500 font-bold">Mật khẩu mới:</span>
              <span className="text-sm font-black font-mono text-gray-800 tracking-wider bg-white px-3 py-1.5 border border-gray-200 rounded-xl shadow-sm">{resetSuccess.rawPass}</span>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button onClick={handleCopyPass} className="flex-1 py-3 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95">
                <Copy size={13} /> Sao chép
              </button>
              <button onClick={() => setResetSuccess(null)} className="py-3 px-5 border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-50 active:scale-95">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
             Quản lý tài khoản đăng nhập
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Tổng số nhân sự và trạng thái kích hoạt tài khoản hệ thống</p>
        </div>
        <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-2xl text-sm font-bold transition-all shadow-sm active:scale-95">
          <Plus size={16} /> Tạo tài khoản
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/[0.04] flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#C62828] flex items-center justify-center border border-red-100 flex-shrink-0">
            <RefreshCw size={20} className="animate-spin duration-3000" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tổng nhân viên</p>
            <p className="text-2xl font-black text-gray-800 mt-0.5">{totalEmployeesCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/[0.04] flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Đang làm việc</p>
            <p className="text-2xl font-black text-gray-800 mt-0.5">{activeEmployeesCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/[0.04] flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100 flex-shrink-0">
            <UserX size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Đã nghỉ việc</p>
            <p className="text-2xl font-black text-gray-800 mt-0.5">{resignedEmployeesCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/[0.04] flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 flex-shrink-0">
            <Lock size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tài khoản bị khóa</p>
            <p className="text-2xl font-black text-gray-800 mt-0.5">{lockedAccountsCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/[0.06] grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="text-xs font-black text-gray-400 mb-1.5 block uppercase tracking-wider">Tìm kiếm nhân viên</label>
          <CustomCombobox
            value={search}
            onChange={setSearch}
            placeholder="Nhập tên hoặc mã nhân viên..."
            heightClass="h-[42px]"
            showSearchIcon={true}
            options={employees.map(e => ({ value: e.name, label: e.name, desc: e.id }))}
          />
        </div>

        <div>
          <label className="text-xs font-black text-gray-400 mb-1.5 block uppercase tracking-wider">Chi nhánh</label>
          <CustomSelect
            value={branchFilter}
            onChange={setBranchFilter}
            disabled={currentUserRole !== "admin" && selectedBranch !== "all"}
            heightClass="h-[42px]"
            options={[
              { value: "all", label: "Tất cả chi nhánh" },
              ...branches.map((b: any) => ({ value: b.id, label: b.name }))
            ]}
          />
        </div>

        <div>
          <label className="text-xs font-black text-gray-400 mb-1.5 block uppercase tracking-wider">Phòng ban</label>
          <CustomCombobox
            value={deptFilter}
            onChange={setDeptFilter}
            heightClass="h-[42px]"
            options={[
              { value: "all", label: "Tất cả phòng ban" },
              ...departments.map(d => ({ value: d, label: d }))
            ]}
          />
        </div>

        <div>
          <label className="text-xs font-black text-gray-400 mb-1.5 block uppercase tracking-wider">Trạng thái nhân sự</label>
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            heightClass="h-[42px]"
            options={[
              { value: "all", label: "Tất cả trạng thái" },
              { value: "active", label: "Đang làm việc" },
              { value: "inactive", label: "Đã nghỉ việc" }
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white flex-wrap gap-2">
          <h3 className="font-black text-gray-800 flex items-center gap-1.5">
             Danh sách tài khoản nhân viên
          </h3>
          <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-blue-150 shadow-xs">
            <RefreshCw size={10} className="animate-spin" /> Dữ liệu realtime
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Đang tải danh sách tài khoản...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Không tìm thấy nhân viên nào khớp bộ lọc</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-gray-400 text-xs border-b border-gray-100 uppercase tracking-wider font-bold">
                  <th className="px-5 py-3.5 text-left font-bold w-16">STT</th>
                  {["Mã NV", "Tên nhân viên", "Phòng ban", "Trạng thái", "Tài khoản", "Role", "Hành động"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEmployees.map((emp, index) => {
                  const acc = accounts.find(a => a.employeeId === emp.id)
                  const isResigned = emp.status === "inactive"
                  return (
                    <tr key={emp.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-5 py-4 font-semibold text-gray-400">{index + 1}</td>
                      <td className="px-5 py-4 font-mono font-bold text-gray-700">{emp.id}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white text-xs font-black shadow-sm">{initials(emp.name)}</div>
                          <span className="font-bold text-gray-800">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500 font-bold">{emp.department || "—"}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isResigned ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"}`}>
                          {isResigned ? "Nghỉ việc" : "Đang làm việc"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono font-bold text-gray-600">
                        {acc ? acc.email : <span className="text-gray-300 italic font-medium">Chưa tạo tài khoản</span>}
                      </td>
                      <td className="px-5 py-4">
                        {acc ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${acc.role === "admin" ? "bg-amber-100 text-amber-700 animate-pulse" : acc.role === "manager" ? "bg-blue-100 text-blue-700" : "bg-gray-150 text-gray-600"}`}>
                            {acc.role === "admin" ? (
                              <><Shield size={11} /> Admin</>
                            ) : acc.role === "manager" ? (
                              <><Briefcase size={11} /> Quản lý ({acc.branchName})</>
                            ) : (
                              <><User size={11} /> Nhân viên</>
                            )}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-4">
                        {acc ? (
                          <div className="flex gap-1 items-center">
                            <button
                              onClick={() => handleToggleStatus(acc.id)}
                              className={`p-2 rounded-lg transition-all hover:scale-105 active:scale-95 ${
                                acc.status === "active" ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={acc.status === "active" ? "Khóa tài khoản" : "Kích hoạt tài khoản"}
                            >
                              {acc.status === "active" ? <Lock size={18} /> : <Unlock size={18} />}
                            </button>
                            <button
                              onClick={() => handleOpenEdit(acc)}
                              className="p-2 rounded-lg text-gray-500 hover:text-[#C62828] hover:bg-red-50 transition-all hover:scale-105 active:scale-95"
                              title="Chỉnh sửa tài khoản"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleResetPassword(acc)}
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-all hover:scale-105 active:scale-95"
                              title="Đặt lại mật khẩu"
                            >
                              <KeyRound size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(acc.id)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-all hover:scale-105 active:scale-95"
                              title="Xóa tài khoản"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenCreateForEmployee(emp.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 hover:scale-105"
                          >
                            <Plus size={13} /> Tạo tài khoản
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 mx-4 border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-800 text-lg">{editingAcc ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block">Gán nhân viên</label>
                <select value={form.employeeId} onChange={e => handleEmployeeChange(e.target.value)} disabled={!!editingAcc}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#C62828]/40 font-semibold text-gray-600 bg-gray-50/50">
                  <option value="">-- Chưa gán / Để trống --</option>
                  {employees
                    .filter(e => !assignedEmployeeIds.includes(e.id) || (editingAcc && editingAcc.employeeId === e.id))
                    .map(e => <option key={e.id} value={e.id}>{e.id} — {e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block">
                  {form.employeeId ? "Mã đăng nhập (Mã nhân viên)" : "Tài khoản đăng nhập (Email)"}
                </label>
                <input 
                  value={form.employeeId ? form.employeeId : form.email} 
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} 
                  type={form.employeeId ? "text" : "email"} 
                  required
                  disabled={!!form.employeeId}
                  placeholder={form.employeeId ? form.employeeId : "email@dudi.vn"} 
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#C62828]/40 font-semibold text-gray-700 bg-gray-50/50 disabled:text-gray-400" 
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block">Phân quyền</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as any }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#C62828]/40 font-semibold text-gray-600 bg-gray-50/50">
                  <option value="user">Nhân viên</option>
                  <option value="manager">Quản lý chi nhánh</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
              {form.role === "manager" && (
                <div>
                  <label className="text-xs font-black text-gray-500 mb-1.5 block">Chi nhánh quản lý</label>
                  <select value={form.scopeId} onChange={e => setForm(p => ({ ...p, scopeId: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#C62828]/40 font-semibold text-gray-600 bg-gray-50/50">
                    <option value="">-- Chọn chi nhánh --</option>
                    {orgNodes.filter((n: any) => n.type === "branch").map((n: any) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {!editingAcc && (
                <p className="text-[11px] text-gray-400 bg-gray-50 p-3 rounded-2xl border border-gray-150 leading-relaxed font-medium">
                  Mật khẩu mặc định sẽ được đặt theo **Số điện thoại** hoặc **Ngày sinh** của nhân viên được gán. Nếu để trống nhân viên, mật khẩu mặc định là **123456**.
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all">Huỷ</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-[#C62828] text-white rounded-2xl text-sm font-bold hover:bg-[#B71C1C] active:scale-95 transition-all shadow-sm">
                  {editingAcc ? "Cập nhật" : "Tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
