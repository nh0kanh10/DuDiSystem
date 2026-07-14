// ─── SHARED TYPES FOR USER PORTAL ────────────────────────────────────────────

export type UserPage =
    | "dashboard"
    | "user-profile"
    | "user-attendance"
    | "user-timeoff"
    | "user-tasks"
    | "user-settings"
    | "user-chat"

export interface Employee {
    id: string
    name: string
    email: string
    phone: string
    department: string
    position: string
    joinDate: string
    status: "active" | "inactive" | "suspended"
    contractType: string
}

function readStoredUser() {
    try {
        const raw = localStorage.getItem("dudi_user")
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

export function getStoredUser(): Employee {
    const u = readStoredUser()
    return {
        id: u?.employeeId || u?.id || "--",
        name: u?.name || "Người dùng",
        email: u?.email || "",
        phone: u?.phone || "",
        department: u?.department || "",
        position: u?.position || u?.roleName || "",
        joinDate: u?.joinDate || "",
        status: u?.employeeStatus || u?.status || "active",
        contractType: u?.contractType || "",
    }
}

export const ME: Employee = {
    id: "NV001",
    name: "Trần Thị Bích Liên",
    email: "lien.tran@dudi.vn",
    phone: "0901 234 567",
    department: "Frontend",
    position: "Senior Developer",
    joinDate: "28/05/2026",
    status: "active",
    contractType: "staff",
}

export const ALL_EMPLOYEES: Employee[] = [
    ME,
    { id: "NV002", name: "Nguyễn Văn Minh", email: "minh.nguyen@dudi.vn", phone: "0912 345 678", department: "Backend", position: "Lead Developer", joinDate: "12/03/2024", status: "active", contractType: "staff" },
    { id: "NV003", name: "Lê Thu Hương", email: "huong.le@dudi.vn", phone: "0923 456 789", department: "Design", position: "UI/UX Designer", joinDate: "15/08/2023", status: "active", contractType: "staff" },
    { id: "NV004", name: "Phạm Đức Thành", email: "thanh.pham@dudi.vn", phone: "0934 567 890", department: "PM", position: "Project Manager", joinDate: "28/01/2025", status: "active", contractType: "staff" },
    { id: "NV005", name: "Hoàng Thị Mai", email: "mai.hoang@dudi.vn", phone: "0945 678 901", department: "HR", position: "HR Manager", joinDate: "12/09/2024", status: "active", contractType: "staff" },
    { id: "NV006", name: "Võ Minh Tuấn", email: "tuan.vo@dudi.vn", phone: "0956 789 012", department: "Backend", position: "Developer", joinDate: "01/06/2025", status: "active", contractType: "intern" },
    { id: "NV007", name: "Đinh Thị Lan Anh", email: "lanh.dinh@dudi.vn", phone: "0967 890 123", department: "Frontend", position: "Developer", joinDate: "15/07/2025", status: "active", contractType: "intern" },
    { id: "NV008", name: "Bùi Văn Hùng", email: "hung.bui@dudi.vn", phone: "0978 901 234", department: "DevOps", position: "DevOps Engineer", joinDate: "20/11/2024", status: "inactive", contractType: "staff" },
]
