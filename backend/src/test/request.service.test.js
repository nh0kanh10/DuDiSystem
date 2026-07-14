import { test } from "node:test"
import assert from "node:assert"
import { updateRequest, approveRequest } from "../services/request.service.js"
import * as repo from "../repositories/request.repository.js"

test("request.service - admin update pending half_session", () => {
  const created = repo.create({
    id: "XN_TEST01",
    employeeId: "NV001",
    category: "leave",
    leaveType: "annual",
    scope: "half_session",
    startDate: "10/07/2026",
    session: "sang",
    reason: "Khám bệnh",
    status: "pending",
    submittedAt: "01/07/2026",
  })

  const updated = updateRequest(created.id, {
    startDate: "13/07/2026",
    session: "chieu",
    reason: "Khám bệnh (đổi chiều)",
  }, { adminEdit: true })

  assert.ok(updated)
  assert.strictEqual(updated.error, undefined)
  assert.strictEqual(updated.startDate, "13/07/2026")
  assert.strictEqual(updated.session, "chieu")
  assert.strictEqual(updated.reason, "Khám bệnh (đổi chiều)")

  repo.remove(created.id)
})

test("request.service - cannot update approved request", () => {
  const created = repo.create({
    id: "XN_TEST02",
    employeeId: "NV002",
    category: "leave",
    leaveType: "annual",
    scope: "full_day",
    startDate: "15/07/2026",
    reason: "Nghỉ",
    status: "approved",
    submittedAt: "01/07/2026",
  })

  const result = updateRequest(created.id, { reason: "X" }, { adminEdit: true })
  assert.strictEqual(result.error, "Chỉ sửa được đơn đang chờ duyệt")

  repo.remove(created.id)
})
