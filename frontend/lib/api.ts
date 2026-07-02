import { touchSession } from "./session"

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api"

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
    localStorage.removeItem("dudi_token")
    localStorage.removeItem("dudi_user")
    window.dispatchEvent(new Event("dudi_unauthorized"))
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
  }
  const text = await res.text()
  const json = text ? JSON.parse(text) : {}
  if (!res.ok) throw new Error(json.message ?? "Lỗi server")
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

export const api = {
  auth: {
    login: (email: string, password: string) =>
      req<{ token: string; user: Record<string, unknown> }>("POST", "/auth/login", { email, password }),
    me: () => req<any>("GET", "/auth/me"),
    refresh: () => req<{ token: string }>("POST", "/auth/refresh"),
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
    checkIP: () => req<{ valid: boolean; ip: string; message: string }>("GET", "/attendance/check-ip"),
    create: (data: unknown) => req<unknown>("POST", "/attendance", data),
    update: (id: string, data: unknown) => req<unknown>("PUT", `/attendance/${id}`, data),
    delete: (id: string) => req<unknown>("DELETE", `/attendance/${id}`),
  },

  requests: {
    list: (params?: { status?: string; category?: string; employeeId?: string }) =>
      req<unknown[]>("GET", `/requests${qs(params)}`),
    create: (data: unknown) => req<unknown>("POST", "/requests", data),
    approve: (id: string) => req<unknown>("PATCH", `/requests/${id}/approve`),
    reject: (id: string) => req<unknown>("PATCH", `/requests/${id}/reject`),
    cancel: (id: string, employeeId?: string) =>
      req<unknown>("PATCH", `/requests/${id}/cancel`, employeeId ? { employeeId } : undefined),
    delete: (id: string) => req<unknown>("DELETE", `/requests/${id}`),
  },

  projects: {
    list: (params?: { status?: string; q?: string; managerId?: string }) =>
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
    update: (id: string, data: { ip: string; description: string; orgNodeId?: string }) => req<any>("PUT", `/allowed-ips/${id}`, data),
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
