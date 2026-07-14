import { test } from "node:test"
import assert from "node:assert"
import { generateEmployeeId } from "../utils/employeeId.js"

function todayPrefix() {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
}

test("generateEmployeeId - YYYYMMDD + số thứ tự 00 khi chưa có nhân viên", () => {
  const prefix = todayPrefix()
  const id = generateEmployeeId([], 0)
  assert.strictEqual(id, `${prefix}00`)
  assert.match(id, /^\d{10}$/)
})

test("generateEmployeeId - tăng số thứ tự khi bị trùng", () => {
  const prefix = todayPrefix()
  const first = `${prefix}00`
  const second = generateEmployeeId([first], 0)
  assert.strictEqual(second, `${prefix}01`)

  const third = generateEmployeeId([first, second], 1)
  assert.strictEqual(third, `${prefix}02`)
})

test("generateEmployeeId - bỏ qua mã NV cũ (NVxxx)", () => {
  const prefix = todayPrefix()
  const id = generateEmployeeId(["NV001", "NV017"], 0)
  assert.strictEqual(id, `${prefix}00`)
})
