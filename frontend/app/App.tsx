import React, { useState, useEffect, useMemo, ReactNode } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  LayoutDashboard, Users, Clock, BarChart3, Bell,
  Wrench, LogOut, ChevronDown, ChevronRight,
  Shield, Wifi, CheckSquare, FileText, Calendar, User, Fingerprint, Settings, MessageCircle, Layers, Menu, Search, Check, Building2
} from "lucide-react"

import UserPortalApp from "./components/nhan-vien/UserApp"
import ApprovalManagement from "@/app/components/duyet-don/ApprovalManagement"
import OrgStructure from "./components/co-cau/OrgStructure"
import UserProfile from "./components/nhan-vien/UserProfile"
import IPManagement from "./components/IPManagement"
import AccountManagement from "./components/account/AccountManagement"
import StatisticsPage from "./components/thong-ke/StatisticsPage"

// Imported Vietnamese subfolders / modular components
import { LoginPage } from "./components/xac-thuc/LoginPage"
import { AdminDashboard } from "./components/tong-quan/AdminDashboard"
import { EmployeeManagement, EmployeeModal } from "./components/nhan-su/EmployeeManagement"
import { AttendanceManagement } from "./components/cham-cong/AttendanceManagement"
import { NotificationManagement } from "./components/thong-bao/NotificationManagement"
import { TaskManagement } from "./components/cong-viec/TaskManagement"
import { PlaceholderPage } from "./components/giao-dien/PlaceholderPage"
import { SystemConfigPage } from "./components/giao-dien/SystemConfigPage"
import { ProjectManagement } from "./components/du-an/ProjectManagement"

// Imported user portal components
import { UserHome } from "./components/nhan-vien/UserHome"
import UserAttendance from "./components/nhan-vien/UserAttendance"
import UserTimeOff from "./components/nhan-vien/UserTimeOff"
import { UserDirectory } from "./components/nhan-vien/UserDirectory"
import { UserChat } from "./components/nhan-vien/UserChat"
import { UserWorkflow } from "./components/nhan-vien/UserWorkflow"
import UserSettings from "./components/nhan-vien/UserSettings"

import { Role, Page, Employee, OrgNode, Assignment, RoleDefinition } from "./types"
import { INIT_EMPLOYEES, INIT_ORG_NODES, NOTIFICATIONS, INIT_ASSIGNMENTS } from "./constants"
import { findBranchForNode, initials } from "./utils"
import { api } from "@/lib/api"

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem("dudi_token")
  })
  const [role, setRole] = useState<Role>(() => {
    const saved = localStorage.getItem("dudi_user")
    if (saved) {
      try {
        const u = JSON.parse(saved)
        return u.roleId || "role-admin"
      } catch {
        return "role-admin"
      }
    }
    return "role-admin"
  })
  const [loggedEmail, setLoggedEmail] = useState(() => {
    const saved = localStorage.getItem("dudi_user")
    if (saved) {
      try {
        const u = JSON.parse(saved)
        return u.employeeId || u.email || ""
      } catch {
        return ""
      }
    }
    return ""
  })
  
  const navigate = useNavigate()
  const location = useLocation()

  const activePage: Page = (() => {
    const rawPath = location.pathname.replace(/^\//, "")
    if (!rawPath || rawPath === "") {
      return "dashboard"
    }
    const validPages: Page[] = [
      "dashboard", "nhan-su", "cham-cong", "thong-ke",
      "duyet-don", "thong-bao", "cong-viec", "du-an",
      "tai-khoan", "phan-quyen", "ip", "tien-ich", "co-cau",
      "user-profile", "user-attendance", "user-timeoff", "user-directory",
      "user-chat", "user-workflow", "user-settings"
    ]
    if (validPages.includes(rawPath as Page)) {
      return rawPath as Page
    }
    return "dashboard"
  })()

  const setActivePage = (page: Page) => navigate("/" + page)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [rolesList, setRolesList] = useState<RoleDefinition[]>([])
  const [isPageLoading, setIsPageLoading] = useState(false)

  useEffect(() => {
    setIsPageLoading(true)
    const t = setTimeout(() => setIsPageLoading(false), 300)
    return () => clearTimeout(t)
  }, [activePage])

  const activeRolePermissions = useMemo(() => {
    const currentRole = rolesList.find(r => r.id === role)
    if (currentRole) return currentRole.modules
    if (role === "role-admin") {
      return [
        "dashboard", "nhan-su", "co-cau", "cham-cong", "duyet-don", 
        "tai-khoan", "phan-quyen", "ip", "thong-ke", "thong-bao", "du-an", "cong-viec", "tien-ich"
      ]
    }
    if (role === "role-manager") {
      return [
        "dashboard", "nhan-su", "co-cau", "cham-cong", "duyet-don", 
        "thong-ke", "thong-bao", "du-an", "cong-viec", "tien-ich"
      ]
    }
    // Default to role-user:
    return [
      "dashboard", "user-profile", "user-attendance", "user-timeoff", 
      "user-directory", "user-chat", "user-workflow", "cong-viec", "thong-bao", "user-settings"
    ]
  }, [role, rolesList])

  const roleName = useMemo(() => {
    const currentRole = rolesList.find(r => r.id === role)
    if (currentRole) return currentRole.name
    if (role === "role-admin") return "Quản trị hệ thống"
    if (role === "role-manager") return "Quản lý cấp trung"
    return "Nhân viên"
  }, [role, rolesList])

  useEffect(() => {
    if (isLoggedIn && activeRolePermissions.length > 0 && activePage !== "dashboard") {
      if (!activeRolePermissions.includes(activePage)) {
        setActivePage("dashboard")
      }
    }
  }, [activePage, activeRolePermissions, isLoggedIn])

  const [employees, setEmployees] = useState<Employee[]>(INIT_EMPLOYEES)
  const [orgNodes, setOrgNodes] = useState<OrgNode[]>(INIT_ORG_NODES)
  const [assignments, setAssignments] = useState<Assignment[]>(INIT_ASSIGNMENTS)
  const [requests, setRequests] = useState<any[]>([])
  const [loginError, setLoginError] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [globalAddEmpOpen, setGlobalAddEmpOpen] = useState(false)
  
  const [selectedBranch, setSelectedBranch] = useState(() => {
    const saved = localStorage.getItem("dudi_user")
    if (saved) {
      try {
        const u = JSON.parse(saved)
        return u.branchId || "all"
      } catch {
        return "all"
      }
    }
    return "all"
  })
  
  const branches = orgNodes.filter(n => n.type === "branch")

  const fetchRequests = () => {
    if (isLoggedIn) {
      api.requests.list().then(d => {
        if (d && Array.isArray(d)) setRequests(d as any[])
      }).catch(err => console.error("Lỗi tải requests:", err))
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      api.roles.list().then(d => {
        if (d && Array.isArray(d)) setRolesList(d as RoleDefinition[])
      }).catch(err => console.error("Lỗi tải roles:", err))

      Promise.all([
        api.employees.list().then(d => {
          if (d && Array.isArray(d)) setEmployees(d as Employee[])
        }),
        api.orgNodes.list().then(d => {
          if (d && Array.isArray(d)) setOrgNodes(d as OrgNode[])
        }),
        api.assignments.list().then(d => {
          if (d && Array.isArray(d)) setAssignments(d as Assignment[])
        }),
        api.requests.list().then(d => {
          if (d && Array.isArray(d)) setRequests(d as any[])
        })
      ]).catch(err => console.error("Lỗi tải dữ liệu ban đầu:", err))
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (isLoggedIn && role === "role-manager" && orgNodes.length > 0) {
      const emp = employees.find(e => 
        e.email.toLowerCase() === loggedEmail.toLowerCase() ||
        e.id.toLowerCase() === loggedEmail.toLowerCase()
      )
      if (emp?.orgNodeId) {
        const branchId = findBranchForNode(emp.orgNodeId, orgNodes)
        setSelectedBranch(branchId)
      }
    }
  }, [isLoggedIn, role, orgNodes, employees, loggedEmail])

  const handleLogin = async (email: string, pass: string) => {
    setLoginError(null)
    try {
      const res = await api.auth.login(email, pass)
      if (res && res.token) {
        localStorage.setItem("dudi_token", res.token)
        localStorage.setItem("dudi_user", JSON.stringify(res.user))
        const user = res.user as any
        const r = user.roleId as Role
        setRole(r)
        setLoggedEmail(user.employeeId || user.email || email)
        setSelectedBranch(user.branchId || "all")
        setIsLoggedIn(true)
        setActivePage("dashboard")
      }
    } catch (e) {
      console.error("Backend login failed:", e)
      const isConnectionError = e instanceof Error && (
        e.message.includes("Failed to fetch") || 
        e.message.includes("fetch failed") || 
        e.message.includes("NetworkError")
      )
      const errorMsg = isConnectionError 
        ? "Không thể kết nối tới backend. Hãy chắc chắn backend đang chạy tại http://localhost:3001"
        : (e instanceof Error ? e.message : "Đăng nhập thất bại")
      setLoginError(errorMsg)
      return
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("dudi_token")
    localStorage.removeItem("dudi_user")
    setIsLoggedIn(false)
    setRole("role-admin")
    setLoggedEmail("")
    setSelectedBranch("all")
    setActivePage("dashboard")
  }

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} loginError={loginError} />

  // ─── USER PORTAL: completely separate layout (no sidebar) ───
  if (role === "role-user") {
    return <UserPortalApp onLogout={handleLogout} modules={activeRolePermissions} />
  }

  const matchedEmp = employees.find(e => 
    e.id.toLowerCase() === loggedEmail.toLowerCase() || 
    e.email.toLowerCase() === loggedEmail.toLowerCase()
  )
  const currentEmp: Employee = matchedEmp || {
    id: loggedEmail || "—",
    name: role === "admin" ? "Quản trị viên" : "Nhân viên",
    email: loggedEmail || "—",
    phone: "—",
    department: "Ban điều hành",
    position: role === "admin" ? "System Admin" : "Nhân sự",
    joinDate: "—",
    status: "active" as "active" | "inactive" | "intern",
    contractType: "Chính thức",
    orgNodeId: "branch-hcm"
  }
  const currentUserInfo = {
    name: currentEmp.name,
    id: currentEmp.id,
    role: role as Role,
    position: currentEmp.position,
    department: currentEmp.department
  }

  const renderPage = () => {
    if (activePage !== "dashboard" && activeRolePermissions.length > 0 && !activeRolePermissions.includes(activePage)) {
      return (role as string) === "user" ? <UserHome onNavigate={setActivePage} /> : <AdminDashboard onNavigate={setActivePage} />
    }
    switch (activePage) {
      case "dashboard": return (role as string) === "user" ? <UserHome onNavigate={setActivePage} /> : <AdminDashboard onNavigate={setActivePage} />
      case "nhan-su": return <EmployeeManagement employees={employees} setEmployees={setEmployees} orgNodes={orgNodes} selectedBranch={selectedBranch} onBranchChange={setSelectedBranch} />
      case "co-cau": return (
        <OrgStructure 
          employees={employees} 
          setEmployees={setEmployees} 
          assignments={assignments}
          setAssignments={setAssignments}
          orgNodes={orgNodes} 
          setOrgNodes={setOrgNodes} 
          selectedNodeId={selectedNodeId} 
          setSelectedNodeId={setSelectedNodeId} 
          selectedBranch={selectedBranch} 
          currentUserEmail={loggedEmail} 
          currentUserRole={role}
          onAddEmployee={() => setGlobalAddEmpOpen(true)}
        />
      )
      case "cham-cong": return <AttendanceManagement />
      case "thong-ke": return <StatisticsPage selectedBranch={selectedBranch} currentUserEmail={loggedEmail} currentUserRole={role} />
      case "thong-bao": return <NotificationManagement />
      case "duyet-don": return <ApprovalManagement selectedBranch={selectedBranch} onRequestsUpdated={fetchRequests} />
      case "tai-khoan": return <AccountManagement selectedBranch={selectedBranch} currentUserEmail={loggedEmail} currentUserRole={role} mode="accounts" />
      case "phan-quyen": return <AccountManagement selectedBranch={selectedBranch} currentUserEmail={loggedEmail} currentUserRole={role} mode="roles" />
      case "ip": return <IPManagement selectedBranch={selectedBranch} />
      case "du-an": return <ProjectManagement currentUserId={currentEmp.id} currentUserRole={role} selectedBranch={selectedBranch} />
      case "cong-viec": return <TaskManagement selectedBranch={selectedBranch} />
      case "tien-ich": return <SystemConfigPage />
      case "user-profile": return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800">Thông tin cá nhân</h2>
          <UserProfile emp={currentEmp} />
        </div>
      )
      case "user-attendance": return <UserAttendance />
      case "user-timeoff": return <UserTimeOff />
      case "user-directory": return <UserDirectory />
      case "user-chat": return <UserChat />
      case "user-workflow": return <UserWorkflow />
      case "user-settings": return <UserSettings onLogout={handleLogout} />
      default: return (role as string) === "user" ? <UserHome onNavigate={setActivePage} /> : <AdminDashboard onNavigate={setActivePage} />
    }
  }

  const unreadNotifs = NOTIFICATIONS.filter(n => !n.read).length

  return (
    <div className="flex h-screen bg-[#F5F1EF] overflow-hidden" onClick={() => { }}>
      <UserAwareSidebar active={activePage} onNavigate={setActivePage}
        collapsed={sidebarCollapsed} role={role} roleName={roleName} modules={activeRolePermissions} onLogout={handleLogout}
        pendingRequestsCount={requests.filter(r => r.status === "pending").length} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          onToggle={() => setSidebarCollapsed(p => !p)}
          unread={unreadNotifs}
          currentUser={currentUserInfo}
          onLogout={handleLogout}
          onNavigate={setActivePage}
          selectedBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
          branches={branches}
        />
        <main className="flex-1 overflow-y-auto p-5 relative"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e7eb transparent" }}>
          {isPageLoading && (
            <div className="absolute top-0 left-0 right-0 h-0.5 z-[100] overflow-hidden pointer-events-none">
              <div className="h-full bg-gradient-to-r from-[#C62828] to-[#E64A19] animate-[loadingBar_0.4s_ease-out_forwards]" />
            </div>
          )}
          <div key={activePage} className="page-enter-active">
            {renderPage()}
          </div>
          {globalAddEmpOpen && (
            <EmployeeModal
              editEmp={null}
              employees={employees}
              orgNodes={orgNodes}
              onClose={() => setGlobalAddEmpOpen(false)}
              onSave={async (form) => {
                const snapshotDate = new Date().toISOString().split("T")[0].split("-").reverse().join("/")
                const path = []
                let curr = orgNodes.find(n => n.id === form.orgNodeId)
                while (curr) {
                  path.push(curr.name)
                  const pId = curr.parentId
                  curr = pId ? orgNodes.find(n => n.id === pId) : undefined
                }
                const snapshot = path.reverse().join(" · ")

                const joinEntry = {
                  id: 1,
                  type: "join" as const,
                  date: form.joinDate || snapshotDate,
                  toDate: "",
                  title: form.position || "Nhân viên",
                  orgNodeId: form.orgNodeId,
                  snapshot: snapshot,
                  note: "Tiếp nhận nhân sự mới"
                }
                const finalForm = { ...form, workHistory: [joinEntry] }

                try {
                  const created = await api.employees.create(finalForm) as Employee
                  setEmployees(prev => [...prev, created])
                } catch {
                  const newId = `NV${String(employees.length + 1).padStart(3, "0")}`
                  setEmployees(prev => [...prev, { id: newId, ...finalForm } as Employee])
                }
                setGlobalAddEmpOpen(false)
              }}
            />
          )}
        </main>
      </div>
    </div>
  )
}

function Header({ onToggle, unread, currentUser, onLogout, onNavigate, selectedBranch, onBranchChange, branches }: {
  onToggle: () => void; unread: number
  currentUser: { name: string; id: string; role: Role; position: string; department: string }
  onLogout: () => void
  onNavigate: (p: Page) => void
  selectedBranch: string
  onBranchChange: (b: string) => void
  branches: { id: string; name: string }[]
}) {
  const [showDrop, setShowDrop] = useState(false)
  const [showBranchDrop, setShowBranchDrop] = useState(false)
  const [showNotifDrop, setShowNotifDrop] = useState(false)
  const [notifs, setNotifs] = useState<any[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const shortName = currentUser.name.split(" ").slice(-2).join(" ")

  async function openNotifs() {
    setShowNotifDrop(v => !v)
    if (!notifs.length) {
      setLoadingNotifs(true)
      try {
        const data = await api.notifications.list() as any[]
        setNotifs(data)
      } finally {
        setLoadingNotifs(false)
      }
    }
  }

  async function markAllRead() {
    await api.notifications.markAllRead()
    setNotifs(ns => ns.map(n => ({ ...n, read: true })))
  }
  return (
    <header className="bg-white border-b border-black/5 px-5 py-3 flex items-center gap-4 flex-shrink-0 relative">
      <button onClick={onToggle} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
        <Menu size={20} />
      </button>
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Tìm kiếm nhân viên, ID..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:outline-none focus:border-[#C62828]/40 focus:ring-2 focus:ring-[#C62828]/10 transition-all" />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        {currentUser.role === "role-admin" && (
          <div className="relative">
            <button
              onClick={() => setShowBranchDrop(!showBranchDrop)}
              className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-xl px-3.5 py-2 border border-gray-100 shadow-sm transition-all active:scale-[0.98] text-xs font-bold text-gray-700 flex-shrink-0 cursor-pointer"
            >
              <Building2 size={13.5} className="text-gray-400" />
              <span>
                {selectedBranch === "all"
                  ? "Tất cả chi nhánh"
                  : (branches.find(b => b.id === selectedBranch)?.name || "Tất cả chi nhánh")}
              </span>
              <ChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${showBranchDrop ? "rotate-180" : ""}`} />
            </button>

            {showBranchDrop && (
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setShowBranchDrop(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-100 shadow-xl py-1.5 z-[100] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => {
                      onBranchChange("all")
                      setShowBranchDrop(false)
                    }}
                    className={`px-4 py-2 text-left text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedBranch === "all" ? "text-[#C62828] bg-red-50/40" : "text-gray-600"}`}
                  >
                    <span>Tất cả chi nhánh</span>
                    {selectedBranch === "all" && <Check size={12} className="flex-shrink-0 text-[#C62828]" />}
                  </button>
                  {branches.map(b => (
                    <button
                      key={b.id}
                      onClick={() => {
                        onBranchChange(b.id)
                        setShowBranchDrop(false)
                      }}
                      className={`px-4 py-2 text-left text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedBranch === b.id ? "text-[#C62828] bg-red-50/40" : "text-gray-600"}`}
                    >
                      <span className="truncate">{b.name}</span>
                      {selectedBranch === b.id && <Check size={12} className="flex-shrink-0 text-[#C62828]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {/* Notification dropdown */}
        <div className="relative">
          <button onClick={openNotifs} className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
            <Bell size={19} />
            {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C62828] rounded-full animate-pulse" />}
          </button>
          {showNotifDrop && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifDrop(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-black/8 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-black text-gray-800">Thông báo</p>
                  <button onClick={markAllRead} className="text-[11px] font-bold text-[#C62828] hover:underline">Đọc tất cả</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {loadingNotifs ? (
                    <div className="p-8 text-center">
                      <div className="w-6 h-6 rounded-full border-2 border-[#C62828]/30 border-t-[#C62828] animate-spin mx-auto" />
                    </div>
                  ) : notifs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-400">Không có thông báo nào</div>
                  ) : notifs.map((n: any) => (
                    <button key={n.id} onClick={async () => { await api.notifications.markRead(n.id); setNotifs(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x)) }}
                      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 ${!n.read ? "bg-red-50/30" : ""}`}>
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? "bg-[#C62828]" : "bg-gray-200"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-relaxed ${!n.read ? "font-bold text-gray-800" : "text-gray-500"}`}>{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {currentUser.role === "role-admin" && (
                  <div className="border-t border-gray-100 p-2">
                    <button onClick={() => { setShowNotifDrop(false); onNavigate("thong-bao") }}
                      className="w-full text-center text-xs font-bold text-[#C62828] py-2 hover:bg-red-50 rounded-xl transition-colors">
                      Quản lý thông báo hệ thống →
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        {/* User dropdown */}
        <div className="relative">
          <button onClick={() => setShowDrop(p => !p)}
            className="flex items-center gap-2.5 pl-3 border-l border-gray-100 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white text-xs font-bold">
              {initials(currentUser.name)}
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-gray-700 leading-none">{shortName}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{currentUser.id}</div>
            </div>
            <ChevronDown size={13} className={`text-gray-400 transition-transform ${showDrop ? "rotate-180" : ""}`} />
          </button>
          {showDrop && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-black/8 z-50 overflow-hidden">
              {/* User info */}
              <div className="p-4 bg-gradient-to-br from-[#C62828]/5 to-[#E64A19]/5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white text-lg font-bold">
                    {initials(currentUser.name)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{currentUser.name}</div>
                    <div className="text-xs text-gray-500">{currentUser.position} · {currentUser.department}</div>
                    <div className="text-[10px] font-mono text-[#C62828] mt-0.5">{currentUser.id}</div>
                  </div>
                </div>
                <div className={`mt-3 text-center text-xs font-bold py-1 rounded-lg
                  ${currentUser.role === "role-admin" ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600"}`}>
                  {currentUser.role === "role-admin" ? "👑 Quản trị viên" : "🧑‍💻 Nhân viên"}
                </div>
              </div>
              {/* Menu items */}
              <div className="py-1">
                <button onClick={() => { onNavigate(currentUser.role === "role-admin" ? "tai-khoan" : "user-settings"); setShowDrop(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <Settings size={15} className="text-gray-400" />
                  Cài đặt tài khoản
                </button>
                <button onClick={() => { onNavigate("user-profile"); setShowDrop(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <User size={15} className="text-gray-400" />
                  Thông tin cá nhân
                </button>
              </div>
              <div className="border-t border-gray-100 py-1">
                <button onClick={() => { onLogout(); setShowDrop(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                  <LogOut size={15} />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function NavItem({ page, icon: Icon, label, badge, active, onNavigate, collapsed }: {
  page: Page; icon: React.ElementType; label: string; badge?: number
  active: Page; onNavigate: (p: Page) => void; collapsed: boolean
}) {
  const isActive = active === page
  return (
    <button onClick={() => onNavigate(page)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer
        ${isActive ? "bg-[#C62828]/14 text-[#FF7B5A] font-semibold" : "text-white/55 hover:bg-white/8 hover:text-white/85"}`}>
      <Icon size={18} className="flex-shrink-0" />
      {!collapsed && <span className="flex-1 text-left font-medium">{label}</span>}
      {!collapsed && badge ? <span className="bg-[#FF6D00] text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{badge}</span> : null}
    </button>
  )
}

function GroupNav({ gKey, icon: Icon, label, pages, children, active, onNavigate, collapsed, expanded, onToggle }: {
  gKey: string; icon: React.ElementType; label: string; pages: Page[]; children: ReactNode
  active: Page; onNavigate: (p: Page) => void; collapsed: boolean
  expanded: string[]; onToggle: (k: string) => void
}) {
  const open = expanded.includes(gKey)
  const hasActiveChild = pages.includes(active)
  return (
    <div>
      <button onClick={() => onToggle(gKey)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer
          ${hasActiveChild ? "text-white font-semibold" : "text-white/60 hover:bg-white/8 hover:text-white/90"}`}>
        <Icon size={18} className={`flex-shrink-0 ${hasActiveChild ? "text-[#FF8A65]" : "text-white/60"}`} />
        {!collapsed && <>
          <span className="flex-1 text-left font-medium">{label}</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </>}
      </button>
      {!collapsed && open && (
        <div className="ml-4 mt-1 border-l border-white/10 pl-3 space-y-0.5">{children}</div>
      )}
    </div>
  )
}

function SubItem({ page, label, badge, active, onNavigate }: {
  page: Page; label: string; badge?: number
  active: Page; onNavigate: (p: Page) => void
}) {
  return (
    <button onClick={() => onNavigate(page)}
      className={`w-full flex items-center justify-between text-xs py-2 px-2 rounded-lg transition-all cursor-pointer
        ${active === page ? "text-[#FF8A65] font-semibold" : "text-white/45 hover:text-white/80"}`}>
      <span>{label}</span>
      {badge ? <span className="bg-[#FF6D00] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">{badge}</span> : null}
    </button>
  )
}

function UserAwareSidebar({ active, onNavigate, collapsed, role, roleName, modules, onLogout, pendingRequestsCount = 0 }:
  { active: Page; onNavigate: (p: Page) => void; collapsed: boolean; role: Role; roleName: string; modules: string[]; onLogout: () => void; pendingRequestsCount?: number }) {

  const [expanded, setExpanded] = useState<string[]>(["nhan-su"])
  const toggle = (k: string) => setExpanded(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k])

  const hasAccess = (moduleKey: string) => modules.includes(moduleKey)

  return (
    <aside className={`${collapsed ? "w-16" : "w-60"} bg-[#160606] flex flex-col transition-all duration-300 flex-shrink-0 overflow-hidden relative z-40`}>
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-white/5">
        <div className="w-9 h-9 bg-[#C62828] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
          <span className="text-white text-xs font-black leading-none">D<br /><span className="text-[8px] font-semibold tracking-wide">S</span></span>
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-black text-sm tracking-wide leading-none">DUDI</div>
            <div className="text-white/40 text-xs font-medium">software</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 py-2" style={{ scrollbarWidth: "none" }}>
        {hasAccess("dashboard") && <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" active={active} onNavigate={onNavigate} collapsed={collapsed} />}

        {(hasAccess("nhan-su") || hasAccess("co-cau") || hasAccess("cham-cong") || hasAccess("duyet-don")) && (
          <GroupNav
            gKey="nhan-su"
            icon={Users}
            label="Quản lý nhân sự"
            pages={["nhan-su", "co-cau", "cham-cong", "duyet-don"].filter(hasAccess) as Page[]}
            active={active} onNavigate={onNavigate} collapsed={collapsed}
            expanded={expanded} onToggle={toggle}
          >
            {hasAccess("nhan-su") && <SubItem page="nhan-su" label="Danh sách nhân viên" active={active} onNavigate={onNavigate} />}
            {hasAccess("co-cau") && <SubItem page="co-cau" label="Cơ cấu tổ chức" active={active} onNavigate={onNavigate} />}
            {hasAccess("cham-cong") && <SubItem page="cham-cong" label="Quản lý chấm công" active={active} onNavigate={onNavigate} />}
            {hasAccess("duyet-don") && <SubItem page="duyet-don" label="Duyệt đơn & Time off" badge={pendingRequestsCount} active={active} onNavigate={onNavigate} />}
          </GroupNav>
        )}

        {(hasAccess("tai-khoan") || hasAccess("phan-quyen") || hasAccess("ip")) && (
          <GroupNav
            gKey="quan-tri"
            icon={Shield}
            label="Quản trị hệ thống"
            pages={["tai-khoan", "phan-quyen", "ip"].filter(hasAccess) as Page[]}
            active={active} onNavigate={onNavigate} collapsed={collapsed}
            expanded={expanded} onToggle={toggle}
          >
            {hasAccess("tai-khoan") && <SubItem page="tai-khoan" label="Quản lý tài khoản" active={active} onNavigate={onNavigate} />}
            {hasAccess("phan-quyen") && <SubItem page="phan-quyen" label="Phân quyền vai trò" active={active} onNavigate={onNavigate} />}
            {hasAccess("ip") && <SubItem page="ip" label="Danh sách IP" active={active} onNavigate={onNavigate} />}
          </GroupNav>
        )}

        {hasAccess("thong-ke") && <NavItem page="thong-ke" icon={BarChart3} label="Báo cáo thống kê" active={active} onNavigate={onNavigate} collapsed={collapsed} />}
        {hasAccess("thong-bao") && <NavItem page="thong-bao" icon={Bell} label="Thông báo" badge={2} active={active} onNavigate={onNavigate} collapsed={collapsed} />}
        {hasAccess("du-an") && <NavItem page="du-an" icon={Layers} label="Quản lý dự án" active={active} onNavigate={onNavigate} collapsed={collapsed} />}
        {hasAccess("cong-viec") && <NavItem page="cong-viec" icon={CheckSquare} label="Quản lý công việc" active={active} onNavigate={onNavigate} collapsed={collapsed} />}
        {hasAccess("tien-ich") && <NavItem page="tien-ich" icon={Wrench} label="Tiện ích" active={active} onNavigate={onNavigate} collapsed={collapsed} />}
      </nav>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <div className={`rounded-xl px-3 py-2 text-center text-xs font-bold
            ${role === "role-admin" ? "bg-amber-500/20 text-amber-300" : "bg-white/8 text-white/50"}`}>
            {roleName}
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="p-2 border-t border-white/5">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-50/10 transition-all">
          <LogOut size={18} />
          {!collapsed && <span className="font-medium">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  )
}
