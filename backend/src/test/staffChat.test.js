import { test } from "node:test"
import assert from "node:assert"
import {
  buildParticipantKey,
  getOrCreateConversation,
  sendMessage,
  markThreadRead,
  getUnreadCount,
  getThreadMessages,
  isOnline,
  getRoster,
} from "../services/staffChat.service.js"
import * as convRepo from "../repositories/chatConversation.repository.js"
import * as msgRepo from "../repositories/chatMessage.repository.js"
import * as readRepo from "../repositories/chatReadState.repository.js"
import * as empRepo from "../repositories/employee.repository.js"

const userNV001 = { employeeId: "NV001", branchId: "branch-hcm", roleId: "role-user" }
const userNV002 = { employeeId: "NV002", branchId: "branch-hcm", roleId: "role-user" }

function ensureEmployee(id, name) {
  if (empRepo.getById(id)) return
  empRepo.create({
    id,
    name,
    email: `${id.toLowerCase()}@dudi.vn`,
    phone: "0900000000",
    department: "Kỹ thuật",
    position: "Nhân viên",
    status: "active",
    branchId: "branch-hcm",
  })
}

ensureEmployee("NV001", "Trần Thị Bích Liên")
ensureEmployee("NV002", "Nguyễn Văn Minh")
ensureEmployee("NV004", "Phạm Đức Thành")
ensureEmployee("NV005", "Hoàng Thị Mai")

test("staffChat - buildParticipantKey is stable", () => {
  assert.strictEqual(buildParticipantKey("NV002", "NV001"), "NV001|NV002")
  assert.strictEqual(buildParticipantKey("NV001", "NV002"), "NV001|NV002")
})

test("staffChat - getOrCreateConversation does not duplicate", () => {
  const key = buildParticipantKey("NV001", "NV004")
  const before = convRepo.getByParticipantKey(key)
  const conv1 = getOrCreateConversation("NV001", "NV004")
  const conv2 = getOrCreateConversation("NV001", "NV004")
  assert.strictEqual(conv1.id, conv2.id)
  if (!before) {
    msgRepo.getByConversation(conv1.id).forEach(() => {})
  }
})

test("staffChat - send increments unread for recipient", () => {
  const peerId = "NV004"
  const key = buildParticipantKey("NV001", peerId)
  let conv = convRepo.getByParticipantKey(key)
  if (!conv) conv = getOrCreateConversation("NV001", peerId)

  const sent = sendMessage(userNV001, peerId, "Xin chào test unread")
  assert.ok(sent.message)
  assert.strictEqual(sent.message.from, "me")

  const unreadForB = msgRepo.countUnreadFor(
    conv.id,
    peerId,
    readRepo.getForConversation(conv.id, peerId)?.lastReadAt ?? null
  )
  assert.ok(unreadForB >= 1)

  const unreadForA = msgRepo.countUnreadFor(
    conv.id,
    "NV001",
    readRepo.getForConversation(conv.id, "NV001")?.lastReadAt ?? null
  )
  assert.strictEqual(unreadForA, 0)
})

test("staffChat - markThreadRead clears unread", () => {
  getOrCreateConversation("NV001", "NV002")
  sendMessage(userNV002, "NV001", "Ping để có hội thoại")

  const result = markThreadRead(userNV002, "NV001")
  assert.ok(result.conversationId)
  assert.strictEqual(result.unreadCount, 0)

  const thread = getThreadMessages(userNV002, "NV001")
  assert.ok(Array.isArray(thread.messages))
})

test("staffChat - cannot chat with self", () => {
  const result = sendMessage(userNV001, "NV001", "hello")
  assert.strictEqual(result.error, "Không thể chat với chính mình")
})

test("staffChat - isOnline respects threshold", () => {
  const now = Date.now()
  assert.strictEqual(isOnline({ lastSeenAt: new Date(now - 30_000).toISOString(), status: "online" }, now), true)
  assert.strictEqual(isOnline({ lastSeenAt: new Date(now - 30_000).toISOString(), status: "offline" }, now), false)
  assert.strictEqual(isOnline({ lastSeenAt: new Date(now - 120_000).toISOString(), status: "online" }, now), false)
})

test("staffChat - staff cannot chat cross-branch", () => {
  empRepo.create({
    id: "NV_BRANCH_B",
    name: "NV Chi nhánh B",
    email: "branchb@dudi.vn",
    phone: "0900000099",
    department: "KD",
    position: "NV",
    status: "active",
    branchId: "branch-hn",
  })

  const result = sendMessage(userNV001, "NV_BRANCH_B", "hello")
  assert.strictEqual(result.error, "Chỉ được nhắn tin với nhân viên cùng chi nhánh")
})

test("staffChat - roster scope=all only returns same branch for staff", () => {
  empRepo.create({
    id: "NV_HN_ONLY",
    name: "NV Hà Nội",
    email: "hnonly@dudi.vn",
    phone: "0900000001",
    department: "KD",
    position: "NV",
    status: "active",
    branchId: "branch-hn",
  })

  const result = getRoster(userNV001, "", { scope: "all" })
  assert.strictEqual(result.rosterScope, "branch")
  assert.ok(!result.items.some(i => i.id === "NV_HN_ONLY"))
  assert.ok(result.items.some(i => i.id === "NV002"))
})

test("staffChat - getUnreadCount for NV001 with seed conversations", () => {
  convRepo.create({
    id: "CONV_TEST_UNREAD",
    type: "direct",
    participantIds: ["NV001", "NV005"],
    participantKey: "NV001|NV005",
    lastMessage: "test",
    lastMessageAt: new Date().toISOString(),
    lastSenderId: "NV005",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  msgRepo.create({
    id: "MSG_TEST_UNREAD",
    conversationId: "CONV_TEST_UNREAD",
    senderId: "NV005",
    body: "Chưa đọc",
    type: "text",
    createdAt: new Date().toISOString(),
  })

  const result = getUnreadCount(userNV001)
  assert.ok(result.totalUnread >= 1)
})
