import React, { useState, useEffect, ReactNode } from "react"
import {
  LayoutDashboard, Users, Clock, BarChart3, Bell,
  Wrench, LogOut, Search, ChevronDown, ChevronRight,
  Plus, Edit2, Trash2, X, Check, AlertCircle,
  UserCheck, UserX, Menu, FileText, Shield, Wifi,
  CheckSquare, ChevronLeft, TrendingUp, Download,
  Award, Calendar, Lock, User, ArrowRight, Mail, Building2, Eye,
  Upload, Camera, Briefcase, Fingerprint, Settings, MessageCircle, Layers, FileImage, MoreHorizontal
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from "recharts"
import { ImageWithFallback } from "./components/figma/ImageWithFallback"
import UserPortalApp from "./components/user/UserApp"
import ApprovalManagement from "@/app/components/leave/ApprovalManagement"
import OrgStructure from "./components/org/OrgStructure"
import UserProfile from "./components/user/UserProfile"
import IPManagement from "./components/IPManagement"

// ─── CONSTANTS 
const avatarImg = `https://ui-avatars.com/api/?name=T&background=C62828&color=fff&bold=true`

// ─── TYPES 
type Role = "admin" | "user"
type Page =
  | "dashboard" | "nhan-su" | "cham-cong" | "thong-ke"
  | "duyet-don" | "thong-bao" | "cong-viec"
  | "tai-khoan" | "ip" | "tien-ich" | "co-cau"
  | "user-profile" | "user-attendance" | "user-timeoff" | "user-directory"
  | "user-chat" | "user-workflow" | "user-settings"

export interface Employee {
  id: string; name: string; email: string; phone: string
  department: string; position: string; joinDate: string
  status: "active" | "inactive" | "intern"; contractType: string
  orgNodeId?: string;
  cccd?: string; cccdDate?: string; cccdPlace?: string;
  bankAccount?: string; bank?: string;
  dob?: string; gender?: string;
  curProvince?: string; curDistrict?: string; curWard?: string; curStreet?: string;
  homeProvince?: string; homeDistrict?: string; homeWard?: string; homeStreet?: string;
  internEndDate?: string; university?: string; notes?: string; resignDate?: string;
}
export type OrgNodeType = "branch" | "department" | "sub-department" | "position" | "team";
export interface OrgNode {
  id: string;
  name: string;
  code: string;
  type: OrgNodeType;
  parentId?: string;
  managerId?: string;
  managerTitle?: string;
  memberCount: number;
  status: "active" | "inactive";
  createdDate?: string;
}
export interface Assignment {
  id: string;
  employeeId: string;
  nodeId: string;
  type: "permanent" | "temporary";
  startDate: string;
  endDate?: string;
  status: "active" | "completed";
}
interface EmpExtForm {
  name: string; email: string; phone: string; department: string
  position: string; joinDate: string; status: "active" | "inactive" | "intern"; contractType: string
  cccd: string; cccdDate: string; cccdPlace: string
  bankAccount: string; bank: string; dob: string; gender: string
  curProvince: string; curDistrict: string; curWard: string; curStreet: string
  homeProvince: string; homeDistrict: string; homeWard: string; homeStreet: string
  workHistory: { id: number; fromDate: string; toDate: string; title: string }[]
  internEndDate: string; university: string; notes: string; resignDate: string
}
interface AttendanceRecord {
  id: string; employeeId: string; employeeName: string; department: string
  checkIn: string; checkOut: string; date: string
  status: "on-time" | "late" | "absent" | "leave"; note: string
}
interface LeaveRequest {
  id: string; employeeName: string; department: string; leaveType: string
  startDate: string; endDate: string; reason: string
  status: "pending" | "approved" | "rejected"; submittedAt: string
}
interface TaskItem {
  id: string; title: string; assignee: string; dueDate: string
  priority: "high" | "medium" | "low"; status: "todo" | "in-progress" | "done"
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const INIT_EMPLOYEES: Employee[] = [
  { id: "0000000001", name: "Trần Thị Bích Liên", email: "lien.tran@dudi.vn", phone: "0901 234 567", department: "Frontend", position: "Senior Developer", joinDate: "28/05/2026", status: "active", contractType: "Chính thức" },
  { id: "0000000002", name: "Nguyễn Văn Minh", email: "minh.nguyen@dudi.vn", phone: "0912 345 678", department: "Backend", position: "Lead Developer", joinDate: "12/03/2024", status: "active", contractType: "Chính thức" },
  { id: "0000000003", name: "Lê Thu Hương", email: "huong.le@dudi.vn", phone: "0923 456 789", department: "Design", position: "UI/UX Designer", joinDate: "15/08/2023", status: "active", contractType: "Chính thức" },
  { id: "0000000004", name: "Phạm Đức Thành", email: "thanh.pham@dudi.vn", phone: "0934 567 890", department: "PM", position: "Project Manager", joinDate: "28/01/2025", status: "active", contractType: "Chính thức" },
  { id: "0000000005", name: "Hoàng Thị Mai", email: "admin@dudi.vn", phone: "0945 678 901", department: "HR", position: "HR Manager", joinDate: "12/09/2024", status: "active", contractType: "Chính thức" },
  { id: "0000000006", name: "Võ Minh Tuấn", email: "tuan.vo@dudi.vn", phone: "0956 789 012", department: "Backend", position: "Developer", joinDate: "01/06/2025", status: "intern", contractType: "Thực tập" },
  { id: "0000000007", name: "Đinh Thị Lan Anh", email: "lanh.dinh@dudi.vn", phone: "0967 890 123", department: "Frontend", position: "Developer", joinDate: "15/07/2025", status: "intern", contractType: "Thực tập" },
  { id: "0000000008", name: "Bùi Văn Hùng", email: "hung.bui@dudi.vn", phone: "0978 901 234", department: "DevOps", position: "DevOps Engineer", joinDate: "20/11/2024", status: "inactive", contractType: "Chính thức" },
]

const INIT_ORG_NODES: OrgNode[] = [
  { id: "branch-hcm", name: "Chi nhánh Hồ Chí Minh", code: "HCM01", type: "branch", memberCount: 150, status: "active", managerId: "0000000005", managerTitle: "Giám đốc chi nhánh" },
  { id: "dept-tech", name: "Phòng Công nghệ", code: "TECH01", type: "department", parentId: "branch-hcm", memberCount: 80, status: "active", managerId: "0000000002", managerTitle: "Trưởng phòng Công nghệ" },
  { id: "sub-dev", name: "Bộ phận Phát triển phần mềm", code: "DEV01", type: "sub-department", parentId: "dept-tech", memberCount: 50, status: "active", managerId: "0000000004", managerTitle: "Trưởng bộ phận Dev" },
  { id: "pos-lead", name: "Lead Developer", code: "LDEV01", type: "position", parentId: "sub-dev", memberCount: 10, status: "active", managerId: "0000000002", managerTitle: "Lead Developer" },
  { id: "team-fe", name: "Nhóm Frontend", code: "FE01", type: "team", parentId: "pos-lead", memberCount: 15, status: "active", managerId: "0000000001", managerTitle: "Trưởng nhóm Frontend" },
  { id: "dept-finance", name: "Phòng Tài chính", code: "FIN01", type: "department", parentId: "branch-hcm", memberCount: 20, status: "active", managerId: "0000000005", managerTitle: "Trưởng phòng Tài chính" },
  { id: "dept-sales", name: "Phòng Kinh doanh", code: "SALE01", type: "department", parentId: "branch-hcm", memberCount: 35, status: "active", managerId: "0000000003", managerTitle: "Trưởng phòng Kinh doanh" },
  { id: "dept-hr", name: "Phòng Nhân sự", code: "HR01", type: "department", parentId: "branch-hcm", memberCount: 15, status: "active", managerId: "0000000005", managerTitle: "Trưởng phòng Nhân sự" }
]

const INIT_ASSIGNMENTS: Assignment[] = [
  { id: "as-1", employeeId: "0000000001", nodeId: "team-fe", type: "permanent", startDate: "2026-05-28", status: "active" },
  { id: "as-2", employeeId: "0000000002", nodeId: "dept-tech", type: "permanent", startDate: "2024-03-12", status: "active" },
  { id: "as-3", employeeId: "0000000003", nodeId: "dept-sales", type: "permanent", startDate: "2023-08-15", status: "active" },
  { id: "as-4", employeeId: "0000000004", nodeId: "sub-dev", type: "permanent", startDate: "2025-01-28", status: "active" },
  { id: "as-5", employeeId: "0000000005", nodeId: "dept-hr", type: "permanent", startDate: "2024-09-12", status: "active" }
]

const ATTENDANCE: AttendanceRecord[] = [
  { id: "1", employeeId: "0000000001", employeeName: "Trần Thị Bích Liên", department: "Frontend", checkIn: "08:02", checkOut: "17:35", date: "2026-06-25", status: "on-time", note: "" },
  { id: "2", employeeId: "0000000002", employeeName: "Nguyễn Văn Minh", department: "Backend", checkIn: "08:45", checkOut: "18:10", date: "2026-06-25", status: "late", note: "Kẹt xe" },
  { id: "3", employeeId: "0000000003", employeeName: "Lê Thu Hương", department: "Design", checkIn: "07:55", checkOut: "17:00", date: "2026-06-25", status: "on-time", note: "" },
  { id: "4", employeeId: "0000000004", employeeName: "Phạm Đức Thành", department: "PM", checkIn: "--", checkOut: "--", date: "2026-06-25", status: "leave", note: "Nghỉ phép" },
  { id: "5", employeeId: "0000000005", employeeName: "Hoàng Thị Mai", department: "HR", checkIn: "09:15", checkOut: "18:30", date: "2026-06-25", status: "late", note: "Họp ngoài" },
  { id: "6", employeeId: "0000000006", employeeName: "Võ Minh Tuấn", department: "Backend", checkIn: "08:00", checkOut: "17:00", date: "2026-06-25", status: "on-time", note: "" },
  { id: "7", employeeId: "0000000007", employeeName: "Đinh Thị Lan Anh", department: "Frontend", checkIn: "--", checkOut: "--", date: "2026-06-25", status: "absent", note: "" },
  { id: "8", employeeId: "0000000008", employeeName: "Bùi Văn Hùng", department: "DevOps", checkIn: "08:10", checkOut: "17:20", date: "2026-06-25", status: "on-time", note: "" },
]

const INIT_REQUESTS = [
  { id: "XN001", employeeName: "Nguyễn Văn Minh", department: "Backend", leaveType: "Nghỉ phép năm", category: "leave" as const, startDate: "28/06/2026", endDate: "30/06/2026", reason: "Du lịch gia đình", status: "pending" as const, submittedAt: "24/06/2026" },
  { id: "XN002", employeeName: "Lê Thu Hương", department: "Design", leaveType: "Nghỉ ốm", category: "leave" as const, startDate: "26/06/2026", endDate: "26/06/2026", reason: "Sức khỏe không tốt", status: "pending" as const, submittedAt: "25/06/2026" },
  { id: "XN003", employeeName: "Võ Minh Tuấn", department: "Backend", leaveType: "Nghỉ phép năm", category: "leave" as const, startDate: "04/07/2026", endDate: "05/07/2026", reason: "Việc cá nhân", status: "pending" as const, submittedAt: "23/06/2026" },
  { id: "XN004", employeeName: "Hoàng Thị Mai", department: "HR", leaveType: "Nghỉ cưới", category: "leave" as const, startDate: "10/07/2026", endDate: "12/07/2026", reason: "Kết hôn", status: "approved" as const, submittedAt: "20/06/2026" },
  { id: "XN005", employeeName: "Đinh Thị Lan Anh", department: "Frontend", leaveType: "Nghỉ phép năm", category: "leave" as const, startDate: "27/06/2026", endDate: "27/06/2026", reason: "Việc cá nhân", status: "rejected" as const, submittedAt: "22/06/2026" },
  { id: "TO001", employeeName: "Trần Thị Bích Liên", department: "Frontend", leaveType: "Time off bù tăng ca", category: "timeoff" as const, startDate: "02/07/2026", endDate: "02/07/2026", reason: "Bù 8h tăng ca tháng 5", status: "pending" as const, submittedAt: "25/06/2026" },
  { id: "TO002", employeeName: "Phạm Đức Thành", department: "PM", leaveType: "Time off theo chế độ", category: "timeoff" as const, startDate: "07/07/2026", endDate: "08/07/2026", reason: "Ngày nghỉ bổ sung quý 2", status: "pending" as const, submittedAt: "23/06/2026" },
  { id: "TO003", employeeName: "Bùi Văn Hùng", department: "DevOps", leaveType: "Time off bù tăng ca", category: "timeoff" as const, startDate: "30/06/2026", endDate: "30/06/2026", reason: "Bù 4h cuối tuần trực hệ thống", status: "approved" as const, submittedAt: "21/06/2026" },
]

// Time off weekly calendar data — week 2026-W26 (23-28/06/2026)
type TOStatus = "approved" | "pending" | "rejected"
interface TimeOffSlot { id: string; empId: string; empName: string; empCode: string; department: string; day: number; session: "sang" | "chieu"; reason: string; status: TOStatus; week: string; registeredAt: string; adminNote: string; processedAt: string }

const TIMEOFF_SLOTS: TimeOffSlot[] = [
  { id: "S1", empId: "NV003", empName: "Lê Thu Hương", empCode: "2023081567", department: "Design", day: 1, session: "sang", reason: "Dạ đi học", status: "approved", week: "2026-W26", registeredAt: "22:17:10 21/6/2026", adminNote: "Đã được duyệt tự động (đồng bộ)", processedAt: "22:17:10 21/6/2026" },
  { id: "S2", empId: "NV003", empName: "Lê Thu Hương", empCode: "2023081567", department: "Design", day: 1, session: "chieu", reason: "Dạ đi học", status: "approved", week: "2026-W26", registeredAt: "22:17:10 21/6/2026", adminNote: "Đã được duyệt tự động (đồng bộ)", processedAt: "22:17:10 21/6/2026" },
  { id: "S3", empId: "NV004", empName: "Phạm Đức Thành", empCode: "2025012893", department: "PM", day: 2, session: "sang", reason: "Họp khách hàng", status: "pending", week: "2026-W26", registeredAt: "08:00:00 22/6/2026", adminNote: "", processedAt: "" },
  { id: "S4", empId: "NV002", empName: "Nguyễn Văn Minh", empCode: "2024031245", department: "Backend", day: 2, session: "chieu", reason: "Việc cá nhân", status: "pending", week: "2026-W26", registeredAt: "07:55:00 22/6/2026", adminNote: "", processedAt: "" },
  { id: "S5", empId: "NV005", empName: "Hoàng Thị Mai", empCode: "2024091234", department: "HR", day: 3, session: "sang", reason: "Đi khám bệnh", status: "approved", week: "2026-W26", registeredAt: "18:00:00 20/6/2026", adminNote: "Duyệt", processedAt: "09:00:00 21/6/2026" },
  { id: "S6", empId: "NV006", empName: "Võ Minh Tuấn", empCode: "2025060001", department: "Backend", day: 3, session: "chieu", reason: "Bù tăng ca", status: "approved", week: "2026-W26", registeredAt: "10:00:00 21/6/2026", adminNote: "Duyệt bù giờ", processedAt: "10:05:00 21/6/2026" },
  { id: "S7", empId: "NV007", empName: "Đinh Thị Lan Anh", empCode: "2025071501", department: "Frontend", day: 4, session: "sang", reason: "Gia đình có việc", status: "rejected", week: "2026-W26", registeredAt: "09:30:00 22/6/2026", adminNote: "Không đủ điều kiện", processedAt: "10:00:00 22/6/2026" },
  { id: "S8", empId: "NV001", empName: "Trần Thị Bích Liên", empCode: "2026052831", department: "Frontend", day: 4, session: "chieu", reason: "Bù tăng ca T5", status: "pending", week: "2026-W26", registeredAt: "22:00:00 22/6/2026", adminNote: "", processedAt: "" },
  { id: "S9", empId: "NV004", empName: "Phạm Đức Thành", empCode: "2025012893", department: "PM", day: 5, session: "sang", reason: "Học thêm", status: "approved", week: "2026-W26", registeredAt: "07:00:00 20/6/2026", adminNote: "OK", processedAt: "08:00:00 20/6/2026" },
  { id: "S10", empId: "NV008", empName: "Bùi Văn Hùng", empCode: "2024112001", department: "DevOps", day: 5, session: "chieu", reason: "Trực ca đêm bù", status: "approved", week: "2026-W26", registeredAt: "14:00:00 21/6/2026", adminNote: "Duyệt bù trực", processedAt: "15:00:00 21/6/2026" },
  { id: "S11", empId: "NV002", empName: "Nguyễn Văn Minh", empCode: "2024031245", department: "Backend", day: 6, session: "sang", reason: "Nghỉ phép năm", status: "pending", week: "2026-W26", registeredAt: "08:00:00 23/6/2026", adminNote: "", processedAt: "" },
]

const INIT_TASKS: TaskItem[] = [
  { id: "T1", title: "Redesign dashboard UI", assignee: "Lê Thu Hương", dueDate: "30/06/2026", priority: "high", status: "in-progress" },
  { id: "T2", title: "Fix attendance API bug", assignee: "Nguyễn Văn Minh", dueDate: "26/06/2026", priority: "high", status: "todo" },
  { id: "T3", title: "Tài liệu onboarding nhân viên mới", assignee: "Hoàng Thị Mai", dueDate: "01/07/2026", priority: "medium", status: "todo" },
  { id: "T4", title: "Review code module Nhân sự", assignee: "Phạm Đức Thành", dueDate: "28/06/2026", priority: "medium", status: "in-progress" },
  { id: "T5", title: "Setup CI/CD pipeline", assignee: "Bùi Văn Hùng", dueDate: "27/06/2026", priority: "high", status: "done" },
  { id: "T6", title: "Báo cáo tháng 6", assignee: "Hoàng Thị Mai", dueDate: "05/07/2026", priority: "low", status: "todo" },
]

const NOTIFICATIONS = [
  { id: 1, type: "birthday", message: "Sinh nhật Nguyễn Văn Minh hôm nay 🎂", time: "08:00", read: false },
  { id: 2, type: "request", message: "Lê Thu Hương gửi đơn xin nghỉ ốm chờ duyệt", time: "07:45", read: false },
  { id: 3, type: "intern", message: "Võ Minh Tuấn kết thúc thực tập vào 30/07/2026", time: "Hôm qua", read: true },
  { id: 4, type: "request", message: "Nguyễn Văn Minh xin nghỉ phép 3 ngày (28-30/6)", time: "Hôm qua", read: true },
  { id: 5, type: "system", message: "Hệ thống cập nhật lên phiên bản v2.1.0 thành công", time: "2 ngày trước", read: true },
]

const WEEKLY_STATS = [
  { day: "T2", "Đúng giờ": 20, "Đi trễ": 5, "Vắng mặt": 3 },
  { day: "T3", "Đúng giờ": 22, "Đi trễ": 3, "Vắng mặt": 3 },
  { day: "T4", "Đúng giờ": 19, "Đi trễ": 6, "Vắng mặt": 3 },
  { day: "T5", "Đúng giờ": 21, "Đi trễ": 4, "Vắng mặt": 3 },
  { day: "T6", "Đúng giờ": 23, "Đi trễ": 3, "Vắng mặt": 2 },
  { day: "T7", "Đúng giờ": 15, "Đi trễ": 2, "Vắng mặt": 1 },
]

const MONTHLY_STATS = [
  { month: "T1", "Đúng giờ": 180, "Đi trễ": 40, "Vắng mặt": 20 },
  { month: "T2", "Đúng giờ": 170, "Đi trễ": 35, "Vắng mặt": 25 },
  { month: "T3", "Đúng giờ": 185, "Đi trễ": 30, "Vắng mặt": 15 },
  { month: "T4", "Đúng giờ": 175, "Đi trễ": 45, "Vắng mặt": 20 },
  { month: "T5", "Đúng giờ": 190, "Đi trễ": 28, "Vắng mặt": 18 },
  { month: "T6", "Đúng giờ": 165, "Đi trễ": 38, "Vắng mặt": 22 },
]

const PIE_DATA = [
  { name: "Đúng giờ", value: 22, color: "#16A34A" },
  { name: "Đi trễ", value: 10, color: "#EA580C" },
  { name: "Vắng mặt", value: 5, color: "#DC2626" },
  { name: "Nghỉ phép", value: 5, color: "#7C3AED" },
]

const VIOLATIONS = [
  { name: "Võ Minh Tuấn", count: 8 },
  { name: "Đinh Thị Lan Anh", count: 6 },
  { name: "Nguyễn Văn Minh", count: 5 },
  { name: "Hoàng Thị Mai", count: 4 },
  { name: "Trần Thị Bích Liên", count: 2 },
]

// ─── UTILS ────────────────────────────────────────────────────────────────────
function calcHours(ci: string, co: string): string {
  if (ci === "--" || co === "--") return "--"
  const [ih, im] = ci.split(":").map(Number)
  const [oh, om] = co.split(":").map(Number)
  const totalMin = oh * 60 + om - ih * 60 - im
  return `${Math.floor(totalMin / 60)}h${String(totalMin % 60).padStart(2, "0")}`
}

function initials(name: string): string {
  return name.split(" ").pop()?.charAt(0) ?? "?"
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  active: "Đang làm", inactive: "Nghỉ việc", intern: "Thực tập",
  "on-time": "Đúng giờ", late: "Đi trễ", absent: "Vắng mặt", leave: "Nghỉ phép",
  pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối",
  high: "Cao", medium: "Trung bình", low: "Thấp",
  todo: "Cần làm", "in-progress": "Đang làm", done: "Hoàn thành",
}
const STATUS_COLOR: Record<string, string> = {
  active: "bg-green-100 text-green-700", inactive: "bg-gray-100 text-gray-500", intern: "bg-purple-100 text-purple-700",
  "on-time": "bg-green-100 text-green-700", late: "bg-orange-100 text-orange-700", absent: "bg-red-100 text-red-700", leave: "bg-violet-100 text-violet-700",
  pending: "bg-amber-100 text-amber-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700",
  high: "bg-red-100 text-red-700", medium: "bg-amber-100 text-amber-700", low: "bg-blue-100 text-blue-600",
  todo: "bg-gray-100 text-gray-500", "in-progress": "bg-orange-100 text-orange-700", done: "bg-green-100 text-green-700",
}

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[status] ?? "bg-gray-100 text-gray-500"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function StatCard({ title, value, sub, iconBg, iconColor, numColor, icon: Icon }: {
  title: string; value: string | number; sub: string
  iconBg: string; iconColor: string; numColor: string; icon: React.ElementType
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/[0.06] flex items-center gap-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div>
        <p className={`text-2xl font-black ${numColor}`}>{value}</p>
        <p className="text-sm font-semibold text-gray-600">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

function AvatarCircle({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const s = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials(name)}
    </div>
  )
}

// ─── CALENDAR WIDGET ──────────────────────────────────────────────────────────
function CalendarWidget() {
  const [cur, setCur] = useState(new Date(2026, 5, 1))
  const months = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"]
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
  const y = cur.getFullYear(), m = cur.getMonth()
  const firstDay = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const dots: Record<number, string> = {
    2: "on-time", 3: "on-time", 4: "late", 5: "on-time", 6: "on-time",
    9: "on-time", 10: "late", 11: "absent", 12: "on-time", 13: "on-time",
    16: "on-time", 17: "leave", 18: "on-time", 19: "on-time", 20: "late",
    23: "on-time", 24: "on-time", 25: "on-time",
  }
  const dotColor: Record<string, string> = { "on-time": "bg-green-500", late: "bg-orange-500", absent: "bg-red-500", leave: "bg-purple-500" }
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-gray-700 text-sm">{months[m]}, {y}</span>
        <div className="flex gap-1">
          <button onClick={() => setCur(new Date(y, m - 1))} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft size={15} /></button>
          <button onClick={() => setCur(new Date(y, m + 1))} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight size={15} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => (
          <div key={i} className={`aspect-square flex flex-col items-center justify-center rounded-lg relative text-xs cursor-pointer
            ${d === 25 ? "bg-[#C62828] text-white font-bold" : d ? "hover:bg-red-50 text-gray-600" : ""}`}>
            {d && <span>{d}</span>}
            {d && dots[d] && (
              <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${d === 25 ? "bg-white" : dotColor[dots[d]]}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-3 flex-wrap">
        {[["bg-green-500", "Đúng giờ"], ["bg-orange-500", "Đi trễ"], ["bg-red-500", "Vắng"], ["bg-purple-500", "Nghỉ phép"]].map(([c, l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${c}`} />
            <span className="text-xs text-gray-400">{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── DIGITAL CLOCK ────────────────────────────────────────────────────────────
function DigitalClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  const pad = (n: number) => String(n).padStart(2, "0")
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]
  return (
    <div className="text-right">
      <div className="text-4xl font-bold text-white/90 font-mono tabular-nums leading-none">
        {pad(now.getHours())}:{pad(now.getMinutes())}
        <span className="text-xl text-white/60">{pad(now.getSeconds())}</span>
      </div>
      <div className="text-sm text-white/60 mt-1">{days[now.getDay()]}, {now.getDate()}/{now.getMonth() + 1}/{now.getFullYear()}</div>
    </div>
  )
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ active, onNavigate, collapsed, onLogout }: { active: Page; onNavigate: (p: Page) => void; collapsed: boolean; onLogout: () => void }) {
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

      {/* User card */}
      {!collapsed && (
        <div className="px-3 py-3">
          <div className="flex items-center gap-2.5 bg-white/5 rounded-xl p-2.5 border border-white/5">
            <ImageWithFallback src={avatarImg} alt="Avatar" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-white text-xs font-semibold truncate">Trần Thị Bích Liên</div>
              <div className="text-white/35 text-[10px] font-mono">NV001 · Admin</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 py-2" style={{ scrollbarWidth: "none" }}>
        <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />
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
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-white/5">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={18} />
          {!collapsed && <span className="font-medium">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  )
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function Header({ onToggle, unread, currentUser, onLogout, onNavigate }: {
  onToggle: () => void; unread: number
  currentUser: { name: string; id: string; role: Role; position: string; department: string }
  onLogout: () => void
  onNavigate: (p: Page) => void
}) {
  const [showDrop, setShowDrop] = useState(false)
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
      <div className="ml-auto flex items-center gap-2">
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

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState("")
  const [pass, setPass] = useState("")
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-[#160606] items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C62828]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#E64A19]/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-[#C62828] rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-black">D</span>
            </div>
            <div>
              <div className="text-white text-3xl font-black tracking-wide">DUDI</div>
              <div className="text-white/50 font-medium">software</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Hệ thống quản lý<br />
            <span className="text-[#FF8A65]">nhân sự & chấm công</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed">
            Quản lý nhân viên, theo dõi chấm công và tạo báo cáo — toàn bộ trong một nền tảng thống nhất.
          </p>
          <div className="mt-12 flex gap-10">
            {[["42+", "Nhân viên"], ["98%", "Chính xác"], ["24/7", "Hỗ trợ"]].map(([v, l]) => (
              <div key={l}>
                <div className="text-3xl font-bold text-[#FF8A65]">{v}</div>
                <div className="text-white/40 text-sm mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-[420px] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 bg-[#C62828] rounded-xl flex items-center justify-center">
              <span className="text-white font-black">D</span>
            </div>
            <div className="font-bold text-gray-800">DUDI software</div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Đăng nhập</h2>
          <p className="text-gray-400 text-sm mb-8">Nhập thông tin tài khoản để truy cập</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email công ty</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@dudi.vn"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/10 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/10 transition-all" />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-500 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 accent-[#C62828]" />
                Ghi nhớ đăng nhập
              </label>
              <a href="#" className="text-[#C62828] font-semibold hover:underline">Quên mật khẩu?</a>
            </div>
            <button onClick={() => onLogin(email)}
              className="w-full bg-[#C62828] hover:bg-[#B71C1C] active:bg-[#A31515] text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#C62828]/20">
              Đăng nhập <ArrowRight size={18} />
            </button>
          </div>
          <div className="mt-5 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs text-gray-500 space-y-3">
            <p className="font-semibold text-gray-700 text-sm">Đăng nhập nhanh:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setEmail("admin@dudi.vn"); setPass("123456"); onLogin("admin@dudi.vn") }}
                className="w-full flex flex-col items-center justify-center p-3 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 transition-colors cursor-pointer text-violet-700"
              >
                <div className="font-bold mb-1">Quản lý</div>
                <div className="font-mono text-[10px] opacity-75">admin@dudi.vn</div>
              </button>
              <button
                onClick={() => { setEmail("lien.tran@dudi.vn"); setPass("123456"); onLogin("lien.tran@dudi.vn") }}
                className="w-full flex flex-col items-center justify-center p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer text-amber-700"
              >
                <div className="font-bold mb-1">Nhân viên</div>
                <div className="font-mono text-[10px] opacity-75">lien.tran@dudi.vn</div>
              </button>
            </div>
            <p className="text-gray-400 text-[10px] text-center pt-1">Hệ thống tự phân quyền dựa vào tài khoản đăng nhập.</p>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  return (
    <div className="space-y-6">
      {/* Hero row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome card — clean, no cramped stats */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#C62828] via-[#D63020] to-[#E64A19] rounded-2xl p-7 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-white/55 text-sm font-medium">Xin chào,</p>
              <h2 className="text-2xl font-bold mt-1">Trần Thị Bích Liên</h2>
              <p className="text-white/55 text-sm mt-0.5">Quản trị viên hệ thống · DUDI Software</p>
            </div>
            <DigitalClock />
          </div>
        </div>

        {/* Quick notifications */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-700 text-sm">Thông báo mới</h3>
            <span className="bg-[#C62828] text-white text-xs px-2 py-0.5 rounded-full font-bold">2</span>
          </div>
          <div className="space-y-3">
            {NOTIFICATIONS.filter(n => !n.read).map(n => (
              <div key={n.id} className="flex gap-3 items-start group cursor-pointer">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                  ${n.type === "birthday" ? "bg-pink-100" : n.type === "request" ? "bg-orange-100" : "bg-blue-100"}`}>
                  {n.type === "birthday" ? <Award size={14} className="text-pink-600" /> :
                    n.type === "request" ? <FileText size={14} className="text-orange-600" /> :
                      <Bell size={14} className="text-blue-600" />}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 leading-relaxed group-hover:text-[#C62828] transition-colors">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate("thong-bao")}
            className="mt-4 w-full text-center text-xs text-[#C62828] font-semibold hover:underline">
            Xem tất cả thông báo →
          </button>
        </div>
      </div>

      {/* System KPI — 3 small cards replacing the broken inline stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Tổng nhân viên", value: "42", sub: "trong hệ thống", color: "text-[#C62828]", bg: "bg-red-50" },
          { label: "Đang làm việc", value: "7", sub: "hôm nay", color: "text-green-600", bg: "bg-green-50" },
          { label: "Chờ xử lý", value: "3", sub: "đơn xin nghỉ", color: "text-amber-600", bg: "bg-amber-50" },
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl px-5 py-4 border border-black/[0.04]`}>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            <p className="text-sm font-semibold text-gray-600 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Attendance stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Đúng giờ" value={22} sub="Hôm nay" iconBg="bg-green-50" iconColor="text-green-600" numColor="text-green-600" icon={UserCheck} />
        <StatCard title="Đi trễ" value={10} sub="Hôm nay" iconBg="bg-orange-50" iconColor="text-orange-500" numColor="text-orange-500" icon={Clock} />
        <StatCard title="Vắng mặt" value={5} sub="Hôm nay" iconBg="bg-red-50" iconColor="text-red-500" numColor="text-red-500" icon={UserX} />
        <StatCard title="Chờ duyệt" value={3} sub="Đơn xin nghỉ" iconBg="bg-rose-50" iconColor="text-rose-600" numColor="text-rose-600" icon={FileText} />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.06]">
          <h3 className="font-bold text-gray-700 text-sm mb-5">Lịch chấm công</h3>
          <CalendarWidget />
        </div>

        {/* Weekly bar chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.06]">
          <h3 className="font-bold text-gray-700 text-sm mb-5">Thống kê tuần này</h3>
          <ResponsiveContainer key="chart-weekly" width="100%" height={190}>
            <BarChart id="weekly-bar" data={WEEKLY_STATS} barSize={7} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip isAnimationActive={false} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,.12)" }} />
              <Bar key="w-dung-gio" dataKey="Đúng giờ" fill="#16A34A" radius={4} isAnimationActive={false} />
              <Bar key="w-di-tre" dataKey="Đi trễ" fill="#EA580C" radius={4} isAnimationActive={false} />
              <Bar key="w-vang" dataKey="Vắng mặt" fill="#DC2626" radius={4} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pending tasks quick view */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.06] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-700 text-sm">Việc cần xử lý</h3>
            <button onClick={() => onNavigate("cong-viec")} className="text-xs text-[#C62828] font-semibold hover:underline">Xem tất cả →</button>
          </div>
          <div className="space-y-3 flex-1">
            {INIT_TASKS.filter(t => t.status !== "done").slice(0, 4).map(task => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-red-50/40 transition-colors cursor-pointer">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0
                  ${task.priority === "high" ? "bg-red-500" : task.priority === "medium" ? "bg-amber-500" : "bg-blue-400"}`} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700 truncate">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{task.assignee} · {task.dueDate}</p>
                </div>
                <Badge status={task.status} />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between text-xs text-gray-400">
            <span>{INIT_TASKS.filter(t => t.status === "done").length} hoàn thành</span>
            <span>{INIT_TASKS.filter(t => t.status !== "done").length} còn lại</span>
          </div>
        </div>
      </div>

      {/* Recent attendance table */}
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-700 text-sm">Chấm công hôm nay</h3>
          <button onClick={() => onNavigate("cham-cong")} className="text-sm text-[#C62828] font-semibold hover:underline">Xem tất cả →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/70 text-gray-400 text-xs">
                {["Nhân viên", "Phòng ban", "Check-in", "Check-out", "Trạng thái"].map(h => (
                  <th key={h} className="px-6 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ATTENDANCE.slice(0, 5).map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-gray-700">{r.employeeName}</td>
                  <td className="px-6 py-3.5 text-gray-500 text-xs">{r.department}</td>
                  <td className="px-6 py-3.5 font-mono text-gray-600 text-xs">{r.checkIn}</td>
                  <td className="px-6 py-3.5 font-mono text-gray-600 text-xs">{r.checkOut}</td>
                  <td className="px-6 py-3.5"><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── EMPLOYEE MANAGEMENT ──────────────────────────────────────────────────────
function EmployeeManagement({ employees, setEmployees }: { employees: Employee[]; setEmployees: React.Dispatch<React.SetStateAction<Employee[]>> }) {
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

  const filtered = employees.filter(e => {
    const q = search.toLowerCase()
    const matchQ = e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
    const matchS = filterStatus === "all" || e.status === filterStatus
    const matchD = filterDept === "all" || e.department === filterDept
    return matchQ && matchS && matchD
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
function AttendanceManagement() {
  const [filterStatus, setFilterStatus] = useState("all")

  const filtered = ATTENDANCE.filter(r => filterStatus === "all" || r.status === filterStatus)
  const counts = {
    onTime: ATTENDANCE.filter(r => r.status === "on-time").length,
    late: ATTENDANCE.filter(r => r.status === "late").length,
    absent: ATTENDANCE.filter(r => r.status === "absent").length,
    leave: ATTENDANCE.filter(r => r.status === "leave").length,
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý chấm công</h2>
          <p className="text-sm text-gray-400 mt-0.5">Thứ Năm, 25 tháng 6 năm 2026</p>
        </div>
        <div className="flex gap-2">
          <input type="date" defaultValue="2026-06-25"
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 text-gray-600" />
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download size={15} /> Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Đúng giờ" value={counts.onTime} sub="Nhân viên" iconBg="bg-green-50" iconColor="text-green-600" numColor="text-green-600" icon={UserCheck} />
        <StatCard title="Đi trễ" value={counts.late} sub="Nhân viên" iconBg="bg-orange-50" iconColor="text-orange-500" numColor="text-orange-500" icon={Clock} />
        <StatCard title="Vắng mặt" value={counts.absent} sub="Nhân viên" iconBg="bg-red-50" iconColor="text-red-500" numColor="text-red-500" icon={UserX} />
        <StatCard title="Nghỉ phép" value={counts.leave} sub="Nhân viên" iconBg="bg-purple-50" iconColor="text-purple-600" numColor="text-purple-600" icon={Calendar} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-bold text-gray-700 text-sm">Bảng chấm công</h3>
          <div className="flex gap-2 flex-wrap">
            {[["all", "Tất cả"], ["on-time", "Đúng giờ"], ["late", "Đi trễ"], ["absent", "Vắng"], ["leave", "Nghỉ phép"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilterStatus(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                  ${filterStatus === v ? "bg-[#C62828] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-gray-400 text-xs border-b border-gray-100">
                {["Nhân viên", "Phòng ban", "Check-in", "Check-out", "Giờ làm", "Trạng thái", "Ghi chú", ""].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4 font-semibold text-gray-700 text-sm">{r.employeeName}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{r.department}</td>
                  <td className="px-5 py-4 font-mono text-gray-600 text-xs font-medium">{r.checkIn}</td>
                  <td className="px-5 py-4 font-mono text-gray-600 text-xs font-medium">{r.checkOut}</td>
                  <td className="px-5 py-4 font-mono text-gray-500 text-xs">{calcHours(r.checkIn, r.checkOut)}</td>
                  <td className="px-5 py-4"><Badge status={r.status} /></td>
                  <td className="px-5 py-4 text-gray-400 text-xs">{r.note || "—"}</td>
                  <td className="px-5 py-4">
                    <button className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-400 hover:text-blue-600 transition-colors" title="Điều chỉnh">
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── STATISTICS ───────────────────────────────────────────────────────────────
function Statistics() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-800">Báo cáo thống kê</h2>
        <div className="flex gap-2">
          <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 text-gray-600">
            <option>Tháng 6/2026</option><option>Tháng 5/2026</option><option>Quý 2/2026</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#C62828] text-white rounded-xl text-sm font-bold hover:bg-[#B71C1C] transition-colors shadow-sm shadow-[#C62828]/20">
            <Download size={15} /> Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng chấm công" value="1,240" sub="Lượt / tháng" iconBg="bg-rose-50" iconColor="text-[#C62828]" numColor="text-[#C62828]" icon={Clock} />
        <StatCard title="Tỷ lệ đúng giờ" value="78%" sub="Tháng 6/2026" iconBg="bg-green-50" iconColor="text-green-600" numColor="text-green-600" icon={TrendingUp} />
        <StatCard title="Vi phạm" value={25} sub="Lần đi trễ" iconBg="bg-orange-50" iconColor="text-orange-500" numColor="text-orange-500" icon={AlertCircle} />
        <StatCard title="Đang làm việc" value={7} sub="Nhân viên" iconBg="bg-blue-50" iconColor="text-blue-500" numColor="text-blue-500" icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
          <h3 className="font-bold text-gray-700 text-sm mb-5">Chấm công 6 tháng gần nhất</h3>
          <ResponsiveContainer key="chart-monthly" width="100%" height={240}>
            <BarChart id="monthly-bar" data={MONTHLY_STATS} barSize={10} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip isAnimationActive={false} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,.12)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar key="m-dung-gio" dataKey="Đúng giờ" fill="#16A34A" radius={4} isAnimationActive={false} />
              <Bar key="m-di-tre" dataKey="Đi trễ" fill="#EA580C" radius={4} isAnimationActive={false} />
              <Bar key="m-vang" dataKey="Vắng mặt" fill="#DC2626" radius={4} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
          <h3 className="font-bold text-gray-700 text-sm mb-5">Tỷ lệ chấm công tháng 6</h3>
          <ResponsiveContainer key="chart-pie" width="100%" height={240}>
            <PieChart id="pie-chart">
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value" isAnimationActive={false}>
                {PIE_DATA.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip isAnimationActive={false} formatter={(v: unknown) => [`${v} người`, ""]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,.12)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
        <h3 className="font-bold text-gray-700 text-sm mb-5">BXH vi phạm tháng 6</h3>
        <div className="space-y-4">
          {VIOLATIONS.map((v, i) => (
            <div key={v.name} className="flex items-center gap-4">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${i === 0 ? "bg-red-100 text-red-600" : i === 1 ? "bg-orange-100 text-orange-600" : i === 2 ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500"}`}>
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-700">{v.name}</span>
                  <span className="text-sm font-bold text-[#C62828]">{v.count} lần</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(v.count / 10) * 100}%`, background: i === 0 ? "#C62828" : i === 1 ? "#EA580C" : i === 2 ? "#F59E0B" : "#9CA3AF" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── APPROVAL MANAGEMENT BYPASSED FOR MODULAR IMPORT ──────────────────────────

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
function NotificationManagement() {
  const unread = NOTIFICATIONS.filter(n => !n.read)
  const read = NOTIFICATIONS.filter(n => n.read)

  function NotifItem({ n }: { n: typeof NOTIFICATIONS[0] }) {
    const colors = { birthday: "bg-pink-100", request: "bg-orange-100", intern: "bg-blue-100", system: "bg-gray-100" }
    const icons = {
      birthday: <Award size={16} className="text-pink-600" />,
      request: <FileText size={16} className="text-orange-600" />,
      intern: <User size={16} className="text-blue-600" />,
      system: <Bell size={16} className="text-gray-500" />,
    }
    return (
      <div className={`px-6 py-4 flex gap-4 hover:bg-gray-50/60 transition-colors cursor-pointer ${!n.read ? "bg-orange-50/30" : ""}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[n.type as keyof typeof colors] ?? "bg-gray-100"}`}>
          {icons[n.type as keyof typeof icons] ?? <Bell size={16} />}
        </div>
        <div className="flex-1">
          <p className={`text-sm ${!n.read ? "font-semibold text-gray-800" : "text-gray-600"}`}>{n.message}</p>
          <p className="text-xs text-gray-400 mt-1">{n.time}</p>
        </div>
        {!n.read && <div className="w-2 h-2 bg-[#C62828] rounded-full mt-2 flex-shrink-0" />}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800">Thông báo</h2>
      {unread.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
          <div className="px-6 py-3 bg-orange-50/50 border-b border-orange-100">
            <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">Chưa đọc · {unread.length}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {unread.map(n => <NotifItem key={n.id} n={n} />)}
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
        <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đã đọc · {read.length}</p>
        </div>
        <div className="divide-y divide-gray-50">
          {read.map(n => <NotifItem key={n.id} n={n} />)}
        </div>
      </div>
    </div>
  )
}

// ─── TASK MANAGEMENT ──────────────────────────────────────────────────────────
function TaskManagement() {
  const [tasks, setTasks] = useState(INIT_TASKS)

  const columns: { id: TaskItem["status"]; label: string; accent: string; border: string }[] = [
    { id: "todo", label: "Cần làm", accent: "bg-gray-50", border: "border-gray-200" },
    { id: "in-progress", label: "Đang thực hiện", accent: "bg-orange-50/60", border: "border-orange-200" },
    { id: "done", label: "Hoàn thành", accent: "bg-green-50/60", border: "border-green-200" },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý công việc</h2>
          <p className="text-sm text-gray-400 mt-0.5">{tasks.length} công việc · {tasks.filter(t => t.status === "done").length} hoàn thành</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#C62828] text-white rounded-xl text-sm font-bold hover:bg-[#B71C1C] transition-colors shadow-sm shadow-[#C62828]/20">
          <Plus size={15} /> Thêm công việc
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id)
          return (
            <div key={col.id} className={`${col.accent} rounded-2xl p-4 border ${col.border}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-gray-700 text-sm">{col.label}</span>
                <span className="bg-white text-gray-500 text-xs px-2 py-0.5 rounded-full font-bold border border-gray-100">{colTasks.length}</span>
              </div>
              <div className="space-y-3">
                {colTasks.map(task => (
                  <div key={task.id} className="bg-white rounded-xl p-4 shadow-sm border border-black/5 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="text-sm font-semibold text-gray-700 leading-tight flex-1">{task.title}</p>
                      <Badge status={task.priority} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <User size={11} />
                        <span>{task.assignee}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar size={11} />
                        <span>{task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="py-6 text-center text-gray-300 text-xs">Không có công việc</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── SIMPLE ORG CHART REMOVED ────────────────────────────────────────────────

// ─── PLACEHOLDER PAGES ────────────────────────────────────────────────────────
function PlaceholderPage({ title, desc, icon: Icon, items }: { title: string; desc: string; icon: React.ElementType; items?: string[] }) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      <div className="bg-white rounded-2xl p-10 shadow-sm border border-black/5 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={30} className="text-[#C62828] opacity-50" />
        </div>
        <h3 className="font-bold text-gray-600 mb-2">{title}</h3>
        <p className="text-sm text-gray-400 max-w-sm">{desc}</p>
        {items && (
          <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-sm">
            {items.map(item => (
              <div key={item} className="bg-gray-50 rounded-xl p-3 text-left border border-gray-100 cursor-pointer hover:bg-red-50 hover:border-[#C62828]/20 transition-colors">
                <p className="text-xs font-semibold text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TASK PANEL ───────────────────────────────────────────────────────────────
const TASK_HISTORY = [
  {
    date: "24/06/2026", dayName: "Thứ Tư",
    tasks: [
      { id: "h1", title: "Viết API endpoint chấm công", done: true },
      { id: "h2", title: "Review code module nhân sự", done: true },
    ]
  },
  {
    date: "23/06/2026", dayName: "Thứ Ba",
    tasks: [
      { id: "h3", title: "Thiết kế lại trang web", done: true },
      { id: "h4", title: "Viết section cho danh mục web", done: true },
    ]
  },
  {
    date: "20/06/2026", dayName: "Thứ Sáu",
    tasks: [
      { id: "h5", title: "Setup CI/CD pipeline", done: true },
      { id: "h6", title: "Báo cáo sprint Q2", done: true },
    ]
  },
]

function TaskPanel() {
  const [tasks, setTasks] = useState(INIT_TASKS)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState("")

  const today = new Date()
  const todayStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]
  const todayLabel = `${todayStr} · ${days[today.getDay()]}`

  const myTasks = tasks.filter(t => t.assignee === ME.name)
  const todayTasks: typeof myTasks = [] // no tasks assigned to user today (matches image empty state)

  const cntTodo = todayTasks.filter(t => t.status === "todo").length
  const cntDoing = todayTasks.filter(t => t.status === "in-progress").length
  const cntDone = TASK_HISTORY.reduce((acc, d) => acc + d.tasks.filter(t => t.done).length, 0)

  const handleAdd = () => {
    if (!newTitle.trim()) return
    setTasks(p => [...p, {
      id: `U${Date.now()}`, title: newTitle.trim(),
      assignee: ME.name, dueDate: todayStr,
      priority: "medium" as const, status: "todo" as const
    }])
    setNewTitle(""); setShowAdd(false)
  }

  return (
    <div className="space-y-4">
      {/* Date + Thêm mới */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-500">{todayLabel}</p>
        <button onClick={() => setShowAdd(p => !p)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm transition-all active:scale-95"
          style={{ background: "linear-gradient(to right,#E64A19,#FF8C00)" }}>
          <Plus size={15} /> Thêm mới
        </button>
      </div>

      {/* Add task input */}
      {showAdd && (
        <div className="flex gap-2">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="Tên công việc..." autoFocus
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 focus:ring-1 focus:ring-[#C62828]/10 transition-all" />
          <button onClick={handleAdd} className="px-4 py-2 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-sm font-bold transition-colors">
            Thêm
          </button>
        </div>
      )}

      {/* 3 stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Chưa làm", cnt: cntTodo, num: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
          { label: "Đang làm", cnt: cntDoing, num: "text-amber-500", bg: "bg-amber-50 border-amber-100" },
          { label: "Đã xong", cnt: cntDone, num: "text-green-500", bg: "bg-green-50 border-green-100" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 border ${s.bg}`}>
            <p className={`text-3xl font-black ${s.num}`}>{s.cnt}</p>
            <p className="text-xs font-semibold text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Today tasks or empty state */}
      {todayTasks.length === 0 ? (
        <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <div className="text-4xl mb-2">😴</div>
          <p className="font-bold text-gray-600">Hôm nay không có công việc</p>
          <p className="text-xs text-gray-400 mt-1">{todayLabel} · Nghỉ ngơi chút nhé!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {todayTasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0
                ${task.status === "done" ? "bg-green-500" : task.status === "in-progress" ? "bg-orange-500" : "bg-gray-300"}`} />
              <p className={`flex-1 text-sm font-semibold ${task.status === "done" ? "line-through text-gray-400" : "text-gray-700"}`}>
                {task.title}
              </p>
              <Badge status={task.status} />
            </div>
          ))}
        </div>
      )}

      {/* Nhật ký công việc */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Nhật ký công việc</p>
        <div className="space-y-4">
          {TASK_HISTORY.map(group => (
            <div key={group.date}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#C62828] flex-shrink-0" />
                <p className="text-xs font-bold text-gray-500">{group.date} · {group.dayName}</p>
              </div>
              <div className="space-y-2 ml-4">
                {group.tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-gray-100">
                    <Check size={15} className="text-green-500 flex-shrink-0" />
                    <p className="flex-1 text-sm text-gray-600 truncate">{t.title}</p>
                    <span className="text-xs font-semibold text-green-600 border border-green-200 bg-green-50 px-2 py-0.5 rounded-lg whitespace-nowrap">
                      Đã xong
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── LEAVE PANEL (2-tab: Xin nghỉ phép | Time Off tuần) ─────────────────────
function LeavePanel({ inp, leaveReason, setLeaveReason, leaveSent, handleSendLeave, offSlots, toggleSlot, WEEK }: {
  inp: string; leaveReason: string; setLeaveReason: (v: string) => void
  leaveSent: boolean; handleSendLeave: () => void
  offSlots: { day: number; session: string }[]; toggleSlot: (day: number, session: string) => void
  WEEK: { label: string; day: number }[]
}) {
  const [leaveTab, setLeaveTab] = useState<"phep" | "timeoff">("phep")

  const HISTORY = [
    { type: "Nghỉ phép năm", date: "15/06/2026", status: "approved" },
    { type: "Nghỉ ốm", date: "03/05/2026", status: "approved" },
    { type: "Nghỉ phép năm", date: "20/04/2026", status: "rejected" },
  ]

  return (
    <div className="space-y-4">
      {/* Phép còn lại */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Phép còn lại:</span>
        <span className="text-lg font-black text-[#C62828]">12 ngày</span>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button onClick={() => setLeaveTab("phep")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all
            ${leaveTab === "phep" ? "bg-white text-[#C62828] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
          Xin nghỉ phép
        </button>
        <button onClick={() => setLeaveTab("timeoff")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all
            ${leaveTab === "timeoff" ? "bg-white text-[#C62828] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
          Time Off tuần
        </button>
      </div>

      {/* ── Tab: Xin nghỉ phép ── */}
      {leaveTab === "phep" && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Loại nghỉ</label>
            <select className={inp}>
              <option>Nghỉ phép</option>
              <option>Nghỉ ốm</option>
              <option>Nghỉ không lương</option>
              <option>Nghỉ cưới</option>
              <option>Nghỉ tang</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Ngày nghỉ</label>
            <input type="date" className={inp} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Lý do</label>
            <textarea value={leaveReason} onChange={e => setLeaveReason(e.target.value)} rows={3}
              placeholder="Mô tả lý do..." className={`${inp} resize-none`} />
          </div>
          <button onClick={handleSendLeave}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all
              ${leaveSent
                ? "bg-green-500 text-white"
                : "text-white shadow-md"}`}
            style={leaveSent ? {} : { background: "linear-gradient(to right,#C62828,#FF6D00)" }}>
            {leaveSent ? "✓ Đã gửi đơn thành công!" : "Gửi duyệt"}
          </button>

          {/* Lịch sử xin nghỉ */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Lịch sử xin nghỉ</p>
            <div className="space-y-2">
              {HISTORY.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{h.type}</p>
                    <p className="text-xs text-gray-400">{h.date}</p>
                  </div>
                  <Badge status={h.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Time Off tuần ── */}
      {leaveTab === "timeoff" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Chọn buổi cần đăng ký time off trong tuần này:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="w-8 pb-2" />
                  {WEEK.map(d => (
                    <th key={d.day} colSpan={2} className="text-center text-gray-500 font-bold pb-2">
                      <div>{d.label}</div>
                    </th>
                  ))}
                </tr>
                <tr>
                  <th />
                  {WEEK.map(d => (
                    <React.Fragment key={d.day}>
                      <th className="text-[10px] text-teal-600 font-bold pb-2 w-9">Sáng</th>
                      <th className="text-[10px] text-blue-500 font-bold pb-2 w-9">Chiều</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-[10px] text-gray-400 pr-1 font-semibold">Nghỉ</td>
                  {WEEK.map(d => (
                    <React.Fragment key={d.day}>
                      {["sang", "chieu"].map(sess => {
                        const active = offSlots.some(s => s.day === d.day && s.session === sess)
                        return (
                          <td key={sess} className="p-1 text-center">
                            <button onClick={() => toggleSlot(d.day, sess)}
                              className={`w-8 h-8 rounded-xl text-[10px] font-bold transition-all
                                ${active ? "bg-[#C62828] text-white shadow-sm shadow-[#C62828]/30" : "bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500"}`}>
                              {active ? "✓" : ""}
                            </button>
                          </td>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {offSlots.length > 0 ? (
            <button style={{ background: "linear-gradient(to right,#C62828,#FF6D00)" }}
              className="w-full py-3.5 text-white rounded-xl text-sm font-bold shadow-md transition-opacity hover:opacity-90">
              Gửi đăng ký time off ({offSlots.length} buổi)
            </button>
          ) : (
            <div className="py-6 text-center text-gray-300 border border-dashed border-gray-200 rounded-xl">
              <Calendar size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Chọn buổi cần nghỉ bên trên</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── MONTHLY ATTENDANCE DATA (June 2026) ──────────────────────────────────────
interface DayRecord {
  dayName: string; date: string; dateNum: number
  checkIn: string; checkOut: string
  isWeekend: boolean; isAbsent: boolean; isToday: boolean
}

const JUNE_2026: DayRecord[] = [
  { dayName: "Thứ Hai", date: "01/06/2026", dateNum: 1, checkIn: "", checkOut: "", isWeekend: false, isAbsent: true, isToday: false },
  { dayName: "Thứ Ba", date: "02/06/2026", dateNum: 2, checkIn: "11:10:07", checkOut: "17:19:59", isWeekend: false, isAbsent: false, isToday: false },
  { dayName: "Thứ Tư", date: "03/06/2026", dateNum: 3, checkIn: "", checkOut: "", isWeekend: false, isAbsent: true, isToday: false },
  { dayName: "Thứ Năm", date: "04/06/2026", dateNum: 4, checkIn: "08:57:27", checkOut: "17:03:15", isWeekend: false, isAbsent: false, isToday: false },
  { dayName: "Thứ Sáu", date: "05/06/2026", dateNum: 5, checkIn: "09:00:31", checkOut: "17:04:29", isWeekend: false, isAbsent: false, isToday: false },
  { dayName: "Thứ Bảy", date: "06/06/2026", dateNum: 6, checkIn: "", checkOut: "", isWeekend: true, isAbsent: false, isToday: false },
  { dayName: "Chủ Nhật", date: "07/06/2026", dateNum: 7, checkIn: "", checkOut: "", isWeekend: true, isAbsent: false, isToday: false },
  { dayName: "Thứ Hai", date: "08/06/2026", dateNum: 8, checkIn: "", checkOut: "", isWeekend: false, isAbsent: true, isToday: false },
  { dayName: "Thứ Ba", date: "09/06/2026", dateNum: 9, checkIn: "09:03:52", checkOut: "17:01:14", isWeekend: false, isAbsent: false, isToday: false },
  { dayName: "Thứ Tư", date: "10/06/2026", dateNum: 10, checkIn: "09:11:42", checkOut: "17:00:05", isWeekend: false, isAbsent: false, isToday: false },
  { dayName: "Thứ Năm", date: "11/06/2026", dateNum: 11, checkIn: "08:59:01", checkOut: "17:02:33", isWeekend: false, isAbsent: false, isToday: false },
  { dayName: "Thứ Sáu", date: "12/06/2026", dateNum: 12, checkIn: "09:05:18", checkOut: "17:08:42", isWeekend: false, isAbsent: false, isToday: false },
  { dayName: "Thứ Bảy", date: "13/06/2026", dateNum: 13, checkIn: "", checkOut: "", isWeekend: true, isAbsent: false, isToday: false },
  { dayName: "Chủ Nhật", date: "14/06/2026", dateNum: 14, checkIn: "", checkOut: "", isWeekend: true, isAbsent: false, isToday: false },
  { dayName: "Thứ Hai", date: "15/06/2026", dateNum: 15, checkIn: "08:58:44", checkOut: "17:00:12", isWeekend: false, isAbsent: false, isToday: false },
  { dayName: "Thứ Ba", date: "16/06/2026", dateNum: 16, checkIn: "09:22:15", checkOut: "17:05:08", isWeekend: false, isAbsent: false, isToday: false },
  { dayName: "Thứ Tư", date: "17/06/2026", dateNum: 17, checkIn: "09:01:55", checkOut: "17:00:30", isWeekend: false, isAbsent: false, isToday: false },
  { dayName: "Thứ Năm", date: "18/06/2026", dateNum: 18, checkIn: "", checkOut: "", isWeekend: false, isAbsent: true, isToday: false },
  { dayName: "Thứ Sáu", date: "19/06/2026", dateNum: 19, checkIn: "08:55:30", checkOut: "17:10:05", isWeekend: false, isAbsent: false, isToday: false },
  { dayName: "Thứ Bảy", date: "20/06/2026", dateNum: 20, checkIn: "", checkOut: "", isWeekend: true, isAbsent: false, isToday: false },
  { dayName: "Chủ Nhật", date: "21/06/2026", dateNum: 21, checkIn: "", checkOut: "", isWeekend: true, isAbsent: false, isToday: false },
  { dayName: "Thứ Hai", date: "22/06/2026", dateNum: 22, checkIn: "09:08:33", checkOut: "17:03:22", isWeekend: false, isAbsent: false, isToday: false },
  { dayName: "Thứ Ba", date: "23/06/2026", dateNum: 23, checkIn: "08:59:58", checkOut: "17:01:45", isWeekend: false, isAbsent: false, isToday: false },
  { dayName: "Thứ Tư", date: "24/06/2026", dateNum: 24, checkIn: "09:15:02", checkOut: "17:07:19", isWeekend: false, isAbsent: false, isToday: false },
  { dayName: "Thứ Năm", date: "25/06/2026", dateNum: 25, checkIn: "", checkOut: "", isWeekend: false, isAbsent: false, isToday: true },
  { dayName: "Thứ Sáu", date: "26/06/2026", dateNum: 26, checkIn: "", checkOut: "", isWeekend: false, isAbsent: false, isToday: false },
  { dayName: "Thứ Bảy", date: "27/06/2026", dateNum: 27, checkIn: "", checkOut: "", isWeekend: true, isAbsent: false, isToday: false },
  { dayName: "Chủ Nhật", date: "28/06/2026", dateNum: 28, checkIn: "", checkOut: "", isWeekend: true, isAbsent: false, isToday: false },
  { dayName: "Thứ Hai", date: "29/06/2026", dateNum: 29, checkIn: "", checkOut: "", isWeekend: false, isAbsent: false, isToday: false },
  { dayName: "Thứ Ba", date: "30/06/2026", dateNum: 30, checkIn: "", checkOut: "", isWeekend: false, isAbsent: false, isToday: false },
]

function calcLate(checkIn: string): string {
  if (!checkIn) return ""
  const [h, m] = checkIn.split(":").map(Number)
  const totalMin = h * 60 + m
  const standard = 9 * 60 // 09:00
  if (totalMin <= standard) return ""
  const late = totalMin - standard
  if (late >= 60) return `Trễ ${Math.floor(late / 60)}h${late % 60 > 0 ? late % 60 + "p" : ""}`
  return `Trễ ${late} phút`
}

function MonthlyAttendanceTable({ todayCheckIn, todayCheckOut }: { todayCheckIn: string; todayCheckOut: string }) {
  const rows = JUNE_2026.map(r =>
    r.isToday ? { ...r, checkIn: todayCheckIn, checkOut: todayCheckOut } : r
  )

  const lateStyle = "bg-amber-50 text-amber-700 font-semibold"
  const absentStyle = "bg-red-50 text-red-400"
  const okStyle = "bg-green-50"

  return (
    <div className="w-full max-w-4xl mt-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-black text-[#C62828] tracking-wide">BẢNG CHẤM CÔNG THÁNG</h2>
        <div className="w-16 h-0.5 bg-[#C62828] mx-auto mt-1 rounded-full" />
      </div>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-black/[0.06]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#C62828] text-white text-xs font-bold uppercase tracking-wider">
                {["Thứ", "Ngày", "Check-in", "Check-out", "Buổi Sáng", "Buổi Chiều"].map(h => (
                  <th key={h} className="px-4 py-3 text-center">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const late = calcLate(r.checkIn)
                const isLate = !!late
                const rowBg = r.isToday ? "bg-green-50 border-l-4 border-l-green-500"
                  : r.isWeekend ? "bg-gray-50 text-gray-400"
                    : ""
                return (
                  <tr key={i} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${rowBg}`}>
                    <td className={`px-4 py-3 text-center font-medium ${r.isWeekend && r.dayName === "Chủ Nhật" ? "text-red-400" : ""}`}>
                      {r.dayName}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs">
                      {r.date}
                      {r.isToday && <span className="ml-1.5 text-[10px] bg-[#C62828] text-white px-1.5 py-0.5 rounded-full">Hôm nay</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-gray-600">
                      {r.checkIn || (r.isWeekend || r.isAbsent || (!r.checkIn && r.dateNum >= 25) ? "" : "")}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-gray-600">
                      {r.checkOut}
                    </td>
                    {/* Buổi Sáng */}
                    <td className={`px-4 py-3 text-center text-xs rounded-sm
                      ${r.isAbsent ? absentStyle : isLate ? lateStyle : r.checkIn ? okStyle : ""}`}>
                      {r.isAbsent ? "Nghỉ" : late || ""}
                    </td>
                    {/* Buổi Chiều */}
                    <td className={`px-4 py-3 text-center text-xs
                      ${r.isAbsent ? absentStyle : r.checkOut ? okStyle : ""}`}>
                      {r.isAbsent ? "Nghỉ" : ""}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div className="px-5 py-3 border-t border-gray-100 flex gap-5 flex-wrap bg-gray-50/50">
          {[["bg-green-100", "Đúng giờ"], ["bg-amber-100", "Đi trễ"], ["bg-red-100", "Nghỉ"], ["bg-gray-100", "Cuối tuần"]].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`w-3 h-3 rounded ${c}`} />{l}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── USER PORTAL COMPONENTS ─────────────────────────────────────────────────────
const ME = INIT_EMPLOYEES[0]

function UserHome({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [checkedIn, setCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState("")

  const handleCheckIn = () => {
    const now = new Date()
    const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    if (!checkedIn) { setCheckInTime(t); setCheckedIn(true) }
    else { setCheckInTime(""); setCheckedIn(false) }
  }

  return (
    <div className="space-y-6">
      {/* Hero row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-[#C62828] via-[#D63020] to-[#E64A19] rounded-2xl p-7 text-white overflow-hidden relative shadow-md shadow-[#C62828]/20">
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-white/55 text-sm font-medium mb-1">Xin chào,</p>
              <h2 className="text-2xl font-bold">{ME.name}</h2>
              <p className="text-white/70 text-sm mt-1">{ME.position} · {ME.department}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/5 flex flex-col items-center justify-center">
          <button onClick={handleCheckIn}
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center gap-1 shadow-xl transition-all duration-300 active:scale-95
              ${checkedIn ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30" : "bg-gradient-to-br from-[#C62828] to-[#E64A19] shadow-[#C62828]/30"}`}>
            <Fingerprint size={36} className="text-white" />
            <span className="text-white text-xs font-bold">{checkedIn ? "Check-out" : "Check-in"}</span>
          </button>
          {checkInTime && <p className="text-xs text-gray-400 mt-4 font-medium">Bắt đầu ca: {checkInTime}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[{ k: "Thông tin cá nhân", v: ME.id, sub: "Hồ sơ của bạn", ic: User, bg: "bg-blue-50 text-blue-500", p: "user-profile" },
        { k: "Nghỉ phép", v: "12", sub: "Ngày phép còn lại", ic: Calendar, bg: "bg-violet-50 text-violet-500", p: "user-timeoff" },
        { k: "Công việc", v: "3", sub: "Đang thực hiện", ic: CheckSquare, bg: "bg-amber-50 text-amber-500", p: "cong-viec" },
        { k: "Thông báo", v: "2", sub: "Chưa đọc", ic: Bell, bg: "bg-rose-50 text-rose-500", p: "thong-bao" }
        ].map(i => (
          <div key={i.k} onClick={() => onNavigate(i.p as Page)} className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm cursor-pointer hover:shadow-md transition-shadow flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${i.bg}`}>
              <i.ic size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-gray-800 leading-none">{i.v}</p>
              <p className="text-sm font-semibold text-gray-600 mt-1">{i.k}</p>
              <p className="text-xs text-gray-400">{i.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}



function UserAttendance() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Lịch sử chấm công</h2>
      <div className="grid grid-cols-3 gap-4">
        {[{ l: "Đúng giờ", v: 20, c: "text-green-600 bg-green-50" }, { l: "Đi trễ", v: 2, c: "text-orange-500 bg-orange-50" }, { l: "Vắng mặt", v: 0, c: "text-red-500 bg-red-50" }].map(i => (
          <div key={i.l} className={`p-4 rounded-xl border border-black/5 ${i.c}`}>
            <p className="text-3xl font-black">{i.v}</p>
            <p className="text-sm font-bold mt-1 opacity-80">{i.l}</p>
          </div>
        ))}
      </div>
      <MonthlyAttendanceTable todayCheckIn="08:55:00" todayCheckOut="" />
    </div>
  )
}

function UserTimeOff() {
  const [reason, setReason] = useState("")
  const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40"
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Quản lý nghỉ phép (Time Off)</h2>
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
          <Calendar size={18} className="text-[#C62828]" />
          <span className="text-sm font-semibold text-gray-600">Phép năm còn lại:</span>
          <span className="text-lg font-black text-[#C62828]">12.5 ngày</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
          <h3 className="font-bold text-gray-700 mb-4">Đăng ký nghỉ phép</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">Loại nghỉ</label>
              <select className={inp}><option>Nghỉ phép năm</option><option>Nghỉ ốm</option><option>Nghỉ bù</option></select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-gray-500 mb-1.5 block">Từ ngày</label><input type="date" className={inp} /></div>
              <div><label className="text-xs font-bold text-gray-500 mb-1.5 block">Đến ngày</label><input type="date" className={inp} /></div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">Lý do</label>
              <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} className={`${inp} resize-none`} placeholder="Lý do chi tiết..."></textarea>
            </div>
            <button className="w-full bg-[#C62828] text-white py-3 rounded-xl font-bold hover:bg-[#B71C1C] transition-colors shadow-md">Gửi yêu cầu</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-700">Lịch sử nghỉ phép</h3></div>
          <div className="divide-y divide-gray-50">
            {[{ d: "20/06/2026", t: "Nghỉ ốm (1 ngày)", s: "approved" }, { d: "10/05/2026", t: "Nghỉ phép năm (2 ngày)", s: "approved" }].map((h, i) => (
              <div key={i} className="p-4 px-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div><p className="font-semibold text-gray-700 text-sm">{h.t}</p><p className="text-xs text-gray-400 mt-1">{h.d}</p></div>
                <Badge status={h.s} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function UserDirectory() {
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

function UserChat() {
  return (
    <div className="h-[calc(100vh-120px)] bg-white rounded-2xl shadow-sm border border-black/5 flex overflow-hidden">
      <div className="w-80 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100"><input placeholder="Tìm đoạn chat..." className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div>
        <div className="flex-1 overflow-y-auto">
          {["Team Frontend", "Nguyễn Văn Minh", "Phòng Hành chính"].map(t => (
            <div key={t} className="p-4 flex items-center gap-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500 font-bold">{t.charAt(0)}</div>
              <div><p className="font-semibold text-gray-700 text-sm">{t}</p><p className="text-xs text-gray-400">Tin nhắn mới...</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-gray-50/50">
        <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500 font-bold">T</div>
          <h3 className="font-bold text-gray-800">Team Frontend</h3>
        </div>
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <div className="text-center text-xs text-gray-400">Hôm nay</div>
          <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" /><div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-700">Chào buổi sáng team! ☕</div></div>
          <div className="flex gap-3 flex-row-reverse"><div className="w-8 h-8 rounded-full bg-red-200 flex-shrink-0" /><div className="bg-[#C62828] p-3 rounded-2xl rounded-tr-none shadow-sm text-sm text-white">Hello anh em!</div></div>
        </div>
        <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600"><FileImage size={20} /></button>
          <input placeholder="Nhập tin nhắn..." className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]" />
          <button className="w-10 h-10 bg-[#C62828] text-white rounded-xl flex items-center justify-center shadow-md"><MessageCircle size={18} /></button>
        </div>
      </div>
    </div>
  )
}

function UserWorkflow() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Quy trình nội bộ</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {["Mua sắm trang thiết bị", "Thanh toán công tác phí", "Đề nghị cấp quyền", "Quy trình nghỉ việc"].map((w, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-[#C62828] transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center transition-colors group-hover:bg-blue-100"><Layers size={20} /></div>
              <div><p className="font-bold text-gray-800 text-sm">{w}</p><p className="text-xs text-gray-400 mt-1">Biểu mẫu và các bước xử lý</p></div>
            </div>
            <button className="px-4 py-2 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg group-hover:bg-[#C62828] group-hover:text-white transition-colors">Tạo yêu cầu</button>
          </div>
        ))}
      </div>
    </div>
  )
}


function UserSettings({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"info" | "password" | "session">("info")
  const [curPass, setCurPass] = useState("")
  const [newPass, setNewPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [msg, setMsg] = useState("")
  const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 focus:ring-1 focus:ring-[#C62828]/10"

  const sessions = [
    { device: "Chrome / Windows", ip: "192.168.1.101", time: "Hôm nay 10:52", current: true },
    { device: "Safari / iPhone", ip: "192.168.1.55", time: "Hôm qua 18:30", current: false },
    { device: "Firefox / macOS", ip: "10.0.0.12", time: "3 ngày trước", current: false },
  ]
  const loginHistory = [
    { time: "26/06/2026 10:52", ip: "192.168.1.101", device: "Chrome / Windows", status: "success" },
    { time: "25/06/2026 08:30", ip: "192.168.1.55", device: "Safari / iPhone", status: "success" },
    { time: "24/06/2026 07:55", ip: "192.168.1.101", device: "Chrome / Windows", status: "success" },
    { time: "23/06/2026 09:10", ip: "203.0.113.5", device: "Unknown", status: "failed" },
  ]

  const handleChangePass = () => {
    if (!curPass || !newPass || !confirmPass) { setMsg("Vui lòng điền đầy đủ thông tin."); return }
    if (newPass !== confirmPass) { setMsg("Mật khẩu mới không khớp."); return }
    setMsg("✅ Đổi mật khẩu thành công!")
    setCurPass(""); setNewPass(""); setConfirmPass("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Cài đặt tài khoản</h2>
        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
          <LogOut size={15} /> Đăng xuất
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-sm">
        {([["info", "Thông tin"], ["password", "Mật khẩu"], ["session", "Phiên đăng nhập"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === k ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
            <h3 className="font-bold text-gray-700 mb-5">Ảnh đại diện</h3>
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white text-3xl font-bold shadow-md">
                {initials(ME.name)}
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  <Camera size={14} /> Tải ảnh lên
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  <Trash2 size={14} /> Xoá ảnh
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center">JPG, PNG tối đa 2MB. Tỷ lệ 1:1 tốt nhất.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 space-y-4">
            <h3 className="font-bold text-gray-700 mb-2">Thông tin tài khoản</h3>
            <div><label className="text-xs font-bold text-gray-500 mb-1.5 block">Họ và tên</label><input defaultValue={ME.name} className={inp} /></div>
            <div><label className="text-xs font-bold text-gray-500 mb-1.5 block">Email công ty</label><input defaultValue={ME.email} disabled className={`${inp} bg-gray-50 opacity-70`} /></div>
            <div><label className="text-xs font-bold text-gray-500 mb-1.5 block">Số điện thoại</label><input defaultValue={ME.phone} className={inp} /></div>
            <button className="w-full bg-[#C62828] text-white py-2.5 rounded-xl font-bold hover:bg-[#B71C1C] transition-colors text-sm shadow-sm">Cập nhật thông tin</button>
          </div>
        </div>
      )}

      {tab === "password" && (
        <div className="bg-white max-w-md rounded-2xl p-6 shadow-sm border border-black/5 space-y-4">
          <h3 className="font-bold text-gray-700 mb-2">Đổi mật khẩu</h3>
          {msg && <div className={`p-3 rounded-xl text-sm font-medium ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{msg}</div>}
          <div><label className="text-xs font-bold text-gray-500 mb-1.5 block">Mật khẩu hiện tại</label>
            <input type="password" value={curPass} onChange={e => setCurPass(e.target.value)} placeholder="••••••••" className={inp} /></div>
          <div><label className="text-xs font-bold text-gray-500 mb-1.5 block">Mật khẩu mới</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="••••••••" className={inp} /></div>
          <div><label className="text-xs font-bold text-gray-500 mb-1.5 block">Xác nhận mật khẩu mới</label>
            <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="••••••••" className={inp} /></div>
          <button onClick={handleChangePass} className="w-full bg-[#C62828] text-white py-3 rounded-xl font-bold hover:bg-[#B71C1C] transition-colors shadow-md">Đổi mật khẩu</button>
        </div>
      )}

      {tab === "session" && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Phiên đăng nhập đang hoạt động</h3>
              <button className="text-xs text-red-500 font-bold hover:underline">Đăng xuất tất cả</button>
            </div>
            <div className="divide-y divide-gray-50">
              {sessions.map((s, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Shield size={18} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{s.device}</p>
                      <p className="text-xs text-gray-400">{s.ip} · {s.time}</p>
                    </div>
                    {s.current && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Hiện tại</span>}
                  </div>
                  {!s.current && <button className="text-xs text-red-500 font-semibold hover:underline">Thu hồi</button>}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50"><h3 className="font-bold text-gray-700">Lịch sử đăng nhập</h3></div>
            <div className="divide-y divide-gray-50">
              {loginHistory.map((h, i) => (
                <div key={i} className="px-6 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{h.device}</p>
                    <p className="text-xs text-gray-400">{h.ip} · {h.time}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${h.status === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {h.status === "success" ? "Thành công" : "Thất bại"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md text-sm">
            <LogOut size={16} /> Đăng xuất khỏi hệ thống
          </button>
        </div>
      )}
    </div>
  )
}

// ─── ACCOUNT MANAGEMENT (ADMIN) ───────────────────────────────────────────────
function AccountManagement() {
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [accounts, setAccounts] = useState([
    { id: "ACC001", empId: "NV005", name: "Hoàng Thị Mai", email: "admin@dudi.vn", role: "admin" as "admin" | "user", status: "active" as "active" | "locked", lastLogin: "26/06/2026 10:52" },
    { id: "ACC002", empId: "NV001", name: "Trần Thị Bích Liên", email: "lien@dudi.vn", role: "user" as "admin" | "user", status: "active" as "active" | "locked", lastLogin: "26/06/2026 08:02" },
    { id: "ACC003", empId: "NV002", name: "Nguyễn Văn Minh", email: "minh@dudi.vn", role: "user" as "admin" | "user", status: "active" as "active" | "locked", lastLogin: "25/06/2026 08:45" },
    { id: "ACC004", empId: "NV003", name: "Lê Thu Hương", email: "huong@dudi.vn", role: "user" as "admin" | "user", status: "locked" as "active" | "locked", lastLogin: "20/06/2026 09:00" },
    { id: "ACC005", empId: "NV006", name: "Võ Minh Tuấn", email: "tuan@dudi.vn", role: "user" as "admin" | "user", status: "active" as "active" | "locked", lastLogin: "26/06/2026 08:00" },
  ])
  const [newForm, setNewForm] = useState({ empId: "", email: "", role: "user" as "admin" | "user" })

  const filtered = accounts.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.empId.toLowerCase().includes(search.toLowerCase())
  )

  const toggleLock = (id: string) => setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: a.status === "active" ? "locked" : "active" } : a))
  const resetPass = (name: string) => alert(`Đã gửi email đặt lại mật khẩu cho ${name}`)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý tài khoản</h2>
          <p className="text-sm text-gray-400 mt-0.5">Tổng {accounts.length} tài khoản · {accounts.filter(a => a.status === "active").length} đang hoạt động</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
          <Plus size={15} /> Tạo tài khoản
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/[0.06]">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tài khoản..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-gray-400 text-xs border-b border-gray-100">
                {["Nhân viên", "Email", "Quyền", "Trạng thái", "Đăng nhập cuối", "Thao tác"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(acc => (
                <tr key={acc.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white text-xs font-bold">{initials(acc.name)}</div>
                      <div>
                        <p className="font-semibold text-gray-700">{acc.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{acc.empId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs font-mono">{acc.email}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${acc.role === "admin" ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600"}`}>
                      {acc.role === "admin" ? "👑 Admin" : "🧑‍💻 Nhân viên"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${acc.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {acc.status === "active" ? "Hoạt động" : "Đã khoá"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400">{acc.lastLogin}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => resetPass(acc.name)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                        <Lock size={12} /> Reset
                      </button>
                      <button onClick={() => toggleLock(acc.id)} className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${acc.status === "active" ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-green-600 bg-green-50 hover:bg-green-100"}`}>
                        {acc.status === "active" ? <><UserX size={12} /> Khoá</> : <><UserCheck size={12} /> Mở</>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create account modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 text-lg">Tạo tài khoản mới</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">Gán nhân viên (Mã NV)</label>
                <select value={newForm.empId} onChange={e => setNewForm(p => ({ ...p, empId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40">
                  <option value="">-- Chọn nhân viên --</option>
                  {INIT_EMPLOYEES.map(e => <option key={e.id} value={e.id}>{e.id} — {e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">Email đăng nhập</label>
                <input value={newForm.email} onChange={e => setNewForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="email@dudi.vn" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">Phân quyền</label>
                <select value={newForm.role} onChange={e => setNewForm(p => ({ ...p, role: e.target.value as "admin" | "user" }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40">
                  <option value="user">🧑‍💻 Nhân viên</option>
                  <option value="admin">👑 Quản trị viên</option>
                </select>
              </div>
              <p className="text-xs text-gray-400">Mật khẩu mặc định sẽ được gửi về email. Nhân viên cần đổi mật khẩu khi đăng nhập lần đầu.</p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Huỷ</button>
                <button onClick={() => { alert("Tài khoản đã được tạo và gửi email!"); setShowModal(false) }}
                  className="flex-1 py-2.5 bg-[#C62828] text-white rounded-xl text-sm font-bold hover:bg-[#B71C1C]">Tạo tài khoản</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ORG STRUCTURE WRAPPER ───────────────────────────────────────────────────
function OrgChart({ employees, setEmployees }: { employees: Employee[], setEmployees: React.Dispatch<React.SetStateAction<Employee[]>> }) {
  const [orgNodes, setOrgNodes] = useState<OrgNode[]>(INIT_ORG_NODES)
  const [assignments, setAssignments] = useState<Assignment[]>(INIT_ASSIGNMENTS)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  return (
    <OrgStructure
      employees={employees}
      setEmployees={setEmployees}
      orgNodes={orgNodes}
      setOrgNodes={setOrgNodes}
      assignments={assignments}
      setAssignments={setAssignments}
      selectedNodeId={selectedNodeId}
      setSelectedNodeId={setSelectedNodeId}
    />
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [role, setRole] = useState<Role>("admin")
  const [loggedEmail, setLoggedEmail] = useState("")
  const [activePage, setActivePage] = useState<Page>("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [employees, setEmployees] = useState(INIT_EMPLOYEES)

  const handleLogin = (email: string) => {
    const r: Role = email.toLowerCase().includes("admin") ? "admin" : "user"
    setRole(r)
    setLoggedEmail(email)
    setIsLoggedIn(true)
    setActivePage("dashboard")
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setRole("admin")
    setLoggedEmail("")
    setActivePage("dashboard")
  }

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />

  // ─── USER PORTAL: completely separate layout (no sidebar) ───
  if (role === "user") {
    return <UserPortalApp onLogout={handleLogout} />
  }

  // Current user data based on role
  const currentEmp = (role as string) === "user" ? ME : INIT_EMPLOYEES[4] // Hoàng Thị Mai as admin
  const adminUser = { name: "Hoàng Thị Mai", id: "0000000005", role: "admin" as Role, position: "HR Manager", department: "HR" }
  const currentUserInfo = role === "admin" ? adminUser : { name: ME.name, id: ME.id, role: "user" as Role, position: ME.position, department: ME.department }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return (role as string) === "user" ? <UserHome onNavigate={setActivePage} /> : <Dashboard onNavigate={setActivePage} />
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
      case "cong-viec": return <TaskManagement />
      case "thong-bao": return <NotificationManagement />
      case "nhan-su": return <EmployeeManagement employees={employees} setEmployees={setEmployees} />
      case "co-cau": return <OrgChart employees={employees} setEmployees={setEmployees} />
      case "cham-cong": return <AttendanceManagement />
      case "thong-ke": return <Statistics />
      case "duyet-don": return <ApprovalManagement />
      case "tai-khoan": return <AccountManagement />
      case "ip": return <IPManagement />
      case "tien-ich": return (
        <PlaceholderPage title="Tiện ích" desc="Các công cụ hỗ trợ vận hành hệ thống và quản lý dữ liệu chấm công." icon={Wrench}
          items={["Quản lý admin", "Điều chỉnh chấm công", "BXH gắn bó", "Sinh mã nhân viên"]} />
      )
      default: return (role as string) === "user" ? <UserHome onNavigate={setActivePage} /> : <Dashboard onNavigate={setActivePage} />
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
        />
        <main className="flex-1 overflow-y-auto p-5"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e7eb transparent" }}>
          {renderPage()}
        </main>
      </div>
    </div>
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

        {role === "admin" ? (
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
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={18} />
          {!collapsed && <span className="font-medium">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  )
}
