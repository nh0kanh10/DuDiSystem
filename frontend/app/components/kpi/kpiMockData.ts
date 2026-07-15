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
  revenue: number;
}

export interface KpiTarget {
  id: string;
  employeeId: string; 
  month: string; 
  metrics: KpiMetrics;
}

export interface KpiEntry {
  id: string;
  employeeId: string;
  date: string;  
  metrics: KpiMetrics;
  notes: string;
}

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
  revenue: 0.00001, 
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

export function calculateKpiPoints(metrics: KpiMetrics): number {
  return Math.round(
    Object.entries(metrics).reduce((sum, [key, value]) => {
      const weight = KPI_POINTS_WEIGHT[key as keyof KpiMetrics] || 0;
      return sum + value * weight;
    }, 0)
  );
}

export function getTarget(employeeId: string, month: string, targets: KpiTarget[]): KpiMetrics {
  const empTarget = targets.find((t) => t.employeeId === employeeId && t.month === month);
  if (empTarget) return empTarget.metrics;

  const defaultTarget = targets.find((t) => t.employeeId === "all" && t.month === month);
  if (defaultTarget) return defaultTarget.metrics;

  return { zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, khachChuDongIB: 0, followUp: 0, quote: 0, deal: 0, revenue: 0 };
}

export function clearKpiMockData() {
  localStorage.removeItem("dudi_kpi_entries_v4");
  localStorage.removeItem("dudi_kpi_targets");
}




