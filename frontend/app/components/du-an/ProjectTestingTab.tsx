import React, { useState } from "react"
import { Bug, Plus, Edit2, Trash2 } from "lucide-react"
import { Employee, TestSession } from "../../types"
import { Modal, ModalCancelButton, ModalSubmitButton } from "../ui/Modal"
import { CustomCombobox } from "../ui/CustomCombobox"
import { CustomSelect } from "../ui/CustomSelect"
import { CustomDatePicker as DateInput } from "../ui/CustomDatePicker"
import ConfirmModal from "../ui/ConfirmModal"
import {
  ProjectDetailTabShell, ProjectTabEmptyState, ProjectTabSection, tabDashedAddBtn, tabPrimaryBtn,
} from "./ProjectDetailTabShell"
import {
  BUG_HANDLING_STATUS_OPTIONS, TEST_TYPE_OPTIONS, handlingStatusLabel, testTypeLabel,
} from "./projectTaskUtils"

const EMPTY_FORM = {
  version: "",
  testDate: "",
  testerId: "",
  testType: "regression",
  bugsFound: 0,
  bugsPassed: 0,
  bugsRejected: 0,
  bugsReviewing: 0,
  bugsBillable: 0,
  confirmedById: "",
  confirmedAt: "",
  handlingStatus: "pending",
}

function empName(employees: Employee[], id?: string) {
  return employees.find(e => e.id === id)?.name ?? "—"
}

export function ProjectTestingTab({
  projectId,
  sessions,
  employees,
  onAdd,
  onEdit,
  onDelete,
}: {
  projectId: string
  sessions: TestSession[]
  employees: Employee[]
  onAdd: (data: Omit<TestSession, "id" | "createdAt" | "updatedAt">) => void
  onEdit: (id: string, session: Partial<TestSession>) => void
  onDelete: (id: string) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<TestSession | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const totals = sessions.reduce(
    (acc, s) => ({
      found: acc.found + (s.bugsFound || 0),
      passed: acc.passed + (s.bugsPassed || 0),
      rejected: acc.rejected + (s.bugsRejected || 0),
      billable: acc.billable + (s.bugsBillable || 0),
    }),
    { found: 0, passed: 0, rejected: 0, billable: 0 },
  )

  function openCreate() {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM })
    setShowForm(true)
  }

  function openEdit(session: TestSession) {
    setEditTarget(session)
    setForm({
      version: session.version,
      testDate: session.testDate,
      testerId: session.testerId || "",
      testType: session.testType,
      bugsFound: session.bugsFound,
      bugsPassed: session.bugsPassed,
      bugsRejected: session.bugsRejected,
      bugsReviewing: session.bugsReviewing,
      bugsBillable: session.bugsBillable,
      confirmedById: session.confirmedById || "",
      confirmedAt: session.confirmedAt || "",
      handlingStatus: session.handlingStatus,
    })
    setShowForm(true)
  }

  function handleSave() {
    if (!form.version.trim() || !form.testDate) return
    const now = new Date().toISOString()
    const tester = employees.find(e => e.id === form.testerId)
    const confirmer = employees.find(e => e.id === form.confirmedById)
    const payload = {
      version: form.version.trim(),
      testDate: form.testDate,
      testerId: form.testerId || undefined,
      testerName: tester?.name,
      testType: form.testType,
      bugsFound: Number(form.bugsFound) || 0,
      bugsPassed: Number(form.bugsPassed) || 0,
      bugsRejected: Number(form.bugsRejected) || 0,
      bugsReviewing: Number(form.bugsReviewing) || 0,
      bugsBillable: Number(form.bugsBillable) || 0,
      confirmedById: form.confirmedById || undefined,
      confirmedByName: confirmer?.name,
      confirmedAt: form.confirmedAt || undefined,
      handlingStatus: form.handlingStatus,
      projectId: editTarget?.projectId || "",
    }
    if (editTarget) {
      onEdit(editTarget.id, { ...payload, updatedAt: now })
    } else {
      onAdd({
        ...payload,
        projectId,
      })
    }
    setShowForm(false)
  }

  const thCls = "px-3 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50/90"
  const tdCls = "px-3 py-3 text-xs text-gray-700 border-t border-gray-100 align-top text-center"
  const tdTextCls = "px-3 py-3 text-xs text-gray-700 border-t border-gray-100 align-top"

  return (
    <ProjectDetailTabShell
      icon={Bug}
      title="Testing & Báo cáo kiểm thử"
      description="Theo dõi phiên test theo phiên bản, người test và thống kê bug"
      action={
        sessions.length > 0 ? (
          <button type="button" onClick={openCreate} className={tabPrimaryBtn}>
            <Plus size={14} /> Thêm phiên test
          </button>
        ) : undefined
      }
      stats={sessions.length > 0 ? [
        { label: "Phiên test", value: sessions.length },
        { label: "Bug phát hiện", value: totals.found, cls: "text-red-600" },
        { label: "Bug thông qua", value: totals.passed, cls: "text-emerald-600" },
        { label: "Bug tính tiền", value: totals.billable, cls: "text-amber-600" },
      ] : undefined}
    >
      {sessions.length === 0 ? (
        <ProjectTabEmptyState
          icon={Bug}
          title="Chưa có phiên test"
          description="Ghi nhận kết quả kiểm thử theo phiên bản với đầy đủ thống kê bug"
          action={
            <button type="button" onClick={openCreate} className={tabDashedAddBtn}>
              <Plus size={15} /> Thêm phiên test đầu tiên
            </button>
          }
        />
      ) : (
        <ProjectTabSection>
          <div className="overflow-x-auto -mx-1 rounded-xl border border-gray-100">
            <table className="w-full min-w-[1200px] text-sm">
              <thead>
                <tr>
                  <th className={`${thCls} w-10`}>STT</th>
                  <th className={thCls}>Phiên bản</th>
                  <th className={thCls}>Ngày test</th>
                  <th className={thCls}>Người test</th>
                  <th className={thCls}>Loại test</th>
                  <th className={thCls}>Bug phát hiện</th>
                  <th className={thCls}>Bug thông qua</th>
                  <th className={thCls}>Bug bị từ chối</th>
                  <th className={thCls}>Bug kiểm tra</th>
                  <th className={thCls}>Bug tính tiền</th>
                  <th className={thCls}>Người xác nhận</th>
                  <th className={thCls}>Ngày xác nhận</th>
                  <th className={thCls}>Tình trạng xử lý bug</th>
                  <th className={`${thCls} w-16`} />
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className={`${tdCls} text-gray-400 font-mono`}>{idx + 1}</td>
                    <td className={`${tdTextCls} font-bold text-gray-800 whitespace-nowrap`}>{s.version}</td>
                    <td className={`${tdTextCls} whitespace-nowrap`}>{s.testDate}</td>
                    <td className={`${tdTextCls} whitespace-nowrap`}>{s.testerName || empName(employees, s.testerId)}</td>
                    <td className={tdTextCls}>{testTypeLabel(s.testType)}</td>
                    <td className={`${tdCls} font-bold text-red-600`}>{s.bugsFound}</td>
                    <td className={`${tdCls} font-bold text-emerald-600`}>{s.bugsPassed}</td>
                    <td className={`${tdCls} font-bold text-gray-500`}>{s.bugsRejected}</td>
                    <td className={`${tdCls} font-bold text-blue-600`}>{s.bugsReviewing}</td>
                    <td className={`${tdCls} font-bold text-amber-600`}>{s.bugsBillable}</td>
                    <td className={`${tdTextCls} whitespace-nowrap`}>{s.confirmedByName || empName(employees, s.confirmedById)}</td>
                    <td className={`${tdTextCls} whitespace-nowrap`}>{s.confirmedAt || "—"}</td>
                    <td className={tdTextCls}>
                      <span className="inline-flex px-2 py-0.5 rounded-lg bg-gray-100 text-[10px] font-bold text-gray-600">
                        {handlingStatusLabel(s.handlingStatus)}
                      </span>
                    </td>
                    <td className={tdTextCls}>
                      <div className="flex gap-0.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => openEdit(s)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                          <Edit2 size={13} />
                        </button>
                        <button type="button" onClick={() => setDeleteId(s.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ProjectTabSection>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editTarget ? "Chỉnh sửa phiên test" : "Thêm phiên test"}
        icon={Bug}
        width="xl"
        footer={
          <>
            <ModalCancelButton onClick={() => setShowForm(false)} />
            <ModalSubmitButton onClick={handleSave} disabled={!form.version.trim() || !form.testDate}
              label={editTarget ? "Lưu thay đổi" : "Thêm phiên test"} />
          </>
        }
      >
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Phiên bản *</label>
              <input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
                placeholder="VD: v2.0.0-rc1" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Ngày test *</label>
              <DateInput value={form.testDate} onChange={v => setForm(f => ({ ...f, testDate: v }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Người test</label>
              <CustomCombobox value={form.testerId} onChange={v => setForm(f => ({ ...f, testerId: v }))}
                placeholder="Chọn nhân viên..."
                options={employees.map(e => ({ value: e.id, label: e.name, desc: e.department }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Loại test</label>
              <CustomSelect value={form.testType} onChange={v => setForm(f => ({ ...f, testType: v }))}
                options={TEST_TYPE_OPTIONS} />
            </div>
            {[
              { key: "bugsFound" as const, label: "Bug phát hiện" },
              { key: "bugsPassed" as const, label: "Bug thông qua" },
              { key: "bugsRejected" as const, label: "Bug bị từ chối" },
              { key: "bugsReviewing" as const, label: "Bug kiểm tra" },
              { key: "bugsBillable" as const, label: "Bug tính tiền" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">{label}</label>
                <input type="number" min={0} value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20" />
              </div>
            ))}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Người xác nhận</label>
              <CustomCombobox value={form.confirmedById} onChange={v => setForm(f => ({ ...f, confirmedById: v }))}
                placeholder="Chọn người xác nhận..."
                options={employees.map(e => ({ value: e.id, label: e.name, desc: e.position }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Ngày xác nhận</label>
              <DateInput value={form.confirmedAt} onChange={v => setForm(f => ({ ...f, confirmedAt: v }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Tình trạng xử lý bug</label>
              <CustomSelect value={form.handlingStatus} onChange={v => setForm(f => ({ ...f, handlingStatus: v }))}
                options={BUG_HANDLING_STATUS_OPTIONS} />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) onDelete(deleteId); setDeleteId(null) }}
        title="Xóa phiên test?"
        message="Bạn có chắc muốn xóa phiên test này?"
        confirmText="Xóa"
        type="danger"
      />
    </ProjectDetailTabShell>
  )
}
