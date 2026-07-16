import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  TrendingUp, Award, Calendar, Users, FileText, Settings, BarChart3,
  UserCheck, ChevronLeft, ChevronRight, ChevronDown, Download, Search, Plus, Filter, RefreshCw, X, ArrowUpRight, ArrowDownRight, RefreshCcw, Trophy, Medal
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie, LineChart, Line
} from "recharts";
import { Employee } from "../../types";
import ConfirmModal from "../ui/ConfirmModal";

const KpiBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-lg space-y-1.5 text-xs font-bold" style={{ animation: "sessionModalIn 0.15s ease" }}>
        <p className="text-gray-900 border-b border-gray-100 pb-1.5 font-black">{data.fullDate}</p>
        <p className="text-[#16A34A]">Chốt Deal : {data.deal}</p>
        <p className="text-[#2563EB]">IB Facebook : {data.fb}</p>
        <p className="text-[#6d28d9]">IB Zalo : {data.zalo}</p>
      </div>
    );
  }
  return null;
};

const getVietnameseMonthName = (monthStr: string) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  const monthMap: { [key: string]: string } = {
    "01": "Tháng Giêng",
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
    "12": "Tháng Mười Hai"
  };
  return `${monthMap[month] || `Tháng ${month}`} ${year}`;
};

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}

const CustomSelect = ({ label, value, onChange, options }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1.5 relative w-full" ref={containerRef}>
      {label && <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2 px-4 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-[#C62828] text-gray-700 bg-white font-bold flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer shadow-sm h-[38px]"
      >
        <span>{selectedOption ? selectedOption.label : ""}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-[sessionModalIn_0.15s_ease]">
          <div className="max-h-60 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-red-50 text-[#C62828]" 
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {opt.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface CustomMonthPickerProps {
  value: string; // YYYY-MM
  onChange: (val: string) => void;
}

const MONTH_LABELS = ["Thg1","Thg2","Thg3","Thg4","Thg5","Thg6","Thg7","Thg8","Thg9","Thg10","Thg11","Thg12"];

const CustomMonthPicker = ({ value, onChange }: CustomMonthPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentYear = value ? parseInt(value.split("-")[0]) : new Date().getFullYear();
  const currentMonthIdx = value ? parseInt(value.split("-")[1]) - 1 : new Date().getMonth();
  const [viewYear, setViewYear] = useState(currentYear);

  const todayYear = new Date().getFullYear();
  const todayMonth = new Date().getMonth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectMonth = (monthIdx: number) => {
    const monthStr = String(monthIdx + 1).padStart(2, "0");
    onChange(`${viewYear}-${monthStr}`);
    setIsOpen(false);
  };

  const handleThisMonth = () => {
    const now = new Date();
    const monthStr = String(now.getMonth() + 1).padStart(2, "0");
    onChange(`${now.getFullYear()}-${monthStr}`);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-black text-gray-800 cursor-pointer hover:text-[#C62828] transition-colors"
      >
        {getVietnameseMonthName(value)}
        <Calendar size={12} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 p-4 w-56 animate-[sessionModalIn_0.15s_ease]">
          {/* Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setViewYear(y => y - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <ChevronRight size={14} className="text-gray-500 rotate-180" />
            </button>
            <span className="text-xs font-black text-gray-700">{viewYear}</span>
            <button type="button" onClick={() => setViewYear(y => y + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <ChevronRight size={14} className="text-gray-500" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-4 gap-1 mb-3">
            {MONTH_LABELS.map((label, idx) => {
              const isSelected = viewYear === currentYear && idx === currentMonthIdx;
              const isToday = viewYear === todayYear && idx === todayMonth;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={`w-full text-center py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer
                    ${isSelected ? "bg-[#C62828] text-white shadow-md" : isToday ? "bg-red-100 text-[#C62828]" : "text-gray-600 hover:bg-red-50 hover:text-[#C62828]"}
                  `}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <button type="button" onClick={() => { onChange(""); setIsOpen(false); }} className="text-[11px] font-bold text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">Xóa</button>
            <button type="button" onClick={handleThisMonth} className="text-[11px] font-bold text-[#C62828] hover:opacity-75 cursor-pointer transition-colors">Tháng này</button>
          </div>
        </div>
      )}
    </div>
  );
};

interface CustomDatePickerProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  disabled?: boolean;
}

const VIET_DAYS = ["Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7", "CN"];
const VIET_MONTHS = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

const CustomDatePicker = ({ label, value, onChange, disabled = false }: CustomDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsedDate = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(parsedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedDate.getMonth());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return "Chọn ngày";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const yearOptions = Array.from({ length: 10 }, (_, i) => today.getFullYear() - 3 + i);

  return (
    <div className="flex flex-col gap-1.5 relative w-full" ref={containerRef}>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full py-2 px-4 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-[#C62828] font-bold flex justify-between items-center transition-colors shadow-sm h-[38px] ${disabled ? "opacity-40 cursor-not-allowed bg-gray-100 text-gray-400" : "text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"}`}
      >
        <span>{formatDisplay(value)}</span>
        <Calendar size={13} className="text-gray-400" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-[calc(100%+4px)] left-0 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-4 w-72 animate-[sessionModalIn_0.15s_ease]">
          {/* Header: Month dropdown + Year dropdown + nav arrows */}
          <div className="flex items-center gap-2 mb-3">
            <select
              value={viewMonth}
              onChange={e => setViewMonth(Number(e.target.value))}
              className="flex-1 py-1.5 px-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 bg-white focus:outline-none cursor-pointer appearance-none text-center"
            >
              {VIET_MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select
              value={viewYear}
              onChange={e => setViewYear(Number(e.target.value))}
              className="w-20 py-1.5 px-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 bg-white focus:outline-none cursor-pointer appearance-none text-center"
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="flex items-center gap-1">
              <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <ChevronRight size={14} className="text-gray-500 rotate-180" />
              </button>
              <button type="button" onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <ChevronRight size={14} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {VIET_DAYS.map(d => (
              <div key={d} className="text-center text-[9px] font-bold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => { onChange(dateStr); setIsOpen(false); }}
                  className={`w-8 h-8 mx-auto flex items-center justify-center text-[11px] font-bold rounded-full transition-all cursor-pointer
                    ${isSelected ? "bg-[#C62828] text-white shadow-md" : isToday ? "bg-red-100 text-[#C62828]" : "text-gray-600 hover:bg-gray-100"}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

import { useToast } from "../../hooks/useToast";
import { api } from "../../../lib/api";
import {
  calculateKpiPoints, getTarget, KpiEntry, KpiTarget, KpiMetrics, KPI_METRIC_LABELS, KPI_POINTS_WEIGHT
} from "./kpiMockData";

interface KpiManagementAdminProps {
  employees: Employee[];
  activeTab?: "overview" | "stats" | "compare";
}

export function KpiManagementAdmin({ employees: rawEmployees, activeTab = "overview" }: KpiManagementAdminProps) {
  const { showToast } = useToast();
  const employees = React.useMemo(() => {
    return rawEmployees.filter(e => {
      const dept = (e.department || "").toLowerCase().trim();
      return dept === "phòng kinh doanh" || dept === "kinh doanh" || dept.includes("kinh doanh");
    });
  }, [rawEmployees]);
  const [selectedMonth, setSelectedMonth] = useState("2026-07");
  
  // Dashboard Sub-tabs for "Tổng quan"
  const [overviewSubTab, setOverviewSubTab] = useState<"charts" | "reports" | "targets">("charts");

  // KPI Stats state variables
  const [statsTimeRange, setStatsTimeRange] = useState<"today" | "this-week" | "this-month" | "this-year">("this-month");
  const [statsSearchQuery, setStatsSearchQuery] = useState("");
  const [statsPageSize, setStatsPageSize] = useState(20);
  const [statsCurrentPage, setStatsCurrentPage] = useState(1);

  // Helper formatting values for comparison block
  const formatCompareValue = (key: keyof KpiMetrics, val: number) => {
    if (key === "revenue") {
      return `${val.toLocaleString("vi-VN")} đ`;
    }
    return val.toLocaleString();
  };

  const formatCompareMetricValue = (key: string, val: number) => {
    if (key === "revenue") {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1).replace(".0", "")}M`;
      }
      return val.toLocaleString("vi-VN");
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1).replace(".0", "")}K`;
    }
    return val.toLocaleString("vi-VN");
  };

  // Report states
  const [reportTimeRange, setReportTimeRange] = useState("this-month");
  const [reportGroupBy, setReportGroupBy] = useState("day");
  const [reportEmployeeId, setReportEmployeeId] = useState("all");
  const [reportDeptFilter, setReportDeptFilter] = useState("all");
  const [reportStartDate, setReportStartDate] = useState("2026-07-01");
  const [reportEndDate, setReportEndDate] = useState("2026-07-31");
  const [reportPage, setReportPage] = useState(1);
  const reportPageSize = 15;

  React.useEffect(() => {
    setReportPage(1);
  }, [reportTimeRange, reportGroupBy, reportEmployeeId, reportDeptFilter, reportStartDate, reportEndDate]);

  React.useEffect(() => {
    const formatLocalDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const today = new Date();
    if (reportTimeRange === "today") {
      const dateStr = formatLocalDate(today);
      setReportStartDate(dateStr);
      setReportEndDate(dateStr);
    } else if (reportTimeRange === "this-week") {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
      setReportStartDate(formatLocalDate(monday));
      setReportEndDate(formatLocalDate(sunday));
    } else if (reportTimeRange === "this-month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setReportStartDate(formatLocalDate(firstDay));
      setReportEndDate(formatLocalDate(lastDay));
    } else if (reportTimeRange === "this-quarter") {
      const quarter = Math.floor(today.getMonth() / 3);
      const firstDay = new Date(today.getFullYear(), quarter * 3, 1);
      const lastDay = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
      setReportStartDate(formatLocalDate(firstDay));
      setReportEndDate(formatLocalDate(lastDay));
    } else if (reportTimeRange === "this-year") {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      const lastDay = new Date(today.getFullYear(), 11, 31);
      setReportStartDate(formatLocalDate(firstDay));
      setReportEndDate(formatLocalDate(lastDay));
    }
  }, [reportTimeRange]);
  
  // States for target inline form
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetFormType, setTargetFormType] = useState<"all" | "employee">("all");
  const [targetEmployeeId, setTargetEmployeeId] = useState("all");
  const [targetForm, setTargetForm] = useState<Omit<KpiTarget, "id">>({
    employeeId: "all",
    month: "2026-07",
    metrics: { zalo: 2000, fb: 1500, comment: 500, post: 150, clientReply: 600, khachChuDongIB: 60, followUp: 400, quote: 80, deal: 25, revenue: 80000000 }
  });

  // State for detail modal
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);

  // Lock background scroll when detail modal is open
  React.useEffect(() => {
    if (selectedEmployeeForDetail) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedEmployeeForDetail]);

  // States for comparison tab
  const [compareMode, setCompareMode] = useState<"month" | "year" | "period">("month");
  const [comparePeriod, setComparePeriod] = useState<"today" | "week" | "month" | "quarter" | "year">("month");
  const [compMonth1, setCompMonth1] = useState("2026-06");
  const [compMonth2, setCompMonth2] = useState("2026-05");
  const [compYear1, setCompYear1] = useState("2026");
  const [compYear2, setCompYear2] = useState("2025");
  const [compareEmployeeId, setCompareEmployeeId] = useState("all");

  // All employees are from Phòng Kinh doanh — no additional branch filter needed
  const filteredEmployees = employees;

  const filteredEmployeeIds = useMemo(() => {
    return new Set(filteredEmployees.map(e => e.id));
  }, [filteredEmployees]);

  // Load KPI entries and targets from backend API
  const [entries, setEntries] = useState<KpiEntry[]>([]);
  const [targets, setTargets] = useState<KpiTarget[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [tRes, eRes] = await Promise.all([
        api.kpi.getTargets({}),
        api.kpi.getEntries({})
      ]);
      setTargets(tRes || []);
      setEntries(eRes || []);
    } catch (err) {
      showToast("Lỗi khi tải dữ liệu KPI", "error");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    await loadData();
    showToast("Đã tải lại dữ liệu KPI!", "success");
  };

  const currentMonthEntries = useMemo(() => {
    return entries.filter(entry => 
      entry.date.startsWith(selectedMonth) && 
      filteredEmployeeIds.has(entry.employeeId)
    );
  }, [entries, selectedMonth, filteredEmployeeIds]);

  const employeeSummaries = useMemo(() => {
    const map = new Map<string, KpiMetrics & { points: number; daysCount: number }>();
    
    const employeesWithEntries = new Set(currentMonthEntries.map(entry => entry.employeeId));

    const activeEmployeesInMonth = filteredEmployees.filter(e => {
      if (employeesWithEntries.has(e.id)) return true;
      if (e.status === "active") return true;
      if (e.resignDate) {
        return e.resignDate.slice(0, 7) >= selectedMonth;
      }
      return false;
    });

    activeEmployeesInMonth.forEach(e => {
      map.set(e.id, { zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, khachChuDongIB: 0, followUp: 0, quote: 0, deal: 0, revenue: 0, points: 0, daysCount: 0 });
    });

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
    }).sort((a, b) => b.points - a.points); 
  }, [currentMonthEntries, filteredEmployees, employees, selectedMonth]);

  const topPerformers = useMemo(() => {
    return employeeSummaries.slice(0, 3);
  }, [employeeSummaries]);

  // KPI Stats time-filtered logs
  const statsEntries = useMemo(() => {
    return entries.filter(entry => {
      if (!filteredEmployeeIds.has(entry.employeeId)) return false;
      
      const today = new Date();
      if (statsTimeRange === "today") {
        const todayStr = today.toISOString().split("T")[0];
        return entry.date === todayStr;
      } else if (statsTimeRange === "this-week") {
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
        const monStr = monday.toISOString().split("T")[0];
        const sunStr = sunday.toISOString().split("T")[0];
        return entry.date >= monStr && entry.date <= sunStr;
      } else if (statsTimeRange === "this-month") {
        const monthStr = today.toISOString().slice(0, 7); // "YYYY-MM"
        return entry.date.startsWith(monthStr);
      } else if (statsTimeRange === "this-year") {
        const yearStr = today.getFullYear().toString(); // "YYYY"
        return entry.date.startsWith(yearStr);
      }
      return true;
    });
  }, [entries, statsTimeRange, filteredEmployeeIds]);

  // Aggregate stats by employee for selected stats time range
  const statsEmployeeSummaries = useMemo(() => {
    const map = new Map<string, KpiMetrics & { points: number; daysCount: number }>();
    
    const employeesWithStatsEntries = new Set(statsEntries.map(entry => entry.employeeId));

    const activeEmployeesInStats = filteredEmployees.filter(e => {
      if (employeesWithStatsEntries.has(e.id)) return true;
      if (e.status === "active") return true;
      if (e.resignDate) {
        const today = new Date();
        if (statsTimeRange === "this-year") {
          const currentYearStr = today.getFullYear().toString();
          return e.resignDate.slice(0, 4) >= currentYearStr;
        } else {
          const currentMonthStr = today.toISOString().slice(0, 7);
          return e.resignDate.slice(0, 7) >= currentMonthStr;
        }
      }
      return false;
    });

    activeEmployeesInStats.forEach(e => {
      map.set(e.id, { zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, khachChuDongIB: 0, followUp: 0, quote: 0, deal: 0, revenue: 0, points: 0, daysCount: 0 });
    });

    statsEntries.forEach(entry => {
      const current = map.get(entry.employeeId);
      if (current) {
        current.zalo += entry.metrics.zalo || 0;
        current.fb += entry.metrics.fb || 0;
        current.comment += entry.metrics.comment || 0;
        current.post += entry.metrics.post || 0;
        current.clientReply += entry.metrics.clientReply || 0;
        current.khachChuDongIB += entry.metrics.khachChuDongIB || 0;
        current.followUp += entry.metrics.followUp || 0;
        current.quote += entry.metrics.quote || 0;
        current.deal += entry.metrics.deal || 0;
        current.revenue += entry.metrics.revenue || 0;
        current.daysCount += 1;
      }
    });

    return Array.from(map.entries())
      .map(([employeeId, data]) => {
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
      })
    .filter(row => {
      if (!statsSearchQuery) return true;
      const q = statsSearchQuery.toLowerCase();
      return row.name.toLowerCase().includes(q) || row.department.toLowerCase().includes(q) || row.position.toLowerCase().includes(q);
    })
    .sort((a, b) => b.points - a.points);
  }, [statsEntries, filteredEmployees, employees, statsSearchQuery, statsTimeRange]);

  // Aggregate totals for the stats table
  const statsTableTotals = useMemo(() => {
    const totals = { zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, followUp: 0, quote: 0, deal: 0, revenue: 0 };
    statsEmployeeSummaries.forEach(row => {
      totals.zalo += row.metrics.zalo;
      totals.fb += row.metrics.fb;
      totals.comment += row.metrics.comment;
      totals.post += row.metrics.post;
      totals.clientReply += row.metrics.clientReply;
      totals.followUp += row.metrics.followUp;
      totals.quote += row.metrics.quote;
      totals.deal += row.metrics.deal;
      totals.revenue += row.metrics.revenue;
    });
    return totals;
  }, [statsEmployeeSummaries]);

  // Export Stats Excel
  const handleExportStatsExcel = () => {
    if (statsEmployeeSummaries.length === 0) {
      showToast("Không có dữ liệu để xuất!", "error");
      return;
    }
    const timeRangeLabel = statsTimeRange === "today" ? "Hôm nay" : statsTimeRange === "this-week" ? "Tuần này" : statsTimeRange === "this-month" ? "Tháng này" : "Năm nay";
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><meta charset="utf-8"/><style>table { border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: center; } th { background-color: #f2f2f2; font-weight: bold; }</style></head><body>`;
    html += `<table>`;
    html += `<tr><th>THỜI GIAN</th><th>NHÂN VIÊN</th><th>IB ZALO</th><th>IB FB</th><th>COMMENT</th><th>BÀI ĐĂNG</th><th>K.REP</th><th>FOLLOW</th><th>B.GIÁ</th><th>DEAL</th><th>DOANH THU</th></tr>`;
    statsEmployeeSummaries.forEach(row => {
      html += `<tr><td>${timeRangeLabel}</td><td>${row.name} (${row.position})</td><td>${row.metrics.zalo}</td><td>${row.metrics.fb}</td><td>${row.metrics.comment}</td><td>${row.metrics.post}</td><td>${row.metrics.clientReply}</td><td>${row.metrics.followUp}</td><td>${row.metrics.quote}</td><td>${row.metrics.deal}</td><td>${row.metrics.revenue}</td></tr>`;
    });
    html += `<tr style="font-weight: bold; background-color: #f9f9f9;"><td>Tổng trang này</td><td></td><td>${statsTableTotals.zalo}</td><td>${statsTableTotals.fb}</td><td>${statsTableTotals.comment}</td><td>${statsTableTotals.post}</td><td>${statsTableTotals.clientReply}</td><td>${statsTableTotals.followUp}</td><td>${statsTableTotals.quote}</td><td>${statsTableTotals.deal}</td><td>${statsTableTotals.revenue}</td></tr>`;
    html += `</table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Thong_ke_KPI_${statsTimeRange}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã xuất Excel thống kê thành công!", "success");
  };

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

  const selectedMonthTarget = useMemo(() => {
    // Return average or default targets for selected month
    return getTarget("all", selectedMonth, targets);
  }, [selectedMonth, targets]);

  // Average KPI completion percentage
  const avgCompletionRate = useMemo(() => {
    if (employeeSummaries.length === 0) return 0;
    let totalRate = 0;
    let counts = 0;
    
    employeeSummaries.forEach(emp => {
      const target = getTarget(emp.employeeId, selectedMonth, targets);
      // Let's compute average rate across key fields (e.g. Revenue, Deal, Zalo)
      const revRate = target.revenue > 0 ? (emp.metrics.revenue / target.revenue) * 100 : 100;
      const dealRate = target.deal > 0 ? (emp.metrics.deal / target.deal) * 100 : 100;
      const zaloRate = target.zalo > 0 ? (emp.metrics.zalo / target.zalo) * 100 : 100;
      
      totalRate += (Math.min(revRate, 100) + Math.min(dealRate, 100) + Math.min(zaloRate, 100)) / 3;
      counts++;
    });
    
    return Math.round(totalRate / (counts || 1));
  }, [employeeSummaries, selectedMonth]);

  // Filtered entries for reports sub-tab
  const filteredReportEntries = useMemo(() => {
    return entries.filter(entry => {
      if (entry.date < reportStartDate || entry.date > reportEndDate) return false;
      if (reportEmployeeId !== "all" && entry.employeeId !== reportEmployeeId) return false;
      if (reportDeptFilter !== "all") {
        const emp = employees.find(e => e.id === entry.employeeId);
        if (emp?.department !== reportDeptFilter) return false;
      }
      return true;
    });
  }, [entries, reportStartDate, reportEndDate, reportEmployeeId, reportDeptFilter, employees]);

  // Grouped reports data
  const reportGroupedData = useMemo(() => {
    const map = new Map<string, {
      groupKey: string;
      zalo: number;
      fb: number;
      comment: number;
      post: number;
      clientReply: number;
      followUp: number;
      quote: number;
      deal: number;
      revenue: number;
      khachChuDongIB: number;
      entriesCount: number;
    }>();

    const getWeekString = (dateStr: string) => {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Không xác định";
      const tempDate = new Date(date.valueOf());
      tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
      const yearStart = new Date(tempDate.getFullYear(), 0, 1);
      const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `Tuần ${weekNo} (${tempDate.getFullYear()})`;
    };

    // Pre-populate keys to ensure the chart always renders coordinate axes and grid even when empty
    const start = new Date(reportStartDate);
    const end = new Date(reportEndDate);
    const todayStr = new Date().toISOString().split("T")[0];
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const cur = new Date(start);
      let limit = 0;
      while (cur <= end && limit < 366) {
        const dateStr = cur.toISOString().split("T")[0];
        if (dateStr > todayStr) {
          break; // Do not render future dates
        }
        let key = dateStr;
        if (reportGroupBy === "week") {
          key = getWeekString(dateStr);
        }
        
        if (reportGroupBy !== "employee") {
          map.set(key, {
            groupKey: key,
            zalo: 0,
            fb: 0,
            comment: 0,
            post: 0,
            clientReply: 0,
            followUp: 0,
            quote: 0,
            deal: 0,
            revenue: 0,
            khachChuDongIB: 0,
            entriesCount: 0
          });
        }
        cur.setDate(cur.getDate() + 1);
        limit++;
      }
    }

    if (reportGroupBy === "employee") {
      employees.forEach(emp => {
        map.set(emp.name, {
          groupKey: emp.name,
          zalo: 0,
          fb: 0,
          comment: 0,
          post: 0,
          clientReply: 0,
          followUp: 0,
          quote: 0,
          deal: 0,
          revenue: 0,
          khachChuDongIB: 0,
          entriesCount: 0
        });
      });
    }

    filteredReportEntries.forEach(entry => {
      let key = entry.date;
      if (reportGroupBy === "employee") {
        const emp = employees.find(e => e.id === entry.employeeId);
        key = emp?.name || "Nhân viên ẩn danh";
      } else if (reportGroupBy === "week") {
        key = getWeekString(entry.date);
      }
      
      const current = map.get(key) || {
        groupKey: key,
        zalo: 0,
        fb: 0,
        comment: 0,
        post: 0,
        clientReply: 0,
        followUp: 0,
        quote: 0,
        deal: 0,
        revenue: 0,
        khachChuDongIB: 0,
        entriesCount: 0
      };
      
      current.zalo += entry.metrics.zalo;
      current.fb += entry.metrics.fb;
      current.comment += entry.metrics.comment;
      current.post += entry.metrics.post;
      current.clientReply += entry.metrics.clientReply;
      current.followUp += entry.metrics.followUp;
      current.quote += entry.metrics.quote;
      current.deal += entry.metrics.deal;
      current.revenue += entry.metrics.revenue;
      current.khachChuDongIB += entry.metrics.khachChuDongIB || 0;
      current.entriesCount += 1;
      
      map.set(key, current);
    });

    return Array.from(map.values()).sort((a, b) => {
      if (reportGroupBy === "day") {
        return a.groupKey.localeCompare(b.groupKey);
      }
      if (reportGroupBy === "week") {
        const matchA = a.groupKey.match(/Tuần (\d+) \((\d+)\)/);
        const matchB = b.groupKey.match(/Tuần (\d+) \((\d+)\)/);
        if (matchA && matchB) {
          const [, wA, yA] = matchA;
          const [, wB, yB] = matchB;
          if (yA !== yB) return parseInt(yA) - parseInt(yB);
          return parseInt(wA) - parseInt(wB);
        }
      }
      return a.groupKey.localeCompare(b.groupKey);
    });
  }, [filteredReportEntries, reportGroupBy, employees]);

  // Aggregated totals for the bottom row
  const reportTotals = useMemo(() => {
    const totals = {
      zalo: 0,
      fb: 0,
      comment: 0,
      post: 0,
      clientReply: 0,
      followUp: 0,
      quote: 0,
      deal: 0,
      revenue: 0,
      khachChuDongIB: 0,
      entriesCount: 0
    };
    reportGroupedData.forEach(item => {
      totals.zalo += item.zalo;
      totals.fb += item.fb;
      totals.comment += item.comment;
      totals.post += item.post;
      totals.clientReply += item.clientReply;
      totals.followUp += item.followUp;
      totals.quote += item.quote;
      totals.deal += item.deal;
      totals.revenue += item.revenue;
      totals.khachChuDongIB += item.khachChuDongIB;
      totals.entriesCount += item.entriesCount;
    });
    return totals;
  }, [reportGroupedData]);

  // Paginated report data
  const paginatedReportData = useMemo(() => {
    const startIndex = (reportPage - 1) * reportPageSize;
    return reportGroupedData.slice(startIndex, startIndex + reportPageSize);
  }, [reportGroupedData, reportPage, reportPageSize]);

  // Group departments for filter
  const departmentsList = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
  }, [employees]);

  const timeRangeOptions = useMemo(() => [
    { value: "today", label: "Hôm nay" },
    { value: "this-week", label: "Tuần này" },
    { value: "this-month", label: "Tháng này" },
    { value: "this-quarter", label: "Quý này" },
    { value: "this-year", label: "Năm nay" },
    { value: "custom", label: "Chọn tháng cụ thể" }
  ], []);

  const groupByOptions = useMemo(() => [
    { value: "day", label: "Ngày" },
    { value: "week", label: "Tuần" },
    { value: "employee", label: "Nhân viên" }
  ], []);

  const employeeOptions = useMemo(() => {
    return [
      { value: "all", label: "Tất cả nhân sự" },
      ...employees.map(emp => ({ value: emp.id, label: emp.name }))
    ];
  }, [employees]);

  const deptOptions = useMemo(() => {
    return [
      { value: "all", label: "Tất cả phòng ban" },
      ...departmentsList.map(dept => ({ value: dept, label: dept }))
    ];
  }, [departmentsList]);

  // Top 10 employees by monthly revenue
  const topRevenueEmployees = useMemo(() => {
    return [...employeeSummaries]
      .filter(emp => emp.metrics.revenue > 0)
      .sort((a, b) => b.metrics.revenue - a.metrics.revenue);
  }, [employeeSummaries]);

  // Donut chart distribution data
  const donutData = useMemo(() => {
    const zaloVal = totalStats.zalo;
    const fbVal = totalStats.fb;
    const commentVal = totalStats.comment;
    const postVal = totalStats.post;
    const followUpVal = totalStats.followUp;
    const dealVal = totalStats.deal;

    const total = zaloVal + fbVal + commentVal + postVal + followUpVal + dealVal;
    if (total === 0) return [];
    
    return [
      { name: "IB Zalo", value: zaloVal, pct: Math.round((zaloVal / total) * 100), color: "#6366F1" },
      { name: "Comment", value: commentVal, pct: Math.round((commentVal / total) * 100), color: "#EA580C" },
      { name: "Bài đăng", value: postVal, pct: Math.round((postVal / total) * 100), color: "#A855F7" },
      { name: "IB Facebook", value: fbVal, pct: Math.round((fbVal / total) * 100), color: "#06B6D4" },
      { name: "Follow-up", value: followUpVal, pct: Math.round((followUpVal / total) * 100), color: "#EC4899" },
      { name: "Chốt Deal", value: dealVal, pct: Math.round((dealVal / total) * 100), color: "#10B981" },
    ];
  }, [totalStats]);

  // Prepare chart daily data
  const chartDailyData = useMemo(() => {
    const dailyMap = new Map<string, { date: string; fullDate: string; revenue: number; zalo: number; fb: number; deal: number }>();
    
    // Seed all dates of selected month up to current day (if current month)
    const year = parseInt(selectedMonth.split("-")[0]);
    const monthIndex = parseInt(selectedMonth.split("-")[1]) - 1;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonthIndex = today.getMonth();
    const curDay = today.getDate();
    
    let maxDay = daysInMonth;
    if (year === curYear && monthIndex === curMonthIndex) {
      maxDay = curDay;
    } else if (year > curYear || (year === curYear && monthIndex > curMonthIndex)) {
      maxDay = 0; // future month
    }
    
    for (let d = 1; d <= maxDay; d++) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, "0")}`;
      dailyMap.set(dateStr, { 
        date: `${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, 
        fullDate: dateStr, 
        revenue: 0, 
        zalo: 0, 
        fb: 0, 
        deal: 0 
      });
    }

    // Populate data from logs
    currentMonthEntries.forEach(entry => {
      const dayData = dailyMap.get(entry.date);
      if (dayData) {
        dayData.revenue += entry.metrics.revenue;
        dayData.zalo += entry.metrics.zalo;
        dayData.fb += entry.metrics.fb;
        dayData.deal += entry.metrics.deal;
      }
    });

    return Array.from(dailyMap.values());
  }, [currentMonthEntries, selectedMonth]);

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.kpi.saveTarget({
        id: editingTargetId,
        employeeId: targetEmployeeId,
        month: targetForm.month,
        metrics: targetForm.metrics
      });
      await loadData();
      setIsTargetModalOpen(false);
      showToast("Đã lưu chỉ tiêu KPI mới thành công!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Lỗi khi lưu chỉ tiêu KPI", "error");
    }
  };

  const openAddTargetModal = () => {
    setTargetEmployeeId("all");
    setTargetFormType("all");
    setEditingTargetId(null);
    setTargetForm({
      employeeId: "all",
      month: selectedMonth,
      metrics: { zalo: 2000, fb: 1500, comment: 500, post: 150, clientReply: 600, khachChuDongIB: 60, followUp: 400, quote: 80, deal: 25, revenue: 80000000 }
    });
    setIsTargetModalOpen(true);
  };

  const handleEditTarget = (target: KpiTarget) => {
    setTargetEmployeeId(target.employeeId);
    setTargetFormType(target.employeeId === "all" ? "all" : "employee");
    setEditingTargetId(target.id);
    setTargetForm({
      employeeId: target.employeeId,
      month: target.month,
      metrics: { ...target.metrics }
    });
    setIsTargetModalOpen(true);
  };

  const handleDeleteTarget = (targetId: string) => {
    setDeleteTargetId(targetId);
  };

  const handleExportCSV = () => {
    if (reportGroupedData.length === 0) {
      showToast("Không có dữ liệu để xuất!", "error");
      return;
    }
    const headers = ["NHÓM", "IB ZALO", "IB FACEBOOK", "COMMENT", "BÀI ĐĂNG", "KHÁCH REP", "FOLLOW-UP", "BÁO GIÁ", "CHỐT DEAL", "DOANH THU", "KH CHỦ ĐỘNG", "ENTRIES"];
    const rows = reportGroupedData.map(row => [
      row.groupKey,
      row.zalo,
      row.fb,
      row.comment,
      row.post,
      row.clientReply,
      row.followUp,
      row.quote,
      row.deal,
      row.revenue,
      row.khachChuDongIB,
      row.entriesCount
    ]);
    rows.push([
      "Tổng",
      reportTotals.zalo,
      reportTotals.fb,
      reportTotals.comment,
      reportTotals.post,
      reportTotals.clientReply,
      reportTotals.followUp,
      reportTotals.quote,
      reportTotals.deal,
      reportTotals.revenue,
      reportTotals.khachChuDongIB,
      reportTotals.entriesCount
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_KPI_${reportGroupBy}_${reportStartDate}_to_${reportEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã xuất CSV thành công!", "success");
  };

  // Real Excel HTML-Based Export
  const handleExportExcel = () => {
    if (reportGroupedData.length === 0) {
      showToast("Không có dữ liệu để xuất!", "error");
      return;
    }
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><meta charset="utf-8"/><style>table { border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: center; } th { background-color: #f2f2f2; font-weight: bold; }</style></head><body>`;
    html += `<table>`;
    html += `<tr><th>NHÓM</th><th>IB ZALO</th><th>IB FACEBOOK</th><th>COMMENT</th><th>BÀI ĐĂNG</th><th>KHÁCH REP</th><th>FOLLOW-UP</th><th>BÁO GIÁ</th><th>CHỐT DEAL</th><th>DOANH THU</th><th>KH CHỦ ĐỘNG</th><th>ENTRIES</th></tr>`;
    reportGroupedData.forEach(row => {
      html += `<tr><td>${row.groupKey}</td><td>${row.zalo}</td><td>${row.fb}</td><td>${row.comment}</td><td>${row.post}</td><td>${row.clientReply}</td><td>${row.followUp}</td><td>${row.quote}</td><td>${row.deal}</td><td>${row.revenue}</td><td>${row.khachChuDongIB}</td><td>${row.entriesCount}</td></tr>`;
    });
    html += `<tr style="font-weight: bold; background-color: #f9f9f9;"><td>Tổng</td><td>${reportTotals.zalo}</td><td>${reportTotals.fb}</td><td>${reportTotals.comment}</td><td>${reportTotals.post}</td><td>${reportTotals.clientReply}</td><td>${reportTotals.followUp}</td><td>${reportTotals.quote}</td><td>${reportTotals.deal}</td><td>${reportTotals.revenue}</td><td>${reportTotals.khachChuDongIB}</td><td>${reportTotals.entriesCount}</td></tr>`;
    html += `</table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_KPI_${reportGroupBy}_${reportStartDate}_to_${reportEndDate}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã xuất Excel thành công!", "success");
  };

  // Real PDF Export (Direct Download)
  const handleExportPDF = () => {
    if (reportGroupedData.length === 0) {
      showToast("Không có dữ liệu để xuất!", "error");
      return;
    }
    showToast("Đang chuẩn bị xuất file PDF...", "success");

    const scriptUrl = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    
    const runExport = () => {
      const element = document.createElement("div");
      element.style.padding = "20px";
      element.style.fontFamily = "Arial, sans-serif";
      element.style.color = "#333";
      
      let html = `<h2 style="text-align: center; color: #C62828; margin-bottom: 5px;">BÁO CÁO PHÂN TÍCH KPI</h2>`;
      html += `<div style="text-align: center; font-size: 11px; color: #666; margin-bottom: 25px;">Khoảng thời gian: ${reportStartDate} đến ${reportEndDate} | Nhóm theo: ${reportGroupBy === "day" ? "Ngày" : reportGroupBy === "employee" ? "Nhân viên" : "Phòng ban"}</div>`;
      
      const activeDivisor = reportGroupedData.length || 1;
      html += `<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 25px;">`;
      html += `<div style="border: 1px solid #eee; padding: 12px; border-radius: 8px; text-align: center; background: #fafafa;"><span style="font-size: 9px; text-transform: uppercase; color: #888;">IB Zalo</span><h3 style="margin: 8px 0 0 0; font-size: 14px; font-weight: bold;">${reportTotals.zalo}</h3><small style="font-size: 9px; color: #999;">TB: ${Math.round(reportTotals.zalo / activeDivisor)}</small></div>`;
      html += `<div style="border: 1px solid #eee; padding: 12px; border-radius: 8px; text-align: center; background: #fafafa;"><span style="font-size: 9px; text-transform: uppercase; color: #888;">IB Facebook</span><h3 style="margin: 8px 0 0 0; font-size: 14px; font-weight: bold;">${reportTotals.fb}</h3><small style="font-size: 9px; color: #999;">TB: ${Math.round(reportTotals.fb / activeDivisor)}</small></div>`;
      html += `<div style="border: 1px solid #eee; padding: 12px; border-radius: 8px; text-align: center; background: #fafafa;"><span style="font-size: 9px; text-transform: uppercase; color: #888;">Chốt Deal</span><h3 style="margin: 8px 0 0 0; font-size: 14px; font-weight: bold;">${reportTotals.deal}</h3><small style="font-size: 9px; color: #999;">TB: ${Math.round(reportTotals.deal / activeDivisor)}</small></div>`;
      html += `<div style="border: 1px solid #eee; padding: 12px; border-radius: 8px; text-align: center; background: #fafafa;"><span style="font-size: 9px; text-transform: uppercase; color: #888;">Doanh thu</span><h3 style="margin: 8px 0 0 0; font-size: 14px; font-weight: bold;">${reportTotals.revenue.toLocaleString("vi-VN")} đ</h3><small style="font-size: 9px; color: #999;">TB: ${Math.round(reportTotals.revenue / activeDivisor).toLocaleString("vi-VN")} đ</small></div>`;
      html += `<div style="border: 1px solid #eee; padding: 12px; border-radius: 8px; text-align: center; background: #fafafa;"><span style="font-size: 9px; text-transform: uppercase; color: #888;">Follow-up</span><h3 style="margin: 8px 0 0 0; font-size: 14px; font-weight: bold;">${reportTotals.followUp}</h3><small style="font-size: 9px; color: #999;">TB: ${Math.round(reportTotals.followUp / activeDivisor)}</small></div>`;
      html += `</div>`;

      html += `<table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px;">`;
      html += `<thead><tr style="background-color: #f5f5f5; font-weight: bold; color: #444;"><th style="border: 1px solid #ddd; padding: 6px;">NHÓM</th><th style="border: 1px solid #ddd; padding: 6px;">IB ZALO</th><th style="border: 1px solid #ddd; padding: 6px;">IB FACEBOOK</th><th style="border: 1px solid #ddd; padding: 6px;">COMMENT</th><th style="border: 1px solid #ddd; padding: 6px;">BÀI ĐĂNG</th><th style="border: 1px solid #ddd; padding: 6px;">KHÁCH REP</th><th style="border: 1px solid #ddd; padding: 6px;">FOLLOW-UP</th><th style="border: 1px solid #ddd; padding: 6px;">BÁO GIÁ</th><th style="border: 1px solid #ddd; padding: 6px;">CHỐT DEAL</th><th style="border: 1px solid #ddd; padding: 6px;">DOANH THU</th><th style="border: 1px solid #ddd; padding: 6px;">KH CHỦ ĐỘNG</th><th style="border: 1px solid #ddd; padding: 6px;">ENTRIES</th></tr></thead><tbody>`;
      reportGroupedData.forEach(row => {
        html += `<tr><td style="border: 1px solid #ddd; padding: 6px;"><b>${row.groupKey}</b></td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${row.zalo}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${row.fb}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${row.comment}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${row.post}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${row.clientReply}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${row.followUp}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${row.quote}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${row.deal}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${row.revenue.toLocaleString("vi-VN")}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${row.khachChuDongIB}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${row.entriesCount}</td></tr>`;
      });
      html += `<tr style="font-weight: bold; background-color: #f0f0f0;"><td style="border: 1px solid #ddd; padding: 6px;">Tổng</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${reportTotals.zalo}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${reportTotals.fb}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${reportTotals.comment}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${reportTotals.post}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${reportTotals.clientReply}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${reportTotals.followUp}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${reportTotals.quote}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${reportTotals.deal}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${reportTotals.revenue.toLocaleString("vi-VN")} đ</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${reportTotals.khachChuDongIB}</td><td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${reportTotals.entriesCount}</td></tr></tbody></table>`;
      element.innerHTML = html;

      const opt = {
        margin: 10,
        filename: `Bao_cao_KPI_${reportGroupBy}_${reportStartDate}_to_${reportEndDate}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
      };

      (window as any).html2pdf().set(opt).from(element).save().then(() => {
        showToast("Đã tải xuống file PDF thành công!", "success");
      }).catch((err: any) => {
        console.error(err);
        showToast("Lỗi khi tạo file PDF!", "error");
      });
    };

    if (!(window as any).html2pdf) {
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.onload = runExport;
      script.onerror = () => showToast("Không thể tải thư viện xuất PDF!", "error");
      document.head.appendChild(script);
    } else {
      runExport();
    }
  };

  // Compare stats logic
  const comparisonData = useMemo(() => {
    let entries1: typeof entries = [];
    let entries2: typeof entries = [];
    let labelSuffix1 = "";
    let labelSuffix2 = "";

    if (compareMode === "year") {
      // Year vs Year mode
      entries1 = entries.filter(e => e.date.startsWith(compYear1) && (compareEmployeeId === "all" ? filteredEmployeeIds.has(e.employeeId) : e.employeeId === compareEmployeeId));
      entries2 = entries.filter(e => e.date.startsWith(compYear2) && (compareEmployeeId === "all" ? filteredEmployeeIds.has(e.employeeId) : e.employeeId === compareEmployeeId));
      labelSuffix1 = `Năm ${compYear1}`;
      labelSuffix2 = `Năm ${compYear2}`;
    } else if (compareMode === "period") {
      // Period mode: Today vs Yesterday, Week vs Week, Month vs Month, Quarter vs Quarter, Year vs Year
      if (comparePeriod === "today") {
        entries1 = entries.filter(e => e.date === "2026-07-09" && (compareEmployeeId === "all" ? filteredEmployeeIds.has(e.employeeId) : e.employeeId === compareEmployeeId));
        entries2 = entries.filter(e => e.date === "2026-07-08" && (compareEmployeeId === "all" ? filteredEmployeeIds.has(e.employeeId) : e.employeeId === compareEmployeeId));
        labelSuffix1 = "Hôm nay";
        labelSuffix2 = "Hôm qua";
      } else if (comparePeriod === "week") {
        entries1 = entries.filter(e => e.date >= "2026-07-06" && e.date <= "2026-07-12" && (compareEmployeeId === "all" ? filteredEmployeeIds.has(e.employeeId) : e.employeeId === compareEmployeeId));
        entries2 = entries.filter(e => e.date >= "2026-06-29" && e.date <= "2026-07-05" && (compareEmployeeId === "all" ? filteredEmployeeIds.has(e.employeeId) : e.employeeId === compareEmployeeId));
        labelSuffix1 = "Tuần này";
        labelSuffix2 = "Tuần trước";
      } else if (comparePeriod === "quarter") {
        entries1 = entries.filter(e => e.date >= "2026-07-01" && e.date <= "2026-09-30" && (compareEmployeeId === "all" ? filteredEmployeeIds.has(e.employeeId) : e.employeeId === compareEmployeeId));
        entries2 = entries.filter(e => e.date >= "2026-04-01" && e.date <= "2026-06-30" && (compareEmployeeId === "all" ? filteredEmployeeIds.has(e.employeeId) : e.employeeId === compareEmployeeId));
        labelSuffix1 = "Quý này";
        labelSuffix2 = "Quý trước";
      } else if (comparePeriod === "year") {
        entries1 = entries.filter(e => e.date.startsWith("2026") && (compareEmployeeId === "all" ? filteredEmployeeIds.has(e.employeeId) : e.employeeId === compareEmployeeId));
        entries2 = entries.filter(e => e.date.startsWith("2025") && (compareEmployeeId === "all" ? filteredEmployeeIds.has(e.employeeId) : e.employeeId === compareEmployeeId));
        labelSuffix1 = "Năm nay";
        labelSuffix2 = "Năm trước";
      } else {
        // default to "month" cycle
        entries1 = entries.filter(e => e.date.startsWith("2026-07") && (compareEmployeeId === "all" ? filteredEmployeeIds.has(e.employeeId) : e.employeeId === compareEmployeeId));
        entries2 = entries.filter(e => e.date.startsWith("2026-06") && (compareEmployeeId === "all" ? filteredEmployeeIds.has(e.employeeId) : e.employeeId === compareEmployeeId));
        labelSuffix1 = "Tháng này";
        labelSuffix2 = "Tháng trước";
      }
    } else {
      // Month vs Month mode
      entries1 = entries.filter(e => e.date.startsWith(compMonth1) && (compareEmployeeId === "all" ? filteredEmployeeIds.has(e.employeeId) : e.employeeId === compareEmployeeId));
      entries2 = entries.filter(e => e.date.startsWith(compMonth2) && (compareEmployeeId === "all" ? filteredEmployeeIds.has(e.employeeId) : e.employeeId === compareEmployeeId));
      labelSuffix1 = `Tháng ${compMonth1.split("-")[1]}/${compMonth1.split("-")[0]}`;
      labelSuffix2 = `Tháng ${compMonth2.split("-")[1]}/${compMonth2.split("-")[0]}`;
    }

    const totals1 = { zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, khachChuDongIB: 0, followUp: 0, quote: 0, deal: 0, revenue: 0 };
    entries1.forEach(e => {
      Object.keys(totals1).forEach(k => {
        totals1[k as keyof KpiMetrics] += e.metrics[k as keyof KpiMetrics] || 0;
      });
    });
    const points1 = calculateKpiPoints(totals1);

    const totals2 = { zalo: 0, fb: 0, comment: 0, post: 0, clientReply: 0, khachChuDongIB: 0, followUp: 0, quote: 0, deal: 0, revenue: 0 };
    entries2.forEach(e => {
      Object.keys(totals2).forEach(k => {
        totals2[k as keyof KpiMetrics] += e.metrics[k as keyof KpiMetrics] || 0;
      });
    });
    const points2 = calculateKpiPoints(totals2);

    const empName = compareEmployeeId === "all" ? "Toàn chi nhánh" : (employees.find(e => e.id === compareEmployeeId)?.name || "Nhân viên");

    return {
      t1: { totals: totals1, points: points1, label: `${empName} (${labelSuffix1})` },
      t2: { totals: totals2, points: points2, label: `${empName} (${labelSuffix2})` }
    };
  }, [entries, compareMode, comparePeriod, compMonth1, compMonth2, compYear1, compYear2, compareEmployeeId, filteredEmployeeIds, employees]);

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
    <div className="space-y-6 pb-12">
      {/* Top Banner widgets */}
      <div className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:10px_10px] rounded-3xl p-6 text-white relative overflow-hidden shadow-md shadow-red-900/20">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 items-center shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-white/30 animate-pulse"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-white/60 animate-pulse delay-75"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse delay-150"></span>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">
                {activeTab === "overview" ? "Hệ Thống Quản Lý & Phân Tích KPI" : activeTab === "stats" ? "Thống kê KPI" : "So sánh KPI"}
              </h2>
              <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                {activeTab === "overview"
                  ? "Theo dõi hiệu suất truyền thông, tương tác khách hàng và doanh thu của toàn bộ nhân viên chi nhánh."
                  : activeTab === "stats"
                  ? "Xem bảng xếp hạng và thống kê điểm tích lũy KPI của nhân sự."
                  : "So sánh hiệu suất và các chỉ số KPI giữa các nhân sự hoặc phòng ban."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs header with Month Picker on the right */}
      {activeTab === "overview" && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full mb-6">
          <div className="flex gap-1.5 rounded-2xl p-1 bg-white border border-gray-200">
            <button
              onClick={() => setOverviewSubTab("charts")}
              className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                overviewSubTab === "charts"
                  ? "bg-[#C62828] text-white shadow-sm"
                  : "text-[#8b6b70] hover:text-[#C62828]"
              }`}
            >
              <BarChart3 size={14} />
              Tổng quan
            </button>
            <button
              onClick={() => setOverviewSubTab("reports")}
              className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                overviewSubTab === "reports"
                  ? "bg-[#C62828] text-white shadow-sm"
                  : "text-[#8b6b70] hover:text-[#C62828]"
              }`}
            >
              <FileText size={14} />
              Báo cáo
            </button>
            <button
              onClick={() => setOverviewSubTab("targets")}
              className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                overviewSubTab === "targets"
                  ? "bg-[#C62828] text-white shadow-sm"
                  : "text-[#8b6b70] hover:text-[#C62828]"
              }`}
            >
              <Settings size={14} />
              KPI Target
            </button>
          </div>

          {overviewSubTab === "charts" && (
            <div className="relative flex items-center gap-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-xs">
              <span>CHỌN THÁNG:</span>
              <CustomMonthPicker value={selectedMonth} onChange={setSelectedMonth} />
            </div>
          )}
        </div>
      )}

      {/* TAB Content: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Sub tab content: Charts */}
          {overviewSubTab === "charts" && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Card 1: Tổng nhân viên */}
                <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tổng nhân viên</p>
                    <h3 className="text-xl font-black text-gray-800 mt-2">{filteredEmployees.length}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Users size={20} />
                  </div>
                </div>

                {/* Card 2: Doanh thu tháng */}
                {(() => {
                  const diff = totalStats.revenue - selectedMonthTarget.revenue;
                  const pct = selectedMonthTarget.revenue > 0 ? Math.abs(Math.round((diff / selectedMonthTarget.revenue) * 100)) : 0;
                  return (
                    <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Doanh thu tháng</p>
                        <h3 className="text-xl font-black text-gray-800 mt-2">
                          {formatCompareValue("revenue", totalStats.revenue)}
                        </h3>
                        <p className={`text-[10px] font-extrabold mt-2 flex items-center gap-0.5 ${diff >= 0 ? "text-green-600" : "text-rose-600"}`}>
                          <span>{diff >= 0 ? "▲" : "▼"}</span>
                          <span>{pct}%</span>
                          <span className="text-gray-400 font-bold">({diff >= 0 ? "+" : ""}{diff.toLocaleString("vi-VN")})</span>
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0 ml-3">
                        <TrendingUp size={20} />
                      </div>
                    </div>
                  );
                })()}

                {/* Card 3: Chốt Deal tháng */}
                {(() => {
                  const diff = totalStats.deal - selectedMonthTarget.deal;
                  const pct = selectedMonthTarget.deal > 0 ? Math.abs(Math.round((diff / selectedMonthTarget.deal) * 100)) : 0;
                  return (
                    <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chốt Deal tháng</p>
                        <h3 className="text-xl font-black text-gray-800 mt-2">{totalStats.deal}</h3>
                        <p className={`text-[10px] font-extrabold mt-2 flex items-center gap-0.5 ${diff >= 0 ? "text-green-600" : "text-rose-600"}`}>
                          <span>{diff >= 0 ? "▲" : "▼"}</span>
                          <span>{pct}%</span>
                          <span className="text-gray-400 font-bold">({diff >= 0 ? "+" : ""}{diff.toLocaleString("vi-VN")})</span>
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0 ml-3">
                        <Award size={20} />
                      </div>
                    </div>
                  );
                })()}

                {/* Card 4: Tổng IB tháng */}
                <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tổng IB tháng</p>
                    <h3 className="text-xl font-black text-gray-800 mt-2">{(totalStats.zalo + totalStats.fb).toLocaleString()}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <FileText size={20} />
                  </div>
                </div>
              </div>

              {/* Charts grid */}
              {(() => {
                const minChartWidth = Math.max(chartDailyData.length * 35, 550);
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily revenue trend */}
                    <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
                      <div className="mb-4">
                        <h4 className="font-bold text-gray-800 text-sm">Xu hướng doanh thu 30 ngày</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">Biểu đồ tổng hợp doanh thu phát sinh trong tháng</p>
                      </div>
                      {chartDailyData.length === 0 || chartDailyData.every(d => d.revenue === 0) ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-2">
                          <BarChart3 size={32} className="text-gray-200" />
                          <p className="text-xs text-gray-400 font-medium">Chưa có dữ liệu doanh thu</p>
                        </div>
                      ) : (
                        <div className="h-64 w-full text-xs overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
                          <div style={{ width: minChartWidth, height: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartDailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#C62828" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#C62828" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" stroke="#9ca3af" axisLine={false} tickLine={false} tickFormatter={(val) => val.split("-")[1]} interval={1} />
                                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} tickFormatter={(val) => `${(val/1000000).toFixed(0)}M`} />
                                <Tooltip formatter={(value) => [`${(value as number).toLocaleString()} đ`, "Doanh thu"]} />
                                <Area type="monotone" dataKey="revenue" stroke="#C62828" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Conversion chart */}
                    <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">Inbox & Deal 30 ngày</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">Xu hướng chốt deal song song với lượt inbox Zalo & Facebook</p>
                        </div>
                        {/* Custom Legend outside the scroll region */}
                        <div className="flex flex-wrap items-center gap-3 text-[9px] font-black leading-none shrink-0 bg-gray-50 border border-gray-100 p-2 rounded-xl">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#6d28d9] shrink-0"></span>
                            <span className="text-gray-500">IB Zalo</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB] shrink-0"></span>
                            <span className="text-gray-500">IB Facebook</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#16A34A] shrink-0"></span>
                            <span className="text-gray-500">Chốt Deal</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-64 w-full text-xs overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
                        <div style={{ width: minChartWidth, height: "100%" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartDailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                              <XAxis dataKey="date" stroke="#9ca3af" axisLine={false} tickLine={false} tickFormatter={(val) => val.split("-")[1]} interval={1} />
                              <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                              <Tooltip content={<KpiBarTooltip />} />
                              <Bar dataKey="zalo" name="IB Zalo" fill="#6d28d9" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="fb" name="IB Facebook" fill="#2563EB" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="deal" name="Chốt Deal" fill="#16A34A" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              {/* Leaderboard & Pie chart grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Leaderboard widget (revenue) */}
                <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-800 text-sm">Top nhân viên (Doanh thu tháng)</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Xếp hạng nhân sự tạo ra doanh thu tốt nhất tháng này</p>
                  </div>
                  <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                    {topRevenueEmployees.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-8">Chưa ghi nhận doanh thu</p>
                    ) : (
                      topRevenueEmployees.map((emp, index) => (
                        <div key={emp.employeeId} className="flex justify-between items-center border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                              index === 0 ? "bg-amber-100 text-amber-700" :
                              index === 1 ? "bg-slate-100 text-slate-700" :
                              index === 2 ? "bg-orange-100 text-orange-700" :
                              "bg-gray-100 text-gray-600"
                            }`}>{index + 1}</span>
                            <div>
                              <p className="text-xs font-bold text-gray-800">{emp.name}</p>
                              <p className="text-[9px] text-gray-400">{emp.position} • {emp.department}</p>
                            </div>
                          </div>
                          <p className="text-xs font-black text-gray-700">{emp.metrics.revenue.toLocaleString("vi-VN")} đ</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pie Chart interactions */}
                <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
                  <div className="mb-2">
                    <h4 className="font-bold text-gray-800 text-sm">Phân bổ KPI tháng</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Tỷ lệ cơ cấu thực tế các đầu tương tác hội thoại chi nhánh</p>
                  </div>
                  <div className="h-64 w-full text-xs relative flex items-center justify-center">
                    {donutData.length === 0 ? (
                      <p className="text-xs text-gray-400">Không có dữ liệu phân bổ</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, pct }) => `${name} ${pct}%`}
                            labelLine={true}
                          >
                            {donutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name, props) => [`${value} lượt (${props.payload.pct}%)`, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub tab content: Reports */}
          {overviewSubTab === "reports" && (
            <div className="space-y-6">
              {/* Header with Title and Export Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-black text-gray-800">Báo cáo KPI</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Phân tích chi tiết hiệu quả truyền thông chi nhánh</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 py-1.5 px-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
                  >
                    <Download size={13} />
                    Xuất CSV
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 py-1.5 px-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-bold hover:bg-green-100 transition-all cursor-pointer shadow-xs"
                  >
                    <Download size={13} />
                    Xuất Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 py-1.5 px-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold hover:bg-red-100 transition-all cursor-pointer shadow-xs"
                  >
                    <Download size={13} />
                    Xuất PDF
                  </button>
                </div>
              </div>

              {/* Advanced Filter Box */}
              <div className="bg-white rounded-3xl p-5 border border-black/5 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <CustomSelect
                  label="Khoảng thời gian"
                  value={reportTimeRange}
                  onChange={setReportTimeRange}
                  options={timeRangeOptions}
                />

                <CustomSelect
                  label="Nhóm theo"
                  value={reportGroupBy}
                  onChange={setReportGroupBy}
                  options={groupByOptions}
                />

                <CustomSelect
                  label="Nhân viên"
                  value={reportEmployeeId}
                  onChange={setReportEmployeeId}
                  options={employeeOptions}
                />

                <CustomDatePicker
                  label="Từ ngày"
                  value={reportStartDate}
                  onChange={setReportStartDate}
                  disabled={reportTimeRange !== "custom"}
                />

                <CustomDatePicker
                  label="Đến ngày"
                  value={reportEndDate}
                  onChange={setReportEndDate}
                  disabled={reportTimeRange !== "custom"}
                />
              </div>

              {/* Aggregated Performance Metrics */}
              {(() => {
                const activeDivisor = reportGroupedData.length || 1;
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">IB Zalo</span>
                      <h3 className="text-xl font-black text-gray-800 mt-2">{reportTotals.zalo}</h3>
                      <span className="text-[9px] text-gray-400 font-bold mt-1">TB: {Math.round(reportTotals.zalo / activeDivisor)}</span>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">IB Facebook</span>
                      <h3 className="text-xl font-black text-gray-800 mt-2">{reportTotals.fb}</h3>
                      <span className="text-[9px] text-gray-400 font-bold mt-1">TB: {Math.round(reportTotals.fb / activeDivisor)}</span>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chốt Deal</span>
                      <h3 className="text-xl font-black text-gray-800 mt-2">{reportTotals.deal}</h3>
                      <span className="text-[9px] text-gray-400 font-bold mt-1">TB: {Math.round(reportTotals.deal / activeDivisor)}</span>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Doanh thu</span>
                      <h3 className="text-xl font-black text-gray-800 mt-2">{formatCompareValue("revenue", reportTotals.revenue)}</h3>
                      <span className="text-[9px] text-gray-400 font-bold mt-1">TB: {formatCompareValue("revenue", Math.round(reportTotals.revenue / activeDivisor))}</span>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Follow-up</span>
                      <h3 className="text-xl font-black text-gray-800 mt-2">{reportTotals.followUp}</h3>
                      <span className="text-[9px] text-gray-400 font-bold mt-1">TB: {Math.round(reportTotals.followUp / activeDivisor)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Charts grid */}
              {(() => {
                const minReportChartWidth = Math.max(reportGroupedData.length * 35, 550);
                const formatReportXAxis = (val: string) => {
                  if (!val) return "";
                  if (val.includes("-") && val.split("-").length === 3) {
                    const parts = val.split("-");
                    return `${parts[2]}/${parts[1]}`; // DD/MM
                  }
                  return val;
                };

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Doanh thu & Deal Bar Chart */}
                    <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">Doanh thu & Deal</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">Số lượng báo giá và deal chốt thực tế</p>
                        </div>
                        {/* Custom Legend outside scroll container */}
                        <div className="flex flex-wrap items-center gap-3 text-[9px] font-black leading-none shrink-0 bg-gray-50 border border-gray-100 p-2 rounded-xl">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#EF5350] shrink-0"></span>
                            <span className="text-gray-500">Báo giá</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#C62828] shrink-0"></span>
                            <span className="text-gray-500">Chốt Deal</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-64 w-full text-xs overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
                        <div style={{ width: minReportChartWidth, height: "100%" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportGroupedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                              <XAxis dataKey="groupKey" stroke="#9ca3af" axisLine={false} tickLine={false} tickFormatter={formatReportXAxis} />
                              <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                              <Tooltip />
                              <Bar dataKey="quote" name="Báo giá" fill="#EF5350" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="deal" name="Chốt Deal" fill="#C62828" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* IB & Tương tác Line Chart */}
                    <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">IB & Tương tác</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">Tương quan tương tác hội thoại bình luận và nhắn tin</p>
                        </div>
                        {/* Custom Legend outside scroll container */}
                        <div className="flex flex-wrap items-center gap-3 text-[9px] font-black leading-none shrink-0 bg-gray-50 border border-gray-100 p-2 rounded-xl">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] shrink-0"></span>
                            <span className="text-gray-500">Comment</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6] shrink-0"></span>
                            <span className="text-gray-500">IB Facebook</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444] shrink-0"></span>
                            <span className="text-gray-500">IB Zalo</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-64 w-full text-xs overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
                        <div style={{ width: minReportChartWidth, height: "100%" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={reportGroupedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                              <XAxis dataKey="groupKey" stroke="#9ca3af" axisLine={false} tickLine={false} tickFormatter={formatReportXAxis} />
                              <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                              <Tooltip />
                              <Line type="monotone" dataKey="comment" name="Comment" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                              <Line type="monotone" dataKey="fb" name="IB Facebook" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                              <Line type="monotone" dataKey="zalo" name="IB Zalo" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Detailed Grouped Report Table */}
              <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
                <h4 className="font-bold text-gray-800 text-sm mb-4">Chi tiết báo cáo phân tích</h4>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="p-3">NHÓM</th>
                        <th className="p-3 text-center">IB ZALO</th>
                        <th className="p-3 text-center">IB FACEBOOK</th>
                        <th className="p-3 text-center">COMMENT</th>
                        <th className="p-3 text-center">BÀI ĐĂNG</th>
                        <th className="p-3 text-center">KHÁCH REP</th>
                        <th className="p-3 text-center">FOLLOW-UP</th>
                        <th className="p-3 text-center">BÁO GIÁ</th>
                        <th className="p-3 text-center">CHỐT DEAL</th>
                        <th className="p-3 text-right">DOANH THU</th>
                        <th className="p-3 text-center">KH CHỦ ĐỘNG</th>
                        <th className="p-3 text-center">ENTRIES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
                      {reportGroupedData.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="text-center py-8 text-gray-400 font-medium">Không có dữ liệu báo cáo</td>
                        </tr>
                      ) : (
                        <>
                          {paginatedReportData.map(row => (
                            <tr key={row.groupKey} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-3 font-bold text-gray-800">{row.groupKey}</td>
                              <td className="p-3 text-center">{row.zalo}</td>
                              <td className="p-3 text-center">{row.fb}</td>
                              <td className="p-3 text-center">{row.comment}</td>
                              <td className="p-3 text-center">{row.post}</td>
                              <td className="p-3 text-center">{row.clientReply}</td>
                              <td className="p-3 text-center">{row.followUp}</td>
                              <td className="p-3 text-center">{row.quote}</td>
                              <td className="p-3 text-center text-green-700 font-bold">{row.deal}</td>
                              <td className="p-3 text-right font-bold text-gray-800">{row.revenue.toLocaleString("vi-VN")}</td>
                              <td className="p-3 text-center">{row.khachChuDongIB}</td>
                              <td className="p-3 text-center font-bold text-blue-600">{row.entriesCount}</td>
                            </tr>
                          ))}
                          {/* Totals Row */}
                          <tr className="bg-gray-50/80 font-black text-gray-800 border-t border-gray-200">
                            <td className="p-3">Tổng</td>
                            <td className="p-3 text-center">{reportTotals.zalo}</td>
                            <td className="p-3 text-center">{reportTotals.fb}</td>
                            <td className="p-3 text-center">{reportTotals.comment}</td>
                            <td className="p-3 text-center">{reportTotals.post}</td>
                            <td className="p-3 text-center">{reportTotals.clientReply}</td>
                            <td className="p-3 text-center">{reportTotals.followUp}</td>
                            <td className="p-3 text-center">{reportTotals.quote}</td>
                            <td className="p-3 text-center text-green-700 font-bold">{reportTotals.deal}</td>
                            <td className="p-3 text-right font-black text-[#C62828]">{reportTotals.revenue.toLocaleString("vi-VN")}</td>
                            <td className="p-3 text-center">{reportTotals.khachChuDongIB}</td>
                            <td className="p-3 text-center text-blue-700">{reportTotals.entriesCount}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {reportGroupedData.length > reportPageSize && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-5 pt-4 border-t border-gray-100 text-xs font-bold text-gray-500">
                    <div>
                      Hiển thị {((reportPage - 1) * reportPageSize) + 1} - {Math.min(reportPage * reportPageSize, reportGroupedData.length)} trong tổng số {reportGroupedData.length} dòng
                    </div>
                    <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl p-0.5 shadow-xs">
                      <button
                        disabled={reportPage === 1}
                        onClick={() => setReportPage(p => Math.max(1, p - 1))}
                        className="flex items-center justify-center w-8 h-8 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                        title="Trang trước"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="px-3 text-xs font-black text-gray-700 min-w-[70px] text-center font-mono">
                        {reportPage} / {Math.ceil(reportGroupedData.length / reportPageSize)}
                      </span>
                      <button
                        disabled={reportPage >= Math.ceil(reportGroupedData.length / reportPageSize)}
                        onClick={() => setReportPage(p => p + 1)}
                        className="flex items-center justify-center w-8 h-8 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                        title="Trang sau"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub tab content: Targets list */}
          {overviewSubTab === "targets" && (
            <div className="space-y-6">
              {/* Header Title bar */}
              <div className="flex justify-between items-center bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
                <div>
                  <h4 className="font-extrabold text-gray-800 text-sm">KPI Target</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-bold">Cấu hình mục tiêu KPI</p>
                </div>
                {!isTargetModalOpen && (
                  <button
                    onClick={openAddTargetModal}
                    className="flex items-center gap-1.5 py-2 px-5 bg-[#C62828] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-md cursor-pointer"
                  >
                    <Plus size={14} />
                    Thêm Target
                  </button>
                )}
              </div>

              {/* Inline Add/Edit Target form card */}
              {isTargetModalOpen && (
                <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs space-y-4 animate-[sessionModalIn_0.15s_ease]">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <h5 className="font-extrabold text-gray-800 text-xs">Thêm Target</h5>
                    <button
                      type="button"
                      onClick={() => setIsTargetModalOpen(false)}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveTarget} className="space-y-4 text-xs font-bold text-gray-500">
                    {/* Form selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-gray-400">Loại target</label>
                        <select
                          value={targetFormType}
                          onChange={(e) => {
                            const val = e.target.value as "all" | "employee";
                            setTargetFormType(val);
                            if (val === "all") {
                              setTargetEmployeeId("all");
                            } else {
                              setTargetEmployeeId(filteredEmployees[0]?.id || "");
                            }
                          }}
                          className="w-full py-2 px-3 border border-gray-200 rounded-xl focus:border-[#C62828] focus:outline-none text-gray-600 bg-white"
                        >
                          <option value="all">Tất cả nhân viên</option>
                          <option value="employee">Nhân viên cụ thể</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-gray-400">Đối tượng</label>
                        <select
                          value={targetEmployeeId}
                          disabled={targetFormType === "all"}
                          onChange={(e) => setTargetEmployeeId(e.target.value)}
                          className="w-full py-2 px-3 border border-gray-200 rounded-xl focus:border-[#C62828] focus:outline-none text-gray-600 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          {targetFormType === "all" ? (
                            <option value="all">Tất cả nhân viên</option>
                          ) : (
                            filteredEmployees.map(e => (
                              <option key={e.id} value={e.id}>{e.name}</option>
                            ))
                          )}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-gray-400">Tháng</label>
                        <div className="relative w-full py-2 px-3 border border-gray-200 rounded-xl focus-within:border-[#C62828] bg-white flex items-center justify-between h-[34px]">
                          <CustomMonthPicker
                            value={targetForm.month}
                            onChange={(val) => setTargetForm(prev => ({ ...prev, month: val }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Form Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 pt-3 border-t border-gray-100">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-400 uppercase">IB Zalo</label>
                        <input
                          type="number"
                          value={targetForm.metrics.zalo}
                          onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, zalo: parseInt(e.target.value) || 0 } }))}
                          className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:border-[#C62828] focus:outline-none font-medium"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-400 uppercase">IB Facebook</label>
                        <input
                          type="number"
                          value={targetForm.metrics.fb}
                          onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, fb: parseInt(e.target.value) || 0 } }))}
                          className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:border-[#C62828] focus:outline-none font-medium"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-400 uppercase">Comment</label>
                        <input
                          type="number"
                          value={targetForm.metrics.comment}
                          onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, comment: parseInt(e.target.value) || 0 } }))}
                          className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:border-[#C62828] focus:outline-none font-medium"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-400 uppercase">Bài đăng</label>
                        <input
                          type="number"
                          value={targetForm.metrics.post}
                          onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, post: parseInt(e.target.value) || 0 } }))}
                          className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:border-[#C62828] focus:outline-none font-medium"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-400 uppercase">Khách rep</label>
                        <input
                          type="number"
                          value={targetForm.metrics.clientReply}
                          onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, clientReply: parseInt(e.target.value) || 0 } }))}
                          className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:border-[#C62828] focus:outline-none font-medium"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-400 uppercase">Follow-up</label>
                        <input
                          type="number"
                          value={targetForm.metrics.followUp}
                          onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, followUp: parseInt(e.target.value) || 0 } }))}
                          className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:border-[#C62828] focus:outline-none font-medium"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-400 uppercase">Báo giá</label>
                        <input
                          type="number"
                          value={targetForm.metrics.quote}
                          onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, quote: parseInt(e.target.value) || 0 } }))}
                          className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:border-[#C62828] focus:outline-none font-medium"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-400 uppercase">Chốt Deal</label>
                        <input
                          type="number"
                          value={targetForm.metrics.deal}
                          onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, deal: parseInt(e.target.value) || 0 } }))}
                          className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:border-[#C62828] focus:outline-none font-medium"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1 col-span-2 sm:col-span-1 md:col-span-1">
                        <label className="text-[10px] text-gray-400 uppercase">Doanh thu</label>
                        <input
                          type="number"
                          value={targetForm.metrics.revenue}
                          onChange={(e) => setTargetForm(prev => ({ ...prev, metrics: { ...prev.metrics, revenue: parseInt(e.target.value) || 0 } }))}
                          className="w-full py-1.5 px-3 border border-gray-200 rounded-xl focus:border-[#C62828] focus:outline-none font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 py-2 px-6 bg-[#C62828] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-md cursor-pointer"
                      >
                        <FileText size={13} />
                        Lưu
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Target List Table */}
              <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="p-3">NHÂN VIÊN</th>
                        <th className="p-3">THÁNG</th>
                        <th className="p-3 text-center">IB ZALO</th>
                        <th className="p-3 text-center">IB FACEBOOK</th>
                        <th className="p-3 text-center">COMMENT</th>
                        <th className="p-3 text-center">BÀI ĐĂNG</th>
                        <th className="p-3 text-center">KHÁCH REP</th>
                        <th className="p-3 text-center">FOLLOW-UP</th>
                        <th className="p-3 text-center">BÁO GIÁ</th>
                        <th className="p-3 text-center">CHỐT DEAL</th>
                        <th className="p-3 text-right">DOANH THU</th>
                        <th className="p-3 text-center">HÀNH ĐỘNG</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
                      {targets.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="text-center py-8 text-gray-400">
                            Không có dữ liệu
                          </td>
                        </tr>
                      ) : (
                        [...targets]
                          .sort((a, b) => b.month.localeCompare(a.month))
                          .map((target) => {
                            const empName = target.employeeId === "all" ? "Tất cả nhân viên" : (employees.find(e => e.id === target.employeeId)?.name || "Nhân viên ẩn danh");
                            return (
                              <tr key={target.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-3 font-extrabold text-gray-800">
                                  {empName}
                                  {target.employeeId !== "all" && <span className="text-[9px] font-normal text-gray-400 ml-1">({target.employeeId})</span>}
                                </td>
                                <td className="p-3 font-semibold">{target.month}</td>
                                <td className="p-3 text-center font-mono">{target.metrics.zalo.toLocaleString()}</td>
                                <td className="p-3 text-center font-mono">{target.metrics.fb.toLocaleString()}</td>
                                <td className="p-3 text-center font-mono">{target.metrics.comment.toLocaleString()}</td>
                                <td className="p-3 text-center font-mono">{target.metrics.post.toLocaleString()}</td>
                                <td className="p-3 text-center font-mono">{target.metrics.clientReply.toLocaleString()}</td>
                                <td className="p-3 text-center font-mono">{target.metrics.followUp.toLocaleString()}</td>
                                <td className="p-3 text-center font-mono">{target.metrics.quote.toLocaleString()}</td>
                                <td className="p-3 text-center font-bold text-green-700 font-mono">{target.metrics.deal.toLocaleString()}</td>
                                <td className="p-3 text-right font-black text-gray-800 font-mono">{target.metrics.revenue.toLocaleString("vi-VN")}</td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleEditTarget(target)}
                                      className="p-1 text-gray-400 hover:text-[#C62828] transition-colors cursor-pointer"
                                      title="Sửa"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTarget(target.id)}
                                      className="p-1 text-gray-400 hover:text-[#C62828] transition-colors cursor-pointer"
                                      title="Xóa"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "stats" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-3xl p-5 border border-black/5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-40">
                <CustomSelect
                  value={statsTimeRange}
                  onChange={(val) => {
                    setStatsTimeRange(val as any);
                    setStatsCurrentPage(1);
                  }}
                  options={[
                    { value: "today", label: "Hôm nay" },
                    { value: "this-week", label: "Tuần này" },
                    { value: "this-month", label: "Tháng này" },
                    { value: "this-year", label: "Năm nay" },
                  ]}
                />
              </div>
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text"
                  placeholder="Tìm nhân viên..."
                  value={statsSearchQuery}
                  onChange={(e) => {
                    setStatsSearchQuery(e.target.value);
                    setStatsCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-2xl text-xs focus:border-[#C62828] focus:outline-none bg-white shadow-sm h-[38px] font-bold"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
              <button className="flex items-center gap-1.5 h-[38px] px-4 bg-white border border-gray-200 text-gray-600 rounded-2xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm cursor-pointer">
                <Filter size={13} />
                Bộ lọc
              </button>
              <button
                onClick={handleExportStatsExcel}
                className="flex items-center gap-1.5 h-[38px] px-5 bg-[#C62828] text-white rounded-2xl text-xs font-bold hover:opacity-90 transition-all shadow-md cursor-pointer"
              >
                <Download size={13} />
                Xuất Excel
              </button>
              <button
                onClick={() => {
                  setStatsSearchQuery("");
                  setStatsTimeRange("this-month");
                  setStatsCurrentPage(1);
                }}
                className="flex items-center gap-1.5 h-[38px] px-4 bg-white border border-red-200 text-red-600 rounded-2xl text-xs font-bold hover:bg-red-50 transition-all cursor-pointer"
              >
                <X size={13} />
                Xóa lọc
              </button>
            </div>
          </div>

          {/* Leaderboard Box */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs space-y-4">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Trophy size={18} className="text-[#C62828] fill-[#C62828]/10" /> Bảng xếp hạng KPI
            </h4>
            <div className="space-y-4">
              {statsEmployeeSummaries.slice(0, 3).map((row, idx) => {
                const colors = [
                  { bg: "bg-yellow-50", text: "text-amber-500", bar: "bg-amber-400", medal: <Medal size={16} className="text-amber-500 fill-amber-500/20" /> },
                  { bg: "bg-gray-50", text: "text-slate-500", bar: "bg-slate-400", medal: <Medal size={16} className="text-slate-500 fill-slate-500/20" /> },
                  { bg: "bg-amber-50/50", text: "text-amber-700", bar: "bg-amber-600", medal: <Medal size={16} className="text-amber-700 fill-amber-700/20" /> }
                ][idx] || { bg: "bg-gray-50", text: "text-gray-400", bar: "bg-gray-300", medal: <Award size={16} className="text-gray-400" /> };

                const maxPoints = statsEmployeeSummaries[0]?.points || 1;
                const pct = Math.max(Math.min((row.points / maxPoints) * 100, 100), 5);

                return (
                  <div key={row.employeeId} className={`p-4 rounded-2xl border border-gray-100 ${colors.bg} space-y-3 relative overflow-hidden`}>
                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-xs border border-gray-100/50">{colors.medal}</span>
                        <div>
                          <h5 className="font-extrabold text-gray-800 text-xs">{row.name}</h5>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">{row.position}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-extrabold ${colors.text}`}>{row.points.toLocaleString("vi-VN")} điểm</span>
                      </div>
                    </div>
                    {/* Progress Bar container */}
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${colors.bar}`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
              {statsEmployeeSummaries.length === 0 && (
                <div className="py-8 text-center text-gray-400 text-xs font-semibold">Không có dữ liệu</div>
              )}
            </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                    <th className="p-3">THỜI GIAN ↓</th>
                    <th className="p-3">NHÂN VIÊN</th>
                    <th className="p-3 text-center">IB ZALO ↕</th>
                    <th className="p-3 text-center">IB FB ↕</th>
                    <th className="p-3 text-center">COMMENT</th>
                    <th className="p-3 text-center">BÀI ĐĂNG</th>
                    <th className="p-3 text-center">K.REP</th>
                    <th className="p-3 text-center">FOLLOW</th>
                    <th className="p-3 text-center">B.GIÁ</th>
                    <th className="p-3 text-center">DEAL ↕</th>
                    <th className="p-3 text-right">DOANH THU ↕</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
                  {statsEmployeeSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-8 text-gray-400 font-medium">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    <>
                      {statsEmployeeSummaries.slice((statsCurrentPage - 1) * statsPageSize, statsCurrentPage * statsPageSize).map((row) => (
                        <tr key={row.employeeId} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-3 font-semibold">
                            {statsTimeRange === "today" ? "Hôm nay" : statsTimeRange === "this-week" ? "Tuần này" : statsTimeRange === "this-month" ? "Tháng này" : "Năm nay"}
                          </td>
                          <td className="p-3 font-extrabold text-gray-800">
                            <div>{row.name}</div>
                            <div className="text-[9px] text-gray-400 font-bold mt-0.5">{row.position}</div>
                          </td>
                          <td className="p-3 text-center font-mono">{row.metrics.zalo}</td>
                          <td className="p-3 text-center font-mono">{row.metrics.fb}</td>
                          <td className="p-3 text-center font-mono">{row.metrics.comment}</td>
                          <td className="p-3 text-center font-mono">{row.metrics.post}</td>
                          <td className="p-3 text-center font-mono">{row.metrics.clientReply}</td>
                          <td className="p-3 text-center font-mono">{row.metrics.followUp}</td>
                          <td className="p-3 text-center font-mono">{row.metrics.quote}</td>
                          <td className="p-3 text-center font-black text-gray-800">{row.metrics.deal}</td>
                          <td className="p-3 text-right font-black text-green-700 font-mono">
                            {row.metrics.revenue.toLocaleString("vi-VN")}đ
                          </td>
                        </tr>
                      ))}
                      {/* Total row */}
                      <tr className="bg-gray-50/80 font-black text-gray-800 border-t border-gray-200">
                        <td className="p-3">Tổng trang này</td>
                        <td className="p-3"></td>
                        <td className="p-3 text-center font-mono">{statsTableTotals.zalo}</td>
                        <td className="p-3 text-center font-mono">{statsTableTotals.fb}</td>
                        <td className="p-3 text-center font-mono">{statsTableTotals.comment}</td>
                        <td className="p-3 text-center font-mono">{statsTableTotals.post}</td>
                        <td className="p-3 text-center font-mono">{statsTableTotals.clientReply}</td>
                        <td className="p-3 text-center font-mono">{statsTableTotals.followUp}</td>
                        <td className="p-3 text-center font-mono">{statsTableTotals.quote}</td>
                        <td className="p-3 text-center text-red-600 font-mono">{statsTableTotals.deal}</td>
                        <td className="p-3 text-right text-green-700 font-mono">
                          {statsTableTotals.revenue.toLocaleString("vi-VN")}đ
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {statsEmployeeSummaries.length > 0 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 flex-wrap gap-4 text-xs font-bold text-gray-500">
                <div className="flex items-center gap-2">
                  <span>Hiển thị</span>
                  <select
                    value={statsPageSize}
                    onChange={(e) => {
                      setStatsPageSize(parseInt(e.target.value));
                      setStatsCurrentPage(1);
                    }}
                    className="border border-gray-200 rounded-xl px-2 py-1 focus:outline-none bg-white text-gray-700 text-xs"
                  >
                    {[10, 20, 50, 100].map(size => (
                      <option key={size} value={size}>{size} dòng</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl p-0.5 shadow-xs">
                  <button
                    disabled={statsCurrentPage === 1}
                    onClick={() => setStatsCurrentPage(p => Math.max(1, p - 1))}
                    className="flex items-center justify-center w-8 h-8 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Trang trước"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-3 text-xs font-black text-gray-700 min-w-[70px] text-center font-mono">
                    {statsCurrentPage} / {Math.ceil(statsEmployeeSummaries.length / statsPageSize) || 1}
                  </span>
                  <button
                    disabled={statsCurrentPage >= Math.ceil(statsEmployeeSummaries.length / statsPageSize)}
                    onClick={() => setStatsCurrentPage(p => p + 1)}
                    className="flex items-center justify-center w-8 h-8 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Trang sau"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB Content: Compare */}
      {activeTab === "compare" && (
        <div className="space-y-6">
          {/* Header Title */}
          <div>
            <h3 className="text-lg font-black text-gray-800">So sánh KPI</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-bold">So sánh kỳ hiện tại với kỳ trước</p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
            {compareMode === "period" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Chế độ so sánh */}
                <CustomSelect
                  label="Chế độ so sánh"
                  value={compareMode}
                  onChange={(val) => setCompareMode(val as any)}
                  options={[
                    { value: "month", label: "So sánh tháng với tháng" },
                    { value: "year", label: "So sánh năm với năm" },
                    { value: "period", label: "So sánh theo chu kỳ (Hôm nay, tuần...)" }
                  ]}
                />

                {/* Chu kỳ */}
                <CustomSelect
                  label="Chu kỳ"
                  value={comparePeriod}
                  onChange={(val) => setComparePeriod(val as any)}
                  options={[
                    { value: "today", label: "Hôm nay vs Hôm qua" },
                    { value: "week", label: "Tuần này vs Tuần trước" },
                    { value: "month", label: "Tháng này vs Tháng trước" },
                    { value: "quarter", label: "Quý này vs Quý trước" },
                    { value: "year", label: "Năm nay vs Năm trước" }
                  ]}
                />

                {/* Nhân viên */}
                <CustomSelect
                  label="Nhân viên"
                  value={compareEmployeeId}
                  onChange={(val) => setCompareEmployeeId(val)}
                  options={[
                    { value: "all", label: "Tất cả" },
                    ...filteredEmployees.map(e => ({ value: e.id, label: e.name }))
                  ]}
                />
              </div>
            ) : compareMode === "year" ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Chế độ so sánh */}
                <CustomSelect
                  label="Chế độ so sánh"
                  value={compareMode}
                  onChange={(val) => setCompareMode(val as any)}
                  options={[
                    { value: "month", label: "So sánh tháng với tháng" },
                    { value: "year", label: "So sánh năm với năm" },
                    { value: "period", label: "So sánh theo chu kỳ (Hôm nay, tuần...)" }
                  ]}
                />

                {/* Năm A */}
                <CustomSelect
                  label="Năm A (So sánh)"
                  value={compYear1}
                  onChange={(val) => setCompYear1(val)}
                  options={[
                    { value: "2026", label: "Năm 2026" },
                    { value: "2025", label: "Năm 2025" },
                    { value: "2024", label: "Năm 2024" },
                    { value: "2023", label: "Năm 2023" }
                  ]}
                />

                {/* Năm B */}
                <CustomSelect
                  label="Năm B (Đối chiếu)"
                  value={compYear2}
                  onChange={(val) => setCompYear2(val)}
                  options={[
                    { value: "2026", label: "Năm 2026" },
                    { value: "2025", label: "Năm 2025" },
                    { value: "2024", label: "Năm 2024" },
                    { value: "2023", label: "Năm 2023" }
                  ]}
                />

                {/* Nhân viên */}
                <CustomSelect
                  label="Nhân viên"
                  value={compareEmployeeId}
                  onChange={(val) => setCompareEmployeeId(val)}
                  options={[
                    { value: "all", label: "Tất cả" },
                    ...filteredEmployees.map(e => ({ value: e.id, label: e.name }))
                  ]}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Chế độ so sánh */}
                <CustomSelect
                  label="Chế độ so sánh"
                  value={compareMode}
                  onChange={(val) => setCompareMode(val as any)}
                  options={[
                    { value: "month", label: "So sánh tháng với tháng" },
                    { value: "year", label: "So sánh năm với năm" },
                    { value: "period", label: "So sánh theo chu kỳ (Hôm nay, tuần...)" }
                  ]}
                />

                {/* Tháng A */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tháng A (So sánh)</label>
                  <div className="relative w-full py-2 px-4 border border-gray-200 rounded-2xl bg-white flex items-center justify-between h-[38px] focus-within:border-[#C62828] shadow-sm">
                    <CustomMonthPicker
                      value={compMonth1}
                      onChange={(val) => setCompMonth1(val)}
                    />
                  </div>
                </div>

                {/* Tháng B */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tháng B (Đối chiếu)</label>
                  <div className="relative w-full py-2 px-4 border border-gray-200 rounded-2xl bg-white flex items-center justify-between h-[38px] focus-within:border-[#C62828] shadow-sm">
                    <CustomMonthPicker
                      value={compMonth2}
                      onChange={(val) => setCompMonth2(val)}
                    />
                  </div>
                </div>

                {/* Nhân viên */}
                <CustomSelect
                  label="Nhân viên"
                  value={compareEmployeeId}
                  onChange={(val) => setCompareEmployeeId(val)}
                  options={[
                    { value: "all", label: "Tất cả" },
                    ...filteredEmployees.map(e => ({ value: e.id, label: e.name }))
                  ]}
                />
              </div>
            )}
          </div>

          {/* Metrics comparison widgets grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { key: "zalo", label: "IB Zalo" },
              { key: "fb", label: "IB Facebook" },
              { key: "comment", label: "Comment" },
              { key: "post", label: "Bài đăng" },
              { key: "clientReply", label: "Khách rep" },
              { key: "khachChuDongIB", label: "KH chủ động" },
              { key: "followUp", label: "Follow-up" },
              { key: "quote", label: "Báo giá" },
              { key: "deal", label: "Chốt Deal" },
              { key: "revenue", label: "Doanh thu" }
            ].map(({ key, label }) => {
              const val1 = comparisonData.t1.totals[key as keyof KpiMetrics];
              const val2 = comparisonData.t2.totals[key as keyof KpiMetrics];
              const diff = val1 - val2;
              const pct = val2 > 0 ? Math.round((diff / val2) * 100) : (diff > 0 ? 100 : 0);

              const isIncreased = diff > 0;
              const isDecreased = diff < 0;

              const borderClass = isIncreased
                ? "border-[#A5D6A7] bg-white"
                : isDecreased
                ? "border-[#EF9A9A] bg-white"
                : "border-gray-100 bg-white";

              const badgeBgClass = isIncreased
                ? "bg-[#E8F5E9] text-[#2E7D32]"
                : isDecreased
                ? "bg-[#FFEBEE] text-[#C62828]"
                : "bg-gray-50 text-gray-500";

              const trendIcon = isIncreased ? "▲" : isDecreased ? "▼" : "•";

              const displayVal1 = formatCompareMetricValue(key, val1);
              const displayVal2 = formatCompareMetricValue(key, val2);
              
              // Absolute difference formatting: prepend + if positive, raw negative if negative
              let displayDiff = "0";
              if (diff > 0) {
                displayDiff = `+${formatCompareMetricValue(key, diff)}`;
              } else if (diff < 0) {
                displayDiff = `-${formatCompareMetricValue(key, Math.abs(diff))}`;
              }

              return (
                <div
                  key={key}
                  className={`p-4 border rounded-2xl flex flex-col justify-between h-[130px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] ${borderClass}`}
                >
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
                  </div>

                  <div className="flex justify-between items-end mt-1 font-bold">
                    <div>
                      <span className="text-[9px] text-gray-400 block leading-none">Hiện tại</span>
                      <span className="text-base font-black text-gray-800 mt-1.5 block leading-none font-mono">{displayVal1}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-400 block leading-none">Trước đó</span>
                      <span className="text-xs text-gray-500 mt-1.5 block leading-none font-mono">{displayVal2}</span>
                    </div>
                  </div>

                  <div className={`flex justify-between items-center px-2 py-1.5 rounded-xl text-[9px] font-black mt-2 ${badgeBgClass}`}>
                    <span className="flex items-center gap-0.5">
                      <span className="text-[7px]">{trendIcon}</span> {Math.abs(pct)}%
                    </span>
                    <span className="font-mono">{displayDiff}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}



      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (!deleteTargetId) return;
          try {
            await api.kpi.deleteTarget(deleteTargetId);
            await loadData();
            showToast("Đã xóa chỉ tiêu KPI thành công!", "success");
          } catch (error) {
            showToast("Lỗi khi xóa chỉ tiêu", "error");
          }
        }}
        title="Xóa chỉ tiêu KPI"
        message="Bạn có chắc chắn muốn xóa chỉ tiêu KPI này? Hành động này không thể hoàn tác."
        type="danger"
        confirmText="Xóa"
        cancelText="Hủy"
      />

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
