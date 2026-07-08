import React, { useState, useEffect, useRef } from "react"
import { Settings, Clock, ShieldAlert, Check, RefreshCw, Users, Layers, X, Edit, Lock, User, Save, Building } from "lucide-react"
import { createPortal } from "react-dom"
import { api } from "@/lib/api"

import { CustomTimePicker } from "../ui/CustomTimePicker"

export function SystemConfigPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [config, setConfig] = useState({
    companyName: "DuDi System",
    morningStart: "09:00",
    morningEnd: "12:00",
    afternoonStart: "13:30",
    afternoonEnd: "17:00",
    lateGraceMinutes: 15,
    earlyGraceMinutes: 15,
    requireIP: false,
    internshipMonths: 2,
    projectDeadlineWarningDays: 7,
    sessionTimeoutMinutes: 30,
    employeeStart: "09:00",
    employeeEnd: "17:00",
  })

  const [activeDrawer, setActiveDrawer] = useState<"admin" | null>(null)
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null)
  const [editLoginId, setEditLoginId] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingAdmin, setIsSavingAdmin] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const loadAdminUsers = async () => {
    setIsLoadingAdmins(true)
    try {
      const res = await api.users.list({ includeCoreAdmins: true })
      const admins = (res || []).filter((u: any) => ["0000000000", "1111111111", "2222222222"].includes(u.email))
      setAdminUsers(admins)
    } catch (err) {
      console.error("Lỗi lấy danh sách admin:", err)
    } finally {
      setIsLoadingAdmins(false)
    }
  }

  const handleOpenAdminManagement = () => {
    setActiveDrawer("admin")
    loadAdminUsers()
  }

  const handleStartEditAdmin = (admin: any) => {
    setEditingAdmin(admin)
    setEditLoginId(admin.email || "")
    setEditPassword("")
    setEditError(null)
  }

  const handleSaveAdmin = async () => {
    if (!editPassword.trim()) {
      setEditError("Mật khẩu mới không được để trống")
      return
    }
    setIsSavingAdmin(true)
    setEditError(null)
    try {
      await api.users.updateAdmin(editingAdmin.id, {
        newPassword: editPassword
      })
      setToastMessage("Cập nhật mật khẩu tài khoản quản trị thành công!")
      setEditingAdmin(null)
      loadAdminUsers()
      window.dispatchEvent(new CustomEvent("dudi_permissions_updated"))
      setTimeout(() => setToastMessage(null), 3000)
    } catch (err: any) {
      setEditError(err.message || "Đã xảy ra lỗi khi cập nhật")
    } finally {
      setIsSavingAdmin(false)
    }
  }

  useEffect(() => {
    async function loadConfig() {
      setLoading(true)
      try {
        const res = await api.systemConfig.get()
        if (res) {
          setConfig({
            companyName: res.companyName || "DuDi System",
            morningStart: res.morningStart || "09:00",
            morningEnd: res.morningEnd || "12:00",
            afternoonStart: res.afternoonStart || "13:30",
            afternoonEnd: res.afternoonEnd || "17:00",
            lateGraceMinutes: Number(res.lateGraceMinutes ?? 15),
            earlyGraceMinutes: Number(res.earlyGraceMinutes ?? 15),
            requireIP: !!res.requireIP,
            internshipMonths: Number(res.internshipMonths ?? 2),
            projectDeadlineWarningDays: Number(res.projectDeadlineWarningDays ?? 7),
            sessionTimeoutMinutes: Number(res.sessionTimeoutMinutes ?? 30),
            employeeStart: res.employeeStart || "09:00",
            employeeEnd: res.employeeEnd || "17:00",
          })
        }
      } catch (err) {
        console.error("Lỗi tải cấu hình hệ thống:", err)
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    try {
      await api.systemConfig.update(config)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      alert("Lỗi khi lưu cấu hình: " + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400 text-sm font-medium flex flex-col items-center justify-center gap-2 bg-white rounded-3xl border border-black/5">
        <RefreshCw size={24} className="animate-spin text-gray-300" />
        Đang tải cấu hình hệ thống...
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px] p-5 rounded-2xl text-white flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div className="flex items-center">
          <div className="flex gap-1.5 items-center mr-4 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white/30 animate-pulse"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white/60 animate-pulse delay-75"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse delay-150"></span>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Tiện ích hệ thống</h2>
            <p className="text-xs text-white/80 mt-1">Quản lý và điều chỉnh các thiết lập dùng chung trên toàn hệ thống.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-black/5 shadow-sm">
          <div className="bg-[#C62828] text-white px-6 py-4 flex items-center gap-2">
            <Settings size={18} />
            <h3 className="font-black text-sm text-white">Cấu hình hệ thống</h3>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6 bg-gray-50/30">
            
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="bg-gray-50 px-5 py-3.5 border-b border-gray-200 flex items-center gap-2 rounded-t-2xl">
                <Building size={15} className="text-[#C62828]" />
                <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">Thông tin chung & Chấm công</h4>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tên tổ chức / Công ty</label>
                  <input
                    type="text"
                    value={config.companyName}
                    onChange={e => setConfig({ ...config, companyName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#C62828]/45 focus:ring-2 focus:ring-[#C62828]/10 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Yêu cầu mạng IP văn phòng</label>
                  <div className="flex items-center h-10">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.requireIP}
                        onChange={e => setConfig({ ...config, requireIP: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      <span className="ml-3 text-sm font-semibold text-gray-600">Bắt buộc check-in theo IP</span>
                    </label>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-dashed border-gray-200">
                  <div className="space-y-4">
                    <h5 className="text-[11px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                      <Clock size={13} /> CA THỰC TẬP SINH (TÍNH THEO BUỔI)
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Sáng: Bắt đầu</label>
                        <CustomTimePicker
                          value={config.morningStart}
                          onChange={val => setConfig({ ...config, morningStart: val })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Sáng: Kết thúc</label>
                        <CustomTimePicker
                          value={config.morningEnd}
                          onChange={val => setConfig({ ...config, morningEnd: val })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Chiều: Bắt đầu</label>
                        <CustomTimePicker
                          value={config.afternoonStart}
                          onChange={val => setConfig({ ...config, afternoonStart: val })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Chiều: Kết thúc</label>
                        <CustomTimePicker
                          value={config.afternoonEnd}
                          onChange={val => setConfig({ ...config, afternoonEnd: val })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[11px] font-black text-[#C62828] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#C62828]/10 pb-2">
                      <Clock size={13} /> CA CHÍNH THỨC (TÍNH THEO NGÀY)
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Giờ bắt đầu làm việc</label>
                        <CustomTimePicker
                          value={config.employeeStart}
                          onChange={val => setConfig({ ...config, employeeStart: val })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Giờ kết thúc ca</label>
                        <CustomTimePicker
                          value={config.employeeEnd}
                          onChange={val => setConfig({ ...config, employeeEnd: val })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Khối 2: Quản lý nhân sự */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="bg-gray-50 px-5 py-3.5 border-b border-gray-200 flex items-center gap-2 rounded-t-2xl">
                <Users size={15} className="text-[#C62828]" />
                <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">Cấu hình quản lý nhân sự</h4>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Thời gian thực tập mặc định (Tháng)</label>
                  <input
                    type="number"
                    value={config.internshipMonths || 2}
                    onChange={e => setConfig({ ...config, internshipMonths: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#C62828]/45 transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Khối 3: Bảo mật & Phiên làm việc */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="bg-gray-50 px-5 py-3.5 border-b border-gray-200 flex items-center gap-2 rounded-t-2xl">
                <ShieldAlert size={15} className="text-[#C62828]" />
                <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">Bảo mật & Phiên làm việc</h4>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Thời gian tự động đăng xuất do không hoạt động (Phút)</label>
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={config.sessionTimeoutMinutes || 30}
                    onChange={e => setConfig({ ...config, sessionTimeoutMinutes: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#C62828]/45 transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Khối 4: Quản lý dự án */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="bg-gray-50 px-5 py-3.5 border-b border-gray-200 flex items-center gap-2 rounded-t-2xl">
                <Layers size={15} className="text-[#C62828]" />
                <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">Quản lý dự án</h4>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Nhắc nhở deadline trước (Ngày)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={config.projectDeadlineWarningDays}
                    onChange={e => setConfig({ ...config, projectDeadlineWarningDays: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#C62828]/45 transition-all"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Hiển thị cảnh báo trong trang Quản lý dự án khi còn ≤ số ngày này đến deadline</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                <ShieldAlert size={14} className="text-gray-300" />
                <span>Các thay đổi sẽ có hiệu lực ngay lập tức.</span>
              </div>
              <div className="flex items-center gap-3">
                {success && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check size={14} /> Đã lưu thành công!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#C62828] hover:bg-[#B71C1C] text-white px-5 py-2.5 rounded-2xl text-xs font-black tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      ĐANG LƯU...
                    </>
                  ) : (
                    "LƯU THIẾT LẬP"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-6">
            <h3 className="font-bold text-gray-700 text-sm mb-1.5">Các tiện ích quản trị khác</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">Các tính năng bổ trợ dành riêng cho quản trị viên và vận hành.</p>

            <div className="space-y-2.5">
              {[
                { label: "Quản lý admin", action: () => handleOpenAdminManagement() },
                { label: "Điều chỉnh chấm công", action: () => {} },
                { label: "BXH gắn bó", action: () => {} },
                { label: "Sinh mã nhân viên", action: () => {} },
              ].map(item => (
                <div
                  key={item.label}
                  onClick={item.action}
                  className="bg-gray-50 rounded-xl p-3 border border-gray-100 cursor-pointer hover:bg-red-50 hover:border-[#C62828]/25 transition-all active:scale-[0.98] flex items-center justify-between group"
                >
                  <p className="text-xs font-bold text-gray-600">{item.label}</p>
                  <span className="text-gray-300 group-hover:text-[#C62828] transition-colors text-xs">›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Drawer Overlay */}
      {activeDrawer && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[9998] transition-opacity duration-300"
            onClick={() => { setActiveDrawer(null); setEditingAdmin(null) }}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-[420px] max-w-full bg-white z-[9999] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">

            {/* Drawer Header */}
            <div className="bg-[#C62828] text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                {activeDrawer === "admin" && <><Lock size={17} /><h3 className="font-bold text-sm">Quản lý tài khoản Quản trị</h3></>}
              </div>
              <button
                onClick={() => { setActiveDrawer(null); setEditingAdmin(null) }}
                className="p-1.5 hover:bg-white/15 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto">

              {/* ── Panel: Quản lý admin ── */}
              {activeDrawer === "admin" && (
                <div className="p-6 space-y-4">
                  <p className="text-xs text-gray-500 leading-relaxed bg-amber-50 border border-amber-100 rounded-xl p-3">
                    ⚠️ Chỉnh sửa mật khẩu của các tài khoản quản trị hệ thống gốc. Mã đăng nhập không thể thay đổi.
                  </p>

                  {isLoadingAdmins ? (
                    <div className="py-14 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
                      <RefreshCw size={22} className="animate-spin text-gray-300" />
                      Đang tải danh sách Admin...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {adminUsers.map((admin: any) => {
                        const isEditing = editingAdmin?.id === admin.id
                        return (
                          <div
                            key={admin.id}
                            className={`border rounded-2xl p-4 transition-all duration-200 ${
                              isEditing
                                ? "border-[#C62828] bg-red-50/10 shadow-sm"
                                : "border-gray-150 hover:border-gray-300 bg-gray-50/40"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center text-[#C62828] font-black text-sm">
                                  {(admin.name || "Q").charAt(0)}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-gray-800">{admin.name || "Quản trị viên"}</h4>
                                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">ID: {admin.email}</p>
                                </div>
                              </div>
                              {!isEditing && (
                                <button
                                  onClick={() => handleStartEditAdmin(admin)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-[#C62828] hover:text-[#C62828] hover:bg-red-50 text-gray-500 rounded-xl text-xs font-bold transition-all"
                                >
                                  <Edit size={12} /> Đổi mật khẩu
                                </button>
                              )}
                            </div>

                            {isEditing && (
                              <div className="mt-4 pt-4 border-t border-dashed border-gray-200 space-y-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mã đăng nhập (chỉ đọc)</label>
                                  <div className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-400 cursor-not-allowed select-none">
                                    {editLoginId}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mật khẩu mới *</label>
                                  <input
                                    type="password"
                                    value={editPassword}
                                    onChange={e => setEditPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu mới..."
                                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/10 transition-all"
                                    autoFocus
                                    autoComplete="new-password"
                                  />
                                </div>
                                {editError && (
                                  <p className="text-[11px] text-red-600 font-bold bg-red-50 px-3 py-2 rounded-xl border border-red-100">{editError}</p>
                                )}
                                <div className="flex gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingAdmin(null)}
                                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isSavingAdmin}
                                    onClick={handleSaveAdmin}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                  >
                                    {isSavingAdmin ? <><RefreshCw size={12} className="animate-spin" />Đang lưu...</> : <><Save size={12} />Lưu mật khẩu</>}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex-shrink-0">
              <button
                onClick={() => { setActiveDrawer(null); setEditingAdmin(null) }}
                className="w-full py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {toastMessage && createPortal(
        <div className="fixed bottom-6 right-6 z-[9999] bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-xs animate-in slide-in-from-bottom-5 duration-300">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>,
        document.body
      )}
    </div>
  )
}
