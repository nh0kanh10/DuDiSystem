import React, { ReactNode } from "react"

export type Role = "admin" | "manager" | "user"

export type Page =
  | "dashboard" | "nhan-su" | "cham-cong" | "thong-ke"
  | "duyet-don" | "thong-bao" | "cong-viec"
  | "tai-khoan" | "ip" | "tien-ich" | "co-cau"
  | "user-profile" | "user-attendance" | "user-timeoff" | "user-directory"
  | "user-chat" | "user-workflow" | "user-settings"

export interface Employee {
  id: string; name: string; email: string; phone: string
  department: string; position: string; joinDate: string
  status: "active" | "inactive" | "intern"; contractType: string
  orgNodeId?: string;
  cccd?: string; cccdDate?: string; cccdPlace?: string;
  bankAccount?: string; bank?: string;
  dob?: string; gender?: string;
  curProvince?: string; curDistrict?: string; curWard?: string; curStreet?: string;
  homeProvince?: string; homeDistrict?: string; homeWard?: string; homeStreet?: string;
  internEndDate?: string; university?: string; notes?: string; resignDate?: string;
}

export type OrgNodeType = "branch" | "department" | "sub-department" | "position" | "team";

export interface OrgNode {
  id: string;
  name: string;
  code: string;
  type: OrgNodeType;
  parentId?: string;
  managerId?: string;
  managerTitle?: string;
  memberCount: number;
  status: "active" | "inactive";
  createdDate?: string;
}

export interface Assignment {
  id: string;
  employeeId: string;
  nodeId: string;
  type: "permanent" | "temporary";
  startDate: string;
  endDate?: string;
  status: "active" | "completed";
}

export interface EmpExtForm {
  name: string; email: string; phone: string; department: string
  position: string; joinDate: string; status: "active" | "inactive" | "intern"; contractType: string
  cccd: string; cccdDate: string; cccdPlace: string
  bankAccount: string; bank: string; dob: string; gender: string
  curProvince: string; curDistrict: string; curWard: string; curStreet: string
  homeProvince: string; homeDistrict: string; homeWard: string; homeStreet: string
  workHistory: { id: number; fromDate: string; toDate: string; title: string }[]
  internEndDate: string; university: string; notes: string; resignDate: string
}

export interface AttendanceRecord {
  id: string; employeeId: string; employeeName: string; department: string
  checkIn: string; checkOut: string; date: string
  status: "on-time" | "late" | "absent" | "leave"; note: string
}

export interface LeaveRequest {
  id: string; employeeName: string; department: string
  startDate: string; endDate: string; reason: string
  status: "pending" | "approved" | "rejected" | "cancelled"; submittedAt: string
}

export interface TaskItem {
  id: string; title: string; assignee: string; dueDate: string
  priority: "high" | "medium" | "low"; status: "todo" | "in-progress" | "done"
}

export type TOStatus = "approved" | "pending" | "rejected" | "cancelled"
export interface TimeOffSlot { 
  id: string; 
  empId: string; 
  empName: string; 
  empCode: string; 
  department: string; 
  day: number; 
  session: "sang" | "chieu"; 
  reason: string; 
  status: TOStatus; 
  week: string; 
  registeredAt: string; 
  adminNote: string; 
  processedAt: string 
}
