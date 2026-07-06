import React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  icon?: React.ElementType
  width?: "sm" | "md" | "lg" | "xl" | "3xl" | "5xl" | "6xl"
  children: React.ReactNode
  footer?: React.ReactNode
  bodyClassName?: string
  noFooter?: boolean
}

const WIDTH = {
  sm:  "max-w-sm",
  md:  "max-w-md",
  lg:  "max-w-lg",
  xl:  "max-w-2xl",
  "3xl": "max-w-3xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
}

export function Modal({ open, onClose, title, icon: Icon, width = "xl", children, footer, bodyClassName = "", noFooter = false }: ModalProps) {
  if (!open) return null
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className={`relative bg-white rounded-3xl shadow-2xl w-full ${WIDTH[width]} flex flex-col max-h-[90vh]`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#C62828] to-[#B71C1C] rounded-t-3xl flex-shrink-0">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon size={16} className="text-white" />
              </div>
            )}
            <h3 className="text-sm font-black text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-xl transition-colors text-white/80 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className={`overflow-y-auto flex-1 min-h-0 ${bodyClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && !noFooter && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export function ModalCancelButton({ onClick, label = "Hủy" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
    >
      {label}
    </button>
  )
}

export function ModalSubmitButton({
  onClick, loading, label, loadingLabel = "Đang lưu...", disabled,
}: {
  onClick: () => void
  loading?: boolean
  label: string
  loadingLabel?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="px-6 py-2.5 bg-[#C62828] hover:bg-[#B71C1C] disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-colors"
    >
      {loading ? loadingLabel : label}
    </button>
  )
}
