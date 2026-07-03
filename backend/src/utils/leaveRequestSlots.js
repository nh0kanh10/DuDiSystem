const VALID_SESSIONS = new Set(["sang", "chieu"])

function parseVnDate(str) {
  if (!str) return null
  const [d, m, y] = str.split("/").map(Number)
  if ([d, m, y].some(Number.isNaN)) return null
  return new Date(y, m - 1, d)
}

function formatVnDate(d) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

function isWeekend(d) {
  const day = d.getDay()
  return day === 0 || day === 6
}

function getWeekdayDateRange(startStr, endStr) {
  const start = parseVnDate(startStr)
  const end = parseVnDate(endStr)
  if (!start || !end) return []
  const dates = []
  const current = new Date(start)
  while (current <= end) {
    if (!isWeekend(current)) dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export function expandRequestToSlots(req) {
  if (!req?.startDate && req?.scope !== "multi_session") return []
  const result = []

  switch (req.scope) {
    case "full_day":
      result.push({ date: req.startDate, session: "sang" }, { date: req.startDate, session: "chieu" })
      break
    case "date_range": {
      const end = req.endDate || req.startDate
      for (const d of getWeekdayDateRange(req.startDate, end)) {
        const dateStr = formatVnDate(d)
        result.push({ date: dateStr, session: "sang" }, { date: dateStr, session: "chieu" })
      }
      break
    }
    case "half_session":
      if (req.session && VALID_SESSIONS.has(req.session)) {
        result.push({ date: req.startDate, session: req.session })
      }
      break
    case "multi_session":
      for (const slot of req.sessions ?? []) {
        if (slot?.date && slot?.session && VALID_SESSIONS.has(slot.session)) {
          result.push({ date: slot.date, session: slot.session })
        }
      }
      break
    default:
      break
  }

  return result
}

export function slotKey(date, session) {
  return `${date}|${session}`
}

export function findSlotConflict(employeeId, newSlots, existingRequests, excludeId = null) {
  const occupied = new Map()

  for (const req of existingRequests) {
    if (excludeId && req.id === excludeId) continue
    if (req.status !== "pending" && req.status !== "approved") continue
    if (req.category !== "leave" && req.category !== "timeoff") continue

    for (const slot of expandRequestToSlots(req)) {
      occupied.set(slotKey(slot.date, slot.session), req)
    }
  }

  for (const slot of newSlots) {
    const key = slotKey(slot.date, slot.session)
    if (occupied.has(key)) {
      return { slot, existing: occupied.get(key) }
    }
  }

  return null
}

export function getApprovedLeaveForDate(employeeId, vnDateStr, requests) {
  const sessions = { sang: null, chieu: null }

  for (const req of requests) {
    if (req.employeeId !== employeeId) continue
    if (req.status !== "approved") continue
    if (req.category !== "leave" && req.category !== "timeoff") continue

    for (const slot of expandRequestToSlots(req)) {
      if (slot.date === vnDateStr) {
        sessions[slot.session] = req.reason || "Nghỉ phép"
      }
    }
  }

  return sessions
}
