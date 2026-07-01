import React, { useMemo, useState } from "react"
import { Calendar, Check, Clock, Loader2, Send, X } from "lucide-react"
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
  LEAVE_SESSION,
  buildCreatePayload,
  createLeaveForm,
  expandRequestToSlots,
  formatRequestTimeSummary,
  getScopeSessionLabel,
  leaveTypesForEmployee,
  scopesForEmployee,
  validateLeaveForm,
  type LeaveCategory,
  type LeaveFormState,
  type LeaveRequestRecord,
  type LeaveScope,
  type LeaveSession,
  type LeaveType,
} from "./leaveRequestModel"

interface Props {
  employee: Employee
  variant?: "default" | "portal"
}

const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/50 bg-white"
const portalInputClass = "w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#E8231A]/50 bg-white/5 border border-white/10 text-[#FFE8EC] placeholder:text-white/25"

export default function LeaveRequestPanel({ employee, variant = "default" }: Props) {
  const portal = variant === "portal"
  const [tab, setTab] = useState<"register" | "history">("register")
  const [form, setForm] = useState<LeaveFormState>(() => createLeaveForm(employee))
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const { requests, loading, error, submit, cancel, reload } = useLeaveRequests(employee.id)
  const intern = isInternEmployee(employee)
  const kind = intern ? EMPLOYEE_KIND.intern : EMPLOYEE_KIND.staff
  const scopes = scopesForEmployee(employee)

  const blockedSlots = useMemo(() => {
    const slots: { date: string; session: LeaveSession }[] = []
    for (const r of requests) {
      if (r.status === "rejected" || r.status === "cancelled") continue
      for (const s of expandRequestToSlots(r)) {
        slots.push({ date: `${String(s.date.getDate()).padStart(2, "0")}/${String(s.date.getMonth() + 1).padStart(2, "0")}/${s.date.getFullYear()}`, session: s.session })
      }
    }
    return slots
  }, [requests])

  const leaveTypeOptions = useMemo(() => {
    return leaveTypesForEmployee(employee, form.category).map(t => ({
      value: t,
      label: LEAVE_TYPE[t].label,
    }))
  }, [employee, form.category])

  const patch = (p: Partial<LeaveFormState>) => {
    setForm(f => ({ ...f, ...p }))
    setFormError(null)
  }

  const handleCategoryChange = (category: LeaveCategory) => {
    const types = leaveTypesForEmployee(employee, category)
    patch({ category, leaveType: types[0] })
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
    setSubmitting(true)
    setFormError(null)
    try {
      await submit(buildCreatePayload(employee.id, form))
      setForm(createLeaveForm(employee))
      setSuccessMsg("Đã gửi đơn xin nghỉ — chờ quản lý duyệt tại mục Duyệt đơn")
      setTab("history")
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Gửi đơn thất bại")
    } finally {
      setSubmitting(false)
    }
  }

  const fieldInput = portal ? portalInputClass : inputClass
  const labelCls = portal ? "block text-xs font-bold text-white/40 uppercase mb-1.5 tracking-wide" : "block text-xs font-bold text-gray-500 uppercase mb-1.5"
  const scopeBtn = (active: boolean) => portal
    ? `py-3 px-2 rounded-xl text-sm font-bold border transition-all ${active ? "bg-[#E8231A] text-white border-[#E8231A] shadow-sm" : "bg-white/5 text-white/65 border-white/10 hover:border-[#E8231A]/40"}`
    : `py-3 px-2 rounded-xl text-sm font-bold border transition-all ${active ? "bg-[#C62828] text-white border-[#C62828] shadow-sm" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#C62828]/30"}`
  const sessionBtn = (active: boolean) => portal
    ? `py-2.5 rounded-xl text-sm font-bold border ${active ? "bg-[#E8231A] text-white border-[#E8231A]" : "bg-white/5 border-white/10 text-white/65"}`
    : `py-2.5 rounded-xl text-sm font-bold border ${active ? "bg-[#C62828] text-white border-[#C62828]" : "bg-gray-50 border-gray-200 text-gray-600"}`
  const cardCls = portal
    ? "bg-white/[0.04] rounded-2xl border border-white/[0.08] overflow-hidden"
    : "bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden"
  const cardHeadCls = portal ? "p-5 border-b border-white/[0.06] space-y-4" : "p-5 border-b border-gray-100 space-y-4"

  return (
    <div className={`space-y-5 ${portal ? "" : "max-w-5xl mx-auto"}`}>
      <div className={`flex items-center justify-between gap-4 flex-wrap ${portal ? "flex-col items-stretch" : ""}`}>
        {portal ? (
          <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            {(["register", "history"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  color: tab === t ? "#FFE8EC" : "rgba(255,232,236,0.4)",
                  borderBottom: tab === t ? "2px solid #E8231A" : "2px solid transparent",
                  transition: "all 0.2s",
                }}
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
                onClick={() => setTab(t)}
                className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${tab === t ? "bg-white shadow text-[#C62828]" : "text-gray-500 hover:text-gray-800"}`}
              >
                {t === "register" ? "Tạo đơn xin nghỉ" : "Lịch sử đơn"}
              </button>
            ))}
          </div>
        )}
        <div className={`flex items-center gap-2 ${portal ? "px-1" : ""}`}>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${kind.badgeClass}`}>{kind.badge}</span>
          <span className={`text-sm font-bold ${portal ? "text-[#FFE8EC]" : "text-gray-700"}`}>{employee.name}</span>
          <span className={`text-xs font-mono ${portal ? "text-white/35" : "text-gray-400"}`}>{employee.id}</span>
        </div>
      </div>

      {successMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${portal ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" : "bg-green-50 border border-green-200 text-green-700"}`}>
          <Check size={16} /> {successMsg}
        </div>
      )}

      {tab === "register" && (
        <div className={cardCls}>
          <div className={cardHeadCls}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Loại đơn</label>
                <CustomSelect
                  value={form.category}
                  onChange={v => handleCategoryChange(v as LeaveCategory)}
                  options={[
                    { value: "leave", label: "Nghỉ phép" },
                    { value: "timeoff", label: "Time off bù tăng ca" },
                  ]}
                  className={fieldInput}
                />
              </div>
              <div>
                <label className={labelCls}>Hình thức</label>
                <CustomSelect
                  value={form.leaveType}
                  onChange={v => patch({ leaveType: v as LeaveType })}
                  options={leaveTypeOptions}
                  className={fieldInput}
                />
              </div>
            </div>

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

          <div className="p-5 space-y-4">
            {form.scope === "full_day" && (
              <div>
                <label className={labelCls}>Ngày nghỉ</label>
                <CustomDatePicker value={form.startDate} onChange={v => patch({ startDate: v })} className={fieldInput} />
              </div>
            )}

            {form.scope === "date_range" && (
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
              <LeaveWeekGrid
                selected={form.sessions}
                onChange={sessions => patch({ sessions })}
                blocked={blockedSlots}
                variant={portal ? "portal" : "default"}
              />
            )}

            <div>
              <label className={labelCls}>Lý do</label>
              <textarea
                value={form.reason}
                onChange={e => patch({ reason: e.target.value })}
                rows={3}
                placeholder="Mô tả lý do xin nghỉ..."
                className={`${fieldInput} resize-none`}
              />
            </div>

            {formError && (
              <p className={`text-sm font-semibold ${portal ? "text-red-300" : "text-red-600"}`}>{formError}</p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 shadow-md ${portal ? "bg-gradient-to-r from-[#E8231A] to-[#FF8800] hover:opacity-90" : "bg-[#C62828] hover:bg-[#B71C1C]"}`}
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Gửi duyệt
            </button>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          {loading && (
            <div className={`flex justify-center py-10 ${portal ? "text-white/40" : "text-gray-400"}`}>
              <Loader2 size={24} className="animate-spin" />
            </div>
          )}
          {error && (
            <div className={`p-4 rounded-xl text-sm ${portal ? "bg-red-500/10 text-red-300 border border-red-500/20" : "bg-red-50 text-red-700"}`}>
              {error}
              <button type="button" onClick={reload} className="ml-2 font-bold underline">Thử lại</button>
            </div>
          )}
          {!loading && requests.length === 0 && (
            <div className={`rounded-2xl p-10 text-center border ${portal ? "bg-white/[0.03] border-white/[0.06] text-white/35" : "bg-white text-gray-400 border-black/5"}`}>
              <Calendar size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Chưa có đơn xin nghỉ</p>
            </div>
          )}
          {requests.map(r => (
            <RequestHistoryCard key={r.id} req={r} onCancel={() => setCancelId(r.id)} portal={portal} />
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

function RequestHistoryCard({ req, onCancel, portal = false }: { req: LeaveRequestRecord; onCancel: () => void; portal?: boolean }) {
  const st = LEAVE_STATUS[req.status]
  const StatusIcon = req.status === "approved" ? Check : req.status === "pending" ? Clock : X
  return (
    <div className={`rounded-2xl p-5 border ${portal ? "bg-white/[0.04] border-white/[0.08]" : "bg-white border-black/5 shadow-sm"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`font-bold text-sm ${portal ? "text-[#FFE8EC]" : "text-gray-800"}`}>{LEAVE_TYPE[req.leaveType]?.label ?? req.leaveType}</span>
            <span className={`text-[10px] font-bold font-mono ${portal ? "text-white/30" : "text-gray-400"}`}>{req.id}</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${st.bg} ${st.color}`}>
              <StatusIcon size={11} /> {st.label}
            </span>
          </div>
          <p className={`text-xs mb-2 ${portal ? "text-white/45" : "text-gray-500"}`}>
            <span className="font-semibold">{getScopeSessionLabel(req)}</span>
            <span className="mx-1.5">·</span>
            {formatRequestTimeSummary(req)}
          </p>
          <p className={`text-xs ${portal ? "text-white/55" : "text-gray-600"}`}>{req.reason}</p>
          <p className={`text-[10px] mt-2 ${portal ? "text-white/25" : "text-gray-400"}`}>Gửi lúc {req.submittedAt}</p>
        </div>
        {req.status === "pending" && (
          <button
            type="button"
            onClick={onCancel}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg ${portal ? "text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20" : "text-red-600 bg-red-50 border border-red-100 hover:bg-red-100"}`}
          >
            Hủy
          </button>
        )}
      </div>
    </div>
  )
}
