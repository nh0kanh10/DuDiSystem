import React, { useState, useEffect, useMemo, ReactNode, useRef } from "react"
import { useNavigate, useLocation, Routes, Route } from "react-router-dom"
import {
  LayoutDashboard, Users, Clock, BarChart3, Bell,
  Wrench, LogOut, ChevronDown, ChevronRight,
  Shield, Wifi, CheckSquare, FileText, Calendar, User, Fingerprint, Settings, MessageCircle, Layers, Menu, Check, Building2, X, TrendingUp
} from "lucide-react"

import UserPortalApp from "./components/nhan-vien/UserApp"
import UserDashboard from "./components/nhan-vien/UserDashboard"
import { StaffPortalFab } from "./components/nhan-vien/StaffPortalFab"
import { canOpenStaffPortal, isStaffTypeRole, hasPageAccess } from "./utils/staffModules"
import ApprovalManagement from "@/app/components/duyet-don/ApprovalManagement"
import OrgStructure from "./components/co-cau/OrgStructure"
import UserProfile from "./components/nhan-vien/UserProfile"
import IPManagement from "./components/cham-cong/IPManagement"
import AccountManagement from "./components/account/AccountManagement"
import StatisticsPage from "./components/thong-ke/StatisticsPage"

import { LoginPage } from "./components/xac-thuc/LoginPage"
import { BrandLogo } from "./components/ui/BrandLogo"
import { AdminDashboard } from "./components/tong-quan/AdminDashboard"
import { EmployeeManagement, EmployeeModal } from "./components/nhan-su/EmployeeManagement"
import { AttendanceManagement } from "./components/cham-cong/AttendanceManagement"
import { NotificationManagement } from "./components/thong-bao/NotificationManagement"
import { TaskManagement } from "./components/cong-viec/TaskManagement"
import { PlaceholderPage } from "./components/giao-dien/PlaceholderPage"
import { SystemConfigPage } from "./components/giao-dien/SystemConfigPage"
import { ProjectManagement } from "./components/du-an/ProjectManagement"
import { CrmAdminPage } from "./components/crm/CrmAdminPage"
import { CrmStaffPage } from "./components/crm/CrmStaffPage"
import { LeadManagement } from "./components/lead/LeadManagement"
import { PublicRequirementForm } from "./components/lead/PublicRequirementForm"
import { KpiManagementAdmin } from "./components/kpi/KpiManagementAdmin"
import { clearKpiMockData } from "./components/kpi/kpiMockData"

import UserAttendance from "./components/nhan-vien/UserAttendance"
import UserTimeOff from "./components/nhan-vien/UserTimeOff"
import { UserDirectory } from "./components/nhan-vien/UserDirectory"
import { UserChat } from "./components/nhan-vien/UserChat"
import { UserWorkflow } from "./components/nhan-vien/UserWorkflow"
import UserSettings from "./components/nhan-vien/UserSettings"

import { Role, Page, Employee, OrgNode, Assignment, RoleDefinition } from "./types"
import { INIT_EMPLOYEES, INIT_ORG_NODES, NOTIFICATIONS, INIT_ASSIGNMENTS } from "./constants"
import { findBranchForNode, initials } from "./utils"
import { api, writeStoredAuthUser } from "@/lib/api"
import { connectChatSocket, releaseChatSocket, resetChatSocket, chatHeartbeat, getChatSocketStatus } from "@/lib/chatSocket"
import { useNotificationBadge } from "./hooks/useNotifications"
import { touchSession, resetSessionTouchClock } from "@/lib/session"
import { ToastProvider, useToast } from "./hooks/useToast"

function getISOWeek(d: Date): number {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  dt.setUTCDate(dt.getUTCDate() + 4 - (dt.getUTCDay() || 7))
  const y = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1))
  return Math.ceil((((dt.getTime() - y.getTime()) / 86400000) + 1) / 7)
}

function parseVnDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split("/").map(Number)
  return new Date(year, month - 1, day)
}

function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
}

function getDateRange(startStr: string, endStr: string): Date[] {
  const start = parseVnDate(startStr)
  const end = parseVnDate(endStr)
  const dates: Date[] = []
  const current = new Date(start)
  while (current <= end) {
    if (!isWeekend(current)) {
      dates.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem("dudi_token") || !!sessionStorage.getItem("dudi_token")
  })
  const [role, setRole] = useState<Role>(() => {
    const saved = localStorage.getItem("dudi_user") || sessionStorage.getItem("dudi_user")
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
    const saved = localStorage.getItem("dudi_user") || sessionStorage.getItem("dudi_user")
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
  const [sessionTimeout, setSessionTimeout] = useState<number>(30)
  const { showToast } = useToast()
  const [loginLoading, setLoginLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const activePage: Page = (() => {
    const rawPath = location.pathname.replace(/^\//, "")
    if (!rawPath || rawPath === "") {
      return "dashboard"
    }
    const validPages: Page[] = [
      "dashboard", "nhan-su", "cham-cong", "thong-ke",
      "duyet-don", "thong-bao", "cong-viec", "du-an", "lead",
      "tai-khoan", "phan-quyen", "ip", "tien-ich", "co-cau",
      "crm", "staff-portal", "kpi", "kpi-stats", "kpi-compare",
      "user-profile", "user-attendance", "user-timeoff", "user-directory",
      "user-chat", "user-workflow", "user-settings", "user-crm"
    ]
    const firstSegment = rawPath.split("/")[0]
    if (validPages.includes(firstSegment as Page)) {
      return firstSegment as Page
    }
    return "dashboard"
  })()

  const setActivePage = (page: Page) => navigate("/" + page)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isMobileAdmin, setIsMobileAdmin] = useState(() => {
    if (typeof window === "undefined") return false
    return window.innerWidth < 1024
  })
  const [rolesList, setRolesList] = useState<RoleDefinition[]>([])
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [effectivePermissions, setEffectivePermissions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("dudi_user") || sessionStorage.getItem("dudi_user")
      const u = JSON.parse(saved || "{}")
      return Array.isArray(u.effectivePermissions) ? u.effectivePermissions : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    const cleaned = localStorage.getItem("dudi_kpi_mock_cleared_v2")
    if (!cleaned) {
      clearKpiMockData()
      localStorage.removeItem("dudi_kpi_mock_cleared_v1")
      localStorage.setItem("dudi_kpi_mock_cleared_v2", "1")
    }
  }, [])

  useEffect(() => {
    setIsPageLoading(true)
    const t = setTimeout(() => setIsPageLoading(false), 300)
    return () => clearTimeout(t)
  }, [activePage])

  useEffect(() => {
    const onResize = () => setIsMobileAdmin(window.innerWidth < 1024)
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    if (!isMobileAdmin) {
      setMobileSidebarOpen(false)
    }
  }, [isMobileAdmin])

  const activeRolePermissions = useMemo(() => {
    let list: string[] = []
    if (effectivePermissions.length > 0) list = [...effectivePermissions]
    else {
      const currentRole = rolesList.find(r => r.id === role)
      if (currentRole?.modules?.length) list = [...currentRole.modules]
    }
    return list
  }, [effectivePermissions, rolesList, role])

  const roleName = useMemo(() => {
    const currentRole = rolesList.find(r => r.id === role)
    if (currentRole) return currentRole.name
    if (role === "role-super-admin") return "Quản trị hệ thống cấp cao"
    if (role === "role-admin") return "Quản trị hệ thống"
    if (role === "role-manager") return "Quản lý cấp trung"
    return "Nhân viên"
  }, [role, rolesList])

  const isStaffRole = useMemo(() => {
    if (role === "role-user" || role === "user") return true
    return isStaffTypeRole(rolesList.find(r => r.id === role))
  }, [role, rolesList])

  useEffect(() => {
    if (isLoggedIn && activeRolePermissions.length > 0 && !hasPageAccess(activeRolePermissions, activePage)) {
      setActivePage(isStaffRole ? "staff-portal" : "dashboard")
    }
  }, [activePage, activeRolePermissions, isLoggedIn, isStaffRole])

  useEffect(() => {
    if (!isLoggedIn) {
      if (location.pathname !== "/login") {
        navigate("/login")
      }
    } else if (location.pathname === "/login" || location.pathname === "/") {
      const target = hasPageAccess(activeRolePermissions, "dashboard") ? "/dashboard" : "/staff-portal"
      navigate(target)
    }
  }, [isLoggedIn, location.pathname, navigate, activeRolePermissions])

  useEffect(() => {
    const handleUnauthorized = () => {
      handleLogout()
      showToast("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "error")
    }
    window.addEventListener("dudi_unauthorized", handleUnauthorized)
    return () => {
      window.removeEventListener("dudi_unauthorized", handleUnauthorized)
    }
  }, [])

  const lastActivityRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!isLoggedIn) return

    const SESSION_MS = sessionTimeout * 60 * 1000
    let idleTimeoutId: ReturnType<typeof setTimeout> | undefined

    const scheduleIdleCheck = () => {
      if (idleTimeoutId) clearTimeout(idleTimeoutId)
      const remaining = SESSION_MS - (Date.now() - lastActivityRef.current)
      idleTimeoutId = setTimeout(() => {
        const idleDuration = Date.now() - lastActivityRef.current
        if (idleDuration >= SESSION_MS) {
          handleLogout()
          showToast(`Phiên làm việc đã kết thúc do bạn không hoạt động trong ${sessionTimeout} phút. Vui lòng đăng nhập lại.`, "error")
        } else {
          scheduleIdleCheck()
        }
      }, Math.max(remaining, 1000))
    }

    const onActivity = () => {
      lastActivityRef.current = Date.now()
      touchSession()
      scheduleIdleCheck()
    }

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"] as const

    lastActivityRef.current = Date.now()
    touchSession()
    scheduleIdleCheck()

    events.forEach(event => {
      window.addEventListener(event, onActivity, { capture: true, passive: true })
    })

    return () => {
      if (idleTimeoutId) clearTimeout(idleTimeoutId)
      events.forEach(event => {
        window.removeEventListener(event, onActivity, { capture: true })
      })
    }
  }, [isLoggedIn, sessionTimeout])

  const [employees, setEmployees] = useState<Employee[]>(INIT_EMPLOYEES)
  const [orgNodes, setOrgNodes] = useState<OrgNode[]>(INIT_ORG_NODES)
  const [assignments, setAssignments] = useState<Assignment[]>(INIT_ASSIGNMENTS)
  const [requests, setRequests] = useState<any[]>([])

  const pendingRequestsCount = useMemo(() => {
    const currentWeekVal = `W${getISOWeek(new Date())}`
    return requests.filter(r => {
      if (r.status !== "pending") return false
      try {
        const dates = getDateRange(r.startDate, r.endDate)
        return dates.some(d => `W${getISOWeek(d)}` === currentWeekVal)
      } catch {
        return false
      }
    }).length
  }, [requests])
  const [loginError, setLoginError] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [globalAddEmpOpen, setGlobalAddEmpOpen] = useState(false)
  const {
    unread: unreadNotifs,
    latest: notifPreview,
    reload: reloadNotificationsCount,
    setLatest: setNotifPreview,
    setUnread: setUnreadNotifCount,
  } = useNotificationBadge(isLoggedIn)
  const [profileUpdates, setProfileUpdates] = useState<any[]>([])
  const [autoOpenUpdateReqId, setAutoOpenUpdateReqId] = useState<string | null>(null)

  const reloadProfileUpdates = () => {
    if (isLoggedIn) {
      api.profileUpdates.list().then(d => {
        if (d && Array.isArray(d)) setProfileUpdates(d as any[])
      }).catch(err => console.error("Lỗi tải profile updates:", err))
    }
  }

  const [selectedBranch, setSelectedBranch] = useState(() => {
    const saved = localStorage.getItem("dudi_user") || sessionStorage.getItem("dudi_user")
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

  const reloadPermissionsAndRoles = () => {
    api.roles.list().then(d => {
      if (d && Array.isArray(d)) setRolesList(d as RoleDefinition[])
    }).catch(err => console.error("Lỗi tải roles:", err))

    api.auth.me().then(user => {
      if (user) {
        writeStoredAuthUser(user)
        setRole(user.roleId || "role-admin")
        setLoggedEmail(user.employeeId || user.email || "")
        if (Array.isArray((user as any).effectivePermissions)) {
          setEffectivePermissions((user as any).effectivePermissions)
        }
      }
    }).catch(err => console.error("Lỗi tải thông tin tài khoản:", err))
  }

  useEffect(() => {
    if (isLoggedIn) {
      reloadPermissionsAndRoles()

      api.systemConfig.get().then(res => {
        if (res && res.sessionTimeoutMinutes) {
          setSessionTimeout(Number(res.sessionTimeoutMinutes))
        }
      }).catch(err => console.error("Lỗi tải cấu hình session:", err))

      Promise.all([
        api.employees.list().then(d => {
          if (d && Array.isArray(d)) setEmployees(d as Employee[])
        }),
        api.orgNodes.list().then(d => {
          if (d && Array.isArray(d)) setOrgNodes(d as OrgNode[])
        }),
        api.assignments.list().then(d => {
          if (d && Array.isArray(d)) setAssignments(d as Assignment[])
        }).catch(() => { }),
        api.requests.list().then(d => {
          if (d && Array.isArray(d)) setRequests(d as any[])
        }).catch(() => { }),
        api.profileUpdates.list().then(d => {
          if (d && Array.isArray(d)) setProfileUpdates(d as any[])
        }).catch(() => { })
      ]).catch(err => console.error("Lỗi tải dữ liệu ban đầu:", err))
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) {
      resetChatSocket()
      return
    }
    connectChatSocket()
    const heartbeat = setInterval(() => {
      if (getChatSocketStatus() === "connected") {
        chatHeartbeat()
      } else {
        api.staffChat.heartbeat().catch(() => { })
      }
    }, 25_000)
    return () => {
      clearInterval(heartbeat)
      releaseChatSocket()
    }
  }, [isLoggedIn])

  useEffect(() => {
    const handleUpdate = () => {
      if (isLoggedIn) {
        reloadPermissionsAndRoles()
      }
    }
    window.addEventListener("dudi_permissions_updated", handleUpdate)
    return () => window.removeEventListener("dudi_permissions_updated", handleUpdate)
  }, [isLoggedIn])

  useEffect(() => {
    if (isLoggedIn && role === "role-manager" && orgNodes.length > 0) {
      const emp = employees.find(e =>
        (e.email || "").toLowerCase() === (loggedEmail || "").toLowerCase() ||
        (e.id || "").toLowerCase() === (loggedEmail || "").toLowerCase()
      )
      if (emp?.orgNodeId) {
        const branchId = findBranchForNode(emp.orgNodeId, orgNodes)
        setSelectedBranch(branchId)
      }
    }
  }, [isLoggedIn, role, orgNodes, employees, loggedEmail])

  const handleLogin = async (email: string, pass: string, rememberMe: boolean = false) => {
    setLoginError(null)
    setLoginLoading(true)
    try {
      const res = await api.auth.login(email, pass)
      if (res && res.token) {
        const storage = rememberMe ? localStorage : sessionStorage
        const otherStorage = rememberMe ? sessionStorage : localStorage

        storage.setItem("dudi_token", res.token)
        storage.setItem("dudi_user", JSON.stringify(res.user))

        otherStorage.removeItem("dudi_token")
        otherStorage.removeItem("dudi_user")

        if (rememberMe) {
          localStorage.setItem("dudi_saved_id", email)
          localStorage.setItem("dudi_saved_pass", pass)
        } else {
          localStorage.removeItem("dudi_saved_id")
          localStorage.removeItem("dudi_saved_pass")
        }

        const user = res.user as any
        const r = user.roleId as Role
        setRole(r)
        setLoggedEmail(user.employeeId || user.email || email)
        setSelectedBranch(user.branchId || "all")
        if (Array.isArray(user.effectivePermissions)) {
          setEffectivePermissions(user.effectivePermissions)
        }
        setIsLoggedIn(true)
        resetSessionTouchClock()
        touchSession()
        const perms = Array.isArray(user.effectivePermissions) ? user.effectivePermissions : []
        navigate(hasPageAccess(perms, "dashboard") ? "/dashboard" : "/staff-portal")
      }
    } catch (e) {
      console.error("Backend login failed:", e)
      const isConnectionError = e instanceof Error && (
        e.message.includes("Failed to fetch") ||
        e.message.includes("fetch failed") ||
        e.message.includes("NetworkError")
      )
      const errorMsg = isConnectionError
        ? "Không thể kết nối tới server. Server Render có thể đang khởi động — vui lòng thử lại sau ít giây."
        : (e instanceof Error ? e.message : "Đăng nhập thất bại")
      setLoginError(errorMsg)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    resetChatSocket()
    localStorage.removeItem("dudi_token")
    localStorage.removeItem("dudi_user")
    sessionStorage.removeItem("dudi_token")
    sessionStorage.removeItem("dudi_user")
    setIsLoggedIn(false)
    setRole("role-admin")
    setLoggedEmail("")
    setEffectivePermissions([])
    setSelectedBranch("all")
    navigate("/login")
  }

  if (!isLoggedIn) return (
    <>

      <LoginPage
        onLogin={(id, pass, remember) => handleLogin(id, pass, remember)}
        loginError={loginError}
        isLoading={loginLoading}
      />
    </>
  )

  if (isStaffRole) {
    return (
      <>

        <UserPortalApp onLogout={handleLogout} modules={activeRolePermissions} onOpenLead={(id) => navigate(`/lead/${id}`)} />
      </>
    )
  }

  const matchedEmp = employees.find(e =>
    (e.id || "").toLowerCase() === (loggedEmail || "").toLowerCase() ||
    (e.email || "").toLowerCase() === (loggedEmail || "").toLowerCase()
  )
  let profileUser: { name?: string; email?: string; employeeId?: string; position?: string; department?: string } = {}
  try {
    profileUser = JSON.parse(localStorage.getItem("dudi_user") || sessionStorage.getItem("dudi_user") || "{}")
  } catch { }
  const isAdminRole = role === "role-admin" || role === "role-super-admin"
  const currentEmp: Employee = matchedEmp || {
    id: loggedEmail || profileUser.employeeId || "—",
    name: profileUser.name || (isAdminRole ? "Quản trị viên" : "Nhân viên"),
    email: loggedEmail || profileUser.email || "—",
    phone: "—",
    department: profileUser.department || "Ban điều hành",
    position: profileUser.position || (isAdminRole ? "System Admin" : "Nhân sự"),
    joinDate: "—",
    status: "active" as "active" | "inactive" | "suspended",
    contractType: "staff",
    orgNodeId: orgNodes.find(n => n.type === "branch")?.id || "branch-dudi"
  }
  const currentUserInfo = {
    name: currentEmp.name,
    id: currentEmp.id,
    role: role as Role,
    position: currentEmp.position,
    department: currentEmp.department
  }

  const renderPage = () => {
    if (!hasPageAccess(activeRolePermissions, activePage)) {
      return isStaffRole ? <UserPortalApp onLogout={handleLogout} modules={activeRolePermissions} onOpenLead={(id) => navigate(`/lead/${id}`)} /> : <AdminDashboard onNavigate={setActivePage} />
    }
    switch (activePage) {
      case "dashboard": return isStaffRole ? <UserPortalApp onLogout={handleLogout} modules={activeRolePermissions} onOpenLead={(id) => navigate(`/lead/${id}`)} /> : <AdminDashboard onNavigate={setActivePage} />
      case "nhan-su": return (
        <EmployeeManagement
          employees={employees}
          setEmployees={setEmployees}
          orgNodes={orgNodes}
          selectedBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
          autoOpenUpdateReqId={autoOpenUpdateReqId}
          onClearAutoOpenReq={() => setAutoOpenUpdateReqId(null)}
        />
      )
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
      case "cham-cong": return <AttendanceManagement selectedBranch={selectedBranch} />
      case "thong-ke": return <StatisticsPage selectedBranch={selectedBranch} currentUserEmail={loggedEmail} currentUserRole={role} modules={activeRolePermissions} />
      case "thong-bao": return <NotificationManagement />
      case "duyet-don": return <ApprovalManagement selectedBranch={selectedBranch} onRequestsUpdated={fetchRequests} />
      case "tai-khoan": return <AccountManagement selectedBranch={selectedBranch} currentUserEmail={loggedEmail} currentUserRole={role} mode="accounts" />
      case "phan-quyen": return <AccountManagement selectedBranch={selectedBranch} currentUserEmail={loggedEmail} currentUserRole={role} mode="roles" />
      case "ip": return <IPManagement selectedBranch={selectedBranch} />
      case "du-an": {
        const projectId = location.pathname.match(/^\/du-an\/([^/]+)/)?.[1]
        return (
          <ProjectManagement
            currentUserId={currentEmp.id}
            currentUserRole={role}
            selectedBranch={selectedBranch}
            projectId={projectId}
            onNavigateToProject={(id) => navigate(id ? `/du-an/${id}` : "/du-an")}
          />
        )
      }
      case "cong-viec": return <TaskManagement selectedBranch={selectedBranch} />
      case "tien-ich": return <SystemConfigPage />
      case "crm": return (
        <CrmAdminPage selectedBranch={selectedBranch} onOpenLead={(id) => navigate(`/lead/${id}`)} />
      )
      case "kpi":
      case "kpi-stats":
      case "kpi-compare": {
        const view = activePage === "kpi" ? "overview" : (activePage === "kpi-stats" ? "stats" : "compare")
        return <KpiManagementAdmin employees={employees} activeTab={view} />
      }
      case "staff-portal": return (
        <div className="w-full h-[calc(100vh-2.5rem)] min-h-[500px] rounded-2xl overflow-hidden shadow-lg border border-black/5 relative bg-[#FFF8F4] isolate">
          <UserPortalApp onLogout={handleLogout} modules={activeRolePermissions} embed={true} onOpenLead={(id) => navigate(`/lead/${id}`)} />
        </div>
      )
      case "user-profile": return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800">Thông tin cá nhân</h2>
          <UserProfile emp={currentEmp} />
        </div>
      )
      case "user-attendance": return <UserAttendance />
      case "user-timeoff": return <UserTimeOff employee={currentEmp} />
      case "user-directory": return <UserDirectory />
      case "user-chat": return <UserChat />
      case "user-workflow": return <UserWorkflow />
      case "user-settings": return <UserSettings onLogout={handleLogout} />
      case "user-crm": return (
        <CrmStaffPage onOpenLead={(id) => navigate(`/lead/${id}`)} />
      )
      case "lead": {
        const leadId = location.pathname.match(/^\/lead\/([^/]+)/)?.[1]
        return (
          <LeadManagement
            currentUserId={currentEmp.id}
            employees={employees}
            leadId={leadId}
            selectedBranch={selectedBranch}
            onNavigateToLead={(id) => navigate(id ? `/lead/${id}` : "/lead")}
            onNavigateToProject={(id) => navigate(id ? `/du-an/${id}` : "/du-an")}
          />
        )
      }
      default: return isStaffRole ? <UserPortalApp onLogout={handleLogout} modules={activeRolePermissions} onOpenLead={(id) => navigate(`/lead/${id}`)} /> : <AdminDashboard onNavigate={setActivePage} />
    }
  }


  const showStaffFab = canOpenStaffPortal(activeRolePermissions)

  return (
    <Routes>
      <Route path="/form/:leadId" element={<PublicRequirementForm />} />
      <Route path="*" element={
        <>

          <div className="flex h-screen bg-[#F5F1EF] overflow-hidden" onClick={() => { }}>
            {isMobileAdmin && mobileSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/45 z-30 lg:hidden"
                onClick={() => setMobileSidebarOpen(false)}
              />
            )}
            <UserAwareSidebar active={activePage} onNavigate={(p) => {
              setActivePage(p)
              if (isMobileAdmin) setMobileSidebarOpen(false)
            }}
              collapsed={isMobileAdmin ? false : sidebarCollapsed}
              onToggle={() => isMobileAdmin ? setMobileSidebarOpen(p => !p) : setSidebarCollapsed(p => !p)}
              role={role} roleName={roleName} modules={activeRolePermissions} onLogout={handleLogout}
              pendingRequestsCount={pendingRequestsCount}
              currentUser={currentUserInfo}
              unread={unreadNotifs}
              notifPreview={notifPreview}
              onMarkAllRead={async () => {
                await api.notifications.markAllRead()
                setUnreadNotifCount(0)
                setNotifPreview([])
              }}
              onReloadNotifCount={reloadNotificationsCount}
              selectedBranch={selectedBranch}
              onBranchChange={setSelectedBranch}
              branches={branches}
              profileUpdates={profileUpdates}
              onReloadProfileUpdates={reloadProfileUpdates}
              employees={employees}
              orgNodes={orgNodes}
              onSelectUpdateReq={setAutoOpenUpdateReqId}
              mobile={isMobileAdmin}
              mobileOpen={mobileSidebarOpen}
            />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              {isMobileAdmin && (
                <div className="lg:hidden px-3 pt-3 pb-1">
                  <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-black/5 shadow-sm px-3 py-2.5 flex items-center gap-3">
                    <button
                      onClick={() => setMobileSidebarOpen(true)}
                      className="p-2 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
                      title="Mở menu"
                    >
                      <Menu size={18} />
                    </button>
                    <BrandLogo size={28} withText className="min-w-0 flex-1" />
                    <div className="text-[11px] font-bold text-gray-500 truncate">
                      {roleName}
                    </div>
                  </div>
                </div>
              )}
              <main className={`flex-1 overflow-y-auto relative ${isMobileAdmin ? "px-3 pb-3 pt-2" : "p-5"}`}
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
        </>
      } />
    </Routes>
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

function GroupNav({ gKey, icon: Icon, label, pages, children, active, onNavigate, collapsed, expanded, onToggle, onFlyoutOpen }: {
  gKey: string; icon: React.ElementType; label: string; pages: Page[]; children: ReactNode
  active: Page; onNavigate: (p: Page) => void; collapsed: boolean
  expanded: string[]; onToggle: (k: string) => void
  onFlyoutOpen?: () => void
}) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [flyoutPos, setFlyoutPos] = useState({ top: 0, left: 0 })
  const open = expanded.includes(gKey)
  const hasActiveChild = pages.includes(active)

  useEffect(() => {
    if (!collapsed || !open || !btnRef.current) return
    const update = () => {
      const rect = btnRef.current!.getBoundingClientRect()
      setFlyoutPos({ top: rect.top, left: rect.right + 8 })
    }
    update()
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update, true)
      window.removeEventListener("resize", update)
    }
  }, [collapsed, open])

  const handleClick = () => {
    if (collapsed) {
      onFlyoutOpen?.()
    }
    onToggle(gKey)
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleClick}
        title={label}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer
          ${collapsed ? "justify-center" : ""}
          ${hasActiveChild ? "text-white font-semibold" : "text-white/60 hover:bg-white/8 hover:text-white/90"}`}
      >
        <Icon size={18} className={`flex-shrink-0 ${hasActiveChild ? "text-[#FF8A65]" : "text-white/60"}`} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left font-medium">{label}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </>
        )}
      </button>
      {!collapsed && open && (
        <div className="ml-4 mt-1 border-l border-white/10 pl-3 space-y-0.5">{children}</div>
      )}
      {collapsed && open && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => onToggle(gKey)} />
          <div
            className="fixed w-56 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-100 shadow-xl py-1.5 z-[100] flex flex-col"
            style={{ top: flyoutPos.top, left: flyoutPos.left }}
          >
            <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
              {label}
            </div>
            {React.Children.map(children, child => {
              if (!React.isValidElement(child)) return child
              return React.cloneElement(child, {
                flyout: true,
                onSelect: () => onToggle(gKey),
              } as Partial<React.ComponentProps<typeof SubItem>>)
            })}
          </div>
        </>
      )}
    </div>
  )
}

function SubItem({ page, label, badge, active, onNavigate, flyout, onSelect }: {
  page: Page; label: string; badge?: number
  active: Page; onNavigate: (p: Page) => void
  flyout?: boolean
  onSelect?: () => void
}) {
  const handleClick = () => {
    onNavigate(page)
    onSelect?.()
  }

  if (flyout) {
    return (
      <button onClick={handleClick}
        className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs font-bold hover:bg-gray-50 transition-colors
          ${active === page ? "text-[#C62828] bg-red-50/40" : "text-gray-600"}`}>
        <span className="truncate">{label}</span>
        {badge ? <span className="bg-[#FF6D00] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-2 flex-shrink-0">{badge}</span> : null}
      </button>
    )
  }

  return (
    <button onClick={handleClick}
      className={`w-full flex items-center justify-between text-xs py-2 px-2 rounded-lg transition-all cursor-pointer
        ${active === page ? "text-[#FF8A65] font-semibold" : "text-white/45 hover:text-white/80"}`}>
      <span>{label}</span>
      {badge ? <span className="bg-[#FF6D00] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">{badge}</span> : null}
    </button>
  )
}

function UserAwareSidebar({
  active, onNavigate, collapsed, onToggle, role, roleName, modules, onLogout, pendingRequestsCount = 0,
  currentUser, unread = 0, notifPreview = [], onMarkAllRead, onReloadNotifCount,
  selectedBranch = "all", onBranchChange, branches = [],
  profileUpdates = [], onReloadProfileUpdates, employees = [], orgNodes = [], onSelectUpdateReq,
  mobile = false, mobileOpen = false,
}: {
  active: Page
  onNavigate: (p: Page) => void
  collapsed: boolean
  onToggle: () => void
  role: Role
  roleName: string
  modules: string[]
  onLogout: () => void
  pendingRequestsCount?: number
  currentUser?: { name: string; id: string; role: Role; position: string; department: string }
  unread?: number
  notifPreview?: any[]
  onMarkAllRead?: () => void | Promise<void>
  onReloadNotifCount?: () => void
  selectedBranch?: string
  onBranchChange?: (b: string) => void
  branches?: { id: string; name: string }[]
  profileUpdates?: any[]
  onReloadProfileUpdates?: () => void
  employees?: Employee[]
  orgNodes?: OrgNode[]
  onSelectUpdateReq?: (id: string | null) => void
  mobile?: boolean
  mobileOpen?: boolean
}) {
  const [expanded, setExpanded] = useState<string[]>([])
  const [showBranchDrop, setShowBranchDrop] = useState(false)
  const [showNotifDrop, setShowNotifDrop] = useState(false)
  const [showUserDrop, setShowUserDrop] = useState(false)
  const userBtnRef = useRef<HTMLButtonElement>(null)
  const [userFlyoutPos, setUserFlyoutPos] = useState({ left: 0, bottom: 0 })
  const [notifs, setNotifs] = useState<any[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const toggle = (k: string) => setExpanded(p => {
    if (collapsed) return p.includes(k) ? [] : [k]
    return p.includes(k) ? p.filter(x => x !== k) : [...p, k]
  })

  const closeOverlays = () => {
    setShowBranchDrop(false)
    setShowNotifDrop(false)
    setShowUserDrop(false)
    setExpanded([])
  }

  const hasAccess = (moduleKey: string) => hasPageAccess(modules, moduleKey)
  const isAdmin = currentUser?.role === "role-admin" || currentUser?.role === "role-super-admin"
  const shortName = currentUser?.name.split(" ").slice(-2).join(" ") ?? ""

  const pendingUpdates = profileUpdates.filter(req => {
    if (req.status !== "pending_approval") return false
    if (!isAdmin) return false
    const matchedEmp = employees.find(e => e.id === currentUser?.id)
    if (matchedEmp) {
      const adminBranchId = findBranchForNode(matchedEmp.orgNodeId ?? "", orgNodes)
      if (!adminBranchId) return true
      const reqEmp = employees.find(e => e.id === req.employeeId)
      if (!reqEmp) return true
      const reqBranchId = findBranchForNode(reqEmp.orgNodeId ?? "", orgNodes)
      return adminBranchId === reqBranchId
    }
    return true
  })

  const notifBadge = unread + pendingUpdates.length
  const branchLabel = selectedBranch === "all"
    ? "Tất cả chi nhánh"
    : (branches.find(b => b.id === selectedBranch)?.name || "Chi nhánh")

  const dropPos = collapsed
    ? "absolute left-full top-0 ml-2"
    : "absolute left-0 right-0 top-full mt-1.5"

  async function openNotifs() {
    const opening = !showNotifDrop
    setShowNotifDrop(opening)
    setShowBranchDrop(false)
    setShowUserDrop(false)
    setExpanded([])
    onReloadProfileUpdates?.()
    if (opening) {
      if (notifPreview.length > 0) {
        setNotifs(notifPreview)
        return
      }
      setLoadingNotifs(true)
      try {
        const data = await api.notifications.list({ read: "false" }) as any[]
        setNotifs(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingNotifs(false)
      }
    }
  }

  useEffect(() => {
    if (showNotifDrop && notifPreview.length > 0) {
      setNotifs(notifPreview)
    }
  }, [notifPreview, showNotifDrop])

  async function markAllRead() {
    await onMarkAllRead?.()
    setNotifs([])
    onReloadNotifCount?.()
  }

  useEffect(() => {
    if (!collapsed || !showUserDrop || !userBtnRef.current) return
    const update = () => {
      const rect = userBtnRef.current!.getBoundingClientRect()
      setUserFlyoutPos({ left: rect.right + 8, bottom: window.innerHeight - rect.bottom })
    }
    update()
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update, true)
      window.removeEventListener("resize", update)
    }
  }, [collapsed, showUserDrop])

  const userMenuItems = currentUser ? (
    <>
      <button
        onClick={() => { onLogout(); setShowUserDrop(false) }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-400/90 hover:text-red-300 hover:bg-red-500/10 transition-colors"
      >
        <LogOut size={15} className="flex-shrink-0" />
        Đăng xuất
      </button>
    </>
  ) : null

  return (
    <aside className={`${mobile
      ? `fixed inset-y-0 left-0 w-72 max-w-[86vw] shadow-2xl transform transition-transform duration-300 z-40 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`
      : `${collapsed ? "w-16" : "w-60"} transition-all duration-300 flex-shrink-0 relative z-40`
      } bg-[#160606] flex flex-col overflow-visible`}>
      <div className={`p-3 border-b border-white/5 flex ${collapsed ? "flex-col items-center gap-2" : "items-center gap-2"}`}>
        <button
          onClick={onToggle}
          title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/45 hover:text-white/80 transition-colors flex-shrink-0"
        >
          <Menu size={18} />
        </button>
        <BrandLogo
          size={collapsed ? 28 : 34}
          withText={!collapsed}
          collapsed={collapsed}
          textLight
          className={collapsed ? "" : "flex-1 min-w-0"}
        />
      </div>

      <div className={`px-2 pt-2 pb-1 space-y-1 border-b border-white/5 ${collapsed ? "flex flex-col items-center" : ""}`}>
        {isAdmin && onBranchChange && (
          <div className="relative w-full">
            <button
              onClick={() => { setShowBranchDrop(p => !p); setShowNotifDrop(false); setShowUserDrop(false); setExpanded([]) }}
              title={branchLabel}
              className={`w-full flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white/75 cursor-pointer
                ${collapsed ? "justify-center p-2.5" : "px-3 py-2.5 text-xs font-bold"}`}
            >
              <Building2 size={16} className="text-white/45 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">{branchLabel}</span>
                  <ChevronDown size={12} className={`text-white/40 flex-shrink-0 transition-transform ${showBranchDrop ? "rotate-180" : ""}`} />
                </>
              )}
            </button>
            {showBranchDrop && (
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setShowBranchDrop(false)} />
                <div className={`${dropPos} w-56 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-100 shadow-xl py-1.5 z-[100] flex flex-col`}>
                  <button
                    onClick={() => { onBranchChange("all"); setShowBranchDrop(false) }}
                    className={`px-4 py-2 text-left text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedBranch === "all" ? "text-[#C62828] bg-red-50/40" : "text-gray-600"}`}
                  >
                    <span>Tất cả chi nhánh</span>
                    {selectedBranch === "all" && <Check size={12} className="text-[#C62828]" />}
                  </button>
                  {branches.map(b => (
                    <button
                      key={b.id}
                      onClick={() => { onBranchChange(b.id); setShowBranchDrop(false) }}
                      className={`px-4 py-2 text-left text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedBranch === b.id ? "text-[#C62828] bg-red-50/40" : "text-gray-600"}`}
                    >
                      <span className="truncate">{b.name}</span>
                      {selectedBranch === b.id && <Check size={12} className="text-[#C62828]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}


      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 py-2" style={{ scrollbarWidth: "none" }}>
        {hasAccess("dashboard") && <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" active={active} onNavigate={onNavigate} collapsed={collapsed} />}
        <NavItem page="staff-portal" icon={Fingerprint} label="Cổng nhân viên" active={active} onNavigate={onNavigate} collapsed={collapsed} />

        {(hasAccess("nhan-su") || hasAccess("co-cau") || hasAccess("cham-cong") || hasAccess("duyet-don")) && (
          <GroupNav
            gKey="nhan-su"
            icon={Users}
            label="Quản lý nhân sự"
            pages={["nhan-su", "co-cau", "cham-cong", "duyet-don"].filter(hasAccess) as Page[]}
            active={active} onNavigate={onNavigate} collapsed={collapsed}
            expanded={expanded} onToggle={toggle} onFlyoutOpen={closeOverlays}
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
            expanded={expanded} onToggle={toggle} onFlyoutOpen={closeOverlays}
          >
            {hasAccess("tai-khoan") && <SubItem page="tai-khoan" label="Quản lý tài khoản" active={active} onNavigate={onNavigate} />}
            {hasAccess("phan-quyen") && <SubItem page="phan-quyen" label="Phân quyền vai trò" active={active} onNavigate={onNavigate} />}
            {hasAccess("ip") && <SubItem page="ip" label="Danh sách IP" active={active} onNavigate={onNavigate} />}
          </GroupNav>
        )}

        {hasAccess("thong-bao") && <NavItem page="thong-bao" icon={Bell} label="Quản lý thông báo" active={active} onNavigate={onNavigate} collapsed={collapsed} />}
        {hasAccess("du-an") && <NavItem page="du-an" icon={Layers} label="Quản lý dự án" active={active} onNavigate={onNavigate} collapsed={collapsed} />}
        {hasAccess("cong-viec") && <NavItem page="cong-viec" icon={CheckSquare} label="Quản lý công việc" active={active} onNavigate={onNavigate} collapsed={collapsed} />}
        {(hasAccess("lead") || hasAccess("kpi") || hasAccess("crm")) && (
          <GroupNav
            gKey="quan-ly-sale"
            icon={TrendingUp}
            label="Quản lý Sale"
            pages={["lead", "kpi", "kpi-stats", "kpi-compare", "crm"].filter(hasAccess) as Page[]}
            active={active} onNavigate={onNavigate} collapsed={collapsed}
            expanded={expanded} onToggle={toggle} onFlyoutOpen={closeOverlays}
          >
            {hasAccess("lead") && <SubItem page="lead" label="Cơ hội" active={active} onNavigate={onNavigate} />}
            {hasAccess("kpi") && <SubItem page="kpi" label="Tổng quan KPI" active={active} onNavigate={onNavigate} />}
            {hasAccess("kpi") && <SubItem page="kpi-stats" label="Thống kê KPI" active={active} onNavigate={onNavigate} />}
            {hasAccess("kpi") && <SubItem page="kpi-compare" label="So sánh KPI" active={active} onNavigate={onNavigate} />}
            {hasAccess("crm") && <SubItem page="crm" label="Quản lý Lead" active={active} onNavigate={onNavigate} />}
          </GroupNav>
        )}
        {hasAccess("tien-ich") && <NavItem page="tien-ich" icon={Wrench} label="Tiện ích" active={active} onNavigate={onNavigate} collapsed={collapsed} />}
      </nav>

      <div className="p-2 border-t border-white/5">
        {currentUser && (
          <div>
            <button
              ref={userBtnRef}
              onClick={() => { setShowUserDrop(p => !p); setShowBranchDrop(false); setShowNotifDrop(false); setExpanded([]) }}
              title={currentUser.name}
              className={`w-full flex items-center gap-2.5 rounded-xl transition-all px-2 py-2
                ${showUserDrop ? "bg-white/10" : "hover:bg-white/8"}
                ${collapsed ? "justify-center" : ""}`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-white/10">
                {initials(currentUser.name)}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-xs font-semibold text-white/90 truncate leading-tight">{shortName}</div>
                    <div className="text-[10px] text-white/35 truncate mt-0.5">{roleName}</div>
                  </div>
                  <ChevronDown size={13} className={`text-white/35 flex-shrink-0 transition-transform duration-200 ${showUserDrop ? "rotate-180" : ""}`} />
                </>
              )}
            </button>

            {showUserDrop && !collapsed && (
              <div className="mt-1 px-1 pb-1 space-y-0.5">
                {userMenuItems}
              </div>
            )}

            {showUserDrop && collapsed && (
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setShowUserDrop(false)} />
                <div
                  className="fixed w-52 bg-[#1c0a0a] border border-white/10 rounded-2xl shadow-2xl py-2 z-[100]"
                  style={{ left: userFlyoutPos.left, bottom: userFlyoutPos.bottom }}
                >
                  <div className="px-3 pb-2 mb-1 border-b border-white/8">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {initials(currentUser.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white/90 truncate">{currentUser.name}</div>
                        <div className="text-[10px] text-white/40 truncate">{currentUser.position}</div>
                      </div>
                    </div>
                    <div className={`inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded-md
                      ${isAdmin ? "bg-amber-500/15 text-amber-300" : "bg-white/8 text-white/45"}`}>
                      {roleName}
                    </div>
                  </div>
                  <div className="px-1">{userMenuItems}</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
