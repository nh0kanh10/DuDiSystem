import { test } from "node:test"
import assert from "node:assert"
import {
  calculateStaffAttendanceStatus,
  calculateSessionStatus,
  deriveInternDayStatus,
  buildInternDayNote,
} from "../services/attendance.service.js"

test("Attendance Service - calculateStaffAttendanceStatus", () => {
  const todayStr = new Date().toISOString().split("T")[0]
  const resultOnTimeToday = calculateStaffAttendanceStatus("08:55", "--", { employeeStart: "09:00" }, todayStr)
  assert.strictEqual(resultOnTimeToday.status, "on-time")
  assert.strictEqual(resultOnTimeToday.note, "Chưa check-out")

  const resultLateToday = calculateStaffAttendanceStatus("09:05", "--", { employeeStart: "09:00" }, todayStr)
  assert.strictEqual(resultLateToday.status, "late")
  assert.strictEqual(resultLateToday.note, "Đi trễ 5p, chưa check-out")

  const resultOnTimePast = calculateStaffAttendanceStatus("08:55", "--", { employeeStart: "09:00" }, "2026-06-30")
  assert.strictEqual(resultOnTimePast.status, "on-time")
  assert.strictEqual(resultOnTimePast.note, "Quên check-out")

  const resultLatePast = calculateStaffAttendanceStatus("09:05", "--", { employeeStart: "09:00" }, "2026-06-30")
  assert.strictEqual(resultLatePast.status, "late")
  assert.strictEqual(resultLatePast.note, "Đi trễ 5p, quên check-out")
})

test("Attendance Service - deriveInternDayStatus", () => {
  assert.strictEqual(deriveInternDayStatus("late", "absent"), "late")
  assert.strictEqual(deriveInternDayStatus("late", "leave"), "late")
  assert.strictEqual(deriveInternDayStatus("absent", "on-time"), "on-time")
  assert.strictEqual(deriveInternDayStatus("leave", "on-time"), "on-time")
  assert.strictEqual(deriveInternDayStatus("early", "absent"), "early")
  assert.strictEqual(deriveInternDayStatus("late_early", "on-time"), "late_early")
  assert.strictEqual(deriveInternDayStatus("leave", "leave"), "leave")
  assert.strictEqual(deriveInternDayStatus("absent", "absent"), "absent")
})

test("Attendance Service - buildInternDayNote", () => {
  assert.strictEqual(
    buildInternDayNote("late", "absent", "Đi trễ sáng 1h", "Vắng chiều"),
    "Đi trễ sáng 1h · Vắng chiều"
  )
  assert.strictEqual(
    buildInternDayNote("late", "leave", "Đi trễ sáng 1h", "Nghỉ phép năm"),
    "Đi trễ sáng 1h · Nghỉ phép năm"
  )
  assert.strictEqual(
    buildInternDayNote("absent", "on-time", "Vắng sáng", ""),
    "Vắng sáng"
  )
  assert.strictEqual(
    buildInternDayNote("early", "late", "Về sớm sáng 30p", "Đi trễ chiều 10p"),
    "Về sớm sáng 30p · Đi trễ chiều 10p"
  )
})
