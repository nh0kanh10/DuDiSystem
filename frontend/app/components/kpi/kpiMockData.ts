// Core KPI metrics
export interface KpiMetrics {
  zalo: number;
  fb: number;
  comment: number;
  post: number;
  clientReply: number;
  khachChuDongIB: number;
  followUp: number;
  quote: number;
  deal: number;
  revenue: number; // in VND (e.g., 50000000)
}

export interface KpiTarget {
  id: string;
  employeeId: string; // "all" or specific employee id
  month: string;      // "YYYY-MM"
  metrics: KpiMetrics;
}

export interface KpiEntry {
  id: string;
  employeeId: string;
  date: string;      // "YYYY-MM-DD"
  metrics: KpiMetrics;
  notes: string;
}

// Points weighting configuration
export const KPI_POINTS_WEIGHT: Record<keyof KpiMetrics, number> = {
  zalo: 1,
  fb: 1,
  comment: 1,
  post: 5,
  clientReply: 3,
  khachChuDongIB: 5,
  followUp: 5,
  quote: 15,
  deal: 50,
  revenue: 0.00001, // 1 point per 100,000 VND (10,000,000 VND = 100 points)
};

export const KPI_METRIC_LABELS: Record<keyof KpiMetrics, string> = {
  zalo: "IB Zalo",
  fb: "IB Facebook",
  comment: "Comment",
  post: "Bài đăng",
  clientReply: "Khách rep",
  khachChuDongIB: "Khách chủ động IB",
  followUp: "Follow-up",
  quote: "Báo giá",
  deal: "Chốt Deal",
  revenue: "Doanh thu",
};

// Calculate total score for a set of metrics
export function calculateKpiPoints(metrics: KpiMetrics): number {
  return Math.round(
    Object.entries(metrics).reduce((sum, [key, value]) => {
      const weight = KPI_POINTS_WEIGHT[key as keyof KpiMetrics] || 0;
      return sum + value * weight;
    }, 0)
  );
}

// Initial seed targets
const SEED_TARGETS: KpiTarget[] = [
  {
    id: "t-default-07",
    employeeId: "all",
    month: "2026-07",
    metrics: { zalo: 2300, fb: 46, comment: 460, post: 1150, clientReply: 69, khachChuDongIB: 69, followUp: 23, quote: 23, deal: 23, revenue: 11500000 }
  },
  {
    id: "t-default-06",
    employeeId: "all",
    month: "2026-06",
    metrics: { zalo: 2000, fb: 40, comment: 400, post: 1000, clientReply: 60, khachChuDongIB: 60, followUp: 20, quote: 20, deal: 20, revenue: 10000000 }
  },
  {
    id: "t-0000000001-07",
    employeeId: "0000000001", // Trần Thị Bích Liên
    month: "2026-07",
    metrics: { zalo: 2500, fb: 50, comment: 500, post: 1200, clientReply: 80, khachChuDongIB: 80, followUp: 25, quote: 25, deal: 25, revenue: 15000000 }
  },
  {
    id: "t-0000000002-07",
    employeeId: "0000000002", // Nguyễn Văn Minh
    month: "2026-07",
    metrics: { zalo: 2200, fb: 45, comment: 450, post: 1100, clientReply: 70, khachChuDongIB: 70, followUp: 22, quote: 22, deal: 22, revenue: 12000000 }
  }
];

// Helper to generate seed daily entries
function generateSeedEntries(): KpiEntry[] {
  const entries: KpiEntry[] = [];
  const empIds = ["0000000001", "0000000002", "0000000003", "0000000004", "0000000005", "0000000006", "0000000007"];
  
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Generate entries for past 90 days (complete coverage of May, June, July)
  const today = new Date("2026-07-09");
  
  for (const empId of empIds) {
    for (let d = 0; d < 90; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const dateStr = date.toISOString().split("T")[0];
      
      // Organic waves for nice peaks & valleys in the chart
      const wave1 = Math.sin(d / 2.5) * 8 + 10;
      const wave2 = Math.cos(d / 3.5) * 4 + 3;
      
      const metrics: KpiMetrics = {
        zalo: rand(10, 100),
        fb: rand(5, 20),
        comment: rand(10, 50),
        post: rand(1, 10),
        clientReply: rand(1, 10),
        khachChuDongIB: rand(0, 3),
        followUp: Math.max(0, Math.round(wave1 + rand(-2, 2))),
        quote: Math.max(0, Math.round(wave2 + rand(-1, 1))),
        deal: Math.random() > 0.75 ? rand(1, 3) : 0,
        revenue: 0
      };
      
      if (metrics.deal > 0) {
        metrics.revenue = metrics.deal * 2500000;
      }
      
      let notes = "";
      if (metrics.deal > 0) {
        notes = `Nhu cầu khách:\nLàm ladi dự án lớn\n\nTại sao mất khách:\nKhông mất, chốt thành công deal ${metrics.deal} căn`;
      } else {
        notes = `Nhu cầu khách:\nTìm hiểu bảng giá dịch vụ\n\nTại sao mất khách:\nKhách chê đắt hoặc đang cân nhắc thêm`;
      }
      
      entries.push({
        id: `entry-${empId}-${dateStr}`,
        employeeId: empId,
        date: dateStr,
        metrics,
        notes
      });
    }
  }
  
  return entries;
}

// Local Storage Wrappers
export function getStoredKpiTargets(): KpiTarget[] {
  const data = localStorage.getItem("dudi_kpi_targets");
  if (!data) {
    localStorage.setItem("dudi_kpi_targets", JSON.stringify(SEED_TARGETS));
    return SEED_TARGETS;
  }
  return JSON.parse(data);
}

export function saveStoredKpiTargets(targets: KpiTarget[]) {
  localStorage.setItem("dudi_kpi_targets", JSON.stringify(targets));
}

export function generateSeedEntriesForEmp(empId: string): KpiEntry[] {
  const entries: KpiEntry[] = [];
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const today = new Date("2026-07-09");
  
  for (let d = 0; d < 90; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const dateStr = date.toISOString().split("T")[0];
    
    const wave1 = Math.sin(d / 2.5) * 8 + 10;
    const wave2 = Math.cos(d / 3.5) * 4 + 3;
    
    const metrics: KpiMetrics = {
      zalo: rand(10, 100),
      fb: rand(5, 20),
      comment: rand(10, 50),
      post: rand(1, 10),
      clientReply: rand(1, 10),
      khachChuDongIB: rand(0, 3),
      followUp: Math.max(0, Math.round(wave1 + rand(-2, 2))),
      quote: Math.max(0, Math.round(wave2 + rand(-1, 1))),
      deal: Math.random() > 0.75 ? rand(1, 3) : 0,
      revenue: 0
    };
    
    if (metrics.deal > 0) {
      metrics.revenue = metrics.deal * 2500000;
    }
    
    let notes = "";
    if (metrics.deal > 0) {
      notes = `Nhu cầu khách:\nLàm ladi dự án lớn\n\nTại sao mất khách:\nKhông mất, chốt thành công deal ${metrics.deal} căn`;
    } else {
      notes = `Nhu cầu khách:\nTìm hiểu bảng giá dịch vụ\n\nTại sao mất khách:\nKhách chê đắt hoặc đang cân nhắc thêm`;
    }
    
    entries.push({
      id: `entry-${empId}-${dateStr}`,
      employeeId: empId,
      date: dateStr,
      metrics,
      notes
    });
  }
  return entries;
}

export function getStoredKpiEntries(currentEmpId?: string): KpiEntry[] {
  const data = localStorage.getItem("dudi_kpi_entries_v4");
  let entries: KpiEntry[] = [];
  if (!data) {
    entries = generateSeedEntries();
    localStorage.setItem("dudi_kpi_entries_v4", JSON.stringify(entries));
  } else {
    entries = JSON.parse(data);
  }

  if (currentEmpId && !entries.some(e => e.employeeId === currentEmpId)) {
    const newSeeds = generateSeedEntriesForEmp(currentEmpId);
    entries = [...entries, ...newSeeds];
    localStorage.setItem("dudi_kpi_entries_v4", JSON.stringify(entries));
  }

  return entries;
}

export function saveStoredKpiEntries(entries: KpiEntry[]) {
  localStorage.setItem("dudi_kpi_entries_v4", JSON.stringify(entries));
}

// Logic: get target for an employee in a specific month
export function getTarget(employeeId: string, month: string): KpiMetrics {
  const targets = getStoredKpiTargets();
  // Find employee-specific target
  const empTarget = targets.find((t) => t.employeeId === employeeId && t.month === month);
  if (empTarget) return empTarget.metrics;
  
  // Fallback to "all" (default) target for that month
  const defaultTarget = targets.find((t) => t.employeeId === "all" && t.month === month);
  if (defaultTarget) return defaultTarget.metrics;
  
  // Fallback to absolute defaults
  return { zalo: 2300, fb: 46, comment: 460, post: 1150, clientReply: 69, khachChuDongIB: 69, followUp: 23, quote: 23, deal: 23, revenue: 11500000 };
}
