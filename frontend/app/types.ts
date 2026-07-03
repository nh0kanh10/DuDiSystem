import React, { ReactNode } from "react"

export type Role = string

export interface RoleDefinition {
  id: string
  name: string
  isSystem: boolean
  modules: string[]
  scopeType?: "company" | "branch" | "self"
  roleType?: "management" | "staff" | "admin" | "manager"
}

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
  status: "active" | "inactive" | "suspended"
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
  status: "active" | "inactive" | "suspended"
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
  employeeStatus?: "staff" | "intern"
  checkIn: string
  checkOut: string
  checkInAm?: string
  checkOutAm?: string
  checkInPm?: string
  checkOutPm?: string
  statusAm?: string
  statusPm?: string
  noteAm?: string
  notePm?: string
  workingHours?: string
  autoFilled?: boolean
  date: string
  status: "on-time" | "late" | "absent" | "leave" | "early" | "late_early"
  note: string
}

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName?: string
  department?: string
  category: "leave" | "timeoff"
  leaveType: "annual" | "sick" | "personal" | "unpaid" | "timeoff"
  scope: "full_day" | "date_range" | "half_session" | "multi_session"
  startDate: string
  endDate?: string
  session?: "sang" | "chieu"
  sessions?: { date: string; session: "sang" | "chieu" }[]
  reason: string
  status: "pending" | "approved" | "rejected" | "cancelled"
  submittedAt: string
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


export type LeadStatus = "new" | "contacted" | "requirement-gathering" | "requirement-done" | "converted" | "lost"
export type TaskCategory = "CODE" | "CONTENT" | "OPS" | "DESIGN" | "TEST" | "ADMIN"

export interface Lead {
  id: string
  code: string
  name: string
  status: LeadStatus
  sourceCrmId?: string 
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  budgetEstimate?: string
  roughNotes?: string
  assignedToId?: string
  assignedToName?: string
  requirementFormId?: string
  convertedProjectId?: string
  createdAt: string
  updatedAt: string
}

export interface RequirementForm {
  id: string
  leadId: string
  code: string
  title: string
  isLocked: boolean 
  publicLink?: string
  projectType?: string 
  colorScheme?: string
  features?: string[]
  references?: string[] 
  additionalNotes?: string
  attachments?: ProjectAttachment[]
  createdAt: string
  lockedAt?: string
}

export interface ProjectVaultItem {
  id: string
  projectId: string
  category: "contract" | "hosting" | "domain" | "credentials" | "assets" | "other"
  name: string
  value?: string 
  url?: string
  description?: string
  attachments?: ProjectAttachment[]
  createdAt: string
  updatedAt: string
}

export interface Bug {
  id: string
  projectId: string
  title: string
  description?: string
  severity: "critical" | "high" | "medium" | "low"
  status: "open" | "in-progress" | "fixed" | "verified" | "closed"
  reportedById?: string
  reportedByName?: string
  assignedToId?: string
  attachments?: ProjectAttachment[]
  createdAt: string
  updatedAt: string
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
  leadId?: string
  requirementForm?: RequirementForm
  vaultItems?: ProjectVaultItem[]
  bugs?: Bug[]
}

export interface TaskItem {
  id: string
  title: string
  description?: string
  assignee: string
  dueDate: string
  priority: "high" | "medium" | "low"
  status: "todo" | "in-progress" | "done"
  category?: TaskCategory 
  projectId?: string
}

export type Page =
  | "dashboard" | "nhan-su" | "cham-cong" | "thong-ke"
  | "duyet-don" | "thong-bao" | "cong-viec" | "du-an" | "lead" 
  | "tai-khoan" | "phan-quyen" | "ip" | "tien-ich" | "co-cau"
  | "crm" | "staff-portal"
  | "user-profile" | "user-attendance" | "user-timeoff" | "user-directory"
  | "user-chat" | "user-workflow" | "user-settings" | "user-crm"
