export function generateEmployeeId(takenIds = [], totalEmployeesCount = 0) {
  const taken = new Set(takenIds.filter(Boolean))
  const d = new Date()
  const prefix = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("")

  let seq = totalEmployeesCount
  while (seq <= 99) {
    const candidate = `${prefix}${String(seq).padStart(2, "0")}`
    if (!taken.has(candidate)) return candidate
    seq++
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
