export function generateEmployeeId(takenIds = []) {
  const taken = new Set(takenIds.filter(Boolean))
  const d = new Date()
  const prefix = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("")

  let maxSeq = 0
  for (const id of taken) {
    if (typeof id !== "string" || !id.startsWith(prefix)) continue
    const tail = id.slice(prefix.length)
    const m = tail.match(/^(\d{2})/)
    if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10))
  }

  for (let seq = maxSeq + 1; seq <= 99; seq++) {
    const candidate = `${prefix}${String(seq).padStart(2, "0")}`
    if (!taken.has(candidate)) return candidate
  }

  throw new Error("Đã đạt giới hạn 99 mã nhân viên trong ngày")
}

export function collectTakenEmployeeIds(employeeRepo, userRepo) {
  const ids = new Set()
  employeeRepo.getAll().forEach(e => ids.add(e.id))
  userRepo.getAll().forEach(u => {
    if (u.email) ids.add(u.email)
    if (u.employeeId) ids.add(u.employeeId)
  })
  return [...ids]
}
