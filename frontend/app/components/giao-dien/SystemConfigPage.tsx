import React, { useState, useEffect, useRef } from "react"
import { Settings, Clock, ShieldAlert, Check, RefreshCw, Users, Layers } from "lucide-react"
import { api } from "@/lib/api"

function CustomTimePicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [hourStr, minStr] = (value || "00:00").split(":")

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const hourContainer = containerRef.current?.querySelector('.hours-list')
        const selectedHour = hourContainer?.querySelector('.hour-selected')
        if (hourContainer && selectedHour) {
          hourContainer.scrollTop = (selectedHour as HTMLElement).offsetTop - 60
        }

        const minContainer = containerRef.current?.querySelector('.mins-list')
        const selectedMin = minContainer?.querySelector('.min-selected')
        if (minContainer && selectedMin) {
          minContainer.scrollTop = (selectedMin as HTMLElement).offsetTop - 60
        }
      }, 50)
    }
  }, [isOpen])

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl text-sm font-mono font-bold text-gray-800 hover:bg-gray-100 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C62828]/10 focus:border-[#C62828]/45 transition-all text-center"
      >
        <span className="mx-auto">{value}</span>
        <Clock size={15} className="text-gray-400 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-1.5 w-48 bg-white border border-gray-150 rounded-2xl shadow-xl z-50 p-3 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase text-center mb-1.5 pb-1 border-b border-gray-100">Giờ</span>
            <div className="hours-list h-40 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin text-center scroll-smooth pb-8">
              {hours.map(h => {
                const isSelected = h === hourStr
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      onChange(`${h}:${minStr}`)
                    }}
                    className={`hour-selected w-full py-1 text-xs font-mono font-bold rounded-lg transition-colors ${
                      isSelected
                        ? "bg-[#C62828] text-white hour-selected"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {h}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase text-center mb-1.5 pb-1 border-b border-gray-100">Phút</span>
            <div className="mins-list h-40 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin text-center scroll-smooth pb-8">
              {minutes.map(m => {
                const isSelected = m === minStr
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      onChange(`${hourStr}:${m}`)
                    }}
                    className={`min-selected w-full py-1 text-xs font-mono font-bold rounded-lg transition-colors ${
                      isSelected
                        ? "bg-[#C62828] text-white min-selected"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

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
  })

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
        <div className="lg:col-span-2 bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <div className="bg-[#C62828] text-white px-6 py-4 flex items-center gap-2">
            <Settings size={18} />
            <h3 className="font-black text-sm text-white">Cấu hình hệ thống</h3>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tên tổ chức / Công ty</label>
                <input
                  type="text"
                  value={config.companyName}
                  onChange={e => setConfig({ ...config, companyName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-150 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#C62828]/45 focus:ring-2 focus:ring-[#C62828]/10 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Yêu cầu mạng IP văn phòng</label>
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

              <div>
                <h4 className="text-xs font-bold text-[#C62828] uppercase tracking-wider border-b border-gray-100 pb-2 mb-3 col-span-2 flex items-center gap-1.5">
                  <Clock size={14} /> Ca làm việc sáng
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Giờ bắt đầu</label>
                    <CustomTimePicker
                      value={config.morningStart}
                      onChange={val => setConfig({ ...config, morningStart: val })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Giờ nghỉ trưa</label>
                    <CustomTimePicker
                      value={config.morningEnd}
                      onChange={val => setConfig({ ...config, morningEnd: val })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#C62828] uppercase tracking-wider border-b border-gray-100 pb-2 mb-3 col-span-2 flex items-center gap-1.5">
                  <Clock size={14} /> Ca làm việc chiều
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Giờ bắt đầu lại</label>
                    <CustomTimePicker
                      value={config.afternoonStart}
                      onChange={val => setConfig({ ...config, afternoonStart: val })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Giờ kết thúc ca</label>
                    <CustomTimePicker
                      value={config.afternoonEnd}
                      onChange={val => setConfig({ ...config, afternoonEnd: val })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Thời gian đi trễ cho phép (Phút)</label>
                <input
                  type="number"
                  value={config.lateGraceMinutes}
                  onChange={e => setConfig({ ...config, lateGraceMinutes: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-150 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#C62828]/45 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Thời gian về sớm cho phép (Phút)</label>
                <input
                  type="number"
                  value={config.earlyGraceMinutes}
                  onChange={e => setConfig({ ...config, earlyGraceMinutes: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-150 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#C62828]/45 transition-all"
                  required
                />
              </div>
            </div>

            <div className="border-t border-gray-150 pt-5 mt-5">
              <h4 className="text-xs font-bold text-[#C62828] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Users size={14} /> Cấu hình quản lý nhân sự
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Thời gian thực tập mặc định (Tháng)</label>
                  <input
                    type="number"
                    value={config.internshipMonths || 2}
                    onChange={e => setConfig({ ...config, internshipMonths: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-150 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#C62828]/45 transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-150 pt-5 mt-5">
              <h4 className="text-xs font-bold text-[#C62828] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Layers size={14} /> Quản lý dự án
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nhắc nhở deadline trước (Ngày)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={config.projectDeadlineWarningDays}
                    onChange={e => setConfig({ ...config, projectDeadlineWarningDays: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-150 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#C62828]/45 transition-all"
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
              {["Quản lý admin", "Điều chỉnh chấm công", "BXH gắn bó", "Sinh mã nhân viên"].map(item => (
                <div key={item} className="bg-gray-50 rounded-xl p-3 border border-gray-100 cursor-pointer hover:bg-red-50 hover:border-[#C62828]/25 transition-all active:scale-[0.98]">
                  <p className="text-xs font-bold text-gray-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
