import React, { createContext, useContext, useState, ReactNode } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { overlayLayer } from "../utils/overlayLayers"

type ToastType = "success" | "error"

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (message: string, type: ToastType = "success") => {
    if (timer) clearTimeout(timer)
    setToast({ message, type })
    const t = setTimeout(() => setToast(null), 3000)
    setTimer(t)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && typeof document !== "undefined" && createPortal(
        <div
          className={`fixed bottom-6 right-6 ${overlayLayer("toast")} flex items-center gap-3 px-6 py-3 rounded-xl shadow-lg border transition-all duration-300 ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={20} className="text-emerald-600" />
          ) : (
            <AlertCircle size={20} className="text-red-600" />
          )}
          <span className="font-semibold">{toast.message}</span>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
