import { X, AlertTriangle } from "lucide-react"

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  nodeName: string
  childCount: number
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  nodeName,
  childCount
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 p-6 relative">
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
            Xác nhận xóa đơn vị
          </h3>

          <p className="text-sm text-gray-600 px-2 leading-relaxed">
            Bạn có chắc chắn muốn xóa đơn vị <span className="font-bold text-gray-800">{nodeName}</span> khỏi hệ thống?
          </p>

          {childCount > 0 && (
            <div className="mt-4 p-4 bg-red-50/50 rounded-2xl border border-red-100/60 text-left w-full">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <AlertTriangle size={13} /> Cảnh báo quan trọng
              </p>
              <p className="text-xs text-red-600 leading-relaxed">
                Đơn vị này hiện có <span className="font-bold text-red-700">{childCount}</span> đơn vị trực thuộc bên dưới. Xác nhận xóa sẽ xóa đệ quy toàn bộ các đơn vị này và không thể khôi phục lại.
              </p>
            </div>
          )}

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
                onConfirm()
                onClose()
              }}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm shadow-red-600/10"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
