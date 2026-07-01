import { createPortal } from "react-dom"
import { Fingerprint, X } from "lucide-react"
import UserPortalApp from "./UserApp"
import { getStaffPortalModules } from "../../utils/staffModules"

export function StaffPortalFab({
  open,
  onOpen,
  onClose,
  permissions,
  onLogout,
}: {
  open: boolean
  onOpen: () => void
  onClose: () => void
  permissions: string[]
  onLogout: () => void
}) {
  const modules = getStaffPortalModules(permissions)

  return createPortal(
    <>
      <button
        type="button"
        onClick={onOpen}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30 bg-gradient-to-br from-[#C62828] to-[#E64A19] hover:scale-105 active:scale-95 transition-transform"
        title="Cổng nhân viên"
      >
        <Fingerprint size={26} strokeWidth={1.75} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
          <div className="absolute inset-3 md:inset-6 lg:inset-10 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-[210] w-10 h-10 rounded-full bg-black/40 border border-white/10 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <X size={18} />
            </button>
            <UserPortalApp onLogout={onLogout} modules={modules} embed />
          </div>
        </div>
      )}
    </>,
    document.body,
  )
}
