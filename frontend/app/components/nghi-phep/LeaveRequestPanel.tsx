import React, { useMemo, useState } from "react"
import type { Employee } from "../../types"
import { CustomSelect } from "../ui/CustomSelect"
import { CustomDatePicker } from "../ui/CustomDatePicker"
import ConfirmModal from "../ui/ConfirmModal"
import { EMPLOYEE_KIND, isInternEmployee } from "../cham-cong/attendanceModel"
import { useLeaveRequests } from "../../hooks/useLeaveRequests"
import LeaveWeekGrid from "./LeaveWeekGrid"
import {
  LEAVE_SCOPE,
  LEAVE_STATUS,
  LEAVE_TYPE,
  LEAVE_SUB_TYPE,
  LEAVE_SESSION,
  buildCreatePayload,
  createLeaveForm,
  expandRequestToSlots,
  formatRequestTimeSummary,
  getScopeSessionLabel,
  leaveTypesForEmployee,
  scopesForEmployee,
  validateLeaveForm,
  expandFormToSlots,
  findSlotConflict,
  isActiveLeaveRequest,
  isRequestExpired,
  getWeekdayDateRange,
  type LeaveCategory,
  type LeaveFormState,
  type LeaveRequestRecord,
  type LeaveScope,
  type LeaveSession,
  type LeaveType,
  type LeaveSubType,
} from "./leaveRequestModel"

interface Props {
  employee: Employee
  variant?: "default" | "portal"
}

const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/50 bg-white"
const portalInputClass = "w-full px-4 py-3 rounded-xl text-base focus:outline-none transition-all dark:bg-white/[0.03] bg-white border border-[#e7c8cc] dark:border-white/10 text-[#241416] dark:text-white placeholder:text-[#8b6b70] dark:placeholder:text-white/50 focus:border-red-500/50 dark:focus:border-red-500/50"

export default function LeaveRequestPanel({ employee, variant = "default" }: Props) {
  const portal = variant === "portal"
  const [tab, setTab] = useState<"register" | "history">("register")
  const [historyFilter, setHistoryFilter] = useState<"active" | "all">("active")
  const [form, setForm] = useState<LeaveFormState>(() => createLeaveForm(employee))
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const { requests, loading, error, submit, cancel, reload, update } = useLeaveRequests(employee.id)

  const handleTabChange = (t: "register" | "history") => {
    if (t === "register") reload()
    setTab(t)
  }
  const intern = isInternEmployee(employee)
  const kind = intern ? EMPLOYEE_KIND.intern : EMPLOYEE_KIND.staff
  const scopes = scopesForEmployee(employee)

  const blockedSlots = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const slots: { date: string; session: LeaveSession }[] = []
    for (const r of requests) {
      // Chỉ chặn slot khi đơn đã được duyệt (approved)
      // Đơn pending không chặn để user có thể tạo đơn mới cho cùng thời gian
      if (r.status !== "approved") continue

      for (const s of expandRequestToSlots(r)) {
        const slotDate = new Date(s.date)
        slotDate.setHours(0, 0, 0, 0)
        if (slotDate >= today) {
          const dateStr = `${String(s.date.getDate()).padStart(2, "0")}/${String(s.date.getMonth() + 1).padStart(2, "0")}/${s.date.getFullYear()}`
          slots.push({ date: dateStr, session: s.session })
        }
      }
    }
    return slots
  }, [requests])



  // Pending slots để hiển thị trong grid (không chặn, chỉ thông tin)
  const pendingSlots = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const slots: { date: string; session: LeaveSession }[] = []
    for (const r of requests) {
      if (r.status !== "pending") continue
      for (const s of expandRequestToSlots(r)) {
        const slotDate = new Date(s.date)
        slotDate.setHours(0, 0, 0, 0)
        if (slotDate >= today) {
          const dateStr = `${String(s.date.getDate()).padStart(2, "0")}/${String(s.date.getMonth() + 1).padStart(2, "0")}/${s.date.getFullYear()}`
          slots.push({ date: dateStr, session: s.session })
        }
      }
    }
    return slots
  }, [requests])

  const displayedRequests = useMemo(() => {
    if (historyFilter === "all") return requests
    return requests.filter(isActiveLeaveRequest)
  }, [requests, historyFilter])

  const leaveTypeOptions = useMemo(() => {
    return leaveTypesForEmployee(employee, form.category).map(t => ({
      value: t,
      label: LEAVE_TYPE[t as LeaveType].label,
    }))
  }, [employee, form.category])

  const leaveSubTypeOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = []
    if (form.leaveType === "sick") {
      opts.push({ value: "sick_cert", label: "Ốm có giấy xác nhận (Hưởng BHXH)" })
      opts.push({ value: "sick_nocert", label: "Ốm tự nghỉ (Không giấy)" })
    } else if (form.leaveType === "special") {
      opts.push({ value: "marriage_self", label: "Kết hôn bản thân (3 ngày)" })
      opts.push({ value: "marriage_child", label: "Con kết hôn (1 ngày)" })
      opts.push({ value: "maternity", label: "Khám thai" })
      opts.push({ value: "paternity", label: "Vợ sinh" })
      opts.push({ value: "bereavement", label: "Tang gia" })
    }
    return opts
  }, [form.leaveType])

  const patch = (p: Partial<LeaveFormState>) => {
    setForm(f => ({ ...f, ...p }))
    setFormError(null)
  }

  const handleLeaveTypeChange = (leaveType: LeaveType) => {
    // Reset sub category correctly based on type
    let leaveSubType: LeaveSubType = "none"
    if (leaveType === "sick") leaveSubType = "sick_cert"
    else if (leaveType === "special") leaveSubType = "marriage_self"
    patch({ leaveType, leaveSubType })
  }

  const handleScopeChange = (scope: LeaveScope) => {
    patch({ scope, sessions: scope === "multi_session" ? form.sessions : [] })
  }

  const handleSubmit = async () => {
    const err = validateLeaveForm(form)
    if (err) {
      setFormError(err)
      return
    }
    const conflict = findSlotConflict(expandFormToSlots(form), requests, editId)
    if (conflict) {
      const sessionLabel = LEAVE_SESSION[conflict.slot.session].short
      setFormError(`Trùng ${conflict.slot.date} buổi ${sessionLabel} với đơn ${conflict.existing.id} (${LEAVE_STATUS[conflict.existing.status].label.toLowerCase()})`)
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      if (editId && update) {
        await update(editId, buildCreatePayload(employee.id, form))
        setSuccessMsg("Đã cập nhật đơn xin nghỉ thành công")
      } else {
        await submit(buildCreatePayload(employee.id, form))
        setSuccessMsg("Đã gửi đơn xin nghỉ — chờ quản lý duyệt tại mục Duyệt đơn")
      }
      setForm(createLeaveForm(employee))
      setEditId(null)
      setTab("history")
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Gửi đơn thất bại")
    } finally {
      setSubmitting(false)
    }
  }

  const fieldInput = portal ? portalInputClass : inputClass
  const labelCls = portal ? "block text-sm font-black text-[#7f5f63] dark:text-white/70 uppercase mb-2 tracking-wide" : "block text-xs font-bold text-gray-500 uppercase mb-1.5"
  const scopeBtn = (active: boolean) => portal
    ? `py-3.5 px-3 rounded-xl text-base font-black border transition-all ${active ? "bg-[#E8231A] text-white border-[#E8231A] shadow-[0_2px_10px_rgba(232,35,26,0.2)]" : "bg-white dark:bg-white/[0.03] text-[#5f4246] dark:text-white/60 border-[#e7c8cc] dark:border-white/10 hover:border-[#E8231A]/50 dark:hover:border-[#E8231A]/50 hover:bg-[#fff8f8] dark:hover:bg-white/[0.06]"}`
    : `py-3 px-2 rounded-xl text-sm font-bold border transition-all ${active ? "bg-[#C62828] text-white border-[#C62828] shadow-sm" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#C62828]/30"}`
  const sessionBtn = (active: boolean) => portal
    ? `py-3 rounded-xl text-base font-black border transition-all ${active ? "bg-[#E8231A] text-white border-[#E8231A] shadow-[0_2px_10px_rgba(232,35,26,0.2)]" : "bg-white dark:bg-white/[0.03] border-[#e7c8cc] dark:border-white/10 text-[#5f4246] dark:text-white/60 hover:bg-[#fff8f8] dark:hover:bg-white/[0.06] hover:border-[#E8231A]/50"}`
    : `py-2.5 rounded-xl text-sm font-bold border ${active ? "bg-[#C62828] text-white border-[#C62828]" : "bg-gray-50 border-gray-200 text-gray-600"}`
  const cardCls = portal
    ? "bg-white dark:bg-transparent rounded-2xl border border-[#efd7da] dark:border-white/10 overflow-hidden shadow-[0_18px_50px_rgba(95,15,22,0.08)] dark:shadow-none"
    : "bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden"
  const cardHeadCls = portal ? "p-6 border-b border-[#efd7da] dark:border-white/10 space-y-5 bg-[#fff8f8] dark:bg-transparent" : "p-5 border-b border-gray-100 space-y-4"

  return (
    <div className={`space-y-5 ${portal ? "" : "max-w-5xl mx-auto"}`}>
      <div className={`flex items-center justify-between gap-4 flex-wrap ${portal ? "flex-col items-stretch" : ""}`}>
        {portal ? (
          <div className="flex items-center border-b border-[#efd7da] dark:border-white/10 w-full">
            {(["register", "history"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => handleTabChange(t)}
                className={`flex-1 py-4 text-base font-black transition-all border-b-2 outline-none ${tab === t ? "text-[#241416] dark:text-white border-[#E8231A]" : "text-[#8b6b70] dark:text-white/60 border-transparent hover:text-gray-900 dark:hover:text-white/80"}`}
              >
                {t === "register" ? "Tạo đơn xin nghỉ" : "Lịch sử đơn"}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {(["register", "history"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => handleTabChange(t)}
                className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${tab === t ? "bg-white shadow text-[#C62828]" : "text-gray-500 hover:text-gray-800"}`}
              >
                {t === "register" ? "Tạo đơn xin nghỉ" : "Lịch sử đơn"}
              </button>
            ))}
          </div>
        )}
        <div className={`flex items-center gap-2 ${portal ? "px-1" : ""}`}>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${kind.badgeClass}`}>{kind.badge}</span>
          <span className={`text-base font-black ${portal ? "text-[#241416] dark:text-white/90" : "text-gray-700"}`}>{employee.name}</span>
          <span className={`text-sm font-mono font-bold ${portal ? "text-[#8b6b70] dark:text-white/60" : "text-gray-400"}`}>{employee.id}</span>
        </div>
      </div>

      {successMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${portal ? "bg-green-50 border border-green-200 text-green-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
          <span>Đã lưu</span>
          <span>{successMsg}</span>
        </div>
      )}

      {tab === "register" && (
        <div className={cardCls}>
          <div className={cardHeadCls}>

            <div>
              <label className={`${labelCls} mb-2`}>Chọn kiểu nghỉ</label>
              <div className={`grid gap-2 ${scopes.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
                {scopes.map(scope => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => handleScopeChange(scope)}
                    className={scopeBtn(form.scope === scope)}
                  >
                    {LEAVE_SCOPE[scope].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Loại đơn</label>
                <CustomSelect
                  value={form.leaveType}
                  onChange={v => handleLeaveTypeChange(v as LeaveType)}
                  options={leaveTypeOptions}
                  className={fieldInput}
                />
              </div>
              {leaveSubTypeOptions.length > 0 && (
                <div>
                  <label className={labelCls}>Hình thức</label>
                  <CustomSelect
                    value={form.leaveSubType}
                    onChange={v => patch({ leaveSubType: v as any })}
                    options={leaveSubTypeOptions}
                    className={fieldInput}
                  />
                </div>
              )}
            </div>

            {form.scope === "full_day" && (
              <div>
                <label className={labelCls}>Ngày nghỉ</label>
                <CustomDatePicker value={form.startDate} onChange={v => patch({ startDate: v })} className={fieldInput} />
              </div>
            )}

            {form.scope === "date_range" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Từ ngày</label>
                    <CustomDatePicker value={form.startDate} onChange={v => patch({ startDate: v })} className={fieldInput} />
                  </div>
                  <div>
                    <label className={labelCls}>Đến ngày</label>
                    <CustomDatePicker value={form.endDate} onChange={v => patch({ endDate: v })} className={fieldInput} />
                  </div>
                </div>
                {form.startDate && form.endDate && (
                  <div className={`px-4 py-3 rounded-xl border flex items-center justify-between ${portal ? "bg-black/5 dark:bg-white/[0.03] border-black/10 dark:border-white/10" : "bg-gray-50 border-gray-200"}`}>
                    <span className={`text-sm font-semibold ${portal ? "text-gray-600 dark:text-gray-300" : "text-gray-600"}`}>Số ngày nghỉ (trừ T7/CN):</span>
                    <span className={`text-sm font-black ${portal ? "text-[#E8231A] dark:text-red-400" : "text-[#C62828]"}`}>{getWeekdayDateRange(form.startDate, form.endDate).length} ngày</span>
                  </div>
                )}
              </div>
            )}

            {form.scope === "half_session" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Ngày nghỉ</label>
                  <CustomDatePicker value={form.startDate} onChange={v => patch({ startDate: v })} className={fieldInput} />
                </div>
                <div>
                  <label className={labelCls}>Buổi</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["sang", "chieu"] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => patch({ session: s })}
                        className={sessionBtn(form.session === s)}
                      >
                        {LEAVE_SESSION[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {form.scope === "multi_session" && (
              <div className="space-y-4">

                <LeaveWeekGrid
                  selected={form.sessions}
                  onChange={sessions => patch({ sessions })}
                  blocked={blockedSlots}
                  pending={pendingSlots}
                  variant={portal ? "portal" : "default"}
                />
              </div>
            )}



            {(LEAVE_SUB_TYPE[form.leaveSubType]?.requireAttachment || form.leaveSubType === "maternity" || form.leaveSubType === "sick_cert") && (
              <div>
                <label className={labelCls}>Tệp đính kèm (Giấy khám bệnh, chứng từ...)</label>
                <div className={`relative flex items-center justify-center w-full min-h-[100px] border-2 border-dashed rounded-xl transition-all p-4 ${portal ? "border-[#e7c8cc] dark:border-white/10 bg-[#fff8f8] dark:bg-white/[0.02] hover:border-[#E8231A] dark:hover:border-[#E8231A]" : "border-gray-300 bg-gray-50 hover:border-[#C62828]"}`}>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={e => patch({ attachment: e.target.files?.[0] || null })}
                  />
                  <div className="text-center pointer-events-none">
                    <p className={`text-sm font-bold ${portal ? "text-[#8b6b70]" : "text-gray-500"}`}>
                      {form.attachment ? form.attachment.name : "Nhấp để tải lên hoặc kéo thả file vào đây"}
                    </p>
                    {!form.attachment && (
                      <p className={`text-xs mt-1 ${portal ? "text-[#b5a1a3]" : "text-gray-400"}`}>
                        PNG, JPG, PDF (Tối đa 5MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className={labelCls}>Lý do</label>
              <textarea
                value={form.reason}
                onChange={e => patch({ reason: e.target.value })}
                rows={3}
                placeholder="Mô tả chi tiết lý do xin nghỉ..."
                className={`${fieldInput} resize-none`}
              />
            </div>

            {formError && (
              <p className={`text-sm font-semibold ${portal ? "text-[#E8231A]" : "text-red-600"}`}>{formError}</p>
            )}

            <div className={`mt-2 flex items-center justify-between flex-wrap gap-4 pt-4 border-t ${portal ? "border-[#efd7da]" : "border-gray-100"}`}>
              <div className="flex flex-col gap-1">
                <span className={`text-xs font-black ${portal ? "text-[#8b6b70] dark:text-white/60" : "text-gray-500"}`}>Người duyệt đơn</span>
                <span className={`text-sm font-extrabold ${portal ? "text-[#241416] dark:text-white/90" : "text-gray-800"}`}>
                  Quản lý trực tiếp & HR Dept
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto flex-row-reverse sm:flex-row">
                {editId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditId(null)
                      setForm(createLeaveForm(employee))
                      setTab("history")
                    }}
                    disabled={submitting}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Hủy sửa
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-black text-white disabled:opacity-50 shadow-[0_4px_14px_rgba(232,35,26,0.3)] transition-colors ${portal ? "bg-[#E8231A] hover:bg-[#B91C1C]" : "bg-[#C62828] hover:bg-[#B71C1C]"}`}
                >
                  {submitting ? "Đang xử lý..." : editId ? "Cập nhật" : "Gửi đơn duyệt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          <div className={`flex items-center justify-between gap-3 flex-wrap ${portal ? "px-1" : ""}`}>
            <div className={`flex gap-1 rounded-xl p-1 ${portal ? "bg-[#fff0f1] border border-[#efd7da]" : "bg-gray-100"}`}>
              {([["active", "Đang hiệu lực"], ["all", "Tất cả"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setHistoryFilter(key)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${historyFilter === key
                    ? portal ? "bg-white text-[#E8231A] shadow-sm" : "bg-white text-[#C62828] shadow-sm"
                    : portal ? "text-[#8b6b70]" : "text-gray-500"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className={`text-xs font-semibold ${portal ? "text-[#8b6b70]" : "text-gray-400"}`}>
              {displayedRequests.length}/{requests.length} đơn
            </span>
          </div>
          {loading && (
            <div className={`flex justify-center py-10 ${portal ? "text-[#7f5f63]" : "text-gray-400"}`}>
              <span className="text-sm font-bold">Đang tải đơn...</span>
            </div>
          )}
          {error && (
            <div className={`p-4 rounded-xl text-base font-semibold ${portal ? "bg-red-50 text-red-700 border border-red-200" : "bg-red-50 text-red-700"}`}>
              {error}
              <button type="button" onClick={reload} className="ml-2 font-bold underline">Thử lại</button>
            </div>
          )}
          {!loading && displayedRequests.length === 0 && (
            <div className={`rounded-2xl p-10 text-center border ${portal ? "bg-white border-[#efd7da] text-[#7f5f63]" : "bg-white text-gray-400 border-black/5"}`}>
              <p className="text-base font-bold">
                {historyFilter === "active" ? "Không có đơn đang chờ hoặc đã duyệt" : "Chưa có đơn xin nghỉ"}
              </p>
              {historyFilter === "active" && requests.length > 0 && (
                <button type="button" onClick={() => setHistoryFilter("all")} className="mt-3 text-sm font-bold text-[#C62828] underline">
                  Xem đơn đã hủy / từ chối ({requests.length - displayedRequests.length})
                </button>
              )}
            </div>
          )}
          {displayedRequests.map(r => (
            <RequestHistoryCard
              key={r.id}
              req={r}
              onCancel={() => setCancelId(r.id)}
              onEdit={() => {
                setEditId(r.id)
                setForm({
                  category: r.category,
                  leaveType: r.leaveType,
                  leaveSubType: r.leaveSubType || "none",
                  scope: r.scope,
                  reason: r.reason,
                  startDate: r.startDate,
                  endDate: r.endDate || "",
                  session: r.session || "sang",
                  sessions: r.sessions || [],
                })
                setTab("register")
              }}
              portal={portal}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={cancelId !== null}
        onClose={() => setCancelId(null)}
        onConfirm={async () => {
          if (cancelId) {
            try {
              await cancel(cancelId)
            } catch (e) {
              setFormError(e instanceof Error ? e.message : "Hủy đơn thất bại")
            }
          }
          setCancelId(null)
        }}
        title="Hủy yêu cầu nghỉ"
        message="Bạn có chắc muốn hủy đơn đang chờ duyệt?"
        confirmText="Hủy đơn"
        cancelText="Quay lại"
        type="danger"
      />
    </div>
  )
}

function RequestHistoryCard({ req, onCancel, onEdit, portal = false }: { req: LeaveRequestRecord; onCancel: () => void; onEdit: () => void; portal?: boolean }) {
  const st = LEAVE_STATUS[req.status]
  const expiredPending = req.status === "pending" && isRequestExpired(req)
  const statusLabel =
    req.status === "approved" ? "Đã duyệt"
      : req.status === "pending" ? (expiredPending ? "Quá hạn · chờ duyệt" : "Chờ duyệt")
        : req.status === "rejected" ? "Từ chối"
          : req.status === "cancelled" ? "Đã hủy"
            : st.label
  const canResubmitHint = req.status === "cancelled" || req.status === "rejected" || expiredPending
  return (
    <div className={`rounded-2xl p-6 border ${portal ? "bg-white border-[#efd7da] shadow-[0_14px_40px_rgba(95,15,22,0.08)]" : "bg-white border-black/5 shadow-sm"} ${canResubmitHint ? "opacity-80" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-3">
            <span className={`font-black text-lg ${portal ? "text-[#241416]" : "text-gray-800"}`}>{LEAVE_TYPE[req.leaveType]?.label ?? req.leaveType}</span>
            <span className={`text-xs font-black font-mono ${portal ? "text-[#8b6b70]" : "text-gray-400"}`}>{req.id}</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-black ${st.bg} ${st.color}`}>
              {statusLabel}
            </span>
          </div>
          <p className={`text-base mb-2 ${portal ? "text-[#6f565a]" : "text-gray-500"}`}>
            <span className="font-semibold">{getScopeSessionLabel(req)}</span>
            <span className="mx-1.5">·</span>
            {formatRequestTimeSummary(req)}
          </p>
          <p className={`text-base leading-6 ${portal ? "text-[#241416]" : "text-gray-600"}`}>{req.reason}</p>
          <p className={`text-sm mt-3 ${portal ? "text-[#8b6b70]" : "text-gray-400"}`}>Gửi lúc {req.submittedAt}</p>
          {canResubmitHint && (
            <p className={`text-xs mt-2 font-semibold ${portal ? "text-[#8b6b70]" : "text-gray-500"}`}>
              Có thể nộp đơn mới cho cùng ngày/buổi — đơn này không chặn lịch đăng ký.
            </p>
          )}
        </div>
        {req.status === "pending" && (
          <div className="flex flex-col gap-2">
            {!expiredPending && (
              <button
                type="button"
                onClick={onEdit}
                className={`flex-shrink-0 px-4 py-2 text-sm font-black rounded-lg ${portal ? "text-[#E8231A] bg-[#fff0f1] border border-[#efd7da] hover:bg-[#ffe1e3]" : "text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100"}`}
              >
                Sửa
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className={`flex-shrink-0 px-4 py-2 text-sm font-black rounded-lg ${portal ? "text-red-700 bg-red-50 border border-red-200 hover:bg-red-100" : "text-red-600 bg-red-50 border border-red-100 hover:bg-red-100"}`}
            >
              Hủy
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
