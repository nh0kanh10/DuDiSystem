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


export type LeadStatus = "new" | "contacted" | "requirement-gathering" | "requirement-done" | "quoted" | "contracted" | "converted" | "lost"
export type FormStatus = "not_sent" | "sent" | "opened" | "in_progress" | "completed"
export type FormType = "landing_page" | "ecommerce" | "company_profile"
export type CustomerType = "individual" | "company"
export type TaskCategory = "CODE" | "CONTENT" | "OPS" | "DESIGN" | "TEST" | "ADMIN"

export interface LeadNote {
  id: string
  content: string
  createdAt: string
  updatedAt?: string
  createdBy?: string
}

export interface Customer {
  id: string
  code: string
  displayName: string
  customerType?: CustomerType
  companyName?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  address?: string
  taxId?: string
  industry?: string
  leadIds?: string[]
  sourceCrmIds?: string[]
  createdAt: string
  updatedAt: string
}

export interface Lead {
  id: string
  code: string
  name: string
  customerId?: string
  customerCode?: string
  customerDisplayName?: string
  status: LeadStatus
  sourceCrmId?: string
  customerType?: CustomerType
  companyName?: string
  contactName?: string
  industry?: string
  address?: string
  taxId?: string
  requirementFormPayload?: Record<string, unknown>
  requirementFormSubmissions?: RequirementFormSubmission[]
  lastFormCompletedAt?: string
  activeRequirementTitle?: string
  projectIds?: string[]
  contactPhone?: string
  contactEmail?: string
  budgetEstimate?: string
  roughNotes?: string
  assignedToId?: string
  assignedToName?: string
  requirementFormId?: string
  convertedProjectId?: string
  formType?: FormType
  formStatus?: FormStatus
  formSentAt?: string
  formOpenedAt?: string
  formCompletedAt?: string
  formDeadline?: string
  formToken?: string
  formLinkIssuedAt?: string
  formLinkRevokedAt?: string
  notes?: LeadNote[]
  createdAt: string
  updatedAt: string
}

export interface RequirementFormSubmission {
  id: string
  formType?: FormType
  title?: string
  kind?: "internal" | "form"
  payload: Record<string, unknown>
  completedAt: string
  sentAt?: string
  code?: string
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
  references?: string 
  additionalNotes?: string
  attachments?: ProjectAttachment[]
  createdAt: string
  lockedAt?: string
  
  // Common fields
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  company?: string
  industry?: string
  source?: string
  tax_id?: string
  address?: string
  goal?: string
  cta?: string
  kpi?: string
  target_audience?: string
  location?: string
  user_flow?: string
  structure?: string
  sections?: string
  has_register_form?: boolean
  has_call_button?: boolean
  has_chat?: boolean
  has_content?: boolean
  has_images?: boolean
  has_logo?: boolean
  brand_color?: string
  style?: string
  has_facebook_pixel?: boolean
  has_google_analytics?: boolean
  has_zalo_messenger?: boolean
  has_responsive?: boolean
  has_speed_optimized?: boolean
  has_seo?: boolean
  hosting_status?: string
  deadline?: string
  budget?: string
  priority?: string
  notes?: string
  
  // Landing page specific
  main_product?: string
  usp?: string
  offers?: string
  pricing?: string
  insight?: string
  
  // Ecommerce specific
  product_count?: string
  has_categories?: boolean
  has_variants?: boolean
  has_blog?: boolean
  top_features?: string
  has_cart?: boolean
  has_online_payment?: boolean
  has_quick_order?: boolean
  has_user_account?: boolean
  has_wishlist?: boolean
  has_coupon?: boolean
  payment_methods?: string
  has_order_tracking?: boolean
  has_order_status?: boolean
  has_order_email?: boolean
  order_handler?: string
  order_process?: string
  has_shipping_integration?: boolean
  has_admin?: boolean
  has_product_admin?: boolean
  has_order_admin?: boolean
  has_customer_admin?: boolean
  payment_integrations?: string
  shipping_integrations?: string
  
  // Company profile specific
  services?: string
  strengths?: string
  has_news?: boolean
  has_contact_form?: boolean
  has_google_maps?: boolean
  has_newsletter?: boolean
  has_content_admin?: boolean
  has_page_admin?: boolean
  has_multilingual?: boolean
}

export type ProjectVaultAudience = "client" | "internal"

export type ProjectVaultCategory =
  | "quotation"         
  | "requirement"       
  | "contract"          
  | "client-handover"   
  | "client-account"    
  | "client-file"       
  | "hosting"           
  | "domain"            
  | "credentials"       
  | "internal-handover" 
  | "tech-doc"          
  | "license"           
  | "assets"            
  | "other"             

export interface VaultFileAttachment {
  name: string
  size: number
  mimeType: string
  dataUrl?: string
  hasFile?: boolean
}

export interface ProjectVaultItem {
  id: string
  projectId: string
  audience: ProjectVaultAudience   
  category: ProjectVaultCategory
  name: string
  value?: string      
  url?: string
  description?: string
  meta?: Record<string, string>
  fileAttachment?: VaultFileAttachment
  hasFile?: boolean
  attachments?: ProjectAttachment[]
  createdAt: string
  updatedAt: string
  parentId?: string | null
  isAppendix?: boolean
}

export interface TestSession {
  id: string
  projectId: string
  version: string
  testDate: string
  testerId?: string
  testerName?: string
  testType: string
  bugsFound: number
  bugsPassed: number
  bugsRejected: number
  bugsReviewing: number
  bugsBillable: number
  confirmedById?: string
  confirmedByName?: string
  confirmedAt?: string
  handlingStatus: string
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
  customerId?: string
  requirementForm?: RequirementForm
  requirementForms?: RequirementForm[]
  vaultItems?: ProjectVaultItem[]
  bugs?: Bug[]
  testSessions?: TestSession[]
}

export interface TaskItem {
  id: string
  title: string
  taskDetail?: string
  description?: string
  assigneeId?: string
  assigneeName?: string
  assigneeDept?: string
  assignee?: string
  startDate?: string
  dueDate: string
  resourceUrl?: string
  notes?: string
  priority: "high" | "medium" | "low"
  status: "todo" | "in-progress" | "done"
  category?: TaskCategory
  projectId?: string
  parentId?: string
}

export type Page =
  | "dashboard" | "nhan-su" | "cham-cong" | "thong-ke"
  | "duyet-don" | "thong-bao" | "cong-viec" | "du-an" | "lead" 
  | "tai-khoan" | "phan-quyen" | "ip" | "tien-ich" | "co-cau"
  | "crm" | "kpi" | "kpi-stats" | "kpi-compare" | "staff-portal"
  | "user-profile" | "user-attendance" | "user-timeoff" | "user-directory"
  | "user-chat" | "user-workflow" | "user-settings" | "user-crm"
