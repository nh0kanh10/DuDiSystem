import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  TrendingUp, Award, Calendar, Users, FileText, Settings, BarChart3,
  UserCheck, ChevronRight, Download, Search, Plus, Filter, RefreshCw, X, ArrowUpRight, ArrowDownRight, RefreshCcw
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from "recharts";
import { Employee } from "../../types";
import { useToast } from "../../hooks/useToast";
import {
  getStoredKpiEntries, getStoredKpiTargets, saveStoredKpiTargets,
  calculateKpiPoints, getTarget, KpiEntry, KpiTarget, KpiMetrics, KPI_METRIC_LABELS
} from "./kpiMockData";

interface KpiManagementAdminProps {
  employees: Employee[];
  selectedBranch: string;
}

export function KpiManagementAdmin({ employees, selectedBranch }: KpiManagementAdminProps) {
  const { showToast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState("2026-07");
  const [activeTab, setActiveTab] = useState<"overview" | "stats" | "compare">("overview");
  
  // Dashboard Sub-tabs for "Tổng quan"
  const [overviewSubTab, setOverviewSubTab] = useState<"charts" | "reports" | "targets">("charts");
  
  // States for target modal
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetEmployeeId, setTargetEmployeeId] = useState("all");
  const [targetForm, setTargetForm] = useState<Omit<KpiTarget, "id">>({
    employeeId: "all",
    month: "2026-07",
    metrics: { zalo: 2000, fb: 1500, comment: 500, post: 150, clientReply: 600, khachChuDongIB: 60, followUp: 400, quote: 80, deal: 25, revenue: 80000000 }
  });

  // State for detail modal
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);

  // Lock background scroll when modals are open
  React.useEffect(() => {
    if (isTargetModalOpen || selectedEmployeeForDetail) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isTargetModalOpen, selectedEmployeeForDetail]);

  // States for comparison tab
  const [compMonth1, setCompMonth1] = useState("2026-07");
  const [compEmpId1, setCompEmpId1] = useState("all");
  const [compMonth2, setCompMonth2] = useState("2026-06");
  const [compEmpId2, setCompEmpId2] = useState("all");

  // Filter lists by selected branch
  const filteredEmployees = useMemo(() => {
    if (!selectedBranch || selectedBranch === "all") return employees;
    return employees.filter(e => e.branchId === selectedBranch || e.orgNodeId === selectedBranch);
  }, [employees, selectedBranch]);

  const filteredEmployeeIds = useMemo(() => {
    return new Set(filteredEmployees.map(e => e.id));
  }, [filteredEmployees]);

  // Load KPI entries and targets from local storage
  const [entries, setEntries] = useState<KpiEntry[]>(() => getStoredKpiEntries());
  const [targets, setTargets] = useState<KpiTarget[]>(() => getStoredKpiTargets());

  const handleRefresh = () => {
    setEntries(getStoredKpiEntries());
    setTargets(getStoredKpiTargets());
    showToast("Đã tải lại dữ liệu KPI!", "success");
  };

  // Filter entries for the selected month and branch
  const currentMonthEntries = useMemo(() => {
    return entries.filter(entry => 
      entry.date.startsWith(selectedMonth) && 
      filteredEmployeeIds.has(entry.employeeId)
    );
  }, [entries, selectedMonth, filteredEmployeeIds]);

  // Compute aggregated stats for each employee for the selected month
  const employeeSummaries = useMemo(() => {
    const map = new Map<string, KpiMetrics & { points: number; daysCount: number }>();
    
    // Initialize default metrics for all branch employees
    filteredEmployees.forEach(e => {
      map.set(e.id, { zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, khachChuDongIB: 0, followUp: 0, quote: 0, deal: 0, revenue: 0, points: 0, daysCount: 0 });
    });

    // Accumulate actual metrics from logs
    currentMonthEntries.forEach(entry => {
      const current = map.get(entry.employeeId);
      if (current) {
        current.zalo += entry.metrics.zalo;
        current.fb += entry.metrics.fb;
        current.comment += entry.metrics.comment;
        current.post += entry.metrics.post;
        current.clientReply += entry.metrics.clientReply;
        current.khachChuDongIB += entry.metrics.khachChuDongIB || 0;
        current.followUp += entry.metrics.followUp;
        current.quote += entry.metrics.quote;
        current.deal += entry.metrics.deal;
        current.revenue += entry.metrics.revenue;
        current.daysCount += 1;
      }
    });

    // Compute points and package results
    return Array.from(map.entries()).map(([employeeId, data]) => {
      const emp = employees.find(e => e.id === employeeId);
      const points = calculateKpiPoints(data);
      return {
        employeeId,
        name: emp?.name || "Nhân viên ẩn danh",
        department: emp?.department || "Không xác định",
        position: emp?.position || "Nhân viên",
        metrics: data,
        points,
        daysCount: data.daysCount
      };
    }).sort((a, b) => b.points - a.points); // Sort by points desc
  }, [currentMonthEntries, filteredEmployees, employees]);

  // Top 3 Leaderboard rankers
  const topPerformers = useMemo(() => {
    return employeeSummaries.slice(0, 3);
  }, [employeeSummaries]);

  // Dashboard overall summary metrics
  const totalStats = useMemo(() => {
    const totals = { zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, followUp: 0, quote: 0, deal: 0, revenue: 0, points: 0 };
    employeeSummaries.forEach(emp => {
      totals.zalo += emp.metrics.zalo;
      totals.fb += emp.metrics.fb;
      totals.comment += emp.metrics.comment;
      totals.post += emp.metrics.post;
      totals.clientReply += emp.metrics.clientReply;
      totals.followUp += emp.metrics.followUp;
      totals.quote += emp.metrics.quote;
      totals.deal += emp.metrics.deal;
      totals.revenue += emp.metrics.revenue;
      totals.points += emp.points;
    });
    return totals;
  }, [employeeSummaries]);

  // Target values for the branch/month
  const selectedMonthTarget = useMemo(() => {
    // Return average or default targets for selected month
    return getTarget("all", selectedMonth);
  }, [selectedMonth, targets]);

  // Average KPI completion percentage
  const avgCompletionRate = useMemo(() => {
    if (employeeSummaries.length === 0) return 0;
    let totalRate = 0;
    let counts = 0;
    
    employeeSummaries.forEach(emp => {
      const target = getTarget(emp.employeeId, selectedMonth);
      // Let's compute average rate across key fields (e.g. Revenue, Deal, Zalo)
      const revRate = target.revenue > 0 ? (emp.metrics.revenue / target.revenue) * 100 : 100;
      const dealRate = target.deal > 0 ? (emp.metrics.deal / target.deal) * 100 : 100;
      const zaloRate = target.zalo > 0 ? (emp.metrics.zalo / target.zalo) * 100 : 100;
      
      totalRate += (Math.min(revRate, 100) + Math.min(dealRate, 100) + Math.min(zaloRate, 100)) / 3;
      counts++;
    });
    
    return Math.round(totalRate / (counts || 1));
  }, [employeeSummaries, selectedMonth]);

  // Report table filtering state
  const [reportSearch, setReportSearch] = useState("");
  const [reportDept, setReportDept] = useState("all");

  const filteredReports = useMemo(() => {
    return employeeSummaries.filter(row => {
      const matchSearch = row.name.toLowerCase().includes(reportSearch.toLowerCase()) || row.employeeId.includes(reportSearch);
      const matchDept = reportDept === "all" || row.department === reportDept;
      return matchSearch && matchDept;
    });
  }, [employeeSummaries, reportSearch, reportDept]);

  // Group departments for filter
  const departmentsList = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
  }, [employees]);

  // Prepare chart daily data
  const chartDailyData = useMemo(() => {
    const dailyMap = new Map<string, { date: string; revenue: number; inbox: number; deal: number }>();
    
    // Seed all dates of selected month
    const year = parseInt(selectedMonth.split("-")[0]);
    const monthIndex = parseInt(selectedMonth.split("-")[1]) - 1;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, "0")}`;
      dailyMap.set(dateStr, { date: `${d}/${monthIndex + 1}`, revenue: 0, inbox: 0, deal: 0 });
    }

    // Populate data from logs
    currentMonthEntries.forEach(entry => {
      const dayData = dailyMap.get(entry.date);
      if (dayData) {
        dayData.revenue += entry.metrics.revenue;
        dayData.inbox += entry.metrics.zalo + entry.metrics.fb;
        dayData.deal += entry.metrics.deal;
      }
    });

    return Array.from(dailyMap.values());
  }, [currentMonthEntries, selectedMonth]);

  // Save targets
  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const currentTargets = getStoredKpiTargets();
    
    const newTarget: KpiTarget = {
      id: targetEmployeeId === "all" ? `t-default-${targetForm.month}` : `t-${targetEmployeeId}-${targetForm.month}`,
      employeeId: targetEmployeeId,
      month: targetForm.month,
      metrics: targetForm.metrics
    };

    // Remove duplicates
    const nextTargets = currentTargets.filter(t => !(t.employeeId === targetEmployeeId && t.month === targetForm.month));
    nextTargets.push(newTarget);
    
    saveStoredKpiTargets(nextTargets);
    setTargets(nextTargets);
    setIsTargetModalOpen(false);
    showToast("Đã lưu chỉ tiêu KPI mới thành công!", "success");
  };

  const openAddTargetModal = () => {
    setTargetEmployeeId("all");
    setTargetForm({
      employeeId: "all",
      month: selectedMonth,
      metrics: { zalo: 2000, fb: 1500, comment: 500, post: 150, clientReply: 600, khachChuDongIB: 60, followUp: 400, quote: 80, deal: 25, revenue: 80000000 }
    });
    setIsTargetModalOpen(true);
  };

  const handleExportExcel = () => {
    showToast(`Đã xuất báo cáo KPI tháng ${selectedMonth} ra file Excel thành công!`, "success");
  };

  // Compare stats logic
  const comparisonData = useMemo(() => {
    // Gather details for item 1
    const entries1 = entries.filter(e => e.date.startsWith(compMonth1) && (compEmpId1 === "all" ? filteredEmployeeIds.has(e.employeeId) : e.employeeId === compEmpId1));
    const totals1 = { zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, khachChuDongIB: 0, followUp: 0, quote: 0, deal: 0, revenue: 0 };
    entries1.forEach(e => {
      Object.keys(totals1).forEach(k => {
        totals1[k as keyof KpiMetrics] += e.metrics[k as keyof KpiMetrics] || 0;
      });
    });
    const points1 = calculateKpiPoints(totals1);

    // Gather details for item 2
    const entries2 = entries.filter(e => e.date.startsWith(compMonth2) && (compEmpId2 === "all" ? filteredEmployeeIds.has(e.employeeId) : e.employeeId === compEmpId2));
    const totals2 = { zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, khachChuDongIB: 0, followUp: 0, quote: 0, deal: 0, revenue: 0 };
    entries2.forEach(e => {
      Object.keys(totals2).forEach(k => {
        totals2[k as keyof KpiMetrics] += e.metrics[k as keyof KpiMetrics] || 0;
      });
    });
    const points2 = calculateKpiPoints(totals2);

    return {
      t1: { totals: totals1, points: points1, label: compEmpId1 === "all" ? `Toàn chi nhánh (${compMonth1})` : `${employees.find(e => e.id === compEmpId1)?.name} (${compMonth1})` },
      t2: { totals: totals2, points: points2, label: compEmpId2 === "all" ? `Toàn chi nhánh (${compMonth2})` : `${employees.find(e => e.id === compEmpId2)?.name} (${compMonth2})` }
    };
  }, [entries, compMonth1, compEmpId1, compMonth2, compEmpId2, filteredEmployeeIds, employees]);

  // Selected Employee log logs (for detail modal)
  const selectedEmployeeLogs = useMemo(() => {
    if (!selectedEmployeeForDetail) return [];
    return entries.filter(e => 
      e.employeeId === selectedEmployeeForDetail.id && 
      e.date.startsWith(selectedMonth)
    ).sort((a, b) => b.date.localeCompare(a.date)); // Newest first
  }, [entries, selectedEmployeeForDetail, selectedMonth]);

  const initials = (name: string) => {
    return name.split(" ").slice(-2).map(n => n[0]).join("").toUpperCase();
  };

  return (
    <div className="space-y-6 select-none pb-12">
      {/* Top Banner widgets */}
      <div className="bg-gradient-to-br from-[#160606] to-[#360D0D] rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-red-950/20">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <span className="bg-[#FF6D00]/20 text-[#FF8A00] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">KPI Quản trị</span>
            <h2 className="text-2xl font-black mt-3 tracking-tight">Hệ Thống Quản Lý & Phân Tích KPI</h2>
            <p className="text-xs text-white/50 mt-1 leading-relaxed">
              Theo dõi hiệu suất truyền thông, tương tác khách hàng và doanh thu của toàn bộ nhân viên chi nhánh.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleRefresh}
              className="p-2.5 rounded-xl border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all bg-white/5 cursor-pointer"
              title="Tải lại dữ liệu"
            >
              <RefreshCw size={15} />
            </button>
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shadow-inner">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white border-0 text-xs font-bold focus:outline-none px-2 py-1 select-none"
                style={{ colorScheme: "dark" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-6 py-3 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "overview" ? "border-[#C62828] text-[#C62828]" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <BarChart3 size={15} />
          Tổng quan & Báo cáo
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-6 py-3 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "stats" ? "border-[#C62828] text-[#C62828]" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Award size={15} />
          Thống kê & Xếp hạng
        </button>
        <button
          onClick={() => setActiveTab("compare")}
          className={`px-6 py-3 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "compare" ? "border-[#C62828] text-[#C62828]" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <RefreshCcw size={15} />
          So sánh hiệu suất
        </button>
      </div>

      {/* TAB Content: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Doanh thu tháng này</p>
                <h3 className="text-xl font-black text-gray-800 mt-2">
                  {(totalStats.revenue).toLocaleString("vi-VN")} đ
                </h3>
              </div>
              <p className="text-[10px] text-green-600 font-bold mt-3 flex items-center gap-1">
                <TrendingUp size={12} /> Chỉ tiêu: {(selectedMonthTarget.revenue).toLocaleString("vi-VN")} đ
              </p>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tổng chốt Deal</p>
                <h3 className="text-xl font-black text-gray-800 mt-2">{totalStats.deal} Deals</h3>
              </div>
              <p className="text-[10px] text-orange-600 font-bold mt-3">
                Chỉ tiêu toàn chi nhánh: {selectedMonthTarget.deal}
              </p>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hoàn thành KPI TB</p>
                <h3 className="text-xl font-black text-gray-800 mt-2">{avgCompletionRate}%</h3>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${avgCompletionRate >= 80 ? "bg-green-500" : avgCompletionRate >= 50 ? "bg-orange-500" : "bg-red-500"}`}
                  style={{ width: `${avgCompletionRate}%` }}
                />
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tương tác Zalo/FB</p>
                <h3 className="text-xl font-black text-gray-800 mt-2">{(totalStats.zalo + totalStats.fb).toLocaleString()}</h3>
              </div>
              <p className="text-[10px] text-blue-600 font-bold mt-3">
                Zalo: {totalStats.zalo.toLocaleString()} | FB: {totalStats.fb.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Sub tabs overview */}
          <div className="flex bg-gray-100 rounded-xl p-1 w-fit shadow-inner border border-gray-200">
            <button
              onClick={() => setOverviewSubTab("charts")}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                overviewSubTab === "charts" ? "bg-white text-gray-800 shadow-xs" : "text-gray-400 hover:text-gray-700"
              }`}
            >
              Biểu đồ trực quan
            </button>
            <button
              onClick={() => setOverviewSubTab("reports")}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                overviewSubTab === "reports" ? "bg-white text-gray-800 shadow-xs" : "text-gray-400 hover:text-gray-700"
              }`}
            >
              Báo cáo chi tiết
            </button>
            <button
              onClick={() => setOverviewSubTab("targets")}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                overviewSubTab === "targets" ? "bg-white text-gray-800 shadow-xs" : "text-gray-400 hover:text-gray-700"
              }`}
            >
              Chỉ tiêu mục tiêu
            </button>
          </div>

          {/* Sub tab content: Charts */}
          {overviewSubTab === "charts" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily revenue trend */}
              <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
                <div className="mb-4">
                  <h4 className="font-bold text-gray-800 text-sm">Xu hướng doanh thu 30 ngày</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Biểu đồ tổng hợp doanh thu phát sinh trong tháng</p>
                </div>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartDailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C62828" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#C62828" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="date" stroke="#9ca3af" axisLine={false} tickLine={false} />
                      <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} tickFormatter={(val) => `${(val/1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(value) => [`${(value as number).toLocaleString()} đ`, "Doanh thu"]} />
                      <Area type="monotone" dataKey="revenue" stroke="#C62828" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Conversion chart */}
              <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
                <div className="mb-4">
                  <h4 className="font-bold text-gray-800 text-sm">Liên hệ & Hiệu suất Deal</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Mối tương quan giữa các ngày và tương tác hội thoại</p>
                </div>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="date" stroke="#9ca3af" axisLine={false} tickLine={false} />
                      <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }} />
                      <Bar dataKey="inbox" name="Tổng Inbox (FB+Zalo)" fill="#2563EB" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="deal" name="Số Deal chốt" fill="#16A34A" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Sub tab content: Reports */}
          {overviewSubTab === "reports" && (
            <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Bảng báo cáo KPI tổng hợp</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Dữ liệu lũy kế tất cả chỉ số trong tháng {selectedMonth}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                    <input
                      type="text"
                      placeholder="Tìm nhân viên..."
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-red-600/30 w-full"
                    />
                  </div>
                  <select
                    value={reportDept}
                    onChange={(e) => setReportDept(e.target.value)}
                    className="py-2 px-3 border border-gray-200 rounded-xl text-xs focus:outline-none text-gray-600"
                  >
                    <option value="all">Tất cả phòng ban</option>
                    {departmentsList.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 py-2 px-4 bg-green-700 text-white rounded-xl text-xs font-bold hover:bg-green-800 transition-all shadow-md cursor-pointer"
                  >
                    <Download size={13} />
                    Xuất Excel
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold">
                      <th className="p-3">Nhân viên</th>
                      <th className="p-3 text-center">Tổng Điểm</th>
                      <th className="p-3 text-center">Days</th>
                      <th className="p-3 text-center">IB Zalo</th>
                      <th className="p-3 text-center">IB Fanpage</th>
                      <th className="p-3 text-center">Comment</th>
                      <th className="p-3 text-center">Đăng bài</th>
                      <th className="p-3 text-center">KH Phản hồi</th>
                      <th className="p-3 text-center">Báo giá</th>
                      <th className="p-3 text-center">Chốt Deal</th>
                      <th className="p-3 text-right">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-600">
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-8 text-gray-400 font-medium">Không tìm thấy kết quả phù hợp</td>
                      </tr>
                    ) : (
                      filteredReports.map(row => (
                        <tr key={row.employeeId} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-3">
                            <button
                              onClick={() => setSelectedEmployeeForDetail(employees.find(e => e.id === row.employeeId) || null)}
                              className="font-bold text-gray-800 hover:text-red-700 text-left hover:underline focus:outline-none cursor-pointer"
                            >
                              {row.name}
                            </button>
                            <div className="text-[10px] text-gray-400 font-medium mt-0.5">{row.position} • {row.department}</div>
                          </td>
                          <td className="p-3 text-center font-bold text-red-600">{row.points.toLocaleString()}</td>
                          <td className="p-3 text-center text-gray-500">{row.daysCount}</td>
                          <td className="p-3 text-center">{row.metrics.zalo.toLocaleString()}</td>
                          <td className="p-3 text-center">{row.metrics.fb.toLocaleString()}</td>
                          <td className="p-3 text-center">{row.metrics.comment.toLocaleString()}</td>
                          <td className="p-3 text-center">{row.metrics.post.toLocaleString()}</td>
                          <td className="p-3 text-center">{row.metrics.clientReply.toLocaleString()}</td>
                          <td className="p-3 text-center">{row.metrics.quote.toLocaleString()}</td>
                          <td className="p-3 text-center text-green-700 font-bold">{row.metrics.deal.toLocaleString()}</td>
                          <td className="p-3 text-right font-semibold text-gray-800">{(row.metrics.revenue).toLocaleString()} đ</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub tab content: Targets list */}
          {overviewSubTab === "targets" && (
            <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Danh sách chỉ tiêu KPI thiết lập</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Chỉ tiêu tổng hoặc chỉ tiêu gán riêng cho từng thành viên trong tháng {selectedMonth}</p>
                </div>
                <button
                  onClick={openAddTargetModal}
                  className="flex items-center gap-1 py-2 px-4 bg-[#C62828] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-md cursor-pointer"
                >
                  <Plus size={14} />
                  Thêm Target
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold">
                      <th className="p-3">Đối tượng gán</th>
                      <th className="p-3 text-center">IB Zalo</th>
                      <th className="p-3 text-center">IB FB</th>
                      <th className="p-3 text-center">Comment</th>
                      <th className="p-3 text-center">KH Phản hồi</th>
                      <th className="p-3 text-center">Đăng bài</th>
                      <th className="p-3 text-center">Báo giá</th>
                      <th className="p-3 text-center">Chốt Deal</th>
                      <th className="p-3 text-right">Mục tiêu Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-600">
                    {targets.filter(t => t.month === selectedMonth).map(target => {
                      const empName = target.employeeId === "all" ? "Mặc định (Tất cả nhân viên)" : (employees.find(e => e.id === target.employeeId)?.name || "Nhân viên ẩn danh");
                      return (
                        <tr key={target.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-3 font-bold text-gray-800">
                            {empName}
                            {target.employeeId !== "all" && <span className="text-[9px] font-normal text-gray-400 ml-1">({target.employeeId})</span>}
                          </td>
                          <td className="p-3 text-center font-mono">{target.metrics.zalo.toLocaleString()}</td>
                          <td className="p-3 text-center font-mono">{target.metrics.fb.toLocaleString()}</td>
                          <td className="p-3 text-center font-mono">{target.metrics.comment.toLocaleString()}</td>
                          <td className="p-3 text-center font-mono">{target.metrics.clientReply.toLocaleString()}</td>
                          <td className="p-3 text-center font-mono">{target.metrics.post.toLocaleString()}</td>
                          <td className="p-3 text-center font-mono">{target.metrics.quote.toLocaleString()}</td>
                          <td className="p-3 text-center font-bold text-green-700 font-mono">{target.metrics.deal.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-gray-800 font-mono">{(target.metrics.revenue).toLocaleString()} đ</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB Content: Stats Leaderboard */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          {/* Top 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 items-end max-w-4xl mx-auto">
            {/* Silver Rank */}
            {topPerformers[1] && (
              <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col items-center text-center order-2 md:order-1 h-[240px] justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#e2e8f0] opacity-30 rounded-bl-full flex items-center justify-center text-white font-black text-xl"></div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center text-white font-black text-2xl shadow-md border-4 border-white">
                  🥈
                </div>
                <div className="mt-3">
                  <h4 className="font-extrabold text-gray-800 text-sm">{topPerformers[1].name}</h4>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">{topPerformers[1].position} • {topPerformers[1].department}</p>
                </div>
                <p className="text-xl font-black text-gray-600 mt-2">{topPerformers[1].points} <span className="text-[10px] font-bold text-gray-400">điểm</span></p>
              </div>
            )}

            {/* Gold Rank */}
            {topPerformers[0] && (
              <div className="bg-[#FFFDF6] rounded-3xl p-6 border-2 border-yellow-300 shadow-md flex flex-col items-center text-center order-1 md:order-2 h-[270px] justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-100 opacity-40 rounded-bl-full flex items-center justify-center text-white font-black text-xl"></div>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center text-white font-black text-3xl shadow-lg border-4 border-white animate-[pulse_3s_infinite]">
                  👑
                </div>
                <div className="mt-3">
                  <span className="bg-yellow-100 text-yellow-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Top Performers</span>
                  <h4 className="font-black text-gray-800 text-base mt-2">{topPerformers[0].name}</h4>
                  <p className="text-[11px] text-gray-500 font-bold mt-1">{topPerformers[0].position} • {topPerformers[0].department}</p>
                </div>
                <p className="text-2xl font-black text-yellow-600 mt-2">{topPerformers[0].points} <span className="text-xs font-bold text-amber-500">điểm</span></p>
              </div>
            )}

            {/* Bronze Rank */}
            {topPerformers[2] && (
              <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col items-center text-center order-3 md:order-3 h-[220px] justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#fed7aa] opacity-25 rounded-bl-full flex items-center justify-center text-white font-black text-xl"></div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-white font-black text-2xl shadow-md border-4 border-white">
                  🥉
                </div>
                <div className="mt-3">
                  <h4 className="font-extrabold text-gray-800 text-sm">{topPerformers[2].name}</h4>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">{topPerformers[2].position} • {topPerformers[2].department}</p>
                </div>
                <p className="text-xl font-black text-amber-700 mt-2">{topPerformers[2].points} <span className="text-[10px] font-bold text-gray-400">điểm</span></p>
              </div>
            )}
          </div>

          {/* Full Leaderboard Table */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
            <h4 className="font-bold text-gray-800 text-sm mb-4">Bảng xếp hạng điểm tích lũy KPI</h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold">
                    <th className="p-3 w-16 text-center">Hạng</th>
                    <th className="p-3">Nhân viên</th>
                    <th className="p-3">Phòng ban</th>
                    <th className="p-3 text-center">Số ngày báo cáo</th>
                    <th className="p-3 text-right">Tổng Điểm KPI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600">
                  {employeeSummaries.map((row, idx) => (
                    <tr key={row.employeeId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 text-center">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold mx-auto text-xs ${
                          idx === 0 ? "bg-yellow-100 text-yellow-700" :
                          idx === 1 ? "bg-gray-100 text-gray-600" :
                          idx === 2 ? "bg-orange-100 text-orange-700" :
                          "text-gray-400"
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="p-3 font-extrabold text-gray-800">
                        <button
                          onClick={() => setSelectedEmployeeForDetail(employees.find(e => e.id === row.employeeId) || null)}
                          className="hover:underline hover:text-red-700 focus:outline-none cursor-pointer"
                        >
                          {row.name}
                        </button>
                      </td>
                      <td className="p-3">{row.department}</td>
                      <td className="p-3 text-center font-semibold text-gray-700">{row.daysCount} ngày</td>
                      <td className="p-3 text-right font-black text-red-600 text-sm">{row.points.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB Content: Compare */}
      {activeTab === "compare" && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
            <h4 className="font-bold text-gray-800 text-sm mb-4">Chọn đối tượng so sánh chỉ số</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Target 1 */}
              <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/40 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đối tượng 1</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Tháng</label>
                    <input
                      type="month"
                      value={compMonth1}
                      onChange={(e) => setCompMonth1(e.target.value)}
                      className="w-full py-1.5 px-3 border border-gray-200 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Nhân viên</label>
                    <select
                      value={compEmpId1}
                      onChange={(e) => setCompEmpId1(e.target.value)}
                      className="w-full py-1.5 px-3 border border-gray-200 rounded-xl text-xs focus:outline-none text-gray-600"
                    >
                      <option value="all">Toàn bộ chi nhánh</option>
                      {filteredEmployees.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Target 2 */}
              <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/40 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đối tượng 2</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Tháng</label>
                    <input
                      type="month"
                      value={compMonth2}
                      onChange={(e) => setCompMonth2(e.target.value)}
                      className="w-full py-1.5 px-3 border border-gray-200 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Nhân viên</label>
                    <select
                      value={compEmpId2}
                      onChange={(e) => setCompEmpId2(e.target.value)}
                      className="w-full py-1.5 px-3 border border-gray-200 rounded-xl text-xs focus:outline-none text-gray-600"
                    >
                      <option value="all">Toàn bộ chi nhánh</option>
                      {filteredEmployees.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics comparison view */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h4 className="font-bold text-gray-800 text-sm">Kết quả so sánh chi tiết</h4>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hiệu suất Delta</span>
            </div>

            {/* Score points delta */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-6 bg-gradient-to-r from-red-50/30 to-orange-50/30 border border-red-100 rounded-2xl gap-4">
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Đối chiếu điểm KPI</p>
                <h3 className="text-lg font-extrabold text-gray-800 mt-1">So sánh tổng hợp điểm quy đổi</h3>
              </div>
              <div className="flex items-center gap-8 flex-wrap justify-center">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-400">{comparisonData.t1.label}</p>
                  <p className="text-2xl font-black text-gray-800 mt-1">{comparisonData.t1.points}</p>
                </div>
                <div className="text-2xl text-gray-300 font-bold">vs</div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-400">{comparisonData.t2.label}</p>
                  <p className="text-2xl font-black text-gray-800 mt-1">{comparisonData.t2.points}</p>
                </div>
                {/* Delta points */}
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-400">Chênh lệch</p>
                  {comparisonData.t1.points - comparisonData.t2.points >= 0 ? (
                    <span className="text-lg font-black text-green-600 flex items-center justify-center gap-0.5 mt-1">
                      <ArrowUpRight size={16} /> +{(comparisonData.t1.points - comparisonData.t2.points).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-lg font-black text-red-600 flex items-center justify-center gap-0.5 mt-1">
                      <ArrowDownRight size={16} /> {(comparisonData.t1.points - comparisonData.t2.points).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 9 Metrics Compare Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Object.keys(KPI_METRIC_LABELS).map((metricKey) => {
                const label = KPI_METRIC_LABELS[metricKey as keyof KpiMetrics];
                const val1 = comparisonData.t1.totals[metricKey as keyof KpiMetrics];
                const val2 = comparisonData.t2.totals[metricKey as keyof KpiMetrics];
                const diff = val1 - val2;
                const pct = val2 > 0 ? Math.round((diff / val2) * 100) : (diff > 0 ? 100 : 0);

                const isRevenue = metricKey === "revenue";

                return (
                  <div key={metricKey} className="p-5 border border-gray-100 rounded-2xl hover:shadow-xs transition-shadow">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                    <div className="flex justify-between items-end mt-4">
                      <div>
                        <div className="flex text-xs font-semibold text-gray-500 gap-1.5 items-center">
                          <span>{isRevenue ? `${(val1 / 1000000).toFixed(1)}M` : val1.toLocaleString()}</span>
                          <span className="text-gray-300">/</span>
                          <span>{isRevenue ? `${(val2 / 1000000).toFixed(1)}M` : val2.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        {diff >= 0 ? (
                          <div className="text-green-600">
                            <span className="text-sm font-black flex items-center justify-end">
                              +{isRevenue ? `${(diff / 1000000).toFixed(1)}M` : diff.toLocaleString()}
                            </span>
                            <span className="text-[9px] font-bold">({pct >= 0 ? `+${pct}%` : `${pct}%`})</span>
                          </div>
                        ) : (
                          <div className="text-red-600">
                            <span className="text-sm font-black flex items-center justify-end">
                              {isRevenue ? `${(diff / 1000000).toFixed(1)}M` : diff.toLocaleString()}
                            </span>
                            <span className="text-[9px] font-bold">({pct}%)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Target Modal Component */}
      {isTargetModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setIsTargetModalOpen(false)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden" style={{ animation: "sessionModalIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-[#C62828] to-[#E64A19]" />
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-extrabold text-gray-800">Cấu hình Chỉ tiêu KPI Mục tiêu</h3>
                <button type="button" onClick={() => setIsTargetModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveTarget} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-500 mb-1">Gán mục tiêu cho</label>
                    <select
                      value={targetEmployeeId}
                      onChange={(e) => setTargetEmployeeId(e.target.value)}
                      className="w-full py-2 px-3 border border-gray-200 rounded-xl focus:outline-none text-gray-600"
                    >
                      <option value="all">Mặc định (Tất cả nhân viên)</option>
                      {filteredEmployees.map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-500 mb-1">Tháng áp dụng</label>
                    <input
                      type="month"
                      value={targetForm.month}
                      onChange={(e) => setTargetForm(prev => ({ ...prev, month: e.target.value }))}
                      className="w-full py-2 px-3 border border-gray-200 rounded-xl focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="font-bold text-gray-600 mb-3 uppercase tracking-wider text-[10px]">Chỉ tiêu chỉ số</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-500 mb-1">Mục tiêu Zalo</label>
                      <input
                        type="number"
                        value={targetForm.metrics.zalo}
                        onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, zalo: parseInt(e.target.value) || 0 } }))}
                        className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Mục tiêu FB</label>
                      <input
                        type="number"
                        value={targetForm.metrics.fb}
                        onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, fb: parseInt(e.target.value) || 0 } }))}
                        className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Mục tiêu Comment</label>
                      <input
                        type="number"
                        value={targetForm.metrics.comment}
                        onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, comment: parseInt(e.target.value) || 0 } }))}
                        className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Mục tiêu Đăng bài</label>
                      <input
                        type="number"
                        value={targetForm.metrics.post}
                        onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, post: parseInt(e.target.value) || 0 } }))}
                        className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">KH Phản hồi</label>
                      <input
                        type="number"
                        value={targetForm.metrics.clientReply}
                        onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, clientReply: parseInt(e.target.value) || 0 } }))}
                        className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Mục tiêu khachChuDongIB</label>
                      <input
                        type="number"
                        value={targetForm.metrics.khachChuDongIB || 0}
                        onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, khachChuDongIB: parseInt(e.target.value) || 0 } }))}
                        className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Chăm sóc lại</label>
                      <input
                        type="number"
                        value={targetForm.metrics.followUp}
                        onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, followUp: parseInt(e.target.value) || 0 } }))}
                        className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Mục tiêu Báo giá</label>
                      <input
                        type="number"
                        value={targetForm.metrics.quote}
                        onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, quote: parseInt(e.target.value) || 0 } }))}
                        className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Mục tiêu Deal</label>
                      <input
                        type="number"
                        value={targetForm.metrics.deal}
                        onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, deal: parseInt(e.target.value) || 0 } }))}
                        className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Mục tiêu Doanh thu</label>
                      <input
                        type="number"
                        value={targetForm.metrics.revenue}
                        onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, revenue: parseInt(e.target.value) || 0 } }))}
                        className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsTargetModalOpen(false)}
                    className="py-2 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer font-bold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-6 rounded-xl bg-[#C62828] text-white hover:opacity-90 transition-all font-bold cursor-pointer"
                  >
                    Lưu cấu hình
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Employee Logs Detail Modal */}
      {selectedEmployeeForDetail && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setSelectedEmployeeForDetail(null)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col" style={{ animation: "sessionModalIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-[#C62828] to-[#E64A19]" />
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-700 flex items-center justify-center font-extrabold text-sm border border-red-100">
                  {initials(selectedEmployeeForDetail.name)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-800">{selectedEmployeeForDetail.name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">{selectedEmployeeForDetail.position} • {selectedEmployeeForDetail.department}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedEmployeeForDetail(null)} 
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* List entries */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ scrollbarWidth: "thin" }}>
              <h4 className="font-bold text-gray-800 text-xs">Danh sách báo cáo hàng ngày (Tháng {selectedMonth})</h4>
              
              {selectedEmployeeLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs font-semibold">Chưa có nhật ký KPI nào được gửi cho tháng này</div>
              ) : (
                selectedEmployeeLogs.map((log) => (
                  <div key={log.id} className="p-4 border border-gray-100 rounded-2xl bg-gray-50/30 hover:bg-gray-50/60 transition-colors space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-xs font-black text-gray-800">{log.date}</span>
                      <span className="text-xs font-extrabold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md">
                        {calculateKpiPoints(log.metrics)} điểm
                      </span>
                    </div>

                    {/* Metrics grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-[10px]">
                      <div className="p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-400">Zalo</span>
                        <p className="font-bold text-gray-800 mt-0.5">{log.metrics.zalo}</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-400">FB</span>
                        <p className="font-bold text-gray-800 mt-0.5">{log.metrics.fb}</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-400">Comment</span>
                        <p className="font-bold text-gray-800 mt-0.5">{log.metrics.comment}</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-400">Post</span>
                        <p className="font-bold text-gray-800 mt-0.5">{log.metrics.post}</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-400">KH Phản hồi</span>
                        <p className="font-bold text-gray-800 mt-0.5">{log.metrics.clientReply}</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-400">Chăm sóc lại</span>
                        <p className="font-bold text-gray-800 mt-0.5">{log.metrics.followUp}</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-400">Báo giá</span>
                        <p className="font-bold text-gray-800 mt-0.5">{log.metrics.quote}</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-400">Chốt Deal</span>
                        <p className="font-bold text-green-700 mt-0.5">{log.metrics.deal}</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-gray-100 col-span-2">
                        <span className="text-gray-400">Doanh thu</span>
                        <p className="font-bold text-gray-800 mt-0.5">{(log.metrics.revenue).toLocaleString()} đ</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {log.notes && (
                      <div className="text-[10px] text-gray-500 bg-white p-2 rounded-lg border border-gray-100 leading-relaxed">
                        <span className="font-bold text-gray-700">Ghi chú:</span> {log.notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button 
                type="button"
                onClick={() => setSelectedEmployeeForDetail(null)} 
                className="py-2 px-6 rounded-xl bg-gray-800 text-white font-bold text-xs hover:bg-gray-900 transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
