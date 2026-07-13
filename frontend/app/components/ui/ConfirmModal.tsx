import React from "react"
import { createPortal } from "react-dom"
import { X, AlertTriangle, HelpCircle, Info } from "lucide-react"
import { overlayLayer } from "../../utils/overlayLayers"

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: "danger" | "warning" | "info"
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type = "info"
}: ConfirmModalProps) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <AlertTriangle size={32} className="text-red-500" />
      case "warning":
        return <AlertTriangle size={32} className="text-amber-500" />
      case "info":
      default:
        return <HelpCircle size={32} className="text-[#C62828]" />
    }
  }

  const getIconBg = () => {
    switch (type) {
      case "danger":
        return "bg-red-50"
      case "warning":
        return "bg-amber-50"
      case "info":
      default:
        return "bg-red-50/50"
    }
  }

  const getConfirmButtonClass = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/10"
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-600/10"
      case "info":
      default:
        return "bg-[#C62828] hover:bg-[#B71C1C] text-white shadow-sm shadow-red-600/10"
    }
  }

  return createPortal(
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm ${overlayLayer("confirm")} flex items-center justify-center p-4 animate-in fade-in duration-200`}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 p-6 relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center mt-4">
          <div className={`w-16 h-16 ${getIconBg()} rounded-2xl flex items-center justify-center mb-4`}>
            {getIcon()}
          </div>

          <h3 className={`font-bold text-lg mb-2 ${type === "danger" ? "text-red-600" : "text-gray-800"}`}>
            {title}
          </h3>

          <p className="text-sm text-gray-600 px-2 leading-relaxed whitespace-pre-line text-left max-h-48 overflow-y-auto w-full">
            {message}
          </p>

          <div className="flex gap-3 mt-6 w-full">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors text-gray-600"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${getConfirmButtonClass()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
