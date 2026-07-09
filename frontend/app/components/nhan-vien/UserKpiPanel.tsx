import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays, BarChart3, Plus, FileText, ChevronLeft, ChevronRight, Eye, RefreshCw, X, Check, ClipboardList, HelpCircle,
  Calendar, DollarSign, Target, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Employee } from "../../types";
import { useToast } from "../../hooks/useToast";
import {
  getStoredKpiEntries, getStoredKpiTargets, saveStoredKpiEntries,
  calculateKpiPoints, getTarget, KpiEntry, KpiMetrics, KPI_METRIC_LABELS, KPI_POINTS_WEIGHT
} from "../kpi/kpiMockData";

const RenderCircleDot = (props: any) => {
  const { cx, cy, stroke } = props;
  if (!cx || !cy) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill="#FFFFFF"
      stroke={stroke}
      strokeWidth={1.5}
    />
  );
};

const getVietnameseMonthName = (monthStr: string) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  const monthMap: { [key: string]: string } = {
    "01": "Tháng Giêng", "02": "Tháng Hai", "03": "Tháng Ba", "04": "Tháng Tư",
    "05": "Tháng Năm", "06": "Tháng Sáu", "07": "Tháng Bảy", "08": "Tháng Tám",
    "09": "Tháng Chín", "10": "Tháng Mười", "11": "Tháng Mười Một", "12": "Tháng Mười Hai"
  };
  return `${monthMap[month] || `Tháng ${month}`} ${year}`;
};

const MONTH_LABELS_USER = ["Thg1","Thg2","Thg3","Thg4","Thg5","Thg6","Thg7","Thg8","Thg9","Thg10","Thg11","Thg12"];

const UserCustomMonthPicker = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentYear = value ? parseInt(value.split("-")[0]) : new Date().getFullYear();
  const currentMonthIdx = value ? parseInt(value.split("-")[1]) - 1 : new Date().getMonth();
  const [viewYear, setViewYear] = useState(currentYear);
  const todayYear = new Date().getFullYear();
  const todayMonth = new Date().getMonth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectMonth = (monthIdx: number) => {
    onChange(`${viewYear}-${String(monthIdx + 1).padStart(2, "0")}`);
    setIsOpen(false);
  };

  const handleThisMonth = () => {
    const now = new Date();
    onChange(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-black text-gray-800 cursor-pointer hover:text-[#C62828] transition-colors">
        {getVietnameseMonthName(value)}
        <Calendar size={12} className="text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 p-4 w-56">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setViewYear(y => y - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <ChevronRight size={14} className="text-gray-500 rotate-180" />
            </button>
            <span className="text-xs font-black text-gray-700">{viewYear}</span>
            <button type="button" onClick={() => setViewYear(y => y + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <ChevronRight size={14} className="text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1 mb-3">
            {MONTH_LABELS_USER.map((label, idx) => {
              const isSelected = viewYear === currentYear && idx === currentMonthIdx;
              const isToday = viewYear === todayYear && idx === todayMonth;
              return (
                <button key={idx} type="button" onClick={() => handleSelectMonth(idx)}
                  className={`py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer
                    ${isSelected ? "bg-[#C62828] text-white shadow-md" : isToday ? "bg-red-100 text-[#C62828]" : "text-gray-600 hover:bg-red-50 hover:text-[#C62828]"}`}>
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <button type="button" onClick={() => { onChange(""); setIsOpen(false); }} className="text-[11px] font-bold text-gray-400 hover:text-gray-600 cursor-pointer">Xóa</button>
            <button type="button" onClick={handleThisMonth} className="text-[11px] font-bold text-[#C62828] hover:opacity-75 cursor-pointer">Tháng này</button>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const fullDate = payload[0].payload.fullDate || label;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md text-xs space-y-1">
        <p className="font-bold text-gray-800 mb-1">{fullDate}</p>
        {payload.map((item: any, index: number) => {
          let colorClass = "text-gray-600";
          if (item.dataKey === "quote") colorClass = "text-[#0D9488]";
          else if (item.dataKey === "deal") colorClass = "text-[#16A34A]";
          else if (item.dataKey === "followUp") colorClass = "text-[#EC4899]";

          return (
            <p key={index} className={`font-semibold ${colorClass}`}>
              {item.name} : {item.value}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

interface UserKpiPanelProps {
  employee: Employee | null;
}

export function UserKpiPanel({ employee }: UserKpiPanelProps) {
  const { showToast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState("2026-07");
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "history">("overview");
  const [historyPage, setHistoryPage] = useState(1);

  // Load KPI data from local storage
  const [entries, setEntries] = useState<KpiEntry[]>(() => getStoredKpiEntries(employee?.id));

  React.useEffect(() => {
    if (employee?.id) {
      setEntries(getStoredKpiEntries(employee.id));
    }
  }, [employee?.id]);

  // Interactive Modal states
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [selectedEntryForDetail, setSelectedEntryForDetail] = useState<KpiEntry | null>(null);

  // New entry form state
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formMetrics, setFormMetrics] = useState<KpiMetrics>({
    zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, khachChuDongIB: 0, followUp: 0, quote: 0, deal: 0, revenue: 0
  });
  const [formNotes, setFormNotes] = useState("");

  // Lock background scroll when modals are open
  React.useEffect(() => {
    if (isInputModalOpen || selectedEntryForDetail) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isInputModalOpen, selectedEntryForDetail]);

  const handleRefresh = () => {
    setEntries(getStoredKpiEntries());
    showToast("Đã cập nhật dữ liệu KPI cá nhân!", "success");
  };

  // If employee is null, render loading state
  if (!employee) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-400 text-xs">
        <RefreshCw size={16} className="animate-spin mr-2" />
        Đang tải thông tin KPI...
      </div>
    );
  }

  // Vietnamese month name translation helper
  const getVietnameseMonthName = (monthStr: string) => {
    if (!monthStr) return "-----------------";
    const parts = monthStr.split("-");
    if (parts.length < 2) return "-----------------";
    const [year, month] = parts;
    const monthNames: Record<string, string> = {
      "01": "Tháng Một",
      "02": "Tháng Hai",
      "03": "Tháng Ba",
      "04": "Tháng Tư",
      "05": "Tháng Năm",
      "06": "Tháng Sáu",
      "07": "Tháng Bảy",
      "08": "Tháng Tám",
      "09": "Tháng Chín",
      "10": "Tháng Mười",
      "11": "Tháng Mười Một",
      "12": "Tháng Mười Hai",
    };
    return monthNames[month] ? `${monthNames[month]} ${year}` : "-----------------";
  };

  // Filter logs for this employee for selected month
  const userMonthEntries = useMemo(() => {
    return entries.filter(e => e.employeeId === employee.id && e.date.startsWith(selectedMonth));
  }, [entries, employee.id, selectedMonth]);

  // Filter all logs for this employee sorted by date descending for History tab
  const userAllEntries = useMemo(() => {
    return entries
      .filter(e => e.employeeId === employee.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, employee.id]);

  const itemsPerPage = 15;
  const totalItems = userAllEntries.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentPage = Math.max(1, Math.min(historyPage, totalPages));

  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return userAllEntries.slice(startIndex, startIndex + itemsPerPage);
  }, [userAllEntries, currentPage, itemsPerPage]);

  const formatKpiDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return `${day}/${month}/${year}`;
  };

  const formatRevenue = (revenue: number) => {
    return `${revenue.toLocaleString("vi-VN")}đ`;
  };

  const parseNotes = (notesText: string) => {
    let nhuCau = "";
    let taiSao = "";
    const text = notesText || "";
    
    if (text.includes("Nhu cầu khách") || text.includes("Tại sao mất khách")) {
      const matchNhuCau = text.match(/Nhu cầu khách:?\s*([\s\S]*?)(?=\nTại sao mất khách|$)/i);
      const matchTaiSao = text.match(/Tại sao mất khách:?\s*([\s\S]*)/i);
      nhuCau = matchNhuCau ? matchNhuCau[1].trim() : "";
      taiSao = matchTaiSao ? matchTaiSao[1].trim() : "";
    } else {
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length >= 2) {
        nhuCau = lines[0];
        taiSao = lines[1];
      } else {
        nhuCau = text;
        taiSao = "";
      }
    }
    return { nhuCau, taiSao };
  };

  // Aggregate current metrics totals for the month
  const currentMonthTotals = useMemo(() => {
    const totals = { zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, khachChuDongIB: 0, followUp: 0, quote: 0, deal: 0, revenue: 0 };
    userMonthEntries.forEach(entry => {
      Object.keys(totals).forEach(k => {
        totals[k as keyof KpiMetrics] += entry.metrics[k as keyof KpiMetrics] || 0;
      });
    });
    return totals;
  }, [userMonthEntries]);

  // Get employee targets for selected month
  const monthTargets = useMemo(() => {
    return getTarget(employee.id, selectedMonth);
  }, [employee.id, selectedMonth]);

  const getDailyTarget = (metricKey: keyof KpiMetrics) => {
    const monthlyTarget = monthTargets[metricKey] || 0;
    return Math.ceil(monthlyTarget / 23);
  };

  // Compute total monthly points
  const totalMonthPoints = useMemo(() => {
    return calculateKpiPoints(currentMonthTotals);
  }, [currentMonthTotals]);

  // Today's KPI points and comparison with yesterday
  const todayKpiPoints = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayEntry = entries.find(e => e.employeeId === employee.id && e.date === todayStr);
    return todayEntry ? calculateKpiPoints(todayEntry.metrics) : 0;
  }, [entries, employee.id]);

  const yesterdayKpiPoints = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const yesterdayEntry = entries.find(e => e.employeeId === employee.id && e.date === yesterdayStr);
    return yesterdayEntry ? calculateKpiPoints(yesterdayEntry.metrics) : 0;
  }, [entries, employee.id]);

  // Today's KPI points delta calculation
  const todayKpiDelta = useMemo(() => {
    const diff = todayKpiPoints - yesterdayKpiPoints;
    const pct = yesterdayKpiPoints > 0 ? Math.round((diff / yesterdayKpiPoints) * 100) : (todayKpiPoints > 0 ? 100 : 0);
    return { diff, pct };
  }, [todayKpiPoints, yesterdayKpiPoints]);

  // Current week's revenue and comparison with last week
  const currentWeekRevenue = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekEntries = entries.filter(e => {
      if (e.employeeId !== employee.id) return false;
      const entryDate = new Date(e.date);
      return entryDate >= monday && entryDate <= sunday;
    });

    return weekEntries.reduce((sum, e) => sum + e.metrics.revenue, 0);
  }, [entries, employee.id]);

  const lastWeekRevenue = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) - 7; // Last week Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekEntries = entries.filter(e => {
      if (e.employeeId !== employee.id) return false;
      const entryDate = new Date(e.date);
      return entryDate >= monday && entryDate <= sunday;
    });

    return weekEntries.reduce((sum, e) => sum + e.metrics.revenue, 0);
  }, [entries, employee.id]);

  const weekRevenueDelta = useMemo(() => {
    const diff = currentWeekRevenue - lastWeekRevenue;
    const pct = lastWeekRevenue > 0 ? Math.round((diff / lastWeekRevenue) * 100) : (currentWeekRevenue > 0 ? 100 : 0);
    return { diff, pct };
  }, [currentWeekRevenue, lastWeekRevenue]);

  // Previous month aggregated totals
  const prevMonthTotals = useMemo(() => {
    if (!selectedMonth) return { zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, khachChuDongIB: 0, followUp: 0, quote: 0, deal: 0, revenue: 0 };
    const [y, m] = selectedMonth.split("-").map(Number);
    const prevMonthStr = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
    const prevEntries = entries.filter(e => e.employeeId === employee.id && e.date.startsWith(prevMonthStr));
    const totals = { zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, khachChuDongIB: 0, followUp: 0, quote: 0, deal: 0, revenue: 0 };
    prevEntries.forEach(entry => {
      Object.keys(totals).forEach(k => {
        totals[k as keyof KpiMetrics] += entry.metrics[k as keyof KpiMetrics] || 0;
      });
    });
    return totals;
  }, [entries, employee.id, selectedMonth]);

  // Monthly revenue delta calculation
  const monthRevenueDelta = useMemo(() => {
    const diff = currentMonthTotals.revenue - prevMonthTotals.revenue;
    const pct = prevMonthTotals.revenue > 0 ? Math.round((diff / prevMonthTotals.revenue) * 100) : (currentMonthTotals.revenue > 0 ? 100 : 0);
    return { diff, pct };
  }, [currentMonthTotals.revenue, prevMonthTotals.revenue]);

  // Monthly deal delta calculation
  const monthDealDelta = useMemo(() => {
    const diff = currentMonthTotals.deal - prevMonthTotals.deal;
    const pct = prevMonthTotals.deal > 0 ? Math.round((diff / prevMonthTotals.deal) * 100) : (currentMonthTotals.deal > 0 ? 100 : 0);
    return { diff, pct };
  }, [currentMonthTotals.deal, prevMonthTotals.deal]);

  // Line chart 30 days dataset
  const lineChartData = useMemo(() => {
    const monthLogs = entries.filter(e => e.employeeId === employee.id && e.date.startsWith(selectedMonth));
    const sorted = [...monthLogs].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map(e => ({
      date: e.date.substring(5), // "MM-DD" e.g., "07-03"
      fullDate: e.date,
      quote: e.metrics.quote,
      deal: e.metrics.deal,
      followUp: e.metrics.followUp
    }));
  }, [entries, employee.id, selectedMonth]);

  // Save new entry
  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const currentEntries = getStoredKpiEntries();

    // Check if entry for this date already exists
    const existingIndex = currentEntries.findIndex(x => x.employeeId === employee.id && x.date === formDate);

    const newEntry: KpiEntry = {
      id: `entry-${employee.id}-${formDate}`,
      employeeId: employee.id,
      date: formDate,
      metrics: formMetrics,
      notes: formNotes
    };

    let nextEntries = [...currentEntries];
    if (existingIndex > -1) {
      // Overwrite existing log
      nextEntries[existingIndex] = newEntry;
      showToast(`Đã cập nhật báo cáo KPI ngày ${formDate}`, "success");
    } else {
      // Insert new log
      nextEntries.push(newEntry);
      showToast(`Đã lưu báo cáo KPI ngày ${formDate} thành công!`, "success");
    }

    saveStoredKpiEntries(nextEntries);
    setEntries(nextEntries);
    setIsInputModalOpen(false);
  };

  const openInputModal = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayEntry = entries.find(x => x.employeeId === employee.id && x.date === todayStr);
 
    setFormDate(todayStr);
    if (todayEntry) {
      setFormMetrics(todayEntry.metrics);
      setFormNotes(todayEntry.notes);
    } else {
      setFormMetrics({ zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, khachChuDongIB: 0, followUp: 0, quote: 0, deal: 0, revenue: 0 });
      setFormNotes("");
    }
    setIsInputModalOpen(true);
  };

  // Helper formatting values for comparison block
  const formatCompareValue = (key: keyof KpiMetrics, val: number) => {
    if (key === "revenue") {
      return `${(val / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
    }
    return val.toLocaleString();
  };

  return (
    <div className="space-y-6 text-gray-700 select-none max-w-full overflow-x-hidden">

      {/* Sub navigation bar */}
      <div className="flex justify-center border-b border-gray-200 w-full mb-6">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveSubTab("overview")}
            className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer relative -mb-[1px] ${
              activeSubTab === "overview"
                ? "text-[#C62828] border-b-2 border-[#C62828]"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveSubTab("history")}
            className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer relative -mb-[1px] ${
              activeSubTab === "history"
                ? "text-[#C62828] border-b-2 border-[#C62828]"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            Lịch sử KPI
          </button>
        </div>
      </div>

      {/* TAB Content: Overview */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">

          {/* Header block inside Dashboard tab */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-800">Tổng quan</h2>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">KPI cá nhân của bạn</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
              <button
                onClick={openInputModal}
                className="flex-1 sm:flex-none text-center py-2 px-5 bg-[#C62828] text-white rounded-xl text-xs font-black shadow-md cursor-pointer hover:bg-[#b71c1c] transition-all"
              >
                Nhập KPI
              </button>

              <div className="flex-1 sm:flex-none justify-center flex items-center gap-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-xs">
                <span>CHỌN THÁNG:</span>
                <UserCustomMonthPicker value={selectedMonth} onChange={setSelectedMonth} />
              </div>
            </div>
          </div>

          {/* Quick Metrics Widget Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Card 1: KPI hôm nay */}
            <div className="bg-white p-4 border border-[#efd7da] rounded-2xl shadow-xs flex flex-col justify-between h-[110px] relative overflow-hidden">
              <div>
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">KPI hôm nay</p>
                  <Calendar className="text-[#C62828] opacity-60" size={16} />
                </div>
                <h3 className="text-2xl font-black text-gray-800 mt-1 font-mono">{todayKpiPoints}</h3>
              </div>
              <div className="mt-2 text-[9px] font-bold">
                {todayKpiDelta.diff >= 0 ? (
                  <span className="text-green-600 flex items-center gap-0.5">
                    ▲ {todayKpiDelta.pct}% (+{todayKpiDelta.diff})
                  </span>
                ) : (
                  <span className="text-[#C62828] flex items-center gap-0.5">
                    ▼ {Math.abs(todayKpiDelta.pct)}% ({todayKpiDelta.diff})
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Doanh thu tuần */}
            <div className="bg-white p-4 border border-[#efd7da] rounded-2xl shadow-xs flex flex-col justify-between h-[110px] relative overflow-hidden">
              <div>
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Doanh thu tuần</p>
                  <DollarSign className="text-green-600 opacity-60" size={16} />
                </div>
                <h3 className="text-2xl font-black text-gray-800 mt-1 font-mono">
                  {currentWeekRevenue >= 1000000
                    ? `${(currentWeekRevenue / 1000000).toFixed(1).replace(/\.0$/, "")}M`
                    : currentWeekRevenue.toLocaleString()
                  }
                </h3>
              </div>
              <div className="mt-2 text-[9px] font-bold">
                {weekRevenueDelta.diff >= 0 ? (
                  <span className="text-green-600 flex items-center gap-0.5">
                    ▲ {weekRevenueDelta.pct}% (+{(weekRevenueDelta.diff).toLocaleString("vi-VN")})
                  </span>
                ) : (
                  <span className="text-[#C62828] flex items-center gap-0.5">
                    ▼ {Math.abs(weekRevenueDelta.pct)}% ({(weekRevenueDelta.diff).toLocaleString("vi-VN")})
                  </span>
                )}
              </div>
            </div>

            {/* Card 3: Doanh thu tháng */}
            <div className="bg-white p-4 border border-[#efd7da] rounded-2xl shadow-xs flex flex-col justify-between h-[110px] relative overflow-hidden">
              <div>
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Doanh thu tháng</p>
                  <DollarSign className="text-blue-600 opacity-60" size={16} />
                </div>
                <h3 className="text-2xl font-black text-gray-800 mt-1 font-mono">
                  {currentMonthTotals.revenue >= 1000000
                    ? `${(currentMonthTotals.revenue / 1000000).toFixed(1).replace(/\.0$/, "")}M`
                    : currentMonthTotals.revenue.toLocaleString()
                  }
                </h3>
              </div>
              <div className="mt-2 text-[9px] font-bold">
                {monthRevenueDelta.diff >= 0 ? (
                  <span className="text-green-600 flex items-center gap-0.5">
                    ▲ {monthRevenueDelta.pct}% (+{(monthRevenueDelta.diff).toLocaleString("vi-VN")})
                  </span>
                ) : (
                  <span className="text-[#C62828] flex items-center gap-0.5">
                    ▼ {Math.abs(monthRevenueDelta.pct)}% ({(monthRevenueDelta.diff).toLocaleString("vi-VN")})
                  </span>
                )}
              </div>
            </div>

            {/* Card 4: Chốt Deal tháng */}
            <div className="bg-white p-4 border border-[#efd7da] rounded-2xl shadow-xs flex flex-col justify-between h-[110px] relative overflow-hidden">
              <div>
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chốt Deal tháng</p>
                  <Target className="text-orange-500 opacity-60" size={16} />
                </div>
                <h3 className="text-2xl font-black text-gray-800 mt-1 font-mono">{currentMonthTotals.deal}</h3>
              </div>
              <div className="mt-2 text-[9px] font-bold">
                {monthDealDelta.diff >= 0 ? (
                  <span className="text-green-600 flex items-center gap-0.5">
                    ▲ {monthDealDelta.pct}% (+{monthDealDelta.diff})
                  </span>
                ) : (
                  <span className="text-[#C62828] flex items-center gap-0.5">
                    ▼ {Math.abs(monthDealDelta.pct)}% ({monthDealDelta.diff})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tiến độ KPI tháng */}
          <div className="bg-white p-5 border border-[#efd7da] rounded-2xl shadow-xs space-y-4">
            <div>
              <h4 className="font-extrabold text-gray-800 text-sm">
                Tiến độ KPI tháng {selectedMonth ? `${selectedMonth.substring(5)}/${selectedMonth.substring(0, 4)}` : "--/----"}
              </h4>
            </div>

            <div className="space-y-4">
              {Object.entries(KPI_METRIC_LABELS)
                .filter(([key]) => key !== "khachChuDongIB") // Exclude khachChuDongIB from progress lines
                .map(([key, label]) => {
                  const currentVal = currentMonthTotals[key as keyof KpiMetrics];
                  const targetVal = monthTargets[key as keyof KpiMetrics];
                  const pct = targetVal > 0 ? Math.min(Math.round((currentVal / targetVal) * 100), 100) : 100;
                  const isMet = currentVal >= targetVal;
                  const isRevenue = key === "revenue";

                  // Bar color styling based on percentage completion
                  let barColor = "bg-[#DC2626]"; // Red (<30%)
                  if (pct >= 80) {
                    barColor = "bg-[#16A34A]"; // Green (>=80%)
                  } else if (pct >= 30) {
                    barColor = "bg-[#EA580C]"; // Orange (30-79%)
                  }

                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-700">{label}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-700 font-mono">
                            {isRevenue
                              ? `${currentVal.toLocaleString()}đ / ${targetVal.toLocaleString()}đ (${pct}%)`
                              : `${currentVal} / ${targetVal} (${pct}%)`
                            }
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold ${isMet ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-[#C62828] border border-red-200"
                            }`}>
                            {isMet ? "Đạt KPI" : "Chưa đủ KPI"}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Biểu đồ KPI 30 ngày */}
          <div className="bg-white p-5 border border-[#efd7da] rounded-2xl shadow-xs space-y-4">
            <h4 className="font-extrabold text-gray-800 text-sm">Biểu đồ KPI 30 ngày</h4>
            <div className="h-60 w-full text-xs">
              {lineChartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">Không có dữ liệu báo cáo trong tháng</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" stroke="#9ca3af" axisLine={false} tickLine={false} />
                    <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="quote" stroke="#0D9488" strokeWidth={1.5} dot={<RenderCircleDot />} activeDot={{ r: 4 }} name="Báo giá" />
                    <Line type="monotone" dataKey="deal" stroke="#16A34A" strokeWidth={1.5} dot={<RenderCircleDot />} activeDot={{ r: 4 }} name="Chốt Deal" />
                    <Line type="monotone" dataKey="followUp" stroke="#EC4899" strokeWidth={1.5} dot={<RenderCircleDot />} activeDot={{ r: 4 }} name="Follow-up" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* So sánh với tháng trước */}
          <div className="bg-white p-5 border border-[#efd7da] rounded-2xl shadow-xs space-y-4">
            <h4 className="font-extrabold text-gray-800 text-sm">So sánh với tháng trước</h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {Object.entries(KPI_METRIC_LABELS).map(([metricKey, label]) => {
                const currVal = currentMonthTotals[metricKey as keyof KpiMetrics];
                const prevVal = prevMonthTotals[metricKey as keyof KpiMetrics];
                const diff = currVal - prevVal;
                const pct = prevVal > 0 ? Math.round((diff / prevVal) * 100) : (currVal > 0 ? 100 : 0);

                return (
                  <div key={metricKey} className="p-3 border border-gray-100 rounded-xl bg-gray-50/20 text-center flex flex-col justify-between h-[100px]">
                    <span className="text-[10px] text-gray-400 font-bold block truncate" title={label}>{label}</span>
                    <p className="text-sm font-black text-gray-800 font-mono mt-2">
                      {formatCompareValue(metricKey as keyof KpiMetrics, currVal)}
                    </p>
                    <div className="mt-1 flex items-center justify-center">
                      {diff >= 0 ? (
                        <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5">
                          ▲ {pct}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#C62828] flex items-center gap-0.5">
                          ▼ {Math.abs(pct)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* TAB Content: History Logs */}
      {activeSubTab === "history" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-gray-800">Lịch sử KPI</h2>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">Xem lại KPI đã nhập</p>
          </div>

          <div className="bg-white border border-[#efd7da] rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">NGÀY</th>
                    <th scope="col" className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider">IB ZALO</th>
                    <th scope="col" className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider">IB FB</th>
                    <th scope="col" className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider">COMMENT</th>
                    <th scope="col" className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider">BÀI ĐĂNG</th>
                    <th scope="col" className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider">KHÁCH REP</th>
                    <th scope="col" className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider">FOLLOW-UP</th>
                    <th scope="col" className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider">BÁO GIÁ</th>
                    <th scope="col" className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider">CHỐT DEAL</th>
                    <th scope="col" className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider">DOANH THU</th>
                    <th scope="col" className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider">HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 font-medium text-gray-700">
                  {userAllEntries.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-gray-400 font-semibold">
                        Chưa có nhật ký nào được báo cáo
                      </td>
                    </tr>
                  ) : (
                    paginatedEntries.map((log) => {
                      return (
                        <tr key={log.id} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="sticky left-0 bg-white group-hover:bg-gray-50/80 transition-colors z-10 px-4 py-4 whitespace-nowrap text-left font-semibold text-gray-800 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} className="text-gray-400" />
                              <span>{formatKpiDate(log.date)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">{log.metrics.zalo}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">{log.metrics.fb}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">{log.metrics.comment}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">{log.metrics.post}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">{log.metrics.clientReply}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">{log.metrics.followUp}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">{log.metrics.quote}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-center text-red-500 font-bold">{log.metrics.deal}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-center text-green-600 font-bold">
                            {formatRevenue(log.metrics.revenue)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => setSelectedEntryForDetail(log)}
                              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 cursor-pointer inline-flex items-center justify-center"
                              title="Chi tiết"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls inside the same card */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs sm:text-[13px] font-semibold text-gray-500 bg-white">
                <div>
                  Trang {currentPage} / {totalPages} ({totalItems} bản ghi)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center transition-colors ${
                      currentPage === 1
                        ? "opacity-50 cursor-not-allowed text-gray-300"
                        : "hover:bg-gray-50 hover:text-gray-700 cursor-pointer text-gray-600"
                    }`}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center transition-colors ${
                      currentPage === totalPages
                        ? "opacity-50 cursor-not-allowed text-gray-300"
                        : "hover:bg-gray-50 hover:text-gray-700 cursor-pointer text-gray-600"
                    }`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Entry Daily Form Modal */}
      {isInputModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setIsInputModalOpen(false)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col" style={{ animation: "sessionModalIn 0.2s ease", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-[#E8231A] to-[#FF8800]" />
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-gray-800">Nhập số liệu báo cáo KPI</h3>
              <button type="button" onClick={() => setIsInputModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 text-xs max-h-[75vh]" style={{ scrollbarWidth: "thin" }}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ngày báo cáo nhật trình</label>
                  <p className="text-[10px] text-gray-400">Chọn ngày để cập nhật hoặc thêm nhật ký mới</p>
                </div>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => {
                    setFormDate(e.target.value);
                    const match = entries.find(x => x.employeeId === employee.id && x.date === e.target.value);
                    if (match) {
                      setFormMetrics(match.metrics);
                      setFormNotes(match.notes);
                    } else {
                      setFormMetrics({ zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, khachChuDongIB: 0, followUp: 0, quote: 0, deal: 0, revenue: 0 });
                      setFormNotes("");
                    }
                  }}
                  className="w-full sm:w-auto py-2 px-4 border border-gray-200 rounded-xl focus:outline-none font-bold text-gray-700 bg-white"
                  required
                />
              </div>

              {/* Section 1: Tương tác */}
              <div className="bg-white p-4 sm:p-5 border border-gray-150 rounded-2xl shadow-xs space-y-4">
                <h4 className="font-extrabold text-gray-800 text-sm border-b border-gray-100 pb-2">Tương tác</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Zalo */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 text-xs">Inbox Zalo</label>
                    <input
                      type="number"
                      value={formMetrics.zalo}
                      onChange={(e) => setFormMetrics(prev => ({ ...prev, zalo: parseInt(e.target.value) || 0 }))}
                      className={`w-full py-2.5 px-4 border ${formMetrics.zalo >= getDailyTarget("zalo") ? "border-gray-200 focus:border-green-500" : "border-red-500 focus:border-red-600"} rounded-xl focus:outline-none text-xs font-semibold transition-all`}
                      required
                    />
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold">
                      {formMetrics.zalo >= getDailyTarget("zalo") ? (
                        <span className="text-green-600 flex items-center gap-0.5">✅ Đạt KPI (Yêu cầu: {getDailyTarget("zalo")})</span>
                      ) : (
                        <span className="text-[#EF4444] flex items-center gap-0.5">⚠️ Chưa đủ KPI (Yêu cầu: {getDailyTarget("zalo")})</span>
                      )}
                    </div>
                  </div>

                  {/* Facebook */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 text-xs">Inbox Facebook</label>
                    <input
                      type="number"
                      value={formMetrics.fb}
                      onChange={(e) => setFormMetrics(prev => ({ ...prev, fb: parseInt(e.target.value) || 0 }))}
                      className={`w-full py-2.5 px-4 border ${formMetrics.fb >= getDailyTarget("fb") ? "border-gray-200 focus:border-green-500" : "border-red-500 focus:border-red-600"} rounded-xl focus:outline-none text-xs font-semibold transition-all`}
                      required
                    />
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold">
                      {formMetrics.fb >= getDailyTarget("fb") ? (
                        <span className="text-green-600 flex items-center gap-0.5">✅ Đạt KPI (Yêu cầu: {getDailyTarget("fb")})</span>
                      ) : (
                        <span className="text-[#EF4444] flex items-center gap-0.5">⚠️ Chưa đủ KPI (Yêu cầu: {getDailyTarget("fb")})</span>
                      )}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 text-xs">Comment</label>
                    <input
                      type="number"
                      value={formMetrics.comment}
                      onChange={(e) => setFormMetrics(prev => ({ ...prev, comment: parseInt(e.target.value) || 0 }))}
                      className={`w-full py-2.5 px-4 border ${formMetrics.comment >= getDailyTarget("comment") ? "border-gray-200 focus:border-green-500" : "border-red-500 focus:border-red-600"} rounded-xl focus:outline-none text-xs font-semibold transition-all`}
                      required
                    />
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold">
                      {formMetrics.comment >= getDailyTarget("comment") ? (
                        <span className="text-green-600 flex items-center gap-0.5">✅ Đạt KPI (Yêu cầu: {getDailyTarget("comment")})</span>
                      ) : (
                        <span className="text-[#EF4444] flex items-center gap-0.5">⚠️ Chưa đủ KPI (Yêu cầu: {getDailyTarget("comment")})</span>
                      )}
                    </div>
                  </div>

                  {/* Bài đăng */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 text-xs">Bài đăng</label>
                    <input
                      type="number"
                      value={formMetrics.post}
                      onChange={(e) => setFormMetrics(prev => ({ ...prev, post: parseInt(e.target.value) || 0 }))}
                      className={`w-full py-2.5 px-4 border ${formMetrics.post >= getDailyTarget("post") ? "border-gray-200 focus:border-green-500" : "border-red-500 focus:border-red-600"} rounded-xl focus:outline-none text-xs font-semibold transition-all`}
                      required
                    />
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold">
                      {formMetrics.post >= getDailyTarget("post") ? (
                        <span className="text-green-600 flex items-center gap-0.5">✅ Đạt KPI (Yêu cầu: {getDailyTarget("post")})</span>
                      ) : (
                        <span className="text-[#EF4444] flex items-center gap-0.5">⚠️ Chưa đủ KPI (Yêu cầu: {getDailyTarget("post")})</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Khách hàng */}
              <div className="bg-white p-5 border border-gray-150 rounded-2xl shadow-xs space-y-4">
                <h4 className="font-extrabold text-gray-800 text-sm border-b border-gray-100 pb-2">Khách hàng</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Khách rep */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 text-xs">Khách rep</label>
                    <input
                      type="number"
                      value={formMetrics.clientReply}
                      onChange={(e) => setFormMetrics(prev => ({ ...prev, clientReply: parseInt(e.target.value) || 0 }))}
                      className={`w-full py-2.5 px-4 border ${formMetrics.clientReply >= getDailyTarget("clientReply") ? "border-gray-200 focus:border-green-500" : "border-red-500 focus:border-red-600"} rounded-xl focus:outline-none text-xs font-semibold transition-all`}
                      required
                    />
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold">
                      {formMetrics.clientReply >= getDailyTarget("clientReply") ? (
                        <span className="text-green-600 flex items-center gap-0.5">✅ Đạt KPI (Yêu cầu: {getDailyTarget("clientReply")})</span>
                      ) : (
                        <span className="text-[#EF4444] flex items-center gap-0.5">⚠️ Chưa đủ KPI (Yêu cầu: {getDailyTarget("clientReply")})</span>
                      )}
                    </div>
                  </div>

                  {/* Khách chủ động IB */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 text-xs">Khách chủ động IB</label>
                    <input
                      type="number"
                      value={formMetrics.khachChuDongIB}
                      onChange={(e) => setFormMetrics(prev => ({ ...prev, khachChuDongIB: parseInt(e.target.value) || 0 }))}
                      className={`w-full py-2.5 px-4 border ${formMetrics.khachChuDongIB >= getDailyTarget("khachChuDongIB") ? "border-gray-200 focus:border-green-500" : "border-red-500 focus:border-red-600"} rounded-xl focus:outline-none text-xs font-semibold transition-all`}
                      required
                    />
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold">
                      {formMetrics.khachChuDongIB >= getDailyTarget("khachChuDongIB") ? (
                        <span className="text-green-600 flex items-center gap-0.5">✅ Đạt KPI (Yêu cầu: {getDailyTarget("khachChuDongIB")})</span>
                      ) : (
                        <span className="text-[#EF4444] flex items-center gap-0.5">⚠️ Chưa đủ KPI (Yêu cầu: {getDailyTarget("khachChuDongIB")})</span>
                      )}
                    </div>
                  </div>

                  {/* Follow-up */}
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-bold mb-1.5 text-xs">Follow-up</label>
                    <input
                      type="number"
                      value={formMetrics.followUp}
                      onChange={(e) => setFormMetrics(prev => ({ ...prev, followUp: parseInt(e.target.value) || 0 }))}
                      className={`w-full py-2.5 px-4 border ${formMetrics.followUp >= getDailyTarget("followUp") ? "border-gray-200 focus:border-green-500" : "border-red-500 focus:border-red-600"} rounded-xl focus:outline-none text-xs font-semibold transition-all`}
                      required
                    />
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold">
                      {formMetrics.followUp >= getDailyTarget("followUp") ? (
                        <span className="text-green-600 flex items-center gap-0.5">✅ Đạt KPI (Yêu cầu: {getDailyTarget("followUp")})</span>
                      ) : (
                        <span className="text-[#EF4444] flex items-center gap-0.5">⚠️ Chưa đủ KPI (Yêu cầu: {getDailyTarget("followUp")})</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Báo giá & Deal */}
              <div className="bg-white p-4 sm:p-5 border border-gray-150 rounded-2xl shadow-xs space-y-4">
                <h4 className="font-extrabold text-gray-800 text-sm border-b border-gray-100 pb-2">Báo giá & Deal</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Báo giá gửi */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 text-xs">Báo giá gửi</label>
                    <input
                      type="number"
                      value={formMetrics.quote}
                      onChange={(e) => setFormMetrics(prev => ({ ...prev, quote: parseInt(e.target.value) || 0 }))}
                      className={`w-full py-2.5 px-4 border ${formMetrics.quote >= getDailyTarget("quote") ? "border-gray-200 focus:border-green-500" : "border-red-500 focus:border-red-600"} rounded-xl focus:outline-none text-xs font-semibold transition-all`}
                      required
                    />
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold">
                      {formMetrics.quote >= getDailyTarget("quote") ? (
                        <span className="text-green-600 flex items-center gap-0.5">✅ Đạt KPI (Yêu cầu: {getDailyTarget("quote")})</span>
                      ) : (
                        <span className="text-[#EF4444] flex items-center gap-0.5">⚠️ Chưa đủ KPI (Yêu cầu: {getDailyTarget("quote")})</span>
                      )}
                    </div>
                  </div>

                  {/* Chốt Deal */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 text-xs">Chốt Deal</label>
                    <input
                      type="number"
                      value={formMetrics.deal}
                      onChange={(e) => setFormMetrics(prev => ({ ...prev, deal: parseInt(e.target.value) || 0 }))}
                      className={`w-full py-2.5 px-4 border ${formMetrics.deal >= getDailyTarget("deal") ? "border-gray-200 focus:border-green-500" : "border-red-500 focus:border-red-600"} rounded-xl focus:outline-none text-xs font-semibold transition-all`}
                      required
                    />
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold">
                      {formMetrics.deal >= getDailyTarget("deal") ? (
                        <span className="text-green-600 flex items-center gap-0.5">✅ Đạt KPI (Yêu cầu: {getDailyTarget("deal")})</span>
                      ) : (
                        <span className="text-[#EF4444] flex items-center gap-0.5">⚠️ Chưa đủ KPI (Yêu cầu: {getDailyTarget("deal")})</span>
                      )}
                    </div>
                  </div>

                  {/* Doanh số */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 text-xs">Doanh số</label>
                    <input
                      type="number"
                      value={formMetrics.revenue}
                      onChange={(e) => setFormMetrics(prev => ({ ...prev, revenue: parseInt(e.target.value) || 0 }))}
                      className={`w-full py-2.5 px-4 border ${formMetrics.revenue >= getDailyTarget("revenue") ? "border-gray-200 focus:border-green-500" : "border-red-500 focus:border-red-600"} rounded-xl focus:outline-none text-xs font-semibold transition-all`}
                      required
                    />
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold">
                      {formMetrics.revenue >= getDailyTarget("revenue") ? (
                        <span className="text-green-600 flex items-center gap-0.5">✅ Đạt KPI (Yêu cầu: {getDailyTarget("revenue").toLocaleString()}đ)</span>
                      ) : (
                        <span className="text-[#EF4444] flex items-center gap-0.5">⚠️ Chưa đủ KPI (Yêu cầu: {getDailyTarget("revenue").toLocaleString()}đ)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ghi chú */}
              <div className="bg-white p-4 sm:p-5 border border-gray-150 rounded-2xl shadow-xs space-y-4">
                <label className="block text-gray-700 font-bold mb-1 text-xs">Ghi chú công việc nhật trình</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="w-full py-2.5 px-4 border border-gray-200 rounded-xl focus:outline-none leading-relaxed text-xs"
                  placeholder="Ghi chú chi tiết công việc hôm nay..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsInputModalOpen(false)}
                  className="py-2 px-5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer font-bold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="py-2 px-8 rounded-xl bg-[#C62828] text-white hover:opacity-90 transition-all font-bold cursor-pointer"
                >
                  Gửi báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Entry Detail Modal Component */}
      {selectedEntryForDetail && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setSelectedEntryForDetail(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden flex flex-col" style={{ animation: "sessionModalIn 0.2s ease" }} onClick={(e) => e.stopPropagation()}>
            
            {/* Title */}
            <div className="mb-4">
              <h3 className="text-sm font-extrabold text-gray-800">Chi tiết KPI — {formatKpiDate(selectedEntryForDetail.date)}</h3>
            </div>
 
            {/* Content list */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div className="divide-y divide-gray-100 text-xs">
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-500 font-medium">IB Zalo</span>
                  <span className="font-bold text-gray-950 text-right">{selectedEntryForDetail.metrics.zalo}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-500 font-medium">IB Facebook</span>
                  <span className="font-bold text-gray-950 text-right">{selectedEntryForDetail.metrics.fb}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-500 font-medium">Comment</span>
                  <span className="font-bold text-gray-950 text-right">{selectedEntryForDetail.metrics.comment}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-500 font-medium">Bài đăng</span>
                  <span className="font-bold text-gray-950 text-right">{selectedEntryForDetail.metrics.post}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-500 font-medium">Khách rep</span>
                  <span className="font-bold text-gray-950 text-right">{selectedEntryForDetail.metrics.clientReply}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-500 font-medium">Khách chủ động IB</span>
                  <span className="font-bold text-gray-950 text-right">{selectedEntryForDetail.metrics.khachChuDongIB}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-500 font-medium">Follow-up</span>
                  <span className="font-bold text-gray-950 text-right">{selectedEntryForDetail.metrics.followUp}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-500 font-medium">Báo giá</span>
                  <span className="font-bold text-gray-950 text-right">{selectedEntryForDetail.metrics.quote}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-500 font-medium">Chốt Deal</span>
                  <span className="font-bold text-gray-950 text-right">{selectedEntryForDetail.metrics.deal}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Doanh thu</span>
                  <span className="font-bold text-gray-950 text-right">{formatRevenue(selectedEntryForDetail.metrics.revenue)}</span>
                </div>
              </div>
 
              {/* Notes parsed */}
              {(() => {
                const { nhuCau, taiSao } = parseNotes(selectedEntryForDetail.notes);
                return (
                  <div className="space-y-4 pt-2 text-xs">
                    <div>
                      <span className="font-medium text-gray-400">Nhu cầu khách</span>
                      <p className="mt-1 font-semibold text-gray-800 break-words">{nhuCau || "Không có"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-400">Tại sao mất khách</span>
                      <p className="mt-1 font-semibold text-gray-800 break-words">{taiSao || "Không có"}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
 
            {/* Footer */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setSelectedEntryForDetail(null)}
                className="py-2 px-5 rounded-xl bg-gray-800 text-white hover:bg-gray-900 transition-all font-bold text-xs cursor-pointer"
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
