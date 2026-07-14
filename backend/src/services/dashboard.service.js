import { getAll as getEmployees } from "../repositories/employee.repository.js"
import { listAttendance } from "./attendance.service.js"
import { getAll as getRequests } from "../repositories/request.repository.js"
import { getAll as getNotifications } from "../repositories/notification.repository.js"

export function getDashboardStats() {
  let employees = getEmployees()
  employees = employees.filter(e => !["0000000000", "1111111111", "2222222222"].includes(e.id))
  
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
  const todayRecords = listAttendance({ date: today })
  const pendingReqs = getRequests({ status: "pending" })
  const unreadNotifs = getNotifications({ read: false })

  const staff = { onTime: 0, late: 0, absent: 0, leave: 0 }
  const intern = { onTime: 0, late: 0, absent: 0, leave: 0 }

  todayRecords.forEach(r => {
    const emp = employees.find(e => e.id === r.employeeId)
    const isIntern = emp
      ? (emp.contractType === "intern" || emp.contractType === "Thực tập")
      : r.employeeStatus === "intern"

    if (isIntern) {
      const amS = r.statusAm || "absent"
      const pmS = r.statusPm || "absent"
      const hasLate = ["late", "early", "late_early"].includes(amS) || ["late", "early", "late_early"].includes(pmS)
      const hasOnTime = amS === "on-time" || pmS === "on-time"
      const allAbsent = amS === "absent" && pmS === "absent"
      const allLeave = amS === "leave" && pmS === "leave"

      if (allLeave) intern.leave++
      else if (allAbsent) intern.absent++
      else if (hasLate) intern.late++
      else if (hasOnTime) intern.onTime++
      else intern.absent++
    } else {
      if (r.status === "on-time") staff.onTime++
      else if (r.status === "late" || r.status === "early" || r.status === "late_early") staff.late++
      else if (r.status === "absent") staff.absent++
      else if (r.status === "leave") staff.leave++
    }
  })

  return {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.status === "active").length,
    resignedEmployees: employees.filter(e => e.status === "inactive" || e.status === "suspended").length,
    internEmployees: employees.filter(e => e.contractType === "intern" || e.contractType === "Thực tập").length,
    attendance: {
      staff,
      intern
    },
    pendingRequests: pendingReqs.length,
    unreadNotifications: unreadNotifs.length
  }
}
