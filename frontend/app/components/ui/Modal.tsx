import React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { overlayLayer } from "../../utils/overlayLayers"

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
  /** Override z-index class khi cần nested modal (mặc định: z-[10000]) */
  zIndexClass?: string
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

export function Modal({ open, onClose, title, icon: Icon, width = "xl", children, footer, bodyClassName = "", noFooter = false, zIndexClass }: ModalProps) {
  if (!open) return null
  const zClass = zIndexClass ?? overlayLayer("modal")
  return createPortal(
    <div
      className={`fixed inset-0 ${zClass} flex items-center justify-center p-4`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className={`relative bg-white dark:bg-white/[0.07] dark:backdrop-blur-[36px] dark:border dark:border-white/10 dark:shadow-[0_32px_80px_rgba(0,0,0,0.7)] rounded-3xl shadow-2xl w-full ${WIDTH[width]} flex flex-col max-h-[90vh]`}
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
      className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
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
