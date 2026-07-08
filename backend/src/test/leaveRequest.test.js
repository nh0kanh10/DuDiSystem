import { test } from "node:test"
import assert from "node:assert"
import { expandRequestToSlots, findSlotConflict, getApprovedLeaveForDate } from "../utils/leaveRequestSlots.js"

test("leaveRequestSlots - expandRequestToSlots full_day", () => {
  const slots = expandRequestToSlots({
    scope: "full_day",
    startDate: "03/07/2026",
  })
  assert.strictEqual(slots.length, 2)
  assert.deepStrictEqual(slots[0], { date: "03/07/2026", session: "sang" })
  assert.deepStrictEqual(slots[1], { date: "03/07/2026", session: "chieu" })
})

test("leaveRequestSlots - expandRequestToSlots half_session", () => {
  const slots = expandRequestToSlots({
    scope: "half_session",
    startDate: "03/07/2026",
    session: "chieu",
  })
  assert.deepStrictEqual(slots, [{ date: "03/07/2026", session: "chieu" }])
})

test("leaveRequestSlots - findSlotConflict ignores cancelled", () => {
  const existing = [
    {
      id: "XN1",
      employeeId: "NV001",
      status: "cancelled",
      category: "leave",
      scope: "half_session",
      startDate: "03/07/2026",
      session: "sang",
    },
    {
      id: "XN2",
      employeeId: "NV001",
      status: "pending",
      category: "leave",
      scope: "half_session",
      startDate: "04/07/2026",
      session: "sang",
    },
  ]
  const newSlots = [{ date: "03/07/2026", session: "sang" }]
  assert.strictEqual(findSlotConflict("NV001", newSlots, existing), null)

  const conflict = findSlotConflict("NV001", [{ date: "04/07/2026", session: "sang" }], existing)
  assert.ok(conflict)
  assert.strictEqual(conflict.existing.id, "XN2")
})

test("leaveRequestSlots - getApprovedLeaveForDate", () => {
  const requests = [
    {
      employeeId: "NV007",
      status: "approved",
      category: "leave",
      scope: "full_day",
      startDate: "30/06/2026",
      reason: "Bù 4h cuối tuần",
    },
    {
      employeeId: "NV007",
      status: "approved",
      category: "leave",
      scope: "half_session",
      startDate: "01/07/2026",
      session: "sang",
      reason: "Đi khám",
    },
  ]
  const full = getApprovedLeaveForDate("NV007", "30/06/2026", requests)
  assert.strictEqual(full.sang, "Bù 4h cuối tuần")
  assert.strictEqual(full.chieu, "Bù 4h cuối tuần")

  const half = getApprovedLeaveForDate("NV007", "01/07/2026", requests)
  assert.strictEqual(half.sang, "Đi khám")
  assert.strictEqual(half.chieu, null)
})
