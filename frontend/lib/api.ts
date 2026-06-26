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
  allowedIPs: {
    list: async (params?: { orgNodeId?: string }) => {
      const mockAllowedIPsKey = "dudi_mock_allowed_ips";
      const getMockAllowedIPs = () => {
        const data = localStorage.getItem(mockAllowedIPsKey);
        if (!data) {
          const init = [
            { id: "ip-1", ip: "192.168.1.1", description: "Văn phòng chính - Wifi", status: "active", orgNodeId: "branch-hcm", createdAt: new Date().toISOString() },
            { id: "ip-2", ip: "10.0.0.1", description: "Văn phòng Tech - Wired", status: "active", orgNodeId: "branch-hcm", createdAt: new Date().toISOString() },
          ];
          localStorage.setItem(mockAllowedIPsKey, JSON.stringify(init));
          return init;
        }
        return JSON.parse(data);
      };
      let list = getMockAllowedIPs();
      if (params?.orgNodeId && params.orgNodeId !== "all") {
        list = list.filter((ip: any) => ip.orgNodeId === params.orgNodeId);
      }
      return list;
    },
    create: async (data: { ip: string; description: string; orgNodeId?: string }) => {
      const mockAllowedIPsKey = "dudi_mock_allowed_ips";
      const getMockAllowedIPs = () => {
        const saved = localStorage.getItem(mockAllowedIPsKey);
        return saved ? JSON.parse(saved) : [];
      };
      const list = getMockAllowedIPs();
      const newItem = {
        id: `ip-${Date.now()}`,
        ip: data.ip,
        description: data.description,
        status: "active" as const,
        orgNodeId: data.orgNodeId,
        createdAt: new Date().toISOString(),
      };
      list.push(newItem);
      localStorage.setItem(mockAllowedIPsKey, JSON.stringify(list));
      return newItem;
    },
    update: async (id: string, data: { ip: string; description: string; orgNodeId?: string }) => {
      const mockAllowedIPsKey = "dudi_mock_allowed_ips";
      const saved = localStorage.getItem(mockAllowedIPsKey);
      const list = saved ? JSON.parse(saved) : [];
      const index = list.findIndex((ip: any) => ip.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...data };
        localStorage.setItem(mockAllowedIPsKey, JSON.stringify(list));
        return list[index];
      }
      throw new Error("Không tìm thấy IP");
    },
    toggle: async (id: string) => {
      const mockAllowedIPsKey = "dudi_mock_allowed_ips";
      const saved = localStorage.getItem(mockAllowedIPsKey);
      const list = saved ? JSON.parse(saved) : [];
      const index = list.findIndex((ip: any) => ip.id === id);
      if (index !== -1) {
        list[index].status = list[index].status === "active" ? "inactive" : "active";
        localStorage.setItem(mockAllowedIPsKey, JSON.stringify(list));
        return list[index];
      }
      throw new Error("Không tìm thấy IP");
    },
    delete: async (id: string) => {
      const mockAllowedIPsKey = "dudi_mock_allowed_ips";
      const saved = localStorage.getItem(mockAllowedIPsKey);
      let list = saved ? JSON.parse(saved) : [];
      list = list.filter((ip: any) => ip.id !== id);
      localStorage.setItem(mockAllowedIPsKey, JSON.stringify(list));
      return { success: true };
    },
  },

  timeOffSlots: {
    list: async (params?: { week?: string }) => {
      const mockTimeOffSlotsKey = "dudi_mock_timeoff_slots";
      const getMockTimeOffSlots = () => {
        const data = localStorage.getItem(mockTimeOffSlotsKey);
        if (!data) {
          const init = [
            { id: "S1", empId: "NV003", empName: "Lê Thu Hương", empCode: "2023081567", department: "Design", day: 1, session: "sang", reason: "Dạ đi học", status: "approved", week: "2026-W26", registeredAt: "21/6/2026", adminNote: "Đã được duyệt tự động (đồng bộ)", processedAt: "21/6/2026" },
            { id: "S2", empId: "NV003", empName: "Lê Thu Hương", empCode: "2023081567", department: "Design", day: 1, session: "chieu", reason: "Dạ đi học", status: "approved", week: "2026-W26", registeredAt: "21/6/2026", adminNote: "Đã được duyệt tự động (đồng bộ)", processedAt: "21/6/2026" },
            { id: "S3", empId: "NV004", empName: "Phạm Đức Thành", empCode: "2025012893", department: "PM", day: 2, session: "sang", reason: "Họp khách hàng", status: "pending", week: "2026-W26", registeredAt: "22/6/2026", adminNote: "", processedAt: "" },
            { id: "S4", empId: "NV002", empName: "Nguyễn Văn Minh", empCode: "2024031245", department: "Backend", day: 2, session: "chieu", reason: "Việc cá nhân", status: "pending", week: "2026-W26", registeredAt: "22/6/2026", adminNote: "", processedAt: "" },
            { id: "S5", empId: "NV005", empName: "Hoàng Thị Mai", empCode: "2024091234", department: "HR", day: 3, session: "sang", reason: "Đi khám bệnh", status: "approved", week: "2026-W26", registeredAt: "20/6/2026", adminNote: "Duyệt", processedAt: "21/6/2026" },
            { id: "S6", empId: "NV006", empName: "Võ Minh Tuấn", empCode: "2025060001", department: "Backend", day: 3, session: "chieu", reason: "Bù tăng ca", status: "approved", week: "2026-W26", registeredAt: "21/6/2026", adminNote: "Duyệt bù giờ", processedAt: "21/6/2026" },
            { id: "S7", empId: "NV007", empName: "Đinh Thị Lan Anh", empCode: "2025071501", department: "Frontend", day: 4, session: "sang", reason: "Gia đình có việc", status: "rejected", week: "2026-W26", registeredAt: "22/6/2026", adminNote: "Không đủ điều kiện", processedAt: "22/6/2026" },
            { id: "S8", empId: "NV001", empName: "Trần Thị Bích Liên", empCode: "2026052831", department: "Frontend", day: 4, session: "chieu", reason: "Bù tăng ca T5", status: "pending", week: "2026-W26", registeredAt: "22/6/2026", adminNote: "", processedAt: "" },
            { id: "S9", empId: "NV004", empName: "Phạm Đức Thành", empCode: "2025012893", department: "PM", day: 5, session: "sang", reason: "Học thêm", status: "approved", week: "2026-W26", registeredAt: "20/6/2026", adminNote: "OK", processedAt: "20/6/2026" },
            { id: "S10", empId: "NV008", empName: "Bùi Văn Hùng", empCode: "2024112001", department: "DevOps", day: 5, session: "chieu", reason: "Trực ca đêm bù", status: "approved", week: "2026-W26", registeredAt: "21/6/2026", adminNote: "Duyệt bù trực", processedAt: "21/6/2026" },
            { id: "S11", empId: "NV002", empName: "Nguyễn Văn Minh", empCode: "2024031245", department: "Backend", day: 6, session: "sang", reason: "Nghỉ phép năm", status: "pending", week: "2026-W26", registeredAt: "23/6/2026", adminNote: "", processedAt: "" },
          ];
          localStorage.setItem(mockTimeOffSlotsKey, JSON.stringify(init));
          return init;
        }
        return JSON.parse(data);
      };
      let list = getMockTimeOffSlots();
      if (params?.week) {
        list = list.filter((s: any) => s.week === params.week);
      }
      return list;
    },
    create: async (data: any) => {
      const mockTimeOffSlotsKey = "dudi_mock_timeoff_slots";
      const saved = localStorage.getItem(mockTimeOffSlotsKey);
      const list = saved ? JSON.parse(saved) : [];
      const newItem = {
        id: `S-${Date.now()}`,
        ...data,
      };
      list.push(newItem);
      localStorage.setItem(mockTimeOffSlotsKey, JSON.stringify(list));
      return newItem;
    },
    approve: async (id: string, note?: string) => {
      const mockTimeOffSlotsKey = "dudi_mock_timeoff_slots";
      const saved = localStorage.getItem(mockTimeOffSlotsKey);
      const list = saved ? JSON.parse(saved) : [];
      const index = list.findIndex((s: any) => s.id === id);
      if (index !== -1) {
        list[index].status = "approved";
        list[index].adminNote = note || "Đã duyệt";
        list[index].processedAt = new Date().toLocaleString("vi");
        localStorage.setItem(mockTimeOffSlotsKey, JSON.stringify(list));
        return list[index];
      }
      throw new Error("Không tìm thấy ca nghỉ");
    },
    reject: async (id: string, note?: string) => {
      const mockTimeOffSlotsKey = "dudi_mock_timeoff_slots";
      const saved = localStorage.getItem(mockTimeOffSlotsKey);
      const list = saved ? JSON.parse(saved) : [];
      const index = list.findIndex((s: any) => s.id === id);
      if (index !== -1) {
        list[index].status = "rejected";
        list[index].adminNote = note || "Từ chối";
        list[index].processedAt = new Date().toLocaleString("vi");
        localStorage.setItem(mockTimeOffSlotsKey, JSON.stringify(list));
        return list[index];
      }
      throw new Error("Không tìm thấy ca nghỉ");
    },
    approveAll: async (week: string) => {
      const mockTimeOffSlotsKey = "dudi_mock_timeoff_slots";
      const saved = localStorage.getItem(mockTimeOffSlotsKey);
      const list = saved ? JSON.parse(saved) : [];
      list.forEach((s: any) => {
        if (s.week === week && s.status === "pending") {
          s.status = "approved";
          s.adminNote = "Duyệt hàng loạt";
          s.processedAt = new Date().toLocaleString("vi");
        }
      });
      localStorage.setItem(mockTimeOffSlotsKey, JSON.stringify(list));
      return { success: true };
    },
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
