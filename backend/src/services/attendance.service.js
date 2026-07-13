import * as repo from "../repositories/attendance.repository.js"
import * as empRepo from "../repositories/employee.repository.js"
import * as requestRepo from "../repositories/request.repository.js"
import * as allowedIPRepo from "../repositories/allowedIP.repository.js"
import { getSystemConfig } from "./systemConfig.service.js"
import { isAdminUser } from "../utils/access.js"
import { getApprovedLeaveForDate } from "../utils/leaveRequestSlots.js"

function parseVnDate(str) {
  if (!str) return null
  const parts = str.split("/")
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map(Number)
  if ([d, m, y].some(Number.isNaN)) return null
  return new Date(y, m - 1, d)
}

function isInternContractType(contractType) {
  if (!contractType) return false
  const t = String(contractType).trim().toLowerCase()
  return t === "intern" || t === "thực tập" || t.startsWith("thực tập") || t === "thuc tap"
}

function getContractTypeForDate(emp, dateStr) {
  if (!emp) return "staff"
  if (!emp.contractHistory || emp.contractHistory.length === 0) {
    return emp.contractType || "staff"
  }
  
  const dateParts = dateStr.split("-").map(Number)
  const targetDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
  targetDate.setHours(0, 0, 0, 0)
  
  for (const item of emp.contractHistory) {
    const start = parseVnDate(item.startDate)
    if (!start) continue
    start.setHours(0, 0, 0, 0)
    
    if (item.endDate) {
      const end = parseVnDate(item.endDate)
      if (end) {
        end.setHours(23, 59, 59, 999)
        if (targetDate >= start && targetDate <= end) {
          return item.contractType
        }
      }
    } else {
      if (targetDate >= start) {
        return item.contractType
      }
    }
  }
  
  return emp.contractType || "staff"
}

export function validateClientIP(employeeId, clientIP, reqUser) {
  const config = getSystemConfig()
  if (!config.requireIP) return { valid: true }

  const isSuperAdmin = reqUser && (
    reqUser.roleId === "role-super-admin" ||
    ["0000000000", "1111111111", "2222222222"].includes(reqUser.employeeId || reqUser.id)
  );
  if (isSuperAdmin) {
    return { valid: true }
  }

  const employee = empRepo.getById(employeeId)
  if (!employee) {
    return { valid: false, error: "Không tìm thấy thông tin nhân viên" }
  }

  const activeIPs = allowedIPRepo.getAll({ status: "active" })
  if (activeIPs.length === 0) return { valid: true } 

  const employeeBranchId = employee.branchId
  const cleanClientIp = (clientIP || "").replace("::ffff:", "").trim()

  if (cleanClientIp === "127.0.0.1" || cleanClientIp === "::1" || cleanClientIp === "localhost") {
    const hasLocalConfig = activeIPs.some(item => {
      const cleanItemIp = item.ip.replace("::ffff:", "").trim()
      return cleanItemIp === "127.0.0.1" || cleanItemIp === "::1" || cleanItemIp === "localhost"
    })
    if (!hasLocalConfig) {
      return {
        valid: false,
        error: "Không xác định được IP mạng thực tế (đang nhận localhost). Vui lòng kiểm tra lại kết nối mạng hoặc gửi IP public từ client.",
      }
    }
  }

  const isMatched = activeIPs.some(item => {
    const cleanItemIp = item.ip.replace("::ffff:", "").trim()
    const ipMatches = cleanItemIp === cleanClientIp
    const branchMatches = !item.orgNodeId || item.orgNodeId === "all" || item.orgNodeId === employeeBranchId
    return ipMatches && branchMatches
  })

  if (!isMatched) {
    return {
      valid: false,
      error: "Sai mạng Wifi! Bạn vui lòng kết nối đúng Wifi của công ty để chấm công."
    }
  }

  return { valid: true }
}
function parseToSeconds(timeStr) {
  if (!timeStr || timeStr === "--" || !timeStr.includes(":")) return -1
  const parts = timeStr.split(":").map(Number)
  const h = parts[0]
  const m = parts[1]
  const s = parts[2] || 0
  return h * 3600 + m * 60 + s
}

function formatDiffTimeShort(diffSec) {
  const mins = Math.floor(diffSec / 60)
  const secs = diffSec % 60
  if (mins > 0 && secs > 0) {
    return `${mins}p${secs}s`
  } else if (mins > 0) {
    return `${mins}p`
  } else {
    return `${secs}s`
  }
}

function formatDiffTime(diffSec) {
  const mins = Math.floor(diffSec / 60)
  const secs = diffSec % 60
  if (mins > 0 && secs > 0) {
    return `${mins} phút ${secs} giây`
  } else if (mins > 0) {
    return `${mins} phút`
  } else {
    return `${secs} giây`
  }
}

export function calcOverlap(inSec, outSec, startSec, endSec) {
  if (inSec === -1 || outSec === -1 || outSec <= inSec) return 0
  const maxStart = Math.max(inSec, startSec)
  const minEnd = Math.min(outSec, endSec)
  return maxStart < minEnd ? minEnd - maxStart : 0
}

export function calcStaffWorkingHours(checkIn, checkOut, config) {
  if (!checkIn || !checkOut || checkIn === "--" || checkOut === "--") return "--"
  const inSec = parseToSeconds(checkIn)
  const outSec = parseToSeconds(checkOut)
  if (outSec === -1 || inSec === -1 || outSec <= inSec) return "--"

  let diffSec = outSec - inSec

  const noonStartSec = parseToSeconds(config?.morningEnd || "12:00")
  const noonEndSec = parseToSeconds(config?.afternoonStart || "13:30")
  const overlapSec = calcOverlap(inSec, outSec, noonStartSec, noonEndSec)
  diffSec -= overlapSec

  if (diffSec <= 0) return "--"

  const h = Math.floor(diffSec / 3600)
  const m = Math.floor((diffSec % 3600) / 60)
  const s = diffSec % 60

  let res = ""
  if (h > 0) res += `${h}g`
  if (m > 0) res += `${m}p`
  if (s > 0) res += `${s}s`
  return res || "0s"
}

export function calculateStaffAttendanceStatus(checkIn, checkOut, config, date) {
  if (!checkIn || checkIn === "--") {
    return { status: "absent", note: "Vắng" }
  }

  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
  const isPastDate = date && date < todayStr
  const suffix = isPastDate ? "quên check-out" : "chưa check-out"

  if (!checkOut || checkOut === "--") {
    const inSec = parseToSeconds(checkIn)
    const staffStartSec = parseToSeconds(config?.employeeStart || "09:00")
    if (inSec !== -1 && inSec > staffStartSec) {
      const diffSec = inSec - staffStartSec
      return { status: "late", note: `Đi trễ ${formatDiffTimeShort(diffSec)}, ${suffix}` }
    }
    return { status: "on-time", note: isPastDate ? "Quên check-out" : "Chưa check-out" }
  }

  const inSec = parseToSeconds(checkIn)
  const outSec = parseToSeconds(checkOut)
  if (outSec === -1 || inSec === -1 || outSec <= inSec) {
    return { status: "absent", note: "Dữ liệu lỗi" }
  }

  const staffStartSec = parseToSeconds(config?.employeeStart || "09:00")
  const staffEndSec = parseToSeconds(config?.employeeEnd || "17:00")

  let isLate = false
  let isEarly = false
  let noteParts = []

  if (inSec > staffStartSec) {
    isLate = true
    const diffSec = inSec - staffStartSec
    noteParts.push(`Đi trễ ${formatDiffTimeShort(diffSec)}`)
  }

  if (outSec < staffEndSec) {
    isEarly = true
    const diffSec = staffEndSec - outSec
    noteParts.push(`Về sớm ${formatDiffTimeShort(diffSec)}`)
  }

  let status = "on-time"
  if (isLate && isEarly) status = "late_early"
  else if (isLate) status = "late"
  else if (isEarly) status = "early"

  return {
    status,
    note: noteParts.length > 0 ? noteParts.join(", ") : "Đúng giờ"
  }
}

const WORK_STATUSES = new Set(["on-time", "late", "early", "late_early"])
const STATUS_PRIORITY = ["late_early", "late", "early", "on-time"]

export function deriveInternDayStatus(statusAm, statusPm) {
  if (!statusAm && !statusPm) return ""
  const am = statusAm || "absent"
  const pm = statusPm || "absent"

  if (am === "leave" && pm === "leave") return "leave"
  if (am === "absent" && pm === "absent") return "absent"

  const amWorked = WORK_STATUSES.has(am)
  const pmWorked = WORK_STATUSES.has(pm)

  if (amWorked && pmWorked) {
    for (const s of STATUS_PRIORITY) {
      if (am === s || pm === s) return s
    }
    return "on-time"
  }

  if (amWorked) return am
  if (pmWorked) return pm

  if (am === "leave" || pm === "leave") return "leave"
  return "absent"
}

export function buildInternDayNote(statusAm, statusPm, noteAm, notePm) {
  const parts = []

  const push = (status, note, absentFallback, leaveFallback) => {
    if (status === "leave") {
      parts.push(note || leaveFallback)
    } else if (status === "absent") {
      parts.push(note || absentFallback)
    } else if (note && note !== "Đúng giờ") {
      parts.push(note)
    }
  }

  push(statusAm || "absent", noteAm, "Vắng sáng", "Nghỉ phép sáng")
  push(statusPm || "absent", notePm, "Vắng chiều", "Nghỉ phép chiều")

  if (parts.length === 0) {
    const am = statusAm || "absent"
    const pm = statusPm || "absent"
    if (WORK_STATUSES.has(am) && WORK_STATUSES.has(pm)) return "Đúng giờ"
    return ""
  }

  return parts.join(" · ")
}

export function calculateSessionStatus(checkIn, checkOut, session, config) {
  if (!checkIn || checkIn === "--") {
    return { status: "absent", note: "" }
  }

  const inSec = parseToSeconds(checkIn)
  const outSec = parseToSeconds(checkOut)

  let isLate = false
  let isEarly = false
  let noteParts = []

  if (session === "morning") {
    const morningStartSec = parseToSeconds(config?.morningStart || "09:00")
    const morningEndSec = parseToSeconds(config?.morningEnd || "12:00")
    
    if (inSec !== -1 && inSec > morningStartSec) {
      isLate = true
      const diffSec = inSec - morningStartSec
      noteParts.push(`Đi trễ sáng ${formatDiffTimeShort(diffSec)}`)
    }
    if (outSec !== -1 && outSec < morningEndSec) {
      isEarly = true
      const diffSec = morningEndSec - outSec
      noteParts.push(`Về sớm sáng ${formatDiffTimeShort(diffSec)}`)
    }
  } else {
    const afternoonStartSec = parseToSeconds(config?.afternoonStart || "13:30")
    const afternoonEndSec = parseToSeconds(config?.afternoonEnd || "17:00")
    
    if (inSec !== -1 && inSec > afternoonStartSec) {
      isLate = true
      const diffSec = inSec - afternoonStartSec
      noteParts.push(`Đi trễ chiều ${formatDiffTimeShort(diffSec)}`)
    }
    if (outSec !== -1 && outSec < afternoonEndSec) {
      isEarly = true
      const diffSec = afternoonEndSec - outSec
      noteParts.push(`Về sớm chiều ${formatDiffTimeShort(diffSec)}`)
    }
  }

  if (isLate && isEarly) {
    return { status: "late_early", note: noteParts.join(", ") }
  }
  if (isLate) {
    return { status: "late", note: noteParts.join(", ") }
  }
  if (isEarly) {
    return { status: "early", note: noteParts.join(", ") }
  }
  return { status: "on-time", note: "" }
}

function calcSecondsDiff(ci, co) {
  if (!ci || !co || ci === "--" || co === "--") return 0
  const inSec = parseToSeconds(ci)
  const outSec = parseToSeconds(co)
  return outSec > inSec ? outSec - inSec : 0
}

export function calcInternWorkingHours(inAm, outAm, inPm, outPm) {
  const amSec = calcSecondsDiff(inAm, outAm)
  const pmSec = calcSecondsDiff(inPm, outPm)
  const totalSec = amSec + pmSec
  if (totalSec <= 0) return "--"
  
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  
  let res = ""
  if (h > 0) res += `${h}g`
  if (m > 0) res += `${m}p`
  if (s > 0) res += `${s}s`
  return res || "0s"
}

function isoToRequestDate(isoStr) {
  if (!isoStr) return ""
  const [y, m, d] = isoStr.split("-")
  return `${d}/${m}/${y}`
}

function withEmployee(record) {
  const emp = empRepo.getById(record.employeeId)
  const sysConfig = getSystemConfig()

  const isIntern = isInternContractType(getContractTypeForDate(emp, record.date))

  const checkIn = record.checkIn ?? "--"
  const checkOut = record.checkOut ?? "--"

  const reqDate = isoToRequestDate(record.date)
  const allEmployeeRequests = requestRepo.getAll({ employeeId: record.employeeId })
  const leaveForDate = getApprovedLeaveForDate(record.employeeId, reqDate, allEmployeeRequests)

  if (!isIntern) {
    let status = record.status ?? "absent"
    let note = record.note ?? ""

    if (status !== "leave" && status !== "absent") {
      const calc = calculateStaffAttendanceStatus(checkIn, checkOut, sysConfig, record.date)
      status = calc.status
      note = calc.note
    }

    if ((leaveForDate.sang || leaveForDate.chieu) && (checkIn === "--" || !checkIn)) {
      status = "leave"
      const noteParts = []
      if (leaveForDate.sang) noteParts.push(leaveForDate.sang)
      if (leaveForDate.chieu && leaveForDate.chieu !== leaveForDate.sang) noteParts.push(leaveForDate.chieu)
      note = noteParts.join(" · ") || "Nghỉ phép"
    }

    const workingHours = calcStaffWorkingHours(checkIn, checkOut, sysConfig)

    return {
      ...record,
      employeeName: emp?.name ?? "—",
      department: emp?.department ?? "—",
      employeeStatus: "staff",
      workingHours,
      checkIn,
      checkOut,
      status,
      note,
      checkInAm: checkIn,
      checkOutAm: checkOut,
      checkInPm: "--",
      checkOutPm: "--",
      statusAm: status,
      statusPm: "absent",
      noteAm: note,
      notePm: ""
    }
  }

  let morningIn = record.checkInAm ?? "--"
  let morningOut = record.checkOutAm ?? "--"
  let afternoonIn = record.checkInPm ?? "--"
  let afternoonOut = record.checkOutPm ?? "--"
  let statusAm = record.statusAm ?? record.status ?? "absent"
  let statusPm = record.statusPm ?? record.status ?? "absent"
  let noteAm = record.noteAm ?? record.note ?? ""
  let notePm = record.notePm ?? ""

  if (record.checkInAm === undefined && record.checkInPm === undefined) {
    if (checkIn !== "--") {
      const noonBoundaryHour = parseInt((sysConfig.noonBoundary || "14:00").split(":")[0], 10)
      const parts = checkIn.split(":")
      const h = parts.length > 0 ? Number(parts[0]) : noonBoundaryHour
      if (h < noonBoundaryHour) {
        morningIn = checkIn
        morningOut = "12:00"
        afternoonIn = "13:30"
        afternoonOut = checkOut !== "--" ? checkOut : "--"
      } else {
        morningIn = "--"
        morningOut = "--"
        afternoonIn = checkIn
        afternoonOut = checkOut
      }
    } else {
      morningIn = "--"
      morningOut = "--"
      afternoonIn = "--"
      afternoonOut = "--"
    }
  }

  const d = new Date()
  const todayISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  const isFuture = record.date > todayISO

  const hasApprovedAm = !!leaveForDate.sang
  if (statusAm === "leave" && !hasApprovedAm) {
    statusAm = isFuture ? "" : "absent"
    noteAm = ""
  }

  const hasApprovedPm = !!leaveForDate.chieu
  if (statusPm === "leave" && !hasApprovedPm) {
    statusPm = isFuture ? "" : "absent"
    notePm = ""
  }

  if (leaveForDate.sang && (morningIn === "--" || !morningIn)) {
    statusAm = "leave"
    noteAm = leaveForDate.sang
  }
  if (leaveForDate.chieu && (afternoonIn === "--" || !afternoonIn)) {
    statusPm = "leave"
    notePm = leaveForDate.chieu
  }

  if (statusAm !== "leave" && statusAm !== "absent" && statusAm !== "") {
    const morningStart = sysConfig.morningStart || "09:00"
    const morningEnd = sysConfig.morningEnd || "12:00"
    const sessionConfig = { ...sysConfig, morningStart, morningEnd }
    const calc = calculateSessionStatus(morningIn, morningOut, "morning", sessionConfig)
    statusAm = calc.status
    if (!noteAm || noteAm.includes("Đi trễ") || noteAm.includes("Về sớm") || noteAm === "Đúng giờ") {
      noteAm = calc.note || "Đúng giờ"
    }
  } else if (statusAm === "absent" && morningIn === "--") {
    noteAm = "Vắng sáng"
  }

  if (statusPm !== "leave" && statusPm !== "absent" && statusPm !== "") {
    const afternoonStart = sysConfig.afternoonStart || "13:30"
    const afternoonEnd = sysConfig.afternoonEnd || "17:00"
    const sessionConfig = { ...sysConfig, afternoonStart, afternoonEnd }
    const calc = calculateSessionStatus(afternoonIn, afternoonOut, "afternoon", sessionConfig)
    statusPm = calc.status
    if (!notePm || notePm.includes("Đi trễ") || notePm.includes("Về sớm") || notePm === "Đúng giờ") {
      notePm = calc.note || "Đúng giờ"
    }
  } else if (statusPm === "absent" && afternoonIn === "--") {
    notePm = "Vắng chiều"
  }

  let finalNote = buildInternDayNote(statusAm, statusPm, noteAm, notePm)
  if (!finalNote && morningIn === "--" && afternoonIn === "--") {
    finalNote = isFuture ? "" : "Vắng"
  }

  if (record.autoFilled) {
    finalNote = "Làm cả ngày " + (finalNote ? ` · ${finalNote}` : "")
  }

  const workingHours = calcInternWorkingHours(morningIn, morningOut, afternoonIn, afternoonOut)

  return {
    ...record,
    employeeName: emp?.name ?? "—",
    department: emp?.department ?? "—",
    employeeStatus: "intern",
    workingHours,
    checkIn: morningIn !== "--" ? morningIn : afternoonIn,
    checkOut: afternoonOut !== "--" ? afternoonOut : morningOut,
    checkInAm: morningIn,
    checkOutAm: morningOut,
    checkInPm: afternoonIn,
    checkOutPm: afternoonOut,
    statusAm,
    statusPm,
    noteAm,
    notePm,
    status: deriveInternDayStatus(statusAm, statusPm),
    note: finalNote
  }
}

export function listAttendance(rawFilter) {
  const filter = { ...rawFilter }
  if (filter.date) {
    if (!filter.startDate) filter.startDate = filter.date
    if (!filter.endDate) filter.endDate = filter.date
  }

  let records = repo.getAll()
  records = records.filter(r => !["0000000000", "1111111111", "2222222222"].includes(r.employeeId))

  const recordKeys = new Set(records.map(r => `${r.employeeId}_${r.date}`))

  try {
    const approvedLeaves = requestRepo.getAll({ status: "approved" })
    const vnToIsoDate = (vnStr) => {
      if (!vnStr) return ""
      const parts = vnStr.split("/")
      if (parts.length !== 3) return ""
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`
    }

    approvedLeaves.forEach(leave => {
      const dates = []
      if (leave.scope === "date_range" && leave.startDate && leave.endDate) {
        const startIso = vnToIsoDate(leave.startDate)
        const endIso = vnToIsoDate(leave.endDate)
        if (startIso && endIso) {
          const start = new Date(startIso)
          const end = new Date(endIso)
          let curr = new Date(start)
          while (curr <= end) {
            const day = curr.getDay()
            const isWeekend = day === 0 || day === 6
            if (!isWeekend) {
              dates.push(curr.toISOString().split("T")[0])
            }
            curr.setDate(curr.getDate() + 1)
          }
        }
      } else if (leave.scope === "multi_session" && leave.sessions && Array.isArray(leave.sessions)) {
        leave.sessions.forEach(s => {
          const iso = vnToIsoDate(s.date)
          if (iso) {
            const dateParts = iso.split("-").map(Number)
            const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6
            if (!isWeekend) {
              dates.push(iso)
            }
          }
        })
      } else {
        const iso = vnToIsoDate(leave.startDate)
        if (iso) {
          const dateParts = iso.split("-").map(Number)
          const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6
          if (!isWeekend) {
            dates.push(iso)
          }
        }
      }

      dates.forEach(dateStr => {
        const exists = recordKeys.has(`${leave.employeeId}_${dateStr}`)
        if (!exists) {
          const emp = empRepo.getById(leave.employeeId)
          const isIntern = isInternContractType(getContractTypeForDate(emp, dateStr))
          const blank = {
            id: `TEMP_${leave.employeeId}_${dateStr}`,
            employeeId: leave.employeeId,
            date: dateStr,
            status: "leave",
            note: leave.reason || "Nghỉ phép",
            contractType: isIntern ? "intern" : "staff",
            ...(isIntern ? {
              checkInAm: "--",
              checkOutAm: "--",
              checkInPm: "--",
              checkOutPm: "--"
            } : {
              checkIn: "--",
              checkOut: "--"
            })
          }
          records.push(blank)
          recordKeys.add(`${leave.employeeId}_${dateStr}`)
        }
      })
    })
  } catch (err) {
    console.error("Error generating virtual leave records:", err)
  }

  if (filter.startDate && filter.endDate) {
    const startParts = filter.startDate.split("-").map(Number)
    const endParts = filter.endDate.split("-").map(Number)
    const start = new Date(startParts[0], startParts[1] - 1, startParts[2])
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2])
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dateList = []
    let curr = new Date(start)
    while (curr <= end) {
      const y = curr.getFullYear()
      const m = String(curr.getMonth() + 1).padStart(2, "0")
      const d = String(curr.getDate()).padStart(2, "0")
      dateList.push(`${y}-${m}-${d}`)
      curr.setDate(curr.getDate() + 1)
    }

    let employees = empRepo.getAll()
    employees = employees.filter(e => !["0000000000", "1111111111", "2222222222"].includes(e.id))
    employees = employees.filter(e => e.status === "active")

    if (filter.employeeId) {
      employees = employees.filter(e => e.id === filter.employeeId)
    }
    if (filter.branchId && filter.branchId !== "all") {
      employees = employees.filter(e => e.branchId === filter.branchId)
    }
    if (filter.department && filter.department !== "all") {
      employees = employees.filter(e => e.department === filter.department)
    }

    employees.forEach(emp => {
      dateList.forEach(dateStr => {
        const exists = recordKeys.has(`${emp.id}_${dateStr}`)
        if (!exists) {
          const dateParts = dateStr.split("-").map(Number)
          const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6

          const compareDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
          compareDate.setHours(0, 0, 0, 0)

          if (compareDate <= today && !isWeekend) {
            const isIntern = isInternContractType(getContractTypeForDate(emp, dateStr))
            const blank = {
              id: `TEMP_${emp.id}_${dateStr}`,
              employeeId: emp.id,
              date: dateStr,
              status: "absent",
              note: "",
              contractType: isIntern ? "intern" : "staff",
              ...(isIntern ? {
                checkInAm: "--",
                checkOutAm: "--",
                checkInPm: "--",
                checkOutPm: "--"
              } : {
                checkIn: "--",
                checkOut: "--"
              })
            }
            records.push(blank)
            recordKeys.add(`${emp.id}_${dateStr}`)
          }
        }
      })
    })
  }

  if (filter.startDate) {
    records = records.filter(r => r.date >= filter.startDate)
  }
  if (filter.endDate) {
    records = records.filter(r => r.date <= filter.endDate)
  }
  if (filter.employeeId) {
    records = records.filter(r => r.employeeId === filter.employeeId)
  }
  if (filter.branchId && filter.branchId !== "all") {
    records = records.filter(r => {
      const emp = empRepo.getById(r.employeeId)
      return emp?.branchId === filter.branchId
    })
  }
  if (filter.department && filter.department !== "all" && filter.department !== "departments") {
    records = records.filter(r => {
      const emp = empRepo.getById(r.employeeId)
      return emp?.department === filter.department
    })
  }

  records.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date)
    }
    const parseTime = (t) => {
      if (!t || t === "--") return 0
      return parseToSeconds(t)
    }
    const getLatestCheckIn = (r) => {
      if (r.checkInAm !== undefined || r.checkInPm !== undefined) {
        const am = parseTime(r.checkInAm)
        const pm = parseTime(r.checkInPm)
        return Math.max(am, pm)
      }
      return parseTime(r.checkIn)
    }
    return getLatestCheckIn(b) - getLatestCheckIn(a)
  })

  return records.map(withEmployee)
}

function addSessionStat(status, counts) {
  if (status === "on-time") counts.onTime += 0.5
  else if (status === "late" || status === "late_early" || status === "early") counts.late += 0.5
  else if (status === "absent") counts.absent += 0.5
  else if (status === "leave") counts.leave += 0.5
}

function addDayStat(status, counts) {
  if (status === "on-time") counts.onTime += 1
  else if (status === "late" || status === "late_early" || status === "early") counts.late += 1
  else if (status === "absent") counts.absent += 1
  else if (status === "leave") counts.leave += 1
}

export function getAttendanceStats(filter = {}) {
  const records = listAttendance(filter)
  const counts = { onTime: 0, late: 0, absent: 0, leave: 0 }

  records.forEach(r => {
    if (r.employeeStatus === "intern") {
      addSessionStat(r.statusAm, counts)
      addSessionStat(r.statusPm, counts)
    } else {
      addDayStat(r.status, counts)
    }
  })

  return {
    onTime: Math.round(counts.onTime * 10) / 10,
    late: Math.round(counts.late * 10) / 10,
    absent: Math.round(counts.absent * 10) / 10,
    leave: Math.round(counts.leave * 10) / 10,
    total: records.length,
  }
}

export function getAttendance(id) {
  const record = repo.getById(id)
  if (!record) return null
  return withEmployee(record)
}

export function createAttendance(data) {
  if (data.date) {
    const dateParts = data.date.split("-").map(Number)
    const dayOfWeek = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]).getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const isReqUserAdmin = data.reqUser?.roleId === "role-super-admin" || data.reqUser?.roleId === "role-admin"
      if (!isReqUserAdmin) {
        return { error: "Không được phép chấm công vào Thứ Bảy và Chủ Nhật!", status: 400 }
      }
    }
  }

  const ipCheck = validateClientIP(data.employeeId, data.ip, data.reqUser)
  if (!ipCheck.valid) {
    return { error: ipCheck.error, status: 403 }
  }

  const existing = repo.findByEmployeeAndDate(data.employeeId, data.date)
  if (existing) return { error: "Đã có bản ghi chấm công cho nhân viên này hôm nay", status: 409 }

  const emp = empRepo.getById(data.employeeId)
  const isIntern = isInternContractType(getContractTypeForDate(emp, data.date))
  const sysConfig = getSystemConfig()
  const noonBoundary = sysConfig.noonBoundary || "14:00"

  let recordFields = {
    employeeId: data.employeeId,
    date: data.date,
    status: data.status || "on-time",
    note: data.note || "",
    contractType: isIntern ? "intern" : "staff"
  }

  if (!isIntern) {
    recordFields.checkIn = data.checkIn || "--"
    recordFields.checkOut = data.checkOut || "--"
  } else {
    if (data.checkInAm !== undefined || data.checkOutAm !== undefined || data.checkInPm !== undefined || data.checkOutPm !== undefined) {
      recordFields.checkInAm = data.checkInAm || "--"
      recordFields.checkOutAm = data.checkOutAm || "--"
      recordFields.checkInPm = data.checkInPm || "--"
      recordFields.checkOutPm = data.checkOutPm || "--"
    } else {
      const timeStr = data.checkIn || "--"
      if (timeStr < noonBoundary) {
        recordFields.checkInAm = timeStr
        recordFields.checkOutAm = "--"
        recordFields.checkInPm = "--"
        recordFields.checkOutPm = "--"
      } else {
        recordFields.checkInAm = "--"
        recordFields.checkOutAm = "--"
        recordFields.checkInPm = timeStr
        recordFields.checkOutPm = "--"
      }
    }
  }

  const count = repo.count()
  const record = repo.create({
    id: `ATT${String(count + 1).padStart(3, "0")}`,
    ...recordFields
  })

  return withEmployee(record)
}

export function updateAttendance(id, patch) {
  let employeeId = null
  let record = null
  let dateStr = ""
  if (id.startsWith("TEMP_")) {
    const parts = id.split("_")
    employeeId = parts[1]
    dateStr = parts[2]
  } else {
    record = repo.getById(id)
    employeeId = record?.employeeId
    dateStr = record?.date || ""
  }

  if (dateStr) {
    const dateParts = dateStr.split("-").map(Number)
    const dayOfWeek = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]).getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const isReqUserAdmin = patch.reqUser?.roleId === "role-super-admin" || patch.reqUser?.roleId === "role-admin"
      if (!isReqUserAdmin) {
        return { error: "Không được phép chấm công vào Thứ Bảy và Chủ Nhật!", status: 400 }
      }
    }
  }

  if (employeeId) {
    const ipCheck = validateClientIP(employeeId, patch.ip, patch.reqUser)
    if (!ipCheck.valid) {
      return { error: ipCheck.error, status: 403 }
    }
  }

  const emp = employeeId ? empRepo.getById(employeeId) : null
  const isIntern = isInternContractType(getContractTypeForDate(emp, dateStr))
  const sysConfig = getSystemConfig()

  if (id.startsWith("TEMP_")) {
    const parts = id.split("_")
    const empId = parts[1]
    const date = parts[2]
    const count = repo.count()
    
    let initialFields = {}
    if (isIntern) {
      const timeStr = patch.checkIn || patch.checkInAm || patch.checkInPm || "--"
      if (timeStr !== "--") {
        if (timeStr < (sysConfig.noonBoundary || "14:00")) {
          initialFields = { checkInAm: timeStr, checkOutAm: "--", checkInPm: "--", checkOutPm: "--" }
        } else {
          initialFields = { checkInAm: "--", checkOutAm: "--", checkInPm: timeStr, checkOutPm: "--" }
        }
      }
    } else {
      initialFields = { checkIn: patch.checkIn || "--", checkOut: "--" }
    }

    record = repo.create({
      id: `ATT${String(count + 1).padStart(3, "0")}`,
      employeeId: empId,
      date,
      ...initialFields,
      status: "on-time",
      note: "",
      contractType: isIntern ? "intern" : "staff"
    })
    return withEmployee(record)
  }

  if (!isIntern) {
    if (patch.checkOut && patch.checkOut !== "--") {
      if (record.checkOut && record.checkOut !== "--") {
        return { error: "Bạn đã hoàn thành chấm công ngày hôm nay!", status: 400 }
      }
    }
    const ALLOWED = ["checkIn", "checkOut", "status", "note"]
    const safe = Object.fromEntries(Object.entries(patch).filter(([k]) => ALLOWED.includes(k)))
    record = repo.update(id, safe)
  } else {
  
    const cia = record.checkInAm && record.checkInAm !== "--"
    const coa = record.checkOutAm && record.checkOutAm !== "--"
    const cip = record.checkInPm && record.checkInPm !== "--"
    const cop = record.checkOutPm && record.checkOutPm !== "--"
    if (cia && coa && cip && cop) {
      return { error: "Đã đủ 4 lượt hôm nay", status: 400 }
    }

    const timeStr = patch.checkOut || patch.checkOutAm || patch.checkInPm || patch.checkOutPm || patch.checkIn || "--"
    let updateFields = {}

    if (timeStr !== "--") {
      if (timeStr < (sysConfig.noonBoundary || "14:00")) {
        if (!record.checkInAm || record.checkInAm === "--") {
          updateFields = { checkInAm: timeStr }
        } else if (!record.checkOutAm || record.checkOutAm === "--") {
          updateFields = { checkOutAm: timeStr }
        } else {
          return { error: "Đã hoàn thành ca Sáng!", status: 400 }
        }
      } else {
        const hasInAm = record.checkInAm && record.checkInAm !== "--"
        const hasOutAm = record.checkOutAm && record.checkOutAm !== "--"
        const hasInPm = record.checkInPm && record.checkInPm !== "--"

        if (hasInAm && !hasOutAm && !hasInPm) {
          updateFields = {
            checkOutAm: sysConfig.morningEnd || "12:00",
            checkInPm: sysConfig.afternoonStart || "13:30",
            checkOutPm: timeStr,
            autoFilled: true
          }
        } else {
          if (!record.checkInPm || record.checkInPm === "--") {
            updateFields = { checkInPm: timeStr }
          } else if (!record.checkOutPm || record.checkOutPm === "--") {
            updateFields = { checkOutPm: timeStr }
          } else {
            return { error: "Đã hoàn thành ca Chiều!", status: 400 }
          }
        }
      }
    }

    const ADMIN_ALLOWED = ["checkInAm", "checkOutAm", "checkInPm", "checkOutPm", "statusAm", "statusPm", "noteAm", "notePm", "status", "note", "autoFilled"]
    const adminSafe = Object.fromEntries(Object.entries(patch).filter(([k]) => ADMIN_ALLOWED.includes(k)))

    const finalUpdate = Object.keys(updateFields).length > 0 ? updateFields : adminSafe
    record = repo.update(id, finalUpdate)
  }

  if (!record) return null
  return withEmployee(record)
}

export function deleteAttendance(id) {
  return repo.remove(id)
}
