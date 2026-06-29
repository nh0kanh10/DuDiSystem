import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Search,
  RefreshCw,
  Power,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Wifi,
  Server,
  Info,
  Building2,
  Edit2,
  X,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomSelect } from "./ui/CustomSelect";

type AllowedIP = {
  id: string;
  ip: string;
  description?: string;
  status: "active" | "inactive";
  orgNodeId?: string;
  createdAt: string;
};

type OrgNode = {
  id: string;
  name: string;
  type: string;
};

function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-100 p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center mt-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>

          <h3 className="font-bold text-gray-800 text-lg mb-2">
            {title || "Xác nhận"}
          </h3>

          <p className="text-sm text-gray-600 px-2 leading-relaxed">
            {message || "Bạn có chắc chắn muốn thực hiện hành động này?"}
          </p>

          <div className="flex gap-3 mt-6 w-full">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors text-gray-600"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-2.5 bg-gradient-to-br from-[#C62828] to-[#E64A19] hover:from-[#B71c1c] hover:to-[#D84315] text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function IPManagement({ selectedBranch = "all" }: { selectedBranch?: string }) {
  const [ips, setIps] = useState<AllowedIP[]>([]);
  const [orgNodes, setOrgNodes] = useState<OrgNode[]>([]);
  const [search, setSearch] = useState("");
  const [selectedOrgNodeId, setSelectedOrgNodeId] = useState<string>("all");
  const [newIp, setNewIp] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newOrgNodeId, setNewOrgNodeId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editIp, setEditIp] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editOrgNodeId, setEditOrgNodeId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [currentIP, setCurrentIP] = useState<string | null>(null);
  const [serverIPs, setServerIPs] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
  }>({ isOpen: false, id: "" });

  const fetchIPs = async () => {
    try {
      setLoading(true);
      const params =
        selectedOrgNodeId !== "all" ? { orgNodeId: selectedOrgNodeId } : undefined;
      const data = (await api.allowedIPs.list(params)) as AllowedIP[];
      setIps(data);
    } catch (err) {
      console.error("Lỗi lấy danh sách IP:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgNodes = async () => {
    try {
      const data = (await api.orgNodes.list()) as OrgNode[];
      setOrgNodes(data.filter((node) => node.type === "branch"));
    } catch (err) {
      console.error("Lỗi lấy danh sách chi nhánh:", err);
    }
  };

  const fetchCurrentIP = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      setCurrentIP(data.ip);
    } catch (err) {
      console.error("Lỗi lấy IP hiện tại:", err);
    }
  };

  const fetchServerIPs = async () => {
    try {
      const BASE = "http://localhost:3001/api";
      const res = await fetch(`${BASE.replace("/api", "")}/server-ip`);
      const result = await res.json();
      if (result.success) {
        setServerIPs(result.data.ips);
      }
    } catch (err) {
      console.error("Lỗi lấy IP server:", err);
    }
  };

  useEffect(() => {
    fetchIPs();
    fetchOrgNodes();
    fetchCurrentIP();
    fetchServerIPs();
  }, [selectedOrgNodeId]);

  useEffect(() => {
    setSelectedOrgNodeId(selectedBranch);
    if (selectedBranch !== "all") {
      setNewOrgNodeId(selectedBranch);
    } else {
      setNewOrgNodeId("");
    }
  }, [selectedBranch]);

  const isValidIP = (ip: string) => {
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip.trim());
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUseUserIP = () => {
    if (currentIP) {
      setNewIp(currentIP);
      setNewDescription("IP tự động");
    }
  };

  const handleAdd = async () => {
    if (!newIp.trim()) {
      showToast("Vui lòng nhập địa chỉ IP", "error");
      return;
    }
    if (!isValidIP(newIp)) {
      showToast("Địa chỉ IP không hợp lệ", "error");
      return;
    }
    try {
      await api.allowedIPs.create({
        ip: newIp.trim(),
        description: newDescription.trim(),
        orgNodeId: newOrgNodeId || undefined,
      });
      setNewIp("");
      setNewDescription("");
      setNewOrgNodeId(selectedBranch !== "all" ? selectedBranch : "");
      await fetchIPs();
      showToast("Thêm IP thành công!", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.allowedIPs.toggle(id);
      await fetchIPs();
      showToast("Cập nhật trạng thái IP thành công!", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    try {
      await api.allowedIPs.delete(deleteConfirm.id);
      await fetchIPs();
      showToast("Xóa IP thành công!", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  };

  const handleStartEdit = (ip: AllowedIP) => {
    setEditingId(ip.id);
    setEditIp(ip.ip);
    setEditDescription(ip.description || "");
    setEditOrgNodeId(ip.orgNodeId || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditIp("");
    setEditDescription("");
    setEditOrgNodeId("");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!editIp.trim()) {
      showToast("Vui lòng nhập địa chỉ IP", "error");
      return;
    }
    if (!isValidIP(editIp)) {
      showToast("Địa chỉ IP không hợp lệ", "error");
      return;
    }
    try {
      await api.allowedIPs.update(editingId, {
        ip: editIp.trim(),
        description: editDescription.trim(),
        orgNodeId: editOrgNodeId || undefined,
      });
      handleCancelEdit();
      await fetchIPs();
      showToast("Cập nhật IP thành công!", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  };

  const filteredIps = ips.filter(
    (ip) =>
      ip.ip.toLowerCase().includes(search.toLowerCase()) ||
      (ip.description &&
        ip.description.toLowerCase().includes(search.toLowerCase()))
  );

  const getOrgNodeName = (id?: string) => {
    if (!id) return "Tất cả chi nhánh";
    const node = orgNodes.find((n) => n.id === id);
    return node?.name || id;
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px] p-5 rounded-2xl text-white flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div className="flex items-center">
          <div className="flex gap-1.5 items-center mr-4 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white/30 animate-pulse"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white/60 animate-pulse delay-75"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse delay-150"></span>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Quản lý IP cho phép</h2>
            <p className="text-xs text-white/80 mt-1">Cấu hình các địa chỉ IP được phép chấm công theo chi nhánh</p>
          </div>
        </div>
        <div className="text-xs text-white/80 font-bold bg-white/10 px-4 py-2 rounded-xl backdrop-blur-xs border border-white/10 hidden sm:block">
          {new Date().toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-gradient-to-br from-[#C62828] to-[#E64A19] rounded-xl flex items-center justify-center">
            <Plus size={18} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Thêm IP mới</h3>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <Info size={20} />
          </button>
        </div>

        {showHelp && (
          <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
              <Info size={16} />
              Cách lấy IP nội bộ của bạn (wifi/ethernet):
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>
                • <strong>Windows:</strong> Mở cmd, gõ{" "}
                <code className="bg-white px-2 py-0.5 rounded border border-blue-200">
                  ipconfig
                </code>
                , tìm IPv4 Address
              </li>
              <li>
                • <strong>Mac/Linux:</strong> Mở Terminal, gõ{" "}
                <code className="bg-white px-2 py-0.5 rounded border border-blue-200">
                  ifconfig
                </code>{" "}
                hoặc{" "}
                <code className="bg-white px-2 py-0.5 rounded border border-blue-200">
                  ip a
                </code>
              </li>
              <li>
                • Hoặc bạn có thể dùng nút "IP của bạn" để lấy IP công cộng
              </li>
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-semibold text-gray-700">Địa chỉ IP</label>
              {currentIP && (
                <button
                  type="button"
                  onClick={handleUseUserIP}
                  className="px-2 py-1 text-xs font-bold text-[#C62828] bg-[#C62828]/10 rounded-lg hover:bg-[#C62828]/20 transition-all flex items-center gap-1"
                >
                  <Wifi size={12} />
                  IP của bạn: {currentIP}
                </button>
              )}
              {serverIPs.map((ip) => (
                <button
                  key={ip}
                  type="button"
                  onClick={() => {
                    setNewIp(ip);
                    setNewDescription("Server IP");
                  }}
                  className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-all flex items-center gap-1"
                >
                  <Server size={12} />
                  {ip}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder="Nhập IP (ví dụ: 192.168.1.100)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/10 transition-all"
            />
          </div>

          <div className="md:col-span-3">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-semibold text-gray-700">Chi nhánh</label>
            </div>
            <CustomSelect
              value={newOrgNodeId}
              onChange={setNewOrgNodeId}
              disabled={selectedBranch !== "all"}
              heightClass="h-[46px]"
              options={[
                ...(selectedBranch === "all" ? [{ value: "", label: "Chọn chi nhánh" }] : []),
                ...orgNodes.map((node: any) => ({ value: node.id, label: node.name }))
              ]}
            />
          </div>

          <div className="md:col-span-3">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-semibold text-gray-700">
                Mô tả (tùy chọn)
              </label>
            </div>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Mô tả cho IP này (ví dụ: Văn phòng tầng 2)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/10 transition-all"
            />
          </div>

          <div className="md:col-span-3 flex gap-2">
            <button
              onClick={() => {
                setNewIp("");
                setNewDescription("");
                setNewOrgNodeId("");
              }}
              className="px-4 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 hover:shadow-md transition-all flex items-center justify-center"
              title="Làm mới form"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 px-4 py-3 bg-gradient-to-br from-[#C62828] to-[#E64A19] text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Plus size={18} />
              Thêm IP
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-800">Danh sách IP cho phép</h3>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                {filteredIps.length} IP
              </span>
            </div>
            {selectedBranch === "all" && (
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-indigo-500" />
                <CustomSelect
                  value={selectedOrgNodeId}
                  onChange={setSelectedOrgNodeId}
                  heightClass="h-[38px]"
                  className="min-w-[200px]"
                  options={[
                    { value: "all", label: "Tất cả chi nhánh" },
                    ...orgNodes.map((node: any) => ({ value: node.id, label: node.name }))
                  ]}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm IP hoặc mô tả..."
                className="pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/10 transition-all w-72"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={fetchIPs}
              className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
              title="Làm mới danh sách"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="bg-gray-50/50 px-5 py-3.5 grid grid-cols-12 gap-4 text-xs font-bold text-gray-600 border-b border-gray-100 uppercase tracking-wider">
          <div className="col-span-3">Địa chỉ IP</div>
          <div className="col-span-3">Mô tả</div>
          <div className="col-span-2">Chi nhánh</div>
          <div className="col-span-2">Trạng thái</div>
          <div className="col-span-2 text-right">Hành động</div>
        </div>

        <div className="divide-y divide-gray-50">
          {filteredIps.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Không tìm thấy IP nào</p>
              <p className="text-sm text-gray-500 mt-1">
                Hãy thử tìm kiếm với từ khóa khác hoặc thêm IP mới
              </p>
            </div>
          ) : (
            filteredIps.map((ip) => (
              <div
                key={ip.id}
                className="px-5 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors group"
              >
                {editingId === ip.id ? (
                  <>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={editIp}
                        onChange={(e) => setEditIp(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/10 transition-all"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/10 transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={editOrgNodeId}
                        onChange={(e) => setEditOrgNodeId(e.target.value)}
                        disabled={selectedBranch !== "all"}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/10 transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {selectedBranch === "all" && <option value="">Chọn chi nhánh</option>}
                        {orgNodes.map((node) => (
                          <option key={node.id} value={node.id}>
                            {node.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      {ip.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                          <CheckCircle2 size={14} />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-bold rounded-full border border-gray-200">
                          <AlertCircle size={14} />
                          Tạm dừng
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all"
                        title="Lưu"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-all"
                        title="Hủy"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            ip.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Wifi size={18} />
                        </div>
                        <span className="font-semibold text-gray-800 font-mono">
                          {ip.ip}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <span className="text-gray-700">{ip.description || "—"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-200">
                        <Building2 size={14} />
                        {getOrgNodeName(ip.orgNodeId)}
                      </span>
                    </div>
                    <div className="col-span-2">
                      {ip.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                          <CheckCircle2 size={14} />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-bold rounded-full border border-gray-200">
                          <AlertCircle size={14} />
                          Tạm dừng
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleStartEdit(ip)}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-all"
                        title="Sửa IP"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleToggle(ip.id)}
                        className={`p-2 rounded-lg transition-all hover:bg-gray-100 ${
                          ip.status === "active"
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={ip.status === "active" ? "Tạm dừng IP" : "Kích hoạt IP"}
                      >
                        <Power size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(ip.id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                        title="Xóa IP"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={confirmDelete}
        title="Xác nhận xóa IP"
        message="Bạn có chắc chắn muốn xóa IP này khỏi danh sách?"
      />

      {toast && createPortal(
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-xl shadow-lg border transition-all duration-300 ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={20} className="text-emerald-600" />
          ) : (
            <AlertCircle size={20} className="text-red-600" />
          )}
          <span className="font-semibold">{toast.message}</span>
        </div>,
        document.body
      )}
    </div>
  );
}
