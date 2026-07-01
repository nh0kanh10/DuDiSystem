import { Employee, OrgNode, Assignment, AttendanceRecord, LeaveRequest, TaskItem, TimeOffSlot } from "./types"

export const avatarImg = `https://ui-avatars.com/api/?name=T&background=C62828&color=fff&bold=true`

export const INIT_EMPLOYEES: Employee[] = [
  { id: "0000000001", name: "Trần Thị Bích Liên", email: "lien.tran@dudi.vn", phone: "0901 234 567", department: "Frontend", position: "Senior Developer", joinDate: "28/05/2026", status: "active", contractType: "Chính thức" },
  { id: "0000000002", name: "Nguyễn Văn Minh", email: "minh.nguyen@dudi.vn", phone: "0912 345 678", department: "Backend", position: "Lead Developer", joinDate: "12/03/2024", status: "active", contractType: "Chính thức" },
  { id: "0000000003", name: "Lê Thu Hương", email: "huong.le@dudi.vn", phone: "0923 456 789", department: "Design", position: "UI/UX Designer", joinDate: "15/08/2023", status: "active", contractType: "Chính thức" },
  { id: "0000000004", name: "Phạm Đức Thành", email: "thanh.pham@dudi.vn", phone: "0934 567 890", department: "PM", position: "Project Manager", joinDate: "28/01/2025", status: "active", contractType: "Chính thức" },
  { id: "0000000005", name: "Hoàng Thị Mai", email: "admin@dudi.vn", phone: "0945 678 901", department: "HR", position: "HR Manager", joinDate: "12/09/2024", status: "active", contractType: "Chính thức" },
  { id: "0000000006", name: "Võ Minh Tuấn", email: "tuan.vo@dudi.vn", phone: "0956 789 012", department: "Backend", position: "Developer", joinDate: "01/06/2025", status: "intern", contractType: "Thực tập" },
  { id: "0000000007", name: "Đinh Thị Lan Anh", email: "lanh.dinh@dudi.vn", phone: "0967 890 123", department: "Frontend", position: "Developer", joinDate: "15/07/2025", status: "intern", contractType: "Thực tập" },
  { id: "0000000008", name: "Bùi Văn Hùng", email: "hung.bui@dudi.vn", phone: "0978 901 234", department: "DevOps", position: "DevOps Engineer", joinDate: "20/11/2024", status: "inactive", contractType: "Chính thức" },
]

export const INIT_ORG_NODES: OrgNode[] = [
  { id: "branch-hcm", name: "Chi nhánh Hồ Chí Minh", code: "HCM01", type: "branch", memberCount: 150, status: "active", managerId: "0000000005", managerTitle: "Giám đốc chi nhánh" },
  { id: "branch-hn", name: "Chi nhánh Hà Nội", code: "HN01", type: "branch", memberCount: 100, status: "active", managerId: "0000000002", managerTitle: "Giám đốc chi nhánh HN" },
  { id: "branch-dn", name: "Chi nhánh Đà Nẵng", code: "DN01", type: "branch", memberCount: 50, status: "active", managerId: "0000000003", managerTitle: "Giám đốc chi nhánh DN" },
  { id: "dept-tech", name: "Phòng Công nghệ", code: "TECH01", type: "department", parentId: "branch-hcm", memberCount: 80, status: "active", managerId: "0000000002", managerTitle: "Trưởng phòng Công nghệ" },
  { id: "sub-dev", name: "Bộ phận Phát triển phần mềm", code: "DEV01", type: "sub-department", parentId: "dept-tech", memberCount: 50, status: "active", managerId: "0000000004", managerTitle: "Trưởng bộ phận Dev" },
  { id: "pos-lead", name: "Lead Developer", code: "LDEV01", type: "position", parentId: "sub-dev", memberCount: 10, status: "active", managerId: "0000000002", managerTitle: "Lead Developer" },
  { id: "team-fe", name: "Nhóm Frontend", code: "FE01", type: "team", parentId: "pos-lead", memberCount: 15, status: "active", managerId: "0000000001", managerTitle: "Trưởng nhóm Frontend" },
  { id: "dept-finance", name: "Phòng Tài chính", code: "FIN01", type: "department", parentId: "branch-hn", memberCount: 20, status: "active", managerId: "0000000005", managerTitle: "Trưởng phòng Tài chính" },
  { id: "dept-sales", name: "Phòng Kinh doanh", code: "SALE01", type: "department", parentId: "branch-dn", memberCount: 35, status: "active", managerId: "0000000003", managerTitle: "Trưởng phòng Kinh doanh" },
  { id: "dept-hr", name: "Phòng Nhân sự", code: "HR01", type: "department", parentId: "branch-hcm", memberCount: 15, status: "active", managerId: "0000000005", managerTitle: "Trưởng phòng Nhân sự" }
]

export const INIT_ASSIGNMENTS: Assignment[] = [
  { id: "as-1", employeeId: "0000000001", nodeId: "team-fe", type: "permanent", startDate: "2026-05-28", status: "active" },
  { id: "as-2", employeeId: "0000000002", nodeId: "dept-tech", type: "permanent", startDate: "2024-03-12", status: "active" },
  { id: "as-3", employeeId: "0000000003", nodeId: "dept-sales", type: "permanent", startDate: "2023-08-15", status: "active" },
  { id: "as-4", employeeId: "0000000004", nodeId: "sub-dev", type: "permanent", startDate: "2025-01-28", status: "active" },
  { id: "as-5", employeeId: "0000000005", nodeId: "dept-hr", type: "permanent", startDate: "2024-09-12", status: "active" }
]

export const ATTENDANCE: AttendanceRecord[] = [
  { id: "1", employeeId: "0000000001", employeeName: "Trần Thị Bích Liên", department: "Frontend", checkIn: "08:02", checkOut: "17:35", date: "2026-06-25", status: "on-time", note: "" },
  { id: "2", employeeId: "0000000002", employeeName: "Nguyễn Văn Minh", department: "Backend", checkIn: "08:45", checkOut: "18:10", date: "2026-06-25", status: "late", note: "Kẹt xe" },
  { id: "3", employeeId: "0000000003", employeeName: "Lê Thu Hương", department: "Design", checkIn: "07:55", checkOut: "17:00", date: "2026-06-25", status: "on-time", note: "" },
  { id: "4", employeeId: "0000000004", employeeName: "Phạm Đức Thành", department: "PM", checkIn: "--", checkOut: "--", date: "2026-06-25", status: "leave", note: "Nghỉ phép" },
  { id: "5", employeeId: "0000000005", employeeName: "Hoàng Thị Mai", department: "HR", checkIn: "09:15", checkOut: "18:30", date: "2026-06-25", status: "late", note: "Họp ngoài" },
  { id: "6", employeeId: "0000000006", employeeName: "Võ Minh Tuấn", department: "Backend", checkIn: "08:00", checkOut: "17:00", date: "2026-06-25", status: "on-time", note: "" },
  { id: "7", employeeId: "0000000007", employeeName: "Đinh Thị Lan Anh", department: "Frontend", checkIn: "--", checkOut: "--", date: "2026-06-25", status: "absent", note: "" },
  { id: "8", employeeId: "0000000008", employeeName: "Bùi Văn Hùng", department: "DevOps", checkIn: "08:10", checkOut: "17:20", date: "2026-06-25", status: "on-time", note: "" },
]

export const INIT_REQUESTS = [
  { id: "XN00001", employeeName: "Nguyễn Văn Minh", department: "Backend", category: "leave" as const, startDate: "28/06/2026", endDate: "30/06/2026", session: "all" as const, reason: "Du lịch gia đình", status: "pending" as const, submittedAt: "24/06/2026" },
  { id: "XN00002", employeeName: "Lê Thu Hương", department: "Design", category: "leave" as const, startDate: "26/06/2026", endDate: "26/06/2026", session: "all" as const, reason: "Sức khỏe không tốt", status: "pending" as const, submittedAt: "25/06/2026" },
  { id: "XN00003", employeeName: "Võ Minh Tuấn", department: "Backend", category: "leave" as const, startDate: "04/07/2026", endDate: "05/07/2026", session: "all" as const, reason: "Việc cá nhân", status: "pending" as const, submittedAt: "23/06/2026" },
  { id: "XN00004", employeeName: "Hoàng Thị Mai", department: "HR", category: "leave" as const, startDate: "10/07/2026", endDate: "12/07/2026", session: "all" as const, reason: "Kết hôn", status: "approved" as const, submittedAt: "20/06/2026" },
  { id: "XN00005", employeeName: "Đinh Thị Lan Anh", department: "Frontend", category: "leave" as const, startDate: "27/06/2026", endDate: "27/06/2026", session: "all" as const, reason: "Việc cá nhân", status: "rejected" as const, submittedAt: "22/06/2026" },
  { id: "TO00001", employeeName: "Trần Thị Bích Liên", department: "Frontend", category: "timeoff" as const, startDate: "02/07/2026", endDate: "02/07/2026", session: "all" as const, reason: "Bù 8h tăng ca tháng 5", status: "pending" as const, submittedAt: "25/06/2026" },
  { id: "TO00002", employeeName: "Phạm Đức Thành", department: "PM", category: "timeoff" as const, startDate: "07/07/2026", endDate: "08/07/2026", session: "all" as const, reason: "Ngày nghỉ bổ sung quý 2", status: "pending" as const, submittedAt: "23/06/2026" },
  { id: "TO00003", employeeName: "Bùi Văn Hùng", department: "DevOps", category: "timeoff" as const, startDate: "30/06/2026", endDate: "30/06/2026", session: "all" as const, reason: "Bù 4h cuối tuần trực hệ thống", status: "approved" as const, submittedAt: "21/06/2026" },
]

export const TIMEOFF_SLOTS: TimeOffSlot[] = [
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

export const INIT_TASKS: TaskItem[] = [
  { id: "T1", title: "Redesign dashboard UI", assignee: "Lê Thu Hương", dueDate: "30/06/2026", priority: "high", status: "in-progress" },
  { id: "T2", title: "Fix attendance API bug", assignee: "Nguyễn Văn Minh", dueDate: "26/06/2026", priority: "high", status: "todo" },
  { id: "T3", title: "Tài liệu onboarding nhân viên mới", assignee: "Hoàng Thị Mai", dueDate: "01/07/2026", priority: "medium", status: "todo" },
  { id: "T4", title: "Review code module Nhân sự", assignee: "Phạm Đức Thành", dueDate: "28/06/2026", priority: "medium", status: "in-progress" },
  { id: "T5", title: "Setup CI/CD pipeline", assignee: "Bùi Văn Hùng", dueDate: "27/06/2026", priority: "high", status: "done" },
  { id: "T6", title: "Báo cáo tháng 6", assignee: "Hoàng Thị Mai", dueDate: "05/07/2026", priority: "low", status: "todo" },
]

export const NOTIFICATIONS = [
  { id: 1, type: "birthday", message: "Sinh nhật Nguyễn Văn Minh hôm nay 🎂", time: "08:00", read: false },
  { id: 2, type: "request", message: "Lê Thu Hương gửi đơn xin nghỉ ốm chờ duyệt", time: "07:45", read: false },
  { id: 3, type: "intern", message: "Võ Minh Tuấn kết thúc thực tập vào 30/07/2026", time: "30/07/2026", read: true },
  { id: 4, type: "request", message: "Nguyễn Văn Minh xin nghỉ phép 3 ngày (28-30/6)", time: "Hôm qua", read: true },
  { id: 5, type: "system", message: "Hệ thống cập nhật lên phiên bản v2.1.0 thành công", time: "2 ngày trước", read: true },
]

export const WEEKLY_STATS = [
  { day: "T2", "Đúng giờ": 20, "Đi trễ": 5, "Vắng mặt": 3 },
  { day: "T3", "Đúng giờ": 22, "Đi trễ": 3, "Vắng mặt": 3 },
  { day: "T4", "Đúng giờ": 19, "Đi trễ": 6, "Vắng mặt": 3 },
  { day: "T5", "Đúng giờ": 21, "Đi trễ": 4, "Vắng mặt": 3 },
  { day: "T6", "Đúng giờ": 23, "Đi trễ": 3, "Vắng mặt": 2 },
  { day: "T7", "Đúng giờ": 15, "Đi trễ": 2, "Vắng mặt": 1 },
]

export const MONTHLY_STATS = [
  { month: "T1", "Đúng giờ": 180, "Đi trễ": 40, "Vắng mặt": 20 },
  { month: "T2", "Đúng giờ": 170, "Đi trễ": 35, "Vắng mặt": 25 },
  { month: "T3", "Đúng giờ": 185, "Đi trễ": 30, "Vắng mặt": 15 },
  { month: "T4", "Đúng giờ": 175, "Đi trễ": 45, "Vắng mặt": 20 },
  { month: "T5", "Đúng giờ": 190, "Đi trễ": 28, "Vắng mặt": 18 },
  { month: "T6", "Đúng giờ": 165, "Đi trễ": 38, "Vắng mặt": 22 },
]

export const PIE_DATA = [
  { name: "Đúng giờ", value: 22, color: "#16A34A" },
  { name: "Đi trễ", value: 10, color: "#EA580C" },
  { name: "Vắng mặt", value: 5, color: "#DC2626" },
  { name: "Nghỉ phép", value: 5, color: "#7C3AED" },
]

export const VIOLATIONS = [
  { name: "Võ Minh Tuấn", count: 8 },
  { name: "Đinh Thị Lan Anh", count: 6 },
  { name: "Nguyễn Văn Minh", count: 5 },
  { name: "Hoàng Thị Mai", count: 4 },
  { name: "Trần Thị Bích Liên", count: 2 },
]

export const STATUS_LABEL: Record<string, string> = {
  active: "Đang làm", inactive: "Nghỉ việc", intern: "Thực tập",
  "on-time": "Đúng giờ", late: "Đi trễ", absent: "Vắng mặt", leave: "Nghỉ phép",
  pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối",
  high: "Cao", medium: "Trung bình", low: "Thấp",
  todo: "Chưa làm", "in-progress": "Đang làm", done: "Đã xong",
}

export const STATUS_COLOR: Record<string, string> = {
  active: "bg-green-100 text-green-700", inactive: "bg-gray-100 text-gray-500", intern: "bg-purple-100 text-purple-700",
  "on-time": "bg-green-100 text-green-700", late: "bg-orange-100 text-orange-700", absent: "bg-red-100 text-red-700", leave: "bg-violet-100 text-violet-700",
  pending: "bg-amber-100 text-amber-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700",
  high: "bg-red-100 text-red-700", medium: "bg-amber-100 text-amber-700", low: "bg-blue-100 text-blue-600",
  todo: "bg-gray-100 text-gray-500", "in-progress": "bg-orange-100 text-orange-700", done: "bg-green-100 text-green-700",
}
