import { touchSession } from "./session"
import { resolveApiBase } from "./apiBase"
import { contractDownloadName, quoteDownloadName } from "../app/utils/filename"

const BASE = resolveApiBase()

export async function detectPublicIP(): Promise<string> {
  try {
    const res = await fetch("https://api.ipify.org?format=json")
    const json = (await res.json()) as { ip?: string }
    return (json.ip || "").trim()
  } catch {
    return ""
  }
}


function token() {
  return localStorage.getItem("dudi_token") ?? ""
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    const text = await res.text()
    let json: Record<string, unknown> = {}
    try { json = text ? JSON.parse(text) as Record<string, unknown> : {} } catch { /* ignore */ }
    if (path.startsWith("/auth/login")) {
      const msg = json.message ?? json.error
      throw new Error(typeof msg === "string" ? msg : "Mã đăng nhập hoặc mật khẩu không đúng")
    }
    localStorage.removeItem("dudi_token")
    localStorage.removeItem("dudi_user")
    window.dispatchEvent(new Event("dudi_unauthorized"))
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
  }
  const text = await res.text()
  let json: Record<string, unknown> = {}
  if (text) {
    try {
      json = JSON.parse(text) as Record<string, unknown>
    } catch {
      throw new Error(
        res.ok
          ? "Phản hồi server không hợp lệ"
          : `Không kết nối được API (${res.status}). Kiểm tra backend Render đang chạy.`,
      )
    }
  }
  if (!res.ok) {
    const msg = json.message ?? json.error
    throw new Error(
      typeof msg === "string" && msg.trim()
        ? msg
        : `Lỗi server (${res.status})`,
    )
  }
  if (!path.startsWith("/auth/")) touchSession()
  return json.data as T
}

function qs(params?: Record<string, string | undefined>) {
  if (!params) return ""
  const p = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "" && v !== "all")
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join("&")
  return p ? `?${p}` : ""
}

export interface ChatMessageDto {
  id: string
  conversationId?: string
  senderId?: string
  from: "me" | "them"
  body: string
  type?: string
  createdAt: string
}

export interface ChatRosterItem {
  id: string
  name: string
  department: string
  position: string
  photos?: string[]
  online: boolean
  unread: number
  lastMessage: string
  lastMessageAt: string | null
  conversationId: string | null
}

export interface StaffChatRosterResponse {
  items: ChatRosterItem[]
  onlineCount: number
  total: number
  rosterScope?: "branch" | "company"
}

export interface StaffChatConversationItem {
  id: string
  peerId: string
  peer: ChatRosterItem | null
  lastMessage: string
  lastMessageAt: string | null
  unreadCount: number
}

export interface StaffChatConversationsResponse {
  items: StaffChatConversationItem[]
  totalUnread: number
}

export interface StaffChatThreadResponse {
  conversationId: string | null
  peerId: string
  peer: ChatRosterItem | null
  messages: ChatMessageDto[]
  hasMore: boolean
}

export interface ChatOnlineEmployee {
  id: string
  name: string
  department: string
  position: string
  branchId: string
  online: boolean
}

export interface StaffChatOnlineResponse {
  onlineCount: number
  onlineIds: string[]
  onlineEmployees: ChatOnlineEmployee[]
  rosterScope?: "branch" | "company"
}

export const api = {
  auth: {
    login: (loginId: string, password: string) =>
      req<{ token: string; user: Record<string, unknown> }>("POST", "/auth/login", { loginKey: loginId, password }),
    me: () => req<any>("GET", "/auth/me"),
    refresh: () => req<{ token: string }>("POST", "/auth/refresh"),
    changePassword: (oldPassword: string, newPassword: string) =>
      req<any>("POST", "/auth/change-password", { oldPassword, newPassword }),
  },
  storage: {
    upload: async (file: File): Promise<{ key: string; url: string; name: string }> => {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`${BASE}/storage/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: form,
      })
      const json = await res.json() as any
      if (!res.ok || !json.success) throw new Error(json.error || "Upload file thất bại")
      touchSession()
      return json.data
    },
    downloadUrl: (key: string) => `${BASE}/storage/download?key=${encodeURIComponent(key)}`,
  },
  users: {
    list: (params?: { includeCoreAdmins?: boolean }) => req<any[]>("GET", `/users${qs(params as any)}`),
    create: (data: any) => req<any>("POST", "/users", data),
    update: (id: string, data: any) => req<any>("PATCH", `/users/${id}`, data),
    updateAdmin: (id: string, data: any) => req<any>("PATCH", `/users/admin/${id}`, data),
    toggleStatus: (id: string) => req<any>("POST", `/users/${id}/toggle-status`),
    resetPassword: (id: string) => req<any>("POST", `/users/${id}/reset-password`),
    delete: (id: string) => req<any>("DELETE", `/users/${id}`),
  },
  roles: {
    list: () => req<any[]>("GET", "/roles"),
    create: (data: any) => req<any>("POST", "/roles", data),
    update: (id: string, data: any) => req<any>("PUT", `/roles/${id}`, data),
    delete: (id: string) => req<any>("DELETE", `/roles/${id}`),
  },


  employees: {
    list: (params?: { status?: string; department?: string; q?: string; includeCoreAdmins?: boolean }) =>
      req<unknown[]>("GET", `/employees${qs(params as any)}`),
    getById: (id: string) => req<unknown>("GET", `/employees/${id}`),
    create: (data: unknown) => req<unknown>("POST", "/employees", data),
    update: (id: string, data: unknown) => req<unknown>("PUT", `/employees/${id}`, data),
    delete: (id: string) => req<unknown>("DELETE", `/employees/${id}`),
  },

  orgNodes: {
    list: (params?: { type?: string; status?: string }) =>
      req<unknown[]>("GET", `/org-nodes${qs(params)}`),
    create: (data: unknown) => req<unknown>("POST", "/org-nodes", data),
    update: (id: string, data: unknown) => req<unknown>("PUT", `/org-nodes/${id}`, data),
    changeStatus: (id: string, status: string) =>
      req<unknown>("PATCH", `/org-nodes/${id}/status`, { status }),
    delete: (id: string) => req<unknown>("DELETE", `/org-nodes/${id}`),
  },

  assignments: {
    list: (params?: { employeeId?: string; nodeId?: string; status?: string }) =>
      req<unknown[]>("GET", `/assignments${qs(params)}`),
    create: (data: unknown) => req<unknown>("POST", "/assignments", data),
    cancel: (id: string) => req<unknown>("PATCH", `/assignments/${id}/cancel`),
  },

  attendance: {
    list: (params?: {
      date?: string
      startDate?: string
      endDate?: string
      employeeId?: string
      status?: string
      department?: string
      branchId?: string
    }) => req<unknown[]>("GET", `/attendance${qs(params)}`),
    stats: (params?: {
      date?: string
      startDate?: string
      endDate?: string
      employeeId?: string
      status?: string
      department?: string
      branchId?: string
    }) =>
      req<{ onTime: number; late: number; absent: number; leave: number; total: number }>(
        "GET", `/attendance/stats${qs(params)}`
      ),
    checkIP: (ip?: string) =>
      req<{ valid: boolean; ip: string; message: string }>(
        "GET",
        `/attendance/check-ip${qs({ ip })}`,
      ),
    create: (data: unknown) => req<unknown>("POST", "/attendance", data),
    update: (id: string, data: unknown) => req<unknown>("PUT", `/attendance/${id}`, data),
    delete: (id: string) => req<unknown>("DELETE", `/attendance/${id}`),
  },

  requests: {
    list: (params?: { status?: string; category?: string; employeeId?: string }) =>
      req<unknown[]>("GET", `/requests${qs(params)}`),
    create: (data: unknown) => req<unknown>("POST", "/requests", data),
    update: (id: string, data: unknown) => req<unknown>("PUT", `/requests/${id}`, data),
    approve: (id: string) => req<unknown>("PATCH", `/requests/${id}/approve`),
    approveBulk: (ids: string[]) => req<unknown>("POST", "/requests/approve-bulk", { ids }),
    reject: (id: string) => req<unknown>("PATCH", `/requests/${id}/reject`),
    cancel: (id: string, employeeId?: string) =>
      req<unknown>("PATCH", `/requests/${id}/cancel`, employeeId ? { employeeId } : undefined),
    delete: (id: string) => req<unknown>("DELETE", `/requests/${id}`),
  },

  projects: {
    list: (params?: { status?: string; q?: string; managerId?: string; leadId?: string }) =>
      req<unknown[]>("GET", `/projects${qs(params)}`),
    getById: (id: string) => req<unknown>("GET", `/projects/${id}`),
    create: (data: unknown) => req<unknown>("POST", "/projects", data),
    update: (id: string, data: unknown) => req<unknown>("PUT", `/projects/${id}`, data),
    delete: (id: string) => req<unknown>("DELETE", `/projects/${id}`),
    addAttachment: (id: string, data: unknown) => req<unknown>("POST", `/projects/${id}/attachments`, data),
    removeAttachment: (id: string, attachmentId: string) =>
      req<unknown>("DELETE", `/projects/${id}/attachments/${attachmentId}`),
    addTeam: (id: string, data: unknown) => req<unknown>("POST", `/projects/${id}/teams`, data),
    updateTeam: (id: string, teamId: string, data: unknown) => req<unknown>("PUT", `/projects/${id}/teams/${teamId}`, data),
    removeTeam: (id: string, teamId: string) => req<unknown>("DELETE", `/projects/${id}/teams/${teamId}`),
    listVault: (projectId: string) =>
      req<import("../app/types").ProjectVaultItem[]>("GET", `/projects/${encodeURIComponent(projectId)}/vault`),
    createVaultItem: async (
      projectId: string,
      body: Record<string, unknown>,
      file?: File,
    ) => vaultMultipart<import("../app/types").ProjectVaultItem>(
      "POST",
      `/projects/${encodeURIComponent(projectId)}/vault`,
      body,
      file,
    ),
    updateVaultItem: async (
      projectId: string,
      itemId: string,
      body: Record<string, unknown>,
      file?: File,
    ) => vaultMultipart<import("../app/types").ProjectVaultItem>(
      "PUT",
      `/projects/${encodeURIComponent(projectId)}/vault/${encodeURIComponent(itemId)}`,
      body,
      file,
    ),
    deleteVaultItem: (projectId: string, itemId: string) =>
      req<{ message: string }>("DELETE", `/projects/${encodeURIComponent(projectId)}/vault/${encodeURIComponent(itemId)}`),
    downloadVaultFile: (projectId: string, itemId: string, filename: string) =>
      downloadBlob(
        `/projects/${encodeURIComponent(projectId)}/vault/${encodeURIComponent(itemId)}/file`,
        undefined,
        filename,
        "GET",
      ),
    vaultFileBlob: (projectId: string, itemId: string) =>
      fetchAuthBlob(`/projects/${encodeURIComponent(projectId)}/vault/${encodeURIComponent(itemId)}/file`, { method: "GET" }),
  },

  groups: {
    list: () => req<unknown[]>("GET", "/groups"),
    create: (data: unknown) => req<unknown>("POST", "/groups", data),
    update: (id: string, data: unknown) => req<unknown>("PUT", `/groups/${id}`, data),
    delete: (id: string) => req<unknown>("DELETE", `/groups/${id}`),
  },

  announcements: {
    list:   ()                          => req<unknown[]>("GET", "/announcements"),
    stats:  ()                          => req<unknown>("GET", "/announcements/stats"),
    create: (data: unknown)             => req<unknown>("POST", "/announcements", data),
    update: (id: string, data: unknown) => req<unknown>("PUT", `/announcements/${id}`, data),
    delete: (id: string)                => req<unknown>("DELETE", `/announcements/${id}`),
  },

  tasks: {
    list: (params?: { status?: string; priority?: string; assigneeId?: string; projectId?: string }) =>
      req<unknown[]>("GET", `/tasks${qs(params)}`),
    create: (data: unknown) => req<unknown>("POST", "/tasks", data),
    update: (id: string, data: unknown) => req<unknown>("PUT", `/tasks/${id}`, data),
    delete: (id: string) => req<unknown>("DELETE", `/tasks/${id}`),
  },

  notifications: {
    list: (params?: { read?: string }) =>
      req<unknown[]>("GET", `/notifications${qs(params)}`),
    create: (data: unknown) => req<unknown>("POST", "/notifications", data),
    markRead: (id: string) => req<unknown>("PATCH", `/notifications/${id}/read`),
    markAllRead: () => req<unknown>("PATCH", "/notifications/read-all"),
    delete: (id: string) => req<unknown>("DELETE", `/notifications/${id}`),
  },

  dashboard: {
    stats: () =>
      req<{
        totalEmployees: number
        activeEmployees: number
        internEmployees: number
        attendance: { onTime: number; late: number; absent: number; leave: number }
        pendingRequests: number
        unreadNotifications: number
      }>("GET", "/dashboard/stats"),
  },
  allowedIPs: {
    list: (params?: { orgNodeId?: string }) => req<any[]>("GET", `/allowed-ips${qs(params)}`),
    create: (data: { ip: string; description: string; orgNodeId?: string }) => req<any>("POST", "/allowed-ips", data),
    update: (id: string, data: { ip: string; description: string; orgNodeId?: string | null }) => req<any>("PUT", `/allowed-ips/${id}`, data),
    toggle: (id: string) => req<any>("POST", `/allowed-ips/${id}/toggle`),
    delete: (id: string) => req<any>("DELETE", `/allowed-ips/${id}`),
  },

  timeOffSlots: {
    list: (params?: { week?: string }) => req<any[]>("GET", `/time-off-slots${qs(params)}`),
    create: (data: any) => req<any>("POST", "/time-off-slots", data),
    approve: (id: string, note?: string) => req<any>("PATCH", `/time-off-slots/${id}/approve`, { note }),
    reject: (id: string, note?: string) => req<any>("PATCH", `/time-off-slots/${id}/reject`, { note }),
    approveAll: (week: string) => req<any>("POST", "/time-off-slots/approve-all", { week }),
  },
  systemConfig: {
    get: () => req<any>("GET", "/system-config"),
    update: (data: any) => req<any>("PUT", "/system-config", data),
  },
  crm: {
    // Admin
    listData: (params?: Record<string, any>) => req<any>("GET", `/crm/data${qs(params)}`),
    createData: (data: any) => req<any>("POST", "/crm/data", data),
    updateData: (id: string, data: any) => req<any>("PUT", `/crm/data/${id}`, data),
    deleteData: (id: string) => req<any>("DELETE", `/crm/data/${id}`),
    deleteBulk: (ids: string[]) => req<any>("POST", "/crm/data/delete-bulk", { ids }),
    importCsv: (file: File) => {
      const form = new FormData()
      form.append("file", file)
      return fetch(`${BASE}/crm/data/import-csv`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: form,
      }).then(r => r.json()).then(j => j.data)
    },
    autoAssign: (employeeIds: string[]) => req<any>("POST", "/crm/data/auto-assign", { employeeIds }),
    assignOne: (dataId: string, employeeId: string) => req<any>("POST", "/crm/assignments/assign", { dataId, employeeId }),
    assignBulk: (dataIds: string[], employeeId: string) => req<any>("POST", "/crm/assignments/assign-bulk", { dataIds, employeeId }),
    adminDashboard: () => req<any>("GET", "/crm/dashboard/admin"),
    convertToLead: (id: string, body: { leadName: string; forceNew?: boolean }) =>
      req<{ lead: import("../app/types").Lead; record: Record<string, unknown>; customer?: import("../app/types").Customer; alreadyExists: boolean }>(
        "POST",
        `/crm/data/${encodeURIComponent(id)}/convert-to-lead`,
        body,
      ),
    listLeadsForCrm: (id: string) =>
      req<{ leads: { id: string; code: string; name: string; status?: string }[] }>(
        "GET",
        `/crm/data/${encodeURIComponent(id)}/leads`,
      ),
    convertToLeadEmployee: (id: string, body: { leadName: string; forceNew?: boolean }) =>
      req<{ lead: import("../app/types").Lead; record: Record<string, unknown>; customer?: import("../app/types").Customer; alreadyExists: boolean }>(
        "POST",
        `/crm/employee/data/${encodeURIComponent(id)}/convert-to-lead`,
        body,
      ),
    updateNote: (id: string, note: string) => req<any>("PATCH", `/crm/data/${id}/note`, { note }),
    // Employee
    listMyData: (params?: Record<string, any>) => req<any>("GET", `/crm/employee/data${qs(params)}`),
    updateMyStatus: (id: string, status: string) => req<any>("PATCH", `/crm/employee/data/${id}/status`, { status }),
    employeeDashboard: () => req<any>("GET", "/crm/dashboard/employee"),
  },
  positions: {
    list: (params?: Record<string, string | undefined>) => req<any[]>("GET", `/positions${qs(params)}`),
    getById: (id: string) => req<any>("GET", `/positions/${id}`),
    create: (data: any) => req<any>("POST", "/positions", data),
    update: (id: string, data: any) => req<any>("PUT", `/positions/${id}`, data),
    delete: (id: string) => req<any>("DELETE", `/positions/${id}`),
  },
  profileUpdates: {
    list: (params?: { employeeId?: string; status?: string }) => req<any[]>("GET", `/profile-updates${qs(params)}`),
    request: (employeeId: string, note?: string) => req<any>("POST", "/profile-updates/request", { employeeId, note }),
    submitDraft: (id: string, pendingData: any) => req<any>("PUT", `/profile-updates/${id}/submit`, { pendingData }),
    approve: (id: string) => req<any>("PUT", `/profile-updates/${id}/approve`),
    reject: (id: string, reworkReason: string) => req<any>("PUT", `/profile-updates/${id}/reject`, { reworkReason }),
  },

  staffChat: {
    roster: (q?: string, scope?: "conversations" | "all") => {
      const parts: string[] = []
      if (q?.trim()) parts.push(`q=${encodeURIComponent(q.trim())}`)
      if (scope === "all") parts.push("scope=all")
      const query = parts.length ? `?${parts.join("&")}` : ""
      return req<StaffChatRosterResponse>("GET", `/staff-chat/roster${query}`)
    },
    conversations: () =>
      req<StaffChatConversationsResponse>("GET", "/staff-chat/conversations"),
    openConversation: (peerId: string) =>
      req<StaffChatConversationItem>("POST", "/staff-chat/conversations", { peerId }),
    getThread: (peerId: string, params?: { before?: string; limit?: string }) =>
      req<StaffChatThreadResponse>("GET", `/staff-chat/thread/${peerId}/messages${qs(params)}`),
    sendMessage: (peerId: string, body: string) =>
      req<{ conversationId: string; message: ChatMessageDto }>("POST", `/staff-chat/thread/${peerId}/messages`, { body }),
    markRead: (peerId: string) =>
      req<{ conversationId: string | null; unreadCount: number }>("PATCH", `/staff-chat/thread/${peerId}/read`),
    unreadCount: () =>
      req<{ totalUnread: number }>("GET", "/staff-chat/unread-count"),
    heartbeat: () =>
      req<{ employeeId: string; online: boolean }>("POST", "/staff-chat/presence"),
    online: () =>
      req<StaffChatOnlineResponse>("GET", "/staff-chat/online"),
  },
  quotes: {
    sample: (template = "toeic") =>
      req<QuotePayload>("GET", `/quotes/sample?template=${encodeURIComponent(template)}`),
    parse: (text: string) => req<QuotePayload>("POST", "/quotes/parse", { text }),
    generateDocxBlob: (payload: QuotePayload) => fetchDocxBlob("/quotes/generate", payload),
    downloadDocx: (payload: QuotePayload) => downloadBlob("/quotes/generate", payload, quoteDownloadName(payload.project)),
  },
  contracts: {
    generateDocxBlob: (payload: ContractPayload) => fetchDocxBlob("/contracts/generate", payload),
  },
  leadDocuments: {
    list: (leadId: string, type?: "quote" | "contract") =>
      req<LeadDocumentRecord[]>("GET", `/leads/${encodeURIComponent(leadId)}/documents${type ? `?type=${type}` : ""}`),
    latest: (leadId: string, type: "quote" | "contract" = "quote") =>
      req<LeadDocumentRecord | null>("GET", `/leads/${encodeURIComponent(leadId)}/documents/latest?type=${type}`),
    save: (leadId: string, body: { type: "quote" | "contract"; payload: QuotePayload | ContractPayload; label?: string }) =>
      req<LeadDocumentRecord>("POST", `/leads/${encodeURIComponent(leadId)}/documents`, body),
    get: (leadId: string, docId: string) =>
      req<LeadDocumentRecord>("GET", `/leads/${encodeURIComponent(leadId)}/documents/${encodeURIComponent(docId)}`),
    update: (leadId: string, docId: string, body: { payload?: QuotePayload | ContractPayload; label?: string; parentDocumentId?: string }) =>
      req<LeadDocumentRecord>("PUT", `/leads/${encodeURIComponent(leadId)}/documents/${encodeURIComponent(docId)}`, body),
    delete: (leadId: string, docId: string) =>
      req<{ message: string }>("DELETE", `/leads/${encodeURIComponent(leadId)}/documents/${encodeURIComponent(docId)}`),
    downloadFile: (leadId: string, docId: string, filename: string) =>
      downloadBlob(`/leads/${encodeURIComponent(leadId)}/documents/${encodeURIComponent(docId)}/file`, undefined, filename, "GET"),
    fileBlob: (leadId: string, docId: string) =>
      fetchAuthBlob(`/leads/${encodeURIComponent(leadId)}/documents/${encodeURIComponent(docId)}/file`, { method: "GET" }),
    createFromQuote: (
      leadId: string,
      body: {
        quoteDocId: string
        partyA?: {
          companyName?: string
          taxId?: string
          address?: string
          representative?: string
          position?: string
        }
        contractMeta?: { contractNo?: string; contractDate?: string; contractPlace?: string }
        label?: string
      },
    ) => req<LeadDocumentRecord>("POST", `/leads/${encodeURIComponent(leadId)}/contracts/from-quote`, body),
    createAppendix: async (
      leadId: string,
      contractDocId: string,
      file: File,
      body?: { label?: string },
    ) => {
      const form = new FormData()
      form.append("file", file)
      if (body?.label?.trim()) form.append("label", body.label.trim())
      const res = await fetch(
        `${BASE}/leads/${encodeURIComponent(leadId)}/contracts/${encodeURIComponent(contractDocId)}/appendix`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token()}` },
          body: form,
        },
      )
      const text = await res.text()
      let json: Record<string, unknown> = {}
      try { json = text ? JSON.parse(text) as Record<string, unknown> : {} } catch { /* ignore */ }
      if (!res.ok) {
        const msg = json.message ?? json.error
        throw new Error(typeof msg === "string" ? msg : "Tải phụ lục thất bại")
      }
      touchSession()
      return json.data as LeadDocumentRecord
    },
    uploadFile: async (
      leadId: string,
      type: "quote" | "contract" | "solution",
      file: File,
      body?: { label?: string },
    ) => {
      const form = new FormData()
      form.append("file", file)
      if (body?.label?.trim()) form.append("label", body.label.trim())
      const res = await fetch(`${BASE}/leads/${encodeURIComponent(leadId)}/documents/upload?type=${type}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: form,
      })
      const text = await res.text()
      let json: Record<string, unknown> = {}
      try { json = text ? JSON.parse(text) as Record<string, unknown> : {} } catch { /* ignore */ }
      if (!res.ok) {
        const msg = json.message ?? json.error
        throw new Error(typeof msg === "string" ? msg : "Tải file lên thất bại")
      }
      touchSession()
      return json.data as LeadDocumentRecord
    },
  },
  templates: {
    list: () => req<TemplateInfo[]>("GET", "/templates"),
    get: (type: TemplateType) => req<TemplateInfo>("GET", `/templates/${type}`),
    download: (type: TemplateType) =>
      downloadBlob(`/templates/${type}/file`, undefined, type === "quote" ? "bao-gia-template.docx" : "hop-dong-template.docx", "GET"),
    upload: async (type: TemplateType, file: File) => {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`${BASE}/templates/${type}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: form,
      })
      const text = await res.text()
      let json: Record<string, unknown> = {}
      try { json = text ? JSON.parse(text) as Record<string, unknown> : {} } catch { /* ignore */ }
      if (!res.ok) {
        const msg = json.message ?? json.error
        throw new Error(typeof msg === "string" ? msg : "Upload template thất bại")
      }
      touchSession()
      return json.data as TemplateInfo
    },
    reset: (type: TemplateType) => req<TemplateInfo>("DELETE", `/templates/${type}`),
  },
  customers: {
    list: (params?: { q?: string }) => req<import("../app/types").Customer[]>("GET", `/customers${qs(params)}`),
    get: (id: string) => req<import("../app/types").Customer>("GET", `/customers/${encodeURIComponent(id)}`),
  },

  leads: {
    list: (params?: { status?: string; assignedToId?: string; q?: string }) =>
      req<import("../app/types").Lead[]>("GET", `/leads${qs(params)}`),
    get: (id: string) => req<import("../app/types").Lead>("GET", `/leads/${encodeURIComponent(id)}`),
    create: (data: Partial<import("../app/types").Lead>) => req<import("../app/types").Lead>("POST", "/leads", data),
    update: (id: string, data: Partial<import("../app/types").Lead>) =>
      req<import("../app/types").Lead>("PUT", `/leads/${encodeURIComponent(id)}`, data),
    delete: (id: string) => req<{ message: string }>("DELETE", `/leads/${encodeURIComponent(id)}`),
    addNote: (id: string, content: string) =>
      req<import("../app/types").Lead>("POST", `/leads/${encodeURIComponent(id)}/notes`, { content }),
    updateNote: (id: string, noteId: string, content: string) =>
      req<import("../app/types").Lead>("PUT", `/leads/${encodeURIComponent(id)}/notes/${encodeURIComponent(noteId)}`, { content }),
    deleteNote: (id: string, noteId: string) =>
      req<import("../app/types").Lead>("DELETE", `/leads/${encodeURIComponent(id)}/notes/${encodeURIComponent(noteId)}`),
    convertToProject: (id: string, body: { name: string; description?: string; managerId?: string }) =>
      req<{ lead: import("../app/types").Lead; project: import("../app/types").Project; alreadyExists: boolean }>(
        "POST",
        `/leads/${encodeURIComponent(id)}/convert-to-project`,
        body,
      ),
    issueFormLink: (id: string, formType: string) =>
      req<{ lead: import("../app/types").Lead; token: string; urlPath: string; query: { token: string; type: string } }>(
        "POST",
        `/leads/${encodeURIComponent(id)}/form-link/issue`,
        { formType },
      ),
    revokeFormLink: (id: string) =>
      req<import("../app/types").Lead>("POST", `/leads/${encodeURIComponent(id)}/form-link/revoke`, {}),
    addRequirementRound: (id: string, body?: { title?: string; notes?: string; formType?: string }) =>
      req<{ lead: import("../app/types").Lead }>(
        "POST",
        `/leads/${encodeURIComponent(id)}/requirement-forms/new`,
        body ?? {},
      ),
  },
  publicLeadForms: {
    get: (leadId: string, token: string, formType?: string) => {
      const params = new URLSearchParams({ token })
      if (formType) params.set("type", formType)
      return fetch(`${BASE}/public/lead-forms/${encodeURIComponent(leadId)}?${params}`)
        .then(async (res) => {
          const json = await res.json()
          if (!res.ok) throw new Error(json.error || json.message || "Không tải được form")
          return json.data as {
            lead: { id: string; code: string; name: string; formType: import("../app/types").FormType; formStatus?: string }
            prefill: Record<string, string>
            formTitle: string
            locked?: boolean
            readOnly?: boolean
            lockReason?: string | null
          }
        })
    },
    submit: (leadId: string, token: string, payload: Record<string, unknown>) =>
      fetch(`${BASE}/public/lead-forms/${encodeURIComponent(leadId)}/submit?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || json.message || "Gửi form thất bại")
        return json.data as { id: string; formStatus: string }
      }),
  },
}

export type TemplateType = "quote" | "contract"

export interface TemplateInfo {
  type: TemplateType
  label: string
  source: "default" | "override"
  hasOverride: boolean
  hasBundled: boolean
  exists: boolean
  filename: string
  updatedAt: string | null
  updatedBy: string | null
  originalName: string | null
  size: number
}

export interface QuoteCostItem {
  name: string
  description: string
  amount: number
}

export interface QuoteScopeItem {
  group: string
  item: string
  scope: string
}

export interface QuotePhase {
  name: string
  content: string
  duration: string
}

export interface QuotePayment {
  label: string
  percent: number
  amount?: number
  timing: string
}

export interface QuotePayload {
  title?: string
  customer?: string
  project?: string
  date?: string
  owner?: string
  overviewIntro?: string
  overviewBullets?: string[]
  costItems?: QuoteCostItem[]
  scopeItems?: QuoteScopeItem[]
  deployKind?: "website" | "hệ thống"
  timelineDays?: string
  phases?: QuotePhase[]
  payments?: QuotePayment[]
  bank?: { account?: string; name?: string; holder?: string }
  template?: string
  total?: number
}

export interface ContractPartyA {
  companyName?: string
  taxId?: string
  address?: string
  representative?: string
  position?: string
}

export interface ContractCostItem {
  stt?: string
  name: string
  description?: string
  amount: string | number
  text?: string
}

export interface ContractPhase {
  label?: string
  content: string
  duration: string
}

export interface ContractPayment {
  label: string
  percent: string | number
  amount?: string | number
  timing: string
}

export interface ContractPayload {
  contractNo?: string
  contractDate?: string
  contractDateLong?: string
  contractPlace?: string
  projectName?: string
  serviceDescription?: string
  deployKind?: string
  partyA?: ContractPartyA
  costItems?: ContractCostItem[]
  scopeItems?: QuoteScopeItem[]
  timelineTotal?: string
  phases?: ContractPhase[]
  total?: string
  totalRaw?: number
  totalWords?: string
  payments?: ContractPayment[]
  sourceDocumentId?: string
  sourceDocumentLabel?: string
  sourceQuotePayload?: QuotePayload
  isAppendix?: boolean
  parentContractNo?: string
  parentDocumentId?: string
  appendixNo?: string
  appendixTitle?: string
  appendixContent?: string
}

export interface LeadDocumentRecord {
  id: string
  leadId: string
  type: "quote" | "contract" | "solution"
  documentKind?: "quote" | "contract" | "contract_appendix" | "uploaded_doc"
  version: number
  label: string
  downloadName?: string
  filePath?: string | null
  fileSize?: number
  hasFile?: boolean
  isAppendix?: boolean
  uploadedFile?: boolean
  parentDocumentId?: string | null
  storageKey?: string
  storageProvider?: string
  payload?: QuotePayload | ContractPayload
  createdAt: string
  createdBy?: string
  createdByName?: string
  updatedAt?: string
  updatedByName?: string
}

async function vaultMultipart<T>(
  method: "POST" | "PUT",
  path: string,
  body: Record<string, unknown>,
  file?: File,
): Promise<T> {
  const form = new FormData()
  form.append("data", JSON.stringify(body))
  if (file) form.append("file", file)
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token()}` },
    body: form,
  })
  const text = await res.text()
  let json: Record<string, unknown> = {}
  try { json = text ? JSON.parse(text) as Record<string, unknown> : {} } catch { /* ignore */ }
  if (!res.ok) {
    const msg = json.message ?? json.error
    throw new Error(typeof msg === "string" ? msg : "Lưu tài liệu vault thất bại")
  }
  touchSession()
  return json.data as T
}

async function fetchAuthBlob(path: string, options?: { method?: string; body?: unknown }): Promise<Blob> {
  const method = options?.method ?? "POST"
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(options?.body !== undefined ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token()}`,
    },
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  if (res.status === 401) {
    localStorage.removeItem("dudi_token")
    localStorage.removeItem("dudi_user")
    window.dispatchEvent(new Event("dudi_unauthorized"))
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
  }
  if (!res.ok) {
    const text = await res.text()
    let json: Record<string, unknown> = {}
    try { json = text ? JSON.parse(text) as Record<string, unknown> : {} } catch { /* ignore */ }
    const msg = json.message ?? json.error
    throw new Error(typeof msg === "string" ? msg : `Lỗi server (${res.status})`)
  }
  touchSession()
  return res.blob()
}

async function fetchDocxBlob(path: string, body: unknown): Promise<Blob> {
  return fetchAuthBlob(path, { method: "POST", body })
}

async function downloadBlob(path: string, body: unknown, filename: string, method: "GET" | "POST" = "POST") {
  const blob = method === "GET"
    ? await fetchAuthBlob(path, { method: "GET" })
    : await fetchDocxBlob(path, body)
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  touchSession()
}

export function saveToken(t: string) {
  localStorage.setItem("dudi_token", t)
}

export function clearToken() {
  localStorage.removeItem("dudi_token")
}

export function hasToken() {
  return !!localStorage.getItem("dudi_token")
}
