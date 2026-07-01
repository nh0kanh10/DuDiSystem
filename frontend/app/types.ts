import React, { ReactNode } from "react"

export type Role = string

export interface RoleDefinition {
  id: string
  name: string
  isSystem: boolean
  modules: string[]
  scopeType?: "company" | "branch" | "self"
  roleType?: "management" | "staff"
}

export type Page =
  | "dashboard" | "nhan-su" | "cham-cong" | "thong-ke"
  | "duyet-don" | "thong-bao" | "cong-viec" | "du-an"
  | "tai-khoan" | "phan-quyen" | "ip" | "tien-ich" | "co-cau"
  | "user-profile" | "user-attendance" | "user-timeoff" | "user-directory"
  | "user-chat" | "user-workflow" | "user-settings"

export type WorkHistoryType = "join" | "resign" | "rehire" | "transfer" | "promotion"

export interface WorkHistoryEntry {
  id: number
  type: WorkHistoryType
  date: string
  toDate?: string
  title: string
  orgNodeId?: string
  snapshot?: string
  note?: string
}

export interface Attachment {
  id: number
  name: string
  url: string
  type: "file" | "link"
  uploadedAt: string
}

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  department: string
  position: string
  joinDate: string
  status: "active" | "inactive" | "intern"
  contractType: string
  branchId?: string
  orgNodeId?: string
  cccd?: string
  cccdDate?: string
  cccdPlace?: string
  bankAccount?: string
  bank?: string
  dob?: string
  gender?: string
  curProvince?: string
  curDistrict?: string
  curWard?: string
  curStreet?: string
  homeProvince?: string
  homeDistrict?: string
  homeWard?: string
  homeStreet?: string
  photos?: string[]
  attachments?: Attachment[]
  workHistory?: WorkHistoryEntry[]
  internEndDate?: string
  university?: string
  notes?: string
  resignDate?: string
}

export type OrgNodeType = "branch" | "department" | "sub-department" | "position" | "team"

export interface OrgNode {
  id: string
  name: string
  code: string
  type: OrgNodeType
  parentId?: string
  managerId?: string
  managerTitle?: string
  memberCount: number
  status: "active" | "inactive"
  createdDate?: string
}

export interface Assignment {
  id: string
  employeeId: string
  nodeId: string
  type: "permanent" | "temporary"
  startDate: string
  endDate?: string
  status: "active" | "completed"
}

export interface EmpExtForm {
  name: string
  email: string
  phone: string
  department: string
  position: string
  positionId?: string
  joinDate: string
  status: "active" | "inactive" | "intern"
  contractType: string
  branchId: string
  orgNodeId: string
  cccd: string
  cccdDate: string
  cccdPlace: string
  bankAccount: string
  bank: string
  dob: string
  gender: string
  curProvince: string
  curDistrict: string
  curWard: string
  curStreet: string
  homeProvince: string
  homeDistrict: string
  homeWard: string
  homeStreet: string
  photos: string[]
  attachments: Attachment[]
  workHistory: WorkHistoryEntry[]
  internEndDate: string
  university: string
  notes: string
  resignDate: string
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  department: string
  employeeStatus?: "active" | "inactive" | "intern"
  checkIn: string
  checkOut: string
  checkInAm?: string
  checkOutAm?: string
  checkInPm?: string
  checkOutPm?: string
  statusAm?: string
  statusPm?: string
  workingHours?: string
  autoFilled?: boolean
  date: string
  status: "on-time" | "late" | "absent" | "leave" | "early" | "late_early"
  note: string
}

export interface LeaveRequest {
  id: string
  employeeName: string
  department: string
  startDate: string
  endDate: string
  reason: string
  status: "pending" | "approved" | "rejected" | "cancelled"
  submittedAt: string
}

export interface TaskItem {
  id: string
  title: string
  description?: string
  assignee: string
  dueDate: string
  priority: "high" | "medium" | "low"
  status: "todo" | "in-progress" | "done"
}

export type ProjectStatus = "planning" | "active" | "on-hold" | "completed"

export interface ProjectAttachment {
  id: string
  name: string
  url: string
  type: "file" | "link"
  uploadedAt: string
  size?: string
}

export interface ProjectTeam {
  id: string
  name: string
  leaderId: string
  memberIds: string[]
  description?: string
  createdAt: string
}

export interface Project {
  id: string
  name: string
  code: string
  description: string
  status: ProjectStatus
  startDate: string
  endDate: string
  managerId: string
  managerName?: string
  memberIds: string[]
  progress: number
  taskCount?: number
  doneCount?: number
  attachments: ProjectAttachment[]
  teams: ProjectTeam[]
  createdAt: string
}

export interface Group {
  id: string
  name: string
  leaderId: string
  leaderName?: string
  memberIds: string[]
  memberCount?: number
  description?: string
  createdAt: string
}

export type AnnouncementType     = "info" | "warning" | "event" | "urgent"
export type AnnouncementStatus   = "active" | "scheduled" | "expired"
export type AnnouncementPriority = "low" | "medium" | "high"

export interface Announcement {
  id: string
  title: string
  type: AnnouncementType
  content: string
  priority: AnnouncementPriority
  startTime: string
  endTime: string
  status: AnnouncementStatus
  createdAt: string
}

export type TOStatus = "approved" | "pending" | "rejected" | "cancelled"

export interface TimeOffSlot {
  id: string
  empId: string
  empName: string
  empCode: string
  department: string
  day: number
  session: "sang" | "chieu"
  reason: string
  status: TOStatus
  week: string
  registeredAt: string
  adminNote: string
  processedAt: string
}
