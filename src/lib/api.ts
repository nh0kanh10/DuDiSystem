const BASE = "http://localhost:3001/api"

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
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? "Lỗi server")
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
  },

  employees: {
    list: (params?: { status?: string; department?: string; q?: string }) =>
      req<unknown[]>("GET", `/employees${qs(params)}`),
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
    list: (params?: { date?: string; employeeId?: string; status?: string; department?: string }) =>
      req<unknown[]>("GET", `/attendance${qs(params)}`),
    stats: (date?: string) =>
      req<{ onTime: number; late: number; absent: number; leave: number; total: number }>(
        "GET", `/attendance/stats${date ? `?date=${date}` : ""}`
      ),
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
    delete: (id: string) => req<unknown>("DELETE", `/requests/${id}`),
  },

  tasks: {
    list: (params?: { status?: string; priority?: string; assigneeId?: string }) =>
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
