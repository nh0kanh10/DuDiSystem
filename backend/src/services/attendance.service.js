import * as repo from "../repositories/attendance.repository.js"
import * as empRepo from "../repositories/employee.repository.js"
import * as requestRepo from "../repositories/request.repository.js"
import * as allowedIPRepo from "../repositories/allowedIP.repository.js"
import { getSystemConfig } from "./systemConfig.service.js"

export function validateClientIP(employeeId, clientIP, reqUser) {
  const config = getSystemConfig()
  if (!config.requireIP) return { valid: true }

  if (reqUser && (reqUser.roleId === "role-admin" || reqUser.permissions?.includes("cham-cong"))) {
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
      return { valid: true }
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

export function calculateStaffAttendanceStatus(checkIn, checkOut, config) {
  if (!checkIn || checkIn === "--") {
    return { status: "absent", note: "Vắng" }
  }
  if (!checkOut || checkOut === "--") {
    const inSec = parseToSeconds(checkIn)
    const staffStartSec = parseToSeconds(config?.employeeStart || "09:00")
    if (inSec !== -1 && inSec > staffStartSec) {
      const diffSec = inSec - staffStartSec
      return { status: "late", note: `Đi trễ ${formatDiffTimeShort(diffSec)}, chưa check-out` }
    }
    return { status: "on-time", note: "Chưa check-out" }
  }

  const inSec = parseToSeconds(checkIn)
  const outSec = parseToSeconds(checkOut)
  if (outSec === -1 || inSec === -1 || outSec <= inSec) {
    return { status: "absent", note: "Dữ liệu lỗi" }
  }

  const earlyGrace = Number(config?.earlyGraceMinutes ?? 15)
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

  if (outSec < staffEndSec - earlyGrace * 60) {
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

export function calculateSessionStatus(checkIn, checkOut, session, config) {
  if (!checkIn || checkIn === "--") {
    return { status: "absent", note: "" }
  }

  const earlyGrace = Number(config?.earlyGraceMinutes ?? 15)
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
    if (outSec !== -1 && outSec < morningEndSec - earlyGrace * 60) {
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
    if (outSec !== -1 && outSec < afternoonEndSec - earlyGrace * 60) {
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
  const isIntern = emp?.status === "intern"

  const checkIn = record.checkIn ?? "--"
  const checkOut = record.checkOut ?? "--"

  const reqDate = isoToRequestDate(record.date)
  const approvedRequests = requestRepo.getAll({ employeeId: record.employeeId, status: "approved" })
    .filter(req => {
      if (!req.startDate || !req.endDate) return false
      const [d, m, y] = reqDate.split("/").map(Number)
      const targetTime = new Date(y, m - 1, d).getTime()
      
      const [sd, sm, sy] = req.startDate.split("/").map(Number)
      const startTime = new Date(sy, sm - 1, sd).getTime()
      
      const [ed, em, ey] = req.endDate.split("/").map(Number)
      const endTime = new Date(ey, em - 1, ed).getTime()
      
      return targetTime >= startTime && targetTime <= endTime && (req.category === "leave" || req.category === "timeoff")
    })

  if (!isIntern) {
    let status = record.status ?? "absent"
    let note = record.note ?? ""

    if (status !== "leave" && status !== "absent") {
      const calc = calculateStaffAttendanceStatus(checkIn, checkOut, sysConfig)
      status = calc.status
      note = calc.note
    }

    if (approvedRequests.length > 0 && (checkIn === "--" || !checkIn)) {
      status = "leave"
      note = approvedRequests[0].reason || "Nghỉ phép"
    }

    const workingHours = calcStaffWorkingHours(checkIn, checkOut, sysConfig)

    return {
      ...record,
      employeeName: emp?.name ?? "—",
      department: emp?.department ?? "—",
      employeeStatus: emp?.status ?? "active",
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

  const hasApprovedAm = approvedRequests.some(req => {
    const session = req.session ? req.session.toLowerCase() : "all"
    return session === "all" || session === "sang" || session === "morning"
  })
  if (statusAm === "leave" && !hasApprovedAm) {
    statusAm = "absent"
    noteAm = ""
  }

  const hasApprovedPm = approvedRequests.some(req => {
    const session = req.session ? req.session.toLowerCase() : "all"
    return session === "all" || session === "chieu" || session === "afternoon"
  })
  if (statusPm === "leave" && !hasApprovedPm) {
    statusPm = "absent"
    notePm = ""
  }

  approvedRequests.forEach(req => {
    const session = req.session ? req.session.toLowerCase() : "all"
    if (session === "all") {
      if (morningIn === "--" || !morningIn) {
        statusAm = "leave"
        noteAm = req.reason || "Nghỉ phép"
      }
      if (afternoonIn === "--" || !afternoonIn) {
        statusPm = "leave"
        notePm = req.reason || "Nghỉ phép"
      }
    } else if (session === "sang" || session === "morning") {
      if (morningIn === "--" || !morningIn) {
        statusAm = "leave"
        noteAm = req.reason || "Nghỉ phép"
      }
    } else if (session === "chieu" || session === "afternoon") {
      if (afternoonIn === "--" || !afternoonIn) {
        statusPm = "leave"
        notePm = req.reason || "Nghỉ phép"
      }
    }
  })

  if (statusAm !== "leave" && statusAm !== "absent") {
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

  if (statusPm !== "leave" && statusPm !== "absent") {
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

  let finalNoteParts = []
  if (morningIn !== "--" && noteAm && noteAm !== "Đúng giờ") finalNoteParts.push(noteAm)
  if (afternoonIn !== "--" && notePm && notePm !== "Đúng giờ") finalNoteParts.push(notePm)
  
  let finalNote = finalNoteParts.join(", ")
  if (!finalNote) {
    if (morningIn === "--" && afternoonIn === "--") {
      finalNote = "Vắng"
    } else if (morningIn !== "--" && afternoonIn === "--") {
      finalNote = "Nửa ngày sáng"
    } else if (morningIn === "--" && afternoonIn !== "--") {
      finalNote = "Nửa ngày chiều"
    } else {
      finalNote = "Đúng giờ"
    }
  }

  if (record.autoFilled) {
    finalNote = "Làm cả ngày (tự ghi giờ trưa)" + (finalNoteParts.length > 0 ? ` · ${finalNote}` : "")
  }

  const workingHours = calcInternWorkingHours(morningIn, morningOut, afternoonIn, afternoonOut)

  return {
    ...record,
    employeeName: emp?.name ?? "—",
    department: emp?.department ?? "—",
    employeeStatus: emp?.status ?? "intern",
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
    status: (statusAm === "leave" || statusPm === "leave") ? "leave" :
      (statusAm === "absent" && statusPm === "absent") ? "absent" :
        (statusAm === "absent" || statusPm === "absent") ? "absent" :
          (statusAm === "late_early" || statusPm === "late_early") ? "late_early" :
            (statusAm === "late" || statusPm === "late") ? "late" :
              (statusAm === "early" || statusPm === "early") ? "early" : "on-time",
    note: finalNote
  }
}

export function listAttendance(filter) {
  let records = repo.getAll(filter)
  records = records.filter(r => !["0000000000", "1111111111", "2222222222"].includes(r.employeeId))

  if (filter.startDate && filter.startDate === filter.endDate) {
    const targetDate = filter.startDate
    let employees = empRepo.getAll()
    employees = employees.filter(e => !["0000000000", "1111111111", "2222222222"].includes(e.id))

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
      const exists = records.some(r => r.employeeId === emp.id && r.date === targetDate)
      if (!exists) {
        const blank = {
          id: `TEMP_${emp.id}_${targetDate}`,
          employeeId: emp.id,
          date: targetDate,
          checkIn: "--",
          checkOut: "--",
          checkInAm: "--",
          checkOutAm: "--",
          checkInPm: "--",
          checkOutPm: "--",
          status: "absent",
          note: "",
        }
        records.push(blank)
      }
    })
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
  if (filter.employeeId) {
    records = records.filter(r => r.employeeId === filter.employeeId)
  }
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
  const ipCheck = validateClientIP(data.employeeId, data.ip, data.reqUser)
  if (!ipCheck.valid) {
    return { error: ipCheck.error, status: 403 }
  }

  const existing = repo.findByEmployeeAndDate(data.employeeId, data.date)
  if (existing) return { error: "Đã có bản ghi chấm công cho nhân viên này hôm nay", status: 409 }

  const emp = empRepo.getById(data.employeeId)
  const isIntern = emp?.status === "intern"
  const sysConfig = getSystemConfig()
  const noonBoundary = sysConfig.noonBoundary || "14:00"

  let recordFields = {
    employeeId: data.employeeId,
    date: data.date,
    status: data.status || "on-time",
    note: data.note || ""
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
  if (id.startsWith("TEMP_")) {
    const parts = id.split("_")
    employeeId = parts[1]
  } else {
    record = repo.getById(id)
    employeeId = record?.employeeId
  }

  if (employeeId) {
    const ipCheck = validateClientIP(employeeId, patch.ip, patch.reqUser)
    if (!ipCheck.valid) {
      return { error: ipCheck.error, status: 403 }
    }
  }

  const emp = employeeId ? empRepo.getById(employeeId) : null
  const isIntern = emp?.status === "intern"
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
      note: ""
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
