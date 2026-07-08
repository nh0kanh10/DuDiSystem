import React, { useEffect, useState } from "react"
import { UploadCloud, FileText, Trash2, Download, Loader2 } from "lucide-react"
import { api, type LeadDocumentRecord } from "../../../lib/api"
import { Lead } from "../../types"
import { Button } from "../ui/button"

export function LeadSolutionTab({ leadId }: { leadId: string }) {
  const [solutions, setSolutions] = useState<LeadDocumentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.leadDocuments.list(leadId, "solution" as any)
      .then(res => {
        if (!cancelled) setSolutions(res)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [leadId, refresh])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().match(/\.(pdf|doc|docx|ppt|pptx|png|jpe?g)$/)) {
      setError("Hỗ trợ PDF, Word, PowerPoint, ảnh (.pdf, .doc, .docx, .ppt, .pptx, .png, .jpg)")
      return
    }

    setUploading(true)
    setError("")
    try {
      await api.leadDocuments.uploadFile(leadId, "solution", file)
      setRefresh(k => k + 1)
    } catch (err: any) {
      setError(err.message || "Tải lên thất bại")
    } finally {
      setUploading(false)
      e.target.value = "" 
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa giải pháp này?")) return
    try {
      await api.leadDocuments.delete(leadId, docId)
      setRefresh(k => k + 1)
    } catch (err: any) {
      alert(err.message || "Xóa thất bại")
    }
  }

  const handleDownload = (doc: LeadDocumentRecord) => {
    api.leadDocuments.downloadFile(leadId, doc.id, doc.downloadName || `${doc.label}.docx`)
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <h5 className="text-[11px] font-black text-blue-600 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
          <UploadCloud size={14} />
          Tải lên Giải pháp
        </h5>
        
        <div className="flex flex-col gap-3">
          <label className={`
            flex flex-col items-center justify-center w-full h-24
            border-2 border-dashed rounded-xl cursor-pointer
            transition-colors
            ${uploading ? "bg-gray-100 border-gray-300 pointer-events-none" : "bg-white border-blue-200 hover:border-blue-400 hover:bg-blue-50"}
          `}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-blue-500">
              {uploading ? <Loader2 className="animate-spin mb-2" size={24} /> : <UploadCloud size={24} className="mb-2" />}
              <p className="mb-1 text-sm font-semibold">
                {uploading ? "Đang tải lên..." : "Click để chọn file Giải pháp"}
              </p>
              <p className="text-xs text-blue-400 font-medium">PDF, Word, PowerPoint, ảnh</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
          
          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : solutions.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-sm font-medium">Chưa có file giải pháp nào</p>
          </div>
        ) : (
          solutions.map(doc => (
            <div key={doc.id} className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{doc.label || doc.downloadName}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] font-semibold text-gray-400">
                  <span>V{doc.version}</span>
                  <span>•</span>
                  <span>{doc.createdByName || "Ẩn danh"}</span>
                  <span>•</span>
                  <span>{new Date(doc.createdAt).toLocaleString("vi-VN")}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Tải xuống"
                >
                  <Download size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Xóa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
