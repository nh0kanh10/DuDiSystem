import { test } from "node:test"
import assert from "node:assert"
import {
  deriveOrgFields,
  buildOrgSnapshot,
  validateOrgNodePayload,
  syncEmployeeOrgFields,
} from "../utils/orgUtils.js"
import * as orgNodeRepo from "../repositories/orgNode.repository.js"
import { deleteOrgNode } from "../services/orgNode.service.js"
import { createAssignment } from "../services/assignment.service.js"
import * as empRepo from "../repositories/employee.repository.js"

const SAMPLE_NODES = [
  { id: "branch-hcm", name: "Chi nhánh TP.HCM", type: "branch", status: "active" },
  { id: "dept-tech", name: "Phòng Công nghệ", type: "department", parentId: "branch-hcm", status: "active" },
  { id: "sub-dev", name: "Bộ phận Phát triển phần mềm", type: "sub-department", parentId: "dept-tech", status: "active" },
  { id: "pos-dev-fe", name: "Frontend Developer", type: "position", parentId: "sub-dev", status: "active" },
]

function ensureSampleOrgTree() {
  for (const n of SAMPLE_NODES) {
    if (!orgNodeRepo.getById(n.id)) {
      orgNodeRepo.create({ ...n, code: n.id.toUpperCase(), createdDate: "01/01/2026" })
    }
  }
}

test("orgUtils - deriveOrgFields from position node", () => {
  const fields = deriveOrgFields("pos-dev-fe", SAMPLE_NODES)
  assert.strictEqual(fields.branchId, "branch-hcm")
  assert.strictEqual(fields.department, "Phòng Công nghệ")
  assert.strictEqual(fields.position, "Frontend Developer")
  assert.ok(fields.snapshot.includes("Chi nhánh TP.HCM"))
})

test("orgUtils - buildOrgSnapshot", () => {
  const snap = buildOrgSnapshot("pos-dev-fe", SAMPLE_NODES)
  assert.ok(snap.includes("Frontend Developer"))
  assert.ok(snap.includes("Phòng Công nghệ"))
})

test("orgUtils - validate rejects invalid parent type", () => {
  const err = validateOrgNodePayload(
    { type: "department", name: "X", code: "X-UNIQ", parentId: "sub-dev" },
    SAMPLE_NODES
  )
  assert.ok(err)
})

test("orgUtils - syncEmployeeOrgFields", () => {
  const synced = syncEmployeeOrgFields({}, "pos-dev-fe", SAMPLE_NODES)
  assert.strictEqual(synced.branchId, "branch-hcm")
  assert.strictEqual(synced.department, "Phòng Công nghệ")
  assert.strictEqual(synced.position, "Frontend Developer")
})

test("orgNode service - delete rehomes employees", () => {
  ensureSampleOrgTree()
  const testId = `node-test-${Date.now()}`
  orgNodeRepo.create({
    id: testId,
    name: "Test Team",
    code: `TST-${Date.now()}`,
    type: "team",
    parentId: "pos-dev-fe",
    status: "active",
    createdDate: "01/01/2026",
  })

  const empId = `TST-EMP-${Date.now()}`
  empRepo.create({
    id: empId,
    name: "Test Org Employee",
    email: "test@dudi.vn",
    phone: "0900000001",
    department: "",
    position: "",
    status: "active",
    branchId: "",
    orgNodeId: testId,
  })

  const result = deleteOrgNode(testId)
  assert.ok(result)
  assert.ok(!orgNodeRepo.getById(testId))

  const emp = empRepo.getById(empId)
  assert.notStrictEqual(emp.orgNodeId, testId)
  assert.ok(emp.orgNodeId)

  empRepo.remove(empId)
})

test("assignment service - permanent syncs employee org fields", () => {
  ensureSampleOrgTree()
  const empId = `TST-ASG-${Date.now()}`
  empRepo.create({
    id: empId,
    name: "Assign Test",
    email: "asg@dudi.vn",
    phone: "0900000002",
    department: "Old",
    position: "Old",
    status: "active",
    branchId: "branch-hn",
    orgNodeId: "branch-hcm",
  })

  createAssignment({
    employeeId: empId,
    nodeId: "pos-dev-fe",
    type: "permanent",
    startDate: "2026-07-03",
  })

  const emp = empRepo.getById(empId)
  assert.strictEqual(emp.orgNodeId, "pos-dev-fe")
  assert.strictEqual(emp.branchId, "branch-hcm")
  assert.strictEqual(emp.department, "Phòng Công nghệ")
  assert.strictEqual(emp.position, "Frontend Developer")

  empRepo.remove(empId)
})
