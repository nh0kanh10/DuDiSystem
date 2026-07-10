import React, { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import {
  Search, Lock, Unlock, KeyRound, UserX, UserCheck, X, Copy, Edit2,
  Trash2, Plus, RefreshCw, Shield, Briefcase, User, ChevronDown,
  ChevronRight, Folder, FolderOpen, Save
} from "lucide-react"
import { api } from "../../../lib/api"
import { CustomSelect } from "../ui/CustomSelect"
import { CustomCombobox } from "../ui/CustomCombobox"
import ConfirmModal from "../ui/ConfirmModal"
import { useToast } from "@/app/hooks/useToast"

interface UserRecord {
  id: string
  employeeId: string | null
  email: string
  roleId: string
  status: "active" | "locked"
  name: string
  branchId: string
  branchName: string
  assignments?: any[]
  permissions?: string[]
}

interface RoleDefinition {
  id: string
  name: string
  isSystem: boolean
  scopeType: "company" | "branch" | "self"
  roleType?: "management" | "staff" | "admin" | "manager"
  modules: string[]
}

import { isStaffTypeRole } from "../../utils/staffModules"

const ADMIN_MODULE_IDS = new Set([
  "dashboard", "nhan-su", "co-cau", "cham-cong", "duyet-don",
  "tai-khoan", "phan-quyen", "ip", "kpi", "du-an", "tien-ich", "crm", "lead"
])

function stripAdminModules(modules: string[]): string[] {
  return modules.filter(id => !ADMIN_MODULE_IDS.has(id))
}

const MODULE_TREE = [
  {
    id: "group-general",
    label: "Hệ thống chung",
    children: [
      { id: "dashboard", label: "Dashboard (Bảng điều khiển)" },
      { id: "thong-bao", label: "Thông báo hệ thống" }
    ]
  },
  {
    id: "group-hr",
    label: "Quản lý nhân sự",
    children: [
      { id: "nhan-su", label: "Danh sách nhân viên" },
      { id: "co-cau", label: "Cơ cấu tổ chức" },
      { id: "cham-cong", label: "Quản lý chấm công" },
      { id: "duyet-don", label: "Duyệt đơn & Time off" }
    ]
  },
  {
    id: "group-admin",
    label: "Quản trị hệ thống",
    children: [
      { id: "tai-khoan", label: "Quản lý tài khoản" },
      { id: "phan-quyen", label: "Phân quyền vai trò" },
      { id: "ip", label: "Danh sách IP" }
    ]
  },
  {
    id: "group-work",
    label: "Quản lý công việc & Dự án",
    children: [
      { id: "du-an", label: "Quản lý dự án" },
      { id: "cong-viec", label: "Quản lý công việc" }
    ]
  },
  {
    id: "group-reports",
    label: "Báo cáo & Tiện ích",
    children: [
      { id: "kpi", label: "Quản lý KPI" },
      { id: "tien-ich", label: "Tiện ích hệ thống" }
    ]
  },
  {
    id: "group-crm",
    label: "Quản lý khách hàng",
    children: [
      { id: "crm", label: "Quản lý khách hàng" },
      { id: "lead", label: "Quản lý Lead" },
    ]
  }
]

const STAFF_MODULE_TREE = [
  {
    id: "staff-general",
    label: "Hồ sơ & Cá nhân",
    children: [
      { id: "user-profile", label: "Hồ sơ cá nhân" },
      { id: "user-settings", label: "Cài đặt tài khoản" }
    ]
  },
  {
    id: "staff-work",
    label: "Làm việc & Chấm công",
    children: [
      { id: "user-attendance", label: "Check-in / Check-out" },
      { id: "user-timeoff", label: "Nghỉ phép & Time Off" },
      { id: "user-workflow", label: "Quy trình làm việc" }
    ]
  },
  {
    id: "staff-social",
    label: "Kết nối & Liên lạc",
    children: [
      { id: "user-directory", label: "Danh bạ nhân viên" },
      { id: "user-chat", label: "Trò chuyện nội bộ" }
    ]
  },
  {
    // Thêm nhóm Tiện ích nhân viên — ánh xạ tới bubble notifications & tasks trong UserPortalApp
    id: "staff-tools",
    label: "Tiện ích nhân viên",
    children: [
      { id: "thong-bao", label: "Thông báo hệ thống" },
      { id: "cong-viec", label: "Công việc cá nhân" }
    ]
  },
  {
    id: "staff-crm",
    label: "Quản lý khách hàng (nhân viên)",
    children: [
      { id: "user-crm", label: "Quản lý khách hàng" },
      { id: "user-kpi", label: "KPI nhân viên" }
    ]
  }
]

export default function AccountManagement({
  selectedBranch = "all",
  currentUserEmail = "",
  currentUserRole = "role-user",
  mode
}: {
  selectedBranch?: string;
  currentUserEmail?: string;
  currentUserRole?: string;
  mode?: "accounts" | "roles"
}) {
  const [activeTab, setActiveTab] = useState<"accounts" | "roles">(mode || "accounts")

  useEffect(() => {
    if (mode) {
      setActiveTab(mode)
    }
  }, [mode])
  const [accounts, setAccounts] = useState<UserRecord[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [orgNodes, setOrgNodes] = useState<any[]>([])
  const [rolesList, setRolesList] = useState<RoleDefinition[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [branchFilter, setBranchFilter] = useState(selectedBranch)
  const [deptFilter, setDeptFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null)
  const [rolePermissions, setRolePermissions] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    "group-general", "group-hr", "group-work", "group-reports",
    "staff-general", "staff-work", "staff-social", "staff-tools"  // staff-tools: Tiện ích nhân viên (thong-bao, cong-viec)
  ])

  const [showModal, setShowModal] = useState(false)
  const [editingAcc, setEditingAcc] = useState<UserRecord | null>(null)
  const [form, setForm] = useState({
    email: "",
    roleId: "role-user",
    employeeId: "",
    scopeId: ""
  })
  const [customPermissionsEnabled, setCustomPermissionsEnabled] = useState(false)
  const [customPermissions, setCustomPermissions] = useState<string[]>([])
  const [selectedCustomUser, setSelectedCustomUser] = useState<UserRecord | null>(null)
  const [showAddCustomUserModal, setShowAddCustomUserModal] = useState(false)
  const [selectedUserToAdd, setSelectedUserToAdd] = useState("")
  const [addCustomUserSearch, setAddCustomUserSearch] = useState("")
  const [addCustomUserDeptFilter, setAddCustomUserDeptFilter] = useState("all")
  const [permTab, setPermTab] = useState<"management" | "staff">("management")
  const [modalPermTab, setModalPermTab] = useState<"management" | "staff">("management")

  const [showRoleModal, setShowRoleModal] = useState(false)
  const [roleForm, setRoleForm] = useState<{
    name: string;
    scopeType: "company" | "branch" | "self";
    roleType: "management" | "staff"
  }>({
    name: "",
    scopeType: "branch",
    roleType: "management"
  })

  const { showToast } = useToast()

  const [resetSuccess, setResetSuccess] = useState<{ email: string; rawPass: string } | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: "danger" | "warning" | "info"
    onConfirm: () => void
  } | null>(null)

  const selectedFormRole = rolesList.find(r => r.id === form.roleId)
  const showBranchSelect = selectedFormRole?.scopeType === "branch"

  const loadData = async (overrideSelectedRole?: RoleDefinition | null, overrideSelectedUser?: UserRecord | null) => {
    setLoading(true)
    try {
      const [uList, eList, nList, rList] = await Promise.all([
        api.users.list(),
        api.employees.list(),
        api.orgNodes.list(),
        api.roles.list()
      ])
      setAccounts(uList)
      setEmployees((eList || []).filter((e: any) => !["0000000000", "1111111111", "2222222222"].includes(e.id)))
      setOrgNodes(nList)
      setRolesList(rList.filter((r: any) => r.id !== "role-super-admin"))

      const activeUserVal = overrideSelectedUser !== undefined ? overrideSelectedUser : selectedCustomUser
      const activeRoleVal = overrideSelectedRole !== undefined ? overrideSelectedRole : selectedRole

      if (activeUserVal) {
        const activeUser = uList.find((u: any) => u.id === activeUserVal.id)
        if (activeUser && activeUser.permissions && activeUser.permissions.length > 0) {
          setSelectedCustomUser(activeUser)
          setRolePermissions(activeUser.permissions)
          setSelectedRole(null)
          const userRole = rList.find((r: any) => r.id === activeUser.roleId)
          setPermTab(isStaffTypeRole(userRole) ? "staff" : "management")
          return
        }
      }

      if (rList.length > 0) {
        const active = activeRoleVal ? rList.find((r: any) => r.id === activeRoleVal.id) : null
        const target = active || rList[0]
        setSelectedRole(target)
        setSelectedCustomUser(null)
        setRolePermissions(target.modules || [])
        setPermTab(isStaffTypeRole(target) ? "staff" : "management")
      }
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
    setBranchFilter(selectedBranch)
  }, [selectedBranch])

  const handleRoleSelect = (roleItem: RoleDefinition) => {
    setSelectedRole(roleItem)
    setSelectedCustomUser(null)
    setRolePermissions(roleItem.modules || [])
    setPermTab(isStaffTypeRole(roleItem) ? "staff" : "management")
  }

  const handleCustomUserSelect = (userItem: UserRecord) => {
    setSelectedCustomUser(userItem)
    setSelectedRole(null)
    setRolePermissions(userItem.permissions || [])
    const userRole = rolesList.find(r => r.id === userItem.roleId)
    setPermTab(isStaffTypeRole(userRole) ? "staff" : "management")
  }

  const customAccounts = useMemo(() => {
    return accounts.filter(a => a.permissions && a.permissions.length > 0)
  }, [accounts])

  const accountsWithoutCustom = useMemo(() => {
    return accounts.filter(a => !a.permissions || a.permissions.length === 0)
  }, [accounts])

  const isSelectedRoleOrUserStaff = useMemo(() => {
    if (selectedRole) return isStaffTypeRole(selectedRole)
    if (selectedCustomUser) {
      const userRole = rolesList.find(r => r.id === selectedCustomUser.roleId)
      return isStaffTypeRole(userRole)
    }
    return false
  }, [selectedRole, selectedCustomUser, rolesList])

  const effectivePermTab = isSelectedRoleOrUserStaff ? "staff" : permTab

  const isModalRoleStaff = useMemo(() => {
    const r = rolesList.find(x => x.id === form.roleId)
    return isStaffTypeRole(r)
  }, [form.roleId, rolesList])

  const effectiveModalPermTab = isModalRoleStaff ? "staff" : modalPermTab

  useEffect(() => {
    if (isSelectedRoleOrUserStaff) setPermTab("staff")
  }, [isSelectedRoleOrUserStaff, selectedRole?.id, selectedCustomUser?.id])

  useEffect(() => {
    if (isModalRoleStaff) setModalPermTab("staff")
  }, [isModalRoleStaff, form.roleId])

  const filteredAccountsToAdd = useMemo(() => {
    return accountsWithoutCustom.filter(acc => {
      const emp = employees.find(e => e.id === acc.employeeId)

      if (addCustomUserDeptFilter !== "all") {
        if (!emp || emp.department !== addCustomUserDeptFilter) {
          return false
        }
      }

      if (addCustomUserSearch.trim() !== "") {
        const q = addCustomUserSearch.toLowerCase()
        const matchEmail = acc.email.toLowerCase().includes(q)
        const matchId = acc.employeeId ? acc.employeeId.toLowerCase().includes(q) : false
        const matchName = emp ? emp.name.toLowerCase().includes(q) : false

        if (!matchEmail && !matchId && !matchName) {
          return false
        }
      }

      return true
    })
  }, [accountsWithoutCustom, employees, addCustomUserSearch, addCustomUserDeptFilter])

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    )
  }

  const handleParentCheckboxChange = (group: typeof MODULE_TREE[0], checked: boolean) => {
    let childIds = group.children.map(c => c.id)
    if (selectedRole?.id === "role-admin" || selectedCustomUser?.roleId === "role-admin") {
      childIds = childIds.filter(id => id !== "phan-quyen")
    }
    childIds = childIds.filter(id => id !== "user-settings")
    if (checked) {
      setRolePermissions(prev => Array.from(new Set([...prev, ...childIds, "user-settings"])))
    } else {
      setRolePermissions(prev => prev.filter(id => !childIds.includes(id)))
    }
  }

  const handleChildCheckboxChange = (childId: string, checked: boolean) => {
    if (childId === "user-settings") return
    if ((selectedRole?.id === "role-admin" || selectedCustomUser?.roleId === "role-admin") && childId === "phan-quyen" && !checked) {
      return
    }
    if (checked) {
      setRolePermissions(prev => [...prev, childId])
    } else {
      setRolePermissions(prev => prev.filter(id => id !== childId))
    }
  }

  const handleSavePermissions = async () => {
    if (!selectedRole && !selectedCustomUser) return
    try {
      let finalPermissions = rolePermissions.includes("user-settings")
        ? rolePermissions
        : [...rolePermissions, "user-settings"]

      if (selectedRole && isStaffTypeRole(selectedRole)) {
        finalPermissions = stripAdminModules(finalPermissions)
      } else if (selectedCustomUser) {
        const userRole = rolesList.find(r => r.id === selectedCustomUser.roleId)
        if (isStaffTypeRole(userRole)) {
          finalPermissions = stripAdminModules(finalPermissions)
        }
      }

      if (selectedRole) {
        await api.roles.update(selectedRole.id, {
          name: selectedRole.name,
          modules: finalPermissions
        })
        showToast("Cập nhật quyền hạn vai trò thành công")
        await loadData(selectedRole, null)
        window.dispatchEvent(new Event("dudi_permissions_updated"))
      } else if (selectedCustomUser) {
        await api.users.update(selectedCustomUser.id, {
          permissions: finalPermissions
        })
        showToast("Cập nhật quyền riêng tài khoản thành công")
        const updatedUser = { ...selectedCustomUser, permissions: finalPermissions }
        await loadData(null, updatedUser)
        window.dispatchEvent(new Event("dudi_permissions_updated"))
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi lưu cấu hình", "error")
    }
  }

  const handleAddCustomUser = async (userId: string) => {
    const targetUser = accounts.find(u => u.id === userId)
    if (!targetUser) return
    const roleObj = rolesList.find(r => r.id === targetUser.roleId)
    const initialPermissions = roleObj?.modules || []
    try {
      await api.users.update(userId, {
        permissions: initialPermissions
      })
      showToast("Đã thiết lập quyền riêng cho tài khoản")
      setShowAddCustomUserModal(false)
      const updatedUser = { ...targetUser, permissions: initialPermissions }
      await loadData(null, updatedUser)
      window.dispatchEvent(new Event("dudi_permissions_updated"))
    } catch (err: any) {
      showToast(err.message || "Lỗi thiết lập quyền riêng", "error")
    }
  }

  const handleRemoveCustomPermissions = async (userId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Hủy quyền riêng tài khoản",
      message: "Bạn có chắc chắn muốn hủy quyền riêng của tài khoản này? Tài khoản sẽ quay lại sử dụng các quyền mặc định của Vai trò.",
      confirmText: "Hủy quyền riêng",
      cancelText: "Hủy",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.users.update(userId, {
            permissions: null
          })
          showToast("Đã khôi phục quyền mặc định của vai trò")
          const defaultRole = rolesList.length > 0 ? rolesList[0] : null
          await loadData(defaultRole, null)
          window.dispatchEvent(new Event("dudi_permissions_updated"))
        } catch (err: any) {
          showToast(err.message || "Lỗi khôi phục quyền mặc định", "error")
        }
      }
    })
  }

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleForm.name.trim()) {
      showToast("Tên vai trò là bắt buộc", "error")
      return
    }
    try {
      const initialModules = roleForm.roleType === "staff"
        ? [
          // Modules mặc định đầy đủ cho role nhân viên — phải khớp với BUBBLE_MODULE_MAP trong UserApp.tsx
          "user-profile", "user-attendance", "user-timeoff",
          "user-directory", "user-chat", "user-workflow",
          "user-settings", "thong-bao", "cong-viec"
        ]
        : ["dashboard"]

      const created = await api.roles.create({
        name: roleForm.name.trim(),
        scopeType: roleForm.scopeType,
        roleType: roleForm.roleType,
        modules: initialModules
      })
      showToast("Tạo vai trò mới thành công")
      setShowRoleModal(false)
      setRoleForm({ name: "", scopeType: "branch", roleType: "management" })
      loadData()
      setSelectedRole(created)
      setRolePermissions(created.modules)
      setPermTab(isStaffTypeRole(created) ? "staff" : "management")
    } catch (err: any) {
      showToast(err.message || "Lỗi tạo vai trò", "error")
    }
  }

  const handleDeleteRole = async (roleId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const target = rolesList.find(r => r.id === roleId)
    if (!target) return
    if (target.isSystem) {
      showToast("Không thể xóa vai trò mặc định của hệ thống", "error")
      return
    }
    setConfirmConfig({
      isOpen: true,
      title: "Xóa vai trò",
      message: `Bạn có chắc chắn muốn xóa vai trò "${target.name}"?`,
      confirmText: "Xác nhận xóa",
      cancelText: "Hủy",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.roles.delete(roleId)
          showToast("Đã xóa vai trò")
          setSelectedRole(null)
          loadData()
        } catch (err: any) {
          showToast(err.message || "Lỗi xóa vai trò", "error")
        }
      }
    })
  }

  const branchFilteredEmployees = useMemo(() => {
    return employees.filter(e => {
      if (["0000000000", "1111111111", "2222222222"].includes(e.id)) return false
      if (branchFilter === "all") return true
      return e.branchId === branchFilter
    })
  }, [employees, branchFilter])

  const totalEmployeesCount = branchFilteredEmployees.length
  const activeEmployeesCount = branchFilteredEmployees.filter(e => e.status === "active" || e.status === "suspended").length
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
          if (e.status !== "active" && e.status !== "suspended") return false
        } else if (statusFilter === "inactive") {
          if (e.status !== "inactive") return false
        }
      }
      return true
    })
  }, [branchFilteredEmployees, deptFilter, search, statusFilter])

  const handleEmployeeChange = (empId: string) => {
    const emp = employees.find(e => e.id === empId)
    const targetRole = emp
      ? (emp.position?.toLowerCase().includes("trưởng") || emp.position?.toLowerCase().includes("quản lý") ? "role-manager" : "role-user")
      : form.roleId
    setForm(p => ({
      ...p,
      employeeId: empId,
      email: emp ? emp.email : p.email,
      roleId: targetRole
    }))
    const roleObj = rolesList.find(r => r.id === targetRole)
    if (roleObj) {
      setCustomPermissions(roleObj.modules || [])
    }
    const isStaff = isStaffTypeRole(roleObj)
    if (isStaff) {
      setModalPermTab("staff")
    } else {
      setModalPermTab("management")
    }
  }

  const handleOpenCreate = () => {
    setEditingAcc(null)
    setForm({ email: "", roleId: "role-user", employeeId: "", scopeId: "" })
    setCustomPermissionsEnabled(false)
    const roleObj = rolesList.find(r => r.id === "role-user")
    setCustomPermissions(roleObj?.modules || [])
    setModalPermTab("staff")
    setShowModal(true)
  }

  const handleOpenCreateForEmployee = (empId: string) => {
    setEditingAcc(null)
    const emp = employees.find(e => e.id === empId)
    const roleId = emp ? (emp.position?.toLowerCase().includes("trưởng") || emp.position?.toLowerCase().includes("quản lý") ? "role-manager" : "role-user") : "role-user"
    setForm({
      employeeId: empId,
      email: emp ? emp.email : "",
      roleId,
      scopeId: emp?.branchId ?? ""
    })
    setCustomPermissionsEnabled(false)
    const roleObj = rolesList.find(r => r.id === roleId)
    setCustomPermissions(roleObj?.modules || [])
    if (roleId === "role-manager") {
      setModalPermTab("management")
    } else {
      setModalPermTab("staff")
    }
    setShowModal(true)
  }

  const handleOpenEdit = (acc: UserRecord) => {
    setEditingAcc(acc)
    setForm({
      email: acc.email,
      roleId: acc.roleId,
      employeeId: acc.employeeId || "",
      scopeId: (acc as any).branchId || ""
    })
    const hasCustom = !!(acc.permissions && acc.permissions.length > 0)
    setCustomPermissionsEnabled(hasCustom)

    if (hasCustom) {
      setCustomPermissions(acc.permissions || [])
    } else {
      const roleObj = rolesList.find(r => r.id === acc.roleId)
      setCustomPermissions(roleObj?.modules || [])
    }
    if (acc.roleId === "role-admin" || acc.roleId === "role-manager") {
      setModalPermTab("management")
    } else {
      setModalPermTab("staff")
    }
    setShowModal(true)
  }

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    const loginId = form.employeeId || form.email
    if (!loginId.trim()) {
      showToast("Mã đăng nhập là bắt buộc", "error")
      return
    }
    try {
      const finalCustomPerms = customPermissionsEnabled
        ? (customPermissions.includes("user-settings") ? customPermissions : [...customPermissions, "user-settings"])
        : null
      const payload = {
        loginId,
        roleId: form.roleId,
        employeeId: form.employeeId || null,
        scopeId: showBranchSelect ? form.scopeId : null,
        permissions: finalCustomPerms
      }
      if (editingAcc) {
        await api.users.update(editingAcc.id, payload)
        showToast("Cập nhật tài khoản thành công")
        await loadData(selectedRole, selectedCustomUser)
        setShowModal(false)
        window.dispatchEvent(new Event("dudi_permissions_updated"))
      } else {
        const res = await api.users.create(payload)
        await loadData(selectedRole, selectedCustomUser)
        setShowModal(false)
        setResetSuccess({ email: res.email, rawPass: res.rawPassword })
        window.dispatchEvent(new Event("dudi_permissions_updated"))
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi xử lý", "error")
    }
  }

  const handleToggleStatus = async (id: string) => {
    const acc = accounts.find(a => a.id === id)
    if (!acc) return
    const actionText = acc.status === "active" ? "khóa" : "kích hoạt"
    setConfirmConfig({
      isOpen: true,
      title: `${acc.status === "active" ? "Khóa" : "Kích hoạt"} tài khoản`,
      message: `Bạn có chắc chắn muốn ${actionText} tài khoản này không?`,
      confirmText: acc.status === "active" ? "Khóa tài khoản" : "Kích hoạt",
      cancelText: "Hủy",
      type: acc.status === "active" ? "danger" : "info",
      onConfirm: async () => {
        try {
          await api.users.toggleStatus(id)
          showToast("Thay đổi trạng thái tài khoản thành công")
          await loadData(selectedRole, selectedCustomUser)
        } catch (err: any) {
          showToast(err.message || "Lỗi xử lý", "error")
        }
      }
    })
  }

  const handleResetPassword = async (acc: UserRecord) => {
    setConfirmConfig({
      isOpen: true,
      title: "Đặt lại mật khẩu",
      message: `Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản "${acc.email}" không?`,
      confirmText: "Đặt lại mật khẩu",
      cancelText: "Hủy",
      type: "danger",
      onConfirm: async () => {
        try {
          const res = await api.users.resetPassword(acc.id)
          setResetSuccess({ email: acc.email, rawPass: res.rawPassword })
        } catch (err: any) {
          showToast(err.message || "Lỗi xử lý", "error")
        }
      }
    })
  }

  const handleDeleteAccount = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Xóa tài khoản",
      message: "Bạn có chắc chắn muốn xóa tài khoản này không?",
      confirmText: "Xác nhận xóa",
      cancelText: "Hủy",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.users.delete(id)
          showToast("Đã xóa tài khoản")
          loadData()
        } catch (err: any) {
          showToast(err.message || "Lỗi xóa tài khoản", "error")
        }
      }
    })
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

      {resetSuccess && createPortal(
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
        , document.body)}

      <div className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px] p-5 rounded-2xl text-white flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div className="flex items-center">
          <div className="flex gap-1.5 items-center mr-4 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white/30 animate-pulse"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white/60 animate-pulse delay-75"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse delay-150"></span>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              {mode === "accounts"
                ? "Quản lý tài khoản"
                : mode === "roles"
                  ? "Phân quyền vai trò"
                  : "Thiết lập tài khoản & Phân quyền"}
            </h2>
            <p className="text-xs text-white/80 mt-1">
              {mode === "accounts"
                ? "Quản lý danh sách tài khoản nhân viên và thông tin đăng nhập"
                : mode === "roles"
                  ? "Cấu hình danh sách vai trò và ma trận phân quyền module hệ thống"
                  : "Quản lý danh sách tài khoản nhân viên và cấu hình ma trận vai trò, phân quyền module"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!mode && (
            <div className="flex bg-white/10 rounded-xl p-0.5 gap-0.5">
              <button
                onClick={() => setActiveTab("accounts")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "accounts" ? "bg-white text-[#C62828] shadow-sm" : "text-white/70 hover:text-white"
                  }`}
              >
                Tài khoản
              </button>
              <button
                onClick={() => setActiveTab("roles")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "roles" ? "bg-white text-[#C62828] shadow-sm" : "text-white/70 hover:text-white"
                  }`}
              >
                Vai trò
              </button>
            </div>
          )}

          {activeTab === "accounts" ? (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#C62828] hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={14} /> Tạo tài khoản
            </button>
          ) : (
            <button
              onClick={() => {
                setRoleForm({ name: "", scopeType: "branch", roleType: "management" })
                setShowRoleModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#C62828] hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={14} /> Tạo vai trò
            </button>
          )}
        </div>
      </div>

      {activeTab === "accounts" ? (
        <>

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
                disabled={currentUserRole !== "role-admin" && currentUserRole !== "role-super-admin" && selectedBranch !== "all"}
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
                      {["Mã NV", "Tên nhân viên", "Phòng ban", "Trạng thái nhân sự", "Trạng thái tài khoản", "Tài khoản", "Vai trò (Role)", "Hành động"].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredEmployees.map((emp, index) => {
                      const acc = accounts.find(a => a.employeeId === emp.id)
                      const roleObj = acc ? rolesList.find(r => r.id === acc.roleId) : null
                      return (
                        <tr key={emp.id} className="hover:bg-gray-50/40 transition-colors">
                          <td className="px-5 py-4 font-semibold text-gray-400">{index + 1}</td>
                          <td className="px-5 py-4 font-mono font-bold text-gray-700">{emp.id}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {emp.photos?.[0]
                                ? <img src={emp.photos[0]} alt={emp.name} className="w-9 h-9 rounded-xl object-cover shadow-sm" />
                                : <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white text-xs font-black shadow-sm">{initials(emp.name)}</div>
                              }
                              <span className="font-bold text-gray-800">{emp.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-gray-500 font-bold">{emp.department || "—"}</td>
                          {/* 1. Trạng thái nhân sự */}
                          <td className="px-5 py-4">
                            {emp.status === "active" ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                Đang làm
                              </span>
                            ) : emp.status === "suspended" ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                Tạm nghỉ
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                                Nghỉ việc
                              </span>
                            )}
                          </td>
                          {/* 2. Trạng thái tài khoản */}
                          <td className="px-5 py-4">
                            {acc ? (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${acc.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${acc.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                                {acc.status === "active" ? "Hoạt động" : "Đã khóa"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-400 border border-gray-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                Chưa tạo
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-xs font-mono font-bold text-gray-600">
                            {acc ? acc.email : <span className="text-gray-300 italic font-medium">Chưa tạo tài khoản</span>}
                          </td>
                          <td className="px-5 py-4">
                            {acc ? (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold 
                                ${acc.roleId === "role-admin"
                                  ? "bg-amber-100 text-amber-700 animate-pulse"
                                  : acc.roleId === "role-manager"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-600"}`}>
                                {acc.roleId === "role-admin" ? (
                                  <><Shield size={11} /> {roleObj?.name || "Admin"}</>
                                ) : acc.roleId === "role-manager" ? (
                                  <><Briefcase size={11} /> {roleObj?.name || "Quản lý"} ({acc.branchName})</>
                                ) : (
                                  <><User size={11} /> {roleObj?.name || "Nhân viên"}</>
                                )}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-5 py-4">
                            {acc ? (
                              ["0000000000", "1111111111", "2222222222"].includes(acc.email) ? (
                                <span className="text-xs text-gray-400 font-semibold italic">Không thể thao tác</span>
                              ) : (
                                <div className="flex gap-1 items-center">
                                  <button
                                    onClick={() => handleToggleStatus(acc.id)}
                                    className={`p-2 rounded-lg transition-all hover:scale-105 active:scale-95 ${acc.status === "active" ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
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
                              )
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
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/5 space-y-6 h-fit">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <h3 className="font-black text-gray-800 text-xs uppercase tracking-wider">Danh sách vai trò</h3>
              </div>

              <div className="space-y-2">
                {rolesList.map(r => (
                  <div
                    key={r.id}
                    onClick={() => handleRoleSelect(r)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer border flex items-center justify-between
                      ${selectedRole?.id === r.id
                        ? "bg-red-50/60 border-red-200 shadow-xs"
                        : "bg-white border-gray-150 hover:bg-gray-50/50"}`}
                  >
                    <div className="space-y-1 truncate">
                      <p className={`font-bold text-sm ${selectedRole?.id === r.id ? "text-[#C62828]" : "text-gray-800"}`}>
                        {r.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono tracking-wide">{r.id}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {r.isSystem ? (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md">
                          Mặc định
                        </span>
                      ) : (
                        <button
                          onClick={(e) => handleDeleteRole(r.id, e)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Xóa vai trò"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <h3 className="font-black text-gray-800 text-xs uppercase tracking-wider">Tài khoản có quyền riêng</h3>
                <button
                  onClick={() => {
                    setSelectedUserToAdd("")
                    setShowAddCustomUserModal(true)
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  <Plus size={11} /> Thêm tài khoản
                </button>
              </div>
              {customAccounts.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic text-center py-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                  Chưa có tài khoản tùy chỉnh quyền riêng.
                </p>
              ) : (
                <div className="space-y-2">
                  {customAccounts.map(acc => (
                    <div
                      key={acc.id}
                      onClick={() => handleCustomUserSelect(acc)}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer border flex items-center justify-between
                        ${selectedCustomUser?.id === acc.id
                          ? "bg-red-50/60 border-red-200 shadow-xs"
                          : "bg-white border-gray-150 hover:bg-gray-50/50"}`}
                    >
                      <div className="space-y-1 truncate">
                        <p className={`font-bold text-sm ${selectedCustomUser?.id === acc.id ? "text-[#C62828]" : "text-gray-800"}`}>
                          {acc.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono tracking-wide">{acc.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-md">
                          Quyền riêng
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveCustomPermissions(acc.id)
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Hủy quyền riêng (Khôi phục quyền mặc định)"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/5 md:col-span-2">
            {selectedRole || selectedCustomUser ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="font-black text-gray-800 text-base">
                      {selectedRole ? (
                        <>Cấu hình quyền hạn vai trò: <span className="text-[#C62828] font-black">{selectedRole.name}</span></>
                      ) : (
                        <>Quyền riêng tài khoản: <span className="text-[#C62828] font-black">{selectedCustomUser?.name}</span></>
                      )}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Bật/Tắt module để cho phép/ngăn chặn quyền truy cập tương ứng</p>
                  </div>
                  <button
                    onClick={handleSavePermissions}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Save size={14} /> Lưu cấu hình
                  </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 border-b border-gray-100 pb-3">
                  {!isSelectedRoleOrUserStaff && (
                    <button
                      type="button"
                      onClick={() => setPermTab("management")}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${permTab === "management"
                          ? "bg-[#C62828] text-white shadow-xs"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                    >
                      Quyền Quản lý / Admin
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPermTab("staff")}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${permTab === "staff"
                        ? "bg-[#C62828] text-white shadow-xs"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                  >
                    Quyền Nhân viên / Staff
                  </button>
                </div>

                <div className="border border-gray-150 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {(effectivePermTab === "management" ? MODULE_TREE : STAFF_MODULE_TREE).map(group => {
                    const isExpanded = expandedGroups.includes(group.id)
                    const groupChildIds = group.children.map(c => c.id)

                    const checkedChildrenCount = groupChildIds.filter(id => rolePermissions.includes(id)).length
                    const isAllChecked = checkedChildrenCount === groupChildIds.length
                    const isSomeChecked = checkedChildrenCount > 0 && checkedChildrenCount < groupChildIds.length

                    return (
                      <div key={group.id} className="bg-white">
                        <div
                          className="flex items-center justify-between p-3.5 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer select-none"
                          onClick={() => toggleGroupExpand(group.id)}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-gray-400">
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </span>
                            <span className="text-gray-400">
                              {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                            </span>
                            <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
                              {group.label}
                            </span>
                          </div>

                          <div className="flex items-center" onClick={e => e.stopPropagation()}>
                            <label className="relative flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isAllChecked}
                                ref={el => {
                                  if (el) {
                                    el.indeterminate = isSomeChecked
                                  }
                                }}
                                onChange={e => handleParentCheckboxChange(group, e.target.checked)}
                                className="w-4.5 h-4.5 rounded border-gray-300 text-[#C62828] focus:ring-[#C62828] cursor-pointer"
                              />
                            </label>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="divide-y divide-gray-50 bg-white animate-in slide-in-from-top-1 duration-150">
                            {group.children.map(child => {
                              const isChecked = child.id === "user-settings" ? true : rolePermissions.includes(child.id)
                              const isLocked = ((selectedRole?.id === "role-admin" || selectedCustomUser?.roleId === "role-admin") && child.id === "phan-quyen") || child.id === "user-settings"
                              return (
                                <div
                                  key={child.id}
                                  className={`flex items-center justify-between py-3 pr-4 pl-10 transition-colors ${isLocked ? "cursor-not-allowed opacity-50 bg-gray-50/30" : "hover:bg-gray-50/40 cursor-pointer"
                                    }`}
                                  onClick={() => !isLocked && handleChildCheckboxChange(child.id, !isChecked)}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                    <span className="text-xs font-semibold text-gray-600">{child.label}</span>
                                    <span className="text-[9px] font-mono text-gray-400 bg-gray-50 border border-gray-100 rounded px-1">{child.id}</span>
                                    {isLocked && (
                                      <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 uppercase tracking-wide">Bắt buộc</span>
                                    )}
                                  </div>

                                  <div onClick={e => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={isLocked}
                                      onChange={e => handleChildCheckboxChange(child.id, e.target.checked)}
                                      className={`w-4.5 h-4.5 rounded border-gray-300 text-[#C62828] focus:ring-[#C62828] ${isLocked ? "cursor-not-allowed" : "cursor-pointer"
                                        }`}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>


              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 text-sm">
                Đang tải dữ liệu cấu hình vai trò...
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-xs">
          <div className={`bg-white rounded-3xl shadow-2xl w-full ${customPermissionsEnabled ? "max-w-2xl" : "max-w-md"} p-6 mx-4 border border-gray-100 animate-in zoom-in-95 duration-200 transition-all`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-800 text-lg">{editingAcc ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><X size={16} /></button>
            </div>

            <div className="flex gap-6">
              <div className="flex-1 space-y-4">
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
                  <label className="text-xs font-black text-gray-500 mb-1.5 block">Mã đăng nhập</label>
                  <input
                    value={form.employeeId || form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    type="text"
                    required
                    disabled={!!form.employeeId}
                    placeholder={form.employeeId || "VD: 2026070333"}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#C62828]/40 font-semibold text-gray-700 bg-gray-50/50 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 mb-1.5 block">Phân quyền</label>
                  <select
                    value={form.roleId}
                    onChange={e => {
                      const nextRole = e.target.value
                      setForm(p => ({ ...p, roleId: nextRole }))
                      const roleObj = rolesList.find(r => r.id === nextRole)
                      if (roleObj) {
                        setCustomPermissions(roleObj.modules || [])
                      }
                      const isStaff = isStaffTypeRole(roleObj)
                      if (isStaff) {
                        setModalPermTab("staff")
                      } else {
                        setModalPermTab("management")
                      }
                    }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#C62828]/40 font-semibold text-gray-600 bg-gray-50/50"
                  >
                    {rolesList.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                {showBranchSelect && (
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

                <div className="flex items-center justify-between bg-gray-50 border border-gray-150 p-3 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-gray-700 block">Tùy chỉnh quyền trực tiếp</span>
                    <span className="text-[10px] text-gray-400 font-medium">Cấu hình riêng quyền cho tài khoản này</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={customPermissionsEnabled}
                      onChange={e => {
                        const checked = e.target.checked
                        setCustomPermissionsEnabled(checked)
                        if (checked && customPermissions.length === 0) {
                          const roleObj = rolesList.find(r => r.id === form.roleId)
                          if (roleObj) {
                            setCustomPermissions(roleObj.modules || [])
                          }
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C62828]"></div>
                  </label>
                </div>

                {!editingAcc && !customPermissionsEnabled && (
                  <p className="text-[11px] text-gray-400 bg-gray-50 p-3 rounded-2xl border border-gray-150 leading-relaxed font-medium">
                    Mật khẩu mặc định sẽ được đặt theo **Số điện thoại** hoặc **Ngày sinh** của nhân viên được gán. Nếu để trống nhân viên, mật khẩu mặc định là **123456**.
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all">Huỷ</button>
                  <button type="button" onClick={() => handleSubmit()}
                    className="flex-1 py-2.5 bg-[#C62828] text-white rounded-2xl text-sm font-bold hover:bg-[#B71C1C] active:scale-95 transition-all shadow-sm">
                    {editingAcc ? "Cập nhật" : "Tạo tài khoản"}
                  </button>
                </div>
              </div>

              {customPermissionsEnabled && (
                <div className="w-72 border-l border-gray-150 pl-5 flex flex-col">
                  <div className="mb-2">
                    <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Danh sách quyền hạn</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Tùy chỉnh riêng cho tài khoản</p>
                  </div>

                  <div className="flex gap-1.5 border-b border-gray-150 pb-2 mb-3">
                    {!isModalRoleStaff && (
                      <button
                        type="button"
                        onClick={() => setModalPermTab("management")}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${modalPermTab === "management"
                            ? "bg-[#C62828] text-white shadow-xs"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                      >
                        Quản lý
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setModalPermTab("staff")}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${modalPermTab === "staff"
                          ? "bg-[#C62828] text-white shadow-xs"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                    >
                      Staff
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-3.5" style={{ scrollbarWidth: "thin" }}>
                    {(effectiveModalPermTab === "management" ? MODULE_TREE : STAFF_MODULE_TREE).map(group => {
                      const groupChildIds = group.children.map(c => c.id)
                      const checkedChildrenCount = groupChildIds.filter(id => customPermissions.includes(id)).length
                      const isAllChecked = checkedChildrenCount === groupChildIds.length
                      const isSomeChecked = checkedChildrenCount > 0 && checkedChildrenCount < groupChildIds.length

                      return (
                        <div key={group.id} className="bg-gray-50/50 rounded-2xl p-3 border border-gray-100 space-y-2">
                          <div className="flex items-center justify-between pb-1.5 border-b border-gray-150">
                            <span className="text-[10px] font-black text-gray-700 uppercase tracking-wide">{group.label}</span>
                            <input
                              type="checkbox"
                              checked={isAllChecked}
                              ref={el => {
                                if (el) el.indeterminate = isSomeChecked
                              }}
                              onChange={e => {
                                const checked = e.target.checked
                                if (checked) {
                                  setCustomPermissions(prev => [...new Set([...prev, ...groupChildIds, "user-settings"])])
                                } else {
                                  const filterChildIds = groupChildIds.filter(id => id !== "user-settings")
                                  setCustomPermissions(prev => prev.filter(id => !filterChildIds.includes(id)))
                                }
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-[#C62828] focus:ring-[#C62828] cursor-pointer"
                            />
                          </div>
                          <div className="space-y-1.5 pl-0.5">
                            {group.children.map(child => {
                              const isChecked = child.id === "user-settings" ? true : customPermissions.includes(child.id)
                              const isLocked = (form.roleId === "role-admin" && child.id === "phan-quyen") || child.id === "user-settings"
                              return (
                                <label key={child.id} className="flex items-center justify-between text-xs cursor-pointer hover:bg-white p-1 rounded-lg transition-colors">
                                  <span className="text-gray-500 font-semibold leading-none">{child.label}</span>
                                  <input
                                    type="checkbox"
                                    checked={isChecked || child.id === "user-settings"}
                                    disabled={isLocked}
                                    onChange={e => {
                                      if (child.id === "user-settings") return
                                      const checked = e.target.checked
                                      if (checked) {
                                        setCustomPermissions(prev => [...prev, child.id])
                                      } else {
                                        setCustomPermissions(prev => prev.filter(id => id !== child.id))
                                      }
                                    }}
                                    className="w-3.5 h-3.5 rounded border-gray-300 text-[#C62828] focus:ring-[#C62828] cursor-pointer"
                                  />
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        , document.body)}

      {showRoleModal && createPortal(
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 mx-4 border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-800 text-lg">Thêm vai trò mới</h3>
              <button onClick={() => setShowRoleModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block">Tên vai trò</label>
                <input
                  value={roleForm.name}
                  onChange={e => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                  type="text"
                  required
                  placeholder="Ví dụ: Nhân viên nhân sự, Kế toán..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#C62828]/40 font-semibold text-gray-700 bg-gray-50/50"
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block">Phân loại vai trò</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRoleForm(prev => ({ ...prev, roleType: "management", scopeType: prev.scopeType === "self" ? "branch" : prev.scopeType }))
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${roleForm.roleType === "management"
                        ? "bg-[#C62828] text-white border-[#C62828] shadow-xs"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    Quản lý / Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRoleForm(prev => ({ ...prev, roleType: "staff", scopeType: "self" }))
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${roleForm.roleType === "staff"
                        ? "bg-[#C62828] text-white border-[#C62828] shadow-xs"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    Nhân viên / Staff
                  </button>
                </div>
              </div>

              {roleForm.roleType === "management" && (
                <div>
                  <label className="text-xs font-black text-gray-500 mb-1.5 block">Phạm vi dữ liệu mặc định</label>
                  <select
                    value={roleForm.scopeType}
                    onChange={e => setRoleForm(prev => ({ ...prev, scopeType: e.target.value as any }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#C62828]/40 font-semibold text-gray-600 bg-gray-50/50"
                  >
                    <option value="branch">Một chi nhánh cụ thể (Branch)</option>
                    <option value="company">Tất cả chi nhánh / Toàn công ty (Company)</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRoleModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all">Huỷ</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-[#C62828] text-white rounded-2xl text-sm font-bold hover:bg-[#B71C1C] active:scale-95 transition-all shadow-sm">
                  Tạo vai trò
                </button>
              </div>
            </form>
          </div>
        </div>
        , document.body)}
      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          onClose={() => setConfirmConfig(null)}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          cancelText={confirmConfig.cancelText}
          type={confirmConfig.type}
        />
      )}

      {showAddCustomUserModal && createPortal(
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 mx-4 border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider">Tùy chỉnh quyền tài khoản</h3>
              <button onClick={() => setShowAddCustomUserModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><X size={14} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-gray-500 mb-1 block">Phòng ban</label>
                  <select
                    value={addCustomUserDeptFilter}
                    onChange={e => setAddCustomUserDeptFilter(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 bg-gray-50/50 focus:outline-none focus:border-[#C62828]/40"
                  >
                    <option value="all">Tất cả</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 mb-1 block">Tìm kiếm</label>
                  <input
                    type="text"
                    placeholder="Tên, email..."
                    value={addCustomUserSearch}
                    onChange={e => setAddCustomUserSearch(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-gray-50/50 focus:outline-none focus:border-[#C62828]/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 mb-1.5 block">Danh sách tài khoản ({filteredAccountsToAdd.length})</label>
                <div
                  className="border border-gray-150 rounded-2xl overflow-y-auto max-h-[220px] divide-y divide-gray-100 bg-white"
                  style={{ scrollbarWidth: "thin" }}
                >
                  {filteredAccountsToAdd.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-8">Không tìm thấy tài khoản phù hợp</p>
                  ) : (
                    filteredAccountsToAdd.map(acc => {
                      const emp = employees.find(e => e.id === acc.employeeId)
                      const isSelected = selectedUserToAdd === acc.id
                      const roleName = rolesList.find(r => r.id === acc.roleId)?.name || acc.roleId

                      return (
                        <div
                          key={acc.id}
                          onClick={() => setSelectedUserToAdd(acc.id)}
                          className={`p-3 text-left transition-colors cursor-pointer flex items-center justify-between
                            ${isSelected
                              ? "bg-red-50/50 hover:bg-red-50"
                              : "hover:bg-gray-50/50"}`}
                        >
                          <div className="space-y-0.5 truncate">
                            <p className={`font-bold text-xs ${isSelected ? "text-[#C62828]" : "text-gray-800"}`}>
                              {emp ? emp.name : "Tài khoản vãng lai"}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">{acc.email}</p>
                            <div className="flex gap-1.5 flex-wrap">
                              {emp?.department && (
                                <span className="text-[9px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                  {emp.department}
                                </span>
                              )}
                              <span className="text-[9px] font-semibold text-[#C62828] bg-red-50/30 border border-red-100/50 px-1.5 py-0.5 rounded">
                                {roleName}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="selectedUserToAddRadio"
                              checked={isSelected}
                              onChange={() => setSelectedUserToAdd(acc.id)}
                              className="w-3.5 h-3.5 border-gray-300 text-[#C62828] focus:ring-[#C62828] cursor-pointer"
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddCustomUserModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all">Huỷ</button>
                <button
                  type="button"
                  disabled={!selectedUserToAdd}
                  onClick={() => handleAddCustomUser(selectedUserToAdd)}
                  className="flex-1 py-2.5 bg-[#C62828] text-white rounded-2xl text-sm font-bold hover:bg-[#B71C1C] disabled:opacity-50 active:scale-95 transition-all shadow-sm"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
        , document.body)}
    </div>
  )
}
