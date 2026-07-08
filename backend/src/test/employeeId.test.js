import { test } from "node:test"
import assert from "node:assert"
import { generateEmployeeId } from "../utils/employeeId.js"

function todayPrefix() {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
}

test("generateEmployeeId - YYYYMMDD + số thứ tự 01", () => {
  const prefix = todayPrefix()
  const id = generateEmployeeId([])
  assert.strictEqual(id, `${prefix}01`)
  assert.match(id, /^\d{10}$/)
})

test("generateEmployeeId - tăng số thứ tự trong cùng ngày", () => {
  const prefix = todayPrefix()
  const first = `${prefix}01`
  const second = generateEmployeeId([first])
  assert.strictEqual(second, `${prefix}02`)

  const third = generateEmployeeId([first, second])
  assert.strictEqual(third, `${prefix}03`)
})

test("generateEmployeeId - bỏ qua mã NV cũ (NVxxx)", () => {
  const prefix = todayPrefix()
  const id = generateEmployeeId(["NV001", "NV017"])
  assert.strictEqual(id, `${prefix}01`)
})
