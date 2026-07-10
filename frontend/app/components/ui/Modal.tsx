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
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-4xl",
  "3xl": "max-w-3xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
}

export function Modal({ open, onClose, title, icon: Icon, width = "xl", children, footer, bodyClassName = "", noFooter = false }: ModalProps) {
  if (!open) return null
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className={`relative bg-white dark:bg-white/[0.02] dark:backdrop-blur-[46px] dark:border dark:border-white/10 rounded-3xl shadow-2xl dark:shadow-[0_32px_80px_rgba(0,0,0,0.7),inset_0_0_0_1px_rgba(255,255,255,0.03)] w-full ${WIDTH[width]} flex flex-col max-h-[90vh]`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 rounded-t-3xl flex-shrink-0">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center">
                <Icon size={16} className="text-[#E8231A] dark:text-[#EF4444]" />
              </div>
            )}
            <h3 className="text-[15px] font-bold text-gray-800 dark:text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={`overflow-y-auto flex-1 min-h-0 ${bodyClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && !noFooter && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/10 flex-shrink-0">
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
      className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
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
      className="px-6 py-2.5 bg-[#E8231A] dark:bg-[#EF4444] hover:bg-[#D31F16] dark:hover:bg-[#EF4444]/80 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-[0_4px_12px_rgba(232,35,26,0.25)] dark:hover:shadow-[0_4px_12px_rgba(239,68,68,0.4)]"
    >
      {loading ? loadingLabel : label}
    </button>
  )
}
