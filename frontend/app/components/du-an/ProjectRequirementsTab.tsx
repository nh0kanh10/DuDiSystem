import React from "react"
import { FileText, ExternalLink, Paperclip } from "lucide-react"
import { RequirementForm, ProjectAttachment } from "../../types"

export function ProjectRequirementsTab({ requirementForm }: { requirementForm?: RequirementForm }) {
  if (!requirementForm) {
    return (
      <div className="text-center py-12">
        <FileText size={32} className="mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-500">Chưa có form yêu cầu cho dự án này</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800">{requirementForm.title}</h3>
          <p className="text-xs text-gray-400 mt-1">Mã form: {requirementForm.code} • Tạo vào {new Date(requirementForm.createdAt).toLocaleDateString("vi-VN")}</p>
        </div>
        {requirementForm.isLocked ? (
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">Đã khóa • Chỉ đọc</span>
        ) : (
          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold">Đang soạn thảo</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Loại dự án</p>
            <p className="text-sm text-gray-800">{requirementForm.projectType || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Màu sắc chủ đạo</p>
            <p className="text-sm text-gray-800">{requirementForm.colorScheme || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Các tính năng chính</p>
            {requirementForm.features && requirementForm.features.length > 0 ? (
              <ul className="space-y-1">
                {requirementForm.features.map((f, i) => <li key={i} className="text-sm text-gray-700 flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#C62828] mt-1.5 shrink-0" /> {f}</li>)}
              </ul>
            ) : <p className="text-sm text-gray-400">—</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tham khảo</p>
            {requirementForm.references && requirementForm.references.length > 0 ? (
              <ul className="space-y-2">
                {requirementForm.references.map((url, i) => (
                  <li key={i} className="text-sm">
                    <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                      <ExternalLink size={12} /> {url.length > 50 ? url.slice(0, 50) + "..." : url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-gray-400">—</p>}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ghi chú thêm</p>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-700">{requirementForm.additionalNotes || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {requirementForm.attachments && requirementForm.attachments.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tệp đính kèm</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {requirementForm.attachments.map(att => (
              <div key={att.id} className="flex items-center gap-2 p-3 bg-white border border-gray-100 rounded-xl">
                <Paperclip size={16} className="text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800 truncate">{att.name}</p>
                  <p className="text-[10px] text-gray-400">{new Date(att.uploadedAt).toLocaleDateString("vi-VN")}</p>
                </div>
                {att.url && <a href={att.url} target="_blank" rel="noreferrer" className="text-[#C62828] hover:underline text-xs font-bold">Mở</a>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
