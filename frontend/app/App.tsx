import React, { useState, useEffect, ReactNode } from "react"
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
import { EmployeeManagement } from "./components/nhan-su/EmployeeManagement"
import { AttendanceManagement } from "./components/cham-cong/AttendanceManagement"
import { NotificationManagement } from "./components/thong-bao/NotificationManagement"
import { TaskManagement } from "./components/cong-viec/TaskManagement"
import { PlaceholderPage } from "./components/giao-dien/PlaceholderPage"
import { SystemConfigPage } from "./components/giao-dien/SystemConfigPage"

// Imported user portal components
import { UserHome } from "./components/nhan-vien/UserHome"
import UserAttendance from "./components/nhan-vien/UserAttendance"
import UserTimeOff from "./components/nhan-vien/UserTimeOff"
import { UserDirectory } from "./components/nhan-vien/UserDirectory"
import { UserChat } from "./components/nhan-vien/UserChat"
import { UserWorkflow } from "./components/nhan-vien/UserWorkflow"
import UserSettings from "./components/nhan-vien/UserSettings"

import { Role, Page, Employee, OrgNode, Assignment } from "./types"
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
        return u.role || "admin"
      } catch {
        return "admin"
      }
    }
    return "admin"
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
      "duyet-don", "thong-bao", "cong-viec",
      "tai-khoan", "ip", "tien-ich", "co-cau",
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
  const [employees, setEmployees] = useState<Employee[]>(INIT_EMPLOYEES)
  const [orgNodes, setOrgNodes] = useState<OrgNode[]>(INIT_ORG_NODES)
  const [assignments, setAssignments] = useState<Assignment[]>(INIT_ASSIGNMENTS)
  const [loginError, setLoginError] = useState<string | null>(null)
  
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

  useEffect(() => {
    if (isLoggedIn) {
      Promise.all([
        api.employees.list().then(d => {
          if (d && Array.isArray(d)) setEmployees(d as Employee[])
        }),
        api.orgNodes.list().then(d => {
          if (d && Array.isArray(d)) setOrgNodes(d as OrgNode[])
        }),
        api.assignments.list().then(d => {
          if (d && Array.isArray(d)) setAssignments(d as Assignment[])
        })
      ]).catch(err => console.error("Lỗi tải dữ liệu ban đầu:", err))
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (isLoggedIn && role === "manager" && orgNodes.length > 0) {
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
        const r = user.role as Role
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
    setRole("admin")
    setLoggedEmail("")
    setSelectedBranch("all")
    setActivePage("dashboard")
  }

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} loginError={loginError} />

  // ─── USER PORTAL: completely separate layout (no sidebar) ───
  if (role === "user") {
    return <UserPortalApp onLogout={handleLogout} />
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
          selectedNodeId={null} 
          setSelectedNodeId={() => {}} 
          selectedBranch={selectedBranch} 
          currentUserEmail={loggedEmail} 
          currentUserRole={role}
        />
      )
      case "cham-cong": return <AttendanceManagement />
      case "thong-ke": return <StatisticsPage selectedBranch={selectedBranch} currentUserEmail={loggedEmail} currentUserRole={role} />
      case "duyet-don": return <ApprovalManagement selectedBranch={selectedBranch} />
      case "tai-khoan": return <AccountManagement selectedBranch={selectedBranch} currentUserEmail={loggedEmail} currentUserRole={role} />
      case "ip": return <IPManagement selectedBranch={selectedBranch} />
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
        collapsed={sidebarCollapsed} role={role} onLogout={handleLogout} />
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
        <main className="flex-1 overflow-y-auto p-5"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e7eb transparent" }}>
          {renderPage()}
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
  const shortName = currentUser.name.split(" ").slice(-2).join(" ")
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
        {currentUser.role === "admin" && (
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
        <button onClick={() => onNavigate("thong-bao")} className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
          <Bell size={19} />
          {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C62828] rounded-full" />}
        </button>
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
                  ${currentUser.role === "admin" ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600"}`}>
                  {currentUser.role === "admin" ? "👑 Quản trị viên" : "🧑‍💻 Nhân viên"}
                </div>
              </div>
              {/* Menu items */}
              <div className="py-1">
                <button onClick={() => { onNavigate(currentUser.role === "admin" ? "tai-khoan" : "user-settings"); setShowDrop(false) }}
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

function UserAwareSidebar({ active, onNavigate, collapsed, role, onLogout }:
  { active: Page; onNavigate: (p: Page) => void; collapsed: boolean; role: Role; onLogout: () => void }) {

  const [expanded, setExpanded] = useState<string[]>(["nhan-su"])
  const toggle = (k: string) => setExpanded(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k])

  function NavItem({ page, icon: Icon, label, badge }: { page: Page; icon: React.ElementType; label: string; badge?: number }) {
    const isActive = active === page
    return (
      <button onClick={() => onNavigate(page)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150
          ${isActive ? "bg-[#C62828]/14 text-[#FF7B5A] font-semibold" : "text-white/55 hover:bg-white/8 hover:text-white/85"}`}>
        <Icon size={18} className="flex-shrink-0" />
        {!collapsed && <span className="flex-1 text-left font-medium">{label}</span>}
        {!collapsed && badge ? <span className="bg-[#FF6D00] text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{badge}</span> : null}
      </button>
    )
  }

  function GroupNav({ gKey, icon: Icon, label, children }: { gKey: string; icon: React.ElementType; label: string; children: ReactNode }) {
    const open = expanded.includes(gKey)
    return (
      <div>
        <button onClick={() => toggle(gKey)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/8 hover:text-white/90 transition-all duration-150">
          <Icon size={18} className="flex-shrink-0" />
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

  function SubItem({ page, label }: { page: Page; label: string }) {
    return (
      <button onClick={() => onNavigate(page)}
        className={`w-full text-left text-xs py-2 px-2 rounded-lg transition-all
          ${active === page ? "text-[#FF8A65] font-semibold" : "text-white/45 hover:text-white/80"}`}>
        {label}
      </button>
    )
  }

  return (
    <aside className={`${collapsed ? "w-16" : "w-60"} bg-[#160606] flex flex-col transition-all duration-300 flex-shrink-0 overflow-hidden`}>
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
        <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />

        {role === "admin" || role === "manager" ? (
          <>
            <GroupNav gKey="nhan-su" icon={Users} label="Quản lý nhân sự">
              <SubItem page="nhan-su" label="Danh sách nhân viên" />
              <SubItem page="co-cau" label="Cơ cấu tổ chức" />
              <SubItem page="cham-cong" label="Quản lý chấm công" />
            </GroupNav>
            <NavItem page="thong-ke" icon={BarChart3} label="Báo cáo thống kê" />
            <NavItem page="tai-khoan" icon={Shield} label="Quản lý tài khoản" />
            <NavItem page="ip" icon={Wifi} label="Quản lý IP" />
            <NavItem page="duyet-don" icon={FileText} label="Duyệt đơn & Time off" badge={5} />
            <NavItem page="thong-bao" icon={Bell} label="Thông báo" badge={2} />
            <NavItem page="cong-viec" icon={CheckSquare} label="Quản lý công việc" />
            <NavItem page="tien-ich" icon={Wrench} label="Tiện ích" />
          </>
        ) : (
          <>
            <NavItem page="user-profile" icon={User} label="Thông tin nhân viên" />
            <NavItem page="user-attendance" icon={Fingerprint} label="Check-in / Check-out" />
            <NavItem page="user-timeoff" icon={Calendar} label="Đăng ký Time Off" />
            <NavItem page="user-directory" icon={Users} label="Danh bạ nội bộ" />
            <NavItem page="user-chat" icon={MessageCircle} label="Chat nội bộ" />
            <NavItem page="user-workflow" icon={Layers} label="Quy trình nội bộ" />
            <NavItem page="cong-viec" icon={CheckSquare} label="Công việc của tôi" />
            <NavItem page="thong-bao" icon={Bell} label="Thông báo" badge={2} />
            <NavItem page="user-settings" icon={Settings} label="Cài đặt tài khoản" />
          </>
        )}
      </nav>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <div className={`rounded-xl px-3 py-2 text-center text-xs font-bold
            ${role === "admin" ? "bg-amber-500/20 text-amber-300" : "bg-white/8 text-white/50"}`}>
            {role === "admin" ? "👑 Quản trị viên" : "🧑‍💻 Nhân viên"}
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
