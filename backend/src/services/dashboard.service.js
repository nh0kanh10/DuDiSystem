import { getAll as getEmployees } from "../repositories/employee.repository.js"
import { getAll as getAttendance } from "../repositories/attendance.repository.js"
import { getAll as getRequests } from "../repositories/request.repository.js"
import { getAll as getNotifications } from "../repositories/notification.repository.js"

export function getDashboardStats() {
  const employees = getEmployees()
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
  const todayAtt = getAttendance({ date: today })
  const pendingReqs = getRequests({ status: "pending" })
  const unreadNotifs = getNotifications({ read: false })

  return {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.status === "active").length,
    internEmployees: employees.filter(e => e.contractType === "intern").length,
    attendance: {
      onTime: todayAtt.filter(r => r.status === "on-time").length,
      late: todayAtt.filter(r => r.status === "late" || r.status === "late_early" || r.status === "early").length,
      absent: todayAtt.filter(r => r.status === "absent").length,
      leave: todayAtt.filter(r => r.status === "leave").length
    },
    pendingRequests: pendingReqs.length,
    unreadNotifications: unreadNotifs.length
  }
}
