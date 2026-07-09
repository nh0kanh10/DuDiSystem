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

// Clear any existing mock/seed data from localStorage
export function clearKpiMockData() {
  localStorage.removeItem("dudi_kpi_entries_v4");
  localStorage.removeItem("dudi_kpi_targets");
}

// Local Storage Wrappers — no seed data, starts empty
export function getStoredKpiTargets(): KpiTarget[] {
  const data = localStorage.getItem("dudi_kpi_targets");
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveStoredKpiTargets(targets: KpiTarget[]) {
  localStorage.setItem("dudi_kpi_targets", JSON.stringify(targets));
}

export function getStoredKpiEntries(_currentEmpId?: string): KpiEntry[] {
  const data = localStorage.getItem("dudi_kpi_entries_v4");
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
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

  // No target configured — return zeroes
  return { zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, khachChuDongIB: 0, followUp: 0, quote: 0, deal: 0, revenue: 0 };
}
